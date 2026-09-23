'use strict';
const {BY_ID}=require('./weapons.cjs');
const {clamp}=require('./common.cjs');
const DURATION=15;
// Server owns position, charge, ammunition and timeout. Input is thrust, never position.
function input(game,id,type,data={}){
 if(!['drone','drone-move','drone-drop'].includes(type))return null;
 const p=game.active();
 if(game.phase!=='playing'||!p||!p.participant||p.id!==id)return false;
 if(type==='drone'){
  if(game.stage!=='aim'||p.droneUsed||!(p.inventory[p.weapon]>0))return false;
  p.droneUsed=true;p.driveInput=0;p.driveUntil=0;
  game.drone={owner:id,weapon:p.weapon,x:clamp(p.x,18,1262),y:clamp(p.y-100,22,650),dx:0,dy:0,vx:0,vy:0,bank:0,inputUntil:0,deadline:game.t+DURATION,duration:DURATION,remaining:DURATION,charge:1};
  game.stage='drone';game.emit('drone-launch',{player:id,weapon:p.weapon});return true;
 }
 const d=game.drone;if(game.stage!=='drone'||!d||d.owner!==id)return false;
 if(type==='drone-drop')return drop(game);
 if(!Number.isFinite(data.x)||!Number.isFinite(data.y))return false;
 const length=Math.max(1,Math.hypot(data.x,data.y));d.dx=data.x/length;d.dy=data.y/length;d.inputUntil=game.t+.3;return true;
}
function drop(game){
 const d=game.drone,p=game.active(),w=BY_ID[d?.weapon];
 if(!d||!p||p.id!==d.owner||!w||!(p.inventory[w.id]>0))return false;
 if(!game.sandbox)p.inventory[w.id]--;p.shots++;p.weapon=w.id;
 game.stage='flight';game.flightStarted=game.t;game.currentWeapon=w.id;game.drone=null;
 game.launchWeaponAt(d.x,d.y+15,0,35,w,p.id,{drop:true});
 game.emit('muzzle',{x:d.x,y:d.y+15,color:p.color,player:p.id,weapon:w.id,family:w.family});return true;
}
function step(game,dt){
 const d=game.drone;if(!d)return;
 if(game.t>d.inputUntil)d.dx=d.dy=0;
 // Small deterministic gusts are authoritative too: correcting hover takes skill,
 // but drag prevents stale/disconnected controls from accelerating forever.
 const wind=clamp(Number(game.wind)||0,-20,20);
 const gust=Math.sin(game.t*2.3+d.owner.length)*7+Math.sin(game.t*5.1)*3;
 const duration=clamp(Number(dt)||0,0,.25),steps=Math.max(1,Math.ceil(duration/(1/120))),h=duration/steps;
 const clear=(x,y)=>{
  // Cover the complete compact craft rather than three points: a thin ledge
  // between probes must not allow it to tunnel through the terrain.
  for(let ox=-17;ox<=17;ox+=2)for(const oy of [-13,-7,0,7])if(game.solid(x+ox,y+oy))return false;
  return true;
 };
 for(let i=0;i<steps;i++){
  d.vx=clamp(((d.vx||0)+(d.dx*355+wind*1.5+gust)*h)*Math.exp(-1.65*h),-220,220);
  d.vy=clamp(((d.vy||0)+(d.dy*295+Math.sin(game.t*3.2)*6)*h)*Math.exp(-1.85*h),-175,175);
  const nx=clamp(d.x+d.vx*h,18,1262),ny=clamp(d.y+d.vy*h,22,650);
  if(clear(nx,d.y))d.x=nx;else d.vx=0;
  if(clear(d.x,ny))d.y=ny;else d.vy=0;
  if(d.x===18||d.x===1262)d.vx=0;if(d.y===22||d.y===650)d.vy=0;
 }
 const target=clamp(d.dx*.15+d.vx*.00065+gust*.003,-.3,.3);
 d.bank+=(target-(d.bank||0))*(1-Math.exp(-duration*6));
 d.remaining=Math.max(0,d.deadline-game.t);d.charge=clamp(d.remaining/(d.duration||DURATION),0,1);
 if(game.t>=d.deadline||!game.active()?.connected)drop(game);
}
module.exports={input,step};
