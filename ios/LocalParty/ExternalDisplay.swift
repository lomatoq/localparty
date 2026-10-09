import SwiftUI
import WebKit
import AVFAudio

@MainActor final class PartyAppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, configurationForConnecting session: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        // Return a fresh default configuration for SwiftUI's phone scene. Reusing
        // session.configuration can re-wrap SwiftUI's own scene delegate.
        guard session.role == .windowExternalDisplayNonInteractive else {
            return UISceneConfiguration(name: nil, sessionRole: session.role)
        }
        let configuration = UISceneConfiguration(name: "Party TV", sessionRole: session.role)
        configuration.sceneClass = UIWindowScene.self
        configuration.delegateClass = PartyExternalDisplaySceneDelegate.self
        return configuration
    }
}

@MainActor final class PartyExternalDisplaySceneDelegate: NSObject, UIWindowSceneDelegate {
    var window: UIWindow?
    private var activated = false

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene,
              session.role == .windowExternalDisplayNonInteractive else { return }
        let model = ServerModel.shared
        let window = UIWindow(windowScene: windowScene)
        window.backgroundColor = .black
        window.rootViewController = UIHostingController(rootView: PartyExternalDisplayView(model: model))
        self.window = window
        // Show only on the external scene; never steal the phone's key window.
        window.isHidden = false
        model.externalDisplayConnected(session.persistentIdentifier)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        window?.isHidden = false
        window?.rootViewController?.view.setNeedsLayout()
        // Initial activation follows willConnectTo. Reloading there raced the
        // first WK navigation/curtain with a second load of the same TV URL.
        if activated { ServerModel.shared.externalDisplayReload += 1 }
        activated = true
        ServerModel.shared.recordDisplayLifecycle("active")
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        ServerModel.shared.recordDisplayLifecycle("disconnected")
        activated = false
        window?.isHidden = true
        window?.rootViewController = nil
        window = nil
        ServerModel.shared.externalDisplayDisconnected(scene.session.persistentIdentifier)
    }
}

private struct PartyTVLoadingBackdrop: View {
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color(red: 0.03, green: 0.04, blue: 0.07)
                if let url = Bundle.main.url(forResource: "heypals-hero", withExtension: "png", subdirectory: "Server/public/assets/branding"),
                   let artwork = UIImage(contentsOfFile: url.path) {
                    Image(uiImage: artwork).resizable().scaledToFill()
                        .frame(width: geometry.size.width + 48, height: geometry.size.height + 48)
                        .blur(radius: 14).position(x: geometry.size.width / 2, y: geometry.size.height / 2)
                }
                LinearGradient(colors: [.black.opacity(0.72), .black.opacity(0.84)], startPoint: .top, endPoint: .bottom)
            }.frame(width: geometry.size.width, height: geometry.size.height).clipped()
        }.ignoresSafeArea().accessibilityHidden(true)
    }
}

private struct PartyTVLoadingLogo: View {
    var body: some View {
        if let url = Bundle.main.url(forResource: "heypals-logo", withExtension: "png", subdirectory: "Server/public/assets/branding"),
           let logo = UIImage(contentsOfFile: url.path) {
            Image(uiImage: logo).resizable().scaledToFit().frame(width: 420, height: 187).accessibilityLabel("HeyPals")
        } else {
            Text("HeyPals").font(.system(size: 56, weight: .bold))
        }
    }
}

private struct PartyExternalDisplayView: View {
    @ObservedObject var model: ServerModel
    private var status: String {
        // Legacy room language overrides do not change production loading copy.
        guard let issue = model.connectionStatus else { return "Preparing your room…" }
        return issue.contains("недоступен") ? "Local server unavailable. Close HeyPals on your iPhone and reopen it." : "Reconnecting to your local room…"
    }
    var body: some View {
        Group {
            if model.enabled && model.ready {
                PartyTVContent(url: model.externalDisplayURL, bootID: model.state?.bootId ?? "",
                               reload: model.externalDisplayReload)
            } else {
                VStack(spacing: 24) {
                    PartyTVLoadingLogo()
                    Text(status).font(.title).multilineTextAlignment(.center)
                    Text("The game appears on TV. Your phone becomes the controller.").font(.title2).foregroundStyle(.secondary)
                }.frame(maxWidth: .infinity, maxHeight: .infinity).padding(48).background(PartyTVLoadingBackdrop())
            }
        }.background(.black).foregroundStyle(.white).preferredColorScheme(.dark).ignoresSafeArea()
    }
}

