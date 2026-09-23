'use strict';
const {BaseGame,clamp,finite,lerp,segmentDistance}=require('./common.cjs');
const {WEAPONS,BY_ID}=require('./weapons.cjs');
const {ColumnTerrain}=require('./terrain.cjs');
const {impactPlan,bulletNames}=require('./pocket-terrain.cjs');
const Pocket=require('./pocket-runtime.cjs');
const Geo=require('../public/geometry.js');
const Drone=require('./drone.cjs');
const AirDefense=require('./air-defense.cjs');
const ExplosionTimeline=require('../public/explosion-timeline.js');
const W=1280,H=720,DEPTH=1800,G=350,DX=2,MAX_PROJECTILES=1024;
class Tanks extends BaseGame {
 constructor(seed=7){super(seed);this.mode='pocket_siege';this.terrain=[];this.projectiles=[];this.interceptors=[];this.pending=[];this.zones=[];this.turn=0;this.stage='waiting';this.activeId=null;this.wind=0;this.terrainRevision=0;this.makeTerrain();}
 add(profile){return super.add(profile,6);}
 ground(x){x=clamp(x,0,W)/DX;const i=Math.floor(x);return lerp(this.terrain[i],this.terrain[Math.min(i+1,this.terrain.length-1)],x-i);}
 groundAngle(x){return Geo.support(this.terrain,x).angle;}
 support(x){return Geo.support(this.terrain,x);}
 bodySupport(p,x=p.x){
  const surface=this.support(x);
  if(!p.underground)return surface;
  // Heightmap tops may be roofs above a buried tank. Seek support at/below its
  // current tracks instead of teleporting its chassis to the top of that roof.
  const foot=p.y+8,levels=[-14,0,14].map(dx=>{
   const spans=this.soil.columns[this.soil.index(x+dx)];
   const next=spans.find(r=>r.bottom>foot+.1);return next?Math.max(foot,next.top):this.soil.bottom;
  });
  return{x,y:Math.min(...levels)-8,angle:finite(p.surfaceAngle),contactX:x};
 }
 refreshBurial(p){
  p.underground=p.y>this.support(p.x).y+.1;
  p.buried=p.underground&&[-12,0,12].some(dx=>[-12,-4,4].some(dy=>this.solid(p.x+dx,p.y+dy)));
 }
 seat(p){const q=this.support(p.x);p.y=q.y;p.surfaceAngle=q.angle;p.vy=0;p.vx=0;p.grounded=true;}
 reset(){super.reset();this.t=0;this.stage='waiting';this.projectiles=[];this.interceptors=[];this.pending=[];this.zones=[];this.coatings=[];this.events=[];this.activeId=null;this.currentWeapon=null;this.makeTerrain();}

