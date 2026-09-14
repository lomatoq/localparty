'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const load=()=>import('data:text/javascript;base64,'+fs.readFileSync(path.join(__dirname,'../games/afterparty/public/motion.js')).toString('base64'));
test('camera keeps the whole projectile and landing area within the safe frame at all aspects',async()=>{const m=await load();for(const mode of ['bowling','curling'])for(const aspect of [.45,.75,1,4/3,16/9,21/9,3.5])for(const x of [-2,0,2])for(const z of [2,7,13,17,22,25,28]){
 const s={state:'rolling',ball:{p:{x,y:.235,z}},stones:[{x,z}]},plan=m.cameraPlan(mode,s,false,aspect);
 for(const point of m.focusPoints(mode,s)){const [u,v,d]=m.projectPoint(plan,point,aspect);assert.ok(Math.abs(u)<=.84001&&v<=.62001&&v>=-.78001&&d>.59,JSON.stringify({mode,aspect,x,z,u,v,d}));}
}});
test('framing correction protects lagging camera positions during a follow transition',async()=>{const m=await load();for(const mode of ['bowling','curling']){const old=m.cameraPlan(mode,{}),s={state:'rolling',ball:{p:{x:1,y:.3,z:24}},stones:[{x:1,z:24}]};const points=m.focusPoints(mode,s),fixed=m.fitCamera(old,points,1);for(const p of points){const [x,y,z]=m.projectPoint(fixed,p,1);assert.ok(Math.abs(x)<=.841&&y<=.621&&y>=-.781&&z>0);}}});
test('frame budget responds with bounded hysteresis, not a resolution oscillation each frame',async()=>{const {FrameBudget}=await load(),b=new FrameBudget();for(let i=0;i<200;i++)b.sample(45,i*33);assert.ok(b.scale<1&&b.scale>=.58);const scale=b.scale;for(let i=0;i<10;i++)b.sample(15,6600+i*16);assert.equal(b.scale,scale);for(let i=0;i<1000;i++)b.sample(15,7000+i*16);assert.ok(b.scale<=1&&b.scale>=scale);});
