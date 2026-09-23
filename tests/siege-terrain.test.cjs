const test=require('node:test'),assert=require('node:assert/strict');
const {ColumnTerrain}=require('../games/arcade_deluxe/core/terrain.cjs');
const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs');
const {WEAPONS}=require('../games/arcade_deluxe/core/weapons.cjs');
const {impactExplosions,impactPlan,bulletNames,definitions}=require('../games/arcade_deluxe/core/pocket-terrain.cjs');
const {parseDefinitions}=require('../scripts/analyze-pocket-reference.cjs');
test('optional trigger fields stay attached to their command',()=>{
 const [trigger]=parseDefinitions(`TRIGGER: test
{
TIMEDELAY: 0
COMMAND: first
TYPE: EXPLOSION
TIMEDELAY: 25
COMMAND: second
TYPE: EXPLOSION
XOFFSET: RESET + 10
}`);
 assert.equal(trigger.commands[0].XOFFSET,undefined);
 assert.equal(trigger.commands[1].XOFFSET,'RESET + 10');
 assert.equal(trigger.commands[1].TIMEDELAY,25);
});
test('split projectiles use their own erasing explosion, not the empty parent trigger',()=>{
 const g=game(),w=WEAPONS.find(w=>w.id==='fission_bomb');
 const parent=bulletNames(w.id)[0];assert.equal(impactExplosions(w.id,parent).filter(e=>e.erase).length,0);
 g.stage='flight';g.flightStarted=g.t;
 g.projectile(640,g.ground(640),0,120,w,'a');const b=g.projectiles.pop();g.impact(b);
 assert(g.projectiles.length>0);assert(g.projectiles.every(p=>p.fragment&&p.sourceBullet!==parent));
 const child=g.projectiles[0];child.x=640;child.y=g.ground(640);g.projectiles=[];g.impact(child);
 assert(g.pending.some(e=>e.kind==='reference-terrain'&&e.erase&&e.source==='FissionBombExplosion'));
 const volume=g.soil.volume();for(let i=0;i<60;i++)g.step(1/60);assert(g.soil.volume()<volume);assert.equal(g.soil.active.size,0);
});
test('individual original explosion flags are not combined across a weapon',()=>{
 const acid=impactExplosions('acid_bombs');assert(acid.some(e=>e.erase&&!e.dirtFall&&e.radius===5));
 const lava=impactExplosions('lava');assert(lava.some(e=>!e.erase&&!e.dirtFall));assert(lava.some(e=>e.erase&&!e.dirtFall&&e.eraseDirection==='EXPLOSION_IN'));
 for(const id of ['acid_bombs','lava']){const g=game();g.stage='flight';g.flightStarted=g.t;const before=g.soil.volume();g.explode(640,g.ground(640)+100,WEAPONS.find(w=>w.id===id),'a');for(let i=0;i<90;i++)g.step(1/60);assert(g.soil.volume()<before,id);assert.equal(g.soil.active.size,0,`${id} must cut without settling`);}
});
test('impact visuals belong to the selected projectile, not the entire weapon graph',()=>{
 const root=impactPlan('fission_bomb',bulletNames('fission_bomb')[0]);
 const child=impactPlan('fission_bomb','FissionBombSplitBullet1');
 assert.equal(root.visuals.length,0);assert(child.visuals.some(v=>v[0]==='E'));
 const g=game();g.explode(640,g.ground(640),WEAPONS.find(w=>w.id==='fission_bomb'),'a',1,true,'FissionBombSplitBullet1');
 const event=g.events.findLast(e=>e.kind==='blast');
 assert.deepEqual(event.fxStages,child.visuals);assert.deepEqual(event.materialTriggers,child.triggers);
});
test('every authored projectile resolves its own destruction trigger',()=>{
 let checked=0;
 for(const [id,weapon] of definitions)for(const bullet of weapon.chain.filter(node=>node.type==='BULLET')){
  const trigger=bullet.values.EXPLOSION_TRIGGER;if(!trigger||/^(NONE|NULL)$/i.test(trigger))continue;
  if(!weapon.chain.some(n=>n.type==='TRIGGER'&&n.name===trigger)){assert.equal(`${id}:${trigger}`,'hedge:HedgePlantTrigger4');assert.equal(bullet.values.COLLISION_METHOD,'HIT_NOTHING');continue;}
  const plan=impactPlan(id,bullet.name,()=>.5);checked++;
  assert(plan.triggers.includes(trigger),`${id}:${bullet.name} lost ${trigger}`);
  for(const group of [plan.explosions,plan.terrain,plan.bullets])for(const stage of group)for(const key of ['delay','x','y'])assert(Number.isFinite(stage[key]),`${id}:${bullet.name} has invalid ${key}`);
 }
 assert(checked>1300,'the full imported projectile graph is covered');
});
test('compound dirt weapons retain authored child impacts and progressive growth',()=>{
 const mudRoot=bulletNames('mud_pie')[0],mud=impactPlan('mud_pie',mudRoot,()=>.5);
 assert.equal(mud.bullets.length,19);assert(mud.bullets.every(child=>child.name==='MudPieSpreadBullet'));
 const mudChild=impactPlan('mud_pie',mud.bullets[0].name,()=>.5);assert.equal(mudChild.terrain.length,1);assert.equal(mudChild.terrain[0].type,'DIRTBALL');assert.equal(mudChild.terrain[0].radius,70);
 const rainbow=impactPlan('rainbow_dirt',bulletNames('rainbow_dirt')[0],()=>.5);assert.equal(rainbow.terrain.length,29);assert(rainbow.terrain.every(stage=>stage.type==='DIRTBALL'&&stage.radius===16));
 const forest=impactPlan('magic_forest',bulletNames('magic_forest')[0],()=>.5);assert.equal(forest.bullets.length,15);const tree=impactPlan('magic_forest',forest.bullets[0].name,()=>.5);assert.deepEqual(tree.terrain.map(stage=>[stage.type,stage.width,stage.height,stage.delay]),[['MAGICWALL',5,26,1.5]]);
 const g=game(),before=g.soil.volume(),w=WEAPONS.find(weapon=>weapon.id==='mud_pie');g.stage='flight';g.flightStarted=g.t;g.projectile(640,g.ground(640)-2,0,0,w,'a');g.impact(g.projectiles.pop());
 assert(g.pending.some(event=>event.kind==='pocket-command'&&event.name==='MudPieSpreadBullet'));
 for(let i=0;i<300;i++)g.step(1/60);assert(g.soil.volume()>before+10000,'child dirtballs accumulate real terrain');assert.equal(g.soil.active.size,0,'created dirt never enters cave-in physics');
});
test('inward erosion removes an outer ring while preserving the centre until its turn',()=>{
 const t=new ColumnTerrain(200,1800,2).fromHeights(Array(100).fill(400));t.circle(100,500,30,false,false,25);
 assert(t.solid(100,500));assert(!t.solid(100,473));assert.equal(t.active.size,0);
 t.circle(100,500,30,false,false,0);assert(!t.solid(100,500));
});
test('all authored surface-impact chains stay out of dirt-fall physics',()=>{
 for(const w of WEAPONS){
  const g=game();g.stage='flight';g.flightStarted=g.t;
  g.explode(640,g.ground(640),w,'a');
  for(let i=0;i<360;i++){g.step(1/60);assert.equal(g.soil.active.size,0,`${w.id}: surface child stage activated settling at ${g.t}`);}
 }
});
function game(){const g=new Tanks();g.add({id:'a',name:'A',connected:true});g.add({id:'b',name:'B',connected:true});g.start({sandbox:true});return g;}
test('underground cavities collapse bottom layer first and conserve volume',()=>{
 const t=new ColumnTerrain(100,1800,2).fromHeights(Array(50).fill(400));t.circle(50,500,50);const volume=t.volume(),initial=t.surface(50),column=t.columns[t.index(50)],lowest=column.at(-2),lowestTop=lowest.top;
 t.step(1/30);assert.equal(t.surface(50),initial,'upper surface waits while the lowest slice starts falling');assert(lowest.top>lowestTop&&lowest.top-lowestTop<1,'lowest slice moves by a small physical step');
 for(let i=0;i<15;i++)t.step(1/30);assert(t.active.size>0);assert(t.columns[t.index(50)].some(r=>r.layered),'detached slab remains split into thin layers');
 for(let i=0;i<600;i++)t.step(1/60);assert.equal(t.active.size,0);assert(Math.abs(t.volume()-volume)<.001);
});
test('surface crater does not make the remaining ground settle',()=>{
 const t=new ColumnTerrain(100,1800,2).fromHeights(Array(50).fill(400));t.circle(50,400,50);const after=t.snapshot();for(let i=0;i<120;i++)t.step(1/60);assert.deepEqual(t.snapshot(),after);assert.equal(t.active.size,0);
});
test('surface cuts preserve material strata instead of repainting them from the crater bottom',()=>{
 const t=new ColumnTerrain(100,1800,2).fromHeights(Array(50).fill(400));const strata=t.strataSnapshot();
 t.circle(50,400,22,false,false);assert(t.surface(50)>420);assert.deepEqual(t.strataSnapshot(),strata);
 const tunnel=new ColumnTerrain(100,1800,2).fromHeights(Array(50).fill(400));tunnel.circle(50,500,22);
 const layer=tunnel.columns[tunnel.index(50)].at(-2),top=layer.top,origin=layer.origin;tunnel.step(1/60);
 assert(layer.top>top);assert(Math.abs((layer.top-top)-(layer.origin-origin))<1e-8,'texture moves only with actual falling material');
});
test('shallow and sloping surface cuts never release crater shoulders',()=>{
 for(const slope of [-.8,0,.8])for(const depth of [0,12,28]){
  const t=new ColumnTerrain(300,1800,2).fromHeights(Array.from({length:150},(_,i)=>400+(i-75)*2*slope));
  t.circle(150,t.surface(150)+depth,50);const cut=t.snapshot();
  for(let i=0;i<180;i++)t.step(1/60);
  assert.equal(t.active.size,0);assert.deepEqual(t.snapshot(),cut,`slope ${slope}, depth ${depth}`);
 }
});
test('non-erasing water and fire weapons preserve the terrain mask',()=>{
 for(const id of ['water_balloons','napalm','smoke_bomb']){const g=game(),w=WEAPONS.find(w=>w.id===id),before=g.soil.volume();g.explode(640,g.ground(640),w,'a');assert(!g.pending.some(e=>e.kind==='terrain-circle'),id);assert.equal(g.soil.volume(),before);}
});
test('sustained burning deals damage without repeated explosions or impulses',()=>{
 const g=game(),w=WEAPONS.find(w=>w.id==='napalm'),p=g.players[1];g.stage='flight';g.flightStarted=g.t;
 g.zones.push({id:990,x:p.x,y:p.y,r:40,weapon:w.id,owner:'a',ends:g.t+2,next:g.t,kind:'fire'});
 const impulse=p.impulseUntil;for(let i=0;i<50;i++)g.step(1/30);assert(g.events.some(e=>e.kind==='hit'));assert(!g.events.some(e=>e.kind==='blast'));assert(!g.pending.some(e=>e.kind==='terrain-circle'));assert.equal(p.impulseUntil,impulse);
});
test('digger can carve a supported tunnel without collapse',()=>{
 const t=new ColumnTerrain(100,1800,2).fromHeights(Array(50).fill(400));t.circle(50,500,22,false,false);const after=t.snapshot();for(let i=0;i<120;i++)t.step(1/60);assert.deepEqual(t.snapshot(),after);assert.equal(t.active.size,0);assert(!t.solid(50,500));
});
test('deep craters and projectiles continue below old floor',()=>{
 const g=game();assert.equal(g.snapshot().terrainBottom,1800);assert(g.solid(640,1000));g.deform(640,1000,60);assert(!g.solid(640,1000));
 const w=WEAPONS.find(w=>w.id==='pebble');g.projectile(640,900,0,0,w,'a');const b=g.projectiles[0];g.impact(b);assert(g.events.some(e=>e.kind==='blast'&&e.y===900));
});
test('flight timeout does not teleport unsupported terrain to rest',()=>{
 const g=game();g.stage='flight';g.flightStarted=-14;g.soil.circle(640,650,100);g.syncTerrain();const before=g.ground(640);g.step(1/30);assert(g.soil.active.size>0);assert(Math.abs(g.ground(640)-before)<1);
});
test('every weapon produces finite events and settles its turn',()=>{
 for(const w of WEAPONS){const g=game(),p=g.active();p.weapon=w.id;assert(g.fire(),w.id);for(let i=0;i<1500&&g.turn===0;i++)g.step(1/30);assert(g.turn>0,`${w.id}: stuck turn`);for(const e of g.events)for(const k of ['x','y','r'])if(k in e)assert(Number.isFinite(e[k]),`${w.id}: ${k}`);}
});
test('coating events identify glue and rubber',()=>{const g=game();for(const kind of ['glue','rubber']){g.coat(640,50,kind);assert.equal(g.events.at(-1).coating,kind);}});
