'use strict';
// Real isolated bundled server; never connects to the user's live room.
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.AUDIT_OUTPUT||'.localparty-build/screens-build45');fs.mkdirSync(out,{recursive:true});
const cwd=path.resolve(process.env.GALLERY_BUNDLE||'.localparty-build/Device/Build/Products/Debug-iphoneos/LocalParty.app/Server');
const child=spawn(process.execPath,['server.js'],{cwd,env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'screenshot-room'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),shots=[];
async function until(fn){for(let i=0;i<200;i++){if(await fn())return;await sleep(100);}throw Error('State timeout '+log.slice(-500));}
async function shot(page,name,surface,fullPage=false){await page.screenshot({path:path.join(out,name+'.png'),fullPage});shots.push({name,file:name+'.png',surface});fs.writeFileSync(path.join(out,'supplement.json'),JSON.stringify(shots,null,2));}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log));const base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer screenshot-room','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
 browser=await webkit.launch({headless:true});const phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 const tv=await browser.newPage({viewport:{width:1280,height:720}});
 await phone.goto(base+'/play');await sleep(700);await shot(phone,'guest-onboarding','Guest browser · 393×852');await shot(phone,'guest-onboarding-full','Guest browser · full page',true);
 await phone.locator('#name').fill('Alex');await shot(phone,'guest-profile-filled','Guest browser · 393×852');
 await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();await sleep(1800);await shot(phone,'guest-lobby','Guest browser · 393×852');
 await phone.locator('#editFromCatalog').click();await sleep(500);await shot(phone,'guest-edit-profile','Guest browser · 393×852');
 await phone.locator('#joinForm button[type=submit]').click();await sleep(300);
 await phone.locator('#showStats').click();await sleep(500);await shot(phone,'guest-leaderboard-empty','Guest browser · 393×852');await phone.locator('#closeStats').click();
 await tv.goto(base+'/tv',{waitUntil:'domcontentloaded'});await shot(tv,'tv-cold-start','TV · WebKit 1280×720');await sleep(3000);await shot(tv,'tv-catalog-full','TV · WebKit full page',true);
 await api({type:'bots-set',count:7});await api({type:'launch',id:'naval'});await phone.locator('#readyButton').waitFor();await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await sleep(400);await shot(phone,'guest-eight-player-waiting','Guest browser · 393×852');
 if(await phone.locator('#spectateButton').isVisible()){await phone.locator('#spectateButton').click();await sleep(500);await shot(phone,'guest-spectating','Guest browser · 393×852');await phone.locator('#spectateButton').click();}await phone.locator('#readyButton').click();
 await until(async()=>(await api()).active?.ui?.phase==='playing');
 const active=(await api()).active;await api({type:'game-action',instance:active.instance,action:'finish'});await sleep(1800);
 await shot(phone,'naval-guest-results','Guest browser · real match results');await shot(tv,'naval-tv-results','TV · real match results');
 await api({type:'tv-overlay',mode:'podium',boardKind:'match'});await sleep(1200);await shot(tv,'tv-match-podium','TV · real match podium');
 await api({type:'stop'});await phone.locator('#lobby').waitFor();await sleep(1800);await shot(phone,'guest-return-lobby','Guest browser · 393×852');
 await phone.locator('#showStats').click();await sleep(500);await shot(phone,'guest-leaderboard-after-match','Guest browser · 393×852');
 console.log('Captured',shots.length,'supplementary screens');
}finally{await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
