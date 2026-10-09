'use strict';
// Matched browser diagnostic: shipped actions and source-frozen runtime.
// Native transport is a labelled state/bridge fixture, never a device/cast claim.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawn,execFileSync}=require('node:child_process');
const pw=require('playwright'),catalog=require('../lib/catalog');
const frozen=path.resolve('.localparty-build/popup246/source-before'),out=path.resolve(process.env.QA_OUTPUT||'output/playwright/performance246/popups'),engine=process.env.QA_ENGINE||'chromium';
const beforeRef=process.env.QA_BEFORE_REF||'db5e4f4',beforeCommit=execFileSync('git',['rev-parse',beforeRef+'^{commit}'],{encoding:'utf8'}).trim();
const marker=path.join(frozen,'.baseline-commit');
if(!fs.existsSync(marker)||fs.readFileSync(marker,'utf8').trim()!==beforeCommit){
 fs.rmSync(frozen,{recursive:true,force:true});fs.mkdirSync(frozen,{recursive:true});
 const files=execFileSync('git',['ls-tree','--name-only','-r',beforeCommit,'--','public'],{encoding:'utf8'}).trim().split('\n').filter(f=>/\.(?:html|css|js)$/.test(f));
 for(const file of files){const target=path.join(frozen,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,execFileSync('git',['show',beforeCommit+':'+file]));}
 fs.writeFileSync(marker,beforeCommit+'\n');
}
fs.mkdirSync(out,{recursive:true});const owned=['public/app-ux-20261005.js','public/app-ux-20261005.css','public/game-ui-system.js','public/game-ui-system.css'];
const candidate=Object.fromEntries(owned.map(f=>[f,fs.readFileSync(f)]));
const report={method:'Source-frozen before/candidate; actual popup actions on /play and native shell. Native state/rooms/bridge are fixtures. CPU is accumulated browser work, first visual and cleanup are browser event timings. No phone, keyboard or cast acceptance.',beforeCommit,engine,sources:Object.fromEntries(owned.map(f=>[f,{before:crypto.createHash('sha256').update(fs.readFileSync(path.join(frozen,f))).digest('hex'),candidate:crypto.createHash('sha256').update(candidate[f]).digest('hex')}])),rows:[],errors:[],checks:[],captures:[]};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const profileFile=path.join(out,'profiles.json');fs.writeFileSync(profileFile,'{}');
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'0',PARTY_DATA_FILE:profileFile,PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'popup246'}});let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const initProbe=()=>{
 window.__probe246={reads:0,hiddenReads:0,mutations:0,inkWrites:0,styles:0};
 const raw=getComputedStyle;window.getComputedStyle=function(node,...args){__probe246.reads++;if(node?.closest?.('dialog:not([open]),[hidden]'))__probe246.hiddenReads++;return raw.call(window,node,...args)};
 new MutationObserver(records=>{__probe246.mutations+=records.length;for(const r of records){if(r.target.nodeType===1&&r.target.matches('.hp-input-ink')){if(r.type==='childList')__probe246.inkWrites++;if(r.attributeName==='style')__probe246.styles++;}}}).observe(document,{childList:true,subtree:true,attributes:true,characterData:true});
 window.__reset246=()=>{for(const k of Object.keys(__probe246))__probe246[k]=0;};
 window.__arm246=(selector,kind)=>{
  const node=document.querySelector(selector);assertNode(node);const record=window.__response246={selector,kind,down:null,click:null,firstVisual:null,cleanup:null,settled:null,samples:0};
  document.addEventListener('pointerdown',()=>{record.down=performance.now();},{once:true,capture:true});
  document.addEventListener('click',()=>{record.click=performance.now();},{once:true,capture:true});
  const target=()=>selector==='#onboarding'?document.querySelector('#onboarding'):document.querySelector(selector);
  requestAnimationFrame(function scan(t){if(!record.click){requestAnimationFrame(scan);return;}const p=target(),s=p&&getComputedStyle(p),r=p?.getBoundingClientRect();record.samples++;
   const displayed=p&&(p.tagName==='DIALOG'?p.open:p.matches('[popover]')?p.matches(':popover-open'):!p.hidden)&&s.display!=='none';
   if(kind==='open'&&displayed&&r.width&&r.height&&r.bottom>0&&r.top<innerHeight&&Number(s.opacity)>.01&&!record.firstVisual)record.firstVisual=t-record.click;
   if(kind==='close'&&!displayed&&!document.body.hasAttribute('data-hp-modal-present')&&!document.querySelector('[data-hp-modal-background]')){record.cleanup=t-record.click;record.settled=record.cleanup;return;}
   if(kind==='open'&&record.firstVisual){const running=p.getAnimations({subtree:true}).filter(a=>a.playState!=='finished'&&a.playState!=='idle'&&a.effect.getComputedTiming().iterations!==Infinity);if(!running.length){record.settled=t-record.click;return;}}
   if(t-record.click>3000){record.timeout=true;return;}requestAnimationFrame(scan);
  });
 };
 function assertNode(n){if(!n)throw Error('Missing traced popup');}
};
const state={catalog,players:[{id:'p',name:'Taylor',connected:true}],leaderboard:[],votes:[],selected:'push',screens:1,native:{ready:true,catalogReady:true,working:false,externalDisplays:1}};
const rooms=[{id:'own',own:true,name:'Friday night',players:1,game:'Lobby',connected:true},{id:'friend',name:'Friends on Wi-Fi',players:4,game:'Pocket Strike'}];
(async()=>{let browser;try{
 for(let n=0;n<300&&!/localhost:(\d+)/.test(log);n++)await wait(50);assert(/localhost:(\d+)/.test(log),log);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 browser=await pw[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
 const modes=process.env.QA_MODE?[process.env.QA_MODE]:['native','web'];
 for(let pair=0;pair<Number(process.env.QA_PAIRS||1);pair++)for(const variant of ['before','candidate'])for(const mode of modes){
  const ctx=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  await ctx.route('**/*',route=>{const pathname=new URL(route.request().url()).pathname,file='public'+pathname;const old=path.join(frozen,file);if(variant==='candidate'&&candidate[file])return route.fulfill({body:candidate[file],contentType:file.endsWith('.css')?'text/css':'application/javascript'});if(fs.existsSync(old)&&fs.statSync(old).isFile())return route.fulfill({path:old});return route.continue();});
  await ctx.addInitScript(initProbe);
  if(mode!=='web')await ctx.addInitScript({content:"window.__messages=[];window.webkit={messageHandlers:{partyShell:{postMessage(m){__messages.push(m)}}}};"+fs.readFileSync(path.join(frozen,'public/native-shell/visibility.js'),'utf8')+'\nwindow.__partyPersistentTabs=true;'+(mode==='controller'?fs.readFileSync(path.join(frozen,'public/native-shell/controller-bridge.js'),'utf8')+'\n':'')+fs.readFileSync(path.join(frozen,'public/native-shell/tabs.js'),'utf8')});
  const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push({mode,variant,pair,error:e.message}));
  await p.goto(origin+(mode==='native'?'/native-shell/index.html':'/play'));await p.evaluate(()=>document.fonts.ready);
  if(mode==='native'){await p.evaluate(s=>{window.__state246=s;LocalPartyHost.update(s)},state);await p.addScriptTag({url:'/native-shell/nearby-rooms.js'});await p.evaluate(r=>LocalPartyRooms.update(r,'own'),rooms);}
  else{await p.locator('#name').fill('Popup QA');await p.locator('#joinForm button[type=submit]').tap();await p.locator('#home').waitFor({state:'visible'});}
  await wait(1200);
  let session;if(engine==='chromium'){session=await ctx.newCDPSession(p);await session.send('Performance.enable');}
  const metrics=async()=>session?Object.fromEntries((await session.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value])):{};
  const paths=mode==='native'?[['host','#openHost','#hostPanel','[data-close=hostPanel]'],['rooms','#nearbyToggle','#nearbyDialog','#nearbyClose'],['rules','#choiceName','#gameDetail','[data-close=gameDetail]'],['bots','#choiceStart','#startBots','#startBotsClose']]:[['profile','#editFromCatalog','#onboarding','#profileCancel'],['rules','.guest-info','#rulesDialog','#closeRules'],['players','#roomToggle','#roomDialog','#closeRoom'],['rankings','#showStats','#statsDialog','#closeStats']];
  for(const [name,opener,popup,closer]of paths.filter(row=>!process.env.QA_PATHS||process.env.QA_PATHS.split(',').includes(row[0]))){
   // Warm actual DOM/content before the matched repetitions; report cold once.
   const cycles=Number(process.env.QA_CYCLES||4);
   for(let n=0;n<cycles+1;n++){
    const visible=await p.locator(opener).first().isVisible();if(visible)await p.locator(opener).first().scrollIntoViewIfNeeded();await wait(80);await p.evaluate(()=>__reset246());const start=await metrics();const underBefore=await p.evaluate(()=>[...document.querySelectorAll('#home,#catalogSection,.guest-catalog-tools input[type=search],.game-spotlight,.guest-pick')].map(n=>{const r=n.getBoundingClientRect();return{id:n.id||n.className,hidden:!!n.closest('[hidden]'),display:getComputedStyle(n).display,rect:{x:r.x,y:r.y,width:r.width,height:r.height}};}));
    await p.evaluate(popup=>__arm246(popup,'open'),popup);if(visible)await p.locator(opener).first().tap();else await p.locator(opener).first().evaluate(n=>n.click());await p.waitForFunction(()=>__response246.settled!==null||__response246.timeout,{},{timeout:4000});
    const opening=await p.evaluate(()=>__response246);assert(!opening.timeout,name+' opening timed out '+JSON.stringify(opening));
    // Preserve the actual backdrop blur, material and unhidden foreground.
    const visual=await p.evaluate(popup=>{const d=document.querySelector(popup);return{background:getComputedStyle(d).background,filter:getComputedStyle(d).filter,blur:[...document.querySelectorAll('[data-hp-modal-background]')].map(n=>getComputedStyle(n).filter),blurBranches:[...document.querySelectorAll('[data-hp-modal-background]')].map(n=>{const r=n.getBoundingClientRect();return{node:n.id||n.tagName+'.'+n.className,rect:{x:r.x,y:r.y,width:r.width,height:r.height},filter:getComputedStyle(n).filter};}),active:document.body.hasAttribute('data-hp-modal-active')};},popup);assert(visual.active&&visual.blur.some(v=>v.includes('blur(8px)')),name+' actual background blur');
    assert(visual.background.includes('linear-gradient(')&&visual.background.includes('0.93'),name+' shared 93% material');
    const openEnd=await metrics(),probeOpen=await p.evaluate(()=>({...__probe246}));
    const underAfter=await p.evaluate(()=>[...document.querySelectorAll('#home,#catalogSection,.guest-catalog-tools input[type=search],.game-spotlight,.guest-pick')].map(n=>{const r=n.getBoundingClientRect();return{id:n.id||n.className,hidden:!!n.closest('[hidden]'),display:getComputedStyle(n).display,rect:{x:r.x,y:r.y,width:r.width,height:r.height}};}));
    if(name==='profile'){assert(await p.evaluate(()=>document.body.classList.contains('profile-editing')&&document.querySelector('#onboarding').getAttribute('role')==='dialog'),'Existing profile edit, not initial onboarding');assert(underAfter.length&&underAfter.every(n=>!n.hidden&&n.display!=='none'),'Existing profile retains all catalogue/search/spotlight controls');assert.deepEqual(underAfter.map(n=>n.rect),underBefore.map(n=>n.rect),'Existing profile preserves background geometry');}
    if(pair===0&&variant==='candidate'&&n===0){const file=engine+'-'+mode+'-'+name+'.png';await p.screenshot({path:path.join(out,file)});report.captures.push(file);}
    await p.evaluate(()=>__reset246());const closeStart=await metrics();await p.evaluate(popup=>__arm246(popup,'close'),popup);await p.locator(closer).tap();await p.waitForFunction(()=>__response246.settled!==null||__response246.timeout,{},{timeout:4000});const closing=await p.evaluate(()=>__response246),closeEnd=await metrics(),probeClose=await p.evaluate(()=>({...__probe246}));assert(!closing.timeout,name+' close timed out '+JSON.stringify(closing));
    const delta=(a,b)=>Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'].map(k=>[k,session?(b[k]||0)-(a[k]||0):null]));
    report.rows.push({engine,pair,variant,mode,name,cycle:n,cold:n===0,programmaticOpener:!visible,opening,closing,visual,underBefore,underAfter,probeOpen,probeClose,openCPU:delta(start,openEnd),closeCPU:delta(closeStart,closeEnd)});
    fs.writeFileSync(path.join(out,engine+'-report.json'),JSON.stringify(report,null,2));await wait(120);
   }
   console.log(JSON.stringify({pair,variant,mode,name,cycles:report.rows.filter(r=>r.pair===pair&&r.variant===variant&&r.mode===mode&&r.name===name).map(r=>({firstVisual:r.opening.firstVisual,settled:r.opening.settled,cleanup:r.closing.cleanup,task:r.openCPU.TaskDuration===null?null:r.openCPU.TaskDuration+r.closeCPU.TaskDuration,hidden:r.probeOpen.hiddenReads+r.probeClose.hiddenReads,ink:r.probeOpen.inkWrites+r.probeClose.inkWrites}))}));
  }
  await ctx.close();
 }
 assert.deepEqual(report.errors,[]);report.ok=true;
 }finally{await browser?.close();child.kill();fs.writeFileSync(path.join(out,engine+'-report.json'),JSON.stringify(report,null,2));}
})().catch(e=>{report.failure=e.stack;fs.writeFileSync(path.join(out,engine+'-report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1});
