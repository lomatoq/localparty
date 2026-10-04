'use strict';
// Direct handler contracts and real projectile contacts are separate evidence.
const fs=require('node:fs');
const {makeGame}=require('./audit-pocket-runtime.cjs');
const {definitions}=require('../games/arcade_deluxe/core/pocket-terrain.cjs');
const {BY_ID}=require('../games/arcade_deluxe/core/weapons.cjs');
const Pocket=require('../games/arcade_deluxe/core/pocket-runtime.cjs');
const positive=v=>Number(v.DAMAGE)>0||Number(v.DAMAGE_PER_SECOND)>0;
function effectCase(weapon,n,kind){
 const g=makeGame(),target=g.players[1];target.x=700;target.y=400;
 const x=kind==='center'?700:kind==='far'?100:683,y=392;
 const e={weapon,owner:'a',type:n.type,name:n.name,x,y,angle:0,power:0};
 if(kind==='contact')e.directContact={target:target.id,x,y};
 Pocket.command(g,e);
 if(['FIRE','FOG','SUPERBALL'].includes(n.type)){
  const z=g.zones[0];z.gravity=false;
  for(let i=0;i<Math.ceil(z.ends*120);i++)Pocket.materialStep(g,z,Math.min(1/120,z.ends-z.age));
 }
 return{score:g.players[0].score,hits:g.events.filter(e=>e.kind==='hit'&&e.target===target.id).length};
}
function auditDamage(){
 const nodes=[],weapons=[],failures=[];
 for(const [weapon,w]of definitions){
  for(const n of w.chain)if(['EXPLOSION','SHRAPNEL','FIRE','FOG','SUPERBALL','LIGHTNING','ZAPPER'].includes(n.type)){
   const center=effectCase(weapon,n,'center'),edge=effectCase(weapon,n,'edge'),contact=effectCase(weapon,n,'contact');
   const radial=['EXPLOSION','SHRAPNEL'].includes(n.type),far=radial?effectCase(weapon,n,'far'):null;
   if(radial&&positive(n.values)&&contact.score!==Math.round(n.values.DAMAGE))failures.push({weapon,node:n.name,issue:'confirmed-contact-damage',contact});
   if(!positive(n.values)&&center.score!==0)failures.push({weapon,node:n.name,issue:'zero-damage-scored',center});
   if(far?.hits)failures.push({weapon,node:n.name,issue:'far-miss-hit-target',far});
   nodes.push({weapon,type:n.type,name:n.name,damage:Number(n.values.DAMAGE)||0,dps:Number(n.values.DAMAGE_PER_SECOND)||0,radius:n.values.RADIUS??n.values.DAMAGE_RADIUS,center,edge,contact,far});
  }
  // Launch each declared bullet via its real authoritative swept-contact
  // routine, not by calling its explosion handler. Bypass/time/proximity/
  // child spawn outcomes remain source-specific, not invented guaranteed hits.
  const projectiles=[];
  for(const n of w.chain.filter(n=>n.type==='BULLET')){
   const g=makeGame(),target=g.players[1];target.x=700;target.y=400;g.wind=0;g.stage='flight';g.flightStarted=0;
   // Keep the isolated target above terrain: an underground target would
   // correctly let the terrain contact win before the tank collision.
   g.soil.fromHeights(g.terrain.map(()=>900));g.syncTerrain();
   g.projectile(670,392,600,0,BY_ID[weapon],'a',{authored:true,fragment:true,sourceBullet:n.name,sourceType:n.type});
   const b=g.projectiles.pop();b.age=.2;const alive=g.advanceProjectile(b,1/30);
   projectiles.push({name:n.name,bypass:n.values.BYPASS_TANK_FLAG===true||n.values.BYPASS_TANK_FALG===true,contact:b.hitTank===target.id,alive,score:g.players[0].score,hits:g.events.filter(e=>e.kind==='hit'&&e.target===target.id).length,commands:g.effectAudit.filter(e=>e.type==='command').map(e=>e.name),children:g.projectiles.length,pending:g.pending.length});
   if(g.projectiles.some(b=>b.directContact))failures.push({weapon,node:n.name,issue:'contact-leaked-to-child'});
   if(g.effectAudit.some(e=>['missing-command','missing-trigger','unsupported','limit'].includes(e.type)))failures.push({weapon,node:n.name,issue:'contact-runtime-error'});
  }
  weapons.push({id:weapon,sourceDamage:w.chain.some(n=>positive(n.values)),projectiles});
 }
 return{weapons:weapons.length,effectNodes:nodes.length,positiveNodes:nodes.filter(n=>n.damage>0||n.dps>0).length,formerlySuppressedContactNodes:nodes.filter(n=>n.damage>0&&n.edge.hits===0&&n.contact.hits>0).length,realProjectileRoutes:weapons.reduce((s,w)=>s+w.projectiles.length,0),realContacts:weapons.reduce((s,w)=>s+w.projectiles.filter(p=>p.contact).length,0),failures,nodes,rows:weapons};
}
if(require.main===module){const r=auditDamage();fs.writeFileSync(process.argv[2]||'output/qa/pocket-damage-2026-10-03/damage-audit.json',JSON.stringify(r,null,2));console.log(JSON.stringify({...r,nodes:undefined,rows:undefined}));if(r.failures.length)process.exitCode=1;}
module.exports={auditDamage,effectCase};
