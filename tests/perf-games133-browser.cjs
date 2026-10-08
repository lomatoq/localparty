'use strict';
// Real Canvas rendering: same snapshot and deterministic clock before/after
// the geometry cache, including a changed viewport. No frame-rate claims.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),express=require('express');
const {chromium}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {Arcade}=require('../games/arcade/simulation');
const out=path.resolve('output/playwright/perf-games133');fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync('games/arcade/public/app.js','utf8');
const baseline=source.replace('const r=arcadeFrameRect,m=', 'const r=c.getBoundingClientRect(),m=').replace('const rect=arcadeFrameRect,m=', 'const rect=c.getBoundingClientRect(),m=').replace('const t=g.getTransform(),r=arcadeFrameRect,sx=', 'const t=g.getTransform(),r=c.getBoundingClientRect(),sx=');
const report={rows:[],errors:[]};
(async()=>{
 const app=express();app.get('/baseline/app.js',(_,res)=>res.type('js').send(baseline));app.use('/baseline',express.static('games/arcade/public'));app.use('/arcade',express.static('games/arcade/public'));app.use('/deluxe',express.static('games/arcade_deluxe/public'));app.use(express.static('public'));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const base=`http://127.0.0.1:${server.address().port}`;
  for(const mode of ['hungry','flappy','snakelines','carryball']){
   const game=new Arcade(mode,()=>.4);for(let i=0;i<16;i++)game.join('p'+i,'Player '+i);game.start();const snapshot=game.view(),pages=[];
   for(const variant of ['baseline','arcade']){
    const page=await browser.newPage({viewport:{width:1280,height:720}});pages.push(page);page.on('pageerror',e=>report.errors.push(e.message));
    await page.addInitScript(()=>{window.frameQueue=[];window.requestAnimationFrame=fn=>(frameQueue.push(fn),frameQueue.length);window.cancelAnimationFrame=()=>{};performance.now=()=>1000;Math.random=()=>.4;window.WebSocket=class{readyState=1;send(){}close(){}};});
    await page.goto(base+'/'+variant+'/host.html');await page.evaluate(s=>{state=s;update();},snapshot);await page.waitForTimeout(250);
   }
   for(const viewport of [{width:1280,height:720},{width:1920,height:1080}]){
    const results=[];for(const page of pages){await page.setViewportSize(viewport);results.push(await page.evaluate(()=>{const canvas=document.querySelector('canvas'),read=canvas.getBoundingClientRect.bind(canvas);let reads=0;canvas.getBoundingClientRect=()=>{reads++;return read();};const callbacks=frameQueue.splice(0);callbacks.forEach(fn=>fn(1000));canvas.getBoundingClientRect=read;return {reads,pixels:canvas.toDataURL(),bounds:window.ArcadeHungryBounds};}));}
    assert.equal(results[1].pixels,results[0].pixels,mode+' canvas pixels changed');assert.deepEqual(results[1].bounds,results[0].bounds,mode+' body diagnostics changed');assert.equal(results[1].reads,1,mode+' should measure once per frame');report.rows.push({mode,...viewport,beforeReads:results[0].reads,afterReads:results[1].reads,pixelIdentical:true});
   }
   await pages[1].screenshot({path:path.join(out,mode+'-1920.png')});for(const page of pages)await page.close();
  }
  const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(base+'/deluxe/geometry.js');
  report.destroy=await page.evaluate(async()=>{const {Renderer}=await import('/deluxe/render.js');document.body.innerHTML='<canvas></canvas>';const renderer=new Renderer(document.querySelector('canvas'));cancelAnimationFrame(renderer.raf);renderer.raf=0;let closed=0;renderer.audio.ctx={close(){closed++;}};renderer.s={mode:'pocket_siege',terrain:[1,2,3]};renderer.previous=renderer.s;renderer.pathCanvas=document.createElement('canvas');renderer.terrainCanvas=document.createElement('canvas');renderer.juice.parts.push({});renderer.destroy();renderer.destroy();renderer.setState({mode:'pocket_siege',phase:'playing'});renderer.frame(performance.now());dispatchEvent(new Event('resize'));return{closed,raf:renderer.raf,state:renderer.s,previous:renderer.previous,terrain:renderer.terrainCanvas,path:renderer.pathCanvas,parts:renderer.juice.parts.length};});
  assert.deepEqual(report.destroy,{closed:1,raf:0,state:null,previous:null,terrain:null,path:null,parts:0});assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
