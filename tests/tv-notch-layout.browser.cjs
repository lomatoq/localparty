'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const root=path.resolve('.localparty-build/tv-notch-final'),output=root;fs.mkdirSync(output,{recursive:true});
const clockRate=1;
const child=spawn(process.execPath,['--require',path.resolve('scripts/capture-qa-clock.cjs'),'server.js'],{env:{...process.env,NODE_OPTIONS:[process.env.NODE_OPTIONS||'','--require='+path.resolve('scripts/capture-qa-clock.cjs')].join(' '),PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'screen-review',QA_CLOCK_RATE:String(clockRate)}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let log='',browser;
const report={capturedAt:new Date().toISOString(),method:'Real games, host actions, minimum supported settings; QA server clock '+clockRate+'x. Does not validate real-time physics or timing.',games:[],errors:[]};
let extras=[];try{extras=JSON.parse(fs.readFileSync(path.join(root,'manifest-extra.json')));}catch{}
child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const save=()=>{fs.writeFileSync(path.join(output,process.env.QA_REPORT_NAME||'complete-report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(root,'manifest-extra.json'),JSON.stringify(extras,null,2));};
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{save();child.kill();browser?.close().finally(()=>process.exit(130));});
const deadline=setTimeout(()=>{console.error('Global review timeout');save();child.kill();process.exit(2);},45*60*1000);deadline.unref();
(async()=>{try{
 for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await sleep(50);assert.match(log,/localhost:(\d+)/);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{signal:AbortSignal.timeout(15000),method:body?'POST':'GET',headers:{Authorization:'Bearer screen-review','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const state=await r.json();if(!r.ok)throw Error(JSON.stringify(state));return state;};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}}),phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 for(const [surface,p]of[['tv',tv],['phone',phone]])p.on('pageerror',e=>report.errors.push({surface,error:e.message}));
 await tv.goto(origin+'/tv');await phone.goto(origin+'/play');await phone.locator('#name').fill('Александра ДлинноеИмя');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();

 for(const id of ['punchmeter']){
  await api({type:'bots-set',count:3});await sleep(500);await api({type:'launch',id});
  await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);
  await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled,null,{timeout:30000});await phone.locator('#readyButton').click();await sleep(1600);
  const snap=await api();if(snap.active?.ui?.phase==='waiting')await api({type:'force-start',instance:snap.active.instance});await sleep(900);
  for(const width of [1280,1920]){await tv.setViewportSize({width,height:width===1280?720:1080});await sleep(400);for(const scenario of ['real-long-player','long-game-state']){if(scenario==='long-game-state')await tv.evaluate(()=>{document.querySelector('#gameContext').textContent='MULTIPLAYER CHAMPIONSHIP GRAND FINALE';document.querySelector('#gameTitle').textContent='BETWEEN ROUNDS';});const data=await tv.evaluate(()=>{const c=document.querySelector('.tv-info-center'),r=c.getBoundingClientRect();return{width:r.width,height:r.height,labels:[...c.querySelectorAll('#gameContext,#gameTitle')].map(n=>{const b=n.getBoundingClientRect(),cs=getComputedStyle(n);return{id:n.id,text:n.textContent,left:b.left-r.left,right:r.right-b.right,top:b.top-r.top,bottom:b.bottom-r.top,width:b.width,overflow:cs.overflow,textOverflow:cs.textOverflow}})}});data.labels.forEach(n=>{assert.ok(n.left>=data.width*(n.id==='gameContext'?.099:.199));assert.ok(n.right>=data.width*(n.id==='gameContext'?.099:.199));assert.ok(n.top>=0&&n.bottom<=data.height);assert.equal(n.overflow,'hidden');assert.equal(n.textOverflow,'ellipsis')});console.log(width,scenario,JSON.stringify(data));await tv.screenshot({path:path.join(output,scenario+'-'+width+'.png')});}}
  await api({type:'stop'});await sleep(500);
 }
 console.log('ERRORS',report.errors);assert.deepEqual(report.errors,[]);
 }finally{clearTimeout(deadline);await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
