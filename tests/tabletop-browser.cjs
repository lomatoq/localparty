'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{spawn}=require('node:child_process');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out='.localparty-build/tabletop-review';fs.mkdirSync(out,{recursive:true});let log='',browser;
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_INTERNAL_PORT:'0',PARTY_ADMIN_KEY:'tabletop-audit',PARTY_NO_BROWSER:'1'}});child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await wait(50);assert(/localhost:(\d+)/.test(log),log);const base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async data=>{const r=await fetch(base+'/api/manage',{method:data?'POST':'GET',headers:{Authorization:'Bearer tabletop-audit','Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});const result=await r.json();assert(r.ok,JSON.stringify(result));return result;};
 browser=await webkit.launch();const errors=[],phones=[];const tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>errors.push(e.message));await tv.goto(base+'/tv');
 for(let i=0;i<2;i++){const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/play');await page.locator('#name').fill('Player '+(i+1));await page.locator('#joinForm button[type=submit]').click();await page.locator('#home').waitFor();phones.push(page);}
 for(const game of ['poker','airhockey','mines']){
  await api({type:'launch',id:game});await tv.waitForFunction(()=>{const w=document.querySelector('#waiting');return w&&!w.hidden;});await wait(1300);
  const waitingStyle=await tv.locator('#waiting').evaluate(el=>{const s=getComputedStyle(el,'::before'),transition=getComputedStyle(document.querySelector('#tvSceneTransition'));return {filter:s.filter,transform:s.transform,image:s.backgroundImage,transitionFilter:transition.backdropFilter||transition.webkitBackdropFilter};});assert.equal(waitingStyle.filter,'none',game+' waiting art has no blur filter');assert.equal(waitingStyle.transform,'none',game+' waiting art has no compositing rotation');assert.equal(waitingStyle.transitionFilter,'none',game+' transition does not blur old text into the loading screen');assert.notEqual(waitingStyle.image,'none',game+' waiting art is present');await tv.screenshot({path:`${out}/${game}-waiting-tv.png`});
  for(const p of phones){await p.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),game);await p.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await p.locator('#readyButton').click();}
  for(let i=0;i<100&&(await api()).active.ui.phase!=='playing';i++)await wait(100);assert.equal((await api()).active.ui.phase,'playing',game+' starts');
  const frames=phones.map(p=>p.frames().find(f=>f.url().includes('/games/'+game+'/')));await frames[0].locator('#'+game).waitFor();
  for(const width of [320,393]){await phones[0].setViewportSize({width,height:852});await wait(150);await phones[0].screenshot({path:`${out}/${game}-${width}.png`});const overflow=await frames[0].evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,id:e.id,cls:e.className,right:e.getBoundingClientRect().right,width:innerWidth})));assert.deepEqual(overflow,[],game+' no horizontal overflow');}
  await tv.screenshot({path:`${out}/${game}-tv.png`});
  if(game==='poker'){assert.equal(await frames[0].locator('#hole .card').count(),2);await frames[0].locator('#raise').evaluate(el=>el.focus());assert((await frames[0].locator('#raise').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)))>=16);await frames[0].locator('#raise').blur();assert.equal(await phones[0].evaluate(()=>visualViewport.scale),1);}
  if(game==='mines'){assert(!await frames[0].locator('#grid').isVisible(),'mine field is TV-only');await frames[0].locator('#mineOpen').click();const screen=tv.frames().find(f=>f.url().includes('/games/mines/'));await screen.waitForFunction(()=>document.querySelectorAll('#grid button.open').length>0);}
  if(game==='poker')assert(!await frames[0].locator('.felt').isVisible(),'poker table is TV-only');
  if(game==='airhockey'){assert(!await frames[0].locator('#rink').isVisible(),'hockey field is TV-only');assert(await frames[0].locator('#hockeyJoy').isVisible(),'phone has joystick');}
  // Recreate the inner document; bridge identity and authoritative match survive.
  await frames[0].evaluate(()=>location.reload());await wait(1000);const again=phones[0].frames().find(f=>f.url().includes('/games/'+game+'/'));await again.locator('#'+game).waitFor();assert.equal(await again.locator('#players .player').count(),2);
  await api({type:'stop'});await wait(200);console.log('PASS',game,'mobile/TV layout, two players, reload/rejoin');
 }
 assert.deepEqual(errors,[]);console.log('Screenshots:',out);
}finally{await browser?.close();child.kill();}})().catch(e=>{console.error(e,log.slice(-2000));process.exitCode=1;});
