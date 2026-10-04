'use strict';
// Real Chromium controllers/engine transport; explicitly synthetic sensor traces.
const {chromium}=require(process.env.PARTY_PLAYWRIGHT||'playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/android-sports-motion-2026-10-04');fs.mkdirSync(out,{recursive:true});
const files=['public/sports-motion.js','games/sports_siege/public/controls.js','games/sports_siege/public/sports-controls.css','games/sports_siege/server.js'];
const hashes=()=>Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const report={method:'Actual Chromium launcher/controller/engine with synthetic Android-shaped browser events. Normal engine clock; not physical Android validation.',sourceStart:hashes(),cases:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'android-motion-audit'}});let log='',browser,activePhone,activeGame;
child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,ms=30000){const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await sleep(50);}throw Error(label);}
function fixture(profile){
 const f=window.__androidMotion={profile,forward:0,side:0,spin:0,auto:true,ticks:0,events:[]};
 for(const name of ['blur','resize','orientationchange'])window.addEventListener(name,()=>f.events.push({name,at:performance.now(),diagnostics:window.PartySportsMotionDiagnostics}));
 // Chromium/Android has no requestPermission method; valid motion must work without it.
 for(const name of ['DeviceMotionEvent','DeviceOrientationEvent'])if(window[name]?.requestPermission)Object.defineProperty(window[name],'requestPermission',{value:undefined});
 setInterval(()=>{if(!f.auto)return;f.ticks++;
  if(profile==='null-alpha'||profile==='slow-orientation'&&f.ticks%20===0)window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:profile==='null-alpha'?null:0,beta:0,gamma:0}));
  const acceleration=profile==='gravity-only'?null:profile==='partial-axes'?{x:null,y:f.forward,z:null}:{x:f.side,y:f.forward,z:0};
  window.dispatchEvent(Object.assign(new Event('devicemotion'),{acceleration,accelerationIncludingGravity:['acceleration-only','partial-axes'].includes(profile)?null:{x:f.side,y:f.forward,z:9.81},rotationRate:['acceleration-only','partial-axes'].includes(profile)?null:{alpha:0,beta:0,gamma:f.spin},interval:33}));
 },33);
}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'launcher port');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer android-motion-audit','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Error(JSON.stringify(data));return data;};
 await api({type:'force-language',language:'en'});browser=await chromium.launch({headless:true,args:['--host-resolver-rules=MAP localparty.test 127.0.0.1','--no-proxy-server'],...(process.env.QA_CHROMIUM?{executablePath:process.env.QA_CHROMIUM}:{})});const tv=await browser.newPage({viewport:{width:1280,height:720}});await tv.goto(origin+'/tv');
 const profiles=process.env.QA_PROFILES?process.env.QA_PROFILES.split(','):process.env.QA_BEFORE==='1'?['acceleration-only']:['acceleration-only','partial-axes','gravity-only','null-alpha','slow-orientation','insecure'];
 for(const mode of process.env.QA_MODES?process.env.QA_MODES.split(','):['bowling','curling'])for(const profile of profiles){const width=mode==='curling'?320:402,row={mode,profile,width,wire:[],screens:[]};report.cases.push(row);
  const context=await browser.newContext({viewport:{width,height:width===320?568:874},isMobile:true,hasTouch:true});await context.addInitScript(fixture,profile);const phone=activePhone=await context.newPage();phone.on('pageerror',e=>report.errors.push(e.message));phone.on('websocket',ws=>ws.on('framesent',e=>{try{const m=JSON.parse(e.payload);if(m.type==='throw')row.wire.push(m);}catch{}}));
  await phone.goto((profile==='insecure'?origin.replace('127.0.0.1','localparty.test'):origin)+'/play');await phone.locator('#name').fill('Android Motion');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();await api({type:'bots-set',count:1});await api({type:'launch',id:mode});await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),mode);await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await phone.locator('#readyButton').click();
  const game=activeGame=await(await phone.$('#gameFrame')).contentFrame();await game.waitForFunction(()=>document.body.dataset.ssControlState==='aim');await game.evaluate(()=>document.fonts.ready);await game.waitForFunction(()=>window.PartySportsMotionDiagnostics.canThrow);
  const shot=async name=>{await sleep(500);const file=`${mode}-${profile}-${width}-${name}.png`;await phone.screenshot({path:path.join(out,file)});row.screens.push({file,proof:await game.evaluate(()=>({diagnostics:window.PartySportsMotionDiagnostics,status:document.querySelector('#ss-motion-status').textContent,secure:isSecureContext,hasMotion:!!window.DeviceMotionEvent,permissionAPI:typeof window.DeviceMotionEvent?.requestPermission}))});};
  await game.locator('#ss-mode-motion').tap();
  if(process.env.QA_BEFORE==='1'||profile==='insecure'){await game.waitForFunction(()=>document.body.dataset.ssInputMode==='swipe');assert.equal(row.wire.length,0);if(profile==='insecure')assert.equal(await game.locator('#ss-motion-status').textContent(),'Motion needs HTTPS. Swipe is available.');await shot(profile==='insecure'?'http-fallback':'blocked-before');}
  else{
   await game.waitForFunction(()=>window.PartySportsMotionDiagnostics.armed,null,{timeout:5000});assert.equal(row.wire.length,0);await shot('ready');
   await game.evaluate(()=>Object.assign(window.__androidMotion,{forward:12,side:1,spin:80}));await sleep(180);await game.evaluate(()=>Object.assign(window.__androidMotion,{forward:0,side:0,spin:0}));
   await until(()=>row.wire.length===1,'automatic sensor throw',3000);const data=row.wire[0].data;assert(data.valid&&data.power>0&&data.position===0);if(!['acceleration-only','partial-axes'].includes(profile))assert(data.spin>0);
   await game.waitForFunction(()=>document.body.dataset.ssControlState!=='aim');await shot('rolling');assert.equal(row.wire.length,1);
   await game.evaluate(()=>window.__androidMotion.auto=false);await game.waitForFunction(()=>document.body.dataset.ssInputMode==='swipe',null,{timeout:3000});await shot('stalled-fallback');
  }
  await api({type:'stop'});await context.close();await until(async()=>!(await api()).players.some(p=>p.name==='Android Motion'),'controller disconnect settled');
 }
 report.sourceEnd=hashes();report.drift=files.filter(f=>report.sourceStart[f]!==report.sourceEnd[f]);assert.deepEqual(report.errors,[]);assert.deepEqual(report.drift,[]);report.ok=true;
}catch(e){report.failure=e.stack;if(activePhone)await activePhone.screenshot({path:path.join(out,'raw-failure.png')}).catch(()=>{});report.failureState=await activeGame?.evaluate(()=>({diagnostics:window.PartySportsMotionDiagnostics,fixture:window.__androidMotion,status:document.querySelector('#ss-motion-status')?.textContent,visible:document.visibilityState})).catch(()=>null);process.exitCode=1;}finally{report.sourceEnd??=hashes();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();child.kill();console.log(JSON.stringify({ok:report.ok,failure:report.failure,errors:report.errors,drift:report.drift,cases:report.cases.map(r=>({mode:r.mode,profile:r.profile,throws:r.wire.length}))}));}})();
