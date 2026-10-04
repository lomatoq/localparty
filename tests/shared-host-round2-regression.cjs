'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const express=require('express');
const out=path.resolve(process.env.AUDIT_OUTPUT||'.localparty-build/design-round2/ui/host-regression');fs.mkdirSync(out,{recursive:true});
async function sampleDeckCompaction(page) {
 return page.evaluate(async()=>{
  const card=document.getElementById('activeCard'),catalog=document.getElementById('catalog');
  const frames=n=>new Promise(resolve=>{function next(){if(--n<=0)resolve();else requestAnimationFrame(next);}requestAnimationFrame(next);});
  const sample=(start=performance.now())=>{const r=card.getBoundingClientRect(),s=getComputedStyle(card),margin=parseFloat(s.marginBottom)||0,animations=card.getAnimations().filter(a=>a.playState==='running');return{t:performance.now()-start,scroll:scrollY,compact:card.classList.contains('is-compact'),height:r.height,radius:parseFloat(s.borderTopLeftRadius),margin,slot:r.height+margin,top:r.top,anchor:catalog.getBoundingClientRect().top+scrollY,opacity:Number(s.opacity),heightRunning:animations.some(a=>a.effect?.getKeyframes().some(k=>'height'in k)),geometryRunning:animations.some(a=>a.transitionProperty?.includes('radius')||a.effect?.getKeyframes().some(k=>'height'in k||Object.keys(k).some(p=>/Radius$/.test(p))))};};
  scrollTo(0,0);await frames(3);await Promise.allSettled(card.getAnimations().map(a=>a.finished));await document.fonts.ready;
  const initial=sample(),steps=[],transitions=[];
  async function step(y,expected){scrollTo(0,y);await frames(3);steps.push({expected,...sample()});}
  async function transition(y,expected,label){const start=performance.now(),samples=[sample(start)];scrollTo(0,y);await new Promise(resolve=>{function tick(){samples.push(sample(start));if(performance.now()-start<440)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});const final=samples.at(-1);const classStart=samples.find(x=>x.compact===expected);const motionStart=samples.find(x=>Math.abs(x.height-samples[0].height)>.5);const settled=samples.find((x,i)=>i>0&&x.compact===expected&&!x.geometryRunning&&samples.slice(i).every(v=>Math.abs(v.height-final.height)<.5&&Math.abs(v.radius-final.radius)<.1&&v.compact===expected&&!v.geometryRunning));transitions.push({label,expected,classLatency:classStart?.t,motionLatency:motionStart?.t,settledAt:settled?.t,final,samples});}
  // Real incremental scrolling reaches both sides of the two thresholds.
  for(const y of [4,8,16,24])await step(y,false);
  await transition(25,true,'collapse');
  for(const y of [24,16,9])await step(y,true);
  await transition(8,false,'expand');
  for(const y of [16,24])await step(y,false);
  await transition(25,true,'collapse-again');
  // Reverse during the morph: cancellation must preserve the occupied flow slot.
  const interruptedStart=performance.now(),interrupted=[sample(interruptedStart)];
  scrollTo(0,8);await frames(3);interrupted.push(sample(interruptedStart));scrollTo(0,25);
  await new Promise(resolve=>{function tick(){interrupted.push(sample(interruptedStart));if(performance.now()-interruptedStart<460)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
  return{width:innerWidth,height:innerHeight,initial,steps,transitions,interrupted};
 });
}
function assertDeckCompaction(run){
 const all=[run.initial,...run.steps,...run.transitions.flatMap(t=>t.samples),...run.interrupted];
 const spread=key=>Math.max(...all.map(s=>s[key]))-Math.min(...all.map(s=>s[key]));
 assert(run.initial.height>80,'Timing audit must start with a genuinely expanded active card');
 for(const step of run.steps)assert.equal(step.compact,step.expected,'Compaction hysteresis at scrollY='+step.scroll);
 for(const t of run.transitions){
  assert(t.classLatency<=55,`${run.width} ${t.label}: class response ${t.classLatency}ms must start within a couple of frames`);
  assert(t.motionLatency<=75,`${run.width} ${t.label}: visible motion delayed ${t.motionLatency}ms`);
  assert(t.settledAt>=140&&t.settledAt<=300,`${run.width} ${t.label}: geometry settles at ${t.settledAt}ms, expected about180ms and at most300ms`);
  assert.equal(t.final.compact,t.expected);assert(t.samples.every(s=>s.opacity>.99),'Active card flickered during '+t.label);
  const toggles=t.samples.slice(1).filter((s,i)=>s.compact!==t.samples[i].compact).length;assert.equal(toggles,1,'Exactly one mode change during '+t.label);
 }
 assert(spread('slot')<=2,`${run.width}: active-card flow slot changed ${spread('slot')}px during compaction`);
 assert(spread('anchor')<=2,`${run.width}: catalogue content jumped ${spread('anchor')}px beyond scroll movement`);
 assert(run.interrupted.at(-1).compact,'Interrupted expansion returns to compact mode');
 assert(run.interrupted.every(s=>s.opacity>.99),'Interrupted morph flickers');
 return{width:run.width,expandedHeight:run.initial.height,compactHeight:run.transitions[0].final.height,slotVariation:spread('slot'),catalogueJump:spread('anchor'),transitions:run.transitions.map(({label,classLatency,motionLatency,settledAt})=>({label,classLatency,motionLatency,settledAt}))};
}
(async()=>{
 const server=express().use(express.static(path.resolve('public'))).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const browser=await webkit.launch({headless:true});const report={errors:[],samples:[]};
 try{
 const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{window.__commands=[];window.webkit={messageHandlers:{partyShell:{postMessage:m=>__commands.push(m)}}};});
 await page.goto(`http://127.0.0.1:${server.address().port}/native-shell/index.html`);
 const state={catalog:require('../lib/catalog'),players:[{id:'one',name:'Александра',gameReady:true,connected:true}],leaderboard:[],votes:[],screens:1,native:{ready:true,catalogReady:true},selected:'push',tv:{canCover:true,mode:'none',focusNumber:1,total:33}};
 await page.evaluate(s=>{window.__snapshot=s;LocalPartyHost.update(s);},state);
 await page.locator('#openHost').click();
 report.untranslated=await page.locator('#hostPanel').evaluate(root=>{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),out=[];while(walker.nextNode()){const n=walker.currentNode;if(/[А-Яа-яЁё]/.test(n.nodeValue)&&!n.nodeValue.includes('Александра'))out.push(n.nodeValue.trim());}return out;});
 report.type=await page.locator('#botHint').evaluate(el=>({family:getComputedStyle(el).fontFamily,style:getComputedStyle(el).fontStyle,weight:getComputedStyle(el).fontWeight}));
 assert.equal(report.type.style,'italic','Supporting copy uses the approved real italic role');assert.equal(report.type.weight,'400');assert.match(report.type.family,/KardiaFitRunner/);
 await page.evaluate(()=>{window.__sheetSamples=[];window.__sheetStart=performance.now();requestAnimationFrame(function sample(t){const d=document.querySelector('#hostPanel'),s=getComputedStyle(d);__sheetSamples.push({t:t-__sheetStart,open:d.open,opacity:Number(s.opacity),y:d.getBoundingClientRect().y,animations:d.getAnimations().map(a=>a.animationName)});if(t-__sheetStart<1800)requestAnimationFrame(sample);});});
 for(let i=0;i<16;i++){await page.evaluate(i=>{__snapshot.native.working=i%2===0;LocalPartyHost.update(__snapshot);},i);await page.waitForTimeout(100);}
 await page.screenshot({path:path.join(out,'panel-before-close.png')});
 report.samples=await page.evaluate(()=>__sheetSamples);
 await page.evaluate(()=>{window.__closeSamples=[];const start=performance.now();requestAnimationFrame(function sample(t){const d=document.querySelector('#hostPanel'),s=getComputedStyle(d);__closeSamples.push({t:t-start,open:d.open,opacity:Number(s.opacity),visible:s.display!=='none'&&d.getClientRects().length>0});if(t-start<900)requestAnimationFrame(sample);});});
 await page.locator('[data-close=hostPanel]').click();await page.waitForTimeout(1000);
 report.closeSamples=await page.evaluate(()=>__closeSamples);
 let faded=false;for(const s of report.closeSamples){if(!s.visible||s.opacity<.03)faded=true;else if(faded&&s.opacity>.12)throw Error('Host sheet reappears during closing');}
 report.closed=await page.locator('#hostPanel').isVisible();
 for(let i=0;i<3;i++){await page.locator('#openHost').click();await page.waitForTimeout(850);assert(await page.locator('#hostPanel').isVisible());await page.locator('[data-close=hostPanel]').click();await page.waitForTimeout(600);assert(!await page.locator('#hostPanel').isVisible());}
 await page.evaluate(()=>{__snapshot.native.working=false;__snapshot.active={id:'push',instance:'audit',ui:{phase:'waiting'},session:{paused:false,readyIds:[]},roster:__snapshot.players,ready:['one']};LocalPartyHost.update(__snapshot);});
 assert.equal(await page.evaluate(()=>__commands.filter(c=>c.type==='controller').length),0,'Starting a game must not automatically switch tabs');
 await page.locator('#activeController').click();
 assert.equal(await page.evaluate(()=>__commands.filter(c=>c.type==='controller').length),1,'Top shortcut opens controller via existing native navigation');
 assert(await page.locator('#activeController').isVisible(),'Controller shortcut stays alongside match actions');
 await page.screenshot({path:path.join(out,'active-top.png')});
 report.compaction=[];report.compactionSummary=[];await page.emulateMedia({reducedMotion:'no-preference'});
 for(const width of [393,320]){await page.setViewportSize({width,height:width===320?568:852});const run=await sampleDeckCompaction(page);report.compaction.push(run);report.compactionSummary.push(assertDeckCompaction(run));}
 await page.setViewportSize({width:393,height:852});
 await page.evaluate(()=>scrollTo(0,1200));await page.waitForTimeout(400);await page.screenshot({path:path.join(out,'active-scrolled.png')});
 // Test the genuinely stuck stack, including each frame of manual expansion.
 for(const width of [320,393]){
  await page.setViewportSize({width,height:852});
  const gaps=await page.evaluate(async()=>{const card=document.getElementById('activeCard'),search=document.querySelector('.native-search'),samples=[];for(let pass=0;pass<2;pass++){document.getElementById('activeMore').click();const start=performance.now();await new Promise(resolve=>{function tick(){samples.push(search.getBoundingClientRect().top-card.getBoundingClientRect().bottom);if(performance.now()-start<300)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});}return samples;});
  assert(gaps.every(gap=>gap>=7.9&&gap<=8.1),'Sticky search must keep its 8px gap throughout expansion at '+width);
  (report.stuckMorph ||= []).push({width,minGap:Math.min(...gaps),maxGap:Math.max(...gaps)});
 }

 report.active=await page.locator('#activeCard').boundingBox();
 assert(report.active.y>=0&&report.active.y<180,'Active game remains pinned after scrolling');
 const activeLaunch=page.locator('[data-game=push] .lp-direct-start');
 assert.match(await activeLaunch.textContent(),/^(Открыть пульт|Open controller)$/,'Active game card offers its controller');
 const commandCount=await page.evaluate(()=>__commands.length);
 await activeLaunch.click();
 assert.deepEqual(await page.evaluate(n=>__commands.slice(n).map(c=>c.type).filter(t=>!['launch-diagnostic','haptic','haptic-prepare'].includes(t)),commandCount),['controller'],'Active game card opens the controller without restarting');
 await page.evaluate(()=>{window.__actionNode=document.querySelector('#activeActions button');__snapshot.active.roster=__snapshot.players.map(p=>({...p,connected:false}));LocalPartyHost.update(__snapshot);});
 assert(await page.evaluate(()=>__actionNode===document.querySelector('#activeActions button')),'Presence updates retain action DOM/focus');
 await page.locator('#openHost').click();await page.waitForTimeout(300);
 await page.evaluate(()=>{document.querySelector('[data-close=hostPanel]').click();document.querySelector('#openHost').click();});await page.waitForTimeout(600);
 assert(await page.locator('#hostPanel').isVisible(),'Reopening cancels pending close');
 await page.locator('[data-close=hostPanel]').click();await page.waitForTimeout(400);
 await page.evaluate(()=>{scrollTo(0,0);__snapshot.active=null;__snapshot.native.ready=false;__snapshot.native.connectionStatus='Локальный сервер недоступен. Закройте LocalParty на iPhone и откройте снова.';LocalPartyHost.update(__snapshot);});
 await page.setViewportSize({width:320,height:700});
 report.selection=await page.locator('#choiceStrip').evaluate(el=>({opacity:getComputedStyle(el).opacity,startOpacity:getComputedStyle(document.querySelector('#choiceStart')).opacity}));
 assert.equal(report.selection.opacity,'1','Unavailable game selection must stay fully readable');assert.equal(report.selection.startOpacity,'1','Disabled Start uses a muted color, not transparency');
 report.logo=await page.locator('#brandHeader>.heypals-header-logo').evaluate(el=>{const box=el.getBoundingClientRect(),header=el.parentElement.getBoundingClientRect();const overlap=[...el.parentElement.querySelectorAll('nav button')].filter(n=>n.getClientRects().length).some(n=>{const r=n.getBoundingClientRect();return r.left<box.right&&r.right>box.left&&r.top<box.bottom&&r.bottom>box.top;});return {loaded:el.complete&&el.naturalWidth>0,fits:box.left>=header.left&&box.right<=header.right,overlap};});
 assert(report.logo.loaded&&report.logo.fits&&!report.logo.overlap,'Complete logo must fit without clipping or overlapping navigation');
 await page.screenshot({path:path.join(out,'server-unavailable-320.png')});
 await page.evaluate(()=>{__snapshot.native.ready=true;__snapshot.native.connectionStatus=null;LocalPartyHost.update(__snapshot);});
 for(const width of [320,393,402,430]){
  await page.setViewportSize({width,height:874});await page.evaluate(()=>scrollTo(0,1200));await page.waitForTimeout(350);
  const stack=await page.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom};};return {head:box('.app-header'),pick:box('#choiceStrip'),tools:box('.native-catalog-tools')};});
  assert(Math.abs(stack.pick.top-stack.head.bottom)<2,'Host pick must stick directly under header: '+JSON.stringify(stack));
  assert(Math.abs(stack.tools.top-stack.pick.bottom)<2,'Search row must touch host pick without a transparent gap');
  await page.screenshot({path:path.join(out,`sticky-stack-${width}.png`)});
 }
 await page.evaluate(()=>{scrollTo(0,0);__snapshot.selected=null;LocalPartyHost.update(__snapshot);});await page.waitForTimeout(200);assert(await page.locator('#choiceStrip').isHidden(),'First launch has no Host Pick row');
 for(const width of [320,393,430]){
  await page.setViewportSize({width,height:874});await page.evaluate(()=>scrollTo(0,1200));await page.waitForTimeout(350);
  const stack=await page.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom};};const tools=document.querySelector('.native-catalog-tools'),before=getComputedStyle(tools,'::before');return {head:box('.app-header'),tools:box('.native-catalog-tools'),stuck:document.body.classList.contains('tools-stuck'),beforeTop:before.top,beforeBackground:before.backgroundImage};});
  assert(stack.stuck,'Find Game must enter its sticky state without Host Pick');assert(Math.abs(stack.tools.top-stack.head.bottom)<2,'Find Game must touch the header on first launch: '+JSON.stringify(stack));assert(parseFloat(stack.beforeTop)<=0,'Find Game backdrop must cover the seam under the independently painted header: '+JSON.stringify(stack));
  await page.screenshot({path:path.join(out,`sticky-no-pick-${width}.png`)});
 }
 await page.evaluate(()=>{__commands.length=0;scrollTo(0,0);__snapshot.selected='push';__snapshot.screens=0;__snapshot.native.externalDisplays=0;__snapshot.native.ready=true;__snapshot.native.working=false;__snapshot.players=[{id:'one',name:'Александра',gameReady:true,connected:true},{id:'two',name:'Бот 1',gameReady:true,connected:true,testBot:true}];LocalPartyHost.update(__snapshot);});
 const direct=page.locator('[data-game=push] .lp-direct-start');
 await direct.scrollIntoViewIfNeeded();
 await page.waitForTimeout(400);
 await page.evaluate(()=>{__snapshot.players=[];LocalPartyHost.update(__snapshot);});
 await direct.tap();
 await page.waitForTimeout(350);
 const rejectedTap=await direct.evaluate(el=>({disabled:el.disabled,hover:el.matches(':hover'),background:getComputedStyle(el).backgroundImage}));
 assert(!rejectedTap.disabled&&rejectedTap.background.includes('linear-gradient'),'Touch hover must retain the bright Start background: '+JSON.stringify(rejectedTap));
 const warning=await page.locator('#startBots').boundingBox();
 assert(warning&&warning.y>=0&&warning.y+warning.height<=874,'Missing-player prompt must fit the visible screen');
 assert(!(await page.evaluate(()=>__commands.some(m=>m.type==='manage'&&m.command?.type==='launch'))),'Insufficient players must not launch');
 await page.locator('#startBotsClose').click();
 await page.evaluate(()=>{__snapshot.players=[{id:'one',name:'One',gameReady:true},{id:'two',name:'Two',gameReady:true}];LocalPartyHost.update(__snapshot);});
 await direct.tap();
 assert(await page.evaluate(()=>__commands.some(message=>message.type==='screen-refresh')),'Start must request display recovery instead of silently dying');
 assert.equal(await direct.getAttribute('data-lp-press-state'),null,'Start cannot retain a stale touch animation after click');
 await page.evaluate(()=>{__snapshot.screens=1;LocalPartyHost.update(__snapshot);});
 const recoveredLaunch=await page.evaluate(()=>__commands.findLast(message=>message.type==='manage'&&message.command?.type==='launch'));
 assert.equal(recoveredLaunch.command.id,'push','Recovered display must continue the original launch');
 await page.evaluate(()=>{__snapshot.active={id:'push',instance:'recovered'};LocalPartyHost.update(__snapshot);__snapshot.active=null;LocalPartyHost.update(__snapshot);__commands.length=0;});
 await page.evaluate(()=>{__snapshot.selected='push';__snapshot.screens=0;__snapshot.native.externalDisplays=1;__snapshot.players=[{id:'one',name:'Александра',gameReady:true,connected:true},{id:'two',name:'Бот 1',gameReady:true,connected:true,testBot:true}];LocalPartyHost.update(__snapshot);});
 assert(!(await page.locator('#choiceStart').isDisabled()),'Native TV scene must keep Start actionable during display websocket reconnect');
 await page.locator('#choiceStart').click();
 const launch=await page.evaluate(()=>__commands.findLast(message=>message.type==='manage'&&message.command?.type==='launch'));
 assert.equal(launch.command.id,'push');assert.equal(launch.command.externalDisplay,true,'Launch must carry trusted native-display fallback');
 await page.evaluate(()=>{__commands.length=0;__snapshot.screens=0;__snapshot.native.externalDisplays=0;__snapshot.native.working=true;LocalPartyHost.update(__snapshot);});
 assert(!(await page.locator('#openController').isDisabled()),'Local controller navigation must work without TV and during unrelated room commands');
 await page.locator('#openController').evaluate(el=>el.click());
 assert(await page.evaluate(()=>__commands.some(m=>m.type==='controller'||m.type==='native-tab'&&m.tab==='controller')));
 await page.evaluate(()=>{__commands.length=0;document.querySelector('#wifiInviteSSID').value='Party; room';document.querySelector('#wifiInvitePassword').value='test-password';document.querySelector('#wifiInviteForm').dispatchEvent(new Event('submit',{cancelable:true}));});
 assert.equal(await page.locator('#wifiInvitePassword').inputValue(),'','Clear credentials after handing off to native QR encoder');
 assert(await page.evaluate(()=>__commands.some(m=>m.type==='wifi-invite'&&m.ssid==='Party; room')));
 assert.deepEqual(report.untranslated,[],'Untranslated host panel copy');
 const dot=await page.locator('#connection').evaluate(el=>{const s=getComputedStyle(el,'::before');return {width:s.width,height:s.height,shrink:s.flexShrink};});assert.equal(dot.width,dot.height);assert.equal(dot.shrink,'0');report.connectionDot=dot;
 report.stable=report.samples.filter(s=>s.t>800).every(s=>s.open&&s.opacity>.99);
 assert(report.stable,'Host panel vanishes after entrance');assert(!report.closed,'Panel remains visible after closing');assert.equal(report.errors.length,0);
 console.log(JSON.stringify({stable:report.stable,closed:report.closed,active:report.active,compaction:report.compactionSummary}));
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
