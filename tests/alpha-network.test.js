'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{spawn}=require('node:child_process');
let WS;try{WS=require('ws');require.resolve('@dimforge/rapier3d-compat');}catch{}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){const v=fn();if(v)return v;await pause(25);}throw Error('Timed out');}
if(process.env.CI&&!WS)throw Error('CI must install ws');
for(const mode of ['bowling','curling','swarm_gate','peek_shoot'])test('real HTTP/WebSocket lifecycle: '+mode,{skip:!WS,timeout:25000},async t=>{
 const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'../games/sports_siege'),env:{...process.env,PARTY_GAME_ID:mode,PARTY_MANAGED:'0',PORT:'0'},stdio:['ignore','pipe','pipe']});
 let log='',err='';child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>err+=b);t.after(()=>child.kill());
 const port=await until(()=>/localhost:(\d+)/.exec(log)?.[1]);const base='http://127.0.0.1:'+port;
 const html=await(await fetch(base+'/host')).text(),key=/"hostKey":"([a-f0-9]+)"/.exec(html)?.[1];assert.ok(key);assert.ok(!(await(await fetch(base+'/')).text()).includes(key));
 function socket(){const s=new WS('ws://127.0.0.1:'+port+'/ws');s.messages=[];s.on('message',d=>s.messages.push(JSON.parse(d)));t.after(()=>s.terminate());return s;}
 const host=socket();await until(()=>host.readyState===1);host.send(JSON.stringify({type:'host',data:{key}}));await until(()=>host.messages.some(m=>m.type==='host-ok'));
 const clients=[];for(let i=0;i<2;i++){const s=socket();await until(()=>s.readyState===1);s.send(JSON.stringify({type:'join',data:{name:'Test '+i}}));await until(()=>s.messages.some(m=>m.type==='joined'));clients.push(s);}
 clients[0].send(JSON.stringify({type:'start',data:{}}));await pause(120);assert.equal(host.messages.filter(m=>m.type==='state').at(-1).data.phase,'waiting');
 host.send(JSON.stringify({type:'start',data:{frames:3,ends:1,waves:4,seconds:60}}));await until(()=>host.messages.some(m=>m.type==='state'&&m.data.phase==='playing'));
 const state=host.messages.filter(m=>m.type==='state').at(-1).data;assert.equal(state.players.length,2);
 if(['curling','bowling'].includes(mode)){
  const p=clients.find(s=>s.messages.find(m=>m.type==='joined').data.id===state.currentId);const shot={power:.6,spin:0,angle:0,position:0,turnToken:state.turnToken};
  p.send(JSON.stringify({type:'throw',data:shot}));p.send(JSON.stringify({type:'throw',data:shot}));await until(()=>host.messages.some(m=>m.type==='state'&&m.data.stage==='rolling'));
  const rolling=host.messages.filter(m=>m.type==='state').at(-1).data;assert.equal(rolling.events.filter(e=>e.kind==='throw').length,1);
 }else{clients[0].send(JSON.stringify({type:'input',data:{x:.5,y:.5,fire:true}}));await pause(750);assert.equal(host.messages.filter(m=>m.type==='state').at(-1).data.players[0].fire,false);}
 assert.ok(!err.includes('TypeError')&&!err.includes('ReferenceError'),err);
});
