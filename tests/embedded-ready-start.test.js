const test=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),WS=require('ws');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
test('embedded Push Pit waits for actual game joins even when both lobby ready flags arrive first', {timeout:20000},async()=>{
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_INTERNAL_PORT:'0',PARTY_ADMIN_KEY:'ready-regression',PARTY_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});let log='',base;const sockets=[];child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
 const until=async(fn,label)=>{for(let i=0;i<200;i++){if(await fn())return;await delay(30);}throw Error(label+' '+log.slice(-500));};
 try{await until(()=>/localhost:(\d+)/.test(log),'server');base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async data=>{const r=await fetch(base+'/api/manage',{method:data?'POST':'GET',headers:{Authorization:'Bearer ready-regression','Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});assert.equal(r.status,200);return r.json();};
 const connect=async path=>{const ws=new WS(base.replace('http','ws')+path);sockets.push(ws);ws.messages=[];ws.on('message',raw=>{ws.messages.push(JSON.parse(raw));});ws.on('error',()=>{});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});return ws;};const send=(ws,m)=>ws.send(JSON.stringify(m));
 const tv=await (await fetch(base+'/tv')).text(),display=await connect('/lobby');send(display,{type:'display',key:JSON.parse(tv.match(/PARTY_DISPLAY_KEY=(.*?);/)[1])});await until(async()=>(await api()).screens===1,'display');
 const people=[];for(let i=0;i<2;i++){const ws=await connect('/lobby');send(ws,{type:'join',name:'Ready player '+i});await until(()=>ws.messages.some(m=>m.type==='joined'),'profile');people.push({ws,profile:ws.messages.find(m=>m.type==='joined')});}
 const run=(await api({type:'launch',id:'push'})).active;
 const joinGame=async person=>{const ws=await connect('/games/push/ws');send(ws,{type:'join',data:{partyId:person.profile.id,partyToken:person.profile.token,name:person.profile.name}});await until(()=>ws.messages.some(m=>m.type==='joined'),'game join');return ws;};
 await joinGame(people[0]);
 for(const p of people){send(p.ws,{type:'game-status',instance:run.instance,status:'ready'});send(p.ws,{type:'ready-set',instance:run.instance,ready:true});}
 await until(async()=>{const s=await api();return s.active.session.readyIds.length===2;},'both ready');await delay(120);
 let s=await api();assert.equal(s.active.startError,null,'early UI-ready must not send a doomed start command');assert.equal(s.active.session.startRequested,false,'wait for second game socket');
 await joinGame(people[1]);await until(async()=>{const s=await api();return ['countdown','playing'].includes(s.active.ui.phase);},'automatic start after actual join');s=await api();assert.equal(s.active.startError,null);
 }finally{for(const ws of sockets)ws.terminate();child.kill();}
});
