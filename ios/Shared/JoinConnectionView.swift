import SwiftUI
import NetworkExtension
#if APPCLIP
import AVFoundation

// A credential-free TestFlight invocation opens the invitation reader.
enum JoinEntryURL {
    static func accepts(_ url: URL, clipBundleID: String) -> Bool {
        guard let c = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return false }
        return c.scheme == "https" && c.host == "appclip.apple.com" && c.port == nil &&
            c.path == "/id" && c.user == nil && c.password == nil && c.fragment == nil &&
            c.queryItems?.count == 1 && c.queryItems?.first?.name == "p" &&
            c.queryItems?.first?.value == clipBundleID && !clipBundleID.isEmpty
    }
}
#endif

@MainActor final class JoinConnection: ObservableObject {
    @Published private(set) var invitation: JoinInvitation?
    @Published private(set) var busy = false
    @Published private(set) var message = "Scan the invitation on your host’s screen."
    private var task: Task<Void, Never>?
    private var generation = UUID()

    func receive(_ url: URL, clipBundleID: String) {
        task?.cancel(); generation = UUID(); busy = false
        invitation = JoinInvitation.decode(url, clipBundleID: clipBundleID)
        #if APPCLIP
        if invitation == nil && JoinEntryURL.accepts(url, clipBundleID: clipBundleID) {
            message = "Scan the host’s current App Clip invitation to join their Wi-Fi and open your controller."
            return
        }
        #endif
        message = invitation == nil ? "This invitation is invalid. Ask the host for a fresh QR code." :
            "Join the host’s Wi-Fi, then open your controller. iPhone may ask you to confirm."
    }
    #if APPCLIP
    @discardableResult func readInvitation(_ text: String) -> Bool {
        guard let url = URL(string: text.trimmingCharacters(in: .whitespacesAndNewlines)) else {
            task?.cancel(); generation = UUID(); busy = false; invitation = nil
            message = "This invitation is invalid. Ask the host for a fresh QR code."
            return false
        }
        receive(url, clipBundleID: Bundle.main.bundleIdentifier ?? "")
        return invitation != nil
    }
    func pasteInvitation() {
        guard let text = UIPasteboard.general.string else {
            message = "Copy the host’s App Clip invitation link, then tap Paste invitation again."
            return
        }
        readInvitation(text)
    }
    #endif
    func join() {
        guard !busy, let invitation else { return }
        let epoch = generation
        busy = true; message = "Connecting to \(invitation.ssid)…"
        let configuration = invitation.security == "nopass" ? NEHotspotConfiguration(ssid: invitation.ssid) :
            NEHotspotConfiguration(ssid: invitation.ssid, passphrase: invitation.password, isWEP: false)
        // Keep the connection when the App Clip hands off to the browser.
        configuration.joinOnce = false
        NEHotspotConfigurationManager.shared.apply(configuration) { [weak self] error in
            Task { @MainActor in
                guard let self, self.generation == epoch else { return }
                if let error = error as NSError?, !(error.domain == NEHotspotConfigurationErrorDomain && error.code == NEHotspotConfigurationError.alreadyAssociated.rawValue) {
                    self.busy = false
                    if error.domain == NEHotspotConfigurationErrorDomain && error.code == NEHotspotConfigurationError.userDenied.rawValue {
                        self.message = "Connection wasn’t approved. Tap Connect to try again."
                    } else {
                        self.message = "Couldn’t join this Wi-Fi. Enable Wi-Fi in Settings, stay near the router, and ask the host to check the network name and password."
                    }
                    return
                }
                #if APPCLIP
                // Access Wi-Fi Information isn't available to App Clips. Never
                // poll fetchCurrent() here: it always returns nil without it.
                // Apple handles association; the browser owns all LAN operations.
                self.busy = false
                self.message = "Wi-Fi request accepted. Opening your controller…"
                self.openController()
                #else
                // apply() success doesn't guarantee association. Check the actual SSID,
                // without contacting the LAN (App Clips cannot perform LAN operations).
                self.task = Task { @MainActor in
                    for _ in 0..<20 {
                        guard !Task.isCancelled, self.generation == epoch else { return }
                        let network = await NEHotspotNetwork.fetchCurrent()
                        if network?.ssid == invitation.ssid {
                            self.busy = false
                            self.message = "Connected. Opening your controller…"
                            self.openController(); return
                        }
                        try? await Task.sleep(for: .milliseconds(500))
                    }
                    guard !Task.isCancelled, self.generation == epoch else { return }
                    self.busy = false
                    self.message = "iPhone hasn’t confirmed the connection yet. Check Wi-Fi in Settings, then retry or open the controller."
                }
                #endif
            }
        }
    }
    func openController() {
        guard let url = invitation?.roomURL else { return }
        UIApplication.shared.open(url.appendingPathComponent("play"), options: [:]) { [weak self] opened in
            Task { @MainActor in
                self?.message = opened ? "Your controller is open in the browser. Keep this Wi-Fi connected." :
                    "Couldn’t open the browser. Try Open controller again."
            }
        }
    }
}

