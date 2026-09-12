'use strict';
const {spawn}=require('child_process'),path=require('path'),assert=require('assert/strict'),{WebSocket}=require('ws');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const child=spawn(process.execPath,['server.js'],{cwd:path.resolve('games/quiz'),env:{...process.env,PORT:'0',PARTY_MANAGED:'1',PARTY_ROSTER:JSON.stringify([{id:'a',token:'aa',name:'A'},{id:'b',token:'bb',name:'B'}])},stdio:['ignore','pipe','pipe','ipc']});
 const sockets=[];try{
 let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);for(let i=0;i<100&&!/localhost:(\d+)/.test(logs);i++)await sleep(50);
 const port=logs.match(/localhost:(\d+)/)?.[1];assert.ok(port,logs);const html=await(await fetch(`http://localhost:${port}/host`)).text();const key=JSON.parse(html.match(/window.QUIZ_HOST_KEY=("[^"]+")/)[1]);
 async function conn(){const ws=new WebSocket(`ws://localhost:${port}`);sockets.push(ws);ws.messages=[];ws.on('message',d=>ws.messages.push(JSON.parse(d)));await new Promise(r=>ws.once('open',r));return ws;}
 const h=await conn(),a=await conn(),b=await conn(),send=(w,m)=>w.send(JSON.stringify(m));send(h,{type:'host',key});send(a,{type:'join',partyId:'a',partyToken:'aa'});send(b,{type:'join',partyId:'b',partyToken:'bb'});await sleep(80);send(h,{type:'configure',settings:{seconds:5,count:3}});send(h,{type:'start'});await sleep(100);
 const before=h.messages.filter(m=>m.type==='state').at(-1);assert.equal(before.phase,'question');child.send({type:'party:pause',paused:true});await sleep(100);send(a,{type:'answer',round:0,answer:0});send(b,{type:'answer',round:0,answer:0});await sleep(5200);send(h,{type:'host',key});await sleep(80);const paused=h.messages.filter(m=>m.type==='state').at(-1);assert.equal(paused.phase,'question');assert.equal(paused.endsAt,before.endsAt);assert.ok(sockets.every(w=>w.readyState===1));child.send({type:'party:pause',paused:false});await sleep(5150);send(h,{type:'host',key});await sleep(100);assert.equal(h.messages.filter(m=>m.type==='state').at(-1).phase,'reveal');console.log('PASS real quiz: >5s pause preserves question/deadline; inputs blocked; WebSockets remain open; timeout resumes.');
 }finally{for(const ws of sockets)ws.close();child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
