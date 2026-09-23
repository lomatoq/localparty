import {acquireRearCamera,playLiveVideo,resizeCapture,VISION_TIMEOUT} from './src/camera-policy.mjs';
import {Bow3D} from './src/mini3d.mjs';
import {MarkerTracker,PredictiveAim} from './src/marker-tracker.mjs';
import {BowConnection} from './net.js';
import {configureLocalVideo,createCameraPreview} from './src/camera-preview.mjs';
const $=id=>document.getElementById(id),config=window.BOW_CONFIG||{},video=$('video'),overlay=$('overlay2D'),ctx=overlay.getContext('2d');
configureLocalVideo(video);
const cameraPreview=createCameraPreview(video);cameraPreview.reset();
const profile=window.PARTY_PROFILE||{},read=(k)=>{try{return localStorage.getItem('bow:'+k);}catch{return null;}},write=(k,v)=>{try{localStorage.setItem('bow:'+k,v);}catch{}};
let id=null,token=read('token'),sequence=1,state=null,connection,mode=null,stream=null,worker=null,workerReady=false,workerBusy=false,workerTimer=null,tracking=null,stable=0,lastCapture=-Infinity,lastVideoTime=-1,lastFrame=performance.now(),generation=0,holding=false,drawAt=0,joined=false,hand=profile.hand||read('hand')||'right',offset={u:0,v:0},touchUV={u:.5,v:.5},lastStatus='',cameraRequested=false,workerRestarts=0,workerFrames=0;
const sample=document.createElement('canvas'),sampleCtx=sample.getContext('2d',{willReadFrequently:true}),filter=new PredictiveAim(),fallbackTracker=new MarkerTracker();let bow=null;
try{bow=new Bow3D($('bow'));}catch(e){$('error').textContent='3D-лук недоступен: '+e.message+'. Прицел и стрельба останутся рабочими.';}
$('name').value=profile.name||read('name')||'';if(profile.id)$('nameField').hidden=true;
const tell=text=>{$('feedback').textContent=text;clearTimeout(tell.timer);tell.timer=setTimeout(()=>{$('feedback').textContent='';},1800);};
function join(){if(!connection)return;const name=$('name').value.trim()||'Лучник';write('name',name);connection.send('join',profile.id?{partyId:profile.id,partyToken:profile.token,name:profile.name}:{token,name});}
connection=new BowConnection((type,d)=>{
 if(type==='joined'){id=d.id;token=d.token||token;if(token)write('token',token);sequence=Math.max(sequence,d.nextSeq||1);joined=true;$('setupStatus').textContent='';}
 if(type==='state'){const previous=state;state=d;if(state.paused||state.phase!=='playing'||previous&&previous.revision!==state.revision)cancel();if(previous?.revision!==state.revision){filter.reset();stable=0;}updateHUD();if(config.managed&&state.phase==='playing'&&!cameraRequested&&!mode&&window.parent?.PARTY_TEST_BOT){cameraRequested=true;startTouch();}}
 if(type==='join_error'||type==='error'){$('error').textContent=d.message;joined=false;}
 if(type==='draw-result'&&!d.ok){cancel();tell('Натяжение не принято. Проверьте трекинг и фазу матча.');}
 if(type==='shot-result'){if(d.ok){bow?.shoot();tell(d.points?'+'+d.points+' · Попадание!':'Мимо');}else tell('Стрела не выпущена: '+(d.reason||'повторите натяжение'));}
},status=>{lastStatus=status;if(status==='open'){join();}else{joined=false;cancel();$('setupStatus').textContent='Переподключение…';}});
// Inertial samples only seed the visual search; they never authorize a shot by themselves.
let gyro={x:0,y:0,z:0},gyroAt=0,gyroLast=0;
function gyroSample(x,y,z,now=performance.now()){
 if(mode!=='camera'||![x,y,z].every(Number.isFinite))return;const dt=Math.min(.06,Math.max(0,(now-gyroLast)/1000));gyroLast=now;gyroAt=now;
 gyro.x+=x*dt;gyro.y+=y*dt;gyro.z+=z*dt;
}
window.__partyBowGyro=(x,y,z)=>gyroSample(x,y,z);
window.addEventListener('devicemotion',e=>{if(window.webkit?.messageHandlers?.partyShell)return;const r=e.rotationRate;if(r)gyroSample((r.beta||0)*Math.PI/180,(r.gamma||0)*Math.PI/180,(r.alpha||0)*Math.PI/180);});
function startGyro(){gyro={x:0,y:0,z:0};gyroAt=gyroLast=0;if(window.webkit?.messageHandlers?.partyShell)window.webkit.messageHandlers.partyShell.postMessage({type:'bow-gyro-start'});else if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function')DeviceMotionEvent.requestPermission().catch(()=>{});}
function stopGyro(){window.webkit?.messageHandlers?.partyShell?.postMessage({type:'bow-gyro-stop'});gyroAt=gyroLast=0;}
const visionDebug={engine:'loading',sent:0,received:0,detected:0,accepted:0,ms:0,age:0,tags:0,points:0,error:'',frame:''};
function visionLog(event){const stats={event,...visionDebug,video:video.readyState,resolution:video.videoWidth+'x'+video.videoHeight,mode,stable,joined,phase:state?.phase,muted:stream?.getVideoTracks()[0]?.muted,track:stream?.getVideoTracks()[0]?.readyState,videoTime:video.currentTime,hidden:document.hidden};window.__bowVisionStats=stats;window.webkit?.messageHandlers?.partyShell?.postMessage({type:'bow-diagnostic',stats});}
setInterval(()=>{if(mode==='camera')visionLog('sample');},2500);
window.addEventListener('error',e=>{visionDebug.error=String(e.message).slice(0,180);visionLog('error');});
function currentAim(now=performance.now()){
 if(mode==='touch')return {u:touchUV.u,v:touchUV.v,quality:1,ageMs:0,revision:state?.revision};
 if(!tracking||stable<3||now-tracking.at>320)return null;
 const uv=filter.sample(now)||tracking.uv,u=uv.u+offset.u,v=uv.v+offset.v;if(![u,v].every(Number.isFinite)||u<0||u>1||v<0||v>1)return null;
 const quality=tracking.quality;if(quality<.6)return null;
 return {u,v,quality,ageMs:Math.max(0,now-tracking.at),revision:state?.revision};
}
function canShoot(now){const p=state?.players.find(p=>p.id===id);return joined&&state?.phase==='playing'&&!state.paused&&p?.connected&&p.shots<state.arrows&&!!currentAim(now);}
function cancel(){if(holding)connection?.send('cancel');holding=false;$('draw').classList.remove('held');}
let cameraStartup=null;
function stopCamera(showSetup=true){cameraPreview.reset();stopGyro();generation++;cameraStartup=null;$('start').disabled=false;cancel();mode=null;tracking=null;stable=0;filter.reset();worker?.terminate();worker=null;workerReady=false;clearTimeout(workerTimer);workerBusy=false;stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;if(showSetup){$('view').hidden=true;$('setup').hidden=false;} }
function result(result,at,ms){visionDebug.received++;visionDebug.ms=Math.round(ms||0);visionDebug.age=Math.round(performance.now()-at);visionDebug.tags=result?.tags?.length||0;visionDebug.points=result?.pointCount||0;if(result)visionDebug.detected++;workerBusy=false;clearTimeout(workerTimer);if(mode!=='camera')return;if(!result||performance.now()-at>320){if(!tracking||performance.now()-tracking.at>320)stable=0;return;}
 visionDebug.accepted++;tracking={...result,at,ms};$('view').dataset.tracker=result.source||'basic';stable=Math.min(10,stable+1);filter.update(result.uv,at);
}
function startVisionWorker(request){
 clearTimeout(workerTimer);workerReady=false;workerBusy=false;workerFrames=0;
 try{
  const instance=new Worker(new URL('./src/tracking-worker.mjs',import.meta.url));worker=instance;visionDebug.engine='loading';
  const fail=message=>{
   if(worker!==instance||request!==generation)return;
   clearTimeout(workerTimer);instance.terminate();worker=null;workerReady=false;workerBusy=false;tracking=null;stable=0;filter.reset();
   visionDebug.error=message;visionLog('worker-recovery');
   if(mode==='camera'&&workerRestarts++<VISION_TIMEOUT.maxRestarts)startVisionWorker(request);
   else{visionDebug.engine='fallback';tell('Базовый трекинг. Перезапусти камеру для повторной загрузки.');}
  };
  instance.onmessage=e=>{
   if(worker!==instance||request!==generation)return;
   clearTimeout(workerTimer);
   if(e.data.ready){visionDebug.engine=e.data.engine;visionDebug.error=e.data.error||'';visionLog('ready');workerReady=true;$('view').dataset.engine=e.data.engine;return;}
   workerFrames++;visionDebug.decoded=e.data.decodedCount||0;if(e.data.error){visionDebug.error=e.data.error;visionLog('processing-error');}result(e.data.result,e.data.at,e.data.ms);
  };
  instance.onerror=e=>fail(e.message||'Worker error');instance.recover=fail;
  workerTimer=setTimeout(()=>fail('Worker initialization timeout'),VISION_TIMEOUT.loading);
 }catch(error){worker=null;workerReady=false;visionDebug.engine='fallback';visionDebug.error=String(error);}
}
async function startCamera(){document.body.classList.remove('touch-mode');if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){$('error').textContent='Камера требует HTTPS с доверенным сертификатом. HTTP по Wi-Fi не подходит. Пока можно открыть обычный сенсорный пульт.';return;}
 stopCamera(false);const request=++generation;cameraStartup=request;$('start').disabled=true;$('error').textContent='';join();
 try{const acquired=await acquireRearCamera(navigator.mediaDevices);if(request!==generation){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;video.srcObject=stream;$('view').hidden=false;$('setup').hidden=true;video.hidden=false;$('touchPad').hidden=true;if(!await playLiveVideo(video,()=>request===generation))return;mode='camera';startGyro();tracking=null;stable=0;lastVideoTime=-1;lastCapture=-Infinity;offset={u:0,v:0};$('view').hidden=false;$('setup').hidden=true;$('video').hidden=false;$('touchPad').hidden=true;$('calibrate').hidden=false;
  workerRestarts=0;visionDebug.error='';visionLog('camera-start');startVisionWorker(request);
 }catch(e){if(request!==generation)return;visionDebug.error=String(e);visionLog('camera-error');$('error').textContent=e.name==='NotAllowedError'?'Доступ к камере не разрешён. Разрешите его в настройках или используйте сенсорный пульт.':('Камера: '+e.message);stopCamera();}finally{if(cameraStartup===request){cameraStartup=null;$('start').disabled=false;}}
}
function startTouch(){stopCamera(false);mode='touch';document.body.classList.add('touch-mode');join();$('setup').hidden=true;$('view').hidden=false;$('video').hidden=true;$('touchPad').hidden=false;$('calibrate').hidden=true;$('calibrationHint').textContent='Веди прицел по мини-полю';}
function capture(now){if(mode!=='camera'||worker&&!workerReady||workerBusy||video.readyState<2||video.currentTime===lastVideoTime||now-lastCapture<(worker?45:160))return;lastVideoTime=video.currentTime;lastCapture=now;const scale=Math.min(1,1280/Math.max(video.videoWidth,video.videoHeight)),w=Math.round(video.videoWidth*scale),h=Math.round(video.videoHeight*scale);if(!h)return;resizeCapture(sample,w,h);sampleCtx.drawImage(video,0,0,w,h);const pixels=sampleCtx.getImageData(0,0,w,h).data;
 if(worker){visionDebug.sent++;visionDebug.frame=w+'x'+h;workerBusy=true;workerTimer=setTimeout(()=>worker?.recover('Processing timeout'),workerFrames?VISION_TIMEOUT.frame:VISION_TIMEOUT.firstFrame);worker.postMessage({pixels:pixels.buffer,width:w,height:h,at:now,gyro:now-gyroAt<120?{...gyro,focal:/ultra|сверх/i.test(stream?.getVideoTracks()[0]?.label||'')?.48:.85}:null},[pixels.buffer]);}
 else{const started=performance.now();result(fallbackTracker.detect(pixels,w,h),now,performance.now()-started);}
}
function updateHUD(now=performance.now()){
 const p=state?.players.find(p=>p.id===id),aim=currentAim(now),lock=!!aim;
 // Keep the captured gesture alive across a brief visual dropout; release still requires a fresh aim.
 $('draw').disabled=!holding&&!canShoot(now);
 $('tracking').textContent=!joined?'Нет соединения':mode==='touch'?'Прицел пальцем':lock?'Экран найден':tracking?'Держи TV в кадре':'Наведи камеру на экран';
 $('metrics').textContent=mode==='camera'&&worker&&!workerReady?'Загружаем трекинг…':state?.paused?'Пауза':state?.phase==='results'?'Матч завершён':state?.phase!=='playing'?'Ведущий запускает матч':mode==='camera'&&tracking?'Держи экран в кадре':'Натяните и отпустите';
 $('score').textContent=p?`${p.score} очков · ${Math.max(0,(state?.arrows||10)-p.shots)} стрел`:'Подключение…';
 const drawLabel=holding?`<span>ОТПУСТИ</span><small>${lock?Math.round(Math.min(1,(now-drawAt)/800)*100)+'%':'найди экран'}</small>`:'<span>НАТЯНИ</span><small>и отпусти</small>';if($('draw').innerHTML!==drawLabel)$('draw').innerHTML=drawLabel; 
 document.body.classList.toggle('left-hand',hand==='left');$('hand').textContent=hand==='left'?'Левая рука':'Правая рука';
}
$('draw').addEventListener('pointerdown',e=>{if(!canShoot(performance.now()))return;e.preventDefault();$('draw').setPointerCapture(e.pointerId);holding=true;drawAt=performance.now();$('draw').classList.add('held');connection.send('draw',currentAim());});
$('draw').addEventListener('pointerup',e=>{if(!holding)return;e.preventDefault();const now=performance.now(),aim=currentAim(now),duration=now-drawAt;holding=false;$('draw').classList.remove('held');if(!aim||duration<180||duration>4500){connection.send('cancel');tell(duration<180?'Подержите натяжение чуть дольше':'Прицел потерян — стрела сохранена');return;}connection.send('shot',{...aim,seq:sequence++});});
for(const event of ['pointercancel','lostpointercapture'])$('draw').addEventListener(event,cancel);
$('calibrate').onclick=()=>{if(!tracking||performance.now()-tracking.at>200){tell('Сначала найдите экран');return;}const uv=filter.value||tracking.uv;offset={u:.5-uv.u,v:.5-uv.v};tell('Центр установлен');};
$('calibrationHint').textContent='Поправка прицела — кнопка «Центр»';
$('start').onclick=startCamera;$('touch').onclick=startTouch;$('back').onclick=()=>stopCamera();$('hand').onclick=()=>{hand=hand==='left'?'right':'left';write('hand',hand);};
function touch(e){const r=$('touchPad').getBoundingClientRect();touchUV={u:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),v:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};}
$('touchPad').onpointerdown=e=>{e.preventDefault();$('touchPad').setPointerCapture(e.pointerId);touch(e);};$('touchPad').onpointermove=e=>{if(e.buttons)touch(e);};
function drawOverlay(now,w,h){const dpr=Math.min(2,devicePixelRatio||1);if(overlay.width!==Math.round(w*dpr)||overlay.height!==Math.round(h*dpr)){overlay.width=Math.round(w*dpr);overlay.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const aim=currentAim(now);
 // No screen outline: fiducials stay on TV; the phone only shows the aiming reticle.
 let x=w/2,y=h/2;if(mode==='touch'){const r=$('touchPad').getBoundingClientRect();ctx.fillStyle='#cee8ed';ctx.fillRect(r.left,r.top,r.width,r.height);for(const t of state?.targets||[]){for(const [k,c]of [[1,'#fff7df'],[.78,'#347587'],[.54,'#fff7df'],[.32,'#e78154'],[.18,'#fcd967']]){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(r.left+t.u*r.width,r.top+t.v*r.height,t.r/720/(state.aspect||16/9)*r.width*k,t.r/720*r.height*k,0,0,Math.PI*2);ctx.fill();}}x=r.left+touchUV.u*r.width;y=r.top+touchUV.v*r.height;}
 ctx.strokeStyle=aim?'#d7ff8e':'#ffffffaa';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.moveTo(x-20,y);ctx.lineTo(x-6,y);ctx.moveTo(x+6,y);ctx.lineTo(x+20,y);ctx.moveTo(x,y-20);ctx.lineTo(x,y-6);ctx.moveTo(x,y+6);ctx.lineTo(x,y+20);ctx.stroke();
 if(holding){ctx.strokeStyle='#f7cd62';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,29,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,(now-drawAt)/800));ctx.stroke();}
}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;if(mode){if(mode==='camera')cameraPreview.draw(now);else cameraPreview.reset();capture(now);updateHUD(now);if(mode==='camera'&&tracking&&now-tracking.at>320)stable=0;const w=innerWidth,h=innerHeight;bow?.frame(w,h,holding?Math.min(1,(now-drawAt)/800):0,now,dt,hand);drawOverlay(now,w,h);}}
requestAnimationFrame(frame);window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();});window.addEventListener('pagehide',()=>{stopCamera();connection.close();});
