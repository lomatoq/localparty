(function(){
 'use strict';
 const base='/assets/gameplay/generated/',image=new Image();
 let metadata=null,ready=false;
 // The controller bridge scopes game fetches. This atlas is a shared launcher asset.
 const sharedFetch=window.parent!==window?window.parent.fetch.bind(window.parent):window.fetch.bind(window);
 image.decoding='async';
 const loaded=new Promise((resolve,reject)=>{image.onload=()=>image.decode().then(resolve,reject);image.onerror=reject;});
 image.src=base+'western-mascots-v3.png';
 Promise.all([loaded,sharedFetch(base+'western-mascots-v3.json').then(r=>{if(!r.ok)throw Error('Western rig metadata unavailable');return r.json();})]).then(([,m])=>{metadata=m;ready=image.naturalWidth===m.size.w&&image.naturalHeight===m.size.h;}).catch(()=>{ready=false;});
 function variant(color){
  const hex=String(color||'').replace('#','');if(!/^[\da-f]{6}$/i.test(hex))return 0;
  const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(...rgb),min=Math.min(...rgb),d=max-min;
  let h=d===0?0:max===rgb[0]?60*((rgb[1]-rgb[2])/d%6):max===rgb[1]?60*((rgb[2]-rgb[0])/d+2):60*((rgb[0]-rgb[1])/d+4);h=(h+360)%360;
  return h>=35&&h<160?0:h>=160&&h<250?3:h>=250&&h<310?1:2;
 }
 function draw(g,{x,y,height,color,flip=1,shotAge=Infinity,early=false,fall=0}){
  if(!ready||!Number.isFinite(height)||height<=0)return null;
  const v=metadata.variants[variant(color)],b=v.body.frame,a=v.arm.frame,rig=metadata.rig;
  const bw=height*b.w/b.h,aw=height*rig.armWidthRatio,ah=aw*a.h/a.w;
  const shoulder={x:(rig.shoulder.x-.5)*bw,y:(rig.shoulder.y-1)*height},pivot=rig.armPivot;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const aim=early?0:Number.isFinite(shotAge)?1-(1-Math.min(1,Math.max(0,shotAge)/60))**3:0,recoilAge=shotAge-60;
  const recoil=recoilAge>=0&&recoilAge<160&&!early&&!reduced?4*Math.sin(recoilAge/160*Math.PI):0;
  const angle=1.05*(1-aim)-recoil*.012,phi=-1.18*fall;
  const lift=-Math.max(...v.body.contactHull.map(([px,py])=>(px-.5)*bw*Math.sin(phi)+(py-1)*height*Math.cos(phi)));
  g.save();g.translate(x,y+lift);g.scale(flip,1);g.rotate(phi);g.globalAlpha*=1-fall*.20;
  g.drawImage(image,b.x,b.y,b.w,b.h,-bw/2,-height,bw,height);
  g.save();g.translate(shoulder.x,shoulder.y);g.rotate(angle);g.translate(-recoil,0);
  g.drawImage(image,a.x,a.y,a.w,a.h,-pivot.x*aw,-pivot.y*ah,aw,ah);g.restore();g.restore();
  const ax=(rig.muzzle.x-pivot.x)*aw-recoil,ay=(rig.muzzle.y-pivot.y)*ah;
  const mx=shoulder.x+ax*Math.cos(angle)-ay*Math.sin(angle),my=shoulder.y+ax*Math.sin(angle)+ay*Math.cos(angle);
  return {x:x+flip*(mx*Math.cos(phi)-my*Math.sin(phi)),y:y+lift+mx*Math.sin(phi)+my*Math.cos(phi),angle:flip===1?angle+phi:Math.PI-angle-phi,ready:true,variant:v.id};
 }
 window.WesternMascotRig=Object.freeze({draw,get ready(){return ready;},get metadata(){return metadata;}});
})();
