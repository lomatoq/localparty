'use strict';
// Curling art+feel capture (2026-10-04): copy of capture-curling-upgrade.cjs plus release and
// house-settle moments and a feel diagnostics probe. Actual launcher, two real phone controllers, real pointer
// swipes/sweeps, WebSocket-observed engine states. No state or score injection.
// QA_OUTPUT=.localparty-build/curling-art-feel/after PARTY_PLAYWRIGHT=... node scripts/capture-curling-art-feel.cjs
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const mode='curling',out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/curling-art-feel/after');fs.mkdirSync(out,{recursive:true});
const ends=Number(process.env.QA_ENDS||3),only=new Set((process.env.QA_ONLY||'').split(',').filter(Boolean));
const report={game:mode,startedAt:new Date().toISOString(),method:'Actual managed launcher at normal clock. Two WebKit phone controllers with real pointer swipes and sweep holds; TV /tv route. No state/score injection.',screens:[],checks:[],throws:[],frameTimes:{},errors:[],consoleErrors:[]};
let log='',browser,tv,phones=[],api,origin;const observed=new Map(),playerIds=new Map(),events=[];const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'curling-upgrade'}});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,label,timeout=30000){const end=Date.now()+timeout;while(Date.now()<end){const v=await fn();if(v)return v;await sleep(40);}throw Error('timeout: '+label);}
const frame=p=>p.frames().find(f=>f.url().includes('/games/'+mode+'/'));
const S=()=>observed.get(tv);
function watch(p,label){p.on('pageerror',e=>report.errors.push({surface:label,error:e.message}));p.on('console',m=>{if(m.type()==='error')report.consoleErrors.push({surface:label,text:m.text().slice(0,300)});});p.on('websocket',ws=>{if(!ws.url().includes('/games/'+mode+'/'))return;ws.on('framereceived',f=>{try{const m=JSON.parse(f.payload);if(m.type==='state'){observed.set(p,m.data);if(p===tv)for(const e of m.data.events||[])if(!events.some(x=>x.id===e.id))events.push(e);}if(m.type==='joined')playerIds.set(p,m.data.id);}catch{}});});}
async function shot(p,name,viewport){if(viewport)await p.setViewportSize(viewport);await sleep(viewport?260:0);const file=name+'.png',s=S();await p.screenshot({path:path.join(out,file)});report.screens.push({file,capturedAt:new Date().toISOString(),surface:p===tv?'tv':'phone',viewport:p.viewportSize(),stage:s?.stage,endIndex:s?.endIndex,throwIndex:s?.throwIndex,teams:s?.teams,stones:(s?.stones||[]).map(({id,team,x,z,valid})=>({id,team,x:+x.toFixed(3),z:+z.toFixed(3),valid})),sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex')});save();}
// One TV size per live moment (motion moves on); static moments also at 1920x1080.
async function tvShots(name,both=false){if(only.size&&!only.has(name))return;await shot(tv,name+'-tv-720');if(both){await shot(tv,name+'-tv-1080',{width:1920,height:1080});await tv.setViewportSize({width:1280,height:720});await sleep(200);}}
async function join(name){const c=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2});await c.addInitScript(()=>localStorage.setItem('local-party-language','ru'));const p=await c.newPage();watch(p,name);await p.goto(origin+'/play');await p.locator('#name').fill(name);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);return p;}
async function launch(){await api({type:'bots-set',count:0});await api({type:'settings',id:mode,settings:{ends}});await api({type:'launch',id:mode});for(const p of phones){await p.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),mode);await until(()=>p.locator('#readyButton').isEnabled(),'ready enabled');await p.locator('#readyButton').click();}await until(async()=>(await api()).active?.ui?.phase==='playing','actual playing');await until(()=>S()?.phase==='playing','engine snapshot observed');await until(()=>frame(tv)?.locator('#ss-scene canvas').count(),'rendering scene');await sleep(1500);}
const phoneOf=id=>phones.find(p=>playerIds.get(p)===id);
// The controller maps vertical distance D (pad heights) and release velocity r (pad heights/s)
// to power = .12 + .40*sqrt(D) + .15*min(r,3). Angle = .32*atan2(dx,dy).
async function swipe(p,{power=.55,angle=0}){
  const f=frame(p),r=await f.locator('#ss-throw-pad').boundingBox();
  let D=.5,rate=(power-(.12+.4*Math.sqrt(.5)))/.15;if(rate<0){D=Math.max(.12,((power-.12)/.4)**2);rate=0;}
  const dy=D*r.height,dx=Math.tan(angle/.32)*dy,x0=r.x+r.width*.5-dx/2,y0=r.y+r.height*.86;
  await p.mouse.move(x0,y0);await p.mouse.down();
  if(rate>0){const seconds=D/rate,steps=Math.max(6,Math.round(seconds/0.016));const t0=Date.now();for(let i=1;i<=steps;i++){const target=t0+seconds*1000*i/steps;while(Date.now()<target)await sleep(2);await p.mouse.move(x0+dx*i/steps,y0-dy*i/steps);}}
  else{await p.mouse.move(x0+dx,y0-dy,{steps:10});await sleep(170);}
  await p.mouse.up();
}
async function setSliders(p,{position=0,spin=0}){const f=frame(p);for(const [id,v] of [['#ss-position',position],['#ss-spin',spin]])await f.locator(id).evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},v);}
async function holdSweep(p,ms){const f=frame(p);await until(async()=>!(await f.locator('#ss-sweep').isDisabled()),'sweep enabled',4000);const b=await f.locator('#ss-sweep').boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await sleep(ms);return async()=>p.mouse.up();}
async function frameTimes(label,ms=4000){const f=frame(tv);const r=await f.evaluate(async ms=>{const cost=window.__rafCost||[];cost.length=0;(window.__drawCalls||[]).length=0;window.__measureSync=true;const d=[];let last=performance.now();await new Promise(res=>{const end=last+ms;const tick=t=>{d.push(t-last);last=t;if(t<end)requestAnimationFrame(tick);else res();};requestAnimationFrame(tick);});d.shift();d.sort((a,b)=>a-b);const avg=d.reduce((a,b)=>a+b,0)/d.length;window.__measureSync=false;const dc=window.__drawCalls||[];const c=[...cost].sort((a,b)=>a-b),cavg=c.reduce((a,b)=>a+b,0)/Math.max(1,c.length);return{frames:d.length,drawCallsAvg:dc.length?+(dc.reduce((a,b)=>a+b,0)/dc.length).toFixed(1):null,costAvgMs:+cavg.toFixed(2),costP95Ms:+(c[Math.floor(c.length*.95)]||0).toFixed(2),costMaxMs:+(c.at(-1)||0).toFixed(2),avgMs:+avg.toFixed(2),p50:+d[Math.floor(d.length*.5)].toFixed(2),p95:+d[Math.floor(d.length*.95)].toFixed(2),max:+d.at(-1).toFixed(2),quality:document.body.dataset.renderQuality,diag:window.__ssCurlingDiag?.()||null};},ms);report.frameTimes[label]=r;save();return r;}
async function waitAim(){await until(()=>S()?.stage==='aim'||S()?.phase!=='playing','aim stage',40000);await sleep(500);}
async function play(shotSpec,hooks={}){
  await waitAim();if(S().phase!=='playing')return false;const s=S(),p=phoneOf(s.currentId);assert(p,'human current turn');
  const spec=typeof shotSpec==='function'?shotSpec(s):shotSpec;await setSliders(p,spec);await sleep(250);
  if(hooks.aim)await hooks.aim(p);
  const before=events.length;await swipe(p,spec);await until(()=>S()?.stage==='rolling','throw accepted',5000);if(hooks.release)await hooks.release(p);
  const thrown=events.slice(before).find(e=>e.kind==='throw');report.throws.push({end:s.endIndex,index:s.throwIndex,requested:spec,input:thrown?.input||null});save();
  if(hooks.rolling)await hooks.rolling(p);
  await until(()=>S()?.stage!=='rolling','rolling resolves',20000);if(hooks.after)await hooks.after(p);return true;
}
function nearest(s,team){return (s.stones||[]).filter(x=>x.valid&&x.team===team).sort((a,b)=>Math.hypot(a.x,a.z+9)-Math.hypot(b.x,b.z+9))[0];}
function takeout(target){const x0=0,angle=Math.atan2(target.x-x0,13-target.z);return {power:.86,angle,position:0,spin:0};}
(async()=>{try{
  await until(()=>/localhost:(\d+)/.test(log),'launcher listening');origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
  api=async body=>{const r=await fetch(origin+'/api/manage',{signal:AbortSignal.timeout(15000),method:body?'POST':'GET',headers:{Authorization:'Bearer curling-upgrade','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json();if(!r.ok)throw Error(JSON.stringify(j));return j;};
  browser=await webkit.launch({headless:true});const c=await browser.newContext({viewport:{width:1280,height:720}});await c.addInitScript(()=>localStorage.setItem('local-party-language','ru'));await c.addInitScript(()=>{
    // Frame cost probe (same for before/after): rAF callback time incl. a 1px readPixels sync while measuring, plus draw calls.
    const raf=window.requestAnimationFrame.bind(window),get=HTMLCanvasElement.prototype.getContext;let gl=null,calls=0;window.__rafCost=[];window.__drawCalls=[];
    HTMLCanvasElement.prototype.getContext=function(type,...a){const c=get.call(this,type,...a);if(c&&/webgl/.test(type)&&!gl){gl=c;const P=Object.getPrototypeOf(c);for(const k of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const f=P[k];if(f&&!f.__wrapped){P[k]=function(...x){calls++;return f.apply(this,x);};P[k].__wrapped=true;}}}return c;};
    const px=new Uint8Array(4);window.requestAnimationFrame=cb=>raf(t=>{const s=performance.now();calls=0;try{cb(t);}finally{if(window.__measureSync&&gl&&calls)gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);const c=window.__rafCost;if(calls){c.push(performance.now()-s);window.__drawCalls.push(calls);}if(c.length>4000){c.splice(0,2000);window.__drawCalls.splice(0,2000);}}});});tv=await c.newPage();watch(tv,'tv');await tv.goto(origin+'/tv');
  await join('Александра Длиннофамильная');await join('Vik');await launch();
  // Camera continuity probe: per-frame camera travel (m) and look-direction change (deg); re-installed after every TV reload.
  const camTrace=()=>{const st=window.__camTrace={maxStep:0,maxTurn:0,frames:0,worst:null,maxSpeed:0,maxTurnRate:0,cuts:0};let lp=null,ld=null,lt=0;const tick=now=>{const fdt=Math.max(.001,(now-lt)/1000);lt=now;const sc=window.__ssCurlingExtras?.sc;if(sc){const c=sc.camera,p=c.position.clone(),d=c.getWorldDirection(new sc.T.Vector3());if(lp){const step=p.distanceTo(lp),turn=Math.acos(Math.min(1,d.dot(ld)))*57.3;st.frames++;if(fdt<.03){st.maxSpeed=Math.max(st.maxSpeed,step/fdt);st.maxTurnRate=Math.max(st.maxTurnRate,turn/fdt);if(step>.6||turn>8)st.cuts++;}if(step>st.maxStep){st.maxStep=step;st.worst={step,turn,stage:sc.lastStage,sceneDt:sc.frameDt,fdt,from:lp.toArray().map(v=>+v.toFixed(2)),to:p.toArray().map(v=>+v.toFixed(2)),camPos:sc.camPos.toArray().map(v=>+v.toFixed(2)),houseView:sc.houseView,rate:sc.camRate};}st.maxTurn=Math.max(st.maxTurn,turn);}lp=p;ld=d;}requestAnimationFrame(tick);};requestAnimationFrame(tick);};report.camTraces=[];const traceOn=async()=>{await sleep(400);await frame(tv).evaluate(camTrace);};const traceOff=async label=>{const t=await frame(tv).evaluate(()=>window.__camTrace).catch(()=>null);if(t)report.camTraces.push({label,...t});save();};await traceOn();
  // End 1 — stone 1: aim + slide (with curl)
  await play({power:.555,angle:-.02,spin:.6,position:0},{
    aim:async p=>{await tvShots('01-aim',true);if(!only.size||only.has('01-aim'))await shot(p,'01-aim-phone-393');},
    release:async()=>{await sleep(140);await tvShots('02a-release',true);},
    rolling:async()=>{await sleep(500);await tvShots('02-slide');await sleep(1200);await tvShots('02b-slide-late');}});
  // stone 2: sweep held by the thrower's team
  await play({power:.5,angle:.02,spin:-.5,position:.2},{rolling:async p=>{const up=await holdSweep(p,700);await tvShots('03-sweep',true);if(!only.size||only.has('03-sweep'))await shot(p,'03-sweep-phone-393');await sleep(1600);await up();}});
  // stone 3: takeout on the opponent's best stone -> contact
  await play(s=>{const t=nearest(s,1)||nearest(s,0);return t?takeout(t):{power:.56,angle:0,spin:0,position:0};},{rolling:async()=>{
    const ft=frameTimes('rolling-takeout',2500);
    await until(()=>{const s=S(),a=s?.stones?.at(-1);return !a||s.stage!=='rolling'||s.stones.some(o=>o!==a&&o.valid&&Math.hypot(o.x-a.x,o.z-a.z)<1.05);},'approach',12000).catch(()=>{});await ft;await sleep(60);report.contactFeel=await frame(tv).evaluate(()=>window.__ssCurlingDiag?.().feel);await tvShots('04-contact',true);await sleep(400);await tvShots('04b-after-contact');report.contactDiag=await frame(tv).evaluate(()=>window.__ssCurlingDiag?.());save();
    if(await until(()=>S()?.stones?.some(o=>!o.valid)||S()?.stage!=='rolling','out decision',6000).catch(()=>false)&&S().stones.some(o=>!o.valid)){await sleep(450);await tvShots('04c-out-mark');}}});
  // stones 4..8: draws around the house to crowd it
  const draws=[{power:.56,angle:-.035,spin:.3,position:-.2},{power:.545,angle:.03,spin:-.3,position:.1},{power:.565,angle:0,spin:.5,position:-.3},{power:.55,angle:.012,spin:0,position:0},{power:.56,angle:-.01,spin:-.4,position:.25}];
  for(let i=0;i<draws.length;i++){const last=i===draws.length-1;await play(draws[i],{rolling:i===1?async()=>{await frameTimes('rolling-draw',3000);}:i===2?async()=>{await until(()=>{const a=S()?.stones?.at(-1);return !a||S().stage!=='rolling'||a.z< -4.5;},'near house',12000).catch(()=>{});await tvShots('05s-settle',true);report.settleDiag=await frame(tv).evaluate(()=>window.__ssCurlingDiag?.());save();}:null,after:last?async()=>{await until(()=>S()?.stage==='reveal'||S()?.stage==='end',"reveal",3000).catch(()=>{});await sleep(250);await tvShots('05-measure',true);await until(()=>S()?.stage==='end','end stage',5000);await sleep(900);report.scoreDiag=await frame(tv).evaluate(()=>window.__ssCurlingDiag?.());save();await tvShots('06-score',true);await sleep(1400);await tvShots('06b-score-late');}:null});
    if(i===3){await waitAim();await tvShots('05a-crowded-aim',true);const stonesBefore=S().stones.filter(s=>s.valid).length;await traceOff('before-reload');await tv.reload();await until(()=>S()?.phase==='playing'&&frame(tv),'tv reload',20000);await traceOn();await sleep(2500);await tvShots('05b-tv-reloaded');assert.equal(S().stones.filter(s=>s.valid).length,stonesBefore,'reload keeps valid stones');report.checks.push('TV reload mid-end restores '+stonesBefore+' valid stones from snapshot');}
    if(process.env.QA_STOP_AFTER&&report.throws.length>=Number(process.env.QA_STOP_AFTER))throw Object.assign(Error('stop-after'),{stop:true});}
  // end 2 aim, pause
  await waitAim();await sleep(1200);await tvShots('07-next-end',true);await frameTimes('aim-idle',3000);
  // Presentation-only probe: a 3-point end celebration through the extras' effect() (no engine state touched).
  // Presentation-only probe: prop close-ups by temporarily directing the TV camera (restored after).
  if(process.env.QA_PROBE_PROPS){await traceOff('before-props-probe');for(const [name,pos,look] of [['p1-pylon-rack',[1.6,1.7,-7.2],[4.4,1.0,-12.8]],['p2-bench-boards',[1.4,1.5,14.2],[4.5,.6,9.6]],['p3-hacks',[1.2,.9,16.4],[0,.05,14.3]],['p4-roof-rig',[0,4.2,12],[0,8.6,-4]]]){
    await frame(tv).evaluate(([pos,look])=>{const sc=window.__ssCurlingExtras.sc,T=sc.T;sc.feel.__shot||=sc.feel.shot;sc.feel.shot=()=>({shot:{pos:new T.Vector3(...pos),look:new T.Vector3(...look)},speed:40,houseView:true});},[pos,look]);await sleep(1400);await shot(tv,'07x-'+name+'-tv-1080',{width:1920,height:1080});}
    await frame(tv).evaluate(()=>{const f=window.__ssCurlingExtras.sc.feel;f.shot=f.__shot;delete f.__shot;});await tv.setViewportSize({width:1280,height:720});await sleep(800);await traceOn();}
  if(process.env.QA_PROBE_CELEBRATE){await frame(tv).evaluate(()=>{const x=window.__ssCurlingExtras;const sc=x.sc,T=sc.T;sc.feel.__shot2=sc.feel.shot;sc.feel.shot=()=>({shot:sc.fit(sc.housePoints(),58*Math.PI/180,.2,{x:.86,top:.66,bottom:-.84}),speed:2.4,houseView:true});});await sleep(2600);await frame(tv).evaluate(()=>{const x=window.__ssCurlingExtras;x.effect({kind:'score',points:3,team:0,id:'qa-3pt',at:x.lastT},{t:x.lastT});});await sleep(700);await tvShots('07p-probe-3pt-celebration');await sleep(900);await tvShots('07q-probe-3pt-late');await frame(tv).evaluate(()=>{const f=window.__ssCurlingExtras.sc.feel;f.shot=f.__shot2;delete f.__shot2;});await sleep(600);await traceOn();}
  if(!only.size||only.has('07-next-end')){await shot(tv,'07-next-end-tv-2160',{width:3840,height:2160});await tv.setViewportSize({width:1280,height:720});await sleep(300);}
  await phones[0].locator('#pauseButton').click();await until(async()=>(await api()).active?.session?.paused||(await api()).active?.ui?.phase==='paused','pause actual');const a=S();await sleep(500);await tvShots('08-paused',true);await shot(phones[0],'08-paused-phone-393');assert(Math.abs(S().t-a.t)<.12,'pause freezes engine');report.checks.push('pause freezes engine time');
  await phones[0].locator('#resumeButton').click();await until(async()=>!(await api()).active?.session?.paused&&(await api()).active?.ui?.phase!=='paused','resume');
  // Reduced motion: reload the TV with prefers-reduced-motion and capture the next real throw.
  await tv.emulateMedia({reducedMotion:'reduce'});await traceOff('before-reload');await tv.reload();await until(()=>S()?.phase==='playing'&&frame(tv),'tv reload reduced',20000);await traceOn();await sleep(1500);
  await play({power:.55,angle:0,spin:.4,position:0},{aim:async()=>{await tvShots('09-reduced-aim');},rolling:async()=>{await sleep(1500);await tvShots('09b-reduced-roll');}});
  await tv.emulateMedia({reducedMotion:'no-preference'});await traceOff('before-reload');await tv.reload();await until(()=>S()?.phase==='playing'&&frame(tv),'tv reload normal',20000);await traceOn();await sleep(1000);
  // play out remaining ends quickly with draws (real swipes)
  let k=0;while(S()?.phase==='playing'&&k<60){const ok=await play({power:.54+((k*37)%7)/250,angle:(((k*53)%9)-4)/160,spin:(((k*29)%5)-2)/3,position:0});if(!ok)break;k++;}
  await until(async()=>(await api()).active?.ui?.phase==='results','results',60000);await sleep(2500);await tvShots('10-result',true);await shot(phones[0],'10-result-phone-393');
  await traceOff('final');
  report.endScores=S()?.endScores;report.teams=S()?.teams;
  const scoreEvents=events.filter(e=>e.kind==='score');report.scoreEvents=scoreEvents.map(e=>({id:e.id,team:e.team,points:e.points,ids:e.ids}));report.checks.push('score events '+scoreEvents.length+' for '+ends+' ends');
  assert.deepEqual(report.errors,[]);report.status='passed';console.log('PASS',report.screens.length,'screens');
}catch(e){if(e.stop){report.status='stopped-early';console.log('STOPPED',report.screens.length);}else{report.status='failed';report.failure=e.stack;console.error(e);process.exitCode=1;}}finally{report.finishedAt=new Date().toISOString();save();fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();child.kill();}})();
