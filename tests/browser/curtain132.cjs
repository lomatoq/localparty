'use strict';
const {webkit}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/perf132/catalog');fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'curtain132'}});let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const sleep=ms=>new Promise(r=>setTimeout(r,ms));const report={errors:[],cases:[]};
(async()=>{try{
 for(let n=0;n<400&&!/localhost:(\d+)/.test(log);n++)await sleep(50);
 const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];const api=async b=>{const r=await fetch(origin+'/api/manage',{method:b?'POST':'GET',headers:{Authorization:'Bearer curtain132','Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});const s=await r.json();assert(r.ok,JSON.stringify(s));return s;};
 browser=await webkit.launch();const tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>report.errors.push(e.message));
 await tv.addInitScript(()=>{window.__curtainStates=[];setInterval(()=>{const d=window.HeyPalsTVMotion?.diagnostics();if(d&&__curtainStates.at(-1)?.state!==d.state)__curtainStates.push({...d,at:performance.now()});},16);});
 await tv.goto(origin+'/tv');await tv.waitForFunction(()=>window.HeyPalsTVMotion?.diagnostics().committed==='lobby');await api({type:'bots-set',count:3});for(let n=0;n<100&&(await api()).players.length<3;n++)await sleep(50);
 // Reproduce a first launch while the startup layer has not finished.
 await tv.evaluate(()=>{document.getElementById('tvStage').classList.remove('tv-show-ready');document.getElementById('tvStartup').hidden=false;});
 const catalog=(await api()).catalog;const ids=['curling',...catalog.map(g=>g.id).filter(id=>id!=='curling')];
 async function transition(id,kind){await tv.evaluate(()=>__curtainStates=[]);await api(kind==='launch'?{type:'launch',id}:{type:'stop'});await tv.waitForFunction(()=>__curtainStates.some(d=>d.state==='closing'),null,{timeout:5000});await tv.waitForFunction(()=>{const d=window.HeyPalsTVMotion.diagnostics();return d.state==='idle'&&!d.pending&&!d.curtain;},null,{timeout:6000});const states=await tv.evaluate(()=>__curtainStates);assert(states.some(d=>d.state==='opening'),id+': '+kind);report.cases.push({id,kind,states});if(id==='curling')await tv.screenshot({path:path.join(out,kind+'.png')});}
 for(const id of ids){await transition(id,'launch');await transition(id,'stop');fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 // Parking retains the existing catalogue, never duplicate menus or frames.
 const retained=await tv.evaluate(()=>({cards:document.querySelectorAll('#lobby .lp-catalog-card').length,frames:document.querySelectorAll('#gameFrame').length,inert:document.getElementById('lobby').inert,hidden:document.getElementById('lobby').hidden}));
 assert.equal(retained.cards,catalog.length);assert.equal(retained.frames,1);assert.equal(retained.inert,false);assert.equal(retained.hidden,false);report.retained=retained;
 // A display connecting directly to an already-active game also gets the curtain.
 await api({type:'launch',id:'curling'});await tv.reload();await tv.waitForFunction(()=>__curtainStates.some(d=>d.state==='opening'));await tv.waitForFunction(()=>window.HeyPalsTVMotion.diagnostics().state==='idle');report.coldActive=await tv.evaluate(()=>__curtainStates);assert.equal(report.errors.length,0);report.status='passed';
 }catch(e){report.failure=e.stack;process.exitCode=1;}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();console.log(JSON.stringify({status:report.status,cases:report.cases.length,failure:report.failure}));}})();
