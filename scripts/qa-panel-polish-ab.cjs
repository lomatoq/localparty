'use strict';
// Polish A/B sweep. Same live game state; game-ui-polish-20261004.css toggled
// off/on in every frame. Geometry is measured synchronously inside one evaluate
// (no game JS can run in between), so any box delta is caused by the stylesheet.
// Run from repo root: QA_TV=1 QA_GAMES=bomb,kart PARTY_PLAYWRIGHT=... node scripts/qa-panel-polish-ab.cjs
// Env: QA_GAMES, QA_WIDTH, QA_HEIGHT, QA_TV, QA_NATIVE, QA_OUTPUT, QA_WAIT.
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/ui-panels-20261004/ab');fs.mkdirSync(out,{recursive:true});
const games=(process.env.QA_GAMES||'bomb').split(',');
const width=Number(process.env.QA_WIDTH)||393,height=Number(process.env.QA_HEIGHT)||(width===320?568:852);
const tag=`${width}x${height}${process.env.QA_NATIVE?'-native':''}`;
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'sweep'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const report={width,height,native:!!process.env.QA_NATIVE,games:{},errors:[]};
const SET=on=>{for(const l of document.styleSheets)if((l.href||'').includes('game-ui-polish-20261004'))l.disabled=!on;};
const MEASURE=()=>{
 const sw=on=>{for(const l of document.styleSheets)if((l.href||'').includes('game-ui-polish-20261004'))l.disabled=!on;};
 const sent=()=>getComputedStyle(document.documentElement).getPropertyValue('--hpp-sentinel').trim();
 const has=document.querySelectorAll('link[href*="game-ui-polish-20261004"]').length;
 const snap=()=>{const els=[...document.querySelectorAll('body *')];return els.map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height,e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflowX!=='visible'?1:0];});};
 const els=[...document.querySelectorAll('body *')];
 sw(false);const s0=sent();const a=snap();sw(true);const s1=sent();const b=snap();sw(false);const c=snap();sw(true);
 const desc=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\s+/).slice(0,3).join('.'):'');
 const diffs=[];
 els.forEach((e,i)=>{if(!e.getClientRects().length)return;const A=a[i],B=b[i],C=c[i];if(!A||!B||!C)return;
  const stable=A.every((v,k)=>Math.abs(v-C[k])<=1);if(!stable)return;
  const d=Math.max(...[0,1,2,3].map(k=>Math.abs(A[k]-B[k])));
  if(d>2||A[4]!==B[4])diffs.push({el:desc(e),parent:e.parentElement?desc(e.parentElement):'',before:A.slice(0,4).map(Math.round),after:B.slice(0,4).map(Math.round),max:Math.round(d*10)/10,overflowChange:A[4]!==B[4]?`${A[4]}->${B[4]}`:undefined});});
 const inv={};for(const q of ['.hp-info-card','.hp-stat-group','.hp-stat','.hp-action-primary','.party-standing','.hp-ranking-row','.hp-result-row','button']){const v=[...document.querySelectorAll(q)].filter(e=>e.getClientRects().length);if(v.length)inv[q]=v.slice(0,6).map(e=>{const s=getComputedStyle(e);return desc(e)+' | r='+s.borderTopLeftRadius+' | bg='+s.backgroundColor+' | sh='+s.boxShadow.slice(0,90);});}
 return {url:location.pathname,hasPolish:has,sentinel:s0+'->'+s1,count:els.length,diffs:diffs.slice(0,60),diffCount:diffs.length,inv};
};
async function allFrames(page,fn){const res=[];for(const f of page.frames()){try{res.push(await f.evaluate(fn));}catch(e){}}return res;}
(async()=>{try{
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await sleep(50);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer sweep','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return r.json();};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}});await tv.goto(origin+'/tv');
 const phone=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});phone.on('pageerror',e=>report.errors.push(e.message));
 if(process.env.QA_NATIVE){await phone.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fs.readFileSync('public/native-shell/controller-bridge.js','utf8')});await phone.addInitScript({content:fs.readFileSync('public/native-shell/tabs.js','utf8')});}
 await phone.goto(origin+'/play');await phone.locator('#name').fill('Alexandria Longname');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
 for(const id of games){const row={};report.games[id]=row;try{
  const g=(await api()).catalog.find(x=>x.id===id);await api({type:'bots-set',count:Math.min(3,(g?.max||4)-1)});await sleep(700);
  await api({type:'launch',id});await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled,null,{timeout:20000});await phone.locator('#readyButton').click();
  const s=await api();if(s.active?.ui?.phase==='waiting')await api({type:'force-start',instance:s.active.instance}).catch(()=>{});
  await sleep(Number(process.env.QA_WAIT)||4500);
  row.phone=(await allFrames(phone,MEASURE)).filter(x=>x.diffCount||x.hasPolish);
  if(process.env.QA_TV)row.tv=(await allFrames(tv,MEASURE)).filter(x=>x.diffCount||x.hasPolish);
  await allFrames(phone,`(${SET})(false)`);
  await phone.screenshot({path:path.join(out,`${id}-${tag}-before.png`)});
  if(process.env.QA_TV){await allFrames(tv,`(${SET})(false)`);await tv.screenshot({path:path.join(out,`${id}-tv-before.png`)});await allFrames(tv,`(${SET})(true)`);await sleep(80);await tv.screenshot({path:path.join(out,`${id}-tv-after.png`)});}
  await allFrames(phone,`(${SET})(true)`);await sleep(80);
  await phone.screenshot({path:path.join(out,`${id}-${tag}-after.png`)});
 }catch(e){row.error=e.message.split('\n')[0];}
 await api({type:'stop'}).catch(()=>{});await phone.locator('#home').waitFor({timeout:15000}).catch(()=>{});}
}catch(e){report.failure=e.stack;process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,`report-${tag}.json`),JSON.stringify(report,null,2));await browser?.close();child.kill();
 const sum={};for(const [k,v] of Object.entries(report.games))sum[k]=v.error||{phone:(v.phone||[]).map(f=>f.diffCount),tv:(v.tv||[]).map(f=>f.diffCount)};console.log(JSON.stringify(sum));}})();
