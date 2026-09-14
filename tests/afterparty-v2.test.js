'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {Sports}=require('../games/afterparty/sports'),{Arcade}=require('../games/afterparty/arcade');
const roster=n=>Array.from({length:n},(_,i)=>({id:'p'+i,name:'Тест '+i,connected:true,color:'#c8f58b'}));
const shot=g=>({turnId:g.turnId,power:.6,angle:0,spin:0,offset:0});
test('sports-v2 refuses non-finite, string and missing gesture fields without advancing state',()=>{
 for(const key of ['power','angle','spin','offset'])for(const value of [NaN,Infinity,'0',null,undefined]){const g=new Sports('curling',roster(2));const d={...shot(g),[key]:value};assert.equal(g.input(g.current,'throw',d),false);assert.equal(g.state,'aim');assert.equal(g.stones.length,0);}
});
test('fixed substep curling agrees at 30, 60 and 120 input update rates',()=>{
 const out=[];for(const hz of [30,60,120]){const g=new Sports('curling',roster(2));g.input(g.current,'throw',shot(g));for(let i=0;i<hz*3;i++)g.update(1/hz);out.push(g.stones[0]);}for(const s of out.slice(1)){assert.ok(Math.abs(s.x-out[0].x)<1e-7);assert.ok(Math.abs(s.z-out[0].z)<1e-7);}
});
test('bowling reveal preserves pins before reset and emits one readable result',()=>{
 const g=new Sports('bowling',roster(2));g.rack=()=>{};g.pins=[];g.recordBowl(4);assert.equal(g.state,'reveal');assert.equal(g.current.rolls.length,0);g.update(.6);assert.equal(g.state,'reveal');g.update(.8);assert.equal(g.current.rolls.length,1);assert.equal(g.state,'aim');assert.equal(g.events.filter(e=>e.kind==='roll').length,1);
});
test('sports result events remain bounded during many throws',()=>{const g=new Sports('curling',roster(2));for(let i=0;i<100;i++)g.event('impact',{x:i});assert.equal(g.events.length,32);assert.ok(g.events.at(-1).id>g.events[0].id);});
test('arcade refuses non-finite or missing aim without poisoning a player',()=>{
 for(const mode of ['gate_siege','pop_shots']){const g=new Arcade(mode,roster(2)),p=g.players[0];const initial={...p.aim};for(const aim of [{x:NaN,z:0},{x:0,z:Infinity},{x:'1',z:0},{x:0}])assert.equal(g.input(p,'input',aim),false);assert.deepEqual(p.aim,initial);}
});
test('machine-gun hits never precharge the next bonus, and activation clears the old streak',()=>{
 const g=new Arcade('pop_shots',roster(2)),p=g.players[0];p.ready=true;p.streak=4;assert.equal(g.input(p,'ability',{}),true);assert.equal(p.streak,0);
 for(let i=0;i<8;i++){g.entities=[{id:i,x:2,z:2,hp:1,r:.74,visible:true}];p.aim={x:2,z:2};g.shoot(p);}assert.equal(p.streak,0);assert.equal(p.ready,false);
 g.time=6;g.entities=[{id:20,x:2,z:2,hp:1,r:.74,visible:true}];g.shoot(p);assert.equal(p.streak,1);assert.equal(p.ready,false);
});
test('arcade hit effects contain authoritative hit feedback, not client nominated scores',()=>{
 const g=new Arcade('pop_shots',roster(2)),p=g.players[0];p.aim={x:2,z:2};g.entities=[{id:1,x:2,z:2,r:.74,hp:1,visible:true}];g.shoot(p);assert.equal(g.effects.at(-1).points,1);assert.equal(g.effects.at(-1).killed,true);
});
test('camera planning stays finite, follows both projectiles, and has a true overview option',async()=>{
 const source=fs.readFileSync(path.join(__dirname,'../games/afterparty/public/motion.js'),'utf8'),m=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const mode of ['bowling','curling']){let start,last;for(const z of [2,7,14,21,26]){const s={state:'rolling',ball:{p:{x:.4,y:.23,z}},stones:[{x:.4,z}]};const c=m.cameraPlan(mode,s);assert.ok([...c.position,...c.target,c.fov].every(Number.isFinite));start||=c;last=c;}assert.ok(last.position[2]-start.position[2]>15);const a=m.cameraPlan(mode,{state:'rolling',ball:{p:{x:1,z:24}},stones:[{x:1,z:24}]},true);assert.deepEqual(a,m.cameraPlan(mode,{},true));}
 let a=0,b=0;for(let i=0;i<30;i++)a=m.damp(a,1,5,1/30);for(let i=0;i<120;i++)b=m.damp(b,1,5,1/120);assert.ok(Math.abs(a-b)<1e-12);const pool=new m.BoundedEffects(10);for(let i=0;i<100;i++)pool.add({age:0,life:.1});assert.equal(pool.items.length,10);pool.tick(.2);assert.equal(pool.items.length,0);
});
test('both new screens declare ownership and the gateway respects it without removing the bridge',()=>{
 const root=path.join(__dirname,'..'),server=fs.readFileSync(path.join(root,'server.js'),'utf8');assert.match(server,/if\(!nativeLayout\)/);assert.match(server,/bridge\.js/);
 for(const file of ['host.html','controller.html'])assert.match(fs.readFileSync(path.join(root,'games/afterparty/public',file),'utf8'),/data-party-layout="native-v2"/);
});
test('only active thrower can send direction previews; previews never change physics',()=>{const g=new Sports('curling',roster(2)),d=shot(g);assert.equal(g.input(g.players[1],'preview',d),false);assert.equal(g.input(g.current,'preview',d),true);assert.equal(g.stones.length,0);assert.ok(g.snapshot(true).aimPreview);assert.equal(g.snapshot(false).aimPreview,undefined);});
