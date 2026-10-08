'use strict';
// Isolated real launcher + real lobby sockets. Seeded balances are QA fixtures.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),WebSocket=require('ws');
const {webkit,chromium}=require(process.env.PARTY_PLAYWRIGHT||'/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseline=process.env.QA_BASELINE==='1',noPick=process.env.QA_NOPICK==='1',out=path.resolve('output/playwright/tv242/'+(baseline?'baseline':noPick?'discovery':'final')),reportName='report-'+(process.env.QA_BROWSER||'all')+'.json';
fs.mkdirSync(out,{recursive:true});
const profiles=Array.from({length:16},(_,i)=>({id:crypto.randomBytes(8).toString('hex'),token:crypto.randomBytes(24).toString('hex'),name:i===0?'Alexandra LongSurname':'Player '+(i+1),hand:'right',createdAt:Date.now(),stats:{played:3,wins:i===0?3:1,coins:1890-i*91,points:1890-i*91,games:{}}}));
const data=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'tv242-')),'party.json');fs.writeFileSync(data,JSON.stringify({version:1,players:profiles,events:[]}));
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_PORT:'0',PARTY_INTERNAL_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_DATA_FILE:data,PARTY_ADMIN_KEY:'tv242',PARTY_EMBEDDED:'0'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sockets=[],report={at:new Date().toISOString(),baseline,captures:[],errors:[],resources:[],checks:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<300;i++){if(fn())return;await sleep(40);}throw Error('Timed out '+log.slice(-1500));}
const probe=()=>{const stage=document.getElementById('tvStage'),scale=stage.getBoundingClientRect().width/stage.offsetWidth;
 const box=s=>{const e=document.querySelector(s);if(!e||!e.getClientRects().length)return null;const r=e.getBoundingClientRect();return{x:r.x/scale,y:r.y/scale,w:r.width/scale,h:r.height/scale,b:r.bottom/scale,r:r.right/scale};};
 const preview=box('#preview'),catalog=box('#tvCatalog'),side=box('#tvSidebar'),people=box('#tvSidebar>.company-people:not(.tv-invite)'),ranking=box('#tvRanking'),divider=box('#tvRanking.previousElementSibling');
 const crown=document.querySelector('#tvLeaders>.mini-rank[data-place="1"]>.hp-coin-amount');
 const score=crown?{text:crown.textContent,label:crown.getAttribute('aria-label'),color:getComputedStyle(crown).color,shadow:getComputedStyle(crown).textShadow,glint:getComputedStyle(crown,'::after').animationName,playState:getComputedStyle(crown,'::after').animationPlayState}:null;
 return{viewport:[innerWidth,innerHeight],scale,preview,catalog,side,people,ranking,score,stage:stage.className,rows:[...document.querySelectorAll('#players .player')].filter(e=>!e.hidden).length,rosterOverflow:document.querySelector('#players').closest('section').scrollHeight-document.querySelector('#players').closest('section').clientHeight,sections:[...document.querySelectorAll('#tvSidebar>section')].filter(e=>e.getClientRects().length).map(e=>({id:e.id,top:e.getBoundingClientRect().top/scale,bottom:e.getBoundingClientRect().bottom/scale,overflow:e.scrollHeight-e.clientHeight}))};};
async function settle(p){await p.waitForFunction(()=>!document.querySelector('#tvArrivals .tv-arrival'),null,{timeout:5000});await p.evaluate(async()=>{await document.fonts.ready;await Promise.race([Promise.allSettled([...document.images].filter(i=>{const r=i.getBoundingClientRect();return i.src&&r.height>0&&r.width>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}).map(i=>i.decode())),new Promise(r=>setTimeout(r,4000))]);await Promise.race([Promise.allSettled(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished)),new Promise(r=>setTimeout(r,1800))]);});await sleep(300);}
async function shot(p,file,state){await settle(p);const proof=await p.evaluate(probe);await p.screenshot({path:path.join(out,file)});report.captures.push({file,state,proof});
 if(!baseline){assert(proof.rosterOverflow<=4,'Roster fits '+file);assert(proof.ranking&&proof.side,'Our Top visible '+file);assert(proof.ranking.b<=proof.side.b+1,'Our Top inside sidebar '+file);
  if(state.pick){assert(Math.abs(proof.preview.x-proof.catalog.x)<=1,'Host Pick left follows catalogue '+file);assert(Math.abs(proof.preview.w-proof.catalog.w)<=1,'Host Pick fills catalogue '+file);}
  // Auto margins centre the whole ranking card in the remaining height.
  const gap=6;const freeTop=proof.people.b+gap*2+2,freeBottom=proof.side.b;
  const center=(proof.ranking.y+proof.ranking.b)/2,target=(freeTop+freeBottom)/2;
  assert(Math.abs(center-target)<=2,'Our Top centered in remaining space '+file+': '+JSON.stringify({center,target}));
  assert.equal(proof.score.label,'1890 coins','Uses the stored coin balance');assert.equal(proof.score.color,'rgb(255, 221, 131)');assert.match(proof.score.glint,/tv-champion/);
 }
 fs.writeFileSync(path.join(out,reportName),JSON.stringify(report,null,2));console.log(file);}
