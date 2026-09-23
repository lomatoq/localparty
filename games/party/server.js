const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

let PORT = Number(process.env.PORT || 0);
const runtime = require('../../lib/party-runtime');
let matchId='', matchStarted=0;
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
function colorForIndex(i){if(i<BASE_COLORS.length)return BASE_COLORS[i];return `hsl(${Math.round((i*137.508)%360)} 82% 63%)`;}
function cleanName(name){return String(name||'PLAYER').replace(/[<>]/g,'').trim().slice(0,20)||'PLAYER';}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function len(x,y){return Math.hypot(x,y);}
function normAngle(a){while(a<0)a+=Math.PI*2;while(a>=Math.PI*2)a-=Math.PI*2;return a;}
function shortestAngle(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;}
function rand(a,b){return a+Math.random()*(b-a);}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}

let nextPlayerNumber=1;
const players=new Map();
const tokenToPlayer=new Map();

const game={mode:null,status:'lobby',round:0,maxRounds:7,timer:0,countdown:0,betweenTimer:0,winnerText:'',arenaRadius:292,roundDuration:0};
const drum={angle:0,speed:0,radius:210,sectors:[],flying:[],stuck:[],knivesPerPlayer:5,wobble:0};
let visualTime=0,visualEventId=0;
const visualEvents=[];
function visualImpact(kind,x,y,color,label=''){
  visualEvents.push({id:++visualEventId,time:visualTime,kind,x,y,color,label});
  if(visualEvents.length>48)visualEvents.shift();
}
const bomb={
  holderId:null,phase:'idle',resetTimer:0,passLock:0,noReturnId:null,noReturnTimer:0,arenaRadius:300,
  obstacles:[{x:520,y:280,r:34},{x:760,y:280,r:34},{x:520,y:440,r:34},{x:760,y:440,r:34}],explosions:[]
};
const western={phase:'idle',cue:'',cueReal:false,cueTimer:0,fakeTimer:0,fakeUntil:0,drawAt:0,resolveTimer:0,shots:[],fakeCount:0};

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
    input:{jx:0,jy:0,at:0},roundWins:0,totalScore:0,roundScore:0,knivesRemaining:0,throwCd:0,
    launcherAngle:0,lastFeedback:'',lastFeedbackAt:0,joinedAt:Date.now(),impactCd:0,
    falseStart:false,falseStarts:0,shotThisRound:false,reactionMs:null,bestReactionMs:null,reactionSum:0,reactionCount:0
  };
  players.set(id,p);tokenToPlayer.set(token,id);socket.data.playerId=id;return p;
}
function resetMatchStats(){
  for(const p of players.values()){
    p.roundWins=0;p.totalScore=0;p.roundScore=0;p.knivesRemaining=0;p.lastFeedback='';p.input.jx=p.input.jy=0;
    p.falseStart=false;p.falseStarts=0;p.shotThisRound=false;p.reactionMs=null;p.bestReactionMs=null;p.reactionSum=0;p.reactionCount=0;
  }
}
function lobbyState(){return connectedPlayers().map(p=>({id:p.id,name:p.name,color:p.color,handedness:p.handedness}));}
function playerView(p){
  return {id:p.id,name:p.name,color:p.color,handedness:p.handedness,x:p.x,y:p.y,vx:p.vx,vy:p.vy,radius:p.radius,alive:p.alive,active:p.active,
    roundWins:p.roundWins,totalScore:p.totalScore,roundScore:p.roundScore,knivesRemaining:p.knivesRemaining,launcherAngle:p.launcherAngle,lastFeedback:p.lastFeedback,lastFeedbackAt:p.lastFeedbackAt,
    falseStart:p.falseStart,falseStarts:p.falseStarts,shotThisRound:p.shotThisRound,shotVisualTime:p.shotVisualTime,reactionMs:p.reactionMs,bestReactionMs:p.bestReactionMs,reactionCount:p.reactionCount};
}
function bombView(){return {holderId:bomb.holderId,phase:bomb.phase,arenaRadius:bomb.arenaRadius,obstacles:bomb.obstacles,explosions:bomb.explosions.map(e=>({...e}))};}
function westernView(){return {phase:western.phase,cue:western.cue,cueReal:western.cueReal,fakeCount:western.fakeCount,shots:western.shots.map(s=>({...s}))};}
function snapshot(){
  return {world:WORLD,center:CENTER,visualTime,visualEvents:visualEvents.filter(e=>visualTime-e.time<1400),game:{...game},players:connectedPlayers().map(playerView),
    drum:{angle:drum.angle,speed:drum.speed,radius:drum.radius,sectors:drum.sectors,stuck:drum.stuck,knivesPerPlayer:drum.knivesPerPlayer},flying:drum.flying.map(k=>({...k})),
    bomb:bombView(),western:westernView()};
}
function selfState(p){
  return {id:p.id,name:p.name,color:p.color,handedness:p.handedness,mode:game.mode,status:game.status,round:game.round,maxRounds:game.maxRounds,
    timer:game.timer,countdown:game.countdown,roundWins:p.roundWins,totalScore:p.totalScore,roundScore:p.roundScore,knivesRemaining:p.knivesRemaining,
    active:p.active,alive:p.alive,lastFeedback:p.lastFeedback,lastFeedbackAt:p.lastFeedbackAt,winnerText:game.winnerText,
    hasBomb:game.mode==='bomb'&&bomb.holderId===p.id,bombPhase:bomb.phase,
    westernPhase:western.phase,falseStart:p.falseStart,reactionMs:p.reactionMs,bestReactionMs:p.bestReactionMs,falseStarts:p.falseStarts,shotThisRound:p.shotThisRound};
}

