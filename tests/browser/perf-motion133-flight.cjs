'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),express=require('express'),pw=require('playwright');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/perf-motion133-flight');fs.mkdirSync(out,{recursive:true});
(async()=>{const server=express().use(express.static(path.resolve('public'))).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const report={rows:[],errors:[]};
try{for(const engine of (process.env.QA_ENGINES||'webkit').split(',')){
const browser=await pw[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
try{const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});page.on('pageerror',e=>report.errors.push(e.message));
await page.addInitScript(src=>{window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};window.__partyPersistentTabs=true;(0,eval)(src);},fs.readFileSync('public/native-shell/tabs.js','utf8'));
await page.goto(`http://127.0.0.1:${server.address().port}/native-shell/index.html`);
await page.evaluate(catalog=>LocalPartyHost.update({catalog,players:[],leaderboard:[],votes:[],screens:1,native:{ready:true,catalogReady:true},selected:'push',tv:{mode:'none',focusNumber:1,total:catalog.length}}),require('../../lib/catalog'));
await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(700);
const img=page.locator('#catalog [data-game=bomb] img.symbol');await img.scrollIntoViewIfNeeded();await page.waitForTimeout(200);
await page.evaluate(()=>{const card=document.querySelector('#catalog [data-game=bomb]');card.querySelector('img.symbol').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:2,isPrimary:true,button:0}));card.querySelector('.lp-card-open').click();});
await page.waitForTimeout(850);
const result=await page.evaluate(async()=>{const d=document.getElementById('gameDetail'),wait=ms=>new Promise(r=>setTimeout(r,ms));
const rect=e=>{const r=e?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null;};
d.close();await wait(55);const oldLayer=document.querySelector('.ux-flight'),before=rect(oldLayer);d.showModal();await Promise.resolve();
const layer=document.querySelector('.ux-flight'),after=rect(layer),endpoint=layer?{x:parseFloat(layer.style.left),y:parseFloat(layer.style.top),width:parseFloat(layer.style.width),height:parseFloat(layer.style.height)}:null;
const art=document.getElementById('detailArt'),r=rect(art),restTop=innerHeight-parseFloat(getComputedStyle(d).marginBottom)-d.offsetHeight,shift=d.getBoundingClientRect().top-restTop;
const target={...r,y:r.y-shift};window.__flightAnimations=[...d.getAnimations(),...document.querySelectorAll('.ux-flight')].flatMap(x=>x instanceof Element?x.getAnimations():[x]);__flightAnimations.forEach(a=>a.pause());return{before,after,endpoint,target,sameClone:layer===oldLayer,open:d.open,artHidden:d.classList.contains('ux-art-flying')};});
await page.screenshot({path:path.join(out,engine+'-reopen.png')});await page.evaluate(()=>__flightAnimations.forEach(a=>a.currentTime=90));await page.screenshot({path:path.join(out,engine+'-reopen-mid.png')});await page.evaluate(()=>__flightAnimations.forEach(a=>a.play()));await page.waitForTimeout(350);
result.final=await page.evaluate(()=>({open:gameDetail.open,flights:document.querySelectorAll('.ux-flight').length,hiddenCards:document.querySelectorAll('#catalog img.symbol[style*="opacity: 0"]').length,artHidden:gameDetail.classList.contains('ux-art-flying')}));report.rows.push({engine,...result});
if(!process.env.QA_BASELINE){assert(result.before&&result.after&&result.endpoint,'real art return flight exists');assert(result.sameClone,'reversal keeps the same painted image');assert(Math.abs(result.after.x-result.before.x)<3&&Math.abs(result.after.y-result.before.y)<3,'reversal starts at live pose');assert(Math.abs(result.endpoint.y-result.target.y)<3,'reopened flight targets sheet artwork');assert(result.final.open&&!result.final.artHidden&&result.final.flights===0&&result.final.hiddenCards===0);}
}finally{await browser.close();}}
}finally{server.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
assert.deepEqual(report.errors,[]);
})().catch(e=>{console.error(e);process.exitCode=1;});