struct JoinConnectionView: View {
    @ObservedObject var connection: JoinConnection
    private let ink = Color(red: 0.09, green: 0.07, blue: 0.14)
    #if APPCLIP
    @State private var scanning = false
    #endif
    var body: some View {
        ZStack {
            ink.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 24) {
                    Image("HeyPalsLogo").resizable().scaledToFit().frame(width: 156).padding(.top, 24)
                    Text("JOIN THE PARTY").font(.custom("Kardia-FatRunner", size: 30)).multilineTextAlignment(.center)
                    if let invitation = connection.invitation {
                        VStack(spacing: 12) {
                            Image(systemName: "wifi").font(.system(size: 40, weight: .bold)).foregroundStyle(Color(red: 0.77, green: 0.96, blue: 0.47))
                            Text(invitation.ssid).font(.custom("Kardia-Fit", size: 24)).multilineTextAlignment(.center)
                            Text(invitation.roomURL?.host ?? "").font(.custom("Kardia-Fit", size: 15)).foregroundStyle(.white.opacity(0.7)).multilineTextAlignment(.center)
                        }.padding(24).frame(maxWidth: .infinity).background(Color(red: 0.15, green: 0.12, blue: 0.21), in: RoundedRectangle(cornerRadius: 28))
                        Text(connection.message).font(.custom("Kardia-FitRunner", size: 18)).multilineTextAlignment(.center).accessibilityAddTraits(.updatesFrequently)
                        Button { connection.join() } label: {
                            HStack(spacing: 10) {
                                if connection.busy { ProgressView().tint(ink) }
                                Text(connection.busy ? "CONNECTING" : "CONNECT & PLAY").font(.custom("Kardia-FatRunner", size: 20))
                            }.frame(maxWidth: .infinity).frame(minHeight: 60)
                        }.foregroundStyle(ink).background(Color(red: 0.77, green: 0.96, blue: 0.47), in: Capsule()).disabled(connection.busy)
                        Button("OPEN CONTROLLER") { connection.openController() }
                            .font(.custom("Kardia-FatRunner", size: 18)).frame(minHeight: 48).disabled(connection.busy)
                        Text("If Wi-Fi is off, enable it in Settings first. The host shares network access through this invitation.")
                            .font(.custom("Kardia-Fit", size: 15)).foregroundStyle(.white.opacity(0.65)).multilineTextAlignment(.center)
                    } else {
                        Text(connection.message).font(.custom("Kardia-FitRunner", size: 18)).multilineTextAlignment(.center)
                    }
                    #if APPCLIP
                    VStack(spacing: 12) {
                        Button(connection.invitation == nil ? "SCAN HOST INVITATION" : "SCAN ANOTHER INVITATION") { scanning = true }
                            .font(.custom("Kardia-FatRunner", size: 18)).frame(maxWidth: .infinity).frame(minHeight: 56)
                            .foregroundStyle(ink).background(Color(red: 0.77, green: 0.96, blue: 0.47), in: Capsule())
                        Button("PASTE INVITATION LINK") { connection.pasteInvitation() }
                            .font(.custom("Kardia-FatRunner", size: 18)).frame(maxWidth: .infinity).frame(minHeight: 48)
                        Text("In this beta, open HeyPals Join from TestFlight first. Scan the host’s App Clip QR here; an ordinary room QR cannot join Wi-Fi.")
                            .font(.custom("Kardia-Fit", size: 15)).foregroundStyle(.white.opacity(0.65)).multilineTextAlignment(.center)
                    }.disabled(connection.busy)
                    #endif
                }.padding(24).frame(maxWidth: 460).frame(maxWidth: .infinity)
            }
        }.foregroundStyle(.white).preferredColorScheme(.dark)
        #if APPCLIP
        .sheet(isPresented: $scanning) {
            NavigationStack {
                JoinInvitationScanner { text in
                    let accepted = connection.readInvitation(text)
                    if accepted { scanning = false }
                    return accepted
                }.ignoresSafeArea(edges: .bottom)
                    .navigationTitle("Scan host invitation").navigationBarTitleDisplayMode(.inline)
                    .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { scanning = false } } }
            }.preferredColorScheme(.dark)
        }
        #endif
    }
}

