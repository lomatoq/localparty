import Foundation

// Credentials are carried by the invitation, never read from the iOS keychain.
// Do not log, persist, or include this payload in diagnostics.
struct JoinInvitation: Codable, Equatable {
    let version: Int
    let ssid: String
    let password: String
    let security: String
    let room: String

    var roomURL: URL? {
        guard let c = URLComponents(string: room), c.scheme == "https", c.user == nil,
              c.password == nil, c.query == nil, c.fragment == nil,
              c.path == "/" || c.path == "", let host = c.host?.lowercased(),
              host.hasSuffix(".lancert.dev") || host.hasSuffix(".local") || Self.isPrivateIPv4(host)
        else { return nil }
        return c.url
    }
    var isValid: Bool {
        guard version == 1, roomURL != nil, !ssid.isEmpty, ssid.utf8.count <= 32,
              !ssid.unicodeScalars.contains(where: { CharacterSet.controlCharacters.contains($0) }),
              ["WPA", "nopass"].contains(security) else { return false }
        if security == "nopass" { return password.isEmpty }
        // NEHotspotConfiguration accepts an 8–63 character WPA passphrase.
        return (8...63).contains(password.utf8.count) &&
            !password.unicodeScalars.contains(where: { CharacterSet.controlCharacters.contains($0) })
    }
    func url(base: URL) -> URL? {
        guard isValid, var c = URLComponents(url: base, resolvingAgainstBaseURL: false),
              c.scheme == "https", c.host == "appclip.apple.com", c.path == "/id",
              c.user == nil, c.password == nil, c.fragment == nil,
              let identifier = c.queryItems?.first(where: { $0.name == "p" })?.value,
              !identifier.isEmpty,
              let data = try? JSONEncoder().encode(self) else { return nil }
        let payload = data.base64EncodedString().replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
        c.queryItems = [URLQueryItem(name: "p", value: identifier), URLQueryItem(name: "join", value: payload)]
        return c.url
    }
    static func decode(_ url: URL, clipBundleID: String) -> JoinInvitation? {
        guard let c = URLComponents(url: url, resolvingAgainstBaseURL: false),
              c.scheme == "https", c.host == "appclip.apple.com", c.path == "/id",
              c.user == nil, c.password == nil, c.fragment == nil,
              c.queryItems?.filter({ $0.name == "p" }).count == 1,
              c.queryItems?.first(where: { $0.name == "p" })?.value == clipBundleID,
              c.queryItems?.filter({ $0.name == "join" }).count == 1,
              var payload = c.queryItems?.first(where: { $0.name == "join" })?.value,
              payload.utf8.count <= 2048,
              payload.allSatisfy({ $0.isASCII && ($0.isLetter || $0.isNumber || $0 == "-" || $0 == "_") })
        else { return nil }
        payload = payload.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        payload += String(repeating: "=", count: (4 - payload.count % 4) % 4)
        guard let data = Data(base64Encoded: payload),
              let invitation = try? JSONDecoder().decode(JoinInvitation.self, from: data), invitation.isValid else { return nil }
        return invitation
    }
    private static func isPrivateIPv4(_ host: String) -> Bool {
        let parts = host.split(separator: ".", omittingEmptySubsequences: false)
        guard parts.count == 4 else { return false }
        let bytes = parts.compactMap { UInt8($0) }
        guard bytes.count == 4 else { return false }
        return bytes[0] == 10 || (bytes[0] == 192 && bytes[1] == 168) ||
            (bytes[0] == 172 && (16...31).contains(bytes[1]))
    }
}
