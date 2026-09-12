const fs=require('fs'),Module=require('module');let source=fs.readFileSync(require.resolve('./crane-motion-browser.cjs'),'utf8');
let base=fs.readFileSync(require.resolve('./crane-art-results.cjs'),'utf8');
base=base.replace('for(let i=0;i<2;i++){await hf.waitForFunction',`await hf.evaluate(()=>{window.fxObserved={placement:false,miss:false};const original=drawCraneImpacts;drawCraneImpacts=function(dt){for(const e of craneImpacts){if(e.miss)window.fxObserved.miss=true;else window.fxObserved.placement=true;}original(dt);};});for(let i=0;i<2;i++){await hf.waitForFunction`);
base=base.replace("console.log('PASS two facade placements, three physical misses, results host and phone');",`const fx=await hf.evaluate(()=>window.fxObserved);assert(fx.placement&&fx.miss,JSON.stringify(fx));console.log('PASS authoritative placement and miss FX',fx);`);
base=base.replace('(804+camera)*scale','(40+.92*(830+camera))*scale').replace('(state.beamY+camera-43)*scale','(40+.92*(state.beamY+camera-70))*scale');
const test=new Module(__filename,module);test.filename=__filename;test.paths=module.paths;test._compile(base,__filename);