private struct PartyTVContent: View {
    let url: URL
    let bootID: String
    let reload: Int
    @StateObject private var renderer = PartyTVRenderer()
    private var loadID: String { "\(url.absoluteString)|\(bootID)|\(reload)" }

    var body: some View {
        ZStack {
            PartyTVWebView(renderer: renderer)
            if let message = renderer.message {
                PartyTVLoadingBackdrop()
                VStack(spacing: 20) {
                    PartyTVLoadingLogo()
                    ProgressView().tint(.white).scaleEffect(1.6)
                    Text(message).font(.title2).multilineTextAlignment(.center)
                }.padding(40)
            }
        }
        .task(id: loadID) { renderer.load(url) }
    }
}

// The TV gets its own WebKit surface and cookies, not the phone controller's view.
// It loads the existing display-only route over loopback, so no TV browser or
// additional server is involved and the normal display authentication still applies.
@MainActor final class PartyTVRenderer: NSObject, ObservableObject, WKNavigationDelegate, WKScriptMessageHandler, WKScriptMessageHandlerWithReply, WKUIDelegate {
    let webView: WKWebView
    @Published private(set) var message: String? = "Connecting the shared screen…"
    private var url: URL?
    private var retry: Task<Void, Never>?
    private var curtain: PartyTVCurtain?

    override init() {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.userContentController.addUserScript(WKUserScript(source: "window.__partyNativeTVAudio = true;", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            NSLog("HeyPals TV audio session failed: %@", error.localizedDescription)
        }
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init()
        configuration.userContentController.addScriptMessageHandler(PartyFrameStatsHandler(target: self), contentWorld: .page, name: "partyTVCurtain")
        webView.navigationDelegate = self
        webView.uiDelegate = self
        if let scriptURL = Bundle.main.url(forResource: "frame-diagnostics", withExtension: "js", subdirectory: "Server/public"),
           let source = try? String(contentsOf: scriptURL, encoding: .utf8) {
            configuration.userContentController.add(PartyFrameStatsHandler(target: self), name: "partyFrameStats")
            configuration.userContentController.addUserScript(WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false))
        }
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.backgroundColor = .black
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.isScrollEnabled = false
        webView.isUserInteractionEnabled = false
    }

    private func showCurtain(animated: Bool, completion: @escaping (Bool) -> Void) {
        let cover: PartyTVCurtain
        if let existing = curtain { cover = existing } else {
            cover = PartyTVCurtain(frame: webView.bounds, initiallyOpen: animated)
            cover.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            webView.addSubview(cover); curtain = cover
        }
        // A second scene can arrive while the previous shutter is opening.
        // Reverse that same layer from its presented pose; do not acknowledge a
        // close while it is still exposing the outgoing scene.
        cover.close(animated: animated, completion: completion)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard message.frameInfo.isMainFrame, message.frameInfo.securityOrigin.host == "127.0.0.1",
              let command = message.body as? String else { replyHandler(nil, "Invalid curtain request"); return }
        if command == "close" {
            ServerModel.shared.recordDisplayLifecycle("curtain-close")
            showCurtain(animated: true) { finished in
                if finished { ServerModel.shared.recordDisplayLifecycle("curtain-closed") }
                replyHandler(finished, nil)
            }
        } else if command == "open" {
            guard let cover = curtain else { replyHandler(true, nil); return }
            ServerModel.shared.recordDisplayLifecycle("curtain-open")
            cover.open { [weak self] finished in
                if finished {
                    if self?.curtain === cover { self?.curtain = nil }
                    ServerModel.shared.recordDisplayLifecycle("curtain-opened")
                }
                replyHandler(finished, nil)
            }
        } else { replyHandler(nil, "Unknown curtain request") }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard url != nil, message.frameInfo.securityOrigin.host == "127.0.0.1",
              let stats = message.body as? [String: Any] else { return }
        ServerModel.shared.recordDisplayPerformance(stats)
    }

    func load(_ url: URL) {
        retry?.cancel()
        retry = nil
        self.url = url
        ServerModel.shared.recordDisplayLifecycle("load")
        message = "Connecting the shared screen…"
        showCurtain(animated: false, completion: { _ in })
        webView.load(URLRequest(url: url))
    }

    func stop() {
        retry?.cancel()
        retry = nil
        url = nil
        curtain?.cancel(); curtain?.removeFromSuperview(); curtain = nil
        webView.stopLoading()
        // Tear down the JS context and its display/game sockets on disconnect.
        webView.loadHTMLString("", baseURL: nil)
    }

