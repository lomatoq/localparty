'use strict';
// Runs against the actual embedded Node runtime in the installed simulator app.
// Keep /tv open in a browser: no clicks on that page are made by this test.
const assert=require('node:assert/strict'),WS=require('ws');
const origin=process.env.PARTY_TEST_ORIGIN||'http://127.0.0.1:8080';
const key=process.env.PARTY_TEST_KEY||'localparty-integration-test';
const sockets=[],delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,ms=15000){const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await delay(50);}throw Error('Timeout: '+label);}
async function manage(data,status=200){const res=await fetch(origin+'/api/manage',{method:data?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});const result=await res.json();assert.equal(res.status,status,JSON.stringify(result));return result;}
async function socket(path='/lobby',cookie='',io=false){const ws=new WS(origin.replace('http','ws')+path,{headers:{Cookie:cookie,Origin:origin}});sockets.push(ws);ws.messages=[];ws.io=io;ws.on('error',()=>{});ws.on('message',raw=>{const text=String(raw);if(io){if(text[0]==='0'){ws.send('40');return;}if(text==='2'){ws.send('3');return;}if(text.startsWith('40'))ws.connected=true;if(text.startsWith('43')){ws.ack=JSON.parse(text.slice(text.indexOf('[')))[0];return;}if(text.startsWith('42')){const [type,data]=JSON.parse(text.slice(2));ws.messages.push({type,data});}return;}const m=JSON.parse(text);ws.messages.push(m);if(m.type==='joined')ws.profile=m;});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});if(io)await until(()=>ws.connected,'socket.io connect');return ws;}
const send=(ws,type,data)=>ws.send(ws.io?'42'+JSON.stringify([type,data||{}]):JSON.stringify({type,...data}));
async function controller(game,p){const engine=game.engine||game.id,io=['spy','millionaire','monster'].includes(engine),nested=['party','tanks','tankarena','jenga','arcade','western_duel'].includes(engine);
 const ws=await socket('/games/'+game.id+(io?'/socket.io/?EIO=4&transport=websocket':'/ws'),'',io);const identity={partyId:p.id,partyToken:p.token,name:p.name};
 if(io){ws.send('421'+JSON.stringify(['player:join',identity]));await until(()=>ws.ack,'player ack');assert.equal(ws.ack.ok,true,JSON.stringify(ws.ack));}
 else {send(ws,'join',nested?{data:identity}:identity);await until(()=>ws.profile,game.id+' join');}
 return ws;
}
(async()=>{await manage({type:'server-start'});await manage({type:'stop'});for(const p of (await manage()).players)await manage({type:'kick',id:p.id});const game=(await manage()).catalog.find(g=>g.id===(process.env.PARTY_TEST_GAME||'tankarena'));const guests=[];for(let i=0;i<2;i++){const w=await socket();send(w,'join',{name:'TV compatibility '+i});await until(()=>w.profile,'join');guests.push(w);}
await until(async()=>(await manage()).screens>0,'TV connected');const run=(await manage({type:'launch',id:game.id})).active;for(const w of guests){const control=await controller(game,w.profile);send(w,'ready-set',{ready:true,instance:run.instance});if(game.id==='tankarena')setInterval(()=>{if(control.readyState===1)send(control,'input',{data:{x:.2,y:0,fire:true}});},100);}
console.log('TV fixture active: '+game.id);setTimeout(()=>{for(const s of sockets)s.terminate();process.exit(0);},180000);})().catch(e=>{console.error(e);process.exit(1);});
