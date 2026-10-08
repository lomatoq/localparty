import Foundation
import UIKit

struct NearbyRoom: Codable, Equatable, Identifiable {
    let id: String
    let name: String
    let url: String
    let game: String
    let phase: String
    let players: Int
}

// Discovery carries only public room metadata. Never advertise Wi-Fi credentials,
// admin tokens or the loopback listener. All callbacks run on the main run loop.
@MainActor final class NearbyRooms: NSObject, @preconcurrency NetServiceBrowserDelegate, @preconcurrency NetServiceDelegate {
    var onChange: (([NearbyRoom]) -> Void)?
    private let browser = NetServiceBrowser()
    private var browsing = false
    private var published: NetService?
    private var publishedURL = ""
    private var lastTXT: Data?
    private var services: [String: NetService] = [:]
    private var rooms: [String: NearbyRoom] = [:]
    private var heartbeat: Timer?
    private var seen: [String: Date] = [:]
    private let identifier: String = {
        let key = "HeyPals.roomDiscoveryID"
        if let value = UserDefaults.standard.string(forKey: key) { return value }
        let value = UUID().uuidString
        UserDefaults.standard.set(value, forKey: key)
        return value
    }()
    override init() { super.init(); browser.delegate = self }

    static var ownName: String {
        UserDefaults.standard.string(forKey: "HeyPals.roomDisplayName") ?? String(UIDevice.current.name.prefix(48))
    }
    static func saveOwnName(_ value: String) -> String? {
        let name = value.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }.joined(separator: " ")
        guard !name.isEmpty, name.count <= 48, !name.unicodeScalars.contains(where: { CharacterSet.controlCharacters.contains($0) }) else { return nil }
        UserDefaults.standard.set(name, forKey: "HeyPals.roomDisplayName")
        return name
    }
    func update(state: ServerState?, foreground: Bool) {
        guard foreground else { stop(); return }
        if !browsing {
            browsing = true
            browser.searchForServices(ofType: "_localparty._tcp.", inDomain: "local.")
            heartbeat = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in
                Task { @MainActor in
                guard let self else { return }
                if let txt = self.lastTXT {
                    var values = Self.txtValues(txt)
                    values["tick"] = Data(String(Int(Date().timeIntervalSince1970)).utf8)
                    self.published?.setTXTRecord(NetService.data(fromTXTRecord: values))
                }
                self.expire()
                }
            }
        }
        guard let state, state.networkEnabled, let address = state.urls.first,
              let url = Self.roomURL(address) else { stopPublishing(); return }
        if publishedURL != address || published == nil {
            stopPublishing()
            let service = NetService(domain: "local.", type: "_localparty._tcp.",
                                     name: "HeyPals-" + identifier, port: Int32(url.port ?? 443))
            published = service; publishedURL = address; service.delegate = self
            service.publish()
        }
        let game = state.catalog.first { $0.id == state.active?.id }?.title ?? ""
        let values = ["v": "1", "id": identifier, "url": address,
                      "name": Self.ownName, "game": String(game.prefix(60)),
                      "phase": state.active?.ui.phase ?? "lobby", "players": String(state.players.count)]
        let record = NetService.data(fromTXTRecord: values.mapValues { Data($0.utf8) })
        // Periodic renewal lets clients discard crashed/disconnected hosts even
        // when a router misses the Bonjour goodbye packet.
        if lastTXT != record { lastTXT = record; published?.setTXTRecord(record) }
    }

    private func stopPublishing() {
        published?.stop(); published = nil; publishedURL = ""; lastTXT = nil
    }
    private func stop() {
        stopPublishing(); heartbeat?.invalidate(); heartbeat = nil
        browser.stop(); browsing = false
        for service in services.values { service.stopMonitoring(); service.stop() }
        services.removeAll(); rooms.removeAll(); seen.removeAll(); emit()
    }
    private func emit() {
        // Bonjour can briefly retain both interfaces during an address change.
        let unique = Dictionary(rooms.values.map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
        onChange?(unique.values.sorted { ($0.name, $0.id) < ($1.name, $1.id) })
    }
    private func expire() {
        let stale = seen.filter { Date().timeIntervalSince($0.value) > 18 }.map(\.key)
        for key in stale { rooms.removeValue(forKey: key); seen.removeValue(forKey: key) }
        if !stale.isEmpty { emit() }
        // Monitoring can coalesce unchanged TXT records. Re-resolve periodically
        // instead of requiring an unchanged TXT update to arrive as an event.
        for service in services.values { service.resolve(withTimeout: 3) }
    }
    private func key(_ service: NetService) -> String { service.domain + service.type + service.name }
    func netServiceBrowser(_ browser: NetServiceBrowser, didFind service: NetService, moreComing: Bool) {
        guard services.count < 32 else { return }
        let key = key(service); services[key] = service
        service.delegate = self; service.startMonitoring(); service.resolve(withTimeout: 3)
    }
    func netServiceBrowser(_ browser: NetServiceBrowser, didRemove service: NetService, moreComing: Bool) {
        let key = key(service)
        services.removeValue(forKey: key)?.stopMonitoring()
        rooms.removeValue(forKey: key); seen.removeValue(forKey: key); emit()
    }
    func netServiceDidResolveAddress(_ sender: NetService) {
        if let data = sender.txtRecordData() { accept(sender, data: data) }
    }
    func netService(_ sender: NetService, didUpdateTXTRecord data: Data) { accept(sender, data: data) }
    private func accept(_ service: NetService, data: Data) {
        guard data.count <= 2048, services[key(service)] === service else { return }
        let values = Self.txtValues(data).compactMapValues { String(data: $0, encoding: .utf8) }
        guard values["v"] == "1", let id = values["id"], UUID(uuidString: id) != nil, id != identifier,
              let address = values["url"], let url = Self.roomURL(address),
              (url.port ?? 443) == service.port else { return }
        let key = key(service)
        let room = NearbyRoom(id: id, name: String((values["name"] ?? "HeyPals").prefix(48)), url: url.absoluteString,
                              game: String((values["game"] ?? "").prefix(60)), phase: String((values["phase"] ?? "lobby").prefix(32)),
                              players: min(16, max(0, Int(values["players"] ?? "0") ?? 0)))
        seen[key] = Date()
        if rooms[key] != room { rooms[key] = room; emit() }
    }
    private static func txtValues(_ data: Data) -> [String: Data] {
        // Foundation's typed TXT dictionary can trap on key-only entries (NSNull).
        // Bonjour is untrusted input: parse length-prefixed entries without casting.
        let bytes = Array(data); var offset = 0; var result: [String: Data] = [:]
        while offset < bytes.count {
            let count = Int(bytes[offset]); offset += 1
            guard offset + count <= bytes.count else { return [:] }
            let field = Array(bytes[offset..<(offset + count)]); offset += count
            guard let equal = field.firstIndex(of: 61), equal > 0,
                  let key = String(bytes: field[..<equal], encoding: .ascii), result[key] == nil else { continue }
            result[key] = Data(field[(equal + 1)...])
        }
        return result
    }
    static func roomURL(_ value: String) -> URL? {
        // Reuse invitation restrictions: HTTPS, known LAN host, no credentials,
        // query, fragment or arbitrary path. Discovery never disables TLS checks.
        JoinInvitation(version: 1, ssid: "", password: "", security: "nopass", room: value).roomURL
    }
}
