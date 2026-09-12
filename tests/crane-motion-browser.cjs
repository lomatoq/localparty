// Reuse the real two-player/drop flow, with timed renderer instrumentation.
const fs=require('fs'),Module=require('module');
let source=fs.readFileSync(require.resolve('./crane-art-results.cjs'),'utf8');
source=source.replace('for(let i=0;i<2;i++){await hf.waitForFunction',`const timing=await hf.evaluate(()=>new Promise(resolve=>{const original=draw,samples=[];draw=function(now){const start=performance.now();original(now);samples.push(performance.now()-start);};setTimeout(()=>{draw=original;samples.sort((a,b)=>a-b);resolve({frames:samples.length,drawMedianMs:samples[Math.floor(samples.length*.5)],drawP95Ms:samples[Math.floor(samples.length*.95)],backing:[canvas.width,canvas.height],snapshots:sceneSnapshots.length});},2500);}));assert(timing.frames>60);console.log('CRANE_RENDER',JSON.stringify(timing));for(let i=0;i<2;i++){await hf.waitForFunction`);
source=source.replace('(804+camera)*scale','(40+.92*(830+camera))*scale').replace('(state.beamY+camera-43)*scale','(40+.92*(state.beamY+camera-70))*scale');
const test=new Module(__filename,module);test.filename=__filename;test.paths=module.paths;test._compile(source,__filename);
