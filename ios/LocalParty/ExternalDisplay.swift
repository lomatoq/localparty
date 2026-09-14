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

    func sceneDidDisconnect(_ scene: UIScene) {
        window?.isHidden = true
        window?.rootViewController = nil
        window = nil
        ServerModel.shared.externalDisplayDisconnected(scene.session.persistentIdentifier)
    }
}

private struct PartyExternalDisplayView: View {
    @ObservedObject var model: ServerModel
    var body: some View {
        Group {
            if model.enabled {
                PartyTVContent(url: model.externalDisplayURL, bootID: model.state?.bootId ?? "",
                               reload: model.externalDisplayReload)
            } else {
                VStack(spacing: 24) {
                    Image(systemName: "airplayvideo").font(.system(size: 72))
                    Text("LocalParty").font(.system(size: 56, weight: .bold))
                    Text("Запустите сервер в разделе «Комната» на iPhone.").font(.title)
                    Text("Телевизор покажет игру, а телефон станет пультом.").font(.title2).foregroundStyle(.secondary)
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
@MainActor final class PartyTVRenderer: NSObject, ObservableObject, WKNavigationDelegate, WKScriptMessageHandler {
    let webView: WKWebView
    @Published private(set) var message: String? = "Подключаем общий экран…"
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
        message = "Подключаем общий экран…"
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
        message = "Восстанавливаем картинку. Держите LocalParty открытым на iPhone."
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
