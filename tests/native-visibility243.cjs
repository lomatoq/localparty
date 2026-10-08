'use strict';
// Integration contract for the document-start native WK visibility hook.
// Desktop engines validate scheduler/phase semantics, not physical cast FPS.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const source=fs.readFileSync('public/native-shell/visibility.js','utf8');
(async()=>{for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,...(name==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript({content:source});
  await page.route('http://visibility.test/**',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><style>
  @keyframes pulse{from{opacity:.25}to{opacity:1}}
  #demo#demo#demo{animation:pulse 3s linear infinite;animation-play-state:running!important}
  #quiet{animation:pulse 3s linear infinite;animation-play-state:paused!important}
  </style><div id="demo">Visible</div><div id="quiet">Quiet</div><script>
  window.framesDrawn=0;window.ticks=0;window.once=0;
  requestAnimationFrame(function draw(){framesDrawn++;requestAnimationFrame(draw)});
  setInterval(()=>ticks++,20);
  window.art=document.getElementById('demo').animate([{translate:'0px'},{translate:'10px'}],{duration:3000,iterations:Infinity});
  </script>`}));
  await page.goto('http://visibility.test/');await page.waitForTimeout(140);
  const before=await page.evaluate(()=>({frames:framesDrawn,ticks,css:document.getAnimations().find(a=>a instanceof CSSAnimation&&a.animationName==='pulse'&&a.effect.target.id==='demo').currentTime,art:art.currentTime}));
  await page.evaluate(()=>dispatchEvent(new Event('party-native-hide')));await page.waitForTimeout(80);
  const parked=await page.evaluate(()=>({frames:framesDrawn,ticks,css:document.getAnimations().find(a=>a instanceof CSSAnimation&&a.effect.target.id==='demo').currentTime,art:art.currentTime}));
  await page.evaluate(()=>{
   const canceled=requestAnimationFrame(()=>once+=100);cancelAnimationFrame(canceled);
   requestAnimationFrame(()=>once++);
   window.newArt=document.getElementById('quiet').animate([{opacity:.2},{opacity:.8}],{duration:2000});
  });await page.waitForTimeout(160);
  const held=await page.evaluate(()=>({frames:framesDrawn,ticks,once,css:document.getAnimations().find(a=>a instanceof CSSAnimation&&a.animationName==='pulse'&&a.effect.target.id==='demo').currentTime,art:art.currentTime,newState:newArt.playState,cssPlay:getComputedStyle(demo).animationPlayState}));
  assert.equal(held.frames,parked.frames,`${name}: hidden visual rAF parked`);
  assert(held.ticks>parked.ticks,`${name}: state/network-style timers remain live`);
  assert.equal(held.once,0);assert.equal(held.newState,'paused');assert.equal(held.cssPlay,'paused');
  assert(Math.abs(held.css-parked.css)<2,`${name}: CSS phase held`);assert(Math.abs(held.art-parked.art)<2,`${name}: WAAPI phase held`);
  await page.evaluate(()=>dispatchEvent(new Event('party-native-resume')));await page.waitForTimeout(160);
  const resumed=await page.evaluate(()=>({frames:framesDrawn,once,quiet:getComputedStyle(quiet).animationPlayState,css:getComputedStyle(demo).animationPlayState,art:art.playState,newArt:newArt.playState}));
  assert(resumed.frames>held.frames);assert.equal(resumed.once,1,`${name}: pending callback resumes once, cancellation retained`);
  assert.equal(resumed.quiet,'paused');assert.equal(resumed.css,'running');assert.equal(resumed.art,'running');assert.equal(resumed.newArt,'running');
  assert.equal(errors.length,0,errors.join('\n'));console.log(name+' native visibility PASS '+JSON.stringify({before,parked,held,resumed}));
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
