// Native-shell UI, real styles/scripts; only Swift snapshot transport is a fixture.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const engines=require(process.env.PARTY_PLAYWRIGHT||'playwright'),engine=process.env.QA_ENGINE||'webkit';
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/return131/phone');fs.mkdirSync(out,{recursive:true});
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
  await context.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(m){(window.__commands ||= []).push(m)}}}};'+fs.readFileSync('public/native-shell/controller-bridge.js','utf8')+'\nif(window===window.top){window.__partyPersistentTabs=true;'+fs.readFileSync('public/native-shell/tabs.js','utf8')+'\n}'});
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  await p.route('**/native-shell/**',r=>r.fulfill({path:path.resolve('public',new URL(r.request().url()).pathname.slice(1))}));
  await p.goto(origin+'/native-shell/index.html');
  await p.evaluate(s=>LocalPartyHost.update({...s,selected:"pocket_siege",tv:{...s.tv,browse:true,focusId:"tankarena"},screens:1,players:Array.from({length:16},(_,i)=>({id:'a'+i,name:'Person '+(i+1)})),native:{ready:true,catalogReady:true,buildLabel:'Motion fixture'}}),state);
  await p.evaluate(()=>document.fonts.ready);await wait(500);
  for(const y of [0,700]){
   await p.evaluate(y=>scrollTo(0,y),y);await wait(350);
   const backing=await p.locator('.native-stack-backing').evaluate(e=>({mask:getComputedStyle(document.querySelector('.native-stack-blur')).maskImage||getComputedStyle(document.querySelector('.native-stack-blur')).webkitMaskImage,blur:getComputedStyle(document.querySelector('.native-stack-blur')).backdropFilter||getComputedStyle(document.querySelector('.native-stack-blur')).webkitBackdropFilter,background:getComputedStyle(e).background,rect:JSON.stringify(e.getBoundingClientRect()),z:getComputedStyle(e).zIndex,ancestors:[e.parentElement,document.body].map(n=>({tag:n.tagName,transform:getComputedStyle(n).transform,contain:getComputedStyle(n).contain,z:getComputedStyle(n).zIndex}))}));
   assert(backing.mask.includes('gradient'));assert.equal(backing.blur,'blur(20px)');
   if(y&&width===393)console.log(await p.evaluate(()=>{const keys=['zIndex','position','opacity','visibility','display','transform','filter','isolation','willChange'];return ['main','.native-stack-backing','.native-stack-blur','.fresh-section'].map(q=>{const e=document.querySelector(q);return [q,e&&Object.fromEntries(keys.map(k=>[k,getComputedStyle(e)[k]]))]});}));
   const file=`native-host-${width}-${y?'scrolled':'initial'}.png`;await p.screenshot({path:path.join(out,file)});report.rows.push({width,y,file,backing});
  }
  await p.evaluate(()=>LocalPartyTabs.select('host',false));await wait(350);
  const panel=await p.locator('#hostPanel').evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{top:r.top,bottom:r.bottom,height:innerHeight,background:s.backgroundColor,mask:s.maskImage,overflow:s.overflowY};});
  assert(Math.abs(panel.top)<1&&Math.abs(panel.bottom-panel.height)<1,JSON.stringify(panel));assert.equal(panel.background,'rgb(33, 28, 45)');assert.equal(panel.mask,'none');
  assert(await p.locator('#hostPanel .native-sheet-head').evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('#brandHeader').getBoundingClientRect().bottom-1));
  await p.screenshot({path:path.join(out,`settings-${width}-top.png`)});
  await p.locator('#tvUp').click();
  assert(await p.evaluate(()=>window.__commands.some(m=>m.type==='manage'&&m.command.type==='tv-focus'&&m.command.target==='pick')),'physical Up button requests Host Pick');

  await p.locator('#hostPanelBody').evaluate(e=>e.scrollTop=e.scrollHeight);await wait(350);
  await p.screenshot({path:path.join(out,`settings-${width}-bottom.png`)});report.rows.push({width,panel});
  await context.close();
 }
 assert.deepEqual(report.errors,[]);report.end=hashes();assert.deepEqual(report.start,report.end);report.ok=true;
 }catch(e){report.failure=e.stack;process.exitCode=1;}finally{report.end=hashes();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();console.log(JSON.stringify(report));}})();
