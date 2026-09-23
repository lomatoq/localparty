'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const root=path.resolve('.localparty-build/screens-review'),out=path.join(root,'desktop');fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'desktop-gallery'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const shots=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<200;i++){if(await fn())return;await sleep(100);}throw Error('Desktop state timeout '+log.slice(-500));}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log));const base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer desktop-gallery','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1920,height:1080}}),phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 const shot=async(name,fullPage=false)=>{await tv.screenshot({path:path.join(out,name+'.png'),fullPage});shots.push({name,file:'desktop/'+name+'.png',surface:'Desktop TV · 1920×1080'+(fullPage?' · full page':'')});fs.writeFileSync(path.join(out,'screens.json'),JSON.stringify(shots,null,2));};
 await tv.goto(base+'/tv',{waitUntil:'domcontentloaded'});await shot('desktop-startup');await sleep(3000);await shot('desktop-catalog');await shot('desktop-catalog-full',true);
 await phone.goto(base+'/play');await phone.locator('#name').fill('Alex');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
 for(const g of (await api()).catalog){
  await api({type:'bots-set',count:Math.max(1,g.min-1)});await sleep(300);await api({type:'launch',id:g.id});
  await phone.locator('#readyButton').waitFor();await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await sleep(350);await shot(g.id+'-desktop-waiting');
  await phone.locator('#readyButton').click();await until(async()=>{const p=(await api()).active?.ui?.phase;return p&&!['waiting','countdown'].includes(p);});await sleep(350);await shot(g.id+'-desktop-playing');
  await phone.locator('#pauseButton').click();await phone.locator('#pauseOverlay').waitFor();await sleep(350);await shot(g.id+'-desktop-pause');
  await api({type:'stop'});await phone.locator('#lobby').waitFor();console.log('DESKTOP',g.id);
 }
}finally{await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