function startGame(payload){
  const mode=typeof payload==='string'?payload:payload?.mode;
  if(!['push','shrink','knives','bomb','western'].includes(mode))return;
  const rounds=clamp(Number(payload?.maxRounds||game.maxRounds)||7,5,10);
  if(connectedPlayers().length<2){game.winnerText='Подключите хотя бы двух игроков';broadcastHosts('state',snapshot());return;}
  matchId=crypto.randomUUID();matchStarted=Date.now();game.mode=mode;game.shrinkSpeed=payload?.shrinkSpeed==='fast'?'fast':'normal';game.maxRounds=rounds;game.round=0;game.winnerText='';resetMatchStats();nextRound();
}
function nextRound(){
  game.round++;
  if(game.round>game.maxRounds)return finishMatch();
  if((game.mode==='push'||game.mode==='shrink'))setupPushRound();
  else if(game.mode==='knives')setupKnivesRound();
  else if(game.mode==='bomb')setupBombRound();
  else setupWesternRound();
  game.status='countdown';game.countdown=TEST_FAST?0.08:3.0;game.winnerText='';
}
function setupPushRound(){
  const ps=connectedPlayers();game.arenaRadius=292;game.roundDuration=TEST_FAST?1.2:game.mode==='shrink'?(game.shrinkSpeed==='fast'?25:58):42;
  const spawnR=Math.min(215,100+ps.length*10);
  ps.forEach((p,i)=>{const a=-Math.PI/2+i*Math.PI*2/Math.max(1,ps.length);p.active=true;p.alive=true;p.x=CENTER.x+Math.cos(a)*spawnR;p.y=CENTER.y+Math.sin(a)*spawnR;p.vx=p.vy=0;p.input.jx=p.input.jy=0;p.roundScore=0;p.impactCd=0;});
  drum.flying=[];drum.stuck=[];bomb.explosions=[];
}
function buildSectors(ps,round){
  const count=clamp(10+ps.length*3+(round-1)*2,10,46),weights=Array.from({length:count},()=>rand(.65,1.55)),sum=weights.reduce((a,b)=>a+b,0);
  let a=0;const sectors=[];
  for(let i=0;i<count;i++){
    const size=weights[i]/sum*Math.PI*2;let ownerId=null,type='neutral',color='#3a414c';const hazardChance=round>=3?.10:.04;
    if(Math.random()<hazardChance){type='danger';color='#15191f';}
    else if(ps.length&&Math.random()<.82){const owner=ps[(i+round)%ps.length];ownerId=owner.id;type='player';color=owner.color;}
    sectors.push({start:a,end:a+size,ownerId,type,color});a+=size;
  }
  for(let j=0;j<ps.length;j++)for(let n=0;n<2;n++){const idx=(j*2+n*ps.length+round)%sectors.length;sectors[idx].ownerId=ps[j].id;sectors[idx].type='player';sectors[idx].color=ps[j].color;}
  return sectors;
}
function setupKnivesRound(){
  const ps=connectedPlayers();game.roundDuration=TEST_FAST?1.4:Math.max(24,34-game.round*.8);drum.angle=rand(0,Math.PI*2);
  const base=.50+(game.round-1)*.10;drum.speed=(game.round%2===0?-1:1)*clamp(base,.5,1.45);drum.wobble=game.round>=4?(.10+.035*game.round):0;
  drum.sectors=buildSectors(ps,game.round);drum.flying=[];drum.stuck=[];drum.knivesPerPlayer=clamp(5+Math.floor((game.round-1)/3),5,7);
  ps.forEach((p,i)=>{p.active=true;p.alive=true;p.roundScore=0;p.knivesRemaining=drum.knivesPerPlayer;p.throwCd=0;p.launcherAngle=-Math.PI/2+i*Math.PI*2/Math.max(1,ps.length);p.lastFeedback='';});
}
function setupBombRound(){
  const ps=connectedPlayers();game.roundDuration=TEST_FAST?2.4:75;bomb.arenaRadius=300;bomb.phase='armed';bomb.holderId=null;bomb.resetTimer=0;bomb.passLock=0;bomb.noReturnId=null;bomb.noReturnTimer=0;bomb.explosions=[];
  const spawnR=Math.min(225,120+ps.length*8);
  ps.forEach((p,i)=>{const a=-Math.PI/2+i*Math.PI*2/Math.max(1,ps.length);p.active=true;p.alive=true;p.x=CENTER.x+Math.cos(a)*spawnR;p.y=CENTER.y+Math.sin(a)*spawnR;p.vx=p.vy=0;p.input.jx=p.input.jy=0;p.roundScore=0;p.lastFeedback='';p.impactCd=0;});
}
function setupWesternRound(){
  const ps=connectedPlayers();game.roundDuration=TEST_FAST?1.2:11;western.phase='holster';western.cue='HOLSTER';western.cueReal=false;western.cueTimer=0;western.fakeTimer=0;western.fakeUntil=0;western.drawAt=0;western.resolveTimer=0;western.shots=[];western.fakeCount=0;
  ps.forEach(p=>{p.active=true;p.alive=true;p.input.jx=p.input.jy=0;p.falseStart=false;p.shotThisRound=false;p.reactionMs=null;p.roundScore=0;p.lastFeedback='WATCH THE SCREEN';});
}
function beginRoundPlaying(){
  game.status='playing';game.timer=game.roundDuration;
  if(game.mode==='bomb')armBomb(true);
  if(game.mode==='western'){
    western.phase='waiting';western.cue='';western.cueReal=false;western.cueTimer=TEST_FAST?rand(.16,.25):rand(2.7,6.2);western.fakeTimer=TEST_FAST?.06:rand(.65,1.35);western.fakeUntil=0;
  }
}
function averageReaction(p){return p.reactionCount?p.reactionSum/p.reactionCount:Infinity;}
function finishMatch(){
  game.status='finished';game.timer=0;const ps=[...players.values()].filter(p=>p.active);if(!ps.length){game.winnerText='Матч окончен';return;}
  let sorted;
  if(game.mode==='knives')sorted=[...ps].sort((a,b)=>b.totalScore-a.totalScore||b.roundWins-a.roundWins);
  else if(game.mode==='western')sorted=[...ps].sort((a,b)=>b.roundWins-a.roundWins||averageReaction(a)-averageReaction(b)||a.falseStarts-b.falseStarts);
  else sorted=[...ps].sort((a,b)=>b.roundWins-a.roundWins||b.totalScore-a.totalScore);
  const top=sorted[0];
  let tied;
  if(game.mode==='knives')tied=sorted.filter(p=>p.totalScore===top.totalScore);
  else if(game.mode==='western')tied=sorted.filter(p=>p.roundWins===top.roundWins&&(averageReaction(p)===averageReaction(top)||Math.abs(averageReaction(p)-averageReaction(top))<1));
  else tied=sorted.filter(p=>p.roundWins===top.roundWins);
  game.winnerText=tied.length>1?`НИЧЬЯ: ${tied.map(p=>p.name).join(' + ')}`:`🏆 ${top.name} ПОБЕДИЛ!`;
  runtime.report({eventId:matchId,gameId:game.mode,duration:(Date.now()-matchStarted)/1000,players:sorted.map(p=>({id:p.partyId||p.id,name:p.name,score:game.mode==='knives'?p.totalScore:p.roundWins,won:tied.includes(p),metrics:{roundWins:p.roundWins,falseStarts:p.falseStarts,...(p.bestReactionMs==null?{}:{bestReactionMs:p.bestReactionMs})}}))});
  for(const p of players.values()){p.input.jx=p.input.jy=0;}
}
function endRound(text,winners=[]){
  if(game.status!=='playing')return;game.status='between';game.betweenTimer=TEST_FAST?0.08:2.8;game.winnerText=text;
  for(const p of winners){p.roundWins++;if((game.mode==='push'||game.mode==='shrink'))p.totalScore+=3;}
}

