'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/party-layout-fixes');fs.mkdirSync(out,{recursive:true});
const report={method:'Live launcher + real player joins/ready and host actions. No score, question or game-state injection.',games:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'tv-layout-check'}});let log='',browser;
child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,label){const end=Date.now()+30000;while(Date.now()<end){const v=await fn();if(v)return v;await sleep(80);}throw Error(label);}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'launcher port');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{signal:AbortSignal.timeout(10000),method:body?'POST':'GET',headers:{Authorization:'Bearer tv-layout-check','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();assert(r.ok,JSON.stringify(s));return s;};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>report.errors.push(e.message));await tv.goto(origin+'/tv');
 const phones=[];for(const name of ['Анна','Александра ДлинноеИмя']){const p=await browser.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true});await p.goto(origin+'/play');await p.locator('#name').fill(name);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);}

 for(const id of (process.env.AUDIT_GAMES||'monster,crocodile').split(',')){
  console.log('START',id);await api({type:'launch',id});
  await Promise.all(phones.map(async p=>{await p.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);await p.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await p.locator('#readyButton').click();}));
  const loaded=await api();if(loaded.active?.ui?.phase==='waiting')try{await api({type:'force-start',instance:loaded.active.instance});}catch(e){if(!e.message.includes('Игра уже началась или завершена'))throw e;}
  await until(async()=>(await api()).active?.ui?.phase==='playing','playing '+id);await tv.locator('#tvSceneTransition').waitFor({state:'hidden'});
  const row={id,cases:[]};report.games.push(row);const tf=tv.frames().find(f=>f.url().includes('/games/'+id+'/'));
  for(let turn=0;turn<2;turn++){
   if(id==='monster'){
    for(const size of [{width:1280,height:720},{width:1920,height:1080}]){
     await tv.setViewportSize(size);await sleep(200);const metrics=await tf.locator('#activePlayer').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);const range=document.createRange();range.selectNodeContents(el);return{text:el.textContent,rect:{width:r.width,height:r.height},lineHeight:s.lineHeight,fontSize:s.fontSize,lines:range.getClientRects().length};});row.cases.push({...size,...metrics});if(metrics.text==='Анна')assert.equal(metrics.lines,1,'short artist name must stay on one line');await tv.screenshot({path:path.join(out,'monster-turn'+turn+'-'+size.height+'.png')});
    }
    if(turn===0){for(const p of phones){const f=p.frames().find(f=>f.url().includes('/games/monster/'));if(!f||!(await f.locator('#drawView').isVisible()))continue;const box=await f.locator('#drawCanvas').boundingBox();await p.mouse.move(box.x+box.width*.2,box.y+box.height*.3);await p.mouse.down();await p.mouse.move(box.x+box.width*.6,box.y+box.height*.6,{steps:10});await p.mouse.up();await f.locator('#doneBtn').click();await f.locator('#confirmSubmit').click();break;}const first=row.cases[0].text;await until(async()=>(await tf.locator('#activePlayer').textContent())!==first,'next artist');}
   }else{
    let actor;for(const p of phones){const f=p.frames().find(f=>f.url().includes('/games/crocodile/'));if(f&&await f.locator('#secretPanel').isVisible()){actor={p,f};break;}}assert(actor,'actor phone');
    for(const size of [{width:320,height:568},{width:375,height:667},{width:393,height:852}]){
     await actor.p.setViewportSize(size);await sleep(150);const metrics=await actor.f.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};return{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,stage:rect('.stage'),secret:rect('#secretPanel'),actions:rect('#actions'),stats:rect('#turnStats'),guessed:rect('#guessed'),skip:rect('#skip')};});row.cases.push({turn,...size,metrics});assert(metrics.scrollWidth<=metrics.width+1);assert(metrics.actions.bottom<=metrics.height+1,JSON.stringify(metrics));assert(metrics.stats.bottom<=metrics.height+1,JSON.stringify(metrics));assert(metrics.guessed.height>=44&&metrics.skip.height>=44);await actor.p.screenshot({path:path.join(out,'crocodile-turn'+turn+'-'+size.width+'.png')});
    }
    if(turn===0){const active=(await api()).active;await api({type:'game-action',instance:active.instance,action:'end'});await until(async()=>!(await actor.f.locator('#secretPanel').isVisible()),'old actor hidden');await until(async()=>{for(const p of phones){const f=p.frames().find(f=>f.url().includes('/games/crocodile/'));if(p!==actor.p&&f&&await f.locator('#secretPanel').isVisible())return true;}return false;},'next actor');}
   }
  }
  await api({type:'stop'});await phones[0].locator('#home').waitFor();console.log('DONE',id);
 }
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
