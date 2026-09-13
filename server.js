'use strict';
const http = require('http');
const tlsFile=process.env.PARTY_TLS_PFX;
const scheme=tlsFile?'https':'http';
const net = require('net');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const {spawn} = require('child_process');
const {WebSocketServer, WebSocket} = require('ws');
const QRCode = require('qrcode');
const catalog = require('./lib/catalog');
const {ProfileStore}=require('./lib/profile-store');
const {SessionControls}=require('./lib/session-controls');
const ROOT = __dirname;
const requestedPort = Number(process.env.PARTY_PORT || 0);
let PORT = 0;
const hostKey = crypto.randomBytes(24).toString('hex');
const players = new Map(), clients = new Set();
const profileStore=new ProfileStore(process.env.PARTY_EPHEMERAL==='1'?null:(process.env.PARTY_DATA_FILE||path.join(ROOT,'data','party.json')));
const tokenFromCookie=req=>{const item=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('local_party_device='));return item?.slice('local_party_device='.length);};
const publicProfile=p=>p?{id:p.id,token:p.token,name:p.name,hand:p.hand}:null;
let active = null, busy = false, closing = false, testMode=false, botCount=0, testProfiles=[];
function sendTestProfile(ws){while(testProfiles.length<botCount)testProfiles.push(publicProfile(profileStore.register(null,'Бот '+(testProfiles.length+1),'right')));send(ws,{type:'test-profiles',profiles:testProfiles.slice(0,botCount)});}
const local = req => ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
const updater=require('./lib/updater').createUpdater({root:ROOT,hostKey,isLocal:local,isBusy:()=>!!active||busy,getPort:()=>PORT,shutdown});
const addresses = () => Object.entries(os.networkInterfaces()).flatMap(([name, list]) => list.filter(x=>x.family==='IPv4'&&!x.internal).map(x=>({name,address:x.address}))).sort((a,b)=>Number(/virtual|vethernet|vpn|wsl/i.test(a.name))-Number(/virtual|vethernet|vpn|wsl/i.test(b.name)));
function inviteUrl(req){const ips=addresses();const selected=req&&new URL(req.url,'http://localhost').searchParams.get('host');const ip=ips.find(x=>x.address===selected)?.address||ips[0]?.address;return ip?`${scheme}://${ip}:${PORT}/`:`${scheme}://${req?.headers.host||'localhost:'+PORT}/`;}
const connected = () => [...players.values()].filter(p=>p.socket?.readyState===WebSocket.OPEN);
function state(){return {type:'state',players:connected().map(({id,name,hand,testBot})=>({id,name,hand,testBot:!!testBot,gameReady:!!active?.ready.has(id)})),active:active?{id:active.game.id,instance:active.instance,participants:connected().map(p=>p.id),ready:[...active.ready],ui:{...(active.ui||{phase:"waiting",endsAt:null,label:"Ожидание"}),serverNow:Date.now()}}:null,busy,catalog,gamePopularity:Object.fromEntries(catalog.map(g=>[g.id,profileStore.data.events.filter(e=>e.game===g.id).length])),totalMatches:profileStore.data.completed||profileStore.data.events.length,leaderboard:profileStore.leaderboard(),lastResult:profileStore.data.events.at(-1)||null,urls:addresses().map(x=>`${scheme}://${x.address}:${PORT}/`)};}
function send(ws, data){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(data));}
function eligible(){return connected().filter(p=>active?.ready.has(p.id)&&!p.testBot).map(p=>p.id);}
function sessionState(){return active?.session.view(eligible());}
function broadcast(){const s=state();s.testMode=testMode;s.botCount=botCount;if(s.active)s.active.session=sessionState();for(const ws of clients)send(ws,s);}
function checkSession(){if(!active)return;const ids=eligible();if(active.session.shouldExit(ids)){stop();return;}const botReady=!active.session.testMode||testProfiles.slice(0,botCount).every(p=>active.ready.has(p.id));const rosterReady=connected().filter(p=>!p.testBot).every(p=>active.ready.has(p.id));if(rosterReady&&botReady&&(!active.ui||active.ui.phase==='waiting')&&active.session.shouldStart(ids)){for(const ws of clients)if(ws.isHost)send(ws,{type:'session-start',instance:active.instance});}broadcast();}
function json(res, status, value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
function syncRoster(){if(active?.child.connected)active.child.send({type:'party:roster',players:profileStore.data.players.map(publicProfile)});}
async function waitReady(child, port){const until=Date.now()+15000;while(Date.now()<until){if(child.exitCode!==null||child.spawnError)throw Error(child.spawnError||'Игровой сервер завершился при запуске.');if(await new Promise(resolve=>{const r=http.get({host:'127.0.0.1',port,path:'/',timeout:350},res=>{res.resume();resolve(res.statusCode===200);});r.on('error',()=>resolve(false));r.on('timeout',()=>r.destroy());}))return;await new Promise(r=>setTimeout(r,100));}throw Error('Игровой сервер не ответил за 15 секунд.');}
async function launch(id){
  if(busy||updater.running)throw Error('Подождите окончания запуска или обновления.');
  const game=catalog.find(g=>g.id===id);if(!game)throw Error('Игра не найдена.');
  if(connected().length<(testMode?1:game.min)||connected().length>game.max)throw Error(`Для этой игры нужно ${testMode?1:game.min}–${game.max} игроков.`);
  busy=true;broadcast();let next;
  try{
    const port=await freePort(), instance=crypto.randomBytes(8).toString('hex');
    const child=spawn(process.execPath,['server.js'],{cwd:path.join(ROOT,'games',game.engine||id),env:{...process.env,PORT:String(port),PARTY_MANAGED:'1',PARTY_GAME_ID:id,PARTY_INSTANCE:instance,PARTY_ROSTER:JSON.stringify(profileStore.data.players.map(publicProfile)),PARTY_PLAYER_LIMIT:String(connected().length),PARTY_JOIN_URL:inviteUrl()},windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
    next={game,port,instance,child,ready:new Set(),session:new SessionControls(testMode)};let log='';
    child.on('message',m=>{
      if(m?.type==='party:ui'&&m.ui){const reset=next.ui?.phase==='results'&&m.ui.phase==='waiting';if(reset)next.session.resetReady();next.ui=m.ui;if(active===next){for(const client of clients)send(client,{type:'game-ui',instance,ui:m.ui});if(reset)broadcast();}}
      if(m?.type==='party:presence'&&typeof m.id==='string'){if(m.connected)next.ready.add(m.id);else next.ready.delete(m.id);if(active===next)checkSession();}
      if(m?.type==='party:result'&&m.result?.eventId&&Array.isArray(m.result.players)){if(!next.session.testMode&&profileStore.record(m.result,instance,id))broadcast();}
    });
    child.on('error',e=>{child.spawnError=e.message;});
    for(const stream of [child.stdout,child.stderr])stream.on('data',d=>{log=(log+d).slice(-8000);console.log(`[${id}] ${d.toString().trim()}`);});
    child.on('exit',()=>{if(active===next&&!closing){active=null;broadcast();for(const ws of clients)send(ws,{type:'error',message:'Игра остановилась. Можно запустить её снова.'});}});
    try{await waitReady(child,port);}catch(e){throw Error(`${e.message} ${log.slice(-700)}`);}
    const previous=active;active=next;syncRoster();previous?.child.kill();
  }catch(e){next?.child.kill();throw e;}finally{busy=false;broadcast();}
}
function stop(){const old=active;active=null;old?.child.kill();broadcast();}
function transform(text, type, prefix, req){
  if(type.includes('text/html')){
    if(!/<head\b/i.test(text))text=text.replace(/<html([^>]*)>/i,'<html$1><head>').replace(/<body([^>]*)>/i,'</head><body$1>');
    text=text.replace(/((?:src|href|action)\s*=\s*["'])\/(?!\/)/gi,`$1${prefix}/`);
    text=text.replace(/<head([^>]*)>/i,`<head$1><base href="${prefix}/"><script src="/game-clock-client.js"></script><script src="/game-art.js"></script><script defer src="/game-art-dom.js"></script><script src="/bridge.js" data-prefix="${prefix}"></script>`);
    text=text.replace(/<\/head>/i,'<link rel="stylesheet" href="/game-polish.css"></head>');
  }
  if(type.includes('javascript')||type.includes('text/html'))text=text.replace(/\bio\(\)/g,`partyIO({path:'${prefix}/socket.io'})`);
  return text;
}
const handler=async(req,res)=>{
  if(await updater.route(req,res))return;
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/profile'&&req.method==='GET')return json(res,200,{profile:publicProfile(profileStore.get(tokenFromCookie(req)))});
  if(url.pathname==='/api/profile'&&req.method==='POST'){
    let body='';req.on('data',d=>{body+=d;if(body.length>4096)req.destroy();});req.on('end',()=>{try{const {token}=JSON.parse(body);if(!profileStore.get(token))return json(res,403,{error:'Unknown profile'});res.setHeader('Set-Cookie',`local_party_device=${token}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`);json(res,200,{ok:true});}catch{json(res,400,{error:'Invalid request'});}});return;
  }
  if(url.pathname.startsWith('/games/')){
    const match=url.pathname.match(/^\/games\/([a-z_]+)(\/.*)?$/);const run=active;
    if(!run||!match||match[1]!==run.game.id)return json(res,410,{error:'Эта игра уже закрыта. Вернитесь в лобби.'});
    const prefix=`/games/${run.game.id}`;
    const sub=(match[2]||'/')+url.search;
    const canonical=p=>{try{return decodeURIComponent(p).toLowerCase().replace(/\/+$/,'')||'/';}catch{return '/invalid';}};
    const hostPath=canonical(new URL(run.game.host,'http://localhost').pathname);
    if(!local(req)&&[hostPath,'/host.html','/index.html'].includes(canonical(match[2]||'/')))return json(res,403,{error:'Экран ведущего доступен на компьютере запуска.'});
    if(['/api/info','/api/config','/info'].includes(match[2])){
      // Keep each game's metadata but make every invite point to the shared lobby.
      const r=http.get({host:'127.0.0.1',port:run.port,path:sub},up=>{let body='';up.on('data',d=>body+=d);up.on('end',async()=>{try{const data=JSON.parse(body);const join=inviteUrl(req);for(const k of ['controllerUrl','joinUrl','join_url','playUrl'])if(k in data)data[k]=join;if('qr' in data)data.qr=await QRCode.toDataURL(join);if('port' in data)data.port=PORT;if('candidates' in data)data.candidates=addresses().map(x=>({...x,url:`${scheme}://${x.address}:${PORT}/`}));json(res,up.statusCode,data);}catch{res.writeHead(up.statusCode,{'Content-Type':'application/json'});res.end(body);}});});r.on('error',()=>json(res,502,{error:'Сервер игры недоступен'}));return;
    }
    if(match[2]==='/qr.png'){res.setHeader('Content-Type','image/png');return res.end(await QRCode.toBuffer(inviteUrl(req)));}
    const headers={...req.headers,host:`127.0.0.1:${run.port}`,'x-party-local':local(req)?'1':'0'};delete headers['accept-encoding'];
    const upstream=http.request({host:'127.0.0.1',port:run.port,path:sub,method:req.method,headers},up=>{
      const type=up.headers['content-type']||'';
      const out={...up.headers};delete out['content-length'];delete out['transfer-encoding'];out['cache-control']='no-store';
      if(out.location?.startsWith('/'))out.location=prefix+out.location;
      if(type.includes('text/html')||type.includes('javascript')){let body='';up.on('data',d=>body+=d);up.on('end',()=>{res.writeHead(up.statusCode,out);res.end(transform(body,type,prefix,req));});}
      else{res.writeHead(up.statusCode,out);up.pipe(res);}
    });upstream.on('error',()=>{if(!res.headersSent)json(res,502,{error:'Сервер игры недоступен'});else res.end();});req.pipe(upstream);return;
  }
  if(url.pathname==='/api/qr'){res.setHeader('Content-Type','image/png');const allowed=addresses().map(x=>`${scheme}://${x.address}:${PORT}/`);const target=allowed.includes(url.searchParams.get('url'))?url.searchParams.get('url'):`${scheme}://${req.headers.host}/`;return res.end(await QRCode.toBuffer(target,{margin:1,width:240}));}
  if(url.pathname==='/api/health')return json(res,200,{ok:true,pid:process.pid,build:'sports-siege-alpha.1'});
  if(url.pathname.startsWith('/assets/')){
    let name;try{name=decodeURIComponent(url.pathname).slice(1);if(/^assets\/games\/(curling|bowling|swarm_gate|peek_shoot)[.]webp$/.test(name))name=name.replace(/[.]webp$/,'.svg');}catch{return json(res,400,{error:'Invalid path'});}
    const root=path.join(ROOT,'public','assets'),target=path.resolve(ROOT,'public',name);
    if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile())return json(res,404,{error:'Не найдено'});
    const mime={'.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2','.json':'application/json'}[path.extname(target)];if(!mime)return json(res,404,{error:'Не найдено'});
    res.writeHead(200,{'Content-Type':mime,'Cache-Control':'public,max-age=3600','X-Content-Type-Options':'nosniff'});fs.createReadStream(target).pipe(res);return;
  }
  const isHost=url.pathname==='/host';
  if(isHost&&!local(req))return json(res,403,{error:'Экран ведущего открывается на компьютере, запустившем лаунчер.'});
  const files={'/updates.js':'updates.js','/updates.css':'updates.css','/':'index.html','/host':'index.html','/app.js':'app.js','/style.css':'style.css','/game-art-dom.js':'game-art-dom.js','/game-art.js':'game-art.js','/bridge.js':'bridge.js','/game-polish.css':'game-polish.css','/refresh.css':'refresh.css','/glass.css':'glass.css','/game-clock-client.js':'game-clock-client.js','/test-bot.js':'test-bot.js','/ux.css':'ux.css','/catalog-previews.css':'catalog-previews.css','/catalog-previews.js':'catalog-previews.js','/value-fit.js':'value-fit.js','/bots.js':'bots.js','/fresh.css':'fresh.css'};
  const file=files[url.pathname];if(!file)return json(res,404,{error:'Не найдено'});
  let content=fs.readFileSync(path.join(ROOT,'public',file));
  if(file==='index.html')content=content.toString().replace('/*BOOT*/',`window.PARTY_HOST_KEY=${JSON.stringify(isHost?hostKey:null)};`).replace('</head>','<link rel="stylesheet" href="/updates.css"><script defer src="/updates.js"></script></head>');
  const ext=path.extname(file);res.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'}[ext],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(content);
};
const server=tlsFile?require('https').createServer({pfx:fs.readFileSync(tlsFile),passphrase:process.env.PARTY_TLS_PASSWORD||''},handler):http.createServer(handler);
const wss=new WebSocketServer({noServer:true,maxPayload:8192});
server.on('upgrade',(req,socket,head)=>{
  if(req.headers.origin&&req.headers.origin!==`${scheme}://${req.headers.host}`){socket.destroy();return;}
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/lobby'){if(req.headers.origin&&req.headers.origin!==`${scheme}://${req.headers.host}`){socket.destroy();return;}return wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));}
  const run=active,prefix=run?`/games/${run.game.id}/`:'';
  if(!run||!url.pathname.startsWith(prefix))return socket.destroy();
  const upstream=net.connect(run.port,'127.0.0.1',()=>{const headers={...req.headers,host:`127.0.0.1:${run.port}`,'x-party-local':local(req)?'1':'0'};upstream.write(`${req.method} ${req.url.slice(prefix.length-1)} HTTP/1.1\r\n`+Object.entries(headers).map(([k,v])=>`${k}: ${v}\r\n`).join('')+'\r\n');if(head.length)upstream.write(head);socket.pipe(upstream).pipe(socket);});
  upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());socket.on('close',()=>upstream.destroy());upstream.on('close',()=>socket.destroy());
});
wss.on('connection',(ws,req)=>{
  clients.add(ws);ws.alive=true;ws.on('pong',()=>ws.alive=true);const initial=state();initial.testMode=testMode;initial.botCount=botCount;if(initial.active)initial.active.session=sessionState();send(ws,initial);
  ws.on('message',async raw=>{try{
    const m=JSON.parse(raw);
    if(m.type==='ping')return send(ws,{type:'pong'});
    if(m.type==='test-mode'||m.type==='bots-set'){if(!ws.isHost)throw Error('Тестовый режим включает ведущий.');if(active)throw Error('Вернитесь в лобби перед сменой режима.');const requested=m.type==='bots-set'?Number(m.count):(m.enabled?1:0);if(!Number.isInteger(requested)||requested<0||requested>15)throw Error('Можно добавить от 0 до 15 ботов.');if(requested+connected().filter(p=>!p.testBot).length>16)throw Error('В комнате максимум 16 игроков.');botCount=requested;testMode=botCount>0;for(const c of clients)if(c.isHost)sendTestProfile(c);broadcast();return;}
    if(['ready-set','spectate-set','pause-set','exit-vote'].includes(m.type)){
      if(!active||!ws.player||ws.player.socket!==ws||!active.ready.has(ws.player.id))throw Error('Сначала подключитесь к игре.');
      const id=ws.player.id;
      if(m.type==='ready-set'){if(active.ui&&active.ui.phase!=='waiting')throw Error('Матч уже начался.');active.session.setReady(id,!!m.ready);}
      if(m.type==='spectate-set')active.session.spectate(id,!!m.spectating);
      if(m.type==='exit-vote')active.session.vote(id,!!m.vote);
      if(m.type==='pause-set'){active.session.setPaused(m.paused);active.child.send({type:'party:pause',paused:active.session.paused});}
      checkSession();return;
    }
    if(m.type==='host'){if(!local(req)||m.key!==hostKey)throw Error('Нет доступа ведущего.');ws.isHost=true;send(ws,{type:'host-ok'});sendTestProfile(ws);return;}
    if(m.type==='join'){
      const saved=m.freshIdentity?null:profileStore.get(m.token||tokenFromCookie(req));
      const name=String(m.name||saved?.name||'').normalize('NFC').trim().replace(/[<>\x00-\x1f]/g,'').slice(0,24);
      if(!name)throw Error('Введите имя.');
      let p=saved&&players.get(saved.token);
      if([...players.values()].some(other=>other!==p&&other.name.toLocaleLowerCase()===name.toLocaleLowerCase()&&other.socket?.readyState===WebSocket.OPEN))throw Error('Это имя уже занято. Добавь, например, первую букву фамилии.');
      if(!p){if(connected().length>=16)throw Error('В лобби уже 16 игроков.');const stored=profileStore.register(saved?.token,name,m.hand||saved?.hand||'right');p=publicProfile(stored);players.set(p.token,p);}
      if(p.socket&&p.socket!==ws){send(p.socket,{type:'replaced'});p.socket.close();}
      p.name=name;p.hand=(m.hand||saved?.hand)==='left'?'left':'right';p.testBot=testProfiles.some(bot=>bot.id===p.id);p.socket=ws;ws.player=p;
      profileStore.register(p.token,p.name,p.hand);syncRoster();
      send(ws,{type:'joined',token:p.token,id:p.id,name:p.name,hand:p.hand});broadcast();return;
    }
    if(m.type==='game-status'&&ws.player&&active){if(m.status==='ready')active.ready.add(ws.player.id);else active.ready.delete(ws.player.id);checkSession();return;}
    if(m.type==='launch'||m.type==='stop'){if(!ws.isHost)throw Error('Игру выбирает ведущий.');if(m.type==='launch')await launch(m.id);else{if(busy)throw Error('Подождите окончания запуска.');stop();}return;}
  }catch(e){send(ws,{type:'error',message:e.message});}});
  ws.on('close',()=>{clients.delete(ws);if(ws.player?.socket===ws){ws.player.socket=null;ws.player.disconnectedAt=Date.now();}checkSession();broadcast();});
});
const heartbeat=setInterval(()=>{for(const ws of clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}for(const [token,p] of players)if(!p.socket&&Date.now()-p.disconnectedAt>24*3600000)players.delete(token);},10000);
// Port 0 asks the OS to allocate and bind a free port in one atomic operation.
// An explicitly requested port is only a preference: never fail just because it is busy.
let listeningPort = Number.isInteger(requestedPort)&&requestedPort>=0&&requestedPort<=65535?requestedPort:0;
server.once('listening',()=>{PORT=server.address().port;console.log(`\nLOCAL PARTY — ${scheme}://localhost:${PORT}/host`);for(const x of addresses())console.log(`Players: ${scheme}://${x.address}:${PORT}/ (${x.name})`);if(process.env.PARTY_NO_BROWSER!=='1'){const url=`${scheme}://localhost:${PORT}/host`;if(process.platform==='win32')spawn('rundll32',['url.dll,FileProtocolHandler',url],{windowsHide:true});else if(process.platform==='darwin')spawn('open',[url]);}});
server.on('error',e=>{
  if(listeningPort!==0&&['EADDRINUSE','EACCES'].includes(e.code)){
    console.log(`Порт ${listeningPort} недоступен — выбираю свободный.`);
    listeningPort=0;server.listen(0,'0.0.0.0');return;
  }
  console.error('Не удалось запустить локальный сервер:',e);process.exit(1);
});
server.listen(listeningPort,'0.0.0.0');
function shutdown(){closing=true;clearInterval(heartbeat);active?.child.kill();for(const ws of clients)ws.terminate();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1000).unref();}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
