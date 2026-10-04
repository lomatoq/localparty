'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const root=path.resolve(process.env.QA_OUTPUT||'.localparty-build/waiting-layout-before'),output=root;fs.mkdirSync(output,{recursive:true});
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

 for(const id of ['push']){
  await api({type:'bots-set',count:3});await sleep(500);await api({type:'launch',id});
  await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);
  await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled);await sleep(500);
  for(const width of [320,375,393]){await phone.setViewportSize({width,height:width===320?568:width===375?667:852});for(const extended of [false,true]){await phone.evaluate(long=>{const d=document.querySelector('.waiting-details');d.open=long;const roster=document.querySelector('#waitingRoster');if(long){roster.replaceChildren(...Array.from({length:16},(_,i)=>{const n=document.createElement('span');n.className='waiting-player';n.textContent='АлександраОченьДлинноеИмя'+i;return n}));d.querySelectorAll('p').forEach(p=>p.textContent='Двигайте пальцем по экрану, избегайте препятствий и помогайте своей команде. '.repeat(8));}},extended);await sleep(200);const checks=await phone.evaluate(()=>{const ready=document.querySelector('#readyButton').getBoundingClientRect(),footer=document.querySelector('#sessionControls').getBoundingClientRect(),w=document.querySelector('#waitingRules'),header=document.querySelector('.app-header').getBoundingClientRect();const c=document.querySelector('#waitingContent'),cs=getComputedStyle(c);return{content:{display:cs.display,overflow:cs.overflow,height:cs.height,rect:c.getBoundingClientRect().toJSON(),style:c.getAttribute('style')},ready:ready.toJSON(),footer:footer.toJSON(),waiting:w.getBoundingClientRect().toJSON(),header:header.toJSON(),horizontal:document.documentElement.scrollWidth-innerWidth,waitingHorizontal:w.scrollWidth-w.clientWidth,hit:document.elementFromPoint(ready.x+ready.width/2,ready.y+ready.height/2)?.id}});assert.equal(checks.horizontal,0);assert.equal(checks.waitingHorizontal,0);assert.ok(checks.ready.bottom<=checks.footer.top);assert.equal(checks.hit,'readyButton');assert.ok(Math.abs(checks.waiting.top-checks.header.bottom)<1);console.log(width,extended,JSON.stringify(checks));await phone.screenshot({path:path.join(output,'push-'+width+(extended?'-long':'')+'.png')});}}
  await phone.locator('#readyButton').click();await sleep(1500);let active=(await api()).active;if(active?.ui?.phase==='waiting')await api({type:'force-start',instance:active.instance});await phone.waitForFunction(()=>document.getElementById('waitingRules').hidden);assert.equal(await phone.locator('#waitingRules').evaluate(n=>getComputedStyle(n).display),'none');console.log('PASS waiting lifecycle hides grid during gameplay');
  await api({type:'stop'});await sleep(500);
 }
 console.log('ERRORS',report.errors);assert.deepEqual(report.errors,[]);
 }finally{clearTimeout(deadline);await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
