'use strict';
const assert=require('node:assert/strict'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
(async()=>{
 const server=express().use(express.static('games/arcade_deluxe/public')).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/geometry.js`);
  const result=await page.evaluate(async()=>{
   document.body.innerHTML='<style>body{margin:0;background:#11101a;color:white;font:12px system-ui;display:grid;grid-template-columns:repeat(4,1fr);gap:4px}article{background:#171523}h3{margin:8px}canvas{width:100%;display:block}</style>';
   const {PocketPlasma}=await import('/pocket-plasma.js'),fx=new PocketPlasma();if(!await fx.ready)throw Error('Original masks failed to load');
   const results=[];
   for(const weapon of Object.keys(fx.data.weapons)){
    fx.clear();const card=document.createElement('article'),title=document.createElement('h3'),canvas=document.createElement('canvas');title.textContent=weapon;canvas.width=320;canvas.height=180;card.append(title,canvas);document.body.append(card);const c=canvas.getContext('2d');
    fx.emit({id:1,weapon,x:640,y:420,r:60});const sources=fx.sources.length;
    const before=fx.sources.map(p=>p.age);fx.draw(c,0,()=>440);if(fx.sources.some((p,i)=>p.age!==before[i]))throw Error('Paused source advanced');
    for(let i=0;i<36;i++){c.setTransform(.25,0,0,.25,0,0);c.fillStyle='#11101a';c.fillRect(0,0,1280,720);c.fillStyle='#283326';c.fillRect(0,440,1280,280);fx.draw(c,1/30,()=>440);}
    results.push({weapon,sources,finite:fx.sources.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),active:fx.active});
   }
   fx.clear();fx.emit({id:9,weapon:'napalm',x:640,y:440});const start=performance.now();for(let i=0;i<60;i++)fx.step(()=>440);const ms=performance.now()-start;
   return{results,ms,masks:Object.keys(fx.data.frames).length};
  });
  assert.equal(result.results.length,67);assert.equal(result.masks,99);assert(result.results.every(r=>r.sources>0&&r.sources<=320&&r.finite));assert.deepEqual(errors,[]);
  await page.screenshot({path:'/private/tmp/pocket-original-materials.png',fullPage:true});console.log(JSON.stringify(result,null,2));
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
