'use strict';
// Actual Monster controller code with a synthetic game:state socket event.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
(async()=>{
 const server=express().get('/socket.io/socket.io.js',(q,r)=>r.type('js').send('')).use(express.static(path.resolve('games/monster/public'))).use(express.static(path.resolve('public'))).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  await page.addInitScript(()=>{localStorage.setItem('mc_playerId','queued');window.__handlers={};window.io=()=>({on:(name,callback)=>__handlers[name]=callback,emit(){}});});
  await page.goto(`http://127.0.0.1:${server.address().port}/play.html`);
  for(const file of ['i18n-dictionary.js','i18n-shell.js','i18n.js'])await page.addScriptTag({url:'/'+file});
  await page.evaluate(()=>{
   PartyI18n.protectPlayers([{name:'Бот 1'},{name:'Анна'}]);
   __handlers['game:state']({phase:'playing',activePlayerId:'bot',activePlayerName:'Бот 1',turnIndex:0,players:[{id:'bot',name:'Бот 1'},{id:'queued',name:'Анна'}]});
  });
  await page.waitForFunction(()=>document.querySelector('#waitTitle').textContent==='Drawing now: Бот 1');
  assert(await page.locator('#waitView').isVisible());
  await page.evaluate(()=>PartyI18n.setLanguage('ru'));assert.equal(await page.locator('#waitTitle').textContent(),'Сейчас рисует Бот 1');
  await page.evaluate(()=>PartyI18n.setLanguage('en'));assert.equal(await page.locator('#waitTitle').textContent(),'Drawing now: Бот 1');
  assert.match(await page.locator('#waitText').textContent(),/queued for the next part/);
  const output=path.resolve('.localparty-build/i18n-stats-fixed');fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'monster-queued-en-fixture.png')});
  console.log('PASS actual Monster queued-player branch: EN/RU/EN, bot name preserved');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
