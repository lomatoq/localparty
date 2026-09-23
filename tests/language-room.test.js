'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),WS=require('ws');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('only host can explicitly override locale; revision survives reconnect snapshots',{timeout:20000},async t=>{
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'language-test'}});
 let log='';const sockets=[];child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);t.after(()=>{for(const ws of sockets)ws.terminate();child.kill();});
 async function until(fn){for(let i=0;i<200;i++){const value=fn();if(value)return value;await sleep(30);}throw Error('Timeout: '+log);}
 await until(()=>/localhost:(\d+)/.test(log));const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 async function connect(){const ws=new WS(origin.replace('http:','ws:')+'/lobby');sockets.push(ws);ws.messages=[];ws.on('message',raw=>ws.messages.push(JSON.parse(raw)));await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});await until(()=>ws.messages.find(m=>m.type==='state'));return ws;}
 const guest=await connect();assert.equal(guest.messages[0].languageOverride,null);
 guest.send(JSON.stringify({type:'force-language',language:'ru'}));await until(()=>guest.messages.find(m=>m.type==='error'));
 assert.equal(guest.messages.filter(m=>m.type==='state').at(-1).languageOverride,null);
 const response=await fetch(origin+'/api/manage',{method:'POST',headers:{Authorization:'Bearer language-test','Content-Type':'application/json'},body:JSON.stringify({type:'force-language',language:'ru'})});assert.equal(response.status,200);
 const state=await response.json();assert.equal(state.languageOverride.language,'ru');assert.ok(state.languageOverride.revision);
 await until(()=>guest.messages.find(m=>m.languageOverride?.revision===state.languageOverride.revision));
 const recovered=await connect();assert.deepEqual(recovered.messages[0].languageOverride,state.languageOverride);
 const invalid=await fetch(origin+'/api/manage',{method:'POST',headers:{Authorization:'Bearer language-test','Content-Type':'application/json'},body:JSON.stringify({type:'force-language',language:'invalid'})});assert.equal(invalid.status,400);
});
