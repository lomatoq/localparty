const assert=require('node:assert/strict'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs');
const {BY_ID}=require('../games/arcade_deluxe/core/weapons.cjs');
(async()=>{
 const server=express().use(express.static('games/arcade_deluxe/public')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/geometry.js`);
  const game=new Tanks();game.add({id:'a',name:'ALPHA',connected:true});game.add({id:'b',name:'BRAVO',connected:true});game.start();
  await page.evaluate(async s=>{document.body.innerHTML='<canvas style="position:fixed;inset:0;width:100vw;height:100vh"></canvas>';const {Renderer}=await import('/render.js');window.r=new Renderer(document.querySelector('canvas'));r.setState(s);cancelAnimationFrame(r.raf);r.frame(performance.now());cancelAnimationFrame(r.raf);},game.snapshot());
  const result=await page.evaluate(()=>{
   const fx=r.siegeFX,c=r.c;fx.emit({id:1,kind:'blast',x:500,y:400,r:60,color:'#ffab45'});const initial=fx.items.length;fx.draw(c,0);const ages=fx.items.map(p=>p.age);fx.draw(c,0);const paused=fx.items.every((p,i)=>p.age===ages[i]);
   for(let i=0;i<100;i++)fx.emit({id:i+2,kind:'blast',x:640,y:400,r:80,color:'#ffab45'});const peak=fx.items.length;const at=performance.now();for(let i=0;i<120;i++)fx.draw(c,1/60);const elapsed=performance.now()-at,remaining=fx.items.length;
   r.effect({kind:'spark',x:500,y:400,color:'#ffffff',id:300});const spark=fx.items.length;r.setState({...r.s,roundSerial:r.s.roundSerial+1,events:[]});return {initial,paused,peak,elapsed,remaining,spark,reset:fx.items.length};
  });
  assert(result.initial>20);assert(result.paused);assert(result.peak<=360);assert.equal(result.remaining,0);assert(result.spark>0);assert.equal(result.reset,0);
  for(const [name,time] of [['impact',.12],['smoke',.5]]){
   await page.evaluate(t=>{r.siegeFX.clear();r.frame(performance.now());cancelAnimationFrame(r.raf);for(const [i,x] of [350,650,950].entries())r.effect({id:i+1,kind:'blast',x,y:420,r:50+i*15,color:['#ffae55','#bceaff','#c29aff'][i],family:i===1?'freeze':i===2?'pulse':'blast'});for(let i=0;i<Math.round(t*60);i++){r.frame(r.last+1000/60);cancelAnimationFrame(r.raf);}},time);
   await page.screenshot({path:`/private/tmp/pocket-siege-${name}.png`});
  }
  const covered=await page.evaluate(()=>['blast','muzzle','split','bounce','dirt','warp','spark','land','beam','coat','stuck','jump'].every((kind,i)=>r.siegeFX.emit({kind,id:i+500,x:300,y:300,x2:500,y2:400,r:8,color:'#e8c25f',coating:'glue'})));assert(covered,'all combat event types have a renderer');
  const authored=await page.evaluate(async weapon=>{await r.siegeFX.plasma.ready;r.siegeFX.clear();r.siegeFX.setWeapons({[weapon.id]:weapon});r.siegeFX.emit({kind:'blast',id:900,x:500,y:400,r:weapon.radius,color:weapon.color,weapon:weapon.id,family:weapon.family});return{items:r.siegeFX.items.length,stages:weapon.fx.timeline.length,materialSources:r.siegeFX.plasma.sources.length};},BY_ID.glue_gun);assert.equal(authored.stages,64);assert(authored.materialSources>0,'glue uses original animated masks instead of generic rings');
  const vibration=await page.evaluate(async()=>{const calls=[];Object.defineProperty(navigator,'vibrate',{configurable:true,value:pattern=>{calls.push(pattern);return true;}});const {haptic}=await import('/net.js');haptic(18);haptic(130);return calls;});assert.deepEqual(vibration[0],[18]);assert(vibration[1].length===3&&vibration[1][0]>vibration[0][0],'damage duration scales the web vibration pattern');
  game.coat(400,70,'glue');game.coat(900,70,'rubber');
  await page.evaluate(s=>{r.setState(s);r.siegeFX.clear();r.frame(performance.now());cancelAnimationFrame(r.raf);},game.snapshot());
  await page.screenshot({path:'/private/tmp/pocket-siege-coatings.png'});
  const zoneWeapons=[BY_ID.napalm,BY_ID.smoke_bomb].filter(Boolean);
  await page.evaluate(({s,weapons})=>{r.setState(s);r.siegeFX.setWeapons(Object.fromEntries(weapons.map(w=>[w.id,w])));r.siegeFX.clear();r.s.zones=[{id:71,x:350,y:450,r:80,kind:'fire',weapon:'napalm',ends:s.t+4},{id:72,x:640,y:450,r:65,kind:'acid',ends:s.t+4},{id:73,x:930,y:450,r:75,kind:'fire',weapon:'smoke_bomb',ends:s.t+4}];for(let i=0;i<3;i++)r.effect({id:1001+i,kind:'score',x:350+i*290,y:390,value:12+i*15,color:'#ffe083'});}, {s:game.snapshot(),weapons:zoneWeapons});
  for(let i=0;i<80;i++){await page.evaluate(()=>{r.s.t+=1/60;r.frame(r.last+1000/60);cancelAnimationFrame(r.raf);});if(i===15||i===65)await page.screenshot({path:`/private/tmp/pocket-materials-${i}.png`});}
  assert.equal(await page.evaluate(()=>r.siegeFX.items.filter(p=>p.kind==='damage').length),3,'damage spirals persist through the slow fade');
  game.soil.circle(640,600,90);game.syncTerrain();const before=game.snapshot();for(let i=0;i<30;i++)game.step(1/30);const after=game.snapshot();
  const deep=await page.evaluate(({before,after})=>{r.setState(before);r.frame(performance.now());cancelAnimationFrame(r.raf);r.setState(after);const transition=!!r.terrainTransition?.snapshot;r.frame(performance.now());cancelAnimationFrame(r.raf);return {height:r.terrainCanvas.height,transition};},{before,after});assert(deep.height>=1800);assert.equal(deep.transition,false,'terrain geometry is authoritative; no ghost crossfade can make the hill sink');
  await page.screenshot({path:'/private/tmp/pocket-siege-collapse.png'});
  const turret=await page.evaluate(()=>{
   const el=document.createElement('canvas');el.width=960;el.height=320;el.id='tank-layer-check';document.body.replaceChildren(el);
   const c=el.getContext('2d');c.fillStyle='#10151d';c.fillRect(0,0,960,320);
   const pixels=[];
   for(const [i,angle] of [20,90,160].entries()){
    c.save();c.translate(160+i*320,160);c.scale(5,5);
    r.tank(c,{id:'test',x:0,y:0,angle,surfaceAngle:0,color:'#c4ff38',name:''},{events:[],t:0},false);c.restore();
    pixels.push(Array.from(c.getImageData(160+i*320,95,1,1).data));
   }
   return pixels;
  });
  assert.deepEqual(turret[0],turret[1],'barrel angle must not paint over the turret centre');assert.deepEqual(turret[1],turret[2]);
  await page.locator('#tank-layer-check').screenshot({path:'/private/tmp/pocket-turret-layering.png'});
  const droneCheck=await page.evaluate(()=>{
   const el=document.querySelector('#tank-layer-check'),c=el.getContext('2d');c.fillStyle='#10151d';c.fillRect(0,0,960,320);
   c.save();c.translate(180,200);c.scale(5,5);r.tank(c,{id:'test',x:0,y:0,angle:40,surfaceAngle:0,color:'#c4ff38',name:''},{events:[],t:0},false);c.restore();
   let dashed=0;const original=c.setLineDash.bind(c);c.setLineDash=v=>{if(v.length)dashed++;original(v);};
   for(const [i,bank] of [-.25,0,.25].entries()){c.save();c.translate(420+i*210,180);c.scale(5,5);r.drone(c,{x:0,y:0,bank,charge:i?.15:.8},{t:.03+i*.01},'#c4ff38');c.restore();}
   c.setLineDash=original;return {dashed};
  });assert.equal(droneCheck.dashed,0,'drone has no precise dashed targeting aid');
  await page.locator('#tank-layer-check').screenshot({path:'/private/tmp/pocket-drone-art.png'});
  assert.deepEqual(errors,[]);console.log('PASS bounded effects, pause, cleanup, reset, direct hits, coatings, deep terrain, WebKit rendering',result);
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
