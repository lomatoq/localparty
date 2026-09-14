import SwiftUI
import WebKit
import CoreImage.CIFilterBuiltins

@main struct LocalPartyApp: App {
    @UIApplicationDelegateAdaptor(PartyAppDelegate.self) private var appDelegate
    @StateObject private var model=ServerModel.shared
    var body: some Scene { WindowGroup { HostView(model:model).preferredColorScheme(.dark) } }
}
struct HostView: View {
    @ObservedObject var model:ServerModel
    @State private var tab=0
    @StateObject private var controller=HostControllerStore()
    @Environment(\.scenePhase) private var phase
    @State private var controllerOpened=false
    @State private var search=""
    @State private var filter="Все"
    @State private var detail:PartyGame?
    @State private var confirmStop=false
    @State private var removePlayer: PartyPlayer?
    private let accent=Color(red:0.76,green:0.96,blue:0.55)
    private var games:[PartyGame] { model.catalog.filter { (search.isEmpty || $0.title.localizedCaseInsensitiveContains(search)) && (filter == "Все" || (filter == "За столом" ? $0.section == "table" : $0.section != "table")) } }
    var body: some View {
        TabView(selection:$tab) {
            NavigationStack { catalog.navigationTitle("Игры").searchable(text:$search,prompt:"Найти игру").toolbar { ToolbarItem(placement:.topBarTrailing) { status } } }.tabItem {Label("Игры",systemImage:"square.grid.2x2.fill")}.tag(0)
            NavigationStack { room.navigationTitle("Комната").toolbar {ToolbarItem(placement:.topBarTrailing) {status}} }.tabItem {Label("Комната",systemImage:"wifi")}.tag(1)
                    Group {
                if model.enabled {
                    if controllerOpened {HostControllerWebView(store:controller,url:model.controllerURL,visible:tab==2 && phase == .active)} else {Color.clear}
                } else {ContentUnavailableView {Label("Пульт",systemImage:"gamecontroller")} description: {Text("Запустите сервер в разделе «Комната», затем войдите как игрок.")} actions: {Button("Открыть комнату") {tab=1}}}
            }.tabItem {Label("Пульт",systemImage:"gamecontroller.fill")}.tag(2)
        }.tint(accent)
        .onChange(of:tab) {_,value in if value==2 {controllerOpened=true};controller.setVisible(value==2 && phase == .active)}
        // Observe the phone scene, not the aggregate phase of phone + TV.
        .onAppear {model.sceneChanged(phase)}
        .onChange(of:phase) {_,value in model.sceneChanged(value);controller.setVisible(value == .active && tab==2)}
        .onChange(of:model.enabled) {_,value in if !value {controller.stop()}}
        .sheet(item:$detail) { game in gameDetail(game) }
        .alert("Local Party",isPresented:Binding(get:{model.message != nil},set:{if !$0 {model.message=nil}})) {Button("Понятно") {model.message=nil}} message: {Text(model.message ?? "")}
        .confirmationDialog("Удалить \(removePlayer?.name ?? "игрока") из комнаты?",isPresented:Binding(get:{removePlayer != nil},set:{if !$0 {removePlayer=nil}}),titleVisibility:.visible) {Button("Удалить игрока",role:.destructive) {if let p=removePlayer {model.command(["type":"kick","id":p.id])};removePlayer=nil}} message: {Text("Контроллер отключится. Остальные участники продолжат игру.")}
        .confirmationDialog("Остановить сервер и завершить игру?",isPresented:$confirmStop,titleVisibility:.visible) {Button("Остановить сервер",role:.destructive) {model.stop()}}
    }
    private var incidentCard: some View {Group {if let incident=model.state?.incident {VStack(alignment:.leading,spacing:10) {Label("Событие сервера",systemImage:"exclamationmark.arrow.triangle.2.circlepath").font(.headline);Text(incident.message).font(.subheadline);Button("Понятно") {model.command(["type":"dismiss-incident"])}}.padding().background(.orange.opacity(0.12),in:RoundedRectangle(cornerRadius:18))}}}
    private var status: some View { HStack(spacing:5) {Circle().fill(!model.ready ? .orange : model.enabled ? accent : .secondary).frame(width:7,height:7);Text(!model.ready ? "Нет связи с сервером" : model.enabled ? "Сервер работает" : model.ready ? "Сервер готов" : "Загрузка…").font(.caption)} }
    private var catalog: some View {
        ScrollView {
            VStack(alignment:.leading,spacing:20) {
                incidentCard
                if !model.enabled { Button {tab=1} label: {Label("Запустить вечер →",systemImage:"wifi").font(.headline).frame(maxWidth:.infinity).padding()}.buttonStyle(.borderedProminent).foregroundStyle(.black) }
                if let active=model.active { activeCard(active) }
                Text("\(model.catalog.count) игр · один общий экран").font(.subheadline).foregroundStyle(.secondary)
                Picker("Категория",selection:$filter) {ForEach(["Все","Аркады","За столом"],id:\.self) {Text($0)}}.pickerStyle(.segmented)
                LazyVGrid(columns:[GridItem(.flexible()),GridItem(.flexible())],spacing:14) {
                    ForEach(games) {game in Button {model.select(game);detail=game} label: {
                        VStack(alignment:.leading,spacing:8) {
                            Group {if let img=model.image(game) {Image(uiImage:img).resizable().scaledToFit()} else {Image(systemName:"gamecontroller.fill").resizable().scaledToFit().padding(35)}}.frame(height:120).frame(maxWidth:.infinity)
                            Text(game.title).font(.headline).lineLimit(2).frame(height:43,alignment:.topLeading)
                            Text("\(game.min)–\(game.max) игроков").font(.caption).foregroundStyle(.secondary)
                            Label("Голосов: \(model.votes(for:game))",systemImage:"hand.thumbsup").font(.caption).foregroundStyle(accent)
                        }.padding(12).frame(maxWidth:.infinity,alignment:.leading).background(.white.opacity(0.045),in:RoundedRectangle(cornerRadius:22)).overlay(RoundedRectangle(cornerRadius:22).stroke(model.state?.selected == game.id ? accent : .white.opacity(0.06),lineWidth:model.state?.selected == game.id ? 2:1))
                    }.buttonStyle(.plain).accessibilityLabel("\(game.title), от \(game.min) до \(game.max) игроков") }
                }
                if games.isEmpty {ContentUnavailableView.search(text:search)}
            }.padding()
        }
    }
    private func activeCard(_ game:PartyGame) -> some View {
        VStack(alignment:.leading,spacing:12) {
            Label("На общем экране",systemImage:"tv").font(.caption).foregroundStyle(accent)
            Text(game.title).font(.title2.bold())
            Text(model.state?.active?.ui.phase == "waiting" ? "Ждём готовности игроков на пультах" : model.state?.active?.ui.progress ?? "").font(.subheadline).foregroundStyle(.secondary)
            if let run=model.state?.active {
                if let error=run.startError {Text(error).font(.footnote).foregroundStyle(.orange);Button("Повторить запуск") {model.command(["type":"retry-start","instance":run.instance])}.disabled(model.working)}
                ForEach(game.hostControls?.actions.filter {$0.phases.contains(run.ui.phase) && (run.ui.hostActions?.contains($0.id) ?? true)} ?? []) {action in
                    Button(action.label) {model.command(["type":"game-action","action":action.id,"instance":run.instance])}.buttonStyle(.bordered).disabled(model.working || run.session?.paused == true)
                }
                if run.ui.phase == "results" {Button("Сыграть ещё раз") {model.command(["type":"launch","id":game.id])}.buttonStyle(.borderedProminent).foregroundStyle(.black).disabled(model.working)}
            }
            HStack {Button(model.state?.active?.session?.paused == true ? "Продолжить" : "Пауза") {model.command(["type":"pause","paused":model.state?.active?.session?.paused != true])}.buttonStyle(.bordered);Spacer();Button("В лобби") {model.command(["type":"stop"])}.buttonStyle(.bordered)}.disabled(model.working || model.state?.busy == true)
        }.padding(18).background(accent.opacity(0.09),in:RoundedRectangle(cornerRadius:22))
    }
    private func gameDetail(_ game:PartyGame) -> some View {
        NavigationStack {
            ScrollView {VStack(alignment:.leading,spacing:20) {
                if let img=model.image(game) {Image(uiImage:img).resizable().scaledToFit().frame(height:230).frame(maxWidth:.infinity)}
                Text(game.title).font(.largeTitle.bold())
                Text("\(game.min)–\(game.max) игроков").font(.subheadline).foregroundStyle(accent)
                Text(game.goal ?? game.description).font(.title3)
                VStack(alignment:.leading,spacing:8) {Text("Управление").font(.headline);Text(game.controls).foregroundStyle(.secondary)}
                if let win=game.win {VStack(alignment:.leading,spacing:8) {Text("Как победить").font(.headline);Text(win).foregroundStyle(.secondary)}}
                if let fields=game.hostControls?.settings, !fields.isEmpty {
                    VStack(alignment:.leading,spacing:12) {
                        Text("Настройки игры").font(.headline)
                        ForEach(fields) {field in
                            HStack {Text(field.label);Spacer();Picker(field.label,selection:Binding(get:{model.setting(field,game:game)},set:{model.setSetting($0,field:field,game:game)})) {ForEach(field.options,id:\.value) {option in Text(option.label).tag(option.value)}}.labelsHidden().pickerStyle(.menu)}
                        }
                    }.padding().background(.white.opacity(0.05),in:RoundedRectangle(cornerRadius:18)).disabled(model.state?.active?.id == game.id)
                }
                Label(model.state?.selected == game.id && model.enabled ? "Выбор уже виден на телевизоре" : "Выбор появится на телевизоре после запуска сервера",systemImage:"tv").font(.footnote).foregroundStyle(.secondary)
            }.padding()}.safeAreaInset(edge:.bottom) {VStack(spacing:8) {
                if !model.enabled {Button("Перейти к запуску сервера") {detail=nil;tab=1}.buttonStyle(.borderedProminent).foregroundStyle(.black)}
                else {Button {model.command(["type":"launch","id":game.id]);detail=nil} label: {Text(model.state?.busy == true ? "Подготавливаем…" : "Играть вместе").font(.headline).frame(maxWidth:.infinity).padding(.vertical,8)}.buttonStyle(.borderedProminent).foregroundStyle(.black).disabled(!model.canLaunch || model.state?.selected != game.id)}
                Text(model.launchHint).font(.caption).foregroundStyle(.secondary).multilineTextAlignment(.center)
            }.padding().background(.ultraThinMaterial)}.toolbar {ToolbarItem(placement:.topBarTrailing) {Button("Готово") {detail=nil}}}
        }
    }
    private var room: some View {
        Form {
            if model.state?.incident != nil {Section {incidentCard.listRowInsets(EdgeInsets())}}
            Section {
                VStack(alignment:.leading,spacing:8) {Text(model.enabled ? "Вечер в эфире" : "Ваш iPhone — сервер").font(.title2.bold());Text("Телевизор показывает игру. Гости входят по QR-коду, а вы можете играть во вкладке «Пульт».").foregroundStyle(.secondary)}.padding(.vertical,8)
                if model.enabled {Button("Остановить сервер",role:.destructive) {confirmStop=true}.disabled(model.working)}
                else {Button {model.start()} label:{Label(model.working ? "Запускаем…" : "Запустить сервер",systemImage:"play.fill").frame(maxWidth:.infinity)}.buttonStyle(.borderedProminent).foregroundStyle(.black).disabled(!model.ready || model.working)}
            }
            if model.enabled {
                Section("1. Игра на телевизоре") {
                    Label(model.externalDisplayCount > 0 ? "Внешний экран подключён" : "AirPlay · Повтор экрана",systemImage:"square.on.square").font(.headline)
                    if model.externalDisplayCount > 0 {
                        Text("На телевизоре — общий экран игры. На iPhone играйте во вкладке «Пульт». Держите приложение открытым.").font(.subheadline)
                        Button("Обновить картинку на ТВ") {model.externalDisplayReload += 1}
                        Text("Чтобы отключиться, откройте Пункт управления → «Повтор экрана» → «Остановить повтор».").font(.footnote).foregroundStyle(.secondary)
                    } else {
                        Text("1. Подключите iPhone и телевизор с AirPlay к одной сети Wi-Fi.\n2. Откройте Пункт управления → «Повтор экрана» и выберите телевизор.\n3. Вернитесь в Party 26. На ТВ появится игра, а на iPhone останется пульт.").font(.subheadline)
                        Text("Нужен значок двух перекрывающихся прямоугольников. AirPlay в музыкальном плеере подключает только звук.").font(.footnote).foregroundStyle(.secondary)
                        DisclosureGroup("Не вижу «Повтор экрана»") {
                            Text("В Пункте управления нажмите «+» → «Добавить элемент управления», найдите «Повтор экрана» и добавьте его. Затем нажмите на новый значок и выберите телевизор.").font(.footnote)
                        }
                        Text("Браузер на телевизоре не нужен. Держите Party 26 открытым во время игры.").font(.footnote).foregroundStyle(.secondary)
                    }
                    DisclosureGroup("Или через браузер телевизора") {
                        Text(model.tvAddress).font(.system(.body,design:.monospaced)).textSelection(.enabled)
                        Button("Скопировать адрес ТВ") {UIPasteboard.general.string=model.tvAddress}
                    }
                    LabeledContent("Подключено общих экранов",value:"\(model.state?.screens ?? 0)")
                }
                Section("2. Подключите телефоны") {
                    HStack {Spacer();QRCodeView(value:model.address).frame(width:210,height:210);Spacer()}.padding(.vertical,10)
                    Text("Тот же QR-код показан на телевизоре. Подключитесь к одной сети Wi-Fi и откройте его камерой.").font(.footnote).foregroundStyle(.secondary)
                    ShareLink("Поделиться входом",item:model.address)
                    Button("Играть с этого iPhone") {controllerOpened=true;tab=2}
                }
                if let active=model.active {Section {activeCard(active).listRowInsets(EdgeInsets())}}
                Section("В комнате · \(model.state?.players.count ?? 0)") {
                    if model.state?.players.isEmpty != false {Text("Ждём первого игрока").foregroundStyle(.secondary)}
                    ForEach(model.state?.players ?? []) {p in HStack {VStack(alignment:.leading,spacing:4) {Text(p.name);Text(p.gameReady ? "В игре":"Подключён").font(.caption).foregroundStyle(.secondary)};Spacer();Button(role:.destructive) {removePlayer=p} label: {Image(systemName:"person.badge.minus").padding(8)}.buttonStyle(.borderless).accessibilityLabel("Удалить игрока " + p.name).disabled(model.working)}}
                }
            }
            if let text=model.connectionStatus {Section {Text(text).foregroundStyle(.secondary)}}
            Section {Text(model.buildLabel).font(.caption).foregroundStyle(.secondary);ShareLink("Поделиться журналом сервера",item:model.diagnosticsURL)}
            Section {Toggle("Не гасить экран приложения",isOn:$model.keepAwake);Text(model.backgroundStatus).font(.footnote).foregroundStyle(.secondary);if model.enabled {Button("Повторить запрос фонового режима") {model.requestBackground()}}} header: {Text("Настройки")} footer: {Text("Фоновая сессия работает с разрешения iOS 26. Если система остановит фон, откройте приложение для продолжения игры. Повторный запрос фона — по кнопке выше. Для управления играми интернет не нужен.")}
        }
    }
}
struct QRCodeView:View {
    let value:String
    @State private var image:UIImage?
    private func makeImage()->UIImage? {let filter=CIFilter.qrCodeGenerator();filter.message=Data(value.utf8);guard let output=filter.outputImage?.transformed(by:CGAffineTransform(scaleX:8,y:8)),let cg=CIContext().createCGImage(output,from:output.extent) else{return nil};return UIImage(cgImage:cg)}
    var body:some View {Group {if let image {Image(uiImage:image).interpolation(.none).resizable().scaledToFit().padding(12).background(.white,in:RoundedRectangle(cornerRadius:18)).accessibilityLabel("QR-код входа в игру")}}.task(id:value) {image=makeImage()}}
}


