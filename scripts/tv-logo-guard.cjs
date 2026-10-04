'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {PNG}=require(process.env.PARTY_PLAYWRIGHT?path.join(path.dirname(process.env.PARTY_PLAYWRIGHT),'pngjs'):'pngjs');
async function captureTV(page,file){
 const logo=page.locator('.heypals-tv-logo');await logo.waitFor({state:'visible'});
 await page.evaluate(async()=>{await document.fonts.ready;await document.querySelector('.heypals-tv-logo').decode();await Promise.all(document.getAnimations().filter(a=>{const t=a.effect?.getComputedTiming();return t&&t.iterations!==Infinity&&t.endTime<=3000;}).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const box=await logo.boundingBox();assert(box&&box.width>20&&box.height>10,'TV logo must have visible bounds');
 for(let attempt=0;attempt<3;attempt++){
  const pixels=PNG.sync.read(await page.screenshot({path:file}));let colorful=0;
  for(let y=Math.max(0,Math.floor(box.y));y<Math.min(pixels.height,Math.ceil(box.y+box.height));y++)for(let x=Math.max(0,Math.floor(box.x));x<Math.min(pixels.width,Math.ceil(box.x+box.width));x++){const i=(y*pixels.width+x)*4,r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];if(Math.max(r,g,b)>150&&Math.max(r,g,b)-Math.min(r,g,b)>50)colorful++;}
  if(colorful>=50)return{box,colorfulPixels:colorful,attempts:attempt+1};
  await page.waitForTimeout(300);
 }
 throw Error('TV screenshot has no painted logo despite visible DOM; do not publish');
}
module.exports={captureTV};
