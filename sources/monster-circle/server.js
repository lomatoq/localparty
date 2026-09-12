const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT || 3000);
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 5e6,
  cors: { origin: '*' }
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const CHARACTERS = [
  'Шрек','Осёл из Шрека','Кот в сапогах','Лорд Фаркуад','Спанч Боб','Патрик Стар','Сквидвард','Мистер Крабс','Планктон','Пикачу',
  'Мяут','Чаризард','Дарт Вейдер','Йода','Чубакка','Штурмовик','Джабба Хатт','Голлум','Гэндальф','Саурон',
  'Балрог','Бэтмен','Джокер','Харли Квинн','Супермен','Чудо-женщина','Человек-паук','Веном','Дэдпул','Халк',
  'Танос','Грут','Ракета','Железный человек','Капитан Америка','Тор','Локи','Гомер Симпсон','Мардж Симпсон','Барт Симпсон',
  'Мистер Бёрнс','Рик Санчез','Морти Смит','Мистер Мисикс','Огурчик Рик','Уэнсдэй Аддамс','Вещь из семейки Аддамс','Битлджус','Гоустфейс','Фредди Крюгер',
  'Джейсон Вурхиз','Пеннивайз','Ксеноморф','Хищник','Терминатор T-800','Робокоп','Инопланетянин E.T.','Гизмо из Гремлинов','Годзилла','Кинг-Конг',
  'Мотра','Майк Вазовски','Салли','Базз Лайтер','Вуди','ВАЛЛ-И','Бэймакс','Стич','Олаф','Эльза',
  'Моана','Мауи','Урсула','Джек Скеллингтон','Уги Буги','Уоллес','Громит','Барашек Шон','Тоторо','Безликий',
  'Поньо','Грю','Миньон','По из Кунг-фу Панды','Мастер Шифу','Соник','Доктор Эггман','Марио','Луиджи','Боузер',
  'Варио','Линк','Ганондорф','Кирби','Лара Крофт','Кратос','Крипер из Minecraft','Эндермен','Космонавт Among Us','Сиреноголовый'
];

const game = {
  phase: 'lobby',
  maxPlayers: 4,
  players: [],
  turnIndex: 0,
  round: 1,
  segments: [],
  promptDeck: [],
  promptMode: 'chaos',
  samePrompt: null,
  revealAt: null
};

function id(len = 8) {
  return crypto.randomBytes(len).toString('hex');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawPromptFromDeck() {
  if (!game.promptDeck.length) game.promptDeck = shuffle(CHARACTERS);
  return game.promptDeck.pop();
}

function nextPrompt() {
  if (game.promptMode === 'same') return game.samePrompt || drawPromptFromDeck();
  return drawPromptFromDeck();
}

function getLanIps() {
  const out = [];
  const nets = os.networkInterfaces();
  const virtualRx = /(vethernet|wsl|docker|vmware|virtualbox|tailscale|hamachi|zerotier|loopback|bluetooth)/i;
  const wifiRx = /(wi-?fi|wlan|wireless)/i;
  const ethernetRx = /(ethernet|^eth\d*$|lan)/i;

  for (const [name, entries] of Object.entries(nets)) {
    for (const n of entries || []) {
      if (n.family !== 'IPv4' || n.internal) continue;
      const ip = n.address;
      const isPrivate = /^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
      const isVirtual = virtualRx.test(name);
      let score = isPrivate ? 100 : 0;
      if (wifiRx.test(name)) score += 60;
      else if (ethernetRx.test(name)) score += 35;
      if (/^192\.168\./.test(ip)) score += 20;
      else if (/^10\./.test(ip)) score += 10;
      if (isVirtual) score -= 120;
      out.push({ name, ip, private: isPrivate, virtual: isVirtual, score });
    }
  }
  return out.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function stageLabel(index, total) {
  const normalized = total === 1 ? 0.5 : index / (total - 1);
  if (total === 2) return index === 0 ? 'Голова + верх тела' : 'Низ тела + ноги';
  if (total === 3) return ['Голова','Туловище + руки','Ноги + ступни'][index];
  if (total === 4) return ['Голова','Плечи + грудь','Живот + таз','Ноги + ступни'][index];
  if (normalized < 0.10) return 'Макушка / верх головы';
  if (normalized < 0.23) return 'Лицо / голова';
  if (normalized < 0.34) return 'Шея + плечи';
  if (normalized < 0.48) return 'Грудь + руки';
  if (normalized < 0.61) return 'Живот / торс';
  if (normalized < 0.72) return 'Таз / бёдра';
  if (normalized < 0.84) return 'Бёдра / колени';
  if (normalized < 0.94) return 'Голени';
  return 'Ступни / низ';
}

function publicState() {
  const active = game.phase === 'playing' ? game.players[game.turnIndex] : null;
  return {
    phase: game.phase,
    maxPlayers: game.maxPlayers,
    players: game.players.map((p, idx) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      index: idx
    })),
    turnIndex: game.turnIndex,
    activePlayerId: active?.id || null,
    activePlayerName: active?.name || null,
    round: game.round,
    completed: game.segments.length,
    total: game.players.length,
    revealAt: game.revealAt
  };
}

