'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Arcade}=require('../games/arcade/simulation');
const {Hockey}=require('../games/tabletop/arcade');
const {BowMatch}=require('../games/bow_club/core/match.cjs');
const {Match}=require('../games/sports_siege/match');
test('Flappy gives three seconds on the arena without consuming time, falling or accepting early taps',()=>{
 const g=new Arcade('flappy');g.join('a','A');g.join('b','B');g.start();const y=g.players[0].y,timer=g.timer;
 for(let i=0;i<59;i++){g.input('a',{action:'tap'});g.tick(.05);}
 assert(g.countdown>0);assert.equal(g.players[0].y,y);assert.equal(g.players[0].vy,0);assert.equal(g.timer,timer);assert.equal(g.time,0);assert.equal(g.pipes.length,0);
 while(g.countdown>0)g.tick(.05);g.input('a',{action:'tap'});assert.equal(g.players[0].vy,-360);g.tick(.05);assert(g.players[0].y<y);assert(g.timer<timer);
 g.finish();g.start();assert.equal(g.countdown,3);
});
test('Hockey teammates can cross lanes, but neither input path crosses the opponent half',()=>{
 for(const n of [4,6,8]){const ps=Array.from({length:n},(_,i)=>({id:String(i),connected:true})),g=new Hockey(ps);
  g.action('0','move',{x:10000,y:10000});assert.deepEqual(ps[0].target,{x:460,y:560});
  for(let i=0;i<40;i++){g.action('0','steer',{x:0,y:1});g.step(.05);}assert(ps[0].y>500);
  g.action('1','move',{x:-10000,y:-10000});assert.deepEqual(ps[1].target,{x:540,y:40});
 }
});
test('Bow hits retain an authoritative local offset for moving target attachment',()=>{
 const g=new BowMatch();g.add({id:'a',name:'A'});g.start({},0);const now=1600,t=g.targetsAt(now)[1],aim={quality:1,ageMs:0,revision:g.revision};g.draw('a',aim,1000);
 const hit=g.shoot('a',{...aim,u:t.u+.002,v:t.v+.001,seq:1},now);assert(hit.points>0);assert.equal(hit.target,t.id);assert(Math.abs(hit.targetOffset.u-.002)<1e-8);assert(Math.abs(hit.targetOffset.v-.001)<1e-8);assert.deepEqual(g.snapshot(now+200).hits[0].targetOffset,hit.targetOffset);
});
test('Swarm damage produces a hit cue and lower HP; pulse kills report a death once',()=>{
 const g=new Match('swarm_gate');g.add({id:'a',name:'A'});g.start();g.wave=1;g.waveLeft=2;g.random=()=>.5;g.spawnBug();assert.equal(g.enemies[0].maxHp,40);
 const p=g.players.get('a');p.aim={x:.5,y:.5};g.enemies=[{id:90,kind:'termite',x:0,z:-14,hp:40,maxHp:40,r:.4,targetX:0}];g.siegeFire(p);assert.equal(g.enemies[0].hp,16);assert.equal(g.enemies[0].hitAt,g.t);assert(g.enemies[0].z< -14);
 p.abilityAt=0;g.input('a','ability');assert.equal(p.kills,1);assert.equal(g.enemies.length,0);assert.equal(g.events.filter(e=>e.kind==='shot'&&e.dead).length,1);g.input('a','ability');assert.equal(p.kills,1);
});
test('Bow renderer interpolates target motion and keeps the arrow in target coordinates',async()=>{
 const THREE=await import('three'),{createRangeArrow}=await import('../games/bow_club/public/src/range-arrow.mjs'),fs=require('node:fs'),vm=require('node:vm');
 const source=fs.readFileSync(require.resolve('../games/bow_club/public/src/range-scene.mjs'),'utf8');
 const RangeScene=vm.runInNewContext(source.replace(/^import[^\n]+\n/gm,'').replace('export class','class')+'\nRangeScene',{THREE,createRangeArrow,performance});
 const r=Object.create(RangeScene.prototype);Object.assign(r,{targets:new THREE.Group(),arrows:new THREE.Group(),arrowIds:new Set(),materials:new Map(),camera:{updateProjectionMatrix(){}},renderer:{setSize(){},render(){}}});
 const target={id:'t',u:.5,v:.5,r:50},hit={id:'h',target:'t',points:100,u:.51,v:.5,targetOffset:{u:.01,v:0}};
 r.frame([target],[hit],1,1280,720);const group=r.targetGroups.get('t'),arrow=group.children.find(c=>c.userData.hit);assert(arrow,'embedded arrow belongs to target');assert.equal(arrow.children[0].children.filter(part=>part.name.startsWith('fletching-')).length,3,'real arrow builder supplies all three vanes');assert.equal(r.arrows.children.length,0);
 const before=arrow.children[0].position.clone();r.lastFrame=performance.now()-16;r.frame([{...target,u:.6}],[hit],1,1280,720);
 assert(group.position.x>0&&group.position.x<128,'movement blends rather than snapping');assert.deepEqual(arrow.children[0].position,before,'local geometry stays fixed while target moves');
 r.frame([{...target,u:.6}],[],2,1280,720);assert.equal(r.arrowIds.size,0,'new match clears old arrows');
});
test('Punch motion gain is five times softer before saturation and still reaches1000 after explicit arming',async()=>{
 const {setup}=require('./punch-motion-fixture.cjs');
 const denied=setup({permission:'denied'});await denied.nodes.motion.onclick();
 assert.equal(denied.context.motionEnabled,false);assert(!denied.listeners.devicemotion,'denied permission cannot install the listener');
 async function armedImpulse(peak){
  const t=setup();await t.nodes.motion.onclick();
  t.listeners.devicemotion(t.event(peak));t.listeners.devicemotion(t.event(0));
  assert.equal(t.sent.length,0,'unarmed movement does not consume an attempt');
  t.arm();assert.equal(t.context.punchArmed,true,'explicit readiness and real stillness events arm the attempt');
  t.listeners.devicemotion(t.event(peak));t.listeners.devicemotion(t.event(0));
  assert.equal(t.sent.length,1);return t.sent[0].data;
 }
 const softer=await armedImpulse(52),saturated=await armedImpulse(52*5);
 assert.equal(softer.power,.2,'former saturation yields one fifth power');
 assert.equal(saturated.power,1,'fivefold peak still reaches full strength, not a permanent20% ceiling');
 for(const [data,expected]of[[softer,280],[saturated,1000]]){
  const g=new Arcade('punchmeter');g.join('p1','A');g.join('p2','B');g.start();g.input('p1',data);
  assert.equal(g.players[0].hits[0],expected);
 }
});
