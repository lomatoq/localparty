'use strict';
// Pocket Strike extras/pinsetter sequence review (derived from capture-bowling-upgrade.cjs): actual launcher, actual phone swipes, WebSocket-observed
// engine states. No state, score or physics injection. Frame timing is measured with a
// passive requestAnimationFrame/WebGL draw hook inside the TV game frame only.
// QA_OUTPUT=<dir> QA_TV=1280x720|1920x1080 QA_PHONE=1 node scripts/capture-bowling-upgrade.cjs
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/bowling-extras/after');fs.mkdirSync(out,{recursive:true});
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
const dbg=()=>frame(tv).evaluate(()=>window.__bowlingScene?.extras?.debug||null).catch(()=>null);
async function seqShot(name,pred,timeout=12000){const end=Date.now()+timeout;while(Date.now()<end){const d=await dbg();if(d&&pred(d)){await shot(name);report.screens.at(-1).debug=d;save();return true;}await sleep(15);}report.errors.push({missed:name});save();return false;}
let n=0;
async function throwSeq(plan){
  await until(()=>tvState()?.stage==='aim'&&currentPhone(),'aim stage',40000);const p=currentPhone(),token=tvState().turnToken,tag=plan.tag;
  await setSliders(p,plan.position??0,plan.spin??0);await sleep(plan.aimWait??1800);
  if(plan.aim)await shot(tag+'-aim');
  await swipe(p,plan);
  await until(()=>tvState()?.stage==='rolling'&&tvState().turnToken===token,'rolling',5000);
  if(plan.roll){await sleep(500);await shot(tag+'-roll');}
  if(plan.impact){await until(()=>(tvState()?.physics?.ball?.z??0)<-8.3||tvState()?.stage!=='rolling','impact',8000);await sleep(120);await shot(tag+'-impact');}
  await seqShot(tag+'-1-reveal',d=>d.stage==='reveal'&&d.age>.45);
  await seqShot(tag+'-2-pit',d=>d.stage==='reveal'&&d.age>1.0);
  await seqShot(tag+'-3-sweepdown',d=>d.stage==='reveal'&&d.age>1.42);
  await seqShot(tag+'-4-sweeping',d=>d.stage==='aim'&&d.age>.22&&d.age<1);
  await seqShot(tag+'-5-setting',d=>d.stage==='aim'&&d.age>.68&&d.age<1.4);
  await seqShot(tag+'-6-rising',d=>d.stage==='aim'&&d.age>1.25&&d.age<2);
  await seqShot(tag+'-7-aim-again',d=>d.stage==='aim'&&d.age>2.6&&d.age<5);
  const s=tvState(),roll=s.events.filter(e=>e.kind==='roll').at(-1);report.throws.push({tag,pins:roll?.pins,text:roll?.text});save();console.log('throw',tag,roll?.pins);
}
(async()=>{try{
  await until(()=>/localhost:(\d+)/.test(log),'launcher listening');origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
  api=async body=>{const r=await fetch(origin+'/api/manage',{signal:AbortSignal.timeout(15000),method:body?'POST':'GET',headers:{Authorization:'Bearer bowling-upgrade','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json();if(!r.ok)throw Error(JSON.stringify(j));return j;};
  browser=await webkit.launch({headless:true});const c=await browser.newContext({viewport:{width:tvW,height:tvH},reducedMotion:reducedMotion?'reduce':'no-preference'});await c.addInitScript(()=>localStorage.setItem('local-party-language','en'));await c.addInitScript(PERF_HOOK);tv=await c.newPage();watch(tv,'tv');await tv.goto(origin+'/tv');
  await join('Alexandra LongSurname');await join('Виктория Александрова');
  await api({type:'settings',id:'bowling',settings:{frames:3}});await api({type:'launch',id:'bowling'});
  for(const p of phones){await p.waitForFunction(()=>document.querySelector('#gameFrame')?.src.includes('/games/bowling/'));await until(()=>p.locator('#readyButton').isEnabled(),'ready enabled');await p.locator('#readyButton').click();}
  await until(()=>tvState()?.phase==='playing','playing');await until(()=>frame(tv)?.locator('#ss-scene canvas').count(),'canvas');await sleep(1500);
  await perfWindow('aim-idle',3000);
  if(process.env.QA_AB==='1'){ // A/B: same scene with the extras' meshes hidden (GPU cost of the extras)
    for(const k of [1,2]){await frame(tv).evaluate(()=>{const x=window.__bowlingScene.extras;x.objects.forEach(o=>{o.userData.abVisible??=o.visible;o.visible=false;});x.abHidden=true;});await perfWindow('aim-idle-no-extras-'+k,3000);
      await frame(tv).evaluate(()=>{const x=window.__bowlingScene.extras;x.objects.forEach(o=>{o.visible=o.userData.abVisible;delete o.userData.abVisible;});});await perfWindow('aim-idle-extras-'+k,3000);}
  }
  // A: player 1 frame 1, ball 1 (pocket attempt), full sequence.
  await throwSeq({tag:'a',position:.1,spin:-.3,aim:true,roll:true,impact:true});
  if(process.env.QA_QUICK!=='1'){
    // B: next throw: off-centre to leave standing pins (second-ball lift) or a gutter.
    await throwSeq({tag:'b',position:.45,spin:.2,dx:.05,roll:true,impact:true});
    await throwSeq({tag:'c',position:-1,spin:.8,dx:-.35,roll:true});
    await throwSeq({tag:'d',position:.3,spin:-.1,impact:true});
  }
  if(process.env.QA_PERF==='1'){ // frame cost over a whole live throw: roll, impact, reveal, sweep and reset camera
    await until(()=>tvState()?.stage==='aim'&&currentPhone(),'aim stage',40000);const p=currentPhone();await sleep(1800);await swipe(p,{});await until(()=>tvState()?.stage==='rolling','rolling',5000);await perfWindow('throw-roll-reveal-reset',6500);}
  report.memoryEnd=await frame(tv).evaluate(()=>{const r=window.__bowlingScene?.renderer;return r?{...r.info.memory,programs:r.info.programs?.length}:null;}).catch(()=>null);
  report.status='passed';console.log('PASS',report.screens.length,'screens',JSON.stringify(report.perf),JSON.stringify(report.errors).slice(0,800));
}catch(e){report.status='failed';report.failure=e.stack;console.error(e);process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();save();fs.writeFileSync(path.join(out,`server-${suffix}.log`),log);await browser?.close();child.kill();}})();
