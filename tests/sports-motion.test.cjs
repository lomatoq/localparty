const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const moduleReady=import('data:text/javascript;base64,'+fs.readFileSync('public/sports-motion.js').toString('base64'));
const sample=(at,a=0,r=0,yaw=0,roll=0)=>({at,acceleration:{x:a,y:0,z:0},rotation:{x:0,y:r,z:0},quaternion:{w:Math.cos(yaw*Math.PI/360)*Math.cos(roll*Math.PI/360),x:-Math.sin(yaw*Math.PI/360)*Math.sin(roll*Math.PI/360),y:Math.cos(yaw*Math.PI/360)*Math.sin(roll*Math.PI/360),z:Math.sin(yaw*Math.PI/360)*Math.cos(roll*Math.PI/360)}});
test('hold neutral, acceleration power, relative wrap aim and wrist spin; release consumes attempt',async()=>{
 const {MotionThrow}=await moduleReady,slow=new MotionThrow(),fast=new MotionThrow();
 for(const [trace,acceleration]of[[slow,4],[fast,16]]){
  assert.equal(trace.begin(sample(100,0,0,359,20),100),true);
  for(let t=130;t<=430;t+=30)trace.add(sample(t,acceleration,80,3,42));
 }
 const a=slow.finish(440,-.4,.1),b=fast.finish(440,-.4,.1);
 assert(a.valid&&b.valid);assert(b.power>a.power);assert(a.angle>0&&a.angle<.06);
 assert.equal(a.position,-.4);assert(Math.abs(a.spin-.5)<.005);assert.equal(slow.finish(450,0,0),null);
});
test('idle, one bump, stale start/end, long hold and interrupted traces cannot throw',async()=>{
 const {MotionThrow}=await moduleReady;
 const trace=new MotionThrow();assert.equal(trace.begin(sample(0),300),false);
 trace.begin(sample(0),0);for(let t=30;t<400;t+=30)trace.add(sample(t));assert.equal(trace.finish(400,0,0),null);
 trace.begin(sample(500),500);trace.add(sample(530,20));assert.equal(trace.finish(690,0,0),null);
 trace.begin(sample(700),700);for(let t=730;t<1000;t+=30)trace.add(sample(t,10));assert.equal(trace.finish(1300,0,0),null);
 trace.begin(sample(1500),1500);trace.add(sample(1800,20));assert.equal(trace.finish(1810,0,0),null);
 trace.begin(sample(2000),2000);for(let t=2030;t<=6200;t+=30)trace.add(sample(t,10));assert.equal(trace.finish(6210,0,0),null);
 trace.begin(sample(7000),7000);trace.cancel();assert.equal(trace.finish(7400,0,0),null);
});
test('shake needs alternating pulses, gates own rolling/energy, and decays on stale samples',async()=>{
 const {ShakeSweep}=await moduleReady,shake=new ShakeSweep();let t=100;
 const feed=(a,n=4,allowed=true)=>{for(let i=0;i<n;i++){t+=33;shake.add(sample(t,a),allowed);}};
 feed(0);feed(12);assert.equal(shake.active(t),false);feed(0,6);feed(12);assert.equal(shake.active(t),true);
 assert.equal(shake.active(t+251),false);feed(12,4,false);assert.equal(shake.active(t),false);
 feed(0,6);feed(12);assert.equal(shake.active(t),false);
});
function fakeHost(native=false){
 const events=new Map(),sent=[];const host={addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n),DeviceMotionEvent:{requestPermission:()=>Promise.resolve('granted')},DeviceOrientationEvent:{requestPermission:()=>Promise.resolve('granted')}};
 if(native)host.webkit={messageHandlers:{partyShell:{postMessage:m=>sent.push(m)}}};
 return{host,events,sent};
}
test('permission starts both requests within enable, denied permission gracefully stops',async()=>{
 const {SportsSensors}=await moduleReady,{host,events}=fakeHost(),calls=[],states=[];
 host.DeviceMotionEvent.requestPermission=()=>{calls.push('motion');return Promise.resolve('granted');};
 host.DeviceOrientationEvent.requestPermission=()=>{calls.push('orientation');return Promise.resolve('granted');};
 host.DeviceMotionEvent.requestPermission=()=>{calls.push('motion');return Promise.resolve('denied');};
 const sensors=new SportsSensors({host,onSample:()=>assert.fail('denied must not emit'),onStatus:s=>states.push(s)});
 const enabled=sensors.enable();assert.deepEqual(calls,['motion','orientation']);await enabled;
 assert.deepEqual(states,['waiting','denied']);assert.equal(sensors.ready,false);assert.equal(events.size,0);sensors.stop();
});
test('native readiness requires first fresh valid sample, session and source monotonicity reject late/duplicates',async()=>{
 const {SportsSensors}=await moduleReady,{host,sent}=fakeHost(true),states=[],samples=[];
 const sensors=new SportsSensors({host,onSample:s=>samples.push(s),onStatus:s=>states.push(s)});await sensors.enable();
 assert.deepEqual(states,['waiting']);const session=sent.at(-1).session;
 const payload={...sample(0,3,30),session,sourceTime:1};assert.equal(host.__partySportsMotion({...payload,session:session-1}),false);assert.equal(samples.length,0);
 assert.equal(host.__partySportsMotion(payload),true);assert.deepEqual(states,['waiting','ready']);assert(sensors.fresh());
 host.__partySportsMotion(payload);assert.equal(samples.length,1);sensors.stop();host.__partySportsMotion({...payload,sourceTime:2});assert.equal(samples.length,1);
 assert.equal(sent.at(-1).type,'sports-motion-stop');
});
test('nullable browser data ignored, getter-based gravity fallback removes resting gravity',async()=>{
 const {SportsSensors}=await moduleReady,{host,events}=fakeHost(),samples=[];
 const sensors=new SportsSensors({host,onSample:s=>samples.push(s),onStatus:()=>{}});await sensors.enable();
 events.get('devicemotion')({acceleration:{x:null,y:null,z:null}});assert.equal(samples.length,0);
 events.get('deviceorientation')({alpha:0,beta:0,gamma:0});
 const gravity=Object.create({x:0,y:0,z:9.80665});
 events.get('devicemotion')({accelerationIncludingGravity:gravity});events.get('devicemotion')({accelerationIncludingGravity:gravity});
 assert.equal(samples.length,1);assert.equal(Math.hypot(...Object.values(samples[0].acceleration)),0);sensors.stop();
});
test('browser Z-X-Y and native quaternion traces produce equivalent relative aim/spin in portrait and landscape',async()=>{
 const {orientationQuaternion,screenQuaternion,MotionThrow}=await moduleReady;
 // Independent quaternion expansion of the documented browser Z-X-Y rotation.
 const native=(a,b,g)=>{const z=a*Math.PI/360,x=b*Math.PI/360,y=g*Math.PI/360,cz=Math.cos(z),sz=Math.sin(z),cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y);return{w:cz*cx*cy-sz*sx*sy,x:cz*sx*cy-sz*cx*sy,y:cz*cx*sy+sz*sx*cy,z:sz*cx*cy+cz*sx*sy};};
 for(const screen of [0,90,-90,180]){
  const browser=new MotionThrow(),core=new MotionThrow();
  const neutral={...sample(100),quaternion:orientationQuaternion(350,65,12,screen)};
  browser.begin(neutral,100);core.begin({...neutral,quaternion:screenQuaternion(native(350,65,12),screen)},100);
  for(let t=130;t<=430;t+=30){const s=sample(t,8,100);browser.add({...s,quaternion:orientationQuaternion(2,73,29,screen)});core.add({...s,quaternion:screenQuaternion(native(2,73,29),screen)});}
  const a=browser.finish(440,0,.2),b=core.finish(440,0,.2);assert(a&&b);for(const key of ['angle','spin','power'])assert(Math.abs(a[key]-b[key])<1e-10);
 }
});
test('no valid events falls back without claiming readiness',async()=>{
 const {SportsSensors}=await moduleReady,{host}=fakeHost(),states=[];
 const sensors=new SportsSensors({host,onSample:()=>assert.fail('no events'),onStatus:s=>states.push(s)});await sensors.enable();
 sensors.started=performance.now()-2300;await new Promise(r=>setTimeout(r,130));
 assert.deepEqual(states,['waiting','unavailable']);assert.equal(sensors.ready,false);sensors.stop();
});
test('left/right heading is consistent flat and upright; heading does not add spin, independent wrist twist remains',async()=>{
 const {motionDirection,multiplyQuaternion,orientationQuaternion}=await moduleReady;
 const turn=(axis,degrees)=>({x:axis==='x'?Math.sin(degrees*Math.PI/360):0,y:axis==='y'?Math.sin(degrees*Math.PI/360):0,z:axis==='z'?Math.sin(degrees*Math.PI/360):0,w:Math.cos(degrees*Math.PI/360)});
 for(const pitch of [0,60,90])for(const degrees of [-15,15]){
  const neutral=orientationQuaternion(0,pitch,0),current=multiplyQuaternion(turn('z',degrees),neutral),d=motionDirection(neutral,current);
  assert(Math.abs(d.heading-degrees*Math.PI/180)<1e-10);assert(Math.abs(d.twist)<1e-10);
 }
 for(const pitch of [0,60]){
  const neutral=orientationQuaternion(0,pitch,0),current=multiplyQuaternion(neutral,turn('y',20)),d=motionDirection(neutral,current);
  assert(Math.abs(d.heading)<1e-10);assert(Math.abs(d.twist-20*Math.PI/180)<1e-10);
 }
});
test('permission dialog blur can keep pending request, explicit stop rejects late grant',async()=>{
 const {SportsSensors}=await moduleReady,{host,events}=fakeHost();let grant;const promise=new Promise(r=>grant=r);
 host.DeviceMotionEvent.requestPermission=()=>promise;const states=[];const sensors=new SportsSensors({host,onSample:()=>{},onStatus:s=>states.push(s)});
 const enabling=sensors.enable();assert.equal(sensors.permissionPending,true);
 // Controller preserves this pending path on dialog blur; pagehide/explicit Swipe stops it.
 sensors.stop();grant('granted');await enabling;assert.equal(events.size,0);assert.equal(sensors.ready,false);assert.deepEqual(states,['waiting']);
});
test('valid acceleration works without orientation; stopped motion remains an honest fallback',async()=>{
 const {SportsSensors}=await moduleReady,{host,events}=fakeHost(),states=[],samples=[];
 const sensors=new SportsSensors({host,onSample:s=>samples.push(s),onStatus:s=>states.push(s)});await sensors.enable();
 const motion={acceleration:{x:0,y:0,z:0},rotationRate:{alpha:0,beta:0,gamma:0}};
 events.get('devicemotion')(motion);assert.equal(sensors.ready,true);assert.equal(samples[0].attitudeBasis,'browser-relative');
 events.get('deviceorientation')({alpha:null,beta:0,gamma:0});events.get('devicemotion')(motion);assert.equal(sensors.ready,true);
 sensors.sample.at=performance.now()-1100;await new Promise(r=>setTimeout(r,130));
 assert.equal(states.at(-1),'unavailable');assert.equal(sensors.ready,false);sensors.stop();
});

