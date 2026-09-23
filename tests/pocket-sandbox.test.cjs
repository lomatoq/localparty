const test=require('node:test'),assert=require('node:assert/strict');
const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs');
const {WEAPONS}=require('../games/arcade_deluxe/core/weapons.cjs');
const {workerSettings}=require('../lib/host-controls');
test('all-weapons mode survives host validation and never consumes ammunition',()=>{
 const settings=workerSettings({id:'pocket_siege'},{sandbox:'true'}),g=new Tanks();
 g.add({id:'a',name:'A',connected:true});g.add({id:'b',name:'B',connected:true});assert(g.start(settings));
 const p=g.active();assert.equal(Object.keys(p.inventory).length,WEAPONS.length);
 for(let i=0;i<110;i++){g.stage='aim';assert(g.fire());g.projectiles=[];}
 assert.equal(p.inventory.pebble,99);
});
test('standard mode still spends ammo and rejects invalid host options',()=>{
 const g=new Tanks();g.add({id:'a',name:'A',connected:true});g.add({id:'b',name:'B',connected:true});g.start();const p=g.active(),before=p.inventory.pebble;g.fire();assert.equal(p.inventory.pebble,before-1);
 assert.throws(()=>workerSettings({id:'pocket_siege'},{sandbox:'invalid'}));
});
test('players can assemble an explicit pre-match arsenal',()=>{
 const settings=workerSettings({id:'pocket_siege'},{draftMode:'true'}),g=new Tanks();
 g.add({id:'a',name:'A',connected:true});g.add({id:'b',name:'B',connected:true});assert(g.start(settings));
 assert.equal(g.stage,'loadout');assert.equal(g.activeId,null);assert(g.input('a','loadout',{id:'big_shot'}));assert(g.input('a','loadout',{id:'3_shot'}));assert(g.input('b','loadout',{id:'5_shot'}));
 assert(g.input('a','loadout-ready'));assert.equal(g.stage,'loadout');assert(g.input('b','loadout-ready'));assert.equal(g.stage,'aim');
 assert.deepEqual(Object.keys(g.players[0].inventory).sort(),['3_shot','big_shot','pebble']);
 assert.deepEqual(Object.keys(g.players[1].inventory).sort(),['5_shot','pebble']);
 assert.throws(()=>workerSettings({id:'pocket_siege'},{draftMode:'maybe'}));
});
test('driving accelerates over terrain instead of teleporting',()=>{
 const g=new Tanks();g.add({id:'a',name:'A',connected:true});g.add({id:'b',name:'B',connected:true});g.start({sandbox:true});
 const p=g.active(),start=p.x,fuel=p.fuel;assert(g.input(p.id,'move',{direction:1}));assert.equal(p.x,start);
 for(let i=0;i<9;i++)g.step(1/60);assert(p.x>start);assert(p.vx>0&&p.vx<=72);assert(p.fuel<fuel);
 const speed=p.vx;for(let i=0;i<30;i++)g.step(1/60);assert(Math.abs(p.vx)<speed);
});
