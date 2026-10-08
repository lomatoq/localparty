'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const embedded=process.env.QA_EMBEDDED!=='0';const out=path.resolve('output/playwright/rematch-live136-'+(embedded?'embedded':'desktop'));fs.mkdirSync(out,{recursive:true});
const report={method:'Real two-player Tap Race finishes. TEST_FAST shortens the round. Renderer lifecycle probes follow the genuine result screenshots.',runs:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:embedded?'1':'0',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'celebration-qa',TEST_FAST:'1'}});
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

 const host=await browser.newPage({viewport:{width:393,height:852}});host.on('pageerror',e=>report.errors.push(e.message));if(!embedded)await host.goto(origin+'/host');
 await api({type:'launch',id:'taprace'});await Promise.all(phones.map(async p=>{await p.waitForFunction(()=>!document.getElementById('readyButton').disabled);await p.locator('#readyButton').click();}));
 const loaded=await api();if(loaded.active.ui.phase==='waiting'){try{await api({type:'force-start',instance:loaded.active.instance});}catch(e){const current=await api();if(current.active?.ui?.phase==='waiting')throw e;}}
 for(const [actor,page] of (embedded?[['player',phones[0]]]:[['player',phones[0]],['host',host]])){
  const final=await until(async()=>{const s=await api();return s.active?.ui?.phase==='results'&&s.active.result?s:null;},'finish');
  await page.locator('#resultRematch').waitFor({state:'visible'});await page.waitForFunction(instance=>document.getElementById('resultRematch')?.dataset.instance===instance,final.active.instance);await page.screenshot({path:path.join(out,actor+'-results.png')});
  await page.locator('#resultRematch').click();
  const next=await until(async()=>{const s=await api();return s.active?.instance!==final.active.instance&&s.active?.id==='taprace'&&!s.busy?s:null;},'new same-game instance');
  const started=await until(async()=>{const s=await api();return s.active?.instance===next.active.instance&&['playing','results'].includes(s.active.ui.phase)?s:null;},'automatic replay without Ready click');assert(started.active.session.readyIds.length>=2,JSON.stringify(started.active.session));report.runs.push({actor,old:final.active.instance,next:next.active.instance,ready:started.active.session.readyIds});
  await page.locator('#sharedMatchResults').waitFor({state:'hidden'});
 }
 assert.deepEqual(report.errors,[]);report.ok=true;console.log(embedded?'PASS embedded player replay automatically starts with connected players ready':'PASS desktop player and browser host replay automatically start with connected players ready');
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();}})().catch(e=>{report.failure=e.message;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
