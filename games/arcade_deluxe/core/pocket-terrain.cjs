'use strict';
const reference=require('./pocket-reference.generated.json');
const ExplosionTimeline=require('../public/explosion-timeline.js');
const definitions=new Map(reference.weapons.map(w=>[w.id,w]));
const list=v=>Array.isArray(v)?v:[v];
const at=(v,i)=>list(v)[i]??list(v)[0];
const TERRAIN_TYPES=new Set(['DIRTBALL','DIRTMOVER','DIRTSLINGER','MAGICWALL']);
function commands(node){
 if(!node)return [];
 const v=node.values;
 return node.commands||list(v.COMMAND).map((COMMAND,i)=>({COMMAND,TYPE:at(v.TYPE,i),TIMEDELAY:at(v.TIMEDELAY,i),XOFFSET:at(v.XOFFSET,i),YOFFSET:at(v.YOFFSET,i)}));
}
function bulletNames(id,parentName){
 const weapon=definitions.get(id);if(!weapon)return [];
 const nodes=new Map(weapon.chain.map(n=>[`${n.type}:${n.name}`,n]));
 function visit(name,seen=new Set()){
  if(!name||seen.has(name))return [];
  const next=new Set(seen);next.add(name);
  return commands(nodes.get(`TRIGGER:${name}`)).flatMap(row=>row.TYPE==='BULLET'&&nodes.has(`BULLET:${row.COMMAND}`)?[row.COMMAND]:row.TYPE==='TRIGGER'?visit(row.COMMAND,next):[]);
 }
 if(!parentName)return visit(weapon.trigger);
 const parent=nodes.get(`BULLET:${parentName}`);if(!parent)return [];
 // The existing split simulation emits one generation. Keep those children
 // bound to that generation's authored impact definitions, not the root.
 for(const key of ['VERTICAL_VELOCITY_TRIGGER','PROXIMITY_TRIGGER','TIMED_DETONATION_TRIGGER','EXPLOSION_TRIGGER']){
  const names=visit(parent.values[key]);if(names.length)return names;
 }
 return [];
}
function offset(value,previous,rng){
 if(value==null||value==='NONE')return previous;
 if(typeof value==='number')return value;
 const text=String(value).toUpperCase();
 if(/(?:CTANK|STANK)_[XY]/.test(text))return previous;
 let current=/\b(?:SET|RESET)\b/.test(text)?0:previous;
 const tokens=text.replace(/\b(?:SET|RESET)\b/g,'').match(/RND\s+-?\d+(?:\.\d+)?|[+*/-]?\s*\d+(?:\.\d+)?/g)||[];
 for(const token of tokens){
  const random=token.match(/^RND\s+(-?\d+(?:\.\d+)?)$/);if(random){current+=rng()*Number(random[1]);continue;}
  const match=token.match(/^([+*/-]?)\s*(\d+(?:\.\d+)?)$/);if(!match)continue;
  const value=Number(match[2]),operator=match[1];
  if(operator==='*')current*=value;else if(operator==='/')current=value?current/value:current;else if(operator==='-')current-=value;else current+=value;
 }
 return current;
}
// Resolve only the selected impact trigger. Other bullets' explosions belong
// to their own later impacts, not to this crater.
function impactPlan(id,bulletName,rng=()=>.5){
 const weapon=definitions.get(id);if(!weapon)return null;
 const nodes=new Map(weapon.chain.map(n=>[`${n.type}:${n.name}`,n]));
 const bullet=bulletName?nodes.get(`BULLET:${bulletName}`):weapon.chain.find(n=>n.type==='BULLET');
 const result=[],terrain=[],bullets=[],visuals=[],triggers=[];
 const codes={EXPLOSION:'E',SHRAPNEL:'S',FIRE:'F',FOG:'G',LIGHTNING:'L',ZAPPER:'Z',MAGICWALL:'W',DIRTBALL:'D',DIRTMOVER:'M',DIRTSLINGER:'T',SUPERBALL:'B'};
 function trigger(name,time=0,x=0,y=0,angle=270,power=0,seen=new Set()){
  if(seen.has(name)||seen.size>24)return;
  const node=nodes.get(`TRIGGER:${name}`);
  if(!node)return;
  triggers.push(name);
  const branch=new Set(seen);branch.add(name);const v=node.values;
  for(const row of commands(node)){
   const command=row.COMMAND;
   time+=Number(row.TIMEDELAY||0)/1000;x=offset(row.XOFFSET,x,rng);y=offset(row.YOFFSET,y,rng);
   angle=offset(row.ANGLE,angle,rng);power=offset(row.POWER,power,rng);
   const type=String(row.resolvedType||row.TYPE).toUpperCase(),target=nodes.get(`${type}:${command}`);
   if(type==='TRIGGER'){trigger(command,time,x,y,angle,power,branch);continue;}
   if(!target)continue;
   const e=target.values;
   if(codes[type]&&visuals.length<64)visuals.push([codes[type],time,x,x,y,y,Number(e.RADIUS||e.DAMAGE_RADIUS||e.WIDTH||0),Number(e.TOTAL_TIME||e.EMITTER_TIME||e.BURN_TIME/1000||e.ACTIVE_TIME/1000||0),e.DRAW_DIRECTION==='EXPLOSION_IN']);
   if(type==='EXPLOSION')result.push({...ExplosionTimeline.timeline(e),name:target.name,delay:time,x,y,radius:e.RADIUS,erase:e.ERASE_TERRAIN_FLAG===true,dirtFall:e.DIRTFALL_FLAG===true,eraseDirection:e.ERASE_DIRECTION,damage:e.DAMAGE,throwTank:e.THROW_TANK_FLAG===true});
   else if(TERRAIN_TYPES.has(type))terrain.push({material:terrainMaterial(e),type,name:target.name,delay:time,x,y,radius:Number(e.RADIUS||0),width:Number(e.WIDTH||0),height:Number(e.HEIGHT||0),minWidth:Number(e.MIN_WIDTH||0),maxWidth:Number(e.MAX_WIDTH||0),thickness:Number(e.THICKNESS||0),backupDistance:Number(e.BACKUP_DISTANCE||0),spikeCount:Number(e.SPIKE_COUNT||0),dirtIndex:Number(e.DIRT_INDEX||0),dirtFall:e.DIRTFALL_FLAG===true});
   else if(type==='BULLET'&&bullets.length<120)bullets.push({name:target.name,delay:time,x,y,angle,power});
  }
 }
 if(bullet)trigger(bullet.values.EXPLOSION_TRIGGER);
 else if(!weapon.chain.some(node=>node.type==='BULLET'))trigger(weapon.trigger);
 return {explosions:result,terrain,bullets,visuals,triggers};
}
function terrainMaterial(values){
 const rgb=value=>{const channels=String(value||'').trim().split(/\s+/).map(Number);return channels.length===3&&channels.every(v=>Number.isFinite(v)&&v>=0&&v<=255)?'#'+channels.map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''):null;};
 const low=rgb(values?.LOW_COLOR),high=rgb(values?.HIGH_COLOR);return low&&high?[low,high]:null;
}
function impactExplosions(id,bulletName,rng){return impactPlan(id,bulletName,rng)?.explosions??null;}
module.exports={impactExplosions,impactPlan,definitions,bulletNames,offset,terrainMaterial};
