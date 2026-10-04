'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const express=require('express');
const output=path.resolve('.localparty-build/design-round2/ui/after');fs.mkdirSync(output,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'lan-layout-qa'}});
let log='',browser,hostServer;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await sleep(50);assert.match(log,/localhost:(\d+)/);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async data=>{const r=await fetch(origin+'/api/manage',{method:data?'POST':'GET',headers:{Authorization:'Bearer lan-layout-qa','Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});assert(r.ok,await r.clone().text());return r.json();};
 const errors=[],captures=[];browser=await webkit.launch({headless:true});
 const tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>errors.push(e.message));await tv.goto(origin+'/tv');await tv.waitForFunction(()=>document.querySelector('#tvStartup').hidden,{},{timeout:20000});await tv.evaluate(()=>document.fonts.ready);await sleep(300);
 for(const width of [1280,1920]){
  await tv.setViewportSize({width,height:width===1280?720:1080});await sleep(250);
  const ink=await tv.locator('.headline-stage h1').evaluate(n=>({overflow:getComputedStyle(n).overflow,right:n.getBoundingClientRect().right,screen:innerWidth}));assert.equal(ink.overflow,'visible');assert(ink.right<=ink.screen);await tv.screenshot({path:path.join(output,'tv-'+width+'.png')});captures.push('tv-'+width+'.png');
 }
 const phone=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true,deviceScaleFactor:Number(process.env.QA_UI_DPR)||1});phone.on('pageerror',e=>errors.push(e.message));await phone.goto(origin+'/play');await phone.locator('#name').fill('Alex');await phone.locator('#joinForm button[type=submit]').click();await api({type:'bots-set',count:3});await api({type:'launch',id:'push'});await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await phone.evaluate(()=>document.fonts.ready);await sleep(200);
 for(const width of [320,375,393]){
  await phone.setViewportSize({width,height:width===320?568:width===375?667:852});
  for(const open of [false,true]){
   await phone.locator('.waiting-details').evaluate((n,open)=>n.open=open,open);await sleep(150);
   const m=await phone.evaluate(()=>{const details=document.querySelector('.waiting-details'),summary=details.querySelector('summary'),body=details.querySelector('.waiting-rules-body'),r=details.getBoundingClientRect(),c=document.querySelector('#waitingContent').getBoundingClientRect(),ready=document.querySelector('#readyButton').getBoundingClientRect(),footer=document.querySelector('#sessionControls').getBoundingClientRect();return{open:details.open,display:getComputedStyle(summary).display,align:getComputedStyle(summary).alignItems,cardBottom:r.bottom,contentBottom:c.bottom,readyBottom:ready.bottom,footerTop:footer.top,scrollable:body.scrollHeight>body.clientHeight,bodyHeight:body.clientHeight,horizontal:document.documentElement.scrollWidth-innerWidth};});
   const backing=await phone.evaluate(()=>{const h=document.querySelector('#brandHeader'),s=getComputedStyle(h,'::before');return{height:h.getBoundingClientRect().height,bottom:parseFloat(s.bottom),background:s.backgroundImage};});assert.equal(backing.bottom,0);assert(backing.background.includes('gradient'));
   assert.equal(m.display,'flex');assert.equal(m.align,'center');assert(m.cardBottom<=m.contentBottom+1);assert(m.readyBottom<=m.footerTop);assert.equal(m.horizontal,0);if(open)assert(m.bodyHeight>35);
   assert(await phone.locator('.waiting-rules-body>div>b').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).textAlign==='center')),'green rule headings are centered');
   assert(await phone.locator('.waiting-rules-body>div>b').evaluateAll(nodes=>nodes.every(n=>parseFloat(getComputedStyle(n).fontSize)===16&&getComputedStyle(n).fontFamily.includes('KardiaFatRunner')&&getComputedStyle(n).fontStyle==='italic')),'green rule headings are heavier italic16px');
   if(open){await phone.locator('.waiting-rules-body').evaluate(n=>n.scrollTop=n.scrollHeight);await sleep(80);assert(await phone.locator('.waiting-rules-body').evaluate(n=>Math.abs(n.scrollHeight-n.clientHeight-n.scrollTop)<2));await phone.locator('.waiting-rules-body').evaluate(n=>n.scrollTop=0);}
   const file='web-rules-'+width+(open?'-open':'')+'.png';await phone.screenshot({path:path.join(output,file)});captures.push(file);
  }
 }

 // Actual summary taps: width expansion, upward title/goal, reversals and
 // keyboard/reduced-motion behavior share the same production handler.
 await phone.setViewportSize({width:393,height:852});
 await phone.locator('.waiting-details').evaluate(n=>n.open=false);await sleep(400);
 const box=()=>phone.evaluate(()=>Object.fromEntries(['#waitingTitle','.waiting-goal','.waiting-details','#readyButton','#pauseButton','#exitVoteButton'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,{x:r.x,y:r.y,width:r.width,height:r.height}];})));
 const initial=await box();assert(initial['.waiting-details'].width<initial['#readyButton'].width-50,'Closed rules are deliberately narrower');
 await phone.evaluate(()=>{window.__rulesFrames=[];const start=performance.now();document.querySelector('.waiting-details summary').click();requestAnimationFrame(function sample(t){const d=document.querySelector('.waiting-details'),r=d.getBoundingClientRect();__rulesFrames.push({time:t-start,width:r.width,height:r.height,titleY:document.querySelector('#waitingTitle').getBoundingClientRect().y});if(t-start<380)requestAnimationFrame(sample);});});
 await sleep(90);await phone.screenshot({path:path.join(output,'waiting-expand-90.png')});captures.push('waiting-expand-90.png');await sleep(350);
 const expanded=await box(),trajectory=await phone.evaluate(()=>__rulesFrames);
 assert(expanded['#waitingTitle'].y<initial['#waitingTitle'].y-20,'Opening moves title up');assert(expanded['.waiting-goal'].y<initial['.waiting-goal'].y-20,'Opening moves description up');
 assert(Math.abs(expanded['.waiting-details'].x-expanded['#readyButton'].x)<1,'Open card matches Ready edge');
 for(const s of ['#pauseButton','#exitVoteButton'])assert(Math.abs((s==='#pauseButton'?expanded[s].x:expanded[s].x+expanded[s].width)-(s==='#pauseButton'?expanded['#readyButton'].x:expanded['#readyButton'].x+expanded['#readyButton'].width))<1,'Footer edge matches Ready');
 assert(trajectory.some(s=>s.width>initial['.waiting-details'].width+5&&s.width<expanded['.waiting-details'].width-5),'Width actually interpolates');
 await phone.screenshot({path:path.join(output,'waiting-expand-settled.png')});captures.push('waiting-expand-settled.png');
 await phone.locator('.waiting-details summary').click();await sleep(40);await phone.locator('.waiting-details summary').click();await sleep(400);assert(await phone.locator('.waiting-details').evaluate(n=>n.open),'Rapid close/reopen ends open');
 await phone.locator('.waiting-details summary').focus();await phone.keyboard.press('Enter');await sleep(400);assert(!await phone.locator('.waiting-details').evaluate(n=>n.open),'Keyboard closes rules');
 await phone.emulateMedia({reducedMotion:'reduce'});await phone.locator('.waiting-details summary').click();const reducedCard=await box();assert(reducedCard['.waiting-details'].width>initial['.waiting-details'].width+50);await phone.emulateMedia({reducedMotion:'no-preference'});
 // Every real shared shell dialog goes through the common exit. The room
 // backdrop, Escape, form return value and same-frame reopen remain functional.
 const popupSamples=[];
 await phone.locator('#roomToggle').click();await sleep(750);
 await phone.screenshot({path:path.join(output,'room-dialog-open.png')});captures.push('room-dialog-open.png');
 await phone.evaluate(()=>{__popupFrames=[];const start=performance.now();document.querySelector('#closeRoom').click();requestAnimationFrame(function sample(t){const d=document.querySelector('#roomDialog'),s=getComputedStyle(d);__popupFrames.push({time:t-start,open:d.open,opacity:Number(s.opacity),scale:s.scale,closing:d.classList.contains('lp-dialog-closing')});if(t-start<320)requestAnimationFrame(sample);});});
 await sleep(90);await phone.screenshot({path:path.join(output,'room-dialog-closing.png')});captures.push('room-dialog-closing.png');await sleep(300);popupSamples.push(...await phone.evaluate(()=>__popupFrames));
 assert(popupSamples.some(s=>s.open&&s.opacity>.05&&s.opacity<.9&&parseFloat(s.scale)<.99),'Popup actually fades and scales while open');assert(!await phone.locator('#roomDialog').evaluate(d=>d.open),'Popup completes close');
 await phone.evaluate(()=>{const d=document.querySelector('#roomDialog');d.showModal();d.close();d.showModal();});await sleep(350);assert(await phone.locator('#roomDialog').evaluate(d=>d.open),'Same-frame reopen cancels pending close');
 await phone.keyboard.press('Escape');await sleep(350);assert(!await phone.locator('#roomDialog').evaluate(d=>d.open),'Escape uses animated lifecycle');
 await phone.emulateMedia({reducedMotion:'reduce'});await phone.evaluate(()=>{const d=document.querySelector('#confirmStop');d.showModal();d.querySelector('button[value=cancel]').click();});assert.equal(await phone.locator('#confirmStop').evaluate(d=>d.returnValue),'cancel');assert(!await phone.locator('#confirmStop').evaluate(d=>d.open));await phone.emulateMedia({reducedMotion:'no-preference'});
 // Native shell uses its production DOM and current server snapshot with a
 // mocked message bridge. This is not a physical iPhone screenshot.
 hostServer=express().use(express.static(path.resolve('public'))).listen(0,'127.0.0.1');await new Promise(r=>hostServer.once('listening',r));const hostOrigin='http://127.0.0.1:'+hostServer.address().port;
 const hostPage=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:Number(process.env.QA_UI_DPR)||1});hostPage.on('pageerror',e=>errors.push(e.message));await hostPage.addInitScript(()=>{window.__commands=[];window.webkit={messageHandlers:{partyShell:{postMessage:m=>__commands.push(m)}}};});await hostPage.goto(hostOrigin+'/native-shell/index.html');
 const hostSnapshot=await api();hostSnapshot.native={ready:true,catalogReady:true};await hostPage.evaluate(s=>LocalPartyHost.update(s),hostSnapshot);await hostPage.evaluate(()=>document.fonts.ready);await sleep(500);
 await hostPage.locator('#activeMore').click();await sleep(350);await hostPage.screenshot({path:path.join(output,'host-active-panel-fixture.png')});captures.push('host-active-panel-fixture.png');
 await hostPage.locator('.native-run-settings').click();await sleep(650);await hostPage.screenshot({path:path.join(output,'host-game-settings-fixture.png')});captures.push('host-game-settings-fixture.png');
 await hostPage.locator('[data-close=gameDetail]').click();await sleep(90);await hostPage.screenshot({path:path.join(output,'host-settings-closing-fixture.png')});captures.push('host-settings-closing-fixture.png');await sleep(350);assert(await hostPage.locator('#activeCard').evaluate(d=>d.classList.contains('is-expanded')),'Settings returns to expanded active-game panel');
 await hostPage.screenshot({path:path.join(output,'host-settings-return-fixture.png')});captures.push('host-settings-return-fixture.png');
 for(const width of [320,393]){await hostPage.setViewportSize({width,height:width===320?568:852});await hostPage.locator('#openHost').click();await hostPage.waitForFunction(()=>{const d=document.getElementById('hostPanel');return d.open&&parseFloat(getComputedStyle(d).opacity)>.99&&d.getBoundingClientRect().width>0;});await hostPage.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled(document.getElementById('hostPanel').getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished));});assert(await hostPage.locator('#hostPanel').evaluate(d=>parseFloat(getComputedStyle(d).opacity)>.99),'Acceptance image shows the actual finished Host panel');await hostPage.screenshot({path:path.join(output,'host-panel-'+width+'-fixture.png')});captures.push('host-panel-'+width+'-fixture.png');await hostPage.locator('[data-close=hostPanel]').click();await sleep(350);assert(!await hostPage.locator('#hostPanel').evaluate(d=>d.open));}
 fs.writeFileSync(path.join(output,'motion-report.json'),JSON.stringify({initial,expanded,trajectory,popupSamples,hostFixture:true},null,2));
 // Explicit fixture: real controller page + shipped native scripts, discovery data
 // supplied by the test. This is UI coverage, not two-physical-phone LAN evidence.
 const native=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:Number(process.env.QA_UI_DPR)||1});
 await native.addInitScript(()=>{window.__qaMessages=[];window.webkit={messageHandlers:{partyShell:{postMessage:m=>window.__qaMessages.push(m)}}};});
 await native.addInitScript({path:'public/native-shell/controller-bridge.js'});await native.goto(origin+'/play');await native.addScriptTag({path:'public/native-shell/nearby-rooms.js'});
 await native.evaluate(()=>LocalPartyRooms.update([{id:'own',name:'Your room',game:'Push Pit',phase:'waiting',players:3},{id:'other',name:'Taylor’s iPhone',game:'Marble Bloom',phase:'waiting',players:2},{id:'third',name:'Sam’s iPhone',game:'',phase:'lobby',players:1}],'own'));
 await native.locator('#nearbyToggle').click();await native.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled(document.querySelector('#nearbyDialog').getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished));});await native.screenshot({path:path.join(output,'rooms-three-fixture.png')});captures.push('rooms-three-fixture.png');
 await native.locator('[data-room="other"] button').click();assert(await native.evaluate(()=>__qaMessages.some(m=>m.type==='join-room'&&m.id==='other')));
 await native.evaluate(()=>LocalPartyRooms.update([{id:'own',name:'Your room',game:'Push Pit',phase:'waiting',players:3}],'other'));await native.locator('#nearbyToggle').click();await native.evaluate(async()=>{await Promise.allSettled(document.querySelector('#nearbyDialog').getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished));});await native.screenshot({path:path.join(output,'rooms-disconnected-fixture.png')});captures.push('rooms-disconnected-fixture.png');await native.locator('[data-room="own"] button').click();assert(await native.evaluate(()=>__qaMessages.some(m=>m.type==='join-room'&&m.id==='own')));
 await native.evaluate(()=>LocalPartyRooms.update([{id:'own',name:'Your room',game:'',phase:'lobby',players:0}],'own'));assert(await native.locator('#nearbyToggle').isHidden());


 // Current native bridge script, with explicit 59px top/34px bottom safe-area
 // fixture. The source layout, iframe fit and native dock remain real DOM.
 await sleep(300);await native.locator('#name').fill('Morgan');await native.locator('#joinForm button[type=submit]').click();await native.waitForFunction(()=>!document.querySelector('#readyButton').disabled);
 await native.addStyleTag({content:'html body.native-controller.is-player.in-game>#brandHeader{height:123px!important;min-height:123px!important;padding-top:59px!important} html body.native-controller.is-player.in-game>#brandHeader>.heypals-header-logo{top:66px!important} html body.native-controller.is-player.in-game>#brandHeader>nav:last-of-type>button{top:67px!important} html body.native-controller.is-player.in-game>#brandHeader #hudTimer{top:59px!important} html body.native-controller #partyNativeDock{height:86px!important;padding-bottom:39px!important} html body.native-controller.in-game{padding-bottom:86px!important}'});await native.evaluate(()=>window.dispatchEvent(new Event('resize')));await sleep(350);
 for(const open of [false,true]){await native.locator('.waiting-details').evaluate((d,open)=>d.open=open,open);await sleep(350);const bounds=await native.evaluate(()=>{const r=id=>document.querySelector(id).getBoundingClientRect(),s=getComputedStyle(document.querySelector('#brandHeader'),'::before');return{header:r('#brandHeader').bottom,footer:r('#sessionControls').bottom,ready:r('#readyButton').bottom,dock:r('#partyNativeDock').top,background:s.backgroundImage,bottom:parseFloat(s.bottom),ruleBody:document.querySelector('.waiting-rules-body').clientHeight};});assert(bounds.footer<=bounds.dock+1);assert(bounds.ready<bounds.dock);assert.equal(bounds.bottom,0);assert.match(bounds.background,/gradient/);if(open)assert(bounds.ruleBody>35);const file='native-safearea-'+(open?'open':'closed')+'-fixture.png';await native.screenshot({path:path.join(output,file)});captures.push(file);}
 // Real profile editing in the lobby: data commits happen immediately, while
 // its existing DOM and shade finish the common exit. No clone or mock profile.
 await api({type:'stop'});await phone.waitForFunction(()=>!document.body.classList.contains('in-game'));await sleep(350);
 const profileFrames=[];
 async function openProfile(){await phone.locator('#editFromCatalog').click();await sleep(280);assert(await phone.locator('#onboarding').isVisible());}
 await openProfile();await phone.screenshot({path:path.join(output,'profile-open.png')});captures.push('profile-open.png');
 await phone.locator('#name').fill('Alex Updated');
 const immediateProfile=await phone.evaluate(()=>{document.querySelector('#joinForm button[type=submit]').click();return{name:window.PARTY_PROFILE.name,stillVisible:!document.querySelector('#onboarding').hidden};});assert.equal(immediateProfile.name,'Alex Updated','Writes do not wait for visual exit');assert(immediateProfile.stillVisible,'Real sheet stays visible for exit');
 await sleep(92);await phone.screenshot({path:path.join(output,'profile-closing-92.png')});captures.push('profile-closing-92.png');await sleep(220);assert(await phone.locator('#onboarding').isHidden());assert.equal(await phone.evaluate(()=>PARTY_PROFILE.name),'Alex Updated');
 await openProfile();await phone.locator('#name').fill('Do Not Save');await phone.locator('#profileCancel').click();await sleep(300);assert.equal(await phone.evaluate(()=>PARTY_PROFILE.name),'Alex Updated','Cancel preserves saved identity');
 await openProfile();await phone.locator('#name').fill('Escape Does Not Save');await phone.keyboard.press('Escape');await sleep(300);assert(await phone.locator('#onboarding').isHidden());assert.equal(await phone.evaluate(()=>PARTY_PROFILE.name),'Alex Updated');
 await openProfile();await phone.locator('#name').fill('Alex From Backdrop');await phone.evaluate(()=>document.querySelector('.profile-sheet-backdrop').click());await sleep(300);assert.equal(await phone.evaluate(()=>PARTY_PROFILE.name),'Alex From Backdrop','Existing backdrop save behavior preserved');
 await openProfile();await phone.evaluate(()=>{document.querySelector('#profileCancel').click();document.querySelector('#editFromCatalog').click();});await sleep(350);assert(await phone.locator('#onboarding').isVisible(),'Rapid reopen cancels profile exit');assert(!await phone.locator('.profile-sheet-backdrop').evaluate(n=>n.hidden));
 await phone.emulateMedia({reducedMotion:'reduce'});await phone.evaluate(()=>document.querySelector('#profileCancel').click());assert(await phone.locator('#onboarding').isHidden(),'Reduced motion closes profile synchronously');await phone.emulateMedia({reducedMotion:'no-preference'});
 // Modal -> nonmodal Host tab -> Games uses real shipped tab scripts, with a
 // native-navigation bridge fixture rather than physical native transitions.
 const tabPage=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:Number(process.env.QA_UI_DPR)||1});tabPage.on('pageerror',e=>errors.push(e.message));await tabPage.addInitScript(()=>{window.webkit={messageHandlers:{partyShell:{postMessage:()=>{}}}};});await tabPage.goto(hostOrigin+'/native-shell/index.html');await tabPage.addScriptTag({url:hostOrigin+'/native-shell/tabs.js'});await tabPage.evaluate(s=>LocalPartyHost.update(s),hostSnapshot);await tabPage.evaluate(()=>document.querySelector('#hostPanel').showModal());await sleep(300);await tabPage.evaluate(()=>LocalPartyTabs.select('host'));assert(await tabPage.locator('#hostPanel').evaluate(d=>d.open&&!d.matches(':modal')),'Pending modal exit becomes Host navigation surface');await tabPage.evaluate(()=>{LocalPartyTabs.select('games');LocalPartyTabs.select('host');LocalPartyTabs.select('games');});assert(!await tabPage.locator('#hostPanel').evaluate(d=>d.open),'Rapid tabs do not keep a closing Host overlay');
 const allGames=[];
 if(process.env.QA_ALL_WAITING==='1'){
  const catalog=(await api()).catalog;
  for(const game of catalog.filter(g=>!process.env.QA_WAITING_START||catalog.indexOf(g)>=catalog.findIndex(x=>x.id===process.env.QA_WAITING_START))){
   await api({type:'stop'});await api({type:'bots-set',count:Math.max(0,game.min-1)});await api({type:'launch',id:game.id});
   await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),game.id);
   await phone.waitForFunction(()=>!document.querySelector('#waitingRules').hidden);
   for(const width of [320,393]){
    await phone.setViewportSize({width,height:width===320?568:852});
    for(const open of [false,true]){
     await phone.locator('.waiting-details').evaluate((n,open)=>n.open=open,open);await sleep(100);
     const geometry=await phone.evaluate(()=>{const ready=document.querySelector('#readyButton').getBoundingClientRect(),footer=document.querySelector('#sessionControls').getBoundingClientRect(),details=document.querySelector('.waiting-details').getBoundingClientRect(),content=document.querySelector('#waitingContent').getBoundingClientRect();return{ready:ready.bottom,footer:footer.top,details:details.bottom,content:content.bottom,text:document.querySelector('#waitingContent').textContent,horizontal:document.documentElement.scrollWidth-innerWidth};});
     assert.equal(geometry.horizontal,0,game.id);assert(geometry.ready<=geometry.footer+1,game.id+' Ready');assert(geometry.details<=geometry.content+1,game.id+' '+width+' '+open+' rules clipped '+JSON.stringify(geometry));assert(!/[А-Яа-яЁё]/.test(geometry.text),game.id+' English rules');
     const file='all-'+game.id+'-'+width+(open?'-open':'')+'.png';await phone.screenshot({path:path.join(output,file)});captures.push(file);
    }
   }
   allGames.push(game.id);console.log('PASS waiting',game.id);
  }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({capturedAt:new Date().toISOString(),captures,allGames,checks:'TV ink overflow, rules summary center, bounded scroll, reachable final rule, Ready/footer, three rooms, explicit join, own room return, disconnected host. Room screenshots use a native bridge fixture.',errors},null,2));console.log('PASS',captures.length,'captures');
 }finally{await browser?.close();hostServer?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
