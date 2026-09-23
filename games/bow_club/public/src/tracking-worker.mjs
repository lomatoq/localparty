// Classic worker so the bundled OpenCV UMD/WASM build stays completely offline.
let tracker;
(async()=>{
 try{
  importScripts('../vendor/opencv.js');
  const engine=await cv,{HybridTracker}=await import('./hybrid-tracker.mjs');
  tracker=new HybridTracker(engine);self.postMessage({ready:true,engine:'opencv'});
 }catch(error){
  const {MarkerTracker}=await import('./marker-tracker.mjs');tracker=new MarkerTracker();self.postMessage({ready:true,engine:'fallback',error:String(error)});
 }
})();
self.onmessage=e=>{if(!tracker)return;const {pixels,width,height,at,gyro}=e.data;try{const start=performance.now(),result=tracker.detect(new Uint8ClampedArray(pixels),width,height,at,gyro);self.postMessage({result,at,decodedCount:tracker.decodedCount,ms:performance.now()-start});}catch(error){self.postMessage({result:null,at,error:String(error)});}};
