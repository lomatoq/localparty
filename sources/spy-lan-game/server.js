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
const io = new Server(server, { pingTimeout: 20000, pingInterval: 10000 });

app.use(express.static(path.join(__dirname, 'public')));

const LOCATIONS = [
  { name: 'Аэропорт', category: 'Транспорт', roles: ['Пилот','Стюард','Пассажир','Сотрудник безопасности','Диспетчер','Бариста'] },
  { name: 'Космическая станция', category: 'Наука', roles: ['Командир','Инженер','Биолог','Врач','Оператор связи','Турист'] },
  { name: 'Съёмочная площадка', category: 'Кино', roles: ['Режиссёр','Актёр','Оператор','Гримёр','Продюсер','Каскадёр'] },
  { name: 'Подводная лодка', category: 'Военное', roles: ['Капитан','Сонарист','Механик','Кок','Штурман','Матрос'] },
  { name: 'Музей', category: 'Культура', roles: ['Куратор','Охранник','Экскурсовод','Реставратор','Посетитель','Фотограф'] },
  { name: 'Ночной клуб', category: 'Развлечения', roles: ['DJ','Бармен','Охранник','Танцор','Гость','Промоутер'] },
  { name: 'Больница', category: 'Медицина', roles: ['Хирург','Медсестра','Пациент','Рентгенолог','Санитар','Посетитель'] },
  { name: 'Поезд', category: 'Транспорт', roles: ['Машинист','Проводник','Пассажир','Контролёр','Официант','Безбилетник'] },
  { name: 'Пляж', category: 'Отдых', roles: ['Спасатель','Сёрфер','Турист','Продавец мороженого','Фотограф','Рыбак'] },
  { name: 'Казино', category: 'Развлечения', roles: ['Крупье','Игрок','Охранник','Менеджер','Бармен','Фокусник'] },
  { name: 'Супермаркет', category: 'Город', roles: ['Кассир','Покупатель','Охранник','Грузчик','Менеджер','Промоутер'] },
  { name: 'Пожарная часть', category: 'Службы', roles: ['Пожарный','Диспетчер','Водитель','Начальник смены','Механик','Стажёр'] },
  { name: 'Ресторан', category: 'Еда', roles: ['Шеф','Официант','Гость','Бармен','Хостес','Критик'] },
  { name: 'Цирк', category: 'Шоу', roles: ['Клоун','Акробат','Дрессировщик','Зритель','Конферансье','Осветитель'] },
  { name: 'Университет', category: 'Учёба', roles: ['Профессор','Студент','Декан','Лаборант','Охранник','Аспирант'] },
  { name: 'Отель', category: 'Путешествия', roles: ['Администратор','Гость','Горничная','Консьерж','Повар','Беллбой'] },
  { name: 'Пиратский корабль', category: 'Приключения', roles: ['Капитан','Штурман','Кок','Матрос','Пленник','Канонир'] },
  { name: 'Банк', category: 'Город', roles: ['Кассир','Клиент','Охранник','Менеджер','Инкассатор','Аудитор'] },
  { name: 'Зоопарк', category: 'Отдых', roles: ['Смотритель','Ветеринар','Посетитель','Фотограф','Продавец','Биолог'] },
  { name: 'Фестиваль', category: 'Развлечения', roles: ['Музыкант','Зритель','Бармен','Охранник','Волонтёр','Звукорежиссёр'] },
  { name: 'Метро', category: 'Транспорт', roles: ['Машинист','Пассажир','Контролёр','Турист','Музыкант','Дежурный'] },
  { name: 'Арктическая база', category: 'Наука', roles: ['Полярник','Метеоролог','Врач','Механик','Учёный','Повар'] },
  { name: 'Свадьба', category: 'События', roles: ['Жених','Невеста','Фотограф','Гость','Ведущий','Официант'] },
  { name: 'Киностудия дубляжа', category: 'Кино', roles: ['Актёр озвучки','Режиссёр','Звукорежиссёр','Переводчик','Продюсер','Монтажёр'] },
  { name: 'Средневековый замок', category: 'История', roles: ['Король','Рыцарь','Повар','Шут','Стражник','Посол'] },
  { name: 'Аквапарк', category: 'Отдых', roles: ['Спасатель','Гость','Инструктор','Кассир','Фотограф','Техник'] },
  { name: 'Редакция новостей', category: 'Медиа', roles: ['Ведущий','Репортёр','Редактор','Оператор','Продюсер','Гость'] },
  { name: 'Гоночный пит-лейн', category: 'Спорт', roles: ['Пилот','Механик','Инженер','Маршал','Менеджер','Фотограф'] },
  { name: 'Спа-салон', category: 'Отдых', roles: ['Массажист','Клиент','Администратор','Косметолог','Уборщик','Тренер'] },
  { name: 'Суд', category: 'Город', roles: ['Судья','Адвокат','Прокурор','Свидетель','Охранник','Журналист'] },
  { name: 'Ферма', category: 'Природа', roles: ['Фермер','Ветеринар','Механик','Покупатель','Рабочий','Агроном'] },
  { name: 'Стадион', category: 'Спорт', roles: ['Игрок','Тренер','Болельщик','Судья','Комментатор','Стюард'] },
  { name: 'Горнолыжный курорт', category: 'Отдых', roles: ['Лыжник','Инструктор','Спасатель','Бармен','Оператор подъёмника','Турист'] },
  { name: 'Лаборатория', category: 'Наука', roles: ['Учёный','Лаборант','Стажёр','Инженер','Охранник','Испытуемый'] },
  { name: 'Круизный лайнер', category: 'Путешествия', roles: ['Капитан','Пассажир','Стюард','Повар','Аниматор','Механик'] },
  { name: 'Театр', category: 'Культура', roles: ['Актёр','Режиссёр','Зритель','Осветитель','Костюмер','Билетёр'] },
  { name: 'Стройка небоскрёба', category: 'Город', roles: ['Прораб','Архитектор','Крановщик','Рабочий','Инженер','Инспектор'] },
  { name: 'Детективное агентство', category: 'Город', roles: ['Детектив','Клиент','Секретарь','Стажёр','Информатор','Подозреваемый'] },
  { name: 'Тату-салон', category: 'Город', roles: ['Тату-мастер','Клиент','Администратор','Ученик','Фотограф','Друг клиента'] },
  { name: 'Игровая выставка', category: 'Технологии', roles: ['Разработчик','Игрок','Стример','Журналист','Организатор','Косплеер'] }
];

