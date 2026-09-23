'use strict';
const {definitions,terrainMaterial}=require('./pocket-terrain.cjs');
const ExplosionTimeline=require('../public/explosion-timeline.js');
const {expression}=require('./pocket-expression.cjs');
const {BY_ID}=require('./weapons.cjs');
const Geo=require('../public/geometry.js');
const {clamp,finite,lerp}=require('./common.cjs');
const maps=new Map();
const codes={EXPLOSION:'E',SHRAPNEL:'S',FIRE:'F',FOG:'G',SUPERBALL:'B',DIRTBALL:'D',MAGICWALL:'W',DIRTMOVER:'M',DIRTSLINGER:'T',LIGHTNING:'L',ZAPPER:'Z'};
const terrainTypes=new Set(['DIRTBALL','MAGICWALL','DIRTMOVER','DIRTSLINGER']);
// These two names are genuinely absent from the decoded packs. Their rows
// initialize registers / wait between shots; the corresponding DudExplosion
// declarations have zero damage, no terrain erasure and no tank throw. Keep
// the assignments and delay, explicitly record a compatibility no-op, and do
// not manufacture a damaging projectile or borrow a sibling's physics.
const sourceNoops=new Set(['bubble_gun:BubbleGunDudExplosionBullet','robotic_worm:RoboticWormDudBullet']);
const valid=name=>name&&!/^(NONE|NULL)$/i.test(name);
function node(id,type,name){
 let map=maps.get(id);if(!map){map=new Map((definitions.get(id)?.chain||[]).map(n=>[`${n.type}:${n.name}`.toUpperCase(),n]));maps.set(id,map);}
 return map.get(`${type}:${name}`.toUpperCase());
}
function trace(g,type,data){if(g.effectAudit)g.effectAudit.push({t:g.t,...data,type});}
function context(g,source){const owner=g.players.find(p=>p.id===source.owner),target=g.nearest(source.x,source.owner)||owner;return{X:source.x,Y:source.y,ANGLE:Math.atan2(source.vy||0,source.vx||0)*180/Math.PI,POWER:Math.hypot(source.vx||0,source.vy||0)/7,CTANK_X:target?.x||0,CTANK_Y:target?.y||0,STANK_X:owner?.x||0,STANK_Y:owner?.y||0,CTANK_DIRECT:Math.atan2((target?.y||0)-source.y,(target?.x||0)-source.x)*180/Math.PI,STANK_DIRECT:Math.atan2((owner?.y||0)-source.y,(owner?.x||0)-source.x)*180/Math.PI,AX:source.ax||0,BX:source.bx||0,LOOP_COUNT:0};}
function trigger(g,source,name,depth=0){
 if(!valid(name))return false;
 const n=node(source.weapon,'TRIGGER',name);
 if(!n){trace(g,'missing-trigger',{weapon:source.weapon,name});return false;}
 if(depth>32){trace(g,'limit',{weapon:source.weapon,name,limit:'trigger-depth'});return false;}
 trace(g,'trigger',{weapon:source.weapon,name,source:source.sourceBullet});
 const vars=context(g,source),base={x:source.x,y:source.y,angle:vars.ANGLE,power:vars.POWER,ax:vars.AX,bx:vars.BX};
 let state={...base},delay=0,operations=0;
 const calculate=(v,key)=>expression(v,state[key],base[key],{...vars,AX:state.ax,BX:state.bx,ANGLE:state.angle,POWER:state.power,X:state.x,Y:state.y},()=>g.rng.next());
 function execute(rows){for(const row of rows){
  if(++operations>4096){trace(g,'limit',{weapon:source.weapon,name,limit:'trigger-commands'});return;}
  if(row.op==='loop'){const count=clamp(Math.floor(expression(row.count,0,0,vars,()=>g.rng.next())),0,512),old=vars.LOOP_COUNT;for(let i=0;i<count;i++){vars.LOOP_COUNT=i;execute(row.commands);}vars.LOOP_COUNT=old;continue;}
  if(row.op==='if'){execute(expression(/^INFIX\b/i.test(row.condition)?row.condition:`INFIX ${row.condition}`,0,0,{...vars,AX:state.ax,BX:state.bx},()=>g.rng.next())?row.commands:row.elseCommands||[]);continue;}
  const statements=row.statements||Object.entries(row).map(([key,value])=>({key,value}));
  for(const {key,value}of statements){const field={XOFFSET:'x',YOFFSET:'y',ANGLE:'angle',POWER:'power',AX:'ax',BX:'bx'}[key];if(field)state[field]=calculate(value,field);else if(key==='TIMEDELAY')delay+=Math.max(0,expression(value,0,0,vars,()=>g.rng.next()))/1000;}
  if(!row.COMMAND)continue;
  const type=String(row.resolvedType||row.TYPE||'').toUpperCase();
  const data={weapon:source.weapon,owner:source.owner,name:row.COMMAND,type,trigger:name,x:state.x,y:state.y,angle:state.angle,power:state.power,ax:state.ax,bx:state.bx,depth,sourceBullet:source.sourceBullet,surfaceImpact:source.surfaceImpact};
  // Commands at t=0 really run now (including root shot creation). Delayed
  // commands retain evaluated registers and the position of this trigger.
  if(delay<=0)command(g,data);else g.schedule(delay,'pocket-command',data);
 }}
 execute(n.program||n.commands||[]);return true;
}
function visual(g,e,n){const v=n.values,w=BY_ID[e.weapon],r=Number(v.RADIUS||v.DAMAGE_RADIUS||v.WIDTH||12),duration=n.type==='EXPLOSION'?ExplosionTimeline.timeline(v).duration:Number(v.TOTAL_TIME||v.EMITTER_TIME||v.BURN_TIME/1000||v.ACTIVE_TIME/1000||.4);
 if(n.type==='EXPLOSION'&&v.DRAW_COLOR===0&&!valid(v.EXPLOSION_EMITTER_NAME)&&Number(v.RADIUS)<=1)return;
 const material=terrainMaterial(v);
 g.emit('blast',{x:e.x,y:e.y,r,explosionWaveId:e.explosionWaveId,color:material?.[1]||w.color,terrainMaterial:material||undefined,family:w.family,weapon:e.weapon,effectType:n.type,effectName:n.name,materialName:['FIRE','FOG','SUPERBALL'].includes(n.type)?n.name:undefined,materialId:e.materialId,materialAngle:e.angle,materialPower:e.power,materialTriggers:[],fxStages:[[codes[n.type]||'S',0,0,0,0,0,r,duration,v.DRAW_DIRECTION==='EXPLOSION_IN']]});
}
function damage(g,e,r,amount,values={}){for(const p of g.players.filter(p=>p.participant)){const d=Math.hypot(p.x-e.x,p.y-8-e.y);if(d<r+17){const scale=clamp(1-d/(r+17),0,1);g.award(e.owner,p,amount*scale);
  if(values.THROW_TANK_FLAG===true){
   const magnitude=Number(values.THROW_TANK_MAGNITUDE??values.TANK_THROW_MAGNITUDE),fixed=/SET/.test(values.THROW_TANK_STYLE||''),strength=Number.isFinite(magnitude)?magnitude*35:Math.min(180,Math.abs(amount)*1.3);
   if(values.THROW_TANK_ANGLE_FLAG===true){const angle=(Number(values.THROW_TANK_ANGLE||0)+(g.rng.next()-.5)*Number(values.THROW_TANK_ANGLE_SPREAD||0))*Math.PI/180,factor=fixed?1:scale;
    p.vx=clamp((fixed?0:finite(p.vx))+Math.cos(angle)*strength*factor,-500,500);p.vy=clamp((fixed?0:finite(p.vy))+Math.sin(angle)*strength*factor,-700,500);p.grounded=false;p.impulseUntil=g.t+1;
   }else g.impulse(p,e.x,e.y,strength*(fixed?1:scale));
  }
 }}}