function updatePush(dt){
  const ps=activePlayers().filter(p=>p.alive),elapsed=game.roundDuration-game.timer,shrinkT=clamp((elapsed-(TEST_FAST?.2:game.shrinkSpeed==='fast'?0:8))/(TEST_FAST?.7:game.shrinkSpeed==='fast'?20:45),0,1);game.arenaRadius=game.mode==='shrink'?292-shrinkT*140:292;
  for(const p of ps){
    if((p.input.jx||p.input.jy)&&Date.now()-(p.input.at||0)>500)p.input.jx=p.input.jy=0;
    p.impactCd=Math.max(0,p.impactCd-dt);let jx=clamp(Number(p.input.jx)||0,-1,1),jy=clamp(Number(p.input.jy)||0,-1,1);const jm=len(jx,jy);if(jm>1){jx/=jm;jy/=jm;}
    const accel=jm>.05?1050:0;p.vx+=jx*accel*dt;p.vy+=jy*accel*dt;const damping=Math.pow(jm>.05?.975:.987,dt*60);p.vx*=damping;p.vy*=damping;const sp=len(p.vx,p.vy),maxSp=330;if(sp>maxSp){p.vx=p.vx/sp*maxSp;p.vy=p.vy/sp*maxSp;}p.x+=p.vx*dt;p.y+=p.vy*dt;
  }
  for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){
    const a=ps[i],b=ps[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);const minD=a.radius+b.radius;if(d>=minD)continue;if(d<.001){dx=1;dy=0;d=1;}const nx=dx/d,ny=dy/d,overlap=minD-d;a.x-=nx*overlap*.5;a.y-=ny*overlap*.5;b.x+=nx*overlap*.5;b.y+=ny*overlap*.5;
    const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(rel>0){const baseImpulse=rel*.78;a.vx-=nx*baseImpulse*.5;a.vy-=ny*baseImpulse*.5;b.vx+=nx*baseImpulse*.5;b.vy+=ny*baseImpulse*.5;if(rel>90&&a.impactCd<=0&&b.impactCd<=0){const kick=55+Math.min(150,rel*.42),am=len(a.input.jx,a.input.jy),bm=len(b.input.jx,b.input.jy);if(am>bm+.12){b.vx+=nx*kick;b.vy+=ny*kick;a.vx-=nx*kick*.18;a.vy-=ny*kick*.18;}else if(bm>am+.12){a.vx-=nx*kick;a.vy-=ny*kick;b.vx+=nx*kick*.18;b.vy+=ny*kick*.18;}a.impactCd=b.impactCd=.12;}}
  }
  for(const p of ps){const d=Math.hypot(p.x-CENTER.x,p.y-CENTER.y);if(d>game.arenaRadius+p.radius*.42){p.alive=false;p.input.jx=p.input.jy=0;p.lastFeedback='OUT!';p.lastFeedbackAt=Date.now();visualImpact('rim-out',CENTER.x+(p.x-CENTER.x)/d*game.arenaRadius,CENTER.y+(p.y-CENTER.y)/d*game.arenaRadius,p.color);}}
  const alive=activePlayers().filter(p=>p.alive);
  if(alive.length<=1&&activePlayers().length>1){if(alive.length===1)endRound(`👑 ${alive[0].name} остался на арене!`,alive);else endRound('💥 Все вылетели одновременно!',[]);}
  else if(game.timer<=0){const contenders=alive.length?alive:activePlayers();contenders.sort((a,b)=>Math.hypot(a.x-CENTER.x,a.y-CENTER.y)-Math.hypot(b.x-CENTER.x,b.y-CENTER.y));if(contenders[0])endRound(`⏱ ${contenders[0].name} ближе всех к центру!`,[contenders[0]]);}
  else if(activePlayers().length===1&&game.timer<=Math.max(0,game.roundDuration-(TEST_FAST?.25:3)))endRound(`👑 ${activePlayers()[0].name} — победитель раунда`,[activePlayers()[0]]);
}

