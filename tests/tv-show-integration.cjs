'use strict';
// Actual localhost HTTP/WebSocket/server/worker checks; never touches real profiles.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {spawn}=require('node:child_process'),{WebSocket}=require('ws');
const ROOT=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'lp-show-test-'));
const dataFile=path.join(dir,'party.json'),portFile=path.join(dir,'port'),key=crypto.randomBytes(24).toString('hex');
const sockets=[],report=[];let server,base='',logs='';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,timeout=15000){const end=Date.now()+timeout;while(Date.now()<end){const value=await fn();if(value)return value;await sleep(25);}throw Error('Timeout: '+fn.toString().slice(0,150));}
function check(name,value){assert.ok(value,name);report.push({name,passed:true});}
async function manage(command,token=key){const res=await fetch(base+'/api/manage',{method:command?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:command?JSON.stringify(command):undefined});return {status:res.status,data:await res.json()};}
async function socket(headers={}){const ws=new WebSocket(base.replace('http:','ws:')+'/lobby',{headers:{Origin:base,...headers}});ws.messages=[];ws.on('message',raw=>ws.messages.push(JSON.parse(raw)));ws.on('error',()=>{});sockets.push(ws);await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});return ws;}
(async()=>{
 try{
  fs.writeFileSync(dataFile,JSON.stringify({version:1,players:[],events:[]}));
  server=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:key,PARTY_DATA_FILE:dataFile,PARTY_PORT_FILE:portFile,PARTY_EMBEDDED:'0'},stdio:['ignore','pipe','pipe']});
  for(const stream of [server.stdout,server.stderr])stream.on('data',d=>logs=(logs+d).slice(-30000));
  await until(()=>{if(server.exitCode!==null)throw Error('Server exited: '+logs);return fs.existsSync(portFile);});base='http://127.0.0.1:'+fs.readFileSync(portFile,'utf8').trim();
  check('manage still rejects unauthenticated requests',(await fetch(base+'/api/manage')).status===403);
  check('manage rejects wrong bearer',(await manage({type:'tv-overlay',mode:'qr'},'wrong')).status===403);
  let current=await manage();check('real catalog contains all games',current.data.catalog.length>=30);check('presentation starts hidden',current.data.tv.mode==='none');
  const total=current.data.catalog.length;let r=await manage({type:'tv-focus',number:total});check('ordinal focus reaches last real game',r.status===200&&r.data.tv.focusNumber===total&&!r.data.active);
  r=await manage({type:'tv-focus',direction:1});check('next wraps without starting a game',r.status===200&&r.data.tv.focusNumber===1&&!r.data.active);
  for(const command of [{type:'tv-focus',number:0},{type:'tv-focus',direction:3},{type:'tv-options',options:{admin:true}},{type:'tv-overlay',mode:'hack'}])check('invalid command rejected: '+JSON.stringify(command),(await manage(command)).status===400);
  r=await manage({type:'tv-options',options:{autoPodium:true,effects:false}});check('display options persisted',r.status===200&&JSON.parse(fs.readFileSync(dataFile,'utf8')).tvOptions.autoPodium===true);
  check('options did not create scores',JSON.parse(fs.readFileSync(dataFile,'utf8')).events.length===0);
  const tvResponse=await fetch(base+'/tv'),html=await tvResponse.text(),cookie=tvResponse.headers.get('set-cookie').split(';')[0];
  const displayKey=/window\.PARTY_DISPLAY_KEY="([a-f0-9]+)"/.exec(html)?.[1];check('TV gets a display credential, not admin bearer',!!displayKey&&!html.includes(key));
  const display=await socket({Cookie:cookie});display.send(JSON.stringify({type:'display',key:displayKey}));await until(()=>display.messages.some(m=>m.type==='display-ok'));check('display handshake preserved',true);
  r=await manage({type:'tv-overlay',mode:'qr'});check('authorized QR is broadcast to TV',r.status===200);await until(()=>display.messages.some(m=>m.type==='state'&&m.tv?.mode==='qr'));
  const qrResponse=await fetch(base+'/api/qr?size=large&url='+encodeURIComponent(r.data.urls[0]));const qr=Buffer.from(await qrResponse.arrayBuffer());check('large QR is a 720px PNG',qrResponse.status===200&&qr.readUInt32BE(16)===720&&qr.readUInt32BE(20)===720);
  display.send(JSON.stringify({type:'tv-overlay',mode:'none'}));await sleep(70);check('display cannot change admin presentation',(await manage()).data.tv.mode==='qr');
  const people=[];
  for(const name of ['Test One','Test Two']){const ws=await socket();ws.send(JSON.stringify({type:'join',name,hand:'right'}));const joined=await until(()=>ws.messages.find(m=>m.type==='joined'));people.push(joined);}
  sockets.at(-1).send(JSON.stringify({type:'tv-overlay',mode:'none'}));await sleep(70);check('guest cannot change admin presentation',(await manage()).data.tv.mode==='qr');
  check('two actual controllers joined',(await manage()).data.players.length===2);
  for(const id of ['bowling','push']){
   r=await manage({type:'launch',id});check('real worker starts: '+id,r.status===200&&r.data.active?.id===id);
   check('new game clears manual overlay: '+id,r.data.tv.mode==='none');
   check('browsing cannot replace an active match: '+id,(await manage({type:'tv-focus',direction:1})).status===400);
   const g=r.data.catalog.find(x=>x.id===id),player=await fetch(base+'/games/'+id+g.player),screen=await fetch(base+'/games/'+id+g.host,{headers:{Cookie:cookie}});
   check('real player/display pages reachable: '+id,player.status===200&&screen.status===200);
   r=await manage({type:'pause',paused:true});check('pause state remains authoritative: '+id,r.status===200&&r.data.active.session.paused);
   r=await manage({type:'tv-overlay',mode:'qr'});check('QR can cover paused game: '+id,r.status===200&&r.data.tv.mode==='qr');
   r=await manage({type:'pause',paused:false});check('resume hides covering card: '+id,r.status===200&&r.data.tv.mode==='none');
   r=await manage({type:'stop'});check('stop returns same players to lobby: '+id,r.status===200&&!r.data.active&&r.data.players.length===2);
  }
  check('test never awarded synthetic victories',JSON.parse(fs.readFileSync(dataFile,'utf8')).events.length===0);
 }finally{
  for(const ws of sockets)ws.terminate();if(server){server.kill('SIGTERM');await Promise.race([new Promise(r=>server.once('exit',r)),sleep(1800)]);if(server.exitCode===null)server.kill('SIGKILL');}
  const out=path.join(ROOT,'.localparty-build/ci');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'tv-show-network.json'),JSON.stringify({transport:'real localhost HTTP/WebSocket and workers',physicalIOS:false,checks:report},null,2));fs.writeFileSync(path.join(out,'tv-show-network.log'),logs);fs.rmSync(dir,{recursive:true,force:true});
 }
 console.log(JSON.stringify({passed:report.length,physicalIOS:false}));
})().catch(error=>{console.error(error);console.error(logs.slice(-3000));process.exitCode=1;});
