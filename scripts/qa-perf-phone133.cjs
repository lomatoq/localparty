'use strict';
// Real native Host Hub DOM + shipped persistent tabs; native transport is stubbed.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const express=require('express'),pw=require('playwright');
const root=path.resolve(__dirname,'..'),label=process.env.QA_LABEL||'after',out=path.join(root,'output/playwright/perf-phone133',label);
fs.mkdirSync(out,{recursive:true});
const tabs=fs.readFileSync(path.join(root,'public/native-shell/tabs.js'),'utf8');
const report={label,errors:[],rows:[],screens:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=express().use(express.static(path.join(root,'public'))).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 try{for(const name of (process.env.QA_BROWSERS||'chromium,webkit').split(',')){
 const browser=await pw[name].launch(name==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 try{for(const reducedMotion of ['no-preference','reduce']){
 const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,reducedMotion});
 page.on('pageerror',e=>report.errors.push(name+': '+e.message));
 if(label==='before')await page.route('**/app-ux-20261005.js',r=>r.fulfill({path:path.join(root,'output/playwright/perf-phone133/baseline/app-ux-20261005.js')}));
 await page.addInitScript(src=>{window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};window.__partyPersistentTabs=true;(0,eval)(src);},tabs);
 await page.goto(`http://127.0.0.1:${server.address().port}/native-shell/index.html`);
 await page.evaluate(catalog=>LocalPartyHost.update({catalog,players:[{id:'a',name:'Alexandra',connected:true}],leaderboard:[],votes:[],screens:1,native:{ready:true,catalogReady:true},selected:'push',tv:{mode:'none',focusNumber:1,total:catalog.length}}),require('../lib/catalog'));
 await page.evaluate(()=>document.fonts.ready);await sleep(800);
 const initialHiddenCards=await page.evaluate(()=>[...document.querySelectorAll('#catalog img')].filter(img=>img.style.opacity==='0').length);
 await page.locator('#catalog [data-game=bomb] .lp-card-open').click();await sleep(900);
 async function shot(state){const f=`${name}-${reducedMotion}-${state}.png`;await page.screenshot({path:path.join(out,f)});report.screens.push(f);}
 await shot('detail');
 const result=await page.evaluate(async()=>{
 const d=document.getElementById('gameDetail'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const send=(type,y,id)=>d.dispatchEvent(new PointerEvent(type,{pointerId:id,isPrimary:true,button:0,clientX:190,clientY:y,bubbles:true}));
 const drag=id=>{send('pointerdown',120,id);send('pointermove',135,id);send('pointermove',175,id);};
 const pose=()=>({translate:d.style.translate,dragging:d.classList.contains('ux-dragging'),open:d.open});
 drag(91);const first=pose();send('lostpointercapture',175,91);await sleep(500);const lost=pose();
 // Cancel the original gesture only to reset the old implementation for the separate close test.
 send('pointercancel',175,91);await sleep(500);
 drag(92);d.close();await sleep(300);d.showModal();await sleep(650);drag(93);const reopened=pose();send('pointercancel',175,93);send('pointercancel',175,92);await sleep(500);
 // Reverse above the pickup point: rubber-band offset must spring back too.
 drag(94);send('pointermove',115,94);const negativeBefore=pose();send('pointercancel',115,94);const negativeAnimations=d.getAnimations().filter(a=>a.playState==='running').length;await sleep(500);
 d.close();await sleep(30);d.showModal();await sleep(650);const rapid=pose();
 return {first,lost,reopened,negativeBefore,negativeAnimations,rapid,flightCount:document.querySelectorAll('.ux-flight').length,hiddenCards:[...document.querySelectorAll('#catalog img')].filter(img=>img.style.opacity==='0').length};
 });
 const row={browser:name,reducedMotion,initialHiddenCards,...result};report.rows.push(row);
 await shot('reopened');
 await page.evaluate(()=>{document.getElementById('gameDetail').close();});await sleep(350);
 await page.evaluate(()=>LocalPartyTabs.select('host',false));await sleep(700);await shot('host');
 await page.evaluate(()=>document.getElementById('hostPanelBody').scrollTop=900);await sleep(250);await shot('host-scroll');
 await page.evaluate(()=>LocalPartyTabs.select('games',false));await sleep(700);await shot('catalog-return');
 await page.close();
 }}finally{await browser.close();}
 }}finally{server.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report,null,2));
 if(label!=='before'){
 assert.deepEqual(report.errors,[]);
 for(const r of report.rows){assert(r.first.dragging,'gesture fixture must activate');assert(!r.lost.dragging&&r.lost.translate==='','lost capture clears gesture');assert(r.reopened.dragging&&r.reopened.translate!=='','close/reopen accepts new gesture');assert(r.rapid.open&&!r.rapid.dragging,'rapid reopen settles');assert.equal(r.flightCount,0);assert.equal(r.hiddenCards,r.initialHiddenCards);if(r.reducedMotion==='no-preference')assert(r.negativeAnimations>0,'negative offset springs back');}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
