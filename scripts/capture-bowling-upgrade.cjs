'use strict';
// Pocket Strike scene review: actual launcher, actual phone swipes, WebSocket-observed
// engine states. No state, score or physics injection. Frame timing is measured with a
// passive requestAnimationFrame/WebGL draw hook inside the TV game frame only.
// QA_OUTPUT=<dir> QA_TV=1280x720|1920x1080 QA_PHONE=1 node scripts/capture-bowling-upgrade.cjs
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/bowling-upgrade/after');fs.mkdirSync(out,{recursive:true});
const [tvW,tvH]=(process.env.QA_TV||'1280x720').split('x').map(Number),suffix='tv-'+tvH,wantPhone=process.env.QA_PHONE==='1',reducedMotion=process.env.QA_REDUCED==='1';
const report={startedAt:new Date().toISOString(),tv:{width:tvW,height:tvH},reducedMotion,method:'Actual managed launcher, two browser controllers, real pointer swipes and range inputs; TV states observed from the engine WebSocket. No state/score injection.',screens:[],throws:[],perf:[],errors:[]};
const save=()=>fs.writeFileSync(path.join(out,`report-${suffix}${reducedMotion?'-reduced':''}.json`),JSON.stringify(report,null,2));
let log='',browser,tv,phones=[],api,origin;const observed=new Map(),playerIds=new Map();
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'bowling-upgrade'}});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=30000){const end=Date.now()+timeout;while(Date.now()<end){const v=await fn();if(v)return v;await sleep(40);}throw Error('timeout: '+label);}
const frame=p=>p.frames().find(f=>f.url().includes('/games/bowling/'));
const tvState=()=>observed.get(tv);
function watch(p,label){p.on('pageerror',e=>report.errors.push({surface:label,error:e.message}));p.on('console',m=>{if(m.type()==='error')report.errors.push({surface:label,console:m.text()});});p.on('websocket',ws=>{if(!ws.url().includes('/games/bowling/'))return;ws.on('framereceived',f=>{try{const m=JSON.parse(f.payload);if(m.type==='state')observed.set(p,m.data);if(m.type==='joined')playerIds.set(p,m.data.id);}catch{}});});}
const PERF_HOOK=()=>{if(!location.pathname.includes('/games/bowling/'))return;const perf={frames:[],draws:0,drew:false};window.__bowlingPerf=perf;
  const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>{const start=performance.now();perf.drew=false;perf.draws=0;cb(t);if(perf.drew){perf.frames.push({at:start,ms:performance.now()-start,draws:perf.draws});if(perf.frames.length>4000)perf.frames.splice(0,1000);}});
  for(const C of [window.WebGL2RenderingContext,window.WebGLRenderingContext].filter(Boolean))for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const fn=C.prototype[name];if(fn)C.prototype[name]=function(...a){perf.drew=true;perf.draws++;return fn.apply(this,a);};}};
async function perfWindow(label,ms=4000){const f=frame(tv);await f.evaluate(()=>{window.__bowlingPerf.frames.length=0;});await sleep(ms);const r=await f.evaluate(()=>{const fr=window.__bowlingPerf.frames,ms=fr.map(x=>x.ms).sort((a,b)=>a-b),span=fr.length>1?(fr.at(-1).at-fr[0].at)/1000:0,q=p=>ms[Math.min(ms.length-1,Math.floor(ms.length*p))]||0;return {frames:fr.length,fps:span?+(fr.length/span).toFixed(1):0,cpuMsP50:+q(.5).toFixed(2),cpuMsP95:+q(.95).toFixed(2),cpuMsMax:+(ms.at(-1)||0).toFixed(2),drawCalls:fr.at(-1)?.draws||0,quality:document.body.dataset.renderQuality,heap:performance.memory?.usedJSHeapSize||null};});report.perf.push({label,...r});save();return r;}
async function shot(name){const file=`${name}-${suffix}${reducedMotion?'-reduced':''}.png`;const probe=await frame(tv)?.evaluate(()=>{const b=window.__bowlingScene;return b?{renderT:b.renderT,impact:b.impact,sparks:b.sparks.count,confetti:b.confetti.count,flash:b.flash.intensity,ring:b.ring.visible,banner:b.banner.visible,fov:b.camera.fov}:null;}).catch(()=>null);await tv.screenshot({path:path.join(out,file)});const s=tvState();report.screens.push({file,probe,at:new Date().toISOString(),stage:s?.stage,phase:s?.phase,t:s?.t,ball:s?.physics?.ball?{x:+s.physics.ball.x.toFixed(2),z:+s.physics.ball.z.toFixed(2)}:null,gutter:s?.physics?.gutter,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex')});save();console.log('shot',file,s?.stage);}
async function join(name){const c=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2,reducedMotion:reducedMotion?'reduce':'no-preference'});await c.addInitScript(()=>localStorage.setItem('local-party-language','en'));const p=await c.newPage();watch(p,name);await p.goto(origin+'/play');await p.locator('#name').fill(name);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);return p;}
async function setSliders(p,position,spin){const f=frame(p);await f.locator('#ss-position').fill(String(position));await f.locator('#ss-spin').fill(String(spin));}
async function swipe(p,{dx=0,strong=true}={}){const r=await frame(p).locator('#ss-throw-pad').boundingBox();const x0=r.x+r.width*.5,y0=r.y+r.height*.86,y1=r.y+r.height*.26;await p.mouse.move(x0,y0);await p.mouse.down();await sleep(90);
  if(strong){for(let i=1;i<=6;i++){await p.mouse.move(x0+dx*r.width*i/6,y0+(y1-y0)*i/6);await sleep(9);}}else{for(let i=1;i<=10;i++){await p.mouse.move(x0+dx*r.width*i/10,y0+(y1-y0)*.55*i/10);await sleep(25);}await sleep(160);}
  await p.mouse.up();}
