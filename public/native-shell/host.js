(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let state = {catalog: [], players: [], leaderboard: [], votes: [], native: {}}, section = 'all', pendingQR = false, choiceStarting = false, lastTVColumn = 0, lastFreshId = null;
  let selectedDetail = null, catalogSignature = '', rosterSignature = '', actionsSignature = '', standingsSignature = '';
  let confirmAction = null, launchPending = false, toastTimer, pendingLaunchId = null, launchTimer, launchAwaitingScreen = false;
  let receivedSnapshot = false, readyTimer = null, handshakeAttempts = 0;
  const shellRevision = 'ios-recovery-20260918.1';
  const dialogs = ['hostPanel', 'gameDetail', 'confirmDialog'];
  const element = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
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
  function closeBotPrompt(){const box=$('startBots');if(box.matches(':popover-open'))box.hidePopover();box.hidden=true;botPromptGame=null;botPromptAnchor?.setAttribute('aria-expanded','false');botPromptAnchor=null;}
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
  function showBotPrompt(id,anchor){closeBotPrompt();botPromptGame=id;botPromptAnchor=anchor||document.activeElement||$('choiceStart');botPromptAnchor.setAttribute('aria-expanded','true');const box=$('startBots');(botPromptAnchor.closest('dialog')||document.body).append(box);box.hidden=false;box.showPopover?.();renderBotPrompt();$('startBotsPlus').focus({preventScroll:true});}
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
  // iOS-style sheets: spring up on open, slide down before the dialog actually closes.
  const closing = {};
  function show(id) { closeBotPrompt(); setDeckExpanded(false); for (const other of dialogs) { if (other !== id && $(other).open) { clearTimeout(closing[other]); delete closing[other]; $(other).classList.remove('sheet-closing'); $(other).close(); } } const d = $(id); if (closing[id]) { clearTimeout(closing[id]); delete closing[id]; d.classList.remove('sheet-closing'); } if (!d.open) { openers[id] = document.activeElement; d.showModal(); holdEntranceUntilPainted(d); } }
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
    const d = $(id); if (!d.open || closing[id]) return;
    const finish = () => { delete closing[id]; if (d.open) d.close(); d.classList.remove('sheet-closing'); const opener = openers[id]; delete openers[id];
      if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({preventScroll:true}); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    d.classList.add('sheet-closing'); closing[id] = setTimeout(finish, 260);
  }
  function confirm(title, text, action) { $('confirmTitle').textContent = title; $('confirmText').textContent = text; confirmAction = action; show('confirmDialog'); }
  function controller() { if (busy()) return; closeBotPrompt(); dialogs.forEach(close); if(window.LocalPartyTabs)window.LocalPartyTabs.select('controller');else send('controller'); }
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
    // A confirmed running game's action is navigation, never a second launch.
    if(state.active){const action=$('catalog').querySelector(`[data-game="${CSS.escape(state.active.id)}"] .lp-direct-start`);if(action){action.textContent='Открыть пульт';action.disabled=busy()||Boolean(pendingLaunchId);}}
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
    document.body.classList.toggle('has-active-game',Boolean(game));$('activeCard').hidden = !game; if (!game) { actionsSignature = ''; return; }
    $('activeCard').classList.toggle('is-paused',Boolean(run.session?.paused));
    $('activeTitle').textContent = game.title;
    const roster=run.roster||[],ready=new Set(run.session?.readyIds||[]),missing=roster.filter(p=>!p.testBot&&(!p.connected||!p.gameReady||!ready.has(p.id)));
    $('activeStatus').textContent = run.startError || (run.session?.paused ? 'Игра на паузе' : run.ui?.phase==='waiting' ? `Готовы ${roster.filter(p=>p.testBot||ready.has(p.id)).length}/${roster.length}${missing.length?' · ждём: '+missing.map(p=>p.name).join(', '):''}` : run.ui?.progress || run.ui?.label || 'Игра идёт');
    const actions = (game.hostControls?.actions || []).filter(a => a.phases.includes(run.ui?.phase) && (!run.ui?.hostActions || run.ui.hostActions.includes(a.id)));
    $('activeStatus').title = $('activeStatus').textContent;
    const signature = JSON.stringify([run.instance, run.ui?.phase, run.session?.paused, run.startError, actions]);
    if (signature !== actionsSignature) {
      actionsSignature = signature; const box = $('activeActions'); box.replaceChildren();
      const remote = button('Пульт', 'quiet native-controller-shortcut', controller);
      remote.id = 'activeController';
      box.append(remote);
      const settings=button('Настройки выбранной игры','quiet native-run-settings',()=>openGame(game.id));box.append(settings);
      if(run.ui?.phase==='waiting'){const force=button('Начать сейчас ▶','lime small',()=>manage({type:'force-start',instance:run.instance}));force.dataset.forceStart='true';box.append(force);}
      actions.forEach(a => {const b = button(a.label, 'quiet', () => manage({type: 'game-action', instance: run.instance, action: a.id})); b.dataset.phaseAction = 'true'; box.append(b);});
      if (run.startError) box.append(button('Повторить запуск', 'lime small', () => manage({type: 'retry-start', instance: run.instance})));
      if (run.ui?.phase === 'results') box.append(button('Сыграть ещё раз', 'lime small', () => manage({type: 'launch', id: game.id})));
      if(run.ui?.phase!=='waiting'&&run.ui?.phase!=='results')box.append(button(run.session?.paused ? 'Продолжить' : 'Пауза', 'quiet', () => manage({type: 'pause', paused: !state.active?.session?.paused})));
      box.append(button('В лобби', 'quiet native-danger', () => confirm('Закончить игру?', 'Текущий матч завершится для всей компании.', () => manage({type: 'stop'}))));
    }
    $('activeActions').querySelectorAll('button').forEach(b => b.disabled = busy() || (b.dataset.phaseAction === 'true' && Boolean(run.session?.paused)) || (b.dataset.forceStart==='true'&&Number(run.ready?.length||0)<((state.botCount||0)>0?1:game.min)));
  }
  function renderRoom() {
    const n = state.native || {}, address = n.address || '', hasAddress = Boolean(state.networkEnabled && address);
    const external = Number(n.externalDisplays) || 0;
    $('displayStatus').textContent = external > 0
      ? `Отдельная сцена ТВ: ${external}. Игровых подключений экрана: ${state.screens || 0}.`
      : n.displayMode === 'requires-ios27-sdk'
        ? 'Для отдельного экрана на iOS 27 пересобери приложение с iOS 27 SDK.'
        : n.displayAvailable
          ? 'Дисплей доступен. Ожидаем отдельную сцену LocalParty…'
          : 'Отдельная сцена ТВ пока не подключена. Повтор экрана сам по себе не подтверждает её запуск.';
    $('refreshDisplay').disabled = !receivedSnapshot;
    $('tvAddress').textContent = address ? address + 'tv' : 'Сначала включи доступ по Wi-Fi.';
    setSwitch('networkToggle', state.networkEnabled, 'Включён', 'Выключен'); $('networkToggle').disabled = busy();
    $('inviteBox').hidden = !hasAddress; $('inviteAddress').textContent = address;
    if (n.qr && $('inviteQR').getAttribute('src') !== n.qr) $('inviteQR').src = n.qr;
    $('inviteQR').hidden = !n.qr;
    $('networkHint').textContent = n.working && !state.networkEnabled ? 'Настраиваем локальный HTTPS и получаем сертификат…' : state.networkEnabled && !address ? 'Адрес Wi-Fi изменился. Нажми переключатель, чтобы обновить HTTPS.' : 'Устройства должны быть в одной сети без изоляции клиентов.';
    $('transportHint').textContent = hasAddress ? 'Гости открывают игру по HTTPS без установки сертификата. Игровое соединение остаётся в вашей сети Wi-Fi.' : '';
    $('rosterTitle').textContent = `В комнате · ${state.players.length}`;
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
    $('matches').textContent = plural(state.totalMatches || 0, 'матч', 'матча', 'матчей');
    const leadersKey = JSON.stringify(state.leaderboard || []);
    if (leadersKey !== standingsSignature) {
      standingsSignature = leadersKey; $('standings').replaceChildren();
      (state.leaderboard || []).slice(0, 5).forEach(p => {const row = element('div', 'rank-row'); row.append(element('b', 'rank-name', p.name), element('span', 'rank-stats', plural(p.wins, 'победа', 'победы', 'побед') + ' · ' + plural(p.points, 'очко', 'очка', 'очков'))); $('standings').append(row);});
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
    if ($('choiceName').textContent !== g.title) { $('choiceName').textContent = g.title; $('choiceArt').src = artPath(g); $('choiceArt').hidden = !artPath(g); strip.classList.remove('is-new'); void strip.offsetWidth; strip.classList.add('is-new'); }
    const count = (state.players || []).length, min = (state.botCount || 0) > 0 ? 1 : g.min;
    $('choiceMeta').textContent = !hasSharedScreen() ? '◷ Ждём экран' : count < min ? `◷ ${count}/${min} игроков` : count > g.max ? `До ${g.max} игроков` : `${count} игроков`;
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
    $('botMinus').disabled=busy()||!!state.active||bots<1;$('botPlus').disabled=busy()||!!state.active||!state.screens||bots>=15||bots+humans>=16;
    $('botHint').textContent=!state.screens?'Боты играют через общий экран — подключи телевизор.':'Тестовые игроки, очки не записываются.';
    $('tvShowCompany').disabled=unavailable||!canCover||!tv?.hasCompany;
    $('tvShowMatch').disabled=unavailable||!canCover||!tv?.hasMatch;
    $('tvCloseOverlay').disabled=unavailable||tv.mode==='none';
    $('tvShowQR').setAttribute('aria-pressed',String(tv?.mode==='qr'));
    $('tvShowCompany').setAttribute('aria-pressed',String(tv?.mode==='podium'&&tv.board?.kind==='company'));
    $('tvShowMatch').setAttribute('aria-pressed',String(tv?.mode==='podium'&&tv.board?.kind==='match'));
    for(const id of ['tvPrev','tvNext','tvUp','tvDown','tvGameNumber','tvSelectGame'])$(id).disabled=unavailable||active||!state.catalog.length;
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
    $('gameCount').textContent = (state.catalog.length ? plural(state.catalog.length, 'игра', 'игры', 'игр') : 'Каталог загружается'); $('playerCount').textContent = plural(state.players.length, 'игрок', 'игрока', 'игроков'); $('screenCount').textContent = state.screens ? plural(state.screens, 'общий экран', 'общих экрана', 'общих экранов') : 'Экран не подключён';
    const message = state.native?.message || state.native?.catalogError || state.native?.connectionStatus || state.incident?.message;
    $('message').hidden = !message; $('messageText').textContent = message || '';
    $('messageTitle').textContent=connectionIssue?'Нет связи с локальным сервером':'Сообщение комнаты';
    ['openController', 'playHere', 'detailController'].forEach(id => $(id).disabled = busy());
    $('forceRoomLanguage').disabled=busy();
    renderCatalog(); renderActive(); renderRoom(); renderTVControls(); updateDetail();renderBotPrompt();if(botError&&botPromptGame)$('startBotsHint').textContent=value.native.message;
    if(returnedToLobby)window.dispatchEvent(new CustomEvent('party-lobby-enter'));
    return true; // acknowledgement used by the native delivery state machine
  }
  let deckAnimation;
  function animateDeck(change) {
    const card=$('activeCard'), before=card.getBoundingClientRect().height;
    deckAnimation?.cancel(); change();
    const after=card.getBoundingClientRect().height;
    if (!card.hidden && before && after && before!==after && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      deckAnimation=card.animate([{height:before+'px',overflow:'clip'},{height:after+'px',overflow:'clip'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});
    }
  }
  function setDeckExpanded(expanded) { animateDeck(()=>{ $('activeMore').setAttribute('aria-expanded',String(expanded)); $('activeCard').classList.toggle('is-expanded',expanded); }); }
  $('activeMore').onclick=()=>{closeBotPrompt(); if(dialogs.some(id=>$(id).open))return; setDeckExpanded($('activeMore').getAttribute('aria-expanded')!=='true');};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setDeckExpanded(false);});
  document.addEventListener('pointerdown',e=>{if(!$('activeCard').contains(e.target)&&$('activeCard').classList.contains('is-expanded'))setDeckExpanded(false);});
  $('openHost').onclick = () => show('hostPanel');
  if(window.PartyI18n) $('hostLanguageSettings').insertBefore(window.PartyI18n.createPicker(),$('forceRoomLanguage'));
  $('forceRoomLanguage').onclick=()=>confirm('Изменить язык всей комнаты?', 'Язык изменится у всех игроков. После этого каждый сможет снова выбрать свой.',()=>manage({type:'force-language',language:window.PartyI18n?.language||'en'}));
  ['openController', 'playHere', 'detailController'].forEach(id => $(id).onclick = controller);
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => close(b.dataset.close));
  $('airplayHelp').onclick = () => { $('airplayInstructions').hidden = !$('airplayInstructions').hidden; };
  $('refreshDisplay').onclick = () => send('screen-refresh');
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
    const syncStick = () => {frame = 0; const card=$('activeCard');const wasCompact=card.classList.contains('is-compact'),compact=wasCompact?scrollY>64:scrollY>160;if(compact!==wasCompact)animateDeck(()=>{card.classList.toggle('is-compact',compact);card.classList.remove('is-expanded');$('activeMore').setAttribute('aria-expanded','false');});const head = masthead.offsetHeight,run=$('activeCard').hidden?0:$('activeCard').offsetHeight,choice=$('choiceStrip').hidden?0:$('choiceStrip').offsetHeight; document.documentElement.style.setProperty('--host-head', head + 'px');document.documentElement.style.setProperty('--host-run',run+'px');document.documentElement.style.setProperty('--host-choice',choice+'px'); document.body.classList.toggle('tools-stuck', tools.getBoundingClientRect().top <= head + run + choice + 13);};
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
    const games=state.catalog||[],freshIds=(window.LocalPartyCatalog?.freshIds||[]).filter(id=>games.some(g=>g.id===id));
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
  $('tvPrev').onclick=()=>stepTV(-1);
  $('tvNext').onclick=()=>stepTV(1);
  $('tvUp').onclick=()=>moveTV(-1);
  $('tvDown').onclick=()=>moveTV(1);
  // Folded rule rows open on tap.
  document.querySelectorAll('#gameDetail .rule-row').forEach(row=>row.addEventListener('click',()=>row.classList.toggle('open')));
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
