'use strict';
const {clamp,lerp}=require('./common.cjs');
const Pocket=require('./pocket-runtime.cjs');
const Geo=require('../public/geometry.js');
const RANGE=600,REACQUIRE=320,BOOST=.2,LIFETIME=3.5,SPEED=520,TURN_RATE=4.5,HIT_RADIUS=9;
function hostile(g,owner,id){const a=g.players.find(p=>p.id===owner),b=g.players.find(p=>p.id===id);return !!a&&!!b&&a.participant&&b.participant&&a.id!==b.id&&(!g.teams||a.team!==b.team);}
function eligible(g,b,id){
 if(!b||b.intercepted||!hostile(g,b.owner,id)||b.sourceType==='CRUISER'||b.rollAt!==undefined||b.tunnelAt!==undefined||b.liquid)return false;
 if(![b.x,b.y,b.vx,b.vy].every(Number.isFinite)||b.x<0||b.x>1280||b.y< -600||b.y>1800||g.solid(b.x,b.y))return false;
 if(b.delivery)return true;
 const v=Pocket.node(b.weapon,b.sourceType||'BULLET',b.sourceBullet)?.values;
 if(v?.COLLISION_METHOD==='HIT_AIR')return false;
 if(['NONE','OFF'].includes(v?.GRAVITY_MODE)&&Math.hypot(b.vx,b.vy)<.01)return false; // stationary structures / graph anchors
 const method=String(b.draw?.method||v?.DRAW_METHOD||'BULLET_TRAIL').toUpperCase();
 const animated=b.draw?.animated||v?.DRAW_ANIM&&!/^(NONE|NULL)$/i.test(v.DRAW_ANIM);
 // Match the visible renderer: hidden graph helpers are not radar decoys.
 return !['BULLET_NONE','BULLET_NOTHING'].includes(method)||!!animated;
}
function targets(g,id,x,y,range=RANGE,list=g.projectiles){return list.filter(b=>eligible(g,b,id)&&Math.hypot(b.x-x,b.y-y)<=range).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)||a.id-b.id);}
function status(g,id,{paused=false}={}){
 const p=g.players.find(p=>p.id===id),origin={x:p?.x||0,y:(p?.y||0)-18},charges=p?.airDefenseCharges||0;
 const candidates=p?targets(g,id,origin.x,origin.y):[];
 const reason=g.phase!=='playing'?'not-playing':!p?.participant?'not-participant':!p.connected?'offline':paused||g.paused?'paused':g.stage!=='flight'?'not-flight':!hostile(g,g.activeId,id)?'own-turn':charges<=0?'no-charges':!candidates.length?'no-threat':'ready';
 return{charges,canLaunch:reason==='ready',reason,range:RANGE,origin,threats:candidates.slice(0,8).map(b=>({id:b.id,x:b.x,y:b.y,vx:b.vx,vy:b.vy,dx:clamp((b.x-origin.x)/RANGE,-1,1),dy:clamp((b.y-origin.y)/RANGE,-1,1),distance:Math.hypot(b.x-origin.x,b.y-origin.y),bearing:Math.atan2(b.y-origin.y,b.x-origin.x)})),interceptors:(g.interceptors||[]).filter(b=>b.owner===id).map(b=>({...b}))};
}
function input(g,id,type){
 if(type!=='air-defense')return null;
 const state=status(g,id);if(!state.canLaunch)return false;
 const p=g.players.find(p=>p.id===id),x=p.x,y=p.y-22;
 if(g.solid(x,y))return false;
 p.airDefenseCharges--;
 (g.interceptors??=[]).push({id:++g.eventSerial,owner:id,weapon:'homing_missile',x,y,vx:0,vy:-230,heading:-Math.PI/2,age:0,targetId:state.threats[0].id,phase:'boost'});
 g.emit('air-defense-launch',{player:id,x,y});return true;
}
function terrainContact(g,x,y,nx,ny,air=false){
 const steps=Math.max(1,Math.ceil(Math.hypot(nx-x,ny-y)));
 for(let i=0;i<=steps;i++){const t=i/steps,solid=g.solid(lerp(x,nx,t),lerp(y,ny,t));if(air?!solid:solid)return t;}
 return 2;
}
function targetWindow(g,b,m,dt){
 const v=Pocket.node(b.weapon,b.sourceType||'BULLET',b.sourceBullet)?.values||{};
 let end=1;
 // A timer/proximity already due wins over a later speculative contact.
 if(v.TIMED_DETONATION_FLAG===true)end=Math.min(end,Math.max(0,(Number(v.TIMED_DETONATION_TIME||0)-b.age)/dt));
 const q=v.HOMING_TARGET_MODE==='SOURCE_TANK'?g.players.find(p=>p.id===b.owner):g.nearest(b.x,b.owner);
 if(v.PROXIMITY_FLAG===true&&q&&b.age+dt>.015&&Math.hypot(q.x-b.x,q.y-8-b.y)<=Math.max(1,Number(v.PROXIMITY_DISTANCE)||1))end=0;
 if(v.VERTICAL_VELOCITY_FLAG===true){const threshold=Number(v.VERTICAL_VELOCITY_MAGNITUDE||0)*7;if(m.oldVy<threshold&&m.vy>=threshold)end=Math.min(end,(threshold-m.oldVy)/(m.vy-m.oldVy));}
 if(v.DROPRISE_FLAG===true&&m.oldVy<0&&m.vy>=0)end=Math.min(end,-m.oldVy/(m.vy-m.oldVy));
 if(v.COLLISION_METHOD!=='HIT_NOTHING')end=Math.min(end,terrainContact(g,b.x,b.y,m.x,m.y,v.COLLISION_METHOD==='HIT_AIR'));
 if(v.BYPASS_TANK_FLAG!==true&&v.BYPASS_TANK_FALG!==true)for(const p of g.players.filter(p=>p.participant)){
  if(p.id===b.owner&&b.age+dt<.14)continue;
  const t=Geo.circleHit(b.x,b.y,m.x,m.y,p.x,p.y-8,17);if(t!==null)end=Math.min(end,t);
 }
 return end;
}
function step(g,list,dt){
 if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,1/30);
 if(!g.interceptors?.length)return;
 const keep=[];
 for(const rocket of g.interceptors){
  rocket.age+=dt;
  const expire=()=>g.emit('air-defense-expire',{player:rocket.owner,x:rocket.x,y:rocket.y});
  if(rocket.age>LIFETIME||rocket.x<0||rocket.x>1280||rocket.y< -650||rocket.y>1800){expire();continue;}
  let target=list.find(b=>b.id===rocket.targetId&&eligible(g,b,rocket.owner));
  if(!target){target=targets(g,rocket.owner,rocket.x,rocket.y,REACQUIRE,list)[0];if(!target){expire();continue;}rocket.targetId=target.id;}
  const speed=Math.min(SPEED,230+rocket.age*420);
  if(rocket.age<=BOOST){rocket.heading=-Math.PI/2;rocket.phase='boost';}else{
   rocket.phase='homing';
   const lead=Math.min(.3,Math.hypot(target.x-rocket.x,target.y-rocket.y)/SPEED),desired=Math.atan2(target.y+target.vy*lead-rocket.y,target.x+target.vx*lead-rocket.x);
   const delta=Math.atan2(Math.sin(desired-rocket.heading),Math.cos(desired-rocket.heading));rocket.heading+=clamp(delta,-TURN_RATE*dt,TURN_RATE*dt);
  }
  rocket.vx=Math.cos(rocket.heading)*speed;rocket.vy=Math.sin(rocket.heading)*speed;
  const nx=rocket.x+rocket.vx*dt,ny=rocket.y+rocket.vy*dt,terrain=terrainContact(g,rocket.x,rocket.y,nx,ny);
  const motion=Pocket.motion(g,target,dt),hit=Geo.circleHit(target.x-rocket.x,target.y-rocket.y,motion.x-nx,motion.y-ny,0,0,HIT_RADIUS);
  const window=targetWindow(g,target,motion,dt);
  if(hit!==null&&window>0&&hit<=terrain&&hit<=window){
   target.intercepted=true;
   g.emit('intercept',{player:rocket.owner,targetId:target.id,x:lerp(rocket.x,nx,hit),y:lerp(rocket.y,ny,hit),r:12,color:'#c8ff73'});
   Pocket.trace(g,'intercept',{weapon:target.weapon,name:target.sourceBullet,targetId:target.id});continue;
  }
  if(terrain<=1){rocket.x=lerp(rocket.x,nx,terrain);rocket.y=lerp(rocket.y,ny,terrain);expire();continue;}
  rocket.x=nx;rocket.y=ny;keep.push(rocket);
 }
 g.interceptors=keep;
}
module.exports={input,step,status,eligible,targets,RANGE,BOOST,LIFETIME,SPEED,TURN_RATE,HIT_RADIUS};
