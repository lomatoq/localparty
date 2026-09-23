'use strict';
const assert=require('node:assert/strict'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs');
const {BY_ID}=require('../games/arcade_deluxe/core/weapons.cjs');
(async()=>{
 const server=express().use(express.static('games/arcade_deluxe/public')).listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/geometry.js`);
  const game=new Tanks(7);game.add({id:'a',name:'A'});game.add({id:'b',name:'B'});game.start({sandbox:true});
  await page.evaluate(async({state,weapons})=>{
   document.body.innerHTML='<canvas style="position:fixed;inset:0;width:100vw;height:100vh"></canvas>';
   const {Renderer}=await import('/render.js');window.r=new Renderer(document.querySelector('canvas'));r.weapons=weapons;r.setState({...state,stage:'flight',events:[]});cancelAnimationFrame(r.raf);await r.projectileArt.ready;
  },{state:game.snapshot(),weapons:BY_ID});
  for(const viewport of [{width:1280,height:720},{width:1920,height:888}]){
   await page.setViewportSize(viewport);
   const results=await page.evaluate(()=>{
    const results=[];
    for(const [weapon,sourceBullet,method] of [['single_shot','SingleShotBullet','BULLET_TRAIL'],['quad_missile','FirstQuadBullet','BULLET_NONE'],['chain_reaction','ChainReactionBullet','BULLET_NONE']]){
     r.cam={x:640,y:360,z:1};
     for(const y of [200,-100,-500,-900]){
      const shot={id:100,x:640,y,vx:60,vy:-500,weapon,sourceBullet,sourceType:'BULLET',draw:{method}};
      r.s.projectiles=[shot];r.previous=null;r.frame(r.last+1000/60);cancelAnimationFrame(r.raf);
      const scale=r.el.width/1280,px=r.el.width/2,py=r.el.height/2+r.cam.z*(y-r.cam.y)*scale;
      let lit=0;if(py>=12&&py<r.el.height-12){const pixels=r.c.getImageData(px-10,py-10,20,20).data;for(let i=0;i<pixels.length;i+=4)if(Math.max(pixels[i],pixels[i+1],pixels[i+2])>90)lit++;}
      results.push({weapon,y,py,lit});
     }
    }return results;
   });
   for(const result of results){assert(result.py>=12&&result.py<viewport.height-12,JSON.stringify(result));assert(result.lit>2,'visible projectile pixels: '+JSON.stringify(result));}
   await page.screenshot({path:`/private/tmp/pocket-projectile-visible-${viewport.width}.png`});
  }
  assert.deepEqual(errors,[]);console.log('PASS visible Single Shot and emitter-only carriers through fast climbs at 16:9 and cropped TV size');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