function throwKnife(p){
  if(game.mode!=='knives'||game.status!=='playing'||!p.active||p.knivesRemaining<=0||p.throwCd>0)return;
  p.knivesRemaining--;p.throwCd=.28;const r=340,a=p.launcherAngle,x=CENTER.x+Math.cos(a)*r,y=CENTER.y+Math.sin(a)*r,speed=900;
  drum.flying.push({id:`k${Date.now()}${Math.random()}`,ownerId:p.id,color:p.color,x,y,vx:-Math.cos(a)*speed,vy:-Math.sin(a)*speed,angle:a+Math.PI});p.lastFeedback='THROW';p.lastFeedbackAt=Date.now();
}
function sectorAt(localAngle){const a=normAngle(localAngle);return drum.sectors.find(s=>a>=s.start&&a<s.end)||drum.sectors[drum.sectors.length-1];}
function scoreHit(p,localAngle){
  for(const s of drum.stuck)if(Math.abs(shortestAngle(localAngle-s.localAngle))<.030){p.roundScore-=1;p.totalScore-=1;p.lastFeedback='CLANG −1';p.lastFeedbackAt=Date.now();return false;}
  const sec=sectorAt(localAngle);let delta=0,label='MISS 0';if(sec?.type==='danger'){delta=-2;label='DANGER −2';}else if(sec?.ownerId===p.id){delta=2;label='YOUR COLOR +2';}else if(sec?.type==='player'){delta=-1;label='WRONG COLOR −1';}
  p.roundScore+=delta;p.totalScore+=delta;p.lastFeedback=label;p.lastFeedbackAt=Date.now();return true;
}
function updateKnives(dt){
  const t=Date.now()/1000,wobble=drum.wobble?Math.sin(t*1.7)*drum.wobble:0;drum.angle=normAngle(drum.angle+(drum.speed+wobble)*dt);for(const p of activePlayers())p.throwCd=Math.max(0,p.throwCd-dt);
  for(let i=drum.flying.length-1;i>=0;i--){const k=drum.flying[i];k.x+=k.vx*dt;k.y+=k.vy*dt;const d=Math.hypot(k.x-CENTER.x,k.y-CENTER.y);if(d<=drum.radius+5){const impactWorld=Math.atan2(k.y-CENTER.y,k.x-CENTER.x),local=normAngle(impactWorld-drum.angle),p=players.get(k.ownerId),stick=p?scoreHit(p,local):false;if(stick)drum.stuck.push({ownerId:k.ownerId,color:k.color,localAngle:local});visualImpact(stick?'knife-hit':'knife-clang',CENTER.x+Math.cos(impactWorld)*drum.radius,CENTER.y+Math.sin(impactWorld)*drum.radius,k.color,p?.lastFeedback||'');drum.flying.splice(i,1);}else if(d<10)drum.flying.splice(i,1);}
  const aps=activePlayers(),allSpent=aps.length&&aps.every(p=>p.knivesRemaining<=0)&&drum.flying.length===0;if(allSpent||game.timer<=0){const sorted=[...aps].sort((a,b)=>b.roundScore-a.roundScore);if(!sorted.length)return endRound('Раунд окончен',[]);const best=sorted[0].roundScore,winners=sorted.filter(p=>p.roundScore===best);winners.forEach(p=>p.roundWins++);game.status='between';game.betweenTimer=TEST_FAST?0.08:3;game.winnerText=winners.length>1?`🎯 Ничья раунда: ${winners.map(p=>p.name).join(' + ')} · ${best}`:`🎯 ${winners[0].name} берёт раунд · ${best}`;}
}

