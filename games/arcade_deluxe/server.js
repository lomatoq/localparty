'use strict';
const SnapshotView=require('./core/snapshot-view.cjs');
const http=require('node:http'),https=require('node:https'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os');
const {Tanks}=require('./core/tanks.cjs'),{Marbles}=require('./core/marbles.cjs'),{WEAPONS}=require('./core/weapons.cjs');
const AirDefense=require('./core/air-defense.cjs');
let WS;try{WS=require('ws');}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;WS=require('./transport/ws-lite.cjs');}
const managed=process.env.PARTY_MANAGED==='1';
const runtime=managed?require('../../lib/party-runtime'):{managed:false,displayOnly:false,now:Date.now,setInterval,onPause(){},host(){},identify(){return null;},presence(){},ui(){},report(){},paused:false};
const alias={tanks:'pocket_siege',marbles:'marble_bloom'},raw=process.env.PARTY_GAME_ID||process.argv[2]||'marble_bloom',mode=alias[raw]||raw;
if(!['pocket_siege','marble_bloom'].includes(mode))throw Error('Unknown game '+mode);
const game=mode==='pocket_siege'?new Tanks(crypto.randomInt(1,1e8)):new Marbles(crypto.randomInt(1,1e8));
const BUILD=require('./version.json');
const title=mode==='pocket_siege'?'POCKET SIEGE':'MARBLE BLOOM';
const sessions=new Map(),sockets=new Map();let localPlayerId=null,reported='',sequence=0;
const hostKey=crypto.randomBytes(24).toString('hex');
const isLocal=req=>runtime.managed?req.headers['x-party-local']==='1':['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
const roots=path.join(__dirname,'public'),sharedFonts=path.resolve(__dirname,'../../public/assets/fonts');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf'};
function handle(req,res){
 let u;try{u=new URL(req.url,'http://localhost');}catch{res.writeHead(400);res.end();return;}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(u.pathname==='/health'){res.writeHead(200,{...headers,'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,...BUILD,mode,phase:game.phase,players:game.players.length}));return;}
 if(u.pathname==='/weapons.json'){res.writeHead(200,{...headers,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(WEAPONS));return;}
 if(/^\/shared-fonts\/(Rubik|Rubik-Italic)\.ttf$/.test(u.pathname)){const font=path.join(sharedFonts,path.basename(u.pathname));if(!fs.existsSync(font)){res.writeHead(404);res.end();return;}res.writeHead(200,{...headers,'Content-Type':'font/ttf'});res.end(fs.readFileSync(font));return;}
 const host=['/host','/host.html'].includes(u.pathname);if(host&&!isLocal(req)){res.writeHead(403);res.end('Open the host on the server device. Join as a player at /.');return;}
 const relative=host?'host.html':u.pathname==='/'?'index.html':u.pathname.slice(1);
 // Explicitly serve public files only; no dotfiles, source traversal or symlinks.
 if(!/^[a-zA-Z0-9_./-]+$/.test(relative)||relative.split('/').some(s=>s==='..'||s.startsWith('.'))){res.writeHead(400);res.end();return;}
 const file=path.resolve(roots,relative);if(!file.startsWith(roots+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()||!fs.realpathSync(file).startsWith(fs.realpathSync(roots)+path.sep)){res.writeHead(404);res.end('Not found');return;}
 let data=fs.readFileSync(file);if(file.endsWith('.html')){const urls=Object.values(os.networkInterfaces()).flat().filter(x=>x.family==='IPv4'&&!x.internal).map(x=>`${tls?'https':'http'}://${x.address}:${server.address().port}/`);data=Buffer.from(data.toString().replace('/*ARCADE_BOOT*/','window.ARCADE_CONFIG='+JSON.stringify({mode,title,host,managed,displayOnly:runtime.displayOnly,hostKey:host?hostKey:null,urls:host?urls:[]})+';'));}
 res.writeHead(200,{...headers,'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:data);
}
const tls=process.env.ARCADE_TLS_CERT&&process.env.ARCADE_TLS_KEY;
const server=tls?https.createServer({cert:fs.readFileSync(process.env.ARCADE_TLS_CERT),key:fs.readFileSync(process.env.ARCADE_TLS_KEY)},handle):http.createServer(handle);
const wss=new WS.WebSocketServer({server,path:'/ws',maxPayload:4096});
function send(ws,type,data){if(ws.readyState===1&&(type!=='state'||ws.bufferedAmount<180*1024)){ws.send(JSON.stringify({type,data}));return true;}return false;}
function stateFor(s,id,host){return SnapshotView.view(s,{id,host,localPlayerId,paused:runtime.paused,...(!host&&mode==='pocket_siege'?{airDefense:AirDefense.status(game,id,{paused:runtime.paused})}:{})});}
function broadcast(full=true){const s=game.snapshot();s.seq=++sequence;for(const ws of wss.clients){if(ws.host){const out=stateFor(s,null,true),pathKey=s.roundSerial+':'+s.level,terrainKey=s.roundSerial+':'+s.terrainRevision;if(ws.pathKey===pathKey){delete out.path;if(out.boards)out.boards=out.boards.map(b=>{const copy={...b};delete copy.path;return copy;});}if(ws.terrainKey===terrainKey){SnapshotView.omitUnchangedTerrain(out);}if(send(ws,'state',out)){ws.pathKey=pathKey;ws.terrainKey=terrainKey;}}else if(full&&ws.pid)send(ws,'state',stateFor(s,ws.pid,false));}}
function start(settings={}){const ok=game.start(settings);broadcast();return ok;}
wss.on('connection',(ws,req)=>{
 if(!managed&&req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host){ws.close(1008,'Origin mismatch');return;}}catch{ws.close(1008);return;}}
 ws.alive=true;ws.on('pong',()=>ws.alive=true);let credit=130,at=Date.now();ws.lastActionSeq=0;
 ws.on('message',(raw,binary)=>{
  if(binary)return;const now=Date.now();credit=Math.min(130,credit+(now-at)*.075);at=now;if(--credit<0){ws.close(1008,'Rate limit');return;}
  let m;try{m=JSON.parse(raw.toString());}catch{return;}if(!m||typeof m!=='object'||Array.isArray(m))return;
  const d=m.data&&typeof m.data==='object'&&!Array.isArray(m.data)?m.data:{};
  if(m.type==='ping'){send(ws,'pong',{client:d.client,server:Date.now()});return;}
  if(m.type==='host'){if(isLocal(req)&&d.key===hostKey){ws.host=true;send(ws,'host-ok',{});broadcast(false);}return;}
  if(m.type==='join'){
   let profile=runtime.identify(d,ws);
   if(managed&&!profile){send(ws,'join_error',{message:'Далучыся праз галоўны хаб Local Party.'});return;}
   if(!managed){profile=typeof d.token==='string'?sessions.get(d.token):null;if(!profile){if(sessions.size>64){send(ws,'join_error',{message:'Ліміт сесій. Перазапусці дэма-сервер.'});return;}profile={id:crypto.randomUUID(),name:String(d.name||'Гулец').trim().slice(0,24)||'Гулец',hand:d.hand,token:crypto.randomBytes(24).toString('hex')};sessions.set(profile.token,profile);}}
   if(ws.pid&&ws.pid!==profile.id){send(ws,'join_error',{message:'Гэты пульт ужо далучаны.'});return;}
   const p=game.add(profile);if(!p){send(ws,'join_error',{message:mode==='pocket_siege'?'Максимум 6 игроков.':'Максимум 3 игрока.'});return;}
   const old=sockets.get(p.id);sockets.set(p.id,ws);ws.pid=p.id;if(old&&old!==ws)old.close(1000,'Reconnected');send(ws,'joined',{id:p.id,name:p.name,hand:p.hand,token:managed?null:profile.token,nextSeq:(p.actionSeq||0)+1});broadcast();return;
  }
  if(ws.host){
   if(!runtime.displayOnly&&!runtime.paused&&m.type==='start'){if(!start(d))send(ws,'error',{message:'Патрэбныя гульцы: далучы тэлефоны або націсні «Паспрабаваць».'});return;}
   if(!managed&&m.type==='practice'&&game.phase==='waiting'){
    game.players=[];sockets.clear();sessions.clear();for(const c of wss.clients)if(c.pid)c.close(1000,'Practice started');localPlayerId='local-human';game.add({id:localPlayerId,name:'Ты',connected:true});if(mode==='pocket_siege'||d.mode==='versus')game.add({id:'practice-bot',name:'Бот',bot:true});start({...d,sandbox:true,levels:1});return;
   }
   if(!managed&&m.type==='demo'&&game.phase==='waiting'){game.players=[];sockets.clear();sessions.clear();for(const c of wss.clients)if(c.pid)c.close(1000,'Demo started');localPlayerId=null;game.add({id:'demo-a',name:'LIME',bot:true});game.add({id:'demo-b',name:'VIOLET',bot:true});start({...d,rounds:5,levels:1});return;}
   if(!runtime.displayOnly&&m.type==='reset'&&game.phase==='results'){game.reset();broadcast();return;}
   if(!managed&&m.type==='local-input'&&localPlayerId&&!runtime.paused){game.input(localPlayerId,d.type,d.data||{});return;}
  }
  if(ws.pid&&sockets.get(ws.pid)===ws&&!runtime.paused){
   if(['fire','swap','weapon','air-defense'].includes(m.type)){const player=game.players.find(p=>p.id===ws.pid);if(!player||!Number.isSafeInteger(d.seq)||d.seq<=(player.actionSeq||0))return;player.actionSeq=d.seq;}
   game.input(ws.pid,m.type,d);
  }
 });
 ws.on('close',()=>{if(ws.pid&&sockets.get(ws.pid)===ws){sockets.delete(ws.pid);game.disconnect(ws.pid);runtime.presence(ws.pid,false);broadcast();}});ws.on('error',()=>{});
});
runtime.host({start,reset:()=>{if(game.phase!=='results')return false;game.reset();broadcast();return true;},available:()=>game.phase==='waiting'?['start']:game.phase==='results'?['reset']:[]});runtime.onPause(()=>broadcast());
let last=runtime.now(),acc=0,frameNo=0;
const loop=runtime.setInterval(()=>{
 const now=runtime.now();acc=Math.min(.15,acc+Math.max(0,(now-last)/1000));last=now;
 if(!runtime.paused)while(acc>=1/60){game.step(1/60);acc-=1/60;}else acc=0;
 if(++frameNo%3===0){broadcast(frameNo%6===0);const p=game.active?.();runtime.ui({phase:game.phase,stage:game.stage,label:mode==='pocket_siege'?'Ход':'Да фінішу',currentPlayer:p?.name,endsAt:['aim','drone','loadout'].includes(game.stage)?runtime.now()+Math.max(0,(game.stage==='drone'?game.drone?.deadline:game.stage==='loadout'?game.loadoutDeadline:game.deadline)-game.t)*1000:null,progress:mode==='pocket_siege'?`Ход ${game.turn+1} / ${(game.rounds||10)*(game.order?.length||1)}`:`Узровень ${game.level+1}`});if(game.result&&reported!==game.result.eventId){reported=game.result.eventId;runtime.report(game.result);}}
},1000/60);
const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive)ws.terminate();else{ws.alive=false;ws.ping();}}},12000);heartbeat.unref();
const port=Number(process.env.PORT||process.env.ARCADE_PORT||(mode==='pocket_siege'?4101:4100));
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is busy. Set ARCADE_PORT to another port.`:e);process.exitCode=1;clearInterval(loop);clearInterval(heartbeat);});
server.listen(port,managed?'127.0.0.1':'0.0.0.0',()=>{console.log(`\n${title} — http${tls?'s':''}://localhost:${server.address().port}/host\nControllers: / on the same address.\n`);process.send?.({type:'ready',port:server.address().port});});
function close(){clearInterval(loop);clearInterval(heartbeat);wss.close();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),700).unref();}process.on('SIGTERM',close);process.on('SIGINT',close);
