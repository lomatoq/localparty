'use strict';
// Runs against the actual embedded Node runtime in the installed simulator app.
// Keep /tv open in a browser or the app's external-display window (AirPlay /
// Simulator > I/O > External Displays). No clicks on that screen are made here.
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
async function run(){
 const initial=await manage();assert.equal(initial.catalog.length,26);await manage({type:'server-start'});assert.equal((await manage()).sessionLimit,undefined);
 assert.equal((await fetch(origin+'/api/manage')).status,403);assert.equal((await fetch(origin+'/host')).status,403);
 const res=await fetch(origin+'/tv'),html=await res.text(),cookie=res.headers.get('set-cookie').split(';')[0],displayKey=JSON.parse(html.match(/PARTY_DISPLAY_KEY=(.*?);/)[1]);assert.ok(!html.includes('<button'),'TV has no buttons');
 const screen=await socket('/lobby',cookie);send(screen,'display',{key:displayKey});await until(()=>screen.messages.some(m=>m.type==='display-ok'),'display auth');send(screen,'launch',{id:'tanks'});await until(()=>screen.messages.some(m=>m.type==='error'),'TV cannot launch');
 let guests=[];const catalog=initial.catalog.filter(g=>!process.env.PARTY_TEST_GAMES||process.env.PARTY_TEST_GAMES.split(',').includes(g.id));
 for(const game of catalog){
  await manage({type:'stop'});for(const g of guests)g.terminate();guests=[];await until(async()=>(await manage()).players.length===0,'empty lobby');
  for(let i=0;i<game.min;i++){const guest=await socket();send(guest,'join',{name:'Test '+i});await until(()=>guest.profile,'guest');guests.push(guest);}
  const settings=Object.fromEntries(game.hostControls.settings.map(f=>[f.id,f.initial]));
  if(game.id==='tanks')settings.mode='ctf';if(game.id==='kart')settings.laps='3';if(game.id==='shrink')settings.shrinkSpeed='fast';
  await manage({type:'settings',id:game.id,settings});await until(()=>screen.messages.some(m=>m.selected===game.id),'TV selection');
  const run=(await manage({type:'launch',id:game.id})).active;
  for(const route of [game.host,game.player])assert.equal((await fetch(origin+'/games/'+game.id+route,{headers:{Cookie:cookie}})).status,200,game.id+' '+route);
  const controls=[];for(const g of guests)controls.push(await controller(game,g.profile));
  for(const g of guests)send(g,'game-status',{instance:run.instance,status:'ready'});
  await until(async()=>(await manage()).active.ready.length===guests.length,'controllers ready');
  // Even a trusted display cannot bypass readiness or change native settings.
  const engine=game.engine||game.id;
  const host=await socket('/games/'+game.id+(['spy','monster','millionaire'].includes(engine)?'/socket.io/?EIO=4&transport=websocket':'/ws'+(engine==='chaos'?'?type=host':engine==='crane'?'?role=host':'')),cookie,['spy','monster','millionaire'].includes(engine));
  if(!host.io)send(host,['party','tanks'].includes(engine)?'registerHost':'host');else send(host,'host:hello');
  for(const type of ['start','startGame','host_start','configure','host:start','host:settings'])send(host,type,{data:'survival',settings:{mode:'solo'},mode:'survival'});
  await delay(200);assert.equal((await manage()).active.session.startRequested,false,'TV cannot start '+game.id);
  send(guests[0],'ready-set',{instance:run.instance,ready:true});await delay(100);assert.equal((await manage()).active.session.startRequested,false,'wait for everyone');
  for(const guest of guests)send(guest,'ready-set',{instance:run.instance,ready:true});
  await until(async()=>{const s=await manage();if(s.active.startError)throw Error(game.id+': '+s.active.startError);return s.active.ui.phase!=='waiting';},game.id+' native start',20000);
  let state=await manage();assert.equal(state.active.instance,run.instance);assert.equal(state.active.session.startRequested,true);assert.deepEqual(state.active.settings,settings);
  if(game.id==='tanks'){await until(()=>host.messages.some(m=>m.data?.game?.mode==='ctf'),'actual tank mode');}
  if(game.id==='kart'){await until(()=>controls[0].messages.some(m=>m.laps===3),'actual kart laps');}
  if(['quiz','millionaire','crocodile','drawguess','naval'].includes(engine)){
   const action=game.hostControls.actions.find(a=>a.phases.includes(state.active.ui.phase));
   if(action){await manage({type:'game-action',instance:run.instance,action:action.id});await delay(100);state=await manage();assert.equal(state.active.instance,run.instance,'native action keeps match');assert.ok(['reveal','results'].includes(state.active.ui.phase),game.id+' native '+action.id);const advance=game.hostControls.actions.find(a=>a.id==='next'&&a.phases.includes(state.active.ui.phase));if(advance)await manage({type:'game-action',instance:run.instance,action:advance.id});}
  }
  // Force suspension and restore without a separate Continue command. Preserve manual pause.
  await manage({type:'execution',allowed:false});assert.equal((await manage()).active.session.pauseReason,'host-background');
  await manage({type:'execution',allowed:true});assert.equal((await manage()).active.session.paused,false);
  await manage({type:'pause',paused:true});await manage({type:'execution',allowed:false});await manage({type:'execution',allowed:true});assert.equal((await manage()).active.session.paused,true);
  send(screen,'display-pause',{paused:false,instance:run.instance});await delay(80);assert.equal((await manage()).active.session.paused,true,'display has no resume rights');await manage({type:'pause',paused:false});
  const old=guests[0],replacement=await socket();send(replacement,'join',{token:old.profile.token,name:old.profile.name});await until(()=>replacement.profile,'resume profile');assert.equal(replacement.profile.id,old.profile.id);guests[0]=replacement;await delay(100);assert.equal((await manage()).players.length,game.min,'no duplicate player');
  const resumed=await controller(game,replacement.profile);await delay(100);assert.equal((await manage()).active.instance,run.instance);await manage({type:'kick',id:replacement.profile.id});
  await until(()=>resumed.readyState===WS.CLOSED,game.id+' removed controller closes');
  await until(()=>replacement.messages.some(m=>m.type==='kicked'),game.id+' removed lobby closes');
  assert.equal((await manage()).players.length,game.min-1,'removed from room');
  const denied=await socket();send(denied,'join',{token:replacement.profile.token,name:replacement.profile.name});await until(()=>denied.messages.some(m=>m.type==='kicked'),'removed profile cannot auto rejoin');denied.terminate();
  for(const ws of [...controls,host])ws.terminate();
  console.log('PASS '+game.id+' phone settings/start, readiness, TV read-only, pause/resume, identity, removal');
 }
 await manage({type:'server-stop'});assert.equal((await fetch(origin+'/')).status,503);await manage({type:'server-start'});assert.equal((await fetch(origin+'/')).status,200);await manage({type:'server-stop'});
 console.log('PASS all '+catalog.length+' games in installed iPhone runtime');
}
run().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(()=>{for(const s of sockets)s.terminate();});
