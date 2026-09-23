'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs');
const {WEAPONS}=require('../games/arcade_deluxe/core/weapons.cjs');
const {definitions}=require('../games/arcade_deluxe/core/pocket-terrain.cjs');
function makeGame(){const g=new Tanks(7);for(const id of ['a','b'])g.add({id,name:id,connected:true});g.start({sandbox:true});g.effectAudit=[];return g;}
function simulate(w,scenario){
 const g=makeGame(),p=g.active();p.weapon=w.id;let peakProjectiles=0,peakZones=0,steps=0;
 const initialVolume=g.soil.volume();
 if(scenario==='cannon'){p.angle=55;p.power=38;g.fire();}
 else{const x=scenario==='drop'?640:1050;g.stage='flight';g.flightStarted=g.t;g.currentWeapon=w.id;g.launchWeaponAt(x,g.ground(x)-40,scenario==='drop'?0:200,120,w,p.id);}
 while(g.turn===0&&steps++<1500){g.step(1/30);peakProjectiles=Math.max(peakProjectiles,g.projectiles.length);peakZones=Math.max(peakZones,g.zones.length);}
 const commands={},triggers=new Set(),errors=[];
 for(const e of g.effectAudit){if(e.type==='command')commands[e.commandType]=(commands[e.commandType]||0)+1;else if(e.type==='trigger')triggers.add(e.name);else if(['missing-command','missing-trigger','unsupported','limit'].includes(e.type))errors.push(e);}
 for(const e of [...g.events,...g.projectiles,...g.zones])for(const key of ['x','y','r','vx','vy'])if(key in e&&!Number.isFinite(e[key]))errors.push({type:'non-finite',key});
 if(g.turn===0)errors.push({type:'unsettled'});
 return {scenario,seconds:+g.t.toFixed(3),commands,triggers:[...triggers],terrainDelta:+(g.soil.volume()-initialVolume).toFixed(2),peakProjectiles,peakZones,errors};
}
function audit(){
 const rows=WEAPONS.map(w=>({id:w.id,name:w.name,shots:['cannon','drop','oblique'].map(s=>simulate(w,s))}));
 const sourceIssues=[];
 for(const [id,w]of definitions){const names=new Set(w.chain.map(n=>n.name.toLowerCase()));for(const n of w.chain){for(const warning of n.parseWarnings||[])sourceIssues.push({id,node:n.name,warning});for(const c of n.commands||[])if(c.COMMAND&&!names.has(String(c.COMMAND).toLowerCase()))sourceIssues.push({id,node:n.name,missing:c.COMMAND});}}
 return {weapons:rows.length,shots:rows.length*3,failures:rows.flatMap(w=>w.shots.filter(s=>s.errors.length).map(s=>({id:w.id,...s}))),sourceIssues,rows};
}
if(require.main===module){const result=audit();const output=process.argv[2]||'/private/tmp/pocket-runtime-audit.json';fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({weapons:result.weapons,shots:result.shots,failures:result.failures.map(r=>({id:r.id,scenario:r.scenario,errors:r.errors.slice(0,3)})),sourceIssues:result.sourceIssues,report:output},null,2));if(result.failures.length)process.exitCode=1;}
module.exports={makeGame,simulate,audit};
