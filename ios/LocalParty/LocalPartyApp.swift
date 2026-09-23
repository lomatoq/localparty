import SwiftUI
import WebKit
import AVFoundation
import CoreMotion
import Combine
import CoreImage.CIFilterBuiltins

// Optional display metadata. Old servers still decode; no player credentials here.
struct PartyTVBoardRow: Codable, Equatable {
    var id: String; var name: String; var rank: Int?; var score: Double; var points: Double?; var won: Bool
}
struct PartyTVBoard: Codable, Equatable {
    var key: String; var kind: String; var title: String; var subtitle: String; var rows: [PartyTVBoardRow]
}
struct PartyTVPresentation: Codable, Equatable {
    var revision: Int; var mode: String; var automatic: Bool; var board: PartyTVBoard?
    var focusId: String?; var focusNumber: Int; var focusRevision: Int; var browse: Bool; var total: Int
    var canCover: Bool; var hasMatch: Bool; var hasCompany: Bool
    var autoPodium: Bool; var effects: Bool; var idleBrowse: Bool
}

@main struct LocalPartyApp: App {
    @UIApplicationDelegateAdaptor(PartyAppDelegate.self) private var appDelegate
    @StateObject private var model = ServerModel.shared
    var body: some Scene { WindowGroup { HostView(model: model).preferredColorScheme(.dark) } }
}

