const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

let PORT = Number(process.env.PORT || 0);
const runtime=require('../../lib/party-runtime');let matchId='',matchStarted=0,reported=false;
const TICK_RATE = 60;
const WORLD = { w: 1280, h: 720 };
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getLanIps() {
  const out = [];
  const nets = os.networkInterfaces();
  for (const [name, entries] of Object.entries(nets)) {
    for (const n of entries || []) {
      if (n.family !== 'IPv4' || n.internal) continue;
      const ip = n.address;
      if (!/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)) continue;
      let score = 0;
      const low = name.toLowerCase();
      if (/wi-?fi|wlan|wireless|ethernet|^en\d|^eth\d/.test(low)) score += 20;
      if (/tailscale|zerotier|vpn|vmware|virtualbox|docker|veth|wsl|hyper-v|vethernet/.test(low)) score -= 30;
      if (ip.startsWith('192.168.')) score += 5;
      out.push({ name, address: ip, score });
    }
  }
  out.sort((a,b)=>b.score-a.score);
  if (!out.length) out.push({ name:'localhost', address:'127.0.0.1', score:0 });
  return out;
}

function json(res, value, status=200) {
  const body = Buffer.from(JSON.stringify(value));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function serveStatic(req, res) {
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (u.pathname === '/api/info') {
    const ips = getLanIps();
    const urls = ips.map(x => ({ ...x, url: `http://${x.address}:${PORT}/` }));
    return json(res, {
      port: PORT,
      lanIp: urls[0].address,
      controllerUrl: urls[0].url,
      hostUrl: `http://localhost:${PORT}/host`,
      candidates: urls
    });
  }
  let rel = u.pathname === '/' ? 'index.html' : u.pathname === '/host' ? 'host.html' : u.pathname.replace(/^\/+/, '');
  rel = path.normalize(rel).replace(/^(\.\.[/\\])+/, '');
  const file = path.join(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); return res.end('Not found'); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': path.extname(file) === '.html' ? 'no-store' : 'public, max-age=60'
    });
    res.end(data);
  });
}

const server = http.createServer(serveStatic);
const walls = [
  { x: 0, y: 0, w: WORLD.w, h: 24 },
  { x: 0, y: WORLD.h - 24, w: WORLD.w, h: 24 },
  { x: 0, y: 0, w: 24, h: WORLD.h },
  { x: WORLD.w - 24, y: 0, w: 24, h: WORLD.h },
  { x: 220, y: 95, w: 34, h: 240 },
  { x: 220, y: 455, w: 34, h: 170 },
  { x: 1026, y: 95, w: 34, h: 170 },
  { x: 1026, y: 385, w: 34, h: 240 },
  { x: 430, y: 160, w: 150, h: 32 },
  { x: 700, y: 160, w: 150, h: 32 },
  { x: 430, y: 528, w: 150, h: 32 },
  { x: 700, y: 528, w: 150, h: 32 },
  { x: 615, y: 255, w: 50, h: 210 },
  { x: 330, y: 332, w: 120, h: 32 },
  { x: 830, y: 356, w: 120, h: 32 }
];

const playerColors = ['#ff5c7c', '#56d6ff', '#ffd84a', '#8cff7b', '#bd7cff', '#ff9f43', '#5af0c8', '#ffffff'];
let nextPlayerNumber = 1;
const players = new Map();
const tokenToPlayer = new Map();
let bullets = [];
let combatEffects = [];
function impact(b, heavy=false){combatEffects.push({x:b.x,y:b.y,color:heavy?"#ffb96c":b.color||"#ffdb92",t:heavy?.6:.32,max:heavy?.6:.32});if(combatEffects.length>40)combatEffects.shift();}
let bots = [];
let nextBulletId = 1;
let nextBotId = 1;

const game = {
  mode: null,
  status: 'lobby',
  round: 0,
  maxRounds: 10,
  timer: 0,
  betweenTimer: 0,
  winnerText: '',
  redScore: 0,
  blueScore: 0,
  targetScore: 3,
  coreUnlocked: false,
  coreCarrierId: null,
  core: { x: 1080, y: 360 },
  extraction: { x: 90, y: 360, r: 58 }
};

