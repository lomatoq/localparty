'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawn}=require('child_process'),pw=require('playwright');
const out=path.resolve('output/playwright/popups240/controller'),file=path.join(out,'report.json'),report=JSON.parse(fs.readFileSync(file));
report.failures=report.failures.filter(x=>!x.includes('host-confirm-stop final93% material')&&!x.includes('pause-overlay final93% material'));
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'popup240'}});
let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await wait(50);assert(/localhost:(\d+)/.test(log),log);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const manage=async type=>{const r=await fetch(origin+'/api/manage',{method:'POST',headers:{authorization:'Bearer popup240','content-type':'application/json'},body:JSON.stringify({type,id:'taprace',externalDisplay:true})});assert(r.ok,await r.text());};
 for(const engine of ['webkit','chromium']){
  const browser=await pw[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
  try{for(const route of ['web','native']){
   await manage('stop');const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
   if(route==='native')await context.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fs.readFileSync('public/native-shell/controller-bridge.js','utf8')+'\nwindow.__partyPersistentTabs=true;'+fs.readFileSync('public/native-shell/tabs.js','utf8')});
   const p=await context.newPage();p.on('pageerror',e=>report.errors.push({engine,route,message:e.message}));await p.goto(origin+'/play');await p.locator('#name').fill('Alex Morgan');await p.locator('#joinForm button[type=submit]').click();await p.waitForFunction(()=>!!window.PARTY_PROFILE?.id);
   await p.evaluate(()=>Promise.all(['Sam Rivera','Jamie Park'].map(name=>new Promise(resolve=>{const ws=new WebSocket('ws://'+location.host+'/lobby');(window.__qaExtraPlayers||=[]).push(ws);ws.onopen=()=>ws.send(JSON.stringify({type:'join',name,hand:'right',freshIdentity:true}));ws.onmessage=e=>{if(JSON.parse(e.data).type==='joined')resolve();};}))));await wait(200);await manage('launch');await p.locator('#play').waitFor({state:'visible'});
   const capture=async(page,name)=>{await page.evaluate(()=>document.fonts.ready);await wait(750);const imageFile=engine+'-'+route+'-'+name+'.png';await page.screenshot({path:path.join(out,imageFile)});
    const data=await page.evaluate(()=>{const d=document.querySelector('dialog[open]')||document.querySelector('#pauseOverlay'),card=d.id==='pauseOverlay'?d.firstElementChild:d,rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};},s=getComputedStyle(d),b=d.tagName==='DIALOG'?getComputedStyle(d,'::backdrop'):getComputedStyle(d,'::before');return{body:document.body.className,modalActive:document.body.hasAttribute('data-hp-modal-active'),background:getComputedStyle(card).background,foregroundFilter:getComputedStyle(card).filter,panel:{id:d.id,rect:rect(d),background:s.background,opacity:s.opacity,filter:s.filter,backdropFilter:s.backdropFilter,backdrop:b.background,backdropOpacity:b.opacity,cardBackground:getComputedStyle(card).background},branches:[...document.querySelectorAll('[data-hp-modal-background]')].map(n=>({tag:n.tagName,id:n.id,filter:getComputedStyle(n).filter,rect:rect(n)})),text:d.innerText};});
    assert(data.background.includes('0.93'),engine+' '+route+' '+name+' final93% '+data.background);assert(data.modalActive&&data.branches.some(b=>b.filter==='blur(8px)'),engine+' '+route+' '+name+' blur');assert(data.foregroundFilter==='none',engine+' '+route+' '+name+' sharp card');
    report.rows=report.rows.map(r=>r.engine===engine&&r.route===route&&r.name===name?{...r,...data,file:imageFile,recapturedAt:new Date().toISOString()}:r);
   };
   await p.evaluate(()=>document.querySelector('#pauseButton').click());await p.locator('#pauseOverlay').waitFor({state:'visible'});await capture(p,'pause-overlay');await p.evaluate(()=>document.querySelector('#resumeButton').click());await wait(650);assert(!await p.evaluate(()=>document.body.hasAttribute('data-hp-modal-active')||document.querySelector('[data-hp-modal-background]')),engine+' '+route+' pause cleanup');
   const hp=await context.newPage();await hp.goto(origin+'/host');await hp.locator('#play').waitFor({state:'visible'});await hp.evaluate(()=>document.querySelector('#lobbyExit').click());await hp.locator('#confirmStop').waitFor({state:'visible'});await capture(hp,'host-confirm-stop');await hp.evaluate(()=>document.querySelector('#confirmStop button[value=cancel]').click());await wait(650);assert(!await hp.evaluate(()=>document.body.hasAttribute('data-hp-modal-active')||document.querySelector('[data-hp-modal-background]')),engine+' '+route+' confirm cleanup');await context.close();
  }}finally{await browser.close();}
 }
 report.ok=!report.errors.length&&!report.failures.length;
}finally{child.kill();fs.writeFileSync(file,JSON.stringify(report,null,2));}
console.log(JSON.stringify({rows:report.rows.length,errors:report.errors,failures:report.failures,ok:report.ok}));
})().catch(e=>{report.errors.push({message:e.stack});report.ok=false;fs.writeFileSync(file,JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
