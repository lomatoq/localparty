'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const rules=require('../games/sports_siege/rules');
const {Match}=require('../games/sports_siege/match');
const {Ice}=require('../games/sports_siege/curling');
const f=rolls=>({rolls});
function game(mode,n=2,extra={}){const m=new Match(mode,extra);for(let i=0;i<n;i++)m.add({id:'p'+i,name:'Игрок '+i,hand:i?'right':'left'});m.start();return m;}
function run(m,seconds,fn){for(let i=0;i<seconds*60;i++){fn?.(m,i);m.step(1/60);}}
class FakeBowling{constructor(){this.reset();this.resting=true;}reset(mask=Array(10).fill(true)){this.mask=mask;this.fallen=0;}standing(){let left=this.fallen;return this.mask.map(x=>x&&left--<=0);}throw(){}step(){}snapshot(){return{pins:[],ball:null};}free(){}}
test('bowling: perfect 300 / all spares 150 / open frames 90',()=>{
 assert.equal(rules.scoreBowling([...Array.from({length:9},()=>f([10])),f([10,10,10])]).total,300);
 assert.equal(rules.scoreBowling([...Array.from({length:9},()=>f([5,5])),f([5,5,5])]).total,150);
 assert.equal(rules.scoreBowling(Array.from({length:10},()=>f([9,0]))).total,90);
});
test('bowling: unresolved bonus and double strike are not scored prematurely',()=>{
 assert.equal(rules.scoreBowling([f([10])]).rows[0].score,null);
 assert.equal(rules.scoreBowling([f([10]),f([10]),f([3,4])]).total,47);
 assert.equal(rules.scoreBowling([f([8,2]),f([7,1])]).total,25);
});
test('bowling: last-frame rack resets for strike/spare but not strike then seven',()=>{
 assert.equal(rules.freshRack([10],true),true);assert.equal(rules.freshRack([10,7],true),false);
 assert.equal(rules.freshRack([10,10],true),true);assert.equal(rules.freshRack([7,3],true),true);
 assert.equal(rules.frameComplete([10,7],true),false);assert.equal(rules.frameComplete([7,2],true),true);
 assert.equal(rules.frameComplete([10,7,3],true),true);
});
test('short bowling match final frame uses bonus rolls',()=>{assert.equal(rules.scoreBowling([f([10]),f([10]),f([10,10,10])],3).total,90);});
test('gesture input rejects NaN, Infinity, strings and missing fields',()=>{
 const v={power:.5,angle:0,spin:0,position:0};for(const k of Object.keys(v))for(const value of [NaN,Infinity,'1',null,undefined])assert.equal(rules.shotInput({...v,[k]:value}),null);
 assert.deepEqual(rules.shotInput({power:9,angle:-3,spin:8,position:-4}),{power:1,angle:-.32,spin:1,position:-1});
});
test('curling: only stones closer than opposition score; dead stones excluded',()=>{
 const s=[{id:1,x:0,z:-9,team:0},{id:2,x:.3,z:-9,team:0},{id:3,x:.4,z:-9,team:1},{id:4,x:.8,z:-9,team:0},{id:5,x:0,z:-9,team:1,valid:false}];
 assert.deepEqual(rules.curlingScore(s),{team:0,points:2,ids:[1,2]});
 assert.equal(rules.curlingScore([{x:0,z:-9,team:0},{x:0,z:-9,team:1}]).team,null);
 assert.equal(rules.curlingScore([{x:8,z:0,team:0}]).points,0);
});
test('curling: a centred playable shot reaches the house and settles',()=>{
 const ice=new Ice();ice.throw({power:.55,angle:0,position:0,spin:0},{id:'a',team:0});for(let i=0;i<17*120;i++)ice.step(1/120);
 ice.settle();assert.ok(ice.resting);assert.ok(ice.stones[0].valid);assert.ok(Math.abs(ice.stones[0].z+9)<3);
});
test('curling: sweeping carries the stone farther; low short throw is removed',()=>{
 const shoot=(power,sweep)=>{const i=new Ice();i.throw({power,angle:0,position:0,spin:0},{id:'a',team:0});for(let n=0;n<17*120;n++)i.step(1/120,sweep);i.settle();return i.stones[0];};
 assert.ok(shoot(.45,1).z<shoot(.45,0).z);assert.equal(shoot(0,0).valid,false);
});
test('curling: collisions transfer momentum, no overlap remains',()=>{
 const i=new Ice();i.stones=[{id:1,x:0,z:0,vx:0,vz:-4,spin:0,rotation:0,r:.43,valid:true,crossed:true},{id:2,x:0,z:-.8,vx:0,vz:0,spin:0,rotation:0,r:.43,valid:true,crossed:true}];i.step(1/60);
 assert.ok(i.stones[1].vz<-3);assert.ok(Math.abs(i.stones[0].z-i.stones[1].z)>=.859);
});
test('turn ownership and nonce prevent duplicate/replayed throws',()=>{
 const m=game('curling');const d={power:.5,angle:0,spin:0,position:0,turnToken:m.turnToken};
 assert.equal(m.input('p1','throw',d),false);assert.equal(m.input('p0','throw',{...d,turnToken:'old'}),false);
 assert.equal(m.input('p0','throw',d),true);assert.equal(m.input('p0','throw',d),false);assert.equal(m.world.stones.length,1);
});
test('curling equal stone allocation for uneven teams, 2 / 3 / 16 players',()=>{
 for(const n of [2,3,16]){const m=game('curling',n),teams=m.queue.map(id=>m.players.get(id).team);assert.equal(teams.filter(x=>x===0).length,teams.filter(x=>x===1).length);assert.equal(new Set(m.queue).size,n);}
});
test('curling disconnected thrower gets skipped, late arrival waits',()=>{
 const m=game('curling');m.disconnect('p0');run(m,9);assert.equal(m.currentId,'p1');
 assert.equal(m.add({id:'late'}).participant,false);assert.equal(m.input('late','throw',{}),false);
});
test('held controls stop after deadman and disconnect/release',()=>{
 const m=game('peek_shoot');m.input('p0','input',{x:.6,y:.4,fire:true});run(m,.6);assert.equal(m.players.get('p0').fire,false);
 m.input('p0','input',{fire:true});m.release();assert.equal(m.players.get('p0').fire,false);
 m.input('p0','input',{fire:true});m.disconnect('p0');assert.equal(m.players.get('p0').fire,false);
});
test('invalid aim cannot poison authoritative state',()=>{const m=game('peek_shoot');assert.equal(m.input('p0','input',{x:NaN,fire:true}),false);assert.deepEqual(m.players.get('p0').aim,{x:.5,y:.5});});
test('reconnect preserves score and identity, spectators cannot shoot',()=>{
 const m=game('peek_shoot');m.players.get('p0').score=80;m.disconnect('p0');m.add({id:'p0',name:'new'});assert.equal(m.players.get('p0').score,80);assert.equal(m.players.size,2);
 m.add({id:'late'});assert.equal(m.input('late','input',{fire:true}),false);
});
test('gallery: cover occludes a target and visible head accepts a hit',()=>{
 const t={id:1,baseX:.5,coverY:.4,r:.04,depth:.9,hp:1,born:0,life:3,seed:0,speed:0},c={x:.4,y:.4,w:.2,h:.1,depth:1};
 assert.equal(rules.hitTarget([t],[c],.5,.4,1),null);
 assert.equal(rules.hitTarget([t],[c],.5,rules.targetAt(t,1).y,1).id,1);
 assert.equal(rules.hitTarget([t],[c],.5,.35,3.5),null);
});
test('gallery: foreground target wins overlap; foreground obstacle blocks rear row',()=>{
 const t={baseX:.5,coverY:.4,r:.04,hp:1,born:0,life:3,seed:0,speed:0};
 assert.equal(rules.hitTarget([{...t,id:1,depth:.9},{...t,id:2,depth:1.9}],[],.5,.348,1).id,2);
 assert.equal(rules.hitTarget([{...t,id:1,depth:.9}],[{x:.4,y:.3,w:.2,h:.1,depth:2}],.5,.348,1),null);
});
test('six accurate hits charge a manually activated eight-second machine gun',()=>{
 const m=game('peek_shoot'),p=m.players.get('p0');m.t=1;m.covers=[];
 for(let i=0;i<6;i++){m.targets=[{id:i,kind:'goof',baseX:.5,coverY:.552,r:.04,depth:1,hp:1,born:0,life:100,seed:0,speed:0}];p.aim={x:.5,y:.5};m.galleryFire(p);m.t+=.3;}
 assert.equal(p.charge,true);assert.equal(p.gunUntil,0);assert.equal(m.input('p0','ability'),true);assert.equal(p.charge,false);assert.equal(p.gunUntil,m.t+8);
 assert.equal(m.input('p0','ability'),false);assert.ok(m.events.some(e=>e.kind==='machinegun'&&e.player==='p0'));
});
test('a miss breaks streak; machine-gun hits cannot recharge it',()=>{
 const m=game('peek_shoot'),p=m.players.get('p0');p.streak=5;m.targets=[];m.galleryFire(p);assert.equal(p.streak,0);
 p.gunUntil=100;m.t=1;m.covers=[];m.targets=[{id:1,kind:'goof',baseX:.5,coverY:.552,r:.06,depth:1,hp:1,born:0,life:10,seed:0,speed:0}];m.galleryFire(p);assert.equal(p.streak,0);assert.equal(p.charge,false);
});
test('gallery simultaneous shots award a target only once',()=>{
 const m=game('peek_shoot');m.t=1;m.covers=[];m.targets=[{id:1,kind:'goof',baseX:.5,coverY:.552,r:.04,depth:1,hp:1,born:0,life:10,seed:0,speed:0}];
 m.galleryFire(m.players.get('p0'));m.galleryFire(m.players.get('p1'));assert.equal(m.playing().reduce((s,p)=>s+p.score,0),10);
});
test('gallery round finishes and result is immutable after finish',()=>{const m=game('peek_shoot');run(m,91);assert.equal(m.phase,'results');const r=m.result;m.finish('again',[]);assert.equal(m.result,r);});
test('swarm scales spawn budget and supports immediate late joining',()=>{
 const a=game('swarm_gate',1),b=game('swarm_gate',16);run(a,4.1);run(b,4.1);assert.ok(b.waveLeft>a.waveLeft);
 assert.equal(a.add({id:'late'}).participant,true);assert.ok(Number.isFinite(a.turretX(a.players.get('late'))));
});
test('turrets spread consistently; no NaN in lobby or solo mode',()=>{
 for(const n of [1,2,16]){const m=new Match('swarm_gate');for(let i=0;i<n;i++)m.add({id:'p'+i});assert.ok(m.snapshot().players.every(p=>Number.isFinite(p.turretX)));m.start();assert.ok(m.snapshot().players.every(p=>Number.isFinite(p.turretX)));}
});
test('turret ray hits nearest target, not an enemy behind it',()=>{
 const m=game('swarm_gate',1),p=m.players.get('p0');p.aim={x:.5,y:0};m.enemies=[{id:1,x:0,z:-4,r:.4,hp:55,kind:'termite'},{id:2,x:0,z:-8,r:.4,hp:55,kind:'termite'}];m.siegeFire(p);assert.equal(m.enemies[0].hp,31);assert.equal(m.enemies[1].hp,55);
});
test('gate chewing causes loss, last empty wave causes team victory',()=>{
 const m=game('swarm_gate');m.stage='wave';m.waveLeft=0;m.gate=.01;m.enemies=[{id:1,x:0,z:-.8,targetX:0,hp:99,r:.4,speed:1,kind:'termite'}];m.step(.05);assert.equal(m.gate,0);assert.equal(m.phase,'results');assert.deepEqual(m.result.winners,[]);
 const w=game('swarm_gate');w.stage='wave';w.wave=w.waveCount;w.waveLeft=0;w.enemies=[];w.step(.01);assert.deepEqual(w.result.winners,['p0','p1']);
});
test('swarm overheat locks shooting and pulse has cooldown',()=>{
 const m=game('swarm_gate',1),p=m.players.get('p0');m.stage='wave';m.waveLeft=999;
 run(m,3,()=>m.input('p0','input',{fire:true,x:.5,y:.1}));assert.ok(p.lockedUntil>0);assert.ok(p.heat<=1);
 assert.equal(m.input('p0','ability'),true);assert.equal(m.input('p0','ability'),false);
});
test('16-player event stream is bounded and announcements survive tracer flood',()=>{
 const m=game('swarm_gate',16);m.event('machinegun','important');for(let i=0;i<500;i++)m.event('shot','');assert.ok(m.events.length<=100);assert.ok(m.events.some(e=>e.text==='important'));
});
test('all disconnected abort after grace, no indefinite zombie match',()=>{const m=game('peek_shoot');m.disconnect('p0');m.disconnect('p1');run(m,21);assert.equal(m.phase,'results');});
test('bowling complete three-frame match alternates players and includes bonuses',()=>{
 const m=game('bowling',2,{bowlingFactory:()=>new FakeBowling()});m.frameCount=3;let throws=0;
 run(m,50,()=>{if(m.stage==='aim'){m.world.fallen=10;assert.ok(m.input(m.currentId,'throw',{power:.5,spin:0,angle:0,position:0,turnToken:m.turnToken}));throws++;}});
 assert.equal(m.phase,'results');assert.equal(throws,10);assert.deepEqual(m.playing().map(p=>p.score),[90,90]);
});
test('player cap and mode validation',()=>{assert.throws(()=>new Match('bad'));const m=game('peek_shoot',16);assert.equal(m.add({id:'extra'}),null);});
