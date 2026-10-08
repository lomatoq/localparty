'use strict';
// Native-route browser diagnostic only. Does not alter production sources.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const express=require('express'),pw=require(process.env.PARTY_PLAYWRIGHT||'playwright'),catalog=require('../lib/catalog');
const baseline=path.resolve('.localparty-build/perf245/source-before');
const output=path.resolve(process.env.QA_OUTPUT||'output/playwright/performance245/close');
fs.mkdirSync(output,{recursive:true});
const js=fs.readFileSync(path.join(baseline,'public/app-ux-20261005.js'),'utf8');
const css=fs.readFileSync(path.join(baseline,'public/app-ux-20261005.css'),'utf8');
const anchor="body.toggleAttribute('data-hp-modal-active',active);";
assert(js.includes(anchor));
const candidateJS=js.replace(anchor,"body.toggleAttribute('data-hp-modal-present',foreground.length>0);\n  "+anchor);
const candidateCSS=css.replaceAll('body[data-hp-modal-active] [data-hp-modal-background][data-hp-modal-background]','body[data-hp-modal-present] [data-hp-modal-background][data-hp-modal-background]')+
 '\nhtml.hp-ui body[data-hp-modal-present] #choiceStrip[data-hp-modal-background] #choiceStart::after{animation-play-state:paused!important}\n';
assert.notEqual(candidateCSS,css);
const visibility=fs.readFileSync('public/native-shell/visibility.js','utf8'),tabs=fs.readFileSync('public/native-shell/tabs.js','utf8');
const report={method:'Matched browser close cycles, real native visibility/tabs, cached catalogue fixture; no physical cast/GPU acceptance.',rows:[],errors:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=express().use(express.static('public')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 try{for(const engine of (process.env.QA_ENGINE?[process.env.QA_ENGINE]:['chromium','webkit'])){
  const browser=await pw[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
  try{for(let pair=1;pair<=Number(process.env.QA_PAIRS||(engine==='chromium'?3:1));pair++)for(const variant of ['before','candidate']){
   const ctx=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
   await ctx.addInitScript({content:'window.__messages=[];window.webkit={messageHandlers:{partyShell:{postMessage(m){__messages.push(m)}}}};'+visibility+'\nwindow.__partyPersistentTabs=true;'+tabs});
   await ctx.route('**/app-ux-20261005.js',r=>r.fulfill({contentType:'text/javascript',body:variant==='before'?js:candidateJS}));
   await ctx.route('**/app-ux-20261005.css',r=>r.fulfill({contentType:'text/css',body:variant==='before'?css:candidateCSS}));
   const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));
   await p.goto('http://127.0.0.1:'+server.address().port+'/native-shell/index.html');
   await p.evaluate(catalog=>LocalPartyHost.update({catalog,players:[{id:'p',name:'Taylor',connected:true}],leaderboard:[],votes:[],selected:'push',screens:1,native:{ready:true,catalogReady:true,working:false}}),catalog);
   await p.evaluate(()=>document.fonts.ready);await sleep(1200);
   // Warm identical dialog/content/resource work before the measured cycles.
   await p.evaluate(()=>document.getElementById('openHost').click());await sleep(650);
   await p.evaluate(()=>document.querySelector('[data-close=hostPanel]').click());await sleep(400);
   let session;if(engine==='chromium'){session=await ctx.newCDPSession(p);await session.send('Performance.enable');}
   const metrics=async()=>session?Object.fromEntries((await session.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value])):null;
   const row={engine,pair,variant,cycles:[],task:0,script:0,style:0,layouts:0};report.rows.push(row);
   for(let cycle=0;cycle<Number(process.env.QA_CYCLES||(engine==='chromium'?12:4));cycle++){
    await p.evaluate(()=>document.getElementById('openHost').click());await sleep(600);
    const before=await metrics();
    const result=await p.evaluate(async()=>{
     const phase=a=>typeof a.currentTime==='number'?a.currentTime:a.currentTime?.value;
     const bg=document.getAnimations().filter(a=>a instanceof CSSAnimation&&a.effect?.target?.closest?.('[data-hp-modal-background]')&&a.effect.target.getClientRects().length);
     await Promise.all(bg.map(a=>a.ready));const times=bg.map(phase),start=performance.now();
     document.querySelector('[data-close=hostPanel]').click();
     await new Promise(r=>setTimeout(r,95));
     const moved=bg.map((a,i)=>({name:a.animationName,target:a.effect.target.id||a.effect.target.className,before:times[i],after:phase(a),state:a.playState,css:getComputedStyle(a.effect.target).animationPlayState})).filter(x=>Number.isFinite(x.before)&&Number.isFinite(x.after)&&Math.abs(x.after-x.before)>1);
     const during={open:hostPanel.open,present:document.body.hasAttribute('data-hp-modal-present'),active:document.body.hasAttribute('data-hp-modal-active'),backgroundCSS:bg.length,moving:moved.length,moved,foregroundRunning:hostPanel.getAnimations().some(a=>a.playState==='running')};
     await new Promise(r=>setTimeout(r,250));
     return {during,totalMs:performance.now()-start,closed:!hostPanel.open,backgroundMarkers:document.querySelectorAll('[data-hp-modal-background]').length,presentAfter:document.body.hasAttribute('data-hp-modal-present'),activeAfter:document.body.hasAttribute('data-hp-modal-active'),resumed:bg.filter(a=>a.playState==='running').length};
    });
    const after=await metrics();if(before){row.task+=after.TaskDuration-before.TaskDuration;row.script+=after.ScriptDuration-before.ScriptDuration;row.style+=after.RecalcStyleDuration-before.RecalcStyleDuration;row.layouts+=after.LayoutCount-before.LayoutCount;}
    row.cycles.push(result);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
    assert(result.closed&&!result.activeAfter&&!result.presentAfter&&!result.backgroundMarkers,'Close must clean up fully');
    if(variant==='candidate'){assert(result.during.open&&result.during.present&&!result.during.active,'Presence retained only through close');assert.equal(result.during.moving,0,'Background phase must remain parked while closing');assert(result.resumed>0,'Actual background effects resume after close');}
   }
   if(pair===1){await p.evaluate(()=>document.getElementById('openHost').click());await sleep(650);await p.screenshot({path:path.join(output,engine+'-'+variant+'-host.png')});}
   fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({engine,pair,variant,task:row.task,style:row.style,moving:row.cycles.map(c=>c.during.moving)}));await ctx.close();
  }}finally{await browser.close();}
 }}finally{server.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));}
 assert.equal(report.errors.length,0);report.ok=true;fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
})().catch(e=>{report.failure=e.stack;fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
