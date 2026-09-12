const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const TEST_FAST = process.env.TEST_FAST === '1';
const TICK_RATE = 60;
const WORLD = { w: 1280, h: 720 };
const CENTER = { x: 640, y: 360 };
const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

function getLanIps() {
  const out = [];
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    for (const n of entries || []) {
      if (n.family !== 'IPv4' || n.internal) continue;
      const ip = n.address;
      if (!/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)) continue;
      const low = name.toLowerCase();
      let score = 0;
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
function json(res, value, status=200){
  const body=Buffer.from(JSON.stringify(value));
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Content-Length':body.length,'Cache-Control':'no-store'});
  res.end(body);
}
function serveStatic(req,res){
  const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(u.pathname==='/api/info'){
    const ips=getLanIps();
    const candidates=ips.map(x=>({...x,url:`http://${x.address}:${PORT}/`}));
    return json(res,{port:PORT,lanIp:candidates[0].address,controllerUrl:candidates[0].url,hostUrl:`http://localhost:${PORT}/host`,candidates});
  }
  let rel=u.pathname==='/'?'index.html':u.pathname==='/host'?'host.html':u.pathname.replace(/^\/+/, '');
  rel=path.normalize(rel).replace(/^(\.\.[/\\])+/, '');
  const file=path.join(PUBLIC_DIR,rel);
  if(!file.startsWith(PUBLIC_DIR)){res.writeHead(403);return res.end('Forbidden');}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Not found');}
    res.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':path.extname(file)==='.html'?'no-store':'public, max-age=60'});
    res.end(data);
  });
}
const server=http.createServer(serveStatic);

const BASE_COLORS=['#ff5d7a','#58d9ff','#ffd44c','#79f28b','#b47cff','#ff974d','#48e0c2','#f471d0','#9ca7ff','#ff7b6b','#a9f05f','#f7f7f7'];
function colorForIndex(i){
  if(i<BASE_COLORS.length)return BASE_COLORS[i];
  return `hsl(${Math.round((i*137.508)%360)} 82% 63%)`;
}
function cleanName(name){return String(name||'PLAYER').replace(/[<>]/g,'').trim().slice(0,20)||'PLAYER';}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function len(x,y){return Math.hypot(x,y);}
function normAngle(a){while(a<0)a+=Math.PI*2;while(a>=Math.PI*2)a-=Math.PI*2;return a;}
function shortestAngle(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;}
function rand(a,b){return a+Math.random()*(b-a);}

let nextPlayerNumber=1;
const players=new Map();
const tokenToPlayer=new Map();

const game={
  mode:null,status:'lobby',round:0,maxRounds:7,timer:0,countdown:0,betweenTimer:0,winnerText:'',
  arenaRadius:292,roundDuration:0
};
const drum={angle:0,speed:0,radius:210,sectors:[],flying:[],stuck:[],knivesPerPlayer:5,wobble:0};