#if APPCLIP
private struct JoinInvitationScanner: UIViewControllerRepresentable {
    let onCode: (String) -> Bool
    func makeUIViewController(context: Context) -> JoinQRScannerController { JoinQRScannerController(onCode: onCode) }
    func updateUIViewController(_ controller: JoinQRScannerController, context: Context) {}
    static func dismantleUIViewController(_ controller: JoinQRScannerController, coordinator: ()) { controller.stop() }
}

private final class JoinQRScannerController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    private let session = AVCaptureSession()
    private let queue = DispatchQueue(label: "HeyPals.invitation-camera")
    private let onCode: (String) -> Bool
    private let status = UILabel()
    private var preview: AVCaptureVideoPreviewLayer?
    private var configured = false, closed = false
    private var lastCode = "", lastRead = Date.distantPast
    init(onCode: @escaping (String) -> Bool) { self.onCode = onCode; super.init(nibName: nil, bundle: nil) }
    required init?(coder: NSCoder) { fatalError("init(coder:) unavailable") }
    override func viewDidLoad() {
        super.viewDidLoad(); view.backgroundColor = .black
        status.text = "Point your camera at the host’s App Clip QR."
        status.textColor = .white; status.numberOfLines = 0; status.textAlignment = .center
        status.font = .preferredFont(forTextStyle: .body); status.adjustsFontForContentSizeCategory = true
        status.backgroundColor = UIColor.black.withAlphaComponent(0.75); status.layer.cornerRadius = 16; status.clipsToBounds = true
        status.translatesAutoresizingMaskIntoConstraints = false; view.addSubview(status)
        NSLayoutConstraint.activate([status.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 24),
            status.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -24),
            status.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -24),
            status.heightAnchor.constraint(greaterThanOrEqualToConstant: 72)])
    }
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized: configure()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async {
                    guard let self, !self.closed else { return }
                    if granted { self.configure() } else { self.cameraUnavailable() }
                }
            }
        default: cameraUnavailable()
        }
    }
    override func viewDidLayoutSubviews() { super.viewDidLayoutSubviews(); preview?.frame = view.bounds }
    override func viewDidDisappear(_ animated: Bool) { super.viewDidDisappear(animated); stop() }
    func stop() { closed = true; queue.async { [session] in if session.isRunning { session.stopRunning() } } }
    private func cameraUnavailable() {
        status.text = "Camera access is unavailable. Allow Camera in Settings, or cancel and paste the host’s invitation link."
    }
    private func configure() {
        guard !configured, !closed else { return }; configured = true
        guard let device = AVCaptureDevice.default(for: .video), let input = try? AVCaptureDeviceInput(device: device) else { cameraUnavailable(); return }
        let output = AVCaptureMetadataOutput()
        session.beginConfiguration()
        guard session.canAddInput(input), session.canAddOutput(output) else { session.commitConfiguration(); cameraUnavailable(); return }
        session.addInput(input); session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: .main)
        guard output.availableMetadataObjectTypes.contains(.qr) else { session.commitConfiguration(); cameraUnavailable(); return }
        output.metadataObjectTypes = [.qr]; session.commitConfiguration()
        let preview = AVCaptureVideoPreviewLayer(session: session); preview.videoGravity = .resizeAspectFill
        self.preview = preview; view.layer.insertSublayer(preview, at: 0); preview.frame = view.bounds
        queue.async { [session] in session.startRunning() }
    }
    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard !closed, let text = metadataObjects.compactMap({ ($0 as? AVMetadataMachineReadableCodeObject)?.stringValue }).first else { return }
        // Invalid QRs remain readable; repeated frames do not spam state updates.
        if text == lastCode && Date().timeIntervalSince(lastRead) < 2 { return }
        lastCode = text; lastRead = Date()
        if onCode(text) { stop() }
        else { status.text = "That QR isn’t a valid HeyPals Wi-Fi invitation. Ask the host to show their current App Clip QR." }
    }
}
#endif
