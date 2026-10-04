'use strict';
// Pocket Strike art + feel review (derived from capture-bowling-upgrade.cjs): actual launcher, real phone swipes,
// engine states observed over the WebSocket, no state/score/physics injection. Captures the
// first throw in detail (aim idle, release, roll, impact/slow-motion angle, reveal, reset,
// return, lane-display score pop) and then the reveal of EVERY strike/spare/gutter until the
// match ends, labelled with the banner tier the scene chose (strike/double/turkey...).
// QA_OUTPUT=<dir> QA_TV=1280x720|1920x1080 QA_REDUCED=1 QA_FRAMES=3|5 node scripts/capture-bowling-art-feel.cjs
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/bowling-art-feel/after');fs.mkdirSync(out,{recursive:true});
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
async function shot(name){const file=`${name}-${suffix}${reducedMotion?'-reduced':''}.png`;const probe=await frame(tv)?.evaluate(()=>{const b=window.__bowlingScene;return b?{renderT:b.renderT,banner:b.banner.visible?{kind:b.bannerState?.kind,tier:b.bannerState?.tier}:null,fov:+b.camera.fov.toFixed(2),camera:b.camera.position.toArray().map(n=>+n.toFixed(2)),slowCam:!!(b.slowCam&&performance.now()<b.slowCam.until),feel:b.feel?.debug||null,display:b.extras?.display?.visible?{opacity:+b.extras.displayMat.opacity.toFixed(2),painted:b.extras.state.display?.painted}:null}:null;}).catch(()=>null);await tv.screenshot({path:path.join(out,file)});const s=tvState();report.screens.push({file,probe,at:new Date().toISOString(),stage:s?.stage,phase:s?.phase,t:s?.t,ball:s?.physics?.ball?{x:+s.physics.ball.x.toFixed(2),z:+s.physics.ball.z.toFixed(2)}:null,gutter:s?.physics?.gutter,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex')});save();console.log('shot',file,s?.stage);}
async function join(name){const c=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2,reducedMotion:reducedMotion?'reduce':'no-preference'});await c.addInitScript(()=>localStorage.setItem('local-party-language','en'));const p=await c.newPage();watch(p,name);await p.goto(origin+'/play');await p.locator('#name').fill(name);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);return p;}
async function setSliders(p,position,spin){const f=frame(p);await f.locator('#ss-position').fill(String(position));await f.locator('#ss-spin').fill(String(spin));}
async function swipe(p,{dx=0,strong=true}={}){const r=await frame(p).locator('#ss-throw-pad').boundingBox();const x0=r.x+r.width*.5,y0=r.y+r.height*.86,y1=r.y+r.height*.26;await p.mouse.move(x0,y0);await p.mouse.down();await sleep(90);
  if(strong){for(let i=1;i<=6;i++){await p.mouse.move(x0+dx*r.width*i/6,y0+(y1-y0)*i/6);await sleep(9);}}else{for(let i=1;i<=10;i++){await p.mouse.move(x0+dx*r.width*i/10,y0+(y1-y0)*.55*i/10);await sleep(25);}await sleep(160);}
  await p.mouse.up();}
