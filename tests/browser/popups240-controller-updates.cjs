'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawn}=require('child_process'),pw=require('playwright');
const out=path.resolve('output/playwright/popups240/controller'),file=path.join(out,'report.json'),report=JSON.parse(fs.readFileSync(file));
const targetName=process.env.QA_JOIN_ONLY==='1'?'host-join-qr':'host-updates',dialogSelector=targetName==='host-join-qr'?'#joinDialog':'.lp-updates-dialog';
report.rows=report.rows.filter(r=>r.name!==targetName);
report.errors=report.errors.filter(r=>!r.message.includes('popups240-controller-updates.cjs'));
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'popup240'}});
let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await wait(50);assert(/localhost:(\d+)/.test(log),log);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 for(const engine of ['webkit','chromium']){
  const browser=await pw[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
  try{for(const route of ['web','native']){
   const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
   if(route==='native')await context.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fs.readFileSync('public/native-shell/controller-bridge.js','utf8')+'\nwindow.__partyPersistentTabs=true;'+fs.readFileSync('public/native-shell/tabs.js','utf8')});
   const p=await context.newPage();p.on('pageerror',e=>report.errors.push({engine,route,message:e.message}));await p.goto(origin+'/host');await p.locator('#home').waitFor({state:'visible'});await p.evaluate(()=>document.fonts.ready);
   await p.evaluate(selector=>document.querySelector(selector).click(),targetName==='host-join-qr'?'#joinOpen':'#lp-updates');await p.locator(dialogSelector).waitFor({state:'visible'});
   if(targetName==='host-join-qr')await p.waitForFunction(()=>document.querySelector('#dialogQr').complete&&document.querySelector('#dialogQr').naturalWidth>0);await wait(750);
   const name=targetName,imageFile=engine+'-'+route+'-'+name+'.png';await p.screenshot({path:path.join(out,imageFile)});
   const data=await p.evaluate(selector=>{const d=document.querySelector(selector),r=d.getBoundingClientRect(),back=d.querySelector('.hp-popup-back'),br=back.getBoundingClientRect();return{background:getComputedStyle(d).background,text:d.innerText,active:document.body.hasAttribute('data-hp-modal-active'),shade:getComputedStyle(d,'::backdrop').background,rect:{x:r.x,y:r.y,width:r.width,height:r.height},back:{x:br.x,y:br.y,width:br.width,height:br.height,bottom:br.bottom},actions:[...d.querySelectorAll('.lp-update-actions>button')].map(n=>{const r=n.getBoundingClientRect();return{id:n.id,y:r.y,height:r.height};}),branches:[...document.querySelectorAll('[data-hp-modal-background]')].map(n=>({id:n.id,filter:getComputedStyle(n).filter}))};},dialogSelector);
   report.rows.push({engine,route,name,file:imageFile,hostRole:true,dynamic:name==='host-updates',...data});assert(data.active&&data.branches.some(b=>b.filter==='blur(8px)'),engine+' '+route+' '+name+' blur');assert(data.background.includes('0.93'),engine+' '+route+' final93% material '+data.background);if(name==='host-updates')assert(Math.abs(data.actions[0].y-data.actions[1].y)<1&&data.actions.every(b=>b.height===48),engine+' '+route+' update action alignment '+JSON.stringify(data.actions));assert(data.back.bottom<=852-(route==='native'?56:10),engine+' '+route+' '+name+' back bottom '+JSON.stringify(data.back));
   if(name==='host-updates')assert(!/[А-Яа-яЁё]/.test(data.text),engine+' '+route+' Updates English copy '+data.text);
   await p.evaluate(selector=>document.querySelector(selector+' .hp-popup-back').click(),dialogSelector);await wait(650);assert(!await p.evaluate(()=>document.body.hasAttribute('data-hp-modal-active')||document.querySelector('[data-hp-modal-background]')),engine+' '+route+' '+name+' cleanup');
   await context.close();
  }}finally{await browser.close();}
 }
 report.ok=!report.errors.length&&!report.failures.length;
}finally{child.kill();fs.writeFileSync(file,JSON.stringify(report,null,2));}
console.log(JSON.stringify({rows:report.rows.length,errors:report.errors,failures:report.failures,ok:report.ok}));
})().catch(e=>{report.errors.push({message:e.stack});report.ok=false;fs.writeFileSync(file,JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
