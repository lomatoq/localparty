'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),WS=require('ws');
const delay=ms=>new Promise(r=>setTimeout(r,ms));

test('one phone recovery, eight-player drops, and rapid game switches reject stale sessions',{timeout:60000},async t=>{
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'transition-test'}});
 let log='',base;const sockets=[];child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
 t.after(()=>{for(const ws of sockets)ws.terminate();child.kill();});
 async function until(fn,label){for(let i=0;i<250;i++){const value=await fn();if(value)return value;await delay(20);}throw Error(label+' '+log.slice(-500));}
 await until(()=>/localhost:(\d+)/.test(log),'server');base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 async function api(body){const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer transition-test','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const s=await r.json();assert.equal(r.status,200,JSON.stringify(s));return s;}
 async function connect(path='/lobby'){const ws=new WS(base.replace('http','ws')+path);sockets.push(ws);ws.messages=[];ws.on('message',raw=>ws.messages.push(JSON.parse(raw)));ws.on('error',()=>{});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return ws;}
 const send=(ws,m)=>ws.send(JSON.stringify(m));
 const joined=ws=>until(()=>ws.messages.find(m=>m.type==='joined'),'joined');
 async function lobby(person){const ws=await connect();send(ws,{...person.profile,type:'join',name:person.name,clientId:person.clientId});const profile=await joined(ws);if(person.profile)assert.equal(profile.id,person.profile.id);Object.assign(person,{ws,profile});}
 const people=[{name:'Один телефон',clientId:'transition-phone-0'}];await lobby(people[0]);
 for(let i=0;i<4;i++){
  people[0].ws.terminate();await until(async()=>(await api()).players.length===0,'single phone disappears');
  await lobby(people[0]);assert.equal((await api()).players.length,1,'single phone reconnect must not duplicate identity');
 }
 for(let i=1;i<8;i++){const person={name:'Переход '+i,clientId:'transition-phone-'+i};await lobby(person);people.push(person);}
 const html=await (await fetch(base+'/tv')).text(),display=await connect();send(display,{type:'display',key:JSON.parse(html.match(/PARTY_DISPLAY_KEY=(.*?);/)[1])});await until(async()=>(await api()).screens===1,'display');
 async function gameJoin(person,id){const ws=await connect('/games/'+id+'/ws');send(ws,{type:'join',data:{partyId:person.profile.id,partyToken:person.profile.token,name:person.name}});await joined(ws);person.game=ws;}
 let previous=null;
 for(const id of ['push','shrink','tankarena','push']){
  const run=(await api({type:'launch',id})).active;assert.notEqual(run.instance,previous?.instance);
  if(previous){
   // Delayed unload, pause, ready and exit packets from the destroyed iframe.
   for(const p of people){send(p.ws,{type:'game-status',instance:previous.instance,status:'ready'});send(p.ws,{type:'game-status',instance:previous.instance,status:'disconnected'});send(p.ws,{type:'ready-set',instance:previous.instance,ready:true});send(p.ws,{type:'pause-set',instance:previous.instance,paused:true});send(p.ws,{type:'exit-vote',instance:previous.instance});}
   await delay(80);const stale=(await api()).active;assert.equal(stale.instance,run.instance);assert.equal(stale.ui.phase,'waiting');assert.equal(stale.session.paused,false);assert.deepEqual(stale.session.readyIds,[]);
  }
  await Promise.all(people.map(p=>gameJoin(p,id)));
  for(const p of people){send(p.ws,{type:'game-status',instance:run.instance,status:'ready'});send(p.ws,{type:'ready-set',instance:run.instance,ready:true});}
  await until(async()=>['playing','countdown'].includes((await api()).active?.ui?.phase),'start '+id);
  if(!previous){
   const newcomer={name:'Не участник матча',clientId:'late-unjoined-phone'};await lobby(newcomer);
   send(newcomer.ws,{type:'pause-set',instance:run.instance,paused:true});
   await until(()=>newcomer.ws.messages.some(m=>m.type==='error'),'unjoined newcomer cannot pause');
   assert.equal((await api()).active.session.paused,false);newcomer.ws.terminate();
   await until(async()=>(await api()).players.length===8,'newcomer leaves');
  }
  await api({type:'pause',paused:true});
  const dropped=people.slice(0,3);for(const p of dropped)send(p.ws,{type:'game-status',instance:run.instance,status:'connecting'});await delay(50);
  for(const p of dropped){p.ws.terminate();p.game.terminate();}
  await until(async()=>(await api()).players.length===5,'three phones dropped');
  const interrupted=(await api()).active;assert.equal(interrupted.instance,run.instance);assert.equal(interrupted.roster.length,8,'match roster survives disconnect');
  await Promise.all(dropped.map(lobby));
  // The pause overlay is already visible while the iframe reconnects. Its resume
  // button must work for an authenticated member of this match, not lose the tap.
  send(dropped[0].ws,{type:'pause-set',instance:run.instance,paused:false});
  await until(async()=>!(await api()).active.session.paused,'resume while controller reconnects');
  await Promise.all(dropped.map(async p=>{await gameJoin(p,id);send(p.ws,{type:'game-status',instance:run.instance,status:'ready'});}));
  await until(async()=>{const s=await api();return s.players.length===8&&s.active.ready.length===8;},'eight controllers restored');
  assert.equal(new Set((await api()).players.map(p=>p.id)).size,8);
  await api({type:'stop'});assert.equal((await api()).active,null);
  await until(()=>people.every(p=>p.game.readyState===WS.CLOSED),'old game transports close');previous=run;
 }
 assert.equal((await api()).players.length,8,'rapid returns preserve all lobby profiles');
});