function bombFuseDuration(){return TEST_FAST?rand(.35,.55):rand(Math.max(4.4,6.8-game.round*.18),Math.max(7.2,10.4-game.round*.22));}
function armBomb(first=false){
  const alive=activePlayers().filter(p=>p.alive);if(!alive.length)return;
  let choices=alive;if(!first&&bomb.noReturnId&&alive.length>1)choices=alive.filter(p=>p.id!==bomb.noReturnId);if(!choices.length)choices=alive;
  const holder=pick(choices);bomb.holderId=holder.id;bomb.phase='armed';bomb.fuse=bombFuseDuration();bomb.passLock=TEST_FAST?.03:.32;bomb.noReturnTimer=0;
  holder.lastFeedback='💣 У ТЕБЯ БОМБА!';holder.lastFeedbackAt=Date.now();
}
function transferBomb(from,to){
  if(!from||!to||from.id===to.id)return;bomb.holderId=to.id;bomb.passLock=TEST_FAST?.02:.24;bomb.noReturnId=from.id;bomb.noReturnTimer=TEST_FAST?.05:.7;
  from.lastFeedback=`Передал → ${to.name}`;from.lastFeedbackAt=Date.now();to.lastFeedback='💣 БОМБА! ПЕРЕДАЙ!';to.lastFeedbackAt=Date.now();
  visualImpact('bomb-pass',to.x,to.y,to.color,'ПЕРЕДАЧА');
}
function collideWithBombObstacles(p){
  for(const o of bomb.obstacles){let dx=p.x-o.x,dy=p.y-o.y,d=Math.hypot(dx,dy),minD=p.radius+o.r;if(d>=minD)continue;if(d<.001){dx=1;dy=0;d=1;}const nx=dx/d,ny=dy/d,overlap=minD-d;p.x+=nx*overlap;p.y+=ny*overlap;const inward=p.vx*nx+p.vy*ny;if(inward<0){p.vx-=nx*inward*1.65;p.vy-=ny*inward*1.65;}}
}
function explodeBomb(){
  const holder=players.get(bomb.holderId);if(!holder||!holder.connected||!holder.active||!holder.alive){bomb.holderId=null;bomb.phase='cooldown';bomb.resetTimer=TEST_FAST?.04:.6;return;}
  holder.alive=false;holder.input.jx=holder.input.jy=0;holder.lastFeedback='💥 BOOM — OUT!';holder.lastFeedbackAt=Date.now();bomb.explosions.push({x:holder.x,y:holder.y,t:0,ttl:TEST_FAST?.2:.8});
  visualImpact('bomb-explode',holder.x,holder.y,'#ffad54','');
  const survivors=activePlayers().filter(p=>p.alive);
  for(const p of survivors){const dx=p.x-holder.x,dy=p.y-holder.y,d=Math.hypot(dx,dy);if(d>210||d<1)continue;const force=(1-d/210)*250;p.vx+=dx/d*force;p.vy+=dy/d*force;}
  bomb.noReturnId=holder.id;bomb.holderId=null;bomb.phase='cooldown';bomb.resetTimer=TEST_FAST?.08:1.15;
  if(survivors.length<=1){if(survivors.length===1)endRound(`👑 ${survivors[0].name} пережил бомбу!`,survivors);else endRound('💥 Никто не пережил раунд!',[]);}
}
function updateBomb(dt){
  const ps=activePlayers().filter(p=>p.alive);bomb.passLock=Math.max(0,bomb.passLock-dt);bomb.noReturnTimer=Math.max(0,bomb.noReturnTimer-dt);
  for(let i=bomb.explosions.length-1;i>=0;i--){bomb.explosions[i].t+=dt;if(bomb.explosions[i].t>=bomb.explosions[i].ttl)bomb.explosions.splice(i,1);}
  for(const p of ps){if((p.input.jx||p.input.jy)&&Date.now()-(p.input.at||0)>500)p.input.jx=p.input.jy=0;let jx=clamp(Number(p.input.jx)||0,-1,1),jy=clamp(Number(p.input.jy)||0,-1,1),jm=len(jx,jy);if(jm>1){jx/=jm;jy/=jm;}const accel=jm>.05?900:0;p.vx+=jx*accel*dt;p.vy+=jy*accel*dt;const damping=Math.pow(jm>.05?.91:.70,dt*60);p.vx*=damping;p.vy*=damping;const isHolder=p.id===bomb.holderId,maxSp=isHolder?330:305,sp=len(p.vx,p.vy);if(sp>maxSp){p.vx=p.vx/sp*maxSp;p.vy=p.vy/sp*maxSp;}p.x+=p.vx*dt;p.y+=p.vy*dt;collideWithBombObstacles(p);
    let dx=p.x-CENTER.x,dy=p.y-CENTER.y,d=Math.hypot(dx,dy),max=bomb.arenaRadius-p.radius;if(d>max){const nx=dx/d,ny=dy/d;p.x=CENTER.x+nx*max;p.y=CENTER.y+ny*max;const outward=p.vx*nx+p.vy*ny;if(outward>0){p.vx-=nx*outward*1.45;p.vy-=ny*outward*1.45;}}
  }
  for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){
    const a=ps[i],b=ps[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),minD=a.radius+b.radius;if(d>=minD)continue;if(d<.001){dx=1;dy=0;d=1;}const nx=dx/d,ny=dy/d,overlap=minD-d;a.x-=nx*overlap*.5;a.y-=ny*overlap*.5;b.x+=nx*overlap*.5;b.y+=ny*overlap*.5;const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(rel>0){const imp=rel*.46;a.vx-=nx*imp*.5;a.vy-=ny*imp*.5;b.vx+=nx*imp*.5;b.vy+=ny*imp*.5;}
    if(bomb.phase==='armed'&&bomb.passLock<=0){const holder=players.get(bomb.holderId);let target=null;if(holder?.id===a.id)target=b;else if(holder?.id===b.id)target=a;if(target&&target.alive&&!(bomb.noReturnTimer>0&&target.id===bomb.noReturnId))transferBomb(holder,target);}
  }
  if(bomb.phase==='armed'){
    const holder=players.get(bomb.holderId);if(!holder||!holder.connected||!holder.alive){bomb.holderId=null;bomb.phase='cooldown';bomb.resetTimer=TEST_FAST?.04:.45;}
    else {bomb.fuse-=dt;if(bomb.fuse<=0)explodeBomb();}
  } else if(bomb.phase==='cooldown'&&game.status==='playing'){
    bomb.resetTimer-=dt;if(bomb.resetTimer<=0){const alive=activePlayers().filter(p=>p.alive);if(alive.length>1)armBomb(false);else if(alive.length===1)endRound(`👑 ${alive[0].name} пережил бомбу!`,alive);}
  }
  if(game.timer<=0&&game.status==='playing'){
    const alive=activePlayers().filter(p=>p.alive);if(alive.length){const winners=alive.length===1?alive:[...alive].sort((a,b)=>Math.hypot(a.x-CENTER.x,a.y-CENTER.y)-Math.hypot(b.x-CENTER.x,b.y-CENTER.y)).slice(0,1);endRound(`⏱ ${winners[0].name} пережил дольше всех!`,winners);}else endRound('Время вышло',[]);
  }
}

