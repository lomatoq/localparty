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
    @State private var confirmStatisticsReset=false
    @State private var airPlayHelp=false
    @State private var browserSelected=false
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
                } else {ContentUnavailableView {Label("Пульт",systemImage:"gamecontroller")} description: {Text("Подготавливаем комнату. Через несколько секунд здесь появится ваш пульт.")} actions: {Button("Открыть комнату") {tab=1}}}
            }.tabItem {Label("Пульт",systemImage:"gamecontroller.fill")}.tag(2)
        }.tint(accent)
        .onChange(of:tab) {_,value in if value==2 {controllerOpened=true};controller.setVisible(value==2 && phase == .active)}
        // Observe the phone scene, not the aggregate phase of phone + TV.
        .onAppear {model.sceneChanged(phase)}
        .onChange(of:phase) {_,value in model.sceneChanged(value);controller.setVisible(value == .active && tab==2)}
        .onChange(of:model.enabled) {_,value in if !value {controller.stop()}}
        .sheet(item:$detail) { game in gameDetail(game) }
        .sheet(isPresented:$airPlayHelp) { airPlayInstructions }
        .confirmationDialog("Удалить \(removePlayer?.name ?? "игрока") из комнаты?",isPresented:Binding(get:{removePlayer != nil},set:{if !$0 {removePlayer=nil}}),titleVisibility:.visible) {Button("Удалить игрока",role:.destructive) {if let p=removePlayer {model.command(["type":"kick","id":p.id])};removePlayer=nil}} message: {Text("Контроллер отключится. Остальные участники продолжат игру.")}
        .confirmationDialog("Сбросить всю статистику?",isPresented:$confirmStatisticsReset,titleVisibility:.visible) {Button("Сбросить статистику",role:.destructive) {model.command(["type":"statistics-reset"])}} message: {Text("История матчей, очки и победы будут очищены. Имена игроков и подключённые пульты сохранятся.")}
    }
    private var feedback: some View {
        Group {
            if let text=model.message ?? model.connectionStatus ?? model.state?.incident?.message {
                HStack(alignment:.top,spacing:12) {
                    Text(text).font(.subheadline)
                    Spacer()
                    if model.connectionStatus == nil {
                        Button {if model.message != nil {model.message=nil} else {model.command(["type":"dismiss-incident"])}} label: {Image(systemName:"xmark")}.accessibilityLabel("Скрыть сообщение")
                    }
                }.padding().background(.white.opacity(0.06),in:RoundedRectangle(cornerRadius:18))
            }
        }
    }
    private var status: some View {
        HStack(spacing:5) {
            if !model.ready {ProgressView().controlSize(.mini)}
            Text(model.ready ? "\(model.state?.players.count ?? 0) игроков" : "Подготавливаем…").font(.caption).foregroundStyle(.secondary)
        }
    }
    private var catalog: some View {
        ScrollView {
            VStack(alignment:.leading,spacing:20) {
                HStack(spacing:10) {
                    if let url=Bundle.main.url(forResource:"localparty-mark",withExtension:"png",subdirectory:"Server/public/assets/branding"),let mark=UIImage(contentsOfFile:url.path) {Image(uiImage:mark).resizable().scaledToFit().frame(width:42,height:42)}
                    Text("LocalParty").font(.title2.bold())
                }
                feedback
                if (model.state?.screens ?? 0)==0 { Button {tab=1} label: {Label("Подключить общий экран",systemImage:"tv").font(.headline).frame(maxWidth:.infinity).padding()}.buttonStyle(.borderedProminent).foregroundStyle(.black) }
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
                Label((model.state?.screens ?? 0)>0 ? "Выбор виден на общем экране" : "Подключите общий экран в разделе «Комната»",systemImage:"tv").font(.footnote).foregroundStyle(.secondary)
            }.padding()}.safeAreaInset(edge:.bottom) {VStack(spacing:8) {
                if (model.state?.screens ?? 0)==0 {Button("Подключить экран") {detail=nil;tab=1}.buttonStyle(.borderedProminent).foregroundStyle(.black)}
                else {Button {model.command(["type":"launch","id":game.id]);detail=nil} label: {Text(model.state?.busy == true ? "Подготавливаем…" : "Играть вместе").font(.headline).frame(maxWidth:.infinity).padding(.vertical,8)}.buttonStyle(.borderedProminent).foregroundStyle(.black).disabled(!model.canLaunch || model.state?.selected != game.id)}
                Text(model.launchHint).font(.caption).foregroundStyle(.secondary).multilineTextAlignment(.center)
            }.padding().background(.ultraThinMaterial)}.toolbar {ToolbarItem(placement:.topBarTrailing) {Button("Готово") {detail=nil}}}
        }
    }
    private var room: some View {
        Form {
            Section {
                VStack(alignment:.leading,spacing:8) {
                    Text("Собираемся играть").font(.title2.bold())
                    Text("Выберите общий экран, пригласите друзей и откройте игру.").foregroundStyle(.secondary)
                }.padding(.vertical,8)
                feedback.listRowInsets(EdgeInsets())
            }
            Section("Общий экран") {
                Button {airPlayHelp=true;browserSelected=false} label: {
                    Label {VStack(alignment:.leading,spacing:4) {Text("AirPlay").font(.headline);Text(model.externalDisplayCount>0 ? "Экран подключён" : "Телевизор или Mac").font(.subheadline).foregroundStyle(.secondary)}} icon: {Image(systemName:"airplayvideo").font(.title2)}
                }
                Button {browserSelected=true;if !model.networkEnabled {model.setNetworkEnabled(true)}} label: {
                    Label {VStack(alignment:.leading,spacing:4) {Text("Через браузер").font(.headline);Text("Открыть общий экран по Wi-Fi").font(.subheadline).foregroundStyle(.secondary)}} icon: {Image(systemName:"globe").font(.title2)}
                }.disabled(!model.ready || model.working)
                if browserSelected && model.networkEnabled {
                    Text(model.tvAddress).font(.system(.subheadline,design:.monospaced)).textSelection(.enabled)
                    ShareLink("Поделиться адресом экрана",item:model.tvAddress)
                }
                if (model.state?.screens ?? 0)>0 {Label("Подключено экранов: \(model.state?.screens ?? 0)",systemImage:"checkmark.circle").foregroundStyle(accent)}
            }
            Section {
                Toggle("Доступ по Wi-Fi",isOn:Binding(get:{model.networkEnabled},set:{model.setNetworkEnabled($0)})).disabled(!model.ready || model.working)
                if model.networkEnabled && !model.address.isEmpty {
                    HStack {Spacer();QRCodeView(value:model.address).frame(width:190,height:190);Spacer()}.padding(.vertical,8)
                    Text("Друзья подключаются к той же сети Wi-Fi и сканируют код. Он также появится на общем экране.").font(.footnote).foregroundStyle(.secondary)
                    ShareLink("Пригласить игроков",item:model.address)
                } else if model.networkEnabled {
                    Text("Подключитесь к Wi-Fi — здесь появится код для гостей.").font(.subheadline).foregroundStyle(.secondary)
                }
                Button("Играть с этого iPhone") {controllerOpened=true;tab=2}.disabled(!model.ready)
            } header: {Text("Игроки")} footer: {Text("Wi-Fi-доступ нужен для телефонов гостей и экрана в браузере. AirPlay и пульт на этом iPhone готовы автоматически.")}
            if let active=model.active {Section {activeCard(active).listRowInsets(EdgeInsets())}}
            Section("В комнате · \(model.state?.players.count ?? 0)") {
                if model.state?.players.isEmpty != false {Text("Пока никого. Пригласите друзей или откройте свой пульт.").foregroundStyle(.secondary)}
                ForEach(model.state?.players ?? []) {p in
                    HStack {
                        VStack(alignment:.leading,spacing:4) {Text(p.name);Text(p.gameReady ? "В игре":"Подключён").font(.caption).foregroundStyle(.secondary)}
                        Spacer()
                        Button(role:.destructive) {removePlayer=p} label: {Image(systemName:"person.badge.minus").padding(8)}.buttonStyle(.borderless).accessibilityLabel("Удалить игрока " + p.name).disabled(model.working)
                    }
                }
            }
            Section("Статистика") {
                LabeledContent("Сыграно матчей",value:"\(model.state?.totalMatches ?? 0)")
                ForEach((model.state?.leaderboard ?? []).prefix(5)) {p in LabeledContent(p.name,value:"\(p.wins) побед · \(p.points) очков")}
                Text("Имена и результаты сохраняются между вечерами. Знакомый браузер узнаёт игрока автоматически; на новом устройстве нужно ввести имя.").font(.footnote).foregroundStyle(.secondary)
                Button("Сбросить статистику",role:.destructive) {confirmStatisticsReset=true}.disabled(!model.ready || model.working || model.state?.active != nil || model.state?.totalMatches == 0)
                if model.state?.active != nil {Text("Сброс доступен после завершения матча.").font(.caption).foregroundStyle(.secondary)}
            }
            Section {
                DisclosureGroup("Настройки и диагностика") {
                    Toggle("Не гасить экран приложения",isOn:$model.keepAwake)
                    Text("Для вывода AirPlay держите приложение открытым.").font(.footnote).foregroundStyle(.secondary)
                    Text(model.backgroundStatus).font(.footnote).foregroundStyle(.secondary)
                    if model.networkEnabled {Button("Продолжать игру в фоне") {model.requestBackground()}}
                    ShareLink("Поделиться диагностикой",item:model.diagnosticsURL)
                    Text(model.buildLabel).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
    }
    private var airPlayInstructions: some View {
        NavigationStack {
            VStack(alignment:.leading,spacing:24) {
                Image(systemName:"airplayvideo").font(.system(size:48)).foregroundStyle(accent)
                Text(model.externalDisplayCount>0 ? "Экран подключён" : "Игра на большом экране").font(.largeTitle.bold())
                if model.externalDisplayCount>0 {
                    Text("Выберите игру во вкладке «Игры». На iPhone можно открыть свой пульт.")
                    Button("Обновить картинку") {model.externalDisplayReload += 1}
                } else {
                    Label("Подключите iPhone и экран к одной сети Wi-Fi.",systemImage:"1.circle")
                    Label("Откройте Пункт управления → «Повтор экрана» и выберите телевизор или Mac.",systemImage:"2.circle")
                    Label("Вернитесь в LocalParty. Комната появится на экране автоматически.",systemImage:"3.circle")
                }
                Text("Для телефонов друзей включите «Доступ по Wi-Fi» в комнате. Держите LocalParty открытым во время игры.").font(.subheadline).foregroundStyle(.secondary)
                Spacer()
            }.padding(24).toolbar {ToolbarItem(placement:.topBarTrailing) {Button("Готово") {airPlayHelp=false}}}
        }
    }

}
struct QRCodeView:View {
    let value:String
    @State private var image:UIImage?
    private func makeImage()->UIImage? {let filter=CIFilter.qrCodeGenerator();filter.message=Data(value.utf8);guard let output=filter.outputImage?.transformed(by:CGAffineTransform(scaleX:8,y:8)),let cg=CIContext().createCGImage(output,from:output.extent) else{return nil};return UIImage(cgImage:cg)}
    var body:some View {Group {if let image {Image(uiImage:image).interpolation(.none).resizable().scaledToFit().padding(12).background(.white,in:RoundedRectangle(cornerRadius:18)).accessibilityLabel("QR-код входа в игру")} else {ProgressView().frame(maxWidth:.infinity,maxHeight:.infinity)}}.task(id:value) {image=makeImage()}}
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
