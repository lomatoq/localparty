import Foundation
import CryptoKit

/*__ACTUAL_TYPES__*/

struct Fixture {
    let name: String
    var state: ServerState?
    var modelCatalog: [PartyGame]
    var savedCatalog: [PartyGame]
    var hasModel = true
    var menuReady = true
    var deliveryFailures = 0
    var payloadInFlight = false
    var holdReplies = false
    var replyAccepted = true
    var replyError = false
    var staleEpoch = false
    var ready = true
    var working = false
    var repeatPublish = false
    var coalescedUpdate = false
    var qrAddress = ""
    var wifiInviteAddress = ""
    var hasSingleScan = false
    var clipTVActive = false
    var withSurface = true
    var catalogError = "No bundled catalog: контроль"
    var expectedStateEncodes = 1
    var expectedBaselineCatalogEncodes = 1
    var expectedCandidateCatalogEncodes = 0
}

final class Model {
    var state: ServerState?
    var catalog: [PartyGame]
    var ready: Bool
    var working: Bool
    var externalDisplayCount: Int { state?.screens ?? 0 }
    var address: String { state?.urls.first ?? "" }
    var networkEnabled: Bool { state?.networkEnabled == true }
    var message: String? = "Добро пожаловать / hello 🕹️"
    var connectionStatus: String? = nil
    var backgroundStatus = "Во время игры держите приложение открытым"
    var buildLabel = "HeyPals · 1.0 (149)"
    var keepAwake = true
    var commands: [[String: Any]] = []
    init(_ f: Fixture) { state = f.state; catalog = f.modelCatalog; ready = f.ready; working = f.working }
    func command(_ value: [String: Any], reportFailure: Bool) { commands.append(["value": value, "reportFailure": reportFailure]) }
}
struct Surface { let displayMode = "external"; let displayAvailable = true }
struct MockError: Error {}
enum ContentWorld { case page }
final class Retry { var cancellations = 0; func cancel() { cancellations += 1 } }
final class MockMenu {
    var scripts: [String] = []
    var arguments: [[String: Any]] = []
    var callbacks: [(Result<Any, Error>) -> Void] = []
    var holdReplies = false
    var accepted = true
    var error = false
    var beforeReply: (() -> Void)?
    func callAsyncJavaScript(_ script: String, arguments value: [String: Any], in frame: Any?, in world: ContentWorld, completionHandler callback: @escaping (Result<Any, Error>) -> Void) {
        scripts.append(script); arguments.append(value)
        if holdReplies { callbacks.append(callback) } else { complete(callback) }
    }
    func complete(_ callback: (Result<Any, Error>) -> Void) {
        beforeReply?()
        if error { callback(.failure(MockError())) } else { callback(.success(accepted)) }
    }
    func flush() {
        holdReplies = false
        let pending = callbacks; callbacks = []
        for callback in pending { complete(callback) }
    }
}
struct BuildOutput { let data: Data; let payload: String }
class MockStore {
    var model: Model?
    var menuReady: Bool
    var deliveryFailures: Int
    var payloadInFlight: Bool
    var publishAgain = false
    var lastGoodCatalog: [PartyGame]
    var catalogError: String
    var qrAddress: String
    var qrData = "existing-QR"
    var wifiInviteAddress: String
    var wifiInviteQR = "WIFI:hello"
    var wifiInviteSSID = "Friday night 🏠"
    var singleScanURL: URL?
    var singleScanQR = ""
    var clipTestURL: URL? = URL(string: "https://example.invalid/test")
    var clipTestQR = "testQR"
    var clipTestTVActive: Bool
    var clipTestTVPublic = true
    var appClipBase: URL? = URL(string: "https://example.invalid/join")
    var hapticsEnabled = true
    let shellRevision = "ios-recovery-20260918.1"
    var surfaceController: Surface?
    var lastPayload = ""
    var deliveryEpoch = 14
    var payloadRetry: Retry? = Retry()
    var showingController = false
    var loadError: String? = "Old load error"
    let menu = MockMenu()
    var stateEncoderCalls = 0
    var catalogEncoderCalls = 0
    var decoderCalls = 0
    var qrCalls = 0
    var roomsCalls = 0
    var retryCalls = 0
    required init(_ f: Fixture) {
        model = f.hasModel ? Model(f) : nil
        menuReady = f.menuReady; deliveryFailures = f.deliveryFailures; payloadInFlight = f.payloadInFlight
        lastGoodCatalog = f.savedCatalog; catalogError = f.catalogError
        qrAddress = f.qrAddress; wifiInviteAddress = f.wifiInviteAddress
        singleScanURL = f.hasSingleScan ? URL(string: "https://example.invalid/single") : nil
        singleScanQR = f.hasSingleScan ? "SINGLE-QR" : ""
        clipTestTVActive = f.clipTVActive
        surfaceController = f.withSurface ? Surface() : nil
        menu.holdReplies = f.holdReplies; menu.accepted = f.replyAccepted; menu.error = f.replyError
        if f.staleEpoch { menu.beforeReply = { [weak self] in self?.deliveryEpoch += 1 } }
    }
    func publish() { fatalError("Source subclass required") }
    func build() -> BuildOutput? { fatalError("Uninstrumented source subclass required") }
    func publishRooms() { roomsCalls += 1 }
    func makeQR(_ address: String) -> String { qrCalls += 1; return "QR:" + address }
    func schedulePayloadRetry() { retryCalls += 1 }
    func encodeState(_ state: ServerState) throws -> Data { stateEncoderCalls += 1; return try JSONEncoder().encode(state) }
    func encodeCatalog(_ catalog: [PartyGame]) throws -> Data { catalogEncoderCalls += 1; return try JSONEncoder().encode(catalog) }
    func decodeObject(_ data: Data) throws -> Any { decoderCalls += 1; return try JSONSerialization.jsonObject(with: data) }
    func snapshot() throws -> [String: Any] {
        let saved = try JSONSerialization.jsonObject(with: JSONEncoder().encode(lastGoodCatalog))
        return ["savedCatalog": saved, "qrAddress": qrAddress, "qrData": qrData, "wifiQR": wifiInviteQR, "wifiSSID": wifiInviteSSID,
                "singleScanURL": singleScanURL?.absoluteString ?? "", "singleScanQR": singleScanQR, "clipURL": clipTestURL?.absoluteString ?? "",
                "clipQR": clipTestQR, "clipTVActive": clipTestTVActive, "clipTVPublic": clipTestTVPublic,
                "commands": model?.commands ?? [], "qrCalls": qrCalls, "roomsCalls": roomsCalls,
                "lastPayload": lastPayload, "payloadInFlight": payloadInFlight, "publishAgain": publishAgain,
                "deliveryFailures": deliveryFailures, "epoch": deliveryEpoch, "retries": retryCalls,
                "retryPresent": payloadRetry != nil, "loadError": loadError ?? "", "scripts": menu.scripts, "bridgeArguments": menu.arguments]
    }
}

