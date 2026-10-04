(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let state = {catalog: [], players: [], leaderboard: [], votes: [], native: {}}, section = 'all', pendingQR = false, choiceStarting = false, lastTVColumn = 0, lastFreshId = null;
  let tvRemoteGenre = 'all';
  let selectedDetail = null, catalogSignature = '', rosterSignature = '', actionsSignature = '', standingsSignature = '';
  let confirmAction = null, launchPending = false, toastTimer, pendingLaunchId = null, launchTimer, launchAwaitingScreen = false;
  let receivedSnapshot = false, readyTimer = null, handshakeAttempts = 0;
  const shellRevision = 'ios-recovery-20260918.1';
  const dialogs = ['hostPanel', 'gameDetail', 'confirmDialog'];
  const element = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  function menuCounter(node,value,label='',total=null,labelFirst=false){
    const key=JSON.stringify([value,label,total,labelFirst]);
    if(node.dataset.counterKey===key&&node.querySelector('.hp-menu-counter-value'))return node;
    node.dataset.counterKey=key;node.classList.add('hp-menu-counter');node.classList.toggle('hp-catalog-counter',/^(?:игр(?:а|ы)?|games?)$/i.test(label));
    const number=element('span','hp-menu-counter-value',String(value));number.dataset.noTranslate='';
    const caption=element('span','hp-menu-counter-label',label);caption.dataset.i18nUi='';
    const readout=element('span','hp-menu-counter-readout');readout.append(number);
    if(total!==null){const denominator=element('span','hp-menu-counter-total',String(total));denominator.dataset.noTranslate='';readout.append(element('span','hp-menu-counter-separator',' / '),denominator);}
    node.replaceChildren(...(labelFirst?[caption,document.createTextNode(' '),readout]:[readout,...(label?[document.createTextNode(' '),caption]:[])]));return node;
  }
  const companyPlaces = rows => {let place=0,last='';return rows.map((p,i)=>{const key=`${Number(p.points)||0}:${Number(p.wins)||0}`;if(key!==last){place=i+1;last=key;}return place;});};
  const button = (text, cls, action) => { const b = element('button', cls, text); b.type = 'button'; b.addEventListener('click', action); return b; };
  // Russian numeric agreement: 1 игрок / 2 игрока / 5 игроков.
  const plural = (n, one, few, many) => {
    const a = Math.abs(Math.trunc(Number(n) || 0)), d = a % 10, h = a % 100;
    return a + ' ' + (d === 1 && h !== 11 ? one : d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many);
  };
  const canSend = () => Boolean(window.webkit?.messageHandlers?.partyShell);
  function send(type, fields = {}) {
    if (!canSend()) { toast('Открой LocalParty в приложении iPhone.'); return false; }
    window.webkit.messageHandlers.partyShell.postMessage({type, ...fields}); return true;
  }
  const manage = command => send('manage', {command});
  const busy = () => !state.native?.ready || state.native?.catalogReady === false || state.native?.working || state.busy;
  const hasSharedScreen = () => Number(state.screens) > 0 || Number(state.native?.externalDisplays) > 0;
  const gameById = id => (state.catalog || []).find(g => g.id === id);
  let botPromptGame=null,botPromptAnchor=null,botRequest=null,botRequestTimer;
  function closeBotPrompt(){const box=$('startBots');if(window.LocalPartyDialogs)LocalPartyDialogs.setVisible(box,false);else{if(box.matches(':popover-open'))box.hidePopover();box.hidden=true;}botPromptGame=null;botPromptAnchor?.setAttribute('aria-expanded','false');botPromptAnchor=null;}
  function positionBotPrompt(){if(!botPromptGame)return;const box=$('startBots'),anchor=botPromptAnchor?.isConnected?botPromptAnchor:$('choiceStart'),r=anchor.getBoundingClientRect(),v=window.visualViewport,left=v?.offsetLeft||0,top=v?.offsetTop||0,width=v?.width||innerWidth,height=v?.height||innerHeight;box.style.left=Math.max(left+10,Math.min(r.right-box.offsetWidth,left+width-box.offsetWidth-10))+'px';box.style.top=Math.max(top+10,Math.min(r.bottom+8+box.offsetHeight<=top+height-12?r.bottom+8:r.top-box.offsetHeight-8,top+height-box.offsetHeight-12))+'px';}
  function renderBotPrompt(){
    if(!botPromptGame)return;const game=gameById(botPromptGame);if(!game||state.active){closeBotPrompt();return;}
    const bots=Number(state.botCount)||0,humans=state.players.filter(p=>!p.testBot).length,connectedBots=state.players.filter(p=>p.testBot).length,count=state.players.length,max=Math.max(0,Math.min(15,16-humans,game.max-humans));
    if(botRequest&&bots===botRequest.target&&connectedBots===bots){clearTimeout(botRequestTimer);botRequest=null;}
    const locked=busy()||!!botRequest||!!pendingLaunchId,min=bots>0?1:game.min;
    $('startBotsTitle').textContent=game.title;$('startBotsCount').textContent=String(bots);
    $('startBotsHint').textContent=botRequest?'Подключаем ботов…':!state.screens?'Для ботов нужен общий экран. Подключи телевизор.':count>game.max?'Слишком много игроков для этой игры. Убери лишних ботов.':count<min?'Не хватает игроков. Добавь бота или пригласи друзей.':connectedBots<bots?'Ждём подключения ботов…':'Все готовы к запуску. Боты играют без записи очков.';
    $('startBotsMinus').disabled=locked||bots===0;$('startBotsPlus').disabled=locked||!state.screens||bots>=max;
    $('startBotsLaunch').disabled=locked||connectedBots!==bots||count<min||count>game.max;
    $('startBots').setAttribute('aria-busy',String(!!botRequest));positionBotPrompt();
  }
  function showBotPrompt(id,anchor){closeBotPrompt();botPromptGame=id;botPromptAnchor=anchor||document.activeElement||$('choiceStart');botPromptAnchor.setAttribute('aria-expanded','true');const box=$('startBots');if(window.LocalPartyDialogs)LocalPartyDialogs.setVisible(box,true);else box.hidden=false;if(box.matches(':popover-open'))box.hidePopover();(botPromptAnchor.closest('dialog')||document.body).append(box);box.showPopover?.();renderBotPrompt();$('startBotsPlus').focus({preventScroll:true});}
  function changePromptBots(delta){
    if(!botPromptGame||botRequest||pendingLaunchId||busy())return;const button=$(delta>0?'startBotsPlus':'startBotsMinus');if(button.disabled)return;
    const target=Math.max(0,(Number(state.botCount)||0)+delta);botRequest={target};
    if(!manage({type:'bots-set',count:target})){botRequest=null;renderBotPrompt();return;}
    clearTimeout(botRequestTimer);botRequestTimer=setTimeout(()=>{botRequest=null;renderBotPrompt();if(botPromptGame)$('startBotsHint').textContent='Изменение не подтвердилось. Проверь экран и попробуй ещё раз.';},6000);renderBotPrompt();
  }
  function toast(text) { $('nativeToast').textContent = text; $('nativeToast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('nativeToast').hidden = true; }, 3500); }
  // WebKit does not reliably restore focus when a dialog closes, so the opener is
  // remembered explicitly and refocused. Keeps VoiceOver and keyboard users in place.
  const openers = {};
  // motion.js owns every dialog exit, including swaps and rapid reopen. The
  // Sheets overlay the existing deck without collapsing or rebuilding it.
  function show(id) { closeBotPrompt();const opener=document.activeElement;for(const other of dialogs)if(other!==id&&$(other).open)$(other).close();const d=$(id);if(!d.open||d.classList.contains('lp-dialog-closing')){openers[id]=opener;d.showModal();holdEntranceUntilPainted(d);} }
  // The first paint of a sheet (artwork decode, backdrop blur) can take longer than its
  // 180 ms entrance, which then looked like a one-frame pop. Hold the entrance at its
  // first keyframe until a frame has actually been presented, then play all of it.
  function holdEntranceUntilPainted(d) {
    const entrance = d.getAnimations({subtree: true}).filter(a => a.playState === 'running');
    if (!entrance.length) return;
    // 1 ms in, not 0: WebKit skips painting a fully transparent layer, which would
    // push the expensive first paint back into the running animation.
    entrance.forEach(a => { a.pause(); a.currentTime = 1; });
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => entrance.forEach(a => { if (d.open && a.playState === 'paused') a.play(); }))));
  }
  function close(id) {
    if(id==='hostPanel'&&document.body.classList.contains('native-host-tab')){window.LocalPartyTabs?.select('games');return;}
    const d = $(id); if (!d.open) return;d.close();
  }
  dialogs.forEach(id=>$(id).addEventListener('close',()=>{const opener=openers[id];delete openers[id];if(dialogs.some(other=>$(other).open))return;if(opener?.isConnected&&typeof opener.focus==='function')opener.focus({preventScroll:true});}));
  function confirm(title, text, action) { $('confirmTitle').textContent = title; $('confirmText').textContent = text; confirmAction = action; show('confirmDialog'); }
  function controller() { if (!state.native?.ready) return; closeBotPrompt(); dialogs.forEach(close); if(window.LocalPartyTabs)window.LocalPartyTabs.select('controller');else send('controller'); }
  function artPath(game) {
    return window.LocalPartyCatalog?.artPath(game) || '';
  }
  let catalogView = null;
  function renderCatalog() {
    if (!window.LocalPartyCatalog) {
      $('catalogState').hidden = false;
      $('catalogStateText').textContent = 'Не загрузился общий каталог интерфейса. Проверь ресурсы сборки.';
      return;
    }
    catalogView ||= window.LocalPartyCatalog.create($('catalog'), {onSelect: openGame, onLaunch:id=>launchFromCard(id,$('catalog').querySelector(`[data-game="${CSS.escape(id)}"] .lp-direct-start`))});
    const games = catalogView.update(state, {query: $('search').value, filter: section, disabled: busy() || Boolean(pendingLaunchId), pendingId: pendingLaunchId});
    // This is only the native catalogue: the shared TV renderer keeps its own roles.
    for(const counter of $('catalog').querySelectorAll('.lp-group-count')){const number=counter.textContent.match(/^\d+/)?.[0];if(number)menuCounter(counter,number,'игр');}
    for(const card of $('catalog').querySelectorAll('[data-game]')){const g=gameById(card.dataset.game),range=card.querySelector('.lp-player-range'),votes=card.querySelector('.lp-card-votes');if(g&&range)menuCounter(range,g.min+'–'+g.max,'игроков');const count=(state.votes||[]).filter(v=>v.gameId===card.dataset.game).length;if(votes&&count)menuCounter(votes,count,plural(count,'голос','голоса','голосов').replace(/^\d+\s/,''));}
    // A confirmed running game's action is navigation, never a second launch.
    if(state.active){const action=$('catalog').querySelector(`[data-game="${CSS.escape(state.active.id)}"] .lp-direct-start`);if(action){action.textContent='Играть';action.disabled=busy()||Boolean(pendingLaunchId);}}
    const hasCatalog = state.catalog.length > 0;
    $('noGames').hidden = !hasCatalog || games.length > 0;
    $('catalogState').hidden = hasCatalog;
    $('catalogStateText').textContent = state.native?.catalogError || (receivedSnapshot ? 'Подготавливаем игры на этом iPhone…' : 'Соединяем меню с приложением…');
    $('catalog').setAttribute('aria-busy', String(!hasCatalog));
  }
  function clearPressedUI() {
    window.LocalPartyUIFeel?.cancel?.();
    document.querySelectorAll('.party-pressed,[data-lp-press-state]').forEach(node => {
      node.classList.remove('party-pressed'); node.removeAttribute('data-lp-press-state');
    });
  }
  function clearPendingLaunch() {
    pendingLaunchId = null; launchAwaitingScreen = false; clearTimeout(launchTimer);
    clearPressedUI(); renderCatalog(); renderChoice();
  }
  function dispatchPendingLaunch() {
    const id = pendingLaunchId;
    if (!id || launchAwaitingScreen && !hasSharedScreen() || busy()) return false;
    launchAwaitingScreen = false;
    if (!manage({type:'launch', id, externalDisplay:Number(state.native?.externalDisplays)>0})) { clearPendingLaunch(); return false; }
    clearTimeout(launchTimer); launchTimer = setTimeout(() => {
      if (pendingLaunchId === id) { clearPendingLaunch(); toast('Запуск не подтвердился. Нажми ещё раз.'); }
    }, 8000);
    return true;
  }
  function launchFromCard(id,anchor) {
    const game=gameById(id),count=state.players.length,min=(state.botCount||0)>0?1:game?.min;
    clearPressedUI();
    send('launch-diagnostic',{stats:{id,players:count,screens:Number(state.screens)||0,externalDisplays:Number(state.native?.externalDisplays)||0,busy:Boolean(busy()),pending:Boolean(pendingLaunchId)}});
    if(!game)return;
    if(state.active?.id===id)return controller();
    if(busy())return toast('Комната ещё восстанавливается. Попробуй через секунду.');
    if(pendingLaunchId)return;
    if(botRequest)return;
    if(count<min)return showBotPrompt(id,anchor);
    if(count>game.max)return toast(`В этой игре максимум ${game.max} игроков.`);
    closeBotPrompt();pendingLaunchId=id;renderCatalog();renderChoice();
    if(!hasSharedScreen()){
      launchAwaitingScreen=true;send('screen-refresh');toast('Переподключаем общий экран…');
      clearTimeout(launchTimer);launchTimer=setTimeout(()=>{
        if(pendingLaunchId===id&&launchAwaitingScreen){clearPendingLaunch();toast('Общий экран не подключён. Подключи ТВ и повтори запуск.');}
      },4500);return;
    }
    dispatchPendingLaunch();
  }
  function openGame(id) {
    const game = gameById(id); if (!game) return;
    selectedDetail = id; launchPending = false;
    if (!busy()) manage({type: 'select', id});
    $('detailTitle').textContent = game.title; $('detailGoal').textContent = game.goal || game.description;
    $('detailControls').textContent = game.controls || ''; $('detailWin').textContent = game.win || 'Правила указаны на общем экране.';
    $('detailArt').src = artPath(game); $('detailArt').hidden = !artPath(game);
    $('detailArt').onerror = () => { $('detailArt').hidden = true; };
    $('gameSettings').replaceChildren();
    (game.hostControls?.settings || []).forEach(field => {
      const row = element('label', 'native-row'), select = element('select'); select.dataset.setting = field.id; select.setAttribute('aria-label', field.label);
      field.options.forEach(option => {const o = element('option', '', option.label); o.value = option.value; select.append(o);});
      select.addEventListener('change', () => {
        const settings = {...(state.gameSettings?.[id] || {}), [field.id]: select.value};
        manage({type: 'settings', id, settings});
      });
      row.append(element('span', '', field.label), select); $('gameSettings').append(row);
    });
    updateDetail(); show('gameDetail');
  }
  function updateDetail() {
    const g = gameById(selectedDetail); if (!g) return;
    $('gameSettings').querySelectorAll('select').forEach(select => {
      const field = g.hostControls.settings.find(f => f.id === select.dataset.setting);
      if (document.activeElement !== select) select.value = state.gameSettings?.[g.id]?.[field.id] ?? field.initial;
      select.disabled = busy() || state.active?.id === g.id;
    });
    const count = state.players.length;
    let hint = !state.native?.ready ? 'Подготавливаем комнату…' : !hasSharedScreen() ? 'Подключи общий экран в панели ведущего.' : count < g.min ? 'Нужно ещё ' + plural(g.min - count, 'игрока', 'игроков', 'игроков') + '. Открой свой пульт или пригласи друзей.' : count > g.max ? `В этой игре максимум ${g.max} игроков.` : state.selected !== g.id ? 'Подтверждаем выбор игры…' : 'После запуска каждый нажимает «Я готов» на своём пульте.';
    $('launchHint').textContent = hint;
    $('launchGame').disabled = busy() || Boolean(pendingLaunchId) || count > g.max || state.selected !== g.id;
    $('launchGame').textContent = pendingLaunchId ? 'Запускаем…' : state.busy ? 'Подготавливаем…' : state.active?.id===g.id ? 'Открыть пульт' : 'Играть вместе';
    if (launchPending && state.active?.id === g.id && !state.busy) { close('gameDetail'); launchPending = false; }
    if (state.native?.message && !state.native?.working && !state.busy) launchPending = false;
  }
  function renderActive() {
    const run = state.active, game = gameById(run?.id);
    document.body.classList.toggle('has-active-game',Boolean(game));$('activeCard').hidden = !game; if (!game) { actionsSignature = ''; deckAnimation?.cancel(); deckSlot = 0; $('activeCard').style.marginBottom = ''; return; }
    $('activeCard').classList.toggle('is-paused',Boolean(run.session?.paused));
    $('activeCard').style.setProperty('--pick-color',/^#[0-9a-f]{3,8}$/i.test(game.color||'')?game.color:'#9b7bff');
    if(!$('activeCard').querySelector('.native-run-outline')){const ring=element('span','native-run-outline');ring.setAttribute('aria-hidden','true');$('activeCard').append(ring);}
    $('activeTitle').textContent = game.title;$('activeArt').src=artPath(game);
    const roster=run.roster||[],ready=new Set(run.session?.readyIds||[]),missing=roster.filter(p=>!p.testBot&&(!p.connected||!p.gameReady||!ready.has(p.id)));
    if(!run.startError&&!run.session?.paused&&run.ui?.phase==='waiting'){
      const status=$('activeStatus'),count=roster.filter(p=>p.testBot||ready.has(p.id)).length,icons=window.PartyIcons?.create;
      menuCounter(status,count,'Готовы',roster.length,true);
      status.classList.add('native-waiting-status');status.classList.toggle('has-waiting-icons',Boolean(icons));
      if(!status.querySelector('.native-ready-count')){
        const group=element('span','native-ready-count'),caption=status.querySelector('.hp-menu-counter-label'),readout=status.querySelector('.hp-menu-counter-readout');
        if(icons){const icon=icons('tick');icon.classList.add('native-ready-icon');group.append(icon);}
        group.append(caption,readout);status.replaceChildren(group);
      }
      const previousPending=status.querySelector('.native-waiting-count');
      if(missing.length){
        const key=JSON.stringify([missing.length,Boolean(icons)]),pending=previousPending||element('span','native-waiting-count');
        if(pending.dataset.waitingKey!==key){const label=element('span','native-waiting-label','ждём');label.dataset.i18nUi='';const number=element('span','hp-menu-counter-value',String(missing.length));number.dataset.noTranslate='';pending.replaceChildren(...(icons?[icons('clock'),label,number]:[label,number]));pending.dataset.waitingKey=key;}
        if(!previousPending)status.append(pending);
      }else previousPending?.remove();
      const t=text=>window.PartyI18n?.t?.(text)||text,description=t('Готовы')+': '+count+' / '+roster.length+(missing.length?'; '+t('ждём:')+' '+missing.map(p=>p.name).join(', '):'');
      status.title=description;status.setAttribute('aria-label',description);
    }else{$('activeStatus').classList.remove('hp-menu-counter','native-waiting-status','has-waiting-icons');$('activeStatus').removeAttribute('aria-label');$('activeStatus').textContent=run.startError||(run.ui?.phase==='results'?'Матч окончен':run.session?.paused?'Игра на паузе':run.ui?.progress||run.ui?.label||'Игра идёт');$('activeStatus').title=$('activeStatus').textContent;}
    const actions = (game.hostControls?.actions || []).filter(a => a.phases.includes(run.ui?.phase) && (!run.ui?.hostActions || run.ui.hostActions.includes(a.id)));
    const signature = JSON.stringify([run.instance, run.ui?.phase, run.session?.paused, run.startError, actions]);
    if (signature !== actionsSignature) {
      actionsSignature = signature; const box = $('activeActions'); box.replaceChildren();
      const remote = button('Пульт', 'quiet native-controller-shortcut', controller);
      remote.id = 'activeController';
      box.append(remote);
      const bots=button('Боты','quiet native-bot-shortcut',()=>{show('hostPanel');requestAnimationFrame(()=>$('hostRosterSection').scrollIntoView({block:'start'}));});bots.id='activeBots';const botLabel=element('span','native-action-label','Боты');bots.replaceChildren(botLabel);const botIcon=window.PartyIcons?.create('friends');if(botIcon)bots.prepend(botIcon);box.append(bots);
      const settings=button('Настройки выбранной игры','quiet native-run-settings',()=>openGame(game.id));box.append(settings);
      if(run.ui?.phase==='waiting'){const force=button('Начать сейчас ▶','lime small',()=>manage({type:'force-start',instance:run.instance}));force.dataset.forceStart='true';box.append(force);}
      actions.forEach(a => {const b = button(a.label, 'quiet', () => manage({type: 'game-action', instance: run.instance, action: a.id})); b.dataset.phaseAction = 'true'; box.append(b);});
      if (run.startError) box.append(button('Повторить запуск', 'lime small', () => manage({type: 'retry-start', instance: run.instance})));
      if (run.ui?.phase === 'results') box.append(button('Сыграть ещё раз', 'lime small', () => manage({type: 'launch', id: game.id})));
      if(run.ui?.phase!=='waiting'&&run.ui?.phase!=='results')box.append(button(run.session?.paused ? 'Продолжить' : 'Пауза', 'quiet', () => manage({type: 'pause', paused: !state.active?.session?.paused})));
      box.append(button('В лобби', 'quiet native-danger', () => confirm('Закончить игру?', 'Текущий матч завершится для всей компании.', () => manage({type: 'stop'}))));
    }
    $('activeActions').querySelectorAll('button').forEach(b => b.disabled = ['activeController','activeBots'].includes(b.id) ? !state.native?.ready : busy() || (b.dataset.phaseAction === 'true' && Boolean(run.session?.paused)) || (b.dataset.forceStart==='true'&&Number(run.ready?.length||0)<((state.botCount||0)>0?1:game.min)));
    window.PartyButtonProgress?.set(document.querySelector('#activeActions [data-force-start]'),roster.filter(p=>p.testBot||ready.has(p.id)).length,run.ui?.phase==='waiting'?roster.length:0);
  }
  function renderRoom() {
    const n = state.native || {}, address = n.address || '', hasAddress = Boolean(state.networkEnabled && address);
    const external = Number(n.externalDisplays) || 0;
    if(external>0){const externalCount=menuCounter(element('span',''),external,'Отдельная сцена ТВ:',null,true),connections=menuCounter(element('span',''),state.screens||0,'Игровых подключений экрана:',null,true);$('displayStatus').classList.add('hp-menu-counter-group');$('displayStatus').replaceChildren(externalCount,connections);}
    else{$('displayStatus').classList.remove('hp-menu-counter-group');$('displayStatus').textContent=n.displayMode === 'requires-ios27-sdk'
        ? 'Для отдельного экрана на iOS 27 пересобери приложение с iOS 27 SDK.'
        : n.displayAvailable
          ? 'Дисплей доступен. Ожидаем отдельную сцену LocalParty…'
          : 'Отдельная сцена ТВ пока не подключена. Повтор экрана сам по себе не подтверждает её запуск.';}
    $('refreshDisplay').disabled = !receivedSnapshot;
    $('tvAddress').textContent = address ? address + 'tv' : 'Сначала включи доступ по Wi-Fi.';
    setSwitch('networkToggle', state.networkEnabled, 'Включён', 'Выключен'); $('networkToggle').disabled = busy();
    $('inviteBox').hidden = !hasAddress; $('inviteAddress').textContent = address;
    if (n.qr && $('inviteQR').getAttribute('src') !== n.qr) $('inviteQR').src = n.qr;
    $('inviteQR').hidden = !n.qr;
    $('wifiInviteSettings').hidden=!hasAddress; $('wifiInviteResult').hidden=!n.wifiQR;
    $('clipTestInvite').hidden=!n.clipTestQR;
    $('showClipTestTV').hidden=!n.clipTestQR||(!!n.clipTestTVActive&&!n.clipTestTVPublic);
    $('showClipPublicTV').hidden=!n.clipTestQR||(!!n.clipTestTVActive&&!!n.clipTestTVPublic);
    $('clearClipTestTV').hidden=!n.clipTestTVActive;
    if(n.clipTestQR && $('clipTestQR').getAttribute('src')!==n.clipTestQR)$('clipTestQR').src=n.clipTestQR;
    if(!n.clipTestQR){$('clipTestQR').removeAttribute('src');$('clipTestInvite').open=false;}
    $('wifiInviteSubmit').textContent=n.singleScanAvailable?'Create one-scan invitation':'Show network QR';
    $('wifiInvitePrivacy').textContent=n.singleScanAvailable?'The invitation shares your Wi-Fi access and opens the controller through an App Clip. Credentials stay only in this session.':'This QR shares access to your Wi-Fi. The password is kept only in this app session.';
    if(n.wifiQR&&$('wifiInviteQR').getAttribute('src')!==n.wifiQR)$('wifiInviteQR').src=n.wifiQR;
    if(!n.wifiQR)$('wifiInviteQR').removeAttribute('src'); $('wifiInviteName').textContent=n.wifiSSID||'';
    $('networkHint').textContent = n.working && !state.networkEnabled ? 'Настраиваем локальный HTTPS и получаем сертификат…' : state.networkEnabled && !address ? 'Адрес Wi-Fi изменился. Нажми переключатель, чтобы обновить HTTPS.' : 'Устройства должны быть в одной сети без изоляции клиентов.';
    $('transportHint').textContent = hasAddress ? 'Гости открывают игру по HTTPS без установки сертификата. Игровое соединение остаётся в вашей сети Wi-Fi.' : '';
    menuCounter($('rosterTitle'),state.players.length,'В комнате',null,true);
    const rosterKey = JSON.stringify(state.players);
    if (rosterKey !== rosterSignature) {
      rosterSignature = rosterKey; $('roster').replaceChildren();
      if (!state.players.length) $('roster').append(element('p', '', 'Пока никого. Открой свой пульт или пригласи друзей.'));
      state.players.forEach(p => {const row = element('div', 'player'); row.append(element('b', '', p.name), element('small', '', p.gameReady ? 'В игре' : 'Подключён'), button('Убрать', 'quiet', () => confirm(`Удалить ${p.name}?`, 'Контроллер отключится. Остальные игроки продолжат.', () => manage({type: 'kick', id: p.id})))); $('roster').append(row);});
    }
    $('roster').querySelectorAll('button').forEach(b => b.disabled = busy());
    setSwitch('hapticsToggle', n.haptics !== false, 'Включена', 'Выключена');
    setSwitch('awakeToggle', n.keepAwake !== false, 'Включено', 'Выключено');
    $('testHaptics').disabled = n.haptics === false;
    const matches=state.totalMatches||0;menuCounter($('matches'),matches,plural(matches,'матч','матча','матчей').replace(/^\d+\s/,''));
    const leadersKey = JSON.stringify(state.leaderboard || []);
    if (leadersKey !== standingsSignature) {
      standingsSignature = leadersKey; $('standings').replaceChildren();
      const places=companyPlaces(state.leaderboard||[]);
      (state.leaderboard || []).slice(0, 5).forEach((p,i) => {const row = element('div', 'rank-row'); const place=places[i];row.dataset.rank=String(place);row.dataset.place=String(place);row.dataset.hpRank=String(place);if(place<=3){const medal=element('img','hp-award');medal.dataset.hpRank=String(place);medal.src='/assets/awards/'+['medal-gold','medal-silver','medal-bronze'][place-1]+'.png';medal.alt=String(place)+' place';row.append(medal);}row.append(element('b', 'rank-name', p.name), element('span', 'rank-stats', plural(p.wins, 'победа', 'победы', 'побед') + ' · ' + plural(p.points, 'очко', 'очка', 'очков'))); $('standings').append(row);});
    }
    $('resetStats').disabled = busy() || Boolean(state.active);
    $('backgroundStatus').textContent = n.backgroundStatus || 'Во время игры держи приложение открытым.';
    $('backgroundRequest').disabled = !state.networkEnabled || busy();
    $('buildLabel').textContent = [n.buildLabel, 'UI: ' + shellRevision, 'Menu: ' + (window.LocalPartyCatalog?.revision || 'не загружено'), 'Native: ' + (n.bridgeRevision || 'ожидание'), 'Show: tv-show-20260918.1', n.displayMode].filter(Boolean).join(' · ');
  }
  // Thin "host choice" card at the top of the lobby: start the selected game without the panel.
  function renderChoice() {
    const g = gameById(state.selected), strip = $('choiceStrip'), wasHidden = strip.hidden;
    strip.hidden = !g || state.active?.id===g.id; if (!g) { choiceStarting = false; return; }
    // The first room snapshot arrives after the catalog is already on screen: open the
    // strip's height instead of shoving the whole page down in one frame.
    if (wasHidden && !strip.hidden && receivedSnapshot && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const cs = getComputedStyle(strip), h = strip.offsetHeight;
      strip.animate([{height:'0px',marginTop:'0px',marginBottom:'0px',opacity:0,overflow:'clip'},{height:h+'px',marginTop:cs.marginTop,marginBottom:cs.marginBottom,opacity:1,overflow:'clip'}],{duration:380,easing:'cubic-bezier(.22,1,.36,1)'});
    }
    if ($('choiceName').textContent !== g.title) { $('choiceName').textContent = g.title; $('choiceArt').src = artPath(g); $('choiceArt').hidden = !artPath(g); strip.style.setProperty('--pick-color', /^#[0-9a-f]{3,8}$/i.test(g.color||'') ? g.color : '#9b7bff'); strip.classList.remove('is-new'); void strip.offsetWidth; strip.classList.add('is-new'); }
    const count = (state.players || []).length, min = (state.botCount || 0) > 0 ? 1 : g.min;
    const choiceMeta=$('choiceMeta'), needsClock=!hasSharedScreen()||count<min;
    choiceMeta.replaceChildren();
    if(needsClock){const clock=document.createElement('span');clock.className='choice-clock';clock.setAttribute('aria-hidden','true');choiceMeta.append(clock);}
    const metaLabel=document.createElement('span');if(!hasSharedScreen())metaLabel.textContent='Ждём экран';else menuCounter(metaLabel,count>g.max?g.max:count,count>g.max?'До': 'игроков',count<min?min:null,count>g.max);if(count>g.max)metaLabel.append(document.createTextNode(' игроков'));choiceMeta.append(metaLabel);
    $('choiceStart').disabled = Boolean(pendingLaunchId) || choiceStarting || busy();
    $('choiceStart').setAttribute('aria-busy',String(Boolean(pendingLaunchId)||choiceStarting||state.busy));
    $('choiceStart').textContent = pendingLaunchId || choiceStarting || state.busy ? 'Запускаем…' : state.active?.id===g.id ? 'Открыть пульт' : 'Старт ▶';
    $('choiceStart').dataset.action=state.active?.id===g.id?'controller':'launch';
  }
  function renderTVControls() {
    renderChoice();
    const tv=state.tv, unavailable=!tv||busy(), active=!!state.active;
    const canCover=tv?.canCover===true;
    $('tvShowQR').disabled=unavailable||!canCover||pendingQR;
    if(pendingQR&&state.networkEnabled&&state.native?.address){pendingQR=false;manage({type:'tv-overlay',mode:'qr'});}
    const bots=state.botCount||0,humans=(state.players||[]).filter(p=>!p.testBot).length;$('botCount').textContent=String(bots);
    const botLocked=!!state.active&&state.active.ui?.phase!=='waiting',botLimit=Math.min(16,gameById(state.active?.id)?.max||16);
    $('botMinus').disabled=busy()||botLocked||bots<1;$('botPlus').disabled=busy()||botLocked||!state.screens||bots>=15||bots+humans>=botLimit;
    $('botHint').textContent=botLocked?'Боты доступны до старта матча.':!state.screens?'Боты играют через общий экран — подключи телевизор.':'Тестовые игроки, очки не записываются.';
    $('tvShowCompany').disabled=unavailable||!canCover||!tv?.hasCompany;
    $('tvShowMatch').disabled=unavailable||!canCover||!tv?.hasMatch;
    $('tvCloseOverlay').disabled=unavailable||tv.mode==='none';
    $('tvShowQR').setAttribute('aria-pressed',String(tv?.mode==='qr'));
    $('tvShowCompany').setAttribute('aria-pressed',String(tv?.mode==='podium'&&tv.board?.kind==='company'));
    $('tvShowMatch').setAttribute('aria-pressed',String(tv?.mode==='podium'&&tv.board?.kind==='match'));
    for(const id of ['tvPrev','tvNext','tvUp','tvDown','tvGameNumber','tvSelectGame'])$(id).disabled=unavailable||active||!state.catalog.length;
    document.querySelectorAll('[data-tv-genre]').forEach(b=>b.disabled=unavailable||active);
    const focus=gameById(tv?.focusId);
    $('tvSelectGame').disabled ||= !focus;
    $('tvGameNumber').max=String(state.catalog.length);
    if(document.activeElement!==$('tvGameNumber'))$('tvGameNumber').value=tv?.focusNumber||'';
    $('tvFocusName').textContent=focus?`№ ${tv.focusNumber} / ${tv.total} · ${focus.title}`:'Стрелки листают игры на ТВ. Матч сам не запустится.';
    $('tvControlHint').textContent=!tv?'Обнови сборку: сервер ещё не передал управление показом.':!canCover?'Чтобы показать QR или пьедестал, сначала нажми «Пауза».':tv.mode==='qr'?'На ТВ — большая карточка приглашения.':tv.mode==='podium'?`На ТВ — ${tv.board?.subtitle||'пьедестал'}.`:'Выбирай, что показать компании. На ТВ нет кнопок администратора.';
    $('tvPause').disabled=unavailable||!active;
    $('tvPause').textContent=state.active?.session?.paused?'Продолжить матч':'Пауза';
    for(const [id,key,on,off] of [['tvAutoPodium','autoPodium','Включён','Выключен'],['tvEffects','effects','Включены','Выключены'],['tvIdleBrowse','idleBrowse','Включено','Выключено']]){setSwitch(id,tv?.[key],on,off);$(id).disabled=unavailable;}
  }
  function setSwitch(id, enabled, on, off) { const b = $(id); b.setAttribute('aria-checked', String(Boolean(enabled))); b.textContent = enabled ? on : off; }
  function update(value) {
    if (!value || !Array.isArray(value.catalog) || !Array.isArray(value.players)) return false;
    // Retain the last real catalog across transient empty snapshots. Do not invent
    // game IDs; disable launch until the authoritative server catalog returns.
    if (!value.catalog.length && state.catalog.length) {
      value = {...value, catalog: state.catalog, native: {...value.native, catalogReady: false,
        catalogError: value.native?.catalogError || 'Восстанавливаем каталог сервера. Список игр сохранён.'}};
    }
    const returnedToLobby=!!state.active&&!value.active;
    const botError=botRequest&&value.native?.message&&value.native.message!==state.native?.message&&!value.native?.working;
    const launchError=pendingLaunchId&&value.native?.message&&value.native.message!==state.native?.message&&!value.native?.working&&!value.busy;
    if(botError){clearTimeout(botRequestTimer);botRequest=null;}
    state = value;
    if(botRequest&&(Number(state.botCount)||0)===botRequest.target&&state.players.filter(p=>p.testBot).length===botRequest.target){clearTimeout(botRequestTimer);botRequest=null;}
    window.PartyI18n?.protectPlayers([...(state.players||[]),...(state.leaderboard||[]),...(state.active?.roster||[])]);
    window.PartyI18n?.acceptRoomLanguage(state.languageOverride);
    if(pendingLaunchId&&state.active?.id===pendingLaunchId) clearPendingLaunch();
    else if(pendingLaunchId&&(launchError||returnedToLobby)) clearPendingLaunch();
    else if(pendingLaunchId&&launchAwaitingScreen&&hasSharedScreen()) dispatchPendingLaunch();
    receivedSnapshot = true; clearTimeout(readyTimer); readyTimer = null;
    const connectionIssue=state.native?.connectionStatus||'';
    $('connection').textContent = connectionIssue ? (connectionIssue.includes('недоступен')?'Сервер недоступен':'Восстанавливаем комнату…') : (state.native?.ready ? 'Комната готова' : 'Подготавливаем комнату…');
    $('connection').title=connectionIssue;
    $('connection').classList.toggle('online', Boolean(state.native?.ready && !state.native?.connectionStatus));
    if(state.catalog.length)menuCounter($('gameCount'),state.catalog.length,plural(state.catalog.length,'игра','игры','игр').replace(/^\d+\s/,''));else{$('gameCount').classList.remove('hp-menu-counter');$('gameCount').textContent='Каталог загружается';}
    menuCounter($('playerCount'),state.players.length,plural(state.players.length,'игрок','игрока','игроков').replace(/^\d+\s/,''));if(state.screens)menuCounter($('screenCount'),state.screens,plural(state.screens,'общий экран','общих экрана','общих экранов').replace(/^\d+\s/,''));else{$('screenCount').classList.remove('hp-menu-counter');$('screenCount').textContent='Экран не подключён';}
    const message = state.native?.message || state.native?.catalogError || state.native?.connectionStatus || state.incident?.message;
    $('message').hidden = !message; $('messageText').textContent = message || '';
    $('messageTitle').textContent=connectionIssue?'Нет связи с локальным сервером':'Сообщение комнаты';
    ['openController', 'playHere', 'detailController'].forEach(id => $(id).disabled = !state.native?.ready);
    $('forceRoomLanguage').disabled=busy();
    renderCatalog();
    renderActive(); renderRoom(); renderTVControls(); updateDetail();renderBotPrompt();if(botError&&botPromptGame)$('startBotsHint').textContent=value.native.message;
    if(returnedToLobby)window.dispatchEvent(new CustomEvent('party-lobby-enter'));
    return true; // acknowledgement used by the native delivery state machine
  }
  let deckAnimation, deckSlot = 0, syncDeckStack = () => {};
  // The deck is sticky but still occupies its slot in the page flow. Shrinking that slot
  // on compaction pulled everything below it up ~140 px mid-scroll (WebKit has no scroll
  // anchoring). While compact, a bottom margin keeps the slot at its expanded height.
  function animateDeck(change) {
    const card=$('activeCard'), before=card.getBoundingClientRect().height, wasCompact=card.classList.contains('is-compact');
    const mbBefore=parseFloat(getComputedStyle(card).marginBottom)||0;
    deckAnimation?.cancel(); card.style.marginBottom=''; change();
    const compact=card.classList.contains('is-compact');
    if (compact && !wasCompact) deckSlot=before+mbBefore; else if (!compact) deckSlot=0;
    const after=card.getBoundingClientRect().height, mbAfter=compact?Math.max(0,deckSlot-after):0;
    if (mbAfter) card.style.marginBottom=mbAfter+'px';
    if (!card.hidden && before && after && before!==after && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      deckAnimation=card.animate([{height:before+'px',marginBottom:mbBefore+'px',overflow:'clip'},{height:after+'px',marginBottom:mbAfter+'px',overflow:'clip'}],{duration:150,easing:'cubic-bezier(.22,1,.36,1)'});
    }
  }
  function setDeckExpanded(expanded) { animateDeck(()=>{ $('activeMore').setAttribute('aria-expanded',String(expanded)); $('activeCard').classList.toggle('is-expanded',expanded); }); syncDeckStack(); }
  $('activeMore').onclick=()=>{closeBotPrompt(); if(dialogs.some(id=>$(id).open))return; setDeckExpanded($('activeMore').getAttribute('aria-expanded')!=='true');};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialogs.some(id=>$(id).open))setDeckExpanded(false);});
  document.addEventListener('pointerdown',e=>{if(!dialogs.some(id=>$(id).open)&&!$('activeCard').contains(e.target)&&$('activeCard').classList.contains('is-expanded'))setDeckExpanded(false);});
  $('openHost').onclick = () => show('hostPanel');
  if(window.PartyI18n) $('hostLanguageSettings').insertBefore(window.PartyI18n.createPicker(),$('forceRoomLanguage'));
  $('forceRoomLanguage').onclick=()=>confirm('Изменить язык всей комнаты?', 'Язык изменится у всех игроков. После этого каждый сможет снова выбрать свой.',()=>manage({type:'force-language',language:window.PartyI18n?.language||'en'}));
  ['openController', 'playHere', 'detailController'].forEach(id => $(id).onclick = controller);
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => close(b.dataset.close));
  $('airplayHelp').onclick = () => { $('airplayInstructions').hidden = !$('airplayInstructions').hidden; };
  $('refreshDisplay').onclick = () => send('screen-refresh');
  $('wifiInviteSecurity').onchange=()=>{const open=$('wifiInviteSecurity').value==='nopass';$('wifiInvitePasswordLabel').hidden=open;$('wifiInvitePassword').required=!open;};
  $('wifiInviteForm').onsubmit=e=>{e.preventDefault();const ssid=$('wifiInviteSSID').value,password=$('wifiInvitePassword').value,security=$('wifiInviteSecurity').value;if(!ssid||new TextEncoder().encode(ssid).length>32){toast('Network name must be 1–32 bytes.');return;}if(security==='WPA'&&!((new TextEncoder().encode(password).length>=8&&new TextEncoder().encode(password).length<=63)||/^[0-9a-f]{64}$/i.test(password))){toast('Enter the Wi-Fi password (8–63 characters or 64 hex digits).');return;}send('wifi-invite',{ssid,password:security==='nopass'?'':password,security});$('wifiInvitePassword').value='';};
  $('copyClipTest').onclick=()=>send('copy-clip-test');
  $('showClipTestTV').onclick=()=>send('clip-test-tv-show');
  $('showClipPublicTV').onclick=()=>send('clip-public-tv-show');
  $('clearClipTestTV').onclick=()=>send('clip-test-tv-clear');
  $('wifiInviteClear').onclick=()=>{send('wifi-invite-clear');$('wifiInvitePassword').value='';$('wifiInviteSSID').value='';};
  $('networkToggle').onclick = () => { if (state.networkEnabled && state.native?.address) confirm('Выключить доступ по Wi-Fi?', 'Телефоны гостей отключатся. AirPlay и твой встроенный пульт останутся.', () => send('network-set', {enabled: false})); else send('network-set', {enabled: true}); };
  $('hapticsToggle').onclick = () => send('haptics-set', {enabled: state.native?.haptics === false});
  $('awakeToggle').onclick = () => send('awake-set', {enabled: state.native?.keepAwake === false});
  $('testHaptics').onclick = () => send('haptic', {pattern: [18, 65, 30]});
  $('shareInvite').onclick = () => send('share-invite'); $('copyInvite').onclick = () => { send('copy-invite'); };
  $('backgroundRequest').onclick = () => send('background-request'); $('shareDiagnostics').onclick = () => send('share-diagnostics');
  $('resetStats').onclick = () => confirm('Сбросить статистику?', 'Очки и история матчей будут очищены. Профили игроков сохранятся.', () => manage({type: 'statistics-reset'}));
  $('launchGame').onclick = () => {if ($('launchGame').disabled) return;launchPending=true;launchFromCard(selectedDetail,$('launchGame'));};
  $('confirmCancel').onclick = () => close('confirmDialog');
  $('confirmYes').onclick = () => { const action = confirmAction; confirmAction = null; close('confirmDialog'); action?.(); };
  $('confirmDialog').addEventListener('close', () => { confirmAction = null; });
  $('search').addEventListener('input', renderCatalog);
  // One sliding pill follows the active category; the row scrolls it into the middle.
  const filters = document.querySelector('.catalog-filters');
  function moveTabIndicator(scroll) {
    const tab = filters?.querySelector('.filter-tab.active'); if (!tab || !tab.offsetWidth) return;
    const first = !filters.classList.contains('indicator-ready');
    if (first) filters.classList.add('indicator-init');
    filters.style.setProperty('--tab-x', tab.offsetLeft + 'px'); filters.style.setProperty('--tab-y', tab.offsetTop + 'px');
    filters.style.setProperty('--tab-w', tab.offsetWidth + 'px'); filters.style.setProperty('--tab-h', tab.offsetHeight + 'px');
    filters.classList.toggle('fresh-active', tab.classList.contains('fresh-tab')); filters.classList.add('indicator-ready');
    if (first) requestAnimationFrame(() => requestAnimationFrame(() => filters.classList.remove('indicator-init')));
    if (scroll && filters.scrollWidth > filters.clientWidth) filters.scrollTo({left: tab.offsetLeft - (filters.clientWidth - tab.offsetWidth) / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  }
  document.querySelectorAll('[data-section]').forEach(b => b.onclick = () => {section = b.dataset.section; document.querySelectorAll('[data-section]').forEach(x => {x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b));}); moveTabIndicator(true); renderCatalog();});
  // Search + tabs stick under the masthead; one shared backdrop takes over once they touch it.
  const masthead = document.querySelector('.app-header'), tools = document.querySelector('.native-catalog-tools');
  if (masthead && tools) {
    let frame = 0;
    const stackBacking=document.createElement('div');stackBacking.className='native-stack-backing';stackBacking.setAttribute('aria-hidden','true');document.querySelector('main').append(stackBacking);
    const syncStick = () => {frame = 0; const card=$('activeCard');const wasCompact=card.classList.contains('is-compact'),compact=wasCompact?scrollY>8:scrollY>24;if(compact!==wasCompact)animateDeck(()=>{card.classList.toggle('is-compact',compact);card.classList.remove('is-expanded');$('activeMore').setAttribute('aria-expanded','false');});const head = masthead.offsetHeight,run=$('activeCard').hidden?0:$('activeCard').getBoundingClientRect().height,choice=$('choiceStrip').hidden?0:$('choiceStrip').getBoundingClientRect().height; document.documentElement.style.setProperty('--host-head', head + 'px');document.documentElement.style.setProperty('--host-run',run+'px');document.documentElement.style.setProperty('--host-choice',choice+'px'); document.body.classList.toggle('tools-stuck', tools.getBoundingClientRect().top <= head + run + choice + 13);const backed=Boolean(run||choice||document.body.classList.contains('tools-stuck')); document.body.classList.toggle('stack-backed',backed); stackBacking.hidden=!backed; const stackBottom=document.body.classList.contains('tools-stuck')?tools.getBoundingClientRect().bottom:Math.max(masthead.getBoundingClientRect().bottom,...[$('activeCard'),$('choiceStrip')].filter(e=>!e.hidden).map(e=>e.getBoundingClientRect().bottom)); stackBacking.style.height=(stackBottom+48)+'px';if(deckAnimation?.playState==='running'&&!frame)frame=requestAnimationFrame(syncStick);};
    syncDeckStack=syncStick;
    const queueStick = () => {if (!frame) frame = requestAnimationFrame(syncStick);};
    addEventListener('scroll', queueStick, {passive: true}); new ResizeObserver(queueStick).observe(masthead); syncStick();
    new ResizeObserver(queueStick).observe($('activeCard'));
    new ResizeObserver(queueStick).observe($('choiceStrip'));
  }
  if (filters) {
    const syncFilterEdges = () => {
      filters.classList.toggle('can-scroll-left', filters.scrollLeft > 2);
      filters.classList.toggle('can-scroll-right', filters.scrollLeft + filters.clientWidth < filters.scrollWidth - 2);
    };
    filters.addEventListener('scroll', syncFilterEdges, {passive: true});
    new ResizeObserver(() => { moveTabIndicator(false); syncFilterEdges(); }).observe(filters);
    document.fonts?.ready.then(() => moveTabIndicator(false));
    moveTabIndicator(false); syncFilterEdges();
  }
  const showTV=(mode,boardKind)=>manage({type:'tv-overlay',mode,...(boardKind?{boardKind}:{})});
  $('tvShowQR').onclick=()=>{
    if(state.tv?.mode==='qr'){showTV('none');return;}
    // The QR needs a guest address: switch Wi-Fi sharing on, then show the card once it exists.
    if(!state.networkEnabled||!state.native?.address){pendingQR=true;$('tvShowQR').disabled=true;$('tvControlHint').textContent='Включаем доступ по Wi-Fi для гостей…';if(!state.networkEnabled)send('network-set',{enabled:true});setTimeout(()=>{if(pendingQR){pendingQR=false;renderTVControls();}},8000);return;}
    showTV('qr');
  };
  $('startBotsPlus').onclick=()=>changePromptBots(1);$('startBotsMinus').onclick=()=>changePromptBots(-1);
  $('startBotsClose').onclick=closeBotPrompt;$('startBotsLaunch').onclick=()=>{if(!$('startBotsLaunch').disabled)launchFromCard(botPromptGame,botPromptAnchor);};
  document.addEventListener('pointerdown',e=>{if(botPromptGame&&!$('startBots').contains(e.target)&&!botPromptAnchor?.contains(e.target))closeBotPrompt();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&botPromptGame){e.preventDefault();closeBotPrompt();}});
  window.addEventListener('resize',positionBotPrompt);window.addEventListener('scroll',positionBotPrompt,true);window.visualViewport?.addEventListener('resize',positionBotPrompt);
  $('botPlus').onclick=()=>manage({type:'bots-set',count:(state.botCount||0)+1});
  $('botMinus').onclick=()=>manage({type:'bots-set',count:Math.max(0,(state.botCount||0)-1)});
  $('tvShowCompany').onclick=()=>showTV('podium','company');
  $('tvShowMatch').onclick=()=>showTV('podium','match');
  $('tvCloseOverlay').onclick=()=>showTV('none');
  // The remote mirrors the TV layout: featured bento (2 rows), the Fresh shelf (row 3),
  // the remaining arcade grid and table games, three columns each.
  function tvLayout(){
    const games=state.catalog||[];
    if(tvRemoteGenre!=='all'){const ids=games.filter(g=>tvRemoteGenre==='fresh'?(window.LocalPartyCatalog?.freshIds||[]).includes(g.id):window.LocalPartyCatalog?.category(g)===tvRemoteGenre).map(g=>g.id),rows=[];for(let i=0;i<ids.length;i+=4)rows.push(ids.slice(i,i+4).map((id,c)=>({id,c0:c,c1:c})));return{order:ids,rows};}
    const freshIds=(window.LocalPartyCatalog?.freshIds||[]).filter(id=>games.some(g=>g.id===id));
    const others=games.filter(g=>!freshIds.includes(g.id)),main=others.filter(g=>g.section!=='table').sort((a,b)=>Number(b.id==='tankarena')-Number(a.id==='tankarena')).map(g=>g.id);
    const lead=main.slice(0,5),more=main.slice(5),table=others.filter(g=>g.section==='table').map(g=>g.id),rows=[];
    if(lead.length){rows.push([{id:lead[0],c0:0,c1:1},...[lead[1],lead[2]].map((id,k)=>id&&{id,c0:2+k,c1:2+k}).filter(Boolean)]);if(lead.length>3)rows.push([{id:lead[0],c0:0,c1:1},...[lead[3],lead[4]].map((id,k)=>id&&{id,c0:2+k,c1:2+k}).filter(Boolean)]);}
    if(freshIds.length)rows.push(freshIds.map((id,i)=>({id,c0:i,c1:i,fresh:true})));
    for(const list of [more,table])for(let i=0;i<list.length;i+=4)rows.push(list.slice(i,i+4).map((id,k)=>({id,c0:k,c1:k})));
    return {order:[...lead,...freshIds,...more,...table],rows};
  }
  function focusTV(id){if(id)manage({type:'tv-focus',id});}
  function stepTV(direction){
    const {order}=tvLayout();if(!order.length)return;const current=order.indexOf(state.tv?.focusId||state.selected);
    focusTV(order[current<0?(direction>0?0:order.length-1):(current+direction+order.length)%order.length]);
  }
  function moveTV(direction){
    const {order,rows}=tvLayout();if(!rows.length)return;const current=state.tv?.focusId||state.selected;
    const at=rows.map((row,i)=>row.some(c=>c.id===current)?i:-1).filter(i=>i>=0);
    if(!at.length){focusTV(order[0]);return;}
    const from=direction>0?at[at.length-1]:at[0],cell=rows[from].find(c=>c.id===current);
    if(cell.fresh)lastFreshId=cell.id;else lastTVColumn=(cell.c0+cell.c1)/2;
    const target=rows[from+direction];if(!target)return;
    if(target[0].fresh){focusTV(target.some(c=>c.id===lastFreshId)?lastFreshId:target[0].id);return;}
    const col=Math.min(3,lastTVColumn),hit=target.find(c=>c.c0<=col&&col<=c.c1)||target.reduce((a,b)=>Math.abs((a.c0+a.c1)/2-col)<=Math.abs((b.c0+b.c1)/2-col)?a:b);
    focusTV(hit.id);
  }
  document.querySelectorAll('[data-tv-genre]').forEach(b=>b.onclick=()=>{tvRemoteGenre=b.dataset.tvGenre;document.querySelectorAll('[data-tv-genre]').forEach(chip=>chip.setAttribute('aria-pressed',String(chip===b)));focusTV(tvLayout().order[0]);});
  $('tvPrev').onclick=()=>stepTV(-1);
  $('tvNext').onclick=()=>stepTV(1);
  $('tvUp').onclick=()=>moveTV(-1);
  $('tvDown').onclick=()=>moveTV(1);
  // Folded rule rows open on tap.
  // Native details keep long controls available by keyboard and touch.
  $('choiceStart').onclick=()=>{if(!$('choiceStart').disabled)launchFromCard(state.selected,$('choiceStart'));};
  $('choiceOpen').onclick=()=>{if(state.selected)openGame(state.selected);};
  function focusNumber(){const number=Number($('tvGameNumber').value);if(!Number.isInteger(number)||number<1||number>state.catalog.length){toast('Введи номер от 1 до '+state.catalog.length);return;}manage({type:'tv-focus',number});}
  $('tvGameNumber').onchange=focusNumber;
  $('tvGameNumber').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('tvGameNumber').blur();}};
  $('tvSelectGame').onclick=()=>{if(state.tv?.focusId){close('hostPanel');openGame(state.tv.focusId);}};
  $('tvPause').onclick=()=>manage({type:'pause',paused:!state.active?.session?.paused});
  for(const [id,key] of [['tvAutoPodium','autoPodium'],['tvEffects','effects'],['tvIdleBrowse','idleBrowse']])$(id).onclick=()=>manage({type:'tv-options',options:{[key]:!state.tv?.[key]}});
  function requestSnapshot() {
    clearTimeout(readyTimer); readyTimer = null;
    if (!canSend() || document.visibilityState === 'hidden') return;
    send('ready');
    if (!receivedSnapshot) {
      handshakeAttempts += 1;
      if (handshakeAttempts >= 8) $('connection').textContent = 'Восстанавливаем связь с приложением…';
      readyTimer = setTimeout(requestSnapshot, handshakeAttempts < 8 ? 500 : 2000);
    }
  }
  $('retryCatalog').onclick = () => { receivedSnapshot = false; handshakeAttempts = 0; requestSnapshot(); };
  window.addEventListener('pageshow', requestSnapshot);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { clearTimeout(readyTimer); readyTimer = null; }
    else { send('resync'); requestSnapshot(); }
  });
  window.addEventListener('pagehide', () => { clearTimeout(readyTimer); readyTimer = null; });
  // Only Swift sends snapshots. No admin token is exposed to this document or the LAN.
  window.LocalPartyHost = Object.freeze({update, toast});
  renderCatalog(); renderRoom(); renderTVControls();
  ['openController', 'playHere', 'detailController'].forEach(id => $(id).disabled = true);
  requestSnapshot();
})();
