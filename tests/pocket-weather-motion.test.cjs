'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{test}=require('node:test');
const world=()=>import('data:text/javascript;base64,'+fs.readFileSync(path.resolve(__dirname,'../games/arcade_deluxe/public/pocket-world.js')).toString('base64'));
test('weak opposite turn gusts preserve prevailing travel, never recompute elapsed displacement',async()=>{
 const {PocketWorld}=await world(),w=new PocketWorld();for(let i=0;i<600;i++)w.step(1/60,i<300?3:-3);
 assert.equal(w.weatherWind,0);assert(Math.abs(w.cloudDrift-40)<1e-8);assert.equal(w.streakDrift,0);
 w.step(10,18);const before={drift:w.cloudDrift,wind:w.windShown,streak:w.streakDrift};w.step(1/60,-18);
 assert(w.cloudDrift>before.drift);assert(w.cloudDrift-before.drift<.3);assert(w.streakDrift>before.streak);assert(Math.abs(w.windShown-before.wind)<.04);
});
test('sustained strong weather reverses gradually with continuous integrated positions',async()=>{
 const {PocketWorld}=await world(),w=new PocketWorld();w.step(60,18);const start=w.cloudDrift;let previous=w.cloudDrift,lastVelocity=4+1.3*w.windShown,maxAcceleration=0;
 for(let i=0;i<3600;i++){w.step(1/60,-18);const velocity=4+1.3*w.windShown;maxAcceleration=Math.max(maxAcceleration,Math.abs(velocity-lastVelocity)*60);assert(Math.abs(w.cloudDrift-previous)<.5);previous=w.cloudDrift;lastVelocity=velocity;}
 assert(w.windShown<-16);assert(w.cloudDrift<start);assert(maxAcceleration<2.7);
});
test('weather integration is independent of frame size, clear/paused preserve flow, reduced sky stays static',async()=>{
 const {PocketWorld}=await world(),a=new PocketWorld(),b=new PocketWorld();a.step(12,18);for(let i=0;i<720;i++)b.step(1/60,18);
 assert(Math.abs(a.cloudDrift-b.cloudDrift)<1e-8);assert(Math.abs(a.streakDrift-b.streakDrift)<1e-8);
 const frozen=JSON.stringify([a.clock,a.cloudDrift,a.streakDrift,a.windShown]);a.clear();a.step(0,-18);assert.equal(JSON.stringify([a.clock,a.cloudDrift,a.streakDrift,a.windShown]),frozen);
 const r=new PocketWorld(true);r.step(90,20);r.step(90,-20);assert.equal(r.cloudDrift,0);assert.equal(r.streakDrift,0);
});
