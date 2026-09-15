// Sixteen real WebSocket clients against the installed iPhone application.
const assert=require('node:assert/strict'),WS=require('ws');
const base=process.env.PARTY_TEST_ORIGIN||'http://127.0.0.1:8081',key=process.env.PARTY_TEST_KEY||'localparty-integration-test';
const delay=ms=>new Promise(r=>setTimeout(r,ms)),all=[];
async function manage(m){const r=await fetch(base+'/api/manage',{method:m?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:m?JSON.stringify(m):undefined,signal:AbortSignal.timeout(4000)});const s=await r.json();assert.equal(r.status,200,JSON.stringify(s));return s;}
async function until(fn,label){for(let i=0;i<400;i++){if(await fn())return;await delay(25);}throw Error(label);}
async function socket(route='/lobby',cookie=''){const ws=new WS(base.replace('http','ws')+route,{headers:{Cookie:cookie}});all.push(ws);ws.on('error',()=>{});ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='joined')ws.profile=m.data||m;if(m.type==='state'){ws.state=m.data||m;ws.frames=(ws.frames||0)+1;const t=performance.now();if(ws.last)ws.maxGap=Math.max(ws.maxGap||0,t-ws.last);ws.last=t;}});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});return ws;}
const send=(ws,m)=>ws.send(JSON.stringify(m));
(async()=>{let input;try{
 await until(async()=>{try{return !!(await manage()).catalog;}catch{return false;}},'server startup');
 await manage({type:'network-set',enabled:true});await manage({type:'stop'});for(const p of (await manage()).players)await manage({type:'kick',id:p.id});
 const htmlResponse=await fetch(base+'/tv'),cookie=htmlResponse.headers.get('set-cookie').split(';')[0],html=await htmlResponse.text();const display=await socket('/lobby',cookie);send(display,{type:'display',key:JSON.parse(html.match(/PARTY_DISPLAY_KEY=(.*?);/)[1])});
 const guests=[];for(let i=0;i<16;i++){const ws=await socket();send(ws,{type:'join',name:'Load '+i});await until(()=>ws.profile,'join');guests.push(ws);}
 for(let i=0;i<guests.length;i++)send(guests[i],{type:'vote-game',id:i%2?'tanks':'push'});
 await until(async()=>(await manage()).votes.length===16,'16 votes');
 const run=(await manage({type:'launch',id:'tanks'})).active,controls=[];
 for(const g of guests){const c=await socket('/games/tanks/ws');send(c,{type:'join',data:{partyId:g.profile.id,partyToken:g.profile.token}});await until(()=>c.profile,'controller');controls.push(c);send(g,{type:'ready-set',ready:true,instance:run.instance});}
 await until(async()=>(await manage()).active.ui.phase==='playing','start');
 const screen=await socket('/games/tanks/ws',cookie);send(screen,{type:'registerHost'});
 input=setInterval(()=>{for(const c of controls)if(c.readyState===1)send(c,{type:'input',data:{forward:true,fire:true}});},33);
 const latency=[],rss=[];
 for(let i=0;i<120;i++){
  const start=performance.now(),state=await manage();latency.push(performance.now()-start);rss.push(state.metrics.rssMB);assert.equal(state.players.length,16);assert.equal(state.active.instance,run.instance);
  if(i%12===0){const old=guests[0],newer=await socket();send(newer,{...old.profile,type:'join'});await until(()=>newer.profile,'reconnect');assert.equal(newer.profile.id,old.profile.id);guests[0]=newer;const oldController=controls[0],replacement=await socket('/games/tanks/ws');send(replacement,{type:'join',data:{partyId:newer.profile.id,partyToken:newer.profile.token}});await until(()=>replacement.profile,'controller resume');assert.equal(replacement.profile.id,oldController.profile.id);controls[0]=replacement;oldController.terminate();}
  await delay(250);
 }
 latency.sort((a,b)=>a-b);assert.ok(screen.frames>300,'continuous game frames');assert.ok(Math.max(...latency)<1500,'management stall');
 console.log(JSON.stringify({players:16,reconnections:10,frames:screen.frames,maxFrameGapMs:Math.round(screen.maxGap),requestP95Ms:Math.round(latency[Math.floor(latency.length*.95)]),requestMaxMs:Math.round(latency.at(-1)),rssMB:[Math.min(...rss),Math.max(...rss)]}));
 await manage({type:'network-set',enabled:false});console.log('PASS iPhone 16-player load');
 }finally{clearInterval(input);for(const s of all)s.terminate();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
