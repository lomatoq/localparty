'use strict';
// Labelled renderer stress fixtures. They are not engine outcomes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {placeOf,descriptors}=require('../public/rankings-theme');
assert.deepEqual(placeOf('01'),{rank:1,digit:'01'});assert.deepEqual(placeOf('#12'),{rank:12,digit:'12'});
for(const value of ['0','—','★','♥','Queue','12/16'])assert.equal(placeOf(value),null);
assert.equal(descriptors.jenga,undefined);
for(const list of Object.values(descriptors))for(const d of list){assert(!d.ordinal);assert(!/score-chip|ss-player-card|playerList|seats|readGrid/.test(d.rows));}
const out=path.resolve(process.env.AUDIT_OUTPUT||'.localparty-build/rankings111/stress-fixtures');fs.mkdirSync(out,{recursive:true});
const files=['public/rankings-theme.css','public/rankings-theme.js','public/background-scene.css','public/game-polish.css','public/game-ui-system.css','public/branding.css','public/native-shell/controller-bridge.js','public/native-shell/tabs.js'];
const report={method:'Explicit renderer fixtures only: author-supplied places including ties,16 rows, Cyrillic long names, zeros and large/formatted scores. No engine state or game result injected.',source:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),runs:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'rank-fixture'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,label){for(let i=0;i<600;i++){if(await fn())return;await sleep(50);}throw Error(label);}
async function measure(p){return p.evaluate(()=>{
 const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
 const ink=e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect(),ctx=document.createElement('canvas').getContext('2d'),font=c.fontStyle+' '+c.fontWeight+' '+c.fontSize+' '+c.fontFamily;ctx.font=font;const m=ctx.measureText(e.textContent.trim());let zoom=1;for(let n=e;n;n=n.parentElement)zoom*=parseFloat(getComputedStyle(n).zoom)||1;return{left:r.left+(parseFloat(c.paddingLeft)-m.actualBoundingBoxLeft)*zoom,right:r.left+(parseFloat(c.paddingLeft)+m.actualBoundingBoxRight)*zoom,ascent:m.actualBoundingBoxAscent*zoom,descent:m.actualBoundingBoxDescent*zoom,font,size:parseFloat(c.fontSize),zoom};};
 return{w:innerWidth,h:innerHeight,horizontal:document.documentElement.scrollWidth-innerWidth,rows:[...document.querySelectorAll('.hp-ranking-row,.hp-ranking-podium')].map(e=>{
  const place=e.querySelector('.hp-ranking-place'),digit=e.querySelector('.hp-ranking-digit,.hp-place-digit'),name=e.querySelector('.hp-ranking-identity,.podium-name'),score=e.querySelector('.hp-ranking-score'),clip=e.querySelector('.podium-plinth')||e;
  return{rank:e.dataset.hpRank,row:box(e),clip:box(clip),place:place?box(place):null,digit:digit?{box:box(digit),ink:ink(digit)}:null,name:name?box(name):null,score:score?{box:box(score),ink:ink(score),value:score.textContent.trim(),opacity:getComputedStyle(score).opacity}:null,cup:!!e.querySelector('.hp-ranking-cup'),photo:e.querySelector('.hp-ranking-photo')?{overflow:getComputedStyle(e.querySelector('.hp-ranking-photo')).overflow,z:getComputedStyle(e.querySelector('.hp-ranking-photo'),'::after').zIndex}:null};
 })};
 });}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'local fixture server');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 browser=await webkit.launch({headless:true});
 const names=['Александра ОченьДлиннаяФамилия','Jordan Alexandra','Taylor','Morgan','Robin','Casey','Jamie','Alex','Riley','Cameron','Александр ДлиннаяФамилия','Alexandra LongSurname','Kim','Sam','Drew','Charlie'];
 const ranks=[1,2,2,4,5,6,7,8,9,10,11,12,13,14,15,16],values=[1234567,1000,1000,0,123456789,0,1000,9999999,0,1234567,1000000,0,9999999,1000,0,0];
 const entries=names.map((name,i)=>({id:'fixture-'+i,name,rank:ranks[i],value:values[i],score:values[i],points:values[i]}));
 const phone=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:'reduce'});phone.on('pageerror',e=>report.errors.push(e.message));
 // Keep the actual styles and shared renderer, omit the networking shell in a
 // fixture so incoming lobby snapshots cannot replace illustrative content.
 await phone.route('**/app.js*',r=>r.fulfill({status:200,contentType:'text/javascript',body:''}));await phone.goto(origin+'/play');await phone.waitForFunction(()=>window.HeyPalsMatchResults&&window.HeyPalsRankingsTheme);
 for(const [w,h]of[[320,568],[393,852],[402,874]]){
  await phone.setViewportSize({width:w,height:h});await phone.evaluate(entries=>{
   document.body.classList.add('is-player','in-game');document.getElementById('lobby').hidden=true;document.getElementById('play').hidden=false;document.getElementById('gameFrame').hidden=true;
   HeyPalsMatchResults.update({active:{id:'qa-fixture',instance:'explicit-renderer-fixture',ui:{phase:'results'},result:{key:'fixture-large-scores',title:'QA FIXTURE · RESULTS',rows:entries}},selfId:entries[11].id});HeyPalsRankingsTheme.refresh();
  },entries);
  await phone.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.hp-ranking-cup')].filter(e=>{const r=e.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;}).map(e=>e.decode().catch(()=>{})));});await sleep(100);
  const m=await measure(phone);report.lastMetrics=m;await phone.screenshot({path:path.join(out,'shared-'+w+'-top-fixture.png')});assert.equal(m.horizontal,0);assert.deepEqual(m.rows.map(r=>Number(r.rank)),ranks);assert.deepEqual(m.rows.map(r=>Number(r.score.value)),values);
  for(const r of m.rows){assert(r.digit.ink.right<=r.place.right+1,'painted place exceeds reserved rail: '+JSON.stringify(r));assert(r.score.ink.right<=r.row.right-2,'score italic ink clips right edge: '+JSON.stringify(r));assert(r.score.ink.left>=r.name.right-1,'score overlaps name: '+JSON.stringify(r));assert(Math.abs(r.score.box.y+r.score.box.h/2-r.row.y-r.row.h/2)<1,'score must stay centered in right column');assert.equal(r.score.opacity,'0.84');}
  assert.equal(await phone.locator('#catalogFilters').evaluate(e=>getComputedStyle(e).display),'none','Result state hides lobby catalogue tabs even when display:grid branding is important');
  const file='shared-'+w+'-top-fixture.png';await phone.screenshot({path:path.join(out,file)});report.runs.push({surface:'shared',w,h,file,metrics:m});
  await phone.locator('.hp-result-scroll').evaluate(e=>e.scrollTop=e.scrollHeight);await sleep(80);const last=await phone.locator('.hp-result-row').last().boundingBox(),scroll=await phone.locator('.hp-result-scroll').boundingBox();assert(last.y+last.height<=scroll.y+scroll.height+1,'last row unreachable');
  const endFile='shared-'+w+'-places10-16-fixture.png';await phone.screenshot({path:path.join(out,endFile)});report.runs.push({surface:'shared-end',w,h,file:endFile});
  if(w===320){await phone.locator('.hp-result-scroll').evaluate(e=>{const row=[...e.querySelectorAll('.hp-result-row')].find(r=>r.dataset.hpRank==='13');e.scrollTop+=row.getBoundingClientRect().top-e.getBoundingClientRect().top-8;});await sleep(80);const file='shared-320-place13-anchored-fixture.png';await phone.screenshot({path:path.join(out,file)});report.runs.push({surface:'shared-end-aligned',w,h,file,note:'First visible row13 is whole below the heading. Max-scroll frame separately proves last-row reachability;402 captures all tail rows whole.'});}
 }
 // Semantics: a real rank update decorates its new value; it cannot reorder
 // identities or change score text, and stale cups leave when place becomes12.
 await phone.evaluate(()=>{const row=document.querySelector('.hp-result-row'),place=row.querySelector('.hp-place');place.dataset.place='12';place.dataset.placeDigits='2';place.textContent='12';row.querySelector('.hp-result-value').textContent='0';});await sleep(100);
 const mutation=await phone.evaluate(()=>{const row=document.querySelector('.hp-result-row');return{ids:[...document.querySelectorAll('.hp-result-name')].map(e=>e.textContent),rank:row.dataset.hpRank,cup:!!row.querySelector('.hp-ranking-cup'),score:row.querySelector('.hp-result-value').textContent};});report.mutation=mutation;assert.equal(mutation.rank,'12');assert.equal(mutation.cup,false);assert.equal(mutation.score,'0');assert.equal(mutation.ids[0],names[0]);
 const tv=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});tv.on('pageerror',e=>report.errors.push(e.message));
 // Bootstrap the real TV socket, scaler and startup first. Once the explicitly
 // labelled renderer fixture starts, room lobby snapshots may not replace it.
 await tv.addInitScript(()=>{const Original=WebSocket;function FixtureSocket(...args){const socket=new Original(...args);socket.addEventListener('message',event=>{if(window.qaFixtureActive)event.stopImmediatePropagation();});return socket;}FixtureSocket.prototype=Original.prototype;for(const key of['CONNECTING','OPEN','CLOSING','CLOSED'])FixtureSocket[key]=Original[key];window.WebSocket=FixtureSocket;});
 await tv.goto(origin+'/tv');await tv.waitForFunction(()=>window.LocalPartyTVShow?.diagnostics().ready&&window.HeyPalsRankingsTheme&&document.querySelector('#tvCatalog').children.length);
 for(const [w,h]of[[1280,720],[1920,1080]]){
  await tv.setViewportSize({width:w,height:h});await tv.evaluate(entries=>{
   window.qaFixtureActive=true;document.body.classList.add('tv-in-game');
   const c=document.createElement('canvas');c.width=c.height=24;const ctx=c.getContext('2d');ctx.fillStyle='#6f81bd';ctx.fillRect(0,0,24,24);
   LocalPartyTVShow.setConnected(true);LocalPartyTVShow.update({bootId:'fixture',active:{id:'qa-fixture',instance:'explicit-renderer-fixture',ui:{phase:'results'}},catalog:[{id:'qa-fixture',title:'QA fixture'}],players:entries.map(e=>({...e,avatar:c.toDataURL('image/png')})),tv:{mode:'podium',effects:false,board:{key:'explicit-stress-fixture',title:'QA FIXTURE · PODIUM',subtitle:'Explicit places;16 players; large scores',rows:entries}}});HeyPalsRankingsTheme.refresh();
  },entries);
  await tv.waitForFunction(()=>document.getElementById('tvSceneTransition').hidden&&document.getElementById('tvArrivals')?.children.length!==3);await tv.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#tvPodium img')].map(e=>e.decode().catch(()=>{})));});await sleep(100);const m=await measure(tv);report.lastMetrics=m;await tv.screenshot({path:path.join(out,'tv-'+w+'-16-player-fixture.png')});assert.equal(m.horizontal,0);assert.equal(m.rows.length,16);
  for(const r of m.rows){assert(r.digit.ink.right<=r.clip.right-1,'TV place italic ink clips plinth');assert(r.score.ink.right<=r.clip.right+1,'TV score italic ink clips plinth');assert(r.score.box.bottom<=r.clip.bottom+1,'TV score below plinth');assert(r.digit.box.y>=r.clip.y-1,'TV place above plinth');assert(r.score.ink.font.includes('KardiaFitRunner'),'Actual TV points role must be FitRunner');assert.equal(r.photo.overflow,'visible');assert.equal(r.photo.z,'4');}
  const file='tv-'+w+'-16-player-fixture.png';await tv.screenshot({path:path.join(out,file)});report.runs.push({surface:'tv',w,h,file,metrics:m});
  report.runs[report.runs.length-1].stage=await tv.locator('#tvStage').evaluate(e=>({zoom:e.style.zoom,width:e.style.width,height:e.style.height,rect:JSON.parse(JSON.stringify(e.getBoundingClientRect()))}));
 for(const r of m.rows)assert(r.clip.bottom<=h+1,'TV tail plinth outside actual fitted viewport: '+JSON.stringify(r));
 }
 for(const [w,h]of[[1280,720],[1920,1080]]){
  await tv.setViewportSize({width:w,height:h});await tv.evaluate(entries=>{LocalPartyTVShow.update({bootId:'fixture',active:{id:'qa-fixture',instance:'explicit-renderer-fixture',ui:{phase:'results'}},catalog:[{id:'qa-fixture',title:'QA fixture'}],players:entries,tv:{mode:'podium',effects:false,board:{key:'explicit-four-person-fixture',title:'QA FIXTURE · FOUR PLAYERS',subtitle:'Authoritative places1 /2 /2 /4; zero points',rows:entries}}});HeyPalsRankingsTheme.refresh();},entries.slice(0,4));
  await tv.waitForFunction(()=>document.getElementById('tvSceneTransition').hidden&&!document.getElementById('tvPodium').hidden);await tv.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#tvPodium img')].map(e=>e.decode().catch(()=>{})));});await sleep(80);
  const m=await measure(tv);assert.equal(m.rows.length,4);const last=m.rows.find(r=>r.rank==='4');assert(last.digit.box.y>=last.clip.y&&last.score.box.bottom<=last.clip.bottom);assert(last.clip.bottom<=h);assert(last.score.ink.font.includes('KardiaFitRunner'));const file='tv-'+w+'-four-player-place4-fixture.png';await tv.screenshot({path:path.join(out,file)});report.runs.push({surface:'tv-four',w,h,file,metrics:m});
 }
 assert.deepEqual(report.errors,[]);console.log('PASS explicit ties/order/zero/large scores, reserved place ink, last-row reachability, TV16, photo initial overlay');
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();}})().catch(e=>{report.failure=e.message;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
