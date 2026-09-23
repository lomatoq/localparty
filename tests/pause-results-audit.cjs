'use strict';
// Real local server and WebKit UI. Podium transport is replayed deterministically
// after the real shell connects; this measures rendering, not Wi-Fi/AirPlay.
const {spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve('.localparty-build/pause-results-audit');fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'pause-results-audit'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const report={engine:'Desktop WebKit; local server; synthetic 8-player podium transport; not physical iPhone/Wi-Fi/AirPlay',layouts:[],performance:[],errors:[]};
async function until(fn){for(let i=0;i<200;i++){if(await fn())return;await delay(100);}throw Error('Timed out: '+log.slice(-1000));}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log));const base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer pause-results-audit','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const s=await r.json();assert(r.ok,JSON.stringify(s));return s;};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1920,height:1080}});
 await tv.addInitScript(()=>{
  const NativeSocket=WebSocket;window.WebSocket=class extends NativeSocket{constructor(...args){super(...args);window.__auditSocket=this;this.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.type==='state')window.__auditState=m;});}};
  window.__auditFrames=[];window.__auditSlowTasks=[];
  const timed=(kind,fn)=>typeof fn!=='function'?fn:function(...args){const start=performance.now();try{return fn.apply(this,args);}finally{const duration=performance.now()-start;if(duration>40)window.__auditSlowTasks.push({kind,duration,callback:String(fn).slice(0,160)});}};
  for(const name of ['requestAnimationFrame','setTimeout','setInterval']){const original=window[name].bind(window);window[name]=(fn,...args)=>original(timed(name,fn),...args);}
  const NativeObserver=MutationObserver;window.MutationObserver=class extends NativeObserver{constructor(fn){super(timed('MutationObserver',fn));}};
  window.__auditLast=0;requestAnimationFrame(function tick(now){if(window.__auditLast)window.__auditFrames.push(now-window.__auditLast);window.__auditLast=now;requestAnimationFrame(tick);});
 });
 const phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 for(const page of [tv,phone])page.on('pageerror',e=>report.errors.push(e.message));
 await tv.goto(base+'/tv');await until(async()=>(await api()).screens===1);
 await phone.goto(base+'/play');await phone.locator('#name').fill('Александра Тест');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor({state:'visible'});
 await api({type:'bots-set',count:7});await api({type:'launch',id:'push'});await phone.locator('#readyButton').waitFor({state:'visible'});
 await phone.locator('#readyButton').click();await until(async()=>['playing','countdown'].includes((await api()).active?.ui?.phase));
 await phone.locator('#pauseButton').click();await phone.locator('#pauseOverlay').waitFor({state:'visible'});
 for(const [width,height] of [[393,852],[320,700],[667,375]]){
  await phone.setViewportSize({width,height});await delay(400);
  await phone.screenshot({path:path.join(out,`pause-${width}.png`)});
  const layout=await phone.evaluate(()=>{
   const card=document.querySelector('#pauseOverlay>div'),r=card.getBoundingClientRect(),s=getComputedStyle(card),overlay=document.querySelector('#pauseOverlay').getBoundingClientRect();
   return {viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth+1,padding:parseFloat(s.paddingBottom),radius:parseFloat(s.borderRadius),buttons:[...card.querySelectorAll('button')].map(el=>{const b=el.getBoundingClientRect();return {id:el.id,inside:b.left>=r.left+12&&b.right<=r.right-12&&b.bottom<=r.bottom-12&&b.bottom<=overlay.bottom&&b.top>=overlay.top,height:b.height,clipped:el.scrollWidth>el.clientWidth+2};})};
  });report.layouts.push(layout);assert(!layout.overflow);assert(layout.padding>=16&&layout.radius>=20);for(const b of layout.buttons)assert(b.inside&&b.height>=44&&!b.clipped,JSON.stringify(b));
  await phone.locator('#sessionRules').click();await phone.locator('#rulesDialog').waitFor({state:'visible'});await delay(500);await phone.screenshot({path:path.join(out,`rules-${width}.png`)});await phone.locator('#closeRules').click();
 }
 await phone.setViewportSize({width:393,height:852});await phone.locator('#resumeButton').click();await phone.locator('#pauseOverlay').waitFor({state:'hidden'});await api({type:'stop'});await phone.locator('#home').waitFor({state:'visible'});
 const identity=await phone.evaluate(()=>JSON.parse(localStorage.getItem('local-party-profile')).id);
 for(const id of ['taprace','push']){
  const run=(await api({type:'launch',id})).active;
  await phone.locator('#readyButton').waitFor({state:'visible'});await phone.locator('#readyButton').click();
  await until(async()=>['playing','countdown'].includes((await api()).active?.ui?.phase));
  // A full reload tears down both transports and the old iframe while the match runs.
  await phone.reload();await phone.locator('#gameFrame').waitFor({state:'visible'});
  await until(async()=>{const state=await api();return state.active?.instance===run.instance&&state.active.ready.includes(identity);});
  assert.equal(await phone.locator('#onboarding').isVisible(),false,'Reconnect must not send the player back to name/photo entry');
  assert.equal(await phone.evaluate(()=>JSON.parse(localStorage.getItem('local-party-profile')).id),identity);
  assert((await phone.locator('#gameFrame').getAttribute('src')).includes('/games/'+id+'/'),'The new game replaces the old iframe');
  await api({type:'stop'});await phone.locator('#home').waitFor({state:'visible'});
 }
 report.browserTransitions='Push → lobby → Tap Race → reload → lobby → Push → reload → lobby; identity preserved';
 await phone.close();await tv.bringToFront();
 await tv.waitForFunction(()=>window.__auditState&&!window.__auditState.active);
 // Freeze transport only for the synthetic result rendering fixture.
 await tv.evaluate(()=>{window.__auditSocket.onclose=null;window.__auditSocket.close();});
 async function emit(mode,key='audit-result'){
  await tv.evaluate(({mode,key})=>{const s=structuredClone(window.__auditState);s.active=null;s.tv={...s.tv,mode,effects:true,board:mode==='podium'?{key,title:'Итоги тестового матча',subtitle:'8 игроков · тест рендеринга',rows:Array.from({length:8},(_,i)=>({id:'audit-'+i,name:['Александра','Глеб','Дарья','Максим','Саша','Анна','Дмитрий','Мария'][i],rank:i+1,score:1000-i*100}))}:null};window.__auditSocket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(s)}));},{mode,key});
 }
 async function sample(label,ms){await tv.evaluate(()=>{window.__auditFrames=[];window.__auditSlowTasks=[];window.__auditLast=0;});await delay(ms);const m=await tv.evaluate(label=>{const a=window.__auditFrames.slice().sort((a,b)=>a-b);return {label,visibility:document.visibilityState,frames:a.length,median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1),over50:a.filter(v=>v>50).length,over100:a.filter(v=>v>100).length,slowTasks:window.__auditSlowTasks,fx:LocalPartyTVShow.diagnostics()};},label);report.performance.push(m);console.log(JSON.stringify(m));return m;}
 await emit('none');await delay(1000);await sample('lobby',3000);
 await emit('podium');await tv.locator('#tvPodium').waitFor({state:'visible'});await sample('results-active-effects',6000);await tv.screenshot({path:path.join(out,'results-8.png')});
 await sample('results-drain',12000);assert.equal((await tv.evaluate(()=>LocalPartyTVShow.diagnostics())).effectsRunning,false,'Effects finish rather than looping forever');
 await emit('podium');await delay(100);assert.equal((await tv.evaluate(()=>LocalPartyTVShow.diagnostics())).effectsRunning,false,'Same result update must not restart fireworks');
 await emit('none');await tv.locator('#tvPresentation').waitFor({state:'hidden'});const after=await sample('back-to-lobby',3000);assert.equal(after.fx.effectsRunning,false);assert.equal(after.fx.particles,0);
 await emit('podium','next-result');await delay(400);assert.equal((await tv.evaluate(()=>LocalPartyTVShow.diagnostics())).effectsRunning,true);await emit('none');await delay(300);assert.equal((await tv.evaluate(()=>LocalPartyTVShow.diagnostics())).effectsRunning,false);
 assert.deepEqual(report.errors,[]);console.log('PASS pause layouts, rules, resume, podium lifecycle and frame samples');
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
