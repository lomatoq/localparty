'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {createSnapshotSender,snapshotControl}=require('../lib/snapshot-sender');
const {NetworkAccess}=require('../lib/network-access'),{ProfileStore}=require('../lib/profile-store');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
class Socket extends EventEmitter{constructor(){super();this.readyState=1;this.bufferedAmount=0;this.messages=[];}send(raw){this.messages.push(JSON.parse(raw));}close(code){this.code=code;this.readyState=3;this.emit('close');}}
test('ACK window bounds hidden TCP backlog and delivers latest state after acknowledgement',()=>{
 const ws=new Socket(),sender=createSnapshotSender();snapshotControl(ws,{type:'party:snapshots',version:1});
 for(let n=0;n<100;n++)sender.snapshot(ws,JSON.stringify({type:'state',n}));
 assert.equal(ws.messages.length,2);assert.deepEqual(ws.messages.map(m=>m.n),[0,1]);
 sender.event(ws,{type:'result',winner:'a'});assert.equal(ws.messages.at(-1).type,'result');
 snapshotControl(ws,{type:'party:ack',seq:9999});assert.equal(ws.messages.length,3);
 snapshotControl(ws,{type:'party:ack',seq:2});assert.equal(ws.messages.at(-1).n,99);assert.equal(ws.messages.length,4);ws.close();
});
test('unacknowledged snapshots disconnect using real time with no buffered bytes',async()=>{
 const ws=new Socket(),sender=createSnapshotSender({retryMs:5,maxLagMs:25});snapshotControl(ws,{type:'party:snapshots',version:1});sender.snapshot(ws,'{}');await wait(65);assert.equal(ws.code,1013);
});
test('lobby full state discards pending game-ui while the ACK window is full',()=>{
 const ws=new Socket(),sender=createSnapshotSender();snapshotControl(ws,{type:'party:snapshots',version:1});
 sender.snapshot(ws,'{"type":"state","phase":1}');sender.snapshot(ws,'{"type":"game-ui","phase":1}','game-ui');
 sender.snapshot(ws,'{"type":"game-ui","phase":2}','game-ui');sender.discard(ws,'game-ui');sender.snapshot(ws,'{"type":"state","phase":3}');
 snapshotControl(ws,{type:'party:ack',seq:2});assert.equal(ws.messages.length,3);assert.equal(ws.messages.at(-1).phase,3);ws.close();
});
test('network address reconciliation preserves desired state across absence and suspension',async t=>{
 let ip='10.0.0.1';const access=new NetworkAccess((q,s)=>s.end('ok'),()=>{},{port:0,address:()=>ip});t.after(()=>access.setEnabled(false));
 await access.setEnabled(true);assert(access.enabled);const first=access.server;ip='10.0.0.2';await access.reconcile();assert.notEqual(access.server,first);assert.equal(access.boundAddress,ip);
 ip=null;await access.reconcile();assert(!access.enabled);assert(access.desired);ip='10.0.0.3';await access.reconcile();assert(access.enabled);
 await access.setSuspended(true);assert(!access.enabled);await access.setSuspended(false);await access.tail;assert(access.enabled);
 await access.setEnabled(false);await access.reconcile();assert(!access.enabled);assert(!access.desired);
});
test('late disable/suspension does not wait for provisioning or publish a stale address',async()=>{
 let ip='10.0.0.1',resolve,started;const entered=new Promise(r=>started=r);
 const access=new NetworkAccess(()=>{},()=>{},{port:0,address:()=>ip,provision:()=>{started();return new Promise(r=>resolve=r);}});
 const opening=access.setEnabled(true);await entered;
 await Promise.race([access.setSuspended(true),wait(100).then(()=>{throw Error('suspension blocked on provisioning');})]);
 await access.setEnabled(false);ip='10.0.0.2';resolve(null);await opening;assert(!access.enabled);assert(!access.desired);
});
test('runtime listener errors close only the public listener and can recover',async t=>{
 const access=new NetworkAccess((q,s)=>s.end(),()=>{},{port:0,address:()=> '10.0.0.1'});t.after(()=>access.setEnabled(false));await access.setEnabled(true);
 access.server.emit('error',Error('injected listener failure'));await access.tail;assert(!access.enabled);assert(access.desired);access.retryAt=0;await access.reconcile();assert(access.enabled);
});
function storeFixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'heypals-lan-store-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return path.join(dir,'party.json');}
test('deferred writes preserve latest reset, migrate photos and collect unreferenced files',async t=>{
 const file=storeFixture(t),s=new ProfileStore(file,{deferred:true}),p=s.register(null,'A','right','photo-one');
 const first=s.flush();s.record({eventId:'one',players:[{id:p.id,score:10,won:true}]},'session','kart');s.resetStatistics();s.register(p.token,'B','left','photo-two');await first;await s.flush();
 const disk=JSON.parse(fs.readFileSync(file));assert(!disk.players[0].avatar);assert.match(disk.players[0].avatarFile,/^[a-f0-9]{64}$/);
 const reload=new ProfileStore(file);assert.equal(reload.get(p.token).name,'B');assert.equal(reload.get(p.token).avatar,'photo-two');assert.equal(reload.data.completed,0);assert.equal(fs.readdirSync(file+'.avatars').length,1);
 s.register(p.token,'B','left',null);await s.flush();assert.equal(fs.readdirSync(file+'.avatars').length,0);assert.equal(new ProfileStore(file).get(p.token).avatar,undefined);
});
test('failed deferred rename retains old metadata and retries after transient failure',async t=>{
 const file=storeFixture(t),s=new ProfileStore(file,{deferred:true,onError:()=>{}}),p=s.register(null,'A','right','photo');await s.flush();
 const rename=fs.promises.rename;let fail=true;fs.promises.rename=async(...args)=>{if(args[1]===file&&fail){fail=false;throw Error('injected EIO');}return rename(...args);};t.after(()=>{fs.promises.rename=rename;clearTimeout(s.timer);});
 s.register(p.token,'B','right','new-photo');await assert.rejects(s.flush(),/EIO/);assert.equal(new ProfileStore(file).get(p.token).name,'A');
 await wait(1200);assert.equal(new ProfileStore(file).get(p.token).name,'B');assert.equal(s.written,s.dirty);
});
test('unchanged continuous input uses keepalive while release and button edges stay immediate',()=>{
 const {create}=require('../public/input-channel');let time=0;const sent=[],ws={readyState:1,bufferedAmount:0,addEventListener(){}};
 const channel=create(ws,raw=>sent.push(JSON.parse(raw)),{now:()=>time});
 const input=fire=>({type:'input',data:{x:1,y:0,fire}});
 for(let n=0;n<30;n++){time=n*34;const m=input(false);channel.send(JSON.stringify(m),m);}
 assert(sent.length<=6&&sent.length>=5);const before=sent.length;time+=1;const edge=input(true);channel.send(JSON.stringify(edge),edge);assert.equal(sent.length,before+1);channel.clear();
});
test('shared static responses compress once, revalidate and do not transform on cache hits',async t=>{
 const {staticResponse}=require('../lib/static-response');let transforms=0;const source=Buffer.from('body { color: red; }'.repeat(500));
 const server=http.createServer((q,s)=>staticResponse(q,s,'test.css',source,'text/css',text=>{transforms++;return text;}).catch(e=>s.destroy(e)));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>server.close());const url='http://127.0.0.1:'+server.address().port;
 const first=await fetch(url,{headers:{'Accept-Encoding':'br'}});assert.equal(first.headers.get('content-encoding'),'br');assert.equal(await first.text(),source.toString());
 const second=await fetch(url,{headers:{'If-None-Match':first.headers.get('etag')}});assert.equal(second.status,304);assert.equal(transforms,1);
});
test('malformed lobby frames and Upgrade URLs cannot kill the launcher or healthy clients',{timeout:12000},async t=>{
 const {spawn}=require('node:child_process'),net=require('node:net'),WS=require('ws');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'heypals-bad-packet-'));
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_DATA_FILE:path.join(dir,'party.json'),PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});
 let log='';child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);const sockets=[];
 t.after(async()=>{sockets.forEach(s=>s.terminate());if(child.exitCode===null){const exit=new Promise(r=>child.once('exit',r));child.kill();await exit;}fs.rmSync(dir,{recursive:true,force:true});});
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await wait(20);const port=log.match(/localhost:(\d+)/)?.[1];assert(port,log);
 async function connect(){const ws=new WS('ws://127.0.0.1:'+port+'/lobby');sockets.push(ws);ws.on('error',()=>{});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return ws;}
 const healthy=await connect();
 for(const attack of [ws=>ws.send('x'.repeat(196609)),ws=>ws._socket.write(Buffer.from([0x83,0x80,0,0,0,0]))]){const bad=await connect(),closed=new Promise(r=>bad.once('close',r));attack(bad);await closed;assert.equal(child.exitCode,null);}
 await new Promise(r=>{const socket=net.connect(Number(port),'127.0.0.1',()=>socket.end('GET // HTTP/1.1\r\nHost: localhost\r\nConnection: Upgrade\r\nUpgrade: websocket\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: AAAAAAAAAAAAAAAAAAAAAA==\r\n\r\n'));socket.on('error',()=>{});socket.on('close',r);});
 const pong=new Promise(r=>healthy.on('message',b=>{if(JSON.parse(b).type==='pong')r();}));healthy.send('{"type":"ping"}');await pong;assert.equal(child.exitCode,null);assert.equal((await fetch('http://127.0.0.1:'+port+'/api/health')).status,200);
});
test('incremental reliable events retain ordering and reconnect instead of accumulating hidden backlog',()=>{
 const ws=new Socket(),sender=createSnapshotSender({maxReliableInFlight:4});snapshotControl(ws,{type:'party:snapshots',version:1});
 for(let n=0;n<4;n++)assert(sender.event(ws,{type:'trail',n}));assert.deepEqual(ws.messages.map(m=>m.n),[0,1,2,3]);
 assert.equal(sender.event(ws,{type:'trail',n:4}),false);assert.equal(ws.code,1013);
});
