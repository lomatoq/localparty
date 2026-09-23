const assert=require('node:assert/strict'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
(async()=>{const server=express().use(express.static('public')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));let browser;try{
 browser=await webkit.launch();const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});await page.goto(`http://127.0.0.1:${server.address().port}/browser-compat.js`);
 await page.setContent('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><button><span id="hit">PUNCH</span></button><input id="name"><textarea></textarea><div style="height:4000px"></div></body></html>');await page.addScriptTag({path:'public/browser-compat.js'});
 const r=await page.evaluate(()=>{const hit=document.getElementById('hit'),input=document.getElementById('name');return {touch:getComputedStyle(document.documentElement).touchAction,selection:getComputedStyle(hit).webkitUserSelect,blocked:!hit.dispatchEvent(new Event('selectstart',{bubbles:true,cancelable:true})),menu:!hit.dispatchEvent(new Event('contextmenu',{bubbles:true,cancelable:true})),editable:input.dispatchEvent(new Event('selectstart',{bubbles:true,cancelable:true}))};});
 assert.equal(r.selection,'none');assert(r.blocked&&r.menu&&r.editable);assert(!r.touch.includes('pinch'));
 await page.evaluate(()=>{const input=document.getElementById('name');input.style.fontSize='11px';const dynamic=document.createElement('textarea');dynamic.id='dynamic';dynamic.style.fontSize='12px';document.body.prepend(dynamic);const large=document.createElement('input');large.id='large';large.style.fontSize='24px';document.body.prepend(large);});
 await page.waitForFunction(()=>getComputedStyle(document.getElementById('dynamic')).fontSize==='16px');
 assert.equal(await page.locator('#name').evaluate(el=>getComputedStyle(el).fontSize),'16px');
 assert.equal(await page.locator('#large').evaluate(el=>getComputedStyle(el).fontSize),'24px');
 await page.locator('#name').fill('Player');await page.locator('#name').blur();
 assert.equal(await page.evaluate(()=>visualViewport.scale),1);
 await page.evaluate(()=>scrollTo(0,500));assert.equal(await page.evaluate(()=>scrollY),500);console.log('PASS selection guards; dynamic text controls >=16px; larger fonts preserved; focus/blur scale and scrolling retained');
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
