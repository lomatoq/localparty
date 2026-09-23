'use strict';
// Direct handler coverage complements three real shots/weapon. A missed
// branch is exercised directly here, not falsely claimed as shot-reachable.
const assert=require('node:assert/strict');
const {makeGame}=require('./audit-pocket-runtime.cjs');
const {definitions}=require('../games/arcade_deluxe/core/pocket-terrain.cjs');
const Pocket=require('../games/arcade_deluxe/core/pocket-runtime.cjs');
const materials=require('../games/arcade_deluxe/public/assets/pocket-materials.json');
const projectiles=require('../games/arcade_deluxe/public/assets/pocket-projectiles.json');
function audit(){const counts={},failures=[],weapons=[];
 for(const [id,w]of definitions){let checked=0;for(const n of w.chain){if(n.type==='TRIGGER')continue;const g=makeGame(),v=n.values,e={weapon:id,owner:'a',type:n.type,name:n.name,x:640,y:g.ground(640)-20,angle:90,power:0};
  try{assert(Pocket.command(g,e),'handler rejected');assert(!g.effectAudit.some(e=>['unsupported','missing-command','limit'].includes(e.type)),'runtime error');
   if(['BULLET','CRUISER'].includes(n.type)){assert(g.projectiles.some(b=>b.sourceBullet===n.name),'no projectile');if(v.DRAW_ANIM&&!/^(NONE|NULL)$/i.test(v.DRAW_ANIM))assert(projectiles.nodes[`${id}/${n.type}/${n.name}`],'missing projectile art profile');}
   else if(['FIRE','FOG','SUPERBALL'].includes(n.type)){const z=g.zones.find(z=>z.materialName===n.name);assert(z,'no material entity');const p=materials.weapons[id]?.find(p=>p.name.toLowerCase()===n.name.toLowerCase());assert(p&&p.frames.length,'missing material render profile');assert(g.events.some(e=>e.materialId===z.id),'no material render event');assert.equal(z.ends-g.t,p.life,'entity/render lifetime mismatch');}
   else if(['DIRTBALL','MAGICWALL','DIRTMOVER','DIRTSLINGER'].includes(n.type)){assert(g.pending.some(e=>e.kind==='reference-build'&&e.name===n.name),'no terrain job');assert(g.events.some(e=>e.effectName===n.name),'no terrain visual');}
   else if(n.type==='EXPLOSION'){if(Number(v.DRAW_COLOR)!==0)assert(g.explosionWaves.some(e=>e.source===n.name),'no persistent wave');if(v.ERASE_TERRAIN_FLAG||v.DIRTFALL_FLAG)assert(g.pending.some(e=>e.kind==='reference-terrain'&&e.source===n.name),'no erase/collapse job');}
   else if(['SHRAPNEL','LIGHTNING','ZAPPER'].includes(n.type))assert(g.events.some(e=>e.effectName===n.name),'no visual event');
   else if(n.type==='JUMPJETS')assert(g.events.some(e=>e.kind==='jump'),'no jump event');
   else if(n.type==='TRACER')assert(g.events.some(e=>e.kind==='spark'&&e.label===String(v.TEXT??'')),'no tracer label event');
   else assert.fail('unclassified node type');
  }catch(error){failures.push({weapon:id,type:n.type,name:n.name,error:error.message});}counts[n.type]=(counts[n.type]||0)+1;checked++;
 }weapons.push({id,checked});}
 return {weapons:weapons.length,counts,failures,directHandlerNodes:Object.values(counts).reduce((a,b)=>a+b,0)};
}
if(require.main===module){const result=audit();console.log(JSON.stringify(result,null,2));if(result.failures.length)process.exitCode=1;}
module.exports={audit};