    // External display and its test-controller frames never capture media.
    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(.deny)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard url != nil else { return }
        retry?.cancel()
        retry = nil
        message = nil
        ServerModel.shared.recordDisplayLifecycle("loaded")
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        recover(error)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        recover(error)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse,
                 decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        if navigationResponse.isForMainFrame,
           let response = navigationResponse.response as? HTTPURLResponse, response.statusCode >= 400 {
            decisionHandler(.cancel)
            scheduleRetry()
        } else {
            decisionHandler(.allow)
        }
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { scheduleRetry() }

    private func recover(_ error: Error) {
        guard (error as NSError).code != NSURLErrorCancelled else { return }
        scheduleRetry()
    }

    private func scheduleRetry() {
        guard url != nil else { return }
        retry?.cancel()
        message = "Reconnecting the screen. Keep HeyPals open on your iPhone."
        retry = Task { [weak self] in
            do { try await Task.sleep(for: .seconds(2)) } catch { return }
            guard let self, let url = self.url else { return }
            self.webView.load(URLRequest(url: url))
        }
    }
}

private struct PartyTVWebView: UIViewRepresentable {
    let renderer: PartyTVRenderer
    func makeUIView(context: Context) -> WKWebView { renderer.webView }
    func updateUIView(_ view: WKWebView, context: Context) {}
    func makeCoordinator() -> PartyTVRenderer { renderer }
    static func dismantleUIView(_ view: WKWebView, coordinator: PartyTVRenderer) { coordinator.stop() }
}

// WKUserContentController retains its handler; do not retain the renderer back.
@MainActor private final class PartyFrameStatsHandler: NSObject, WKScriptMessageHandler, WKScriptMessageHandlerWithReply {
    weak var target: PartyTVRenderer?
    init(target: PartyTVRenderer) { self.target = target }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
        guard let target else { replyHandler(nil, "Display disconnected"); return }
        target.userContentController(userContentController, didReceive: message, replyHandler: replyHandler)
    }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(userContentController, didReceive: message)
    }
}