// The host uses the same /play page, player identity and sockets as every guest.
@MainActor final class HostControllerStore: NSObject, ObservableObject, WKNavigationDelegate {
    let webView: WKWebView
    private var loadedURL: URL?
    private var visible=false
    override init() {
        let config=WKWebViewConfiguration()
        config.allowsInlineMediaPlayback=true
        config.mediaTypesRequiringUserActionForPlayback=[]
        webView=WKWebView(frame:.zero,configuration:config)
        super.init()
        webView.navigationDelegate=self
        webView.isOpaque=false;webView.backgroundColor = .black
        webView.scrollView.contentInsetAdjustmentBehavior = .never
    }
    func load(_ url:URL) {guard loadedURL != url else {return};loadedURL=url;webView.load(URLRequest(url:url))}
    func setVisible(_ value:Bool) {
        guard visible != value else {return};visible=value
        let event=value ? "party-native-resume":"party-native-hide"
        webView.evaluateJavaScript("window.dispatchEvent(new Event('\(event)'))",completionHandler:nil)
    }
    func webViewWebContentProcessDidTerminate(_ webView:WKWebView) {
        if let url=loadedURL {webView.load(URLRequest(url:url))}
    }
    func stop() {setVisible(false);loadedURL=nil;webView.stopLoading();webView.loadHTMLString("",baseURL:nil)}
}
struct HostControllerWebView:UIViewRepresentable {
    let store:HostControllerStore;let url:URL;let visible:Bool
    func makeUIView(context:Context)->WKWebView {store.load(url);store.setVisible(visible);return store.webView}
    func updateUIView(_ view:WKWebView,context:Context) {store.load(url);store.setVisible(visible)}
}
