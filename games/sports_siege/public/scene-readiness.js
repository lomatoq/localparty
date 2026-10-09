
// Prepare initial scene resources without a match/effect update, camera change
// or clock advance. The normal waiting/playing loop remains untouched.
// The game iframe is visibility:hidden while waiting. GPU preparation must not
// require a child paint/RAF callback which the browser may park with that canvas.
const nextFrame=()=>new Promise(resolve=>setTimeout(resolve,16));
const phase=()=>{try{return top.HeyPalsTVMotion?.diagnostics()?.state||'startup';}catch{return 'unavailable';}};
export function trackInitialSceneAssets(manager){
 const start=manager.itemStart,end=manager.itemEnd,error=manager.itemError;
 let pending=0,started=0,failed=0,released=false;const waiters=[];
 const wrappedStart=function(...args){pending++;started++;return start.apply(this,args);};
 const wrappedEnd=function(...args){const result=end.apply(this,args);pending=Math.max(0,pending-1);if(!pending)waiters.splice(0).forEach(resolve=>resolve());return result;};
 const wrappedError=function(...args){failed++;return error.apply(this,args);};
 manager.itemStart=wrappedStart;manager.itemEnd=wrappedEnd;manager.itemError=wrappedError;
 return {stats:()=>({pending,started,failed}),async settled(){
   for(;;){if(released)return;if(pending)await new Promise(resolve=>waiters.push(resolve));await nextFrame();if(released||!pending)return;}
  },release(){if(released)return;released=true;if(manager.itemStart===wrappedStart)manager.itemStart=start;if(manager.itemEnd===wrappedEnd)manager.itemEnd=end;if(manager.itemError===wrappedError)manager.itemError=error;waiters.splice(0).forEach(resolve=>resolve());}};
}
export async function prepareInitialScene(stage,assets,staticCPU,options={}){
 const proof={status:'pending'};stage.initialScenePreparation=proof;
 if(options.diagnostics){proof.events=[];proof.simulationAdvanced=false;window.__partyInitialScenePreparation=proof;}
 const event=(name,extra={})=>{if(proof.events)proof.events.push({name,at:performance.now(),curtain:phase(),matchPhase:stage.state?.phase||'unknown',clock:stage.clock,...extra});};
 const alive=()=>{if(stage.disposed){proof.status='disposed';return false;}if(stage.renderer.getContext().isContextLost()){proof.status='context-lost';event('context-lost');return false;}return true;};
 let fence=null,timer;const gl=stage.renderer.getContext(),requestedBudget=Number(options.deadlineMs),budget=Number.isFinite(requestedBudget)&&requestedBudget>0?requestedBudget:10000;
 const deadline=new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error('Initial scene preparation exceeded '+budget+'ms')),budget));deadline.catch(()=>{});
 const bounded=promise=>Promise.race([promise,deadline]);
 try{
  event('static-scene-pools-resize-cpu',{start:staticCPU.start,end:staticCPU.end,duration:staticCPU.end-staticCPU.start});
  event('assets-wait',assets.stats());await bounded(assets.settled());if(!alive())return;
  event('assets-settled',assets.stats());
  const compileAt=performance.now();await bounded(stage.renderer.compileAsync?.(stage.scene,stage.camera)||Promise.resolve());if(!alive())return;
  event('compile-complete',{duration:performance.now()-compileAt});const clock=stage.clock,renderAt=performance.now();
  stage.renderer.render(stage.scene,stage.camera);if(proof.events)proof.simulationAdvanced=stage.clock!==clock;
  event('first-render-returned',{duration:performance.now()-renderAt});
  if(typeof gl.fenceSync==='function'){
   fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);if(!fence)throw new Error('Initial frame GPU fence unavailable');gl.flush();
   let polls=0;for(;;){if(!alive())return;const status=gl.clientWaitSync(fence,0,0);polls++;if(status===gl.ALREADY_SIGNALED||status===gl.CONDITION_SATISFIED){event('first-frame-gpu-complete',{polls});break;}if(status===gl.WAIT_FAILED)throw new Error('Initial frame GPU fence failed');await bounded(nextFrame());}
  }else{await bounded(nextFrame());event('first-frame-submitted',{gpuCompletionVerified:false});}
  proof.status='ready';event('preparation-ready',assets.stats());
 }catch(error){proof.status='failed';proof.failure=String(error);event('preparation-failed');throw error;}
 finally{clearTimeout(timer);if(fence)gl.deleteSync(fence);assets.release();if(stage.disposed)proof.status='disposed';}
}