// Host menu uses the SAME bundled CSS, artwork and controls as the web launcher.
// The game controller and external TV retain their existing server and sessions.
struct HostView: View {
    @ObservedObject var model: ServerModel
    private let language = "en"
    @StateObject private var store = PartyWebStore()
    @Environment(\.scenePhase) private var phase
    var body: some View {
        PartySurfaces(store: store, model: model)
            .ignoresSafeArea(.container, edges: [.top, .bottom])
            .overlay {
                if let error = store.loadError {
                    ContentUnavailableView {
                        Label(language == "ru" ? "Не удалось открыть экран" : "Couldn't open this screen", systemImage: "wifi.exclamationmark")
                    } description: {
                        // WK errors follow the device locale, not the player's
                        // language. The raw failure remains in store.loadError.
                        Text(language == "ru" ? error : "This screen could not load. Try again; your profile and statistics will be kept.")
                    } actions: {
                        Button(language == "ru" ? "Повторить" : "Try again") { store.retry() }
                        if store.showingController { Button(language == "ru" ? "В меню" : "Back to menu") { store.showController(false) } }
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
        controller.updateNavigation()
    }
}

@MainActor private final class PartyTabBackdrop: UIVisualEffectView {
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let hit = super.hitTest(point, with: event)
        var node = hit
        while let current = node, current !== self {
            if current is UIControl { return hit }
            node = current.superview
        }
        return nil // The fading blur is decoration; scrolling passes through it.
    }
}

@MainActor private final class PartySurfaceController: UIViewController {
    private let store: PartyWebStore
    // Erase the type so an iOS 26 SDK can still compile the legacy path.
    // The hotfix build script requires SDK 27 for current-device builds.
    private var externalRegistration: AnyObject?
    private let tabBar = PartyTabBackdrop(effect: UIBlurEffect(style: .systemUltraThinMaterialDark))
    private let tabStack = UIStackView()
    private let tabGlass: UIVisualEffectView = {
        if #available(iOS 26.0, *) {
            let effect = UIGlassEffect(style: .regular)
            effect.tintColor = UIColor(red: 0.29, green: 0.20, blue: 0.40, alpha: 0.22)
            return PartyTabBackdrop(effect: effect)
        }
        return PartyTabBackdrop(effect: UIBlurEffect(style: .systemMaterialDark))
    }()
    private let tabSelection = UIView()
    private let tabGlow = CAGradientLayer()
    private let tabGlowHaze = CAGradientLayer()
    private var tabs: [UIButton] = []
    private var lastTab = ""
    private var outgoingScreen: UIView?
    private var transitionID = 0
    private var tabTop: NSLayoutConstraint?
    private var glowAnimator: UIViewPropertyAnimator?
    private var screenAnimator: UIViewPropertyAnimator?
    private let tabHaptic = UISelectionFeedbackGenerator()
    init(store: PartyWebStore) { self.store = store; super.init(nibName: nil, bundle: nil) }
    required init?(coder: NSCoder) { fatalError("Use init(store:)") }
    override func loadView() {
        let root = UIView(); root.backgroundColor = .black; root.clipsToBounds = true
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
        tabBar.translatesAutoresizingMaskIntoConstraints = false
        tabBar.contentView.backgroundColor = UIColor(red: 0.12, green: 0.07, blue: 0.21, alpha: 0.56)
        root.addSubview(tabBar)
        tabStack.translatesAutoresizingMaskIntoConstraints = false
        tabStack.axis = .horizontal; tabStack.distribution = .fillEqually; tabStack.spacing = 4
        tabSelection.isUserInteractionEnabled = false
        tabGlow.type = .radial
        tabGlow.startPoint = CGPoint(x: 0.5, y: 0.5); tabGlow.endPoint = CGPoint(x: 1, y: 1)
        tabGlow.colors = [UIColor(red: 0.8, green: 1, blue: 0.55, alpha: 0.3).cgColor, UIColor(red: 0.8, green: 1, blue: 0.55, alpha: 0.16).cgColor, UIColor.clear.cgColor]
        tabGlow.locations = [0, 0.32, 1]
        tabGlowHaze.type = .radial
        tabGlowHaze.startPoint = CGPoint(x: 0.5, y: 0.5); tabGlowHaze.endPoint = CGPoint(x: 1, y: 1)
        tabGlowHaze.colors = [UIColor(red: 0.76, green: 0.67, blue: 1, alpha: 0.22).cgColor, UIColor(red: 0.76, green: 0.67, blue: 1, alpha: 0.1).cgColor, UIColor.clear.cgColor]
        tabGlowHaze.locations = [0, 0.4, 1]
        tabSelection.layer.addSublayer(tabGlowHaze)
        tabSelection.layer.addSublayer(tabGlow)
        tabGlass.translatesAutoresizingMaskIntoConstraints = false
        tabGlass.layer.cornerRadius = 30; tabGlass.clipsToBounds = true
        tabBar.contentView.addSubview(tabGlass)
        tabGlass.contentView.addSubview(tabSelection)
        tabGlass.contentView.addSubview(tabStack)
        let top = tabBar.topAnchor.constraint(equalTo: root.safeAreaLayoutGuide.bottomAnchor, constant: -92)
        tabTop = top
        NSLayoutConstraint.activate([
            tabBar.leadingAnchor.constraint(equalTo: root.leadingAnchor), tabBar.trailingAnchor.constraint(equalTo: root.trailingAnchor), tabBar.bottomAnchor.constraint(equalTo: root.bottomAnchor),
            top,
            tabGlass.leadingAnchor.constraint(equalTo: tabBar.contentView.leadingAnchor, constant: 22), tabGlass.trailingAnchor.constraint(equalTo: tabBar.contentView.trailingAnchor, constant: -22),
            tabGlass.topAnchor.constraint(equalTo: tabBar.contentView.topAnchor, constant: 32), tabGlass.heightAnchor.constraint(equalToConstant: 60),
            tabStack.leadingAnchor.constraint(equalTo: tabGlass.contentView.leadingAnchor, constant: 6), tabStack.trailingAnchor.constraint(equalTo: tabGlass.contentView.trailingAnchor, constant: -6),
            tabStack.centerYAnchor.constraint(equalTo: tabGlass.contentView.centerYAnchor), tabStack.heightAnchor.constraint(equalToConstant: 44)
        ])
        for (index, icon) in ["square.grid.2x2.fill", "gamecontroller.fill", "person.crop.circle.fill"].enumerated() {
            let button = UIButton(type: .system)
            var config = UIButton.Configuration.plain()
            config.image = UIImage(systemName: icon)
            config.preferredSymbolConfigurationForImage = UIImage.SymbolConfiguration(pointSize: 21, weight: .semibold)
            config.contentInsets = NSDirectionalEdgeInsets(top: 3, leading: 0, bottom: 3, trailing: 0)
            button.configuration = config; button.layer.cornerRadius = 16
            button.addAction(UIAction { [weak self] _ in self?.store.selectTab(["games", "controller", "host"][index]) }, for: .touchUpInside)
            tabs.append(button); tabStack.addArrangedSubview(button)
        }
        updateNavigation()
    }
    func updateNavigation() {
        guard isViewLoaded else { return }
        store.menu.isHidden = store.showingController
        store.controller.isHidden = !store.showingController
        let ru = false // Production UI is English, including accessibility labels.
        let names = ru ? ["Игры", "Пульт", "Ведущий"] : ["Games", "Controller", "Host"]
        for (i, button) in tabs.enumerated() {
            let selected = ["games", "controller", "host"][i] == store.selectedTab
            var config = button.configuration!
            config.title = nil; config.attributedTitle = nil
            config.baseForegroundColor = selected ? .white : UIColor.white.withAlphaComponent(0.6)
            button.configuration = config
            button.accessibilityLabel = names[i]
            button.layer.shadowColor = UIColor(red: 0.77, green: 1, blue: 0.48, alpha: 1).cgColor
            button.layer.shadowRadius = 9; button.layer.shadowOffset = .zero
            UIView.animate(withDuration: UIAccessibility.isReduceMotionEnabled ? 0 : 0.24, delay: 0, options: [.beginFromCurrentState, .curveEaseInOut]) {
                button.transform = selected ? CGAffineTransform(scaleX: 1.13, y: 1.13) : .identity
                button.layer.shadowOpacity = selected ? 0.85 : 0
            }
            button.backgroundColor = .clear
            button.accessibilityTraits = selected ? [.button, .selected] : .button
        }
        let index = ["games", "controller", "host"].firstIndex(of: store.selectedTab) ?? 0
        let changed = lastTab != store.selectedTab
        if changed, !lastTab.isEmpty, UIApplication.shared.applicationState == .active {
            tabHaptic.selectionChanged()
            tabHaptic.prepare()
        }
        if tabs.indices.contains(index), changed {
            let target = glowFrame(index)
            glowAnimator?.stopAnimation(true)
            let animator = UIViewPropertyAnimator(duration: UIAccessibility.isReduceMotionEnabled ? 0 : 0.56, controlPoint1: CGPoint(x: 0.22, y: 1), controlPoint2: CGPoint(x: 0.36, y: 1))
            animator.addAnimations { self.tabSelection.frame = target }
            glowAnimator = animator; animator.startAnimation()
            UIView.animateKeyframes(withDuration: UIAccessibility.isReduceMotionEnabled ? 0 : 0.56, delay: 0, options: [.beginFromCurrentState, .allowUserInteraction]) {
                UIView.addKeyframe(withRelativeStartTime: 0, relativeDuration: 0.2) { self.tabSelection.alpha = 0.35 }
                UIView.addKeyframe(withRelativeStartTime: 0.35, relativeDuration: 0.65) { self.tabSelection.alpha = 1 }
            }
        }
        guard changed else { return }
        let order = ["games", "controller", "host"]
        let direction: CGFloat = (order.firstIndex(of: store.selectedTab) ?? 0) >= (order.firstIndex(of: lastTab) ?? 0) ? 1 : -1
        lastTab = store.selectedTab
        let web = store.showingController ? store.controller : store.menu
        transitionID += 1; let epoch = transitionID
        let snapshot = outgoingScreen
        guard !UIAccessibility.isReduceMotionEnabled, let snapshot else { clearScreenTransition(); store.finishTabTransition(); return }
        // Opaque adjoining pages, not two partially transparent overlapping
        // WebKit surfaces. A cross-fade looks like a stale screen on rapid taps.
        web.alpha = 1; web.transform = CGAffineTransform(translationX: direction * view.bounds.width, y: 0)
        let animator = UIViewPropertyAnimator(duration: 0.26, controlPoint1: CGPoint(x: 0.22, y: 1), controlPoint2: CGPoint(x: 0.36, y: 1))
        animator.addAnimations { web.transform = .identity; snapshot.transform = CGAffineTransform(translationX: -direction * self.view.bounds.width, y: 0) }
        animator.addCompletion { [weak self] _ in
            guard let self, self.transitionID == epoch else { snapshot.removeFromSuperview(); return }
            self.clearScreenTransition(); self.store.finishTabTransition()
        }
        screenAnimator = animator; animator.startAnimation()
    }
    private func clearScreenTransition() {
        // Invalidate completions before cancellation. Never freeze a WKWebView
        // at a presentation-layer alpha/transform and capture it as the next page.
        transitionID += 1
        if let animator = screenAnimator, animator.state == .active { animator.stopAnimation(true) }
        screenAnimator = nil
        outgoingScreen?.removeFromSuperview(); outgoingScreen = nil
        UIView.performWithoutAnimation {
            for web in [store.menu, store.controller] { web.alpha = 1; web.transform = .identity }
        }
    }
    func prepareTransition() {
        clearScreenTransition()
        guard isViewLoaded, !UIAccessibility.isReduceMotionEnabled else { return }
        let current = store.showingController ? store.controller : store.menu
        guard let content = current.snapshotView(afterScreenUpdates: true) else { return }
        // WebKit itself is non-opaque. Give the snapshot an opaque backing so
        // transparent page margins cannot expose the incoming page underneath.
        let snapshot = UIView(frame: view.bounds)
        snapshot.backgroundColor = view.backgroundColor ?? .black; snapshot.isOpaque = true; snapshot.clipsToBounds = true
        snapshot.accessibilityIdentifier = "party-tab-transition-snapshot"
        content.frame = snapshot.bounds; content.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        snapshot.addSubview(content); snapshot.isUserInteractionEnabled = false
        view.insertSubview(snapshot, belowSubview: tabBar); outgoingScreen = snapshot
    }
    #if DEBUG
    func tabTransitionDiagnostics() -> [String: Any] {
        let surfaces = [store.menu, store.controller].map { web -> [String: Any] in
            let layer = web.layer.presentation() ?? web.layer
            return ["hidden": web.isHidden, "alpha": web.alpha, "presentationAlpha": layer.opacity,
                    "translationX": web.transform.tx, "presentationTranslationX": layer.transform.m41]
        }
        return ["tab": store.selectedTab, "running": screenAnimator?.isRunning == true,
                "snapshotCount": view.subviews.filter { $0.accessibilityIdentifier == "party-tab-transition-snapshot" }.count,
                "surfaces": surfaces]
    }
    #endif
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        tabTop?.constant = -92 + min(12, max(0, view.safeAreaInsets.bottom - 20))
        let mask = CAGradientLayer(); mask.frame = tabBar.bounds
        mask.colors = [UIColor.clear.cgColor, UIColor.black.withAlphaComponent(0.12).cgColor, UIColor.black.withAlphaComponent(0.42).cgColor, UIColor.black.withAlphaComponent(0.8).cgColor, UIColor.black.cgColor, UIColor.black.cgColor]
        let fade = min(1, 44 / max(1, tabBar.bounds.height))
        mask.locations = [0, NSNumber(value: fade * 0.25), NSNumber(value: fade * 0.5), NSNumber(value: fade * 0.8), NSNumber(value: fade), 1]
        tabBar.layer.mask = mask
        let index = ["games", "controller", "host"].firstIndex(of: store.selectedTab) ?? 0
        if tabs.indices.contains(index), glowAnimator?.isRunning != true { tabSelection.frame = glowFrame(index) }
        CATransaction.begin(); CATransaction.setDisableActions(true)
        // Wide, overlapping light clouds, with their cores below the screen edge.
        tabGlow.frame = CGRect(x: -35, y: 35, width: 310, height: 145)
        tabGlowHaze.frame = CGRect(x: -65, y: 12, width: 355, height: 180)
        CATransaction.commit()
    }
    private func glowFrame(_ index: Int) -> CGRect {
        let center = tabStack.convert(tabs[index].center, to: tabGlass.contentView)
        return CGRect(x: center.x - 120, y: tabGlass.bounds.height - 105, width: 240, height: 210)
    }
    override func viewDidLoad() {
        super.viewDidLoad()
        for name in [UIApplication.didBecomeActiveNotification, UIApplication.willResignActiveNotification, UIAccessibility.reduceMotionStatusDidChangeNotification] {
            NotificationCenter.default.addObserver(self, selector: #selector(glowEnvironmentChanged(_:)), name: name, object: nil)
        }
        ensureDisplayRegistration()
    }
    @objc private func glowEnvironmentChanged(_ notification: Notification) {
        if notification.name == UIApplication.willResignActiveNotification {
            for layer in [tabGlow, tabGlowHaze] { layer.removeAnimation(forKey: "softBreathing") }
        } else { updateGlowBreathing() }
    }
    private func updateGlowBreathing() {
        let enabled = viewIfLoaded?.window != nil && UIApplication.shared.applicationState == .active && !UIAccessibility.isReduceMotionEnabled
        for (index, layer) in [tabGlow, tabGlowHaze].enumerated() {
            guard enabled else { layer.removeAnimation(forKey: "softBreathing"); continue }
            guard layer.animation(forKey: "softBreathing") == nil else { continue }
            let brightness = CABasicAnimation(keyPath: "opacity")
            brightness.fromValue = 0.72; brightness.toValue = 1
            let spread = CABasicAnimation(keyPath: "transform.scale")
            spread.fromValue = 0.96; spread.toValue = index == 0 ? 1.12 : 1.18
            let drift = CABasicAnimation(keyPath: "transform.translation.x")
            drift.fromValue = index == 0 ? -7 : 10; drift.toValue = index == 0 ? 9 : -12
            let breath = CAAnimationGroup()
            breath.animations = [brightness, spread, drift]
            breath.duration = index == 0 ? 4.8 : 6.7
            breath.autoreverses = true; breath.repeatCount = .infinity
            breath.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
            layer.add(breath, forKey: "softBreathing")
        }
    }
    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        for layer in [tabGlow, tabGlowHaze] { layer.removeAnimation(forKey: "softBreathing") }
    }
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        tabHaptic.prepare()
        updateGlowBreathing()
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
    @Published private(set) var selectedTab = "games"
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
    private let uiImpact = UIImpactFeedbackGenerator(style: .soft)
    private let bowMotion = CMMotionManager()
    private var bowMotionDelivery = false
    private var bowMotionEpoch = 0
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
            if let file = Bundle.main.url(forResource: "tabs", withExtension: "js", subdirectory: "Server/public/native-shell"), let source = try? String(contentsOf: file, encoding: .utf8) {
                view.configuration.userContentController.addUserScript(WKUserScript(source: "window.__partyPersistentTabs=true;\n" + source, injectionTime: .atDocumentStart, forMainFrameOnly: true))
            }
            view.configuration.userContentController.add(handler, name: "partyShell")
            view.configuration.userContentController.addUserScript(WKUserScript(source: "window.addEventListener('party-language-change', e => window.webkit.messageHandlers.partyShell.postMessage({type:'personal-language',language:e.detail.language}));", injectionTime: .atDocumentStart, forMainFrameOnly: true))
            view.navigationDelegate = self; view.uiDelegate = self
            view.isOpaque = false; view.backgroundColor = .black
            view.scrollView.contentInsetAdjustmentBehavior = .never
            // Elastic root scrolling moves even CSS-fixed chrome in WKWebView.
            // Keep menus anchored; nested web content still scrolls normally.
            view.scrollView.bounces = false
            view.scrollView.alwaysBounceVertical = false
            view.allowsBackForwardNavigationGestures = false
        }
        // Do not begin the JS handshake until the model has been attached.
        #if DEBUG && targetEnvironment(simulator)
        installSimulatorAudit()
        #endif
    }
    #if DEBUG && targetEnvironment(simulator)
    // Opt-in local test driver for the real WKWebViews. Never compiled for devices.
    // Commands live in this simulator app's sandbox, not on a network endpoint.
    private var auditTimer: Timer?
    private var auditCommandID = ""
    private func installSimulatorAudit() {
        guard ProcessInfo.processInfo.environment["PARTY_UI_AUDIT"] == "1" else { return }
        let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        auditTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self,
                      let data = try? Data(contentsOf: directory.appendingPathComponent("ui-audit-command.json")),
                      let command = try? JSONSerialization.jsonObject(with: data) as? [String: String],
                      let id = command["id"], id != self.auditCommandID,
                      let script = command["script"] else { return }
                self.auditCommandID = id
                let view = command["surface"] == "controller" ? self.controller : self.menu
                view.evaluateJavaScript(script) { result, error in
                    let output: [String: Any] = ["id": id, "result": result ?? NSNull(), "error": error?.localizedDescription ?? "",
                                               "nativeTabs": self.surfaceController?.tabTransitionDiagnostics() ?? [:]]
                    if let encoded = try? JSONSerialization.data(withJSONObject: output, options: [.fragmentsAllowed]) {
                        try? encoded.write(to: directory.appendingPathComponent("ui-audit-result.json"), options: .atomic)
                    }
                }
            }
        }
    }
    #endif
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
        if model.ready, controllerURL != model.controllerURL {
            controllerURL = model.controllerURL; controller.load(URLRequest(url: model.controllerURL))
        }
        publish()
    }
    func setPhase(_ value: ScenePhase) {
        phase = value
        signalController(showingController && value == .active)
        if value != .active { cancelHaptics(); bowMotion.stopGyroUpdates() }
        if value == .active {
            surfaceController?.ensureDisplayRegistration()
            refreshSnapshot()
        }
    }
    func showController(_ value: Bool) {
        guard !value || model?.ready == true else { return }
        loadError = nil
        showingController = value
        selectedTab = value ? "controller" : "games"
        if !value { bowMotion.stopGyroUpdates() }
        if value, let model, controllerURL != model.controllerURL {
            controllerURL = model.controllerURL; controller.load(URLRequest(url: model.controllerURL))
        }
        signalController(value && phase == .active)
        cancelHaptics()
    }
    private var tabTransitionPending = false
    private var queuedTab: String?
    func finishTabTransition() {
        tabTransitionPending = false
        guard let tab = queuedTab else { return }
        queuedTab = nil
        DispatchQueue.main.async { [weak self] in self?.selectTab(tab) }
    }
    func selectTab(_ tab: String) {
        guard ["games", "controller", "host"].contains(tab) else { return }
        guard tab != "controller" || model?.ready == true else { return }
        // Coalesce rapid taps instead of tearing down a half-visible screen.
        if tabTransitionPending { queuedTab = tab; return }
        queuedTab = nil
        guard tab != selectedTab else { return }
        if tab == "controller", controller.isLoading { queuedTab = tab; return }
        tabTransitionPending = true
        surfaceController?.prepareTransition()
        let destination = tab == "controller" ? controller : menu
        // Keep the outgoing snapshot opaque until WebKit has laid out the new tab.
        // Previously native animation raced the asynchronous host DOM update.
        destination.callAsyncJavaScript("""
            if (tab !== 'controller') window.LocalPartyTabs?.select(tab, false);
            if (document.fonts) await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            return true;
            """, arguments: ["tab": tab], in: nil, in: .page) { [weak self] _ in
                guard let self else { return }
                self.showController(tab == "controller")
                self.selectedTab = tab
                self.surfaceController?.updateNavigation()
            }
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
    private func startBowMotion(frame: WKFrameInfo) {
        guard bowMotion.isGyroAvailable else { return }
        bowMotionEpoch += 1
        let epoch = bowMotionEpoch
        bowMotionDelivery = false
        bowMotion.stopGyroUpdates()
        bowMotion.gyroUpdateInterval = 1.0 / 30.0
        bowMotion.startGyroUpdates(to: .main) { [weak self] sample, _ in
            guard let self, let sample, self.bowMotionEpoch == epoch else { return }
            guard self.phase == .active, self.showingController else { self.bowMotion.stopGyroUpdates(); return }
            guard !self.bowMotionDelivery else { return }
            let r = sample.rotationRate
            guard r.x.isFinite, r.y.isFinite, r.z.isFinite else { return }
            self.bowMotionDelivery = true
            self.controller.evaluateJavaScript("window.__partyBowGyro?.(\(r.x),\(r.y),\(r.z))", in: frame, in: .page) { [weak self] result in
                guard let self, self.bowMotionEpoch == epoch else { return }
                self.bowMotionDelivery = false
                if case .failure = result { self.bowMotion.stopGyroUpdates() }
            }
        }
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
        let gamePath = message.frameInfo.request.url?.path ?? ""
        if player, gamePath == "/games/bow_club" || gamePath.hasPrefix("/games/bow_club/") {
            if type == "bow-diagnostic", let stats = body["stats"] as? [String: Any] { model?.recordBowDiagnostic(stats); return }
            if type == "bow-gyro-stop" { bowMotion.stopGyroUpdates(); return }
            if type == "bow-gyro-start" { startBowMotion(frame: message.frameInfo); return }
        }
        if type == "haptic-prepare", phase == .active, hapticsEnabled { uiImpact.prepare(); return }
        if type == "haptic" { playHaptics(body["pattern"]); return }
        if type == "menu", player, message.frameInfo.isMainFrame { showController(false); return }
        if type == "native-tab", message.frameInfo.isMainFrame, let tab = body["tab"] as? String { selectTab(tab); return }
        if type == "personal-language", message.frameInfo.isMainFrame,
           let language = body["language"] as? String, language == "en" {
            UserDefaults.standard.set(language, forKey: "LocalParty.language")
            for view in [menu, controller] { syncPersonalLanguage(view) }
            return
        }
        guard shell else { return } // game JavaScript can NEVER issue admin commands
        guard let model else { return }
        switch type {
        case "launch-diagnostic": if let stats = body["stats"] as? [String: Any] { model.recordLaunchAttempt(stats) }
        case "controller": showController(true)
        case "manage":
            let allowed: Set<String> = ["select", "settings", "launch", "force-start", "force-language", "stop", "pause", "game-action", "retry-start", "kick", "statistics-reset", "dismiss-incident", "tv-overlay", "tv-focus", "tv-options", "bots-set"]
            // ServerModel already serializes commands through commandTail. Rejecting a
            // tap here while a snapshot still reported `working` caused a silent lost
            // Start: WebKit showed its pending state, but no launch ever reached Node.
            if let command = body["command"] as? [String: Any], let kind = command["type"] as? String, allowed.contains(kind) { model.command(command) }
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
                    let impact = duration <= 20 ? self.uiImpact : UIImpactFeedbackGenerator(style: duration > 60 ? .heavy : .medium)
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
        guard webView === controller && showingController && trustedController(origin) else { decisionHandler(.deny); return }
        Task { @MainActor in
            var allowed = true
            if type == .camera || type == .cameraAndMicrophone {
                allowed = await AVCaptureDevice.requestAccess(for: .video)
            }
            if allowed && (type == .microphone || type == .cameraAndMicrophone) {
                allowed = await AVCaptureDevice.requestAccess(for: .audio)
            }
            decisionHandler(allowed && showingController && trustedController(origin) ? .grant : .deny)
        }
    }
    private func syncPersonalLanguage(_ view: WKWebView) {
        let language = "en"
        view.callAsyncJavaScript("if(window.PartyI18n && PartyI18n.language !== language) PartyI18n.setLanguage(language)", arguments: ["language": language], in: nil, in: .page, completionHandler: nil)
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Disable WKWebView page magnification, not game-owned pointer gestures.
        webView.scrollView.pinchGestureRecognizer?.isEnabled = false
        syncPersonalLanguage(webView)
        if webView === menu {
            // Fallback when the first ready message was lost during app startup.
            menuReady = true; deliveryFailures = 0; refreshSnapshot()
        }
        else {
            signalController(showingController && phase == .active)
            if !tabTransitionPending, let tab = queuedTab { queuedTab = nil; selectTab(tab) }
        }
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
