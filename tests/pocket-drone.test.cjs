const test=require('node:test'),assert=require('node:assert/strict');
const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs');
function game(sandbox=false){const g=new Tanks(22);g.add({id:'a',name:'A',connected:true});g.add({id:'b',name:'B',connected:true});g.start({sandbox});return g;}
test('drone is owned by active player and cannot be reused or inject positions',()=>{
 const g=game(),p=g.active(),other=g.players.find(q=>q!==p);assert.equal(g.input(other.id,'drone'),false);assert(g.input(p.id,'drone'));assert.equal(g.stage,'drone');assert(p.droneUsed);assert.equal(g.input(p.id,'drone'),false);assert.equal(g.input(other.id,'drone-move',{x:1,y:0}),false);assert.equal(g.input(p.id,'drone-move',{x:Infinity,y:0}),false);const x=g.drone.x;assert(g.input(p.id,'drone-move',{x:1e8,y:0}));g.step(1/30);assert(g.drone.x-x<=220/30+.001);assert.equal(g.input(p.id,'fire'),false);
});
test('drop spends one ammo and uses normal weapon launch with downward velocity',()=>{
 const g=game(),p=g.active(),count=p.inventory[p.weapon];let launch;g.launchWeaponAt=(...args)=>launch=args;assert(g.input(p.id,'drone'));const d={...g.drone};assert(g.input(p.id,'drone-drop'));assert.equal(g.stage,'flight');assert.equal(g.drone,null);assert.equal(p.inventory[p.weapon],count-1);assert.equal(p.shots,1);assert.deepEqual(launch.slice(0,4),[d.x,d.y+15,0,35]);assert.equal(launch[4].id,d.weapon);assert.equal(g.input(p.id,'drone-drop'),false);g.stage='aim';assert.equal(g.input(p.id,'drone'),false);
});
test('drone timeout drops automatically and fresh match resets charge',()=>{
 const g=game(true),p=g.active();g.launchWeaponAt=()=>{};g.input(p.id,'drone');g.drone.deadline=g.t+.01;g.step(1/30);assert.equal(g.stage,'flight');assert.equal(p.inventory[p.weapon],99);g.reset();g.start();assert(g.players.every(p=>!p.droneUsed));assert.equal(g.snapshot().drone,null);
});
test('drone accelerates, coasts after release, and stale thrust expires',()=>{
 const g=game();g.wind=0;g.input(g.activeId,'drone');g.input(g.activeId,'drone-move',{x:1,y:0});g.step(1/30);const first=g.drone.vx;
 for(let i=0;i<6;i++)g.step(1/30);assert(g.drone.vx>first*3);assert(g.drone.bank>0);
 g.input(g.activeId,'drone-move',{x:0,y:0});const speed=g.drone.vx,x=g.drone.x;g.step(1/30);assert(g.drone.x>x);assert(g.drone.vx<speed);
 g.input(g.activeId,'drone-move',{x:1,y:0});for(let i=0;i<20;i++)g.step(1/30);assert.equal(g.drone.dx,0);assert.equal(g.drone.dy,0);
 assert.equal(g.drone.duration,15);assert(g.drone.charge<1&&g.drone.charge>0);assert.equal(g.snapshot().drone.remaining,g.drone.remaining);
});
test('drone gusts require corrections and bank responds in both directions',()=>{
 const g=game();g.input(g.activeId,'drone');g.drone.x=640;g.drone.y=100;g.wind=20;
 for(let i=0;i<60;i++)g.step(1/60);assert(g.drone.x>640);assert(g.drone.bank>0);
 for(let i=0;i<60;i++){g.input(g.activeId,'drone-move',{x:-1,y:0});g.step(1/60);}assert(g.drone.vx<0);assert(g.drone.bank<0);assert(Math.abs(g.drone.bank)<=.3);
});
test('drone cannot cross thin terrain or world boundaries',()=>{
 const g=game();g.input(g.activeId,'drone');g.drone.x=620;g.drone.y=100;g.wind=0;g.solid=(x,y)=>x>=640&&x<=642;
 for(let i=0;i<120;i++){g.input(g.activeId,'drone-move',{x:1,y:0});g.step(1/30);}assert(g.drone.x+17<640);assert.equal(g.drone.vx,0);
 g.solid=()=>false;g.drone.x=1259;for(let i=0;i<60;i++){g.input(g.activeId,'drone-move',{x:1,y:-1});g.step(1/30);}assert(g.drone.x<=1262);assert(g.drone.y>=22);assert.equal(g.drone.vx,0);
});
test('real authored drop launches above ground, detonates and preserves spent charge next turn',()=>{
 const g=game(true),p=g.active();g.effectAudit=[];g.input(p.id,'drone');const y=g.drone.y;g.input(p.id,'drone-drop');assert.equal(g.projectiles.length,1);const b=g.projectiles[0];assert.equal(b.y,y+15);assert(b.y<g.ground(b.x));assert(b.vy>0);assert(Math.abs(b.vx)<.001);assert.equal(b.sourceBullet,'SingleShotBullet');
 for(let i=0;i<900&&g.stage==='flight';i++)g.step(1/60);assert.equal(g.stage,'aim');assert(g.effectAudit.some(e=>e.commandType==='EXPLOSION'));assert(p.droneUsed);g.activeId=p.id;assert.equal(g.input(p.id,'drone'),false);
});
