'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {BowMatch,TARGETS}=require('../games/bow_club/core/match.cjs');
function shoot(g,id,u,v,seq,now){const aim={u,v,quality:1,ageMs:0,revision:g.revision};assert.equal(g.draw(id,aim,now),true);return g.shoot(id,{...aim,seq},now+600);}
test('Bow Club hit rings stay circular for a full TV viewport',()=>{
 for(const [dx,dy,expected] of [[.17,0,100],[0,.17,100],[1.02,0,0]]){
  const g=new BowMatch();g.aspect=1280/608;g.add({id:'a',name:'Alex'});g.start({},0);const t=TARGETS[1];
  assert.equal(shoot(g,'a',t.u+t.r*dx/(720*g.aspect),t.v+t.r*dy/720,1,1000).points,expected);
 }
});
test('All 90 arrows persist through a maximum roster match and reset with the next match',()=>{
 const g=new BowMatch();for(let i=0;i<6;i++)g.add({id:'p'+i,name:'Игрок '+i});g.start({arrows:15},0);for(let round=0;round<15;round++)for(let i=0;i<6;i++)assert.equal(shoot(g,'p'+i,.5,.42,round+1,1000+round*1000).ok,true);
 const state=g.snapshot(20000);assert.equal(state.phase,'results');assert.equal(state.hits.length,90);assert.equal(new Set(state.hits.map(h=>h.id)).size,90);assert.ok(state.hits.every(h=>h.u===.5&&h.v===.42));assert.equal(g.reset(),true);assert.equal(g.snapshot(21000).hits.length,0);
});
test('target motion grows gradually and scoring uses the displayed position',()=>{
 const g=new BowMatch();g.add({id:'a',name:'Alex'});g.start({},0);
 assert.deepEqual(g.targetsAt(1000),TARGETS,'first arrow stays still');
 g.players[0].shots=4;
 const before=g.targetsAt(1000),after=g.targetsAt(1016);
 assert(Math.hypot(after[1].u-before[1].u,after[1].v-before[1].v)<.001,'no position snap at difficulty changes');
 for(let t=1032;t<=3000;t+=16)g.targetsAt(t);
 const aim={quality:1,ageMs:0,revision:g.revision};assert(g.draw('a',aim,3000));
 const target=g.targetsAt(3600)[1],shot=g.shoot('a',{...aim,u:target.u,v:target.v,seq:1},3600);
 assert.equal(shot.points,100);assert(g.motionDifficulty>.4);
 assert.deepEqual(g.snapshot(3600).targets,g.targetsAt(3600),'same timestamp has identical target positions');
});
