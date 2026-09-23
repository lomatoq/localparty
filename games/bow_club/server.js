'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),https=require('node:https'),crypto=require('node:crypto'),os=require('node:os');
const {BowMatch}=require('./core/match.cjs');let WS;try{WS=require('ws');}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;WS=require('./transport/ws-lite.cjs');}
const managed=process.env.PARTY_MANAGED==='1',runtime=managed?require('../../lib/party-runtime'):{now:Date.now,setInterval,onPause(){},identify(){return null;},presence(){},host(){},report(){},ui(){},paused:false,displayOnly:false};
const game=new BowMatch(),sessions=new Map(),sockets=new Map(),root=path.join(__dirname,'public'),hostKey=crypto.randomBytes(24).toString('hex'),displayKey=crypto.randomBytes(24).toString('hex');
const local=req=>managed?req.headers['x-party-local']==='1':['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
const tls=!!(process.env.AR_TLS_CERT&&process.env.AR_TLS_KEY),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
function handle(req,res){
 let u;try{u=new URL(req.url,'http://localhost');}catch{res.writeHead(400);res.end();return;}if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 if(['/vendor/three.module.js','/vendor/three.core.js'].includes(u.pathname)){const file=path.join(__dirname,'../../node_modules/three/build',path.basename(u.pathname));res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'});res.end(fs.readFileSync(file));return;}
 if(u.pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,phase:game.phase,version:'0.6.0',build:'20260918-audit.6',players:game.players.length}));return;}
 const host=['/tv','/host','/host.html'].includes(u.pathname),relative=host?'tv.html':u.pathname==='/'?'phone.html':u.pathname.slice(1);
 if(!/^[a-zA-Z0-9_./-]+$/.test(relative)||relative.split('/').some(p=>p==='..'||p.startsWith('.'))){res.writeHead(400);res.end();return;}
 const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()||!fs.realpathSync(file).startsWith(fs.realpathSync(root)+path.sep)){res.writeHead(404);res.end();return;}
 let body=fs.readFileSync(file);if(file.endsWith('.html')){const urls=Object.values(os.networkInterfaces()).flat().filter(n=>n.family==='IPv4'&&!n.internal).map(n=>`${tls?'https':'http'}://${n.address}:${server.address().port}/`);body=Buffer.from(body.toString().replace('/*BOW_BOOT*/','window.BOW_CONFIG='+JSON.stringify({host,managed,displayOnly:runtime.displayOnly,hostKey:host&&local(req)&&!runtime.displayOnly?hostKey:null,displayKey:host&&local(req)?displayKey:null,urls:host?urls:[]})+';'));}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Permissions-Policy':'camera=(self), microphone=()','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
}
const server=tls?https.createServer({cert:fs.readFileSync(process.env.AR_TLS_CERT),key:fs.readFileSync(process.env.AR_TLS_KEY)},handle):http.createServer(handle);
const wss=new WS.WebSocketServer({server,path:'/ws',maxPayload:4096});
const send=(ws,type,data)=>{if(ws.readyState===1&&(type!=='state'||ws.bufferedAmount<96000))ws.send(JSON.stringify({type,data}));};
const state=()=>({...game.snapshot(runtime.now()),paused:runtime.paused});
const broadcast=()=>{const s=state();for(const ws of wss.clients)send(ws,'state',s);};
function start(settings={}){const ok=game.start(settings,runtime.now());broadcast();return ok;}
function reset(){const ok=game.reset();broadcast();return ok;}
let reported='';
wss.on('connection',(ws,req)=>{
 if(!managed&&req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return ws.close(1008,'Origin mismatch');}catch{return ws.close(1008);}}
 ws.alive=true;ws.on('pong',()=>ws.alive=true);send(ws,'state',state());let credit=70,last=Date.now();
 ws.on('message',(raw,binary)=>{if(binary)return;const now=runtime.now();credit=Math.min(70,credit+(Date.now()-last)*.03);last=Date.now();if(--credit<0)return ws.close(1008,'Rate limit');let m;try{m=JSON.parse(raw);}catch{return;}if(!m||typeof m!=='object')return;const d=m.data&&typeof m.data==='object'&&!Array.isArray(m.data)?m.data:{};
  if(m.type==='host'){if(local(req)&&d.key===hostKey){ws.host=true;send(ws,'host-ok',{});}return;}
  if(m.type==='display-layout'&&local(req)&&d.key===displayKey){if(Number.isFinite(d.aspect)&&d.aspect>=1&&d.aspect<=3.2){game.aspect=d.aspect;broadcast();}return;}
  if(m.type==='ping'){send(ws,'pong',{client:d.client,server:now});return;}
  if(m.type==='join'){
   let profile=runtime.identify(d,ws);if(managed&&!profile)return send(ws,'join_error',{message:'Подключитесь через общий хаб.'});
   if(!managed){profile=typeof d.token==='string'?sessions.get(d.token):null;if(!profile){if(sessions.size>=64)return send(ws,'join_error',{message:'Лимит сессий.'});profile={id:crypto.randomUUID(),token:crypto.randomBytes(24).toString('hex'),name:d.name||'Лучник'};sessions.set(profile.token,profile);}}
   if(ws.pid&&ws.pid!==profile.id)return;const p=game.add(profile);if(!p)return send(ws,'join_error',{message:'Матч уже идёт или подключено 6 игроков. Подождите следующего.'});
   const old=sockets.get(p.id);sockets.set(p.id,ws);ws.pid=p.id;if(old&&old!==ws)old.close(1000,'Reconnected');send(ws,'joined',{id:p.id,token:managed?null:profile.token,nextSeq:p.lastSeq+1});broadcast();return;
  }
  if(ws.host&&!runtime.displayOnly&&!runtime.paused){if(m.type==='start'){if(!start(d))send(ws,'error',{message:'Сначала подключите телефоны.'});return;}if(m.type==='reset'){reset();return;}}
  if(!ws.pid||sockets.get(ws.pid)!==ws||runtime.paused)return;
  if(m.type==='draw'){const ok=game.draw(ws.pid,d,now);send(ws,'draw-result',{ok});}
  if(m.type==='cancel')game.cancel(ws.pid);
  if(m.type==='shot'){send(ws,'shot-result',game.shoot(ws.pid,d,now));broadcast();}
 });
 ws.on('close',()=>{if(ws.pid&&sockets.get(ws.pid)===ws){sockets.delete(ws.pid);game.disconnect(ws.pid);runtime.presence(ws.pid,false);broadcast();}});ws.on('error',()=>{});
});
runtime.host({start,reset,available:()=>game.phase==='waiting'?['start']:game.phase==='results'?['reset']:[]});runtime.onPause(()=>{for(const p of game.players)game.cancel(p.id);broadcast();});
const loop=runtime.setInterval(()=>{if(!runtime.paused)game.step(runtime.now());runtime.ui({phase:game.phase,label:'Стрельба из лука',progress:`${game.arrows||10} стрел`,endsAt:game.phase==='playing'?game.deadline:null});if(game.result&&reported!==game.result.eventId){reported=game.result.eventId;runtime.report(game.result);}broadcast();},150);
const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive)ws.terminate();else{ws.alive=false;ws.ping();}}},10000);heartbeat.unref();
server.on('error',e=>{console.error(e);clearInterval(loop);clearInterval(heartbeat);process.exitCode=1;});
server.listen(Number(process.env.PORT||process.env.AR_PORT||4200),managed?'127.0.0.1':'0.0.0.0',()=>{console.log(`Bow Club 0.2 — http${tls?'s':''}://localhost:${server.address().port}/tv\nController: / (camera needs trusted HTTPS; touch mode works over HTTP)`);process.send?.({type:'ready',port:server.address().port});});
const stop=()=>{clearInterval(loop);clearInterval(heartbeat);wss.close();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),500).unref();};process.on('SIGTERM',stop);process.on('SIGINT',stop);
