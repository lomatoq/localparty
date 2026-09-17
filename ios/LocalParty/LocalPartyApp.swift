import SwiftUI
import WebKit
import Combine
import CoreImage.CIFilterBuiltins

@main struct LocalPartyApp: App {
    @UIApplicationDelegateAdaptor(PartyAppDelegate.self) private var appDelegate
    @StateObject private var model = ServerModel.shared
    var body: some Scene { WindowGroup { HostView(model: model).preferredColorScheme(.dark) } }
}

// Host menu uses the SAME bundled CSS, artwork and controls as the web launcher.
// The game controller and external TV retain their existing server and sessions.
struct HostView: View {
    @ObservedObject var model: ServerModel
    @StateObject private var store = PartyWebStore()
    @Environment(\.scenePhase) private var phase
    var body: some View {
        PartySurfaces(store: store, model: model)
            .ignoresSafeArea(.container, edges: [.top, .bottom])
            .overlay {
                if let error = store.loadError {
                    ContentUnavailableView {
                        Label("Не удалось открыть экран", systemImage: "wifi.exclamationmark")
                    } description: { Text(error) } actions: {
                        Button("Повторить") { store.retry() }
                        if store.showingController { Button("В меню") { store.showController(false) } }
                    }.background(Color.black)
                }
            }
            .onAppear { store.update(model); store.setPhase(phase); model.sceneChanged(phase) }
            .onChange(of: phase) { _, value in store.setPhase(value); model.sceneChanged(value) }
    }
}

// Keep one visible UIKit owner for the entire phone UI. On iOS 27 the
// external-display scene is opt-in through a scene accessory registration.
private struct PartySurfaces: UIViewControllerRepresentable {
    @ObservedObject var store: PartyWebStore
    @ObservedObject var model: ServerModel
    func makeUIViewController(context: Context) -> PartySurfaceController {
        let controller = PartySurfaceController(store: store)
        store.surfaceController = controller
        return controller
    }
    func updateUIViewController(_ controller: PartySurfaceController, context: Context) {
        store.update(model)
        store.menu.isHidden = store.showingController
        store.controller.isHidden = !store.showingController
    }
}

@MainActor private final class PartySurfaceController: UIViewController {
    private let store: PartyWebStore
    // Erase the type so an iOS 26 SDK can still compile the legacy path.
    // The hotfix build script requires SDK 27 for current-device builds.
    private var externalRegistration: AnyObject?
    init(store: PartyWebStore) { self.store = store; super.init(nibName: nil, bundle: nil) }
    required init?(coder: NSCoder) { fatalError("Use init(store:)") }
    override func loadView() {
        let root = UIView(); root.backgroundColor = .black
        for web in [store.menu, store.controller] {
            web.translatesAutoresizingMaskIntoConstraints = false
            root.addSubview(web)
            NSLayoutConstraint.activate([
                web.leadingAnchor.constraint(equalTo: root.leadingAnchor),
                web.trailingAnchor.constraint(equalTo: root.trailingAnchor),
                web.topAnchor.constraint(equalTo: root.topAnchor),
                web.bottomAnchor.constraint(equalTo: root.bottomAnchor)
            ])
        }
        view = root
    }
    override func viewDidLoad() {
        super.viewDidLoad()
        ensureDisplayRegistration()
    }
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        ensureDisplayRegistration()
        store.refreshSnapshot()
    }
    func ensureDisplayRegistration() {
        #if compiler(>=6.4)
        if #available(iOS 27.0, *), externalRegistration == nil {
            let configuration = UISceneConfiguration(name: "Party TV", sessionRole: .windowExternalDisplayNonInteractive)
            configuration.sceneClass = UIWindowScene.self
            configuration.delegateClass = PartyExternalDisplaySceneDelegate.self
            let accessory = UISceneAccessory.externalNonInteractive(sceneConfiguration: configuration)
            let registration = registerSceneAccessory(accessory)
            registration.isEnabled = true
            externalRegistration = registration // must live as long as the phone surface
        }
        #endif
    }
    var displayMode: String {
        if #available(iOS 27.0, *) {
            #if compiler(>=6.4)
            return externalRegistration == nil ? "registering" : "scene-accessory"
            #else
            return "requires-ios27-sdk"
            #endif
        }
        return "legacy-scene"
    }
    var displayAvailable: Bool {
        #if compiler(>=6.4)
        if #available(iOS 27.0, *), let registration = externalRegistration as? UISceneAccessoryRegistration {
            return registration.isAvailable
        }
        #endif
        return false
    }
}

