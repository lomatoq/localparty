'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const ready=import('data:text/javascript;base64,'+fs.readFileSync('public/sports-motion.js').toString('base64'));
async function trace(options={},run){
 const {SportsSensors,FreeMotionThrow}=await ready,original=globalThis.performance;let now=0,allowed=true;
 const events=new Map(),states=[],shots=[],samples=[],gesture=new FreeMotionThrow();
 const host={isSecureContext:true,DeviceMotionEvent:{},screen:{orientation:{angle:options.screen||0}},addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n),...options.host};
 globalThis.performance={now:()=>now};const sensors=new SportsSensors({host,onStatus:s=>states.push(s),onSample:s=>{samples.push(s);const shot=gesture.feed(s,allowed);if(shot)shots.push(shot);}});
 const motion=(force=0,lateral=0,spin=0)=>{
  now+=33;const upright=options.upright;
  const acceleration=upright?{x:lateral,y:0,z:-force}:{x:lateral,y:force,z:0};
  const gravity=upright?{x:lateral,y:9.81,z:-force}:{x:lateral,y:force,z:9.81};
  events.get('devicemotion')?.({timeStamp:now,acceleration:options.gravityOnly?null:options.partial?{x:null,y:force,z:null}:acceleration,accelerationIncludingGravity:options.noGravity?null:gravity,rotationRate:options.noGyro?null:{alpha:(upright?-spin:0)+(options.yawBias||0),beta:0,gamma:upright?0:spin}});
 };
 try{await sensors.enable();await run({sensors,gesture,host,events,states,shots,samples,motion,setAllowed:v=>allowed=v,jump:ms=>now+=ms,orientation:(alpha=0,beta=0,gamma=0)=>events.get('deviceorientation')?.({timeStamp:now,alpha,beta,gamma}),settle:()=>{for(let i=0;i<35;i++)motion();},flick:(force=12,side=0,spin=0)=>{for(let i=0;i<12;i++)motion(i<6?force:0,i<6?side:0,i<6?spin:0);}});}finally{sensors.stop();globalThis.performance=original;}
}
for(const [name,options] of [['linear-only',{noGravity:true,noGyro:true}],['partial axes',{partial:true,noGravity:true,noGyro:true}],['gravity-only',{gravityOnly:true,noGyro:true}],['upright gravity',{upright:true,gravityOnly:true}],['missing orientation',{}]])test(`${name}: quiet calibration then one no-hold throw, no phantom spin`,async()=>{
 await trace(options,({settle,gesture,flick,shots,sensors})=>{settle();assert(gesture.armed);assert.equal(sensors.status,'ready');flick();assert.equal(shots.length,1);assert(shots[0].power>0);assert.equal(shots[0].angle,0);assert.equal(shots[0].spin,0);});
});
test('null-alpha tilt arms and slow full orientation does not interrupt a fresh throw',async()=>{
 await trace({},({orientation,motion,gesture,flick,shots})=>{orientation(null);for(let i=0;i<35;i++)motion();assert(gesture.armed);flick(12,2,80);assert.equal(shots.length,1);assert(shots[0].angle>0&&shots[0].spin>0);});
 await trace({},({orientation,motion,gesture,shots})=>{orientation();for(let i=0;i<35;i++){if(i%20===0)orientation();motion();}assert(gesture.armed);for(let i=0;i<12;i++)motion(i<6?12:0);assert.equal(shots.length,1);});
});
test('gravity-only rest never throws; a bump and another turn cannot launch',async()=>{
 await trace({gravityOnly:true},({settle,motion,shots,setAllowed,flick})=>{settle();for(let i=0;i<100;i++)motion();assert.equal(shots.length,0);motion(20);for(let i=0;i<12;i++)motion();assert.equal(shots.length,0);setAllowed(false);settle();flick();assert.equal(shots.length,0);});
});
test('sensor interruption discards partial impulse before quiet rearming',async()=>{
 await trace({},({settle,motion,jump,shots,flick})=>{settle();motion(12);motion(12);jump(400);motion(12);for(let i=0;i<12;i++)motion();assert.equal(shots.length,0);settle();flick();assert.equal(shots.length,1);});
});
test('orientation denial cannot veto permitted motion; denied motion, insecure and missing API never run',async()=>{
 await trace({host:{DeviceMotionEvent:{requestPermission:async()=> 'granted'},DeviceOrientationEvent:{requestPermission:async()=> 'denied'}}},({settle,sensors,shots,flick})=>{settle();assert(sensors.ready);flick();assert.equal(shots.length,1);});
 for(const [host,status] of [[{DeviceMotionEvent:{requestPermission:async()=> 'denied'}},'denied'],[{isSecureContext:false},'insecure'],[{DeviceMotionEvent:undefined},'unavailable']])await trace({host},({sensors,events,states})=>{assert.equal(sensors.status,status);assert.equal(sensors.running,false);assert.equal(events.size,0);assert.equal(states.at(-1),status);});
});
test('old permission result after stop cannot reattach sensors',async()=>{
 const {SportsSensors}=await ready;let grant;const events=new Map(),host={DeviceMotionEvent:{requestPermission:()=>new Promise(r=>grant=r)},addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n)};
 const sensor=new SportsSensors({host,onStatus(){},onSample(){}}),pending=sensor.enable();sensor.stop();grant('granted');await pending;assert.equal(events.size,0);assert.equal(sensor.running,false);
});

test('relative attitude keeps twelve straight throws centered under quiet gyro bias',async()=>{
 await trace({yawBias:4},({settle,flick,shots})=>{for(let i=0;i<12;i++){settle();flick();assert.equal(shots.length,i+1);assert.equal(shots[i].angle,0,'straight throw '+i);assert.equal(shots[i].spin,0);}});
});
