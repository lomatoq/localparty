'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const express=require('express'),{chromium,webkit}=require('playwright');
const out=path.resolve('output/playwright/perf170');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const server=express().use(express.static(path.resolve('public'))).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const report=[];
 try{for(const [name,engine] of Object.entries({chromium,webkit})){
  const browser=await engine.launch(name==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
  try{
   const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{window.webkit={messageHandlers:{partyShell:{postMessage(){}}}}});
   await page.goto(`http://127.0.0.1:${server.address().port}/native-shell/index.html`);
   const state={catalog:require('../../lib/catalog'),players:[{id:'a',name:'Taylor',connected:true}],leaderboard:[],votes:[],screens:1,native:{ready:true,catalogReady:true},selected:'push',tv:{mode:'none',focusNumber:1,total:36}};
   await page.evaluate(s=>{window.__state=s;LocalPartyHost.update(s)},state);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1200);
   await page.evaluate(()=>{window.__startIcon=choiceStart.querySelector('svg');window.__count=choiceMeta.firstChild;window.__mutations=0;new MutationObserver(rs=>window.__mutations+=rs.length).observe(choiceStart,{childList:true,subtree:true});});
   for(let i=0;i<15;i++){await page.evaluate(()=>LocalPartyHost.update(__state));await page.waitForTimeout(25);}
   const stable=await page.evaluate(()=>({icon:!!__startIcon&&__startIcon===choiceStart.querySelector('svg'),counter:__count===choiceMeta.firstChild,mutations:__mutations}));
   assert(stable.icon&&stable.counter&&stable.mutations===0,JSON.stringify(stable));
   const energy=await page.evaluate(()=>[...document.querySelectorAll('button.hp-energy-action')].filter(b=>!b.disabled).map(b=>({id:b.id,expected:getComputedStyle(b).getPropertyValue('--hp-cta-play').trim()||'paused',actual:getComputedStyle(b,'::after').animationPlayState})));
   assert(energy.length>30);assert(energy.every(e=>e.expected===e.actual),JSON.stringify(energy));assert.equal(energy.filter(e=>e.actual==='running').length,2,'Only visible Host Pick and spotlight CTAs run');
   await page.screenshot({path:path.join(out,name+'-catalog.png')});
   await page.evaluate(()=>{LocalPartyHost.update({...__state,players:[...__state.players,{id:'b',name:'Robin',connected:true}]});});await page.waitForTimeout(120);
   assert.notEqual(await page.locator('#choiceMeta').textContent(),'1 / 2');
   await page.evaluate(()=>LocalPartyHost.update({...__state,native:{...__state.native,externalDisplays:1}}));await page.waitForTimeout(120);
   assert(await page.locator('#displayStatus').evaluate(e=>e.classList.contains('hp-menu-counter-group')));
   await page.evaluate(()=>LocalPartyHost.update(__state));await page.waitForTimeout(120);
   assert(await page.locator('#displayStatus').evaluate(e=>!e.classList.contains('hp-menu-counter-group')&&e.textContent.length>20));
   await page.locator('#openHost').click();await page.waitForTimeout(450);
   const covered=await page.evaluate(()=>[...document.querySelectorAll('button.hp-energy-action')].filter(b=>!b.closest('dialog[open]')&&!b.disabled).every(b=>getComputedStyle(b,'::after').animationPlayState==='paused'));
   assert(covered,'Background energy pauses beneath modal');await page.screenshot({path:path.join(out,name+'-host-panel.png')});
   assert.deepEqual(errors,[]);report.push({engine:name,stable,actions:energy.length,running:2,covered});
  }finally{await browser.close();}
 }}finally{server.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1});
