'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const rig=require('../games/tanks/public/tank-rig');
const actor=(x=0,y=0,angle=0)=>({x,y,angle,radius:19,alive:true});
test('all eight existing player colors retain their hue family in the four approved palettes',()=>{
 const existing=['#ff5c7c','#56d6ff','#ffd84a','#8cff7b','#bd7cff','#ff9f43','#5af0c8','#ffffff'];
 assert.deepEqual(existing.map(rig.paletteFor),['coral','cyan','lime','lime','plum','coral','cyan','cyan']);
 assert.equal(rig.paletteFor('hsl(270 85% 70%)'),'plum');assert.equal(rig.paletteFor('hsl(194 85% 70%)'),'cyan');
});
test('track bands integrate authoritative forward, reverse and differential turning travel',()=>{
 const zero={left:0,right:0},p=actor(),forward=rig.advanceTrackOffsets(p,actor(5),zero);
 assert.deepEqual(forward,{left:5,right:5});
 assert.deepEqual(rig.advanceTrackOffsets(actor(5),p,forward),zero);
 const turn=rig.advanceTrackOffsets(p,actor(0,0,.1),zero),travel=.1*19*2.8*.46;
 assert(Math.abs(turn.left-travel)<1e-10);assert(Math.abs(turn.right-(12-travel))<1e-10);
 const wrap=rig.advanceTrackOffsets(actor(0,0,Math.PI-.05),actor(0,0,-Math.PI+.05),zero);
 assert(Math.abs(wrap.left-turn.left)<1e-10);assert(Math.abs(wrap.right-turn.right)<1e-10);
});
test('stopped, paused recovery, reduced motion and respawn produce no independent track drift',()=>{
 const offsets={left:3,right:9},p=actor(20,40,.4);
 for(let i=0;i<1000;i++)assert.deepEqual(rig.advanceTrackOffsets(p,p,offsets),offsets);
 assert.deepEqual(rig.advanceTrackOffsets(p,actor(80,90,.9),offsets,{paused:true}),offsets);
 assert.deepEqual(rig.advanceTrackOffsets(p,actor(25,40,.4),offsets,{reduced:true}),offsets);
 assert.deepEqual(rig.advanceTrackOffsets(p,actor(1000,300,.2),offsets),offsets);
 assert.deepEqual(rig.advanceTrackOffsets({...p,alive:false},actor(80,90,.9),offsets),offsets);
});
test('snapshot cadence leaves equal straight travel at the same tile phase',()=>{
 for(const steps of [1,3,30,120]){
  let p=actor(),offsets={left:0,right:0};
  for(let i=1;i<=steps;i++){const next=actor(90*i/steps);offsets=rig.advanceTrackOffsets(p,next,offsets);p=next;}
  assert(Math.abs(offsets.left-6)<1e-9);assert(Math.abs(offsets.right-6)<1e-9);
 }
});
test('uniform rig scaling preserves existing footprint and exact world muzzle for human/bot/boss',()=>{
 const hull={optical:{x:0,y:0,w:80,h:100}},turret={pivot:{x:50,y:65},muzzle:{x:51,y:18}};
 for(const radius of [19,20,28]){
  const g=rig.rigGeometry(radius,hull,turret);
  assert.equal(g.hullHeight,radius*3.5);assert(Math.abs(g.hullWidth-radius*2.8)<1e-10);
  assert(Math.abs(g.trackCenter*2+g.trackWidth-radius*3.08)<1e-10);
  const a=g.turretRotation+Math.PI/2,x=g.muzzle.x*Math.cos(a)-g.muzzle.y*Math.sin(a),y=g.muzzle.x*Math.sin(a)+g.muzzle.y*Math.cos(a);
  assert(Math.abs(x-radius-13)<1e-10);assert(Math.abs(y)<1e-10);
 }
});
