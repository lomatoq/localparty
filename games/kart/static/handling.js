'use strict';
// Shared authoritative driving response. Buttons remain immediate; a brief
// correction is gentle, while holding the same direction reaches a tight turn.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
function advance(p,dt){
  dt=clamp(dt,0,.05);if(!dt)return;
  const steps=Math.ceil(dt*120);
  for(let i=0;i<steps;i++)integrate(p,dt/steps);
}
function integrate(p,dt){
  const target=clamp(p.steer,-1,1);
  let old=Number(p.turn)||0;
  // Release stops yaw immediately. A reversal starts the new correction from
  // centre rather than spending another network snapshot turning the wrong way.
  if(old*target<0)old=0;
  p.turn=target===0?0:old+clamp(target-old,-5*dt,5*dt);
  p.speed=clamp((p.speed+420*clamp(p.throttle,0,1)*dt)*Math.pow(p.throttle>0?.985:.945,dt*60),0,430);
  // A held corner trades speed for grip rather than forcing the player to
  // alternate gas and steering just to stay on the narrow circuit.
  const cornerSpeed=430-210*Math.pow(Math.abs(p.turn),1.3);
  if(p.speed>cornerSpeed)p.speed=Math.max(cornerSpeed,p.speed-780*Math.abs(p.turn)*dt);
  // A stalled car can turn away from a barrier while gas is held; stationary
  // steering without gas stays still, as do stale/disconnected controls.
  p.angle+=p.turn*2.65*clamp(p.speed/160,p.throttle>0?.16:0,1)*dt;
  const grip=1-Math.exp(-18*dt);
  p.vx+=(Math.cos(p.angle)*p.speed-p.vx)*grip;
  p.vy+=(Math.sin(p.angle)*p.speed-p.vy)*grip;
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  p.distance=(p.distance||0)+Math.hypot(p.vx,p.vy)*dt;
}
module.exports={advance};
