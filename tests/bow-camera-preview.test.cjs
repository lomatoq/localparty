const test=require('node:test'),assert=require('node:assert/strict');
test('camera stays inline and cannot route its preview to AirPlay',async()=>{
 const {configureLocalVideo}=await import('../games/bow_club/public/src/camera-preview.mjs');
 const attrs={},video={setAttribute(k,v){attrs[k]=v;}};configureLocalVideo(video);
 assert.equal(video.playsInline,true);assert.equal(video.muted,true);assert.equal(video.disableRemotePlayback,true);assert.equal(attrs['x-webkit-airplay'],'deny');
});
test('preview renders independently of tracking, bounds size/rate and clears on reset',async()=>{
 const {createCameraPreview}=await import('../games/bow_club/public/src/camera-preview.mjs');
 let draws=0;const canvas={style:{},getContext:()=>({drawImage(){draws++;}})};
 const previous=global.document;global.document={createElement:()=>canvas};
 try{
  const video={after(c){assert.equal(c,canvas);},readyState:2,videoWidth:2160,videoHeight:3840,currentTime:1};
  const preview=createCameraPreview(video);preview.reset();assert.equal(canvas.hidden,true);
  preview.draw(0);assert.equal(draws,1);assert.equal(canvas.width,720);assert.equal(canvas.height,1280);assert.equal(canvas.hidden,false);
  video.currentTime=2;preview.draw(16);assert.equal(draws,1);preview.draw(34);assert.equal(draws,2);
  preview.draw(80);assert.equal(draws,2);preview.reset();assert.equal(canvas.hidden,true);
 }finally{global.document=previous;}
});
