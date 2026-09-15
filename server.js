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
const controls=require('./lib/host-controls');
const {ballot}=require('./lib/game-ballot');
const {cssFallbacks}=require('./lib/browser-compat');
let ballotArmed=false,ballotAttempt='';
const catalog = require('./lib/catalog').map(g=>({...g,hostControls:controls.schema(g)}));
const gameSettings=Object.fromEntries(catalog.map(g=>[g.id,controls.settingsFor(g)]));
const {ProfileStore,normalizeAvatar}=require('./lib/profile-store');
const {SessionControls}=require('./lib/session-controls');
const ROOT = __dirname;
const APP_HEAD='<meta name="application-name" content="LocalParty"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="LocalParty"><meta name="msapplication-TileColor" content="#c8ff2e"><meta name="msapplication-config" content="/browserconfig.xml"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="/assets/branding/icons/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="/assets/branding/icons/favicon-16x16.png"><link rel="apple-touch-icon" sizes="180x180" href="/assets/branding/icons/apple-touch-icon.png"><link rel="mask-icon" href="/assets/branding/safari-pinned-tab.svg" color="#c8ff2e"><link rel="manifest" href="/site.webmanifest">';
const requestedPort = Number(process.env.PARTY_PORT || 0);
let PORT = 0;
const embedded=process.env.PARTY_EMBEDDED==='1';
const hostKey = process.env.PARTY_ADMIN_KEY || crypto.randomBytes(24).toString('hex');
const displayKey=crypto.randomBytes(24).toString('hex');
let enabled=true,selected=null,servedSeconds=0,executionAllowed=true,executionRevision=0;
const metrics={maxLoopDelayMs:0,gameStarts:0};
const staticCache=new Map(),qrCache=new Map();
function qrBuffer(url,options={}){const key=JSON.stringify([url,options]);if(!qrCache.has(key)){if(qrCache.size>=32)qrCache.clear();const task=QRCode.toBuffer(url,options).catch(e=>{qrCache.delete(key);throw e;});qrCache.set(key,task);}return qrCache.get(key);}
function tvAccess(req){return local(req)||(req.headers.cookie||'').split(';').some(c=>c.trim()==='party_display='+displayKey);}
function screens(){return [...clients].filter(c=>c.isDisplay&&c.readyState===WebSocket.OPEN).length;}
function applyGamePause(){if(active){active.session.setPaused(active.userPaused||!executionAllowed);active.child.send({type:'party:pause',paused:active.session.paused});}broadcast();}
function setPaused(value){if(active)active.userPaused=!!value;applyGamePause();}
async function pauseBeforeSuspension(){
  const run=active;if(!run)return;
  const acknowledged=new Promise(resolve=>{
    const finish=()=>{clearTimeout(timer);run.child.off('message',receive);resolve();};
    const receive=m=>{if(m?.type==='party:paused'&&m.paused)finish();};
    const timer=setTimeout(finish,250);run.child.on('message',receive);
  });
  applyGamePause();await acknowledged;
}
function roomInfo(){const data=state();if(data.active)data.active.session=sessionState();return {...data,enabled,selected,screens:screens(),servedSeconds:Math.floor(servedSeconds),executionAllowed,metrics:{...metrics,rssMB:Math.round(process.memoryUsage().rss/1048576)}};}
async function manage(m){
  if(['network-set','server-start','server-stop'].includes(m.type)){
    if(!embedded)throw Error('Доступ по сети уже включён');
    const on=m.type==='network-set'?m.enabled:m.type==='server-start';
    if(typeof on!=='boolean')throw Error('Укажите состояние доступа по Wi-Fi');
    if(on&&!addresses().length)throw Error('Подключитесь к Wi-Fi, чтобы пригласить другие устройства');
    if(!on){active?.session.votes.clear();votes.clear();ballotArmed=false;ballotAttempt='';}
    if(!on)await Promise.all([...clients].filter(ws=>ws.partyPublic&&ws.readyState===WebSocket.OPEN).map(ws=>new Promise(resolve=>{
      const timer=setTimeout(resolve,150);ws.send(JSON.stringify({type:'access-closed'}),()=>{clearTimeout(timer);resolve();});
    })));
    await networkAccess.setEnabled(on);
  }
  else if(m.type==='statistics-reset'){if(active||busy)throw Error('Завершите текущий матч перед сбросом статистики');profileStore.resetStatistics();}
  else if(m.type==='kick'){kickPlayer(m.id);}
  else if(m.type==='dismiss-incident'){incident=null;}
  else if(m.type==='execution'){
    // Foreground and suspension requests can arrive out of order over HTTP.
    if(m.revision!==undefined){
      if(!Number.isSafeInteger(m.revision)||m.revision<1)throw Error('Invalid execution revision');
      if(m.revision<=executionRevision)return roomInfo();
      executionRevision=m.revision;
    }
    executionAllowed=!!m.allowed;if(!executionAllowed)await pauseBeforeSuspension();else {applyGamePause();checkSession();}
  }
  else if(m.type==='select'){if(!catalog.some(g=>g.id===m.id))throw Error('Игра не найдена');selected=m.id;}
  else if(m.type==='settings'){const game=catalog.find(g=>g.id===m.id);if(!game)throw Error('Игра не найдена');if(active?.game.id===m.id)throw Error('Вернитесь в лобби для смены настроек');gameSettings[m.id]=controls.settingsFor(game,m.settings);selected=m.id;}
  else if(m.type==='game-action'){if(!active||m.instance!==active.instance)throw Error('Эта игра уже завершена');const action=active.game.hostControls.actions.find(a=>a.id===m.action);if(!action||!action.phases.includes(active.ui?.phase)||(Array.isArray(active.ui?.hostActions)&&!active.ui.hostActions.includes(m.action)))throw Error('Действие сейчас недоступно');await hostCommand(active,m.action);}
  else if(m.type==='retry-start'){if(!active||m.instance!==active.instance||!active.startError)throw Error('Повторный запуск недоступен');active.startError=null;active.session.startRequested=false;checkSession();}
  else if(m.type==='launch'){incident=null;if(!enabled)throw Error('Сначала запустите сервер');if(embedded&&!screens())throw Error('Откройте экран /tv на телевизоре');await launch(m.id||selected);selected=active.game.id;}
  else if(m.type==='stop'){incident=null;if(busy)throw Error('Подождите окончания запуска');stop();}
  else if(m.type==='pause'){if(!executionAllowed&&!m.paused)throw Error('Серверу нужна активная сессия');setPaused(!!m.paused);}
  else throw Error('Неизвестная команда');
  persistRoom(m.type);broadcast();return roomInfo();
}