const currentPhone=()=>phones.find(p=>playerIds.get(p)===tvState()?.currentId);
let rollIndex=0;
async function throwAndCapture(plan){
  await until(()=>tvState()?.stage==='aim'&&currentPhone(),'aim stage',40000);const p=currentPhone(),token=tvState().turnToken;
  await setSliders(p,plan.position??0,plan.spin??0);await sleep(plan.aimWait??1400);
  if(plan.aimShot)await shot(plan.aimShot);
  if(plan.aimShot){report.sceneProbe=await frame(tv).evaluate(()=>{const b=window.__bowlingScene;if(!b)return null;return {fov:b.camera.fov,camera:b.camera.position.toArray().map(n=>+n.toFixed(2)),guideVisible:b.guide.visible,guideOpacity:b.mat.guide.opacity,aimX:b.aimX,renderT:b.renderT,stage:b.buffer.at(-1).stage,deadline:b.buffer.at(-1).deadline,t:b.buffer.at(-1).t};});save();}
  const before=tvState().events.at(-1)?.id||0;await swipe(p,plan);
  await until(()=>tvState()?.stage==='rolling'&&tvState().turnToken===token,'rolling',5000);const rollStart=Date.now();
  if(plan.pauseInRoll){await sleep(700);await phones[0].locator('#pauseButton').click();await until(async()=>(await api()).active?.session?.paused,'paused');const t0=tvState().t;await sleep(900);await shot('paused-in-roll');await sleep(600);report.pauseFrozen=Math.abs(tvState().t-t0)<.05;await shot('paused-in-roll-later');await phones[0].locator('#resumeButton').click();await until(async()=>!(await api()).active?.session?.paused,'resumed');}
  if(plan.rollShot){await sleep(plan.rollDelay??420);await shot(plan.rollShot);}
  if(plan.perf){report.perf.push({label:'note',text:'roll window starts'});await perfWindow(plan.perf+'-roll',1600);}
  if(plan.gutterShot){await until(()=>tvState()?.physics?.gutter||tvState()?.stage!=='rolling','gutter',8000);await sleep(350);if(tvState()?.physics?.gutter)await shot(plan.gutterShot);}
  if(plan.impactShot){await until(()=>(tvState()?.physics?.ball?.z??0)< (plan.impactZ??-5.5)||tvState()?.stage!=='rolling','impact',8000);if(plan.impactDelay)await sleep(plan.impactDelay);await shot(plan.impactShot);}
  await until(()=>tvState()?.stage==='reveal'&&tvState().turnToken===token,'reveal',15000);
  const roll=tvState().events.filter(e=>e.id>before&&e.kind==='roll').at(-1),s=tvState(),me=s.players.find(q=>q.id===s.currentId),f=me.frames.at(-1).rolls;
  const kind=roll?.pins===10&&f.length===1||(roll?.pins===10&&me.frames.length===s.frameCount)?'strike':f.length>=2&&f.at(-2)+f.at(-1)===10&&f.at(-2)!==10?'spare':roll?.pins===0?'zero':'open';
  report.throws.push({index:rollIndex++,plan:{...plan},pins:roll?.pins,kind,rollSeconds:(Date.now()-rollStart)/1000,gutter:s.physics?.gutter});save();console.log('throw',rollIndex,plan.position,plan.spin,'pins',roll?.pins,kind,((Date.now()-rollStart)/1000).toFixed(1)+'s');
  if(kind==='strike'&&!report.gotStrike){report.gotStrike=true;await sleep(380);await shot('strike');}
  else if(kind==='spare'&&!report.gotSpare){report.gotSpare=true;await sleep(380);await shot('spare');}
  if(plan.settleShot){await sleep(650);await shot(plan.settleShot);}
  if(plan.resetShot){await until(()=>tvState()?.stage!=='reveal','reset',4000);await sleep(plan.resetDelay??180);await shot(plan.resetShot);if(plan.returnShot){await sleep(plan.returnDelay??520);await shot(plan.returnShot);}}
  return kind;
}
(async()=>{try{
  await until(()=>/localhost:(\d+)/.test(log),'launcher listening');origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
  api=async body=>{const r=await fetch(origin+'/api/manage',{signal:AbortSignal.timeout(15000),method:body?'POST':'GET',headers:{Authorization:'Bearer bowling-upgrade','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json();if(!r.ok)throw Error(JSON.stringify(j));return j;};
  browser=await webkit.launch({headless:true});const c=await browser.newContext({viewport:{width:tvW,height:tvH},reducedMotion:reducedMotion?'reduce':'no-preference'});await c.addInitScript(()=>localStorage.setItem('local-party-language','en'));await c.addInitScript(PERF_HOOK);tv=await c.newPage();watch(tv,'tv');await tv.goto(origin+'/tv');
  await join('Alexandra LongSurname');await join('Виктория Александрова');
  await api({type:'settings',id:'bowling',settings:{frames:3}});await api({type:'launch',id:'bowling'});
  for(const p of phones){await p.waitForFunction(()=>document.querySelector('#gameFrame')?.src.includes('/games/bowling/'));await until(()=>p.locator('#readyButton').isEnabled(),'ready enabled');await p.locator('#readyButton').click();}
  await until(()=>tvState()?.phase==='playing','playing');await until(()=>frame(tv)?.locator('#ss-scene canvas').count(),'canvas');await sleep(1500);
  report.renderQuality=await frame(tv).evaluate(()=>document.body.dataset.renderQuality);
  report.memoryStart=await frame(tv).evaluate(()=>{const r=window.__bowlingScene?.renderer;return r?{...r.info.memory,programs:r.info.programs?.length}:null;}).catch(()=>null);
  await perfWindow('aim-idle',3000);
  if(wantPhone){const p=currentPhone();await setSliders(p,.3,-.4);await sleep(300);await p.screenshot({path:path.join(out,'controller-aim-phone-393.png')});report.screens.push({file:'controller-aim-phone-393.png',stage:'aim'});}
  // 1: strong centre-pocket ball with every phase of the cycle.
  await throwAndCapture({position:.1,spin:-.3,aimShot:'aim',rollShot:'roll',impactShot:'impact',settleShot:'settle',resetShot:'reset',returnShot:'return',perf:'throw1'});
  // 2: deliberate gutter.
  await throwAndCapture({position:-1,spin:.8,dx:-.35,gutterShot:'gutter'});
  if(process.env.QA_QUICK==='1'){report.status='quick';return;}
  // 3: hook from the right, paused while rolling.
  await throwAndCapture({position:.55,spin:-.9,pauseInRoll:true,rollShot:'roll-hook',rollDelay:250});
  // Remaining throws until the match ends: alternate pocket attempts.
  const plans=[{position:.1,spin:-.35},{position:-.1,spin:.35},{position:.05,spin:-.2},{position:-.25,spin:.6},{position:.2,spin:-.5}];let i=0;
  while(tvState()?.phase==='playing'){try{await throwAndCapture({...plans[i++%plans.length],impactShot:!report.gotImpact2&&i===2?'impact-2':undefined});}catch(e){if(tvState()?.phase!=='playing')break;throw e;}}
  report.memoryEnd=await frame(tv).evaluate(()=>{const r=window.__bowlingScene?.renderer;return r?{...r.info.memory,programs:r.info.programs?.length}:null;}).catch(()=>null);
  await until(()=>tvState()?.phase==='results','results',40000);await sleep(1600);await shot('result');
  report.status='passed';console.log('PASS',report.screens.length,'screens',JSON.stringify(report.perf));
}catch(e){report.status='failed';report.failure=e.stack;console.error(e);process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();save();fs.writeFileSync(path.join(out,`server-${suffix}.log`),log);await browser?.close();child.kill();}})();
