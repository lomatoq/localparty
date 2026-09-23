'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {ColumnTerrain}=require('../games/arcade_deluxe/core/terrain.cjs');
const {definitions}=require('../games/arcade_deluxe/core/pocket-terrain.cjs');
const Pocket=require('../games/arcade_deluxe/core/pocket-runtime.cjs');
const {BY_ID}=require('../games/arcade_deluxe/core/weapons.cjs');
const {makeGame}=require('../scripts/audit-pocket-runtime.cjs');

test('small circular cuts conserve footprint area across every sub-column phase',()=>{
 for(const radius of [.25,.5,1,2,3,4,5,20,60])for(let phase=0;phase<2;phase+=.125){
  const soil=new ColumnTerrain().fromHeights(Array(640).fill(400));
  const removed=-soil.circle(640+phase,400,radius,false,false);
  assert(Math.abs(removed-Math.PI*radius*radius/2)<1e-6,`radius=${radius}, phase=${phase}, removed=${removed}`);
  assert.equal(soil.active.size,0,'a small surface impact never starts cave settling');
 }
});

test('all authored small erasing explosions actually remove terrain at both column boundaries and centres',()=>{
 let checked=0;
 const g=makeGame();g.stage='flight';g.flightStarted=0;
 for(const [id,w]of definitions)for(const n of w.chain){
  if(n.type!=='EXPLOSION'||n.values.ERASE_TERRAIN_FLAG!==true||n.values.RADIUS>5||n.values.RADIUS<=0)continue;
  checked++;
  for(const phase of [0,.25,.5,1,1.75]){
   g.soil.fromHeights(Array(640).fill(400));g.pending=[];g.projectiles=[];g.zones=[];
   const before=g.soil.volume();
   Pocket.command(g,{weapon:id,type:n.type,name:n.name,x:640+phase,y:400,owner:'a',angle:90,power:0,surfaceImpact:true});
   // Keep the shot active while its authored ERASE_DELAY expands the crater.
   for(let i=0;i<60&&g.pending.length;i++){g.stage='flight';g.flightStarted=g.t;g.step(1/60);}
   assert(g.soil.volume()<before,`${id}:${n.name} missed at phase ${phase}`);
  }
 }
 assert(checked>=118,`checked ${checked} source erase definitions`);
});

test('Glitter Gun outside-collision fragments make their authored radius-1 cut at all x phases',()=>{
 for(const phase of [0,.125,.5,1,1.5,1.875])for(const startY of [398.8,399.1,399.4,399.9]){
  const g=makeGame();g.soil.fromHeights(Array(640).fill(400));g.wind=0;g.stage='flight';g.flightStarted=0;
  const before=g.soil.volume();
  g.projectile(640+phase,startY,0,100,BY_ID.glitter_gun,'a',{sourceBullet:'GlitterGunGlitterBullet1',fragment:true});
  for(let i=0;i<60&&g.turn===0;i++)g.step(1/60);
  assert(before-g.soil.volume()>1.56,`phase=${phase}, startY=${startY}`);
  const explosion=g.effectAudit.find(e=>e.name==='GlitterGunExplosion');
  assert(explosion&&explosion.y<400&&explosion.y>399.999,'authored COLLIDE_OUTSIDE stays immediately outside the surface');
 }
});

test('non-erasing SHRAPNEL emitters remain visual/damage only',()=>{
 const g=makeGame();g.soil.fromHeights(Array(640).fill(400));
 const before=g.soil.volume();let checked=0;
 for(const [id,w]of definitions)for(const n of w.chain)if(n.type==='SHRAPNEL'){
  Pocket.command(g,{weapon:id,type:n.type,name:n.name,x:640,y:400,owner:'a',angle:90,power:0});checked++;
 }
 assert.equal(g.soil.volume(),before);assert.equal(g.pending.length,0);assert(checked>=325);
});
