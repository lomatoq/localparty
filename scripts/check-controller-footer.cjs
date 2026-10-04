'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const playerCount=Number(process.env.QA_PLAYER_COUNT)||2;
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/footer-inspection');fs.mkdirSync(out,{recursive:true});
const report={method:'Real launcher, two browser players, normal-speed WebKit game. No injected scores/results or accelerated clock.',games:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'result-integration',TEST_FAST:''}});let log='',browser;
child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=45000){const end=Date.now()+timeout;while(Date.now()<end){const v=await fn();if(v)return v;await sleep(60);}throw Error(label);}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'launcher port');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{signal:AbortSignal.timeout(15000),method:body?'POST':'GET',headers:{Authorization:'Bearer result-integration','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();fs.writeFileSync(path.join(out,'last-state.json'),JSON.stringify(s,null,2));assert(r.ok,JSON.stringify(s));return s;};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}});await tv.goto(origin+'/tv');
 const phones=[];
 for(let i=0;i<playerCount;i++){
  const p=await browser.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true});p.on('pageerror',e=>report.errors.push({surface:'phone'+i,error:e.message}));
  await p.goto(origin+'/play');await p.locator('#name').fill(i===0?'Александра ДлинноеИмя':i===1?'Пётр ОченьДлиннаяФамилия':'Игрок '+(i+1));await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);
 }
 tv.on('pageerror',e=>report.errors.push({surface:'tv',error:e.message}));
 await until(async()=>(await api()).players.length===playerCount,'real player roster');
 for(const id of (process.env.AUDIT_GAMES||'tanks,tankarena').split(',')){
  const row={id};report.games.push(row);console.log('START',id);
  await api({type:'launch',id});
  await Promise.all(phones.map(async p=>{await p.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);await p.waitForFunction(()=>!document.getElementById('readyButton').disabled);}));
  await Promise.all(phones.slice(1).map(p=>p.locator('#readyButton').click()));await phones[0].locator('#readyButton').click();
  const loaded=await api();row.startState=loaded.active;console.log('READY',id,loaded.active?.ui?.phase,loaded.active?.ready?.length);if(loaded.active?.ui?.phase==='waiting'){try{await api({type:'force-start',instance:loaded.active.instance});}catch(error){const next=await api();if(next.active?.instance!==loaded.active.instance||next.active?.ui?.phase==='waiting')throw error;}}
  await until(async()=>['playing','countdown','reveal'].includes((await api()).active?.ui?.phase),'playing '+id);
  await until(async()=> (await api()).active?.ui?.phase==='playing','playing phase');
  const p=phones[0];await p.setViewportSize({width:393,height:852});await sleep(3500);row.metrics=await p.evaluate(()=>({bodyClass:document.body.className,scrollY,docHeight:document.documentElement.scrollHeight,viewport:innerHeight,nodes:['#play','#sessionControls','#gameFrame'].map(q=>{const e=document.querySelector(q),r=e.getBoundingClientRect(),s=getComputedStyle(e);return{q,hidden:e.hidden,rect:{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom},display:s.display,opacity:s.opacity,visibility:s.visibility,position:s.position,transform:s.transform,animations:e.getAnimations().map(a=>({currentTime:a.currentTime,playState:a.playState,timing:a.effect.getComputedTiming()}))}})}));await p.screenshot({path:path.join(out,id+'.png')});await tv.screenshot({path:path.join(out,id+'-tv.png')});row.tvMetrics=await tv.locator('.tv-info-right').evaluate(el=>({height:el.getBoundingClientRect().height,items:[...el.children].map(n=>({text:n.textContent,width:n.clientWidth,scrollWidth:n.scrollWidth,height:n.clientHeight,scrollHeight:n.scrollHeight}))}));console.log(JSON.stringify(row.metrics));console.log(JSON.stringify(row.tvMetrics));await api({type:'stop'});await p.locator('#home').waitFor();
  row.passed=true;console.log('PASS',id);

 }
 assert.deepEqual(report.errors,[]);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();child.kill();}})().catch(e=>{report.failure=e.message;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
