(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let state = {catalog: [], players: [], leaderboard: [], votes: [], native: {}}, section = 'all';
  let selectedDetail = null, catalogSignature = '', rosterSignature = '', actionsSignature = '', standingsSignature = '';
  let confirmAction = null, launchPending = false, toastTimer;
  const dialogs = ['hostPanel', 'gameDetail', 'confirmDialog'];
  const element = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const button = (text, cls, action) => { const b = element('button', cls, text); b.type = 'button'; b.addEventListener('click', action); return b; };
  const canSend = () => Boolean(window.webkit?.messageHandlers?.partyShell);
  function send(type, fields = {}) {
    if (!canSend()) { toast('Открой LocalParty в приложении iPhone.'); return false; }
    window.webkit.messageHandlers.partyShell.postMessage({type, ...fields}); return true;
  }
  const manage = command => send('manage', {command});
  const busy = () => !state.native?.ready || state.native?.working || state.busy;
  const gameById = id => (state.catalog || []).find(g => g.id === id);
  function toast(text) { $('nativeToast').textContent = text; $('nativeToast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('nativeToast').hidden = true; }, 3500); }
  function show(id) { const d = $(id); if (!d.open) d.showModal(); }
  function close(id) { if ($(id).open) $(id).close(); }
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
      $('catalog').replaceChildren(frag); $('noGames').hidden = games.length > 0;
    }
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
    let hint = !state.native?.ready ? 'Подготавливаем комнату…' : !state.screens ? 'Подключи общий экран в панели ведущего.' : count < g.min ? `Нужно ещё ${g.min - count} игроков. Открой свой пульт или пригласи друзей.` : count > g.max ? `В этой игре максимум ${g.max} игроков.` : state.selected !== g.id ? 'Подтверждаем выбор игры…' : 'После запуска каждый нажимает «Я готов» на своём пульте.';
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
    $('displayStatus').textContent = `${n.externalDisplays || 0} AirPlay / кабель · ${state.screens || 0} общих экранов`;
    $('refreshDisplay').disabled = !n.externalDisplays;
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
    $('matches').textContent = `${state.totalMatches || 0} матчей`;
    const leadersKey = JSON.stringify(state.leaderboard || []);
    if (leadersKey !== standingsSignature) {
      standingsSignature = leadersKey; $('standings').replaceChildren();
      (state.leaderboard || []).slice(0, 5).forEach(p => {const row = element('div', 'rank-row'); row.append(element('b', 'rank-name', p.name), element('span', 'rank-stats', `${p.wins} побед · ${p.points} очков`)); $('standings').append(row);});
    }
    $('resetStats').disabled = busy() || Boolean(state.active);
    $('backgroundStatus').textContent = n.backgroundStatus || 'Во время игры держи приложение открытым.';
    $('backgroundRequest').disabled = !state.networkEnabled || busy();
    $('buildLabel').textContent = n.buildLabel || '';
  }
  function setSwitch(id, enabled, on, off) { const b = $(id); b.setAttribute('aria-checked', String(Boolean(enabled))); b.textContent = enabled ? on : off; }
  function update(value) {
    if (!value || !Array.isArray(value.catalog) || !Array.isArray(value.players)) return;
    state = value;
    $('connection').textContent = state.native?.connectionStatus || (state.native?.ready ? 'Комната готова' : 'Подготавливаем комнату…');
    $('connection').classList.toggle('online', Boolean(state.native?.ready && !state.native?.connectionStatus));
    $('gameCount').textContent = `${state.catalog.length} игр`; $('playerCount').textContent = `${state.players.length} игроков`; $('screenCount').textContent = state.screens ? `${state.screens} общих экранов` : 'Экран не подключён';
    const message = state.native?.message || state.native?.connectionStatus || state.incident?.message;
    $('message').hidden = !message; $('message').textContent = message || '';
    ['openController', 'playHere', 'detailController'].forEach(id => $(id).disabled = busy());
    renderCatalog(); renderActive(); renderRoom(); updateDetail();
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
  // Only Swift sends snapshots. No admin token is exposed to this document or the LAN.
  window.LocalPartyHost = Object.freeze({update, toast});
  update(state); send('ready');
})();
