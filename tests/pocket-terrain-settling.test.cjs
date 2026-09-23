'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {ColumnTerrain}=require('../games/arcade_deluxe/core/terrain.cjs');

test('deep cave roof release clocks run concurrently, without teleporting or losing material',()=>{
 const soil=new ColumnTerrain(2,1800,2);
 soil.columns[0]=[{top:350,bottom:650,origin:350,v:0},{top:730,bottom:1800,origin:730,v:0}];
 const volume=soil.volume();
 soil.activateUnsupported();
 assert.equal(soil.columns[0].filter(s=>s.layered).length,100);
 const firstTop=soil.surface(0),firstDelay=soil.columns[0][0].delay;
 soil.step(1/60);
 assert.equal(soil.surface(0),firstTop,'upper layers remain supported on the first frame');
 assert(soil.columns[0][0].delay<firstDelay,'supported layers still advance their release clocks');
 assert.equal(soil.active.size,1,'collapse is animated, not instant');
 for(let n=0;n<600&&soil.active.size;n++){
  const before=soil.columns[0].map(s=>s.top);
  soil.step(1/60);
  if(soil.active.size)for(let i=0;i<before.length;i++)assert(soil.columns[0][i].top-before[i]<=220/60+1e-6,'speed cap applies to every layer');
 }
 assert.equal(soil.active.size,0,'a 300px roof settles in bounded physical time, not ~90s of serial delays');
 assert(Math.abs(soil.volume()-volume)<1e-6);
 assert(Math.abs(soil.surface(0)-430)<1e-6);
 assert.equal(soil.columns[0].length,1,'contacting slices merge once stable');
});

test('progressively cut deep cavities also finish settling',()=>{
 const soil=new ColumnTerrain(128,1800,2).fromHeights(Array(64).fill(350));
 for(let r=1;r<=40;r++){
  soil.circle(64,690,r,false,true);
  soil.step(1/60);
 }
 const remaining=soil.volume();
 for(let n=0;n<600&&soil.active.size;n++)soil.step(1/60);
 assert.equal(soil.active.size,0);
 assert(Math.abs(soil.volume()-remaining)<1e-5);
});
