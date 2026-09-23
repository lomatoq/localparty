// Cosmetic-only air-defense layer. Positions and interception are server-owned;
// no prediction, target selection, detonation, or weapon payload runs here.
const MAX_CRAFT=12,MAX_POINTS=16,MAX_FLASHES=24,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class AirDefenseRenderer {
 constructor(art,reduced=false){this.art=art;this.reduced=reduced;this.trails=new Map();this.flashes=[];}
 clear(){this.trails.clear();this.flashes.length=0;}
 emit(event){
  if(!['intercept','air-defense-launch','air-defense-expire'].includes(event.kind))return false;
  if(event.kind==='intercept'&&Number.isFinite(event.x)&&Number.isFinite(event.y)){
   this.flashes.push({x:event.x,y:event.y,age:0,life:this.reduced?.2:.36});
   if(this.flashes.length>MAX_FLASHES)this.flashes.splice(0,this.flashes.length-MAX_FLASHES);
  }
  return true;
 }
 draw(c,shots,previous,blend,dt,paused=false){
  const visible=(shots||[]).filter(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite)).slice(0,MAX_CRAFT),ids=new Set(visible.map(b=>b.id)),old=new Map((previous||[]).map(b=>[b.id,b]));
  for(const id of this.trails.keys())if(!ids.has(id))this.trails.delete(id);
  const mix=paused?1:clamp(blend,0,1);
  for(const b of visible){
   const p=old.get(b.id),shot={...b,x:p?p.x+(b.x-p.x)*mix:b.x,y:p?p.y+(b.y-p.y)*mix:b.y};
   let points=this.trails.get(b.id);if(!points){points=[];this.trails.set(b.id,points);}
   if(!paused){const last=points.at(-1);if(!last||Math.hypot(shot.x-last.x,shot.y-last.y)>1.5){points.push({x:shot.x,y:shot.y});if(points.length>MAX_POINTS)points.shift();}}
   c.save();c.lineCap='round';
   if(!this.reduced)for(let i=1;i<points.length;i++){
    c.globalAlpha=i/points.length*.45;c.strokeStyle='#b5e8ff';c.lineWidth=.8+i/points.length*1.4;c.beginPath();c.moveTo(points[i-1].x,points[i-1].y);c.lineTo(points[i].x,points[i].y);c.stroke();
   }
   c.globalAlpha=1;
   const source={...shot,weapon:'homing_missile',sourceType:'BULLET',sourceBullet:'HomingMissileBullet'};
   if(!this.art.draw(c,source,shot.age||0)){
    c.save();c.translate(shot.x,shot.y);c.rotate(Math.atan2(shot.vy,shot.vx));c.fillStyle='#e9f7ff';c.beginPath();c.moveTo(7,0);c.lineTo(-4,-2);c.lineTo(-4,2);c.closePath();c.fill();c.restore();
   }
   c.restore();
  }
  for(const flash of this.flashes){
   const t=clamp(flash.age/flash.life,0,1),r=this.reduced?5:3+t*9;
   c.save();c.globalAlpha=(1-t)*.85;c.strokeStyle='#d8ffd2';c.fillStyle='#f1ffdd';c.lineWidth=1.5;
   c.beginPath();c.arc(flash.x,flash.y,r,0,Math.PI*2);c.stroke();
   c.fillRect(flash.x-1.5,flash.y-1.5,3,3);
   if(!this.reduced)for(let i=0;i<6;i++){const a=i*Math.PI/3,d=4+t*12;c.beginPath();c.moveTo(flash.x+Math.cos(a)*d,flash.y+Math.sin(a)*d);c.lineTo(flash.x+Math.cos(a)*(d+3),flash.y+Math.sin(a)*(d+3));c.stroke();}
   c.restore();if(!paused)flash.age+=Math.max(0,dt);
  }
  this.flashes=this.flashes.filter(f=>f.age<f.life);
 }
}
