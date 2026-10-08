'use strict';
// Real worker/native controller route. No render-profiler instrumentation.
const {spawn} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {chromium, webkit} = require(process.env.PARTY_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname, '../..');
const engine = process.env.QA_ENGINE || 'chromium';
const out = path.resolve(process.env.QA_OUTPUT || `output/playwright/ui244-bow-small/${engine}`);
const wait = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(out, {recursive: true});
const child = spawn(process.execPath, ['server.js'], {cwd: root, env: {...process.env,
  PARTY_EMBEDDED: '1', PARTY_EPHEMERAL: '1', PARTY_NO_BROWSER: '1',
  PARTY_ADMIN_KEY: 'bow-ui244', PARTY_PORT: '0'}});
let log = '', base, browser;
child.stdout.on('data', data => log += data);
child.stderr.on('data', data => log += data);
async function until(fn, label) {
  for (let i = 0; i < 300; i++) { if (await fn()) return; await wait(40); }
  throw Error(`${label}: ${log.slice(-1500)}`);
}
async function api(body) {
  const response = await fetch(`${base}/api/manage`, {method: body ? 'POST' : 'GET',
    headers: {Authorization: 'Bearer bow-ui244', 'Content-Type': 'application/json'},
    body: body ? JSON.stringify(body) : undefined});
  const state = await response.json();
  assert.equal(response.status, 200, JSON.stringify(state));
  return state;
}
async function setFix(frame, enabled) {
  await frame.evaluate(enabled => {
    if (!window.__bowSmallRule) {
      const sheet = [...document.styleSheets].find(s => s.href?.includes('game-ui-polish-20261004.css'));
      if (!sheet) throw Error('Actual shared game stylesheet missing');
      const rule = [...sheet.cssRules].find(r => r.media && r.cssText.includes('116px') && r.cssText.includes('bow_club'));
      if (!rule) throw Error('Expected bounded Bow media rule missing');
      window.__bowSmallRule = {rule, condition: rule.media.mediaText};
    }
    const {rule, condition} = window.__bowSmallRule;
    rule.media.mediaText = enabled ? condition : 'not all';
    // This comparison changes only a stylesheet condition, so explicitly run
    // the game's existing resize anchor (position alone does not notify RO).
    window.dispatchEvent(new Event('resize'));
  }, enabled);
  // Both layout ResizeObservers and the authored pad-to-action anchor must settle.
  await wait(100);
}
async function geometry(phone, frame) {
  const shell = await phone.evaluate(() => {
    const rect = el => {const r = el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
    const footer = document.querySelector('#sessionControls');
    const fade = getComputedStyle(footer, '::before');
    const control = id => {const el = document.querySelector(id), s = getComputedStyle(el); return {rect:rect(el), background:s.backgroundImage,borderRadius:s.borderRadius,font:s.font,padding:s.padding};};
    return {native:document.body.classList.contains('native-controller'),dock:!!document.querySelector('#partyNativeDock'),
      frame:rect(document.querySelector('#gameFrame')),footer:rect(footer),
      fadeTop:footer.getBoundingClientRect().top+parseFloat(fade.top),fade:fade.backgroundImage,
      pause:control('#pauseButton'),lobby:control('#exitVoteButton')};
  });
  const content = await frame.evaluate(() => {
    const rect = id => {const r=document.querySelector(id).getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
    return {viewport:[innerWidth,innerHeight],touch:document.body.classList.contains('touch-mode'),
      draw:rect('#draw'),pad:rect('#touchPad'),readout:rect('.bow-readout'),video:rect('#video'),
      fixMatches:matchMedia('(max-width:360px) and (max-height:400px) and (orientation:portrait)').matches,
      drawFont:getComputedStyle(document.querySelector('#draw b')).font,
      drawFill:getComputedStyle(document.querySelector('#draw')).backgroundImage};
  });
  return {...shell,...content,drawGlobalBottom:shell.frame.y+content.draw.bottom};
}
async function unchanged(phone, frame, label, capture = true) {
  await setFix(frame, false); const before=await geometry(phone,frame);
  await setFix(frame, true); const after=await geometry(phone,frame);
  for (const key of ['draw','pad','readout','video','pause','lobby']) assert.deepEqual(after[key],before[key],`${label}: ${key} stays authored`);
  if (capture) await phone.screenshot({path:path.join(out,`${label}.png`)});
  return {before,after};
}
(async () => {try {
  await until(() => /localhost:(\d+)/.test(log), 'Server starts');
  base=`http://127.0.0.1:${log.match(/localhost:(\d+)/)[1]}`;
  await api({type:'server-start'});
  browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,
    ...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
  const tv=await browser.newPage({viewport:{width:1280,height:720}});
  const phone=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const second=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  const errors=[]; for(const page of[tv,phone,second])page.on('pageerror',e=>errors.push(e.message));
  const bridge=fs.readFileSync(path.join(root,'public/native-shell/controller-bridge.js'),'utf8');
  const tabs=fs.readFileSync(path.join(root,'public/native-shell/tabs.js'),'utf8');
  for(const page of[phone,second]) await page.addInitScript({content:
    "localStorage.setItem('local-party-language','en');window.__partyPersistentTabs=true;window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};\n"+bridge+'\n'+tabs});
  await tv.goto(`${base}/tv`); await until(async()=>(await api()).screens===1,'Actual TV registers');
  for(const[i,page]of[phone,second].entries()){
    await page.goto(`${base}/play`);await page.locator('#name').fill(`UI Archer ${i}`);
    await page.locator('#joinForm button[type=submit]').click();await page.locator('#home').waitFor();
  }
  await api({type:'settings',id:'bow_club',settings:{mode:'versus',arrows:'10'}});
  const run=(await api({type:'launch',id:'bow_club'})).active;
  for(const page of[phone,second]){await page.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await page.locator('#readyButton').click();}
  await until(async()=>(await api()).active?.ui?.phase==='playing','Actual Bow match starts');
  const frame=phone.frames().find(f=>f.url().includes('/games/bow_club/'));
  assert(frame,'Actual game iframe');await frame.locator('#touch').click();await frame.locator('#draw').waitFor();
  await Promise.all([phone.evaluate(()=>document.fonts.ready),frame.evaluate(()=>document.fonts.ready)]);await wait(200);
  await setFix(frame,false);const before=await geometry(phone,frame);
  assert(before.native&&before.dock,'Native controller bridge AND tabs loaded');
  assert.deepEqual(before.viewport,[320,358],'Actual reduced native iframe is exercised');
  assert(before.drawGlobalBottom>before.fadeTop,'Baseline action intersects the approved footer fade');
  await phone.screenshot({path:path.join(out,'before-320.png')});
  await setFix(frame,true);const after=await geometry(phone,frame);
  assert(after.drawGlobalBottom<=after.fadeTop-4,'Draw stays entirely above footer fade');
  assert(after.pad.height>=88,'Aiming remains a useful touch region');
  assert.equal(after.pad.width,before.pad.width,'Mini-field retains authored width');
  assert.equal(after.pad.height,before.pad.height,'Mini-field retains authored height');
  assert(after.pad.y>=after.readout.bottom+8,'Stats and aim plane do not overlap');
  assert(after.draw.y>=after.pad.bottom+8,'Aim and Draw retain a deliberate gap');
  assert.equal(after.draw.height,before.draw.height,'Essential action retains approved height');
  assert.equal(after.drawFont,before.drawFont,'Action typography unchanged');
  assert.equal(after.drawFill,before.drawFill,'Action lime material unchanged');
  for(const key of['pause','lobby','footer','fade'])assert.deepEqual(after[key],before[key],`Approved ${key} unchanged`);
  await phone.screenshot({path:path.join(out,'after-320.png')});
  await frame.evaluate(()=>{window.__bowPointer=[];for(const type of['pointerdown','pointerup'])document.querySelector('#draw').addEventListener(type,e=>__bowPointer.push({type,pointerType:e.pointerType,trusted:e.isTrusted}));});
  const draw=frame.locator('#draw'),box=await draw.boundingBox();assert(await draw.isEnabled(),'Live worker enables Draw');
  const point={x:box.x+box.width/2,y:box.y+box.height/2};
  if(engine==='chromium'){
    const cdp=await phone.context().newCDPSession(phone);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,radiusX:4,radiusY:4,force:1}]});
    await wait(260);await phone.screenshot({path:path.join(out,'held-320.png')});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  }else{
    await phone.mouse.move(point.x,point.y);await phone.mouse.down();await wait(260);
    await phone.screenshot({path:path.join(out,'held-320.png')});await phone.mouse.up();
  }
  await until(async()=>(await frame.locator('#score strong').allTextContents())[1]==='9','Accepted hold/release consumes one arrow');
  const pointer=await frame.evaluate(()=>__bowPointer);
  assert.equal(pointer.length,2,'One complete trusted gesture');assert(pointer.every(e=>e.trusted),'Browser input, no synthetic DOM event');
  if(engine==='chromium')assert(pointer.every(e=>e.pointerType==='touch'),'Genuine browser touch input');
  await wait(120);await phone.screenshot({path:path.join(out,'shot-320.png')});
  await phone.setViewportSize({width:393,height:852});await wait(160);const normal=await unchanged(phone,frame,'after-393');
  await frame.locator('#hand').click();await wait(60);assert(await frame.locator('body').evaluate(el=>el.classList.contains('left-hand')),'Hand toggle works after resize');
  await phone.screenshot({path:path.join(out,'left-393.png')});
  await phone.setViewportSize({width:852,height:393});await wait(160);const landscape=await unchanged(phone,frame,'landscape-unchanged');
  await phone.setViewportSize({width:320,height:568});await wait(160);
  // Explicit DOM camera-stage layout fixture: no camera permission/capture claim.
  await frame.evaluate(()=>{document.body.classList.remove('touch-mode');document.querySelector('#touchPad').hidden=true;document.querySelector('#video').hidden=false;document.querySelector('#calibrate').hidden=false;});
  const cameraStage=await unchanged(phone,frame,'camera-stage-unchanged');
  await frame.evaluate(()=>{document.body.classList.add('touch-mode');document.querySelector('#touchPad').hidden=false;document.querySelector('#video').hidden=true;document.querySelector('#calibrate').hidden=true;});
  await wait(100);await api({type:'pause',paused:true});await phone.locator('#pauseOverlay').waitFor();
  await api({type:'pause',paused:false});await phone.locator('#pauseOverlay').waitFor({state:'hidden'});
  assert.equal((await api()).active.instance,run.instance,'Resize, hand and pause preserve real match');
  await tv.screenshot({path:path.join(out,'tv-unchanged.png')});assert.deepEqual(errors,[],'No runtime errors');
  const css=fs.readFileSync(path.join(root,'public/game-ui-polish-20261004.css'));
  const report={engine,capturedAt:new Date().toISOString(),method:'Real Bow worker + actual native controller bridge and tabs; only new CSS media rule toggled for the baseline comparison.',
    source:{file:'public/game-ui-polish-20261004.css',sha256:createHash('sha256').update(css).digest('hex')},
    before,after,pointer,normal,landscape,cameraStage,errors,
    limits:'Chromium uses trusted touch hold/release; WebKit uses trusted pointer hold/release. Camera-stage is explicitly a DOM layout fixture; camera, physical iPhone and AirPlay are untested by this harness.'};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({engine,pass:true,beforeBottom:before.drawGlobalBottom,afterBottom:after.drawGlobalBottom,fadeTop:after.fadeTop,pointer}));
}finally{await browser?.close();child.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
