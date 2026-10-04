(function(){
 'use strict';
 const base=new URL('.',document.currentScript.src),image=new Image();
 const sharedFetch=window.parent!==window?window.parent.fetch.bind(window.parent):window.fetch.bind(window);
 let metadata=null,ready=false;
 const decoded=new Promise((resolve,reject)=>{image.decoding='async';image.onload=()=>image.decode().then(resolve,reject);image.onerror=reject;image.src=new URL('hungry-creatures-v2.png',base).href;});
 Promise.all([decoded,sharedFetch(new URL('hungry-creatures-v2.json',base).href).then(r=>{if(!r.ok)throw Error('Hungry character metadata unavailable');return r.json();})]).then(([,m])=>{metadata=m;ready=image.naturalWidth===m.size.w&&image.naturalHeight===m.size.h;}).catch(()=>{ready=false;});
 const rgb=color=>[1,3,5].map(i=>parseInt(String(color).slice(i,i+2),16));
 function draw(ctx,{x,y,radius,color}){
  if(!ready||![x,y,radius].every(Number.isFinite)||radius<=0)return null;
  const target=rgb(color),variant=metadata.variants.reduce((best,v)=>{const distance=rgb(v.color).reduce((sum,c,i)=>sum+(c-target[i])**2,0);return distance<best.distance?{v,distance}:best;},{v:metadata.variants[0],distance:Infinity}).v;
  const f=variant.frame,scale=radius*2/Math.max(f.w,f.h),w=f.w*scale,h=f.h*scale;
  ctx.drawImage(image,f.x,f.y,f.w,f.h,x-w/2,y-h/2,w,h);
  return{ready:true,variant:variant.id,color:variant.color,width:w,height:h};
 }
 window.HungryCreatureArt=Object.freeze({draw,get ready(){return ready;},get metadata(){return metadata;}});
})();
