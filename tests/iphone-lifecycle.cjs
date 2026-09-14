'use strict';
// Run against the simulator. The operator uses its Home/Sleep buttons at each WAIT.
const assert=require('node:assert/strict'),WebSocket=require('ws');
const origin=process.env.PARTY_TEST_ORIGIN||'http://127.0.0.1:8080',key=process.env.PARTY_TEST_KEY||'localparty-integration-test';
const delay=ms=>new Promise(r=>setTimeout(r,ms)),all=[];
async function manage(command){const r=await fetch(origin+'/api/manage',{method:command?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:command?JSON.stringify(command):undefined,signal:AbortSignal.timeout(3000)});assert.equal(r.status,200);return r.json();}
async function until(fn){const end=Date.now()+180000;while(Date.now()<end){if(await fn())return;await delay(100);}throw Error('Lifecycle transition timeout');}
async function connect(path='/lobby',cookie=''){const ws=new WebSocket(origin.replace('http','ws')+path,{headers:{Cookie:cookie,Origin:origin}});all.push(ws);ws.messages=[];ws.on('message',raw=>{const m=JSON.parse(raw);ws.messages.push(m);if(m.type==='joined')ws.profile=m.data||m;if(m.type==='state')ws.state=m.data||m;});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});return ws;}
const send=(ws,m)=>ws.send(JSON.stringify(m));
(async()=>{try{
 await manage({type:'server-stop'});
 await manage({type:'server-start'});
 const tv=await fetch(origin+'/tv'),cookie=tv.headers.get('set-cookie').split(';')[0],html=await tv.text(),displayKey=JSON.parse(html.match(/PARTY_DISPLAY_KEY=(.*?);/)[1]);
 const screen=await connect('/lobby',cookie);send(screen,{type:'display',key:displayKey});await until(()=>screen.messages.some(m=>m.type==='display-ok'));
 const guests=[];
 for(let i=0;i<2;i++){const ws=await connect();send(ws,{type:'join',name:'Lifecycle '+i});await until(()=>ws.profile);guests.push(ws);}
 const started=await manage({type:'launch',id:'tanks'}),instance=started.active.instance;
 let host=await connect('/games/tanks/ws',cookie);send(host,{type:'registerHost'});
 let controls=[];
 for(const guest of guests){const c=await connect('/games/tanks/ws');send(c,{type:'join',data:{partyId:guest.profile.id,partyToken:guest.profile.token}});await until(()=>c.profile);controls.push(c);}
 for(const guest of guests){send(guest,{type:'game-status',status:'ready',instance});send(guest,{type:'ready-set',ready:true,instance});}await until(()=>host.state?.game?.status==='playing');
 for(let cycle=1;cycle<=Number(process.env.PARTY_TEST_LIFECYCLE_CYCLES||1);cycle++){
  console.log('WAIT BACKGROUND '+cycle+' — use simulator Home/Sleep');
  await until(async()=>!(await manage()).executionAllowed);
  const before=await manage();assert.equal(before.active.session.paused,true);
  await delay(cycle===1?35000:10000);
  try {const paused=await manage();assert.equal(paused.enabled,true);assert.equal(paused.active.instance,instance);assert.equal(paused.servedSeconds,before.servedSeconds);}catch(e){if(!['TimeoutError','TypeError'].includes(e.name))throw e;console.log('Observed simulator suspension: network temporarily unavailable');}
  console.log('WAIT FOREGROUND '+cycle+' — reopen Party 26');
  await until(async()=>{try{return (await manage()).executionAllowed}catch{return false}});
  const resumed=await manage();assert.equal(resumed.enabled,true);assert.equal(resumed.active.instance,instance);assert.equal(resumed.active.session.paused,false,'Foreground must automatically resume the system pause');assert.ok(resumed.servedSeconds-before.servedSeconds<=3,'Suspended time must not count as work');
  const oldHost=host;host=await connect('/games/tanks/ws',cookie);send(host,{type:'registerHost'});oldHost.terminate();
  for(let i=0;i<2;i++){
   const original=guests[i].profile,c=await connect();send(c,{type:'join',token:original.token,name:original.name});await until(()=>c.profile);assert.equal(c.profile.id,original.id);guests[i].terminate();guests[i]=c;
   const gameId=controls[i].profile.id,replacement=await connect('/games/tanks/ws');send(replacement,{type:'join',data:{partyId:c.profile.id,partyToken:c.profile.token}});await until(()=>replacement.profile);assert.equal(replacement.profile.id,gameId);controls[i].terminate();controls[i]=replacement;
  }
  await manage({type:'pause',paused:false});await until(()=>host.state?.players?.length===2);
  assert.equal((await manage()).players.length,2);assert.equal(new Set(host.state.players.map(p=>p.id)).size,2);
  console.log('PASS foreground '+cycle+' same match, same player and tank IDs, no duplicates');
 }
 await manage({type:'server-stop'});console.log('PASS simulator lifecycle: pause, return, reconnect identity; cycles='+Number(process.env.PARTY_TEST_LIFECYCLE_CYCLES||1));
 }finally{for(const ws of all)ws.terminate();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
