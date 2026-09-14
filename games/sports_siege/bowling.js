'use strict';
// Rapier stays server-side: phones send a gesture, never a pin count or score.
let R;
async function init(){if(!R){R=require('@dimforge/rapier3d-compat');await R.init();}}
const PIN_POS=[];
for(let row=0;row<4;row++)for(let col=0;col<=row;col++)PIN_POS.push({x:(col-row/2)*.72,z:-9.8-row*.65});
class BowlingWorld {
  constructor(){if(!R)throw Error('Call bowling.init() first');this.world=null;this.pins=[];this.ball=null;this.spin=0;this.gutter=false;this.reset();}
  reset(mask=Array(10).fill(true)){
    this.world?.free();this.world=new R.World({x:0,y:-9.81,z:0});this.world.timestep=1/120;
    this.world.numSolverIterations=8;
    const floor=(x,y,z,hx,hy,hz,friction)=>{
      const b=this.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x,y,z));
      this.world.createCollider(R.ColliderDesc.cuboid(hx,hy,hz).setFriction(friction).setRestitution(.04),b);
    };
    floor(0,-.2,0,2.2,.2,16,.13);
    floor(-2.65,-.55,0,.45,.15,16,.12);floor(2.65,-.55,0,.45,.15,16,.12);
    floor(-3.22,.2,0,.12,.7,16,.2);floor(3.22,.2,0,.12,.7,16,.2);
    floor(0,0,-16.2,3.3,1,.2,.4);
    this.pins=PIN_POS.map((pos,i)=>{
      if(!mask[i])return null;
      const body=this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(pos.x,.025,pos.z)
        .setLinearDamping(.12).setAngularDamping(.18).setCanSleep(true).setCcdEnabled(true));
      // Low centre of mass + a neck/head: a pin can tip and hit its neighbours.
      this.world.createCollider(R.ColliderDesc.cylinder(.27,.225).setTranslation(0,.30,0).setMass(1.15).setFriction(.35).setRestitution(.18),body);
      this.world.createCollider(R.ColliderDesc.capsule(.19,.105).setTranslation(0,.78,0).setMass(.30).setFriction(.3).setRestitution(.2),body);
      this.world.createCollider(R.ColliderDesc.ball(.15).setTranslation(0,1.05,0).setMass(.10).setFriction(.3).setRestitution(.2),body);
      return {id:i,body};
    });
    this.ball=null;this.gutter=false;this.spin=0;
    for(let i=0;i<20;i++)this.world.step();
  }
  throw(input){
    if(this.ball)this.world.removeRigidBody(this.ball);
    const speed=7+input.power*9;
    this.ball=this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(input.position*1.72,.36,12.8)
      .setLinvel(Math.sin(input.angle)*speed,0,-Math.cos(input.angle)*speed).setAngvel({x:-speed/.33,y:input.spin*12,z:0})
      .setLinearDamping(.015).setAngularDamping(.025).setCcdEnabled(true));
    this.world.createCollider(R.ColliderDesc.ball(.33).setMass(6.8).setFriction(.16).setRestitution(.18),this.ball);
    this.spin=input.spin;this.gutter=false;
  }
  step(dt){
    const count=Math.ceil(dt/(1/120));this.world.timestep=dt/count;
    for(let i=0;i<count;i++){
      if(this.ball){
        const p=this.ball.translation(),v=this.ball.linvel();
        if(Math.abs(p.x)>2.25 || p.y<.1)this.gutter=true;
        // An intentional arcade hook, strongest after the oil section. Once in
        // a gutter the ball can never curve back onto the legal lane.
        if(!this.gutter&&p.z<3&&p.z>-9&&v.z<-.5){
          this.ball.setLinvel({x:v.x+this.spin*.60*this.world.timestep,y:v.y,z:v.z},true);
        }
        if(this.gutter&&Math.abs(p.x)<2.51){
          const sign=p.x<0?-1:1;this.ball.setTranslation({x:sign*2.55,y:Math.min(p.y,.18),z:p.z},true);
          this.ball.setLinvel({x:0,y:v.y,z:v.z},true);
        }
      }
      this.world.step();
    }
  }
  standing(){return this.pins.map(p=>{if(!p)return false;const q=p.body.rotation(),t=p.body.translation();return (1-2*(q.x*q.x+q.z*q.z))>.80&&t.y>-.1&&Math.abs(t.x)<2.3&&t.z> -15.5;});}
  get resting(){return !!this.ball&&(this.ball.translation().z< -14.5 || this.ball.isSleeping())&&this.pins.every(p=>!p||p.body.isSleeping()||Math.hypot(...Object.values(p.body.linvel()))<.06);}
  snapshot(){
    const pose=b=>{const p=b.translation(),q=b.rotation();return {x:p.x,y:p.y,z:p.z,q:[q.x,q.y,q.z,q.w]};};
    return {pins:this.pins.filter(Boolean).map(p=>({id:p.id,...pose(p.body)})),ball:this.ball?{id:'ball',...pose(this.ball)}:null,gutter:this.gutter};
  }
  free(){this.world?.free();this.world=null;}
}
module.exports={init,BowlingWorld,PIN_POS};
