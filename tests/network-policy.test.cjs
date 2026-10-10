'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{fork}=require('node:child_process'),WS=require('ws');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let n=0;n<300;n++){const value=fn();if(value)return value;await wait(20);}throw Error('Timed out');}
async function game(t,engine,id=engine){
 const child=fork(`games/${engine}/server.js`,[],{silent:true,env:{...process.env,PORT:'0',PARTY_MANAGED:'1',PARTY_GAME_ID:id}}),sockets=[];let output='';
 child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
 t.after(async()=>{sockets.forEach(s=>s.terminate());if(child.exitCode===null){const exit=new Promise(r=>child.once('exit',r));child.kill();await exit;}});
 const port=await until(()=>output.match(/(?:localhost:|127\.0\.0\.1:)(\d+)/)?.[1]);
 return {child,async connect(){const ws=new WS(`ws://127.0.0.1:${port}/ws`);sockets.push(ws);ws.messages=[];ws.on('message',raw=>ws.messages.push(JSON.parse(raw)));ws.on('error',()=>{});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return ws;}};
}
for(const engine of ['naval','quiz','crocodile'])test(engine+': unknown commands do not amplify state broadcasts',async t=>{
 const f=await game(t,engine),sockets=[];for(let i=0;i<16;i++)sockets.push(await f.connect());await wait(80);sockets.forEach(s=>s.messages=[]);
 for(let n=0;n<25;n++)sockets[0].send('{"type":"unknown"}');await wait(150);
 assert.equal(sockets.reduce((n,s)=>n+s.messages.filter(m=>m.type==='state').length,0),0);
});
for(const [engine,id,count] of [['sports_siege','curling',200],['arcade_deluxe','pocket_siege',150]])test(engine+': transport budget refills while game is paused',{timeout:10000},async t=>{
 const f=await game(t,engine,id),ws=await f.connect();
 await new Promise(r=>{f.child.on('message',m=>{if(m.type==='party:paused'&&m.paused)r();});f.child.send({type:'party:pause',paused:true});});
 for(let n=0;n<count;n++){assert.equal(ws.readyState,1);ws.send('{"type":"ping","data":{}}');await wait(20);}
 await until(()=>ws.messages.filter(m=>m.type==='pong').length===count);assert.equal(ws.readyState,1);
});
test('control message size is bounded before JSON decoding',async t=>{
 const f=await game(t,'tankarena'),ws=await f.connect(),closed=new Promise(r=>ws.once('close',r));ws.send('x'.repeat(16384));assert.equal(await closed,1009);
});
test('input channel bounds pointer bursts, retains latest axes and sends release immediately',async()=>{
 const {create}=require('../public/input-channel'),sent=[],listeners={};let now=0;
 const ws={readyState:1,bufferedAmount:0,addEventListener:(e,f)=>listeners[e]=f,close(){this.readyState=3;listeners.close();}};
 const channel=create(ws,s=>sent.push(JSON.parse(s)),{now:()=>now,interval:10});
 for(let i=0;i<100;i++){const m={type:'input',data:{x:(i+1)/100,y:0,fire:false}};assert(channel.send(JSON.stringify(m),m));}
 assert.equal(sent.length,1);now=10;await wait(25);assert.equal(sent.length,2);assert.equal(sent[1].data.x,1);
 const release={type:'input',data:{x:0,y:0,fire:false}};channel.send(JSON.stringify(release),release);assert.equal(sent.length,3);assert.equal(sent[2].data.x,0);
 assert.equal(channel.send('{}',{type:'input',data:{action:'tap'}}),false);channel.clear();
});
test('input channel discards stale queued controls and closes a persistently blocked socket',async()=>{
 const {create}=require('../public/input-channel'),sent=[],listeners={};let now=0,code;
 const ws={readyState:1,bufferedAmount:20000,addEventListener:(e,f)=>listeners[e]=f,close(c){assert(c===1000||(c>=3000&&c<=4999),'browser-valid close code');code=c;this.readyState=3;listeners.close();}};
 const channel=create(ws,s=>sent.push(s),{now:()=>now,interval:5}),m={type:'input',data:{x:1,y:0}};
 channel.send(JSON.stringify(m),m);now=2100;await wait(20);assert.equal(code,4008);assert.equal(sent.length,0);
});
test('catalog revision keeps old clients compatible, compacts polling and acknowledged lobby states',{timeout:10000},async t=>{
 const child=fork('server.js',[],{silent:true,env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_ADMIN_KEY:'network-policy-test',PARTY_NO_BROWSER:'1'}});let log='';const sockets=[];
 child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
 t.after(async()=>{sockets.forEach(s=>s.terminate());if(child.exitCode===null){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}});
 const port=await until(()=>log.match(/localhost:(\d+)/)?.[1]),base=`http://127.0.0.1:${port}`;
 const get=async suffix=>{const r=await fetch(base+'/api/manage'+suffix,{headers:{Authorization:'Bearer network-policy-test'}});assert(r.ok);return r.json();};
 const full=await get('');assert.equal(full.catalog.length,32);for(const id of ['jenga','crane','drawguess','chaos'])assert(!full.catalog.some(g=>g.id===id));
 const compact=await get('?catalogRevision='+full.catalogRevision);assert.equal(compact.catalog,undefined);assert(JSON.stringify(compact).length<JSON.stringify(full).length*.4);
 assert.equal((await get('?catalogRevision=old')).catalog.length,32);
 const ws=new WS(base.replace('http','ws')+'/lobby');sockets.push(ws);const messages=[];ws.on('message',b=>messages.push(JSON.parse(b)));await new Promise(r=>ws.once('open',r));
 await until(()=>messages.some(m=>m.catalog));ws.send(JSON.stringify({type:'catalog-ready',revision:full.catalogRevision}));ws.send(JSON.stringify({type:'join',name:'Catalog Test'}));
 const update=await until(()=>messages.find(m=>m.type==='state'&&m.players.length));assert.equal(update.catalog,undefined);assert.equal(update.catalogRevision,full.catalogRevision);
 const restored=new WS(base.replace('http','ws')+'/lobby');sockets.push(restored);const first=await new Promise(r=>restored.once('message',b=>r(JSON.parse(b))));assert.equal(first.catalog.length,32);
});
for(const engine of ['party','tanks'])test(engine+': replacement closes the old controller and keeps the new player connected',async t=>{
 const f=await game(t,engine,engine==='party'?'push':engine);
 f.child.send({type:'party:roster',players:[{id:'replacement-player',token:'replacement-token',name:'Replacement'}]});await wait(50);
 const a=await f.connect(),join={type:'join',data:{partyId:'replacement-player',partyToken:'replacement-token'}};a.send(JSON.stringify(join));
 const joined=await until(()=>a.messages.find(m=>m.type==='joined'));const closed=new Promise(r=>a.once('close',r));
 const b=await f.connect();b.send(JSON.stringify(join));assert.equal(await closed,4001);
 assert.equal((await until(()=>b.messages.find(m=>m.type==='joined'))).data.id,joined.data.id);
 const pong=new Promise(r=>b.once('pong',r));b.ping('replacement');await pong;assert.equal(b.readyState,1);
});
for(const engine of ['party','tanks'])test(engine+': a replaced browser controller does not reconnect',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),sockets=[],timers=[];
 class Socket{constructor(){sockets.push(this);}close(){}send(){}}Socket.OPEN=1;
 const ctx={WebSocket:Socket,location:{protocol:'http:',host:'localhost'},console,Math,setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(`games/${engine}/public/net.js`,'utf8')+';createSocketBus();',ctx);
 assert.equal(sockets.length,1);sockets[0].onclose({code:4001});assert.equal(timers.length,0);
});
