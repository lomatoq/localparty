'use strict';
const http=require('node:http'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const {WebSocketServer}=require('ws'),runtime=require('../../lib/party-runtime');
const {Sports}=require('./sports'),{Arcade}=require('./arcade');
const mode=process.env.PARTY_GAME_ID||'curling';
if(!['curling','bowling','gate_siege','pop_shots'].includes(mode))throw Error('Unknown game');
const players=new Map(),palette=['#c8ff73','#be8bff','#48dcf5','#ff917d','#ffc85b','#ef8ccc','#88adff','#8fe0bb','#e8db91','#d399ff','#83eeee','#ffc3a0','#f3f798','#fa9ddf','#88c9ff','#d0f3c0'];
let game=null,starting=false,matchId='',reported=false,started=0,serial=0;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.ttf':'font/ttf'};
const files={'/':'controller.html','/host':'host.html','/host.html':'host.html','/controls.js':'controls.js','/host.js':'host.js','/game.css':'game.css','/venues.js':'venues.js','/sports-view.js':'sports-view.js','/arcade-view.js':'arcade-view.js','/motion.js':'motion.js'};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/config'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({mode}));}
  let file=files[url.pathname]?path.join(__dirname,'public',files[url.pathname]):null;
  if(/^\/vendor\/(three[.](module|core)[.]js)$/.test(url.pathname))file=path.join(__dirname,'../../node_modules/three/build',path.basename(url.pathname));
  if(url.pathname==='/rules.js')file=path.join(__dirname,'rules.js');
  if(url.pathname==='/font.ttf')file=path.join(__dirname,'../../public/assets/fonts/Rubik.ttf');
  if(!file||!fs.existsSync(file)){res.writeHead(404);return res.end('Not found');}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);
});
const wss=new WebSocketServer({server,path:'/ws',maxPayload:4096});
function send(ws,type,data){if(ws.readyState===1&&ws.bufferedAmount<128*1024)ws.send(JSON.stringify({type,data}));}
function lobby(){return{mode,phase:'waiting',time:0,players:[...players.values()].map(p=>({id:p.id,name:p.name,color:p.color,connected:p.connected})),message:'Ждём готовность игроков в главном лобби.'};}
let phoneFrame=0;
function broadcast(){
  phoneFrame++;
  const full=game?game.snapshot(true):lobby(),slim=game?game.snapshot(false):full;
  for(const ws of wss.clients){if(ws.host||phoneFrame%2===0||!game)send(ws,'state',ws.host?full:slim);if(ws.pid){const privateState={id:ws.pid,spectator:!!game&&!game.players.some(p=>p.id===ws.pid),hand:players.get(ws.pid)?.hand||'right'},key=JSON.stringify(privateState);if(key!==ws.privateKey){ws.privateKey=key;send(ws,'private',privateState);}}}
}
async function start(options={}){
  if(starting||game)return;const roster=[...players.values()].filter(p=>p.connected);if(roster.length<2)return;
  starting=true;let next;
  try{next=['bowling','curling'].includes(mode)?new Sports(mode,roster,options):new Arcade(mode,roster);if(next.init)await next.init();game=next;matchId=crypto.randomUUID();reported=false;started=runtime.now();}
  catch(e){next?.dispose();for(const ws of wss.clients)send(ws,'error','Не удалось запустить физику: '+e.message);}
  finally{starting=false;broadcast();}
}
wss.on('connection',(ws,req)=>{
  if(req.headers.origin){try{const u=new URL(req.headers.origin);if(!runtime.managed&&u.host!==req.headers.host){ws.close(1008);return;}}catch{ws.close(1008);return;}}
  ws.alive=true;ws.on('pong',()=>ws.alive=true);let allowance=160,lastBudget=Date.now();
  ws.on('message',raw=>{
    const now=Date.now();allowance=Math.min(160,allowance+(now-lastBudget)*.10);lastBudget=now;if(--allowance<0)return;
    let m;try{m=JSON.parse(raw);}catch{return;}const d=m.data&&typeof m.data==='object'?m.data:{};
    if(m.type==='ping'){send(ws,'pong',{client:d.client});return;}
    if(m.type==='host'){
      const trusted=runtime.managed?req.headers['x-party-local']==='1':['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      if(trusted){ws.host=true;broadcast();}return;
    }
    if(m.type==='join'){
      const profile=runtime.identify(d);if(runtime.managed&&!profile)return send(ws,'join_error',{message:'Вернись в главное лобби.'});
      const id=profile?.id||String(d.token||crypto.randomUUID()).slice(0,80);let p=players.get(id);
      if(!p){if(players.size>=16)return send(ws,'join_error',{message:'В комнате уже 16 игроков.'});
        p={id,name:String(profile?.name||d.name||'Игрок').replace(/[<>\x00-\x1f]/g,'').slice(0,24),hand:profile?.hand||d.hand||'right',color:palette[serial++%palette.length]};players.set(id,p);}
      const old=p.ws;p.ws=ws;p.connected=true;p.fire=false;p.sweeping=0;ws.pid=id;if(old&&old!==ws)old.close(1000,'Reconnected');
      send(ws,'joined',{id,name:p.name});broadcast();return;
    }
    if(m.type==='start'&&ws.host){start(d);return;}
    if(m.type==='reset'&&ws.host&&game?.phase==='results'){game.dispose();game=null;for(const [id,p] of players)if(!p.connected)players.delete(id);broadcast();return;}
    const p=players.get(ws.pid);if(!game||!p||p.ws!==ws||runtime.paused)return;
    if(game.players.includes(p)){const accepted=game.input(p,m.type,d);if(m.type==='throw')send(ws,'throw-ack',{accepted,turnId:d.turnId});}
  });
  ws.on('close',()=>{const p=players.get(ws.pid);if(p?.ws===ws){p.connected=false;p.fire=false;p.sweeping=0;runtime.presence(p.id,false);broadcast();}});
  ws.on('error',()=>{});broadcast();
});
runtime.onPause(()=>{for(const p of players.values()){p.fire=false;p.sweeping=0;p.lastInput=-1;}});
let previous=runtime.now(),accumulator=0,lastBroadcast=0;
runtime.setInterval(()=>{
  const now=runtime.now();accumulator+=Math.min(.1,Math.max(0,(now-previous)/1000));previous=now;
  while(accumulator>=1/60){game?.update(1/60);accumulator-=1/60;}
  if(game?.phase==='results'&&!reported){reported=true;runtime.report({gameId:mode,eventId:matchId,duration:(now-started)/1000,players:game.players.map(p=>({id:p.id,name:p.name,score:p.score,won:game.result.winners.includes(p.id),metrics:{hits:p.hits||0,shots:p.shots||0,skipped:p.skipped||0}}))});}
  runtime.ui({phase:game?.phase||'waiting',endsAt:game?.phase==='playing'&&game.deadline>game.time?now+(game.deadline-game.time)*1000:null,label:mode==='pop_shots'?'До конца тира':mode==='gate_siege'?'До следующей волны':'До завершения хода',currentPlayer:game?.current?.name||null,progress:mode==='gate_siege'?`Волна ${game?.wave||0} / 8`:mode==='curling'?`Энд ${game?.end||1} / 3`:''});
  if(now-lastBroadcast>=50){lastBroadcast=now;broadcast();}
},1000/60);
const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},10000);
server.listen(Number(process.env.PORT||0),runtime.managed?'127.0.0.1':'0.0.0.0',()=>console.log(`${mode}: http://localhost:${server.address().port}/host`));
function stop(){clearInterval(heartbeat);game?.dispose();for(const ws of wss.clients)ws.terminate();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),500).unref();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
