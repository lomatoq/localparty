'use strict';
// Swarm Gate visual/feel capture: real launcher, real server engine, two browser phones
// that join, press Ready and hold FIRE through the real controller. Test-only route
// instrumentation exposes aim (so the phones track live bugs) and read-only observation.
// No enemies, hits, deaths or scores are injected. Optional QA_BOTS adds built-in test
// controllers so more turrets stand on the wall.
//   PARTY_PLAYWRIGHT=... QA_OUTPUT=.localparty-build/swarm-gate-polish/after node scripts/capture-swarm-gate-polish.cjs
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.QA_OUTPUT||path.join(root,'.localparty-build/swarm-gate-polish/capture'));
const bots=Number(process.env.QA_BOTS??2),reducedMotion=process.env.QA_REDUCED==='1';
fs.mkdirSync(out,{recursive:true});
const report={method:'Real server + launcher; 2 browser phones join/Ready/hold FIRE via real controller, aim follows live bugs (test-only aim hook). '+bots+' built-in test controllers. No state/score injection.',reducedMotion,shots:[],perf:[],errors:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'swarm-polish'}});
let log='',browser,tracking=true;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
async function until(fn,label,ms=30000){const end=Date.now()+ms;while(Date.now()<end){const v=await fn();if(v)return v;await sleep(100);}throw Error('Timeout '+label);}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'server');const base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer swarm-polish','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();assert(r.ok,JSON.stringify(data));return data;};
 browser=await webkit.launch({headless:true});
 const tvContext=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:reducedMotion?'reduce':'no-preference'});
 await tvContext.addInitScript(()=>{try{localStorage.setItem('local-party-language','en');}catch{}});
 await tvContext.route(/\/games\/swarm_gate\/host\.js(?:\?.*)?$/,async route=>{const response=await route.fetch();await route.fulfill({response,body:(process.env.QA_HOST_FILE?fs.readFileSync(process.env.QA_HOST_FILE,'utf8'):await response.text())+`\nwindow.__swarmQA={get state(){return state},get view(){return view},events:[]};net.addEventListener('state',e=>{for(const ev of e.detail.events||[])if(!__swarmQA.events.some(v=>v.id===ev.id))__swarmQA.events.push(ev);if(__swarmQA.events.length>4000)__swarmQA.events.splice(0,1000);});`});});
 const tv=await tvContext.newPage();tv.on('pageerror',e=>report.errors.push('tv: '+e.message));report.console=[];tv.on('console',m=>{if(['error','warning'].includes(m.type()))report.console.push(m.text().slice(0,300));});
 await tv.goto(base+'/tv');
 const phones=[];
 for(const name of ['Gleb','Мария']){
  const c=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  await c.addInitScript(()=>{try{localStorage.setItem('local-party-language','en');}catch{}});
  await c.route(/\/games\/swarm_gate\/controls\.js(?:\?.*)?$/,async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.__feedbackAim=(x,y)=>{aim={x,y};updateCrosshair();sendInput();};'});});
  const p=await c.newPage();p.on('pageerror',e=>report.errors.push(name+': '+e.message));await p.goto(base+'/play');await p.locator('#name').fill(name);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);
 }
 if(bots){await api({type:'bots-set',count:bots});await until(async()=>(await api()).players.filter(p=>p.testBot).length===bots,'bot roster');}
 await api({type:'settings',id:'swarm_gate',settings:{waves:4}});
 await api({type:'launch',id:'swarm_gate'});
 for(const p of phones){await p.waitForFunction(()=>document.querySelector('#gameFrame')?.src.includes('/games/swarm_gate/'));await until(()=>p.locator('#readyButton').isEnabled(),'ready');await p.locator('#readyButton').click();}
 await until(async()=>(await api()).active?.ui?.phase==='playing','playing',40000);
 const host=()=>tv.frames().find(f=>f.url().includes('/games/swarm_gate/'));
 const ctrl=p=>p.frames().find(f=>f.url().includes('/games/swarm_gate/'));
 await until(()=>host(),'host frame');await host().waitForFunction(()=>window.__swarmQA&&window.__swarmQA.state);await host().locator('#ss-scene canvas').waitFor();
 for(const p of phones)await until(()=>ctrl(p),'controller frame');for(const p of phones)await ctrl(p).waitForFunction(()=>window.__feedbackAim);
 const diag=async()=>host().evaluate(()=>{try{const d=window.__ssSwarmDiag?.();return d&&{camera:d.camera,turrets:d.turrets.map(t=>({pivot:t.pivot,base:t.base,muzzle:t.muzzle,muzzleRayError:t.muzzleRayError,number:t.number})),enemies:d.enemies.length,gate:d.gate,stage:d.stage};}catch(e){return {error:e.message};}});
 const shot=async(name,sizes=[[1280,720],[1920,1080]])=>{for(const [w,h] of sizes){await tv.setViewportSize({width:w,height:h});await sleep(140);const file=path.join(out,`${name}-${h}.png`);await tv.screenshot({path:file});const s=await host().evaluate(()=>{const s=__swarmQA.state;return{t:s.t,stage:s.stage,wave:s.wave,gate:s.gate,enemies:s.enemies.length,atGate:s.enemies.filter(e=>e.z>=-2).length,scores:s.players.map(p=>[p.name,p.score,p.kills])};});report.shots.push({name,file:path.relative(root,file),width:w,height:h,state:s,diag:await diag()});}await tv.setViewportSize({width:1280,height:720});};
 const burst=async(name,count=6,gap=55)=>{for(let i=0;i<count;i++){const file=path.join(out,`${name}-burst${i}.png`);await tv.screenshot({path:file});report.shots.push({name:name+'-burst'+i,file:path.relative(root,file)});await sleep(gap);}};
 // Aim each phone at a distinct live bug (nearest to the gate first) and hold FIRE.
 let firing=false;const holdFire=async on=>{for(const p of phones){const r=await ctrl(p).locator('#ss-fire').boundingBox();const box={x:r.x+r.width/2,y:r.y+r.height/2};await p.mouse.move(box.x,box.y);if(on)await p.mouse.down();else await p.mouse.up();}firing=on;};
 const track=(async()=>{while(tracking){try{const targets=await host().evaluate(()=>{const s=__swarmQA.state;return (s.enemies||[]).filter(t=>t.hp>0).sort((a,b)=>b.z-a.z).slice(0,4).map(t=>({x:Math.max(0,Math.min(1,t.x/36+.5)),y:Math.max(0,Math.min(1,(t.z+27)/26))}));});for(let i=0;i<phones.length;i++){const t=targets[i%Math.max(1,targets.length)];if(t&&firing)await ctrl(phones[i]).evaluate(t=>__feedbackAim(t.x,t.y),t);}}catch{}await sleep(70);}})();
 // 1) break / opening composition before wave 1
 await shot('01-opening');
 await until(()=>host().evaluate(()=>__swarmQA.state.stage==='wave'),'wave 1 start',30000);await sleep(250);await burst('01b-wave-horn-720',3,220);
 await until(()=>host().evaluate(()=>__swarmQA.state.stage==='wave'&&__swarmQA.state.enemies.length>6),'wave 1 bugs',30000);
 await shot('02-wave-start');
 await holdFire(true);
 await until(()=>host().evaluate(()=>__swarmQA.events.filter(e=>e.kind==='shot'&&e.dead).length>=3),'kills',25000);
 await shot('03-firing');await sleep(300);await burst('04-kill-720');
 await tv.setViewportSize({width:1920,height:1080});await sleep(150);await burst('05-kill-1080',4,70);await tv.setViewportSize({width:1280,height:720});
 // perf: frame intervals during real firing
 const perf=await host().evaluate(()=>new Promise(res=>{const d=[];let last=performance.now(),n=0;const f=t=>{d.push(t-last);last=t;if(++n<180)requestAnimationFrame(f);else{d.sort((a,b)=>a-b);res({frames:d.length,median:d[d.length>>1],p95:d[Math.floor(d.length*.95)],max:d[d.length-1],effects:window.__swarmQA.view.effects.length,sceneChildren:window.__swarmQA.view.scene.children.length,fx:window.__swarmQA.view.swarmFX?.stats?.()||null});}};requestAnimationFrame(f);}));report.perf.push({label:'firing-1280',...perf});
 if(process.env.QA_QUICK==='1')throw Object.assign(Error('quick stop'),{quick:true});
 // 2) stop firing so the swarm reaches the gate: chewing, gate damage, occluded silhouettes
 await holdFire(false);
 let gateReached=false;try{await until(()=>host().evaluate(()=>__swarmQA.state.enemies.filter(e=>e.z>=-2).length>=4),'enemies at gate',Number(process.env.QA_GATE_WAIT||45000));gateReached=true;}catch(e){report.gate='not reached: '+e.message;}
 if(gateReached){await sleep(Number(process.env.QA_CHEW_MS||1500));await shot('06-gate-chewed');await burst('07-gate-720',3,90);}
 // 3) resume defence: diagonal shots at the gate crowd, kills near the wall
 await holdFire(true);await sleep(1200);await shot('08-defend-gate');await burst('09-defend-720',4,60);
 const perf2=await host().evaluate(()=>new Promise(res=>{const d=[];let last=performance.now(),n=0;const f=t=>{d.push(t-last);last=t;if(++n<180)requestAnimationFrame(f);else{d.sort((a,b)=>a-b);res({frames:d.length,median:d[d.length>>1],p95:d[Math.floor(d.length*.95)],max:d[d.length-1],effects:window.__swarmQA.view.effects.length,sceneChildren:window.__swarmQA.view.scene.children.length});}};requestAnimationFrame(f);}));report.perf.push({label:'defend-1280',...perf2});
 // 4) try to clear the wave for the break/repair moment (bounded wait)
 try{await until(()=>host().evaluate(()=>__swarmQA.state.stage==='break'&&__swarmQA.state.wave>=1),'wave clear',60000);await sleep(400);await shot('10-wave-clear');await sleep(1500);await shot('11-repair');}catch(e){report.waveClear='not reached: '+e.message;}
 await holdFire(false);tracking=false;await track;
 const events=await host().evaluate(()=>__swarmQA.events.filter(e=>e.kind==='shot'));report.shotsFired=events.length;report.kills=events.filter(e=>e.dead).length;report.awarded=events.reduce((a,e)=>a+(e.awardedScore||0),0);
 const errors=await host().evaluate(()=>window.__swarmErrors||[]);report.hostErrors=errors;
 assert.deepEqual(report.errors,[]);report.status='passed';console.log('PASS',report.shots.length,'captures',JSON.stringify(report.perf));
}catch(e){if(e.quick){tracking=false;report.status='quick';}else{report.status='failed';report.failure=e.stack;console.error(e);process.exitCode=1;}}finally{tracking=false;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close().catch(()=>{});child.kill();setTimeout(()=>process.exit(),500);}})();
