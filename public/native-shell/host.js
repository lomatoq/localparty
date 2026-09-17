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
    const file = game.artwork || ((game.id === 'tankarena' ? 'tankarena-hd' : game.id) + '.webp');
    return /^[a-zA-Z0-9_.-]+\.(webp|png|jpg|jpeg)$/i.test(file) ? '/assets/games/' + file : '';
  }
  function renderCatalog() {
    const query = $('search').value.trim().toLocaleLowerCase();
    const games = (state.catalog || []).filter(g => (!query || g.title.toLocaleLowerCase().includes(query)) && (section === 'all' || (section === 'table' ? g.section === 'table' : g.section !== 'table')));
    const signature = JSON.stringify([games, query, section]);
    if (signature !== catalogSignature) {
      catalogSignature = signature;
      const frag = document.createDocumentFragment();
      games.forEach(g => {
        const card = button('', 'game', () => openGame(g.id)); card.dataset.game = g.id; card.setAttribute('aria-label', `${g.title}, ${g.min}–${g.max} игроков`);
        if (/^#[a-f\d]{6}$/i.test(g.color || '')) card.style.setProperty('--card', g.color);
        const art = element('div', 'art'), image = element('img', 'symbol'); image.src = artPath(g); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; image.addEventListener('error', () => image.hidden = true, {once: true}); art.append(image);
        const info = element('div', 'game-info'); info.append(element('h3', '', g.title), element('p', '', g.description));
        const bottom = element('div', 'game-bottom'); bottom.append(element('span', '', `${g.min}–${g.max} игроков`), element('b', '', '↗')); info.append(bottom); card.append(art, info); frag.append(card);
      });
      $('catalog').replaceChildren(frag);
    }
    const hasCatalog = state.catalog.length > 0;
    $('noGames').hidden = !hasCatalog || games.length > 0;
    $('catalogState').hidden = hasCatalog;
    $('catalogStateText').textContent = state.native?.catalogError || (receivedSnapshot ? 'Подготавливаем игры на этом iPhone…' : 'Соединяем меню с приложением…');
    $('catalog').setAttribute('aria-busy', String(!hasCatalog));
    $('catalog').querySelectorAll('[data-game]').forEach(card => {card.setAttribute('aria-pressed', String(card.dataset.game === state.selected)); card.disabled = busy();});
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
    $('buildLabel').textContent = [n.buildLabel, 'UI: ' + shellRevision, 'Native: ' + (n.bridgeRevision || 'ожидание'), n.displayMode].filter(Boolean).join(' · ');
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
    renderCatalog(); renderActive(); renderRoom(); updateDetail();
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
  document.querySelectorAll('[data-section]').forEach(b => b.onclick = () => {section = b.dataset.section; document.querySelectorAll('[data-section]').forEach(x => {x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b));}); renderCatalog();});
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
  renderCatalog(); renderRoom();
  ['openController', 'playHere', 'detailController'].forEach(id => $(id).disabled = true);
  requestSnapshot();
})();
