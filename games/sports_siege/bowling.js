'use strict';
// Rapier stays server-side: phones send a gesture, never a pin count or score.
let R;
async function init(){if(!R){R=require('@dimforge/rapier3d-compat');await R.init();}}
const PIN_POS=[];
for(let row=0;row<4;row++)for(let col=0;col<=row;col++)PIN_POS.push({x:(col-row/2)*.72,z:-9.8-row*.65});
// Pin silhouette [radius,height] shared with the host lathe (scene-bowling.js keeps a
// copy; tests/bowling-physics-regression.test.js checks they match). A narrow foot
// under a wide belly lets a struck pin tip and tumble. The previous fat cylinder base
// (radius .225) could not tip from deck friction, so struck pins slid upright like pucks.
const PIN_PROFILE=[[.089,0],[.136,.06],[.183,.17],[.204,.31],[.194,.44],[.157,.57],[.11,.69],[.083,.8],[.085,.88],[.117,.97],[.128,1.05],[.109,1.13],[.06,1.19],[0,1.21]];
const PIN_FOOT=.16,LANE_END=-15.4;
const PIN_DAMPING={linear:.12,angular:.18},FALLEN_DAMPING={linear:1.2,angular:3},WOBBLE_DAMPING={linear:2.5,angular:4};
function profileRadius(y){for(let i=1;i<PIN_PROFILE.length;i++){const [r1,y1]=PIN_PROFILE[i-1],[r2,y2]=PIN_PROFILE[i];if(y<=y2)return r1+(r2-r1)*(y-y1)/Math.max(1e-6,y2-y1);}return 0;}
function profileHull(minY,maxY,segments){
  const points=[],ring=(r,y)=>{for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2;points.push(Math.cos(a)*r,y,Math.sin(a)*r);}};
  ring(profileRadius(minY),minY);for(const [r,y] of PIN_PROFILE)if(y>minY&&y<maxY)ring(r,y);ring(profileRadius(maxY),maxY);
  return new Float32Array(points);
}
let bellyHull=null,headHull=null;
const speedOf=v=>Math.hypot(v.x,v.y,v.z);
class BowlingWorld {
  constructor(){if(!R)throw Error('Call bowling.init() first');this.world=null;this.pins=[];this.ball=null;this.spin=0;this.gutter=false;this.reset();}
  reset(mask=Array(10).fill(true)){
    this.world?.free();this.world=new R.World({x:0,y:-9.81,z:0});this.world.timestep=1/120;
    this.world.numSolverIterations=8;
    const floor=(x,y,z,hx,hy,hz,friction,restitution=.04)=>{
      const b=this.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x,y,z));
      this.world.createCollider(R.ColliderDesc.cuboid(hx,hy,hz).setFriction(friction).setRestitution(restitution),b);
    };
    // One seamless lane collider (a seam between two boxes launched the ball upward at
    // the deck edge), then a real pit: the lane and gutters end at LANE_END, so a ball or
    // pin that leaves the deck drops in and cannot roll back.
    floor(0,-.2,(16+LANE_END)/2,2.2,.2,(16-LANE_END)/2,.13);
    for(const x of [-2.65,2.65])floor(x,-.55,(16+LANE_END)/2,.45,.15,(16-LANE_END)/2,.12);
    // Kickbacks are tall enough that scattered pins cannot leave the lane.
    for(const x of [-3.22,3.22])floor(x,.7,0,.12,1.2,16.8,.2);
    floor(0,-1,-16.05,3.3,.2,.75,.7,0);floor(0,.1,-16.75,3.3,1.3,.2,.8,0);
    bellyHull||=profileHull(.07,.62,12);headHull||=profileHull(.6,1.21,10);
    this.pins=PIN_POS.map((pos,i)=>{
      if(!mask[i])return null;
      const body=this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(pos.x,.002,pos.z)
        .setLinearDamping(PIN_DAMPING.linear).setAngularDamping(PIN_DAMPING.angular).setCanSleep(true).setCcdEnabled(true));
      // A flat foot gives a stable stance; the belly hull starts just above the deck
      // and touches it only once the pin tips. Centre of mass stays low (~34% height).
      // The foot grips the dry deck (max-combined friction) so a struck pin tips rather
      // than gliding; the oiled lane keeps its low friction for the ball.
      this.world.createCollider(R.ColliderDesc.cylinder(.04,PIN_FOOT).setTranslation(0,.04,0).setMass(.25).setFriction(.42).setFrictionCombineRule(R.CoefficientCombineRule.Max).setRestitution(.12),body);
      this.world.createCollider(R.ColliderDesc.convexHull(bellyHull).setMass(.95).setFriction(.35).setRestitution(.18),body);
      this.world.createCollider(R.ColliderDesc.convexHull(headHull).setMass(.35).setFriction(.3).setRestitution(.2),body);
      return {id:i,body,down:false,wobble:false};
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
        if(this.gutter&&Math.abs(p.x)<2.51&&p.z>LANE_END){
          const sign=p.x<0?-1:1;this.ball.setTranslation({x:sign*2.55,y:Math.min(p.y,.18),z:p.z},true);
          this.ball.setLinvel({x:0,y:v.y,z:v.z},true);
        }
      }
      this.world.step();
    }
    // Rolling resistance the solver does not model: a pin lying on its tapered side
    // stops within about a second on wood, and an upright pin that only rocks on its
    // foot rim settles instead of spinning like a coin and holding the turn open.
    for(const pin of this.pins){
      if(!pin||pin.down)continue;
      const b=pin.body,q=b.rotation(),up=1-2*(q.x*q.x+q.z*q.z);
      if(up<.45){pin.down=true;pin.wobble=false;b.setLinearDamping(FALLEN_DAMPING.linear);b.setAngularDamping(FALLEN_DAMPING.angular);continue;}
      const wobble=up>.9&&speedOf(b.linvel())<.45&&speedOf(b.angvel())<1.6&&b.translation().y<.05;
      if(wobble!==pin.wobble){pin.wobble=wobble;const d=wobble?WOBBLE_DAMPING:PIN_DAMPING;b.setLinearDamping(d.linear);b.setAngularDamping(d.angular);}
    }
  }
  standing(){return this.pins.map(p=>{if(!p)return false;const q=p.body.rotation(),t=p.body.translation();return (1-2*(q.x*q.x+q.z*q.z))>.80&&t.y>-.1&&Math.abs(t.x)<2.3&&t.z>LANE_END-.1;});}
  get resting(){return !!this.ball&&(this.ball.translation().z< -14.5 || this.ball.isSleeping())&&this.pins.every(p=>!p||p.body.isSleeping()||speedOf(p.body.linvel())<.1&&speedOf(p.body.angvel())<.35);}
  snapshot(){
    const pose=b=>{const p=b.translation(),q=b.rotation();return {x:p.x,y:p.y,z:p.z,q:[q.x,q.y,q.z,q.w]};};
    return {pins:this.pins.filter(Boolean).map(p=>({id:p.id,...pose(p.body)})),ball:this.ball?{id:'ball',...pose(this.ball)}:null,gutter:this.gutter};
  }
  free(){this.world?.free();this.world=null;}
}
module.exports={init,BowlingWorld,PIN_POS,PIN_PROFILE,LANE_END};
