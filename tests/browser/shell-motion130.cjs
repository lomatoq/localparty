// Native-shell UI, real styles/scripts; only Swift snapshot transport is a fixture.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const engines=require(process.env.PARTY_PLAYWRIGHT||'playwright'),engine=process.env.QA_ENGINE||'webkit';
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/motion130');fs.mkdirSync(out,{recursive:true});
const files=['public/motion.js','public/motion.css','public/app.js','public/background-scene.css','public/native-shell/host.js'];
const hashes=()=>Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const report={method:engine+' native route with controller-bridge and persistent tabs; no physical-device claim',start:hashes(),rows:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EPHEMERAL:'1',PARTY_EMBEDDED:'1',PARTY_PORT:'0',PARTY_INTERNAL_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'motion130qa'}});let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await wait(40);
 assert(/localhost:(\d+)/.test(log),log);
 const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1],state=await(await fetch(origin+'/api/manage',{headers:{Authorization:'Bearer motion130qa'}})).json();
 browser=await engines[engine].launch({headless:true,...(process.env.QA_CHROMIUM?{executablePath:process.env.QA_CHROMIUM}:{})});
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===320?568:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
  await context.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fs.readFileSync('public/native-shell/controller-bridge.js','utf8')+'\nif(window===window.top){window.__partyPersistentTabs=true;'+fs.readFileSync('public/native-shell/tabs.js','utf8')+'\n}'});
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  await p.route('**/native-shell/**',r=>r.fulfill({path:path.resolve('public',new URL(r.request().url()).pathname.slice(1))}));
  await p.goto(origin+'/native-shell/index.html');
  await p.evaluate(s=>LocalPartyHost.update({...s,selected:null,screens:1,players:Array.from({length:16},(_,i)=>({id:'a'+i,name:'Person '+(i+1)})),native:{ready:true,catalogReady:true,buildLabel:'Motion fixture'}}),state);
  await p.evaluate(()=>document.fonts.ready);await wait(500);
  for(const y of [0,700]){
   await p.evaluate(y=>scrollTo(0,y),y);await wait(350);
   const backing=await p.locator('.native-stack-backing').evaluate(e=>({mask:getComputedStyle(document.querySelector('.native-stack-blur')).maskImage||getComputedStyle(document.querySelector('.native-stack-blur')).webkitMaskImage,blur:getComputedStyle(document.querySelector('.native-stack-blur')).backdropFilter||getComputedStyle(document.querySelector('.native-stack-blur')).webkitBackdropFilter,background:getComputedStyle(e).background,rect:JSON.stringify(e.getBoundingClientRect()),z:getComputedStyle(e).zIndex,ancestors:[e.parentElement,document.body].map(n=>({tag:n.tagName,transform:getComputedStyle(n).transform,contain:getComputedStyle(n).contain,z:getComputedStyle(n).zIndex}))}));
   assert(backing.mask.includes('gradient'));assert.equal(backing.blur,'blur(20px)');
   if(y&&width===393)console.log(await p.evaluate(()=>{const keys=['zIndex','position','opacity','visibility','display','transform','filter','isolation','willChange'];return ['main','.native-stack-backing','.native-stack-blur','.fresh-section'].map(q=>{const e=document.querySelector(q);return [q,e&&Object.fromEntries(keys.map(k=>[k,getComputedStyle(e)[k]]))]});}));
   const file=`native-host-${width}-${y?'scrolled':'initial'}.png`;await p.screenshot({path:path.join(out,file)});report.rows.push({width,y,file,backing});
  }
  const motion=await p.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms)),d=document.getElementById('confirmDialog');
   d.showModal();await wait(300);d.close();await wait(65);
   const closing={open:d.open,opacity:+getComputedStyle(d).opacity};d.showModal();const reversed=+getComputedStyle(d).opacity;await wait(250);
   const reopened={open:d.open,opacity:+getComputedStyle(d).opacity};d.close();await wait(260);
   const toast=document.getElementById('nativeToast');toast.textContent='Saved';LocalPartyDialogs.setVisible(toast,true);await wait(220);LocalPartyDialogs.setVisible(toast,false);await wait(55);
   const fading={hidden:toast.hidden,opacity:+getComputedStyle(toast).opacity};LocalPartyDialogs.setVisible(toast,true);await wait(220);const restored=!toast.hidden;LocalPartyDialogs.setVisible(toast,false);await wait(360);
   return {closing,reversed,reopened,closed:!d.open,fading,restored,toastHidden:toast.hidden,search:getComputedStyle(document.querySelector('#search'),'::placeholder').fontStyle};
  });
  report.rows.push({width,motion});
  assert(motion.closing.open&&motion.closing.opacity>0&&motion.closing.opacity<1);assert(Math.abs(motion.reversed-motion.closing.opacity)<.12);assert(motion.reopened.open&&motion.reopened.opacity>.99&&motion.closed);assert(!motion.fading.hidden&&motion.fading.opacity>0&&motion.fading.opacity<1&&motion.restored&&motion.toastHidden);assert.equal(motion.search,'italic');
  await p.evaluate(()=>LocalPartyTabs.select('host',false));await wait(350);
  const summary=p.locator('#hostPanel details.company>summary');await summary.click();await wait(260);await summary.click();await wait(60);
  const folding=await summary.evaluate(e=>({open:e.parentElement.open,animations:e.parentElement.getAnimations().length}));assert(folding.open&&folding.animations);await p.screenshot({path:path.join(out,`host-${width}-folding.png`)});await wait(250);assert.equal(await summary.evaluate(e=>e.parentElement.open),false);
  await summary.click();await wait(35);await summary.click();await wait(35);await summary.click();await wait(300);assert.equal(await summary.evaluate(e=>e.parentElement.open),true);
  await p.screenshot({path:path.join(out,`host-${width}-expanded.png`)});
  const overlay=await p.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms)),e=document.createElement('div');e.className='overlay';e.hidden=true;e.style.cssText='position:fixed;inset:10px;background:#211c2d;z-index:10000';document.body.append(e);await wait(30);e.hidden=false;await wait(300);e.hidden=true;await wait(45);
   const during={display:getComputedStyle(e).display,opacity:+getComputedStyle(e).opacity,pointer:getComputedStyle(e).pointerEvents};await wait(350);const after=getComputedStyle(e).display;e.remove();return {during,after};
  });report.rows.push({width,overlay});assert.notEqual(overlay.during.display,'none');assert.equal(overlay.during.pointer,'none');assert(overlay.during.opacity>0&&overlay.during.opacity<1);assert.equal(overlay.after,'none');
  await p.emulateMedia({reducedMotion:'reduce'});
  assert(await p.evaluate(()=>{const d=document.getElementById('confirmDialog');d.showModal();d.close();return !d.open;}),'reduced motion closes synchronously');
  await context.close();
 }
 assert.deepEqual(report.errors,[]);report.end=hashes();assert.deepEqual(report.start,report.end);report.ok=true;
 }catch(e){report.failure=e.stack;process.exitCode=1;}finally{report.end=hashes();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();console.log(JSON.stringify(report));}})();