const state = {
  phase: 'lobby', // lobby | reveal | playing | voting | result
  round: 0,
  players: new Map(),
  hostSocketId: null,
  settings: { spies: 1, minutes: 8, categoryHint: true },
  location: null,
  spies: new Set(),
  voteBy: new Map(),
  result: null,
  turnOrder: [],
  turnIndex: 0,
  endsAt: null,
  timer: null
};

function publicPlayer(p) {
  return { id: p.id, name: p.name, emoji: p.emoji, connected: p.connected, ready: !!p.ready, hasVoted: state.voteBy.has(p.id) };
}
function getPublicState() {
  const turn = state.turnOrder[state.turnIndex] || null;
  const asker = turn ? state.players.get(turn.askerId) : null;
  const target = turn ? state.players.get(turn.targetId) : null;
  return {
    phase: state.phase,
    round: state.round,
    settings: state.settings,
    players: [...state.players.values()].map(publicPlayer),
    timerEndsAt: state.endsAt,
    currentTurn: turn ? { index: state.turnIndex, total: state.turnOrder.length, asker: asker ? publicPlayer(asker) : null, target: target ? publicPlayer(target) : null } : null,
    voteCount: state.voteBy.size,
    result: state.result ? {
      winner: state.result.winner,
      reason: state.result.reason,
      accusedIds: state.result.accusedIds,
      spyIds: [...state.spies],
      location: state.location ? state.location.name : null
    } : null
  };
}
function emitPublic() {
  io.to('host').emit('state:public', getPublicState());
  io.to('players').emit('state:public', getPublicState());
}
function emitPrivate(player) {
  if (!player?.socketId) return;
  const socket = io.sockets.sockets.get(player.socketId);
  if (!socket) return;
  const isSpy = state.spies.has(player.id);
  const privateState = {
    player: publicPlayer(player),
    isSpy,
    phase: state.phase,
    secret: null,
    locationsForGuess: isSpy && state.phase === 'playing' ? LOCATIONS.map(x => x.name) : []
  };
  if (state.location && state.phase !== 'lobby') {
    if (isSpy) {
      privateState.secret = {
        title: 'ТЫ ШПИОН 🕵️',
        subtitle: state.settings.categoryHint ? `Категория: ${state.location.category}` : 'Локация тебе неизвестна',
        location: null,
        role: null
      };
    } else {
      privateState.secret = {
        title: state.location.name,
        subtitle: 'Не выдай локацию слишком прямым вопросом',
        location: state.location.name,
        role: player.role
      };
    }
  }
  socket.emit('state:private', privateState);
}
function emitAllPrivate() { for (const p of state.players.values()) emitPrivate(p); }
function randomInt(n) { return Math.floor(Math.random() * n); }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function alivePlayers() { return [...state.players.values()].filter(p => p.connected); }
function generateTurns(ids) {
  const turns = [];
  let order = shuffle(ids);
  const cycles = Math.max(3, Math.min(8, ids.length + 2));
  for (let c = 0; c < cycles; c++) {
    if (c) order = shuffle(order);
    for (const askerId of order) {
      const candidates = ids.filter(id => id !== askerId);
      let targetId = candidates[randomInt(candidates.length)];
      const prev = turns.at(-1);
      if (prev && candidates.length > 1 && prev.targetId === targetId) {
        const alt = candidates.filter(id => id !== targetId);
        targetId = alt[randomInt(alt.length)];
      }
      turns.push({ askerId, targetId });
    }
  }
  return turns;
}
function clearRoundTimer() {
  if (state.timer) clearTimeout(state.timer);
  state.timer = null;
}
function startPlaying() {
  state.phase = 'playing';
  state.endsAt = Date.now() + state.settings.minutes * 60_000;
  clearRoundTimer();
  state.timer = setTimeout(() => beginVoting('time'), state.settings.minutes * 60_000);
  emitPublic(); emitAllPrivate();
}
function beginVoting(source = 'host') {
  if (!['playing','reveal'].includes(state.phase)) return;
  state.phase = 'voting';
  state.endsAt = null;
  clearRoundTimer();
  state.voteBy.clear();
  emitPublic(); emitAllPrivate();
  io.to('players').emit('toast', source === 'time' ? 'Время вышло — голосуем!' : 'Началось голосование');
}
function finishVoting(force = false) {
  if (state.phase !== 'voting') return;
  const connected = alivePlayers();
  if (!force && state.voteBy.size < connected.length) return;
  const counts = new Map();
  for (const targetId of state.voteBy.values()) counts.set(targetId, (counts.get(targetId) || 0) + 1);
  let max = 0;
  for (const c of counts.values()) max = Math.max(max, c);
  const accusedIds = [...counts.entries()].filter(([,c]) => c === max).map(([id]) => id);
  const spyCaught = accusedIds.length === 1 && state.spies.has(accusedIds[0]);
  state.result = {
    winner: spyCaught ? 'citizens' : 'spies',
    reason: accusedIds.length !== 1 ? 'tie' : (spyCaught ? 'spy_caught' : 'wrong_accusation'),
    accusedIds
  };
  state.phase = 'result';
  emitPublic(); emitAllPrivate();
}
function resetToLobby() {
  clearRoundTimer();
  state.phase = 'lobby';
  state.location = null;
  state.spies.clear();
  state.voteBy.clear();
  state.result = null;
  state.turnOrder = [];
  state.turnIndex = 0;
  state.endsAt = null;
  for (const p of state.players.values()) { p.ready = false; p.role = null; }
  emitPublic(); emitAllPrivate();
}
function startRound() {
  const players = alivePlayers();
  if (players.length < 3) return { ok:false, error:'Нужно минимум 3 игрока' };
  const spyCount = Math.max(1, Math.min(Number(state.settings.spies)||1, players.length - 2));
  state.settings.spies = spyCount;
  state.round += 1;
  state.phase = 'reveal';
  state.result = null;
  state.voteBy.clear();
  state.endsAt = null;
  state.location = LOCATIONS[randomInt(LOCATIONS.length)];
  const shuffled = shuffle(players.map(p => p.id));
  state.spies = new Set(shuffled.slice(0, spyCount));
  const roles = shuffle(state.location.roles);
  let r = 0;
  for (const p of players) {
    p.ready = false;
    p.role = state.spies.has(p.id) ? null : roles[r++ % roles.length];
  }
  state.turnOrder = generateTurns(players.map(p => p.id));
  state.turnIndex = 0;
  emitPublic(); emitAllPrivate();
  return { ok:true };
}
function nextTurn() {
  if (state.phase !== 'playing') return;
  state.turnIndex = (state.turnIndex + 1) % state.turnOrder.length;
  emitPublic();
}
function findLanIp() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const entries of Object.values(nets)) {
    for (const net of entries || []) {
      if (net.family === 'IPv4' && !net.internal) candidates.push(net.address);
    }
  }
  return candidates.find(ip => ip.startsWith('192.168.')) || candidates.find(ip => ip.startsWith('10.')) || candidates.find(ip => ip.startsWith('172.')) || candidates[0] || 'localhost';
}
app.get('/api/config', async (req,res) => {
  const ip = findLanIp();
  const joinUrl = `http://${ip}:${PORT}/`;
  let qr = null;
  try { qr = await QRCode.toDataURL(joinUrl, { margin:1, width:420, color:{ dark:'#0a0a0a', light:'#00000000' } }); } catch {}
  res.json({ port: PORT, ip, joinUrl, qr, locations: LOCATIONS.map(x => x.name) });
});
app.get('/host', (req,res) => res.sendFile(path.join(__dirname,'public','host.html')));

