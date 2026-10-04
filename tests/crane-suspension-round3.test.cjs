'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {HangingLoad}=require('../games/crane/pendulum');
const wind=t=>140*Math.sin(t*1.78)+55*Math.sin(t*.63+1.2);
test('rope, bridle and floor centre share exact attachment and release derivatives',()=>{
 for(const angle of[-.52,-.2,0,.2,.52]){const h=new HangingLoad();h.angle=angle;h.velocity=.4;const p=h.pose(520,400,125);assert(Math.abs(Math.hypot(p.attachmentX-520,p.attachmentY-p.anchorY)-150)<1e-9);assert(Math.abs(p.x+Math.sin(p.loadAngle)*75-p.attachmentX)<1e-9);assert(Math.abs(p.y-Math.cos(p.loadAngle)*75-p.attachmentY)<1e-9);const eps=1e-6;h.angle+=h.velocity*eps;const n=h.pose(520+125*eps,400,125);assert(Math.abs((n.x-p.x)/eps-p.vx)<.001);assert(Math.abs((n.y-p.y)/eps-p.vy)<.001);assert.equal(p.loadVelocity,.24);}
});
test('normal-clock wind sustains visible bounded sway after the initial damping',()=>{
 const h=new HangingLoad(),x=[];for(let i=0;i<7200;i++){h.step(1/120,0,wind(i/120));assert(Number.isFinite(h.angle)&&Number.isFinite(h.velocity));assert(Math.abs(h.angle)<=.52);if(i>=2400&&i<3600)x.push(h.pose(550,495).x);}assert(Math.max(...x)-Math.min(...x)>30,'20–30s still visibly swings');assert(Math.max(...x)-Math.min(...x)<110,'bounded gameplay swing');
});
test('larger height drive increases sway conservatively and integration is deterministic',()=>{
 const low=new HangingLoad(),high=new HangingLoad(),xs=[],ys=[];for(let i=0;i<4800;i++){low.step(1/120,0,wind(i/120));high.step(1/120,0,wind(i/120)*1.5);if(i>2400){xs.push(low.pose(550,400).x);ys.push(high.pose(550,400).x);}}assert(Math.max(...ys)-Math.min(...ys)>Math.max(...xs)-Math.min(...xs));
 const a=new HangingLoad(),b=new HangingLoad();for(let i=0;i<3600;i++){const w=wind(i/60);a.step(1/60,240,w);b.step(1/120,240,w);b.step(1/120,240,w);}assert(Math.abs(a.angle-b.angle)<1e-10);assert(Math.abs(a.velocity-b.velocity)<1e-10);
});
