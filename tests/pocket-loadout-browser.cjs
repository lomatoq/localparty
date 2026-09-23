'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');

(async()=>{
 const root=path.resolve(__dirname,'..');
 const child=spawn(process.execPath,['games/arcade_deluxe/server.js','pocket_siege'],{cwd:root,env:{...process.env,ARCADE_PORT:'0'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Pocket Siege server timeout: '+output)),8000);const onData=data=>{output+=data;const match=output.match(/http:\/\/localhost:(\d+)\/host/);if(match){clearTimeout(timer);resolve(`http://127.0.0.1:${match[1]}`);}};child.stdout.on('data',onData);child.stderr.on('data',onData);child.once('exit',code=>reject(Error('Pocket Siege server exited '+code+': '+output)));});
 let browser;
 try{
  browser=await webkit.launch();
  const host=await browser.newPage({viewport:{width:1280,height:720}}),a=await browser.newPage({viewport:{width:390,height:844}}),b=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  for(const page of [host,a,b])page.on('pageerror',error=>errors.push(error.message));
  await Promise.all([host.goto(base+'/host'),a.goto(base+'/'),b.goto(base+'/')]);
  await a.fill('#name','ALPHA');await a.click('#joinForm button[type=submit]');await b.fill('#name','BRAVO');await b.click('#joinForm button[type=submit]');
  await host.waitForSelector('#draftSetting');await host.check('#draftSetting');await host.click('#start');
	  await Promise.all([a.waitForSelector('#arsenal:not(.hidden)'),b.waitForSelector('#arsenal:not(.hidden)'),host.waitForSelector('#overlay:not(.hidden)')]);
	  assert.equal(await a.locator('.weapon-row').count(),321);assert.equal(await b.locator('.weapon-row').count(),321);
	  const rowPresentation=await a.locator('.weapon-row').first().evaluate(row=>{const box=row.getBoundingClientRect(),style=getComputedStyle(row),wash=getComputedStyle(row,'::before'),icon=row.querySelector('.weapon-row-icon'),iconBox=icon.getBoundingClientRect(),iconStyle=getComputedStyle(icon),meta=row.querySelector('.weapon-row-meta'),metaBox=meta.getBoundingClientRect(),metaStyle=getComputedStyle(meta),label=getComputedStyle(row.querySelector('strong'));return{backgroundImage:style.backgroundImage,weaponColor:row.style.getPropertyValue('--weapon-color'),washBackground:wash.backgroundImage,washOpacity:parseFloat(wash.opacity),overflow:style.overflow,iconWidth:iconBox.width,iconOffset:iconBox.left-box.left,iconVerticalError:Math.abs((iconBox.top+iconBox.height/2)-(box.top+box.height/2)),iconBackground:iconStyle.backgroundColor,plusRightGap:box.right-metaBox.right,plusWidth:metaBox.width,plusSize:parseFloat(metaStyle.fontSize),labelStyle:label.fontStyle,labelTransform:label.textTransform,labelWeight:parseInt(label.fontWeight,10)};});
	  await a.screenshot({path:'/private/tmp/pocket-loadout-layout-fixed.png'});
	  assert.match(rowPresentation.weaponColor,/^#[0-9a-f]{6}$/i);assert.match(rowPresentation.washBackground,/linear-gradient/);assert.ok(rowPresentation.washOpacity>=.28,'even Single Shot receives its weapon-color gradient');assert.equal(rowPresentation.overflow,'hidden');assert.ok(rowPresentation.iconWidth>=70);assert.ok(rowPresentation.iconOffset>=5,'weapon art stays inside the left card edge');assert.ok(rowPresentation.iconVerticalError<=1,'weapon art is vertically centered');assert.equal(rowPresentation.iconBackground,'rgba(0, 0, 0, 0)');assert.ok(rowPresentation.plusRightGap>=9);assert.equal(rowPresentation.plusWidth,44);assert.ok(rowPresentation.plusSize>=27);assert.equal(rowPresentation.labelStyle,'italic');assert.equal(rowPresentation.labelTransform,'uppercase');assert.ok(rowPresentation.labelWeight>=800);
	  const chrome=await a.evaluate(()=>{const search=getComputedStyle(document.querySelector('#weaponSearch')),note=getComputedStyle(document.querySelector('.arsenal-note')),dock=getComputedStyle(document.querySelector('.loadout-dock')),close=document.querySelector('#closeArsenal');return{closeText:close.textContent.trim(),closeLabel:close.getAttribute('aria-label'),searchRadius:parseFloat(search.borderRadius),noteSize:parseFloat(note.fontSize),dockBackground:dock.backgroundImage};});
	  assert.equal(chrome.closeText,'×');assert.match(chrome.closeLabel,/close/i);assert.ok(chrome.searchRadius>20);assert.equal(await a.locator('#weaponSearch').evaluate(input=>input.getBoundingClientRect().height),64);assert.ok(chrome.noteSize<=10);assert.match(chrome.dockBackground,/linear-gradient/);
  assert.equal((await host.locator('.loadout-row').count()),2);assert.match(await host.locator('#overlayTitle').innerText(),/BUILD YOUR ARSENAL/);
  await a.screenshot({path:'/private/tmp/pocket-loadout-phone.png'});await host.screenshot({path:'/private/tmp/pocket-loadout-tv.png'});
  await a.click('[data-weapon="big_shot"]');await a.click('#loadoutReady');await b.click('[data-weapon="5_shot"]');await b.click('#loadoutReady');
	  await a.waitForSelector('#arsenal',{state:'hidden'});await host.waitForSelector('#overlay',{state:'hidden'});
	  const {state,connectionId}=await a.evaluate(()=>({state:window.__arcadeState,connectionId:window.__arcadeConnection.id}));assert.equal(state.stage,'aim');assert.equal(state.players.find(player=>player.id===connectionId).loadoutReady,true);
	  const selectedIcon=await a.evaluate(async()=>{const icon=document.querySelector('#weaponIcon');window.__selectedWeaponIcon=icon;const first=icon.dataset.weaponIcon,background=getComputedStyle(icon).backgroundColor,width=icon.getBoundingClientRect().width;await new Promise(resolve=>setTimeout(resolve,180));return{same:window.__selectedWeaponIcon===document.querySelector('#weaponIcon'),first,current:icon.dataset.weaponIcon,background,width};});assert(selectedIcon.same);assert.equal(selectedIcon.first,selectedIcon.current);assert.equal(selectedIcon.background,'rgba(0, 0, 0, 0)');assert.equal(selectedIcon.width,38,'compact deck selected icon; full drawer icons remain72px');
	  await a.screenshot({path:'/private/tmp/pocket-controller-selected.png'});
  assert.deepEqual(errors,[]);console.log('PASS 321-row mobile picker, TV readiness, explicit loadouts and transition to first turn');
 }finally{await browser?.close();child.kill('SIGTERM');}
})().catch(error=>{console.error(error);process.exitCode=1;});
