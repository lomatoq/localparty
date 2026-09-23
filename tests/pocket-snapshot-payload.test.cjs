const test=require('node:test'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs'),{view,omitUnchangedTerrain,TERRAIN_FIELDS}=require('../games/arcade_deluxe/core/snapshot-view.cjs');
function room(){const g=new Tanks(42);for(let i=0;i<3;i++)g.add({id:'p'+i,name:'Player'+i,avatar:'data:image/jpeg;base64,'+'A'.repeat(80000)});g.start({sandbox:true});return g;}
test('controller snapshots never carry terrain or photo data; gameplay fields remain',()=>{
 const g=room(),s=g.snapshot(),before=JSON.stringify(s),p=view(s,{id:'p0',airDefense:{canUse:true}});for(const field of TERRAIN_FIELDS)assert(!(field in p));assert(p.players.every(p=>!('avatar' in p)));assert.deepEqual(p.players[0].inventory,s.players[0].inventory);assert.equal(p.activeId,s.activeId);assert.deepEqual(p.airDefense,{canUse:true});assert.equal(JSON.stringify(s),before);
 const host=view(s,{host:true});assert.deepEqual(host.terrainStrata,s.terrainStrata);assert(host.players.every(p=>!('avatar'in p)));omitUnchangedTerrain(host);for(const field of TERRAIN_FIELDS)assert(!(field in host));assert.deepEqual(host.projectiles,s.projectiles);
});
test('three-player photo-room benchmark removes repeated payload cost',t=>{
 const s=room().snapshot(),oldHost={...s},oldPhone={...s};delete oldHost.terrain;delete oldHost.terrainColumns;for(const key of ['terrain','terrainColumns','interceptors','boards','path','chain','shots','projectiles','zones'])delete oldPhone[key];oldPhone.players=s.players.map((p,i)=>i===0?p:{id:p.id,name:p.name,color:p.color,connected:p.connected,participant:p.participant,score:p.score,lane:p.lane,team:p.team,x:p.x,y:p.y});
 const host=omitUnchangedTerrain(view(s,{host:true})),phone=view(s,{id:'p0'}),bytes=v=>Buffer.byteLength(JSON.stringify(v));
 const bench=v=>{const times=[];for(let i=0;i<350;i++){const at=performance.now();JSON.parse(JSON.stringify(v));times.push(performance.now()-at);}times.sort((a,b)=>a-b);return{medianMs:times[175],p95Ms:times[332],maxMs:times.at(-1)};};
 const report={host:{beforeBytes:bytes(oldHost),afterBytes:bytes(host),before:bench(oldHost),after:bench(host)},phone:{beforeBytes:bytes(oldPhone),afterBytes:bytes(phone)},bytesPerSecondAt20HzHost10HzThreePhones:{before:bytes(oldHost)*20+bytes(oldPhone)*30,after:bytes(host)*20+bytes(phone)*30}};
 assert(report.host.afterBytes<report.host.beforeBytes*.2);assert(report.phone.afterBytes<report.phone.beforeBytes*.2);t.diagnostic(JSON.stringify(report));
});