function connectedPlayers(){return [...players.values()].filter(p=>p.connected);}
function activePlayers(){return connectedPlayers().filter(p=>p.active);}
function makePlayer(socket,payload){
  const id=`p${nextPlayerNumber++}`;
  const idx=nextPlayerNumber-2;
  const token=payload.token||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const rawName=cleanName(payload.name);
  const autoLeft=/^(даша|dash|dasha)/i.test(rawName);
  const p={
    id,token,socketId:socket.id,connected:true,name:rawName,
    handedness:payload.handedness==='left'||(payload.handedness==null&&autoLeft)?'left':'right',
    color:colorForIndex(idx),x:CENTER.x,y:CENTER.y,vx:0,vy:0,radius:24,alive:false,active:false,
    input:{jx:0,jy:0},roundWins:0,totalScore:0,roundScore:0,knivesRemaining:0,throwCd:0,
    launcherAngle:0,lastFeedback:'',lastFeedbackAt:0,joinedAt:Date.now(),impactCd:0
  };
  players.set(id,p);tokenToPlayer.set(token,id);socket.data.playerId=id;return p;
}
function resetMatchStats(){
  for(const p of players.values()){
    p.roundWins=0;p.totalScore=0;p.roundScore=0;p.knivesRemaining=0;p.lastFeedback='';p.input.jx=p.input.jy=0;
  }
}
function lobbyState(){return connectedPlayers().map(p=>({id:p.id,name:p.name,color:p.color,handedness:p.handedness}));}
function playerView(p){
  return {id:p.id,name:p.name,color:p.color,handedness:p.handedness,x:p.x,y:p.y,vx:p.vx,vy:p.vy,radius:p.radius,alive:p.alive,active:p.active,
    roundWins:p.roundWins,totalScore:p.totalScore,roundScore:p.roundScore,knivesRemaining:p.knivesRemaining,launcherAngle:p.launcherAngle,lastFeedback:p.lastFeedback,lastFeedbackAt:p.lastFeedbackAt};
}
function snapshot(){
  return {world:WORLD,center:CENTER,game:{...game},players:connectedPlayers().map(playerView),drum:{angle:drum.angle,speed:drum.speed,radius:drum.radius,sectors:drum.sectors,stuck:drum.stuck,knivesPerPlayer:drum.knivesPerPlayer},flying:drum.flying.map(k=>({...k}))};
}
function selfState(p){
  return {id:p.id,name:p.name,color:p.color,handedness:p.handedness,mode:game.mode,status:game.status,round:game.round,maxRounds:game.maxRounds,
    timer:game.timer,countdown:game.countdown,roundWins:p.roundWins,totalScore:p.totalScore,roundScore:p.roundScore,knivesRemaining:p.knivesRemaining,
    active:p.active,alive:p.alive,lastFeedback:p.lastFeedback,lastFeedbackAt:p.lastFeedbackAt,winnerText:game.winnerText};
}

function startGame(payload){
  const mode=typeof payload==='string'?payload:payload?.mode;
  if(!['push','knives'].includes(mode))return;
  const rounds=clamp(Number(payload?.maxRounds||game.maxRounds)||7,5,10);
  if(!connectedPlayers().length){game.winnerText='Подключите хотя бы одного игрока';broadcastHosts('state',snapshot());return;}
  game.mode=mode;game.maxRounds=rounds;game.round=0;game.winnerText='';resetMatchStats();nextRound();
}
function nextRound(){
  game.round++;
  if(game.round>game.maxRounds)return finishMatch();
  if(game.mode==='push') setupPushRound(); else setupKnivesRound();
  game.status='countdown';game.countdown=TEST_FAST?0.08:3.0;game.winnerText='';
}
function setupPushRound(){
  const ps=connectedPlayers();
  game.arenaRadius=292;game.roundDuration=TEST_FAST?1.2:42;
  const spawnR=Math.min(215,100+ps.length*10);
  ps.forEach((p,i)=>{
    const a=-Math.PI/2+i*Math.PI*2/Math.max(1,ps.length);
    p.active=true;p.alive=true;p.x=CENTER.x+Math.cos(a)*spawnR;p.y=CENTER.y+Math.sin(a)*spawnR;
    p.vx=p.vy=0;p.input.jx=p.input.jy=0;p.roundScore=0;p.impactCd=0;
  });
  drum.flying=[];drum.stuck=[];
}
function buildSectors(ps,round){
  const count=clamp(10+ps.length*3+(round-1)*2,10,46);
  const weights=Array.from({length:count},()=>rand(.65,1.55));
  const sum=weights.reduce((a,b)=>a+b,0);
  let a=0;const sectors=[];
  for(let i=0;i<count;i++){
    const size=weights[i]/sum*Math.PI*2;
    let ownerId=null,type='neutral',color='#3a414c';
    const hazardChance=round>=3?.10:.04;
    if(Math.random()<hazardChance){type='danger';color='#15191f';}
    else if(ps.length && Math.random()<.82){
      const owner=ps[(i+round)%ps.length];ownerId=owner.id;type='player';color=owner.color;
    }
    sectors.push({start:a,end:a+size,ownerId,type,color});a+=size;
  }
  // Guarantee every player has at least two scoring sectors.
  for(let j=0;j<ps.length;j++){
    for(let n=0;n<2;n++){
      const idx=(j*2+n*ps.length+round)%sectors.length;
      sectors[idx].ownerId=ps[j].id;sectors[idx].type='player';sectors[idx].color=ps[j].color;
    }
  }
  return sectors;
}
function setupKnivesRound(){
  const ps=connectedPlayers();
  game.roundDuration=TEST_FAST?1.4:Math.max(24,34-game.round*.8);
  drum.angle=rand(0,Math.PI*2);
  const base=.50+(game.round-1)*.10;
  drum.speed=(game.round%2===0?-1:1)*clamp(base,.5,1.45);
  drum.wobble=game.round>=4?(.10+.035*game.round):0;
  drum.sectors=buildSectors(ps,game.round);drum.flying=[];drum.stuck=[];
  drum.knivesPerPlayer=clamp(5+Math.floor((game.round-1)/3),5,7);
  ps.forEach((p,i)=>{
    p.active=true;p.alive=true;p.roundScore=0;p.knivesRemaining=drum.knivesPerPlayer;p.throwCd=0;
    p.launcherAngle=-Math.PI/2+i*Math.PI*2/Math.max(1,ps.length);
    p.lastFeedback='';
  });
}
function finishMatch(){
  game.status='finished';game.timer=0;
  const ps=connectedPlayers();
  if(!ps.length){game.winnerText='Матч окончен';return;}
  let sorted;
  if(game.mode==='push') sorted=[...ps].sort((a,b)=>b.roundWins-a.roundWins||b.totalScore-a.totalScore);
  else sorted=[...ps].sort((a,b)=>b.totalScore-a.totalScore||b.roundWins-a.roundWins);
  const top=sorted[0];
  const tied=sorted.filter(p=>game.mode==='push'?p.roundWins===top.roundWins:p.totalScore===top.totalScore);
  game.winnerText=tied.length>1?`НИЧЬЯ: ${tied.map(p=>p.name).join(' + ')}`:`🏆 ${top.name} ПОБЕДИЛ!`;
  for(const p of players.values()){p.input.jx=p.input.jy=0;}
}
function endRound(text,winners=[]){
  if(game.status!=='playing')return;
  game.status='between';game.betweenTimer=TEST_FAST?0.08:2.7;game.winnerText=text;
  for(const p of winners){p.roundWins++;p.totalScore+=game.mode==='push'?3:0;}
}

