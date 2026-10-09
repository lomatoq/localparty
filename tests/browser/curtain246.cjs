'use strict';
// Real server/TV start, destination preparation, return and interrupted transition.
// Native bridge replies are controlled contract fixtures, not Core Animation proof.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const pw=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/performance246/curtain');fs.mkdirSync(out,{recursive:true});
const report={sourceHashes:Object.fromEntries(['public/tv-motion-20261005.js','ios/LocalParty/ExternalDisplay.swift'].map(f=>[f,require('node:crypto').createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),method:'Real server with actual /tv and game host routes. Web keyframes are original-speed captures; native bridge is a controlled lifecycle fixture. No physical cast/GPU claim.',rows:[],errors:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let child,browser,log='';
const watchdog=setTimeout(()=>{child?.kill();process.exit(2);},240000);watchdog.unref();
async function waitForServer(){for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await sleep(50);assert.match(log,/localhost:(\d+)/,'Server must become ready');return 'http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];}
async function sample(page){return page.evaluate(()=>{
 const d=HeyPalsTVMotion.diagnostics(),curtain=document.getElementById('tvSceneTransition');
 const pose=n=>{if(!n)return null;const s=getComputedStyle(n);return {transform:s.transform,translate:s.translate,opacity:s.opacity,animations:n.getAnimations().map(a=>({state:a.playState,time:a.currentTime,name:a.animationName||''}))};};
 return {at:performance.now(),...d,left:pose(curtain.querySelector('.tvm-door-l')),right:pose(curtain.querySelector('.tvm-door-r')),cards:[...document.querySelectorAll('#tvBrowse>.tv-choice,#tvCatalog .fresh-heading,#tvSidebar>section')].filter(n=>n.getClientRects().length).map(n=>({id:n.id||n.className,...pose(n)}))};
});}
async function idle(page,expected=null){await page.waitForFunction(expected=>{
 const d=HeyPalsTVMotion.diagnostics();return d.state==='idle'&&!d.pending&&!d.curtain&&(!expected||d.committed===expected)&&
  (expected!=='lobby'||(!document.getElementById('lobby').hidden&&document.getElementById('play').hidden));
},expected,{timeout:14000});}
async function settled(page){
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished));});
}
async function film(page,name,trigger){
 await page.evaluate(()=>{window.__curtain246=[];let last='';window.__curtain246On=true;requestAnimationFrame(function record(t){const d=HeyPalsTVMotion.diagnostics(),el=document.getElementById('tvSceneTransition'),l=el.querySelector('.tvm-door-l'),r=el.querySelector('.tvm-door-r');__curtain246.push({...d,at:t,left:l?getComputedStyle(l).transform:null,right:r?getComputedStyle(r).transform:null});last=d.state;if(__curtain246On)requestAnimationFrame(record);});});
 const requested=await trigger(),expected=requested?.active?'game:'+requested.active.instance:'lobby';await page.waitForFunction(()=>HeyPalsTVMotion.diagnostics().state==='closing',null,{timeout:3000});
 await page.screenshot({path:path.join(out,name+'-closing.png')});
 await page.waitForFunction(()=>['closed','revealing'].includes(HeyPalsTVMotion.diagnostics().state),null,{timeout:5000});
 await page.screenshot({path:path.join(out,name+'-covered.png')});
 await page.waitForFunction(()=>HeyPalsTVMotion.diagnostics().state==='opening',null,{timeout:10000});
 const opening=await sample(page);await page.screenshot({path:path.join(out,name+'-opening.png')});
 await idle(page,expected);await settled(page);await page.screenshot({path:path.join(out,name+'-settled.png')});
 const frames=await page.evaluate(()=>{__curtain246On=false;return __curtain246;});
 assert(frames.some(f=>f.state==='closing')&&frames.some(f=>f.state==='opening'),name+': opening and closing must both be observed');
 const visibleEnd=frames.filter(f=>f.state==='opening').at(-1);assert(visibleEnd?.curtain,name+': curtain survives its actual opening');
 report.rows.push({name,opening,frames});return opening;
}
(async()=>{try{
 child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'curtain246'}});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
 const origin=await waitForServer(),api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer curtain246','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const s=await r.json();assert(r.ok,JSON.stringify(s));return s;};
 await api({type:'force-language',language:'en'});
 const settleScene=async page=>{const current=await api();await idle(page,current.active?'game:'+current.active.instance:'lobby');};
 for(const engine of (process.env.QA_ENGINE?[process.env.QA_ENGINE]:['chromium','webkit'])){
  browser=await pw[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
  const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>report.errors.push({engine,error:e.message}));
  await page.goto(origin+'/tv');await page.waitForFunction(()=>HeyPalsTVMotion?.diagnostics().state==='opening',null,{timeout:12000});
  report.rows.push({name:engine+'-cold-menu-opening',pose:await sample(page)});await page.screenshot({path:path.join(out,engine+'-cold-menu-opening.png')});await settleScene(page);await settled(page);await page.screenshot({path:path.join(out,engine+'-cold-menu-settled.png')});
  await api({type:'bots-set',count:3});for(let i=0;i<60&&(await api()).players.length<3;i++)await sleep(50);
  for(const id of (process.env.QA_GAMES||'curling,bowling,push').split(',')){
   await film(page,engine+'-'+id+'-launch',()=>api({type:'launch',id}));
   const actual=await page.locator('#gameFrame').evaluate(f=>({src:f.getAttribute('src'),path:f.contentWindow.location.pathname,search:f.contentWindow.location.search,state:f.contentDocument.readyState,warmup:f.contentDocument.body.dataset.shaderWarmup}));
   assert.equal(new URL(actual.src,origin).pathname,actual.path);assert.equal(new URL(actual.src,origin).search,actual.search);assert.notEqual(actual.warmup,'pending');
   const returning=await film(page,engine+'-'+id+'-return',()=>api({type:'stop'}));
   assert(returning.cards.some(c=>c.animations.some(a=>a.state==='running')),'Return entrance starts while web shutter opens');
  }
  // Delay the actual destination response after another game is complete. The
  // old document must not satisfy the new src's preparation gate.
  await api({type:'launch',id:'curling'});await settleScene(page);
  let releaseDestination;const destinationHeld=new Promise(resolve=>releaseDestination=resolve);
  const destinationPattern='**/games/push/host?mode=push';
  await page.route(destinationPattern,async route=>{await destinationHeld;await route.continue();});
  await api({type:'launch',id:'push'});await page.waitForFunction(()=>HeyPalsTVMotion.diagnostics().state==='revealing');
  await page.waitForTimeout(250);const heldDestination=await sample(page);
  assert.equal(heldDestination.state,'revealing','Old complete game cannot reveal while destination request is held');
  releaseDestination();await settleScene(page);await page.unroute(destinationPattern);
  report.rows.push({name:engine+'-destination-readiness',held:heldDestination,final:await sample(page)});
  await api({type:'stop'});await settleScene(page);
  // Reclose from a partially open pose, without resetting the visible doors to
  // the fully outside pose. A quick game -> lobby -> game may interrupt either.
  await api({type:'launch',id:'curling'});await page.waitForFunction(()=>HeyPalsTVMotion.diagnostics().state==='opening');
  const before=await sample(page);await api({type:'stop'});await page.waitForFunction(()=>HeyPalsTVMotion.diagnostics().state==='closing');const after=await sample(page);
  await api({type:'launch',id:'push'});await settleScene(page);
  assert.equal((await api()).active.id,'push');report.rows.push({name:engine+'-rapid-interruption',before,after,final:await sample(page)});
  await api({type:'stop'});await settleScene(page);await page.emulateMedia({reducedMotion:'reduce'});
  await api({type:'launch',id:'curling'});await settleScene(page);await api({type:'stop'});await settleScene(page);await settled(page);await page.screenshot({path:path.join(out,engine+'-reduced-return.png')});report.rows.push({name:engine+'-reduced-launch-return',final:await sample(page)});
  // Controlled native bridge: an open reply remains pending while a new close
  // begins; resolving the stale open must not hide the new shutter. Inspect
  // prepared timelines at open rather than accepting a settled screenshot.
  const native=await browser.newPage({viewport:{width:1280,height:720}});native.on('pageerror',e=>report.errors.push({engine,nativeFixture:true,error:e.message}));
  await native.addInitScript(()=>{window.__nativeReplies=[];window.webkit={messageHandlers:{partyTVCurtain:{postMessage(action){return new Promise(resolve=>{__nativeReplies.push({action,resolve,at:performance.now()});});}}}};});
  await native.goto(origin+'/tv');await native.waitForFunction(()=>__nativeReplies.some(x=>x.action==='open'),null,{timeout:10000});
  const nativeStartup=await sample(native);
  assert(nativeStartup.cards.some(c=>c.animations.some(a=>a.state==='running')),'Native startup prepared entrances must play with opening, not disappear on reset');
  await native.evaluate(()=>__nativeReplies.find(x=>x.action==='open').resolve(true));await settleScene(native);
  await api({type:'launch',id:'curling'});await native.waitForFunction(()=>__nativeReplies.at(-1).action==='close');
  const closedReply=await native.evaluate(()=>{const x=__nativeReplies.at(-1);window.__closeReadyAt=performance.now();x.resolve(true);return x.at;});
  await native.waitForFunction(()=>__nativeReplies.at(-1).action==='open');
  await api({type:'stop'});await native.waitForFunction(()=>__nativeReplies.at(-1).action==='close');
  const repliesBefore=await native.evaluate(()=>__nativeReplies.map(x=>x.action));
  await native.evaluate(()=>__nativeReplies.filter(x=>x.action==='open').at(-1).resolve(false));
  assert.equal((await sample(native)).state,'closing','Interrupted native open reply must not clear current close');
  await native.evaluate(()=>__nativeReplies.at(-1).resolve(true));await native.waitForFunction(()=>__nativeReplies.at(-1).action==='open');
  const nativeReturn=await sample(native);assert(nativeReturn.cards.some(c=>c.animations.some(a=>a.state==='running')),'Native return prepared entrances must play while doors open');
  await native.evaluate(()=>__nativeReplies.at(-1).resolve(true));await settleScene(native);report.rows.push({name:engine+'-native-reply-fixture',nativeStartup,nativeReturn,repliesBefore,closedReply,final:await sample(native)});
  await native.close();await page.close();await browser.close();browser=null;
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 }
 assert.deepEqual(report.errors,[]);report.status='passed';console.log(JSON.stringify({status:report.status,rows:report.rows.length}));
}catch(e){report.failure=e.stack;process.exitCode=1;console.error(e);}finally{await browser?.close();child?.kill();clearTimeout(watchdog);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}})();
