'use strict';
// Three real frontend routes on an isolated worker; native integration is a bridge fixture.
// This measures desktop browser CPU/style/layout, not physical iPhone or AirPlay encoding.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const express=require('express'),pw=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.QA_OUTPUT||'output/playwright/performance242');
fs.mkdirSync(out,{recursive:true});
const engine=process.env.QA_ENGINE||'chromium',key='performance242';
const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_INTERNAL_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:key}});
let log='',browser,staticServer,origin;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const report={engine,method:'native host + embedded controller + 3840x2160 TV in one desktop browser; real worker/API; bridge and persistent-tabs fixtures; no hardware/AirPlay claim',rows:[],clicks:[],errors:[],checks:[],capturedAt:new Date().toISOString()};
async function api(command){const r=await fetch(origin+'/api/manage',{method:command?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:command?JSON.stringify(command):undefined});const s=await r.json();assert(!s.error,JSON.stringify(s));return s;}
function probe(){
 const stats=()=>({calls:{},frames:[],mutations:0,rects:0,styles:0,targets:{}});window.__perf242=stats();
 const track=(key,fn)=>function(...args){const t=performance.now();try{return fn.apply(this,args);}finally{const s=__perf242.calls[key]||(__perf242.calls[key]={n:0,ms:0,max:0}),d=performance.now()-t;s.n++;s.ms+=d;s.max=Math.max(s.max,d);}};
 const MO=MutationObserver;window.MutationObserver=class extends MO{constructor(fn){const key='MO '+(new Error().stack?.split('\n')[2]||'unknown').replace(/http:\/\/[^/]+/,'');super(track(key,fn));}};
 const raf=requestAnimationFrame;window.requestAnimationFrame=fn=>raf(track('RAF '+(new Error().stack?.split('\n')[2]||'unknown').replace(/http:\/\/[^/]+/,''),fn));
 const bounds=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(...args){__perf242.rects++;return bounds.apply(this,args);};
 const style=getComputedStyle;window.getComputedStyle=function(...args){__perf242.styles++;return style.apply(this,args);};
 let last;raf(function sample(now){if(last)__perf242.frames.push(now-last);last=now;raf(sample);});
 addEventListener('DOMContentLoaded',()=>new MO(records=>{for(const r of records){__perf242.mutations++;const target=r.target.id||r.target.className||r.target.nodeName,key=String(target)+':'+(r.attributeName||r.type);__perf242.targets[key]=(__perf242.targets[key]||0)+1;}}).observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true}));
 window.__reset242=()=>{window.__perf242=stats();last=null;};
 const Original=WebSocket;window.__sockets242=[];window.WebSocket=class extends Original{constructor(...args){super(...args);__sockets242.push(this);}};
}
function nativeState(s){return {...s,native:{ready:true,catalogReady:true,address:origin,externalDisplays:1,haptics:true}};}
(async()=>{try{
 for(let n=0;n<300&&!/localhost:(\d+)/.test(log);n++)await sleep(50);assert(/localhost:(\d+)/.test(log),log);origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 browser=await pw[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 staticServer=express().use(express.static(path.join(root,'public'))).listen(0,'127.0.0.1');await new Promise(r=>staticServer.once('listening',r));
 const host=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),controller=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),tv=await browser.newPage({viewport:{width:3840,height:2160}});
 const pages=[['host',host],['controller',controller],['tv',tv]],sessions=new Map();
 for(const [label,p]of pages){p.on('pageerror',e=>report.errors.push(label+': '+e.message));await p.addInitScript(probe);if(process.env.PERF_SOURCE_DIR)for(const rel of (process.env.PERF_FILES||'native-shell/host.js,tv-discovery.js,game-spotlight.js,tv.js,app.js,button-progress.js').split(','))await p.route('**/'+rel,r=>r.fulfill({path:path.join(process.env.PERF_SOURCE_DIR,rel),contentType:'text/javascript'}));if(engine==='chromium'){const cdp=await p.context().newCDPSession(p);await cdp.send('Performance.enable');sessions.set(p,cdp);}}
 await host.exposeFunction('__manage242',async command=>{const s=await api(command);await host.evaluate(s=>LocalPartyHost.update(s),nativeState(s));});
 await host.addInitScript(()=>{window.webkit={messageHandlers:{partyShell:{postMessage:m=>{if(m.type==='manage')return window.__manage242(m.command);}}}};});
 await controller.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fs.readFileSync(path.join(root,'public/native-shell/controller-bridge.js'),'utf8')+'\nwindow.__partyPersistentTabs=true;'+fs.readFileSync(path.join(root,'public/native-shell/tabs.js'),'utf8')});
 await tv.goto(origin+'/tv');await host.goto('http://127.0.0.1:'+staticServer.address().port+'/native-shell/index.html');await controller.goto(origin+'/play');
 await controller.locator('#name').fill('Performance Player');await controller.locator('#joinForm button[type=submit]').click();await controller.locator('#home').waitFor();
 let state=await api();await host.evaluate(s=>LocalPartyHost.update(s),nativeState(state));for(const [,p]of pages)await p.evaluate(()=>document.fonts.ready);await sleep(3500);
 async function metric(p){if(!sessions.has(p))return null;const r=await sessions.get(p).send('Performance.getMetrics');return Object.fromEntries(r.metrics.map(m=>[m.name,m.value]));}
 async function sample(label,action,ms=3500){
  const before=new Map();for(const [,p]of pages){await p.evaluate(()=>__reset242());before.set(p,await metric(p));}
  if(action)await action();await sleep(ms);
  for(const [surface,p]of pages){const after=await metric(p),data=await p.evaluate(()=>{const s=__perf242,f=s.frames.sort((a,b)=>a-b),animations=document.getAnimations(),running=animations.filter(a=>a.playState==='running'),backgrounds=[...document.querySelectorAll('[data-hp-modal-background]')].map(n=>{const r=n.getBoundingClientRect();return{id:n.id,tag:n.tagName,width:r.width,height:r.height,filter:getComputedStyle(n).filter};});return {frames:f.length,p50:f[Math.floor(f.length*.5)],p95:f[Math.floor(f.length*.95)],max:f.at(-1),over50:f.filter(v=>v>50).length,rects:s.rects,styles:s.styles,mutations:s.mutations,callbacks:Object.entries(s.calls).sort((a,b)=>b[1].ms-a[1].ms).slice(0,12),targets:Object.entries(s.targets).sort((a,b)=>b[1]-a[1]).slice(0,15),animations:animations.length,activeAnimations:running.length,backgroundAnimations:running.filter(a=>a.effect?.target?.closest?.('[data-hp-modal-background]')).map(a=>({name:a.animationName||'WAAPI',target:a.effect?.target?.id||a.effect?.target?.className})),backgrounds};});const base=before.get(p),cpu=base&&Object.fromEntries(['TaskDuration','ScriptDuration','RecalcStyleDuration','LayoutDuration','RecalcStyleCount','LayoutCount'].map(k=>[k,after[k]-base[k]]));report.rows.push({label,surface,...data,cpu});}
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 }
 async function click(p,selector,label){report.clicks.push(await p.evaluate(async({selector,label})=>{const el=document.querySelector(selector);if(!el)throw Error('Missing '+selector);const t=performance.now();el.click();const sync=performance.now()-t;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return{label,syncMs:sync,nextPaintOpportunityMs:performance.now()-t};},{selector,label}));await sleep(500);}
 if(process.env.PERF_FAST!=='1')await sample('idle-three-surfaces',null,5000);
 state=await api();await sample('30-equivalent-snapshots',async()=>{for(let n=0;n<30;n++){await host.evaluate(s=>LocalPartyHost.update(s),nativeState(state));await tv.evaluate(s=>{const ws=__sockets242.find(w=>new URL(w.url).pathname==='/lobby');ws.onmessage({data:JSON.stringify({type:'state',...s})});},state);await sleep(100);}},500);
 await api({type:'select',id:'curling'});await host.evaluate(s=>LocalPartyHost.update(s),nativeState(await api()));await sleep(900);
 await sample('bot-popup-and-state-actions',async()=>{
  await click(host,'#choiceStart','bot-open');
  for(let n=0;n<4;n++){await click(host,'#startBotsPlus','bot-add');await host.evaluate(s=>LocalPartyHost.update(s),nativeState(await api()));}
  for(let n=0;n<3;n++){await click(host,'#startBotsMinus','bot-remove');await host.evaluate(s=>LocalPartyHost.update(s),nativeState(await api()));}
 },800);
 if(process.env.PERF_PRODUCTION_MODAL_GATE==='1')await host.evaluate(async()=>{window.__phase242=a=>typeof a.currentTime==='number'?a.currentTime:a.currentTime?.value??String(a.currentTime);window.__cssPaused242=document.getAnimations().filter(a=>a instanceof CSSAnimation&&a.effect?.target?.closest?.('[data-hp-modal-background]')&&a.playState==='paused');await Promise.all(__cssPaused242.map(a=>a.ready));window.__cssTimes242=__cssPaused242.map(__phase242);});
 await sample('bot-popup-idle',null,5000);
 if(process.env.PERF_PRODUCTION_MODAL_GATE==='1'){report.productionPause=await host.evaluate(()=>({paused:__cssPaused242.length,phaseHeld:__cssPaused242.every((a,i)=>{const now=__phase242(a),before=__cssTimes242[i];return typeof now==='number'&&typeof before==='number'?Math.abs(now-before)<1:now===before;}),runningBackgroundCSS:document.getAnimations().filter(a=>a instanceof CSSAnimation&&a.playState==='running'&&a.effect?.target?.closest?.('[data-hp-modal-background]')&&a.effect.target.getClientRects().length).map(a=>({name:a.animationName,target:a.effect?.target?.id||a.effect?.target?.className,pseudo:a.effect?.pseudoElement,style:getComputedStyle(a.effect.target,a.effect?.pseudoElement).animationPlayState})),runningForegroundCSS:document.getAnimations().filter(a=>a instanceof CSSAnimation&&a.playState==='running'&&a.effect?.target?.closest?.('#startBots')).map(a=>a.animationName)}));assert(report.productionPause.paused>=5&&report.productionPause.phaseHeld&&!report.productionPause.runningBackgroundCSS.length&&report.productionPause.runningForegroundCSS.length,'Production gate must retain foreground, stop background work, and preserve phase: '+JSON.stringify(report.productionPause));}

 if(process.env.PERF_MODAL_GATE==='1')for(let n=0;n<3;n++){
  await host.evaluate(async()=>{window.__phase242=a=>typeof a.currentTime==='number'?a.currentTime:a.currentTime?.value??String(a.currentTime);window.__paused242=document.getAnimations().filter(a=>a instanceof CSSAnimation&&a.playState==='running'&&a.effect?.target?.closest?.('[data-hp-modal-background]'));__paused242.forEach(a=>a.pause());await Promise.all(__paused242.map(a=>a.ready));window.__pausedTimes242=__paused242.map(__phase242);});
  await sample('bot-popup-background-paused-'+n,null,5000);
  const held=await host.evaluate(()=>__paused242.every((a,i)=>{const now=__phase242(a),before=__pausedTimes242[i];return typeof now==='number'&&typeof before==='number'?Math.abs(now-before)<1:now===before;}));assert(held,'Background animation phase advances while paused');
  await host.evaluate(()=>__paused242.forEach(a=>a.play()));await sample('bot-popup-background-running-'+n,null,5000);
 }
 await host.screenshot({path:path.join(out,'host-bots.png')});
 report.checks.push(await host.evaluate(()=>({name:'bot-state-and-material',count:document.querySelector('#startBotsCount').textContent,open:document.querySelector('#startBots').matches(':popover-open'),blur:document.querySelector('[data-hp-modal-background]')&&getComputedStyle(document.querySelector('[data-hp-modal-background]')).filter,material:getComputedStyle(document.querySelector('#startBots')).background,anchor:document.querySelector('#choiceStart').getBoundingClientRect().toJSON(),panel:document.querySelector('#startBots').getBoundingClientRect().toJSON()})));
 await click(host,'#startBotsClose','bot-close');
 if(process.env.PERF_PRODUCTION_MODAL_GATE==='1'){report.productionPause.resumed=await host.evaluate(()=>__cssPaused242.filter(a=>a.playState!=='paused').length);assert(report.productionPause.resumed>=5,'Previously paused background effects must resume after close');}
 if(process.env.PERF_FAST!=='1')await sample('host-and-controller-popup',async()=>{for(let n=0;n<3;n++){await click(host,'#openHost','host-open');await click(host,'[data-close=hostPanel]','host-close');await click(controller,'#edit','profile-open');await click(controller,'#profileCancel','profile-close');}},500);
 await click(host,'#openHost','host-open-capture');await host.screenshot({path:path.join(out,'host-panel.png')});await click(host,'[data-close=hostPanel]','host-close-capture');
 await click(controller,'#edit','profile-open-capture');await controller.screenshot({path:path.join(out,'controller-profile.png')});await click(controller,'#profileCancel','profile-close-capture');
 await sleep(1000);await tv.screenshot({path:path.join(out,'tv-lobby.png')});
 assert.equal(report.errors.length,0,report.errors.join('\n'));const bots=report.checks[0];assert.equal(bots.count,'1');assert(bots.open&&bots.blur.includes('blur(8px)'));assert(bots.material.includes('0.93'));
 for(const [,p]of pages)assert(!await p.evaluate(()=>document.body.hasAttribute('data-hp-modal-active')),'Popup left active blur');
 report.ok=true;
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{await browser?.close();staticServer?.close();child.kill();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:report.ok,rows:report.rows.length,errors:report.errors,failure:report.failure}));}})();
