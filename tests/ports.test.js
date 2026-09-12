'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const net=require('node:net');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {WebSocket}=require('ws');
const QRCode=require('qrcode');

async function launcher(t, preference=''){
  const child=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PARTY_EPHEMERAL:'1',PARTY_PORT:preference,PARTY_NO_BROWSER:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});
  t.after(async()=>{if(child.exitCode===null){const ended=once(child,'exit');child.kill();await ended;}});
  return await new Promise((resolve,reject)=>{
    let output='';const timer=setTimeout(()=>reject(Error(output||'Startup timeout')),8000);
    child.on('error',e=>{clearTimeout(timer);reject(e);});
    child.on('exit',()=>{clearTimeout(timer);reject(Error(output||'Server exited'));});
    child.stderr.on('data',d=>output+=d);
    child.stdout.on('data',d=>{output+=d;const m=output.match(/LOCAL PARTY — http:\/\/localhost:(\d+)\/host/);if(m){clearTimeout(timer);resolve({port:Number(m[1]),origin:`http://127.0.0.1:${m[1]}`});}});
  });
}
async function client(t, port){
 const ws=new WebSocket(`ws://127.0.0.1:${port}/lobby`),queue=[];
 ws.on('message',raw=>queue.push(JSON.parse(raw)));
 t.after(()=>ws.terminate());await once(ws,'open');
 return {send:m=>ws.send(JSON.stringify(m)),async wait(predicate){for(let i=0;i<120;i++){const index=queue.findIndex(predicate);if(index>=0)return queue.splice(index,1)[0];await new Promise(r=>setTimeout(r,25));}throw Error('Missing websocket message');}};
}
test('simultaneous automatic launches get different free ports',async t=>{
 const [a,b]=await Promise.all([launcher(t),launcher(t)]);
 assert.ok(a.port>0&&b.port>0);assert.notEqual(a.port,b.port);
 for(const run of [a,b])assert.equal((await fetch(run.origin+'/api/health')).status,200);
});
test('occupied preferred port falls back and all invitations use the bound port',{timeout:15000},async t=>{
 const occupied=net.createServer();occupied.listen(0,'0.0.0.0');await once(occupied,'listening');
 t.after(()=>occupied.close());const busy=occupied.address().port;
 const run=await launcher(t,String(busy));assert.notEqual(run.port,busy);
 const host=await client(t,run.port), state=await host.wait(m=>m.type==='state');
 for(const url of state.urls)assert.equal(new URL(url).port,String(run.port));
 const invite=state.urls[0]||run.origin+'/';
 const qr=await fetch(run.origin+'/api/qr?url='+encodeURIComponent(invite));
 assert.deepEqual(Buffer.from(await qr.arrayBuffer()),await QRCode.toBuffer(invite,{margin:1,width:240}));
 const html=await(await fetch(run.origin+'/host')).text();
 host.send({type:'host',key:JSON.parse(html.match(/window\.PARTY_HOST_KEY=("[^"]+")/)[1])});await host.wait(m=>m.type==='host-ok');
 for(const name of ['Port A','Port B']){const p=await client(t,run.port);p.send({type:'join',name});await p.wait(m=>m.type==='joined');}
 host.send({type:'launch',id:'push'});await host.wait(m=>m.type==='state'&&m.active?.id==='push');
 const info=await(await fetch(run.origin+'/games/push/api/info')).json();
 assert.equal(info.port,run.port);assert.equal(new URL(info.controllerUrl).port,String(run.port));
 host.send({type:'stop'});await host.wait(m=>m.type==='state'&&!m.active&&!m.busy);
});
