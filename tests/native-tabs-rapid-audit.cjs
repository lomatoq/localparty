'use strict';
// Run against an opted-in Debug simulator app (PARTY_UI_AUDIT=1).
// Verifies native presentation layers, not just the destination DOM.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const device=process.env.PARTY_SIMULATOR_ID||'67ECE888-2F77-45FC-89DE-127096A509C5';
const container=execFileSync('xcrun',['simctl','get_app_container',device,'com.localparty.launcher','data'],{encoding:'utf8'}).trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let serial=0;
async function command(script='true'){
 const id=`rapid-tabs-${Date.now()}-${++serial}`,file=path.join(container,'Documents/ui-audit-command.json');
 fs.writeFileSync(file+'.tmp',JSON.stringify({id,script,surface:'menu'}));fs.renameSync(file+'.tmp',file);
 for(let n=0;n<100;n++){
  await sleep(40);
  let r;try{r=JSON.parse(fs.readFileSync(path.join(container,'Documents/ui-audit-result.json'),'utf8'));}catch(e){if(e.code==='ENOENT'||e instanceof SyntaxError)continue;throw e;}
  if(r.id!==id)continue;if(r.error)throw Error(r.error);assert(r.nativeTabs?.surfaces,'Rebuild Debug app with native tab diagnostics');return r;
 }
 throw Error('Native audit driver timed out; launch Debug simulator with SIMCTL_CHILD_PARTY_UI_AUDIT=1');
}
function opaque(r){for(const surface of r.nativeTabs.surfaces){assert.equal(surface.alpha,1,'both live WKWebViews keep canonical alpha');assert(Math.abs(surface.presentationAlpha-1)<1e-5,'no partially transparent native screen during a transition');}assert(r.nativeTabs.snapshotCount<=1,'only one owned outgoing snapshot');}
async function settled(tab){for(let n=0;n<40;n++){const r=await command();opaque(r);if(r.nativeTabs.tab===tab&&!r.nativeTabs.running&&r.nativeTabs.snapshotCount===0){assert.equal(r.nativeTabs.surfaces.filter(s=>!s.hidden).length,1);for(const s of r.nativeTabs.surfaces){assert.equal(s.translationX,0);assert.equal(s.presentationTranslationX,0);}return;}await sleep(50);}throw Error(`Tab ${tab} failed to settle`);}
(async()=>{
 const sequences=[['controller','host','games','controller','host'],['games','host','games','host','controller'],['games','controller','games','controller','games']];
 let animatedSamples=0;
 for(const tabs of sequences){
  await command(`(${JSON.stringify(tabs)}).forEach((tab,i)=>setTimeout(()=>window.webkit.messageHandlers.partyShell.postMessage({type:'native-tab',tab}),i*65));true`);
  for(let i=0;i<12;i++){const r=await command();opaque(r);if(r.nativeTabs.running)animatedSamples++;await sleep(25);}
  await settled(tabs.at(-1));
 }
 assert(animatedSamples>0,'sampled real in-progress native animation');
 console.log(`PASS rapid native tabs:15 taps in3 bursts, ${animatedSamples} animated samples, no alpha ghosting and canonical final surfaces`);
})().catch(e=>{console.error(e);process.exitCode=1;});
