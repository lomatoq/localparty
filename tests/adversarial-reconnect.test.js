'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),WS=require('ws');
const delay=ms=>new Promise(r=>setTimeout(r,ms));

// Fixed seeds make failures reproducible. Every wave ends with a barrier and
// identity assertions; merely keeping the server process alive is not success.
for(const seed of [73,20260919])test(`16-phone adversarial reconnect, seed ${seed}`,{timeout:60000},async t=>{
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'chaos-test'}});
 let log='',base,random=seed;const sockets=[],trace=[];
 child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
 t.after(()=>{for(const ws of sockets)ws.terminate();child.kill();});
 const rng=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random;};
 async function until(fn,label){for(let i=0;i<300;i++){const value=await fn();if(value)return value;await delay(20);}throw Error(`${label}\n${trace.join('\n')}\n${log.slice(-1000)}`);}
 await until(()=>/localhost:(\d+)/.test(log),'server');base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 async function api(body){const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer chaos-test','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const s=await r.json();assert.equal(r.status,200,JSON.stringify(s));return s;}
 async function connect(path='/lobby'){const ws=new WS(base.replace('http','ws')+path);sockets.push(ws);ws.messages=[];ws.on('message',raw=>ws.messages.push(JSON.parse(raw)));ws.on('error',()=>{});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return ws;}
 const send=(ws,m)=>ws.send(JSON.stringify(m));
 async function join(p,extra={}){const ws=await connect();send(ws,{...p.profile,type:'join',name:p.name,clientId:p.clientId,...extra});const profile=await until(()=>ws.messages.find(m=>m.type==='joined'),'join '+p.name);if(p.profile){assert.equal(profile.id,p.profile.id);assert.equal(profile.token,p.profile.token);}return {ws,profile};}
 const people=Array.from({length:16},(_,i)=>({name:'Chaos '+i,clientId:`chaos-${seed}-${i}`}));
 for(const p of people)Object.assign(p,await join(p));
 const original=people.map(p=>p.profile.id).sort();
 async function barrier(){await until(async()=>(await api()).players.length===16,'all 16 restored');assert.deepEqual((await api()).players.map(p=>p.id).sort(),original);for(const p of people){const n=p.ws.messages.length;send(p.ws,{type:'ping'});await until(()=>p.ws.messages.slice(n).some(m=>m.type==='pong'),'live controller '+p.name);}}
 // A seventeenth phone and a name impersonator must not displace anyone.
 for(const payload of [{name:'Seventeen',clientId:'extra-phone'},{name:people[0].name,clientId:'impostor',id:people[0].profile.id}]){const ws=await connect();send(ws,{type:'join',...payload});await until(()=>ws.messages.some(m=>m.type==='error'),'rejected outsider');assert.ok(!ws.messages.some(m=>m.type==='joined'));ws.terminate();}
 const html=await(await fetch(base+'/tv')).text(),key=JSON.parse(html.match(/PARTY_DISPLAY_KEY=(.*?);/)[1]);
 let display=await connect();send(display,{type:'display',key});await until(async()=>(await api()).screens===1,'display');
 let oldRun;
 for(const game of ['push','shrink','push']){
  const run=(await api({type:'launch',id:game})).active;trace.push('launch '+game+' '+run.instance);
  // All 16 reload at a full lobby, while new tabs compete for the same slot.
  await Promise.all(people.map(async(p,i)=>{
   await delay(rng()%25);const previous=p.ws;
   if(i%3===0)previous.terminate();
   Object.assign(p,await join(p,i%2?{}:{token:'expired-token',recoverId:p.profile.id}));
   if(i%4===0){const displaced=p.ws;Object.assign(p,await join(p));await until(()=>displaced.readyState===WS.CLOSED,'duplicate tab displaced');}
   await until(()=>previous.readyState===WS.CLOSED,'old connection closed');
   // Malformed/unknown frames must not poison subsequent valid commands.
   for(const raw of ['{','null','[]',JSON.stringify({type:'unknown',data:{instance:run.instance}})])p.ws.send(raw);
   if(oldRun)for(const type of ['ready-set','pause-set','exit-vote','game-status'])send(p.ws,{type,instance:oldRun.instance,ready:true,paused:true,vote:true,status:'ready'});
  }));
  await barrier();assert.equal((await api()).active.instance,run.instance);assert.equal((await api()).active.session.paused,false);
  // Drop and replace the display at the same time as the player handshakes.
  display.terminate();display=await connect();send(display,{type:'display',key});
  await Promise.all(people.map(async p=>{p.game=await connect('/games/'+game+'/ws');send(p.game,{type:'join',data:{partyId:p.profile.id,partyToken:p.profile.token,name:p.name}});await until(()=>p.game.messages.some(m=>m.type==='joined'),'game join');send(p.ws,{type:'game-status',instance:run.instance,status:'ready'});}));
  // Last player is not ready: toggles and duplicate packets must not start early.
  for(const p of people.slice(0,-1))for(const ready of [true,false,true,true])send(p.ws,{type:'ready-set',instance:run.instance,ready});
  await until(async()=>(await api()).active.session.readyIds.length===15,'15 ready');
  assert.equal((await api()).active.ui.phase,'waiting');
  send(people.at(-1).ws,{type:'ready-set',instance:run.instance,ready:true});
  await until(async()=>['playing','countdown'].includes((await api()).active?.ui?.phase),'game usable after chaos');
  await api({type:'pause',paused:true});
  // Every lobby transport disappears while the independent game sockets remain.
  for(const p of people)p.ws.terminate();
  await until(async()=>(await api()).players.length===0,'entire room offline');
  assert.equal((await api()).active.instance,run.instance);
  await Promise.all(people.map(async p=>Object.assign(p,await join(p))));await barrier();
  send(people[0].ws,{type:'pause-set',instance:run.instance,paused:false});
  await until(async()=>!(await api()).active.session.paused,'resume after total disconnect');
  // The opposite split-brain: lobby is healthy, all game transports disappear.
  // Resume must still work before their UI-ready acknowledgements arrive.
  await api({type:'pause',paused:true});
  for(const p of people){send(p.ws,{type:'game-status',instance:run.instance,status:'connecting'});p.game.terminate();}
  await until(async()=>(await api()).active.ready.length===0,'all game UIs disconnected');
  send(people.at(-1).ws,{type:'pause-set',instance:run.instance,paused:false});
  await until(async()=>!(await api()).active.session.paused,'resume with all game transports missing');
  await Promise.all(people.map(async p=>{await delay(rng()%30);p.game=await connect('/games/'+game+'/ws');send(p.game,{type:'join',data:{partyId:p.profile.id,partyToken:p.profile.token,name:p.name}});await until(()=>p.game.messages.some(m=>m.type==='joined'),'game recovery');send(p.ws,{type:'game-status',instance:run.instance,status:'ready'});}));
  await until(async()=>(await api()).active.ready.length===16,'all game UIs restored');
  assert.equal((await api()).active.instance,run.instance);
  await api({type:'stop'});await until(()=>people.every(p=>p.game.readyState===WS.CLOSED),'no zombie game connections');assert.equal((await api()).active,null);oldRun=run;
 }
 await barrier();t.diagnostic(`seed=${seed}; 3 launches; 108 lobby recoveries + 48 game recoveries; 16 identities intact`);
});
