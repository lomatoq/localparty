'use strict';
// Real bundled host DOM; synthetic native snapshots, no device or user data.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const output=path.resolve(process.env.AUDIT_OUTPUT||'.localparty-build/i18n-native-panel');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const server=express().use(express.static(path.resolve('public'))).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const browser=await webkit.launch({headless:true}),report=[],screens=[];
 try{
  const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  await page.addInitScript(()=>{window.__commands=[];window.webkit={messageHandlers:{partyShell:{postMessage(value){window.__commands.push(value);}}}};});
  const capture=async(name,title,state)=>{const file=path.join(output,name+'.png');await page.waitForTimeout(450);await page.screenshot({path:file});screens.push({file,title,state,surface:'Host browser fixture · simulated server state',width:393,height:852});};
  await page.goto(`http://127.0.0.1:${server.address().port}/native-shell/index.html`);
  const base={catalog:require('../lib/catalog'),players:[{id:'one',name:'Audit Player',gameReady:true,connected:true}],leaderboard:[],votes:[],screens:1,native:{ready:true,catalogReady:true},selected:'push',tv:{canCover:true,mode:'none',focusNumber:1,total:33}};
  const variants=[
   ['ready',{}],['connecting',{native:{ready:false,working:true}}],
   ['lost',{native:{ready:false,connectionStatus:'Локальный сервер недоступен. Закройте LocalParty на iPhone и откройте снова.'}}],
   ['catalog-error',{native:{catalogError:'Не удалось прочитать встроенный каталог: Встроенный каталог пуст или содержит повторяющиеся игры.',catalogReady:false}}],
   ['wifi-on',{networkEnabled:true,native:{address:'https://party.invalid/',externalDisplays:1}}],
   ['bots',{botCount:3}],['tv-podium',{tv:{mode:'podium',canCover:true,board:{subtitle:'Результаты матча'}}}],
   ['background-denied',{native:{backgroundStatus:'iOS пока не разрешила фон. Сервер работает при открытом приложении.'}}],
   ['background-ended',{native:{backgroundStatus:'iOS завершила фоновую сессию. Сервер работает при открытом приложении. Новый запрос фона — только по кнопке ниже.'}}]
  ];
  await page.evaluate(s=>LocalPartyHost.update(s),base);await page.locator('#openHost').click();
  await page.evaluate(()=>{document.querySelector('#airplayInstructions').hidden=false;document.querySelectorAll('#hostPanel details').forEach(d=>d.open=true);});
  for(const [name,patch]of variants){
   const snapshot={...base,...patch,native:{...base.native,...patch.native}};
   await page.evaluate(s=>LocalPartyHost.update(s),snapshot);await page.waitForTimeout(50);
   const residual=await page.locator('#hostPanel').evaluate(root=>{const out=[],walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.closest('script,style')&&/[А-Яа-яЁё]/.test(n.nodeValue))out.push(n.nodeValue.trim());}return out;});
   report.push({name,residual});assert.deepEqual(residual,[],name+' must be fully English, including hidden controls');
   if(['lost','catalog-error'].includes(name)){
    await page.locator('[data-close=hostPanel]').click();await page.waitForTimeout(350);await page.locator('#message').scrollIntoViewIfNeeded();
   }else{
    if(!await page.locator('#hostPanel').isVisible())await page.locator('#openHost').click();
    const target={ready:'#hostTitle',connecting:'#networkHint','wifi-on':'#inviteBox',bots:'.native-bots','tv-podium':'#tvControlHint','background-denied':'#backgroundStatus','background-ended':'#backgroundStatus'}[name];
    await page.locator(target).scrollIntoViewIfNeeded();
   }
   await capture('state-'+name,'Host · '+name,name);
   if(!await page.locator('#hostPanel').isVisible())await page.locator('#openHost').click();
  }
  await page.evaluate(s=>LocalPartyHost.update(s),base);await page.waitForTimeout(500);
  for(const [name,fraction]of [['top',0],['middle',.5],['bottom',1]]){
   await page.locator('#hostPanel').evaluate((el,f)=>el.scrollTop=(el.scrollHeight-el.clientHeight)*f,fraction);await capture('host-panel-'+name,'Host panel · '+name,'expanded help');
  }
  for(const [name,selector]of [['force-language','#forceRoomLanguage'],['reset-statistics','#resetStats'],['remove-player','#roster button']]){
   const before=await page.evaluate(()=>__commands.filter(c=>c.type==='manage').length);await page.locator(selector).click();await page.locator('#confirmDialog').waitFor();
   await capture('confirm-'+name,'Confirmation · '+name,'opened then cancelled; no submission');
   await page.locator('#confirmCancel').click();await page.waitForTimeout(350);assert(!await page.locator('#confirmDialog').isVisible());
   assert.equal(await page.evaluate(()=>__commands.filter(c=>c.type==='manage').length),before,'Opening/cancelling confirmation must not submit a management action');
  }
  await page.evaluate(()=>PartyI18n.setLanguage('ru'));assert.equal(await page.locator('#hostLanguageSettings option[value=ru]').textContent(),'Русский');
  await page.evaluate(()=>PartyI18n.setLanguage('en'));assert.equal(await page.locator('#hostLanguageSettings option[value=ru]').textContent(),'Russian');
  console.log('PASS native host English: '+variants.length+' snapshots, all expanded help and locale round-trip');
 }finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(output,'extra.json'),JSON.stringify(screens,null,2));await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
