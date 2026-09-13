'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const physics=require('../games/sports_siege/bowling');
let available=true;try{require.resolve('@dimforge/rapier3d-compat');}catch{available=false;}
if(process.env.CI&&!available)throw Error('CI must install Rapier before testing physics');
function simulate(w,seconds){for(let i=0;i<seconds*120;i++)w.step(1/120);}
test('Rapier: all ten pins remain standing before any throw',{skip:!available},async()=>{await physics.init();const w=new physics.BowlingWorld();try{simulate(w,3);assert.equal(w.standing().filter(Boolean).length,10);for(const p of w.snapshot().pins)assert.ok([p.x,p.y,p.z,...p.q].every(Number.isFinite));}finally{w.free();}});
test('Rapier: a centred throw collides with pins instead of tunnelling',{skip:!available},async()=>{await physics.init();const w=new physics.BowlingWorld();try{w.throw({power:.75,angle:0,spin:0,position:0});simulate(w,9);assert.ok(w.standing().filter(Boolean).length<10,'ball must knock down a pin');assert.ok(w.snapshot().ball.z<0);}finally{w.free();}});
test('Rapier: second-roll rack retains only survivors',{skip:!available},async()=>{await physics.init();const w=new physics.BowlingWorld();try{const mask=Array.from({length:10},(_,i)=>i%2===0);w.reset(mask);simulate(w,1);assert.deepEqual(w.standing(),mask);assert.equal(w.snapshot().pins.length,5);}finally{w.free();}});
test('Rapier: gutter ball never returns to legal lane',{skip:!available},async()=>{await physics.init();const w=new physics.BowlingWorld();try{w.throw({power:.9,angle:.32,spin:-1,position:1});simulate(w,7);assert.equal(w.gutter,true);assert.equal(w.standing().filter(Boolean).length,10);}finally{w.free();}});
