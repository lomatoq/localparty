const runtime=require('../../lib/party-runtime');
const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { Server } = require('socket.io');

let PORT = Number(process.env.PORT || 0);
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 5e6,
  cors: { origin: '*' }
});
runtime.guardSocketIO(io);

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
  maxPlayers: 16,
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
    revealAt: game.revealAt, turnDeadline:game.turnDeadline
  };
}

function emitState() {
  runtime.ui({phase:game.phase==='lobby'?'waiting':game.phase==='playing'?'playing':'results',endsAt:game.phase==='playing'?game.turnDeadline:null,label:'Твой рисунок',currentPlayer:game.players[game.turnIndex]?.name||null,progress:`${game.segments.length} / ${game.players.length}`,actions:game.phase==='playing'?['draw']:[]});
  io.emit('game:state', publicState());
}

function activeTurnPayload(playerId) {
  if (game.phase !== 'playing') return null;
  const active = game.players[game.turnIndex];
  if (!active || active.id !== playerId) return null;
  const existing = game.segments[game.turnIndex];
  const prev = game.segments.at(-1);
  return {
    roundId:game.eventId,turnIndex: game.turnIndex,
    total: game.players.length,
    part: stageLabel(game.turnIndex, game.players.length),
    prompt: existing?.prompt || active.currentPrompt,
    connectorXs: prev?.connectorXs || [], stripData:prev?.stripData||null, overlap:prev?.stripHeight||0, turnDeadline:game.turnDeadline,
    round: game.round
  };
}

function sendTurnToActive() {
  const active = game.players[game.turnIndex];
  if (!active) return;
  if (!active.currentPrompt) {active.currentPrompt = nextPrompt();game.turnDeadline=Date.now()+90000;}emitState();
  io.to(`player:${active.id}`).emit('turn:start', activeTurnPayload(active.id));
}

