'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/frame-diagnostics.js'),'utf8');
function fixture(){let callback;const reports=[],events={};const window={webkit:{messageHandlers:{partyFrameStats:{postMessage:report=>reports.push(report)}}}};
 const document={hidden:false,addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(source,{window,top:window,document,location:{pathname:'/tv'},Uint32Array,requestAnimationFrame:fn=>callback=fn});
 return {reports,document,visibility:()=>events.visibilitychange(),frame:time=>callback(time)};
}
test('frame probe batches 10 seconds and records isolated stalls instead of hiding them in average FPS',()=>{
 const f=fixture();let time=1;f.frame(time);for(let i=0;i<100;i++)f.frame(time+=16);assert.equal(f.reports.length,0);
 f.frame(time+=200);while(time<10017)f.frame(time+=16);
 assert.equal(f.reports.length,1);const stats=f.reports[0];assert.equal(stats.max,200);assert.equal(stats.over100,1);assert.equal(stats.p95,16);assert(stats.fps>50&&stats.fps<63);
});
test('visibility transitions do not report a background pause as a rendering stall',()=>{
 const f=fixture();f.frame(1);f.frame(17);f.document.hidden=true;f.visibility();f.frame(20000);f.document.hidden=false;f.visibility();
 for(let time=20001;time<30100;time+=16)f.frame(time);
 assert.equal(f.reports.length,1);assert.equal(f.reports[0].max,16);assert.equal(f.reports[0].over100,0);
});