function updatePush(dt){
  const ps=activePlayers().filter(p=>p.alive);
  const elapsed=game.roundDuration-game.timer;
  const shrinkT=clamp((elapsed-(TEST_FAST?.2:12))/(TEST_FAST?.7:24),0,1);
  game.arenaRadius=292-shrinkT*88;
  for(const p of ps){
    p.impactCd=Math.max(0,p.impactCd-dt);
    let jx=clamp(Number(p.input.jx)||0,-1,1),jy=clamp(Number(p.input.jy)||0,-1,1);
    const jm=len(jx,jy);if(jm>1){jx/=jm;jy/=jm;}
    const accel=jm>.05?1050:0;
    p.vx+=jx*accel*dt;p.vy+=jy*accel*dt;
    const damping=Math.pow(jm>.05?.92:.75,dt*60);
    p.vx*=damping;p.vy*=damping;
    const sp=len(p.vx,p.vy),maxSp=330;if(sp>maxSp){p.vx=p.vx/sp*maxSp;p.vy=p.vy/sp*maxSp;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;
  }
  // Player-player impulses.
  for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){
    const a=ps[i],b=ps[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);const minD=a.radius+b.radius;
    if(d>=minD)continue;if(d<.001){dx=1;dy=0;d=1;}
    const nx=dx/d,ny=dy/d,overlap=minD-d;
    a.x-=nx*overlap*.5;a.y-=ny*overlap*.5;b.x+=nx*overlap*.5;b.y+=ny*overlap*.5;
    const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
    if(rel>0){
      const baseImpulse=rel*.78;
      a.vx-=nx*baseImpulse*.5;a.vy-=ny*baseImpulse*.5;b.vx+=nx*baseImpulse*.5;b.vy+=ny*baseImpulse*.5;
      if(rel>90 && a.impactCd<=0 && b.impactCd<=0){
        const kick=55+Math.min(150,rel*.42);
        const am=len(a.input.jx,a.input.jy),bm=len(b.input.jx,b.input.jy);
        if(am>bm+.12){b.vx+=nx*kick;b.vy+=ny*kick;a.vx-=nx*kick*.18;a.vy-=ny*kick*.18;}
        else if(bm>am+.12){a.vx-=nx*kick;a.vy-=ny*kick;b.vx+=nx*kick*.18;b.vy+=ny*kick*.18;}
        a.impactCd=b.impactCd=.12;
      }
    }
  }
  for(const p of ps){
    const d=Math.hypot(p.x-CENTER.x,p.y-CENTER.y);
    if(d>game.arenaRadius+p.radius*.42){p.alive=false;p.input.jx=p.input.jy=0;p.lastFeedback='OUT!';p.lastFeedbackAt=Date.now();}
  }
  const alive=activePlayers().filter(p=>p.alive);
  if(alive.length<=1 && activePlayers().length>1){
    if(alive.length===1)endRound(`👑 ${alive[0].name} остался на арене!`,alive);
    else endRound('💥 Все вылетели одновременно!',[]);
  } else if(game.timer<=0){
    const contenders=alive.length?alive:activePlayers();
    contenders.sort((a,b)=>Math.hypot(a.x-CENTER.x,a.y-CENTER.y)-Math.hypot(b.x-CENTER.x,b.y-CENTER.y));
    if(contenders[0])endRound(`⏱ ${contenders[0].name} ближе всех к центру!`,[contenders[0]]);
  } else if(activePlayers().length===1 && game.timer<=Math.max(0,game.roundDuration-(TEST_FAST?.25:3))){
    endRound(`👑 ${activePlayers()[0].name} — победитель раунда`,[activePlayers()[0]]);
  }
}

