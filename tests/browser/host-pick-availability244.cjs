'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),express=require('express');
const pw=require(process.env.PARTY_PLAYWRIGHT||'playwright'),catalog=require('../../lib/catalog');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/performance244/availability');fs.mkdirSync(out,{recursive:true});
const reports=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
const scripts=['visibility.js','tabs.js'].map(f=>fs.readFileSync('public/native-shell/'+f,'utf8'));
(async()=>{const server=express().use(express.static('public')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));try{
 for(const engine of ['chromium','webkit']){const browser=await pw[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});try{
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,recordVideo:{dir:path.join(out,'video'),size:{width:393,height:852}}});
  await context.addInitScript({content:'window.__messages=[];window.webkit={messageHandlers:{partyShell:{postMessage(m){__messages.push(m)}}}};'+scripts[0]+'\nwindow.__partyPersistentTabs=true;'+scripts[1]});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/native-shell/index.html`);
  await page.evaluate(c=>{window.__state={catalog:c,players:[{id:'a',name:'Taylor',connected:true}],leaderboard:[],votes:[],screens:1,selected:'push',native:{ready:true,catalogReady:true,working:true}};LocalPartyHost.update(__state)},catalog);
  await page.evaluate(()=>document.fonts.ready);await wait(600);
  const sample=()=>page.evaluate(()=>{const strip=document.querySelector('#choiceStrip'),button=document.querySelector('#choiceStart'),r=strip.getBoundingClientRect(),face=button.querySelector('.hp-pick-idle-face');return{disabled:button.disabled,w:r.width,h:r.height,buttonWidth:button.offsetWidth,buttonHeight:button.offsetHeight,transform:getComputedStyle(button).transform,face:Number(getComputedStyle(face).opacity),side:Number(getComputedStyle(strip,'::after').opacity),halo:Number(getComputedStyle(button,'::before').opacity),faces:button.querySelectorAll('.hp-pick-idle-face').length,label:button.getAttribute('aria-label'),running:button.getAnimations().map(a=>({name:a.transitionProperty||a.animationName,state:a.playState,time:a.currentTime}))}});
  const set=working=>page.evaluate(working=>{__state={...__state,native:{...__state.native,working}};LocalPartyHost.update(__state)},working);
  const disabled=await sample();assert(disabled.disabled&&disabled.face===1&&disabled.side===0&&disabled.halo===0,'quiet violet disabled face');
  await page.screenshot({path:path.join(out,engine+'-disabled.png')});
  await set(false);await wait(65);const enableMid=await sample();assert(enableMid.face>0&&enableMid.face<1&&enableMid.side>0&&enableMid.side<1,'enable crossfades both existing faces');
  await page.screenshot({path:path.join(out,engine+'-enable-mid.png')});await wait(330);const enabled=await sample();assert(!enabled.disabled&&enabled.face===0&&enabled.side===1&&enabled.halo===1,'green final face');
  await page.screenshot({path:path.join(out,engine+'-enabled.png')});
  await set(true);await wait(65);const disableMid=await sample();assert(disableMid.face>0&&disableMid.face<1&&disableMid.side>0&&disableMid.side<1,'disable also crossfades');
  await page.screenshot({path:path.join(out,engine+'-disable-mid.png')});
  await wait(330);await set(false);await wait(330);
  const reversal=await page.evaluate(async()=>{
   const face=document.querySelector('.hp-pick-idle-face'),set=working=>{__state={...__state,native:{...__state.native,working}};LocalPartyHost.update(__state)},alpha=()=>Number(getComputedStyle(face).opacity),delay=ms=>new Promise(r=>setTimeout(r,ms));
   set(true);const initial=alpha();await delay(45);
   const turn=await new Promise(resolve=>requestAnimationFrame(()=>{const timeline=document.timeline.currentTime,before=alpha(),began=performance.now();set(false);const after=alpha();resolve({before,after,updateMs:performance.now()-began,timeline,afterTimeline:document.timeline.currentTime});}));
   await delay(40);return{initial,...turn,mid:alpha()};
  });
  assert(reversal.before>0&&reversal.before<1,'interrupt before the disabled fade completes: '+JSON.stringify(reversal));
  const reverseStart=await sample();assert(Math.abs(reversal.after-reversal.before)<.03,'reverse starts from live alpha: '+JSON.stringify(reversal));
  const reverseMid=await sample();assert(reversal.mid<reversal.before,'reverse heads back to green: '+JSON.stringify(reversal));
  assert(!reverseMid.running.some(a=>a.name==='hp-cta-wake'),'no competing availability wake animation');
  await page.screenshot({path:path.join(out,engine+'-reverse-mid.png')});await wait(330);const settled=await sample();
  await page.evaluate(()=>{window.__face=document.querySelector('.hp-pick-idle-face');for(let i=0;i<100;i++)LocalPartyHost.update(__state)});
  assert(await page.evaluate(()=>__face===document.querySelector('.hp-pick-idle-face')),'unchanged state retains the painted face');
  assert.equal((await sample()).faces,1,'one retained background face');
  for(const n of [enableMid,enabled,disableMid,reverseMid,settled])assert(Math.abs(n.w-disabled.w)<.1&&Math.abs(n.h-disabled.h)<.1&&n.buttonWidth===disabled.buttonWidth&&n.buttonHeight===disabled.buttonHeight,'availability does not change layout');
  await page.emulateMedia({reducedMotion:'reduce'});await set(true);await wait(200);const reduced=await sample();assert(reduced.transform==='none','reduced motion removes bounce');
  await page.evaluate(()=>window.dispatchEvent(new Event('party-native-hide')));await set(false);await wait(30);const hidden=await page.evaluate(()=>({hidden:!!window.__partyNativeHidden,transitions:document.querySelector('#choiceStart').getAnimations().filter(a=>typeof CSSTransition!=='undefined'&&a instanceof CSSTransition&&a.playState==='running').length}));
  assert(hidden.hidden&&hidden.transitions===0,'hidden native menu does not animate availability');
  assert.deepEqual(errors,[]);reports.push({engine,disabled,enableMid,enabled,disableMid,reversal,reverseStart,reverseMid,settled,reduced,hidden,errors});await context.close();
 }finally{await browser.close()}}
}finally{await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));}console.log('PASS native Host Pick: symmetric interrupted state fade, stable layout, retained faces, reduced motion, native hide (Chrome/WebKit)');})().catch(e=>{console.error(e);process.exitCode=1});
