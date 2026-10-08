'use strict';
// App UX 2026-10-05 capture harness (Claude "app" lane). WebKit only.
// Native hub = browser fixture of partyapp native-shell with the real tabs.js user
// script (persistent-tabs mode) and a stubbed partyShell bridge. Guest = real server
// /play route, plus the native-controller route with controller-bridge.js + tabs.js.
// Usage: QA_LABEL=before|after node scripts/capture-app-ux-20261005.cjs
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');const express=require('express');
const root=path.join(__dirname,'..'),label=process.env.QA_LABEL||'after';
const out=path.join(root,'.localparty-build','app-ux-2026-10-05',label);fs.mkdirSync(out,{recursive:true});
const only=(process.env.QA_ONLY||'native,guest,controller').split(',');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const report={label,startedAt:new Date().toISOString(),errors:[],shots:[],metrics:{}};
const tabs=fs.readFileSync(path.join(root,'public/native-shell/tabs.js'),'utf8'),bridge=fs.readFileSync(path.join(root,'public/native-shell/controller-bridge.js'),'utf8');
const sizes=(process.env.QA_SIZES||'393x852,320x568').split(',').map(s=>s.split('x').map(Number));
async function step(name,fn){try{await fn();}catch(e){report.errors.push(name+': '+(e.message||e).split('\n')[0]);}}
async function shot(page,name){const file=name+'.png';await page.screenshot({path:path.join(out,file)});report.shots.push(file);}
async function nativeHub(browser){
 const server=express().use(express.static(path.join(root,'public'))).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const catalog=require('../lib/catalog');
 try{for(const [w,h] of sizes){
  const page=await browser.newPage({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});page.on('pageerror',e=>report.errors.push(`native${w}: ${e.message}`));
  await page.addInitScript(src=>{window.__commands=[];window.webkit={messageHandlers:{partyShell:{postMessage:m=>__commands.push(m)}}};window.__partyPersistentTabs=true;document.addEventListener('DOMContentLoaded',()=>{},{once:true});(0,eval)(src);},tabs);
  await page.goto(`http://127.0.0.1:${server.address().port}/native-shell/index.html`);
  const p=`native${w}-`;
  await step(p+'loading',async()=>{await sleep(500);await shot(page,p+'00-catalog-loading');});
  const state={catalog,players:[{id:'one',name:'Alexandra',gameReady:true,connected:true},{id:'two',name:'Taylor',gameReady:true,connected:true},{id:'three',name:'Sam',gameReady:false,connected:true}],leaderboard:[],votes:[{gameId:'bomb',playerId:'two'},{gameId:'bomb',playerId:'three'}],screens:1,native:{ready:true,catalogReady:true},selected:'push',tv:{canCover:true,mode:'none',focusNumber:1,total:catalog.length}};
  await page.evaluate(s=>{window.__snapshot=s;LocalPartyHost.update(s);},state);await page.evaluate(()=>document.fonts.ready);await sleep(1600);
  await step(p+'hub',()=>shot(page,p+'01-hub'));
  await step(p+'scroll',async()=>{await page.evaluate(()=>scrollTo(0,420));await sleep(500);await shot(page,p+'02-hub-scrolled-420');await page.evaluate(()=>scrollTo(0,1400));await sleep(500);await shot(page,p+'03-hub-scrolled-1400');await page.evaluate(()=>scrollTo(0,0));await sleep(400);});
  await step(p+'search',async()=>{await page.locator('#search').fill('bo');await sleep(500);await shot(page,p+'04-search-bo');await page.locator('#search').fill('zzzz');await sleep(400);await shot(page,p+'05-search-empty');await page.locator('#search').fill('');await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});await sleep(300);});
  await step(p+'fresh',async()=>{await page.locator('#nativeCategories [data-section=fresh]').click();await sleep(600);await shot(page,p+'06-filter-fresh');await page.locator('#nativeCategories [data-section=all]').click();await sleep(400);await page.evaluate(()=>scrollTo(0,0));});
  await step(p+'detail',async()=>{
   const btn=page.locator('#catalog [data-game=bomb] .lp-card-open');await btn.scrollIntoViewIfNeeded();await sleep(200);
   await page.evaluate(()=>{window.__frames=[];const t0=performance.now();requestAnimationFrame(function f(t){const d=document.getElementById('gameDetail');if(d.open){const r=d.getBoundingClientRect(),s=getComputedStyle(d);__frames.push({t:Math.round(t-t0),y:Math.round(r.y),o:+(+s.opacity).toFixed(2)});}if(t-t0<900)requestAnimationFrame(f);});});
   await btn.click();await sleep(120);await shot(page,p+'07a-detail-opening');await page.waitForFunction(()=>document.getElementById('gameDetail').getAnimations().some(a=>a.playState==='running')||!document.getElementById('gameDetail').getAnimations().length,null,{timeout:3000}).catch(()=>{});await sleep(70);await shot(page,p+'07b-detail-midflight');await sleep(900);await shot(page,p+'07-detail');
   report.metrics[p+'detailOpenFrames']=await page.evaluate(()=>__frames);
   await page.locator('#gameDetail').evaluate(d=>d.querySelector('#gameDetailBody')?.scrollTo(0,600));await sleep(300);await shot(page,p+'08-detail-scrolled');
   await page.keyboard.press('Escape');await sleep(700);});
  await step(p+'choiceStart-bots',async()=>{await page.evaluate(()=>scrollTo(0,0));await sleep(200);await page.locator('#choiceStart').click();await sleep(700);await shot(page,p+'09-start-bots');await page.locator('#startBotsClose').click().catch(()=>{});await sleep(500);});
  await step(p+'host',async()=>{await page.evaluate(()=>LocalPartyTabs.select('host',false));await sleep(1100);await shot(page,p+'10-host');await page.evaluate(()=>{document.getElementById('hostPanelBody').scrollTop=900;});await sleep(500);await shot(page,p+'11-host-scrolled');await page.evaluate(()=>LocalPartyTabs.select('games',false));await sleep(900);});
  await step(p+'active',async()=>{await page.evaluate(()=>{__snapshot.active={id:'bomb',instance:'qa',ui:{phase:'playing'},session:{paused:false,readyIds:[]},roster:__snapshot.players,ready:['one','two']};LocalPartyHost.update(__snapshot);scrollTo(0,0);});await sleep(1200);await shot(page,p+'12-active');await page.evaluate(()=>scrollTo(0,600));await sleep(700);await shot(page,p+'13-active-scrolled');});
  await step(p+'confirm',async()=>{await page.evaluate(()=>scrollTo(0,0));await sleep(500);const more=page.locator('#activeMore');if(await more.isVisible())await more.click();await sleep(400);await shot(page,p+'14-active-more');const stop=page.locator('#activeActions button').filter({hasText:/Stop|Стоп|Заверш|End/i}).first();if(await stop.count()){await stop.click();await sleep(700);await shot(page,p+'15-confirm');await page.locator('#confirmCancel').click();await sleep(500);}});
  await page.close();
 }}finally{server.close();}
}
async function guest(browser,nativeController){
 const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'app-ux',TEST_FAST:'1'}});
 let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
 try{
  for(let i=0;i<400&&!/localhost:(\d+)/.test(log);i++)await sleep(50);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
  const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer app-ux','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return r.json();};
  const pages=[];const tag=nativeController?'ctrl':'guest';
  const tv=await browser.newPage({viewport:{width:1280,height:720}});await tv.goto(origin+'/tv');
  for(const [w,h] of sizes){
   const page=await browser.newPage({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});page.on('pageerror',e=>report.errors.push(`${tag}${w}: ${e.message}`));
   if(nativeController)await page.addInitScript(({bridge,tabs})=>{window.__commands=[];window.webkit={messageHandlers:{partyShell:{postMessage:m=>__commands.push(m)}}};(0,eval)(bridge);window.__partyPersistentTabs=true;(0,eval)(tabs);},{bridge,tabs});
   await page.goto(origin+'/play');await page.locator('#name').waitFor();await page.evaluate(()=>document.fonts.ready);await sleep(900);
   const p=`${tag}${w}-`;pages.push([page,p]);
   await step(p+'join',async()=>{await shot(page,p+'01-join');await page.locator('#name').fill(w===393?'Alexandria':'Taylor');await sleep(200);await shot(page,p+'02-join-filled');await page.locator('#joinForm button[type=submit]').click();await sleep(260);await shot(page,p+'02b-join-confetti');await page.locator('#home').waitFor();await sleep(1200);await shot(page,p+'03-home');});
   await step(p+'scroll',async()=>{await page.evaluate(()=>scrollTo(0,500));await sleep(500);await shot(page,p+'04-home-scrolled-500');await page.evaluate(()=>scrollTo(0,1600));await sleep(500);await shot(page,p+'05-home-scrolled-1600');await page.evaluate(()=>scrollTo(0,0));await sleep(400);});
   await step(p+'search',async()=>{const s=page.locator('.guest-catalog-tools input[type=search]');if(await s.count()){await s.scrollIntoViewIfNeeded();await s.fill('zzzz');await sleep(400);await shot(page,p+'06-search-empty');await s.fill('');await page.evaluate(()=>document.activeElement?.blur());}await page.evaluate(()=>scrollTo(0,0));});
   await step(p+'rules',async()=>{const info=page.locator('.guest-game[data-id=shrink] .guest-info');await info.scrollIntoViewIfNeeded();await info.click();await sleep(110);await shot(page,p+'07a-rules-opening');await sleep(800);await shot(page,p+'07-rules');await page.locator('#closeRules').click();await sleep(600);await page.evaluate(()=>scrollTo(0,0));});
   await step(p+'top',async()=>{await page.locator('#showStats').click();await sleep(800);await shot(page,p+'08-top');await page.locator('#closeStats').click();await sleep(600);});
   await step(p+'profile',async()=>{const e=page.locator('#editFromCatalog');if(await e.count()&&await e.isVisible()){await e.click();await sleep(800);await shot(page,p+'09-profile');await page.locator('#profileCancel').click().catch(()=>{});await sleep(600);}});
  }
  await step(tag+'-waiting',async()=>{report.metrics[tag+'-launch']=await api({type:'launch',id:'bomb'});for(const [page] of pages)await page.waitForFunction(()=>{const w=document.getElementById('waitingRules');return w&&!w.hidden&&w.getClientRects().length>0;},null,{timeout:20000});await sleep(1400);for(const [page,p] of pages){await shot(page,p+'10-waiting');}
   for(const [page,p] of pages){const r=page.locator('#waitingRules details summary').first();if(await r.count()){await r.click();await sleep(600);await shot(page,p+'11-waiting-rules-open');await r.click();await sleep(500);}}});
  await step(tag+'-room',async()=>{const [page,p]=pages[0];if(await page.locator('#roomToggle').isVisible()){await page.locator('#roomToggle').click();await sleep(800);await shot(page,p+'12-room');await page.locator('#closeRoom').click();await sleep(500);}});
  await step(tag+'-play',async()=>{for(const [page] of pages){await page.waitForFunction(()=>!document.getElementById('readyButton').disabled,null,{timeout:15000});await page.locator('#readyButton').click();}
   const s=await api();if(s.active?.ui?.phase==='waiting')await api({type:'force-start',instance:s.active.instance}).catch(()=>{});await sleep(2500);for(const [page,p] of pages)await shot(page,p+'13-playing');
   for(const [page,p] of pages){await page.locator('#pauseButton').click();await sleep(900);await shot(page,p+'14-paused');await page.locator('#resumeButton').click().catch(()=>{});await sleep(500);}});
  await step(tag+'-results',async()=>{await api({type:'stop'});await sleep(1500);await api({type:'launch',id:'taprace'});await sleep(1500);
   for(const [page] of pages){await page.waitForFunction(()=>!document.getElementById('readyButton').disabled,null,{timeout:15000});await page.locator('#readyButton').click();}
   const s=await api();if(s.active?.ui?.phase==='waiting')await api({type:'force-start',instance:s.active.instance}).catch(()=>{});
   for(let i=0;i<600;i++){const st=await api();if(st.active?.ui?.phase==='results')break;await sleep(100);}await sleep(2200);for(const [page,p] of pages)await shot(page,p+'15-results');await api({type:'stop'});await sleep(1500);for(const [page,p] of pages)await shot(page,p+'16-back-home');});
  for(const [page] of pages)await page.close();await tv.close();
 }finally{child.kill();}
}
(async()=>{const browser=await webkit.launch({headless:true});try{
 if(only.includes('native'))await nativeHub(browser);
 if(only.includes('guest'))await guest(browser,false);
 if(only.includes('controller'))await guest(browser,true);
}catch(e){report.errors.push('fatal: '+(e.stack||e));process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,1));await browser.close();console.log(JSON.stringify({errors:report.errors,shots:report.shots.length},null,1));}})();
