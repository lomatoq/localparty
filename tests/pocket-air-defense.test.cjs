'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const AA=require('../games/arcade_deluxe/core/air-defense.cjs');
const Pocket=require('../games/arcade_deluxe/core/pocket-runtime.cjs');
const {BY_ID}=require('../games/arcade_deluxe/core/weapons.cjs');
const {makeGame}=require('../scripts/audit-pocket-runtime.cjs');
function fixture(){const g=makeGame();g.soil.fromHeights(Array(640).fill(500));g.syncTerrain();g.players[0].x=100;g.players[1].x=640;for(const p of g.players)g.seat(p);g.stage='flight';g.flightStarted=g.t;g.activeId='a';g.wind=0;return g;}
function bullet(g,x=640,y=300,extra={}){g.projectile(x,y,0,50,BY_ID.pebble,'a',{sourceBullet:'SingleShotBullet',draw:{method:'BULLET_TRAIL'},...extra});return g.projectiles.at(-1);}
function rocket(g,b,extra={}){const r={id:++g.eventSerial,owner:'b',weapon:'homing_missile',x:b.x,y:b.y,vx:0,vy:-230,heading:-Math.PI/2,age:0,targetId:b.id,phase:'boost',...extra};g.interceptors.push(r);return r;}
test('ten launches per match, no refill on turns or reconnection',()=>{
 const g=fixture();bullet(g);for(let i=0;i<10;i++)assert.equal(g.input('b','air-defense'),true);assert.equal(g.input('b','air-defense'),false);assert.equal(g.players[1].airDefenseCharges,0);
 g.nextTurn();assert.equal(g.players[1].airDefenseCharges,0);g.disconnect('b');g.add({id:'b',name:'back'});assert.equal(g.players[1].airDefenseCharges,0);
 g.reset();g.start({sandbox:true});assert(g.players.every(p=>p.airDefenseCharges===10));assert.equal(g.interceptors.length,0);
});
test('invalid stages, identity, pause and no target never spend a charge',()=>{
 for(const kind of ['own','aim','drone','loadout','results','paused','offline','spectator','none','outside']){
  const g=fixture();const b=bullet(g);
  if(kind==='own')g.activeId='b';else if(['aim','drone','loadout'].includes(kind))g.stage=kind;else if(kind==='results')g.phase='results';else if(kind==='paused')g.paused=true;else if(kind==='offline')g.players[1].connected=false;else if(kind==='spectator')g.players[1].participant=false;else if(kind==='none')g.projectiles=[];else if(kind==='outside')b.x=-10;
  assert.equal(g.input('b','air-defense'),false,kind);assert.equal(g.players[1].airDefenseCharges,10,kind);assert.equal(g.interceptors.length,0);
 }
});
test('radar chooses nearest visible enemy deterministically, excludes helpers/allies/underground',()=>{
 const g=fixture(),far=bullet(g,650,250),near=bullet(g,650,400),tie=bullet(g,650,400),helper=bullet(g,640,450,{draw:{method:'BULLET_NONE'}}),buried=bullet(g,640,510),own=bullet(g,640,470,{owner:'b'}),cruiser=bullet(g,640,460,{sourceType:'CRUISER'});
 assert.deepEqual(AA.targets(g,'b',640,478).map(b=>b.id),[near.id,tie.id,far.id]);
 assert(g.input('b','air-defense'));assert.equal(g.interceptors[0].targetId,near.id);
 g.teams=true;g.players[0].team=g.players[1].team;assert.equal(AA.status(g,'b').canLaunch,false);
 assert(!AA.eligible(g,helper,'b'));assert(!AA.eligible(g,buried,'b'));assert(!AA.eligible(g,own,'b'));assert(!AA.eligible(g,cruiser,'b'));
});
test('launch boosts straight upward, then has bounded physical turn and speed',()=>{
 const g=fixture(),b=bullet(g,900,180);g.input('b','air-defense');const r=g.interceptors[0],x=r.x;
 for(let i=0;i<20;i++)AA.step(g,g.projectiles,.008);
 assert.equal(r.phase,'boost');assert(Math.abs(r.x-x)<1e-8);assert(r.y<478);
 while(r.age<=AA.BOOST)AA.step(g,g.projectiles,.008);
 const angle=r.heading;AA.step(g,g.projectiles,.008);assert(r.heading>angle);assert(r.heading-angle<=AA.TURN_RATE*.008+1e-9);assert(Math.hypot(r.vx,r.vy)<=AA.SPEED);
});
test('swept contact catches fast crossing trajectories before payload and never damages terrain/tanks',()=>{
 const g=fixture(),b=bullet(g,630,250,{vx:2400,vy:0});rocket(g,b,{x:640,y:255});const volume=g.soil.volume(),scores=g.players.map(p=>p.score);
 AA.step(g,g.projectiles,1/120);assert(b.intercepted);assert.equal(g.advanceProjectile(b,1/120),false);assert.equal(g.pending.length,0);assert.equal(g.interceptors.length,0);assert.equal(g.soil.volume(),volume);assert.deepEqual(g.players.map(p=>p.score),scores);assert.equal(g.events.filter(e=>e.kind==='intercept').length,1);
});
test('pre-trigger interception suppresses timed child graph at the next simulation boundary',()=>{
 const g=fixture();g.projectile(640,250,0,30,BY_ID.fission_bomb,'a',{sourceBullet:'FissionBombSplitBullet1',draw:{method:'BULLET_TRAIL'},age:.199});const b=g.projectiles.at(-1);rocket(g,b);
 g.step(1/60);assert(g.effectAudit.some(e=>e.type==='intercept'));assert(!g.effectAudit.some(e=>e.type==='trigger'&&e.name==='FissionBombSplitTrigger2'));assert.equal(g.projectiles.length,0);assert.equal(g.pending.length,0);
});
test('a timer already due is not undone by a later defense contact',()=>{
 const g=fixture();g.projectile(640,250,0,30,BY_ID.fission_bomb,'a',{sourceBullet:'FissionBombSplitBullet1',draw:{method:'BULLET_TRAIL'},age:.21});const b=g.projectiles.at(-1);rocket(g,b);AA.step(g,g.projectiles,1/120);assert(!b.intercepted);g.advanceProjectile(b,1/120);assert(g.effectAudit.some(e=>e.name==='FissionBombSplitTrigger2'));
});
test('one interceptor kills one child only and simultaneous interceptors never double-kill',()=>{
 const g=fixture(),a=bullet(g,640,250),b=bullet(g,642,250);rocket(g,a);AA.step(g,g.projectiles,1/120);assert(a.intercepted);assert(!b.intercepted);
 const h=fixture(),target=bullet(h);rocket(h,target);rocket(h,target);AA.step(h,h.projectiles,1/120);assert.equal(h.events.filter(e=>e.kind==='intercept').length,1);assert.equal(h.interceptors.length,0);
});
test('terrain blocks interceptors without a crater',()=>{
 const g=fixture(),b=bullet(g,640,150);g.soil.rect(620,290,660,300,true);const volume=g.soil.volume();rocket(g,b,{x:640,y:302});AA.step(g,g.projectiles,1/60);assert.equal(g.interceptors.length,0);assert(!b.intercepted);assert.equal(g.soil.volume(),volume);
});
test('lost targets reacquire locally, otherwise expire harmlessly without refund',()=>{
 const g=fixture(),b=bullet(g);g.input('b','air-defense');g.projectiles=[];const other=bullet(g,650,320);AA.step(g,g.projectiles,1/120);assert.equal(g.interceptors[0].targetId,other.id);g.projectiles=[];AA.step(g,[],1/120);assert.equal(g.interceptors.length,0);assert.equal(g.players[1].airDefenseCharges,9);
});
test('radar payload is bounded and finite, own interceptor status is isolated',()=>{
 const g=fixture();for(let i=0;i<30;i++)bullet(g,650+i,200+i);g.input('b','air-defense');const s=AA.status(g,'b');assert.equal(s.threats.length,8);assert.equal(s.interceptors.length,1);assert.equal(AA.status(g,'a').interceptors.length,0);
 for(const b of s.threats){for(const k of ['x','y','vx','vy','dx','dy','distance','bearing'])assert(Number.isFinite(b[k]));assert(Math.abs(b.dx)<=1&&Math.abs(b.dy)<=1);assert(!('weapon' in b));}
 assert.equal(AA.status(g,'b',{paused:true}).reason,'paused');
});
test('animated invisible-method rockets and drone delivery remain interceptable, unlike hidden helpers',()=>{
 const g=fixture();g.projectile(640,250,0,20,BY_ID.heatseeker,'a',{sourceBullet:'HeatseekerBullet',draw:{method:'BULLET_NONE',animated:true}});const missile=g.projectiles.at(-1);assert(AA.eligible(g,missile,'b'));
 g.projectile(600,250,0,0,BY_ID.missile_turret,'a',{sourceBullet:'MissileTurretBaseBullet',draw:{method:'BULLET_NOTHING',animated:true}});assert(!AA.eligible(g,g.projectiles.at(-1),'b'),'stationary animated turret base is not an airborne projectile');
 g.launchWeaponAt(670,260,0,35,BY_ID.dome_protect,'a',{drop:true});const delivery=g.projectiles.at(-1);assert.equal(delivery.delivery,true);assert(AA.eligible(g,delivery,'b'));rocket(g,delivery);AA.step(g,g.projectiles,1/120);assert(delivery.intercepted);assert.equal(Pocket.advance(g,delivery,1/120),false);assert.equal(g.pending.length,0,'no dropped dirt construction on intercepted delivery');
});
test('defense substep rejects non-finite/non-positive durations and bounds long frames',()=>{
 const g=fixture(),b=bullet(g);g.input('b','air-defense');const r=g.interceptors[0];for(const dt of [NaN,Infinity,-1,0])AA.step(g,g.projectiles,dt);assert.equal(r.age,0);AA.step(g,g.projectiles,10);assert(r.age<=1/30);assert(Number.isFinite(r.x)&&Number.isFinite(r.y));
});
test('real launched interceptor catches an approaching shell; a late launch may miss',()=>{
 const g=fixture();bullet(g,650,260,{vy:110});g.input('b','air-defense');for(let i=0;i<180&&g.turn===0;i++)g.step(1/60);assert(g.events.some(e=>e.kind==='intercept'));assert.equal(g.interceptors.length,0);assert(g.turn>0);
 const late=fixture();bullet(late,680,499,{vy:600});late.input('b','air-defense');for(let i=0;i<180&&late.turn===0;i++)late.step(1/60);assert(!late.events.some(e=>e.kind==='intercept'));assert.equal(late.interceptors.length,0);
});
