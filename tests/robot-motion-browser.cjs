const fs=require('fs'),vm=require('vm');process.env.UX_GAMES='taprace,carryball';
let source=fs.readFileSync('tests/game-art-browser.cjs','utf8');
// Preserve the original readiness failure instead of running another game's fallback.
source=source.replace(/\.catch\(async e=>\{console\.log\(JSON\.stringify[\s\S]*?throw e\}\)/,".catch(async e=>{console.error('Robot readiness failure',JSON.stringify(await host.evaluate(()=>window.qaState?.active)),report.errors);throw e})");
source=source.replace("await host.goto(base+'/host');",`await host.route('**/app.js',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('const runnerGaits=new Map(),runnerFacing=new Map();','const runnerGaits=new Map(),runnerFacing=new Map();window.robotTest={runnerGaits,runnerFacing};');await route.fulfill({response,body});});await host.goto(base+'/host');`);
source=source.replace('const art=await gameFrame.evaluate',`const pf=phone.frames().find(f=>f.url().includes('/games/'+id+'/'));
if(id==='taprace'){
 for(let i=0;i<24;i++){await pf.evaluate(()=>send('input',{action:'tap'}));await host.waitForTimeout(75);}
 const pid=await pf.evaluate(()=>id);const running=await gameFrame.evaluate(pid=>({speed:state.players.find(p=>p.id===pid)?.vx,phase:robotTest.runnerGaits.get(pid)?.phase}),pid);assert(running.speed>95,'24 phone taps accelerate the actual human runner');assert(running.phase>0,'human runner has animated gait');
 await host.screenshot({path:'tests/robot-sprint.png'});
}else{
 await pf.evaluate(()=>send('input',{x:1,y:0}));await host.waitForTimeout(800);
 const pid=await pf.evaluate(()=>id);assert.equal(await gameFrame.evaluate(id=>robotTest.runnerFacing.get(id),pid),1);
 await host.screenshot({path:'tests/robot-carry-right.png'});
 await pf.evaluate(()=>send('input',{x:-1,y:0}));await host.waitForTimeout(900);
 assert.equal(await gameFrame.evaluate(id=>robotTest.runnerFacing.get(id),pid),-1);
 await host.screenshot({path:'tests/robot-carry-left.png'});
 await pf.evaluate(()=>send('input',{x:0,y:0}));
}
console.log('PASS articulated motion',id);
const art=await gameFrame.evaluate`);
vm.runInThisContext('(function(require){'+source+'\n})',{filename:__filename})(require);
