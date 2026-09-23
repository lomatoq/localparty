'use strict';
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'../public');
const styles=['style','refresh','glass','ux','catalog-previews','fresh','motion','polish'];
const fixture=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${styles.map(s=>`<link rel="stylesheet" href="/${s}.css">`).join('')}</head><body class="is-player in-game"><header class="app-header"><div id="hudTimer" class="clock-block"><small id="hudLabel">TURN</small><strong id="hudValue">22</strong><span id="hudProgress">TURN 3 / 10</span></div></header></body></html>`;
(async()=>{
 const server=http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.css')?'text/css':'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage();
  for(const width of [320,390,768,1440])for(const sample of [{game:'pocket_siege',value:'22',progress:'TURN 3 / 10'},{game:'taprace',value:'01:24',progress:'ROUND 1 / 3'},{game:'warsaw',value:'PAUSE',progress:'QUESTION 3 / 8',word:true}]){
   await page.setViewportSize({width,height:844});await page.goto(`http://127.0.0.1:${server.address().port}/`);
   await page.evaluate(({sample,width})=>{document.body.className=(width>850?'is-host':'is-player')+' in-game';document.body.dataset.gameId=sample.game;document.querySelector('#hudValue').textContent=sample.value;document.querySelector('#hudProgress').textContent=sample.progress;document.querySelector('#hudTimer').classList.toggle('word-time',!!sample.word);},{sample,width});
   const layout=await page.evaluate(()=>{const box=id=>{const r=document.querySelector(id).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};const timer=document.querySelector('#hudTimer'),s=getComputedStyle(timer);return{label:getComputedStyle(document.querySelector('#hudLabel')).display,timer:box('#hudTimer'),value:box('#hudValue'),progress:box('#hudProgress'),paddingTop:parseFloat(s.paddingTop),paddingBottom:parseFloat(s.paddingBottom),paddingLeft:parseFloat(s.paddingLeft)};});
   assert.equal(layout.label,'none');assert(layout.value.y-layout.timer.y<=layout.paddingTop+1,'value is lifted to top inset');assert(layout.progress.bottom<=layout.timer.bottom-10,'progress keeps bottom inset');assert(layout.progress.x>=layout.timer.x+20,'progress avoids sloped left edge');assert(layout.progress.right<=layout.timer.right-20,'progress avoids sloped right edge');assert(layout.progress.y>=layout.value.bottom,'rows never overlap');
   if(sample.game==='pocket_siege')await page.screenshot({path:`/private/tmp/shared-hud-notch-${width}.png`,animations:'disabled'});
  }
  console.log('PASS shared notch WebKit:12 game/viewport cases, hidden duplicate caption, raised value, inset progress');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
