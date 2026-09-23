import SwiftUI
import WebKit

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
        ServerModel.shared.externalDisplayReload += 1
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        window?.isHidden = true
        window?.rootViewController = nil
        window = nil
        ServerModel.shared.externalDisplayDisconnected(scene.session.persistentIdentifier)
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
                }.frame(maxWidth: .infinity, maxHeight: .infinity).padding(48)
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
                VStack(spacing: 20) {
                    PartyTVLoadingLogo()
                    ProgressView().tint(.white).scaleEffect(1.6)
                    Text(message).font(.title2).multilineTextAlignment(.center)
                }.padding(40).background(.black.opacity(0.85), in: RoundedRectangle(cornerRadius: 24))
            }
        }
        .task(id: loadID) { renderer.load(url) }
    }
}

// The TV gets its own WebKit surface and cookies, not the phone controller's view.
// It loads the existing display-only route over loopback, so no TV browser or
// additional server is involved and the normal display authentication still applies.
@MainActor final class PartyTVRenderer: NSObject, ObservableObject, WKNavigationDelegate, WKScriptMessageHandler, WKUIDelegate {
    let webView: WKWebView
    @Published private(set) var message: String? = "Connecting the shared screen…"
    private var url: URL?
    private var retry: Task<Void, Never>?

    override init() {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init()
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

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard url != nil, message.frameInfo.securityOrigin.host == "127.0.0.1",
              let stats = message.body as? [String: Any] else { return }
        ServerModel.shared.recordDisplayPerformance(stats)
    }

    func load(_ url: URL) {
        retry?.cancel()
        retry = nil
        self.url = url
        message = "Connecting the shared screen…"
        webView.load(URLRequest(url: url))
    }

    func stop() {
        retry?.cancel()
        retry = nil
        url = nil
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
@MainActor private final class PartyFrameStatsHandler: NSObject, WKScriptMessageHandler {
    weak var target: PartyTVRenderer?
    init(target: PartyTVRenderer) { self.target = target }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(userContentController, didReceive: message)
    }
}
