import SwiftUI
import WebKit
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

private struct PartySurfaces: UIViewRepresentable {
    @ObservedObject var store: PartyWebStore
    @ObservedObject var model: ServerModel
    func makeUIView(context: Context) -> UIView {
        let root = UIView(); root.backgroundColor = .black
        for view in [store.menu, store.controller] {
            view.translatesAutoresizingMaskIntoConstraints = false
            root.addSubview(view)
            NSLayoutConstraint.activate([
                view.leadingAnchor.constraint(equalTo: root.leadingAnchor),
                view.trailingAnchor.constraint(equalTo: root.trailingAnchor),
                view.topAnchor.constraint(equalTo: root.topAnchor),
                view.bottomAnchor.constraint(equalTo: root.bottomAnchor)
            ])
        }
        return root
    }
    func updateUIView(_ view: UIView, context: Context) {
        store.update(model)
        store.menu.isHidden = store.showingController
        store.controller.isHidden = !store.showingController
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
        menu.load(URLRequest(url: shellURL))
    }
    func update(_ model: ServerModel) {
        self.model = model
        if showingController, model.ready, controllerURL != model.controllerURL {
            controllerURL = model.controllerURL; controller.load(URLRequest(url: model.controllerURL))
        }
        publish()
    }
    func setPhase(_ value: ScenePhase) {
        phase = value
        signalController(showingController && value == .active)
        if value != .active { cancelHaptics() }
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
        else { menuReady = false; lastPayload = ""; menu.load(URLRequest(url: shellURL)) }
    }
    private func publish() {
        guard menuReady, let model else { return }
        var value: [String: Any] = ["catalog": [], "players": [], "leaderboard": [], "votes": []]
        if let state = model.state, let data = try? JSONEncoder().encode(state), let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] { value = object }
        else if let data = try? JSONEncoder().encode(model.catalog), let games = try? JSONSerialization.jsonObject(with: data) { value["catalog"] = games }
        if qrAddress != model.address { qrAddress = model.address; qrData = makeQR(qrAddress) }
        value["native"] = ["ready": model.ready, "working": model.working, "address": model.address,
                           "externalDisplays": model.externalDisplayCount, "qr": qrData,
                           "message": model.message ?? "", "connectionStatus": model.connectionStatus ?? "",
                           "backgroundStatus": model.backgroundStatus, "buildLabel": model.buildLabel,
                           "keepAwake": model.keepAwake, "haptics": hapticsEnabled]
        guard let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]), let payload = String(data: data, encoding: .utf8), payload != lastPayload else { return }
        lastPayload = payload
        // Pass JSON as an argument, never concatenate player names into executable JS.
        menu.callAsyncJavaScript("window.LocalPartyHost?.update(JSON.parse(payload))", arguments: ["payload": payload], in: nil, contentWorld: .page) { [weak self] result in
            if case .failure = result { self?.lastPayload = "" }
        }
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
        guard phase == .active, let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        let shell = message.webView === menu && message.frameInfo.isMainFrame && message.frameInfo.request.url == shellURL
        let player = message.webView === controller && showingController && trustedController(message.frameInfo.securityOrigin)
        guard shell || player else { return }
        if type == "haptic" { playHaptics(body["pattern"]); return }
        if type == "menu", player, message.frameInfo.isMainFrame { showController(false); return }
        guard shell else { return } // game JavaScript can NEVER issue admin commands
        if type == "ready" { menuReady = true; lastPayload = ""; publish(); return }
        guard let model else { return }
        switch type {
        case "controller": showController(true)
        case "manage":
            let allowed: Set<String> = ["select", "settings", "launch", "stop", "pause", "game-action", "retry-start", "kick", "statistics-reset", "dismiss-incident"]
            if model.ready, !model.working, let command = body["command"] as? [String: Any], let kind = command["type"] as? String, allowed.contains(kind) { model.command(command) }
        case "network-set": if let enabled = body["enabled"] as? Bool { model.setNetworkEnabled(enabled) }
        case "awake-set": if let enabled = body["enabled"] as? Bool { model.keepAwake = enabled }
        case "haptics-set": if let enabled = body["enabled"] as? Bool { UserDefaults.standard.set(!enabled, forKey: "LocalParty.hapticsDisabled"); if !enabled { cancelHaptics() } }
        case "screen-refresh": model.externalDisplayReload += 1
        case "background-request": model.requestBackground()
        case "copy-invite": if !model.address.isEmpty { UIPasteboard.general.string = model.address; toast("Адрес скопирован") }
        case "share-invite": if !model.address.isEmpty { share(model.address) }
        case "share-diagnostics": share(model.diagnosticsURL)
        default: break
        }
        publish()
    }
    private func toast(_ text: String) {
        menu.callAsyncJavaScript("window.LocalPartyHost?.toast(text)", arguments: ["text": text], in: nil, contentWorld: .page, completionHandler: nil)
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
        if webView === menu { lastPayload = ""; publish() }
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
        if webView === menu { menuReady = false; lastPayload = ""; menu.load(URLRequest(url: shellURL)) }
        else if let url = controllerURL { controller.load(URLRequest(url: url)) }
    }
}
