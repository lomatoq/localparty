'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawn}=require('child_process'),pw=require('playwright');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/popup144/host');fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'popup137'}});let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const wait=ms=>new Promise(r=>setTimeout(r,ms));
const report={method:'Real-time video and requestAnimationFrame samples; no animation seeking. Native bridge fixture, not physical iPhone.',rows:[],errors:[]};
(async()=>{try{for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await wait(50);assert(/localhost:(\d+)/.test(log),log);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
for(const engine of ['webkit','chromium']){const browser=await pw[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});try{for(const width of (engine==='webkit'?[393,320]:[393])){
 const context=await browser.newContext({viewport:{width,height:width===320?568:852},isMobile:true,hasTouch:true,recordVideo:{dir:path.join(out,'video'),size:{width,height:width===320?568:852}}});
 await context.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fs.readFileSync('public/native-shell/controller-bridge.js','utf8')+'\nwindow.__partyPersistentTabs=true;'+fs.readFileSync('public/native-shell/tabs.js','utf8')});
 const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.route('**/native-shell/**',r=>r.fulfill({path:path.resolve('public',new URL(r.request().url()).pathname.slice(1))}));await p.goto(origin+'/native-shell/index.html');await p.evaluate(catalog=>LocalPartyHost.update({catalog,players:[{id:'a',name:'Taylor',connected:true}],leaderboard:[],votes:[],screens:1,native:{ready:true,catalogReady:true},selected:'push',tv:{mode:'none',focusNumber:1,total:catalog.length}}),require('../../lib/catalog'));await p.evaluate(()=>document.fonts.ready);await wait(600);
 const targets=await p.evaluate(()=>[...document.querySelectorAll('dialog')].map(d=>d.id));
 for(const id of targets){
 if(id==='qr'){await p.locator('.return-entry-help>summary').scrollIntoViewIfNeeded();await wait(250);}
 for(const mode of ['normal']){
  const label=`${engine}-${width}-${id}-${mode}`;
  await p.evaluate(({id,mode,label})=>{
   const target=id==='profile'?document.querySelector('#onboarding'):id==='qr'?document.querySelector('.return-entry-help'):document.getElementById(id);
   let badge=document.getElementById('qaMotionLabel');if(!badge){badge=document.createElement('div');badge.id='qaMotionLabel';badge.style='position:fixed;bottom:0;left:0;z-index:999999;color:white;background:#302440;font:10px monospace;pointer-events:none';document.body.append(badge);}badge.textContent=label;
   const open=()=>document.getElementById({hostPanel:'openHost',gameDetail:'choiceOpen',confirmDialog:'resetStats'}[id]).click();
   const close=()=>id==='profile'?document.querySelector('#profileCancel').click():id==='qr'?(target.open&&target.querySelector('summary').click()):target.close();
   const read=()=>{const s=getComputedStyle(target),r=target.getBoundingClientRect(),b=id==='profile'?getComputedStyle(document.querySelector('.profile-sheet-backdrop')):getComputedStyle(target,'::backdrop');return {visible:!target.hidden&&(id==='profile'?document.body.classList.contains('profile-editing'):id==='qr'||target.open),opacity:+s.opacity,y:r.y,height:r.height,translate:s.translate,transform:s.transform,backdrop:+b.opacity,backdropAnimation:b.animationName};};
   const data=window.__popupRun={label,frames:[],events:[]};const started=performance.now();
   const act=(name,fn)=>{data.events.push({name,t:performance.now()-started,before:read()});fn();data.events.at(-1).after=read();};
   const tick=t=>{data.frames.push({t:t-started,...read()});if(t-started<3400)requestAnimationFrame(tick);};requestAnimationFrame(tick);act('open',open);
   setTimeout(()=>act('close',close),mode==='interrupt'?65:mode==='reverse'?300:2500);
   if(mode==='reverse'){setTimeout(()=>act('reopen',open),365);setTimeout(()=>act('final-close',close),950);}
  },{id,mode,label});
  if(process.env.QA_SCREENSHOTS==='1'&&mode==='normal'){for(const t of [60,130,240]){await wait(t===60?60:t===130?70:110);await p.screenshot({path:path.join(out,label+'-'+t+'.png')});}}
  if(mode==='normal'){await wait(750);await p.screenshot({path:path.join(out,label+'.png')});if(id==='gameDetail'){
   const geometry=await p.evaluate(()=>{const d=document.querySelector('#gameDetail'),r=d.getBoundingClientRect(),buttons=[...d.querySelectorAll('.native-actions>button')].map(b=>{const q=b.getBoundingClientRect();return{x:q.x,y:q.y,right:q.right,height:q.height,overflow:b.scrollWidth>b.clientWidth+1}}),panels=[...d.querySelectorAll('.rule-row')].map(e=>{const q=e.getBoundingClientRect();return{left:q.left-r.left,right:r.right-q.right}});return{buttons,panels};});
   assert(geometry.buttons.every(b=>Math.abs(b.y-geometry.buttons[0].y)<1&&Math.abs(b.height-48)<1&&!b.overflow),'same row, equal height, no overflow');
   assert(geometry.panels.every(r=>r.left>=19&&r.right>=19),'panels need side padding');
   await p.evaluate(()=>document.querySelectorAll('#gameDetail details').forEach(d=>d.open=true));await wait(60);await p.screenshot({path:path.join(out,label+'-expanded.png')});
  }await wait(2750);}else await wait(1600);
  const row=await p.evaluate(()=>__popupRun);row.engine=engine;row.width=width;row.id=id;row.mode=mode;
  row.jumps=row.events.filter(e=>(e.name.includes('close')||e.name==='reopen')&&e.before.visible&&e.after.visible&&(Math.abs(e.after.opacity-e.before.opacity)>.12||Math.abs(e.after.backdrop-e.before.backdrop)>.12));report.rows.push(row);
  if(id!=='qr')assert(!row.frames.at(-1).visible,label+' did not close');
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 }
 }
 const video=p.video();await context.close();await video.saveAs(path.join(out,`${engine}-${width}.webm`));
}}finally{await browser.close();}}
report.ok=report.errors.length===0;report.jumps=report.rows.filter(r=>r.jumps.length).map(r=>r.label);assert.deepEqual(report.jumps,[],'discontinuous opacity on interruption');
}finally{child.kill();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}console.log(JSON.stringify({rows:report.rows.length,errors:report.errors,jumps:report.jumps}));})().catch(e=>{console.error(e);process.exitCode=1;});
