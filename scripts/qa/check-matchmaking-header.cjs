'use strict';
// Real isolated launcher/phone flow; no physical-device game is changed.
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {settleTVWaiting}=require('../tv-waiting-guard.cjs');
const out=path.resolve(process.env.HEADER_OUTPUT||'output/playwright/screen-state-audit-2026-10-03/matchmaking-header114');fs.mkdirSync(out,{recursive:true});
const files=['public/tv.css','public/tv.js','public/tv.html','public/tv-show.css'];
const hashes=()=>Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const report={startedAt:new Date().toISOString(),sources:hashes(),games:[],errors:[]};
const server=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_INTERNAL_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'header-review'}});
let log='',browser;server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await sleep(50);
 assert.match(log,/localhost:(\d+)/);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer header-review','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const value=await r.json();assert(r.ok,JSON.stringify({body,status:r.status,response:value}));return value;};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}}),phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 for(const p of [tv,phone])p.on('pageerror',e=>report.errors.push(e.message));
 await tv.goto(origin+'/tv');await phone.goto(origin+'/play');await phone.locator('#name').fill('Alexandra LongSurname');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
 await tv.waitForFunction(()=>document.getElementById('tvStartup').hidden&&document.getElementById('tvStage').classList.contains('tv-show-ready'));
 assert(await tv.locator('.tv-header').isVisible(),'Browsing header must remain visible');
 const catalog=(await api()).catalog;assert.equal(catalog.length,36);
 for(const game of catalog.filter(g=>!process.env.AUDIT_GAMES||process.env.AUDIT_GAMES.split(',').includes(g.id))){
  const count=Math.min(3,game.max-1);await api({type:'bots-set',count});
  for(let i=0;i<100;i++){if((await api()).players.filter(p=>p.testBot).length===count)break;await sleep(100);}
  assert.equal((await api()).players.filter(p=>p.testBot).length,count);await api({type:'launch',id:game.id});
  await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),game.id);await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled);
  await settleTVWaiting(tv);assert.equal((await api()).active.ui.phase,'waiting');
  const geometry=await tv.evaluate(()=>({phase:document.body.dataset.tvPhase,headerDisplay:getComputedStyle(document.querySelector('.tv-header')).display,headerRects:document.querySelector('.tv-header').getClientRects().length,audioRects:document.getElementById('tvAudioToggle').getClientRects().length,capHidden:document.querySelector('.gamebar').hidden,waiting:document.getElementById('waiting').getBoundingClientRect().toJSON()}));
  assert.equal(geometry.phase,'waiting');assert.equal(geometry.headerDisplay,'none');assert.equal(geometry.headerRects,0);assert.equal(geometry.audioRects,0);assert(geometry.capHidden);
  await tv.screenshot({path:path.join(out,game.id+'-waiting-1280.png')});
  if(['naval','curling'].includes(game.id)){await tv.setViewportSize({width:1920,height:1080});await settleTVWaiting(tv);assert(!(await tv.locator('.tv-header').isVisible()));await tv.screenshot({path:path.join(out,game.id+'-waiting-1920.png')});await tv.setViewportSize({width:1280,height:720});}
  report.games.push({id:game.id,geometry});console.log('WAITING',game.id,'header hidden');
  if(game.id==='curling'){await phone.locator('#readyButton').click();await tv.waitForFunction(()=>['countdown','playing','reveal'].includes(document.body.dataset.tvPhase));assert(!(await tv.locator('.tv-header').isVisible()));report.liveTransition=true;}
  await api({type:'stop'});await phone.locator('#home').waitFor();await tv.waitForFunction(()=>document.body.dataset.tvPhase==='lobby');assert(await tv.locator('.tv-header').isVisible(),'Header returns after stop');
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(hashes(),report.sources);report.passed=true;
}finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
