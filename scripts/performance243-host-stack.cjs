'use strict';
// Native Host renderer fixture: actual native DOM/CSS, real scroll thresholds;
// fake native bridge acknowledges commands but does not claim physical profiling.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright'),express=require('express');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.QA_OUTPUT||'output/playwright/performance243/host-stack');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const server=express().use(express.static(path.join(root,'public'))).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));let browser;
 try{
  const engine=process.env.QA_ENGINE||'chromium';browser=await(engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
  const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:3});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(process.env.PERF_SOURCE_DIR)await page.route('**/native-shell/host.js*',r=>r.fulfill({path:path.join(process.env.PERF_SOURCE_DIR,'public/native-shell/host.js'),contentType:'application/javascript'}));
  await page.addInitScript(()=>{window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};window.__stackPerf={rects:{},styles:{},mutations:0,frames:[]};const rect=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(...args){const p=__stackPerf,id=this.id||this.className||this.tagName;p.rects[id]=(p.rects[id]||0)+1;return rect.apply(this,args);};const style=CSSStyleDeclaration.prototype.setProperty;CSSStyleDeclaration.prototype.setProperty=function(name,value,...rest){__stackPerf.styles[name]=(__stackPerf.styles[name]||0)+1;return style.call(this,name,value,...rest);};addEventListener('DOMContentLoaded',()=>new MutationObserver(r=>__stackPerf.mutations+=r.length).observe(document.body,{subtree:true,attributes:true,childList:true,characterData:true}));let last;requestAnimationFrame(function sample(t){if(last)__stackPerf.frames.push(t-last);last=t;requestAnimationFrame(sample);});});
  await page.addInitScript({content:'window.__partyPersistentTabs=true;'+fs.readFileSync(path.join(root,'public/native-shell/visibility.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'public/native-shell/tabs.js'),'utf8')});
  await page.goto('http://127.0.0.1:'+server.address().port+'/native-shell/index.html');
  const catalog=require('../lib/catalog'),players=[{id:'one',name:'Alexandra',gameReady:true,connected:true}],state={catalog,players,leaderboard:[],votes:[],screens:1,native:{ready:true,catalogReady:true},selected:'push',active:{id:'push',instance:'stack-fixture',ui:{phase:'waiting'},session:{paused:false,readyIds:[]},roster:players,ready:['one']},tv:{canCover:true,mode:'none',focusNumber:1,total:36}};
  await page.evaluate(s=>{window.__snapshot=s;LocalPartyHost.update(s);},state);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(700);
  assert(await page.locator('.game-spotlight').evaluate(n=>n.hidden),'First snapshot with active game hides the uninitialized spotlight');
  // Persistent native chrome arrives asynchronously. Exclude that cold setup
  // from the repeated-scroll CPU workload; its latency belongs to the startup
  // curtain contract, while the separate strict suite checks response timing.
  await page.evaluate(()=>scrollTo(0,180));await page.waitForFunction(()=>document.getElementById('activeCard').classList.contains('is-compact'));
  await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>!document.getElementById('activeCard').classList.contains('is-compact'));await page.waitForTimeout(500);
  const session=engine==='chromium'?await page.context().newCDPSession(page):null;if(session)await session.send('Performance.enable');
  const metrics=async()=>session?Object.fromEntries((await session.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value])):{};
  await page.evaluate(()=>{__stackPerf={rects:{},styles:{},mutations:0,frames:[]};});const before=await metrics();
  const runs=await page.evaluate(async()=>{const result=[],wait=ms=>new Promise(r=>setTimeout(r,ms));for(let i=0;i<12;i++){scrollTo(0,i%2?0:180);await wait(360);const card=document.getElementById('activeCard'),tools=document.querySelector('.native-catalog-tools');result.push({compact:card.classList.contains('is-compact'),height:card.getBoundingClientRect().height,toolsTop:tools.getBoundingClientRect().top});}return result;});
  const after=await metrics(),profile=await page.evaluate(()=>__stackPerf),frames=profile.frames.sort((a,b)=>a-b);profile.frameP95=frames[Math.floor(frames.length*.95)];delete profile.frames;
  const cpu=Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'].map(k=>[k,after[k]-before[k]]));
  assert(runs.every((r,i)=>r.compact===(i%2===0)),'Every real scroll threshold must commit: '+JSON.stringify(runs));assert.equal(errors.length,0,errors.join('\n'));
  await page.waitForFunction(()=>document.getElementById('activeCard').getBoundingClientRect().height>200);await page.screenshot({path:path.join(out,'active-expanded.png')});await page.evaluate(()=>scrollTo(0,180));await page.waitForFunction(()=>document.getElementById('activeCard').getBoundingClientRect().height<80);await page.waitForTimeout(100);await page.screenshot({path:path.join(out,'active-compact.png')});
  await page.evaluate(()=>{scrollTo(0,0);__snapshot.active=null;LocalPartyHost.update(__snapshot);});await page.waitForTimeout(700);
  await page.waitForFunction(()=>{const n=document.querySelector('.spotlight-logo');return n?.complete&&n.naturalWidth>0&&document.querySelector('.spotlight-meta');});
  await page.waitForFunction(()=>{const n=document.querySelector('.spotlight-word-ink');return n&&Number(getComputedStyle(n).opacity)>.99;});await page.screenshot({path:path.join(out,'returned-choice.png')});
  assert(await page.locator('.game-spotlight').isVisible(),'Startup-active then lobby initializes a complete suggestion');
  const initialGame=await page.locator('.game-spotlight').getAttribute('data-game');
  await page.evaluate(()=>{window.__partyNativeHidden=true;dispatchEvent(new Event('party-native-hide'));});await page.waitForTimeout(100);
  const hidden=await page.locator('.game-spotlight').evaluate(n=>({awake:n.classList.contains('spotlight-awake'),running:document.getAnimations().filter(a=>a.effect?.target?.matches?.('.spotlight-step-fill')).some(a=>a.playState==='running')}));
  assert.deepEqual(hidden,{awake:false,running:false},'Native hide parks the suggestion progress');assert.equal(await page.locator('.game-spotlight').getAttribute('data-game'),initialGame);
  await page.evaluate(()=>{window.__partyNativeHidden=false;dispatchEvent(new Event('party-native-resume'));});await page.waitForFunction(()=>document.querySelector('.game-spotlight').classList.contains('spotlight-awake'));
  await page.evaluate(()=>{for(const a of document.getAnimations())if(a.effect?.target?.matches?.('.spotlight-step-fill'))a.currentTime=9990;});await page.waitForFunction(id=>document.querySelector('.game-spotlight').dataset.game!==id,initialGame);
  await page.waitForTimeout(750);await page.screenshot({path:path.join(out,'resumed-lobby.png')});
  const report={engine:'desktop '+engine,method:'Native host renderer fixture, real twelve scroll threshold crossings; no physical device',cpu,profile,runs,errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({cpu,p95:profile.frameP95,rects:profile.rects,styles:profile.styles}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