const players = new Map(), clients = new Set();
const profileStore=new ProfileStore(process.env.PARTY_EPHEMERAL==='1'?null:(process.env.PARTY_DATA_FILE||path.join(ROOT,'data','party.json')));
const bootId=crypto.randomUUID();
const savedRoom=embedded?profileStore.data.room:null;
const votes=new Map(),revoked=new Set(savedRoom?.revoked||[]);
let incident=null;
if(savedRoom){
  selected=catalog.some(g=>g.id===savedRoom.selected)?savedRoom.selected:null;
  for(const game of catalog)gameSettings[game.id]=controls.settingsFor(game,savedRoom.gameSettings?.[game.id]);

}
function persistRoom(event){
  if(!embedded)return;
  profileStore.data.room={running:enabled,selected,gameSettings,votes:Object.fromEntries(votes),revoked:[...revoked],activeGame:active?.game.id||null};
  if(event){const log=profileStore.data.lifecycle||=[];log.push({at:Date.now(),event,game:active?.game.id||null});if(log.length>60)log.shift();}
  profileStore.save();
}
function kickPlayer(id){
  const player=[...players.values()].find(p=>p.id===id);
  if(!player)throw Error('Игрок уже вышел');
  revoked.add(player.token);votes.delete(id);
  const socket=player.socket;player.socket=null;players.delete(player.token);
  if(active){active.ready.delete(id);active.session.setReady(id,false);active.session.vote(id,false);active.session.spectate(id,false);active.child.send({type:'party:kick',id});}
  if(socket){send(socket,{type:'kicked',message:'Ведущий удалил вас из комнаты.'});socket.close(4003,'Removed by host');}
  syncRoster();checkSession();
}
function gameVotes(){return connected().filter(p=>votes.has(p.id)).map(p=>({playerId:p.id,gameId:votes.get(p.id)}));}
const tokenFromCookie=req=>{const item=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('local_party_device='));return item?.slice('local_party_device='.length);};
const publicProfile=p=>p?{id:p.id,token:p.token,name:p.name,hand:p.hand,avatar:p.avatar||null}:null;
const gameBootstrapProfile=p=>p?{id:p.id,token:p.token,name:p.name,hand:p.hand}:null;
let active = null, busy = false, closing = false, testMode=false, botCount=0, testProfiles=[];
function sendTestProfile(ws){while(testProfiles.length<botCount)testProfiles.push(publicProfile(profileStore.register(null,'Бот '+(testProfiles.length+1),'right')));send(ws,{type:'test-profiles',profiles:testProfiles.slice(0,botCount)});}
const local = req => !req.partyPublic&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
const updater=embedded?null:require('./lib/updater').createUpdater({root:ROOT,hostKey,isLocal:local,isBusy:()=>!!active||busy,getPort:()=>PORT,shutdown});
const addresses = () => Object.entries(os.networkInterfaces()).flatMap(([name, list]) => list.filter(x=>x.family==='IPv4'&&!x.internal&&(!embedded||/^en[0-9]+$/.test(name))).map(x=>({name,address:x.address}))).sort((a,b)=>Number(/virtual|vethernet|vpn|wsl/i.test(a.name))-Number(/virtual|vethernet|vpn|wsl/i.test(b.name)));
function sharedURLs(){return embedded&&!networkAccess.enabled?[]:addresses().map(x=>`${scheme}://${x.address}:${embedded?networkAccess.port:PORT}/`);}
function inviteUrl(req){const ips=addresses();const selected=req&&new URL(req.url,'http://localhost').searchParams.get('host');const ip=ips.find(x=>x.address===selected)?.address||ips[0]?.address;return ip&&(!embedded||networkAccess.enabled)?`${scheme}://${ip}:${embedded?networkAccess.port:PORT}/`:`${scheme}://${req?.headers.host||'localhost:'+PORT}/`;}
const connected = () => [...players.values()].filter(p=>p.socket?.readyState===WebSocket.OPEN);
function state(){return {type:'state',bootId,incident,networkEnabled:embedded?networkAccess.enabled:true,votes:gameVotes(),ballot:ballot(catalog,connected(),votes),enabled,executionAllowed,selected,gameSettings,screens:screens(),players:connected().map(({id,name,hand,avatar,testBot})=>({id,name,hand,avatar:avatar||null,testBot:!!testBot,gameReady:!!active?.ready.has(id)})),active:active?{id:active.game.id,instance:active.instance,startError:active.startError||null,settings:gameSettings[active.game.id],participants:connected().map(p=>p.id),ready:[...active.ready],ui:{...(active.ui||{phase:"waiting",endsAt:null,label:"Ожидание"}),serverNow:Date.now()}}:null,busy,catalog,gamePopularity:Object.fromEntries(catalog.map(g=>[g.id,profileStore.data.events.filter(e=>e.game===g.id).length])),totalMatches:profileStore.data.completed||profileStore.data.events.length,leaderboard:profileStore.leaderboard(),lastResult:profileStore.data.events.at(-1)||null,urls:sharedURLs()};}
function send(ws, data){if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<256*1024)ws.send(JSON.stringify(data));}
function eligible(){return connected().filter(p=>active?.ready.has(p.id)&&!p.testBot).map(p=>p.id);}
function sessionState(){return active?{...active.session.view(eligible()),pauseReason:!executionAllowed?'host-background':active.userPaused?'player':null}:undefined;}
function broadcast(){const s=state();s.testMode=testMode;s.botCount=botCount;if(s.active)s.active.session=sessionState();for(const ws of clients)send(ws,s);queueMicrotask(checkBallot);}
function checkBallot(){
 if(!ballotArmed||!enabled||!executionAllowed||active||busy)return;
 if(!screens()&&![...clients].some(c=>c.isHost&&c.readyState===WebSocket.OPEN))return;
 const people=connected().filter(p=>!p.testBot),result=ballot(catalog,people,votes);
 const candidates=result.winner?[result.winner]:(result.candidates||[]).filter(id=>{const g=catalog.find(g=>g.id===id);return people.length>=g.min&&people.length<=g.max;});
 if(!candidates.length)return;
 const signature=JSON.stringify(people.map(p=>[p.id,votes.get(p.id)]).sort());
 if(signature===ballotAttempt)return;
 const winner=candidates[crypto.randomInt(candidates.length)];
 ballotAttempt=signature;selected=winner;
 launch(winner,{autoReady:people.map(p=>p.id)}).catch(e=>{incident={id:crypto.randomUUID(),at:Date.now(),message:'Не удалось запустить выбранную игру: '+e.message};persistRoom('ballot-launch-failed');broadcast();});
}
function hostCommand(run,action){
 return new Promise((resolve,reject)=>{
  const id=crypto.randomUUID();let timer;
  const finish=(error)=>{clearTimeout(timer);run.child.off('message',receive);run.child.off('exit',exited);error?reject(error):resolve();};
  const receive=m=>{if(m?.type==='party:host-result'&&m.id===id)finish(m.ok?null:Error(m.error||'Команда не выполнена'));};
  const exited=()=>finish(Error('Игра остановилась'));
  run.child.on('message',receive);run.child.once('exit',exited);timer=setTimeout(()=>finish(Error('Игра не ответила. Повторите запуск на iPhone.')),9000);
  try{run.child.send({type:'party:host-command',id,action});}catch(e){finish(e);}
 });
}
function checkSession(){
 if(!active)return;const run=active,ids=eligible();if(run.session.shouldExit(ids)){stop();return;}
 const botReady=!run.session.testMode||testProfiles.slice(0,botCount).every(p=>run.ready.has(p.id));
 const humans=connected().filter(p=>!p.testBot),rosterReady=humans.every(p=>run.ready.has(p.id));
 if(!run.startError&&connected().length>=(testMode?1:run.game.min)&&rosterReady&&botReady&&(!run.ui||run.ui.phase==='waiting')&&run.session.shouldStart(ids)){
  if(embedded)hostCommand(run,'start').catch(e=>{if(active===run){run.startError=e.message;broadcast();}});
  else for(const ws of clients)if(ws.isHost)send(ws,{type:'session-start',instance:run.instance});
 }
 broadcast();
}
function json(res, status, value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
function syncRoster(){if(active?.child.connected)active.child.send({type:'party:roster',players:connected().map(publicProfile)});}
async function waitReady(child, port){const until=Date.now()+(embedded?60000:15000);while(Date.now()<until){if(child.exitCode!==null||child.spawnError)throw Error(child.spawnError||'Игровой сервер завершился при запуске.');if(await new Promise(resolve=>{const r=http.get({host:'127.0.0.1',port,path:'/',timeout:350},res=>{res.resume();resolve(res.statusCode===200);});r.on('error',()=>resolve(false));r.on('timeout',()=>r.destroy());}))return;await new Promise(r=>setTimeout(r,100));}throw Error('Игровой сервер не ответил в отведённое время.');}
async function launch(id,{autoReady=[]}={}){
  if(busy||updater?.running)throw Error('Подождите окончания запуска или обновления.');
  const game=catalog.find(g=>g.id===id);if(!game)throw Error('Игра не найдена.');
  if(connected().length<(testMode?1:game.min)||connected().length>game.max)throw Error(`Для этой игры нужно ${testMode?1:game.min}–${game.max} игроков.`);
  busy=true;broadcast();let next;
  // On iPhone never keep two physics isolates alive during a game switch.
  if(embedded&&active){const previous=active;active=null;broadcast();await previous.child.kill();}
  try{
    const port=await freePort(), instance=crypto.randomBytes(8).toString('hex');
    const gameDir=path.join(ROOT,'games',game.engine||id);const env={...process.env,PORT:String(port),PARTY_MANAGED:'1',PARTY_DISPLAY_ONLY:embedded?'1':'0',PARTY_HOST_SETTINGS:JSON.stringify(controls.workerSettings(game,gameSettings[id])),PARTY_GAME_ID:id,PARTY_INSTANCE:instance,PARTY_ROSTER:JSON.stringify(connected().map(gameBootstrapProfile)),PARTY_PLAYER_LIMIT:String(connected().length),PARTY_JOIN_URL:inviteUrl()};
    const statisticsRevision=profileStore.statisticsRevision||0;
    const child=embedded?require('./lib/game-worker.cjs').spawnGame(gameDir,env):spawn(process.execPath,['server.js'],{cwd:gameDir,env,windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
    next={game,port,instance,child,ready:new Set(),userPaused:false,session:new SessionControls(testMode)};for(const id of autoReady)next.session.setReady(id,true);let log='';
    child.on('message',m=>{
      if(m?.type==='party:ui'&&m.ui){const reset=next.ui?.phase==='results'&&m.ui.phase==='waiting';if(reset)next.session.resetReady();next.ui=m.ui;if(active===next){for(const client of clients)send(client,{type:'game-ui',instance,ui:m.ui});if(reset)broadcast();}}
      if(m?.type==='party:presence'&&typeof m.id==='string'){if(m.connected)next.ready.add(m.id);else next.ready.delete(m.id);if(active===next)checkSession();}
      if(m?.type==='party:result'&&m.result?.eventId&&Array.isArray(m.result.players)){if(!next.session.testMode&&profileStore.record(m.result,instance,id,statisticsRevision))broadcast();}
    });
    child.on('error',e=>{child.spawnError=e.message;console.error('Game worker:',e.stack);});
    for(const stream of [child.stdout,child.stderr])stream.on('data',d=>{log=(log+d).slice(-8000);console.log(`[${id}] ${d.toString().trim()}`);});
    child.on('exit',code=>{if(active===next&&!closing){active=null;incident={id:crypto.randomUUID(),at:Date.now(),message:'Игра '+game.title+' неожиданно остановилась. Игроки остаются в комнате; можно запустить новый раунд.'};persistRoom('worker-exit:'+code+':'+log.slice(-500));broadcast();}});
    try{await waitReady(child,port);}catch(e){throw Error(`${e.message} ${log.slice(-700)}`);}
    const previous=active;active=next;selected=game.id;votes.clear();ballotArmed=false;ballotAttempt='';metrics.gameStarts++;if(!executionAllowed||!enabled){active.session.setPaused(true);child.send({type:'party:pause',paused:true});}syncRoster();previous?.child.kill();
  }catch(e){next?.child.kill();throw e;}finally{busy=false;persistRoom('game-launch');broadcast();}
}
function stop(){ballotArmed=false;ballotAttempt='';votes.clear();const old=active;active=null;old?.child.kill();persistRoom('game-stop');broadcast();}
function transform(text, type, prefix, req){
  if(type.includes('text/html')){
    if(!/<head\b/i.test(text))text=text.replace(/<html([^>]*)>/i,'<html$1><head>').replace(/<body([^>]*)>/i,'</head><body$1>');
    text=text.replace(/((?:src|href|action)\s*=\s*["'])\/(?!\/)/gi,`$1${prefix}/`);
    text=text.replace(/<head([^>]*)>/i,`<head$1>${APP_HEAD}<base href="${prefix}/"><script src="/browser-compat.js"></script><script src="/game-clock-client.js"></script><script src="/game-art.js"></script><script src="/game-feel.js"></script><script defer src="/game-art-dom.js"></script><script src="/bridge.js" data-prefix="${prefix}"></script>`);
    text=text.replace(/<\/head>/i,'<link rel="stylesheet" href="/game-polish.css"><link rel="stylesheet" href="/motion.css"><link rel="stylesheet" href="/game-feel.css"><script defer src="/motion.js"></script></head>');
  }
  if(type.includes('text/css'))text=cssFallbacks(text);
  if(type.includes('text/html'))text=text.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi,(_,a,b,c)=>a+cssFallbacks(b)+c);
  if(type.includes('javascript')||type.includes('text/html'))text=text.replace(/\bio\(\)/g,`partyIO({path:'${prefix}/socket.io'})`);
  return text;
}
const handler=async(req,res)=>{
  if(updater&&await updater.route(req,res))return;
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/manage'){
    if(!local(req)||req.headers.authorization!=='Bearer '+hostKey)return json(res,403,{error:'Нет доступа к настройкам сервера'});
    if(req.method==='GET')return json(res,200,roomInfo());
    if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
    let body='';req.on('data',d=>{body+=d;if(body.length>4096)req.destroy();});
    req.on('end',async()=>{try{json(res,200,await manage(JSON.parse(body)));}catch(e){json(res,400,{error:e.message});}});return;
  }
  if(embedded&&!enabled&&url.pathname!=='/api/health')return json(res,503,{error:'Сервер остановлен. Запустите сессию в приложении iPhone.'});
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
    if(!tvAccess(req)&&[hostPath,'/host.html','/index.html'].includes(canonical(match[2]||'/')))return json(res,403,{error:'Откройте общий экран /tv.'});
    if(['/api/info','/api/config','/info'].includes(match[2])){
      // Keep each game's metadata but make every invite point to the shared lobby.
      const r=http.get({host:'127.0.0.1',port:run.port,path:sub},up=>{let body='';up.on('data',d=>body+=d);up.on('end',async()=>{try{const data=JSON.parse(body);const join=inviteUrl(req);for(const k of ['controllerUrl','joinUrl','join_url','playUrl'])if(k in data)data[k]=join;if('qr' in data)data.qr=await QRCode.toDataURL(join);if('port' in data)data.port=embedded?networkAccess.port:PORT;if('candidates' in data)data.candidates=addresses().map(x=>({...x,url:`${scheme}://${x.address}:${embedded?networkAccess.port:PORT}/`}));json(res,up.statusCode,data);}catch{res.writeHead(up.statusCode,{'Content-Type':'application/json'});res.end(body);}});});r.on('error',()=>json(res,502,{error:'Сервер игры недоступен'}));return;
    }
    if(match[2]==='/qr.png'){res.setHeader('Content-Type','image/png');return res.end(await qrBuffer(inviteUrl(req)));}
    const headers={...req.headers,host:`127.0.0.1:${run.port}`,'x-party-local':tvAccess(req)?'1':'0'};delete headers['accept-encoding'];
    const upstream=http.request({host:'127.0.0.1',port:run.port,path:sub,method:req.method,headers},up=>{
      const type=up.headers['content-type']||'';
      const out={...up.headers};delete out['content-length'];delete out['transfer-encoding'];out['cache-control']='no-store';
      if(out.location?.startsWith('/'))out.location=prefix+out.location;
      if(type.includes('text/html')||type.includes('javascript')||type.includes('text/css')){let body='';up.on('data',d=>body+=d);up.on('end',()=>{res.writeHead(up.statusCode,out);res.end(transform(body,type,prefix,req));});}
      else{res.writeHead(up.statusCode,out);up.pipe(res);}
    });upstream.on('error',()=>{if(!res.headersSent)json(res,502,{error:'Сервер игры недоступен'});else res.end();});req.pipe(upstream);return;
  }
  if(url.pathname==='/api/qr'){res.setHeader('Content-Type','image/png');const allowed=sharedURLs();const target=allowed.includes(url.searchParams.get('url'))?url.searchParams.get('url'):`${scheme}://${req.headers.host}/`;return res.end(await qrBuffer(target,{margin:1,width:240}));}
  if(url.pathname==='/api/health')return json(res,200,{ok:true,pid:process.pid,build:'sports-siege-alpha.1'});
  if(url.pathname.startsWith('/assets/')){
    let name;try{name=decodeURIComponent(url.pathname).slice(1);if(/^assets\/games\/(curling|bowling|swarm_gate|peek_shoot)[.]webp$/.test(name))name=name.replace(/[.]webp$/,'.png');}catch{return json(res,400,{error:'Invalid path'});}
    const root=path.join(ROOT,'public','assets'),target=path.resolve(ROOT,'public',name);
    if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile())return json(res,404,{error:'Не найдено'});
    const mime={'.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2','.json':'application/json'}[path.extname(target)];if(!mime)return json(res,404,{error:'Не найдено'});
    res.writeHead(200,{'Content-Type':mime,'Cache-Control':'public,max-age=3600','X-Content-Type-Options':'nosniff'});fs.createReadStream(target).pipe(res);return;
  }
  const isTV=url.pathname==='/tv',isHost=url.pathname==='/host';
  if(isTV)res.setHeader('Set-Cookie',`party_display=${displayKey}; Path=/; HttpOnly; SameSite=Strict`);
  if(isHost&&(embedded||!local(req)))return json(res,403,{error:'Экран ведущего открывается на компьютере, запустившем лаунчер.'});
  const files={'/updates.js':'updates.js','/updates.css':'updates.css','/site.webmanifest':'site.webmanifest','/browserconfig.xml':'browserconfig.xml','/favicon.ico':'favicon.ico','/game-feel.js':'game-feel.js','/game-feel.css':'game-feel.css','/motion.css':'motion.css','/motion.js':'motion.js','/browser-compat.js':'browser-compat.js','/play':'index.html','/tv':'tv.html','/tv-layout.js':'tv-layout.js','/tv.js':'tv.js','/tv.css':'tv.css','/':'index.html','/host':'index.html','/app.js':'app.js','/style.css':'style.css','/game-art-dom.js':'game-art-dom.js','/game-art.js':'game-art.js','/bridge.js':'bridge.js','/game-polish.css':'game-polish.css','/refresh.css':'refresh.css','/glass.css':'glass.css','/game-clock-client.js':'game-clock-client.js','/test-bot.js':'test-bot.js','/ux.css':'ux.css','/catalog-previews.css':'catalog-previews.css','/catalog-previews.js':'catalog-previews.js','/value-fit.js':'value-fit.js','/bots.js':'bots.js','/fresh.css':'fresh.css'};
  const file=files[url.pathname];if(!file)return json(res,404,{error:'Не найдено'});
  if(embedded&&!staticCache.has(file))staticCache.set(file,fs.readFileSync(path.join(ROOT,'public',file)));let content=embedded?staticCache.get(file):fs.readFileSync(path.join(ROOT,'public',file));
  if(file==='index.html')content=content.toString().replace('/*BOOT*/',`window.PARTY_HOST_KEY=${JSON.stringify(isHost?hostKey:null)};`);
  if(file==='tv.html')content=content.toString().replace('/*BOOT*/',`window.PARTY_DISPLAY_KEY=${JSON.stringify(displayKey)};`);
  if(file==='index.html'||file==='tv.html')content=content.toString().replace('</head>',`${APP_HEAD}${file==='index.html'&&!embedded?'<link rel="stylesheet" href="/updates.css"><script defer src="/updates.js"></script>':''}</head>`);
  if(file.endsWith('.css'))content=cssFallbacks(content.toString());
  const ext=path.extname(file);res.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.xml':'application/xml; charset=utf-8','.ico':'image/x-icon'}[ext],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(content);
};
const safeHandler=(req,res)=>Promise.resolve(handler(req,res)).catch(e=>{console.error('HTTP:',e.message);if(!res.headersSent)json(res,500,{error:'Не удалось обработать запрос'});else res.end();});
const server=tlsFile?require('https').createServer({pfx:fs.readFileSync(tlsFile),passphrase:process.env.PARTY_TLS_PASSWORD||''},safeHandler):http.createServer(safeHandler);
server.on('connection',socket=>socket.setNoDelay(true));
const wss=new WebSocketServer({noServer:true,maxPayload:196608});
function upgrade(req,socket,head){
  const url=new URL(req.url,'http://localhost');
  if(req.headers.origin&&req.headers.origin!==`${scheme}://${req.headers.host}`)return socket.destroy();
  if(embedded&&!enabled)return socket.destroy();
  if(url.pathname==='/lobby'){if(req.headers.origin&&req.headers.origin!==`${scheme}://${req.headers.host}`){socket.destroy();return;}return wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));}
  const run=active,prefix=run?`/games/${run.game.id}/`:'';
  if(!run||!url.pathname.startsWith(prefix))return socket.destroy();
  const upstream=net.connect(run.port,'127.0.0.1',()=>{const headers={...req.headers,host:`127.0.0.1:${run.port}`,'x-party-local':tvAccess(req)?'1':'0'};upstream.write(`${req.method} ${req.url.slice(prefix.length-1)} HTTP/1.1\r\n`+Object.entries(headers).map(([k,v])=>`${k}: ${v}\r\n`).join('')+'\r\n');if(head.length)upstream.write(head);socket.pipe(upstream).pipe(socket);});
  upstream.setNoDelay(true);
  upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());socket.on('close',()=>upstream.destroy());upstream.on('close',()=>socket.destroy());
}
server.on('upgrade',upgrade);
const networkAccess=new (require('./lib/network-access').NetworkAccess)(safeHandler,upgrade,{port:requestedPort||8080});
wss.on('connection',(ws,req)=>{
  clients.add(ws);ws.partyPublic=!!req.partyPublic;ws.alive=true;ws.on('pong',()=>ws.alive=true);const initial=state();initial.testMode=testMode;initial.botCount=botCount;if(initial.active)initial.active.session=sessionState();send(ws,initial);
  ws.on('message',async raw=>{try{
    const m=JSON.parse(raw);
    if(m.type==='ping')return send(ws,{type:'pong'});
    if(m.type==='test-mode'||m.type==='bots-set'){if(!ws.isHost)throw Error('Тестовый режим включает ведущий.');if(active)throw Error('Вернитесь в лобби перед сменой режима.');const requested=m.type==='bots-set'?Number(m.count):(m.enabled?1:0);if(!Number.isInteger(requested)||requested<0||requested>15)throw Error('Можно добавить от 0 до 15 ботов.');if(requested+connected().filter(p=>!p.testBot).length>16)throw Error('В комнате максимум 16 игроков.');botCount=requested;testMode=botCount>0;for(const c of clients)if(c.isHost)sendTestProfile(c);broadcast();return;}
    if(['ready-set','spectate-set','pause-set','exit-vote'].includes(m.type)){
      if(!active||m.instance!==active.instance||!ws.player||ws.player.socket!==ws||!active.ready.has(ws.player.id))throw Error('Сначала подключитесь к игре.');
      const id=ws.player.id;
      if(m.type==='ready-set'){if(active.ui&&active.ui.phase!=='waiting')throw Error('Матч уже начался.');active.session.setReady(id,!!m.ready);}
      if(m.type==='spectate-set')active.session.spectate(id,!!m.spectating);
      if(m.type==='exit-vote')active.session.vote(id,!!m.vote);
      if(m.type==='pause-set'){if(!executionAllowed&&!m.paused)throw Error('Сервер на паузе');setPaused(m.paused);}
      checkSession();return;
    }
    if(m.type==='display'){if(m.key!==displayKey||!tvAccess(req)){send(ws,{type:'error',code:'DISPLAY_AUTH',message:'Экран обновляет подключение'});return;}ws.isDisplay=true;send(ws,{type:'display-ok'});sendTestProfile(ws);broadcast();return;}
    if(m.type==='host'){if(embedded||!local(req)||m.key!==hostKey)throw Error('Нет доступа ведущего.');ws.isHost=true;send(ws,{type:'host-ok'});sendTestProfile(ws);broadcast();return;}
    if(m.type==='vote-game'){if(!ws.player||ws.player.socket!==ws)throw Error('Сначала войдите в комнату');if(m.id!==null&&!catalog.some(g=>g.id===m.id))throw Error('Игра не найдена');m.id===null?votes.delete(ws.player.id):votes.set(ws.player.id,m.id);ballotArmed=m.id!==null;ballotAttempt='';persistRoom();broadcast();return;}
    if(m.type==='join'){
      if(!m.freshIdentity&&revoked.has(m.token||tokenFromCookie(req))){send(ws,{type:'kicked',message:'Ведущий удалил вас из комнаты.'});ws.close(4003,'Removed by host');return;}
      const saved=m.freshIdentity?null:profileStore.get(m.token||tokenFromCookie(req));
      if(!m.freshIdentity&&m.token&&!saved){send(ws,{type:'profile-required'});return;}
      const name=String(m.name||saved?.name||'').normalize('NFC').trim().replace(/[<>\x00-\x1f]/g,'').slice(0,24);
      if(!name)throw Error('Введите имя.');
      const avatar=Object.prototype.hasOwnProperty.call(m,'avatar')?normalizeAvatar(m.avatar):saved?.avatar||null;
      let p=saved&&players.get(saved.token);
      if([...players.values()].some(other=>other!==p&&other.name.toLocaleLowerCase()===name.toLocaleLowerCase()&&other.socket?.readyState===WebSocket.OPEN))throw Error('Это имя уже занято. Добавь, например, первую букву фамилии.');
      if(!p){if(connected().length>=16)throw Error('В лобби уже 16 игроков.');const stored=profileStore.register(saved?.token,name,m.hand||saved?.hand||'right',avatar);p=publicProfile(stored);players.set(p.token,p);}
      if(ws.player&&ws.player!==p&&ws.player.socket===ws)throw Error('Этот контроллер уже вошёл в комнату');
      if(p.socket&&p.socket!==ws){send(p.socket,{type:'replaced'});p.socket.close();}
      p.name=name;p.hand=(m.hand||saved?.hand)==='left'?'left':'right';p.avatar=avatar;p.testBot=testProfiles.some(bot=>bot.id===p.id);p.socket=ws;ws.player=p;
      if(saved)profileStore.register(p.token,p.name,p.hand,p.avatar);syncRoster();
      send(ws,{type:'joined',token:p.token,id:p.id,name:p.name,hand:p.hand,avatar:p.avatar||null});broadcast();return;
    }
    if(m.type==='game-status'&&ws.player?.socket===ws&&active&&m.instance===active.instance){if(m.status==='ready')active.ready.add(ws.player.id);else active.ready.delete(ws.player.id);checkSession();return;}
    if(m.type==='launch'||m.type==='stop'){if(!ws.isHost)throw Error('Игру выбирает ведущий.');if(m.type==='launch')await launch(m.id);else{if(busy||updater?.running)throw Error('Подождите окончания запуска или обновления.');stop();}return;}
  }catch(e){send(ws,{type:'error',message:e.message});}});
  ws.on('close',()=>{clients.delete(ws);if(ws.player?.socket===ws){ws.player.socket=null;ws.player.disconnectedAt=Date.now();}checkSession();broadcast();});
});
const startRelay=setInterval(()=>{if(!embedded)require('./lib/start-delivery').relayStart(active,clients,send);},400);
const heartbeat=setInterval(()=>{for(const ws of clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}for(const [token,p] of players)if(!p.socket&&Date.now()-p.disconnectedAt>24*3600000)players.delete(token);},10000);
// Port 0 asks the OS to allocate and bind a free port in one atomic operation.
// An explicitly requested port is only a preference: never fail just because it is busy.
persistRoom('process-start');
const bindAddress=embedded?'127.0.0.1':'0.0.0.0';
const preferredInternal=embedded?Number(process.env.PARTY_INTERNAL_PORT||8081):requestedPort;
let listeningPort = Number.isInteger(preferredInternal)&&preferredInternal>=0&&preferredInternal<=65535?preferredInternal:0;
server.once('listening',()=>{PORT=server.address().port;if(process.env.PARTY_PORT_FILE)fs.writeFileSync(process.env.PARTY_PORT_FILE,String(PORT));console.log(`\nLOCAL PARTY — ${scheme}://localhost:${PORT}/host`);for(const x of (embedded?[]:addresses()))console.log(`Players: ${scheme}://${x.address}:${PORT}/ (${x.name})`);if(!embedded&&process.env.PARTY_NO_BROWSER!=='1'){const url=`${scheme}://localhost:${PORT}/host`;if(process.platform==='win32')spawn('rundll32',['url.dll,FileProtocolHandler',url],{windowsHide:true});else if(process.platform==='darwin')spawn('open',[url]);}});
server.on('error',e=>{
  if(listeningPort!==0&&['EADDRINUSE','EACCES'].includes(e.code)){
    console.log(`Порт ${listeningPort} недоступен — выбираю свободный.`);
    listeningPort=0;server.listen(0,bindAddress);return;
  }
  console.error('Не удалось запустить локальный сервер:',e);process.exit(1);
});
server.listen(listeningPort,bindAddress);
function shutdown(){closing=true;clearInterval(heartbeat);clearInterval(startRelay);active?.child.kill();for(const ws of clients)ws.terminate();networkAccess.setEnabled(false);server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1000).unref();}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
let previousTick=performance.now(),nativeWorkUnits=0;
setInterval(()=>{const now=performance.now(),delta=now-previousTick;previousTick=now;
  if(incident&&Date.now()-incident.at>45000){incident=null;broadcast();}
  metrics.maxLoopDelayMs=Math.max(metrics.maxLoopDelayMs,Math.round(Math.max(0,delta-1000)));
  if(embedded&&enabled&&executionAllowed){servedSeconds+=Math.min(1.5,delta/1000);nativeWorkUnits++;}
  global.__partyReportProgress?.(nativeWorkUnits,enabled&&executionAllowed);
},1000).unref();
