'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(process.env.QA_HOST_SOURCE||path.resolve(__dirname,'../public/native-shell/host.js'),'utf8');
const start=source.indexOf('  const entranceHolds=new WeakMap();'),end=source.indexOf('  function close(id) {',start);
assert(start>=0&&end>start,'native host entrance ownership helper is present');
const helper=source.slice(start,end);
function fixture(){
 let queue=[],resumed=false,animations=[];
 const dialog={open:true,classList:{contains:()=>resumed},getAnimations:()=>animations};
 const animation=(name,iterations=1)=>({name,effect:{target:dialog,getTiming:()=>({iterations})},playState:'running',currentTime:19,pauses:0,plays:0,pause(){this.pauses++;this.playState='paused';},play(){this.plays++;this.playState='running';}});
 const context=vm.createContext({WeakMap,Set,requestAnimationFrame:f=>queue.push(f)});vm.runInContext(helper+';globalThis.hold=holdEntranceUntilPainted;',context);
 const step=()=>{const batch=queue;queue=[];batch.forEach(f=>f());};
 const drain=()=>{for(let i=0;queue.length&&i<10;i++)step();assert.equal(queue.length,0);};
 return {dialog,animation,hold:()=>context.hold(dialog),step,drain,setAnimations:value=>animations=value,setResumed:value=>resumed=value};
}
test('native first entrance retains the original subtree and three rendering opportunities',()=>{
 const f=fixture(),sheet=f.animation('sheet'),energy=f.animation('child-energy',Infinity);f.setAnimations([sheet,energy]);f.hold();
 assert.equal(sheet.currentTime,1);assert.equal(energy.currentTime,1);f.step();assert.equal(sheet.plays+energy.plays,0);f.step();assert.equal(sheet.plays+energy.plays,0);f.step();assert.equal(sheet.plays,1);assert.equal(energy.plays,1);
});
test('resumed sheet preserves its live clock and releases only surviving previously held effects',()=>{
 const f=fixture(),old=f.animation('old-sheet'),child=f.animation('child-energy',Infinity),flight=f.animation('canceled-flight');f.setAnimations([old,child,flight]);f.hold();
 old.playState='idle';f.setResumed(true);const live=f.animation('resume-waapi'),backdrop=f.animation('resume-backdrop');f.setAnimations([child,live,backdrop]);f.hold();
 assert.equal(child.plays,1);assert.equal(child.playState,'running');assert.equal(old.plays+flight.plays,0);assert.equal(live.pauses+backdrop.pauses,0);assert.equal(live.currentTime,19);f.drain();assert.equal(child.plays,1);assert.equal(old.plays+flight.plays+live.plays+backdrop.plays,0);
});
test('a later first entrance owns its callbacks and a closed dialog never restarts held effects',()=>{
 const f=fixture(),old=f.animation('old');f.setAnimations([old]);f.hold();old.playState='idle';const newer=f.animation('new');f.setAnimations([newer]);f.hold();f.drain();assert.equal(old.plays,0);assert.equal(newer.plays,1);
 const closing=f.animation('closing');f.setAnimations([closing]);f.hold();f.dialog.open=false;f.drain();assert.equal(closing.plays,0);
});
