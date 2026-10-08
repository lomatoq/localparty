'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawn}=require('child_process'),express=require('express'),{chromium,webkit}=require('playwright');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/spotlight172');fs.mkdirSync(out,{recursive:true});
const catalog=require('../../lib/catalog'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const staticServer=express().use(express.static('public')).listen(0,'127.0.0.1');await new Promise(r=>staticServer.once('listening',r));const report=[];
try{for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await sleep(30);assert(/localhost:(\d+)/.test(log),log);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
for(const [engineName,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch(engineName==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try{for(const width of [320,393]){
  const context=await browser.newContext({viewport:{width,height:852},isMobile:true,hasTouch:true,recordVideo:{dir:out}});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__partyStartupCovered=true;window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};Math.random=()=>.25;});await page.goto('http://127.0.0.1:'+staticServer.address().port+'/native-shell/index.html');
  await page.evaluate(catalog=>{window.sample={catalog,players:[{id:'a',name:'A'},{id:'b',name:'B'}],leaderboard:[],votes:[],screens:1,native:{ready:true,catalogReady:true},selected:'push'};LocalPartyHost.update(sample)},catalog);
  await page.locator('.spotlight-logo').waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>LocalPartyHost.startupReady()),true);
  const coveredBox=await page.locator('#choiceStrip').boundingBox();assert.equal(await page.locator('#choiceStrip').evaluate(e=>getComputedStyle(e).opacity),'0');
  await page.evaluate(()=>dispatchEvent(new Event('party-startup-reveal')));await page.waitForTimeout(80);
  const opening=await page.locator('#choiceStrip').evaluate(e=>({height:e.getBoundingClientRect().height,frames:e.getAnimations().flatMap(a=>a.effect.getKeyframes())}));
  assert(Math.abs(opening.height-coveredBox.height)<1,'entrance must preserve layout height');assert(opening.frames.some(f=>String(f.translate).includes('-100%')),'entrance comes from left');
  await page.screenshot({path:path.join(out,`${engineName}-${width}-pick-entrance.png`)});await page.waitForTimeout(750);
  if(process.env.QA_LAYOUT)console.log(await page.evaluate(()=>Object.fromEntries(['.spotlight-actions','.spotlight-indicators','.hero-pills','.intro','.native-catalog-tools'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),c=getComputedStyle(e);return[s,{y:r.y,h:r.height,margin:c.margin,padding:c.padding,gap:c.gap}]}))));
  const spread=await page.locator('.spotlight-wave').first().evaluate(e=>{const c=getComputedStyle(e);return{x:(+c.getPropertyValue('--wave-x')-1)*e.offsetWidth/2,y:(+c.getPropertyValue('--wave-y')-1)*e.offsetHeight/2}});assert(Math.abs(spread.x-12)<.05&&Math.abs(spread.y-12)<.05,JSON.stringify(spread));
  const pauseControl=page.locator('.spotlight-pause');await pauseControl.dispatchEvent('pointerdown',{pointerId:91,pointerType:'mouse',button:0,isPrimary:true});await page.waitForTimeout(100);
  assert.equal(await pauseControl.evaluate(e=>getComputedStyle(e).borderRadius),'50%');assert.equal(await pauseControl.evaluate(e=>getComputedStyle(e).boxShadow),'none');assert.equal(await pauseControl.evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
  await page.screenshot({path:path.join(out,`${engineName}-${width}-pause-held.png`)});await pauseControl.dispatchEvent('pointerup',{pointerId:91,pointerType:'mouse',button:0,isPrimary:true});
  const id=await page.locator('.game-spotlight').getAttribute('data-game');assert(id);await page.screenshot({path:path.join(out,`${engineName}-${width}-host.png`)});
  assert(await page.locator('.spotlight-logo').evaluate(n=>n.naturalWidth>0));
  for(const y of [80,160,240]){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(100);await page.screenshot({path:path.join(out,`${engineName}-${width}-scroll-${y}.png`)});}await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(100);
  await page.locator('.hp-pick-glare>i').evaluate(e=>{for(const a of e.getAnimations()){a.pause();a.currentTime=2100;}});await page.screenshot({path:path.join(out,`${engineName}-${width}-pick-glare.png`)});await page.locator('.hp-pick-glare>i').evaluate(e=>e.getAnimations().forEach(a=>a.play()));
  const bounds=await page.locator('.game-spotlight').boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width+1,JSON.stringify(bounds));
  await page.evaluate(()=>{sample.selected='curling';LocalPartyHost.update(sample);window.scrollTo(0,420)});await page.waitForTimeout(350);
  assert.equal(await page.locator('.game.is-host-pick').count(),1);
  assert.equal(await page.locator('.game.is-host-pick .lp-running-rim').evaluate(e=>getComputedStyle(e).display),'block');
  await page.screenshot({path:path.join(out,`${engineName}-${width}-fresh-selected.png`)});
  await page.evaluate(()=>{sample.selected='push';LocalPartyHost.update(sample);window.scrollTo(0,0)});await page.waitForTimeout(250);
  await page.locator('.spotlight-step').nth(1).click();await page.waitForTimeout(100);await page.screenshot({path:path.join(out,`${engineName}-${width}-light-transition.png`)});await page.waitForTimeout(750);assert.equal(await page.locator('.spotlight-edge-light').count(),1,'finished light layers are released');assert.notEqual(await page.locator('.game-spotlight').getAttribute('data-game'),id);
  await page.screenshot({path:path.join(out,`${engineName}-${width}-next.png`)});
  await page.locator('.spotlight-step').nth(0).click();await page.waitForTimeout(750);assert.equal(await page.locator('.game-spotlight').getAttribute('data-game'),id);
  await page.waitForFunction(()=>!document.querySelector('.spotlight-play').disabled);await page.evaluate(()=>{document.querySelector('.spotlight-slide').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,pointerId:7,clientX:260,clientY:320}));document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,isPrimary:true,pointerId:7,clientX:120,clientY:321}));});await page.waitForFunction(id=>document.querySelector('.game-spotlight').dataset.game!==id,id);assert.notEqual(await page.locator('.game-spotlight').getAttribute('data-game'),id,'swipe advances');
  await page.waitForTimeout(550);
  const dragStart=await page.locator('.spotlight-step[aria-current=true]').evaluate(e=>Array.from(e.parentNode.children).indexOf(e));
  const playBefore=await page.locator('.spotlight-play').boundingBox();
  await page.evaluate(()=>{const s=document.querySelector('.spotlight-slide'),w=Math.max(120,s.clientWidth*.48);window.__dragWidth=w;s.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,pointerId:19,clientX:270,clientY:300}));document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,isPrimary:true,pointerId:19,clientX:270-w*.3,clientY:300}));});
  assert(await page.locator('.spotlight-drag-slide').count()>1,'neighbouring slides visible during hold');
  await page.screenshot({path:path.join(out,`${engineName}-${width}-drag-held.png`)});
  await page.evaluate(()=>{document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,isPrimary:true,pointerId:19,clientX:270-window.__dragWidth*2,clientY:300}));});
  await page.waitForTimeout(150);
  await page.evaluate(()=>document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,isPrimary:true,pointerId:19,clientX:270-window.__dragWidth*2,clientY:300})));
  await page.waitForTimeout(550);
  const dragEnd=await page.locator('.spotlight-step[aria-current=true]').evaluate(e=>Array.from(e.parentNode.children).indexOf(e));assert.equal(dragEnd,(dragStart+2)%6,'one held gesture can cross two games');assert.equal(await page.locator('.spotlight-drag-slide').count(),0,'drag previews released');
  // A second gesture must interrupt the settling animation instead of being dropped.
  const beforeRapid=await page.locator('.game-spotlight').getAttribute('data-game');
  await page.evaluate(()=>{const s=document.querySelector('.spotlight-slide');for(const id of [31,32]){s.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,pointerId:id,clientX:260,clientY:300}));document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,isPrimary:true,pointerId:id,clientX:100,clientY:300}));document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,isPrimary:true,pointerId:id,clientX:100,clientY:300}));}});
  await page.waitForTimeout(550);assert.equal(await page.locator('.spotlight-drag-slide').count(),0,'interrupted gestures release previews');
  const rapidEnd=await page.locator('.spotlight-step[aria-current=true]').evaluate(e=>Array.from(e.parentNode.children).indexOf(e));const rapidWidth=await page.locator('.spotlight-slide').evaluate(s=>Math.max(120,s.clientWidth*.48));assert.equal(rapidEnd,Math.round(dragEnd+320/rapidWidth+5)%6,'second flick picks up the current position and adds velocity');
  const playAfter=await page.locator('.spotlight-play').boundingBox();assert(Math.abs(playAfter.y-playBefore.y)<1,'metadata cannot move PLAY vertically');
  await page.locator('#openHost').evaluate(e=>e.click());await page.waitForTimeout(250);assert.equal(await page.locator('.game-spotlight').evaluate(n=>n.classList.contains('spotlight-awake')),false,'modal pauses carousel effects');await page.evaluate(()=>document.querySelector('dialog[open]').close());await page.waitForTimeout(400);

  // Snapshot updates cannot restart the carousel interval. No focus/pointer interaction during this portion.
  await page.evaluate(()=>{document.activeElement.blur();});await page.waitForTimeout(process.env.QA_FAST?100:10300);const rotated=await page.locator('.game-spotlight').getAttribute('data-game');
  for(let i=0;i<(process.env.QA_FAST?0:11);i++){await page.evaluate(()=>LocalPartyHost.update(sample));await page.waitForTimeout(1000);}
  if(!process.env.QA_FAST)assert.notEqual(await page.locator('.game-spotlight').getAttribute('data-game'),rotated,'periodic room updates must not postpone rotation');
  await page.emulateMedia({reducedMotion:'reduce'});const held=await page.locator('.game-spotlight').getAttribute('data-game');await page.waitForTimeout(750);assert.equal(await page.locator('.game-spotlight').getAttribute('data-game'),held);
  await page.evaluate(()=>LocalPartyHost.update({...sample,active:{id:'push',instance:'sample',roster:[],participants:[],ui:{phase:'playing'}},busy:false}));assert(await page.locator('.game-spotlight').isHidden());
  assert.deepEqual(errors,[]);report.push({engineName,width,errors,rotation:!process.env.QA_FAST});await context.close();
 }
 const web=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});await web.goto(origin+'/play');await web.locator('#name').fill('Discovery');await web.locator('#joinForm button[type=submit]').click();await web.locator('#home').waitFor();await web.locator('.spotlight-logo').waitFor();await web.waitForTimeout(600);assert.equal(await web.evaluate(()=>scrollY),0,'first join reveals top of discovery');await web.screenshot({path:path.join(out,`${engineName}-393-controller.png`)});const qr=web.locator('.return-entry-help>summary');await qr.scrollIntoViewIfNeeded();const qrBox=await qr.boundingBox();await web.mouse.move(qrBox.x+qrBox.width/2,qrBox.y+qrBox.height/2);await web.mouse.down();await web.waitForTimeout(350);await web.screenshot({path:path.join(out,`${engineName}-393-qr-held.png`)});await web.mouse.up();await web.waitForTimeout(350);await web.screenshot({path:path.join(out,`${engineName}-393-qr-open.png`)});await web.close();
 }finally{await browser.close();}
}
}finally{child.kill();staticServer.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}console.log(report);})().catch(e=>{console.error(e);process.exitCode=1;});
