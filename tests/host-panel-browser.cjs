'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const express=require('express');
const out=path.resolve(process.env.AUDIT_OUTPUT||'.localparty-build/host-panel-audit');fs.mkdirSync(out,{recursive:true});
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
 assert.equal(report.type.style,'italic');assert.equal(report.type.weight,'800');
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
 await page.evaluate(()=>scrollTo(0,1200));await page.waitForTimeout(400);await page.screenshot({path:path.join(out,'active-scrolled.png')});
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
 assert.deepEqual(report.untranslated,[],'Untranslated host panel copy');
 const dot=await page.locator('#connection').evaluate(el=>{const s=getComputedStyle(el,'::before');return {width:s.width,height:s.height,shrink:s.flexShrink};});assert.equal(dot.width,dot.height);assert.equal(dot.shrink,'0');report.connectionDot=dot;
 report.stable=report.samples.filter(s=>s.t>800).every(s=>s.open&&s.opacity>.99);
 assert(report.stable,'Host panel vanishes after entrance');assert(!report.closed,'Panel remains visible after closing');assert.equal(report.errors.length,0);
 console.log(JSON.stringify({stable:report.stable,closed:report.closed,active:report.active}));
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
