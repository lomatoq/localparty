'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawn}=require('node:child_process'),{WebSocket}=require('ws'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve('.localparty-build/build111/active-card-real');fs.mkdirSync(out,{recursive:true});
const files=['public/app.js','public/native-shell/host.js','public/native-shell/host-ui.css','public/game-ui-system.css','public/tv.js','public/native-shell/tabs.js','public/branding.css','public/polish.css'];
const hashes=()=>Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const report={startedAt:new Date().toISOString(),method:'Real isolated launcher and real Push worker. Native host production resources receive actual API room snapshots with native readiness/display metadata added by the harness. Native message transport is captured and any manage command would be forwarded to the real API. Both controller fallback and shipped persistent tabs are exercised. No physical Swift/webview switching claim.',sourceStart:hashes(),cases:[],captures:[],errors:[]};
const key='active-card111-real',child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EPHEMERAL:'1',PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:key}});
let log='',browser,origin,assets;const peers=[];
child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const tick=()=>new Promise(r=>setTimeout(r,50));
async function api(command){const response=await fetch(origin+'/api/manage',{method:command?'POST':'GET',headers:{Authorization:'Bearer '+key,...(command?{'Content-Type':'application/json'}:{})},...(command?{body:JSON.stringify(command)}:{})});const value=await response.json();assert(response.ok,JSON.stringify(value));return value;}
async function update(page){const state=await api();await page.evaluate(s=>LocalPartyHost.update({...s,native:{ready:true,catalogReady:true,externalDisplays:1}}),state);return state;}
async function capture(page,file){await page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished));});await page.screenshot({path:path.join(out,file)});report.captures.push({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,file))).digest('hex')});}
(async()=>{try{
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await tick();assert.match(log,/localhost:(\d+)/);origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 for(const name of ['Active One','Active Two']){const ws=new WebSocket(origin.replace('http','ws')+'/lobby');peers.push(ws);await new Promise((resolve,reject)=>{ws.once('error',reject);ws.once('open',()=>ws.send(JSON.stringify({type:'join',name,hand:'right'})));ws.on('message',raw=>{if(JSON.parse(raw).type==='joined')resolve();});});}
 const launched=await api({type:'launch',id:'push',externalDisplay:true});assert.equal(launched.active.id,'push');assert.equal(launched.metrics.gameStarts,1);
 assets=express().use(express.static(path.resolve('public'))).listen(0,'127.0.0.1');await new Promise(r=>assets.once('listening',r));
 browser=await webkit.launch({headless:true});
 for(const width of [320,402])for(const route of ['fallback','persistent-tabs']){
  const page=await browser.newPage({viewport:{width,height:width===320?568:874},deviceScaleFactor:3,isMobile:true,hasTouch:true});page.on('pageerror',e=>report.errors.push(e.message));
  await page.exposeBinding('__forwardManage',async(_,command)=>api(command));
  await page.addInitScript(persistent=>{window.__commands=[];window.__forwarded=[];window.__partyPersistentTabs=persistent;window.webkit={messageHandlers:{partyShell:{postMessage:m=>{__commands.push(m);if(m.type==='manage')__forwarded.push(__forwardManage(m.command));}}}};},route==='persistent-tabs');
  if(route==='persistent-tabs')await page.addInitScript({path:'public/native-shell/tabs.js'});
  await page.goto('http://127.0.0.1:'+assets.address().port+'/native-shell/index.html');
  for(const paused of [false,true]){
   await api({type:'pause',paused});const before=await update(page);assert.equal(before.active.instance,launched.active.instance);
   const action=page.locator('[data-game=push] .lp-direct-start');await action.scrollIntoViewIfNeeded();
   // Reveal a genuinely scrolled compact deck, then keep the card action below
   // the sticky stack's trailing fade for a readable ordinary-scroll capture.
   await page.evaluate(()=>scrollTo(0,Math.max(scrollY,48)));await page.waitForTimeout(300);
   await page.evaluate(()=>{const action=document.querySelector('[data-game=push] .lp-direct-start'),tools=document.querySelector('.native-catalog-tools');const a=action.getBoundingClientRect(),t=tools.getBoundingClientRect();if(a.top<t.bottom+45)scrollBy(0,a.top-t.bottom-45);});
   await page.waitForFunction(()=>{const card=document.querySelector('[data-game=push]');return card&&!card.classList.contains('lp-reveal-pending')&&Number(getComputedStyle(card).opacity)>.99;});
   assert.equal((await action.textContent()).trim(),'Play');assert(!(await action.isDisabled()));await capture(page,`native-${width}-${route}-${paused?'paused':'waiting'}.png`);
   const previous=await page.evaluate(()=>__commands.length);await action.tap();await page.evaluate(()=>Promise.all(__forwarded));await page.waitForTimeout(250);
   const commands=await page.evaluate(n=>__commands.slice(n).filter(c=>!['launch-diagnostic','haptic','haptic-prepare'].includes(c.type)),previous),after=await api();
   assert.deepEqual(commands,route==='persistent-tabs'?[{type:'native-tab',tab:'controller'}]:[{type:'controller'}]);
   assert.equal(after.active.instance,before.active.instance,'Opening active controller cannot change game instance');assert.equal(after.metrics.gameStarts,before.metrics.gameStarts,'Opening active controller cannot start another worker');assert.equal(after.active.session.paused,paused);
   report.cases.push({width,route,paused,label:(await action.textContent()).trim(),phase:after.active.ui.phase,commands,instanceBefore:before.active.instance,instanceAfter:after.active.instance,gameStartsBefore:before.metrics.gameStarts,gameStartsAfter:after.metrics.gameStarts});
  }
  await page.close();
 }
 report.sourceEnd=hashes();assert.deepEqual(report.sourceEnd,report.sourceStart);assert.deepEqual(report.errors,[]);report.ok=true;report.finishedAt=new Date().toISOString();
 }finally{fs.writeFileSync(path.join(out,'server.log'),log);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();if(origin)await api({type:'stop'}).catch(()=>{});peers.forEach(ws=>ws.close());await new Promise(resolve=>assets?assets.close(resolve):resolve());child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