const currentPhone=()=>phones.find(p=>playerIds.get(p)===tvState()?.currentId);
let idx=0;const sceneDbg=()=>frame(tv).evaluate(()=>{const b=window.__bowlingScene;return b?{stage:b.extras?.debug?.stage,age:b.extras?.debug?.age,banner:b.banner.visible,kind:b.bannerState?.kind,tier:b.bannerState?.tier,slow:!!(b.slowCam&&performance.now()<b.slowCam.until)}:null;}).catch(()=>null);
async function waitShot(name,pred,timeout=9000){const end=Date.now()+timeout;while(Date.now()<end){const d=await sceneDbg();if(d&&pred(d)){await shot(name);report.screens.at(-1).debug=d;save();return d;}await sleep(12);}report.errors.push({missed:name});save();return null;}
async function throwOne(plan){
  await until(()=>tvState()?.stage==='aim'&&currentPhone(),'aim stage',40000);const p=currentPhone(),token=tvState().turnToken,n=idx++;
  await setSliders(p,plan.position??0,plan.spin??0);
  if(plan.detail){await sleep(3600);await shot('01-aim-idle');}else await sleep(plan.aimWait??1500);
  const before=tvState().events.at(-1)?.id||0;await swipe(p,plan);
  await until(()=>tvState()?.stage==='rolling'&&tvState().turnToken===token,'rolling',5000);
  if(plan.detail){await sleep(120);await shot('02-release');await sleep(420);await shot('03-roll');
    // Reduced motion deliberately has no slow-camera beat; waiting for one
    // misses the reveal and the harness falsely times out after the next turn.
    if(reducedMotion)await shot('04-impact');
    else if(!await waitShot('04-impact-slowmo',d=>d.slow,6000))await shot('04-impact');
    await sleep(260);await shot('05-scatter');}
  if(plan.gutterShot){await until(()=>tvState()?.physics?.gutter||tvState()?.stage!=='rolling','gutter',8000);await sleep(420);if(tvState()?.physics?.gutter)await shot(`g${n}-gutter-roll`);}
  await until(()=>tvState()?.stage==='reveal'&&tvState().turnToken===token,'reveal',15000);
  const roll=tvState().events.filter(e=>e.id>before&&e.kind==='roll').at(-1);
  const d=await waitShot(`r${String(n).padStart(2,'0')}-reveal-${roll?.pins}`,d=>d.stage==='reveal'&&d.age>.5,4000);
  report.throws.push({index:n,plan,pins:roll?.pins,text:roll?.text,banner:d?{kind:d.kind,tier:d.tier,visible:d.banner}:null});save();console.log('throw',n,roll?.pins,d?.kind,d?.tier);
  if(plan.detail){await waitShot('06-reset-machine',d=>d.stage==='aim'&&d.age>.6&&d.age<1.3,6000);await waitShot('07-return-count',d=>d.stage==='aim'&&d.age>2.3&&d.age<3.4,6000);await waitShot('08-display-final',d=>d.stage==='aim'&&d.age>3.7&&d.age<5.5,6000);await waitShot('09-idle-breathing',d=>d.stage==='aim'&&d.age>6&&d.age<9,8000);}
}
(async()=>{try{
  await until(()=>/localhost:(\d+)/.test(log),'launcher listening');origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
  api=async body=>{const r=await fetch(origin+'/api/manage',{signal:AbortSignal.timeout(15000),method:body?'POST':'GET',headers:{Authorization:'Bearer bowling-upgrade','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json();if(!r.ok)throw Error(JSON.stringify(j));return j;};
  browser=await webkit.launch({headless:true});const c=await browser.newContext({viewport:{width:tvW,height:tvH},reducedMotion:reducedMotion?'reduce':'no-preference'});await c.addInitScript(()=>localStorage.setItem('local-party-language','en'));await c.addInitScript(PERF_HOOK);tv=await c.newPage();watch(tv,'tv');await tv.goto(origin+'/tv');
  await join('Alexandra LongSurname');await join('Виктория Александрова');
  await api({type:'settings',id:'bowling',settings:{frames:Number(process.env.QA_FRAMES||5)}});await api({type:'launch',id:'bowling'});
  for(const p of phones){await p.waitForFunction(()=>document.querySelector('#gameFrame')?.src.includes('/games/bowling/'));await until(()=>p.locator('#readyButton').isEnabled(),'ready enabled');await p.locator('#readyButton').click();}
  await until(()=>tvState()?.phase==='playing','playing');await until(()=>frame(tv)?.locator('#ss-scene canvas').count(),'canvas');await sleep(1500);
  report.memoryStart=await frame(tv).evaluate(()=>{const r=window.__bowlingScene?.renderer;return r?{...r.info.memory,programs:r.info.programs?.length}:null;}).catch(()=>null);
  await perfWindow('aim-idle',3000);
  await throwOne({position:.1,spin:-.3,detail:true});
  await throwOne({position:-1,spin:.8,dx:-.35,gutterShot:true});
  if(process.env.QA_PERF!=='0'){await until(()=>tvState()?.stage==='aim'&&currentPhone(),'aim stage',40000);const p=currentPhone();await setSliders(p,.1,-.3);await sleep(1500);await swipe(p,{});await until(()=>tvState()?.stage==='rolling','rolling',5000);await perfWindow('throw-roll-reveal-reset',6500);idx++;}
  const plans=[{position:.1,spin:-.35},{position:-.1,spin:.35},{position:.05,spin:-.2},{position:.1,spin:-.3},{position:-.25,spin:.6},{position:.2,spin:-.5}];let i=0;
  while(tvState()?.phase==='playing'){try{await throwOne({...plans[i++%plans.length]});}catch(e){if(tvState()?.phase!=='playing')break;throw e;}}
  report.memoryEnd=await frame(tv).evaluate(()=>{const r=window.__bowlingScene?.renderer;return r?{...r.info.memory,programs:r.info.programs?.length}:null;}).catch(()=>null);
  report.status='passed';console.log('PASS',report.screens.length,'screens',JSON.stringify(report.perf),JSON.stringify(report.errors.filter(e=>e.surface==='tv'||e.missed)).slice(0,600));
}catch(e){report.status='failed';report.failure=e.stack;console.error(e);process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();save();fs.writeFileSync(path.join(out,`server-${suffix}.log`),log);await browser?.close();child.kill();}})();
