'use strict';
// Actual cooperative play through real controller pointer events. Debug access is READ ONLY.
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const output=path.resolve(process.env.QA_OUTPUT||'.localparty-build/design-round2/gameplay/chaos-real-levels');fs.mkdirSync(output,{recursive:true});
const source='games/chaos/static/controller.html',hash=()=>crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const report={startedAt:new Date().toISOString(),method:'Normal-clock actual launcher and three actual browser controllers. Read-only __OC_DEBUG.getState; only genuine pointer events move/click/grab. No startRound/completeRound calls, injected state, scores or accelerated clock.',sourceHash:hash(),levels:[],attempts:[],errors:[]};
let log='',browser;const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'chaos-round3'}});
child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const sleep=ms=>new Promise(r=>setTimeout(r,ms)),save=()=>fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
async function until(fn,label,timeout=30000){const end=Date.now()+timeout;while(Date.now()<end){const value=await fn();if(value)return value;await sleep(80);}throw Error(label);}
function route(from,to,walls){
 if(!walls?.length)return to;const step=.025,n=39,margin=.028,inside=(x,y)=>walls.some(w=>x>w.x-margin&&x<w.x+w.w+margin&&y>w.y-margin&&y<w.y+w.h+margin);
 const start=[Math.round(from.x/step)-1,Math.round(from.y/step)-1],end=[Math.round(to.x/step)-1,Math.round(to.y/step)-1],key=(x,y)=>x+','+y;
 const open=[{x:start[0],y:start[1],cost:0,score:0}],best=new Map([[key(...start),0]]),parents=new Map();let found;
 for(let k=0;k<1800&&open.length;k++){open.sort((a,b)=>b.score-a.score);const q=open.pop();if(q.x===end[0]&&q.y===end[1]){found=q;break;}
  for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const x=q.x+dx,y=q.y+dy;if(x<0||y<1||x>=n||y>=n-1)continue;const wx=(x+1)*step,wy=(y+1)*step;if(inside(wx,wy)||(dx&&dy&&(inside((q.x+1)*step,wy)||inside(wx,(q.y+1)*step))))continue;const cost=q.cost+Math.hypot(dx,dy),id=key(x,y);if(cost>=(best.get(id)??Infinity))continue;best.set(id,cost);parents.set(id,key(q.x,q.y));open.push({x,y,cost,score:cost+Math.hypot(x-end[0],y-end[1])});}
 }
 if(!found)return to;const points=[];let id=key(found.x,found.y);while(id!==key(...start)){const [x,y]=id.split(',').map(Number);points.unshift({x:(x+1)*step,y:(y+1)*step});id=parents.get(id);if(!id)break;}return points.find(p=>Math.hypot(p.x-from.x,p.y-from.y)>.04)||to;
}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'launcher');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer chaos-round3','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
 browser=await webkit.launch({headless:true});const tvContext=await browser.newContext({viewport:{width:Number(process.env.TV_WIDTH)||1280,height:Number(process.env.TV_HEIGHT)||720}});await tvContext.addInitScript(()=>localStorage.setItem('local-party-language','en'));const tv=await tvContext.newPage();await tv.goto(origin+'/tv');
 const players=[];for(let i=0;i<3;i++){const ctx=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});await ctx.addInitScript(()=>localStorage.setItem('local-party-language','en'));const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(origin+'/play');await page.locator('#name').fill(i?'Jamie '+i:'Alexandra LongSurname');await page.locator('#joinForm button[type=submit]').click();await page.locator('#home').waitFor();players.push({page,frame:null,held:false,button:null});}
 await api({type:'launch',id:'chaos'});for(const p of players){await p.page.waitForFunction(()=>document.querySelector('#gameFrame').src.includes('/games/chaos/'));await p.page.waitForFunction(()=>!document.getElementById('readyButton').disabled);await p.page.locator('#readyButton').click();p.frame=p.page.frames().find(f=>f.url().includes('/games/chaos/'));}
 const host=await until(()=>tv.frames().find(f=>f.url().includes('/games/chaos/')),'host frame');await until(()=>host.evaluate(()=>window.__OC_DEBUG?.getState().roundIndex>=0),'actual start');
 async function release(p){if(p.held||p.button){await p.page.mouse.up();p.held=false;p.button=null;}}
 async function move(p,axis){if(p.button)return;const b=await p.frame.locator('.vector-pad').boundingBox();if(!b)return;if(!p.held){await p.page.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.page.mouse.down();p.held=true;}const r=Math.min(b.width,b.height)*.35,n=Math.max(1,Math.hypot(axis.x,axis.y));await p.page.mouse.move(b.x+b.width/2+axis.x/n*r,b.y+b.height/2+axis.y/n*r);}
 async function hold(p,control){if(p.button===control)return;await release(p);const roles=await p.frame.evaluate(()=>roles.filter(r=>r!=='move')),index=roles.indexOf(control);if(index<0)return;const b=await p.frame.locator('.ctrl').nth(index).boundingBox();if(!b)return;await p.page.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.page.mouse.down();p.button=control;}
 async function click(control){const p=players[1];await hold(p,control);await sleep(65);await release(p);}
 async function capture(level,s){for(const f of [host,...players.map(p=>p.frame)])await f.evaluate(()=>document.fonts.ready);const row={level:level+1,title:await host.locator('#roundTitle').textContent(),state:{roundRemaining:s.roundRemaining,score:s.score,cursor:s.cursor},captures:[]};report.levels.push(row);
  for(const [surface,page]of[['tv',tv],['phone',players[0].page]]){const file='chaos-level-'+String(level+1).padStart(2,'0')+'-'+surface+'.png';await page.screenshot({path:path.join(output,file)});row.captures.push(file);}
  await players[0].page.setViewportSize({width:320,height:568});await sleep(160);row.phone320=await players[0].frame.evaluate(()=>({viewport:{w:innerWidth,h:innerHeight},mission:{text:document.getElementById('missionCard').textContent,display:getComputedStyle(document.getElementById('missionCard')).display,bottom:document.getElementById('missionCard').getBoundingClientRect().bottom},controls:[...document.querySelectorAll('.ctrl,.vector-pad')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,text:e.textContent.trim()};})}));const file='chaos-level-'+String(level+1).padStart(2,'0')+'-phone-320.png';await players[0].page.screenshot({path:path.join(output,file)});row.captures.push(file);await players[0].page.setViewportSize({width:393,height:852});save();}
 let level=-1,lastRemaining=0,waypoint=0;const stop=Date.now()+Number(process.env.QA_GAME_TIMEOUT||360000);
 while(Date.now()<stop){const active=(await api()).active;if(active?.ui?.phase==='results'){report.realFinish=active;await sleep(500);await tv.screenshot({path:path.join(output,'chaos-tv-results.png')});await players[0].page.screenshot({path:path.join(output,'chaos-phone-results.png')});report.finished=true;break;}
  const s=await host.evaluate(()=>JSON.parse(JSON.stringify(window.__OC_DEBUG.getState()))),r=s.roundIndex,c=s.cursor,st=s.state;if(r<0){await sleep(100);continue;}
  if(r!==level){for(const p of players)await release(p);level=r;waypoint=0;lastRemaining=s.roundRemaining;console.log('LEVEL',r+1);await until(()=>host.evaluate(()=>roundActive&&!state.lock),'actual level active');await capture(r,await host.evaluate(()=>JSON.parse(JSON.stringify(window.__OC_DEBUG.getState()))));}
  if(s.roundRemaining>lastRemaining+2){report.attempts.push({level:r+1,restartAt:new Date().toISOString()});waypoint=0;for(const p of players)await release(p);}lastRemaining=s.roundRemaining;
  const playing=await host.evaluate(()=>roundActive&&!state.lock);if(!playing){for(const p of players)await release(p);await sleep(100);continue;}
  let target,grabbing=false,clicking=false,walls;
  if(r===0){const t=st.targets[st.i];if(t){target={x:t[0],y:t[1]};clicking=Math.hypot(c.x-target.x,c.y-target.y)<.042;}}
  if(r===1){const t=st.samples[st.trace];if(t)target={x:t[0],y:t[1]};}
  if(r===2){grabbing=st.b.held||Math.hypot(c.x-st.b.x,c.y-st.b.y)<.05;target=st.b.held?st.slot:st.b;clicking=st.b.held&&Math.hypot(c.x-st.slot.x,c.y-st.slot.y)<.045;}
  if([3,7,12].includes(r)){target=st.pickups.find(p=>!p.picked)||st.goal;}
  if(r===4){target=st.cps.find(p=>!p.hit)||st.goal;walls=st.walls;}
  if(r===5){target=st.goal;walls=st.movers;}
  if(r===6){grabbing=true;target=st.core.held?(c.x>.34?{x:.30,y:.24}:st.base):st.core;}
  if(r===8||r===9){const gates=st.gates.filter(g=>r===8?g.y<c.y+.055:g.y+.075>c.y-.055).sort((a,b)=>r===8?b.y-a.y:a.y-b.y),gate=gates[0];if(gate)target={x:Math.max(gate.gap-.095,Math.min(gate.gap+.095,c.x)),y:r===8?.85:.18};}
  if(r===10){const path=[{x:.17,y:.22},{x:.17,y:.1},{x:.82,y:.1},{x:.82,y:.25},{x:.92,y:.25},{x:.92,y:.78},{x:.8,y:.78},{x:.8,y:.9},{x:.2,y:.9},{x:.2,y:.75}];target=path[Math.min(waypoint,path.length-1)];if(Math.hypot(c.x-target.x,c.y-target.y)<.035)waypoint++;}
  if(r===11){const sw=st.switches[st.si];if(sw){target=sw;clicking=Math.hypot(c.x-sw.x,c.y-sw.y)<.04;}}
  if(r===13){const t=st.targets[st.i];if(t){target={x:t.x??t[0],y:t.y??t[1]};clicking=Math.hypot(c.x-target.x,c.y-target.y)<.04;}}
  if(r===14){if(st.si<4){target=st.switches[st.si];clicking=Math.hypot(c.x-target.x,c.y-target.y)<.04;}else{grabbing=st.core.held||Math.hypot(c.x-st.core.x,c.y-st.core.y)<.04;target=st.core.held?st.base:st.core;}}
  if(grabbing)await hold(players[2],'grab');else if(players[2].button)await release(players[2]);
  if(clicking){await Promise.all(players.slice(0,2).map(p=>move(p,{x:0,y:0})));await click('click');}else if(target){const point=route(c,target,walls),axis={x:(point.x-c.x)*18,y:(point.y-c.y)*10.8};await Promise.all(players.slice(0,2).map(p=>move(p,axis)));if(!players[2].button)await move(players[2],axis);}
  await sleep(70);
 }
 report.finalReadOnlyState=await host.evaluate(()=>JSON.parse(JSON.stringify(window.__OC_DEBUG.getState())));report.last=(await api()).active;report.uncoveredFinal=!report.finished;await api({type:'stop'});
}catch(e){report.failure=e.message;console.error(e);process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();report.sourceHashEnd=hash();save();fs.writeFileSync(path.join(output,'server.log'),log);await browser?.close();child.kill();}})();
