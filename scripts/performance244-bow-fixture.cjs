'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const dir=require('node:path').resolve(__dirname,'..');
function harness(file){
 const events={},calls={arrays:0,allocatedBytes:0,bufferData:0,bufferDataBytes:0,bufferSubData:0,bufferSubDataBytes:0,draws:0,vertices:0},uploads=[],draws=[];let stored,projection;
 const GL=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:()=>1,getUniformLocation:()=>1,createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),bufferData(_,data){calls.bufferData++;calls.bufferDataBytes+=typeof data==='number'?data:data.byteLength;if(typeof data==='number')stored=new Float32Array(data/4);else stored=new Float32Array(data);},bufferSubData(_,offset,data){calls.bufferSubData++;calls.bufferSubDataBytes+=data.byteLength;stored.set(data,offset/4);},uniformMatrix4fv(_,__,data){projection=Array.from(data);},drawArrays(_,__,count){calls.draws++;draws.push({count,hash:crypto.createHash('sha256').update(Buffer.from(stored.buffer,0,count*9*4)).digest('hex'),projection});},}, {get(o,k){return k in o?o[k]:()=>{};}});
 const canvas={width:0,height:0,dataset:{},getContext:()=>GL,addEventListener(t,f){events[t]=f;}};
 const Typed=new Proxy(Float32Array,{construct(T,args){const v=new T(...args);calls.arrays++;calls.allocatedBytes+=v.byteLength;return v;}});
 const src=fs.readFileSync(file,'utf8').replace(/export /g,'')+'\nthis.Bow3D=Bow3D;this.Mini3D=Mini3D;';const context={Float32Array:Typed,devicePixelRatio:3,performance:{now:()=>100},Math};vm.createContext(context);vm.runInContext(src,context);const bow=new context.Bow3D(canvas),oldVertex=bow.vertex;bow.vertex=function(...args){calls.vertices++;return oldVertex.apply(this,args);};
 return{bow,calls,draws,events,canvas,context};
}
const baseline=harness(dir+'/.localparty-build/perf244/canvas-before/games/bow_club/public/src/mini3d.mjs');
const after=harness(dir+'/games/bow_club/public/src/mini3d.mjs');
const sequence=[];for(let i=0;i<60;i++)sequence.push([393,780,0,i*16,1/60,'right']);for(let i=0;i<30;i++)sequence.push([393,780,i/30,(i+60)*16,1/60,'right']);for(let i=0;i<20;i++)sequence.push([393,780,0,(i+90)*16,1/60,'left']);for(let i=0;i<10;i++)sequence.push([780,393,0,(i+110)*16,1/60,'left']);
for(const input of sequence){baseline.bow.frame(...input);after.bow.frame(...input);}baseline.bow.shoot();after.bow.shoot();for(let i=0;i<30;i++){const args=[393,780,0,2000+i*16,1/60,'right'];baseline.bow.frame(...args);after.bow.frame(...args);}assert.deepEqual(after.draws,baseline.draws,'Every stable, pull, hand, resize and recoil draw has identical float vertices, projection and count');
for(const h of[baseline,after]){h.events.webglcontextlost({preventDefault(){}});const count=h.draws.length;h.bow.frame(393,780,0,3000,1/60);assert.equal(h.draws.length,count);h.events.webglcontextrestored();h.bow.frame(393,780,0,3016,1/60);}
assert.deepEqual(after.draws,baseline.draws,'Restored WebGL buffers contain the same mesh');
for(const h of[baseline,after]){h.bow.clear();h.bow.tri([0,0,0],[1,0,0],[0,1,0],[1,0,0]);h.bow.render(320,568,[0,0,0,0]);h.bow.clear();h.bow.render(320,568,[0,0,0,0]);}
assert.deepEqual(after.draws,baseline.draws,'Generic mesh growth, shrinking and empty buffer keep exact drawn prefix');
const report={method:'Deterministic mocked WebGL API fixture; not GPU or physical iPhone performance',frames:sequence.length+30,before:baseline.calls,after:after.calls,draws:after.draws.length,allMeshesEquivalent:true,backing:after.canvas};delete report.backing.getContext;delete report.backing.addEventListener;fs.writeFileSync(dir+'/output/playwright/performance244/canvas/bow-fixture.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