const FAKE_CUES=['BELL!','CROW!','WIND!','DOOR!','FLASH!','COUGH!','...'];
function emitWesternCue(text,real){western.cue=text;western.cueReal=real;broadcastHosts('westernCue',{text,real,at:Date.now()});}
function westernShoot(p){
  if(game.mode!=='western'||game.status!=='playing'||!p.active||p.shotThisRound)return;
  if(western.phase==='waiting'){
    p.shotThisRound=true;p.shotVisualTime=visualTime;p.falseStart=true;p.falseStarts++;p.alive=false;p.lastFeedback='TOO EARLY!';p.lastFeedbackAt=Date.now();broadcastHosts('westernShot',{playerId:p.id,falseStart:true});return;
  }
  if(western.phase!=='draw'||!p.alive)return;
  if(!western.shots.length)western.resolveTimer=TEST_FAST?.03:.18;
  p.shotThisRound=true;p.shotVisualTime=visualTime;p.reactionMs=Math.max(0,Date.now()-western.drawAt);p.reactionSum+=p.reactionMs;p.reactionCount++;p.bestReactionMs=p.bestReactionMs==null?p.reactionMs:Math.min(p.bestReactionMs,p.reactionMs);p.lastFeedback=`${p.reactionMs} ms`;p.lastFeedbackAt=Date.now();western.shots.push({playerId:p.id,reactionMs:p.reactionMs});broadcastHosts('westernShot',{playerId:p.id,reactionMs:p.reactionMs});
}
function resolveWestern(){
  if(game.status!=='playing')return;const valid=western.shots.map(s=>({s,p:players.get(s.playerId)})).filter(x=>x.p&&x.p.connected&&x.p.active).sort((a,b)=>a.s.reactionMs-b.s.reactionMs);
  if(!valid.length){for(const p of activePlayers())p.alive=false;return endRound('🤠 Никто не выстрелил после DRAW!',[]);}
  const best=valid[0].s.reactionMs,winners=valid.filter(x=>x.s.reactionMs===best).map(x=>x.p);for(const p of activePlayers())if(!winners.includes(p)){p.alive=false;p.lastFeedback='💀 Не успел — следующий раунд';p.lastFeedbackAt=Date.now();}endRound(winners.length>1?`🤠 Ничья · ${best} ms`:`🤠 ${winners[0].name} · ${best} ms`,winners);
}
function updateWestern(dt){
  const roster=activePlayers();if(roster.length&&roster.every(p=>p.falseStart))return endRound('Все выстрелили раньше сигнала',[]);
  if(western.phase==='waiting'){
    western.cueTimer-=dt;western.fakeTimer-=dt;if(western.fakeUntil>0){western.fakeUntil-=dt;if(western.fakeUntil<=0){western.cue='';western.cueReal=false;}}
    if(western.fakeTimer<=0&&western.cueTimer>(TEST_FAST?.05:.72)){western.fakeCount++;emitWesternCue(pick(FAKE_CUES),false);western.fakeUntil=TEST_FAST?.03:.43;western.fakeTimer=TEST_FAST?.05:rand(.72,1.38);}
    if(western.cueTimer<=0){western.phase='draw';western.drawAt=Date.now();western.resolveTimer=TEST_FAST?.18:1.35;emitWesternCue('DRAW!',true);}
  } else if(western.phase==='draw'){
    if(!western.shots.length)return;western.resolveTimer-=dt;const eligible=activePlayers().filter(p=>p.alive&&!p.falseStart);if(eligible.length&&eligible.every(p=>p.shotThisRound))western.resolveTimer=Math.min(western.resolveTimer,TEST_FAST?.03:.18);if(western.resolveTimer<=0)resolveWestern();
  }

}

