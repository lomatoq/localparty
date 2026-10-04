'use strict';
const RAPIER=require('@dimforge/rapier2d-compat');
const SCALE=80,FLOOR=780,WIDTH=110,HEIGHT=110;let ready;
function initialize(){return ready??=RAPIER.init();}
class TowerPhysics{
 constructor(){this.world=new RAPIER.World({x:0,y:13.2});this.world.timestep=1/120;this.world.numSolverIterations=24;this.world.integrationParameters.contact_natural_frequency=180;this.world.integrationParameters.normalizedAllowedLinearError=.0002;this.world.integrationParameters.numInternalPgsIterations=4;this.world.integrationParameters.maxCcdSubsteps=4;this.blocks=[];this.connections=[];const ground=this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(550/SCALE,(FLOOR+12)/SCALE));this.ground=ground;this.base=this.world.createCollider(RAPIER.ColliderDesc.cuboid(135/SCALE,12/SCALE).setFriction(1).setRestitution(0),ground);this.world.step();}
 add(x,y,metadata={}){const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x/SCALE,y/SCALE).setLinearDamping(.3).setAngularDamping(.55).setAdditionalSolverIterations(12).setCcdEnabled(true));const collider=this.world.createCollider(RAPIER.ColliderDesc.cuboid(WIDTH/2/SCALE,HEIGHT/2/SCALE).setFriction(.82).setRestitution(.025).setDensity(1),body);const block={body,collider,...metadata};this.blocks.push(block);return block;}
 step(){this.world.step();}
 remove(block){this.world.removeRigidBody(block.body);this.blocks=this.blocks.filter(b=>b!==block);}
 public(block){const p=block.body.translation();return{x:p.x*SCALE,y:p.y*SCALE,w:WIDTH,h:HEIGHT,angle:block.body.rotation(),color:block.color,owner:block.owner};}
 supportBody(block){if(block.connection)return block.connection.parent;let support=null;this.world.contactPairsWith(block.collider,other=>{if(other.translation().y<block.body.translation().y+.08)return;this.world.contactPair(block.collider,other,m=>{if(m.numSolverContacts()>0)support=other.parent();});});return support;}
 supported(block){return !!this.supportBody(block);}
 quiet(block){const support=this.supportBody(block);if(!support)return false;const body=block.body,p=body.translation(),a=body.rotation(),point={x:p.x-Math.sin(a)*HEIGHT/2/SCALE,y:p.y+Math.cos(a)*HEIGHT/2/SCALE};const atPoint=b=>{const q=b.translation(),v=b.linvel(),w=b.angvel();return{x:v.x-w*(point.y-q.y),y:v.y+w*(point.x-q.x)};},v=atPoint(body),base=atPoint(support);return Math.hypot(v.x-base.x,v.y-base.y)<.12&&Math.abs(body.angvel()-support.angvel())<.15;}
 // A well-overlapped settled floor has a compliant structural seam. A weak
 // edge landing keeps ordinary contact physics and can slide or topple.
 connect(block,settled){
  if(block.connection)return true;const support=settled.at(-1),shape=this.public(block),lower=support&&this.public(support),x=lower?.x??550;
  if(Math.abs(shape.x-x)>WIDTH*.3)return false;
  const parent=support?.body||this.ground,p=parent.translation(),a=parent.rotation(),b=block.body.translation(),r=block.body.rotation(),local={x:0,y:HEIGHT/2/SCALE};
  const point={x:b.x-Math.sin(r)*local.y,y:b.y+Math.cos(r)*local.y},dx=point.x-p.x,dy=point.y-p.y;
  const anchor={x:Math.cos(a)*dx+Math.sin(a)*dy,y:-Math.sin(a)*dx+Math.cos(a)*dy};
  const joint=this.world.createImpulseJoint(RAPIER.JointData.revolute(anchor,local),parent,block.body,true),rest=r-a;
  joint.setContactsEnabled(false);joint.configureMotorModel(RAPIER.MotorModel.ForceBased);joint.setLimits(rest-.35,rest+.35);
  const c={joint,parent,block,rest,index:settled.length};block.connection=c;this.connections.push(c);this.driveStructure(settled.concat(block),0);return true;
 }
 driveStructure(settled,wind){
  const n=settled.length,gust=Math.max(-1,Math.min(1,wind/195)),gain=1+Math.min(20,n)*.02;
  for(const c of this.connections){const above=Math.max(1,n-c.index),relative=c.block.body.rotation()-c.parent.rotation();
   if(Math.abs(relative-c.rest)>.25){this.releaseConnections();return true;}
   const stiffness=600+above*above*160,damping=70+above*above*12,target=c.rest+gust*.036*gain*(c.index+1)/Math.max(1,n);
   c.parent.wakeUp();c.block.body.wakeUp();c.joint.configureMotorPosition(target,stiffness,damping);c.joint.setMotorMaxForce(stiffness*.12);
  }return false;
 }
 releaseConnections(){for(const c of this.connections){this.world.removeImpulseJoint(c.joint,true);c.block.connection=null;}this.connections=[];}
 project(x,y,exclude){const hit=this.world.castShape({x:x/SCALE,y:y/SCALE},0,{x:0,y:1},new RAPIER.Cuboid(WIDTH/2/SCALE,HEIGHT/2/SCALE),.001,40,true,undefined,undefined,exclude?.collider,exclude?.body);return hit?{x,y:y+hit.time_of_impact*SCALE,hit:true}:{x,y:FLOOR+80,hit:false};}
 top(settled=this.blocks){if(!settled.length)return{x:550,y:FLOOR};const shapes=settled.map(b=>this.public(b));return shapes.reduce((top,b)=>{const y=b.y-Math.abs(Math.cos(b.angle))*HEIGHT/2-Math.abs(Math.sin(b.angle))*WIDTH/2;return y<top.y?{x:b.x,y}:top;},{x:550,y:FLOOR});}
 free(){this.world.free();}
}
module.exports={initialize,TowerPhysics,SCALE,FLOOR,WIDTH,HEIGHT};
