'use strict';
// Bounded/error contracts for the production initial scene helper. Not a WebGL/GPU test.
const fs=require('node:fs'),assert=require('node:assert/strict'),test=require('node:test');
const source=fs.readFileSync('games/sports_siege/public/scene-readiness.js','utf8');
const moduleReady=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function context(options={}){
 global.window={};global.top={HeyPalsTVMotion:{diagnostics:()=>({state:'revealing'})}};global.requestAnimationFrame=callback=>setTimeout(()=>callback(performance.now()),0);
 let lost=!!options.lost,draws=0,deletes=0;const gl={isContextLost:()=>lost,SYNC_GPU_COMMANDS_COMPLETE:1,ALREADY_SIGNALED:2,CONDITION_SATISFIED:3,WAIT_FAILED:4,clientWaitSync:()=>options.stuck?0:2,flush(){},deleteSync(){deletes++;}};
 if(!options.noFence)gl.fenceSync=()=>({});
 const manager={itemStart(){},itemEnd(){},itemError(){}},original=Object.fromEntries(['itemStart','itemEnd','itemError'].map(key=>[key,manager[key]]));
 const stage={clock:0,scene:{},camera:{},state:{phase:'waiting'},renderer:{getContext:()=>gl,compileAsync:()=>options.compileReject?Promise.reject(new Error('compile fault')):Promise.resolve(),render(){draws++;if(options.loseOnDraw)lost=true;}}};
 const checkRestored=()=>{for(const key of Object.keys(original))assert.equal(manager[key],original[key]);};
 return {manager,stage,checkRestored,draws:()=>draws,deletes:()=>deletes};
}
test('initial render waits for assets and does not advance waiting simulation',async()=>{
 const {trackInitialSceneAssets,prepareInitialScene}=await moduleReady,c=context(),assets=trackInitialSceneAssets(c.manager);c.manager.itemStart('texture');
 const pending=prepareInitialScene(c.stage,assets,{start:1,end:2},{deadlineMs:80,diagnostics:true});await pause(5);assert.equal(c.draws(),0);c.manager.itemEnd('texture');await pending;
 assert.equal(c.draws(),1);assert.equal(c.stage.clock,0);assert.equal(window.__partyInitialScenePreparation.status,'ready');assert.equal(c.deletes(),1);c.checkRestored();
});
test('texture load error completes accounting and still permits fallback render',async()=>{
 const {trackInitialSceneAssets,prepareInitialScene}=await moduleReady,c=context(),assets=trackInitialSceneAssets(c.manager);c.manager.itemStart('missing');c.manager.itemError('missing');c.manager.itemEnd('missing');await prepareInitialScene(c.stage,assets,{start:1,end:2},{deadlineMs:80,diagnostics:true});
 assert.equal(assets.stats().failed,1);assert.equal(c.draws(),1);assert.equal(window.__partyInitialScenePreparation.status,'ready');c.checkRestored();
});
test('missing asset response has a bounded rejection and restores loader hooks',async()=>{
 const {trackInitialSceneAssets,prepareInitialScene}=await moduleReady,c=context(),assets=trackInitialSceneAssets(c.manager);c.manager.itemStart('never');await assert.rejects(prepareInitialScene(c.stage,assets,{start:1,end:2},{deadlineMs:80,diagnostics:true}),/exceeded/);assert.equal(c.draws(),0);assert.equal(window.__partyInitialScenePreparation.status,'failed');c.checkRestored();
});
test('compile error rejects promptly without an unprepared draw',async()=>{
 const {trackInitialSceneAssets,prepareInitialScene}=await moduleReady,c=context({compileReject:true}),assets=trackInitialSceneAssets(c.manager);await assert.rejects(prepareInitialScene(c.stage,assets,{start:1,end:2},{deadlineMs:80,diagnostics:true}),/compile fault/);assert.equal(c.draws(),0);c.checkRestored();
});
test('stuck GPU fence rejects within budget and deletes synchronization object',async()=>{
 const {trackInitialSceneAssets,prepareInitialScene}=await moduleReady,c=context({stuck:true}),assets=trackInitialSceneAssets(c.manager);await assert.rejects(prepareInitialScene(c.stage,assets,{start:1,end:2},{deadlineMs:80,diagnostics:true}),/exceeded/);assert.equal(c.deletes(),1);c.checkRestored();
});
test('context loss exits and no-fence branch labels its limited verification',async()=>{
 const {trackInitialSceneAssets,prepareInitialScene}=await moduleReady,c=context({loseOnDraw:true}),assets=trackInitialSceneAssets(c.manager);await prepareInitialScene(c.stage,assets,{start:1,end:2},{deadlineMs:80,diagnostics:true});assert.equal(window.__partyInitialScenePreparation.status,'context-lost');c.checkRestored();
 const legacy=context({noFence:true}),legacyAssets=trackInitialSceneAssets(legacy.manager);await prepareInitialScene(legacy.stage,legacyAssets,{start:1,end:2},{deadlineMs:80,diagnostics:true});assert.equal(window.__partyInitialScenePreparation.status,'ready');assert.equal(window.__partyInitialScenePreparation.events.find(e=>e.name==='first-frame-submitted').gpuCompletionVerified,false);legacy.checkRestored();
});
test('production preparation retains only status without opt-in diagnostics',async()=>{
 const {trackInitialSceneAssets,prepareInitialScene}=await moduleReady,c=context(),assets=trackInitialSceneAssets(c.manager);await prepareInitialScene(c.stage,assets,{start:1,end:2},{deadlineMs:80});
 assert.deepEqual(c.stage.initialScenePreparation,{status:'ready'});assert.equal(window.__partyInitialScenePreparation,undefined);assert.equal(c.stage.clock,0);c.checkRestored();
});