/*__ACTUAL_PUBLISH_CLASSES__*/

/*__UNINSTRUMENTED_TIMED_CLASSES__*/

func fullState(_ catalog: [PartyGame], players count: Int, active: Bool, network: Bool = true) -> ServerState {
    let players = (0..<count).map { i in PartyPlayer(id: "player-\(i)", name: i % 2 == 0 ? "Александра \(i) 🥳" : "Zoë \(i)", gameReady: i % 2 == 0, connected: i % 3 != 0, testBot: i % 4 == 0, coins: i * 150) }
    let standing = players.enumerated().map { i, p in PartyStanding(id: p.id, name: p.name, played: i + 2, wins: i, points: 1234 - i, coins: i * 20) }
    let boardRows = players.enumerated().map { i, p in PartyTVBoardRow(id: p.id, name: p.name, rank: i + 1, score: Double(i) + 0.5, points: Double(i * 23), won: i == 0, coins: Double(i * 30), coinsEarned: Double(i)) }
    let tv = PartyTVPresentation(revision: 37, mode: active ? "match" : "menu", automatic: false,
        board: PartyTVBoard(key: "round249-board", kind: "leaderboard", title: "Our Top", subtitle: "Лучшие сегодня", rows: boardRows),
        focusId: catalog.first?.id, focusNumber: 2, focusRevision: 5, browse: true, total: catalog.count,
        canCover: true, hasMatch: active, hasCompany: !players.isEmpty, autoPodium: true, effects: true, idleBrowse: true)
    let current = active ? ActiveGame(id: catalog.first?.id ?? "push", instance: "full-state/249", ui: GameUI(phase: "playing", label: "Round — 2", progress: "2/5", hostActions: ["pause", "restart"]),
        session: GameSession(paused: false, readyIds: players.filter { $0.gameReady }.map { $0.id }, pauseReason: nil), startError: nil, roster: players, ready: players.map { $0.id }) : nil
    var settings: [String: [String: String]] = [:]
    for game in catalog { settings[game.id] = ["rounds": "5", "bots": "2", "name": "A/B • Комната 🦄"] }
    return ServerState(gameActivity: Dictionary(uniqueKeysWithValues: catalog.enumerated().map { i, g in (g.id, PartyGameActivity(matches: i, seconds: Double(i) * 43.125)) }),
        gamePopularity: Dictionary(uniqueKeysWithValues: catalog.enumerated().map { i, g in (g.id, i * 17) }),
        languageOverride: PartyLanguageOverride(language: "en", revision: "languages-249"), tv: tv, botCount: 2,
        bootId: "native-publish-249", incident: RoomIncident(id: "incident-249", at: 1791549509.625, message: "Возврат • réseau"),
        votes: players.enumerated().map { i, p in GameVote(playerId: p.id, gameId: catalog.isEmpty ? "push" : catalog[i % catalog.count].id) },
        enabled: true, networkEnabled: network, totalMatches: 143, leaderboard: standing, selected: catalog.first?.id,
        screens: 2, players: players, catalog: catalog, urls: ["http://192.168.0.125:8081/", "http://[::1]:8081/"], active: current,
        busy: false, executionAllowed: true, gameSettings: settings)
}
func fixtures(_ catalog: [PartyGame]) -> [Fixture] {
    var result: [Fixture] = []
    func append(_ name: String, _ state: ServerState?, model: [PartyGame]? = nil, saved: [PartyGame]? = nil, configure: (inout Fixture) -> Void = { _ in }) {
        var f = Fixture(name: name, state: state, modelCatalog: model ?? catalog, savedCatalog: saved ?? Array(catalog.suffix(2)))
        f.expectedStateEncodes = state == nil ? 0 : 1
        f.expectedCandidateCatalogEncodes = state?.catalog.isEmpty != false ? 1 : 0
        configure(&f); result.append(f)
    }
    for count in [0, 1, 4, 16] {
        append("full-menu-\(count)", fullState(catalog, players: count, active: false))
        append("full-active-\(count)", fullState(catalog, players: count, active: true))
    }
    var old = fullState(catalog, players: 1, active: false)
    old.gameActivity = nil; old.gamePopularity = nil; old.languageOverride = nil; old.tv = nil; old.botCount = nil; old.incident = nil
    append("old-server-optionals-nil", old)
    append("live-partial-not-model-or-saved", fullState(Array(catalog.prefix(3)), players: 4, active: true))
    let empty = fullState([], players: 4, active: false)
    append("empty-live-fallback-model", empty)
    append("empty-live-fallback-saved", empty, model: [])
    append("empty-all-catalogs", empty, model: [], saved: [])
    append("nil-state-fallback-model", nil)
    append("nil-state-fallback-saved", nil, model: [])
    append("nil-state-empty-all", nil, model: [], saved: [])
    var nan = fullState(catalog, players: 16, active: true)
    nan.gameActivity?[catalog[0].id]?.seconds = .nan
    append("state-encoding-failure-nan-live-catalog", nan) { $0.expectedCandidateCatalogEncodes = 1 }
    var inf = fullState(catalog, players: 4, active: true)
    inf.incident?.at = .infinity
    append("state-encoding-failure-infinite-incident", inf) { $0.expectedCandidateCatalogEncodes = 1 }
    var nanTV = fullState(catalog, players: 4, active: true)
    nanTV.tv?.board?.rows[0].score = .nan
    append("state-encoding-failure-nan-TV", nanTV) { $0.expectedCandidateCatalogEncodes = 1 }
    var failEmpty = empty
    failEmpty.gameActivity = ["missing-game": PartyGameActivity(matches: 1, seconds: .nan)]
    append("state-failure-empty-live-fallback-saved", failEmpty, model: [])
    append("native-reset-address-single-scan", fullState(catalog, players: 4, active: true)) { $0.hasSingleScan = true; $0.clipTVActive = true }
    append("native-reset-network-off", fullState(catalog, players: 4, active: true, network: false)) { $0.hasSingleScan = true; $0.wifiInviteAddress = $0.state!.urls[0] }
    append("native-retain-same-address-single-scan", fullState(catalog, players: 4, active: true)) { $0.qrAddress = $0.state!.urls[0]; $0.wifiInviteAddress = $0.state!.urls[0]; $0.hasSingleScan = true }
    append("native-surface-fallback-not-ready-working", empty) { $0.withSurface = false; $0.ready = false; $0.working = true }
    for gate in ["menu-not-ready", "failure-limit", "model-nil", "in-flight"] {
        append("gate-" + gate, fullState(catalog, players: 4, active: true)) {
            $0.expectedStateEncodes = 0; $0.expectedBaselineCatalogEncodes = 0; $0.expectedCandidateCatalogEncodes = 0
            if gate == "menu-not-ready" { $0.menuReady = false }
            if gate == "failure-limit" { $0.deliveryFailures = 6 }
            if gate == "model-nil" { $0.hasModel = false }
            if gate == "in-flight" { $0.payloadInFlight = true }
        }
    }
    append("delivery-rejected", fullState(catalog, players: 4, active: true)) { $0.replyAccepted = false }
    append("delivery-error", fullState(catalog, players: 4, active: true)) { $0.replyError = true }
    append("delivery-stale-epoch", fullState(catalog, players: 4, active: true)) { $0.staleEpoch = true }
    append("repeat-same-ACK-payload-suppressed", fullState(catalog, players: 4, active: true)) { $0.repeatPublish = true; $0.expectedStateEncodes = 2; $0.expectedBaselineCatalogEncodes = 2 }
    append("delivery-held-coalesces-latest", fullState(catalog, players: 4, active: true)) { $0.holdReplies = true; $0.coalescedUpdate = true; $0.expectedStateEncodes = 2; $0.expectedBaselineCatalogEncodes = 2 }
    return result
}
func run(_ store: MockStore, _ f: Fixture) {
    store.publish()
    if f.repeatPublish { store.publish() }
    if f.coalescedUpdate {
        store.model?.state?.players[0].name = "Updated while in flight 🎮"
        store.publish()
        store.menu.flush()
    }
}
func require(_ condition: @autoclosure () -> Bool, _ description: String) throws {
    if !condition() { throw NSError(domain: "NativeCatalog249Probe", code: 1, userInfo: [NSLocalizedDescriptionKey: description]) }
}
func digest(_ data: Data) -> String { SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined() }
func compare(_ f: Fixture) throws -> [String: Any] {
    let a = ProofBaseline(f), b = ProofCandidate(f)
    run(a, f); run(b, f)
    let aSnapshot = try a.snapshot(), bSnapshot = try b.snapshot()
    try require(NSDictionary(dictionary: aSnapshot).isEqual(to: bSnapshot), "\(f.name): complete dictionary / sideeffects differ")
    let ad = try JSONSerialization.data(withJSONObject: aSnapshot, options: [.sortedKeys])
    let bd = try JSONSerialization.data(withJSONObject: bSnapshot, options: [.sortedKeys])
    try require(ad == bd, "\(f.name): complete sortedKeys bytes differ")
    try require(a.stateEncoderCalls == f.expectedStateEncodes && b.stateEncoderCalls == f.expectedStateEncodes, "\(f.name): state encoder calls differ from expected")
    try require(a.catalogEncoderCalls == f.expectedBaselineCatalogEncodes && b.catalogEncoderCalls == f.expectedCandidateCatalogEncodes, "\(f.name): catalog encoder calls differ from expected")
    var payloads: [[String: Any]] = []
    for (aa, bb) in zip(a.menu.arguments, b.menu.arguments) {
        let ap = aa["payload"] as! String, bp = bb["payload"] as! String
        let apData = Data(ap.utf8), bpData = Data(bp.utf8)
        try require(apData == bpData, "\(f.name): complete delivered sortedKeys JSON bytes differ")
        let av = try JSONSerialization.jsonObject(with: apData) as! [String: Any]
        let bv = try JSONSerialization.jsonObject(with: bpData) as! [String: Any]
        try require(NSDictionary(dictionary: av).isEqual(to: bv), "\(f.name): delivered full dictionary differs")
        payloads.append(["bytes": apData.count, "sha256": digest(apData), "catalogCount": (av["catalog"] as? [Any])?.count ?? -1, "native": av["native"]!])
    }
    try require(a.menu.arguments.count == b.menu.arguments.count, "\(f.name): bridge delivery count differs")
    // Independent fallback gates. Candidate never infers success from a live
    // catalog alone: all failed full-state fixtures still build that catalog.
    if f.name.hasPrefix("state-encoding-failure-") {
        try require(a.catalogEncoderCalls == 1 && b.catalogEncoderCalls == 1 && payloads.count == 1, "Failed state must retain catalog fallback")
        let data = Data((a.menu.arguments[0]["payload"] as! String).utf8)
        let value = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        try require(value["bootId"] == nil && (value["catalog"] as! [Any]).count == f.state!.catalog.count, "Failed state must retain default body plus live catalog")
    }
    return ["name": f.name, "pass": true, "exactFullDictionary": true, "exactFullSortedKeysBytes": true,
            "snapshotSHA256": digest(ad), "stateEncoderCalls": [a.stateEncoderCalls, b.stateEncoderCalls],
            "catalogEncoderCalls": [a.catalogEncoderCalls, b.catalogEncoderCalls], "objectDecodes": [a.decoderCalls, b.decoderCalls],
            "payloads": payloads, "bridgeCount": a.menu.arguments.count, "roomsCalls": a.roomsCalls]
}

