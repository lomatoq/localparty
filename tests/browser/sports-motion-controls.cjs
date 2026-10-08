'use strict';
// Actual launcher/engine states and wire inputs, with explicitly synthetic sensors.
// This validates browser/controller integration, never physical-phone gesture feel.
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const output=path.resolve(process.env.QA_OUTPUT||'output/playwright/screen-state-audit-2026-10-03/sports-motion');fs.mkdirSync(output,{recursive:true});
const files=['ios/LocalParty/ServerModel.swift','games/sports_siege/public/controls.js','games/sports_siege/public/sports-controls.css','public/sports-motion.js','server.js','ios/LocalParty/LocalPartyApp.swift'];
const hashes=()=>Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const report={method:'Actual WebKit launcher/controller + native bridge and browser sensor fixtures. Synthetic samples; no physical hardware/build/install.',startedAt:new Date().toISOString(),sourceStart:hashes(),errors:[],cases:[]};
const save=()=>fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'sports-motion-qa'}});let log='',browser,activePhone,activeGame;
child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const until=async(fn,label,timeout=30000)=>{const end=Date.now()+timeout;while(Date.now()<end){const v=await fn();if(v)return v;await sleep(50);}throw Error(label);};
function fixture(native){
 window.__motionFixture={native,session:0,permission:'granted',calls:[],events:[],auto:true,orientation:true,a:0,forward:0,r:0,yaw:0,roll:0,time:0};
 const f=window.__motionFixture;for(const type of ['pointerdown','pointerup','click'])document.addEventListener(type,e=>f.events.push({type,target:e.target.closest?.('button')?.id||e.target.id||e.target.tagName,at:performance.now()}),true);for(const type of ['resize','blur','orientationchange','party-native-hide'])window.addEventListener(type,()=>f.events.push({type,at:performance.now(),width:innerWidth,height:innerHeight,diagnostics:window.PartySportsMotionDiagnostics}));
 if(native)window.webkit={messageHandlers:{partyShell:{postMessage(m){if(m.type==='sports-motion-diagnostic')f.calls.push(m);if(m.type==='sports-motion-start'){f.session=m.session;f.calls.push({...m,gesture:navigator.userActivation?.isActive,frame:location.pathname});}if(m.type==='sports-motion-stop'){f.session=0;f.calls.push({...m,gesture:navigator.userActivation?.isActive,frame:location.pathname});}}}}};
 else for(const name of ['DeviceMotionEvent','DeviceOrientationEvent'])if(window[name])Object.defineProperty(window[name],'requestPermission',{configurable:true,value:()=>{f.calls.push({type:name,gesture:navigator.userActivation?.isActive});return new Promise(resolve=>{setTimeout(()=>resolve(f.permission),f.permissionDelay||0);if(f.permissionBlur)setTimeout(()=>window.dispatchEvent(new Event('blur')),40);});}});
 f.emit=()=>{
  if(!f.auto)return;
  if(native){if(!f.session)return;const z=f.yaw*Math.PI/360,y=f.roll*Math.PI/360;window.__partySportsMotion?.({session:f.session,sourceTime:++f.time,acceleration:{x:f.a,y:f.forward,z:0},rotation:{x:0,y:f.r,z:0},quaternion:{w:Math.cos(z)*Math.cos(y),x:-Math.sin(z)*Math.sin(y),y:Math.cos(z)*Math.sin(y),z:Math.sin(z)*Math.cos(y)}});}
  else{if(f.orientation)window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:f.yaw,beta:0,gamma:f.roll}));window.dispatchEvent(Object.assign(new Event('devicemotion'),{acceleration:{x:f.a,y:f.forward,z:0},rotationRate:{alpha:0,beta:0,gamma:f.r},interval:33}));}
 };
 setInterval(f.emit,33);
}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'launcher port');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer sports-motion-qa','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
 await api({type:'force-language',language:'en'});browser=await webkit.launch({headless:true});
 const tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>report.errors.push({surface:'tv',error:e.message}));await tv.goto(origin+'/tv');
 for(const native of process.env.QA_BROWSER_GATE_ONLY==='1'?[false]:process.env.QA_NATIVE_ONLY==='1'?[true]:[true,false])for(const mode of process.env.QA_MODES?process.env.QA_MODES.split(','):native?['bowling','curling']:['bowling'])for(const width of process.env.QA_WIDTHS?process.env.QA_WIDTHS.split(',').map(Number):native?[402,320]:[402]){
  const row={native,mode,width,actions:[],wire:[],screens:[]};report.cases.push(row);
  const context=await browser.newContext({viewport:{width,height:width===320?568:874},isMobile:true,hasTouch:true,deviceScaleFactor:1});await context.addInitScript(fixture,native);
  await context.addInitScript(()=>localStorage.setItem('local-party-language','en'));
  if(native)await context.addInitScript({content:fs.readFileSync('public/native-shell/controller-bridge.js','utf8')+'\n'+fs.readFileSync('public/native-shell/tabs.js','utf8')});
  const phone=activePhone=await context.newPage();phone.on('pageerror',e=>report.errors.push({surface:'phone',mode,width,native,error:e.message,stack:e.stack}));
  phone.on('websocket',ws=>ws.on('framesent',e=>{try{const m=JSON.parse(e.payload);if(m.type==='throw'||m.type==='input')row.wire.push({at:Date.now(),url:ws.url(),...m});}catch{}}));
  await phone.goto(origin+'/play');await phone.locator('#name').fill('Motion Player');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
  await api({type:'bots-set',count:1});await api({type:'launch',id:mode});await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),mode);
  await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled);await phone.locator('#readyButton').click();
  const game=activeGame=await (await phone.$('#gameFrame')).contentFrame();await game.waitForFunction(()=>document.body.dataset.ssControlState==='aim',null,{timeout:35000});
  await game.evaluate(()=>document.fonts.ready);await sleep(400);
  async function shot(name){await sleep(550);await game.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const file=`${mode}-${native?'native':'browser'}-${width}-${name}.png`;await phone.screenshot({path:path.join(output,file)});row.screens.push({file,phase:await game.evaluate(()=>({diagnostics:window.PartySportsMotionDiagnostics,help:document.getElementById('ss-help')?.textContent,phase:window.PARTY_UI?.phase,control:document.body.dataset.ssControlState,input:document.body.dataset.ssInputMode})),geometry:await game.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom};};return{width:innerWidth,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,controls:[...document.querySelectorAll('#ss-motion-controls button,#ss-enable-motion,#ss-throw-pad,#ss-sweep')].filter(e=>e.getClientRects().length).map(e=>({id:e.id,...rect(e)}))};})});save();}
  assert.equal(await game.evaluate(()=>document.body.dataset.ssInputMode),'swipe');if(process.env.QA_BROWSER_GATE_ONLY!=='1')await shot('swipe');
  if(process.env.QA_BROWSER_GATE_ONLY==='1')await game.evaluate(()=>Object.assign(window.__motionFixture,{permissionDelay:300,permissionBlur:true}));
  await game.evaluate(()=>window.__motionFixture.auto=false);await game.locator('#ss-mode-motion').tap();if(process.env.QA_SETUP_RESIZE==='1'){const viewport=phone.viewportSize();await phone.setViewportSize({...viewport,height:viewport.height-8});await sleep(120);}
  await game.waitForFunction(()=>document.getElementById('ss-motion-status').textContent==='Waiting for motion…',null,{timeout:2000});assert.equal(await game.locator('#ss-motion-status').textContent(),'Waiting for motion…');if(process.env.QA_BROWSER_GATE_ONLY!=='1')await shot('permission-waiting');
  assert.equal(await game.locator('#ss-enable-motion').isDisabled(),true);if(native)assert.equal(await game.evaluate(()=>window.__motionFixture.calls.find(m=>m.type==='sports-motion-start').gesture),true);assert.equal(await game.evaluate(()=>window.__motionFixture.calls.filter(m=>m.type==='sports-motion-start').length),native?1:0);
  await game.evaluate(()=>window.__motionFixture.auto=true);await game.waitForFunction(()=>document.getElementById('ss-motion-status').textContent.includes('Motion ready'));row.actions.push('Single explicit Motion gesture starts sensors; readiness only after valid fresh sensor sample');await shot('motion-ready');
  const throws=()=>row.wire.filter(m=>m.type==='throw');
  const neutral=async()=>{await game.evaluate(()=>Object.assign(window.__motionFixture,{a:0,forward:0,r:0,yaw:0,roll:0,auto:true,orientation:true}));await game.waitForFunction(()=>window.PartySportsMotionDiagnostics.armed,null,{timeout:5000});};
  const impulse=async(duration=180)=>{await game.evaluate(()=>Object.assign(window.__motionFixture,{forward:12,a:2,r:100}));await sleep(duration);};
  await neutral();assert(await game.locator('#ss-throw-pad').isHidden());assert(await game.locator('.ss-throw-settings').isHidden());
  row.actions.push('Motion arms from quiet sensors without touch; Position/Spin and pad are absent');await shot('hands-free-ready');
  // Starting mode/picking up the device, a single bump, vertical or sideways motion
  // are independently covered by pure filters. Here exercise real pause/resize gates.
  await impulse(120);const viewport=phone.viewportSize();await phone.setViewportSize({...viewport,height:viewport.height-8});
  await game.evaluate(()=>Object.assign(window.__motionFixture,{a:0,forward:0,r:0}));await sleep(160);
  assert.equal(throws().length,0);assert.equal(await game.evaluate(()=>document.body.dataset.ssInputMode),'motion');assert.equal(await game.evaluate(()=>window.PartySportsMotionDiagnostics.ready),true);
  row.actions.push('Actual layout resize cancels forward impulse while preserving sensors and captured TV frame');
  await neutral();await impulse(120);await game.evaluate(()=>window.dispatchEvent(new Event('orientationchange')));
  await game.evaluate(()=>Object.assign(window.__motionFixture,{a:0,forward:0,r:0}));await sleep(160);assert.equal(throws().length,0);assert.equal(await game.evaluate(()=>document.body.dataset.ssInputMode),'motion');
  row.actions.push('Orientation event cancels current impulse; Motion remains selected');
  if(!native){
   await neutral();await impulse(90);await game.evaluate(()=>window.__motionFixture.auto=false);
   await game.waitForFunction(()=>document.body.dataset.ssInputMode==='swipe',null,{timeout:5000});assert.equal(throws().length,0);await shot('attitude-fallback');
   await game.evaluate(()=>Object.assign(window.__motionFixture,{auto:true,orientation:true,a:0,forward:0,r:0,permissionBlur:false}));
   await game.locator('#ss-enable-motion').tap();await game.waitForFunction(()=>window.PartySportsMotionDiagnostics.ready);await neutral();
   row.actions.push('Motion stream interruption cancels unfinished hands-free throw; Retry restores sensor arming');
  }
  await neutral();await impulse(120);await api({type:'pause',paused:true});await sleep(200);
  await game.evaluate(()=>Object.assign(window.__motionFixture,{a:0,forward:0,r:0}));assert.equal(throws().length,0);await api({type:'pause',paused:false});await phone.waitForFunction(()=>window.PARTY_UI?.phase!=='paused');
  await game.locator('#ss-mode-motion').tap();await game.waitForFunction(()=>window.PartySportsMotionDiagnostics.ready);await neutral();
  row.actions.push('Actual host pause discards unfinished impulse and cannot launch');
  await impulse();await game.evaluate(()=>Object.assign(window.__motionFixture,{a:0,forward:0,r:0}));
  await until(()=>throws().length===1,'automatic throw',3000);const data=throws()[0].data;assert.equal(data.valid,true);assert(data.power>.3);assert(data.angle>0);assert(data.spin>0);assert.equal(data.position,0);
  await game.locator('#ss-throw-pad').dispatchEvent('pointerup',{pointerId:1});await sleep(100);assert.equal(throws().length,1);
  row.actions.push('Forward impulse automatically sends one bounded shot/token; acceleration aim + wrist spin, position neutral, no finger/release');
  await game.waitForFunction(()=>document.body.dataset.ssControlState!=='aim');await shot('automatic-rolling');
  if(mode==='curling'){
   await game.waitForFunction(()=>document.body.dataset.ssControlState==='sweep');
   assert(await game.locator('#ss-sweep').isHidden());
   for(const a of [12,-12,12,-12,12,-12]){await game.evaluate(a=>window.__motionFixture.a=a,a);await sleep(110);}
   assert(row.wire.some(m=>m.type==='input'&&m.data.sweep));await shot('hands-free-sweep');
   await game.evaluate(()=>Object.assign(window.__motionFixture,{a:0,auto:false}));await sleep(400);assert.equal(row.wire.at(-1).data.sweep,false);
   row.actions.push('Motion shows a readout rather than Hold: continuous reversing shakes sweep, stale samples release sweep');
  }
  if(!native){await game.evaluate(()=>window.__motionFixture.auto=false);await sleep(1250);assert.equal(await game.evaluate(()=>document.body.dataset.ssInputMode),'swipe');await shot('stale-fallback');row.permissionCalls=await game.evaluate(()=>window.__motionFixture.calls);}
  row.motionCalls=await game.evaluate(()=>window.__motionFixture.calls);row.motionEvents=await game.evaluate(()=>window.__motionFixture.events);await api({type:'stop'});await context.close();save();
 }
 report.sourceEnd=hashes();report.sourceDrift=files.filter(f=>report.sourceStart[f]!==report.sourceEnd[f]);assert.deepEqual(report.errors,[]);assert.deepEqual(report.sourceDrift,[]);report.status='passed';
}catch(e){if(activePhone){await activePhone.screenshot({path:path.join(output,'raw-failure.png')}).catch(()=>{});report.failureState=await activeGame?.evaluate(()=>({input:document.body.dataset.ssInputMode,control:document.body.dataset.ssControlState,phase:window.PARTY_UI?.phase,parentPhase:window.parent.PARTY_UI?.phase,hidden:document.hidden,paused:window.PARTY_SESSION?.paused,parentPaused:window.parent.PARTY_SESSION?.paused,fixture:{calls:window.__motionFixture?.calls,events:window.__motionFixture?.events},diagnostics:window.PartySportsMotionDiagnostics,status:document.getElementById('ss-motion-status')?.textContent,stationHidden:document.getElementById('ss-launch-station')?.hidden})).catch(()=>null);}report.status='failed';report.failure={message:e.message,stack:e.stack};throw e;}finally{report.finishedAt=new Date().toISOString();save();fs.writeFileSync(path.join(output,'server.log'),log);await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
