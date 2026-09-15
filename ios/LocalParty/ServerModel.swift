import SwiftUI
import BackgroundTasks
import OSLog
import ImageIO

struct HostOption: Codable, Hashable { var value: String; var label: String }
struct HostSetting: Codable, Hashable, Identifiable { var id: String; var label: String; var options: [HostOption]; var initial: String }
struct HostAction: Codable, Hashable, Identifiable { var id: String; var label: String; var phases: [String] }
struct HostControls: Codable, Hashable { var settings: [HostSetting]; var actions: [HostAction] }
struct PartyGame: Codable, Identifiable, Hashable {
    var id: String; var title: String; var description: String; var controls: String
    var artwork: String?
    var hostControls: HostControls?
    var min: Int; var max: Int; var color: String; var section: String; var goal: String?; var win: String?
}
struct PartyPlayer: Equatable, Codable, Identifiable { var id: String; var name: String; var gameReady: Bool }
struct GameUI: Equatable, Codable { var phase: String; var label: String?; var progress: String?; var hostActions: [String]? }
struct GameSession: Equatable, Codable { var paused: Bool; var readyIds: [String]; var pauseReason: String? }
struct ActiveGame: Equatable, Codable { var id: String; var instance: String; var ui: GameUI; var session: GameSession?; var startError: String? }
struct RoomIncident: Equatable, Codable {var id:String;var at:Double;var message:String}
struct GameVote: Equatable, Codable {var playerId:String;var gameId:String}
struct PartyStanding: Equatable, Codable, Identifiable {var id:String;var name:String;var played:Int;var wins:Int;var points:Int}
struct ServerState: Equatable, Codable {
    var bootId:String;var incident:RoomIncident?;var votes:[GameVote]
    var enabled: Bool; var networkEnabled:Bool; var totalMatches:Int; var leaderboard:[PartyStanding]; var selected: String?; var screens: Int; var players: [PartyPlayer]
    var catalog: [PartyGame]; var urls: [String]; var active: ActiveGame?; var busy: Bool
    var executionAllowed: Bool; var gameSettings: [String:[String:String]]
}
@MainActor final class ServerModel: ObservableObject {
    // Both scenes must share the same embedded Node server and room.
    static let shared = ServerModel()
    @Published private(set) var externalDisplayCount = 0
    @Published var externalDisplayReload = 0
    private var externalDisplaySessions = Set<String>()
    @Published var state: ServerState?
    @Published var catalog: [PartyGame] = []
    @Published var message: String?
    @Published var backgroundStatus = "Во время игры держите приложение открытым"
    @Published var ready = false
    @Published var working = false
    @Published var settings: [String:[String:String]] = [:]
    @Published var connectionStatus: String?
    @Published var keepAwake = true { didSet { updateIdleTimer() } }
    private let background = MatchBackgroundExecution()
    private let artworkCache=NSCache<NSString,UIImage>()
    private let key: String = {
        #if targetEnvironment(simulator)
        if let value=ProcessInfo.processInfo.environment["PARTY_TEST_KEY"] { return value }
        #endif
        return UUID().uuidString + UUID().uuidString
    }()
    private var phase: ScenePhase = .active
    private var port = 8081
    private let portFile: URL
    private let diagnosticsQueue = DispatchQueue(label: "party.diagnostics", qos: .utility)
    private let diagnosticsFile: URL
    private var policyRevision = 0
    private var commandRevision = 0
    private var commandTail: Task<Void,Never>?
    private var pendingCommands = 0
    private var lastEnabled = false
    private var observedBoot: String?
    private var recordedIncident: String?
    private var connectionFailures=0
    private var memoryObserver: NSObjectProtocol?
    var diagnosticsURL: URL { diagnosticsFile }
    func votes(for game:PartyGame)->Int {state?.votes.filter {$0.gameId == game.id}.count ?? 0}
    var buildLabel: String { "LocalParty · \(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "?") (\(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "?"))" }
    var enabled: Bool { state?.enabled == true }
    var networkEnabled: Bool { state?.networkEnabled == true }
    var selected: PartyGame? { catalog.first { $0.id == state?.selected } }
    var active: PartyGame? { catalog.first { $0.id == state?.active?.id } }
    var address: String { state?.urls.first ?? "" }
    var controllerURL: URL {URL(string:"http://127.0.0.1:\(port)/play")!}
    var externalDisplayURL: URL {URL(string:"http://127.0.0.1:\(port)/tv")!}
    var tvAddress: String { address.isEmpty ? "" : address + "tv" }
    var canLaunch: Bool { ready && enabled && !working && state?.busy != true && (state?.screens ?? 0)>0 && selected != nil && (state?.players.count ?? 0) >= (selected?.min ?? 1) && (state?.players.count ?? 0) <= (selected?.max ?? 16) }
    var launchHint: String {
        guard ready else { return "Подготавливаем комнату…" }
        if state?.busy == true { return "Подготавливаем игру…" }
        if state?.screens == 0 { return "Подключите общий экран в разделе «Комната»" }
        guard let game=selected else { return "Выберите игру" }
        let count=state?.players.count ?? 0
        return count<game.min ? "Нужно ещё \(game.min-count) игроков" : count>game.max ? "В этой игре максимум \(game.max) игроков" : "После запуска каждый нажимает «Я готов» на своём пульте"
    }
    func externalDisplayConnected(_ identifier:String) {
        externalDisplaySessions.insert(identifier)
        externalDisplayCount=externalDisplaySessions.count
        updateIdleTimer()
    }
    func externalDisplayDisconnected(_ identifier:String) {
        externalDisplaySessions.remove(identifier)
        externalDisplayCount=externalDisplaySessions.count
        updateIdleTimer()
    }
    private func updateIdleTimer() {
        UIApplication.shared.isIdleTimerDisabled=enabled && (keepAwake || externalDisplayCount > 0)
    }
    init() {
        artworkCache.totalCostLimit=16*1024*1024
        let directory=FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("LocalParty",isDirectory:true)
        try? FileManager.default.createDirectory(at:directory,withIntermediateDirectories:true)
        try? FileManager.default.setAttributes([.protectionKey:FileProtectionType.completeUntilFirstUserAuthentication],ofItemAtPath:directory.path)
        diagnosticsFile=directory.appendingPathComponent("lifecycle.log")
        portFile=directory.appendingPathComponent("runtime-port")
        record("launch " + buildLabel)
        memoryObserver=NotificationCenter.default.addObserver(forName:UIApplication.didReceiveMemoryWarningNotification,object:nil,queue:.main) { [weak self] _ in Task { @MainActor in self?.artworkCache.removeAllObjects();self?.record("memory-warning: artwork cache cleared") } }
        try? FileManager.default.removeItem(at:portFile)
        let script=Bundle.main.url(forResource:"bootstrap",withExtension:"cjs",subdirectory:"Server")!
        if let url=Bundle.main.url(forResource:"native-catalog",withExtension:"json",subdirectory:"Server"), let data=try? Data(contentsOf:url) { catalog=(try? JSONDecoder().decode([PartyGame].self,from:data)) ?? [] }
        let config:[String:String]=["PARTY_ADMIN_KEY":key,"PARTY_DATA_FILE":directory.appendingPathComponent("party.json").path,"PARTY_PORT_FILE":portFile.path]
        let json=String(data:try! JSONSerialization.data(withJSONObject:config),encoding:.utf8)!
        NodeBridge.startServer(script.path,configuration:json)
        background.onDiagnostic={ [weak self] event in self?.record(event) }
        background.onChange={ [weak self] in guard let self else { return }; self.backgroundStatus=self.background.message; self.record("background: " + self.background.message); self.applyExecutionPolicy() }
        Task { [weak self] in
            while !Task.isCancelled {
                guard let self else { return }
                await self.refresh()
                try? await Task.sleep(for:.milliseconds(900))
            }
        }
    }
    private func request(_ command: [String:Any]? = nil) async throws -> ServerState {
        if let text=try? String(contentsOf:portFile,encoding:.utf8),let value=Int(text.trimmingCharacters(in:.whitespacesAndNewlines)) { port=value }
        var req=URLRequest(url:URL(string:"http://127.0.0.1:\(port)/api/manage")!)
        req.timeoutInterval=command?["type"] as? String == "launch" ? 75 : 3
        req.setValue("Bearer "+key,forHTTPHeaderField:"Authorization")
        if let command { req.httpMethod="POST";req.setValue("application/json",forHTTPHeaderField:"Content-Type");req.httpBody=try JSONSerialization.data(withJSONObject:command) }
        let (data,response)=try await URLSession.shared.data(for:req)
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            let json=(try? JSONSerialization.jsonObject(with:data)) as? [String:Any]
            throw NSError(domain:"LocalParty",code:1,userInfo:[NSLocalizedDescriptionKey:json?["error"] as? String ?? "Сервер не ответил"])
        }
        return try JSONDecoder().decode(ServerState.self,from:data)
    }
    private func refresh() async {
        guard !working else {return}
        let expectedCommand=commandRevision, expectedPolicy=policyRevision
        do { let next=try await request()
            guard !working, commandRevision == expectedCommand, policyRevision == expectedPolicy else {return}
            // Polling is a health check, not a reason to redraw both SwiftUI scenes.
            if state != next { state=next }
            if !ready { ready=true }
            connectionFailures=0
            if connectionStatus != nil { connectionStatus=nil }
            if catalog != next.catalog { catalog=next.catalog }
            if !working && settings != next.gameSettings { settings=next.gameSettings }
            if let incident=next.incident, recordedIncident != incident.id {recordedIncident=incident.id;record("incident: " + incident.message)}
            if observedBoot != next.bootId {
                observedBoot=next.bootId
                if next.enabled && phase == .active {lastEnabled=true;updateIdleTimer();applyExecutionPolicy()}
            }
            if lastEnabled && !next.enabled { background.finish();UIApplication.shared.isIdleTimerDisabled=false }
            lastEnabled=next.enabled
        } catch {guard !working, commandRevision == expectedCommand, policyRevision == expectedPolicy else {return};if ready {record("server-unreachable: " + error.localizedDescription)};connectionFailures += 1;if connectionFailures>=5 {connectionStatus="Подключаем комнату заново…";ready=false} }
    }
    func command(_ value:[String:Any]) {
        // Preserve ordering when selection, settings and launch are tapped quickly.
        let previous=commandTail
        commandRevision += 1;pendingCommands += 1;working=true;message=nil
        commandTail=Task { [weak self] in
            await previous?.value
            guard let self else { return }
            do {
                state=try await request(value);message=nil
                if value["type"] as? String == "network-set" {if !networkEnabled {background.finish()};updateIdleTimer();applyExecutionPolicy()}
                record("command: " + (value["type"] as? String ?? "?"))
            } catch {
                if (error as NSError).domain == NSURLErrorDomain {message="Действие не выполнено. Комната переподключается — попробуйте ещё раз."}
                else {message=error.localizedDescription}
                if value["type"] as? String == "network-set", !networkEnabled {background.finish()}
                record("command failed: " + error.localizedDescription)
            }
            pendingCommands -= 1;working=pendingCommands>0
        }
    }
    func select(_ game:PartyGame) {guard ready else {return};command(["type":"select","id":game.id]) }
    func setting(_ field:HostSetting, game:PartyGame) -> String { settings[game.id]?[field.id] ?? field.initial }
    func setSetting(_ value:String, field:HostSetting, game:PartyGame) {
        var values=settings[game.id] ?? Dictionary(uniqueKeysWithValues:(game.hostControls?.settings ?? []).map {($0.id,$0.initial)})
        values[field.id]=value;settings[game.id]=values
        command(["type":"settings","id":game.id,"settings":values])
    }
    func setNetworkEnabled(_ value:Bool) {
        guard ready, !working else {return}
        // Only request extended execution from an explicit sharing gesture.
        if value {background.start(source:"wifi-sharing")}
        command(["type":"network-set","enabled":value])
    }
    func requestBackground() { guard enabled, phase == .active else {return};background.start(source:"manual-retry") }
    func sceneChanged(_ value:ScenePhase) {
        phase=value;record("scene=\(value) grant=\(background.isRunning) enabled=\(enabled)")
        applyExecutionPolicy()
    }
    func recordDisplayPerformance(_ stats: [String: Any]) {
        let fields = ["surface", "path", "fps", "p95", "max", "over50", "over100", "frames"]
        let summary = fields.compactMap { key -> String? in
            guard let value = stats[key] else { return nil }
            return "\(key)=\(String(describing: value).prefix(100))"
        }.joined(separator: " ")
        record("tv-frames " + summary)
    }

    private func record(_ event:String) {
        let line="\(ISO8601DateFormatter().string(from:Date())) \(event)\n"
        guard let data=line.data(using:.utf8) else {return}
        let file=diagnosticsFile
        // Diagnostic writes must not block the phone / external scene's main thread.
        diagnosticsQueue.async {
            if let size=(try? FileManager.default.attributesOfItem(atPath:file.path)[.size]) as? NSNumber, size.intValue > 128*1024 {try? FileManager.default.removeItem(at:file)}
            if !FileManager.default.fileExists(atPath:file.path) {FileManager.default.createFile(atPath:file.path,contents:nil,attributes:[.protectionKey:FileProtectionType.completeUntilFirstUserAuthentication])}
            if let handle=try? FileHandle(forWritingTo:file) {defer {try? handle.close()};_ = try? handle.seekToEnd();try? handle.write(contentsOf:data)}
        }
    }

    private func applyExecutionPolicy() {
        guard enabled else {return}
        policyRevision += 1
        let revision=policyRevision
        let allowed=phase != .background || background.canExecute
        if !allowed {
            // The expiration handler must pause the worker before completing the OS grant.
            var req=URLRequest(url:URL(string:"http://127.0.0.1:\(port)/api/manage")!)
            req.httpMethod="POST";req.timeoutInterval=0.6
            req.setValue("Bearer "+key,forHTTPHeaderField:"Authorization")
            req.setValue("application/json",forHTTPHeaderField:"Content-Type")
            req.httpBody=try? JSONSerialization.data(withJSONObject:["type":"execution","allowed":false,"revision":revision])
            let done=DispatchSemaphore(value:0)
            let call=URLSession.shared.dataTask(with:req) { _,_,_ in done.signal() }
            call.resume()
            if done.wait(timeout:.now()+0.45) == .timedOut { call.cancel() }
            return
        }
        Task {
            guard policyRevision == revision else {return}
            do {_ = try await request(["type":"execution","allowed":true,"revision":revision])}
            catch {record("execution policy pending: " + error.localizedDescription)}
        }
    }
    func image(_ game:PartyGame) -> UIImage? {
        let name=game.artwork ?? ((game.id == "tankarena" ? "tankarena-hd" : game.id) + ".webp")
        if let cached=artworkCache.object(forKey:name as NSString) {return cached}
        guard let url=Bundle.main.url(forResource:name,withExtension:nil,subdirectory:"Server/public/assets/games"),
              let source=CGImageSourceCreateWithURL(url as CFURL,nil),
              let thumbnail=CGImageSourceCreateThumbnailAtIndex(source,0,[kCGImageSourceCreateThumbnailFromImageAlways:true,kCGImageSourceThumbnailMaxPixelSize:640,kCGImageSourceShouldCacheImmediately:true] as CFDictionary) else {return nil}
        let image=UIImage(cgImage:thumbnail)
        artworkCache.setObject(image,forKey:name as NSString,cost:thumbnail.bytesPerRow*thumbnail.height)
        return image
    }
}