function updateGame(dt){
  if(game.status==='countdown'){game.countdown-=dt;if(game.countdown<=0){game.countdown=0;beginRoundPlaying();}return;}
  if(game.status==='playing'){
    game.timer=Math.max(0,game.timer-dt);
    if((game.mode==='push'||game.mode==='shrink'))updatePush(dt);else if(game.mode==='knives')updateKnives(dt);else if(game.mode==='bomb')updateBomb(dt);else if(game.mode==='western')updateWestern(dt);return;
  }
  if(game.status==='between'){game.betweenTimer-=dt;if(game.betweenTimer<=0){if(game.round>=game.maxRounds)finishMatch();else nextRound();}}
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
  constructor(socket,req){this.trustedHost=runtime.managed?req?.headers?.['x-party-local']==='1':['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req?.socket?.remoteAddress);this.socket=socket;this.id=`s${nextSocketId++}`;this.data={};this.buffer=Buffer.alloc(0);this.closed=false;clients.add(this);clientsById.set(this.id,this);socket.on('data',c=>this.onData(c));socket.on('close',()=>this.onClose());socket.on('end',()=>this.onClose());socket.on('error',()=>this.onClose());}
  send(type,data){if(this.closed||this.socket.destroyed||(type==='state'&&this.socket.writableLength>256*1024))return;try{this.socket.write(wsFrame(JSON.stringify({type,data})));}catch{}}
  pong(payload){if(!this.closed&&!this.socket.destroyed)try{this.socket.write(wsFrame(payload,0xA));}catch{}}
  onData(chunk){this.buffer=Buffer.concat([this.buffer,chunk]);while(this.buffer.length>=2){const b0=this.buffer[0],b1=this.buffer[1],opcode=b0&15,masked=!!(b1&128);let n=b1&127,off=2;if(n===126){if(this.buffer.length<4)return;n=this.buffer.readUInt16BE(2);off=4;}else if(n===127){if(this.buffer.length<10)return;const big=this.buffer.readBigUInt64BE(2);if(big>1024n*1024n)return this.socket.destroy();n=Number(big);off=10;}let mask;if(masked){if(this.buffer.length<off+4)return;mask=this.buffer.subarray(off,off+4);off+=4;}if(this.buffer.length<off+n)return;const payload=Buffer.from(this.buffer.subarray(off,off+n));this.buffer=this.buffer.subarray(off+n);if(masked)for(let i=0;i<payload.length;i++)payload[i]^=mask[i&3];if(opcode===8){this.socket.end(wsFrame('',8));return;}if(opcode===9){this.pong(payload);continue;}if(opcode!==1)continue;try{handleMessage(this,JSON.parse(payload.toString('utf8')));}catch{}}}
  onClose(){if(this.closed)return;this.closed=true;clients.delete(this);clientsById.delete(this.id);handleDisconnect(this);}
}
function broadcast(type,data){for(const c of clients)c.send(type,data);}
function broadcastHosts(type,data){for(const c of clients)if(c.data.isHost)c.send(type,data);}
function sendTo(id,type,data){clientsById.get(id)?.send(type,data);}
function handleMessage(socket,msg){
  if(socket.partyRemoved||!runtime.allowMessage(msg))return;
  const event=msg?.type,payload=msg?.data;
  if(event==='registerHost'){if(!socket.trustedHost)return;socket.data.isHost=true;socket.send('state',snapshot());socket.send('lobby',lobbyState());return;}
  if(event==='join'){
    const d={...(payload||{})};const identity=runtime.identify(d,socket);if(runtime.managed&&!identity)return socket.send('error','Войдите через общее лобби');if(identity){d.token='party:'+identity.id;d.name=identity.name;d.handedness=identity.hand;}let p=null;
    if(d.token&&tokenToPlayer.has(d.token)){p=players.get(tokenToPlayer.get(d.token));if(p){p.connected=true;p.socketId=socket.id;p.name=cleanName(d.name||p.name);if(d.handedness)p.handedness=d.handedness==='left'?'left':'right';socket.data.playerId=p.id;}}
    if(!p)p=makePlayer(socket,d);if(identity)p.partyId=identity.id;
    if(!p.active&&(game.status==='playing'||game.status==='countdown')){p.active=true;p.alive=true;p.x=CENTER.x+rand(-100,100);p.y=CENTER.y+rand(-100,100);p.knivesRemaining=drum.knivesPerPlayer;p.launcherAngle=rand(0,Math.PI*2);if(game.mode==='knives'){const sectors=drum.sectors.filter(s=>s.type==='neutral');const candidates=sectors.length?sectors:drum.sectors.slice(-2);for(const sector of candidates.slice(0,2)){sector.ownerId=p.id;sector.type='player';sector.color=p.color;}}}
    if(game.status==='lobby'||game.status==='finished')p.active=false;
    socket.send('joined',{id:p.id,token:p.token,name:p.name,color:p.color,handedness:p.handedness});broadcast('lobby',lobbyState());return;
  }
  const p=players.get(socket.data.playerId);if(p&&p.socketId!==socket.id)return;
  if(event==='joystick'&&p){const j=payload||{};p.input.jx=clamp(Number(j.x)||0,-1,1);p.input.jy=clamp(Number(j.y)||0,-1,1);p.input.at=Date.now();}
  else if(event==='throw'&&p)throwKnife(p);
  else if(event==='westernShoot'&&p&&Number(payload?.round)===game.round)westernShoot(p);
  else if(event==='setHandedness'&&p){p.handedness=payload==='left'?'left':'right';broadcast('lobby',lobbyState());}
  else if(event==='startGame'&&socket.data.isHost)startGame(payload);
  else if(event==='backToLobby'&&socket.data.isHost){game.mode=null;game.status='lobby';game.round=0;game.winnerText='';drum.flying=[];drum.stuck=[];bomb.holderId=null;bomb.phase='idle';bomb.explosions=[];western.phase='idle';western.cue='';for(const q of players.values()){q.active=false;q.alive=false;q.input.jx=q.input.jy=0;}broadcast('lobby',lobbyState());}
}
function handleDisconnect(socket){
  const p=players.get(socket.data.playerId);if(p&&p.socketId===socket.id){p.connected=false;if(p.partyId)runtime.presence(p.partyId,false);p.input.jx=p.input.jy=0;if(game.mode==='bomb'&&bomb.holderId===p.id){bomb.holderId=null;bomb.phase='cooldown';bomb.resetTimer=TEST_FAST?.04:.35;}broadcast('lobby',lobbyState());}
}
server.on('upgrade',(req,socket)=>{
  const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);if(u.pathname!=='/ws'||String(req.headers.upgrade||'').toLowerCase()!=='websocket')return socket.destroy();const key=req.headers['sec-websocket-key'];if(!key)return socket.destroy();
  const accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');new WSClient(socket,req);
});

let last=BigInt(Math.floor(runtime.now()*1000000)),broadcastAcc=0;
runtime.setInterval(()=>{
  const now=BigInt(Math.floor(runtime.now()*1000000));let dt=Number(now-last)/1e9;last=now;dt=Math.min(dt,.05);visualTime+=dt*1000;updateGame(dt);broadcastAcc+=dt;
  if(broadcastAcc>=1/30){broadcastAcc=0;runtime.ui?.({phase:game.status==='lobby'?'waiting':game.status==='finished'?'results':game.status==='between'?'reveal':game.status,endsAt:game.status==='playing'&&game.mode!=='western'?Date.now()+game.timer*1000:game.status==='countdown'?Date.now()+game.countdown*1000:null,label:'До конца раунда',progress:`Раунд ${game.round} / ${game.maxRounds}`});const s=snapshot();broadcastHosts('state',s);for(const p of connectedPlayers())sendTo(p.socketId,'selfState',selfState(p));}
},1000/TICK_RATE);

server.listen(PORT,(process.env.PARTY_MANAGED === '1' ? '127.0.0.1' : '0.0.0.0'),()=>{
  PORT=server.address().port;process.send?.({type:'ready',port:PORT});const ips=getLanIps();console.log('\n============== LOCAL PARTY PACK ==============');console.log(`HOST SCREEN : http://localhost:${PORT}/host`);console.log(`PHONES      : http://${ips[0].address}:${PORT}/`);if(ips.length>1)console.log('ALT IPs     : '+ips.slice(1).map(x=>x.address).join(', '));console.log('Games       : PUSH PIT / COLOR KNIVES / BOMB TAG / ONE SHOT WESTERN');console.log('Same Wi-Fi required. Keep this window open.');console.log('==============================================\n');
});

runtime.onPause(()=>{for(const p of players.values()){p.input.jx=0;p.input.jy=0;}});

// Commands from the iPhone server console.
runtime.host({start:s=>{startGame(s);return game.status!=='lobby';}});
