const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const QRCode = require('qrcode');
const { Server } = require('socket.io');
const QUESTIONS = require('./data/questions.json');

const PORT = Number(process.env.PORT || 3000);
const app = express();
const server = http.createServer(app);
const io = new Server(server, { pingTimeout: 20000, pingInterval: 10000 });
app.use(express.static(path.join(__dirname, 'public')));
app.get('/host', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'host.html')));

const MONEY = [0,100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000];
const LETTERS = ['A','B','C','D'];

const state = {
  phase: 'lobby', // lobby | question | reveal | finished
  players: new Map(),
  hostSocketId: null,
  settings: { maxTurns: 30, seconds: 25 },
  turnOrder: [],
  activeTurnPos: -1,
  turnsUsed: 0,
  usedGroups: new Set(),
  current: null,
  reveal: null,
  endsAt: null,
  timer: null,
  advanceTimer: null,
  gameNumber: 0
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function localIP() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const entries of Object.values(nets)) {
    for (const x of entries || []) {
      if (x.family === 'IPv4' && !x.internal) candidates.push(x.address);
    }
  }
  return candidates.find(x => /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(x)) || candidates[0] || '127.0.0.1';
}
app.get('/api/config', async (_req, res) => {
  const ip = localIP();
  const joinUrl = `http://${ip}:${PORT}/`;
  let qr = '';
  try { qr = await QRCode.toDataURL(joinUrl, { width: 360, margin: 1, color: { dark:'#100525', light:'#ffffff' } }); } catch {}
  res.json({ ip, port: PORT, joinUrl, qr, questions: QUESTIONS.length });
});

function publicPlayer(p) {
  return {
    id: p.id, name: p.name, emoji: p.emoji, connected: p.connected,
    level: p.level, money: MONEY[p.level], correct: p.correct, wrong: p.wrong,
    streak: p.streak, answered: p.answered
  };
}
function activePlayer() {
  const id = state.turnOrder[state.activeTurnPos];
  return id ? state.players.get(id) : null;
}
function publicState() {
  const active = activePlayer();
  return {
    phase: state.phase,
    gameNumber: state.gameNumber,
    settings: state.settings,
    players: [...state.players.values()].map(publicPlayer),
    ladder: MONEY,
    activePlayerId: active?.id || null,
    turnsUsed: state.turnsUsed,
    turnsLeft: Math.max(0, state.settings.maxTurns - state.turnsUsed),
    endsAt: state.endsAt,
    question: state.current ? {
      id: state.current.id,
      category: state.current.category,
      difficulty: state.current.difficulty,
      text: state.current.question,
      answers: state.current.options.map((text, i) => ({ letter: LETTERS[i], text }))
    } : null,
    reveal: state.reveal,
    winners: state.phase === 'finished' ? getWinners().map(publicPlayer) : []
  };
}
function emitState() { io.emit('state', publicState()); }
function clearTimers() {
  if (state.timer) clearTimeout(state.timer);
  if (state.advanceTimer) clearTimeout(state.advanceTimer);
  state.timer = null; state.advanceTimer = null;
}
function difficultyForLevel(level) {
  if (level <= 3) return 1;
  if (level <= 6) return 2;
  if (level <= 9) return 3;
  if (level <= 12) return 4;
  return 5;
}
function pickQuestion(level) {
  const target = difficultyForLevel(level);
  const unused = QUESTIONS.filter(q => !state.usedGroups.has(q.group));
  if (!unused.length) return null;
  let pool = unused.filter(q => q.difficulty === target);
  for (let delta = 1; !pool.length && delta <= 4; delta++) {
    pool = unused.filter(q => Math.abs(q.difficulty - target) === delta);
  }
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const variants = unused.filter(q => q.group === chosen.group);
  return variants[Math.floor(Math.random() * variants.length)];
}
function nextConnectedTurnPos() {
  if (!state.turnOrder.length) return -1;
  for (let step = 1; step <= state.turnOrder.length; step++) {
    const pos = (state.activeTurnPos + step) % state.turnOrder.length;
    const p = state.players.get(state.turnOrder[pos]);
    if (p?.connected) return pos;
  }
  return -1;
}
function gameShouldEnd() {
  if ([...state.players.values()].some(p => p.level >= MONEY.length - 1)) return true;
  if (state.turnsUsed >= state.settings.maxTurns) return true;
  if (state.usedGroups.size >= new Set(QUESTIONS.map(q => q.group)).size) return true;
  return false;
}
function getWinners() {
  const ps = [...state.players.values()];
  if (!ps.length) return [];
  const bestLevel = Math.max(...ps.map(p => p.level));
  const bestCorrect = Math.max(...ps.filter(p=>p.level===bestLevel).map(p=>p.correct));
  return ps.filter(p => p.level === bestLevel && p.correct === bestCorrect);
}
function finishGame() {
  clearTimers();
  state.phase = 'finished';
  state.current = null;
  state.reveal = null;
  state.endsAt = null;
  emitState();
  io.emit('fx', { type:'finish' });
}
function askNext() {
  clearTimers();
  if (gameShouldEnd()) return finishGame();
  const pos = nextConnectedTurnPos();
  if (pos < 0) return finishGame();
  state.activeTurnPos = pos;
  const p = activePlayer();
  const q = pickQuestion(p.level);
  if (!q) return finishGame();
  state.usedGroups.add(q.group);
  const options = shuffle(q.answers);
  const correctIndex = options.indexOf(q.correct);
  state.current = { ...q, options, correctIndex };
  state.reveal = null;
  state.phase = 'question';
  state.turnsUsed++;
  state.endsAt = Date.now() + state.settings.seconds * 1000;
  p.answered = false;
  emitState();
  io.emit('fx', { type:'question', playerId:p.id });
  state.timer = setTimeout(() => revealAnswer(null, 'timeout'), state.settings.seconds * 1000 + 150);
}
function revealAnswer(selectedIndex, source='answer') {
  if (state.phase !== 'question' || !state.current) return;
  clearTimers();
  const p = activePlayer();
  if (!p) return askNext();
  const correct = selectedIndex === state.current.correctIndex;
  p.answered = true;
  if (correct) {
    p.level = Math.min(MONEY.length - 1, p.level + 1);
    p.correct++; p.streak++;
  } else {
    p.wrong++; p.streak = 0;
  }
  state.phase = 'reveal';
  state.endsAt = null;
  state.reveal = {
    playerId: p.id,
    selectedIndex,
    correctIndex: state.current.correctIndex,
    isCorrect: correct,
    source,
    explanation: state.current.explanation,
    earned: correct ? MONEY[p.level] : MONEY[p.level],
    level: p.level,
    money: MONEY[p.level]
  };
  emitState();
  io.emit('fx', { type: correct ? 'correct' : 'wrong', playerId:p.id });
  state.advanceTimer = setTimeout(() => askNext(), 5600);
}
function startGame() {
  const connected = [...state.players.values()].filter(p => p.connected);
  if (connected.length < 2) return { ok:false, error:'Нужно минимум 2 игрока' };
  clearTimers();
  state.gameNumber++;
  state.turnOrder = shuffle(connected.map(p => p.id));
  state.activeTurnPos = -1;
  state.turnsUsed = 0;
  state.usedGroups.clear();
  state.current = null; state.reveal = null; state.endsAt = null;
  for (const p of state.players.values()) {
    p.level = 0; p.correct = 0; p.wrong = 0; p.streak = 0; p.answered = false;
  }
  askNext();
  return { ok:true };
}
function resetLobby() {
  clearTimers();
  state.phase = 'lobby';
  state.turnOrder = []; state.activeTurnPos = -1; state.turnsUsed = 0;
  state.usedGroups.clear(); state.current = null; state.reveal = null; state.endsAt = null;
  for (const p of state.players.values()) { p.level=0; p.correct=0; p.wrong=0; p.streak=0; p.answered=false; }
  emitState();
}

