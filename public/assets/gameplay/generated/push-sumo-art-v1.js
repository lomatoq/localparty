(function(){
 'use strict';
 const base=new URL('.',document.currentScript.src),image=new Image();
 const sharedFetch=window.parent!==window?window.parent.fetch.bind(window.parent):window.fetch.bind(window);
 let metadata=null,ready=false;
 const decoded=new Promise((resolve,reject)=>{image.decoding='async';image.onload=()=>image.decode().then(resolve,reject);image.onerror=reject;image.src=new URL('push-sumo-v1.png',base).href;});
 Promise.all([decoded,sharedFetch(new URL('push-sumo-v1.json',base).href).then(r=>{if(!r.ok)throw Error('Sumo metadata unavailable');return r.json();})]).then(([,m])=>{metadata=m;ready=image.naturalWidth===m.size.w&&image.naturalHeight===m.size.h;}).catch(()=>{ready=false;});
 function variant(color){
  const h=String(color||'').replace('#','');if(!/^[\da-f]{6}$/i.test(h))return 0;
  const rgb=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255),hi=Math.max(...rgb),lo=Math.min(...rgb),d=hi-lo;
  let hue=d===0?0:hi===rgb[0]?60*((rgb[1]-rgb[2])/d%6):hi===rgb[1]?60*((rgb[2]-rgb[0])/d+2):60*((rgb[0]-rgb[1])/d+4);hue=(hue+360)%360;
  return hue>=35&&hue<160?0:hue>=160&&hue<250?3:hue>=250&&hue<310?1:2;
 }
 function draw(ctx,{x=0,y=0,radius,color,rotation=0}){
  if(!ready||!Number.isFinite(radius)||radius<=0||![x,y,rotation].every(Number.isFinite))return null;
  const v=metadata.variants[variant(color)],f=v.frame,scale=radius*2/Math.max(f.w,f.h),w=f.w*scale,h=f.h*scale;
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.drawImage(image,f.x,f.y,f.w,f.h,-w/2,-h/2,w,h);ctx.restore();
  return{ready:true,variant:v.id,nativeFrame:f,width:w,height:h,rotation,bounds:{left:x-radius,right:x+radius,top:y-radius,bottom:y+radius}};
 }
 window.PushSumoArt=Object.freeze({draw,get ready(){return ready;},get metadata(){return metadata;}});
})();
