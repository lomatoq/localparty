'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawn}=require('child_process'),pw=require('playwright');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/popup143/settled');fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'popup137'}});let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const wait=ms=>new Promise(r=>setTimeout(r,ms));
const report={method:'Real-time video and requestAnimationFrame samples; no animation seeking. Native bridge fixture, not physical iPhone.',rows:[],errors:[]};
(async()=>{try{for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await wait(50);assert(/localhost:(\d+)/.test(log),log);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
for(const engine of ['webkit','chromium']){const browser=await pw[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});try{for(const width of (engine==='webkit'?[393,320]:[393])){
 const context=await browser.newContext({viewport:{width,height:width===320?568:852},isMobile:true,hasTouch:true,recordVideo:{dir:path.join(out,'video'),size:{width,height:width===320?568:852}}});
 await context.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fs.readFileSync('public/native-shell/controller-bridge.js','utf8')+'\nwindow.__partyPersistentTabs=true;'+fs.readFileSync('public/native-shell/tabs.js','utf8')});
 const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(origin+'/play');await p.locator('#name').fill('Motion Review');await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();await p.evaluate(()=>document.fonts.ready);await wait(600);
 // Populate standings and roster through their real application actions.
 await p.evaluate(()=>document.querySelector('#allRanks').click());await wait(500);await p.evaluate(()=>statsDialog.close());await wait(250);
 for(const [id,opener] of [['statsDialog','#showStats'],['roomDialog','#roomToggle']]){
 await p.locator(opener).click();await wait(750);
 const geometry=await p.evaluate(id=>{const d=document.getElementById(id),b=d.querySelector('.hp-popup-back'),r=b.getBoundingClientRect(),s=getComputedStyle(document.documentElement),reserve=parseFloat(getComputedStyle(document.querySelector('#partyNativeDock')).height)||56;return {id,bottom:r.bottom,view:innerHeight,reserve,sheetBottom:d.getBoundingClientRect().bottom,buttons:[...d.querySelectorAll('.hp-popup-actions>button,.room-actions>button')].filter(b=>!b.hidden).map(b=>({height:b.getBoundingClientRect().height,text:b.textContent,scroll:b.scrollHeight,client:b.clientHeight}))};},id);
 console.log(engine,width,geometry);assert(geometry.bottom<=geometry.view-geometry.reserve-8,'Back button must clear native dock');assert(geometry.sheetBottom>geometry.view,'Sheet background continues under screen');
 await p.screenshot({path:path.join(out,engine+'-'+width+'-'+id+'-settled.png')});await p.locator('#'+id+' .hp-popup-back').click();await wait(250);
 }
 await context.close();
}}finally{await browser.close();}}}finally{child.kill();}})();