function command(g,e){
 if(e.type==='TRIGGER')return trigger(g,{...e,vx:Math.cos(e.angle*Math.PI/180)*e.power*7,vy:Math.sin(e.angle*Math.PI/180)*e.power*7},e.name,e.depth+1);
 const n=node(e.weapon,e.type,e.name);if(!n){if(sourceNoops.has(`${e.weapon}:${e.name}`)){trace(g,'source-noop',e);return true;}trace(g,'missing-command',e);return false;}
 trace(g,'command',{weapon:e.weapon,name:n.name,commandType:n.type,trigger:e.trigger,x:e.x,y:e.y});
 const v=n.values,w=BY_ID[e.weapon],a=e.angle*Math.PI/180,vx=Math.cos(a)*e.power*7,vy=Math.sin(a)*e.power*7;
 if(n.type==='BULLET'||n.type==='CRUISER'){
  g.projectile(e.x,e.y,vx,vy,w,e.owner,{authored:true,fragment:true,sourceBullet:n.name,sourceType:n.type,ax:e.ax,bx:e.bx,bounces:Math.max(0,Number(v.BOUNCE_COUNT)||0),launchAngle:(360-e.angle)%360,draw:{method:v.DRAW_METHOD,size:Number(v.DRAW_SIZE)||1,trailLength:Number(v.TRAIL_LENGTH)||0,dim:Number(v.DIM_TRAIL_LEVEL)||0,animated:!!valid(v.DRAW_ANIM)}});return true;
 }
 if(terrainTypes.has(n.type)){
  const length=Math.hypot(vx,vy)||1;
  g.schedule(0,'reference-build',{weapon:e.weapon,owner:e.owner,type:n.type,name:n.name,x:e.x,y:e.y,material:terrainMaterial(v),radius:Number(v.RADIUS||0),width:Number(v.WIDTH||0),height:Number(v.HEIGHT||0),minWidth:Number(v.MIN_WIDTH||0),maxWidth:Number(v.MAX_WIDTH||0),thickness:Number(v.THICKNESS||0),backupDistance:Number(v.BACKUP_DISTANCE||0),spikeCount:Number(v.SPIKE_COUNT||0),dirtFall:v.DIRTFALL_FLAG===true,dirX:vx/length,dirY:vy/length});
  if(/bouncy|rubber/i.test(n.name))g.coat(e.x,Math.max(12,Number(v.WIDTH||v.RADIUS||24)),'rubber');
  if(/glue/i.test(n.name))g.coat(e.x,Math.max(12,Number(v.WIDTH||v.RADIUS||24)),'glue');
  visual(g,e,n);return true;
 }
 if(n.type==='EXPLOSION'){
  const wave={...ExplosionTimeline.timeline(v),id:++g.eventSerial,x:e.x,y:e.y,started:g.t,color:w.color,weapon:e.weapon,source:n.name};
  g.explosionWaves??=[];
  if(Number(v.DRAW_COLOR)!==0){if(g.explosionWaves.length<1024)g.explosionWaves.push(wave);else trace(g,'limit',{weapon:e.weapon,limit:'explosion-waves'});}
  damage(g,e,Number(v.RADIUS)||1,Number(v.DAMAGE)||0,v);
  if(v.ERASE_TERRAIN_FLAG===true||v.DIRTFALL_FLAG===true)g.schedule(0,'reference-terrain',{...wave,erase:v.ERASE_TERRAIN_FLAG===true,collapse:v.DIRTFALL_FLAG===true&&!(e.surfaceImpact??e.y<=g.ground(e.x)+2),direction:v.ERASE_DIRECTION});
  // Persistent explosion waves are reconstructed from authoritative snapshot
  // state, not the short-lived particle/event pool.
  visual(g,{...e,explosionWaveId:Number(v.DRAW_COLOR)!==0?wave.id:undefined},n);return true;
 }
 if(n.type==='SHRAPNEL'){damage(g,e,Number(v.RADIUS)||1,Number(v.DAMAGE)||0,v);visual(g,e,n);return true;}
 if(['FIRE','FOG','SUPERBALL'].includes(n.type)){
  const life=Math.max(.03,Number(v.BURN_TIME||v.ACTIVE_TIME||1000)/1000);
  const id=++g.eventSerial;g.zones.push({id,materialId:id,age:0,x:e.x,y:e.y,vx,vy,r:Math.max(0,finite(Number(v.DAMAGE_RADIUS),5)),damagePerSecond:Number(v.DAMAGE_PER_SECOND)||0,weapon:e.weapon,owner:e.owner,ends:g.t+life,next:g.t,kind:'authored-material',materialName:n.name,materialAngle:e.angle,materialPower:e.power,gravity:v.GRAVITY_FLAG!==false,bounce:Number(v.BOUNCE_IMPULSE)||0,splatMode:v.SPLAT_MODE,splatSize:Math.max(0,Number(v.SPLAT_SIZE)||0)});
  visual(g,{...e,materialId:id},n);return true;
 }
 if(n.type==='ZAPPER'||n.type==='LIGHTNING'){
  const target=g.nearest(e.x,e.owner);if(target){g.emit('beam',{x:e.x,y:e.y,x2:target.x,y2:target.y-8,color:w.color,weapon:e.weapon,effectName:n.name});g.award(e.owner,target,Number(v.DAMAGE)||0);}visual(g,e,n);return true;
 }
 if(n.type==='JUMPJETS'){
  const p=g.players.find(p=>p.id===e.owner);if(p){p.vx=vx;p.vy=vy;p.grounded=false;p.impulseUntil=g.t+2;g.emit('jump',{x:p.x,y:p.y,color:p.color,weapon:e.weapon});}return true;
 }
 if(n.type==='TRACER'){g.emit('spark',{x:e.x,y:e.y,color:w.color,weapon:e.weapon,label:String(v.TEXT??''),displayTime:Math.max(.05,finite(Number(v.DISPLAY_TIME),3)),effectType:'TRACER',effectName:n.name});return true;}
 trace(g,'unsupported',{weapon:e.weapon,name:n.name,commandType:n.type});return false;
}
function launch(g,x,y,vx,vy,w,owner,options={}){
 const definition=definitions.get(w.id);
 if(options.drop&&!definition?.chain.some(n=>n.type==='BULLET')){g.projectile(x,y,vx,vy,w,owner,{delivery:true,draw:{method:'BULLET_PIXEL',size:4,trailLength:0}});return true;}
 return trigger(g,{x,y,vx,vy,weapon:w.id,owner},definition?.trigger);
}
function repeat(g,b,v){if(v.REPEAT_TRIGGER_FLAG===true&&valid(v.REPEAT_TRIGGER)){
 const interval=Math.max(1/120,Number(v.REPEAT_TRIGGER_TIME)||1/60);b.nextRepeat??=interval;
 for(let i=0;b.age>=b.nextRepeat&&i<8;i++){trigger(g,b,v.REPEAT_TRIGGER);b.nextRepeat+=interval;}
}}
function impact(g,b){const v=node(b.weapon,b.sourceType||'BULLET',b.sourceBullet)?.values;if(!v)return false;
 if(b.intercepted)return false;
 b.surfaceImpact=b.y<=g.ground(b.x)+2;
 if(!b.hitTank&&b.bounces>0&&b.sourceType!=='CRUISER'){
  b.bounces--;trigger(g,b,v.BOUNCE_TRIGGER);g.reflect(b,clamp((Number(v.BOUNCE_IMPULSE)||2)*.22,.05,.95));return true;
 }
 trigger(g,b,v.EXPLOSION_TRIGGER);return false;
}
// Side-effect-free kinematics shared with the defensive swept-contact pass.
function motion(g,b,dt){
 const v=node(b.weapon,b.sourceType||'BULLET',b.sourceBullet)?.values||{};
 let vx=b.vx,vy=b.vy;
 if(!b.delivery&&v.HOMING_FLAG===true){let target=v.HOMING_TARGET_MODE==='SOURCE_TANK'?g.players.find(p=>p.id===b.owner):g.nearest(b.x,b.owner);
  if(valid(v.HOMING_TARGET_OBJECT_NAME))target=(g._projectileStep||g.projectiles).find(p=>p.sourceBullet===v.HOMING_TARGET_OBJECT_NAME)||target;
  if(target){const dx=target.x-b.x,dy=target.y-8-b.y,d=Math.hypot(dx,dy)||1;if(d<=Number(v.HOMING_DISTANCE||1200)){const strength=clamp(Number(v.HOMING_MAGNITUDE_ACCELERATION??v.HOMING_MAGNITUDE)||0,-1000,1000);vx+=dx/d*strength*dt;vy+=dy/d*strength*dt;}}
 }
 const oldVy=vy;
 if(!b.delivery)vx+=g.wind*(v.WIND_RESISTANCE_FLAG===true?.18:1)*dt;
 vy+=(v.GRAVITY_MODE==='UP'?-350:['NONE','OFF'].includes(v.GRAVITY_MODE)?0:350)*dt;
 if(!b.delivery&&v.DRAG){const drag=Math.exp(-Math.max(0,Number(v.DRAG))*dt);vx*=drag;vy*=drag;}
 return{vx,vy,oldVy,x:b.x+vx*dt,y:b.y+vy*dt};
}
function advance(g,b,dt){
 if(b.intercepted)return false;
 if(b.delivery){b.age+=dt;b.vy+=350*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y>=g.ground(b.x)){b.y=g.ground(b.x);trigger(g,b,definitions.get(b.weapon)?.trigger);return false;}return b.age<15;}
 const n=node(b.weapon,b.sourceType||'BULLET',b.sourceBullet);if(!n)return null;const v=n.values;b.age+=dt;
 if(!b.initialized){b.initialized=true;b.bounces=Math.max(0,Number(v.BOUNCE_COUNT)||0);b.ax??=0;b.bx??=0;}
 if(b.age>30||b.y>1950||b.y< -900||b.x<(v.BYPASS_SIDES_FLAG===true?-150:0)||b.x>(v.BYPASS_SIDES_FLAG===true?1430:1280)){trace(g,'expired',{weapon:b.weapon,name:b.sourceBullet});return false;}
 repeat(g,b,v);
 if(v.TIMED_DETONATION_FLAG===true&&b.age>=Number(v.TIMED_DETONATION_TIME||0)){trigger(g,b,v.TIMED_DETONATION_TRIGGER);return false;}
 const q=v.HOMING_TARGET_MODE==='SOURCE_TANK'?g.players.find(p=>p.id===b.owner):g.nearest(b.x,b.owner),distance=q?Math.hypot(q.x-b.x,q.y-8-b.y):Infinity;
 if(v.PROXIMITY_FLAG===true&&distance<=Math.max(1,Number(v.PROXIMITY_DISTANCE)||1)&&b.age>.015){trigger(g,b,v.PROXIMITY_TRIGGER);return false;}
 if(n.type==='CRUISER'){
  if(!b.cruise){b.cruise=true;b.direction=(Math.sign(b.vx)||Math.sign((q?.x||640)-b.x)||1)*(v.DIRECTION_MODE==='REVERSE'?-1:1);b.y=g.ground(b.x)-3;}
  const mode=v.DIRECTION_MODE;if(mode==='DOWNHILL')b.direction=Math.sign(Math.sin(g.groundAngle(b.x)))||b.direction;else if(mode==='TOWARD_TANK')b.direction=Math.sign((q?.x||640)-b.x)||b.direction;
  b.vx=b.direction*Math.max(15,Number(v.FPS_SPEED)||100);b.vy=0;b.x+=b.vx*dt;b.y=g.ground(b.x)-3;
  if(b.age>=Number(v.ACTIVE_TIME||2000)/1000||distance<20||b.x<2||b.x>1278){trigger(g,b,v.EXPLOSION_TRIGGER);return false;}return true;
 }
 const moved=motion(g,b,dt),oldVy=moved.oldVy;b.vx=moved.vx;b.vy=moved.vy;
 if(v.VERTICAL_VELOCITY_FLAG===true&&oldVy<Number(v.VERTICAL_VELOCITY_MAGNITUDE||0)*7&&b.vy>=Number(v.VERTICAL_VELOCITY_MAGNITUDE||0)*7){trigger(g,b,v.VERTICAL_VELOCITY_TRIGGER);return false;}
 if(v.DROPRISE_FLAG===true&&oldVy<0&&b.vy>=0){if(v.DROPRISE_DETONATION_FLAG===true){trigger(g,b,v.DROPRISE_DETONATION_TRIGGER);return false;}b.vx=0;b.vy=0;}
 const nx=b.x+b.vx*dt,ny=b.y+b.vy*dt,collision=v.COLLISION_METHOD||'HIT_TERRAIN';
 let first=2,hit=null;
 // HIT_NOTHING disables terrain, not tank contacts (e.g. Tractor Beam's
 // invisible pull bullets still have their own tank-hit explosion).
 if(v.BYPASS_TANK_FLAG!==true&&v.BYPASS_TANK_FALG!==true)for(const p of g.players.filter(p=>p.participant)){
  if(p.id===b.owner&&b.age<.14)continue;const t=Geo.circleHit(b.x,b.y,nx,ny,p.x,p.y-8,17);if(t!==null&&t<first){first=t;hit=p;}
 }
 let terrainT=2;
 if(collision!=='HIT_NOTHING'){
  const steps=Math.max(1,Math.ceil(Math.hypot(nx-b.x,ny-b.y)));
  for(let i=1;i<=steps;i++){const x=lerp(b.x,nx,i/steps),y=lerp(b.y,ny,i/steps);if(x<0||x>1280)continue;const solid=g.solid(x,y);if(collision==='HIT_AIR'?!solid:solid){terrainT=i/steps;break;}}
 }
 if(first<=1||terrainT<=1){let t=Math.min(first,terrainT);
  if(terrainT<first&&/OUTSIDE/.test(v.COLLISION_LOCATION||'')){
   // The previous sample may be a whole pixel above the surface: a radius-1
   // child then detonates in air without touching dirt. Locate the actual
   // contact boundary, retaining the authored outside/inside distinction.
   let lo=Math.max(0,t-1/Math.max(1,Math.ceil(Math.hypot(nx-b.x,ny-b.y)))),hi=t;
   for(let i=0;i<20;i++){const mid=(lo+hi)/2,solid=g.solid(lerp(b.x,nx,mid),lerp(b.y,ny,mid));if(collision==='HIT_AIR'?!solid:solid)hi=mid;else lo=mid;}
   t=lo;
  }
  b.x=lerp(b.x,nx,t);b.y=lerp(b.y,ny,t);b.hitTank=first<terrainT?hit?.id:null;return impact(g,b);}
 b.x=nx;b.y=ny;return true;
}
function materialStep(g,z,dt){
 z.age+=dt;
 if(z.gravity)z.vy+=220*dt;else{z.vx*=Math.exp(-dt*2);z.vy*=Math.exp(-dt*2);}
 z.x+=z.vx*dt;z.y+=z.vy*dt;const floor=g.ground(z.x)-1;
 if(z.gravity&&z.y>=floor){
  z.y=floor;
  // Authored glue/rubber SUPERBALLs deposit their coating on contact. These
  // were previously only drawn, silently dropping SPLAT_MODE from the graph.
  if(['GLUE','RUBBER'].includes(z.splatMode)&&z.splatSize>0&&(!Number.isFinite(z.lastSplatX)||Math.abs(z.x-z.lastSplatX)>=z.splatSize)){
   g.coat(z.x,z.splatSize,z.splatMode.toLowerCase());z.lastSplatX=z.x;
  }
  if(z.bounce&&Math.abs(z.vy)>25){z.vy=-Math.abs(z.vy)*clamp(z.bounce*.18,.05,.5);z.vx*=.72;}else{z.vy=0;z.vx*=Math.exp(-dt*4);}
 }
 if(z.damagePerSecond){g.zoneRemainders??=new WeakMap();let fractions=g.zoneRemainders.get(z);if(!fractions){fractions=new Map();g.zoneRemainders.set(z,fractions);}for(const p of g.players.filter(p=>p.participant)){const d=Math.hypot(p.x-z.x,p.y-8-z.y);if(d<z.r+17){const amount=(fractions.get(p.id)||0)+z.damagePerSecond*dt*(1-d/(z.r+17)),whole=Math.floor(amount);fractions.set(p.id,amount-whole);if(whole)g.award(z.owner,p,whole);}}}
}
module.exports={launch,trigger,command,advance,impact,materialStep,node,trace,motion};