const flags = {
  red: { team: 'red', base: { x: 95, y: 110 }, x: 95, y: 110, carrierId: null, dropped: false, returnTimer: 0 },
  blue: { team: 'blue', base: { x: 1185, y: 610 }, x: 1185, y: 610, carrierId: null, dropped: false, returnTimer: 0 }
};

function cleanName(name) {
  return String(name || 'PLAYER').replace(/[<>]/g, '').trim().slice(0, 20) || 'PLAYER';
}
function rand(min, max) { return min + Math.random() * (max - min); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function dist2(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }
function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
function teamCounts() {
  let red = 0, blue = 0;
  for (const p of players.values()) {
    if (!p.connected) continue;
    if (p.team === 'red') red++;
    if (p.team === 'blue') blue++;
  }
  return { red, blue };
}
function chooseTeam() {
  const c = teamCounts();
  return c.red <= c.blue ? 'red' : 'blue';
}
function makePlayer(socket, payload) {
  const id = `p${nextPlayerNumber++}`;
  const token = payload.token || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const p = {
    id,
    token,
    socketId: socket.id,
    connected: true,
    name: cleanName(payload.name),
    handedness: payload.handedness === 'left' ? 'left' : 'right',
    color: nextPlayerNumber<=10?playerColors[(nextPlayerNumber - 2)%playerColors.length]:`hsl(${(nextPlayerNumber*137.5)%360} 85% 70%)`,
    team: chooseTeam(),
    x: 100,
    y: 100,
    angle: 0,
    radius: 19,
    hp: 100,
    maxHp: 100,
    alive: true,
    respawnTimer: 0,
    fireCd: 0,
    input: { forward: false, fire: false, at: 0 },
    kills: 0,
    deaths: 0,
    score: 0,
    roundWins: 0,
    captures: 0,
    hasFlag: null,
    hasCore: false,
    joinedAt: Date.now()
  };
  players.set(id, p);
  tokenToPlayer.set(token, id);
  socket.data.playerId = id;
  return p;
}

function getConnectedPlayers() {
  return [...players.values()].filter(p => p.connected);
}

function resetPlayerStatsForMatch() {
  for (const p of players.values()) {
    p.kills = 0;
    p.deaths = 0;
    p.score = 0;
    p.roundWins = 0;
    p.captures = 0;
    p.hasFlag = null;
    p.hasCore = false;
  }
}

function spawnFor(p, index = 0) {
  const connected = getConnectedPlayers();
  if (game.mode === 'ctf') {
    const sameTeam = connected.filter(q => q.team === p.team);
    const idx = Math.max(0, sameTeam.findIndex(q => q.id === p.id));
    if (p.team === 'red') {
      p.x = 95 + (idx % 2) * 48;
      p.y = 220 + Math.floor(idx / 2) * 85;
      p.angle = 0;
    } else {
      p.x = 1185 - (idx % 2) * 48;
      p.y = 500 - Math.floor(idx / 2) * 85;
      p.angle = Math.PI;
    }
  } else if (game.mode === 'coop') {
    p.x=75+(index%3)*50;p.y=100+Math.floor(index/3)*100;p.angle=0;
  } else {
    p.x=80+(index%8)*160;p.y=index<8?65:655;
    p.angle = Math.atan2(WORLD.h/2-p.y, WORLD.w/2-p.x);
  }
  p.hp = p.maxHp = 100;
  p.alive = true;
  p.respawnTimer = 0;
  p.fireCd = 0.4;
  p.input.forward = p.input.fire = false;
}

function resetFlags() {
  for (const f of Object.values(flags)) {
    f.x = f.base.x;
    f.y = f.base.y;
    f.carrierId = null;
    f.dropped = false;
    f.returnTimer = 0;
  }
  for (const p of players.values()) p.hasFlag = null;
}

function resetBullets() { bullets = []; }

function startGame(mode) {
  if (!['survival', 'ctf', 'coop'].includes(mode)) return;
  if(getConnectedPlayers().length<2)return;matchId=crypto.randomUUID();matchStarted=Date.now();reported=false;
  game.mode = mode;
  game.status = 'playing';
  game.winnerText = '';
  game.redScore = 0;
  game.blueScore = 0;
  game.round = 0;
  game.timer = mode === 'ctf' ? 240 : mode === 'coop' ? 180 : 0;
  game.betweenTimer = 0;
  game.coreUnlocked = false;
  game.coreCarrierId = null;
  game.core = { x: 1080, y: 360 };
  resetPlayerStatsForMatch();
  resetBullets();
  resetFlags();
  bots = [];
  if (mode === 'survival') startSurvivalRound();
  else if (mode === 'ctf') startCTF();
  else startCoop();
}

function startSurvivalRound() {
  game.round++;
  game.status = 'playing';
  game.winnerText = '';
  resetBullets();
  const ps = getConnectedPlayers();
  ps.forEach((p, i) => spawnFor(p, i));
}

function startCTF() {
  resetFlags();
  resetBullets();
  const ps = getConnectedPlayers();
  ps.forEach((p, i) => spawnFor(p, i));
}

function createBot(type, x, y, hp) {
  const b = {
    id: `b${nextBotId++}`,
    type,
    x, y,
    angle: Math.PI,
    radius: type === 'boss' ? 28 : 20,
    hp,
    maxHp: hp,
    alive: true,
    fireCd: rand(0.3, 1),
    think: rand(0, 1),
    strafe: Math.random() > 0.5 ? 1 : -1,
    color: type === 'boss' ? '#ff3f62' : '#ff934f'
  };
  bots.push(b);
  return b;
}

function startCoop() {
  resetBullets();
  game.coreUnlocked = false;
  game.coreCarrierId = null;
  const ps = getConnectedPlayers();
  ps.forEach((p, i) => { p.team = 'human'; spawnFor(p, i); });
  createBot('boss', 1080, 360, 560);
  createBot('guard', 960, 180, 100);
  createBot('guard', 960, 540, 100);
  createBot('guard', 1140, 210, 100);
}

function circleRectCollision(x, y, r, rect) {
  const cx = clamp(x, rect.x, rect.x + rect.w);
  const cy = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy < r * r;
}
function blockedAt(x, y, r) {
  return walls.some(w => circleRectCollision(x, y, r, w));
}
function moveEntity(e, dx, dy) {
  let nx = e.x + dx;
  if (!blockedAt(nx, e.y, e.radius)) e.x = nx;
  let ny = e.y + dy;
  if (!blockedAt(e.x, ny, e.radius)) e.y = ny;
  e.x = clamp(e.x, 24 + e.radius, WORLD.w - 24 - e.radius);
  e.y = clamp(e.y, 24 + e.radius, WORLD.h - 24 - e.radius);
}

function fireBullet(owner, ownerType = 'player') {
  const isBoss = ownerType === 'bot' && owner.type === 'boss';
  const muzzle = owner.radius + 13;
  bullets.push({
    id: nextBulletId++,
    x: owner.x + Math.cos(owner.angle) * muzzle,
    y: owner.y + Math.sin(owner.angle) * muzzle,
    vx: Math.cos(owner.angle) * (isBoss ? 360 : 470),
    vy: Math.sin(owner.angle) * (isBoss ? 360 : 470),
    ownerId: owner.id,
    ownerType,
    team: ownerType === 'player' ? owner.team : 'bot',
    damage: ownerType === 'bot' ? (isBoss ? 28 : 20) : (game.mode === 'coop' ? 30 : 40),
    life: 2.0,
    radius: isBoss ? 7 : 5,
    color: ownerType === 'bot' ? '#ff6b3d' : owner.color
  });
}

function killPlayer(p, killerId = null) {
  if (!p.alive) return;
  p.alive = false;
  p.hp = 0;
  p.deaths++;
  p.input.forward = p.input.fire = false;
  if (killerId && players.has(killerId) && killerId !== p.id) {
    const killer = players.get(killerId);
    killer.kills++;
    killer.score += 100;
  }
  if (p.hasFlag) dropFlagFrom(p);
  if (p.hasCore) {
    p.hasCore = false;
    game.coreCarrierId = null;
    game.core = { x: p.x, y: p.y };
  }
  if (game.mode === 'ctf' || game.mode === 'coop') p.respawnTimer = game.mode === 'coop' ? 2.6 : 2.2;
}

function dropFlagFrom(p) {
  const key = p.hasFlag;
  const f = flags[key];
  if (!f) return;
  f.carrierId = null;
  f.x = p.x;
  f.y = p.y;
  f.dropped = true;
  f.returnTimer = 8;
  p.hasFlag = null;
}

function updatePlayers(dt) {
  const ps = getConnectedPlayers();
  for (const [i, p] of ps.entries()) {
    if (!p.alive) {
      if ((game.mode === 'ctf' || game.mode === 'coop') && p.respawnTimer > 0) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0 && game.status === 'playing') spawnFor(p, i);
      }
      continue;
    }
    p.fireCd = Math.max(0, p.fireCd - dt);
    // One-button steering: while idle the tank spins continuously.
    // Holding FORWARD freezes the current heading and drives in that direction.
    if (!p.input.forward) p.angle = normalizeAngle(p.angle + 2.9 * dt);
    if (p.input.forward) {
      const speed = 180;
      moveEntity(p, Math.cos(p.angle) * speed * dt, Math.sin(p.angle) * speed * dt);
    }
    if (p.input.fire && p.fireCd <= 0) {
      fireBullet(p, 'player');
      p.fireCd = game.mode === 'coop' ? 0.38 : 0.48;
    }
  }
}