function throwKnife(p){
  if(game.mode!=='knives'||game.status!=='playing'||!p.active||p.knivesRemaining<=0||p.throwCd>0)return;
  p.knivesRemaining--;p.throwCd=.28;
  const r=340, a=p.launcherAngle;
  const x=CENTER.x+Math.cos(a)*r,y=CENTER.y+Math.sin(a)*r;
  const speed=900;
  drum.flying.push({id:`k${Date.now()}${Math.random()}`,ownerId:p.id,color:p.color,x,y,vx:-Math.cos(a)*speed,vy:-Math.sin(a)*speed,angle:a+Math.PI});
  p.lastFeedback='THROW';p.lastFeedbackAt=Date.now();
}
function sectorAt(localAngle){
  const a=normAngle(localAngle);
  return drum.sectors.find(s=>a>=s.start&&a<s.end)||drum.sectors[drum.sectors.length-1];
}
function scoreHit(p,localAngle){
  for(const s of drum.stuck){
    if(Math.abs(shortestAngle(localAngle-s.localAngle))<.030){
      p.roundScore-=1;p.totalScore-=1;p.lastFeedback='CLANG −1';p.lastFeedbackAt=Date.now();return false;
    }
  }
  const sec=sectorAt(localAngle);let delta=0,label='MISS 0';
  if(sec?.type==='danger'){delta=-2;label='DANGER −2';}
  else if(sec?.ownerId===p.id){delta=2;label='YOUR COLOR +2';}
  else if(sec?.type==='player'){delta=-1;label='WRONG COLOR −1';}
  p.roundScore+=delta;p.totalScore+=delta;p.lastFeedback=label;p.lastFeedbackAt=Date.now();return true;
}
function updateKnives(dt){
  const t=Date.now()/1000;
  const wobble=drum.wobble?Math.sin(t*1.7)*drum.wobble:0;
  drum.angle=normAngle(drum.angle+(drum.speed+wobble)*dt);
  for(const p of activePlayers())p.throwCd=Math.max(0,p.throwCd-dt);
  for(let i=drum.flying.length-1;i>=0;i--){
    const k=drum.flying[i];k.x+=k.vx*dt;k.y+=k.vy*dt;
    const d=Math.hypot(k.x-CENTER.x,k.y-CENTER.y);
    if(d<=drum.radius+5){
      const impactWorld=Math.atan2(k.y-CENTER.y,k.x-CENTER.x);
      const local=normAngle(impactWorld-drum.angle);
      const p=players.get(k.ownerId);
      const stick=p?scoreHit(p,local):false;
      if(stick)drum.stuck.push({ownerId:k.ownerId,color:k.color,localAngle:local});
      drum.flying.splice(i,1);
    } else if(d<10){drum.flying.splice(i,1);}
  }
  const aps=activePlayers();
  const allSpent=aps.length&&aps.every(p=>p.knivesRemaining<=0)&&drum.flying.length===0;
  if(allSpent||game.timer<=0){
    const sorted=[...aps].sort((a,b)=>b.roundScore-a.roundScore);
    if(!sorted.length)return endRound('Раунд окончен',[]);
    const best=sorted[0].roundScore;const winners=sorted.filter(p=>p.roundScore===best);
    winners.forEach(p=>p.roundWins++);
    game.status='between';game.betweenTimer=TEST_FAST?0.08:3;game.winnerText=winners.length>1?`🎯 Ничья раунда: ${winners.map(p=>p.name).join(' + ')} · ${best}`:`🎯 ${winners[0].name} берёт раунд · ${best}`;
  }
}

