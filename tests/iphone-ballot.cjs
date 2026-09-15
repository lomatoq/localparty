// Exercise automatic voting on the installed iOS Node runtime, not a desktop substitute.
const assert=require('node:assert/strict'),WS=require('ws');
const base=process.env.PARTY_TEST_ORIGIN||'http://127.0.0.1:8081',key=process.env.PARTY_TEST_KEY||'localparty-integration-test',all=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<400;i++){if(await fn())return;await delay(25);}throw Error(label);}
async function manage(m){const r=await fetch(base+'/api/manage',{method:m?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:m?JSON.stringify(m):undefined});const s=await r.json();assert.equal(r.status,200,JSON.stringify(s));return s;}
async function socket(route='/lobby',cookie=''){const ws=new WS(base.replace('http','ws')+route,{headers:{Cookie:cookie}});all.push(ws);ws.on('error',()=>{});ws.on('message',d=>{const m=JSON.parse(d);if(m.type==='joined')ws.profile=m.data||m;});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});return ws;}
const send=(ws,m)=>ws.send(JSON.stringify(m));
(async()=>{try{
 await until(async()=>{try{return !!(await manage()).catalog;}catch{return false;}},'server startup');
 await manage({type:'network-set',enabled:true});await manage({type:'stop'});for(const p of (await manage()).players)await manage({type:'kick',id:p.id});
 const response=await fetch(base+'/tv'),cookie=response.headers.get('set-cookie').split(';')[0],html=await response.text(),tv=await socket('/lobby',cookie);send(tv,{type:'display',key:JSON.parse(html.match(/PARTY_DISPLAY_KEY=(.*?);/)[1])});
 const players=[];for(let i=0;i<3;i++){const ws=await socket();send(ws,{type:'join',name:'Ballot '+i});await until(()=>ws.profile,'join');players.push(ws);}
 send(players[0],{type:'vote-game',id:'tanks'});send(players[1],{type:'vote-game',id:'tanks'});await until(async()=>(await manage()).votes.length===2,'partial');assert.equal((await manage()).active,null);
 send(players[2],{type:'vote-game',id:'push'});await until(async()=>(await manage()).active?.id==='tanks','automatic winner');const run=(await manage()).active;
 for(let i=0;i<3;i++){const c=await socket('/games/tanks/ws');send(c,{type:'join',data:{partyId:players[i].profile.id,partyToken:players[i].profile.token}});await until(()=>c.profile,'controller');if(i<2)assert.equal((await manage()).active.ui.phase,'waiting');}
 await until(async()=>(await manage()).active.ui.phase==='playing','automatic match start without ready taps');await delay(1000);assert.equal((await manage()).active.instance,run.instance);assert.equal((await manage()).votes.length,0);
 await manage({type:'stop'});await delay(350);assert.equal((await manage()).active,null);
 console.log('PASS installed iPhone runtime: all-voted winner, wait for 3 actual controllers, automatic playing, no duplicate match or stale replay');
 }finally{for(const s of all)s.terminate();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
