const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),WS=require('ws');
const {ProfileStore}=require('../lib/profile-store');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<300;i++){if(await fn())return;await delay(20);}throw Error(label);}

test('Wi-Fi listener is opt-in, isolated from the room, and closes without losing the match or identities',{timeout:45000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'party-network-')),file=path.join(dir,'party.json'),store=new ProfileStore(file);
 const known=store.register(null,'Знакомый игрок','left');store.record({eventId:'one',players:[{id:known.id,score:3,won:true}]},'old','tanks');
 // Model an iPhone interface using this machine's REAL LAN address in this
 // isolated child only. Production keeps its enN filter and opt-in listener.
 const bootstrap=`const os=require('node:os');const original=os.networkInterfaces();const lan=Object.values(original).flat().filter(x=>x.family==='IPv4'&&!x.internal);os.networkInterfaces=()=>({...original,en0:lan});require('./server.js');`;
 const child=spawn(process.execPath,['-e',bootstrap],{cwd:path.join(__dirname,'..'),env:{...process.env,PARTY_EMBEDDED:'1',PARTY_ADMIN_KEY:'test',PARTY_DATA_FILE:file,PARTY_PORT:'0',PARTY_INTERNAL_PORT:'0',PARTY_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});
 let log='',base;const sockets=[];child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
 async function manage(command,status=200,origin=base){const res=await fetch(origin+'/api/manage',{method:command?'POST':'GET',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:command?JSON.stringify(command):undefined});const data=await res.json();assert.equal(res.status,status,JSON.stringify(data));return data;}
 async function connect(origin=base,data){const ws=new WS(origin.replace('http','ws')+'/lobby');sockets.push(ws);ws.messages=[];ws.on('error',()=>{});ws.on('message',b=>{const m=JSON.parse(b);ws.messages.push(m);if(m.type==='joined')ws.profile=m;});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});if(data){ws.send(JSON.stringify({...data,type:'join'}));await until(()=>ws.profile,'join');}return ws;}
 try {
  await until(()=>/localhost:(\d+)/.test(log),'startup');base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
  let state=await manage();assert.equal(state.enabled,true);assert.equal(state.networkEnabled,false);assert.deepEqual(state.urls,[]);assert.equal(state.totalMatches,1);
  assert.equal((await fetch(base+'/play')).status,200);const html=await(await fetch(base+'/tv')).text();const display=await connect();display.send(JSON.stringify({type:'display',key:JSON.parse(html.match(/PARTY_DISPLAY_KEY=(.*?);/)[1])}));await until(async()=>(await manage()).screens===1,'local TV ready');
  const host=await connect(base,{token:known.token,name:known.name}),second=await connect(base,{name:'Второй'});assert.equal(host.profile.id,known.id);
  const unknown=await connect();unknown.send(JSON.stringify({type:'join',token:'expired',name:'Old name'}));await until(()=>unknown.messages.some(m=>m.type==='profile-required'),'expired profile');assert.equal(unknown.profile,undefined);
  const ips=Object.values(os.networkInterfaces()).flat().filter(x=>x.family==='IPv4'&&!x.internal);
  if(ips.length)await assert.rejects(fetch('http://'+ips[0].address+':'+new URL(base).port+'/api/health',{signal:AbortSignal.timeout(1200)}),'loopback listener must not accept LAN requests');
  state=await manage({type:'network-set',enabled:true});assert.equal(state.networkEnabled,true);assert.ok(state.urls.length);
  const publicPort=new URL(state.urls[0]).port,publicBase='http://127.0.0.1:'+publicPort;
  await manage(undefined,403,publicBase);assert.equal((await fetch(publicBase+'/play')).status,200);
  const guest=await connect(publicBase,{name:'Гость'});const identity=guest.profile;
  const run=(await manage({type:'launch',id:'tanks'})).active;await manage({type:'statistics-reset'},400);
  // Closing LAN must not turn a partial exit vote into unanimous consent.
  for(const player of [host,second,guest])player.send(JSON.stringify({type:'game-status',status:'ready',instance:run.instance}));
  await until(async()=>(await manage()).active.ready.length===3,'controllers registered');
  for(const player of [host,second])player.send(JSON.stringify({type:'exit-vote',vote:true,instance:run.instance}));
  await until(async()=>(await manage()).active.session.exitVotes.length===2,'partial exit vote');
  // Both lobby sockets and proxied game sockets must close on the public listener.
  const gameSocket=new WS(publicBase.replace('http','ws')+'/games/tanks/ws');sockets.push(gameSocket);gameSocket.on('error',()=>{});await new Promise((r,j)=>{gameSocket.once('open',r);gameSocket.once('error',j);});
  for(let n=0;n<3;n++){
   state=await manage({type:'network-set',enabled:false});assert.equal(state.enabled,true);assert.equal(state.active.instance,run.instance);assert.deepEqual(state.urls,[]);assert.equal(state.incident,null);
   assert.equal((await fetch(base+'/play')).status,200);assert.equal(display.readyState,WS.OPEN);assert.equal(host.readyState,WS.OPEN);
   await until(()=>guest.readyState===WS.CLOSED&&gameSocket.readyState===WS.CLOSED,'guest and game socket closed');
   await assert.rejects(fetch(publicBase+'/play',{signal:AbortSignal.timeout(1200)}));
   state=await manage({type:'network-set',enabled:true});assert.equal(new URL(state.urls[0]).port,publicPort);assert.equal(state.active.instance,run.instance);
  }
  assert.ok(guest.messages.some(m=>m.type==='access-closed'),'intentional disconnect has a distinct event');
  const resumed=await connect(publicBase,{token:identity.token,name:identity.name});assert.equal(resumed.profile.id,identity.id);
  await manage({type:'stop'});state=await manage({type:'statistics-reset'});assert.equal(state.totalMatches,0);assert.deepEqual(state.leaderboard,[]);assert.equal(state.lastResult,null);assert.equal(state.players.length,3);assert.equal(state.screens,1);
  const saved=new ProfileStore(file);assert.equal(saved.get(known.token).id,known.id);assert.equal(saved.get(identity.token).id,identity.id);assert.equal(saved.get(known.token).stats.played,0);
  await manage({type:'network-set',enabled:false});
 } finally {for(const ws of sockets)ws.terminate();const exited=new Promise(r=>child.once('exit',r));if(child.exitCode===null){child.kill('SIGKILL');await exited;}fs.rmSync(dir,{recursive:true,force:true});}
});