test('native delivery acknowledgement and lifecycle diagnostics contain no sensor vectors',async()=>{
 const {SportsSensors}=await moduleReady,{host,sent}=fakeHost(true),events=[];
 const sensors=new SportsSensors({host,onSample:()=>{},onStatus:()=>{},onDiagnostic:e=>events.push(e)});await sensors.enable();
 const session=sent.at(-1).session,payload={...sample(0,12,120),session,sourceTime:1};
 assert.equal(host.__partySportsMotion({...payload,quaternion:null}),false);
 assert.equal(host.__partySportsMotion(payload),true);assert.equal(host.__partySportsMotion(payload),false);
 sensors.stop();assert.equal(host.__partySportsMotion({...payload,sourceTime:2}),false);
 assert.deepEqual(events.map(e=>e.event),['enable','ready','stop']);
 for(const event of events){assert(!('acceleration'in event));assert(!('rotation'in event));assert(!('quaternion'in event));}
 assert.equal(events.at(-1).received,1);
});

test('continuous reversing shakes sweep without gaps; stopping and disallowed turns stop sweeping',async()=>{
 const {ShakeSweep}=await moduleReady;
 for(const hz of [2,4,6]){
  const shake=new ShakeSweep();let active=0;
  for(let at=1000;at<2500;at+=16){const x=8*Math.sin((at-1000)/1000*2*Math.PI*hz);if(shake.add({at,acceleration:{x,y:0,z:0}},true))active++;}
  assert(active>40,`continuous ${hz} Hz should sweep`);
  assert.equal(shake.active(3000),false);
  assert.equal(shake.add({at:3016,acceleration:{x:10,y:0,z:0}},false),false);
 }
 const still=new ShakeSweep();
 for(let at=1000;at<2200;at+=16)assert.equal(still.add({at,acceleration:{x:1,y:.3,z:.2}},true),false);
});
