'use strict';
// Pocket Siege feel layer: bounded pools, pause determinism, reduced motion,
// callout merging and no write-back into the authoritative snapshot.
const assert=require('node:assert/strict'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs');
(async()=>{
 const server=express().use(express.static('games/arcade_deluxe/public')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));let browser;
 try{
  browser=await webkit.launch();
  const game=new Tanks(5);game.add({id:'a',name:'ALPHA',connected:true});game.add({id:'b',name:'BRAVO',connected:true});game.start();
  for(const reduced of [false,true]){
   const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:reduced?'reduce':'no-preference'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${server.address().port}/geometry.js`);
   const result=await page.evaluate(async s=>{
    document.body.innerHTML='<canvas style="position:fixed;inset:0;width:100vw;height:100vh"></canvas>';const {Renderer}=await import('/render.js');const r=new Renderer(document.querySelector('canvas'));r.setState(s);cancelAnimationFrame(r.raf);
    await Promise.race([new Promise(done=>setTimeout(done,600)),Promise.all(['explosion-1','explosion-2'].map(k=>{const i=new Image();i.src='/assets/fx/'+k+'.webp';return i.decode().catch(()=>{});}))]);
    const before=JSON.stringify(s),p=s.players[1];
    // 400 blasts, hits and muzzles in one packet: every pool stays bounded.
    const events=[];for(let i=0;i<400;i++)events.push({id:100+i*3,kind:'blast',x:200+i%800,y:p.y,r:20+i%120,color:'#ffd17d'},{id:101+i*3,kind:'hit',x:p.x,y:p.y-12,player:'a',target:'b',damage:12},{id:102+i*3,kind:'muzzle',x:300,y:300,player:'a'});
    r.setState({...s,events});const juice=r.juice,peak={parts:juice.parts.length,debris:juice.debris.length,puffs:juice.puffs.length,callouts:juice.callouts.length,scorches:juice.scorches.length};
    for(let i=0;i<40;i++)juice.trail({id:i,x:100+i,y:100},1/60,10);for(let k=0;k<20;k++){juice.step(1/60);for(let i=0;i<40;i++)juice.trail({id:i,x:100+i+k*9,y:100+k*4},1/60,10);}const puffsAfterTrails=juice.puffs.length;
    const kick=juice.camera(0);
    // A new round resets the effect clock and its salvo cooldown together.
    juice.clear();juice.clock=40;juice.event({id:4001,kind:'blast',x:640,y:p.y,r:110,color:'#ffd17d'},s,()=>p.y);
    const firstNuke=!!juice.flashScreen;juice.clear();juice.event({id:4002,kind:'blast',x:640,y:p.y,r:110,color:'#ffd17d'},s,()=>p.y);
    const nextRoundNuke=!!juice.flashScreen;
    // Paused frames are pixel-identical even with a fresh explosion in flight.
    // (Single blast: hundreds of stacked additive sprites can differ by one LSB in WebKit.)
    juice.clear();r.siegeFX.clear();r.setState({...r.s,paused:true,events:[{id:5000,kind:'blast',x:640,y:p.y,r:60,color:'#ffd17d'}]});r.frame(performance.now());cancelAnimationFrame(r.raf);const a=r.el.toDataURL();r.frame(performance.now()+2500);cancelAnimationFrame(r.raf);const paused=a===r.el.toDataURL();
    // A running frame advances and retires effects.
    r.setState({...r.s,paused:false,events:[]});for(let i=0;i<300;i++){r.frame(r.last+1000/60);cancelAnimationFrame(r.raf);}
    const finite=[...juice.parts,...juice.debris,...juice.puffs].every(q=>Number.isFinite(q.x+q.y+q.age));
    // Multi-stage hits on one tank merge into one growing callout.
    juice.clear();for(const [i,d] of [20,20,20].entries())juice.event({id:9000+i,kind:'hit',x:p.x,y:p.y,player:'a',target:'b',damage:d},s,()=>p.y);const merged=juice.callouts.filter(q=>q.text);
    return {peak,puffsAfterTrails,kick,firstNuke,nextRoundNuke,paused,finite,retired:juice.parts.length,merged:merged.map(q=>q.text),unchanged:JSON.stringify(s)===before,reduced:r.reduced};
   },game.snapshot());
   assert.equal(result.reduced,reduced);
   assert(result.peak.parts<=260&&result.peak.debris<=160&&result.peak.puffs<=240&&result.peak.callouts<=6&&result.peak.scorches<=24,JSON.stringify(result.peak));
   assert(result.firstNuke&&result.nextRoundNuke,'nuke moment survives new-round clock reset');assert(result.puffsAfterTrails<=240);assert(result.paused,'paused frame identical');assert(result.finite);assert.deepEqual(result.merged,['MASSIVE HIT!']);assert(result.unchanged,'authoritative snapshot untouched');
   if(reduced)assert(result.kick.x===0&&result.kick.y===0&&result.kick.zoom===1,'reduced motion: no camera kick');else assert(result.kick.zoom>1,'camera punch on blasts');
   assert.deepEqual(errors,[]);await page.close();
   console.log('PASS pocket juice',reduced?'reduced':'full',JSON.stringify(result.peak));
  }
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