func timedBatch(_ type: MockStore.Type, fixture: Fixture, operations: Int) throws -> (Double, Int) {
    let store = type.init(fixture)
    var retained = Array<BuildOutput?>(repeating: nil, count: operations)
    let start = ProcessInfo.processInfo.systemUptime
    for i in 0..<operations { retained[i] = store.build() }
    let milliseconds = (ProcessInfo.processInfo.systemUptime - start) * 1000
    // Assertions, checksums, JSON decode, setup/release remain outside timer.
    var bytes = 0
    for output in retained {
        try require(output != nil, "Timed output missing")
        bytes += output!.data.count + output!.payload.utf8.count
    }
    return (milliseconds / Double(operations), bytes)
}
func benchmark(_ catalog: [PartyGame]) throws -> [[String: Any]] {
    var rows: [[String: Any]] = []
    let timedFixtures = [Fixture(name: "menu36", state: fullState(catalog, players: 0, active: false), modelCatalog: catalog, savedCatalog: catalog),
                         Fixture(name: "active36-16players", state: fullState(catalog, players: 16, active: true), modelCatalog: catalog, savedCatalog: catalog),
                         Fixture(name: "empty-live-fallback-control", state: fullState([], players: 4, active: false), modelCatalog: catalog, savedCatalog: catalog)]
    for initialFixture in timedFixtures {
        var fixture = initialFixture
        fixture.qrAddress = fixture.state!.urls[0]
        fixture.wifiInviteAddress = fixture.state!.urls[0]
        let preA = TimedBaseline(fixture), preB = TimedCandidate(fixture)
        let aOutput = preA.build(), bOutput = preB.build()
        try require(aOutput?.data == bOutput?.data && aOutput?.payload == bOutput?.payload && aOutput != nil, "Uninstrumented timed full output differs")
        try require(preA.stateEncoderCalls == 0 && preB.stateEncoderCalls == 0 && preA.catalogEncoderCalls == 0 && preB.catalogEncoderCalls == 0 && preA.decoderCalls == 0 && preB.decoderCalls == 0 && preA.qrCalls == 0 && preB.qrCalls == 0, "Timed functions must contain no encoder/decode/QR instrumentation")
        let coldA = try timedBatch(TimedBaseline.self, fixture: fixture, operations: 1)
        let coldB = try timedBatch(TimedCandidate.self, fixture: fixture, operations: 1)
        rows.append(["fixture": fixture.name, "kind": "first-observed-order-uncontrolled", "baselineMS": coldA.0, "candidateMS": coldB.0, "byteChecksum": [coldA.1, coldB.1]])
        _ = try timedBatch(TimedCandidate.self, fixture: fixture, operations: 4)
        _ = try timedBatch(TimedBaseline.self, fixture: fixture, operations: 4)
        for block in 0..<8 {
            for (position, variant) in ["A", "B", "B", "A"].enumerated() {
                let sample = try timedBatch(variant == "A" ? TimedBaseline.self : TimedCandidate.self, fixture: fixture, operations: 16)
                rows.append(["fixture": fixture.name, "kind": "warm-balanced-ABBA", "block": block, "position": position, "variant": variant, "msPerOperation": sample.0, "operations": 16, "byteChecksum": sample.1])
            }
        }
    }
    return rows
}

