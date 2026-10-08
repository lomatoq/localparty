'use strict';
// Slow-renderer readiness regression. This deliberately limits the outer TV to
// 12.5fps; it verifies the curtain gate, not physical AirPlay animation quality.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const source=fs.readFileSync('public/tv-motion-20261005.js','utf8');
(async()=>{for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,...(name==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.requestAnimationFrame=fn=>setTimeout(()=>fn(performance.now()),80);
   window.cancelAnimationFrame=clearTimeout;
   window.curtainCalls=[];
   window.webkit={messageHandlers:{partyTVCurtain:{postMessage:action=>{
    curtainCalls.push({action,time:performance.now()});return Promise.resolve();
   }}}};
  });
  await page.route('http://curtain.test/**',route=>route.fulfill({contentType:'text/html',body:route.request().url().includes('/games/')?
   '<!doctype html><body data-shader-warmup="pending">Game preparation</body>':
   '<!doctype html><body class="tv-screen"><main id="tvStage" class="tv-show-ready"><section id="lobby"></section><div id="tvStartup" hidden></div><section id="play" hidden><div id="waiting" hidden></div><iframe id="gameFrame" src="/games/test/host"></iframe></section><div id="tvSceneTransition" hidden><span>Loading</span><img id="tvTransitionLogo"><b id="tvTransitionTitle"></b></div></main></body>'}));
  await page.goto('http://curtain.test/');await page.addScriptTag({content:source});
  await page.evaluate(()=>{
   window.committedBehindClosed=false;
   HeyPalsTVMotion.gate({active:{id:'test',instance:'one'},catalog:[{id:'test',title:'Test'}]},()=>{
    committedBehindClosed=HeyPalsTVMotion.diagnostics().state==='closed';
    document.querySelector('#lobby').hidden=true;document.querySelector('#play').hidden=false;
   });
  });
  await page.waitForTimeout(1100);
  assert(await page.evaluate(()=>committedBehindClosed),`${name}: preparation committed behind closed doors`);
  assert.deepEqual(await page.evaluate(()=>curtainCalls.map(x=>x.action)),['close'],`${name}: explicit pending shader blocks reveal`);
  await page.evaluate(()=>{
   window.readyAt=performance.now();gameFrame.contentDocument.body.dataset.shaderWarmup='complete';
  });
  await page.waitForFunction(()=>curtainCalls.some(x=>x.action==='open'),{},{timeout:1700});
  const readyDelay=await page.evaluate(()=>curtainCalls.find(x=>x.action==='open').time-readyAt);
  assert(readyDelay>=100&&readyDelay<600,`${name}: already-ready 12.5fps renderer reveals promptly (${readyDelay}ms)`);
  await page.waitForFunction(()=>HeyPalsTVMotion.diagnostics().state==='idle');
  await page.evaluate(()=>HeyPalsTVMotion.gate({active:null},()=>{
   document.querySelector('#lobby').hidden=false;document.querySelector('#play').hidden=true;
  }));
  await page.waitForFunction(()=>curtainCalls.length===4&&HeyPalsTVMotion.diagnostics().state==='idle');
  assert.deepEqual(await page.evaluate(()=>curtainCalls.map(x=>x.action)),['close','open','close','open']);
  assert.equal(errors.length,0,errors.join('\n'));
  console.log(`${name} slow TV curtain PASS ready=${Math.round(readyDelay)}ms, warmup+return protected`);
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1;});