io.on('connection', (socket) => {
  socket.on('host:hello', () => {
    socket.join('host');
    state.hostSocketId = socket.id;
    socket.emit('state:public', getPublicState());
  });

  socket.on('player:join', ({ id, name, emoji } = {}, cb = () => {}) => {
    const cleanName = String(name || '').trim().slice(0, 20);
    if (!cleanName) return cb({ ok:false, error:'Введите имя' });
    const playerId = String(id || crypto.randomUUID()).slice(0, 80);
    let player = state.players.get(playerId);
    if (!player) {
      if (state.phase !== 'lobby') return cb({ ok:false, error:'Раунд уже идёт. Подключись после него.' });
      player = { id:playerId, name:cleanName, emoji:String(emoji||'🙂').slice(0,4), socketId:socket.id, connected:true, ready:false, role:null };
      state.players.set(playerId, player);
    } else {
      player.name = cleanName;
      player.emoji = String(emoji || player.emoji || '🙂').slice(0,4);
      player.socketId = socket.id;
      player.connected = true;
    }
    socket.join('players');
    socket.data.playerId = playerId;
    cb({ ok:true, id:playerId });
    emitPublic(); emitPrivate(player);
  });

  socket.on('player:ready', () => {
    const p = state.players.get(socket.data.playerId);
    if (!p || state.phase !== 'reveal') return;
    p.ready = true;
    emitPublic(); emitPrivate(p);
    const active = alivePlayers();
    if (active.length >= 3 && active.every(x => x.ready)) startPlaying();
  });

  socket.on('player:vote', ({ targetId } = {}, cb=()=>{}) => {
    const voterId = socket.data.playerId;
    if (state.phase !== 'voting') return cb({ok:false,error:'Сейчас не голосование'});
    if (!state.players.has(voterId) || !state.players.has(targetId) || voterId === targetId) return cb({ok:false,error:'Некорректный голос'});
    state.voteBy.set(voterId, targetId);
    cb({ok:true});
    emitPublic(); emitAllPrivate();
    finishVoting(false);
  });

  socket.on('player:spyGuess', ({ location } = {}, cb=()=>{}) => {
    const playerId = socket.data.playerId;
    if (state.phase !== 'playing' || !state.spies.has(playerId)) return cb({ok:false,error:'Недоступно'});
    const guessed = String(location || '');
    const correct = state.location && guessed === state.location.name;
    state.result = { winner: correct ? 'spies' : 'citizens', reason: correct ? 'spy_guessed' : 'spy_failed_guess', accusedIds: [] };
    state.phase = 'result';
    state.endsAt = null;
    clearRoundTimer();
    cb({ok:true,correct});
    emitPublic(); emitAllPrivate();
  });

  socket.on('player:nextTurn', () => {
    const id = socket.data.playerId;
    const turn = state.turnOrder[state.turnIndex];
    if (turn?.askerId === id) nextTurn();
  });

  socket.on('host:settings', (patch = {}) => {
    if (state.phase !== 'lobby') return;
    if (patch.spies != null) state.settings.spies = Math.max(1, Math.min(3, Number(patch.spies)||1));
    if (patch.minutes != null) state.settings.minutes = Math.max(2, Math.min(20, Number(patch.minutes)||8));
    if (patch.categoryHint != null) state.settings.categoryHint = !!patch.categoryHint;
    emitPublic();
  });
  socket.on('host:start', (_,cb=()=>{}) => cb(startRound()));
  socket.on('host:beginPlaying', () => { if (state.phase === 'reveal') startPlaying(); });
  socket.on('host:nextTurn', nextTurn);
  socket.on('host:beginVote', () => beginVoting('host'));
  socket.on('host:finishVote', () => finishVoting(true));
  socket.on('host:reset', resetToLobby);
  socket.on('host:kick', ({ playerId } = {}) => {
    if (state.phase !== 'lobby') return;
    const p = state.players.get(playerId);
    if (!p) return;
    if (p.socketId) io.sockets.sockets.get(p.socketId)?.disconnect(true);
    state.players.delete(playerId);
    emitPublic();
  });

  socket.on('disconnect', () => {
    const id = socket.data.playerId;
    if (id && state.players.has(id)) {
      const p = state.players.get(id);
      p.connected = false;
      p.socketId = null;
      emitPublic();
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = findLanIp();
  console.log('\n🕵️  SPY LAN GAME');
  console.log(`Host:   http://localhost:${PORT}/host`);
  console.log(`Phones: http://${ip}:${PORT}/`);
  console.log('All devices must be on the same Wi-Fi.\n');
});
