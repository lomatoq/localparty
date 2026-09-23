'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),WS=require('ws');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
test('16 Arcade phones receive final results without continuous idle snapshots',{timeout:20000},async t=>{
 const child=spawn(process.execPath,['games/arcade/server.js'],{env:{...process.env,PARTY_MANAGED:'0',PARTY_GAME_ID:'hungry',PORT:'0',TEST_FAST:'1'}});let log='';const sockets=[];
 child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);t.after(()=>{sockets.forEach(ws=>ws.terminate());child.kill();});
 async function until(fn){for(let i=0;i<200;i++){const v=fn();if(v)return v;await delay(30);}throw Error(log);}
 await until(()=>/localhost:(\d+)/.test(log));const url='ws://127.0.0.1:'+log.match(/localhost:(\d+)/)[1]+'/ws';
 async function connect(){const ws=new WS(url);sockets.push(ws);ws.messages=[];ws.bytes=0;ws.on('error',()=>{});ws.on('message',raw=>{ws.bytes+=raw.length;ws.messages.push(JSON.parse(raw));});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return ws;}
 const phones=[];for(let i=0;i<16;i++){const ws=await connect();ws.send(JSON.stringify({type:'join',data:{name:'Traffic '+i}}));await until(()=>ws.messages.some(m=>m.type==='joined'));phones.push(ws);}
 await delay(150);let starts=phones.map(p=>p.messages.length);await delay(1100);
 assert(phones.every((p,i)=>p.messages.length-starts[i]<=1),'waiting must not stream 30 identical packets per second');
 const host=await connect();host.send(JSON.stringify({type:'host'}));host.send(JSON.stringify({type:'start'}));
 await until(()=>phones.every(ws=>ws.messages.some(m=>m.type==='state'&&m.data.phase==='finished')));
 for(const ws of phones){const state=ws.messages.filter(m=>m.type==='state').at(-1).data;assert.equal(state.players.length,16);assert(state.players.some(p=>p.id===state.selfId));assert(state.players.every(p=>Number.isFinite(p.score)));}
 starts=phones.map(p=>p.messages.length);await delay(1100);assert(phones.every((p,i)=>p.messages.length-starts[i]<=1),'finished scene must stop sending unchanged phone snapshots');
 t.diagnostic('16 controllers: waiting and finished each <=1 state packet per 1.1 seconds; all final scores delivered');
});
