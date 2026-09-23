'use strict';
const {spawn}=require('node:child_process'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'native-ready'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
(async()=>{try{
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await delay(40);
 assert.match(log,/localhost:(\d+)/);const base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer native-ready','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});assert(r.ok);return r.json();};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage(),phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 await tv.goto(base+'/tv',{waitUntil:'domcontentloaded'});
 const startup=await tv.locator('#tvStartup').innerText();
 assert(!/[А-Яа-яЁё]/.test(startup),'Cold TV startup must be English: '+startup);
 await phone.goto(base+'/play');await phone.locator('#name').fill('Ready test');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
 await api({type:'bots-set',count:1});await delay(500);await api({type:'launch',id:'push'});
 await phone.locator('#readyButton').waitFor({state:'visible'});
 await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);
 for(let i=0;i<3;i++){
  const disabled=await phone.evaluate(()=>{dispatchEvent(new Event('party-native-hide'));dispatchEvent(new Event('party-native-resume'));return document.querySelector('#readyButton').disabled;});
  assert(disabled,'Readiness must be disabled synchronously before recovery messages arrive');
  await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);
 }
 await phone.locator('#readyButton').click();
 let started=false;for(let i=0;i<100;i++){const s=await api();if(s.active?.ui?.phase&&!['waiting','countdown'].includes(s.active.ui.phase)){started=true;break;}await delay(100);}
 assert(started,'One readiness tap after native recovery must start the match');
 // Record every painted frame during a forced exit, including an open rules
 // dialog. A final settled screenshot alone misses transient leftover layers.
 await phone.locator('#pauseButton').click();
 await phone.locator('#sessionRules').click();
 await phone.evaluate(()=>{window.returnFrames=[];window.recordReturn=true;requestAnimationFrame(function sample(){if(!window.recordReturn)return;const visible=id=>{const n=document.getElementById(id);return !!n&&!n.hidden&&n.getClientRects().length>0;};window.returnFrames.push({lobby:visible('lobby'),pause:visible('pauseOverlay'),waiting:visible('waitingRules'),dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.id),notice:visible('notice')?document.getElementById('notice').textContent:null});requestAnimationFrame(sample);});});
 await api({type:'stop'});await phone.locator('#lobby').waitFor();await delay(1200);
 const frames=await phone.evaluate(()=>{window.recordReturn=false;return window.returnFrames.filter(f=>f.lobby);});
 assert(frames.length>5,'Capture transition frames, not just the settled state');
 assert(frames.every(f=>!f.pause&&!f.waiting&&!f.dialogs.length&&!f.notice),'No stale game layer may flash over the returning lobby: '+JSON.stringify(frames.filter(f=>f.pause||f.waiting||f.dialogs.length||f.notice)));
 for(let i=0;i<3;i++){
  await api({type:'launch',id:i%2?'tanks':'push'});await phone.locator('#waitingRules').waitFor();
  await api({type:'stop'});await phone.locator('#lobby').waitFor();
  assert.equal(await phone.evaluate(()=>document.body.classList.contains('game-waiting')),false,'Rapid waiting → lobby clears waiting state');
 }
 console.log('PASS native menu return: immediate readiness gate, repeated resume debounce, one-tap match start');
 console.log('PASS return to lobby: frame-by-frame overlay cleanup, open rules, repeated rapid game changes');
}finally{await browser?.close();child.kill();}})().catch(e=>{console.error(e,log.slice(-500));process.exitCode=1;});
