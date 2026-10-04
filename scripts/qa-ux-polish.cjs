'use strict';
// UX polish QA: TV scene transition wordmark, shared stick feel, phone input
// zoom guard. Real server, real launch and real pointer input; no injected state.
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/ux-polish/qa');fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'ux-polish',...(process.env.QA_FAST==='0'?{}:{TEST_FAST:'1'})}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const report={startedAt:new Date().toISOString(),checks:{},errors:[]};
async function until(fn,label,tries=400){for(let i=0;i<tries;i++){const v=await fn();if(v)return v;await sleep(50);}throw Error('timeout: '+label);}
const watchdog=setTimeout(()=>{child.kill();process.exit(2)},8*60*1000);watchdog.unref();
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'server');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer ux-polish','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
 browser=await webkit.launch({headless:true});
 const tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>report.errors.push({surface:'tv',error:e.message}));
 await tv.goto(origin+'/tv');
 const phones=[];
 for(const [width,height] of [[393,852],[320,568]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});p.on('pageerror',e=>report.errors.push({surface:'phone'+width,error:e.message}));
  await p.goto(origin+'/play');await p.locator('#name').waitFor();
  // iOS Safari zooms into any focused field under 16px and never zooms back.
  report.checks['inputs'+width]=await p.evaluate(()=>[...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]),textarea,select')].filter(e=>e.getClientRects().length).map(e=>({id:e.id||e.name||e.className,fontSize:parseFloat(getComputedStyle(e).fontSize)})));
  await p.screenshot({path:path.join(out,`phone${width}-onboarding.png`)});
  await p.locator('#name').fill(width===393?'Alexandria Longname':'Taylor');await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();
  phones.push(p);
 }
 for(const [w,list] of Object.entries(report.checks))for(const field of list)assert(field.fontSize>=16,`${w}: ${field.id} font-size ${field.fontSize}px zooms iOS Safari`);
 await sleep(600);await phones[0].screenshot({path:path.join(out,'phone393-lobby.png')});await tv.screenshot({path:path.join(out,'tv-lobby.png')});

 // Count header counter ticks during real play (motion.js pulse on tv.js readouts).
 await tv.evaluate(()=>{window.__ticks={pulse:0,keys:new Set()};new MutationObserver(rs=>{for(const r of rs){const el=r.target;if(el.classList?.contains('tv-stat-value')&&el.classList.contains('lp-motion-pulse')){__ticks.pulse++;__ticks.keys.add(el.parentElement?.dataset.key);}}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});});
 // TV transition: the launched game's wordmark, sampled mid-hold.
 await api({type:'launch',id:'bomb'});
 await until(()=>tv.evaluate(()=>{const t=document.getElementById('tvSceneTransition');return !t.hidden&&t.classList.contains('has-logo');}),'tv transition with logo',120);
 await sleep(380);
 report.checks.transition=await tv.evaluate(()=>{const t=document.getElementById('tvSceneTransition'),logo=document.getElementById('tvTransitionLogo'),r=logo.getBoundingClientRect();return{visible:!t.hidden,logo:logo.naturalWidth>0&&!logo.hidden,box:[r.width,r.height],title:getComputedStyle(document.getElementById('tvTransitionTitle')).display,font:getComputedStyle(t.querySelector('span')).fontFamily};});
 await tv.screenshot({path:path.join(out,'tv-transition-bomb.png')});
 assert(report.checks.transition.logo,'transition shows the game wordmark');

 // Ready both phones, then force-start if bots keep it waiting.
 for(const p of phones){await p.waitForFunction(()=>!document.getElementById('readyButton').disabled,null,{timeout:20000});await p.locator('#readyButton').click();}
 const loaded=await api();if(loaded.active?.ui?.phase==='waiting'){try{await api({type:'force-start',instance:loaded.active.instance});}catch{}}
 report.checks.frames=phones[0].frames().map(f=>f.url());
 const frame=await until(async()=>{const f=phones[0].frames().find(x=>x.url().includes('/games/'));if(!f)return null;const ok=await f.evaluate(()=>{const z=document.getElementById('joystickZone');return z&&z.getClientRects().length&&z.getAttribute('aria-disabled')!=='true';}).catch(()=>false);return ok?f:null;},'joystick enabled',600).catch(async e=>{report.checks.frameState=await Promise.all(phones[0].frames().map(f=>f.evaluate(()=>({url:location.href,zone:!!document.getElementById('joystickZone'),dis:document.getElementById('joystickZone')?.getAttribute('aria-disabled'),phase:document.documentElement.dataset.partyPhase})).catch(()=>null)));await phones[0].screenshot({path:path.join(out,'phone393-debug.png')});throw e;});
 const base=await frame.locator('#joystickBase').boundingBox();const frameBox=await phones[0].locator('#gameFrame').boundingBox();
 const cx=(frameBox?.x||0)+base.x+base.width/2,cy=(frameBox?.y||0)+base.y+base.height/2;
 const knob=()=>frame.evaluate(()=>{const k=document.getElementById('joystickKnob'),b=document.getElementById('joystickBase'),s=getComputedStyle(k);return{active:b.getAttribute('data-hp-stick'),transform:s.transform,scale:s.scale,transition:s.transitionProperty+' '+s.transitionDuration,outline:getComputedStyle(b).outlineColor};});
 await phones[0].mouse.move(cx,cy);await phones[0].mouse.down();await phones[0].mouse.move(cx+70,cy-30,{steps:6});await sleep(160);
 report.checks.stickHeld=await knob();await phones[0].screenshot({path:path.join(out,'phone393-stick-held.png')});
 await phones[0].mouse.up();await sleep(70);report.checks.stickReleasing=await knob();
 await sleep(400);report.checks.stickRest=await knob();await phones[0].screenshot({path:path.join(out,'phone393-stick-rest.png')});
 assert.equal(report.checks.stickHeld.active,'active');assert.equal(report.checks.stickRest.active,null);
 assert.notEqual(report.checks.stickReleasing.transform,report.checks.stickRest.transform,'knob glides home instead of teleporting');
 await sleep(1200);await tv.screenshot({path:path.join(out,'tv-bomb-play.png')});
 // Real round end: the between-rounds outcome card on both phone sizes.
 const frames=phones.map(p=>p.frames().find(f=>f.url().includes('/games/bomb/')));
 const cardVisible=()=>frames[0].evaluate(()=>{const c=document.querySelector('#waiting:not(.hidden) .round-card');return !!c&&c.getBoundingClientRect().width>0;}).catch(()=>false);
 for(let attempt=0;;attempt++){await until(cardVisible,'round outcome card',1600);await sleep(430);if(await cardVisible())break;if(attempt>4)throw Error('between-round card never stayed for its entrance');await until(async()=>!(await cardVisible()),'next round',400);}
 report.checks.tvTicks=await tv.evaluate(()=>({pulse:__ticks.pulse,keys:[...__ticks.keys]}));
 report.checks.roundCard=await frames[0].evaluate(()=>{const c=document.querySelector('#waiting .round-card'),r=c.getBoundingClientRect(),w=document.getElementById('waiting');return{text:c.textContent,emoji:!!c.querySelector('.round-emoji'),box:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)],bg:getComputedStyle(w).backgroundImage,info:c.classList.contains('hp-info-card')};});
 await Promise.all(phones.map((p,i)=>p.screenshot({path:path.join(out,`phone${i?320:393}-round-card.png`)})));
 await tv.screenshot({path:path.join(out,'tv-bomb-between.png')});
 await api({type:'stop'});
 if(process.env.QA_FAST==='0')return;
 // Real finished match: staggered standings and the winner glint.
 await Promise.all(phones.map(p=>p.locator('#home').waitFor()));
 await api({type:'launch',id:'taprace'});
 for(const p of phones){await p.waitForFunction(()=>!document.getElementById('readyButton').disabled,null,{timeout:20000});await p.locator('#readyButton').click();}
 const started=await api();if(started.active?.ui?.phase==='waiting'){try{await api({type:'force-start',instance:started.active.instance});}catch{}}
 await until(async()=>{const s=await api();return s.active?.ui?.phase==='results';},'taprace results',1200);
 await phones[0].locator('#sharedMatchResults').waitFor({state:'visible'});await sleep(260);
 report.checks.resultsEarly=await phones[0].evaluate(()=>[...document.querySelectorAll('#sharedMatchResults .hp-result-row')].map(r=>+getComputedStyle(r).opacity));
 await phones[0].screenshot({path:path.join(out,'phone393-results-entering.png')});
 await sleep(1700);
 report.checks.resultsSettled=await phones[0].evaluate(()=>[...document.querySelectorAll('#sharedMatchResults .hp-result-row')].map(r=>+getComputedStyle(r).opacity));
 for(const [i,p] of phones.entries())await p.screenshot({path:path.join(out,`phone${i?320:393}-results.png`)});
 await tv.screenshot({path:path.join(out,'tv-results.png')});
 assert(report.checks.resultsSettled.every(o=>o===1),'every standings row settles fully opaque');
 await api({type:'stop'});
}catch(error){report.failure=error.stack||String(error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));clearTimeout(watchdog);await browser?.close();child.kill();console.log(JSON.stringify(report,null,1));}})();