// Serves only shipped public assets. Never exposes Application Support, keys,
// server source or arbitrary filesystem paths to JavaScript.
private final class PartyBundleScheme: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        do {
            guard let url = task.request.url, url.scheme == "partyapp", url.host == "local",
                  task.request.httpMethod == "GET",
                  let root = Bundle.main.url(forResource: "public", withExtension: nil, subdirectory: "Server") else { throw URLError(.noPermissionsToReadFile) }
            let name = url.path == "/" ? "native-shell/index.html" : String(url.path.dropFirst())
            guard !name.split(separator: "/").contains(".."), !name.contains("\\"), !name.contains("%") else { throw URLError(.noPermissionsToReadFile) }
            let base = root.resolvingSymlinksInPath().standardizedFileURL
            let file = base.appendingPathComponent(name).resolvingSymlinksInPath().standardizedFileURL
            let mime = ["html":"text/html", "css":"text/css", "js":"text/javascript", "png":"image/png", "webp":"image/webp", "jpg":"image/jpeg", "jpeg":"image/jpeg", "svg":"image/svg+xml", "ttf":"font/ttf", "woff2":"font/woff2", "ico":"image/x-icon"]
            guard file.path.hasPrefix(base.path + "/"), let type = mime[file.pathExtension.lowercased()],
                  file.pathExtension != "html" || name == "native-shell/index.html" else { throw URLError(.noPermissionsToReadFile) }
            let data = try Data(contentsOf: file)
            task.didReceive(URLResponse(url: url, mimeType: type, expectedContentLength: data.count, textEncodingName: type.hasPrefix("text/") ? "utf-8" : nil))
            task.didReceive(data); task.didFinish()
        } catch { task.didFailWithError(error) }
    }
    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) { }
}

@MainActor private final class PartyScriptHandler: NSObject, WKScriptMessageHandler {
    weak var target: PartyWebStore?
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) { target?.receive(message) }
}

@MainActor private final class PartyWebStore: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate {
    let menu: WKWebView
    let controller: WKWebView
    @Published private(set) var showingController = false
    @Published private(set) var loadError: String?
    private weak var model: ServerModel?
    weak var surfaceController: PartySurfaceController?
    private var modelSubscription: AnyCancellable?
    private var menuStarted = false
    private var deliveryEpoch = 0
    private var payloadInFlight = false, publishAgain = false
    private var payloadRetry: DispatchWorkItem?
    private var deliveryFailures = 0
    private let shellRevision = "ios-recovery-20260918.1"
    private var lastGoodCatalog: [PartyGame] = []
    private var catalogError = ""
    private let handler = PartyScriptHandler()
    private let shellURL = URL(string: "partyapp://local/native-shell/index.html")!
    private var controllerURL: URL?
    private var menuReady = false
    private var phase: ScenePhase = .active
    private var lastPayload = "", qrAddress = "", qrData = ""
    private var hapticTasks: [DispatchWorkItem] = []
    private var lastHapticTime: TimeInterval = 0
    private var hapticGeneration = 0
    private var hapticsEnabled: Bool { !UserDefaults.standard.bool(forKey: "LocalParty.hapticsDisabled") }