@MainActor private final class MatchBackgroundExecution {
    var onChange: (() -> Void)?
    var onDiagnostic: ((String) -> Void)?
    private(set) var message = "Во время игры держите приложение открытым"
    private(set) var isRequesting = false
    var isRunning: Bool { task != nil }
    var canExecute: Bool { isRunning || handoff != .invalid }
    private var task: BGTask?
    private var identifier: String?
    private var completion: BackgroundTaskCompletion?
    private var timeout: DispatchWorkItem?
    private var monitor: DispatchSourceTimer?
    private var handoff: UIBackgroundTaskIdentifier = .invalid
    private let log = Logger(subsystem: Bundle.main.bundleIdentifier ?? "LocalParty", category: "BackgroundMatch")

    func start(source:String) {
        guard !isRunning, !isRequesting else {return}
        guard #available(iOS 26.0, *) else {announce("Фон доступен на iOS 26 и новее");return}
        #if targetEnvironment(simulator)
        announce("Симулятор: разрешение на длительный фон доступно только на iPhone")
        return
        #else
        let attempt=(Bundle.main.bundleIdentifier ?? "com.localparty.launcher") + ".match." + UUID().uuidString
        identifier=attempt;isRequesting=true
        onDiagnostic?("background-request id=\(attempt) source=\(source)")
        log.notice("Request background \(attempt, privacy:.public)")
        handoff=UIApplication.shared.beginBackgroundTask(withName:"Запуск сервера") { [weak self] in
            guard self?.identifier == attempt else {return}
            self?.finish(message:"Откройте приложение для восстановления фоновой работы")
        }
        announce("Подключаем фоновый режим…")
        let registered=BGTaskScheduler.shared.register(forTaskWithIdentifier:attempt,using:.main) { [weak self] incoming in
                guard let self, self.identifier == attempt, self.isRequesting, let continued=incoming as? BGContinuedProcessingTask else {incoming.setTaskCompleted(success:true);return}
                self.timeout?.cancel();self.timeout=nil;self.task=continued;self.isRequesting=false
                let completion=BackgroundTaskCompletion {continued.setTaskCompleted(success:true)}
                self.completion=completion
                continued.expirationHandler={ [weak self] in
                    // Acknowledge immediately; never wait on SwiftUI or HTTP to finish the OS task.
                    completion.finish()
                    DispatchQueue.main.async { [weak self] in
                        guard self?.identifier == attempt else {return}
                        self?.finish(message:"iOS завершила фоновую сессию. Сервер работает при открытом приложении. Новый запрос фона — только по кнопке ниже.")
                    }
                }
                self.onDiagnostic?("background-granted id=\(attempt) work=\(NodeBridge.serverWorkUnits())")
                self.monitorProgress(continued,completion:completion,attempt:attempt)
                self.endHandoff()
                self.announce("Сервер работает в фоне")
            }
        guard registered else {finish(message:"Не удалось включить фон. Сервер работает при открытом приложении.");return}
        let request=BGContinuedProcessingTaskRequest(identifier:attempt,title:"LocalParty · сервер",subtitle:"Игра по Wi-Fi")
        request.strategy = .fail
        do {try BGTaskScheduler.shared.submit(request)}
        catch {let error=error as NSError;log.error("Background request: \(error.domain, privacy:.public) / \(error.code)");finish(message:"iOS пока не разрешила фон. Сервер работает при открытом приложении.");return}
        let watchdog=DispatchWorkItem { [weak self] in
            guard let self, self.identifier == attempt, self.isRequesting else {return}
            self.finish(message:"iOS не включила фон. Сервер работает при открытом приложении.")
        }
        timeout=watchdog;DispatchQueue.main.asyncAfter(deadline:.now()+8,execute:watchdog)
        #endif
    }

