'use strict';
const RAPIER=require('@dimforge/rapier2d-compat');
const SCALE=80,FLOOR=780,WIDTH=110,HEIGHT=110;let ready;
function initialize(){return ready??=RAPIER.init();}
class TowerPhysics{
 constructor(){this.world=new RAPIER.World({x:0,y:13.2});this.world.timestep=1/120;this.world.numSolverIterations=24;this.world.integrationParameters.contact_natural_frequency=180;this.world.integrationParameters.normalizedAllowedLinearError=.0002;this.world.integrationParameters.numInternalPgsIterations=4;this.world.integrationParameters.maxCcdSubsteps=4;this.blocks=[];const ground=this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(550/SCALE,(FLOOR+12)/SCALE));this.base=this.world.createCollider(RAPIER.ColliderDesc.cuboid(135/SCALE,12/SCALE).setFriction(1).setRestitution(0),ground);this.world.step();}
 add(x,y,metadata={}){const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x/SCALE,y/SCALE).setLinearDamping(.3).setAngularDamping(.55).setAdditionalSolverIterations(12).setCcdEnabled(true));const collider=this.world.createCollider(RAPIER.ColliderDesc.cuboid(WIDTH/2/SCALE,HEIGHT/2/SCALE).setFriction(.82).setRestitution(.025).setDensity(1),body);const block={body,collider,...metadata};this.blocks.push(block);return block;}
 step(){this.world.step();}
 remove(block){this.world.removeRigidBody(block.body);this.blocks=this.blocks.filter(b=>b!==block);}
 public(block){const p=block.body.translation();return{x:p.x*SCALE,y:p.y*SCALE,w:WIDTH,h:HEIGHT,angle:block.body.rotation(),color:block.color,owner:block.owner};}
 supported(block){let supported=false;this.world.contactPairsWith(block.collider,other=>{if(other.translation().y<block.body.translation().y+.08)return;this.world.contactPair(block.collider,other,m=>{if(m.numSolverContacts()>0)supported=true;});});return supported;}
 quiet(block){const velocity=block.body.linvel();return Math.hypot(velocity.x,velocity.y)<.12&&Math.abs(block.body.angvel())<.15&&this.supported(block);}
 project(x,y,exclude){const hit=this.world.castShape({x:x/SCALE,y:y/SCALE},0,{x:0,y:1},new RAPIER.Cuboid(WIDTH/2/SCALE,HEIGHT/2/SCALE),.001,40,true,undefined,undefined,exclude?.collider,exclude?.body);return hit?{x,y:y+hit.time_of_impact*SCALE,hit:true}:{x,y:FLOOR+80,hit:false};}
 top(settled=this.blocks){if(!settled.length)return{x:550,y:FLOOR};const shapes=settled.map(b=>this.public(b));return shapes.reduce((top,b)=>{const y=b.y-Math.abs(Math.cos(b.angle))*HEIGHT/2-Math.abs(Math.sin(b.angle))*WIDTH/2;return y<top.y?{x:b.x,y}:top;},{x:550,y:FLOOR});}
 free(){this.world.free();}
}
module.exports={initialize,TowerPhysics,SCALE,FLOOR,WIDTH,HEIGHT};
