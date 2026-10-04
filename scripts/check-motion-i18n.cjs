'use strict';
const assert=require('node:assert/strict'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
(async()=>{
 const server=express().use(express.static('public')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const browser=await webkit.launch();
 try{
  for(const reducedMotion of ['no-preference','reduce'])for(const order of ['motion-first','i18n-first']){
   const page=await browser.newPage({reducedMotion});await page.goto('http://127.0.0.1:'+server.address().port+'/browser-compat.js');
   await page.setContent('<html><head><link rel="stylesheet" href="/motion.css"></head><body><p id="phase">Pause</p><strong data-motion-value>1</strong></body></html>');
   await page.addScriptTag({url:'/i18n-dictionary.js'});
   for(const script of order==='motion-first'?['motion.js','i18n.js']:['i18n.js','motion.js'])await page.addScriptTag({url:'/'+script});
   await page.evaluate(()=>{window.events=[];document.addEventListener('animationstart',e=>{if(['lp-status-swap','lp-score-pop'].includes(e.animationName)||e.target.matches('#phase,[data-motion-value]'))events.push({id:e.target.id||'score',name:e.animationName});});});
   const repeat=async(value)=>page.evaluate(async value=>{for(let i=0;i<24;i++){document.querySelector('#phase').textContent=value;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}},value);
   await repeat('Пауза');assert.equal(await page.locator('#phase').textContent(),'Pause');assert.equal(await page.evaluate(()=>events.length),0,'unchanged translated text must not animate');
   await repeat('Игра');assert.equal(await page.locator('#phase').textContent(),await page.evaluate(()=>PartyI18n.t('Игра')));
   assert.equal(await page.evaluate(()=>events.filter(e=>e.id==='phase').length),reducedMotion==='reduce'?0:1,'one visible change, one status animation');
   await page.locator('[data-motion-value]').evaluate(e=>e.textContent='2');await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>events.filter(e=>e.id==='score').length),reducedMotion==='reduce'?0:1,'one score change, one pulse');
   await page.waitForTimeout(600);assert.equal(await page.locator('#phase').evaluate(e=>e.classList.contains('lp-motion-status')),false);assert.equal(await page.locator('#phase').evaluate(e=>getComputedStyle(e).opacity),'1');
   console.log('PASS',order,reducedMotion);await page.close();
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
