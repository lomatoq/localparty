'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {WebSocketServer}=require('ws');
const runtime=require('../../lib/party-runtime');
const {Match,MODES,TITLES}=require('./match');
const bowling=require('./bowling');
const mode=process.env.PARTY_GAME_ID||'bowling';
if(!MODES.includes(mode))throw Error('Unsupported PARTY_GAME_ID');
const hostKey=crypto.randomBytes(24).toString('hex');
const match=new Match(mode,{bowlingFactory:()=>new bowling.BowlingWorld()});
const sockets=new Map(),sessions=new Map();
const local=req=>runtime.managed?req.headers['x-party-local']==='1':['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
const server=http.createServer((req,res)=>{
  let url;try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400);return res.end();}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  if(url.pathname==='/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true,mode}));}
  const host=url.pathname==='/host'||url.pathname==='/host.html';
  if(host&&!local(req)){res.writeHead(403);return res.end('Host is local only');}
  const allowed={'/':'index.html','/index.html':'index.html','/host':'host.html','/host.html':'host.html',
    '/controls.js':'controls.js','/host.js':'host.js','/net.js':'net.js','/style.css':'style.css'};
  let file=allowed[url.pathname]&&path.join(__dirname,'public',allowed[url.pathname]);
  if(['/vendor/three.module.js','/vendor/three.core.js'].includes(url.pathname))file=path.join(__dirname,'../../node_modules/three/build',path.basename(url.pathname));
  if(!file||!fs.existsSync(file)){res.writeHead(404);return res.end('Not found');}
  let body=fs.readFileSync(file);
  if(file.endsWith('.html'))body=Buffer.from(body.toString().replace('/*SS_BOOT*/',`window.SS_CONFIG=${JSON.stringify({mode,title:TITLES[mode],host,hostKey:host?hostKey:null,managed:runtime.managed})};`));
  res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:body);
});
const wss=new WebSocketServer({server,path:'/ws',maxPayload:4096});
function send(ws,type,data){if(ws.readyState===1&&ws.bufferedAmount<512*1024)ws.send(JSON.stringify({type,data}));}
function controllerState(s,id,bot=false){
  if(bot)return s;
  const {physics,stones,enemies,targets,covers,...small}=s;
  small.players=s.players.map(p=>p.id===id?p:({id:p.id,name:p.name,color:p.color,team:p.team,number:p.number,score:p.score,connected:p.connected,participant:p.participant,gunUntil:p.gunUntil}));
  small.events=s.events.filter(e=>e.kind!=='shot'||e.player===id);
  return small;
}
function broadcast(full=true){const s=match.snapshot();for(const ws of wss.clients){if(ws.host)send(ws,'state',s);else if(full&&ws.pid)send(ws,'state',controllerState(s,ws.pid,ws.bot));}}
wss.on('connection',(ws,req)=>{
  ws.alive=true;ws.on('pong',()=>ws.alive=true);ws.budget=180;ws.budgetAt=Date.now();
  ws.on('message',(raw,binary)=>{
    if(binary)return;
    const now=Date.now();ws.budget=Math.min(180,ws.budget+(now-ws.budgetAt)*.09);ws.budgetAt=now;
    if(--ws.budget<0){ws.close(1008,'Too many messages');return;}
    let m;try{m=JSON.parse(raw);}catch{return;}
    if(!m||typeof m!=='object'||Array.isArray(m))return;
    const d=m.data&&typeof m.data==='object'&&!Array.isArray(m.data)?m.data:{};
    if(m.type==='ping'){send(ws,'pong',{t:match.t});return;}
    if(m.type==='host'){
      if(local(req)&&d.key===hostKey){ws.host=true;send(ws,'host-ok',{});send(ws,'state',match.snapshot());}
      return;
    }
    if(m.type==='join'){
      let profile=runtime.identify(d),session;
      if(runtime.managed&&!profile){send(ws,'join_error',{message:'Войди через главное лобби'});return;}
      if(!runtime.managed){session=typeof d.token==='string'&&sessions.get(d.token);profile=session||{id:crypto.randomUUID(),name:d.name||'Игрок',hand:d.hand,token:crypto.randomBytes(24).toString('hex')};}
      const p=match.add(profile);if(!p){send(ws,'join_error',{message:'В комнате уже 16 игроков'});return;}
      if(!runtime.managed)sessions.set(profile.token,profile);
      const old=sockets.get(p.id);sockets.set(p.id,ws);ws.pid=p.id;ws.bot=d.bot===true;
      if(old&&old!==ws)old.close(1000,'Replaced');
      send(ws,'joined',{id:p.id,name:p.name,hand:p.hand,token:profile.token});broadcast();return;
    }
    if(ws.host&&m.type==='start'){try{match.start(d);}catch(e){send(ws,'error',{message:'Не удалось начать игру: '+e.message});}broadcast();return;}
    if(ws.host&&m.type==='reset'&&match.phase==='results'){match.phase='waiting';match.stage='waiting';match.result=null;match.release();broadcast();return;}
    if(ws.pid&&sockets.get(ws.pid)===ws&&!runtime.paused)match.input(ws.pid,m.type,d);
  });
  ws.on('close',()=>{if(ws.pid&&sockets.get(ws.pid)===ws){sockets.delete(ws.pid);match.disconnect(ws.pid);runtime.presence(ws.pid,false);broadcast();}});
  ws.on('error',()=>{});
});
runtime.onPause(()=>{match.release();broadcast();});
let last=runtime.now(),accumulator=0,frame=0,reported='';
const step=()=>{
  const now=runtime.now();accumulator=Math.min(.1,accumulator+Math.max(0,(now-last)/1000));last=now;
  while(accumulator>=1/60){match.step(1/60);accumulator-=1/60;}
  if(++frame%3===0){
    broadcast(frame%6===0);
    const p=match.players.get(match.currentId);
    runtime.ui({phase:match.phase==='results'?'results':match.phase==='playing'?'playing':'waiting',
      endsAt:match.phase==='playing'&&match.deadline>match.t?runtime.now()+(match.deadline-match.t)*1000:null,
      label:match.stage==='aim'?'На бросок':match.stage==='rolling'?'Бросок':match.stage==='break'?'Следующая волна':match.mode==='peek_shoot'?'До финала':'Матч',
      currentPlayer:p?.name,progress:mode==='swarm_gate'?`Волна ${match.wave||0} / ${match.waveCount||6}`:mode==='curling'?`Энд ${match.endIndex||0} / ${match.endCount||3}`:''});
    if(match.result&&reported!==match.result.eventId){reported=match.result.eventId;runtime.report(match.result);}
  }
};
const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive)ws.terminate();else{ws.alive=false;ws.ping();}}},10000);heartbeat.unref();
(async()=>{
  if(mode==='bowling')await bowling.init();
  runtime.setInterval(step,1000/60);
  server.listen(Number(process.env.PORT||0),runtime.managed?'127.0.0.1':'0.0.0.0',()=>{
    console.log(`${TITLES[mode]}: http://localhost:${server.address().port}/host`);process.send?.({type:'ready',port:server.address().port});
  });
})().catch(e=>{console.error(e);process.exit(1);});
function close(){match.release();match.world?.free();for(const ws of wss.clients)ws.terminate();server.close(()=>process.exit(0));}
process.on('SIGTERM',close);process.on('SIGINT',close);
