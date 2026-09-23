// A planar homography has no radial-distortion model. Prefer the ordinary rear
// lens only when its label is unambiguous; never force ultra-wide or minimum zoom.
export function primaryRearCamera(devices){
 return devices.find(d=>d.kind==='videoinput'&&/back|rear|environment|задн|тыл/i.test(d.label||'')&&!/front|user|передн|фронт|ultra|сверх|ультра|tele|телефото|dual|triple|0[.,]5/i.test(d.label||''))||null;
}
export function resizeCapture(canvas,width,height){
 if(canvas.width!==width)canvas.width=width;
 if(canvas.height!==height)canvas.height=height;
}
export async function acquireRearCamera(media){
 let primary=null;try{primary=primaryRearCamera(await media.enumerateDevices());}catch{}
 const video={facingMode:{exact:'environment'},width:{ideal:720},height:{ideal:1280},aspectRatio:{ideal:9/16},frameRate:{ideal:30,max:30}};
 // Pick from already-permitted labels before opening capture. Opening a second
 // rear stream can mute the first shared iOS capture session.
 if(primary)video.deviceId={exact:primary.deviceId};
 try{return await media.getUserMedia({audio:false,video});}
 catch(error){if(!primary||!['OverconstrainedError','NotFoundError'].includes(error.name))throw error;delete video.deviceId;return media.getUserMedia({audio:false,video});}
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