    @available(iOS 26.0, *) private func monitorProgress(_ continued:BGContinuedProcessingTask,completion:BackgroundTaskCompletion,attempt:String) {
        // A fixed denominator avoids moving progress backwards on every update.
        // Only completed units change. This is a session activity counter, not a deadline.
        let baseline=NodeBridge.serverWorkUnits()
        var last=baseline
        var lastChange=ProcessInfo.processInfo.systemUptime
        continued.progress.totalUnitCount=Int64.max
        continued.progress.completedUnitCount=0
        let timer=DispatchSource.makeTimerSource(queue:DispatchQueue(label:"party.background.progress",qos:.utility))
        timer.schedule(deadline:.now()+1,repeating:1,leeway:.milliseconds(200))
        timer.setEventHandler { [weak self] in
            guard !completion.isFinished else {return}
            let units=NodeBridge.serverWorkUnits(), now=ProcessInfo.processInfo.systemUptime
            if units>last && NodeBridge.serverExecuting() {
                last=units;lastChange=now
                let completed=Int64(min(units-baseline,UInt64(Int64.max-1000)))
                completion.update {continued.progress.completedUnitCount=completed}
            } else if now-lastChange>10 {
                // Complete before the OS stall watchdog, even if the main thread is busy.
                completion.finish()
                DispatchQueue.main.async {
                    guard let self, self.identifier == attempt, self.task === continued else {return}
                    self.finish(message:"Сервер перестал отвечать. Откройте приложение для восстановления.")
                }
            }
        }
        monitor=timer;timer.resume()
    }

    func finish(message:String = "Во время игры держите приложение открытым") {
        let current=task, pendingIdentifier=identifier, finished=completion
        if let identifier {onDiagnostic?("background-finish id=\(identifier) work=\(NodeBridge.serverWorkUnits()) running=\(NodeBridge.serverExecuting()) reason=\(message)")}
        task=nil;identifier=nil;completion=nil;isRequesting=false
        timeout?.cancel();timeout=nil;monitor?.cancel();monitor=nil
        endHandoff()
        // Pause the worker before releasing its execution grant. Normal stop,
        // cancellation and expiration are cleanup, not an app-reported failure.
        announce(message)
        current?.expirationHandler=nil
        if let finished {finished.finish()}
        else if current == nil, let pendingIdentifier {BGTaskScheduler.shared.cancel(taskRequestWithIdentifier:pendingIdentifier)}
    }
    private func endHandoff() {
        if handoff != .invalid {UIApplication.shared.endBackgroundTask(handoff);handoff = .invalid}
    }
    private func announce(_ text:String) {message=text;log.notice("\(text, privacy:.public)");onChange?()}
}

