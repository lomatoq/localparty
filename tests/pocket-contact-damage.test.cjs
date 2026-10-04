'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {makeGame}=require('../scripts/audit-pocket-runtime.cjs');
const {auditDamage}=require('../scripts/audit-pocket-damage.cjs');
const {BY_ID}=require('../games/arcade_deluxe/core/weapons.cjs');
const Pocket=require('../games/arcade_deluxe/core/pocket-runtime.cjs');
test('all321 weapon source contracts and1393 real bullet routes retain scored damage or explicit source behavior',()=>{
 const r=auditDamage();assert.equal(r.weapons,321);assert.equal(r.realProjectileRoutes,1393);assert.equal(r.formerlySuppressedContactNodes,91);assert.deepEqual(r.failures,[]);
 assert(r.nodes.some(n=>n.type==='ZAPPER'&&n.center.hits));assert(r.nodes.some(n=>n.type==='LIGHTNING'&&n.center.hits));
 for(const t of ['FIRE','SUPERBALL'])assert(r.nodes.some(n=>n.type===t&&n.center.hits),t);
 assert.equal(r.nodes.filter(n=>n.type==='FOG').length,9,'short source fog entities may each total less than one score point');
 for(const id of ['sonic_blast','sniper_rifle','laser'])assert(r.rows.find(w=>w.id===id).projectiles.some(p=>p.contact&&p.score>0),id);
});
test('ten real short-lived source fog zones combine one point without inventing a minimum or leaking turn/owner/target fractions',()=>{
 const g=makeGame(),p=g.players[1];p.x=700;p.y=400;
 const add=(owner='a',x=700)=>{Pocket.command(g,{weapon:'chalk_dust',owner,type:'FOG',name:'ChalkDustParticleFog',x,y:392,angle:0,power:0});const z=g.zones.pop();for(let i=0;i<12;i++)Pocket.materialStep(g,z,1/120);};
 add();assert.equal(g.players[0].score,0,'one0.1 zone stays fractional');for(let i=0;i<9;i++)add();assert.equal(g.players[0].score,1,'ten0.1 entities count together');
 for(let i=0;i<9;i++)add();g.turn++;add();assert.equal(g.players[0].score,1,'turn resets0.9 remainder');
 for(let i=0;i<8;i++)add();g.roundSerial++;add();assert.equal(g.players[0].score,1,'round resets0.9 remainder');
 g.players.push({id:'c',x:900,y:400,participant:true,score:0});for(let i=0;i<9;i++)add('c');assert.equal(g.players[0].score,1);assert.equal(g.players[2].score,0,'attackers independent');
 add('a',900);assert.equal(g.players[0].score,1,'targets independent');
 p.connected=false;add('a');assert(g.authoredMaterialFractions.owners.get('a').has('b'),'disconnected participant keeps established target rule');
 g.players=g.players.filter(p=>p.id!=='b');add('a',900);assert(!g.authoredMaterialFractions.owners.get('a').has('b'),'removed target ledger pruned');
 assert(g.authoredMaterialFractions.owners.size<=g.players.length);for(const targets of g.authoredMaterialFractions.owners.values())assert(targets.size<=g.players.length);
});
test('weak Sonic Blast swept tank contacts score, while a parallel miss does not',()=>{
 for(const miss of [false,true]){const g=makeGame(),p=g.players[1];p.x=700;p.y=400;g.wind=0;
  g.projectile(670,miss?350:392,600,0,BY_ID.sonic_blast,'a',{sourceBullet:'SonicBlastMiniBullet',sourceType:'BULLET',fragment:true});
  const b=g.projectiles.pop();b.age=.2;g.advanceProjectile(b,1/30);
  assert.equal(b.hitTank===p.id,!miss);assert.equal(g.players[0].score,miss?0:1);assert.equal(g.events.some(e=>e.kind==='hit'),!miss);
 }
});
test('contact identity stays at this impact position and never attaches to new bullets',()=>{
 const g=makeGame(),p=g.players[1];p.x=700;p.y=400;
 const e={weapon:'sonic_blast',owner:'a',type:'SHRAPNEL',name:'SonicBlastMiniHitShrapnel',x:683,y:392,angle:0,power:0,directContact:{target:'b',x:683,y:392}};
 Pocket.command(g,{...e,x:682});assert.equal(g.players[0].score,0,'offset effect keeps falloff');
 Pocket.command(g,{...e,directContact:{target:'a',x:683,y:392}});assert.equal(g.players[0].score,0,'other target keeps falloff');
 p.x=900;Pocket.command(g,e);assert.equal(g.players[0].score,0,'moving away before a delayed command is a miss');
 Pocket.command(g,{...e,type:'BULLET',name:'SonicBlastMiniBullet'});assert.equal(g.projectiles.length,1);assert.equal(g.projectiles[0].directContact,undefined);
 p.x=700;Pocket.command(g,e);assert.equal(g.players[0].score,1);
});
test('radial falloff, friendly/self score signs, zero-damage stages and throw remain established rules',()=>{
 const g=makeGame(),p=g.players[1];p.x=700;p.y=400;
 const e={weapon:'sniper_rifle',owner:'a',type:'SHRAPNEL',name:'SniperRifleShrapnel',x:683,y:392,angle:0,power:0};
 Pocket.command(g,e);const radial=g.players[0].score,vx=p.vx,vy=p.vy;assert.equal(radial,6);
 p.vx=p.vy=0;g.players[0].score=0;Pocket.command(g,{...e,directContact:{target:'b',x:683,y:392}});assert.equal(g.players[0].score,100);assert.equal(p.vx,vx);assert.equal(p.vy,vy);
 g.teams=true;g.players[0].team=p.team;g.players[0].score=0;Pocket.command(g,{...e,directContact:{target:'b',x:683,y:392}});assert.equal(g.players[0].score,-100);
 g.players[0].score=0;Pocket.command(g,{...e,weapon:'wacky_tank',name:'WackyTankShrapnel',directContact:{target:'b',x:683,y:392}});assert.equal(g.players[0].score,0);
 assert.equal(g.snapshot().players[1].hp,undefined,'no invented HP rule');
});
