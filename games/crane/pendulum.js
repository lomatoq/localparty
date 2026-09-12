'use strict';
// Screen-space hanging load. Its release velocity is the derivative of this pose.
class HangingLoad {
 constructor(length=150){this.length=length;this.reset();}
 reset(angle=.06){this.angle=angle;this.velocity=0;}
 step(dt,anchorAcceleration=0){const steps=Math.max(1,Math.ceil(dt/(1/120))),h=dt/steps;for(let i=0;i<steps;i++){const acceleration=-(13.2*80/this.length)*Math.sin(this.angle)-(anchorAcceleration/this.length)*Math.cos(this.angle)-.7*this.velocity;this.velocity+=acceleration*h;this.angle+=this.velocity*h;const limit=.52;if(Math.abs(this.angle)>limit){this.angle=Math.sign(this.angle)*limit;this.velocity*=-.18;}}}
 pose(anchorX,restY,anchorVelocity=0){return{x:anchorX+Math.sin(this.angle)*this.length,y:restY+(Math.cos(this.angle)-1)*this.length,vx:anchorVelocity+Math.cos(this.angle)*this.length*this.velocity,vy:-Math.sin(this.angle)*this.length*this.velocity,beamY:restY-55-this.length-12,angle:this.angle};}
}
module.exports={HangingLoad};
