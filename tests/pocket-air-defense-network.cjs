'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{spawn}=require('node:child_process'),WebSocket=require('ws');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const child=spawn(process.execPath,['games/arcade_deluxe/server.js','pocket_siege'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,ARCADE_PORT:'0'},stdio:['ignore','pipe','pipe']});const peers=[];
 try{
  const base=await new Promise((resolve,reject)=>{let log='';const timeout=setTimeout(()=>reject(Error(log)),10000);const read=b=>{log+=b;const m=log.match(/http:\/\/localhost:(\d+)\/host/);if(m){clearTimeout(timeout);resolve('http://127.0.0.1:'+m[1]);}};child.stdout.on('data',read);child.stderr.on('data',read);});
  const html=await(await fetch(base+'/host')).text(),config=JSON.parse(html.match(/window.ARCADE_CONFIG=(\{[^;]+\});/)[1]);
  async function peer(){const p={ws:new WebSocket(base.replace('http:','ws:')+'/ws'),state:null,joined:null};peers.push(p);p.send=(type,data={})=>p.ws.send(JSON.stringify({type,data}));p.ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='state')p.state=m.data;if(m.type==='joined')p.joined=m.data;});await new Promise((r,j)=>{p.ws.once('open',r);p.ws.once('error',j);});return p;}
  async function until(fn,label,ms=10000){const until=Date.now()+ms;while(Date.now()<until){if(fn())return;await sleep(25);}throw Error(label);}
  const host=await peer();host.send('host',{key:config.hostKey});const a=await peer();a.send('join',{name:'A'});await until(()=>a.joined,'join A');const b=await peer();b.send('join',{name:'B'});await until(()=>b.joined,'join B');
  host.send('start',{sandbox:true});await until(()=>a.state?.stage==='aim','start');assert.equal(b.state.airDefense.charges,10);
  b.send('air-defense',{seq:1,targetId:123,x:0,y:0});await sleep(120);assert.equal(b.state.airDefense.charges,10,'invalid aim stage does not spend');
  a.send('aim',{angle:35,power:100});a.send('fire',{seq:1});await until(()=>b.state?.airDefense.canLaunch,'enemy enters radar');
  assert.equal(a.state.airDefense.canLaunch,false,'shooter cannot defend own turn');assert(!('projectiles' in b.state));assert(!('interceptors' in b.state));assert(b.state.airDefense.threats.length<=8);assert(b.state.airDefense.threats.length>0);
  for(const data of [{seq:2},{seq:2},{seq:1},{}])b.send('air-defense',data);
  await until(()=>b.state.airDefense.charges===9,'first launch accepted');await sleep(100);assert.equal(b.state.airDefense.charges,9,'duplicate/stale/missing seq cannot double-spend');
  for(let seq=3;seq<=11;seq++)b.send('air-defense',{seq});await until(()=>b.state.airDefense.charges===0,'all ten launches accepted');b.send('air-defense',{seq:12});await sleep(120);assert.equal(b.state.airDefense.charges,0);assert.equal(b.state.airDefense.canLaunch,false);
  assert(b.state.airDefense.interceptors.every(r=>r.owner===b.joined.id));assert(a.state.airDefense.interceptors.every(r=>r.owner===a.joined.id));
  const token=b.joined.token;b.ws.close();const back=await peer();back.send('join',{token});await until(()=>back.joined&&back.state,'reconnect');assert.equal(back.state.airDefense.charges,0,'reconnect preserves spent charges');
  console.log('PASS PVO real WS:enemy radar, snapshot privacy,10 charges, invalid/duplicate/stale/missing seq and reconnect');
 }finally{for(const p of peers)p.ws.terminate();child.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
