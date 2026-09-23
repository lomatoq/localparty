'use strict';
const assert=require('node:assert/strict'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs');
async function main(){
 const g=new Tanks(7);g.add({id:'a',name:'A',connected:true});g.add({id:'b',name:'B',connected:true});g.start({sandbox:true});
 const p=g.active();p.weapon='burn_barrel';p.angle=55;p.power=38;g.fire();
 const frames=[];for(let i=0;i<2700&&g.stage==='flight';i++){g.step(1/60);if(i%3===2){const s=g.snapshot();frames.push({t:s.t,events:s.events,zones:s.zones,terrain:s.terrain});}}
 assert(frames.some(f=>f.zones.length),'real Burn Barrel shot must have live materials');
 const server=express().use(express.static('games/arcade_deluxe/public')).listen(0,'127.0.0.1');await new Promise((r,j)=>{server.once('listening',r);server.once('error',j)});let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/geometry.js`);
  const result=await page.evaluate(async frames=>{
   const {PocketPlasma}=await import('/pocket-plasma.js');const fx=new PocketPlasma();if(!await fx.ready)throw Error('masks not loaded');
   const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;document.body.append(canvas);const c=canvas.getContext('2d');
   const frame=frames.find(f=>f.zones.some(z=>z.age>.1)),zone=frame.zones.find(z=>z.age>.1),event=frames.flatMap(f=>f.events).find(e=>e.materialId===zone.materialId);
   if(!event)throw Error('real material event missing');
   fx.emit(event);fx.draw(c,0,()=>450,[zone]);const dedup=fx.sources.length;
   fx.clear();fx.draw(c,0,()=>450,[zone]);const recovered=fx.sources[0];
   const recovery={count:fx.sources.length,age:recovered?.age,expectedAge:zone.age,name:recovered?.profile.name,expectedName:zone.materialName,x:recovered?.x,expectedX:zone.x,vx:recovered?.vx,expectedVx:zone.vx};
   fx.clear();for(let i=0;i<300;i++)fx.emit({...event,materialId:10000+i});
   const unknown={...zone,id:99999,materialId:99999,materialName:'not-yet-loaded'};fx.draw(c,0,()=>450,[unknown]);
   const wronglyMarked=fx.seenZones.has(99999);fx.draw(c,0,()=>450,[{...unknown,materialName:zone.materialName}]);const correctedRecovered=fx.seenZones.has(99999);
   fx.clear();let lastId=0,missing=0,duplicates=0,peak=0,visibleFrames=0,liveFrames=0,totalRecovered=0;
   for(const f of frames){
    // Regular network snapshot path, with an additional event-loss scenario:
    // omit all blast events on alternate snapshots. Zones must recover them.
    const before=new Set(fx.sources.map(s=>s.materialId));
    for(const e of f.events){if(e.id<=lastId)continue;lastId=e.id;if(e.materialName&&Math.round(f.t*20)%2===0)fx.emit(e);}
    fx.draw(c,0,x=>f.terrain[Math.max(0,Math.min(f.terrain.length-1,Math.round(x/2)))],f.zones);
    const ids=fx.sources.map(s=>s.materialId),set=new Set(ids);duplicates+=ids.length-set.size;peak=Math.max(peak,ids.length);
    for(const z of f.zones){if(z.age>=((fx.data.weapons[z.weapon]||[]).find(p=>p.name===z.materialName)?.life??0))continue;if(!set.has(z.materialId))missing++;if(!before.has(z.materialId)&&set.has(z.materialId))totalRecovered++;}
    fx.draw(c,.05,x=>f.terrain[Math.max(0,Math.min(f.terrain.length-1,Math.round(x/2)))],f.zones);
    if(f.zones.length){liveFrames++;if(fx.active)visibleFrames++;}
    if(fx.sources.some(s=>!Number.isFinite(s.x+s.y+s.age+s.vx+s.vy)))throw Error('nonfinite recovered material');
   }
   return{dedup,recovery,wronglyMarked,correctedRecovered,missing,duplicates,peak,visibleFrames,liveFrames,totalRecovered,snapshots:frames.length};
  },frames);
  assert.equal(result.dedup,1);assert.equal(result.recovery.count,1);assert.equal(result.recovery.age,result.recovery.expectedAge);assert.equal(result.recovery.name,result.recovery.expectedName);assert.equal(result.recovery.x,result.recovery.expectedX);assert.equal(result.recovery.vx,result.recovery.expectedVx);
  assert.equal(result.wronglyMarked,false);assert.equal(result.correctedRecovered,true);assert.equal(result.missing,0);assert.equal(result.duplicates,0);assert(result.peak<=320);assert(result.visibleFrames>0);assert.equal(result.visibleFrames,result.liveFrames,'fire stays visible in every snapshot with live materials');assert(result.totalRecovered>100);assert.deepEqual(errors,[]);console.log(JSON.stringify(result,null,2));
 }finally{await browser?.close();server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1});
