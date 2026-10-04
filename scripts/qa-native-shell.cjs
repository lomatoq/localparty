'use strict';
// Native host hub visual sweep with the same fixture as tests/host-panel-browser.cjs.
// Labelled fixture: WKWebView bridge is stubbed; not a physical-device capture.
const fs=require('node:fs'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');const express=require('express');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/ux-polish/native');fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=express().use(express.static(path.resolve('public'))).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const browser=await webkit.launch({headless:true});const report={fixture:'native-shell browser fixture (stubbed partyShell bridge)',errors:[],shots:[]};
 try{for(const [w,h] of [[393,852],[320,568]]){
  const page=await browser.newPage({viewport:{width:w,height:h},isMobile:true,hasTouch:true});page.on('pageerror',e=>report.errors.push(w+': '+e.message));
  await page.addInitScript(()=>{window.__commands=[];window.webkit={messageHandlers:{partyShell:{postMessage:m=>__commands.push(m)}}};});
  await page.goto(`http://127.0.0.1:${server.address().port}/native-shell/index.html`);
  const state={catalog:require('../lib/catalog'),players:[{id:'one',name:'Александра',gameReady:true,connected:true},{id:'two',name:'Taylor',gameReady:true,connected:true}],leaderboard:[],votes:[],screens:1,native:{ready:true,catalogReady:true},selected:'push',tv:{canCover:true,mode:'none',focusNumber:1,total:33}};
  await page.evaluate(s=>LocalPartyHost.update(s),state);await page.evaluate(()=>document.fonts.ready);await sleep(1800);
  const shot=async name=>{const file=`native${w}-${name}.png`;await page.screenshot({path:path.join(out,file)});report.shots.push(file);};
  await shot('hub');
  await page.evaluate(()=>scrollTo(0,700));await sleep(700);await shot('hub-scrolled');
  await page.evaluate(()=>scrollTo(0,0));await sleep(400);
  const card=page.locator('#catalog .game').first();if(await card.count()){await card.click();await sleep(700);await shot('game-detail');await page.keyboard.press('Escape');await sleep(500);}
  if(await page.locator('#openHost').count()){await page.locator('#openHost').click();await sleep(900);await shot('host-panel');}
  await page.close();
 }}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();server.close();console.log(JSON.stringify(report));}
})();
