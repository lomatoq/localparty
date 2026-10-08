'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn,execFileSync}=require('node:child_process');
const engines=require(process.env.PARTY_PLAYWRIGHT||'playwright'),engine=process.env.QA_ENGINE||'webkit';
const {PNG}=require('pngjs');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/shell-header-fade-2026-10-04');fs.mkdirSync(out,{recursive:true});
const files=['public/background-scene.css','public/branding.css','public/native-shell/host.css','public/native-shell/host.js','public/native-shell/tabs.js','public/native-shell/controller-bridge.js'];
const hashes=()=>Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const baseline=process.env.QA_BASELINE?fs.readFileSync(process.env.QA_BASELINE,'utf8'):execFileSync('git',['show','HEAD:public/background-scene.css'],{encoding:'utf8'});
const report={method:`Real isolated server/controller UI and shipped native pages in ${engine}; native Swift snapshot transport fixture only. Viewport emulation, not physical safe-area/hardware proof.`,start:hashes(),baselineHash:crypto.createHash('sha256').update(baseline).digest('hex'),rows:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EPHEMERAL:'1',PARTY_EMBEDDED:'1',PARTY_PORT:'0',PARTY_INTERNAL_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'headfadeqa'}});let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<300;i++){if(await fn())return;await wait(40);}throw Error('Timeout '+log.slice(-300));}
async function blurProbe(p,surface){
 const on=PNG.sync.read(await p.screenshot({path:path.join(out,surface+'-393-blur-on.png')}));const offStyle=await p.addStyleTag({content:'html body header#brandHeader#brandHeader#brandHeader#brandHeader::before,html:root body.native-shell>.native-stack-blur,html:root body.native-shell>.native-stack-backing.native-stack-backing,html:root body.native-shell main>.native-stack-backing.native-stack-backing::before,html:root body.native-shell.native-host-tab #hostPanel#hostPanel .native-sheet-head::before{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'});
 const disabled=await p.evaluate(()=>['#brandHeader','.native-stack-backing','.native-stack-blur','#hostPanel .native-sheet-head'].flatMap(selector=>Array.from(document.querySelectorAll(selector)).flatMap(e=>[getComputedStyle(e).backdropFilter||getComputedStyle(e).webkitBackdropFilter,getComputedStyle(e,'::before').backdropFilter||getComputedStyle(e,'::before').webkitBackdropFilter])));
 assert(disabled.every(v=>v==='none'),'pixel probe really disables every sampling layer');
 const off=PNG.sync.read(await p.screenshot({path:path.join(out,surface+'-393-blur-off.png')}));let changed=0;
 for(let y=0;y<Math.min(on.height,360);y++)for(let x=0;x<on.width;x++){const i=(y*on.width+x)*4;const d=Math.abs(on.data[i]-off.data[i])+Math.abs(on.data[i+1]-off.data[i+1])+Math.abs(on.data[i+2]-off.data[i+2]);if(d>3)changed++;}
 (report.blurPixelProbes??=[]).push({surface,changedPixels:changed});await offStyle.evaluate(e=>e.remove());
 if(engine==='chromium')assert(changed>1000,'actual live header backdrop changes pixels independently of tint');
}
async function paint(p){return p.evaluate(()=>{const e=document.querySelector('#brandHeader'),r=e.getBoundingClientRect(),b=document.querySelector('.native-stack-backing'),c=getComputedStyle(e),style=n=>{const s=getComputedStyle(n);return{background:s.background,filter:s.filter,backdrop:s.backdropFilter||s.webkitBackdropFilter,mask:s.maskImage||s.webkitMaskImage,display:s.display}},pseudo=k=>{const s=getComputedStyle(e,k);return{background:s.background,backdrop:s.backdropFilter||s.webkitBackdropFilter,mask:s.maskImage||s.webkitMaskImage,display:s.display,top:s.top,bottom:s.bottom,height:s.height,transition:s.transitionDuration}};return{width:innerWidth,scrollY,safeTop:getComputedStyle(document.documentElement).getPropertyValue('--safe-top'),header:{x:r.x,y:r.y,width:r.width,height:r.height,background:c.background,filter:c.filter,backdrop:c.backdropFilter||c.webkitBackdropFilter,pointer:c.pointerEvents},before:pseudo('::before'),after:pseudo('::after'),stack:b?{hidden:b.hidden,paint:style(b),blur:document.querySelector('.native-stack-blur')?style(document.querySelector('.native-stack-blur')):style(b),before:stylePseudo(b,'::before'),after:stylePseudo(b,'::after')}:null,body:document.body.className};function stylePseudo(n,k){const s=getComputedStyle(n,k);return{background:s.background,backdrop:s.backdropFilter||s.webkitBackdropFilter,mask:s.maskImage||s.webkitMaskImage,display:s.display}}});}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log));const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];const state=await(await fetch(origin+'/api/manage',{headers:{Authorization:'Bearer headfadeqa'}})).json();browser=await engines[engine].launch({headless:true,...(process.env.QA_CHROMIUM?{executablePath:process.env.QA_CHROMIUM}:{})});
 for(const width of [393,320])for(const surface of (process.env.QA_HOST_PANEL_ONLY?['native-host']:['controller','native-controller','native-host']))for(const variant of (process.env.QA_HOST_PANEL_ONLY?['after']:['before','after'])){
  const context=await browser.newContext({viewport:{width,height:width===320?568:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  if(surface!=='controller')await context.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fs.readFileSync('public/native-shell/controller-bridge.js','utf8')+'\nif(window===window.top){window.__partyPersistentTabs=true;'+fs.readFileSync('public/native-shell/tabs.js','utf8')+'\n}'});
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.route('**/native-shell/**',r=>r.fulfill({path:path.resolve('public',new URL(r.request().url()).pathname.slice(1))}));
  if(variant==='before')await p.route('**/background-scene.css',r=>r.fulfill({body:baseline,contentType:'text/css'}));
  if(surface==='native-host'){
   await p.goto(origin+'/native-shell/index.html');await p.evaluate(s=>LocalPartyHost.update({...s,selected:null,screens:1,players:Array.from({length:16},(_,i)=>({id:'a'+i,name:'Person '+(i+1)})),native:{ready:true,catalogReady:true,buildLabel:'Header fixture'}}),state);
  }else{
   await p.goto(origin+'/play');await p.locator('#name').fill('Header '+surface+' '+width+' '+variant);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();
  }
  await p.evaluate(()=>document.fonts.ready);await wait(700);
  for(const scrolled of (process.env.QA_HOST_PANEL_ONLY?[]:[false,true])){
   await p.evaluate(y=>scrollTo(0,y),scrolled?700:0);await wait(700);const m=await paint(p);const file=`${surface}-${width}-${variant}-${scrolled?'scrolled':'initial'}.png`;await p.screenshot({path:path.join(out,file)});report.rows.push({surface,width,variant,scrolled,file,paint:m});
   assert(m.header.width<=width+1&&m.header.x>=-1);assert.equal(m.header.filter,'none');assert.equal(m.header.backdrop,'none');
   if(variant==='after'){
    const layer=surface==='native-host'&&m.stack&&!m.stack.hidden?m.stack:m;
    const sample=layer===m?layer.before:layer.blur;
    assert.equal(sample.backdrop,'blur(20px)');assert(sample.mask.includes('gradient'));if(layer===m){assert.equal(layer.after.backdrop,'none');assert.equal(layer.after.mask,'none');assert(layer.after.background.includes('gradient'));}else{assert(layer.paint.background.includes('gradient'));}assert(m.header.background.includes('rgba(0, 0, 0, 0)'));
   }
  }
  if(surface==='native-host'&&variant==='after'){
   if(width===393)await blurProbe(p,'native-host-stack');
   await p.evaluate(()=>{scrollTo(0,0);LocalPartyTabs.select('host',false)});await p.locator('#hostPanel').waitFor();await wait(700);
   for(const scrolled of [false,true]){await p.locator('#hostPanelBody').evaluate((e,y)=>e.scrollTop=y,scrolled?600:0);await wait(700);const file=`native-host-panel-${width}-${scrolled?'scrolled':'initial'}.png`;await p.screenshot({path:path.join(out,file)});const m=await paint(p);report.rows.push({surface:'native-host-panel',width,variant,scrolled,file,paint:m,bodyScroll:await p.locator('#hostPanelBody').evaluate(e=>({top:e.scrollTop,client:e.clientHeight,height:e.scrollHeight}))});assert.equal(m.before.backdrop,'blur(20px)');const title=await p.locator('#hostPanel .native-sheet-head').evaluate(e=>({filter:getComputedStyle(e).filter,blur:getComputedStyle(e,'::before').backdropFilter||getComputedStyle(e,'::before').webkitBackdropFilter,tint:getComputedStyle(e,'::after').backgroundImage}));assert.equal(title.filter,'none');assert.equal(title.blur,'blur(20px)');assert(title.tint.includes('gradient'));}
  }
  if(surface==='native-controller'&&width===320&&variant==='after'){
   await p.addStyleTag({content:'html body header#brandHeader#brandHeader#brandHeader#brandHeader::before,html body header#brandHeader#brandHeader#brandHeader#brandHeader::after{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'});await wait(700);const m=await paint(p);const file='native-controller-320-no-backdrop-fallback.png';await p.screenshot({path:path.join(out,file)});report.rows.push({surface,width,variant:'disabled-filter-fallback',file,paint:m});assert.equal(m.before.backdrop,'none');assert(m.after.background.includes('gradient'));
  }
  if(variant==='after'&&width===393){
   await p.evaluate(()=>{scrollTo(0,700);if(document.body.classList.contains('native-host-tab'))document.getElementById('hostPanelBody').scrollTop=600;});await wait(250);
   await blurProbe(p,surface==='native-host'?'native-host-panel':surface);
  }
  await context.close();
 }
 for(const row of report.rows.filter(r=>r.variant==='after'&&['controller','native-controller','native-host'].includes(r.surface))){const prior=report.rows.find(r=>r.surface===row.surface&&r.width===row.width&&r.variant==='before'&&r.scrolled===row.scrolled);if(prior)assert.deepEqual(row.paint.header,prior.paint.header,'paint change preserves header geometry and foreground style');}
 const control=await browser.newPage({viewport:{width:393,height:250}});await control.setContent('<style>body{margin:0;background:repeating-linear-gradient(90deg,#fff 0 8px,#151321 8px 16px)}.glass{position:fixed;inset:0 0 100px;background:#15132120;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}</style><div class=glass></div>');await wait(150);const on=await control.screenshot({path:path.join(out,'plain-control-blur-on.png')});await control.addStyleTag({content:'.glass{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'});const off=await control.screenshot({path:path.join(out,'plain-control-blur-off.png')});report.plainControlPixelIdentical=on.equals(off);await control.close();if(engine==='chromium')assert(!report.plainControlPixelIdentical,'plain engine control really renders backdrop blur');
 assert.deepEqual(report.errors,[]);report.end=hashes();assert.deepEqual(report.start,report.end);report.ok=true;console.log(JSON.stringify({ok:true,rows:report.rows.length,errors:report.errors}));
 }catch(e){report.failure=e.message;throw e;}finally{report.end=hashes();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
