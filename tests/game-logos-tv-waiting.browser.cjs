'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {WebSocket}=require('ws');
const before=process.env.QA_TV_LOGO_BEFORE==='1';
const out=path.resolve(process.env.QA_TV_LOGO_OUTPUT||'.localparty-build/design-round2/tv/'+(before?'before':'after'));fs.mkdirSync(out,{recursive:true});
const report={method:'Actual ephemeral launcher TV waiting states; shipped assets and real controller UI. WebKit1280x720/1920x1080 DPR2. Extra players use real room WebSockets. No physical-TV claim.',capturedAt:new Date().toISOString(),before,games:[],extraStates:[],errors:[],requests:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'tv-wordmark-qa'}});
let log='',browser;const guests=[];child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,label){for(let i=0;i<400;i++){const v=await fn();if(v)return v;await sleep(50);}throw Error(label);}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'server ready');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer tv-wordmark-qa','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});assert(r.ok,await r.clone().text());return r.json();};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:2});tv.on('pageerror',e=>report.errors.push(e.message));tv.on('response',r=>{if(r.url().includes('game-logo-renderer.js'))report.requests.push({url:r.url(),status:r.status()});});
 await tv.goto(origin+'/tv');await tv.waitForFunction(()=>document.querySelector('#tvStartup').hidden);
 const phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});await phone.goto(origin+'/play');await phone.locator('#name').fill('Alex');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
 const catalog=(await api()).catalog;
 async function capture(id,width,suffix=''){
  const height=width===1280?720:1080;await tv.setViewportSize({width,height});
  await tv.waitForFunction(()=>{const r=document.getElementById('tvStage').getBoundingClientRect();return Math.abs(r.right-innerWidth)<1&&Math.abs(r.bottom-innerHeight)<1;});
  await tv.waitForFunction(id=>window.PARTY_GAME?.id===id&&window.PARTY_UI?.phase==='waiting'&&!document.getElementById('waiting').hidden,id);
  await tv.waitForFunction(()=>document.getElementById('tvSceneTransition').hidden);await tv.evaluate(()=>document.fonts.ready);
  await tv.locator('#tvStage').evaluate(async el=>{await Promise.allSettled(el.getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished));});
  if(!before)await tv.waitForFunction(()=>{const img=document.querySelector('#waitingGameTitle .waiting-game-logo'),c=img?.parentElement.querySelector('.hp-smooth-game-logo'),s=img&&getComputedStyle(img);let zoom=1;for(let n=img;n;n=n.parentElement)zoom*=parseFloat(getComputedStyle(n).zoom)||1;return img?.complete&&img.naturalWidth>=1000&&img.dataset.hpLogoSmooth==='ready'&&c.width===Math.round(parseFloat(s.width)*Math.min(devicePixelRatio,3)*zoom)&&c.height===Math.round(parseFloat(s.height)*Math.min(devicePixelRatio,3)*zoom);});
  const geometry=await tv.evaluate(()=>{
   const rect=n=>{if(!n)return null;const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};const waiting=document.getElementById('waiting'),logo=waiting.querySelector('.waiting-game-logo'),canvas=logo?.parentElement.querySelector('.hp-smooth-game-logo'),bar=document.querySelector('#play .gamebar'),visible=getComputedStyle(bar).display!=='none',hud=visible?rect(bar):null;
   return{viewport:{width:innerWidth,height:innerHeight},dpr:devicePixelRatio,zoom:getComputedStyle(document.getElementById('tvStage')).zoom,waiting:rect(waiting),masthead:rect(document.querySelector('.tv-header')),hud,safeTop:hud?.bottom||rect(document.querySelector('.tv-header')).bottom,logo:rect(logo),naturalWidth:logo?.naturalWidth||0,naturalHeight:logo?.naturalHeight||0,logoLayout:logo?{width:parseFloat(getComputedStyle(logo).width),height:parseFloat(getComputedStyle(logo).height)}:null,painted:canvas?{box:rect(canvas),width:canvas.width,height:canvas.height,sourceOpacity:getComputedStyle(logo).opacity}:null,title:rect(document.getElementById('waitingTitle')),hint:rect(document.getElementById('waitingHint')),players:rect(document.getElementById('readyPlayers')),playerNames:[...document.querySelectorAll('#readyPlayers .ready-name')].map(n=>({text:n.textContent,rect:rect(n)})),readyCount:rect(document.getElementById('readyCount')),horizontal:document.documentElement.scrollWidth-innerWidth,waitingText:waiting.textContent};
  });
  assert.equal(geometry.horizontal,0,id+' no horizontal overflow');assert(geometry.readyCount.bottom<=height+1,id+' count reachable');assert(geometry.players.bottom<=geometry.readyCount.y+1,id+' roster/count');
  if(!before){assert.equal(geometry.painted.sourceOpacity,'0');assert(geometry.logo.y>=geometry.safeTop-1,id+' logo below complete masthead/notch');assert(geometry.logo.bottom<=geometry.title.y+1,id+' logo/status separated');assert(geometry.logo.x>=0&&geometry.logo.right<=width+1,id+' logo horizontal containment');assert(Math.abs(geometry.painted.box.x-geometry.logo.x)<.6&&Math.abs(geometry.painted.box.y-geometry.logo.y)<.6,id+' painted alignment');assert(Math.abs(geometry.painted.box.width-geometry.logo.width)<.6&&Math.abs(geometry.painted.box.height-geometry.logo.height)<.6,id+' painted zoom alignment');assert.equal(geometry.painted.width,Math.round(geometry.logoLayout.width*Math.min(geometry.dpr,3)*parseFloat(geometry.zoom)));assert.equal(geometry.painted.height,Math.round(geometry.logoLayout.height*Math.min(geometry.dpr,3)*parseFloat(geometry.zoom)));}
  const file=id+'-'+width+(suffix?'-'+suffix:'')+'.png';await tv.screenshot({path:path.join(out,file)});return{width,height,file,geometry};
 }
 for(const game of catalog.filter(g=>!process.env.QA_TV_LOGO_IDS||process.env.QA_TV_LOGO_IDS.split(',').includes(g.id))){
  await api({type:'stop'});await api({type:'bots-set',count:Math.max(0,game.min-1)});await api({type:'launch',id:game.id});await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),game.id);await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled);
  const row={id:game.id,screens:[]};report.games.push(row);for(const width of [1280,1920])row.screens.push(await capture(game.id,width));console.log('PASS TV waiting',game.id);
 }
 if(process.env.QA_TV_LOGO_FALLBACK==='1'){
  await tv.route('**/assets/game-logos-v1/logos/shrink.png*',route=>route.fulfill({status:404,body:'logo unavailable'}));
  await api({type:'stop'});await api({type:'bots-set',count:1});await api({type:'launch',id:'shrink'});
  await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled);
  await tv.waitForFunction(()=>window.PARTY_GAME?.id==='shrink'&&window.PARTY_UI?.phase==='waiting'&&document.getElementById('tvSceneTransition').hidden&&!document.querySelector('#waitingGameTitle .waiting-game-logo')&&!document.querySelector('#waitingGameTitle .hp-smooth-game-logo'));
  for(const width of [1280,1920]){
   await tv.setViewportSize({width,height:width===1280?720:1080});await tv.waitForFunction(()=>{const r=document.getElementById('tvStage').getBoundingClientRect();return Math.abs(r.right-innerWidth)<1&&Math.abs(r.bottom-innerHeight)<1;});
   const fallback=await tv.locator('#waitingGameTitle').evaluate(n=>{const a=n.getBoundingClientRect(),s=getComputedStyle(n.querySelector('.waiting-game-title'));return{text:n.textContent,loaded:n.classList.contains('waiting-logo-loaded'),width:a.width,height:a.height,scrollWidth:n.scrollWidth,fontSize:parseFloat(getComputedStyle(n).fontSize),clip:s.clipPath,position:s.position,readyCount:document.getElementById('readyCount').getBoundingClientRect().bottom,viewport:innerHeight};});
   assert.equal(fallback.text,await tv.evaluate(title=>window.PartyI18n.t(title),catalog.find(g=>g.id==='shrink').title));assert(!fallback.loaded);assert.equal(fallback.fontSize,36);assert(fallback.height>=36&&fallback.scrollWidth<=fallback.width+1,'fallback text is readable and contained');assert.equal(fallback.clip,'none');assert(fallback.readyCount<=fallback.viewport+1);
   const file='shrink-'+width+'-asset-404.png';await tv.screenshot({path:path.join(out,file)});report.extraStates.push({state:'asset-404',file,geometry:fallback});
  }
  await tv.unroute('**/assets/game-logos-v1/logos/shrink.png*');await api({type:'stop'});await api({type:'launch',id:'push'});await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled);
  report.extraStates.push({...await capture('push',1280,'recovered'),state:'recovered'});
 }
 if(!before&&(!process.env.QA_TV_LOGO_IDS||process.env.QA_TV_LOGO_EXTRAS==='1')){
  await api({type:'stop'});await api({type:'bots-set',count:0});
  for(let i=0;i<15;i++){const ws=new WebSocket(origin.replace('http','ws')+'/lobby');guests.push(ws);await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('guest join timeout')),5000);ws.on('open',()=>ws.send(JSON.stringify({type:'join',name:i===0?'Alexandria Extremely Long Player Name':`Guest ${i+1}`})));ws.on('message',data=>{if(JSON.parse(data).type==='joined'){clearTimeout(timer);resolve();}});ws.on('error',reject);});}
  await until(async()=>(await api()).players.length===16,'16 real room members');const launched=await api({type:'launch',id:'push'});for(const ws of guests)ws.send(JSON.stringify({type:'game-status',status:'ready',instance:launched.active.instance}));await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled);
  for(const width of [1280,1920]){const s=await capture('push',width,'16-players');assert.equal(s.geometry.playerNames.length,16);assert(s.geometry.playerNames.every(n=>n.rect.bottom<=s.geometry.players.bottom+1),'all16 names in roster');report.extraStates.push(s);}
  await api({type:'stop'});await tv.waitForFunction(()=>document.getElementById('play').hidden&&!document.getElementById('lobby').hidden&&document.getElementById('tvSceneTransition').hidden);await tv.evaluate(()=>document.fonts.ready);await tv.screenshot({path:path.join(out,'lobby-after-stop.png')});report.extraStates.push({state:'lobby-after-stop',file:'lobby-after-stop.png'});
 }
 assert.deepEqual(report.errors,[]);if(!before)assert(report.requests.length&&report.requests.every(r=>r.status===200),'shipped renderer loaded through actual TV route');console.log('PASS',report.games.length,'TV games');
}finally{for(const ws of guests)ws.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();}})().catch(e=>{report.failure=e.message;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
