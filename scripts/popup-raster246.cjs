'use strict';
// Read-only Chrome experiment. Static-blur is injected into a browser fixture,
// never into production files. Trace and LayerTree are not iPhone GPU evidence.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {chromium}=require('playwright');
const {viewportBackdrop}=require('./popup-backdrop246-fixture.cjs');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/performance246/popup-raster');fs.mkdirSync(out,{recursive:true});
const before=path.resolve('.localparty-build/popup246/source-before/public'),current=new Map();
function collect(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,entry.name);if(entry.isDirectory())collect(f);else if(/\.(?:js|css|html)$/.test(f))current.set(path.relative('public',f),fs.readFileSync(f));}}collect('public');
const report={method:'Chrome actual native-controller Rooms tap with native state/transport fixture. Source-snapshotted baseline/current/static-blur. Layer bounds are compositing geometry, not allocated GPU memory. Trace instrumented; no device/cast acceptance.',sources:Object.fromEntries(['app-ux-20261005.js','app-ux-20261005.css','game-ui-system.js','game-ui-system.css'].map(f=>[f,crypto.createHash('sha256').update(current.get(f)).digest('hex')])),variants:[],errors:[]};
const profiles=path.join(out,'profiles.json');fs.writeFileSync(profiles,'{}');let log='';
const server=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_DATA_FILE:profiles,PARTY_PORT:'0',PARTY_INTERNAL_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_EMBEDDED:'0',PARTY_ADMIN_KEY:'raster246'}});server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const rooms=[{id:'own',own:true,name:'Friday night',players:1,game:'Lobby',connected:true},{id:'friend',name:'Friends on Wi-Fi',players:4,game:'Pocket Strike'}];
function probe(){
 window.__raster246={samples:[],longtasks:[],frames:[],stage:'idle',active:false};
 new PerformanceObserver(list=>{for(const e of list.getEntries())__raster246.longtasks.push({start:e.startTime,duration:e.duration,stage:__raster246.stage});}).observe({type:'longtask',buffered:true});
 window.__stage246=name=>{__raster246.stage=name;performance.mark('hp246-'+name);};
 window.__sample246=()=>{__raster246.active=true;let last=0;requestAnimationFrame(function tick(t){if(!__raster246.active)return;const d=document.querySelector('#nearbyDialog'),r=d?.getBoundingClientRect(),s=d&&getComputedStyle(d);__raster246.samples.push({t,stage:__raster246.stage,open:!!d?.open,closing:!!d?.classList.contains('lp-dialog-closing'),opacity:s?.opacity,rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,present:document.body.hasAttribute('data-hp-modal-present'),active:document.body.hasAttribute('data-hp-modal-active'),blur:[...document.querySelectorAll('[data-hp-modal-background]')].map(n=>({id:n.id||n.tagName,filter:getComputedStyle(n).filter,transition:getComputedStyle(n).transitionProperty}))});if(last)__raster246.frames.push({t,stage:__raster246.stage,dt:t-last});last=t;requestAnimationFrame(tick);});};
}
function sumTrace(events){const names=/^(?:RasterTask|Paint|PrePaint|UpdateLayoutTree|Layout|CompositeLayers|DrawFrame|BeginMainThreadFrame|RunTask|Commit|ActivateLayerTree|Layerize|UpdateLayerTree)$/;const totals={};for(const e of events)if(e.ph==='X'&&names.test(e.name)){const x=totals[e.name]||(totals[e.name]={count:0,totalMs:0,maxMs:0});x.count++;x.totalMs+=(e.dur||0)/1000;x.maxMs=Math.max(x.maxMs,(e.dur||0)/1000);}return totals;}
(async()=>{let browser;try{
 for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await wait(50);assert(/localhost:(\d+)/.test(log),log);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 for(const variant of (process.env.QA_VARIANTS||'before,current,static-blur').split(',')){
  const ctx=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  const source=f=>{const b=variant==='before'&&fs.existsSync(path.join(before,f))?fs.readFileSync(path.join(before,f)):current.get(f);return b&&variant==='viewport-backdrop'?viewportBackdrop(f,b):b;};
  // /play HTML is server-injected with the player role. Do not replace that
  // response with raw index.html, which would create the wrong host fixture.
  await ctx.route('**/*',r=>{const u=new URL(r.request().url()),f=u.pathname.slice(1);const b=source(f);if(b)return r.fulfill({body:b,contentType:f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':'application/javascript'});return r.continue();});
  await ctx.addInitScript({content:"window.__messages=[];window.webkit={messageHandlers:{partyShell:{postMessage(m){__messages.push(m)}}}};"+source('native-shell/visibility.js')+'\nwindow.__partyPersistentTabs=true;'+source('native-shell/controller-bridge.js')+'\n'+source('native-shell/tabs.js')});
  await ctx.addInitScript(probe);const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push({variant,error:e.message}));await p.goto(origin+'/play');await p.evaluate(()=>document.fonts.ready);await wait(600);await p.locator('#name').fill('Raster QA');await p.waitForFunction(()=>!document.querySelector('#joinForm button[type=submit]').disabled);const join=await p.locator('#joinForm button[type=submit]').boundingBox();await p.touchscreen.tap(join.x+join.width/2,join.y+join.height/2);await p.locator('#home').waitFor({state:'visible'});
  await p.addScriptTag({url:'/native-shell/nearby-rooms.js'});await p.evaluate(r=>LocalPartyRooms.update(r,'own'),rooms);
  if(variant==='static-blur')await p.addStyleTag({content:'html body [data-hp-modal-background]{transition:none!important}'});
  await wait(1000);assert(await p.locator('#nearbyToggle').isVisible(),'Actual Rooms opener');
  const cdp=await ctx.newCDPSession(p);await cdp.send('DOM.enable');let stage='idle',layers=[],changes=[],painted=[];cdp.on('LayerTree.layerTreeDidChange',e=>{layers=e.layers||[];if(changes.length<1500)changes.push({stage,layers});});cdp.on('LayerTree.layerPainted',e=>{if(painted.length<10000)painted.push({stage,...e});});await cdp.send('LayerTree.enable');await wait(100);
  const baselineGeometry=await p.evaluate(()=>[...document.querySelectorAll('#home,#catalogSection,.game-spotlight,.guest-pick,.guest-catalog-tools input[type=search]')].map(n=>{const r=n.getBoundingClientRect();return{id:n.id||n.className,hidden:!!n.closest('[hidden]'),display:getComputedStyle(n).display,rect:{x:r.x,y:r.y,width:r.width,height:r.height}};}));
  const events=[];cdp.on('Tracing.dataCollected',e=>events.push(...e.value));const done=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));
  await cdp.send('Tracing.start',{categories:'devtools.timeline,blink.user_timing,cc,gpu,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.layers,disabled-by-default-devtools.screenshot',options:'record-as-much-as-possible',transferMode:'ReportEvents',screenshotMaxSize:500,screenshotMaxCount:240});
  await p.evaluate(()=>__sample246());await wait(300);
  const cycles=[];
  for(let cycle=0;cycle<Number(process.env.QA_CYCLES||2);cycle++){
   stage='open-'+cycle;await p.evaluate(s=>__stage246(s),stage);await p.locator('#nearbyToggle').tap();await wait(700);
   const visual=await p.evaluate(()=>{const d=document.querySelector('#nearbyDialog'),back=getComputedStyle(d,'::backdrop');return{background:getComputedStyle(d).background,backdrop:{blur:back.backdropFilter||back.webkitBackdropFilter,opacity:back.opacity},blur:[...document.querySelectorAll('[data-hp-modal-background]')].map(n=>{const r=n.getBoundingClientRect();return{id:n.id||n.tagName,rect:{x:r.x,y:r.y,width:r.width,height:r.height},filter:getComputedStyle(n).filter,transition:getComputedStyle(n).transition};}),under:[...document.querySelectorAll('#home,#catalogSection,.game-spotlight,.guest-pick,.guest-catalog-tools input[type=search]')].map(n=>{const r=n.getBoundingClientRect();return{id:n.id||n.className,hidden:!!n.closest('[hidden]'),display:getComputedStyle(n).display,rect:{x:r.x,y:r.y,width:r.width,height:r.height}};})};});assert(visual.background.includes('0.93'));assert(variant==='viewport-backdrop'?visual.backdrop.blur==='blur(8px)':visual.blur.some(n=>n.filter==='blur(8px)'));assert.deepEqual(visual.under,baselineGeometry,'Underlying controls retain geometry');
   stage='settled-'+cycle;await p.evaluate(s=>__stage246(s),stage);await wait(350);cycles.push({cycle,visual});
   stage='close-'+cycle;await p.evaluate(s=>__stage246(s),stage);await p.locator('#nearbyClose').tap();await p.waitForFunction(()=>!nearbyDialog.open&&!document.body.hasAttribute('data-hp-modal-present')&&!document.querySelector('[data-hp-modal-background]'));stage='cleaned-'+cycle;await p.evaluate(s=>__stage246(s),stage);await wait(300);
  }
  await p.evaluate(()=>__raster246.active=false);await cdp.send('Tracing.end');const complete=await done;assert(!complete.dataLossOccurred,'Trace buffer must not lose data');
  fs.writeFileSync(path.join(out,variant+'-trace.json'),JSON.stringify({traceEvents:events}));
  const largest=new Map();for(const change of changes)for(const l of change.layers)if(l.drawsContent){const existing=largest.get(l.layerId);if(!existing||l.width*l.height>existing.layer.width*existing.layer.height)largest.set(l.layerId,{stage:change.stage,layer:l});}
  const layerDetails=[];for(const item of [...largest.values()].sort((a,b)=>b.layer.width*b.layer.height-a.layer.width*a.layer.height).slice(0,12)){const l=item.layer;let node=null,reasons=null;try{if(l.backendNodeId)node=(await cdp.send('DOM.describeNode',{backendNodeId:l.backendNodeId})).node;}catch{}try{reasons=await cdp.send('LayerTree.compositingReasons',{layerId:l.layerId});}catch{}layerDetails.push({...item,node:node?{nodeName:node.nodeName,attributes:node.attributes}:null,reasons});}
  const samples=await p.evaluate(()=>__raster246);const marks=events.filter(e=>e.name?.startsWith('hp246-'));const shots=events.filter(e=>e.name==='Screenshot'&&e.args?.snapshot);const frameFiles=[];for(let i=0;i<shots.length;i++){const shot=shots[i],file=variant+'-frame-'+String(i).padStart(3,'0')+'.jpg';fs.writeFileSync(path.join(out,file),Buffer.from(shot.args.snapshot,'base64'));frameFiles.push({file,ts:shot.ts,phase:marks.filter(m=>m.ts<=shot.ts).at(-1)?.name||'idle'});}
  const row={variant,cycles,samples,painted,layerChanges:changes.length,layerDetails,traceSummary:sumTrace(events),traceEventNames:[...new Set(events.map(e=>e.name))].filter(n=>/raster|paint|frame|layer|filter/i.test(n)),frameFiles};report.variants.push(row);
  fs.writeFileSync(path.join(out,variant+'-layers.json'),JSON.stringify({changes,painted},null,2));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({variant,layers:changes.length,paints:painted.length,shots:shots.length,trace:row.traceSummary,longtasks:samples.longtasks}));await ctx.close();
 }
 assert.deepEqual(report.errors,[]);report.ok=true;
 }finally{await browser?.close();server.kill();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
})().catch(e=>{report.failure=e.stack;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1});
