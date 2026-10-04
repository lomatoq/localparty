const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('obsolete startup finally cannot unlock a newer pending camera; cancellation and errors unlock their own request',async()=>{
 const source=fs.readFileSync('games/bow_club/public/phone.js','utf8'),stop=source.slice(source.indexOf('let cameraStartup='),source.indexOf('function result(')),start=source.slice(source.indexOf('async function startCamera('),source.indexOf('function startTouch('));
 const elements=new Map(),pending=[],video={srcObject:null},context={generation:0,mode:null,tracking:null,stable:0,worker:null,workerReady:false,workerBusy:false,workerTimer:null,stream:null,video,filter:{reset(){}},stopGyro(){},startGyro(){},cancel(){},join(){},clearTimeout(){},visionDebug:{},visionLog(){},startVisionWorker(){},window:{isSecureContext:true},navigator:{mediaDevices:{getUserMedia(){}}},document:{body:{classList:{remove(){}}}},$(id){if(!elements.has(id))elements.set(id,{});return elements.get(id);},acquireRearCamera(){return new Promise((resolve,reject)=>pending.push({resolve,reject}));},playLiveVideo:async()=>true};
 context.cameraPreview={reset(){}};vm.createContext(context);vm.runInContext(stop+start,context);
 const first=vm.runInContext('startCamera()',context);vm.runInContext('stopCamera()',context);assert.equal(elements.get('start').disabled,false);
 const second=vm.runInContext('startCamera()',context);let stopped=0;pending[0].resolve({getTracks:()=>[{stop(){stopped++;}}]});await first;assert.equal(stopped,1);assert.equal(elements.get('start').disabled,true,'stale finally must not unlock newer capture');
 pending[1].reject(Object.assign(Error('denied'),{name:'NotAllowedError'}));await second;assert.equal(elements.get('start').disabled,false,'current failure cleans up and unlocks');assert.equal(context.mode,null);
 const third=vm.runInContext('startCamera()',context);vm.runInContext('stopCamera()',context);const fourth=vm.runInContext('startCamera()',context);pending[2].reject(Error('obsolete failure'));await third;assert.equal(elements.get('start').disabled,true);
 const live={getTracks:()=>[{stop(){stopped++;}}]};pending[3].resolve(live);await fourth;assert.equal(context.stream,live);assert.equal(context.mode,'camera');assert.equal(elements.get('start').disabled,false);vm.runInContext('stopCamera()',context);assert.equal(context.stream,null);assert.equal(stopped,2);
});
test('complete camera entrypoint parses as browser ES module; guarded error handling stays inside startup',()=>{
 const {spawnSync}=require('node:child_process'),source=fs.readFileSync('games/bow_club/public/phone.js','utf8');
 const parsed=spawnSync(process.execPath,['--input-type=module','--check'],{input:source,encoding:'utf8'});assert.equal(parsed.status,0,parsed.stderr);
 const init=source.slice(source.indexOf('try{bow='),source.indexOf("$('name').value"));assert.doesNotMatch(init,/request|visionDebug|return/);
 const start=source.slice(source.indexOf('async function startCamera('),source.indexOf('function startTouch('));assert.match(start,/catch\(e\)\{if\(request!==generation\)return;visionDebug.error/);
});
test('camera opens only one capture session, including unknown pre-permission labels',async()=>{
 const {acquireRearCamera}=await import('../games/bow_club/public/src/camera-policy.mjs');
 for(const label of ['', 'Back Camera']){let calls=0;const stream={};const media={enumerateDevices:async()=>[{kind:'videoinput',deviceId:'rear',label}],getUserMedia:async options=>{calls++;assert.equal(options.video.facingMode.exact,'environment');assert.equal(!!options.video.deviceId,!!label);return stream;}};assert.equal(await acquireRearCamera(media),stream);assert.equal(calls,1);}
 const source=fs.readFileSync('games/bow_club/public/phone.js','utf8');assert.doesNotMatch(source,/preferPrimaryCamera/);assert.match(source,/video.hidden=false;.*playLiveVideo/);
});
test('camera readiness requires progressing unmuted frames, bounds black preview and supports cancellation',async()=>{
 const {playLiveVideo}=await import('../games/bow_club/public/src/camera-policy.mjs');let clock=0;const track={readyState:'live',muted:false},video={play:()=>Promise.resolve(),currentTime:0,readyState:2,videoWidth:720,srcObject:{getVideoTracks:()=>[track]}};
 const options={timeout:240,now:()=>clock,wait:async ms=>{clock+=ms;}};
 await assert.rejects(playLiveVideo(video,()=>true,options),/Нет изображения/);
 clock=0;options.wait=async ms=>{clock+=ms;video.currentTime+=.08;};assert.equal(await playLiveVideo(video,()=>true,options),true);
 track.muted=true;clock=0;await assert.rejects(playLiveVideo(video,()=>true,options),/Нет изображения/);
 assert.equal(await playLiveVideo(video,()=>false,options),false);
 track.readyState='ended';await assert.rejects(playLiveVideo(video,()=>true,options),/остановилась/);
});
test('unavailable exact lens falls back before any stream exists; denial never retries',async()=>{
 const {acquireRearCamera}=await import('../games/bow_club/public/src/camera-policy.mjs');let calls=0;
 const media={enumerateDevices:async()=>[{kind:'videoinput',label:'Back Camera',deviceId:'old'}],getUserMedia:async options=>{calls++;if(options.video.deviceId)throw Object.assign(Error('stale'),{name:'OverconstrainedError'});return 'live';}};
 assert.equal(await acquireRearCamera(media),'live');assert.equal(calls,2);
 calls=0;media.getUserMedia=async()=>{calls++;throw Object.assign(Error('denied'),{name:'NotAllowedError'});};await assert.rejects(acquireRearCamera(media),/denied/);assert.equal(calls,1);
});
test('ordinary rear lens is preferred, ultra-wide/virtual/front lenses are never forced',async()=>{
 const {primaryRearCamera}=await import('../games/bow_club/public/src/camera-policy.mjs');const devices=['Front Camera','Back Ultra Wide Camera','Back Triple Camera','Back Camera','Back Telephoto Camera'].map((label,i)=>({kind:'videoinput',label,deviceId:String(i)}));
 assert.equal(primaryRearCamera(devices).deviceId,'3');assert.equal(primaryRearCamera(devices.filter(d=>d.deviceId!=='3')),null);assert.equal(primaryRearCamera([{kind:'videoinput',label:'',deviceId:'unknown'}]),null);
});
test('capture canvas backing store is retained between equally sized frames',async()=>{
 const {resizeCapture}=await import('../games/bow_club/public/src/camera-policy.mjs');let width=0,height=0,writes=0;const canvas={get width(){return width},set width(v){writes++;width=v},get height(){return height},set height(v){writes++;height=v}};
 resizeCapture(canvas,720,1280);assert.equal(writes,2);for(let i=0;i<60;i++)resizeCapture(canvas,720,1280);assert.equal(writes,2);resizeCapture(canvas,1280,720);assert.equal(writes,4);
});
test('slow or failed vision worker restarts within a bounded session budget; obsolete replies are ignored',async()=>{
 const {VISION_TIMEOUT}=await import('../games/bow_club/public/src/camera-policy.mjs');const source=fs.readFileSync('games/bow_club/public/phone.js','utf8');const fn=source.slice(source.indexOf('function startVisionWorker('),source.indexOf('async function startCamera(')).replace("new URL('./src/tracking-worker.mjs',import.meta.url)","'tracking-worker'");
 const workers=[],timers=new Map();let tid=0,results=0;const context={VISION_TIMEOUT,workerTimer:null,workerReady:false,workerBusy:false,workerFrames:0,workerRestarts:0,worker:null,generation:1,mode:'camera',tracking:{},stable:3,filter:{reset(){}},visionDebug:{},visionLog(){},tell(){},$(){return{dataset:{}}},result(){results++},setTimeout(fn,ms){timers.set(++tid,{fn,ms});return tid},clearTimeout(id){timers.delete(id)},Worker:class{constructor(){workers.push(this)}terminate(){this.terminated=true}}};vm.createContext(context);vm.runInContext(fn+';startVisionWorker(1)',context);
 assert.equal(timers.get(context.workerTimer).ms,20000);const first=workers[0];first.onmessage({data:{ready:true,engine:'opencv'}});assert.equal(context.workerReady,true);first.recover('slow frame');assert(first.terminated);assert.equal(workers.length,2);assert.equal(context.tracking,null);first.onmessage({data:{result:{},at:1}});assert.equal(results,0);
 workers[1].onmessage({data:{ready:true,engine:'opencv'}});workers[1].onmessage({data:{result:{},at:2}});assert.equal(results,1);workers[1].recover('timeout');assert.equal(workers.length,3);workers[2].recover('timeout');assert.equal(workers.length,3);assert.equal(context.worker,null);assert.equal(context.visionDebug.engine,'fallback');
 assert.match(source,/workerFrames\?VISION_TIMEOUT.frame:VISION_TIMEOUT.firstFrame/);assert.doesNotMatch(source,/drawOverlay\.outline|caps\.zoom\.min/);assert.match(source,/now-tracking\.at>320/,'fresh visual lock is still required');
});
test('first permission reveals primary lens: bootstrap stops before wide opens and wide zoom resets to 1x',async()=>{
 const {acquireRearCamera}=await import('../games/bow_club/public/src/camera-policy.mjs');let enumerations=0,active=0,maximum=0;const events=[];
 const devices=[{kind:'videoinput',label:'Back Telephoto Camera',deviceId:'tele'},{kind:'videoinput',label:'Back Camera',deviceId:'wide'}];
 const make=(id,label)=>{active++;maximum=Math.max(maximum,active);let live=true;const track={label,getSettings:()=>({deviceId:id,zoom:3}),getCapabilities:()=>({zoom:{min:1,max:5}}),applyConstraints:async value=>events.push(['zoom',value.advanced[0].zoom]),stop(){if(live){live=false;active--;events.push(['stop',id]);}}};return {getTracks:()=>[track],getVideoTracks:()=>[track]};};
 const media={enumerateDevices:async()=>++enumerations===1?devices.map(d=>({...d,label:'',deviceId:''})):devices,getUserMedia:async options=>{const id=options.video.deviceId?.exact||'tele';events.push(['open',id]);return make(id,devices.find(d=>d.deviceId===id).label);}};
 const stream=await acquireRearCamera(media);assert.equal(stream.getVideoTracks()[0].getSettings().deviceId,'wide');assert.deepEqual(events,[['open','tele'],['stop','tele'],['open','wide'],['zoom',1]]);assert.equal(maximum,1);assert.equal(active,1);stream.getTracks()[0].stop();assert.equal(active,0);
});
test('post-permission cancellation closes bootstrap without reopening; cancelled replacement also closes',async()=>{
 const {acquireRearCamera}=await import('../games/bow_club/public/src/camera-policy.mjs');
 for(const cancelAt of ['enumerate','replacement']){let current=true,enumerations=0,calls=0,stops=0;
 const make=id=>{const track={label:id==='wide'?'Back Camera':'Back Telephoto Camera',getSettings:()=>({deviceId:id}),stop(){stops++;}};return {getTracks:()=>[track],getVideoTracks:()=>[track]};};
 const media={enumerateDevices:async()=>{if(++enumerations===1)return [];if(cancelAt==='enumerate')current=false;return [{kind:'videoinput',label:'Back Camera',deviceId:'wide'}];},getUserMedia:async options=>{calls++;if(calls===2)current=false;return make(options.video.deviceId?.exact||'tele');}};
 await assert.rejects(acquireRearCamera(media,{isCurrent:()=>current}),{name:'AbortError'});assert.equal(calls,cancelAt==='enumerate'?1:2);assert.equal(stops,calls);
 }
});
test('ordinary active wide lens is kept; unknown and virtual lenses never force zoom',async()=>{
 const {acquireRearCamera,primaryRearCamera}=await import('../games/bow_club/public/src/camera-policy.mjs');assert(primaryRearCamera([{kind:'videoinput',label:'Kamera tylna',deviceId:'pl'}]));
 for(const label of ['Back Camera','Back Triple Camera','']){let opens=0,zooms=0;const track={label,getSettings:()=>({deviceId:'same'}),getCapabilities:()=>({zoom:{min:.5,max:8}}),applyConstraints:async()=>{zooms++;},stop(){}};const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};const media={enumerateDevices:async()=>[{kind:'videoinput',label,deviceId:'same'}],getUserMedia:async()=>{opens++;return stream;}};assert.equal(await acquireRearCamera(media),stream);assert.equal(opens,1);assert.equal(zooms,label==='Back Camera'?1:0);}
});
test('localized compound camera labels never become the ordinary physical rear lens',async()=>{
 const {primaryRearCamera}=await import('../games/bow_club/public/src/camera-policy.mjs');
 for(const label of ['Caméra arrière triple','Câmera traseira tripla','Cámara trasera doble','Rückseitige Dreifachkamera','Kamera tylna potrójna','Задняя тройная камера'])assert.equal(primaryRearCamera([{kind:'videoinput',deviceId:'compound',label}]),null,label);
});
test('a lens rejected after permission reopens a usable environment camera sequentially; denial does not retry',async()=>{
 const {acquireRearCamera}=await import('../games/bow_club/public/src/camera-policy.mjs');
 for(const errorName of ['OverconstrainedError','NotFoundError','NotReadableError','NotAllowedError']){let calls=0,enumerations=0,active=0,maximum=0,stops=0;const make=()=>{active++;maximum=Math.max(maximum,active);const track={label:'',getSettings:()=>({deviceId:'default'}),stop(){active--;stops++;}};return {getTracks:()=>[track],getVideoTracks:()=>[track]};};const media={enumerateDevices:async()=>++enumerations===1?[]:[{kind:'videoinput',label:'Back Camera',deviceId:'missing'}],getUserMedia:async options=>{calls++;if(options.video.deviceId)throw Object.assign(Error(errorName),{name:errorName});return make();}};
 if(errorName==='NotAllowedError'){await assert.rejects(acquireRearCamera(media),{name:errorName});assert.equal(calls,2);assert.equal(active,0);}else{const stream=await acquireRearCamera(media);assert.equal(calls,3);assert.equal(active,1);stream.getTracks()[0].stop();}assert.equal(maximum,1);assert.equal(stops,errorName==='NotAllowedError'?1:2);
 }
});
