'use strict';
// Read-only production diagnosis: preserve real initial loading and TV resize.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{spawn}=require('child_process'),{WebSocket}=require('ws');
const {webkit}=require('/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {ProfileStore}=require('../../lib/profile-store');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/ui-rework-2026-10-02/group07-menu-wordmark-diagnostic');
fs.mkdirSync(out,{recursive:true});
const watched=['public/tv.js','public/tv.html','public/tv-layout.js','public/game-logo-renderer.js','public/motion.js','public/motion.css','public/branding.css','public/tv.css','public/tv-menu-polish.css','public/background-scene.css','public/catalog-previews.js','server.js'];
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),hashes=()=>Object.fromEntries(watched.map(f=>[f,hash(f)]));
const store=new ProfileStore(null),profiles=['Alexandra LongSurname','Jordan','Christopher LongSurname'].map(n=>store.register(null,n,'right'));
for(let n=0;n<3;n++)store.record({eventId:'wordmark-fixture-'+n,players:profiles.map((p,i)=>({id:p.id,score:100-i*20,rank:i+1,won:i===0}))},'menu-qa','push');
store.data.tvOptions={autoPodium:false,effects:true,idleBrowse:false,idleBrowseSet:true};
const data=path.join(out,'isolated-room.json');fs.writeFileSync(data,JSON.stringify(store.data));
const report={startedAt:new Date().toISOString(),method:'Real isolated launcher and WebSocket joins2; company results seeded through ProfileStore.record, not played wins. Initial1280 and real1920→1280 resize; no production/DOM/style/canvas mutation. Read actual image/canvas pixels/styles/animations; WebKit, not physical TV.',sourceStart:hashes(),screens:[],errors:[]};
const server=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_DATA_FILE:data,PARTY_EPHEMERAL:'0',PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'group07-wordmark'}});
let log='',browser;const peers=[];server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
async function until(fn,label,limit=45000){const end=Date.now()+limit;while(Date.now()<end){if(await fn())return;await sleep(50);}throw Error(label);}
async function shot(page,file,readPixels=true){await page.screenshot({path:path.join(out,file)});const metrics=await page.evaluate(()=>{
 const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
 const styles=e=>{const s=getComputedStyle(e);return Object.fromEntries(['display','visibility','opacity','position','left','top','width','height','zIndex','zoom','transform','translate','scale','clipPath','maskImage','overflow','filter','contentVisibility'].map(k=>[k,s[k]]));};
 const animations=e=>e.getAnimations().map(a=>({currentTime:a.currentTime,playState:a.playState,timing:a.effect.getComputedTiming(),keyframes:a.effect.getKeyframes()}));
 return [...document.querySelectorAll('#tvCatalog .game')].slice(0,5).map(card=>{
  const img=card.querySelector('.lp-card-game-logo'),canvas=img?.parentElement.querySelector('canvas.hp-smooth-game-logo');let pixels=null;

  const ancestors=[];for(let e=img;e&&e!==document.body;e=e.parentElement)ancestors.push({tag:e.tagName,class:e.className,rect:rect(e),styles:styles(e),animations:animations(e)});
  return{id:card.dataset.id,cardClass:card.className,headingClass:img?.parentElement.className,image:img?{src:img.currentSrc,complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,offsetLeft:img.offsetLeft,offsetTop:img.offsetTop,style:img.getAttribute('style'),rect:rect(img),styles:styles(img),dataset:{...img.dataset}}:null,canvas:canvas?{width:canvas.width,height:canvas.height,hidden:canvas.hidden,style:canvas.getAttribute('style'),rect:rect(canvas),styles:styles(canvas),pixels}:null,ancestors};
 });
 });const entry={file,capturedAt:new Date().toISOString(),viewport:page.viewportSize(),metrics};report.screens.push(entry);await page.screenshot({path:path.join(out,file.replace('.png','-after-styles.png'))});entry.afterStyles=file.replace('.png','-after-styles.png');if(readPixels){entry.pixelRead=await page.evaluate(()=>[...document.querySelectorAll('#tvCatalog .game')].slice(0,5).map(card=>{const c=card.querySelector('canvas.hp-smooth-game-logo');if(!c)return{id:card.dataset.id,missingCanvas:true};const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let alphaSum=0,occupiedPixels=0;for(let i=3;i<d.length;i+=4){alphaSum+=d[i];if(d[i])occupiedPixels++;}return{id:card.dataset.id,width:c.width,height:c.height,alphaSum,occupiedPixels};}));entry.afterPixelRead=file.replace('.png','-after-pixel-read.png');await page.screenshot({path:path.join(out,entry.afterPixelRead)});}save();}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'server');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 for(const p of profiles.slice(0,2)){const ws=new WebSocket(origin.replace('http','ws')+'/lobby');peers.push(ws);await new Promise((resolve,reject)=>{ws.once('error',reject);ws.once('open',()=>ws.send(JSON.stringify({type:'join',name:p.name,token:p.token,hand:'right'})));ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='joined')resolve();if(m.type==='error')reject(Error(m.message));});});}
 browser=await webkit.launch({headless:true});
 for(const initialWidth of [1280,1920]){
  const page=await browser.newPage({viewport:{width:initialWidth,height:initialWidth===1280?720:1080}});await page.addInitScript(()=>localStorage.setItem('local-party-language','en'));page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(origin+'/tv');await page.locator('#tvStage.tv-show-ready').waitFor();await until(()=>page.locator('#tvStartup').isHidden(),'startup');
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled([...document.images].filter(i=>i.src).map(i=>i.decode()));});await sleep(3800);
  await shot(page,'initial-'+initialWidth+'-settled.png',initialWidth===1280);
  if(initialWidth===1920){await page.setViewportSize({width:1280,height:720});await shot(page,'resize-1280-immediate.png',false);await page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled([...document.images].filter(i=>i.src).map(i=>i.decode()));});await sleep(3800);await shot(page,'resize-1280-3800.png');await sleep(4200);await shot(page,'resize-1280-8000.png');await sleep(4000);await shot(page,'resize-1280-12000.png');}
  for(const enabled of [true,false]){const res=await fetch(origin+'/api/manage',{method:'POST',headers:{Authorization:'Bearer group07-wordmark','Content-Type':'application/json'},body:JSON.stringify({type:'network-set',enabled})});assert(res.ok);await until(()=>enabled?page.locator('#qr').isVisible():page.locator('#qr').isHidden(),'actual network toggle');await sleep(3800);await shot(page,'network-'+(enabled?'on':'off')+'-initial'+initialWidth+'-at1280.png');}
  await page.close();
 }
 report.ok=true;
 }catch(e){report.failure=e.stack;process.exitCode=1;}finally{report.sourceEnd=hashes();report.changedFiles=watched.filter(f=>report.sourceStart[f]!==report.sourceEnd[f]);report.finishedAt=new Date().toISOString();save();fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();peers.forEach(p=>p.close());server.kill();console.log(JSON.stringify({ok:report.ok,screens:report.screens.length,errors:report.errors,changedFiles:report.changedFiles}));}})();
