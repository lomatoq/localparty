'use strict';
const {spawn}=require('node:child_process'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const output=path.resolve('.localparty-build/game-quality');fs.mkdirSync(output,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'quality-test'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<200;i++){if(await fn())return;await delay(50);}throw Error(label+' '+log.slice(-500));}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'start');const base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer quality-test','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const s=await r.json();assert(r.ok,JSON.stringify(s));return s;};
 browser=await webkit.launch();const tv=await browser.newPage({viewport:{width:1280,height:720}}),phones=[],errors=[];
 const watch=p=>p.on('pageerror',e=>errors.push(e.message));watch(tv);await tv.goto(base+'/tv');
 for(const name of ['Александра ДлинноеИмя','Пётр']){const p=await browser.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true});watch(p);await p.goto(base+'/play');await p.locator('#name').fill(name);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);}
 await api({type:'select',id:'drawguess'});await tv.locator('#tvStartup').waitFor({state:'hidden',timeout:30000});await tv.locator('#preview').waitFor({state:'visible'});await tv.locator('#tvCatalog .game').first().waitFor({state:'visible'});await delay(1000);
 for(const [width,height] of [[1280,720],[1920,1080]]){await tv.setViewportSize({width,height});await tv.screenshot({path:path.join(output,`tv-choice-${height}.png`)});const clearance=await tv.locator('#preview').evaluate(el=>{const browse=document.querySelector('#tvBrowse');return el.getBoundingClientRect().top-browse.getBoundingClientRect().top;});assert(clearance>=12&&clearance<=22,'Choice needs a small inset clear of the 12px fade: '+clearance);}
 const launch=async id=>{await api({type:'launch',id});for(const p of phones){await p.locator('#readyButton').waitFor({state:'visible'});await p.locator('#readyButton').click();}await until(async()=>!['waiting','countdown'].includes((await api()).active.ui.phase),'playing');};
 await launch('drawguess');
 for(let turn=0;turn<2;turn++){const s=await api();await api({type:'game-action',instance:s.active.instance,action:'end'});await until(async()=>['playing','results'].includes((await api()).active.ui.phase),'next drawing');}
 await until(async()=>(await api()).active.ui.phase==='results','drawing result');
 for(let i=0;i<phones.length;i++){const p=phones[i],f=p.frames().find(f=>f.url().includes('/games/drawguess/'));await f.locator('.screen-podium').waitFor({state:'visible'});assert.equal(await f.locator('.screen-podium article').count(),2);assert(!await p.locator('body').innerText().then(s=>s.includes('Translation unavailable')));await delay(1100);await p.screenshot({path:path.join(output,`drawguess-result-${i}.png`)});const missing=await f.evaluate(()=>PartyI18n.missing);fs.writeFileSync(path.join(output,'drawguess-missing.json'),JSON.stringify(missing));}
 await tv.screenshot({path:path.join(output,'drawguess-tv-result.png')});await api({type:'stop'});for(const p of phones)await p.locator('#home').waitFor();
 await launch('flappy');const phoneFrame=phones[0].frames().find(f=>f.url().includes('/games/flappy/'));await phoneFrame.locator('#action').waitFor({state:'visible'});await phones[0].screenshot({path:path.join(output,'flappy-countdown.png')});assert(await phoneFrame.locator('#action').isDisabled());await delay(3300);assert(await phoneFrame.locator('#action').isEnabled());
 assert.deepEqual(errors,[]);console.log('PASS TV header clearance, real DrawGuess final podium, Flappy countdown, 2 phones; screenshots '+output);
}finally{await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
