// Keep camera preview local even while the game's TV uses an external display.
export function configureLocalVideo(video){
 video.muted=true;video.autoplay=true;video.playsInline=true;
 video.disableRemotePlayback=true;
 video.setAttribute('webkit-playsinline','');
 video.setAttribute('x-webkit-airplay','deny');
}
export function createCameraPreview(video){
 const canvas=document.createElement('canvas');canvas.id='cameraPreview';
 canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;z-index:1';
 video.after(canvas);
 const ctx=canvas.getContext('2d',{alpha:false});let lastTime=-1,lastAt=-Infinity;
 return {
  reset(){canvas.hidden=true;lastTime=-1;lastAt=-Infinity;},
  draw(now){
   if(!ctx||video.readyState<2||!video.videoWidth||!video.videoHeight||video.currentTime===lastTime||now-lastAt<32)return;
   const scale=Math.min(1,1280/Math.max(video.videoWidth,video.videoHeight));
   const w=Math.round(video.videoWidth*scale),h=Math.round(video.videoHeight*scale);
   if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
   ctx.drawImage(video,0,0,w,h);lastTime=video.currentTime;lastAt=now;canvas.hidden=false;
  }
 };
}
