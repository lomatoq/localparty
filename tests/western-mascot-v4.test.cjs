'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'public/assets/gameplay/generated/western-mascot-rig-v4.js'),'utf8');
async function boot(fail=false){
 const requests=[];
 class Image{set src(value){requests.push(value);const bytes=fs.readFileSync(path.join(root,'public',value));this.naturalWidth=bytes.readUInt32BE(16);this.naturalHeight=bytes.readUInt32BE(20);queueMicrotask(()=>this.onload());}decode(){return Promise.resolve();}}
 const window={};window.parent=window;window.fetch=async value=>{requests.push(value);if(fail)throw Error('realistic unavailable metadata');return{ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,'public',value),'utf8'))};};
 const context=vm.createContext({window,Image,fetch:window.fetch,matchMedia:()=>({matches:false})});vm.runInContext(source,context);await new Promise(resolve=>setImmediate(resolve));return{api:window.WesternMascotRigV4,requests};
}
test('actual v4 helper runtime: every palette, pose, direction and shot returns finite draw commands and muzzle/contact',async()=>{
 const {api,requests}=await boot();assert.equal(api.ready,true);assert.equal(requests.length,3);
 let cases=0;for(const color of ['#a8ed38','#9851e7','#ff786b','#39cada'])for(const early of [false,true])for(const fall of [0,.5,1])for(const shotAge of [0,80,240,Infinity])for(const flip of [1,-1]){
  const images=[],g={globalAlpha:1,save(){},restore(){},translate(...v){v.forEach(n=>assert(Number.isFinite(n)));},scale(...v){v.forEach(n=>assert(Number.isFinite(n)));},rotate(v){assert(Number.isFinite(v));},drawImage(image,...v){assert(image.naturalWidth>0);v.forEach(n=>assert(Number.isFinite(n)));images.push(image);}};
  const options={x:600,y:500,height:240,color,early,fall,shotAge,flip},m=api.draw(g,options),p=api.measure(options);for(const n of [m.x,m.y,m.angle,p.shadow.x,p.shadow.y,p.shadow.rx,p.shadow.ry])assert(Number.isFinite(n));assert.equal(p.shadow.y,501);assert.equal(m.pose,fall===1?'dead':early?'startled':'idle');assert(images.length>=2);assert(images[0].naturalWidth===api.metadata.size.arm.w,'separate arm draws before body');cases++;
 }
 assert.equal(cases,192);
});
test('missing metadata preserves unavailable helper fallback instead of partially drawing a rig',async()=>{const {api}=await boot(true);assert.equal(api.ready,false);assert.equal(api.draw({}, {x:0,y:0,height:240}),null);assert.equal(api.measure({x:0,y:0,height:240}),null);});
