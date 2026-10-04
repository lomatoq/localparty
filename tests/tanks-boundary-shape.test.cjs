'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../games/tanks/public/host.js'),'utf8');
const context=vm.createContext({});vm.runInContext(source.slice(source.indexOf('function tankBoundaryRecess('),source.indexOf('function drawWalls(')),context);
test('sculpted field recess follows the shared shoulders and bowed lip at both TV sizes',()=>{
 for(const scale of [1,1.5]){
  const measured={left:312*scale,top:0,width:656*scale,height:113.59375*scale};
  const rect={x:measured.left/scale,y:0,w:measured.width/scale,h:measured.height/scale};
  const recess=context.tankBoundaryRecess(rect);assert.equal(recess.left,304);assert.equal(recess.right,976);assert.equal(recess.bottom,121.59375);assert.equal(recess.shape,'shared-glass-656x114');
  const commands=[],canvas=Object.fromEntries(['moveTo','lineTo','quadraticCurveTo','bezierCurveTo','closePath'].map(name=>[name,(...args)=>commands.push([name,...args])]));
  context.traceTankBoundary(canvas,{x:24,y:24,w:1232,h:672,r:4},recess);
  const cubics=commands.filter(c=>c[0]==='bezierCurveTo');assert.equal(cubics.length,4,'two concave shoulders and two lower corners');assert.equal(cubics.at(-1).at(-1),24,'shoulder returns to the field top without a stub');
  const lip=commands.find(c=>c[0]==='quadraticCurveTo'&&c[1]===640&&c[2]>recess.bottom);
  assert(lip,'shared quadratic lower lip');const sy=recess.bottom/114,startY=104*sy;
  assert(Math.abs((startY+2*lip[2]+lip[4])/4-recess.bottom)<1e-9,'bow midpoint follows actual header plus clearance');
  assert(lip[4]<recess.bottom,'bottom is bowed rather than a horizontal U');
  assert.equal(commands.at(-1)[0],'closePath');assert(commands.flatMap(c=>c.slice(1)).every(Number.isFinite));
 }
 const taller=context.tankBoundaryRecess({x:312,y:0,w:656,h:190});assert.equal(taller.bottom,198);
 assert.equal(context.tankBoundaryRecess({x:NaN,y:0,w:656,h:114}),null);
 assert.equal(context.tankBoundaryRecess({x:312,y:200,w:656,h:114}),null);
});
test('painted glass is inverse projected independently of the collision dock',()=>{
 const helper=source.slice(source.indexOf('function tankHeaderGlass('),source.indexOf('function tankBoundaryRecess('));
 for(const scale of [1,1.5]){
  const ctx=vm.createContext({innerWidth:1280*scale,window:{frameElement:{getBoundingClientRect:()=>({left:0,top:0,width:1280*scale})}},parent:{document:{querySelector:()=>({getBoundingClientRect:()=>({left:312*scale,top:0,width:656*scale,height:114*scale})})}},canvas:{getBoundingClientRect:()=>({left:0,top:0})},tankCamera:{x:0,y:0,scale}});
  vm.runInContext(helper,ctx);const protectedCap={x:340,y:0,w:600,h:114},before=JSON.stringify(protectedCap),glass=ctx.tankHeaderGlass(protectedCap);
  assert.deepEqual(JSON.parse(JSON.stringify(glass)),{x:312,y:0,w:656,h:114});assert.equal(JSON.stringify(protectedCap),before,'collision dock stays unchanged');
 }
});
test('tank artwork preserves hull and turret without loading or drawing mascot images',()=>{
 const draws=[],context=vm.createContext({tankRig:null,window:{PartyArt:{sprite:()=>true,draw:(...args)=>draws.push(args)}}});
 vm.runInContext(source.slice(source.indexOf('function tankArtwork('),source.indexOf('function drawTank(')),context);
 const canvas={drawImage(){throw Error('Mascot overlay must not be drawn');}};
 assert(context.tankArtwork(canvas,19,'#ff5b67'));assert.deepEqual(draws.map(d=>d[1]),['tank-body','tank-turret']);
 assert.equal(draws[0][6].color,'#ff5b67');assert(!source.includes('atlas-mascots'));assert(!source.includes('tankPilot'));
});
