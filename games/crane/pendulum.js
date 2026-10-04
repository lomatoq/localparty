'use strict';
// The rope ends at the bridle apex, not the centre of the floor. Its release
// velocity includes both rope rotation and the floor's small relative rotation.
class HangingLoad {
 constructor(length=150){this.length=length;this.suspensionHeight=75;this.reset();}
 reset(angle=.1){this.angle=angle;this.velocity=0;this.previousAnchorVelocity=0;}
 step(dt,anchorAcceleration=0,windAcceleration=0){const steps=Math.max(1,Math.ceil(dt/(1/120))),h=dt/steps;for(let i=0;i<steps;i++){const acceleration=-(13.2*80/this.length)*Math.sin(this.angle)+((windAcceleration-anchorAcceleration)/this.length)*Math.cos(this.angle)-.45*this.velocity;this.velocity+=acceleration*h;this.angle+=this.velocity*h;const limit=.52;if(Math.abs(this.angle)>limit){this.angle=Math.sign(this.angle)*limit;this.velocity*=-.18;}}}
 pose(anchorX,restY,anchorVelocity=0){
  const loadAngle=this.angle*.6,loadVelocity=this.velocity*.6,anchorY=restY-this.length-this.suspensionHeight;
  const attachmentX=anchorX+Math.sin(this.angle)*this.length,attachmentY=anchorY+Math.cos(this.angle)*this.length;
  return{x:attachmentX-Math.sin(loadAngle)*this.suspensionHeight,y:attachmentY+Math.cos(loadAngle)*this.suspensionHeight,
   vx:anchorVelocity+Math.cos(this.angle)*this.length*this.velocity-Math.cos(loadAngle)*this.suspensionHeight*loadVelocity,
   vy:-Math.sin(this.angle)*this.length*this.velocity-Math.sin(loadAngle)*this.suspensionHeight*loadVelocity,
   beamY:anchorY-12,angle:this.angle,loadAngle,loadVelocity,attachmentX,attachmentY,anchorY,ropeLength:this.length};
 }
}
module.exports={HangingLoad};
