'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {expression}=require('../games/arcade_deluxe/core/pocket-expression.cjs');
const Pocket=require('../games/arcade_deluxe/core/pocket-runtime.cjs');
const {BY_ID}=require('../games/arcade_deluxe/core/weapons.cjs');
const {makeGame,simulate,audit}=require('../scripts/audit-pocket-runtime.cjs');
test('weapon expression registers, RESET and conditions preserve their semantics',()=>{
 assert.equal(expression('RESET + 10',90,270),280);assert.equal(expression('SET 270 - 3 RND 6',90,90,{},()=>.5),270);
 assert.equal(expression('CTANK_DIRECT',45,45,{CTANK_DIRECT:180}),180);
 assert.equal(expression('INFIX CURRENT + 1',5),6);assert.equal(expression('INFIX AX <= 15',0,0,{AX:16}),0);
 assert.equal(expression('INFIX FLOOR ( ( ( ANGLE + 90 ) % 360 ) / 180 ) * 2 - 1',0,0,{ANGLE:270}),-1);
});
test('Burn Barrel really rolls, repeatedly burns and detonates',()=>{
 const r=simulate(BY_ID.burn_barrel,'drop');assert.equal(r.commands.CRUISER,1);assert(r.commands.FIRE>100);assert.equal(r.commands.EXPLOSION,1);assert(r.triggers.includes('BurnBarrelBulletFireTrigger'));assert.deepEqual(r.errors,[]);
});
test('Mud Pie and forests build real cumulative terrain',()=>{
 const mud=simulate(BY_ID.mud_pie,'drop');assert.equal(mud.commands.DIRTBALL,19);assert(mud.terrainDelta>10000);
 const forest=simulate(BY_ID.magic_forest,'drop');assert.equal(forest.commands.MAGICWALL,15);assert(forest.terrainDelta>0);
 const black=simulate(BY_ID.black_forest,'drop');assert(black.commands.DIRTBALL>15);assert(black.seconds<20);assert.deepEqual(black.errors,[]);
});
test('child timed detonation executes its own timer trigger, not parent impact',()=>{
 const g=makeGame();g.stage='flight';g.flightStarted=0;
 g.projectile(640,100,0,0,BY_ID.fission_bomb,'a',{sourceBullet:'FissionBombSplitBullet1',fragment:true});
 const b=g.projectiles.pop();b.age=.21;assert.equal(g.advanceProjectile(b,1/60),false);
 assert(g.effectAudit.some(e=>e.type==='trigger'&&e.name==='FissionBombSplitTrigger2'));assert(!g.effectAudit.some(e=>e.commandType==='EXPLOSION'));
});
test('HIT_NOTHING skips dirt but still hits tanks unless bypass is set',()=>{
 const g=makeGame(),p=g.players[1];g.stage='flight';g.flightStarted=0;
 g.projectile(p.x-25,p.y-8,600,0,BY_ID.sonic_blast,'a',{sourceBullet:'SonicBlastMiniBullet',fragment:true});
 const b=g.projectiles.pop();b.age=.2;assert.equal(g.advanceProjectile(b,1/30),false);
 assert(g.effectAudit.some(e=>e.name==='SonicBlastMiniHitShrapnel'));
});
test('drone terrain-only weapons fall before constructing terrain',()=>{
 const g=makeGame();g.stage='flight';g.flightStarted=0;const volume=g.soil.volume();
 g.launchWeaponAt(640,100,0,35,BY_ID.dome_protect,'a',{drop:true});assert.equal(g.projectiles[0].delivery,true);assert.equal(g.pending.length,0);assert.equal(g.soil.volume(),volume);
 for(let i=0;i<200&&g.turn===0;i++)g.step(1/30);assert(g.effectAudit.some(e=>e.commandType==='DIRTBALL'));
});
test('self-building cannon weapons begin at the tank, not at its muzzle',()=>{
 const g=makeGame(),p=g.active();p.weapon='dome_protect';g.fire();const fill=g.pending.find(e=>e.kind==='reference-build');assert.equal(fill.x,p.x);assert.equal(fill.y,p.y);
});
test('unknown commands are reported, while two source dud placeholders are explicit no-ops',()=>{
 const g=makeGame();Pocket.command(g,{weapon:'pebble',type:'EXPLOSION',name:'DoesNotExist'});assert.equal(g.effectAudit.at(-1).type,'missing-command');
 Pocket.command(g,{weapon:'bubble_gun',type:'EXPLOSION',name:'BubbleGunDudExplosionBullet'});assert.equal(g.effectAudit.at(-1).type,'source-noop');
});
test('all 321 weapons run cannon, downward and oblique scenarios without lost commands or timeout',()=>{
 const report=audit();assert.equal(report.weapons,321);assert.equal(report.shots,963);assert.deepEqual(report.failures.map(r=>({id:r.id,scenario:r.scenario,errors:r.errors.slice(0,2)})),[]);
});
