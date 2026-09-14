'use strict';
// Presentation transitions are explicit server states. They do not alter scoring rules.
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function enhanceSports(Base){return class SportsV2 extends Base {
 constructor(...args){super(...args);this.events=[];this.fxSerial=0;this.rackId=0;this.reveal=null;this.firstImpact=false;}
 event(kind,data={}){this.events.push({id:++this.fxSerial,kind,at:this.time,...data});if(this.events.length>32)this.events.shift();}
 rack(...args){super.rack(...args);this.rackId=(this.rackId||0)+1;this.firstImpact=false;}
 input(p,type,d={}){
  if(['throw','preview'].includes(type)&&['power','angle','spin','offset'].some(k=>!finite(d[k])))return false;
  if(type==='preview'){if(this.phase!=='playing'||this.state!=='aim'||p!==this.current||d.turnId!==this.turnId)return false;const limit=(v,a,b)=>Math.max(a,Math.min(b,v));this.aimPreview={owner:p.id,offset:limit(d.offset,-1,1),angle:limit(d.angle,-1,1),power:limit(d.power,.1,1),spin:limit(d.spin,-1,1)};return true;}
  const ok=super.input(p,type,d);
  if(ok&&type==='throw'){this.aimPreview=null;this.lastThrow={power:d.power,angle:d.angle,spin:d.spin,offset:d.offset,owner:p.id};this.firstImpact=false;this.event('throw',{owner:p.id,power:d.power});}
  return ok;
 }
 recordBowl(pins){
  // Preserve the actual fallen-pin scene before changing racks; no camera/rack pop.
  this.reveal={kind:'bowl',pins};this.state='reveal';this.deadline=this.time+1.35;
  const r=this.current.rolls,card=require('./rules').bowlingCard(r,this.frames),spare=pins<10&&!card.fresh&&pins===card.allowed;
  this.lastRoll={pins,spare,strike:pins===10,owner:this.current.id,at:this.time};
  this.message=pins===10?'СТРАЙК!':spare?'СПЭР!':pins?`+${pins} кеглей`:'Жёлоб. Следующий бросок — твой шанс.';
  this.event(pins===10?'strike':spare?'spare':'roll',{...this.lastRoll});
 }
 nextCurl(){
  if(this.state==='rolling'){this.reveal={kind:'curl'};this.state='reveal';this.deadline=this.time+1.0;this.event('stone_stop',{owner:this.current.id});return;}
  return super.nextCurl();
 }
 update(dt){
  if(!finite(dt)||dt<0||this.phase!=='playing')return;
  this.events=this.events.filter(e=>this.time-e.at<4);
  if(this.state==='reveal'){
   this.time+=dt;
   if(this.time>=this.deadline){const r=this.reveal;this.reveal=null;if(r.kind==='bowl')super.recordBowl(r.pins);else super.nextCurl();}
   return;
  }
  if(this.state!=='rolling'){super.update(dt);return;}
  // Real 120 Hz substeps, including Rapier's world timestep, on the existing 60 Hz clock.
  const total=Math.min(dt,.12),n=Math.max(1,Math.ceil(total*120)),h=total/n;
  for(let i=0;i<n&&this.state==='rolling'&&this.phase==='playing';i++){
   if(this.world){this.world.timestep=h;const pos=this.ball?.translation();
    if(pos&&(this.gutter||pos.y<-.02)){this.gutter=true;const v=this.ball.linvel();this.ball.setTranslation({x:pos.x<0?-2.055:2.055,y:Math.min(pos.y,.12),z:pos.z},true);this.ball.setLinvel({x:0,y:v.y,z:v.z},true);}
   }
   super.update(h);
   if(this.mode==='bowling'&&this.ball&&!this.firstImpact&&this.ball.translation().z>20&&this.pins.some(p=>{const q=p.body.rotation();return 1-2*(q.x*q.x+q.z*q.z)<.93;})){
    this.firstImpact=true;this.event('impact',{x:this.ball.translation().x,z:22,owner:this.current.id});
   }
  }
 }
 snapshot(full=true){return {...super.snapshot(full),rackId:this.rackId,lastRoll:this.lastRoll||null,lastThrow:this.lastThrow||null,...(full?{aimPreview:this.aimPreview||null}:{}),events:this.events||[]};}
};}
function enhanceArcade(Base){return class ArcadeV2 extends Base {
 input(p,type,d={}){if(type==='input'&&(!finite(d.x)||!finite(d.z)))return false;const ok=super.input(p,type,d);if(ok&&type==='ability'&&this.mode==='pop_shots')p.streak=0;return ok;}
 shoot(p){
  const score=p.score,shots=p.shots,boost=p.boostUntil>this.time,ready=p.ready;
  super.shoot(p);
  if(boost){p.streak=0;p.ready=ready;}
  const e=this.effects.at(-1);if(e&&p.shots>shots){e.at=this.time;e.points=p.score-score;e.friendly=e.points<0;e.killed=e.points>0;e.boost=boost;}
 }
 gallery(dt){super.gallery(dt);for(const e of this.entities){const v=Math.max(0,Math.sin(Math.PI*e.age/e.life));e.visible=v>.02;} }
 snapshot(full=true){const s=super.snapshot(full);s.players.forEach((p,i)=>{p.lastShot=this.players[i].lastShot;p.fire=this.players[i].fire;});return s;}
};}
module.exports={enhanceSports,enhanceArcade};