// TV shutter is composited by Core Animation, not repainted by the game's WebKit process.
@MainActor private final class PartyTVCurtain: UIView {
    private let left = CAShapeLayer(), right = CAShapeLayer(), logo = UIImageView()
    private var targetOpen = false, moving = false, motionGeneration = 0
    private var layoutWidth: CGFloat = 0
    private var completions: [(Bool) -> Void] = []
    init(frame: CGRect, initiallyOpen: Bool = false) {
        super.init(frame: frame)
        isUserInteractionEnabled = false
        for panel in [left, right] { panel.fillColor = UIColor(red: 0.025, green: 0.02, blue: 0.04, alpha: 1).cgColor; layer.addSublayer(panel) }
        if let url = Bundle.main.url(forResource: "heypals-logo", withExtension: "png", subdirectory: "Server/public/assets/branding") { logo.image = UIImage(contentsOfFile: url.path) }
        logo.contentMode = .scaleAspectFit; addSubview(logo)
        if initiallyOpen {
            targetOpen = true
            CATransaction.begin(); CATransaction.setDisableActions(true)
            if UIAccessibility.isReduceMotionEnabled { layer.opacity = 0 } else {
                left.setValue(-bounds.width * 0.58, forKeyPath: "transform.translation.x")
                right.setValue(bounds.width * 0.58, forKeyPath: "transform.translation.x")
                logo.layer.opacity = 0
            }
            CATransaction.commit()
        }
    }
    required init?(coder: NSCoder) { fatalError("Use init(frame:)") }
    override func layoutSubviews() {
        super.layoutSubviews()
        CATransaction.begin(); CATransaction.setDisableActions(true)
        let w = bounds.width, h = bounds.height
        let a = UIBezierPath(); a.move(to: .zero); a.addLine(to: CGPoint(x: w * 0.56 + 1, y: 0)); a.addLine(to: CGPoint(x: w * 0.44 + 1, y: h)); a.addLine(to: CGPoint(x: 0, y: h)); a.close()
        let b = UIBezierPath(); b.move(to: CGPoint(x: w * 0.56 - 1, y: 0)); b.addLine(to: CGPoint(x: w, y: 0)); b.addLine(to: CGPoint(x: w, y: h)); b.addLine(to: CGPoint(x: w * 0.44 - 1, y: h)); b.close()
        // Setting frame while a layer is translated can shift its position on a
        // receiver resize. Bounds/position preserve the live door translation.
        for panel in [left, right] { panel.bounds = bounds; panel.position = CGPoint(x: w / 2, y: h / 2) }
        left.path = a.cgPath; right.path = b.cgPath
        logo.frame = CGRect(x: w * 0.34, y: h * 0.35, width: w * 0.32, height: h * 0.30)
        CATransaction.commit()
        let resized = layoutWidth > 0 && layoutWidth != w
        layoutWidth = w
        if resized && moving && targetOpen && !UIAccessibility.isReduceMotionEnabled {
            // A larger receiver needs a farther open endpoint. Retarget from the
            // presented pose and retain the same command's completion ownership.
            move(open: true, animated: true, retarget: true)
        }
    }
    func close(animated: Bool, completion: @escaping (Bool) -> Void) { layoutIfNeeded(); move(open: false, animated: animated, completion: completion) }
    func open(completion: @escaping (Bool) -> Void) {
        move(open: true, animated: true) { finished in
            // An interrupted open must never remove a shutter that is closing
            // over the next scene. Removal belongs only to the completed open.
            if finished { self.removeFromSuperview() }
            completion(finished)
        }
    }
    func cancel() {
        motionGeneration += 1; moving = false
        let interrupted = completions; completions = []
        interrupted.forEach { $0(false) }
        for panel in [left, right] { panel.removeAnimation(forKey: "door") }
        logo.layer.removeAnimation(forKey: "logo"); layer.removeAnimation(forKey: "cover")
    }
    private func move(open: Bool, animated: Bool, retarget: Bool = false, completion: @escaping (Bool) -> Void = { _ in }) {
        if moving && targetOpen == open && !retarget { completions.append(completion); return }
        if !moving && targetOpen == open && !retarget { completion(true); return }
        let reduced = UIAccessibility.isReduceMotionEnabled
        let fromLeft = (left.presentation() ?? left).value(forKeyPath: "transform.translation.x") as? CGFloat ?? 0
        let fromRight = (right.presentation() ?? right).value(forKeyPath: "transform.translation.x") as? CGFloat ?? 0
        let fromLogo = (logo.layer.presentation() ?? logo.layer).opacity
        let fromOpacity = (layer.presentation() ?? layer).opacity
        motionGeneration += 1; let generation = motionGeneration
        let interrupted = retarget ? [] : completions
        if !retarget { completions = [completion] }
        targetOpen = open; moving = true
        // Cancel old completion ownership before removing its animations.
        interrupted.forEach { $0(false) }
        for panel in [left, right] { panel.removeAnimation(forKey: "door") }
        logo.layer.removeAnimation(forKey: "logo"); layer.removeAnimation(forKey: "cover")
        let distance = max(1, bounds.width * 0.58)
        let remaining = reduced ? abs(CGFloat(fromOpacity) - (open ? 0 : 1)) :
            max(abs((open ? -distance : 0) - fromLeft), abs((open ? distance : 0) - fromRight)) / distance
        let fullDuration = reduced ? 0.18 : (open ? 0.65 : 0.38)
        let duration = animated ? fullDuration * min(1, max(0.15, remaining)) : 0
        let timing = CAMediaTimingFunction(controlPoints: 0.22, 1, 0.36, 1)
        CATransaction.begin(); CATransaction.setDisableActions(true)
        CATransaction.setCompletionBlock { [weak self] in
            guard let self, self.motionGeneration == generation else { return }
            self.moving = false
            let finished = self.completions; self.completions = []
            finished.forEach { $0(true) }
        }
        func animate(_ target: CALayer, key: String, from: CGFloat, to: CGFloat, name: String) {
            target.setValue(to, forKeyPath: key)
            guard duration > 0, abs(from - to) > 0.0001 else { return }
            let motion = CABasicAnimation(keyPath: key)
            motion.fromValue = from; motion.toValue = to; motion.duration = duration
            // Explicit CA animations do not inherit the transaction's curve.
            motion.timingFunction = timing
            target.add(motion, forKey: name)
        }
        if reduced {
            left.setValue(0, forKeyPath: "transform.translation.x"); right.setValue(0, forKeyPath: "transform.translation.x")
            logo.layer.opacity = 1
            animate(layer, key: "opacity", from: CGFloat(fromOpacity), to: open ? 0 : 1, name: "cover")
        } else {
            layer.opacity = 1
            animate(left, key: "transform.translation.x", from: fromLeft, to: open ? -distance : 0, name: "door")
            animate(right, key: "transform.translation.x", from: fromRight, to: open ? distance : 0, name: "door")
            animate(logo.layer, key: "opacity", from: CGFloat(fromLogo), to: open ? 0 : 1, name: "logo")
        }
        CATransaction.commit()
    }
}
