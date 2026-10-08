'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function make(){
 const events={},calls={uploads:0,draws:0},data={};let buffer,projection;
 const gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:()=>1,getUniformLocation:()=>1,createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),bufferData(_,v){calls.uploads++;buffer=new Float32Array(v);},bufferSubData(_,offset,v){calls.uploads++;assert(buffer,'A backing allocation must precede bufferSubData');assert(v.byteLength+offset<=buffer.byteLength,'Never upload outside the GL allocation');buffer.set(v,offset/4);},uniformMatrix4fv(_,__,v){projection=Array.from(v);},drawArrays(_,__,count){calls.draws++;data.vertices=Array.from(buffer.slice(0,count*9));data.projection=projection;data.count=count;}},{get:(o,k)=>k in o?o[k]:()=>{}});
 const canvas={width:0,height:0,dataset:{},getContext:()=>gl,addEventListener(t,f){events[t]=f;}};
 const context={Float32Array,devicePixelRatio:3,performance:{now:()=>100},Math};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../games/bow_club/public/src/mini3d.mjs'),'utf8').replace(/export /g,'')+'\nthis.Bow3D=Bow3D;this.Mini3D=Mini3D;',context);
 return{bow:new context.Bow3D(canvas),Mini:context.Mini3D,calls,events,canvas,data};
}
const exact=h=>{assert.deepEqual(h.data.vertices,Array.from(new Float32Array(h.bow.vertices)),'GPU prefix matches authored geometry exactly');assert.equal(h.data.count,h.bow.vertices.length/9);};
test('stable Bow mesh is retained; pull, hand, shot and resize preserve exact GPU geometry',()=>{
 const h=make();h.bow.frame(393,780,0,0,1/60,'right');exact(h);const vertices=Array.from(h.bow.vertices),firstUpload=h.calls.uploads;
 for(let i=0;i<60;i++)h.bow.frame(393,780,0,i*16,1/60,'right');assert.equal(h.calls.uploads,firstUpload,'Settled geometry is not uploaded again');assert.deepEqual(Array.from(h.bow.vertices),vertices);assert.equal(h.calls.draws,61,'Normal rendering remains active');
 for(const hand of['right','left'])for(const pull of[.15,.48,1,0]){h.bow.frame(393,780,pull,1000,1/60,hand);exact(h);}
 h.bow.shoot();for(let i=0;i<20;i++){h.bow.frame(393,780,0,1200+i*16,1/60,'left');exact(h);}
 const uploads=h.calls.uploads,oldProjection=h.data.projection;h.bow.frame(780,393,0,1600,1/60,'left');exact(h);assert.equal(h.calls.uploads,uploads);assert.notDeepEqual(h.data.projection,oldProjection);assert.equal(h.canvas.width,1170);assert.equal(h.canvas.height,590);
});
test('context restoration reuploads retained Bow geometry; generic empty and resized meshes stay inside allocation',()=>{
 const h=make();h.bow.frame(393,780,0,0,1/60);const uploads=h.calls.uploads,draws=h.calls.draws;h.events.webglcontextlost({preventDefault(){}});h.bow.frame(393,780,.5,16,1/60);assert.equal(h.calls.draws,draws);h.events.webglcontextrestored();h.bow.frame(393,780,.5,32,1/60);exact(h);assert.equal(h.calls.uploads,uploads+1,'Restored buffer receives complete retained geometry');
 h.bow.clear();h.bow.render(320,568);exact(h);assert.equal(h.data.count,0);h.bow.tri([0,0,0],[1,0,0],[0,1,0],[1,0,0]);h.bow.render(320,568);exact(h);assert.equal(h.data.count,3);h.bow.clear();h.bow.render(320,568);exact(h);
});
test('hidden Bow advances recoil without mesh or GPU work and resumes current visible geometry',()=>{
 const h=make();h.bow.frame(393,780,0,0,1/60);const uploads=h.calls.uploads,draws=h.calls.draws,previous=Array.from(h.bow.vertices);h.bow.shoot();
 for(let i=0;i<30;i++)h.bow.frame(393,780,.5,100+i*16,1/60,'left',false);
 assert.equal(h.calls.uploads,uploads);assert.equal(h.calls.draws,draws);assert.deepEqual(Array.from(h.bow.vertices),previous,'Hidden mesh is retained');assert.equal(h.bow.kick,0,'Hidden recoil decays on the same clock');
 h.bow.frame(393,780,.5,1000,1/60,'left',true);exact(h);assert.equal(h.calls.draws,draws+1);assert.notDeepEqual(Array.from(h.bow.vertices),previous,'Resume rebuilds the latest pull and hand');
 h.events.webglcontextlost({preventDefault(){}});h.events.webglcontextrestored();h.bow.frame(393,780,.5,1100,1/60,'left',false);assert.equal(h.calls.draws,draws+1);h.bow.frame(393,780,.5,1200,1/60,'left',true);exact(h);assert.equal(h.calls.draws,draws+2,'Context restored while hidden uploads when visible');
});
