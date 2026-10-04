import SwiftUI

@main struct HeyPalsJoinApp: App {
    @StateObject private var connection = JoinConnection()
    var body: some Scene {
        WindowGroup {
            JoinConnectionView(connection: connection)
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
                    if let url = activity.webpageURL { receive(url) }
                }
                .onOpenURL { receive($0) }
                .onAppear {
                    #if DEBUG
                    // Simulator UI fixture only; never used by a release invitation.
                    if let text = ProcessInfo.processInfo.environment["HP_JOIN_PREVIEW_URL"], let url = URL(string: text) { receive(url) }
                    #endif
                }
        }
    }
    private func receive(_ url: URL) {
        connection.receive(url, clipBundleID: Bundle.main.bundleIdentifier ?? "")
    }
}
