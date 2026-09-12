const {spawn}=require('child_process'),fs=require('fs'),assert=require('assert/strict');
const {chromium}=require('C:/Users/nirrt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1'},windowsHide:true});let browser;const report={errors:[],games:[]};
 try{
  const port=await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{const m=String(d).match(/localhost:(\d+)/);if(m)resolve(m[1]);});setTimeout(()=>reject(Error('startup')),15000).unref();});
  browser=await chromium.launch({channel:'msedge',headless:true});const host=await browser.newPage({viewport:{width:3430,height:1300}});host.on('pageerror',e=>report.errors.push(e.message));await host.goto('http://localhost:'+port+'/host');
  await host.evaluate(()=>{window.qa=new WebSocket('ws://'+location.host+'/lobby');qa.onopen=()=>qa.send(JSON.stringify({type:'host',key:PARTY_HOST_KEY}));qa.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='state')window.qaState=m;};window.profiles=[];window.lobbySockets=[];});
  await host.evaluate(async()=>{await Promise.all(Array.from({length:16},(_,i)=>new Promise(resolve=>{const s=new WebSocket('ws://'+location.host+'/lobby');lobbySockets.push(s);s.onopen=()=>s.send(JSON.stringify({type:'join',freshIdentity:true,name:'Игрок '+(i+1)}));s.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='joined'){profiles.push(m);resolve();}};})));});
  for(const id of ['knives','bomb','push','western','shrink']){
   await host.evaluate(id=>qa.send(JSON.stringify({type:'launch',id})),id);await host.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);
   await host.evaluate(async id=>{window.gameSockets=[];await Promise.all(profiles.map(p=>new Promise(resolve=>{const s=new WebSocket('ws://'+location.host+'/games/'+id+'/ws');gameSockets.push(s);s.onopen=()=>s.send(JSON.stringify({type:'join',data:{partyId:p.id,partyToken:p.token,name:p.name}}));s.onmessage=e=>{if(JSON.parse(e.data).type==='joined')resolve();};})));},id);
   const frame=host.frames().find(f=>f.url().includes('/games/'+id+'/'));
   await frame.waitForFunction(()=>typeof state!=='undefined'&&state?.players.length===16&&window.PartyArt?.manifest);
   await frame.evaluate(mode=>socket.emit('startGame',{mode,maxRounds:5}),id);await frame.waitForFunction(()=>state.game.status==='playing');await host.waitForTimeout(400);
   if(id==='knives')await host.evaluate(()=>gameSockets.forEach(s=>s.send(JSON.stringify({type:'throw'}))));
   if(id==='knives')await frame.waitForFunction(()=>state.visualEvents.some(e=>e.kind.startsWith('knife')));
   const sample=await frame.evaluate(()=>new Promise(resolve=>{
    const samples=[],angles=[],ticks=new Set();let start=performance.now(),last=start;
    function tick(now){samples.push(now-last);last=now;const view=visualClock.sample(now);angles.push(view.drum.angle);ticks.add(state.visualTime);if(now-start<2200){requestAnimationFrame(tick);return;}
    const changes=angles.slice(1).filter((a,i)=>Math.abs(a-angles[i])>1e-7).length;samples.sort((a,b)=>a-b);
    resolve({samples:samples.length,p95:samples[Math.floor(samples.length*.95)],max:samples.at(-1),angleChanges:changes,snapshots:ticks.size,backing:[canvas.width,canvas.height],events:state.visualEvents.map(e=>e.kind),cacheBytes:(wheelCache?.width||0)*(wheelCache?.height||0)*4});
    }requestAnimationFrame(tick);
   }));
   if(id==='knives')assert(sample.angleChanges>sample.snapshots*1.5,'interpolated angle must advance between snapshots');
   assert(sample.backing[0]*sample.backing[1]<=5100000,'backing pixel budget');
   await host.screenshot({path:'tests/party-quality-'+id+'-16.png'});report.games.push({id,...sample});console.log(id,JSON.stringify(sample));
   if(id==='knives'){
    await host.evaluate(()=>lobbySockets[0].send(JSON.stringify({type:'pause-set',paused:true})));await host.waitForTimeout(200);
    const a=await frame.evaluate(()=>visualClock.sample(performance.now()).drum.angle);await host.waitForTimeout(300);const b=await frame.evaluate(()=>visualClock.sample(performance.now()).drum.angle);assert.equal(a,b,'pause stops interpolated angle');
    await host.evaluate(()=>lobbySockets[0].send(JSON.stringify({type:'pause-set',paused:false})));
   }
   await host.evaluate(()=>{gameSockets.forEach(s=>s.close());qa.send(JSON.stringify({type:'stop'}));});await host.waitForFunction(()=>!qaState.active);
  }
  assert.deepEqual(report.errors,[]);
 }finally{fs.writeFileSync('tests/party-stage-quality.json',JSON.stringify(report,null,2));await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
