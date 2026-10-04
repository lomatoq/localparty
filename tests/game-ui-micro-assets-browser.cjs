'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const{webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright'),catalog=require('../lib/catalog');
const dependencies=['public/tv.html','public/bridge.js','public/tv.js','public/game-ui-micro-assets.js','public/game-ui-micro-assets.css'];
const hashes=()=>Object.fromEntries(dependencies.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
(async()=>{const sourceStart=hashes(),browser=await webkit.launch();try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),decorRequests=[],errors=[],report=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(/micro-assets|micro-attachments|top-cap-matte/.test(request.url()))decorRequests.push(request.url());});
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.hostname!=='micro-off.test')return route.abort();
  if(url.pathname.startsWith('/games/')){const id=url.pathname.split('/')[2];return route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><style>body{margin:0;background:#172a32;color:white}[data-tv-hud-rail]{position:absolute;left:24px;top:24px;width:320px;height:500px}[data-tv-hud-anchor]{position:absolute;inset:0}.ss-host-top,.tv-heading{position:absolute;top:0;left:25%;width:50%;height:120px;background:#28515a}</style><script src="/bridge.js" data-prefix="/games/${id}"></script></head><body><main data-tv-hud-anchor><section data-tv-hud-cluster>Actual bridge fixture</section></main><aside data-tv-hud-rail></aside><header class="${id==='bow_club'?'tv-heading':'ss-host-top'}">Game-owned header</header></body></html>`});}
  if(url.pathname==='/tv-show.js')return route.fulfill({contentType:'text/javascript',body:'window.LocalPartyShow={create:()=>({update(){document.getElementById("tvStage").classList.add("tv-show-ready");document.getElementById("tvStartup").hidden=true;},setConnected(){},gameLoaded(){},canIdle(){return false;}})};'});
  const file=path.resolve('public',url.pathname==='/tv'?'tv.html':url.pathname.slice(1));if(!file.startsWith(path.resolve('public')+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
  if(url.pathname==='/tv')return route.fulfill({contentType:'text/html',body:fs.readFileSync(file,'utf8').replace('<script defer src="/tv-show.js">','<script defer src="/tv-invitation.js"></script><script defer src="/tv-show.js">')});
  return route.fulfill({path:file,contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':undefined});
 });
 await page.addInitScript(()=>{class Socket{static CLOSED=3;constructor(){this.readyState=1;window.__offSocket=this;setTimeout(()=>this.onopen?.(),0);}send(){}emit(message){this.onmessage?.({data:JSON.stringify(message)});}close(){this.readyState=3;this.onclose?.();}}window.WebSocket=Socket;});
 await page.goto('http://micro-off.test/tv');await page.waitForFunction(()=>window.__offSocket?.onmessage);
 const room={type:'state',catalog,players:[{id:'a',name:'Anna',connected:true}],urls:[],leaderboard:[],networkEnabled:false};
 for(const width of[1280,1920]){
  await page.setViewportSize({width,height:width*9/16});
  for(const game of catalog){
   await page.evaluate(({room,id})=>{__offSocket.emit({type:'display-ok'});__offSocket.emit({...room,active:{id,instance:'off-'+id,roster:room.players,ui:{phase:'playing',label:'Match',progress:'2 / 5',serverNow:Date.now(),endsAt:Date.now()+23000}}});},{room,id:game.id});
   await page.waitForFunction(id=>document.querySelector('#gameFrame').contentWindow.location.pathname.includes('/'+id+'/'),game.id);
   const frame=page.frames().find(f=>f.url().includes('/games/'+game.id+'/'));await frame.waitForLoadState();await frame.waitForFunction(()=>document.documentElement.classList.contains('party-host'));
   for(const target of[page,frame]){
    assert.equal(await target.locator('.hp-game-ui-micro-cuff').count(),0,'No micro canvas exists on '+game.id);
    assert.equal(await target.locator('script[src*="game-ui-micro-assets"],link[href*="game-ui-micro-assets"]').count(),0,'No decorator code/styles load on '+game.id);
   }
   report.push({game:game.id,width,profile:'disabled',parentCanvases:0,childCanvases:0});
  }
 }
 assert.deepEqual(decorRequests,[],'No decoration scripts, styles, metadata or artwork are requested');assert.deepEqual(errors,[]);assert.deepEqual(hashes(),sourceStart);
 fs.writeFileSync('/private/tmp/micro-disabled-fixture-report.json',JSON.stringify({sourceStart,sourceEnd:hashes(),decorRequests,errors,report},null,2));
 console.log('PASS all36 ×1280/1920 real TV DOM +bridge route:zero micro canvases/injections/asset requests;explicit disabled profile;stable sources');
 }finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
