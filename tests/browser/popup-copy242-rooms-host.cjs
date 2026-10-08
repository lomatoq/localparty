'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),express=require('express'),{chromium,webkit}=require('playwright');
const out=path.resolve('output/playwright/popups242/rooms-host');fs.mkdirSync(out,{recursive:true});
const catalog=require('../../lib/catalog'),tabs=fs.readFileSync('public/native-shell/tabs.js','utf8');
(async()=>{const server=express().use(express.static('public')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));try{
for(const [name,engine] of Object.entries({chromium,webkit})){const browser=await engine.launch(name==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});try{for(const width of [320,393]){
 const page=await browser.newPage({viewport:{width,height:852},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(tabs=>{window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};window.__partyPersistentTabs=true;(0,eval)(tabs);},tabs);
 await page.goto('http://127.0.0.1:'+server.address().port+'/native-shell/index.html');await page.evaluate(catalog=>LocalPartyHost.update({catalog,players:[],leaderboard:[],votes:[],screens:1,native:{ready:true,catalogReady:true},selected:null}),catalog);
 await page.addScriptTag({url:'http://127.0.0.1:'+server.address().port+'/native-shell/nearby-rooms.js'});
 await page.evaluate(()=>LocalPartyRooms.update([{id:'own',name:'Home party',players:1}], 'own'));
 assert(await page.locator('#nearbyToggle').isVisible(),'entry must stay visible with own room only');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(900);await page.screenshot({path:path.join(out,`${name}-${width}-shell.png`)});
 await page.locator('#nearbyToggle').click();assert.equal(await page.locator('#nearbyHint').evaluate(n=>getComputedStyle(n).color),'rgb(206, 175, 255)');await page.waitForTimeout(500);await page.screenshot({path:path.join(out,`${name}-${width}-nearby.png`)});
 await page.getByRole('tab',{name:'By code'}).click();assert.equal(await page.locator('.rooms-code-status').evaluate(n=>getComputedStyle(n).color),'rgb(206, 175, 255)');await page.waitForTimeout(400);await page.screenshot({path:path.join(out,`${name}-${width}-code.png`)});
 await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:470});visualViewport.dispatchEvent(new Event('resize'));});
 await page.waitForTimeout(250);assert(await page.locator('#nearbyDialog').evaluate(e=>e.classList.contains('rooms-keyboard')));assert(await page.locator('.rooms-own-online').isHidden());
 const keyboardBounds=await page.locator('#nearbyDialog').boundingBox();assert(keyboardBounds.y>=0&&keyboardBounds.y+keyboardBounds.height<=471,'sheet fits above keyboard: '+JSON.stringify(keyboardBounds));
 await page.screenshot({path:path.join(out,`${name}-${width}-keyboard.png`)});
 await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
 await page.evaluate(()=>LocalPartyRooms.configureOnline({create:async()=>({code:'123456'}),join:async()=>{throw Object.assign(new Error(),{code:'ROOM_NOT_FOUND'});}}));
 await page.getByRole('button',{name:'Create room',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.rooms-own-code').value==='123456');
 const digits=page.locator('[data-room-digit]');await digits.nth(0).pressSequentially('987654');assert.deepEqual(await digits.evaluateAll(ns=>ns.map(n=>n.value)),['9','8','7','6','5','4']);await page.getByRole('button',{name:'Connect',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.rooms-code-status').textContent.includes('expired'));
 await page.evaluate(()=>LocalPartyRooms.configureOnline({create:async()=>({code:'123456'}),join:async code=>{window.__joinedCode=code;}}));await page.getByRole('button',{name:'Connect',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#nearbyDialog').open);assert.equal(await page.evaluate(()=>window.__joinedCode),'987654');assert.deepEqual(errors,[]);await page.close();
}}finally{await browser.close();}}
}finally{await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});