function updateGame(dt){
  if(game.status==='countdown'){
    game.countdown-=dt;
    if(game.countdown<=0){game.countdown=0;game.status='playing';game.timer=game.roundDuration;}
    return;
  }
  if(game.status==='playing'){
    game.timer=Math.max(0,game.timer-dt);
    if(game.mode==='push')updatePush(dt);else if(game.mode==='knives')updateKnives(dt);
    return;
  }
  if(game.status==='between'){
    game.betweenTimer-=dt;if(game.betweenTimer<=0){if(game.round>=game.maxRounds)finishMatch();else nextRound();}
  }
}

// --- tiny dependency-free WebSocket transport ---
let nextSocketId=1;const clients=new Set(),clientsById=new Map();
function wsFrame(text,opcode=1){
  const payload=Buffer.isBuffer(text)?text:Buffer.from(String(text));const n=payload.length;let head;
  if(n<126){head=Buffer.alloc(2);head[0]=0x80|opcode;head[1]=n;}
  else if(n<65536){head=Buffer.alloc(4);head[0]=0x80|opcode;head[1]=126;head.writeUInt16BE(n,2);}
  else{head=Buffer.alloc(10);head[0]=0x80|opcode;head[1]=127;head.writeBigUInt64BE(BigInt(n),2);}
  return Buffer.concat([head,payload]);
}
class WSClient{
  constructor(socket){this.socket=socket;this.id=`s${nextSocketId++}`;this.data={};this.buffer=Buffer.alloc(0);this.closed=false;clients.add(this);clientsById.set(this.id,this);
    socket.on('data',c=>this.onData(c));socket.on('close',()=>this.onClose());socket.on('end',()=>this.onClose());socket.on('error',()=>this.onClose());}
  send(type,data){if(this.closed||this.socket.destroyed)return;try{this.socket.write(wsFrame(JSON.stringify({type,data})));}catch{}}
  pong(payload){if(!this.closed&&!this.socket.destroyed)try{this.socket.write(wsFrame(payload,0xA));}catch{}}
  onData(chunk){this.buffer=Buffer.concat([this.buffer,chunk]);while(this.buffer.length>=2){const b0=this.buffer[0],b1=this.buffer[1],opcode=b0&15,masked=!!(b1&128);let n=b1&127,off=2;if(n===126){if(this.buffer.length<4)return;n=this.buffer.readUInt16BE(2);off=4;}else if(n===127){if(this.buffer.length<10)return;const big=this.buffer.readBigUInt64BE(2);if(big>1024n*1024n)return this.socket.destroy();n=Number(big);off=10;}let mask;if(masked){if(this.buffer.length<off+4)return;mask=this.buffer.subarray(off,off+4);off+=4;}if(this.buffer.length<off+n)return;const payload=Buffer.from(this.buffer.subarray(off,off+n));this.buffer=this.buffer.subarray(off+n);if(masked)for(let i=0;i<payload.length;i++)payload[i]^=mask[i&3];if(opcode===8){this.socket.end(wsFrame('',8));return;}if(opcode===9){this.pong(payload);continue;}if(opcode!==1)continue;try{handleMessage(this,JSON.parse(payload.toString('utf8')));}catch{}}}
  onClose(){if(this.closed)return;this.closed=true;clients.delete(this);clientsById.delete(this.id);handleDisconnect(this);}
}
function broadcast(type,data){for(const c of clients)c.send(type,data);}
function broadcastHosts(type,data){for(const c of clients)if(c.data.isHost)c.send(type,data);}
function sendTo(id,type,data){clientsById.get(id)?.send(type,data);}
function handleMessage(socket,msg){
  const event=msg?.type,payload=msg?.data;
  if(event==='registerHost'){socket.data.isHost=true;socket.send('state',snapshot());socket.send('lobby',lobbyState());return;}
  if(event==='join'){
    const d=payload||{};let p=null;
    if(d.token&&tokenToPlayer.has(d.token)){
      p=players.get(tokenToPlayer.get(d.token));if(p){p.connected=true;p.socketId=socket.id;p.name=cleanName(d.name||p.name);if(d.handedness)p.handedness=d.handedness==='left'?'left':'right';socket.data.playerId=p.id;}
    }
    if(!p)p=makePlayer(socket,d);
    if(game.status==='lobby'||game.status==='finished')p.active=false;
    socket.send('joined',{id:p.id,token:p.token,name:p.name,color:p.color,handedness:p.handedness});broadcast('lobby',lobbyState());return;
  }
  const p=players.get(socket.data.playerId);
  if(event==='joystick'&&p){const j=payload||{};p.input.jx=clamp(Number(j.x)||0,-1,1);p.input.jy=clamp(Number(j.y)||0,-1,1);}
  else if(event==='throw'&&p)throwKnife(p);
  else if(event==='setHandedness'&&p){p.handedness=payload==='left'?'left':'right';broadcast('lobby',lobbyState());}
  else if(event==='startGame'&&socket.data.isHost)startGame(payload);
  else if(event==='backToLobby'&&socket.data.isHost){game.mode=null;game.status='lobby';game.round=0;game.winnerText='';drum.flying=[];drum.stuck=[];for(const q of players.values()){q.active=false;q.alive=false;q.input.jx=q.input.jy=0;}broadcast('lobby',lobbyState());}
}
function handleDisconnect(socket){const p=players.get(socket.data.playerId);if(p&&p.socketId===socket.id){p.connected=false;p.input.jx=p.input.jy=0;broadcast('lobby',lobbyState());}}
server.on('upgrade',(req,socket)=>{
  const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);if(u.pathname!=='/ws'||String(req.headers.upgrade||'').toLowerCase()!=='websocket')return socket.destroy();
  const key=req.headers['sec-websocket-key'];if(!key)return socket.destroy();
  const accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');new WSClient(socket);
});

let last=process.hrtime.bigint(),broadcastAcc=0;
setInterval(()=>{
  const now=process.hrtime.bigint();let dt=Number(now-last)/1e9;last=now;dt=Math.min(dt,.05);updateGame(dt);broadcastAcc+=dt;
  if(broadcastAcc>=1/30){broadcastAcc=0;const s=snapshot();broadcastHosts('state',s);for(const p of connectedPlayers())sendTo(p.socketId,'selfState',selfState(p));}
},1000/TICK_RATE);

server.listen(PORT,'0.0.0.0',()=>{
  const ips=getLanIps();console.log('\n============== LOCAL PARTY PACK ==============');
  console.log(`HOST SCREEN : http://localhost:${PORT}/host`);console.log(`PHONES      : http://${ips[0].address}:${PORT}/`);
  if(ips.length>1)console.log('ALT IPs     : '+ips.slice(1).map(x=>x.address).join(', '));
  console.log('Games       : PUSH PIT / COLOR KNIVES');console.log('Same Wi-Fi required. Keep this window open.');console.log('==============================================\n');
});
