'use strict';
// Explicit renderer lifecycle fixtures. Real worker/input coverage lives in
// scripts/performance244-deluxe.cjs; these isolates are not device evidence.
const assert=require('node:assert/strict'),express=require('express'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs');
const {Marbles}=require('../games/arcade_deluxe/core/marbles.cjs');
(async()=>{
 const app=express().use('/assets',express.static('public/assets')).use(express.static('games/arcade_deluxe/public'));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/geometry.js`);
  await page.evaluate(async()=>{
   document.body.innerHTML='<canvas style="width:100vw;height:100vh"></canvas>';
   const {Renderer}=await import('/render.js');window.Renderer=Renderer;
   window.mount=s=>{window.renderer?.destroy();window.renderer=new Renderer(document.querySelector('canvas'));renderer.setState(s);};
  });
  const tanks=new Tanks();tanks.add({id:'a',name:'A long connected player name',connected:true});tanks.add({id:'b',name:'Player B',connected:true});
  await page.evaluate(s=>mount(s),tanks.snapshot());await page.waitForTimeout(300);
  assert(await page.evaluate(()=>renderer.raf>0),'Authored waiting presentation remains live');
  tanks.start();const paused={...tanks.snapshot(),paused:true};await page.evaluate(s=>mount(s),paused);
  await page.waitForFunction(()=>renderer.raf===0);const first=await page.evaluate(()=>renderer.el.toDataURL());
  await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>renderer.el.toDataURL()),first,'Paused rendered pixels stay frozen');
  // A manual repaint of the frozen state must produce the same settled image.
  await page.evaluate(()=>{renderer.frame(performance.now());cancelAnimationFrame(renderer.raf);renderer.raf=0;});
  assert.equal(await page.evaluate(()=>renderer.el.toDataURL()),first,'Parking preserves the complete frozen presentation');
  await page.setViewportSize({width:1280,height:720});await page.waitForFunction(()=>renderer.surfaceRect.width===1280&&renderer.raf===0);
  assert.equal(await page.evaluate(()=>renderer.el.width),1280,'Paused ResizeObserver repaints at existing backing density');
  await page.evaluate(()=>renderer.fontsChanged());await page.waitForFunction(()=>renderer.raf===0);
  await page.evaluate(()=>renderer.assetChanged());assert(await page.evaluate(()=>renderer.raf>0),'Late known art invalidates a parked frame');
  await page.waitForFunction(()=>renderer.raf===0);
  await page.evaluate(()=>{renderer.turnCue={at:performance.now(),player:'a'};renderer.resizeFrame();});
  await page.waitForTimeout(120);assert(await page.evaluate(()=>renderer.raf>0),'Authored turn cue completes before parking');
  await page.waitForFunction(()=>renderer.raf===0);
  await page.evaluate(()=>{renderer.juice.part({img:'private-art',life:10,x:640,y:300,size:20});renderer.resizeFrame();});
  await page.waitForTimeout(120);assert(await page.evaluate(()=>renderer.raf>0),'Private undecoded art keeps its fallback update live');
  await page.evaluate(()=>{renderer.juice.parts=[];});await page.waitForFunction(()=>renderer.raf===0);
  const resumedAge=await page.evaluate(()=>{renderer.setState({...renderer.s,paused:false});return performance.now()-renderer.last;});
  assert(resumedAge<10,'Parked duration is excluded from the next resume timestep');
  assert(await page.evaluate(()=>renderer.raf>0),'Resume restarts the live renderer');
  await page.evaluate(()=>{renderer.destroy();renderer.assetChanged();renderer.fontsChanged();renderer.resizeFrame();renderer.setState({paused:false});});
  assert.equal(await page.evaluate(()=>renderer.raf),0,'Destroyed renderer cannot restart from a queued readiness callback');
  const marbles=new Marbles();marbles.add({id:'a',name:'A long versus player name',connected:true});marbles.add({id:'b',name:'Player B',connected:true});marbles.start({mode:'versus',levels:3});
  // Match the real host SnapshotView: only the outer versus state is paused.
  const frozen={...marbles.snapshot(),paused:true};frozen.boards[0].events.push({id:100,kind:'pop',x:500,y:250,color:2});
  await page.evaluate(s=>mount(s),frozen);await page.waitForTimeout(120);
  assert(await page.evaluate(()=>renderer.raf>0),'Legacy board-local versus fades finish before parking');
  await page.waitForFunction(()=>renderer.raf===0);
  const versus=await page.evaluate(()=>renderer.el.toDataURL());await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>renderer.el.toDataURL()),versus);
  const next=structuredClone(frozen);next.level=1;for(const b of next.boards)b.level=1;
  await page.evaluate(s=>renderer.setState(s),next);await page.waitForTimeout(120);
  assert(await page.evaluate(()=>!!renderer.mapTransition&&renderer.raf>0),'A paused map crossfade finishes instead of parking halfway');
  await page.waitForFunction(()=>renderer.mapTransition===null&&renderer.raf===0);
  await page.evaluate(()=>renderer.destroy());
  // Hold the actual garden/machinery requests past the first parked frame.
  // Their real load events must invalidate the frozen fallback image.
  const delayed=await browser.newPage({viewport:{width:1280,height:720}}),pending=[];
  delayed.on('pageerror',e=>errors.push(e.message));
  await delayed.route(/\/assets\/gameplay\/refresh129\/marble-(garden|machinery)\.png$/,route=>pending.push(route));
  await delayed.goto(`http://127.0.0.1:${server.address().port}/geometry.js`);
  const coop=new Marbles();coop.add({id:'a',name:'Late art fixture',connected:true});coop.start();
  await delayed.evaluate(async s=>{document.body.innerHTML='<canvas style="width:100vw;height:100vh"></canvas>';const {Renderer}=await import('/render.js');window.renderer=new Renderer(document.querySelector('canvas'));renderer.setState(s);},{...coop.snapshot(),paused:true});
  await delayed.waitForFunction(()=>renderer.raf===0);assert.equal(pending.length,2);
  const fallback=await delayed.evaluate(()=>renderer.el.toDataURL());
  for(const route of pending)await route.fulfill({path:path.resolve('public',new URL(route.request().url()).pathname.slice(1)),contentType:'image/png'});
  await delayed.waitForFunction(()=>renderer.backgroundKey.endsWith('-art')&&renderer.raf===0);
  assert.notEqual(await delayed.evaluate(()=>renderer.el.toDataURL()),fallback,'Late real art replaces the parked fallback');
  await delayed.evaluate(()=>renderer.destroy());assert.deepEqual(errors,[]);
  console.log('PASS explicit WebKit fixtures: waiting live; frozen pixels; paused resize/font/art invalidation; cue/crossfade completion; conservative private-art readiness; resume/destroy; versus');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
