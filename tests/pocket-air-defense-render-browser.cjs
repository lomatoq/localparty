const assert=require('node:assert/strict'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs');
(async()=>{const server=express().use(express.static('games/arcade_deluxe/public')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));let browser;try{
 browser=await webkit.launch();const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/geometry.js`);
 const game=new Tanks(42);game.add({id:'a',name:'ALPHA',connected:true});game.add({id:'b',name:'BRAVO',connected:true});game.start();
 const result=await page.evaluate(async snapshot=>{
  document.body.innerHTML='<canvas style="position:fixed;inset:0;width:100vw;height:100vh"></canvas>';const {Renderer}=await import('/render.js'),{AirDefenseRenderer}=await import('/air-defense-render.js');window.r=new Renderer(document.querySelector('canvas'));await r.projectileArt.ready;r.setState(snapshot);cancelAnimationFrame(r.raf);
  const terrainBefore=JSON.stringify(snapshot.terrain);const fx=r.airDefense,c=r.c,rotations=[],rotate=c.rotate.bind(c);c.rotate=v=>{rotations.push(v);rotate(v);};
  const boost={id:1,owner:'a',x:300,y:400,vx:0,vy:-220,age:.1,phase:'boost',weapon:'homing_missile'},turn={...boost,id:2,x:620,y:260,vx:200,vy:-80,age:.6,phase:'homing'},before=JSON.stringify([boost,turn]);
  fx.draw(c,[boost,turn],[],1,0);c.rotate=rotate;const boostAngle=rotations[0],turnAngle=rotations[1];
  for(let i=0;i<100;i++)fx.draw(c,[{...turn,x:400+i*2,y:360-i}],[],1,1/60);
  const maxPoints=Math.max(...[...fx.trails.values()].map(a=>a.length));
  r.effect({kind:'intercept',id:1,x:640,y:255});const flashAge=fx.flashes[0].age,trail=JSON.stringify([...fx.trails]);fx.draw(c,[turn],[],1,1,true);const paused=fx.flashes[0].age===flashAge&&JSON.stringify([...fx.trails])===trail;
  for(let i=0;i<80;i++)fx.emit({kind:'intercept',x:i,y:i});const peak=fx.flashes.length;fx.draw(c,[],[],1,1);const cleared=fx.flashes.length;
  const reduced=new AirDefenseRenderer(r.projectileArt,true);reduced.emit({kind:'intercept',x:100,y:100});reduced.draw(c,[boost],[],1,0,true);const reducedPaused=reduced.flashes[0].age===0;reduced.draw(c,[],[],1,1);const reducedCleared=reduced.flashes.length;
  fx.clear();r.s.stage='flight';for(let i=0;i<14;i++){r.s.interceptors=[boost,{...turn,x:570+i*4,y:320-i*4}];r.frame(r.last+1000/60);cancelAnimationFrame(r.raf);}r.effect({kind:'intercept',id:900,x:640,y:255});r.frame(r.last+1000/60);cancelAnimationFrame(r.raf);
  return {boostAngle,turnAngle,maxPoints,paused,peak,cleared,reducedPaused,reducedCleared,unchanged:JSON.stringify([boost,turn])===before,blastCount:r.bursts.length,terrainSame:JSON.stringify(r.s.terrain)===terrainBefore,sprite:!!r.projectileArt.profile({...turn,sourceType:'BULLET',sourceBullet:'HomingMissileBullet'}),launchConsumed:fx.emit({kind:'air-defense-launch',x:1,y:1}),expireConsumed:fx.emit({kind:'air-defense-expire',x:1,y:1})};
 },game.snapshot());
 assert(Math.abs(result.boostAngle)<1e-8);assert(Math.abs(result.turnAngle-(Math.atan2(-80,200)+Math.PI/2))<1e-8);assert(result.maxPoints<=16);assert(result.paused);assert(result.peak<=24);assert.equal(result.cleared,0);assert(result.reducedPaused);assert.equal(result.reducedCleared,0);assert(result.unchanged);assert.equal(result.blastCount,0);assert(result.terrainSame&&result.sprite&&result.launchConsumed&&result.expireConsumed);
 await page.screenshot({path:'/private/tmp/pocket-air-defense-render.png'});assert.deepEqual(errors,[]);console.log('PASS interceptor original sprite, velocity orientation, bounded trails/flash, pause/reduced motion, no payload/state mutations',result);
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
