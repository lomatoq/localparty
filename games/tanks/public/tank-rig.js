/* Local Tanks presentation rig. Motion is integrated from authoritative travel,
   never a render clock; snapshots and input/game rules are read-only. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.LocalTankRig=api;
})(typeof window==='undefined'?null:window,()=>{
 'use strict';
 const wrap=(n,period)=>((n%period)+period)%period;
 const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
 function advanceTrackOffsets(previous,current,offsets={left:0,right:0},options={}){
  const period=options.period||12;
  if(!previous||options.paused||options.reduced||!previous.alive||!current.alive)return {...offsets};
  const dx=current.x-previous.x,dy=current.y-previous.y,turn=angleDelta(current.angle,previous.angle);
  if(![dx,dy,turn,current.radius].every(Number.isFinite)||Math.hypot(dx,dy)>100||Math.abs(turn)>Math.PI/2)return {...offsets};
  const heading=previous.angle+turn/2,forward=dx*Math.cos(heading)+dy*Math.sin(heading);
  const lever=current.radius*2.8*.46;
  return {left:wrap(offsets.left+forward+turn*lever,period),right:wrap(offsets.right+forward-turn*lever,period)};
 }
 function rigGeometry(radius,hull,turret){
  if(!(radius>0)||!hull?.optical?.h||!turret?.pivot||!turret?.muzzle)return null;
  const reach=Math.hypot(turret.pivot.x-turret.muzzle.x,turret.pivot.y-turret.muzzle.y);
  if(!(reach>0))return null;
  const hullScale=3.5*radius/hull.optical.h,turretScale=(radius+13)/reach;
  return {hullScale,turretScale,turretRotation:-Math.PI/2-Math.atan2(turret.muzzle.y-turret.pivot.y,turret.muzzle.x-turret.pivot.x),hullWidth:hull.optical.w*hullScale,hullHeight:3.5*radius,
   trackCenter:3.5*radius*.8*.46,trackWidth:3.5*radius*.8*.18,trackLength:3.5*radius*.88,
   muzzle:{x:(turret.muzzle.x-turret.pivot.x)*turretScale,y:(turret.muzzle.y-turret.pivot.y)*turretScale},reach:radius+13};
 }
 function paletteFor(color){
  const rgb=/^#([0-9a-f]{6})$/i.exec(color||''),hsl=/^hsl\(\s*([\d.]+)/i.exec(color||'');let hue;
  if(rgb){const n=parseInt(rgb[1],16),r=(n>>16)&255,g=(n>>8)&255,b=n&255,max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
   if(!delta)return 'cyan';hue=60*(max===r?(g-b)/delta:max===g?(b-r)/delta+2:(r-g)/delta+4);
  }else if(hsl)hue=Number(hsl[1]);else return 'plum';
  hue=wrap(hue,360);return hue<45||hue>=330?'coral':hue<150?'lime':hue<240?'cyan':'plum';
 }
 function create(options={}){
  const win=options.window||window,doc=win.document,motion=new Map(),images=new Map();
  let manifest=null,round=null,pattern=null;
  const manifestURL=new URL(options.manifestURL||'./assets/tank-rig-v1/manifest.json',win.location.href);
  const ready=win.fetch(manifestURL.href).then(r=>{if(!r.ok)throw Error('Tank rig unavailable');return r.json();}).then(async data=>{
   for(const [key,path]of Object.entries(data.atlases||{})){
    const image=new win.Image();image.decoding='async';image.src=new URL(path,manifestURL).href;
    await image.decode();images.set(key,image);
   }
   manifest=data;return true;
  }).catch(()=>false);
  function observe(state){
   const next=state.game?.mode+':'+state.game?.round;if(round!==next){motion.clear();round=next;}
   const ids=new Set(),paused=!!win.PARTY_GAME_CLOCK?.paused||state.game?.status!=='playing',reduced=win.matchMedia('(prefers-reduced-motion: reduce)').matches;
   for(const [kind,list]of [['p',state.players||[]],['b',state.bots||[]]])for(const actor of list){
    const id=kind+actor.id,old=motion.get(id);ids.add(id);
    const offsets=advanceTrackOffsets(old?.actor,actor,old?.offsets,{paused,reduced});
    motion.set(id,{actor:{x:actor.x,y:actor.y,angle:actor.angle,radius:actor.radius,alive:actor.alive,color:actor.color},offsets});
   }
   for(const id of motion.keys())if(!ids.has(id))motion.delete(id);
  }
  function drawTracks(c,g,offsets){
   if(!pattern){const tile=doc.createElement('canvas');tile.width=8;tile.height=12;const t=tile.getContext('2d');t.fillStyle='#171c21';t.fillRect(0,0,8,12);t.fillStyle='#343c41';t.fillRect(0,2,8,5);t.fillStyle='#242b30';t.fillRect(0,7,8,2);pattern=c.createPattern(tile,'repeat');}
   for(const [side,offset]of [[-1,offsets.left],[1,offsets.right]]){
    const x=side*g.trackCenter-g.trackWidth/2,y=-g.trackLength/2;
    c.save();c.beginPath();c.roundRect(x,y,g.trackWidth,g.trackLength,Math.min(g.trackWidth*.42,5));c.clip();
    c.translate(0,offset);c.fillStyle=pattern;c.fillRect(x,y-offset,g.trackWidth,g.trackLength);c.restore();
   }
  }
  function paint(c,image,part,scale){
   const f=part.frame;c.drawImage(image,f.x,f.y,f.w,f.h,-part.pivot.x*scale,-part.pivot.y*scale,f.w*scale,f.h*scale);
  }
  function draw(c,radius,color,id,relativeAngle=0){
   const parts=manifest?.colors?.[paletteFor(color)];if(!parts||!images.get('hull')||!images.get('turret'))return false;
   const g=rigGeometry(radius,parts.hull,parts.turret);if(!g)return false;
   c.save();c.rotate(Math.PI/2);drawTracks(c,g,motion.get(id)?.offsets||{left:0,right:0});
   paint(c,images.get('hull'),parts.hull,g.hullScale);
   c.save();c.rotate(relativeAngle+g.turretRotation);paint(c,images.get('turret'),parts.turret,g.turretScale);c.restore();c.restore();return true;
  }
  function inspect(){return {ready:!!manifest,round,actors:[...motion].map(([id,v])=>{const palette=paletteFor(v.actor.color),parts=manifest?.colors?.[palette];return {id,...v,palette,geometry:parts?rigGeometry(v.actor.radius,parts.hull,parts.turret):null};})};}
  return {ready,observe,draw,inspect};
 }
 return {advanceTrackOffsets,rigGeometry,paletteFor,create};
});