 makeTerrain(){this.explosionWaves=[];const phase=this.rng.next()*9;for(let i=0;i<=W/DX;i++){const x=i*DX;this.terrain[i]=clamp(465+Math.sin(x*.006+phase)*75+Math.sin(x*.013+phase*2)*33+Math.cos(x*.025)*10,330,610);}this.soil=new ColumnTerrain(W,DEPTH,DX).fromHeights(this.terrain);this.terrainRevision++;}
 syncTerrain(){this.terrain=this.soil.heightmap();this.terrainRevision++;}
 solid(x,y){return this.soil.solid(x,y);}
 start(settings={}){
  if(this.phase!=='waiting')return false;
  this.interceptors=[];
  const players=this.players.filter(p=>p.connected);if(players.length<2)return false;
  this.drone=null;this.roundSerial++;this.t=0;this.phase='playing';this.stage='aim';this.result=null;this.events=[];this.turn=0;this.rounds=clamp(Math.round(finite(settings.rounds,10)),2,15);this.sandbox=settings.sandbox===true||settings.sandbox==='true';this.draftMode=!this.sandbox&&(settings.draftMode===true||settings.draftMode==='true');this.draftSize=clamp(this.rounds-2,3,13);this.teams=settings.teams===true||settings.teams==='true';this.sky='classic';this.projectiles=[];this.pending=[];this.zones=[];this.coatings=[];this.makeTerrain();
  for(const p of this.players)p.participant=false;
  for(const [i,p] of players.entries()){
   Object.assign(p,{buried:false,airDefenseCharges:10,droneUsed:false,team:this.teams?i%2:i,vy:0,vx:0,participant:true,x:110+i*(W-220)/(players.length-1),y:0,score:0,angle:i<players.length/2?45:135,power:65,fuel:100,shots:0,frozen:0,weapon:'pebble',driveInput:0,driveUntil:0,distanceDriven:0,loadout:[],loadoutReady:!this.draftMode});
   this.seat(p);p.underground=false;p.nextMove=0;p.impulseUntil=0;p.lastAim=null;
   const pool=this.rng.shuffle(WEAPONS.filter(w=>w.id!=='pebble'&&w.draft!==false));
   p.inventory=this.sandbox?Object.fromEntries(WEAPONS.map(w=>[w.id,99])):{pebble:2};
   if(!this.sandbox&&!this.draftMode)for(let k=0;k<this.rounds-2;k++)p.inventory[pool[k%pool.length].id]=(p.inventory[pool[k%pool.length].id]||0)+1;
  }
  this.order=players.map(p=>p.id);
  if(this.draftMode){this.stage='loadout';this.activeId=null;this.loadoutDeadline=this.t+60;this.emit('loadout',{size:this.draftSize});}
  else this.nextTurn(true);
  return true;
 }
 finalizeLoadouts(){
  if(this.stage!=='loadout')return false;
  for(const p of this.players.filter(p=>p.participant)){
   let selected=(p.loadout||[]).filter(id=>BY_ID[id]&&id!=='pebble').slice(0,this.draftSize);
   if(!selected.length)selected=this.rng.shuffle(WEAPONS.filter(w=>w.id!=='pebble'&&w.draft!==false)).slice(0,this.draftSize).map(w=>w.id);
   p.loadout=selected;p.loadoutReady=true;p.inventory={pebble:2};
   const copies=Math.max(1,Math.ceil((this.rounds-2)/selected.length));
   for(const id of selected)p.inventory[id]=copies;
  }
  this.emit('loadout-complete');this.nextTurn(true);return true;
 }
 active(){return this.players.find(p=>p.id===this.activeId);}
 nextTurn(first=false){
  if(!first)this.turn++;
  if(this.turn>=this.rounds*this.order.length){this.finish('complete');if(this.teams){const totals=[0,0];for(const p of this.players.filter(p=>p.participant))totals[p.team]+=p.score;for(const r of this.result.players)r.won=totals[this.players.find(p=>p.id===r.id).team]===Math.max(...totals);this.result.teamScores=totals;}this.stage='results';return;}
  this.activeId=this.order[this.turn%this.order.length];this.stage='aim';this.deadline=this.t+28;this.aimStarted=this.t;this.wind=(this.rng.next()-.5)*40;this.shotAge=0;
  const p=this.active();p.weapon=Object.keys(p.inventory).find(k=>p.inventory[k]>0)||'pebble';p.blockedThisTurn=p.frozen>0;if(p.frozen)p.frozen--;this.emit('turn',{player:p.id});
 }
 input(id,type,d={}){
  if(this.phase!=='playing')return false;
  const defenseResult=AirDefense.input(this,id,type,d);if(defenseResult!==null)return defenseResult;
  const droneResult=Drone.input(this,id,type,d);if(droneResult!==null)return droneResult;
  if(this.stage==='loadout'){
   const p=this.players.find(player=>player.id===id&&player.participant);if(!p)return false;
   if(type==='loadout'&&typeof d.id==='string'&&BY_ID[d.id]&&d.id!=='pebble'){
    const selected=new Set(p.loadout||[]);if(selected.has(d.id))selected.delete(d.id);else if(selected.size<this.draftSize)selected.add(d.id);else return false;p.loadout=[...selected];p.loadoutReady=false;this.emit('loadout-change',{player:id,count:p.loadout.length});return true;
   }
   if(type==='loadout-ready'){if(!(p.loadout?.length>0))return false;p.loadoutReady=true;this.emit('loadout-ready',{player:id});if(this.players.filter(player=>player.participant).every(player=>player.loadoutReady||!player.connected))this.finalizeLoadouts();return true;}
   return false;
  }
  if(this.stage!=='aim'||id!==this.activeId)return false;
  const p=this.active();if(!p||!p.participant)return false;
  if(type==='aim'){if(Number.isFinite(d.angle))p.angle=clamp(d.angle,3,177);if(Number.isFinite(d.power))p.power=clamp(d.power,8,100);return true;}
  if(type==='weapon'&&typeof d.id==='string'&&BY_ID[d.id]&&p.inventory[d.id]>0){p.weapon=d.id;return true;}
  if(type==='move'&&!p.blockedThisTurn){const dir=Math.sign(finite(d.direction));if(!dir||p.buried||p.fuel<=0||p.grounded===false)return false;p.driveInput=dir;p.driveUntil=this.t+.18;return true;}
  if(type==='fire')return this.fire();return false;
 }
 projectile(x,y,vx,vy,w,owner,extra={}){if(this.projectiles.length>=MAX_PROJECTILES){Pocket.trace(this,'limit',{limit:'projectiles',weapon:w.id});return;}const sources=extra.sourceBullet?[]:bulletNames(w.id,extra.sourceParent);const sourceBullet=extra.sourceBullet||sources[(extra.sourceIndex||0)%sources.length];this.projectiles.push({id:++this.eventSerial,x,y,vx,vy,age:0,weapon:w.id,owner,bounces:w.bounces||0,family:w.family,...extra,sourceBullet});}
 schedule(delay,kind,data){if(this.pending.length<4096)this.pending.push({at:this.t+delay,kind,...data});else Pocket.trace(this,'limit',{limit:'pending',weapon:data.weapon});}
 launchWeaponAt(x,y,vx,vy,w,owner,options){return Pocket.launch(this,x,y,vx,vy,w,owner,options);}
 animateCircle(x,y,r,build=false,collapse=true,delayMs=12,material=null){
  const interval=clamp(delayMs,3,80)/1000;
  if(build){
   const steps=clamp(Math.ceil(r/4),3,38);
   for(let step=1;step<=steps;step++)this.schedule((step-1)*interval,'terrain-circle',{x,y,r:r*step/steps,build:true,collapse:false,material});
   return;
  }
  // Pocket Tanks applies the completed blast mask after ERASE_DELAY. Growing
  // the real terrain mask made a surface crater look like the hill was sinking.
  // Only a completed underground cavity releases unsupported dirt.
  this.schedule(interval,'terrain-circle',{x,y,r,build:false,collapse:false});
  if(collapse)this.schedule(interval+1/60,'terrain-collapse',{x1:x-r-2,x2:x+r+2});
 }
 animateRect(x1,y1,x2,y2,build=true,delayMs=14,material=null){
  const height=Math.abs(y2-y1),steps=clamp(Math.ceil(height/7),2,40),base=Math.max(y1,y2),top=Math.min(y1,y2),interval=clamp(delayMs,3,80)/1000;
  for(let step=1;step<=steps;step++)this.schedule((step-1)*interval,'terrain-rect',{x1,x2,y1:base-(base-top)*step/steps,y2:base,build,material});
 }
 fire(){
  const p=this.active(),w=BY_ID[p?.weapon];if(this.stage!=='aim'||!p||!w||!(p.inventory[w.id]>0))return false;
  if(!this.sandbox)p.inventory[w.id]--;p.shots++;this.stage='flight';this.flightStarted=this.t;const a=p.angle*Math.PI/180,initial=Geo.launch(p,w),v=Math.hypot(initial.vx,initial.vy),x=initial.x,y=initial.y;p.lastAim={angle:p.angle,power:p.power};
  this.emit('muzzle',{x,y,color:p.color,player:p.id,weapon:w.id,family:w.family});this.currentWeapon=w.id;
  const atTank=!w.fx?.commandTypes.includes('BULLET');
  if(this.launchWeaponAt(atTank?p.x:x,atTank?p.y:y,initial.vx,initial.vy,w,p.id))return true;
  if(w.family==='jump'){p.vx=Math.cos(a)*v*.6;p.vy=-Math.sin(a)*v*.72;p.grounded=false;p.impulseUntil=this.t+2;this.emit('jump',{x:p.x,y:p.y,color:p.color});return true;}
  if(w.family==='rail'){
   const ex=x+Math.cos(a)*1800,ey=y-Math.sin(a)*1800;
   this.emit('beam',{x,y,x2:ex,y2:ey,color:w.color});
   for(const q of this.players.filter(q=>q.participant&&q!==p)){const hit=segmentDistance(q.x,q.y-8,x,y,ex,ey);if(hit.d<w.radius)this.award(p.id,q,w.damage*(1-hit.d/(w.radius+1)));}
   for(let k=0;k<170;k++){const bx=x+Math.cos(a)*k*8,by=y-Math.sin(a)*k*8;if(bx<0||bx>W)break;if(this.solid(bx,by))this.soil.circle(bx,by,14,false);}
   this.syncTerrain();this.separateTanks();return true;
  }
  if(w.behavior==='burst'){for(let i=0;i<w.count;i++)this.schedule(i*.08,'burst',{x,y,vx:initial.vx+(this.rng.next()-.5)*35,vy:initial.vy,weapon:w.id,owner:p.id});return true;}
  if(['escape','pedestal','dome'].includes(w.behavior)){
   const plan=impactPlan(w.id,undefined,()=>this.rng.next());
   if(plan&&(plan.terrain.length||plan.explosions.length)){this.applyImpactPlan(p.x,p.y,w,p.id,plan,{vx:0,vy:-1});return true;}
   if(w.behavior==='escape')this.animateRect(p.x-24,0,p.x+24,this.ground(p.x)+15,false,10);
   else if(w.behavior==='pedestal'){const ground=this.ground(p.x);this.animateRect(p.x-25,ground-w.height,p.x+25,ground+2,true,w.fx?.eraseDelayMs);}
   else {this.animateCircle(p.x,p.y,65,true,false,10);this.schedule(.24,'terrain-circle',{x:p.x,y:p.y,r:47,build:false,collapse:false});}
   this.emit('dirt',{x:p.x,y:p.y,r:w.radius,color:w.color,weapon:w.id,family:w.family});return true;
  }
  const n=['spread','seeker'].includes(w.family)?(w.count||1):1;
  for(let i=0;i<n;i++){const aa=a+(i-(n-1)/2)*(w.spread||.09);this.projectile(x,y,Math.cos(aa)*v,-Math.sin(aa)*v,w,p.id,{launchAngle:aa*180/Math.PI,sourceIndex:i});}
  return true;
 }
 award(owner,target,points){const p=this.players.find(p=>p.id===owner);if(!p||!target||!Number.isFinite(points)||points<=.5)return;const damage=Math.max(1,Math.round(points)),amount=damage*(p===target||this.teams&&p.team===target.team?-1:1),durationMs=Math.round(clamp(10+damage*1.35,12,170));p.score+=amount;this.emit('score',{x:target.x,y:target.y-42,value:amount,player:p.id,target:target.id,self:amount<0,color:amount<0?'#ff786f':'#ffe083'});this.emit('hit',{x:target.x,y:target.y-12,player:p.id,target:target.id,damage,durationMs,self:amount<0});}
 deform(x,y,r,build=0){
  if(!Number.isFinite(x+y+r)||r<=0)return;
  // Subtract a complete circle, including an underground cavity. It then
  // collapses through the same authoritative column physics as every blast.
  if(build)this.soil.circle(x,y-Math.min(build,r)*.35,r,true);
  else this.soil.circle(x,y,r,false);
  this.syncTerrain();
 }
 separateTanks(){
  const ps=this.players.filter(p=>p.participant).sort((a,b)=>a.x-b.x);
  for(let pass=0;pass<4;pass++)for(let i=1;i<ps.length;i++)if(ps[i].x-ps[i-1].x<40&&Math.abs(ps[i].y-ps[i-1].y)<26){const d=(40-ps[i].x+ps[i-1].x)/2;ps[i-1].x=clamp(ps[i-1].x-d,24,W-24);ps[i].x=clamp(ps[i].x+d,24,W-24);ps[i-1].vx=ps[i].vx=0;}
  for(const p of ps){p.x=clamp(p.x,24,W-24);this.refreshBurial(p);const q=this.bodySupport(p);if(p.y>q.y){p.y=q.y;p.vy=0;p.grounded=true;}if(p.grounded)p.surfaceAngle=q.angle;}
 }
 updateBodies(dt){
  for(const p of this.players.filter(p=>p.participant)){
   this.refreshBurial(p);
   const before=this.bodySupport(p);p.vx=finite(p.vx);p.vy=finite(p.vy);
   if(p.buried){p.vx=0;p.driveInput=0;p.driveUntil=0;if(p.vy<0)p.vy=0;}
   if(p.grounded&&p.y<before.y-.7)p.grounded=false;
   if(p.y>before.y){p.y=before.y;p.vy=0;p.grounded=true;}
   if(p.grounded){
    const tilt=before.angle;
    const driving=this.stage==='aim'&&p.id===this.activeId&&!p.blockedThisTurn&&p.fuel>0&&this.t<(p.driveUntil||0)&&p.driveInput;
    if(driving){const previous=p.vx;p.vx=clamp(p.vx+p.driveInput*Math.cos(tilt)*240*dt,-72,72);p.fuel=Math.max(0,p.fuel-Math.max(1,Math.abs((p.vx+previous)/2))*.055*dt);}
    // Ordinary slopes remain aimable. Only steep, newly disturbed ground slides.
    if(Math.abs(tilt)>.68)p.vx+=Math.sin(tilt)*200*dt;
    p.vx*=Math.exp(-(driving?1.7:7)*dt);if(Math.abs(p.vx)<.4)p.vx=0;
   }else p.vy+=620*dt;
   const nx=clamp(p.x+p.vx*dt,24,W-24),q=this.bodySupport(p,nx),rise=before.y-q.y;
   if(p.grounded&&rise>8){p.vx=0;}else{p.distanceDriven=(p.distanceDriven||0)+(nx-p.x);p.x=nx;}
   const contact=this.bodySupport(p);p.y+=p.vy*dt;
   if(p.y>=contact.y){const impact=p.vy;p.y=contact.y;p.vy=0;p.grounded=true;p.surfaceAngle=contact.angle;if(impact>90)this.emit('land',{x:p.x,y:p.y,color:p.color});}
   else if(p.grounded&&contact.y-p.y<4){p.y=contact.y;p.surfaceAngle=contact.angle;}
   else {p.grounded=false;p.surfaceAngle=lerp(finite(p.surfaceAngle),contact.angle,1-Math.exp(-dt*4));}
  }
  this.separateTanks();
 }
 impulse(p,x,y,strength){const dx=p.x-x,dy=p.y-8-y,len=Math.hypot(dx,dy)||1;p.vx=clamp(finite(p.vx)+dx/len*strength,-220,220);p.vy=clamp(finite(p.vy)+Math.min(-.22,dy/len)*strength,-280,160);p.grounded=false;p.impulseUntil=this.t+1;}
 applyImpactPlan(x,y,w,owner,plan,source={}){
  const vx=finite(source.vx),vy=finite(source.vy,-1),length=Math.hypot(vx,vy)||1,dirX=vx/length,dirY=vy/length;
  for(const stage of plan.terrain)this.schedule(stage.delay,'reference-build',{...stage,x:x+stage.x,y:y+stage.y,dirX,dirY,weapon:w.id,owner});
  for(const child of plan.bullets)this.schedule(child.delay,'reference-bullet',{x:x+child.x,y:y+child.y,angle:child.angle,power:child.power,sourceBullet:child.name,weapon:w.id,owner});
  this.explode(x,y,w,owner,1,true,source.sourceBullet,plan);
 }
 explode(x,y,w,owner,scale=1,terrain=true,sourceBullet,preparedPlan){
  const r=w.radius*scale;
  const plan=preparedPlan||impactPlan(w.id,sourceBullet,()=>this.rng.next());
  const throwScale=clamp((w.fx?.throwMagnitude||1.25)/1.25,.4,2.5);
  const damageStages=plan?plan.explosions.filter(stage=>Number(stage.damage)>0):[];
  if(damageStages.length)for(const stage of damageStages){const radius=Number(stage.radius)||r,damage=Number(stage.damage)||0,cx=x+stage.x,cy=y+stage.y;for(const p of this.players.filter(p=>p.participant)){const d=Math.hypot(p.x-cx,p.y-8-cy);if(d<radius+25){const amount=clamp(1-d/(radius+25),0,1);this.award(owner,p,damage*scale*amount);if(stage.throwTank&&w.fx?.throwTank!==false)this.impulse(p,cx,cy,Math.min(180,damage*1.3*throwScale)*scale*amount);}}}
  else if(!plan)for(const p of this.players.filter(p=>p.participant)){const d=Math.hypot(p.x-x,p.y-8-y);if(d<r+25){const amount=clamp(1-d/(r+25),0,1);this.award(owner,p,w.damage*scale*amount);if(w.damage>0&&w.fx?.throwTank!==false)this.impulse(p,x,y,Math.min(180,w.damage*1.3*throwScale)*scale*amount);}}
  if(terrain){
   // Classify the impact before any delayed stages change the surface. A
   // surface explosion's offset child must not become an underground cave-in
   // merely because its centre moved down or an earlier stage cut a crater.
   const surfaceImpact=y<=this.ground(x)+2;
   const stages=plan?.explosions??null;
   if(stages!==null){for(const stage of stages){
    if(!stage.erase&&!stage.dirtFall)continue;
    this.schedule(stage.delay,'reference-terrain',{...stage,x:x+stage.x,y:y+stage.y,r:stage.radius,erase:stage.erase,collapse:stage.dirtFall&&!surfaceImpact,direction:stage.eraseDirection,source:stage.name});
   }}else if(w.fx?.eraseTerrain!==false){const underground=this.soil.buriedCircle(x,y,r);this.animateCircle(x,y,r,false,w.fx?.dirtFall!==false&&underground,w.fx?.eraseDelayMs);}
  }
  this.emit('blast',{x,y,r:plan?Math.max(1,...plan.visuals.map(v=>v[6])):r,color:w.color,family:w.family,weapon:w.id,...(plan?{fxStages:plan.visuals,materialTriggers:plan.triggers}:{})});this.separateTanks();
 }
 nearest(x,owner){return this.players.filter(p=>p.participant&&p.id!==owner&&(!this.teams||p.team!==this.players.find(q=>q.id===owner)?.team)).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0];}
 coat(x,r,kind){this.coatings??=[];this.coatings=this.coatings.filter(c=>Math.abs(c.x-x)>c.r+r||c.kind===kind);this.coatings.push({x,r,kind,expires:this.turn+this.order.length*2});if(this.coatings.length>40)this.coatings.shift();this.emit('coat',{x,y:this.ground(x),r,coating:kind,color:kind==='rubber'?'#fd68da':'#e8c25f'});}
 coating(x){return (this.coatings||[]).filter(c=>this.turn<=c.expires&&Math.abs(c.x-x)<c.r).at(-1)?.kind;}
 reflect(b,restitution=.68){
  const slope=this.groundAngle(clamp(b.x,20,W-20));let nx=Number(this.solid(b.x-3,b.y))-Number(this.solid(b.x+3,b.y)),ny=Number(this.solid(b.x,b.y-3))-Number(this.solid(b.x,b.y+3));const len=Math.hypot(nx,ny);if(len){nx/=len;ny/=len;}else{nx=Math.sin(slope);ny=-Math.cos(slope);}const dot=b.vx*nx+b.vy*ny;
  if(dot<0){b.vx=(b.vx-2*dot*nx)*restitution;b.vy=(b.vy-2*dot*ny)*restitution;}
  else {b.vy=-Math.max(80,Math.abs(b.vy)*restitution);}
  b.x=clamp(b.x+nx*3,1,W-1);b.y+=ny*4;for(let i=0;i<6&&this.solid(b.x,b.y);i++){b.x+=nx;b.y+=ny;}b.revive=true;const w=BY_ID[b.weapon];this.emit('bounce',{x:b.x,y:b.y,color:w.color,family:w.family,weapon:w.id});
 }
 weaponImpact(b,w,x,y){
  const o=b.owner,p=this.players.find(p=>p.id===o),behavior=w.behavior;
  if(b.pellet){
   this.emit('spark',{x,y,r:7,color:w.color,family:w.family,weapon:w.id});
   if(b.hitTank){const q=this.players.find(p=>p.id===b.hitTank);this.award(o,q,Math.max(1,w.damage*.15));return true;}
   if(b.bounces-->0&&b.age<3){this.reflect(b,.58);return true;}return true;
  }
  if(b.liquid){if(this.zones.length<48)this.zones.push({id:++this.eventSerial,x,y,r:17,weapon:w.id,owner:o,ends:this.t+w.duration,next:this.t,kind:'fire',scale:.2});this.emit('dirt',{x,y,r:10,color:'#ff6426'});return true;}
  if(behavior==='tracer'){const q=this.nearest(x,o),distance=q?Math.abs(q.x-x):0;this.emit('trace',{x,y,angle:b.launchAngle??p.angle,distance:Math.round(distance),player:o,color:w.color});return true;}
  if(behavior==='direct'){if(b.hitTank){const q=this.players.find(p=>p.id===b.hitTank);this.award(o,q,w.damage);this.impulse(q,x,y,140);}this.emit('spark',{x,y,color:w.color,family:w.family,weapon:w.id});return true;}
  if(behavior==='jackhammer'){this.explode(x,y,w,o,.55);if(b.bounces-->0){b.vx=0;b.vy=-210;b.y=this.ground(x)-5;b.revive=true;this.emit('bounce',{x,y,color:w.color});}return true;}
  if(['wall','rubber-wall','glue-wall'].includes(behavior)){const ground=this.ground(x),half=clamp((w.width||24)/2,8,32);this.animateRect(x-half,ground-w.height,x+half,ground+4,true,w.fx?.eraseDelayMs);if(behavior==='rubber-wall')this.coat(x,32,'rubber');if(behavior==='glue-wall')this.coat(x,32,'glue');this.emit('dirt',{x,y,r:32,color:w.color,weapon:w.id,family:w.family});return true;}
  if(behavior==='pedestal'||behavior==='dome')return true; // handled on fire at owner's location
  if(behavior==='slinger'){this.emit('dirt',{x,y,r:40,color:w.color,weapon:w.id,family:w.family});for(const sign of [-1,1])for(let i=0;i<8;i++)this.schedule(i*.025,'terrain-circle',{x:x+sign*i*8,y:y-i*6,r:12,build:true,collapse:false});return true;}
  if(behavior==='rubber'||behavior==='glue'){this.coat(x,Math.max(34,w.radius*2.4),behavior);this.explode(x,y,w,o,.35,false);return true;}
  if(behavior==='flash'){this.explode(x,y,w,o,1,false);return true;}
  if(behavior==='scramble'){for(const q of this.players.filter(p=>p.participant))if(Math.hypot(q.x-x,q.y-y)<w.radius+30){q.angle=15+this.rng.int(150);q.power=20+this.rng.int(80);}this.explode(x,y,w,o);return true;}
  if(behavior==='excavate'){const len=Math.hypot(b.vx,b.vy)||1;for(let i=0;i<150;i+=8)this.schedule(i/150*.32,'terrain-circle',{x:x+b.vx/len*i,y:y+b.vy/len*i,r:w.radius*.55,build:false,collapse:false});this.emit('dirt',{x,y,r:w.radius,color:'#497d24',weapon:w.id,family:w.family});return true;}
  if(behavior==='hail'&&!b.fragment){for(let i=0;i<w.count;i++){const a=Math.PI*(.06+.88*this.rng.next()),v=110+this.rng.next()*240;this.projectile(x,y-5,Math.cos(a)*v,-Math.sin(a)*v,w,o,{pellet:true,bounces:w.bounces||3});}this.emit('split',{x,y,color:'#bde8ff',family:'freeze',weapon:w.id});return true;}
  if(behavior==='napalm'&&!b.fragment){for(let i=0;i<w.count;i++){const a=Math.PI*(.1+.8*this.rng.next()),v=60+this.rng.next()*150;this.projectile(x,y-6,Math.cos(a)*v,-Math.sin(a)*v,w,o,{liquid:true});}this.emit('split',{x,y,color:'#ff923b',family:'fire',weapon:w.id});return true;}
  if(behavior==='laser-ring'){for(let i=0;i<w.count;i++){const a=i*Math.PI*2/w.count,ex=x+Math.cos(a)*200,ey=y+Math.sin(a)*200;this.emit('beam',{x,y,x2:ex,y2:ey,color:w.color});for(const q of this.players.filter(p=>p.participant))if(Geo.circleHit(x,y,ex,ey,q.x,q.y-8,17)!==null)this.award(o,q,w.damage*.35);}return true;}
  if(['tunnel','worm','homing-worm','late-bloomer'].includes(behavior)&&!b.tunnelling){b.tunnelling=true;b.tunnelAt=this.t;b.travelled=0;b.buried=false;b.vx=(Math.sign(b.vx)||1)*115;b.vy=65;b.y=y+4;b.revive=true;return true;}
  return false;
 }
 impact(b){
  if(Pocket.node(b.weapon,b.sourceType||'BULLET',b.sourceBullet)){b.revive=Pocket.impact(this,b);return;}
  const w=BY_ID[b.weapon],x=clamp(b.x,0,W),y=Math.min(b.y,DEPTH-12),o=b.owner;
  const plan=impactPlan(w.id,b.sourceBullet,()=>this.rng.next());
  if(plan&&(plan.terrain.length||plan.bullets.length)){
   if(['rubber','rubber-wall'].includes(w.behavior))this.coat(x,Math.max(34,w.radius*2.4),'rubber');
   if(['glue','glue-wall'].includes(w.behavior))this.coat(x,Math.max(34,w.radius*2.4),'glue');
   this.applyImpactPlan(x,y,w,o,plan,b);return;
  }
  if((!b.fragment||b.pellet||b.liquid)&&this.weaponImpact(b,w,x,y))return;
  if(!b.hitTank&&!b.fragment&&!b.buried&&this.coating(x)==='rubber'&&(b.coatBounces||0)<3){b.coatBounces=(b.coatBounces||0)+1;this.reflect(b,.82);return;}
  if(plan&&plan.explosions.length){
   this.applyImpactPlan(x,y,w,o,plan,b);return;
  }
  if(b.fragment){this.explode(x,y,w,o,b.scale||.55,true,b.sourceBullet,plan);return;}
  const f=b.family;
  if(f==='bounce'&&b.bounces>0&&!b.hitTank){b.bounces--;this.reflect(b);return;}
  if((f==='roller'||f==='saw')&&!b.rolling){b.rolling=true;b.y=this.ground(x)-6;b.rollAt=this.t;b.pulseAt=this.t;b.vx=Math.sign((this.nearest(x,o)?.x||W/2)-x)*125;b.vy=0;b.revive=true;return;}
  if(f==='burrow'&&!b.buried){b.buried=true;b.buryY=this.ground(x)+w.depth;b.vx*=.32;b.vy=130;b.revive=true;return;}
  if(f==='dirt'){this.animateCircle(x,y-Math.min(w.height,w.radius)*.35,w.radius,true,false,w.fx?.eraseDelayMs);this.emit('dirt',{x,y,r:w.radius,color:w.color,weapon:w.id,family:w.family});return;}
  if(f==='teleport'){const p=this.players.find(p=>p.id===o);if(p)p.x=clamp(x,24,W-24);this.separateTanks();this.emit('warp',{x,y,color:w.color});return;}
  if(['fire','acid','vortex'].includes(f)){if(this.zones.length<48)this.zones.push({id:++this.eventSerial,x,y,r:w.radius,weapon:w.id,owner:o,ends:this.t+w.duration,next:this.t,kind:f});this.explode(x,y,w,o,.7);return;}
  if(f==='rain'){
   this.explode(x,y,w,o,.45);
   for(let i=0;i<w.count;i++){const rx=clamp(x+(i-(w.count-1)/2)*(w.width||160)/w.count,20,W-20);this.schedule(i*.11,'drop',{x:rx,y:-50,weapon:w.id,owner:o});}return;
  }
  if(f==='drill'){for(let i=0;i<w.count;i++)this.schedule(i*.2,'blast',{x,y:Math.min(DEPTH-12,y+i*24),weapon:w.id,owner:o});return;}
  if(f==='lightning'||f==='laser'){
   this.emit('beam',{x,y:-200,x2:x,y2:y+80,color:w.color});
   if(f==='laser')for(let i=0;i<5;i++)this.deform(x,y+i*30,w.radius*.65);
   this.explode(x,y,w,o);return;
  }
  if(f==='quake'||f==='chain'){
   const dir=Math.sign((this.nearest(x,o)?.x||W/2)-x)||1;
   for(let i=0;i<w.count;i++){const qx=clamp(x+(f==='chain'?i*40*dir:(i%2?-1:1)*Math.ceil(i/2)*39),5,W-5);this.schedule(i*.13,'blast',{x:qx,y:this.ground(qx),weapon:w.id,owner:o});}return;
  }
  if(f==='pulse'){for(let i=0;i<w.count;i++)this.schedule(i*.3,'blast',{x,y,weapon:w.id,owner:o,scale:.7+i*.25});return;}
  if(f==='flower'){
   this.explode(x,y,w,o,.65);
   for(let i=0;i<w.count;i++){const a=Math.PI*(.13+i*.74/(w.count-1));this.projectile(x,this.ground(x)-6,Math.cos(a)*180,-Math.sin(a)*240,w,o,{fragment:true,scale:.6});}return;
  }
  if(f==='pull'||f==='push'){for(const p of this.players.filter(p=>p.participant)){const d=p.x-x;if(Math.abs(d)<w.radius*1.8)p.x+=Math.sign(d)*(f==='pull'?-1:1)*Math.max(0,65-Math.abs(d)*.22);}}
  if(f==='freeze')for(const p of this.players.filter(p=>p.participant))if(Math.abs(p.x-x)<w.radius+20)p.frozen=1;
  this.explode(x,y,w,o,1,true,b.sourceBullet);
  if(f==='echo')this.schedule(.5,'blast',{x,y,weapon:w.id,owner:o,scale:.9});
  if(f==='comet')for(const dir of [-1,1])this.schedule(.15,'blast',{x:clamp(x+dir*45,0,W),y,weapon:w.id,owner:o,scale:.55});
 }
 advanceProjectile(b,dt){
  if(b.intercepted)return false;
  const authored=Pocket.advance(this,b,dt);if(authored!==null)return authored;
  const w=BY_ID[b.weapon],bullet=w.fx?.bullet||{};b.age+=dt;if(b.age>9||b.x< -150||b.x>W+150||b.y>DEPTH+150)return false;
  if(!b.fragment&&bullet.timed&&bullet.fuse>0&&b.age>=bullet.fuse){this.impact(b);return !!b.revive&&(b.revive=false,true);}
  if(b.tunnelling){
   const q=this.nearest(b.x,b.owner),age=this.t-b.tunnelAt;
   if(w.behavior==='homing-worm'&&q&&Math.abs(q.x-b.x)<20){b.vx=0;b.vy=-150;}
   else if(w.behavior==='worm')b.vy-=170*dt;
   else if(w.behavior==='tunnel'||w.behavior==='late-bloomer')b.vy=age<.25?65:-25;
   const nextX=b.x+b.vx*dt,nextY=b.y+b.vy*dt,wasSolid=this.solid(nextX,nextY);
   b.x=nextX;b.y=nextY;b.travelled+=Math.hypot(b.vx,b.vy)*dt;
   if(b.x<2||b.x>W-2||b.y>DEPTH-5||age>2.8){this.explode(clamp(b.x,0,W),Math.min(b.y,DEPTH-12),w,b.owner);return false;}
   this.soil.circle(b.x,b.y,7,false,false);this.syncTerrain();
   if(q&&Math.hypot(q.x-b.x,q.y-8-b.y)<24||!wasSolid&&age>.35){
    if(w.behavior==='late-bloomer')for(let i=0;i<w.count;i++){const a=.25+Math.PI*.7*i/(w.count-1);this.projectile(b.x,b.y,Math.cos(a)*230,-Math.sin(a)*230,w,b.owner,{fragment:true,scale:.65});}
    this.explode(b.x,b.y,w,b.owner,.8);return false;
   }return true;
  }
  if(b.rolling){
   if(this.coating(b.x)==='glue'){this.emit('stuck',{x:b.x,y:b.y});return false;}if(['downhill','cannonball'].includes(w.behavior))b.vx=clamp(b.vx+Math.sin(this.groundAngle(b.x))*300*dt,-170,170);b.x+=b.vx*dt;b.y=this.ground(b.x)-5;const q=this.nearest(b.x,b.owner);
   if(b.family==='saw'&&this.t-b.pulseAt>.25){b.pulseAt=this.t;this.explode(b.x,b.y,w,b.owner,.65);}
   if(this.t-b.rollAt>2.1||Math.abs((q?.x??-999)-b.x)<20||b.x<5||b.x>W-5){if(w.behavior==='cruball'){this.emit('dirt',{x:b.x,y:b.y,r:w.radius,color:w.color});this.deform(b.x,b.y,w.radius,w.height);}else if(w.behavior==='cannonball'){this.emit('spark',{x:b.x,y:b.y,color:w.color});if(q&&Math.abs(q.x-b.x)<24){this.award(b.owner,q,w.damage);this.impulse(q,b.x,b.y,90);}}else this.explode(b.x,b.y,w,b.owner);return false;}return true;
  }
  if(b.buried){b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y>=b.buryY||b.y>DEPTH-5){this.explode(b.x,Math.min(DEPTH-12,b.y),w,b.owner);return false;}return true;}
  if(b.family==='boomerang'&&!b.turned&&b.age>.85){b.turned=true;b.vx*=-1;}
  if(b.family==='seeker'&&!b.fragment){const q=this.nearest(b.x,b.owner);if(q&&b.age>.35&&(w.behavior!=='proximity'||Math.hypot(q.x-b.x,q.y-b.y)<w.seekRadius)){if(w.behavior==='dive'){if(Math.abs(q.x-b.x)<18&&b.y<q.y-35){b.vx=0;b.vy=Math.max(160,b.vy);b.diving=true;}}else{const dx=q.x-b.x,dy=q.y-b.y,l=Math.hypot(dx,dy)||1;b.vx+=dx/l*120*dt;b.vy+=dy/l*95*dt;}}}
  if(bullet.homing&&!b.fragment){const q=this.nearest(b.x,b.owner),distance=q?Math.hypot(q.x-b.x,q.y-8-b.y):Infinity,range=bullet.homingDistance||1200;if(q&&distance<=range){const strength=clamp(Math.abs(bullet.homingMagnitude)||110,15,240);b.vx+=(q.x-b.x)/Math.max(1,distance)*strength*dt;b.vy+=(q.y-8-b.y)/Math.max(1,distance)*strength*dt;}}
  if(bullet.proximity&&!b.fragment){const q=this.nearest(b.x,b.owner),range=Math.max(8,bullet.proximityDistance||w.seekRadius||24);if(q&&b.age>.08&&Math.hypot(q.x-b.x,q.y-8-b.y)<=range){b.hitTank=Math.hypot(q.x-b.x,q.y-8-b.y)<=19?q.id:null;this.impact(b);return !!b.revive&&(b.revive=false,true);}}
  if(w.behavior==='zapper'){const q=this.nearest(b.x,b.owner);if(q&&b.age>.12&&Math.hypot(q.x-b.x,q.y-b.y)<w.seekRadius){this.emit('beam',{x:b.x,y:b.y,x2:q.x,y2:q.y-8,color:w.color});this.award(b.owner,q,w.damage);return false;}}
  const wasVy=b.vy;b.vx+=this.wind*(bullet.windResistance?.18:1)*dt;b.vy+=(bullet.gravityMode==='UP'?-G:bullet.gravityMode==='NONE'||bullet.gravityMode==='OFF'||w.gravity===0?0:G)*dt;
  if(!b.fragment&&(b.family==='cluster'&&wasVy<0&&b.vy>=0||b.family==='split'&&b.age>.72)){
   for(let i=0;i<w.count;i++){const vx=b.vx*.5+(i-(w.count-1)/2)*55;this.projectile(b.x,b.y,vx,b.family==='cluster'?30:-70,w,b.owner,{fragment:true,scale:.7,sourceParent:b.sourceBullet,sourceIndex:i});}
   this.emit('split',{x:b.x,y:b.y,color:w.color,family:w.family,weapon:w.id});return false;
  }
  const nx=b.x+b.vx*dt,ny=b.y+b.vy*dt;
  let hit=null,first=2;
  if(!bullet.bypassTank)for(const p of this.players.filter(p=>p.participant)){if(p.id===b.owner&&b.age<.14)continue;const t=Geo.circleHit(b.x,b.y,nx,ny,p.x,p.y-8,17);if(t!==null&&t<first){hit=p;first=t;}}
  let terrainT=2;const steps=Math.max(1,Math.ceil(Math.hypot(nx-b.x,ny-b.y)));
  for(let i=1;i<=steps;i++){const x=lerp(b.x,nx,i/steps),y=lerp(b.y,ny,i/steps);if(x>=0&&x<W&&this.solid(x,y)){terrainT=i/steps;break;}}
  if(first<=1||terrainT<=1){const t=Math.min(first,terrainT);b.x=lerp(b.x,nx,t);b.y=lerp(b.y,ny,t);b.hitTank=first<terrainT?hit?.id:null;this.impact(b);return !!b.revive&&(b.revive=false,true);}
  b.x=nx;b.y=ny;return true;
 }
 botAim(p){const q=this.nearest(p.x,p.id);if(!q)return;const dx=Math.abs(q.x-p.x),elev=(40+this.rng.next()*22)*Math.PI/180,den=2*Math.cos(elev)**2*(q.y-p.y+dx*Math.tan(elev)),v=Math.sqrt(Math.max(1,G*dx*dx/Math.max(1,den)));p.angle=q.x>p.x?elev*180/Math.PI:180-elev*180/Math.PI;p.power=clamp((v-200)/5.2+(this.rng.next()-.5)*6,8,100);const available=Object.keys(p.inventory).filter(k=>p.inventory[k]>0&&BY_ID[k].damage>0);p.weapon=this.rng.pick(available)||p.weapon;}
 step(dt){
  if(this.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,1/30);this.t+=dt;
  this.explosionWaves=(this.explosionWaves||[]).filter(w=>this.t<w.started+w.duration);
  if(this.soil.step(dt))this.syncTerrain();
  this.updateBodies(dt);
  if(this.stage==='drone'){Drone.step(this,dt);return;}
  if(this.stage==='loadout'){
   for(const p of this.players.filter(p=>p.participant&&p.bot&&!p.loadoutReady)){p.loadout=this.rng.shuffle(WEAPONS.filter(w=>w.id!=='pebble'&&w.draft!==false)).slice(0,this.draftSize).map(w=>w.id);p.loadoutReady=true;}
   if(this.t>=this.loadoutDeadline||this.players.filter(p=>p.participant).every(p=>p.loadoutReady||!p.connected&&this.t-(p.lostAt||0)>4))this.finalizeLoadouts();
   return;
  }
  if(this.stage==='aim'){
   const p=this.active();if((p.bot&&this.t-this.aimStarted>1.2)||(!p.connected&&this.t-this.aimStarted>4)||this.t>=this.deadline){this.botAim(p);this.fire();}return;
  }
  const due=this.pending.filter(x=>x.at<=this.t);this.pending=this.pending.filter(x=>x.at>this.t);let terrainChanged=false;
  for(const e of due){
   if(e.kind==='pocket-command'){Pocket.command(this,e);continue;}
   if(e.kind==='reference-build'){
    if(e.type==='DIRTBALL')this.animateCircle(e.x,e.y,e.radius,true,false,clamp(18-Math.log2(1+e.spikeCount),5,14),e.material);
    else if(e.type==='MAGICWALL')this.animateRect(e.x-e.width/2,e.y-e.height,e.x+e.width/2,e.y,true,10,e.material);
    else if(e.type==='DIRTSLINGER'){
     const half=Math.max(2,e.width/2),steps=clamp(Math.ceil(e.width/7),3,32),radius=clamp(Math.min(e.width,e.height)/5,2,14);
     for(let i=0;i<steps;i++){const u=steps===1?0:i/(steps-1)*2-1;this.schedule(i*.018,'terrain-circle',{x:e.x+u*half,y:e.y-(1-Math.abs(u))**.72*e.height,r:radius,build:true,collapse:false,material:e.material});}
    }else if(e.type==='DIRTMOVER'){
     const height=Math.max(1,e.height),steps=clamp(Math.ceil(height/8),2,64),start=e.backupDistance||0,buried=this.soil.buriedCircle(e.x,e.y,Math.max(e.minWidth,e.maxWidth)/2);
     for(let i=0;i<steps;i++){const t=i/(steps-1),distance=start+t*height,width=lerp(e.minWidth||e.thickness||8,e.maxWidth||e.minWidth||e.thickness||8,t);this.schedule(i*.006,'terrain-circle',{x:e.x+e.dirX*distance,y:e.y+e.dirY*distance,r:Math.max(1,width/2),build:false,collapse:false});}
     if(e.dirtFall&&buried)this.schedule(steps*.006+1/60,'terrain-collapse',{x1:e.x-Math.max(e.minWidth,e.maxWidth)-2,x2:e.x+e.dirX*(start+height)+Math.max(e.minWidth,e.maxWidth)+2});
    }
    this.emit('dirt',{x:e.x,y:e.y,r:e.radius||e.width||e.maxWidth||18,color:e.material?.[1]||BY_ID[e.weapon]?.color||'#a8bc80',weapon:e.weapon,family:BY_ID[e.weapon]?.family});continue;
   }
   if(e.kind==='reference-bullet'){
    const w=BY_ID[e.weapon];if(!w)continue;const referenceAngle=finite(e.angle,270),angle=referenceAngle*Math.PI/180,speed=clamp(Math.abs(finite(e.power))*7,0,1100);
    this.projectile(e.x,e.y,Math.cos(angle)*speed,Math.sin(angle)*speed,w,e.owner,{fragment:true,authored:true,sourceBullet:e.sourceBullet,launchAngle:(360-finite(e.angle,270)+360)%360});continue;
   }
   if(e.kind==='reference-terrain'){
    // Keep the original roof classification throughout the expanding cut.
    // Never reclassify its freshly exposed walls as a new buried explosion.
    const buried=e.buried??this.soil.buriedCircle(e.x,e.y,e.r);
    const started=e.started??e.at;
    const radius=ExplosionTimeline.waveSample({...e,started},this.t).drawProgress;
    if(e.erase&&radius>0){
     const inward=(e.drawDirection||e.direction)==='EXPLOSION_IN';
     for(const dx of e.doubleUp?[0,1]:[0]){
      if(inward)this.soil.circle(e.x+dx,e.y,e.r,false,false,Math.max(0,e.r-radius));
      else this.soil.circle(e.x+dx,e.y,radius,false,false);
     }
    }
    if(e.erase&&radius<e.r){const {at,kind,...job}=e;this.schedule(1/60,'reference-terrain',{...job,started,buried});}
    else if(e.collapse&&(!e.erase||buried))this.soil.activateUnsupported(e.x-e.r,e.x+e.r);
    terrainChanged=true;continue;
   }
   if(e.kind==='terrain-circle'){this.soil.circle(e.x,e.y,e.r,e.build,e.collapse,0,e.material);terrainChanged=true;continue;}
   if(e.kind==='terrain-rect'){this.soil.rect(e.x1,e.y1,e.x2,e.y2,e.build,e.material);terrainChanged=true;continue;}
   if(e.kind==='terrain-collapse'){this.soil.activateUnsupported(e.x1,e.x2);terrainChanged=true;continue;}
   const w=BY_ID[e.weapon];if(!w)continue;if(e.kind==='burst'){this.projectile(e.x,e.y,e.vx,e.vy,w,e.owner);continue;}if(e.kind==='drop')this.projectile(e.x,e.y,0,260,w,e.owner,{fragment:true,scale:.85});else this.explode(e.x,e.y,w,e.owner,e.scale||1);
  }
  if(terrainChanged)this.syncTerrain();
  // New fragments must survive the update of their parent, so update a detached array.
  if(this.interceptors.length)for(let i=0;i<2;i++){
   const old=this.projectiles;this._projectileStep=old;
   // Defensive contact is resolved before any target graph can emit its payload.
   AirDefense.step(this,old,dt/2);
   this.projectiles=[];
   for(const b of old){const live=!b.intercepted&&this.advanceProjectile(b,dt/2);if(live&&this.projectiles.length<MAX_PROJECTILES)this.projectiles.push(b);else if(live)Pocket.trace(this,'limit',{limit:'projectiles',weapon:b.weapon});}
   this._projectileStep=null;
  }else{
   // Preserve the established graph scheduling when no defense is in flight.
   const old=this.projectiles;this.projectiles=[];for(const b of old){let live=true;for(let i=0;i<2&&live;i++)live=this.advanceProjectile(b,dt/2);if(live&&this.projectiles.length<MAX_PROJECTILES)this.projectiles.push(b);else if(live)Pocket.trace(this,'limit',{limit:'projectiles',weapon:b.weapon});}
  }
  for(const z of this.zones){if(z.kind==='authored-material'){Pocket.materialStep(this,z,dt);continue;}const w=BY_ID[z.weapon];if(this.t>=z.next){z.next=this.t+.42;
    if(z.kind==='vortex'){for(const p of this.players.filter(p=>p.participant))if(Math.abs(p.x-z.x)<z.r*2)p.x+=(z.x-p.x)*.13;this.explode(z.x,this.ground(z.x),w,z.owner,.45,false);}
    else {
     z.y=this.ground(z.x);const scale=z.scale??(z.kind==='fire'?.7:.62),radius=w.radius*scale;
     this.zoneRemainders??=new WeakMap();let fractions=this.zoneRemainders.get(z);if(!fractions){fractions=new Map();this.zoneRemainders.set(z,fractions);}
     for(const p of this.players.filter(p=>p.participant)){const d=Math.hypot(p.x-z.x,p.y-8-z.y);if(d<radius+25){const amount=(fractions.get(p.id)||0)+w.damage*scale*clamp(1-d/(radius+25),0,1),damage=Math.floor(amount);fractions.set(p.id,amount-damage);if(damage)this.award(z.owner,p,damage);}}
     if(z.kind==='acid')this.animateCircle(z.x,z.y,radius,false,false,w.fx?.eraseDelayMs);
    }
   }if(z.kind==='vortex'&&this.t>=z.ends&&!z.done){z.done=true;this.explode(z.x,this.ground(z.x),w,z.owner,1.4);}}
  this.zones=this.zones.filter(z=>this.t<z.ends);
  this.separateTanks();
  // Stop runaway projectiles, but let soil and tanks finish falling normally.
  if(this.t-this.flightStarted>45&&(this.projectiles.length||this.pending.length||this.zones.length)){Pocket.trace(this,'limit',{limit:'shot-time',weapon:this.currentWeapon});this.projectiles=[];this.pending=[];this.zones=[];}
  if(!this.projectiles.length&&!this.interceptors.length&&!this.pending.length&&!this.zones.length&&!this.explosionWaves.length&&!this.soil.active.size&&this.players.every(p=>!p.participant||p.grounded&&Math.abs(p.vx||0)<4)&&this.t-this.flightStarted>.85)this.nextTurn();
 }
 snapshot(){return {explosionWaves:this.explosionWaves.map(w=>({...w})),interceptors:this.interceptors.map(b=>({...b})),drone:this.drone?{...this.drone}:null,mode:this.mode,phase:this.phase,stage:this.stage,t:this.t,roundSerial:this.roundSerial,players:this.players.map(p=>({...p,inventory:{...p.inventory},loadout:[...(p.loadout||[])]})),events:this.events.slice(-65),result:this.result,width:W,height:H,terrainBottom:DEPTH,sky:'classic',teams:!!this.teams,terrainColumns:this.soil.snapshot(),terrainStrata:this.soil.strataSnapshot(),terrainMaterials:this.soil.materialsSnapshot(),fallingColumns:this.soil.active.size,terrain:this.terrain.slice(),terrainRevision:this.terrainRevision,projectiles:this.projectiles.map(b=>({...b})),zones:this.zones.map(z=>({...z})),turn:this.turn,rounds:this.rounds||10,activeId:this.activeId,deadline:this.deadline||0,loadoutDeadline:this.loadoutDeadline||0,draftMode:!!this.draftMode,draftSize:this.draftSize||0,wind:this.wind,currentWeapon:this.currentWeapon,coatings:(this.coatings||[]).map(c=>({...c})),sandbox:this.sandbox||false};}
}
module.exports={Tanks,W,H,G};