function resetRound() {
  game.phase = 'playing';game.startedAt=Date.now();game.eventId=id(12);
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
  const playUrl = process.env.PARTY_JOIN_URL||`http://${host}:${PORT}/j`;
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
  socket.emit('game:state', publicState());if(game.phase==='reveal')socket.emit('round:reveal',{round:game.round,segments:game.segments});

  socket.on('host:set-config', (payload = {}, ack = () => {}) => {
    if (game.phase !== 'lobby') return ack({ ok: false, error: 'Игра уже началась' });
    const n = Math.max(2, Math.min(16, Number(payload.maxPlayers || 16)));
    game.maxPlayers = 16;
    game.promptMode = payload.promptMode === 'same' ? 'same' : 'chaos';

    emitState();
    ack({ ok: true });
  });

  socket.on('host:start', (_, ack = () => {}) => {
    if (game.phase !== 'lobby') return ack({ ok: false, error: 'Уже запущено' });
    if (game.players.length < 2) return ack({ ok: false, error: 'Нужно минимум 2 игрока' });
    if(game.players.filter(p=>p.connected).length<2)return ack({ok:false,error:'Нужно минимум 2 подключённых игрока'});
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

  function joinPlayer(payload={},ack=()=>{}) {
    const identity=runtime.identify(payload,socket);
    if(runtime.managed&&!identity)return ack({ok:false,error:'Войдите через общее лобби'});
    let player=identity?game.players.find(p=>p.id===identity.id):game.players.find(p=>p.id===payload.playerId&&p.token===payload.token);
    const name=String(identity?.name||payload.name||player?.name||'').trim().slice(0,28);
    if(!name)return ack({ok:false,error:'Введите имя'});
    if(!player){if(game.players.length>=16)return ack({ok:false,error:'Максимум 16 игроков'});player={id:identity?.id||id(6),token:identity?.token||id(12),name,handedness:identity?.hand||payload.handedness||'right',currentPrompt:null};game.players.push(player);}
    const old=io.sockets.sockets.get(player.socketId);player.connected=true;player.socketId=socket.id;
    socket.data.playerId=player.id;socket.join('player:'+player.id);
    if(old&&old!==socket){old.emit('player:replaced');old.leave('player:'+player.id);old.disconnect(true);}
    ack({ok:true,playerId:player.id,token:player.token,name:player.name,handedness:player.handedness});emitState();
    const turn=activeTurnPayload(player.id);if(turn)socket.emit('turn:start',turn);
    if(game.phase==='reveal')socket.emit('round:reveal',{round:game.round,segments:game.segments});
  }
  socket.on('player:join',joinPlayer);socket.on('player:resume',joinPlayer);
  socket.on('host:skip',(_,ack=()=>{})=>{const active=game.players[game.turnIndex];if(game.phase!=='playing'||!active)return ack({ok:false,error:'Нет активного хода'});if(active.connected&&Date.now()<game.turnDeadline)return ack({ok:false,error:'Дайте игроку закончить ход'});active.currentPrompt=null;game.turnIndex++;advanceTurn();ack({ok:true});});
  socket.on('turn:submit', ({ imageData, connectorXs, stripData, stripHeight, height, overlap, strokes } = {}, ack = () => {}) => {
    const playerId = socket.data.playerId;
    const active = game.players[game.turnIndex];
    if (game.phase !== 'playing' || !active || active.id !== playerId || active.socketId!==socket.id) {
      return ack({ ok: false, error: 'Сейчас не ваш ход' });
    }
    if (typeof imageData !== 'string' || !imageData.startsWith('data:image/png;base64,')) {
      return ack({ ok: false, error: 'Некорректный рисунок' });
    }
    if (imageData.length > 4_500_000) return ack({ ok: false, error: 'Рисунок слишком большой' });

    if(!Number.isInteger(height)||height<1||height>520||!validPng(imageData,720,height))return ack({ok:false,error:'Некорректный размер рисунка'});
    if(!Number.isInteger(stripHeight)||stripHeight<1||stripHeight>12||typeof stripData!=='string'||stripData.length>200000||!validPng(stripData,720,stripHeight))return ack({ok:false,error:'Некорректный стык'});
    const xs = Array.isArray(connectorXs)
      ? connectorXs.map(Number).filter(Number.isFinite).map(v => Math.max(0.04, Math.min(0.96, v))).slice(0, 8)
      : [];

    game.segments.push({
      playerId: active.id,
      playerName: active.name,
      prompt: active.currentPrompt,
      part: stageLabel(game.turnIndex, game.players.length),
      imageData,
      connectorXs: xs,stripData,stripHeight,height,overlap:game.turnIndex?Math.min(12,Math.max(0,Number(overlap)||0)):0,strokes:Math.max(0,Math.min(100000,Number(strokes)||0))
    });
    active.currentPrompt = null;
    game.turnIndex += 1;

    advanceTurn();
    ack({ ok: true });
  });

  socket.on('disconnect', () => {
    const pid = socket.data.playerId;
    const p = game.players.find(x => x.id === pid);
    if (p && p.socketId === socket.id) {
      p.connected = false;runtime.presence(p.id,false);
      emitState();
    }
  });
});

server.listen(PORT, (process.env.PARTY_MANAGED === '1' ? '127.0.0.1' : '0.0.0.0'), () => {
  PORT=server.address().port;const ips = getLanIps();
  console.log('\n🎨 MONSTER CIRCLE запущен');
  console.log(`🖥  Экран ведущего: http://localhost:${PORT}`);
  for (const { ip, name } of ips) console.log(`📱 Телефоны (${name}): http://${ip}:${PORT}/play.html`);
  console.log('');
});

function validPng(data,width,height){try{const b=Buffer.from(data.split(',')[1],'base64');return b.length>24&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&b.readUInt32BE(16)===width&&b.readUInt32BE(20)===height;}catch{return false;}}
function advanceTurn(){
 if(game.turnIndex>=game.players.length){game.phase='reveal';game.revealAt=Date.now();game.turnDeadline=null;emitState();io.emit('round:reveal',{round:game.round,segments:game.segments});runtime.report({eventId:game.eventId,gameId:'monster',duration:(Date.now()-game.startedAt)/1000,players:game.players.map(p=>({id:p.id,name:p.name,score:game.segments.some(s=>s.playerId===p.id)?100:0,won:true,metrics:{drawings:game.segments.filter(s=>s.playerId===p.id).length,strokes:game.segments.filter(s=>s.playerId===p.id).reduce((n,s)=>n+s.strokes,0)}}))});}
 else{sendTurnToActive();emitState();}
}

// Commands from the iPhone server console.
runtime.host({configure:s=>{game.promptMode=s.promptMode;},start:()=>{if(game.players.filter(p=>p.connected).length<2)return false;resetRound();return true;}});
