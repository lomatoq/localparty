'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve('.localparty-build/tv-info-unified');fs.mkdirSync(out,{recursive:true});
const report={method:'Real launcher, two browser players, normal-speed WebKit. No injected game state.',games:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'type-production',TEST_FAST:''}});let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,label,timeout=45000){const end=Date.now()+timeout;while(Date.now()<end){const v=await fn();if(v)return v;await sleep(80);}throw Error(label);}
(async()=>{try{await until(()=>/localhost:(\d+)/.test(log),'launcher port');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];const api=async body=>{const r=await fetch(origin+'/api/manage',{signal:AbortSignal.timeout(15000),method:body?'POST':'GET',headers:{Authorization:'Bearer type-production','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();assert(r.ok,JSON.stringify(s));return s;};
browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}});await tv.goto(origin+'/tv');const phones=[];
for(let i=0;i<3;i++){const p=await browser.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true});p.on('pageerror',e=>report.errors.push({surface:'phone'+i,error:e.message}));await p.goto(origin+'/play');await p.locator('#name').fill(i===2?'Morgan':i?'Ўладзімір · Ілля · Ёжик':'Alexandria Longlastname');await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);}tv.on('pageerror',e=>report.errors.push({surface:'tv',error:e.message}));await until(async()=>(await api()).players.length===3,'real roster');


for(const game of ['sinyakquiz','bowling','jenga']){
 await api({type:'launch',id:game});await Promise.all(phones.map(async p=>{await p.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),game);await p.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await p.locator('#readyButton').click()}));
 await until(async()=>{const s=await api();if(['playing','reveal'].includes(s.active?.ui?.phase))return true;if(s.active?.ui?.phase==='waiting'){await sleep(350);try{await api({type:'force-start',instance:s.active.instance})}catch{}}return false},'playing');
 const f=tv.frames().find(f=>f.url().includes('/games/'+game+'/'));await f.evaluate(()=>document.fonts.ready);
 for(const size of [{width:1280,height:720},{width:1920,height:1080}]){
  await tv.setViewportSize(size);await sleep(450);
  const measure=await f.evaluate(()=>{const sel='.hp-info-card,.ss-heading,.ss-gate-health,.ss-player-card,.scoreboard,.activeBanner,.roster-card,.panel:has(>#board),.panel:has(>#messages),.stage.panel';return{root:document.documentElement.className,width:innerWidth,height:innerHeight,cards:[...document.querySelectorAll(sel)].filter(e=>e.getBoundingClientRect().height&&getComputedStyle(e).display!=='none').map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{class:e.className,id:e.id,background:s.backgroundImage,size:s.backgroundSize,radius:s.borderRadius,position:s.backgroundPosition,left:r.left,right:r.right,top:r.top,bottom:r.bottom,canvas:!!e.querySelector('canvas')}})}});
  const painted=measure.cards.filter(c=>c.size==='38px 1.5px, 38px 1.5px, 100% 100%, 100% 100%');assert(painted.length,'At least one passive card should receive shared finish '+game);for(const c of painted){assert.equal(c.radius,'22px');assert.equal(c.canvas,false);assert(c.left>=-1&&c.right<=measure.width+1)}
  report.games.push({game,viewport:size,...measure});await tv.screenshot({path:path.join(out,game+'-'+size.height+'.png')});
 }
 await api({type:'stop'});await phones[0].locator('#home').waitFor();
}
assert.deepEqual(report.errors,[]);console.log(JSON.stringify({pass:true,games:report.games}));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();child.kill();}})().catch(e=>{report.failure=e.message;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