function emitState() {
  io.emit('game:state', publicState());
}

function activeTurnPayload(playerId) {
  if (game.phase !== 'playing') return null;
  const active = game.players[game.turnIndex];
  if (!active || active.id !== playerId) return null;
  const existing = game.segments[game.turnIndex];
  const prev = game.segments[game.turnIndex - 1];
  return {
    turnIndex: game.turnIndex,
    total: game.players.length,
    part: stageLabel(game.turnIndex, game.players.length),
    prompt: existing?.prompt || active.currentPrompt,
    connectorXs: prev?.connectorXs || [],
    round: game.round
  };
}

function sendTurnToActive() {
  const active = game.players[game.turnIndex];
  if (!active) return;
  if (!active.currentPrompt) active.currentPrompt = nextPrompt();
  io.to(`player:${active.id}`).emit('turn:start', activeTurnPayload(active.id));
}

function resetRound() {
  game.phase = 'playing';
  game.turnIndex = 0;
  game.segments = [];
  game.revealAt = null;
  game.samePrompt = game.promptMode === 'same' ? drawPromptFromDeck() : null;
  for (const p of game.players) p.currentPrompt = null;
  emitState();
  sendTurnToActive();
}

app.get('/j', (req, res) => res.redirect(302, '/play.html'));

app.get('/api/info', async (req, res) => {
  const ips = getLanIps();
  const preferred = ips.find(x => x.private && !x.virtual) || ips.find(x => x.private) || ips[0];
  const requestedHost = String(req.query.host || '').trim();
  const host = requestedHost || preferred?.ip || 'localhost';
  // Keep the QR payload short: /j redirects to the phone controller.
  const playUrl = `http://${host}:${PORT}/j`;
  let qr = null;
  try {
    qr = await QRCode.toDataURL(playUrl, {
      margin: 2,
      width: 560,
      errorCorrectionLevel: 'Q',
      color: { dark: '#111111', light: '#ffffff' }
    });
  } catch (_) {}
  res.json({
    port: PORT,
    playUrl,
    qr,
    ips,
    selectedIp: host,
    lanReady: host !== 'localhost' && !!preferred,
    characters: CHARACTERS.length
  });
});

app.get('/api/characters', (req, res) => res.json({ characters: CHARACTERS }));

