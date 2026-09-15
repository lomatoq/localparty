'use strict';
const assert=require('assert/strict'),WebSocket=require('ws');
const origin=process.env.PARTY_TEST_ORIGIN||'http://127.0.0.1:8081',key=process.env.PARTY_TEST_KEY||'localparty-integration-test';
const delay=ms=>new Promise(r=>setTimeout(r,ms)),sockets=[];
async function until(fn,timeout=12000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await delay(35);}throw Error('Timed out waiting for state');}
async function manage(command){const r=await fetch(origin+'/api/manage',{method:command?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:command?JSON.stringify(command):undefined});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data;}
async function connect(path='/lobby',cookie=''){const ws=new WebSocket(origin.replace('http','ws')+path,{headers:{Cookie:cookie,Origin:origin}});sockets.push(ws);ws.messages=[];ws.on('message',raw=>{const m=JSON.parse(raw);ws.messages.push(m);if(m.type==='state')ws.state=m;if(m.type==='joined')ws.profile=m;});await new Promise((res,rej)=>{ws.once('open',res);ws.once('error',rej)});return ws;}
const send=(ws,m)=>ws.send(JSON.stringify(m));
(async()=>{try{
 await until(async()=>{try{return (await manage()).catalog.length===require('../lib/catalog').length}catch{return false}},20000);
 await manage({type:'network-set',enabled:true});
 assert.equal((await fetch(origin+'/api/manage')).status,403);
 assert.equal((await fetch(origin+'/host')).status,403);
 const tv=await fetch(origin+'/tv');assert.equal(tv.status,200);const cookie=tv.headers.get('set-cookie').split(';')[0],html=await tv.text(),displayKey=JSON.parse(html.match(/PARTY_DISPLAY_KEY=(.*?);/)[1]);
 const screen=await connect('/lobby',cookie);send(screen,{type:'display',key:displayKey});await until(()=>screen.messages.some(m=>m.type==='display-ok'));
 // TV credentials must never grant game-selection rights.
 send(screen,{type:'launch',id:'tanks'});await until(()=>screen.messages.some(m=>m.type==='error'));
 const catalog=(await manage()).catalog.filter(g=>!process.env.PARTY_TEST_GAMES||process.env.PARTY_TEST_GAMES.split(',').includes(g.id));let guests=[];
 for(const game of catalog){
  for(const g of guests)g.terminate();guests=[];
  await until(async()=>(await manage()).players.length===0);
  for(let i=0;i<game.min;i++){const ws=await connect();send(ws,{type:'join',name:'Smoke '+i});await until(()=>ws.profile);guests.push(ws);}
  await manage({type:'select',id:game.id});await until(()=>screen.state?.selected===game.id);
  const begin=performance.now();const result=await manage({type:'launch',id:game.id});assert.equal(result.active.id,game.id);
  for(const [route,headers] of [[game.host,{Cookie:cookie}],[game.player,{}]]){const res=await fetch(origin+'/games/'+game.id+route,{headers});assert.equal(res.status,200,game.id+' '+route);const body=await res.text();assert.ok(body.includes('/bridge.js'),game.id+' bridge');}
  console.log('PASS '+game.id+' startup '+Math.round(performance.now()-begin)+'ms');
  if(game.id==='jenga'||game.id==='crane'){
   const host=await connect('/games/'+game.id+'/ws'+(game.id==='crane'?'?role=host':''),cookie);
   if(game.id==='jenga')send(host,{type:'host'});
   const controls=[];
   for(const guest of guests){const control=await connect('/games/'+game.id+'/ws');send(control,{type:'join',...(game.id==='jenga'?{data:{partyId:guest.profile.id,partyToken:guest.profile.token}}:{partyId:guest.profile.id,partyToken:guest.profile.token})});await until(()=>control.profile);controls.push(control);}
   for(const guest of guests){send(guest,{type:'game-status',status:'ready',instance:result.active.instance});send(guest,{type:'ready-set',ready:true,instance:result.active.instance});}await until(()=>host.messages.some(m=>(m.data||m).phase==='playing'));
   const snapshots=[];const listener=raw=>{const data=JSON.parse(raw);if((data.data||data).phase==='playing')snapshots.push(performance.now());};host.on('message',listener);
   for(let i=0;i<25;i++){
    const state=(host.messages.at(-1)?.data||host.messages.at(-1));
    if(game.id==='jenga'){const control=controls.find(c=>c.profile.data?.id===state.currentId||c.profile.id===state.currentId)||controls[0];const candidate=state.candidates?.[16]||state.candidates?.[0];if(candidate&&!state.selected)send(control,{type:'select',data:{id:typeof candidate==='string'?candidate:candidate.id,turnId:state.turnId}});send(control,{type:'joystick',data:{x:0,y:.25,turnId:state.turnId}});}
    else {for(const c of controls)send(c,{type:'input',right:true,turnId:state.turnId});if(i===8)for(const c of controls)send(c,{type:'drop',turnId:state.turnId});}
    await delay(100);
   }
   host.off('message',listener);assert.ok(snapshots.length>20,game.id+' realtime snapshots '+snapshots.length);const gaps=snapshots.slice(1).map((t,i)=>t-snapshots[i]);assert.ok(Math.max(...gaps)<250,game.id+' stalled while moving');console.log('PHYSICS '+game.id+' frames='+snapshots.length+' maxGap='+Math.round(Math.max(...gaps))+'ms');
   const observed=host.messages.at(-1)?.data||host.messages.at(-1);if(game.id==='jenga'){assert.ok(observed.selected&&observed.inputMagnitude>0,'Jenga must accept the joystick');}else{assert.ok(observed.falling||observed.blocks.length||observed.turns,'Crane must actually drop a block');}
   const paused=await manage({type:'execution',allowed:false});assert.equal(paused.active.session.paused,true);assert.equal(paused.executionAllowed,false);await manage({type:'execution',allowed:true});assert.equal((await manage()).active.session.paused,false);await manage({type:'pause',paused:true});send(guests[0],{type:'pause-set',paused:false,instance:'expired-game'});await delay(80);assert.equal((await manage()).active.session.paused,true,'An old game cannot resume this match');const resumed=await manage({type:'pause',paused:false});assert.equal(resumed.active.session.paused,false);
   for(const ws of [host,...controls])ws.terminate();
  }
  await manage({type:'stop'});
 }
 const before=guests[0].profile;const resumed=await connect();send(resumed,{type:'join',token:before.token,name:before.name});await until(()=>resumed.profile);assert.equal(resumed.profile.id,before.id);await delay(250);const state=await manage();assert.equal(state.players.filter(p=>p.id===before.id).length,1);
 await manage({type:'network-set',enabled:false});assert.equal((await fetch(origin+'/')).status,200);assert.equal((await manage()).networkEnabled,false);await manage({type:'network-set',enabled:true});assert.equal((await fetch(origin+'/')).status,200);await manage({type:'network-set',enabled:false});
 console.log('PASS '+catalog.length+' games, physics, TV sync, access boundaries, reconnect identity, stop/restart');
 }finally{for(const ws of sockets)ws.terminate();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