@main struct NativeCatalog249Probe {
    static func main() {
        let args = CommandLine.arguments
        guard args.count == 3 else { fputs("Usage: probe native-catalog.json result.json\n", stderr); exit(2) }
        var result: [String: Any] = ["pass": false, "probe": "native-catalog249", "runtime": ProcessInfo.processInfo.operatingSystemVersionString,
                                   "scope": "Foundation exact source builder, no UIKit/WebKit/cast speed claim", "cases": []]
        do {
            let catalogData = try Data(contentsOf: URL(fileURLWithPath: args[1]))
            let catalog = try JSONDecoder().decode([PartyGame].self, from: catalogData)
            try require(catalog.count == 36 && Set(catalog.map { $0.id }).count == 36, "Actual bundled catalog must have36 unique games")
            result["catalogCount"] = catalog.count; result["catalogSHA256"] = digest(catalogData)
            let planned = fixtures(catalog)
            result["plannedCases"] = planned.map { $0.name }
            var cases: [[String: Any]] = []
            for fixture in planned {
                cases.append(try compare(fixture))
                result["cases"] = cases
                result["caseCount"] = cases.count
            }
            result["timing"] = try benchmark(catalog)
            result["pass"] = true
        } catch { result["error"] = error.localizedDescription }
        do {
            let data = try JSONSerialization.data(withJSONObject: result, options: [.sortedKeys, .prettyPrinted])
            try data.write(to: URL(fileURLWithPath: args[2]))
        } catch { fputs("Could not write probe result: \(error)\n", stderr); exit(2) }
        if result["pass"] as? Bool != true { fputs("Proof failed: \(result["error"] ?? "unknown")\n", stderr); exit(1) }
        print("Foundation source proof passed; see \(args[2])")
    }
}
