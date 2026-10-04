// Production renderer integration with an explicitly injected client-only machine-gun event.
'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const root=path.resolve('.localparty-build/peek-notice-final'),output=root;fs.mkdirSync(output,{recursive:true});
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
 await tv.addInitScript(()=>{const dispatch=EventTarget.prototype.dispatchEvent;EventTarget.prototype.dispatchEvent=function(event){if(!window.__noticeFixture&&window.SS_CONFIG?.mode==='peek_shoot'&&event.type==='state'&&event.detail?.phase==='playing'&&event.detail.players?.length){window.__noticeFixture=true;const p=event.detail.players[0],id=Math.max(0,...event.detail.events.map(e=>e.id))+1;event.detail.events.push({id,kind:'machinegun',player:p.id,text:p.name+' получает пулемёт на 8 секунд!',until:8});}return dispatch.call(this,event);};});await tv.goto(origin+'/tv');await phone.goto(origin+'/play');await phone.locator('#name').fill('Александра ДлинноеИмя');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();

 for(const id of ['peek_shoot']){
  await api({type:'bots-set',count:3});await sleep(500);await api({type:'launch',id});
  await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);
  await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled,null,{timeout:30000});await phone.locator('#readyButton').click();await sleep(1600);
  const snap=await api();if(snap.active?.ui?.phase==='waiting')await api({type:'force-start',instance:snap.active.instance});await sleep(900);
  for(const width of []){await phone.setViewportSize({width,height:width===320?568:width===375?667:852});await sleep(350);await phone.screenshot({path:path.join(output,id+'-'+width+'.png')});const f=phone.frames().find(f=>f.url().includes('/games/'+id+'/'));console.log(id,width,await f.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,body:document.body.getBoundingClientRect().toJSON(),controls:[...document.querySelectorAll('#hole,#actions,#hockeyJoy,#mineOpen')].filter(n=>!n.hidden).map(n=>({id:n.id,rect:n.getBoundingClientRect().toJSON()}))})));}
  for(const width of [1280]){await tv.setViewportSize({width,height:width===1280?720:1080});await sleep(500);const noticeFrame=tv.frames().find(f=>f.url().includes('/games/'+id+'/'));await noticeFrame.evaluate(async()=>{const {PartyConnection}=await import('./net.js');const dispatch=EventTarget.prototype.dispatchEvent;PartyConnection.prototype.dispatchEvent=function(event){if(!window.__noticeFixture&&event.type==='state'&&event.detail?.players?.length){window.__noticeFixture=true;const p=event.detail.players[0];event.detail.events.push({id:1000000,kind:'machinegun',player:p.id,text:p.name+' получает пулемёт на 8 секунд!',until:8});}return dispatch.call(this,event);};});await noticeFrame.waitForFunction(()=>document.querySelector('#ss-notice')?.textContent.includes('gets a machine gun for 8 seconds!'),null,{timeout:8000});const notice=await noticeFrame.locator('#ss-notice').textContent();console.log('LOCALIZED_RENDERER_FIXTURE_NOTICE',notice);assert.ok(!notice.includes('получает'));await tv.screenshot({path:path.join(output,id+'-tv-'+width+'.png')});const f=tv.frames().find(f=>f.url().includes('/games/'+id+'/'));console.log(id,'TV',width,await f.evaluate(()=>({canvas:document.querySelector('canvas')?.getBoundingClientRect().toJSON(),inset:getComputedStyle(document.documentElement).getPropertyValue('--party-stage-inset-top'),seats:[...document.querySelectorAll('.seat')].map(n=>n.getBoundingClientRect().toJSON()),labels:[...document.querySelectorAll('.hockey-last-hitter')].map(n=>({visible:!n.hidden,name:n.textContent}))})));}
  await api({type:'stop'});await sleep(500);
 }
 console.log('ERRORS',report.errors);assert.deepEqual(report.errors,[]);
 }finally{clearTimeout(deadline);await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