io.on('connection', (socket) => {
  socket.emit('game:state', publicState());

  socket.on('host:set-config', (payload = {}, ack = () => {}) => {
    if (game.phase !== 'lobby') return ack({ ok: false, error: 'Игра уже началась' });
    const n = Math.max(2, Math.min(20, Number(payload.maxPlayers || 4)));
    game.maxPlayers = n;
    game.promptMode = payload.promptMode === 'same' ? 'same' : 'chaos';
    if (game.players.length > n) game.players = game.players.slice(0, n);
    emitState();
    ack({ ok: true });
  });

  socket.on('host:start', (_, ack = () => {}) => {
    if (game.phase !== 'lobby') return ack({ ok: false, error: 'Уже запущено' });
    if (game.players.length < 2) return ack({ ok: false, error: 'Нужно минимум 2 игрока' });
    if (game.players.length !== game.maxPlayers) return ack({ ok: false, error: `Подключено ${game.players.length}/${game.maxPlayers}` });
    resetRound();
    ack({ ok: true });
  });

  socket.on('host:next-round', (_, ack = () => {}) => {
    if (!game.players.length) return ack({ ok: false, error: 'Нет игроков' });
    game.round += 1;
    resetRound();
    ack({ ok: true });
  });

  socket.on('host:reset', (_, ack = () => {}) => {
    game.phase = 'lobby';
    game.turnIndex = 0;
    game.round = 1;
    game.segments = [];
    game.revealAt = null;
    for (const p of game.players) p.currentPrompt = null;
    emitState();
    ack({ ok: true });
  });

  socket.on('host:kick', ({ playerId } = {}, ack = () => {}) => {
    if (game.phase !== 'lobby') return ack({ ok: false, error: 'Удалять игроков можно только в лобби' });
    game.players = game.players.filter(p => p.id !== playerId);
    emitState();
    ack({ ok: true });
  });

  socket.on('player:join', ({ name, handedness, playerId, token } = {}, ack = () => {}) => {
    name = String(name || '').trim().slice(0, 24);
    if (!name) return ack({ ok: false, error: 'Введите имя' });

    let player = game.players.find(p => p.id === playerId && p.token === token);
    if (!player) {
      if (game.phase !== 'lobby') return ack({ ok: false, error: 'Раунд уже идёт — дождитесь следующего лобби' });
      if (game.players.length >= game.maxPlayers) return ack({ ok: false, error: 'Лобби заполнено' });
      player = {
        id: id(6), token: id(12), name,
        handedness: handedness === 'left' ? 'left' : 'right',
        connected: true, socketId: socket.id, currentPrompt: null
      };
      game.players.push(player);
    } else {
      player.name = name;
      player.handedness = handedness === 'left' ? 'left' : 'right';
      player.connected = true;
      player.socketId = socket.id;
    }

    socket.data.playerId = player.id;
    socket.join(`player:${player.id}`);
    ack({ ok: true, playerId: player.id, token: player.token, name: player.name });
    emitState();

    const payload = activeTurnPayload(player.id);
    if (payload) socket.emit('turn:start', payload);
  });

  socket.on('player:resume', ({ playerId, token } = {}, ack = () => {}) => {
    const player = game.players.find(p => p.id === playerId && p.token === token);
    if (!player) return ack({ ok: false });
    player.connected = true;
    player.socketId = socket.id;
    socket.data.playerId = player.id;
    socket.join(`player:${player.id}`);
    ack({ ok: true, name: player.name, handedness: player.handedness });
    emitState();
    const payload = activeTurnPayload(player.id);
    if (payload) socket.emit('turn:start', payload);
  });

  socket.on('turn:submit', ({ imageData, connectorXs } = {}, ack = () => {}) => {
    const playerId = socket.data.playerId;
    const active = game.players[game.turnIndex];
    if (game.phase !== 'playing' || !active || active.id !== playerId) {
      return ack({ ok: false, error: 'Сейчас не ваш ход' });
    }
    if (typeof imageData !== 'string' || !imageData.startsWith('data:image/png;base64,')) {
      return ack({ ok: false, error: 'Некорректный рисунок' });
    }
    if (imageData.length > 4_500_000) return ack({ ok: false, error: 'Рисунок слишком большой' });

    const xs = Array.isArray(connectorXs)
      ? connectorXs.map(Number).filter(Number.isFinite).map(v => Math.max(0.04, Math.min(0.96, v))).slice(0, 2)
      : [];

    game.segments.push({
      playerId: active.id,
      playerName: active.name,
      prompt: active.currentPrompt,
      part: stageLabel(game.turnIndex, game.players.length),
      imageData,
      connectorXs: xs
    });
    active.currentPrompt = null;
    game.turnIndex += 1;

    if (game.turnIndex >= game.players.length) {
      game.phase = 'reveal';
      game.revealAt = Date.now();
      emitState();
      io.emit('round:reveal', {
        round: game.round,
        segments: game.segments.map(s => ({
          playerName: s.playerName,
          prompt: s.prompt,
          part: s.part,
          imageData: s.imageData
        }))
      });
    } else {
      emitState();
      sendTurnToActive();
    }
    ack({ ok: true });
  });

  socket.on('disconnect', () => {
    const pid = socket.data.playerId;
    const p = game.players.find(x => x.id === pid);
    if (p && p.socketId === socket.id) {
      p.connected = false;
      emitState();
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLanIps();
  console.log('\n🎨 MONSTER CIRCLE запущен');
  console.log(`🖥  Экран ведущего: http://localhost:${PORT}`);
  for (const { ip, name } of ips) console.log(`📱 Телефоны (${name}): http://${ip}:${PORT}/play.html`);
  console.log('');
});
