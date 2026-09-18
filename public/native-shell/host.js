(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let state = {catalog: [], players: [], leaderboard: [], votes: [], native: {}}, section = 'all';
  let selectedDetail = null, catalogSignature = '', rosterSignature = '', actionsSignature = '', standingsSignature = '';
  let confirmAction = null, launchPending = false, toastTimer;
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
  const gameById = id => (state.catalog || []).find(g => g.id === id);
  function toast(text) { $('nativeToast').textContent = text; $('nativeToast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('nativeToast').hidden = true; }, 3500); }
  // WebKit does not reliably restore focus when a dialog closes, so the opener is
  // remembered explicitly and refocused. Keeps VoiceOver and keyboard users in place.
  const openers = {};
  function show(id) { const d = $(id); if (!d.open) { openers[id] = document.activeElement; d.showModal(); } }
  function close(id) {
    const d = $(id); if (!d.open) return;
    d.close(); const opener = openers[id]; delete openers[id];
    if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus();
  }
  function confirm(title, text, action) { $('confirmTitle').textContent = title; $('confirmText').textContent = text; confirmAction = action; show('confirmDialog'); }
  function controller() { if (busy()) return; dialogs.forEach(close); send('controller'); }
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
    catalogView ||= window.LocalPartyCatalog.create($('catalog'), {onSelect: openGame});
    const games = catalogView.update(state, {query: $('search').value, filter: section, disabled: busy()});
    const hasCatalog = state.catalog.length > 0;
    $('noGames').hidden = !hasCatalog || games.length > 0;
    $('catalogState').hidden = hasCatalog;
    $('catalogStateText').textContent = state.native?.catalogError || (receivedSnapshot ? 'Подготавливаем игры на этом iPhone…' : 'Соединяем меню с приложением…');
    $('catalog').setAttribute('aria-busy', String(!hasCatalog));
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
    let hint = !state.native?.ready ? 'Подготавливаем комнату…' : !state.screens ? 'Подключи общий экран в панели ведущего.' : count < g.min ? 'Нужно ещё ' + plural(g.min - count, 'игрока', 'игроков', 'игроков') + '. Открой свой пульт или пригласи друзей.' : count > g.max ? `В этой игре максимум ${g.max} игроков.` : state.selected !== g.id ? 'Подтверждаем выбор игры…' : 'После запуска каждый нажимает «Я готов» на своём пульте.';
    $('launchHint').textContent = hint;
    $('launchGame').disabled = busy() || !state.screens || count < g.min || count > g.max || state.selected !== g.id;
    $('launchGame').textContent = state.busy ? 'Подготавливаем…' : 'Играть вместе';
    if (launchPending && state.active?.id === g.id && !state.busy) { close('gameDetail'); launchPending = false; }
    if (state.native?.message && !state.native?.working && !state.busy) launchPending = false;
  }
  function renderActive() {
    const run = state.active, game = gameById(run?.id);
    $('activeCard').hidden = !game; if (!game) { actionsSignature = ''; return; }
    $('activeTitle').textContent = game.title;
    $('activeStatus').textContent = run.startError || (run.session?.paused ? 'Игра на паузе' : run.ui?.progress || run.ui?.label || 'Ждём готовности игроков');
    const actions = (game.hostControls?.actions || []).filter(a => a.phases.includes(run.ui?.phase) && (!run.ui?.hostActions || run.ui.hostActions.includes(a.id)));
    const signature = JSON.stringify([run.instance, run.ui?.phase, run.session?.paused, run.startError, actions]);
    if (signature !== actionsSignature) {
      actionsSignature = signature; const box = $('activeActions'); box.replaceChildren();
      actions.forEach(a => {const b = button(a.label, 'quiet', () => manage({type: 'game-action', instance: run.instance, action: a.id})); b.dataset.phaseAction = 'true'; box.append(b);});
      if (run.startError) box.append(button('Повторить запуск', 'lime small', () => manage({type: 'retry-start', instance: run.instance})));
      if (run.ui?.phase === 'results') box.append(button('Сыграть ещё раз', 'lime small', () => manage({type: 'launch', id: game.id})));
      box.append(button(run.session?.paused ? 'Продолжить' : 'Пауза', 'quiet', () => manage({type: 'pause', paused: !state.active?.session?.paused})), button('В лобби', 'quiet', () => confirm('Вернуться в лобби?', 'Текущий матч завершится для всей компании.', () => manage({type: 'stop'}))));
    }
    $('activeActions').querySelectorAll('button').forEach(b => b.disabled = busy() || (b.dataset.phaseAction === 'true' && Boolean(run.session?.paused)));
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
    $('networkHint').textContent = state.networkEnabled && !address ? 'Подключи iPhone к Wi-Fi, чтобы появился адрес.' : 'Устройства должны быть в одной сети без изоляции клиентов.';
    $('transportHint').textContent = hasAddress ? address.startsWith('https:') ? 'HTTPS-адрес. Для датчиков сертификат должен быть доверенным на каждом телефоне.' : 'Гостевой доступ сейчас по HTTP. Кнопки работают; датчики движения в Safari требуют доверенного HTTPS.' : '';
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
  function renderTVControls() {
    const tv=state.tv, unavailable=!tv||busy(), active=!!state.active;
    const canCover=tv?.canCover===true;
    $('tvShowQR').disabled=unavailable||!canCover||!state.networkEnabled||!state.native?.address;
    $('tvShowCompany').disabled=unavailable||!canCover||!tv?.hasCompany;
    $('tvShowMatch').disabled=unavailable||!canCover||!tv?.hasMatch;
    $('tvCloseOverlay').disabled=unavailable||tv.mode==='none';
    $('tvShowQR').setAttribute('aria-pressed',String(tv?.mode==='qr'));
    $('tvShowCompany').setAttribute('aria-pressed',String(tv?.mode==='podium'&&tv.board?.kind==='company'));
    $('tvShowMatch').setAttribute('aria-pressed',String(tv?.mode==='podium'&&tv.board?.kind==='match'));
    for(const id of ['tvPrev','tvNext','tvGameNumber','tvSelectGame'])$(id).disabled=unavailable||active||!state.catalog.length;
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
    state = value;
    receivedSnapshot = true; clearTimeout(readyTimer); readyTimer = null;
    $('connection').textContent = state.native?.connectionStatus || (state.native?.ready ? 'Комната готова' : 'Подготавливаем комнату…');
    $('connection').classList.toggle('online', Boolean(state.native?.ready && !state.native?.connectionStatus));
    $('gameCount').textContent = (state.catalog.length ? plural(state.catalog.length, 'игра', 'игры', 'игр') : 'Каталог загружается'); $('playerCount').textContent = plural(state.players.length, 'игрок', 'игрока', 'игроков'); $('screenCount').textContent = state.screens ? plural(state.screens, 'общий экран', 'общих экрана', 'общих экранов') : 'Экран не подключён';
    const message = state.native?.message || state.native?.catalogError || state.native?.connectionStatus || state.incident?.message;
    $('message').hidden = !message; $('message').textContent = message || '';
    ['openController', 'playHere', 'detailController'].forEach(id => $(id).disabled = busy());
    renderCatalog(); renderActive(); renderRoom(); renderTVControls(); updateDetail();
    return true; // acknowledgement used by the native delivery state machine
  }
  $('openHost').onclick = () => show('hostPanel');
  ['openController', 'playHere', 'detailController'].forEach(id => $(id).onclick = controller);
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => close(b.dataset.close));
  $('airplayHelp').onclick = () => { $('airplayInstructions').hidden = !$('airplayInstructions').hidden; };
  $('refreshDisplay').onclick = () => send('screen-refresh');
  $('networkToggle').onclick = () => { if (state.networkEnabled) confirm('Выключить доступ по Wi-Fi?', 'Телефоны гостей отключатся. AirPlay и твой встроенный пульт останутся.', () => send('network-set', {enabled: false})); else send('network-set', {enabled: true}); };
  $('hapticsToggle').onclick = () => send('haptics-set', {enabled: state.native?.haptics === false});
  $('awakeToggle').onclick = () => send('awake-set', {enabled: state.native?.keepAwake === false});
  $('testHaptics').onclick = () => send('haptic', {pattern: [18, 65, 30]});
  $('shareInvite').onclick = () => send('share-invite'); $('copyInvite').onclick = () => { send('copy-invite'); };
  $('backgroundRequest').onclick = () => send('background-request'); $('shareDiagnostics').onclick = () => send('share-diagnostics');
  $('resetStats').onclick = () => confirm('Сбросить статистику?', 'Очки и история матчей будут очищены. Профили игроков сохранятся.', () => manage({type: 'statistics-reset'}));
  $('launchGame').onclick = () => {if ($('launchGame').disabled) return; launchPending = manage({type: 'launch', id: selectedDetail});};
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
    const syncStick = () => {frame = 0; const head = masthead.offsetHeight; document.documentElement.style.setProperty('--host-head', head + 'px'); document.body.classList.toggle('tools-stuck', tools.getBoundingClientRect().top <= head + 1);};
    const queueStick = () => {if (!frame) frame = requestAnimationFrame(syncStick);};
    addEventListener('scroll', queueStick, {passive: true}); new ResizeObserver(queueStick).observe(masthead); syncStick();
  }
  if (filters) {
    new ResizeObserver(() => moveTabIndicator(false)).observe(filters);
    document.fonts?.ready.then(() => moveTabIndicator(false));
    moveTabIndicator(false);
  }
  const showTV=(mode,boardKind)=>manage({type:'tv-overlay',mode,...(boardKind?{boardKind}:{})});
  $('tvShowQR').onclick=()=>showTV(state.tv?.mode==='qr'?'none':'qr');
  $('tvShowCompany').onclick=()=>showTV('podium','company');
  $('tvShowMatch').onclick=()=>showTV('podium','match');
  $('tvCloseOverlay').onclick=()=>showTV('none');
  $('tvPrev').onclick=()=>manage({type:'tv-focus',direction:-1});
  $('tvNext').onclick=()=>manage({type:'tv-focus',direction:1});
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