(async()=>{try{await until(()=>/localhost:(\d+)/.test(log));const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];console.log('Launcher ready',origin);
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:'POST',headers:{Authorization:'Bearer tv242','Content-Type':'application/json'},body:JSON.stringify(body)});assert(r.ok,await r.text());};
 await api({type:'force-language',language:'en'});
 async function join(i){const ws=new WebSocket(origin.replace('http:','ws:')+'/lobby');sockets.push(ws);ws.on('message',d=>{const m=JSON.parse(d);if(m.type==='joined')ws.joined=true;});await new Promise(r=>ws.once('open',r));ws.send(JSON.stringify({type:'join',token:profiles[i].token,name:profiles[i].name,hand:'right'}));await until(()=>ws.joined);}
 for(let i=0;i<4;i++)await join(i);
 const engines=baseline?{webkit}:process.env.QA_BROWSER==='chromium'?{chromium}:process.env.QA_BROWSER==='webkit'?{webkit}:{webkit,chromium};
 for(const [engineName,engine] of Object.entries(engines)){
  browser=await engine.launch({headless:true,...(engineName==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>report.errors.push({engineName,error:e.message}));p.on('response',r=>{if(r.status()>=400)report.resources.push({engineName,status:r.status(),url:r.url()});});
  await p.goto(origin+'/tv');await p.locator('#tvStartup').waitFor({state:'hidden',timeout:15000});console.log(engineName,'TV ready');
  for(const count of baseline?[4]:[4,16]){while(sockets.length<count)await join(sockets.length);while(sockets.length>count){const ws=sockets.pop();ws.terminate();}console.log(engineName,'wait roster',count);await p.waitForFunction(n=>document.querySelectorAll('#players .player:not(.tv-more)').length===n,count,{timeout:10000}).catch(async e=>{console.error('Roster state',await p.evaluate(()=>({rows:document.querySelectorAll('#players .player:not(.tv-more)').length,stage:document.getElementById('tvStage').className,connection:document.getElementById('connection').textContent})));throw e;});
   for(const [w,h] of baseline?[[1280,720]]:[[1280,720],[1920,1080],[3840,2160]]){await p.setViewportSize({width:w,height:h});
    if(noPick){await p.evaluate(()=>document.getElementById('tvBrowse').scrollTo({top:0,behavior:'instant'}));await shot(p,`${engineName}-${w}-p${count}-discovery.png`,{pick:false,count});}
    else{await api({type:'select',id:'bowling'});await p.locator('#preview').waitFor({state:'visible'});await p.evaluate(()=>document.getElementById('tvBrowse').scrollTo({top:0,behavior:'instant'}));await shot(p,`${engineName}-${w}-p${count}-pick.png`,{pick:true,count});
     if(!baseline){await api({type:'tv-focus',id:'curling'});await p.locator('#preview').waitFor({state:'hidden'});await p.evaluate(()=>document.getElementById('tvBrowse').scrollTo({top:0,behavior:'instant'}));await shot(p,`${engineName}-${w}-p${count}-browse.png`,{pick:false,count});}}
   }
  }
  if(!baseline){if(!noPick){await api({type:'select',id:'bowling'});await p.locator('#preview').waitFor({state:'visible'});}await settle(p);
   const coin='#tvLeaders>.mini-rank[data-place="1"]>.hp-coin-amount';
   const status=()=>p.locator(coin).evaluate(e=>({before:getComputedStyle(e,'::before').animationPlayState,after:getComputedStyle(e,'::after').animationPlayState,name:getComputedStyle(e,'::after').animationName}));
   assert.equal((await status()).after,'running');await p.evaluate(()=>document.documentElement.classList.add('hp-catalog-suspended'));assert.equal((await status()).after,'paused');await p.evaluate(()=>document.documentElement.classList.remove('hp-catalog-suspended'));
   const glintProof=await p.locator(coin).evaluate(async e=>{const animations=e.getAnimations({subtree:true}).filter(a=>a.animationName==='tv-champion-coin-glint');for(const a of animations){a.pause();await a.ready;a.currentTime=560+a.effect.getTiming().delay;}return{animations:animations.length,before:{opacity:getComputedStyle(e,'::before').opacity,content:getComputedStyle(e,'::before').content,background:getComputedStyle(e,'::before').backgroundColor},after:{opacity:getComputedStyle(e,'::after').opacity,transform:getComputedStyle(e,'::after').transform}};});report.checks.push({engineName,glintProof});
   assert.equal(glintProof.animations,2,'Both small glints animate');assert(Number(glintProof.after.opacity)>.8,'Gold glint reaches its brief bright frame');
   await p.locator('#tvRanking').screenshot({path:path.join(out,`${engineName}-3840-coin-glint.png`)});
   await p.emulateMedia({reducedMotion:'reduce'});assert.equal((await status()).name,'none');await p.screenshot({path:path.join(out,`${engineName}-3840-reduced-motion.png`)});report.checks.push({engineName,hiddenPause:true,reducedMotion:true});
  }
  await browser.close();browser=null;
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.resources,[]);report.ok=true;
}finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(out,reportName),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'server-'+(process.env.QA_BROWSER||'all')+'.log'),log);await browser?.close();for(const ws of sockets)ws.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