    override init() {
        let menuConfig = WKWebViewConfiguration()
        menuConfig.setURLSchemeHandler(PartyBundleScheme(), forURLScheme: "partyapp")
        menu = WKWebView(frame: .zero, configuration: menuConfig)
        let controllerConfig = WKWebViewConfiguration()
        controllerConfig.allowsInlineMediaPlayback = true
        controllerConfig.mediaTypesRequiringUserActionForPlayback = []
        if let file = Bundle.main.url(forResource: "controller-bridge", withExtension: "js", subdirectory: "Server/public/native-shell"), let source = try? String(contentsOf: file, encoding: .utf8) {
            controllerConfig.userContentController.addUserScript(WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false))
        }
        controller = WKWebView(frame: .zero, configuration: controllerConfig)
        super.init()
        handler.target = self
        for view in [menu, controller] {
            view.configuration.userContentController.add(handler, name: "partyShell")
            view.navigationDelegate = self; view.uiDelegate = self
            view.isOpaque = false; view.backgroundColor = .black
            view.scrollView.contentInsetAdjustmentBehavior = .never
            view.allowsBackForwardNavigationGestures = false
        }
        // Do not begin the JS handshake until the model has been attached.
    }
    func update(_ model: ServerModel) {
        if self.model !== model {
            self.model = model
            modelSubscription = model.objectWillChange.sink { [weak self] _ in
                // objectWillChange precedes mutation. Publish on the next main turn,
                // independently of SwiftUI's UIViewControllerRepresentable redraws.
                DispatchQueue.main.async { [weak self] in self?.publish() }
            }
            loadBundledCatalog()
        }
        if !menuStarted { menuStarted = true; reloadMenu() }
        if showingController, model.ready, controllerURL != model.controllerURL {
            controllerURL = model.controllerURL; controller.load(URLRequest(url: model.controllerURL))
        }
        publish()
    }
    func setPhase(_ value: ScenePhase) {
        phase = value
        signalController(showingController && value == .active)
        if value != .active { cancelHaptics() }
        if value == .active {
            surfaceController?.ensureDisplayRegistration()
            refreshSnapshot()
        }
    }
    func showController(_ value: Bool) {
        guard !value || model?.ready == true else { return }
        loadError = nil
        showingController = value
        if value, let model, controllerURL != model.controllerURL {
            controllerURL = model.controllerURL; controller.load(URLRequest(url: model.controllerURL))
        }
        signalController(value && phase == .active)
        cancelHaptics()
    }
    private func signalController(_ visible: Bool) {
        let name = visible ? "party-native-resume" : "party-native-hide"
        // Release held input in the launcher AND every same-origin game frame.
        controller.evaluateJavaScript("(function visit(w){try{w.dispatchEvent(new w.Event('\(name)'));for(let i=0;i<w.frames.length;i++)visit(w.frames[i]);}catch(e){}})(window)", completionHandler: nil)
    }
    func retry() {
        loadError = nil
        if showingController, let url = controllerURL { controller.load(URLRequest(url: url)) }
        else { reloadMenu() }
    }
    func refreshSnapshot() {
        deliveryFailures = 0
        lastPayload = ""
        publish()
    }
    private func resetDelivery() {
        deliveryEpoch += 1
        menuReady = false; payloadInFlight = false; publishAgain = false
        lastPayload = ""; deliveryFailures = 0
        payloadRetry?.cancel(); payloadRetry = nil
    }
    private func reloadMenu() {
        resetDelivery()
        menu.load(URLRequest(url: shellURL))
    }
    private func loadBundledCatalog() {
        do {
            guard let url = Bundle.main.url(forResource: "native-catalog", withExtension: "json", subdirectory: "Server") else {
                throw NSError(domain: "LocalParty", code: 1, userInfo: [NSLocalizedDescriptionKey: "В сборке отсутствует Server/native-catalog.json."])
            }
            let games = try JSONDecoder().decode([PartyGame].self, from: Data(contentsOf: url))
            guard !games.isEmpty, Set(games.map(\.id)).count == games.count else {
                throw NSError(domain: "LocalParty", code: 2, userInfo: [NSLocalizedDescriptionKey: "Встроенный каталог пуст или содержит повторяющиеся игры."])
            }
            lastGoodCatalog = games; catalogError = ""
        } catch {
            catalogError = "Не удалось прочитать встроенный каталог: " + error.localizedDescription
        }
    }
    private func publish() {
        guard menuReady, deliveryFailures <= 5, let model else { return }
        guard !payloadInFlight else { publishAgain = true; return }
        var value: [String: Any] = ["catalog": [], "players": [], "leaderboard": [], "votes": []]
        if let state = model.state, let data = try? JSONEncoder().encode(state), let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] { value = object }
        let liveGames = model.state?.catalog ?? []
        if !liveGames.isEmpty { lastGoodCatalog = liveGames }
        else if !model.catalog.isEmpty { lastGoodCatalog = model.catalog }
        if let data = try? JSONEncoder().encode(lastGoodCatalog), let games = try? JSONSerialization.jsonObject(with: data) { value["catalog"] = games }
        let validCatalog = !liveGames.isEmpty
        let issue = model.ready && !validCatalog ? "Сервер не вернул каталог. Игры из приложения сохранены; запуск временно недоступен." : (lastGoodCatalog.isEmpty ? catalogError : "")
        if qrAddress != model.address { qrAddress = model.address; qrData = makeQR(qrAddress) }
        value["native"] = ["ready": model.ready, "working": model.working, "address": model.address,
                           "externalDisplays": model.externalDisplayCount, "qr": qrData,
                           "message": model.message ?? "", "connectionStatus": model.connectionStatus ?? "",
                           "backgroundStatus": model.backgroundStatus, "buildLabel": model.buildLabel,
                           "keepAwake": model.keepAwake, "haptics": hapticsEnabled,
                           "catalogReady": validCatalog, "catalogError": issue,
                           "bridgeRevision": shellRevision,
                           "displayMode": surfaceController?.displayMode ?? "registering",
                           "displayAvailable": surfaceController?.displayAvailable ?? false]
        guard let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]), let payload = String(data: data, encoding: .utf8), payload != lastPayload else { return }
        payloadInFlight = true
        let epoch = deliveryEpoch
        // Only acknowledge delivery AFTER JavaScript explicitly accepts the snapshot.
        // Optional chaining returning undefined is not successful delivery.
        let script = "if (!window.LocalPartyHost) return false; return window.LocalPartyHost.update(JSON.parse(payload)) === true;"
        menu.callAsyncJavaScript(script, arguments: ["payload": payload], in: nil, in: .page) { [weak self] result in
            guard let self, self.deliveryEpoch == epoch else { return }
            self.payloadInFlight = false
            if case .success(let accepted) = result, accepted as? Bool == true {
                self.lastPayload = payload; self.deliveryFailures = 0
                self.payloadRetry?.cancel(); self.payloadRetry = nil
                if !self.showingController { self.loadError = nil }
            } else {
                self.lastPayload = ""; self.schedulePayloadRetry()
            }
            if self.publishAgain { self.publishAgain = false; self.publish() }
        }
    }
    private func schedulePayloadRetry() {
        deliveryFailures += 1
        guard deliveryFailures <= 5 else {
            if phase == .active && !showingController && loadError == nil { loadError = "Меню не приняло каталог. Нажми «Повторить» — профили и статистика не удаляются." }
            return
        }
        payloadRetry?.cancel()
        let epoch = deliveryEpoch
        let retry = DispatchWorkItem { [weak self] in
            guard let self, self.deliveryEpoch == epoch else { return }
            self.payloadRetry = nil; self.publish()
        }
        payloadRetry = retry
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6, execute: retry)
    }
    private func makeQR(_ text: String) -> String {
        guard !text.isEmpty else { return "" }
        let filter = CIFilter.qrCodeGenerator(); filter.message = Data(text.utf8)
        guard let output = filter.outputImage?.transformed(by: CGAffineTransform(scaleX: 6, y: 6)), let image = CIContext().createCGImage(output, from: output.extent), let png = UIImage(cgImage: image).pngData() else { return "" }
        return "data:image/png;base64," + png.base64EncodedString()
    }
    private func trustedController(_ origin: WKSecurityOrigin) -> Bool {
        guard let url = model?.controllerURL else { return false }
        return origin.protocol == url.scheme && origin.host == url.host && origin.port == url.port
    }
    func receive(_ message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        let shell = message.webView === menu && message.frameInfo.isMainFrame && message.frameInfo.request.url == shellURL
        let player = message.webView === controller && showingController && trustedController(message.frameInfo.securityOrigin)
        guard shell || player else { return }
        // Readiness is passive transport, not an action. Control Centre, startup
        // and AirPlay can leave the phone inactive when this message arrives.
        if shell && (type == "ready" || type == "resync") {
            menuReady = true; refreshSnapshot(); return
        }
        guard phase == .active else { return } // all actions still require foreground
        if type == "haptic" { playHaptics(body["pattern"]); return }
        if type == "menu", player, message.frameInfo.isMainFrame { showController(false); return }
        guard shell else { return } // game JavaScript can NEVER issue admin commands
        guard let model else { return }
        switch type {
        case "controller": showController(true)
        case "manage":
            let allowed: Set<String> = ["select", "settings", "launch", "stop", "pause", "game-action", "retry-start", "kick", "statistics-reset", "dismiss-incident"]
            if model.ready, !model.working, let command = body["command"] as? [String: Any], let kind = command["type"] as? String, allowed.contains(kind) { model.command(command) }
        case "network-set": if let enabled = body["enabled"] as? Bool { model.setNetworkEnabled(enabled) }
        case "awake-set": if let enabled = body["enabled"] as? Bool { model.keepAwake = enabled }
        case "haptics-set": if let enabled = body["enabled"] as? Bool { UserDefaults.standard.set(!enabled, forKey: "LocalParty.hapticsDisabled"); if !enabled { cancelHaptics() } }
        case "screen-refresh": surfaceController?.ensureDisplayRegistration(); model.externalDisplayReload += 1
        case "background-request": model.requestBackground()
        case "copy-invite": if !model.address.isEmpty { UIPasteboard.general.string = model.address; toast("Адрес скопирован") }
        case "share-invite": if !model.address.isEmpty { share(model.address) }
        case "share-diagnostics": share(model.diagnosticsURL)
        default: break
        }
        publish()
    }
    private func toast(_ text: String) {
        menu.callAsyncJavaScript("window.LocalPartyHost?.toast(text)", arguments: ["text": text], in: nil, in: .page, completionHandler: nil)
    }
    private func share(_ item: Any) {
        guard let scene = menu.window?.windowScene, var presenter = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController else { return }
        while let presented = presenter.presentedViewController { presenter = presented }
        let sheet = UIActivityViewController(activityItems: [item], applicationActivities: nil)
        sheet.popoverPresentationController?.sourceView = presenter.view
        sheet.popoverPresentationController?.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 1, height: 1)
        presenter.present(sheet, animated: true)
    }
    private func cancelHaptics() { hapticGeneration += 1; hapticTasks.forEach { $0.cancel() }; hapticTasks.removeAll() }
    private func playHaptics(_ value: Any?) {
        guard let pattern = value as? [Double], pattern.count <= 12, pattern.allSatisfy({ $0.isFinite && $0 >= 0 && $0 <= 500 }) else { return }
        if pattern.isEmpty || pattern.allSatisfy({ $0 == 0 }) { cancelHaptics(); return }
        guard hapticsEnabled, phase == .active else { return }
        let now = ProcessInfo.processInfo.systemUptime
        guard now - lastHapticTime >= 0.035 else { return }
        lastHapticTime = now; cancelHaptics()
        let generation = hapticGeneration
        var offset: Double = 0
        for (index, duration) in pattern.enumerated() {
            guard offset < 1500 else { break }
            if index % 2 == 0 && duration > 0 {
                let task = DispatchWorkItem { [weak self] in
                    guard let self, self.phase == .active, self.hapticsEnabled, self.hapticGeneration == generation else { return }
                    let impact = UIImpactFeedbackGenerator(style: duration > 60 ? .heavy : duration > 20 ? .medium : .soft)
                    impact.prepare(); impact.impactOccurred(intensity: min(1, max(0.35, duration / 80)))
                }
                hapticTasks.append(task); DispatchQueue.main.asyncAfter(deadline: .now() + offset / 1000, execute: task)
            }
            offset += duration
        }
    }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { decisionHandler(.cancel); return }
        if webView === menu { decisionHandler(url == shellURL ? .allow : .cancel); return }
        if url.absoluteString == "about:blank" { decisionHandler(.allow); return }
        let local = model?.controllerURL
        decisionHandler(url.scheme == local?.scheme && url.host == local?.host && url.port == local?.port ? .allow : .cancel)
    }
    func webView(_ webView: WKWebView, requestDeviceOrientationAndMotionPermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(webView === controller && showingController && trustedController(origin) ? .prompt : .deny)
    }
    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(webView === controller && showingController && trustedController(origin) ? .prompt : .deny)
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if webView === menu {
            // Fallback when the first ready message was lost during app startup.
            menuReady = true; deliveryFailures = 0; refreshSnapshot()
        }
        else { signalController(showingController && phase == .active) }
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { reportFailure(webView, error) }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { reportFailure(webView, error) }
    private func reportFailure(_ webView: WKWebView, _ error: Error) {
        guard (error as NSError).code != NSURLErrorCancelled else { return }
        if (webView === controller) == showingController { loadError = error.localizedDescription }
    }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        cancelHaptics()
        if webView === menu { reloadMenu() }
        else if let url = controllerURL { controller.load(URLRequest(url: url)) }
    }
}
