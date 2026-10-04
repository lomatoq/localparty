// A planar homography has no radial-distortion model. Prefer the ordinary rear
// lens only when its label is unambiguous; never force ultra-wide or minimum zoom.
export function primaryRearCamera(devices){
 return devices.find(d=>d.kind==='videoinput'&&/back|rear|environment|задн|тыл|tyln|arrière|rück|traser|traseir/i.test(d.label||'')&&!/front|user|передн|фронт|przedn|avant|ultra|сверх|ультра|tele|télé|телефото|dual|double|doble|dupl|tripl|zweifach|dreifach|doppel|podwójn|potrójn|двойн|тройн|подвійн|потрійн|0[.,]5/i.test(d.label||''))||null;
}
export function resizeCapture(canvas,width,height){
 if(canvas.width!==width)canvas.width=width;
 if(canvas.height!==height)canvas.height=height;
}
// Use the controller orientation, not the physical device's potentially stale
// orientation angle (the native Bow controller can already be landscape).
export function cameraFrameConstraints(width,height){
 const landscape=width>height;return {width:{ideal:landscape?1280:720},height:{ideal:landscape?720:1280},aspectRatio:{ideal:landscape?16/9:9/16}};
}
export async function fitCameraOrientation(track,width,height){
 if(!track?.applyConstraints||track.readyState==='ended')return false;
 const settings=track.getSettings?.()||{},wantLandscape=width>height;
 if(settings.width&&settings.height&&(settings.width>settings.height)===wantLandscape)return true;
 try{await track.applyConstraints(cameraFrameConstraints(width,height));return true;}catch{return false;}
}
export async function acquireRearCamera(media,{isCurrent=()=>true,width=720,height=1280}={}){
 const devices=async()=>{try{return await media.enumerateDevices();}catch{return [];}};
 const stop=stream=>stream?.getTracks?.().forEach(track=>track.stop());
 const live=stream=>{if(isCurrent())return stream;stop(stream);throw new DOMException('Camera request cancelled','AbortError');};
 const primary=primaryRearCamera(await devices());let unavailable=null;
 if(!isCurrent())throw new DOMException('Camera request cancelled','AbortError');
 const video={facingMode:{exact:'environment'},...cameraFrameConstraints(width,height),frameRate:{ideal:30,max:30}};
 if(primary?.deviceId)video.deviceId={exact:primary.deviceId};
 let stream;
 try{stream=await media.getUserMedia({audio:false,video});}
 catch(error){if(!primary||!['OverconstrainedError','NotFoundError'].includes(error.name))throw error;unavailable=primary.deviceId;delete video.deviceId;stream=await media.getUserMedia({audio:false,video});}
 live(stream);
 // Fresh WKWebView origins expose no lens labels before capture permission.
 // Safari may already know them. Resolve the ordinary rear lens after permission
 // too, but stop the bootstrap stream BEFORE reopening: iOS shares capture.
 const permitted=primaryRearCamera(await devices()),track=stream.getVideoTracks?.()[0];
 live(stream);
 if(permitted?.deviceId&&permitted.deviceId!==unavailable&&track&&track.getSettings?.()?.deviceId!==permitted.deviceId){
  const currentLabel=track.label||'';
  if(track.getSettings?.()?.deviceId||!currentLabel||!primaryRearCamera([{kind:'videoinput',label:currentLabel}])){
   stop(stream);stream=null;
   if(!isCurrent())throw new DOMException('Camera request cancelled','AbortError');
   try{stream=await media.getUserMedia({audio:false,video:{...video,deviceId:{exact:permitted.deviceId}}});}
   catch(error){
    if(!isCurrent())throw new DOMException('Camera request cancelled','AbortError');
    if(!['OverconstrainedError','NotFoundError','NotReadableError'].includes(error.name))throw error;
    // A lens can disappear or reject exact selection after permission. Keep a
    // usable rear preview; the bootstrap was already stopped, never overlapped.
    const fallback={...video};delete fallback.deviceId;stream=await media.getUserMedia({audio:false,video:fallback});
   }
   live(stream);
  }
 }
 // A physical wide lens has natural 1x geometry; do not use a virtual camera's
 // minimum zoom (often ultra-wide), or invent constraints unsupported by WebKit.
 const selected=stream.getVideoTracks?.()[0],zoom=selected?.getCapabilities?.()?.zoom;
 if(selected&&primaryRearCamera([{kind:'videoinput',label:selected.label}])&&zoom?.min<=1&&zoom?.max>=1){
  try{await selected.applyConstraints({advanced:[{zoom:1}]});}catch{}
 }
 return live(stream);
}
export async function playLiveVideo(video,isCurrent,{timeout=8000,now=()=>performance.now(),wait=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 let playError=null;Promise.resolve(video.play()).catch(error=>{playError=error;});
 const start=now(),initial=video.currentTime;
 while(isCurrent()){
  if(playError)throw playError;
  const track=video.srcObject?.getVideoTracks()[0];
  if(track?.readyState==='ended')throw Error('Камера остановилась. Откройте её ещё раз.');
  if(video.readyState>=2&&video.videoWidth>0&&video.currentTime!==initial&&!track?.muted)return true;
  if(now()-start>=timeout)throw Error('Нет изображения с камеры. Откройте камеру ещё раз или используйте сенсорный пульт.');
  await wait(80);
 }
 return false;
}
export const VISION_TIMEOUT={loading:20000,firstFrame:8000,frame:4000,maxRestarts:2};
