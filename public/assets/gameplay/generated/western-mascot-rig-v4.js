(function(){
 'use strict';
 const base='/assets/gameplay/generated/',images={body:new Image(),arm:new Image()};
 const sharedFetch=window.parent!==window?window.parent.fetch.bind(window.parent):window.fetch.bind(window);
 let metadata=null,ready=false;
 const load=(image,file)=>new Promise((resolve,reject)=>{image.decoding='async';image.onload=()=>image.decode().then(resolve,reject);image.onerror=reject;image.src=base+file;});
 Promise.all([load(images.body,'western-mascot-bodies-v4.png'),load(images.arm,'western-mascot-arms-v4.png'),sharedFetch(base+'western-mascots-v4.json').then(r=>{if(!r.ok)throw Error('Western rig metadata unavailable');return r.json();})]).then(([, ,m])=>{metadata=m;ready=Object.entries(images).every(([key,image])=>image.naturalWidth===m.size[key].w&&image.naturalHeight===m.size[key].h);}).catch(()=>{ready=false;});
 function variant(color){const hex=String(color||'').replace('#','');if(!/^[\da-f]{6}$/i.test(hex))return 0;const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255),hi=Math.max(...rgb),lo=Math.min(...rgb),d=hi-lo;let h=d===0?0:hi===rgb[0]?60*((rgb[1]-rgb[2])/d%6):hi===rgb[1]?60*((rgb[2]-rgb[0])/d+2):60*((rgb[0]-rgb[1])/d+4);h=(h+360)%360;return h>=35&&h<160?0:h>=160&&h<250?3:h>=250&&h<310?1:2;}
 function pose({x,y,height,color,flip=1,shotAge=Infinity,early=false,fall=0}){
  if(!ready||!Number.isFinite(height)||height<=0)return null;
  const v=metadata.variants[variant(color)],b=v.body[early?'startled':'idle'],a=v.arm[early?'empty':'normal'],r=metadata.rig;
  const bw=height*b.frame.w/b.frame.h,aw=height*r.armWidthRatio*(early?a.frame.w/v.arm.normal.frame.w:1),ah=aw*a.frame.h/a.frame.w;
  const shoulder={x:(r.shoulder.x-.5)*bw,y:(r.shoulder.y-1)*height};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,aim=early?0:Number.isFinite(shotAge)?1-(1-Math.min(1,Math.max(0,shotAge)/60))**3:0,recoilAge=shotAge-60;
  const recoil=recoilAge>=0&&recoilAge<160&&!early&&!reduced?4*Math.sin(recoilAge/160*Math.PI):0,angle=(early?.30:1.05*(1-aim))-recoil*.012;
  const phi=-1.45*fall,t=Math.min(1,Math.max(0,(fall-.38)/.62)),deadMix=t*t*(3-2*t);
  const lift=-Math.max(...b.contactHull.map(([px,py])=>(px-.5)*bw*Math.sin(phi)+(py-1)*height*Math.cos(phi)));
  const dead=v.body.dead,dw=height*r.deadWidthRatio,dh=dw*dead.frame.h/dead.frame.w,deadLift=dh*(1-Math.max(...dead.contactHull.map(([,py])=>py)));
  return{x,y,height,flip,early,fall,v,b,a,r,bw,aw,ah,shoulder,recoil,angle,phi,lift,deadMix,dead,dw,dh,deadLift,shadow:{x,y:y+1,rx:height*(.20+.22*deadMix),ry:height*.032}};
 }
 function measure(options){const p=pose(options);return p?{shadow:p.shadow,pose:p.deadMix>=.999?'dead':p.early?'startled':'idle',variant:p.v.id}:null;}
 function draw(g,options){
  const p=pose(options);if(!p)return null;
  const{x,y,height,flip,early,v,b,a,r,bw,aw,ah,shoulder,recoil,angle,phi,lift,deadMix,dead,dw,dh,deadLift}=p;
  function arm(cx,cy,rotation,width,frame=a.frame){const h=width*frame.h/frame.w,pivot=r.armPivot;g.save();g.translate(cx,cy);g.rotate(rotation);g.drawImage(images.arm,frame.x,frame.y,frame.w,frame.h,-pivot.x*width,-pivot.y*h,width,h);g.restore();}
  if(deadMix<1){g.save();g.translate(x,y+lift);g.scale(flip,1);g.rotate(phi);g.globalAlpha*=1-deadMix;arm(shoulder.x-recoil,shoulder.y,angle,aw);g.drawImage(images.body,b.frame.x,b.frame.y,b.frame.w,b.frame.h,-bw/2,-height,bw,height);g.restore();}
  if(deadMix>0){g.save();g.translate(x,y+deadLift);g.scale(flip,1);g.globalAlpha*=deadMix;arm((r.deadShoulder.x-.5)*dw,(r.deadShoulder.y-1)*dh,.38,aw*.85);g.drawImage(images.body,dead.frame.x,dead.frame.y,dead.frame.w,dead.frame.h,-dw/2,-dh,dw,dh);g.restore();}
  const muzzle=early?r.emptyTip:r.muzzle,ax=(muzzle.x-r.armPivot.x)*aw-recoil,ay=(muzzle.y-r.armPivot.y)*ah,mx=shoulder.x+ax*Math.cos(angle)-ay*Math.sin(angle),my=shoulder.y+ax*Math.sin(angle)+ay*Math.cos(angle);
  const deadAw=aw*.85,deadAh=deadAw*a.frame.h/a.frame.w,dx=(r.deadShoulder.x-.5)*dw+(muzzle.x-r.armPivot.x)*deadAw*Math.cos(.38)-(muzzle.y-r.armPivot.y)*deadAh*Math.sin(.38),dy=(r.deadShoulder.y-1)*dh+(muzzle.x-r.armPivot.x)*deadAw*Math.sin(.38)+(muzzle.y-r.armPivot.y)*deadAh*Math.cos(.38);const sx=mx*Math.cos(phi)-my*Math.sin(phi),sy=lift+mx*Math.sin(phi)+my*Math.cos(phi),blendedAngle=(angle+phi)*(1-deadMix)+.38*deadMix;
  return{x:x+flip*(sx*(1-deadMix)+dx*deadMix),y:y+sy*(1-deadMix)+(deadLift+dy)*deadMix,angle:flip===1?blendedAngle:Math.PI-blendedAngle,ready:true,variant:v.id,pose:deadMix>=.999?'dead':early?'startled':'idle',shadow:p.shadow};
 }
 const api=Object.freeze({draw,measure,get ready(){return ready;},get metadata(){return metadata;}});window.WesternMascotRigV4=api;window.WesternMascotRig=api;
})();
