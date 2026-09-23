const assert=require('node:assert/strict'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
(async()=>{
 const server=express().use(express.static('games/arcade_deluxe/public')).listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/geometry.js`);
  const result=await page.evaluate(async()=>{
   const {PocketProjectileArt}=await import('/pocket-projectiles.js'),art=new PocketProjectileArt();await art.ready;
   const c=document.createElement('canvas').getContext('2d');let png=0,bmp=0;
   // Decode every authored frame, in small batches rather than a burst of 472 images.
   const entries=Object.entries(art.data.frames);
   for(let i=0;i<entries.length;i+=24)await Promise.all(entries.slice(i,i+24).map(async([name,f])=>{
    if(f.png){const image=new Image();image.src='data:image/png;base64,'+f.png;await image.decode();
     if(image.naturalWidth!==f.w||image.naturalHeight!==f.h)throw Error(name+' dimensions');png++;
    }else{const frame=art.frame(name);if(frame.width!==f.w||frame.height!==f.h)throw Error(name+' dimensions');bmp++;}
   }));
   // Exercise the renderer's asynchronous PNG loading, not just the decoder.
   const pngName=entries.find(([,f])=>f.png)[0];art.frame(pngName);
   const deadline=performance.now()+5000;while(!art.frames.get(pngName)&&performance.now()<deadline)await new Promise(r=>setTimeout(r,10));
   if(!art.frames.get(pngName))throw Error('PNG render cache not populated');
   let drawn=0;for(const [key,p]of Object.entries(art.data.nodes)){
    for(const name of p.frames)if(!art.frames.has(name))art.frame(name);
   }
   await new Promise(r=>setTimeout(r,1000));
   for(const key of Object.keys(art.data.nodes)){const [weapon,sourceType,sourceBullet]=key.split('/');
    if(art.draw(c,{weapon,sourceType,sourceBullet,x:30,y:30,vx:10,vy:0,age:0},0))drawn++;else throw Error('Undrawn '+key);
   }
   return {png,bmp,drawn};
  });
  assert.equal(result.drawn,410);assert.equal(result.png+result.bmp,1869);console.log('PASS complete authored animation coverage',result);
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
