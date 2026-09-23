(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PocketExplosionTimeline=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback,TICK=.02;
 function timeline(v){
  const r=Math.max(0,number(v.RADIUS)),eraseDelayTicks=Math.max(0,number(v.ERASE_DELAY));
  // Original PE update44bc50 uses .02s ticks; ERASE_DELAY is a lag in
  // animation ticks, NOT milliseconds per radius. It clears the visual rings.
  // Terrain cutting runs in the DRAW branch44bfb8, before that visual eraser.
  return {r,duration:(r+eraseDelayTicks+1)/50,drawDuration:r/50,eraseDelayTicks,eraseDelayMs:eraseDelayTicks*20,drawDirection:v.DRAW_DIRECTION||'EXPLOSION_OUT',eraseDirection:v.ERASE_DIRECTION||'EXPLOSION_OUT',drawColor:number(v.DRAW_COLOR),drawColorDirection:number(v.DRAW_COLOR_DIRECTION,1),drawColorLength:Math.max(1,number(v.DRAW_COLOR_LENGTH,12)),doubleUp:v.DOUBLE_UP_FLAG===true};
 }
 function waveSample(w,t){const elapsed=number(t)-number(w.started),tick=Math.max(0,Math.floor((elapsed+1e-8)/TICK)),r=Math.max(0,number(w.r)),drawProgress=Math.min(r,tick),eraseProgress=Math.min(r,Math.max(0,tick-number(w.eraseDelayTicks))),drawIn=w.drawDirection==='EXPLOSION_IN',eraseIn=w.eraseDirection==='EXPLOSION_IN';let innerRadius=drawIn?r-drawProgress:0,outerRadius=drawIn?r:drawProgress;if(eraseIn)outerRadius=Math.min(outerRadius,r-eraseProgress);else innerRadius=Math.max(innerRadius,eraseProgress);return {drawProgress,eraseProgress,drawRadius:drawIn?r-drawProgress:drawProgress,eraseRadius:eraseIn?r-eraseProgress:eraseProgress,innerRadius,outerRadius,active:elapsed>=0&&elapsed<number(w.duration)&&outerRadius>innerRadius};}
 function waveRadius(w,t){return waveSample(w,t).drawRadius;}
 return {TICK,timeline,waveRadius,waveSample};
});
