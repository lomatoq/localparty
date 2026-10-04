'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const playerCount=Number(process.env.QA_PLAYER_COUNT)||16;
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/screen-review/design-v2/production-results');fs.mkdirSync(out,{recursive:true});
const report={method:'Real launcher, browser players, WebKit. TEST_FAST shortens rounds; no injected scores or results.',games:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'result-integration',TEST_FAST:'1'}});let log='',browser;
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
  await p.goto(origin+'/play');await p.locator('#name').fill(i===0?'Alexandria Longlastname':i===1?'Christopher Featherstone':'Игрок '+(i+1));await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);
 }
 tv.on('pageerror',e=>report.errors.push({surface:'tv',error:e.message}));
 await until(async()=>(await api()).players.length===playerCount,'real player roster');
 for(const id of (process.env.AUDIT_GAMES||'taprace').split(',')){
  const row={id};report.games.push(row);console.log('START',id);
  await api({type:'launch',id});
  await Promise.all(phones.map(async p=>{await p.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);await p.waitForFunction(()=>!document.getElementById('readyButton').disabled);}));
  await Promise.all(phones.slice(1).map(p=>p.locator('#readyButton').click()));await phones[0].locator('#readyButton').click();
  const loaded=await api();row.startState=loaded.active;console.log('READY',id,loaded.active?.ui?.phase,loaded.active?.ready?.length);if(loaded.active?.ui?.phase==='waiting'){try{await api({type:'force-start',instance:loaded.active.instance});}catch(error){const next=await api();if(next.active?.instance!==loaded.active.instance||next.active?.ui?.phase==='waiting')throw error;}}
  await until(async()=>['playing','countdown','reveal'].includes((await api()).active?.ui?.phase),'playing '+id);
  await api({type:'pause',paused:true});await until(async()=>(await api()).active?.session?.paused===true,'paused '+id);const paused=await api();await sleep(200);assert.equal((await api()).active.instance,paused.active.instance);await api({type:'pause',paused:false});
  if(id==='taprace'){const action=phones[0].frameLocator('#gameFrame').locator('#action');for(let tap=0;tap<4;tap++){try{await action.click({timeout:700});}catch(error){if((await api()).active?.ui?.phase!=='results')throw error;break;}await sleep(80);}}
  const final=await until(async()=>{const s=await api();return s.active?.ui?.phase==='results'&&s.active.result?s:null;},'real final '+id,60000);
  row.result=final.active.result;assert.equal(row.result.rows.length,playerCount,'all participants reported');
  assert.equal(new Set(row.result.rows.map(r=>r.id)).size,playerCount);assert(row.result.rows.every(r=>Number.isInteger(r.rank)&&r.rank>=1&&Number.isFinite(r.score)));
  for(const a of row.result.rows)for(const b of row.result.rows)if(a.score===b.score&&a.won===b.won)assert.equal(a.rank,b.rank,'equal score/outcome must share rank');
  await phones[0].locator('#sharedMatchResults').waitFor({state:'visible'});assert.equal(await phones[0].locator('#sharedMatchResults .hp-result-row').count(),playerCount);
  const names=await phones[0].locator('#sharedMatchResults .hp-result-name').allTextContents();assert(names.some(n=>n.includes('Alexandria Longlastname')));
  const domRanks=await phones[0].locator('#sharedMatchResults .hp-result-rank').allTextContents();assert.deepEqual(domRanks,row.result.rows.map(r=>String(r.rank)));
  if(id==='taprace'){assert(row.result.rows[0].score>0);assert.equal(row.result.rows[0].rank,1);assert.equal(row.result.rows[1].rank,2);}
  row.screens=[];
  for(const size of [{width:320,height:568},{width:375,height:667}]){
   const p=phones[0];await p.setViewportSize(size);await p.locator('.hp-result-scroll').evaluate(el=>el.scrollTop=0);await sleep(200);
   const metrics=await p.evaluate(()=>{const el=document.querySelector('#sharedMatchResults'),scroll=el.querySelector('.hp-result-scroll'),r=el.getBoundingClientRect();return{width:innerWidth,scrollWidth:document.documentElement.scrollWidth,panel:{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom},height:innerHeight,scrollHeight:scroll.scrollHeight,clientHeight:scroll.clientHeight};});
   row.screens.push(metrics);assert(metrics.scrollWidth<=metrics.width+1,JSON.stringify(metrics));assert(metrics.panel.bottom<=metrics.height+1,JSON.stringify(metrics));if(playerCount===16)assert(metrics.scrollHeight>metrics.clientHeight,'16 rows should scroll');
   await p.screenshot({path:path.join(out,id+'-phone-'+size.width+'.png')});await p.locator('.hp-result-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);await p.screenshot({path:path.join(out,id+'-phone-'+size.width+'-last.png')});
  }
  await tv.locator('#tvPodium').waitFor({state:'visible'});assert.equal(await tv.locator('#tvPodium .podium-seat').count(),playerCount);
  await tv.locator('#tvPodium').evaluate(async el=>{await Promise.allSettled(el.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished));});
  row.tvBounds=await tv.locator('#tvPodium').evaluate(el=>{const footer=el.querySelector('.tv-board-footer'),r=footer?.getBoundingClientRect();return{footerBottom:r?.bottom||0,height:innerHeight,clippedNames:[...el.querySelectorAll('.podium-name')].filter(n=>n.scrollHeight>n.clientHeight+1||n.scrollWidth>n.clientWidth+1).length};});
  assert(row.tvBounds.footerBottom<=row.tvBounds.height+1,'TV podium footer clipped');assert.equal(row.tvBounds.clippedNames,0,'TV podium names clipped');
  await tv.screenshot({path:path.join(out,id+'-tv-720.png')});await tv.setViewportSize({width:1920,height:1080});await tv.evaluate(()=>document.fonts.ready);await sleep(200);await tv.screenshot({path:path.join(out,id+'-tv-1080.png')});
  row.tv=await tv.evaluate(()=>({podium:document.querySelector('#tvPodium')?.textContent||'',bodyClass:document.body.className}));
  await api({type:'stop'});await phones[0].locator('#home').waitFor();assert.equal((await api()).active,null);await until(async()=>!(await phones[0].locator('#sharedMatchResults').isVisible()),'result cleared at lobby');
  await api({type:'launch',id});await until(async()=>{const a=(await api()).active;return a?.id===id&&a.instance!==final.active.instance?a:null;},'new instance');assert.equal((await api()).active.result,null);assert.equal(await phones[0].locator('#sharedMatchResults').isVisible(),false);
  await api({type:'stop'});await phones[0].locator('#home').waitFor();row.passed=true;console.log('PASS',id);
 }
 assert.deepEqual(report.errors,[]);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();child.kill();}})().catch(e=>{report.failure=e.message;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
