const test=require('node:test'),assert=require('node:assert/strict');
const {weapons,randomWeapon,projectiles,hitsTank}=require('../games/tankarena/weapons');
const {collect}=require('../games/tankarena/powerups');
const tank={id:'a',x:100,y:100,angle:0,color:'#fff'};
test('fast sniper shots collide along their travelled path',()=>{assert(hitsTank({x:160,y:100},40,100,tank));assert(!hitsTank({x:160,y:140},40,140,tank));});
test('all seven weapons can spawn and produce finite shots',()=>{
 const ids=Object.keys(weapons);assert.equal(ids.length,7);
 ids.forEach((weapon,i)=>{assert.equal(randomWeapon(()=>(i+.5)/ids.length),weapon);const shots=projectiles({...tank,weapon});assert.equal(shots.length,weapons[weapon].count);for(const b of shots)for(const field of ['x','y','vx','vy','damage','ttl'])assert(Number.isFinite(b[field])&& (field!=='ttl'||b[field]>0));});
});
test('new weapons have distinct patterns and ranges',()=>{
 const twin=projectiles({...tank,weapon:'twin'});assert.notEqual(twin[0].y,twin[1].y);assert.equal(twin[0].vy,twin[1].vy);
 assert(weapons.flame.speed*weapons.flame.ttl<150);assert(weapons.sniper.speed*weapons.sniper.ttl>1200);assert(weapons.sniper.cd>weapons.cannon.cd);
});
test('heal, shield and boost remain available independently of weapon',()=>{
 const p={hp:75,shield:0,boost:0,weapon:'sniper'};for(const kind of ['heal','shield','boost'])collect(p,{kind});assert.equal(p.hp,100);assert.equal(p.shield,5);assert.equal(p.boost,6);assert.equal(p.weapon,'sniper');
});