function nearestAlivePlayer(bot) {
  let best = null, bestD = Infinity;
  for (const p of getConnectedPlayers()) {
    if (!p.alive) continue;
    const d = dist2(bot, p);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

function updateBots(dt) {
  if (game.mode !== 'coop' || game.status !== 'playing') return;
  for (const b of bots) {
    if (!b.alive) continue;
    const target = nearestAlivePlayer(b);
    if (!target) continue;
    b.fireCd -= dt;
    b.think -= dt;
    const desired = Math.atan2(target.y - b.y, target.x - b.x);
    const diff = normalizeAngle(desired - b.angle);
    const turnRate = b.type === 'boss' ? 1.15 : 1.65;
    b.angle += clamp(diff, -turnRate * dt, turnRate * dt);
    const d = Math.sqrt(dist2(b, target));
    if (b.think <= 0) {
      b.think = rand(0.8, 1.8);
      b.strafe *= Math.random() > 0.35 ? 1 : -1;
    }
    const preferred = b.type === 'boss' ? 270 : 230;
    let drive = 0;
    if (d > preferred + 60) drive = 1;
    else if (d < preferred - 80) drive = -0.45;
    const speed = b.type === 'boss' ? 62 : 86;
    const side = b.strafe * (b.type === 'boss' ? 20 : 30);
    const dx = Math.cos(b.angle) * speed * drive * dt + Math.cos(b.angle + Math.PI/2) * side * dt;
    const dy = Math.sin(b.angle) * speed * drive * dt + Math.sin(b.angle + Math.PI/2) * side * dt;
    moveEntity(b, dx, dy);
    if (Math.abs(diff) < 0.22 && d < (b.type === 'boss' ? 620 : 520) && b.fireCd <= 0) {
      fireBullet(b, 'bot');
      b.fireCd = b.type === 'boss' ? rand(0.72, 0.95) : rand(1.05, 1.45);
    }
  }
}

function bulletHitsWall(b) { return walls.some(w => circleRectCollision(b.x, b.y, b.radius, w)); }
function updateBullets(dt) {
  combatEffects=combatEffects.filter(e=>(e.t-=dt)>0);
  const survivors = [];
  for (const b of bullets) {
    b.life -= dt;
    if (b.life <= 0) continue;
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (bulletHitsWall(b)) {impact(b);continue;}
    let hit = false;
    if (b.ownerType === 'player') {
      if (game.mode === 'coop') {
        for (const bot of bots) {
          if (!bot.alive) continue;
          const rr = b.radius + bot.radius;
          if (dist2(b, bot) <= rr * rr) {
            bot.hp -= b.damage;
            hit = true;
            if (bot.hp <= 0) {
              bot.alive = false;
              const owner = players.get(b.ownerId);
              if (owner) { owner.kills++; owner.score += bot.type === 'boss' ? 750 : 180; }
              if (bot.type === 'boss') {
                game.coreUnlocked = true;
                game.core = { x: bot.x, y: bot.y };
              }
            }
            break;
          }
        }
      } else {
        for (const p of getConnectedPlayers()) {
          if (!p.alive || p.id === b.ownerId) continue;
          if (game.mode === 'ctf' && p.team === b.team) continue;
          const rr = b.radius + p.radius;
          if (dist2(b, p) <= rr * rr) {
            p.hp -= b.damage;
            hit = true;
            if (p.hp <= 0) killPlayer(p, b.ownerId);
            break;
          }
        }
      }
    } else {
      for (const p of getConnectedPlayers()) {
        if (!p.alive) continue;
        const rr = b.radius + p.radius;
        if (dist2(b, p) <= rr * rr) {
          p.hp -= b.damage;
          hit = true;
          if (p.hp <= 0) killPlayer(p, null);
          break;
        }
      }
    }
    if (hit) impact(b,true);
    if (!hit) survivors.push(b);
  }
  bullets = survivors;
}

function updateSurvival(dt) {
  if (game.status === 'between') {
    game.betweenTimer -= dt;
    if (game.betweenTimer <= 0) {
      if (game.round >= game.maxRounds) finishSurvival();
      else startSurvivalRound();
    }
    return;
  }
  if (game.status !== 'playing') return;
  const participants = getConnectedPlayers();
  const alive = participants.filter(p => p.alive);
  if (participants.length >= 2 && alive.length <= 1) {
    if (alive.length === 1) {
      alive[0].roundWins++;
      alive[0].score += 500;
      game.winnerText = `${alive[0].name} забирает раунд`;
    } else {
      game.winnerText = 'Взаимное уничтожение';
    }
    game.status = 'between';
    game.betweenTimer = 2.6;
  }
}

function finishSurvival() {
  game.status = 'finished';
  const ranked = getConnectedPlayers().sort((a,b) => b.roundWins - a.roundWins || b.kills - a.kills);
  game.winnerText = ranked[0] ? `${ranked[0].name} — чемпион (${ranked[0].roundWins}/${game.maxRounds})` : 'Матч окончен';
}

function updateFlags(dt) {
  for (const f of Object.values(flags)) {
    if (f.carrierId) {
      const carrier = players.get(f.carrierId);
      if (carrier && carrier.alive) { f.x = carrier.x; f.y = carrier.y; }
      else { f.carrierId = null; f.dropped = true; f.returnTimer = 8; }
    } else if (f.dropped) {
      f.returnTimer -= dt;
      if (f.returnTimer <= 0) {
        f.x = f.base.x; f.y = f.base.y; f.dropped = false;
      }
    }
  }
  for (const p of getConnectedPlayers()) {
    if (!p.alive) continue;
    for (const [key, f] of Object.entries(flags)) {
      const near = (p.x - f.x) ** 2 + (p.y - f.y) ** 2 < (p.radius + 24) ** 2;
      if (!near || f.carrierId) continue;
      if (key === p.team && f.dropped) {
        f.x = f.base.x; f.y = f.base.y; f.dropped = false; f.returnTimer = 0;
      } else if (key !== p.team && !p.hasFlag) {
        f.carrierId = p.id;
        f.dropped = false;
        p.hasFlag = key;
      }
    }
    if (p.hasFlag) {
      const own = flags[p.team];
      const enemy = flags[p.hasFlag];
      const ownHome = !own.carrierId && !own.dropped && Math.hypot(own.x-own.base.x, own.y-own.base.y) < 3;
      const atBase = Math.hypot(p.x-own.base.x, p.y-own.base.y) < 48;
      if (ownHome && atBase) {
        enemy.carrierId = null;
        enemy.x = enemy.base.x; enemy.y = enemy.base.y; enemy.dropped = false;
        p.hasFlag = null;
        p.captures++;
        p.score += 1000;
        if (p.team === 'red') game.redScore++; else game.blueScore++;
        if (game.redScore >= game.targetScore || game.blueScore >= game.targetScore) {
          game.status = 'finished';
          game.winnerText = `${p.team === 'red' ? 'Красная' : 'Синяя'} команда победила ${game.redScore}:${game.blueScore}`;
        }
      }
    }
  }
}

function updateCTF(dt) {
  if (game.status !== 'playing') return;
  game.timer -= dt;
  updateFlags(dt);
  if (game.timer <= 0) {
    game.status = 'finished';
    if (game.redScore === game.blueScore) game.winnerText = `Ничья ${game.redScore}:${game.blueScore}`;
    else game.winnerText = `${game.redScore > game.blueScore ? 'Красная' : 'Синяя'} команда победила ${game.redScore}:${game.blueScore}`;
  }
}

function updateCoop(dt) {
  if (game.status !== 'playing') return;
  game.timer -= dt;
  if (game.coreCarrierId) {
    const carrier = players.get(game.coreCarrierId);
    if (carrier && carrier.alive) {
      game.core.x = carrier.x; game.core.y = carrier.y;
      if (Math.hypot(carrier.x - game.extraction.x, carrier.y - game.extraction.y) < game.extraction.r) {
        game.status = 'finished';
        game.winnerText = `Ядро украдено. Команда победила!`;
        carrier.score += 1500;
      }
    } else game.coreCarrierId = null;
  } else if (game.coreUnlocked) {
    for (const p of getConnectedPlayers()) {
      if (!p.alive) continue;
      if (Math.hypot(p.x-game.core.x, p.y-game.core.y) < p.radius + 25) {
        game.coreCarrierId = p.id;
        p.hasCore = true;
        break;
      }
    }
  }
  if (game.timer <= 0) {
    game.status = 'finished';
    game.winnerText = 'Босс удержал ядро. Попробуйте ещё раз.';
  }
}

function snapshot() {
  return {
    world: WORLD,
    effects: combatEffects,
    walls,
    game: { ...game },
    flags,
    players: getConnectedPlayers().map(p => ({
      id:p.id,name:p.name,color:p.color,team:p.team,x:p.x,y:p.y,angle:p.angle,radius:p.radius,
      hp:p.hp,maxHp:p.maxHp,alive:p.alive,respawnTimer:p.respawnTimer,kills:p.kills,deaths:p.deaths,
      score:p.score,roundWins:p.roundWins,captures:p.captures,hasFlag:p.hasFlag,hasCore:p.hasCore,handedness:p.handedness
    })),
    bullets: bullets.map(b => ({ id:b.id,x:b.x,y:b.y,radius:b.radius,color:b.color,vx:b.vx,vy:b.vy,life:b.life })),
    bots: bots.map(b => ({ id:b.id,type:b.type,x:b.x,y:b.y,angle:b.angle,radius:b.radius,hp:b.hp,maxHp:b.maxHp,alive:b.alive,color:b.color }))
  };
}

function lobbyState() {
  return getConnectedPlayers().map(p => ({ id:p.id,name:p.name,color:p.color,team:p.team,handedness:p.handedness }));
}


// ---- Tiny dependency-free WebSocket transport ---------------------------------
let nextSocketId = 1;
const clients = new Set();
const clientsById = new Map();

function wsFrame(text, opcode=1) {
  const payload = Buffer.isBuffer(text) ? text : Buffer.from(String(text));
  const len = payload.length;
  let head;
  if (len < 126) {
    head = Buffer.alloc(2); head[0] = 0x80 | opcode; head[1] = len;
  } else if (len < 65536) {
    head = Buffer.alloc(4); head[0] = 0x80 | opcode; head[1] = 126; head.writeUInt16BE(len, 2);
  } else {
    head = Buffer.alloc(10); head[0] = 0x80 | opcode; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([head, payload]);
}

class WSClient {
  constructor(socket,req) {
    this.trustedHost=runtime.managed?req?.headers?.['x-party-local']==='1':['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req?.socket?.remoteAddress);
    this.socket = socket;
    this.id = `s${nextSocketId++}`;
    this.data = {};
    this.buffer = Buffer.alloc(0);
    this.closed = false;
    clients.add(this); clientsById.set(this.id, this);
    socket.on('data', chunk => this.onData(chunk));
    socket.on('close', () => this.onClose());
    socket.on('end', () => this.onClose());
    socket.on('error', () => this.onClose());
  }
  send(type, data) {
    if (this.closed || this.socket.destroyed) return;
    if(type==='state'&&this.socket.writableLength>256*1024)return;
    try { this.socket.write(wsFrame(JSON.stringify({ type, data }))); } catch {}
  }
  pong(payload) {
    if (!this.closed && !this.socket.destroyed) try { this.socket.write(wsFrame(payload, 0xA)); } catch {}
  }
  onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const b0 = this.buffer[0], b1 = this.buffer[1];
      const opcode = b0 & 0x0f;
      const masked = !!(b1 & 0x80);
      let len = b1 & 0x7f, off = 2;
      if (len === 126) {
        if (this.buffer.length < 4) return;
        len = this.buffer.readUInt16BE(2); off = 4;
      } else if (len === 127) {
        if (this.buffer.length < 10) return;
        const n = this.buffer.readBigUInt64BE(2);
        if (n > 1024n * 1024n) return this.socket.destroy();
        len = Number(n); off = 10;
      }
      let mask;
      if (masked) {
        if (this.buffer.length < off + 4) return;
        mask = this.buffer.subarray(off, off + 4); off += 4;
      }
      if (this.buffer.length < off + len) return;
      const payload = Buffer.from(this.buffer.subarray(off, off + len));
      this.buffer = this.buffer.subarray(off + len);
      if (masked) for (let i=0;i<payload.length;i++) payload[i] ^= mask[i & 3];
      if (opcode === 0x8) { this.socket.end(wsFrame('', 0x8)); return; }
      if (opcode === 0x9) { this.pong(payload); continue; }
      if (opcode !== 0x1) continue;
      try {
        const msg = JSON.parse(payload.toString('utf8'));
        handleMessage(this, msg);
      } catch {}
    }
  }
  onClose() {
    if (this.closed) return;
    this.closed = true;
    clients.delete(this); clientsById.delete(this.id);
    handleDisconnect(this);
  }
}

function broadcast(type, data) {
  for (const c of clients) c.send(type, data);
}
function broadcastHosts(type, data) {
  for (const c of clients) if (c.data.isHost) c.send(type, data);
}
function sendTo(id, type, data) {
  clientsById.get(id)?.send(type, data);
}

function handleMessage(socket, msg) {
  if(socket.partyRemoved||!runtime.allowMessage(msg))return;
  const event = msg && msg.type;
  const payload = msg && msg.data;
  if (event === 'registerHost') {
    if(!socket.trustedHost)return;
    socket.data.isHost = true;
    socket.send('state', snapshot());
    socket.send('lobby', lobbyState());
    return;
  }
  if (event === 'join') {
    const data = {...(payload || {})};const identity=runtime.identify(data,socket);if(runtime.managed&&!identity)return socket.send('error','Войдите через общее лобби');if(identity){data.token='party:'+identity.id;data.name=identity.name;data.handedness=identity.hand;}
    let p = null;
    if (data.token && tokenToPlayer.has(data.token)) {
      p = players.get(tokenToPlayer.get(data.token));
      if (p) {
        p.connected = true;
        p.socketId = socket.id;
        p.name = cleanName(data.name || p.name);
        p.handedness = data.handedness === 'left' ? 'left' : 'right';
        socket.data.playerId = p.id;
      }
    }
    if (!p){p=makePlayer(socket,data);if(game.mode==='coop')p.team='human';if(game.status==='playing'||game.status==='between')spawnFor(p,getConnectedPlayers().length-1);}
    if(identity)p.partyId=identity.id;
    socket.send('joined', { id:p.id, token:p.token, name:p.name, color:p.color, team:p.team, handedness:p.handedness });
    broadcast('lobby', lobbyState());
    return;
  }
  const p = players.get(socket.data.playerId);if(p&&p.socketId!==socket.id)return;
  if (event === 'input') {
    if (!p) return;
    const input = payload || {};
    p.input.forward = !!input.forward;
    p.input.fire = !!input.fire;
    p.input.at = Date.now();
  } else if (event === 'setHandedness') {
    if (!p) return;
    p.handedness = payload === 'left' ? 'left' : 'right';
    broadcast('lobby', lobbyState());
  } else if (event === 'setTeam') {
    if (!p || !['red','blue'].includes(payload) || game.status === 'playing') return;
    p.team = payload;
    broadcast('lobby', lobbyState());
  } else if (event === 'startGame') {
    if (!socket.data.isHost) return;
    startGame(payload);
  } else if (event === 'backToLobby') {
    if (!socket.data.isHost) return;
    game.mode = null; game.status = 'lobby'; game.winnerText = ''; game.round = 0;
    resetBullets(); bots = []; resetFlags();
    for (const pl of players.values()) {
      pl.team = pl.team === 'human' ? chooseTeam() : pl.team;
      pl.alive = true; pl.hp = 100; pl.input.forward = pl.input.fire = false;
    }
    broadcast('lobby', lobbyState());
  }
}

function handleDisconnect(socket) {
  const p = players.get(socket.data.playerId);
  if (p && p.socketId === socket.id) {
    p.connected = false;if(p.partyId)runtime.presence(p.partyId,false);
    p.input.forward = p.input.fire = false;
    if (p.alive && game.mode === 'survival') killPlayer(p, null);
    if (p.hasFlag) dropFlagFrom(p);
    if (p.hasCore) {
      p.hasCore = false; game.coreCarrierId = null; game.core = { x:p.x, y:p.y };
    }
    broadcast('lobby', lobbyState());
  }
}

server.on('upgrade', (req, socket) => {
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (u.pathname !== '/ws' || String(req.headers.upgrade || '').toLowerCase() !== 'websocket') return socket.destroy();
  const key = req.headers['sec-websocket-key'];
  if (!key) return socket.destroy();
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
  new WSClient(socket,req);
});

let last = BigInt(Math.floor(runtime.now()*1000000));
let broadcastAcc = 0;
runtime.setInterval(() => {
  const now = BigInt(Math.floor(runtime.now()*1000000));
  let dt = Number(now - last) / 1e9;
  last = now;
  dt = Math.min(dt, 0.05);
  const inputNow=Date.now();for(const p of players.values())if((p.input.forward||p.input.fire)&&inputNow-(p.input.at||0)>500)p.input.forward=p.input.fire=false;
  if (game.status === 'playing' || game.status === 'between') {
    updatePlayers(dt);
    updateBots(dt);
    updateBullets(dt);
    if (game.mode === 'survival') updateSurvival(dt);
    if (game.mode === 'ctf') updateCTF(dt);
    if (game.mode === 'coop') updateCoop(dt);
  }
  if(game.status==='finished'&&!reported){reported=true;const ps=[...players.values()],best=Math.max(...ps.map(p=>p.roundWins));runtime.report({gameId:'tanks',eventId:matchId,duration:(Date.now()-matchStarted)/1000,players:ps.map(p=>({id:p.partyId||p.id,name:p.name,score:p.score,won:game.mode==='survival'?p.roundWins===best:game.mode==='ctf'?(p.team==='red'?game.redScore>=game.blueScore:game.blueScore>=game.redScore):game.winnerText.includes('Команда победила'),metrics:{kills:p.kills,deaths:p.deaths,captures:p.captures,roundWins:p.roundWins}}))});}
  broadcastAcc += dt;
  if (broadcastAcc >= 1/30) {
    broadcastAcc = 0;
    runtime.ui?.({phase:game.status==='lobby'?'waiting':game.status==='finished'?'results':game.status==='between'?'reveal':'playing',endsAt:game.timer>0&&game.status==='playing'?Date.now()+game.timer*1000:null,label:'До конца боя',progress:`Раунд ${game.round} / ${game.maxRounds}`});
    const state = snapshot();
    broadcastHosts('state', state);
    for (const p of getConnectedPlayers()) {
      sendTo(p.socketId, 'selfState', {
        id:p.id,name:p.name,color:p.color,team:p.team,hp:p.hp,maxHp:p.maxHp,alive:p.alive,
        respawnTimer:p.respawnTimer,kills:p.kills,deaths:p.deaths,score:p.score,roundWins:p.roundWins,
        captures:p.captures,hasFlag:p.hasFlag,hasCore:p.hasCore,mode:game.mode,status:game.status,
        round:game.round,maxRounds:game.maxRounds,redScore:game.redScore,blueScore:game.blueScore,
        timer:game.timer,winnerText:game.winnerText
      });
    }
  }
}, 1000 / TICK_RATE);

server.listen(PORT, (process.env.PARTY_MANAGED === '1' ? '127.0.0.1' : '0.0.0.0'), () => {
  PORT=server.address().port;process.send?.({type:'ready',port:PORT});const ips = getLanIps();
  console.log('\n================ LOCAL TANKS ================');
  console.log(`HOST SCREEN : http://localhost:${PORT}/host`);
  console.log(`PHONES      : http://${ips[0].address}:${PORT}/`);
  if (ips.length > 1) console.log('ALT IPs     : ' + ips.slice(1).map(x=>x.address).join(', '));
  console.log('Same Wi-Fi required. Keep this window open.');
  console.log('=============================================\n');
});

runtime.onPause(()=>{for(const p of players.values()){p.input.forward=false;p.input.fire=false;}});

// Commands from the iPhone server console.
runtime.host({start:s=>{startGame(s.mode);return game.status!=='lobby';}});
