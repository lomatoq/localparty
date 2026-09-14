const fs=require('fs'),vm=require('vm');process.env.UX_GAMES='taprace,carryball';
let source=fs.readFileSync('tests/game-art-browser.cjs','utf8');
source=source.replace("phone.locator('#joinForm button').click()","phone.locator('#joinForm button[type=submit]').click()");
// Preserve the original readiness failure instead of running another game's fallback.
source=source.replace(/\.catch\(async e=>\{console\.log\(JSON\.stringify[\s\S]*?throw e\}\)/,".catch(async e=>{console.error('Robot readiness failure',JSON.stringify(await host.evaluate(()=>window.qaState?.active)),report.errors);throw e})");
source=source.replace("await host.goto(base+'/host');",`await host.route('**/app.js',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('const runnerGaits=new Map(),runnerFacing=new Map();','const runnerGaits=new Map(),runnerFacing=new Map();window.robotTest={runnerGaits,runnerFacing};').replace('function drawTapRace(s){','window.tapRaceRunnerLayout=tapRaceRunnerLayout;function drawTapRace(s){');await route.fulfill({response,body});});await host.goto(base+'/host');`);
source=source.replace('const art=await gameFrame.evaluate',`const pf=phone.frames().find(f=>f.url().includes('/games/'+id+'/'));
if(id==='taprace'){
 for(let i=0;i<24;i++){await pf.evaluate(()=>send('input',{action:'tap'}));await host.waitForTimeout(75);}
 const pid=await pf.evaluate(()=>id);const running=await gameFrame.evaluate(pid=>({speed:state.players.find(p=>p.id===pid)?.vx,phase:robotTest.runnerGaits.get(pid)?.phase}),pid);assert(running.speed>95,'24 phone taps accelerate the actual human runner');assert(running.phase>0,'human runner has animated gait');
 const layouts=await gameFrame.evaluate(()=>[2,16].map(count=>Array.from({length:count},(_,index)=>window.tapRaceRunnerLayout({name:'Очень длинное имя игрока',progress:index*120,vx:180},index,count))));
 for(const lanes of layouts)for(const layout of lanes){assert(layout.bubble.width<=98,'runner bubble stays compact');assert(layout.bubble.y>=layout.laneTop-1&&layout.bubble.y+layout.bubble.height<=layout.laneTop+layout.h+1,'runner bubble stays inside its lane');assert(layout.rearX<layout.x&&layout.x-layout.rearX<=layout.size*.33,'speed trail attaches to the runner rear');}
 assert(await gameFrame.evaluate(()=>document.fonts.check('800 12px PartyRubik')),'runner bubble font is loaded');
 await host.screenshot({path:'tests/robot-sprint.png'});
}else{
 await pf.evaluate(()=>send('input',{x:1,y:0}));await host.waitForTimeout(800);
 const pid=await pf.evaluate(()=>id);assert.equal(await gameFrame.evaluate(id=>robotTest.runnerFacing.get(id),pid),1);
 await host.screenshot({path:'tests/robot-carry-right.png'});
 await pf.evaluate(()=>send('input',{x:-1,y:0}));await host.waitForTimeout(900);
 assert.equal(await gameFrame.evaluate(id=>robotTest.runnerFacing.get(id),pid),-1);
 await host.screenshot({path:'tests/robot-carry-left.png'});
 await pf.evaluate(()=>send('input',{x:0,y:0}));
 assert.match(await pf.locator('#help').innerText(),/пас в сторону движения/i,'phone explains directional pass');
}
for(const viewport of [{width:320,height:640},{width:430,height:844}]){
 await phone.setViewportSize(viewport);await phone.waitForTimeout(120);
 const mobile=await pf.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,viewport:{width:innerWidth,height:innerHeight},controls:[...document.querySelectorAll('#joy,#action')].filter(el=>!el.hidden&&getComputedStyle(el).display!=='none').map(el=>{const r=el.getBoundingClientRect();return {id:el.id,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};})}));
 assert(!mobile.overflow,id+' '+viewport.width+' controller has no horizontal overflow');assert(mobile.controls.length,id+' '+viewport.width+' controller is visible');assert(mobile.controls.every(control=>control.left>=-1&&control.top>=-1&&control.right<=mobile.viewport.width+1&&control.bottom<=mobile.viewport.height+1),id+' '+viewport.width+' controls stay inside viewport');assert(mobile.controls.every(control=>control.width>=44&&control.height>=44),id+' '+viewport.width+' controls keep touch targets');
}
await phone.setViewportSize({width:402,height:874});
console.log('PASS articulated motion',id);
const art=await gameFrame.evaluate`);
vm.runInThisContext('(function(require){'+source+'\n})',{filename:__filename})(require);