io.on('connection', socket => {
  socket.on('host:hello', () => { state.hostSocketId = socket.id; socket.join('host'); socket.emit('state', publicState()); });

  socket.on('player:join', (data={}, cb=()=>{}) => {
    const id = String(data.id || '').slice(0,80);
    const name = String(data.name || '').trim().slice(0,20);
    const emoji = String(data.emoji || '😎').slice(0,8);
    if (!id || !name) return cb({ok:false,error:'Нужно имя'});
    let p = state.players.get(id);
    if (!p) {
      if (state.phase !== 'lobby') return cb({ok:false,error:'Игра уже идёт — дождись следующей'});
      p = { id, name, emoji, socketId:socket.id, connected:true, level:0, correct:0, wrong:0, streak:0, answered:false };
      state.players.set(id,p);
    } else {
      p.name = name; p.emoji = emoji; p.socketId = socket.id; p.connected = true;
    }
    socket.data.playerId = id;
    socket.join('players');
    cb({ok:true,id});
    emitState();
  });

  socket.on('player:answer', ({index}={}, cb=()=>{}) => {
    const p = state.players.get(socket.data.playerId);
    if (!p || p.id !== activePlayer()?.id) return cb({ok:false,error:'Сейчас не твой ход'});
    if (state.phase !== 'question') return cb({ok:false,error:'Ответ уже принят'});
    const i = Number(index);
    if (!Number.isInteger(i) || i < 0 || i > 3) return cb({ok:false,error:'Некорректный ответ'});
    cb({ok:true});
    revealAnswer(i, 'answer');
  });

  socket.on('host:start', (_data, cb=()=>{}) => cb(startGame()));
  socket.on('host:next', () => { if (state.phase === 'reveal') askNext(); });
  socket.on('host:reset', () => resetLobby());
  socket.on('host:settings', (data={}) => {
    if (state.phase !== 'lobby') return;
    const maxTurns = [20,30,45].includes(Number(data.maxTurns)) ? Number(data.maxTurns) : state.settings.maxTurns;
    const seconds = [15,25,40].includes(Number(data.seconds)) ? Number(data.seconds) : state.settings.seconds;
    state.settings = { maxTurns, seconds };
    emitState();
  });
  socket.on('host:kick', ({id}={}) => {
    if (state.phase !== 'lobby') return;
    const p = state.players.get(id); if (!p) return;
    const s = io.sockets.sockets.get(p.socketId); if (s) s.emit('kicked');
    state.players.delete(id); emitState();
  });

  socket.on('disconnect', () => {
    const id = socket.data.playerId;
    const p = id && state.players.get(id);
    if (p && p.socketId === socket.id) { p.connected = false; emitState(); }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = localIP();
  console.log(`\nSINYAK MILLIONAIRE is running`);
  console.log(`Host:   http://localhost:${PORT}/host`);
  console.log(`Phones: http://${ip}:${PORT}/\n`);
});
