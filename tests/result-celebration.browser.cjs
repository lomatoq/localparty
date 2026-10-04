'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve('.localparty-build/design-round2/results');fs.mkdirSync(out,{recursive:true});
const report={method:'Real two-player Tap Race finishes. TEST_FAST shortens the round. Renderer lifecycle probes follow the genuine result screenshots.',runs:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'celebration-qa',TEST_FAST:'1'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<900;i++){const value=await fn();if(value)return value;await sleep(50);}throw Error(label);}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'server ready');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer celebration-qa','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});assert(r.ok,await r.clone().text());return r.json();};
 browser=await webkit.launch({headless:true});const phones=[];
 const tv=await browser.newPage({viewport:{width:1280,height:720}});await tv.goto(origin+'/tv');
 for(const [index,width] of [320,393].entries()){
  const p=await browser.newPage({viewport:{width,height:width===320?568:852},isMobile:true,hasTouch:true});p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(origin+'/play');await p.locator('#name').fill(['Alexandria Longname','Taylor'][index]);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);
 }
 for(const reduced of [false,true]){
  await Promise.all(phones.map(p=>p.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'})));
  await api({type:'launch',id:'taprace'});await Promise.all(phones.map(async p=>{await p.waitForFunction(()=>!document.getElementById('readyButton').disabled);await p.locator('#readyButton').click();}));
  const loaded=await api();if(loaded.active.ui.phase==='waiting'){try{await api({type:'force-start',instance:loaded.active.instance});}catch(error){const next=await api();if(next.active?.instance!==loaded.active.instance||next.active?.ui?.phase==='waiting')throw error;}}
  const final=await until(async()=>{const s=await api();return s.active?.ui?.phase==='results'&&s.active.result?s:null;},'real finish');
  await Promise.all(phones.map(p=>p.locator('#sharedMatchResults').waitFor({state:'visible'})));
  const row={reduced,resultKey:final.active.result.key,phones:[]};report.runs.push(row);
  if(!reduced)await phones[0].waitForFunction(()=>HeyPalsMatchResults.diagnostics().particles>0);
  await sleep(450); // Sample the expanded burst, after the result's entrance.
  for(const p of phones){
   const metrics=await p.evaluate(()=>{const panel=document.getElementById('sharedMatchResults'),canvas=panel.querySelector('canvas'),r=panel.getBoundingClientRect(),game=panel.querySelector('.hp-result-game');return{width:innerWidth,height:innerHeight,bottom:r.bottom,horizontal:document.documentElement.scrollWidth-innerWidth,rows:panel.querySelectorAll('.hp-result-row').length,canvas:!!canvas,pointerEvents:canvas?getComputedStyle(canvas).pointerEvents:null,gameColor:getComputedStyle(game).color,panelOpacity:getComputedStyle(panel).opacity,...HeyPalsMatchResults.diagnostics()};});
   assert.equal(metrics.rows,2);assert.equal(metrics.horizontal,0);assert(metrics.bottom<=metrics.height);assert.equal(metrics.canvas,!reduced);if(!reduced){assert.equal(metrics.pointerEvents,'none');assert(metrics.running);}
   row.phones.push(metrics);await p.screenshot({path:path.join(out,`taprace-${metrics.width}-${reduced?'reduced':'fireworks'}.png`)});
  }
  if(!reduced){
   // Probe rerender and temporary hide with the same genuine server result.
   const lifecycle=await phones[0].evaluate(({active,ids})=>{
    const initial=HeyPalsMatchResults.diagnostics().starts;HeyPalsMatchResults.update({active,selfId:ids[1]});const afterRerender=HeyPalsMatchResults.diagnostics().starts;
    HeyPalsMatchResults.update({active:null});const stopped=HeyPalsMatchResults.diagnostics().running;HeyPalsMatchResults.update({active,selfId:ids[0]});return{initial,afterRerender,stopped,afterReturn:HeyPalsMatchResults.diagnostics().starts,canvasCount:document.querySelectorAll('.hp-result-fireworks').length};
   },{active:final.active,ids:final.players.map(p=>p.id)});
   assert.equal(lifecycle.initial,lifecycle.afterRerender);assert.equal(lifecycle.initial,lifecycle.afterReturn);assert.equal(lifecycle.stopped,false);assert.equal(lifecycle.canvasCount,0);row.lifecycle=lifecycle;
   await phones[1].emulateMedia({reducedMotion:'reduce'});await until(async()=>await phones[1].locator('.hp-result-fireworks').count()===0,'live reduced-motion cleanup');
  }
  await tv.locator('#tvPodium').waitFor({state:'visible'});row.tv=await tv.evaluate(()=>LocalPartyTVShow?.diagnostics?.()||null).catch(()=>null);
  await api({type:'stop'});await Promise.all(phones.map(p=>p.locator('#home').waitFor()));assert.equal(await phones[0].locator('.hp-result-fireworks').count(),0);
 }
 assert.deepEqual(report.errors,[]);console.log('PASS actual finishes,320/393,once-per-key,cleanup,reduced motion');
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();}})().catch(e=>{report.failure=e.message;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
