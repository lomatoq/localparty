'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../games/tanks/public/host.js'),'utf8');
const context=vm.createContext({});vm.runInContext(source.slice(source.indexOf('function tankBoundaryRecess('),source.indexOf('function drawWalls(')),context);
test('rounded U follows actual cap projection with eight-unit clearance at both TV sizes',()=>{
 for(const scale of [1,1.5]){
  const measured={left:340*scale,top:0,width:600*scale,height:113.59375*scale};
  const rect={x:measured.left/scale,y:0,w:measured.width/scale,h:measured.height/scale};
  const recess=context.tankBoundaryRecess(rect);assert.equal(recess.left,332);assert.equal(recess.right,948);assert.equal(recess.bottom,121.59375);assert.equal(recess.radius,30);
  const commands=[],canvas=Object.fromEntries(['moveTo','lineTo','quadraticCurveTo','closePath'].map(name=>[name,(...args)=>commands.push([name,...args])]));
  context.traceTankBoundary(canvas,{x:24,y:24,w:1232,h:672,r:4},recess);
  assert(commands.some(c=>c[0]==='quadraticCurveTo'&&c[1]===332&&c[2]===121.59375&&c[3]===362&&c[4]===121.59375));
  assert(commands.some(c=>c[0]==='lineTo'&&c[1]===918&&c[2]===121.59375));
  assert.equal(commands.at(-1)[0],'closePath');assert(commands.flatMap(c=>c.slice(1)).every(Number.isFinite));
 }
 const taller=context.tankBoundaryRecess({x:340,y:0,w:600,h:190});assert.equal(taller.bottom,198);
 assert.equal(context.tankBoundaryRecess({x:NaN,y:0,w:600,h:114}),null);
 assert.equal(context.tankBoundaryRecess({x:340,y:200,w:600,h:114}),null);
});
test('tank artwork preserves hull and turret without loading or drawing mascot images',()=>{
 const draws=[],context=vm.createContext({tankRig:null,window:{PartyArt:{sprite:()=>true,draw:(...args)=>draws.push(args)}}});
 vm.runInContext(source.slice(source.indexOf('function tankArtwork('),source.indexOf('function drawTank(')),context);
 const canvas={drawImage(){throw Error('Mascot overlay must not be drawn');}};
 assert(context.tankArtwork(canvas,19,'#ff5b67'));assert.deepEqual(draws.map(d=>d[1]),['tank-body','tank-turret']);
 assert.equal(draws[0][6].color,'#ff5b67');assert(!source.includes('atlas-mascots'));assert(!source.includes('tankPilot'));
});
