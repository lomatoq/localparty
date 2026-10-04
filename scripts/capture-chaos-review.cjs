'use strict';
// QA player: read-only scene observation, actual controller websocket input.
// Actual-play branch never calls completion, mutates gameplay state, or overrides clocks.
// Explicit QA_CHAOS_FIXTURE=1 is a separate demo renderer run, watermarked and never accepted as a match.
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.I18N_OUTPUT||'.localparty-build/screen-review/captures');fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'chaos-review'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*.6);
let interrupted=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{interrupted=true;});
const report={method:'Real two-player controller websocket inputs; read-only scene observation; unmodified normal gameplay clock',levels:[],errors:[]};
function waypoint(c,target,walls){
 if(!walls?.length)return target;
 const W=65,H=39, blocked=(x,y)=>walls.some(w=>x>w.x-.025&&x<w.x+w.w+.025&&y>w.y-.043&&y<w.y+w.h+.043);
 const cell=p=>[Math.max(0,Math.min(W-1,Math.round((p.x-.03)/.94*(W-1)))),Math.max(0,Math.min(H-1,Math.round((p.y-.05)/.9*(H-1))))];
 const point=(x,y)=>({x:.03+x/(W-1)*.94,y:.05+y/(H-1)*.9}),start=cell(c),end=cell(target),key=(x,y)=>y*W+x;
 const queue=[start],seen=new Set([key(...start)]),prev=new Map();let found;
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i];if(Math.abs(x-end[0])+Math.abs(y-end[1])<=1){found=[x,y];break;}for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(nx<0||ny<0||nx>=W||ny>=H||seen.has(k))continue;const p=point(nx,ny);if(blocked(p.x,p.y))continue;if(dx&&dy&&(blocked(point(nx,y).x,point(nx,y).y)||blocked(point(x,ny).x,point(x,ny).y)))continue;seen.add(k);prev.set(k,[x,y]);queue.push([nx,ny]);}}
 if(!found)return c;
 const route=[found];while(prev.has(key(...route.at(-1))))route.push(prev.get(key(...route.at(-1))));route.reverse();return route.length>2?point(...route[Math.min(3,route.length-1)]):target;
}
(async()=>{try{
 for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await sleep(50);assert.match(log,/localhost:(\d+)/);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer chaos-review','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const result=await r.json();if(!r.ok)throw Error(JSON.stringify(result));return result;};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}}),phones=[];
 await tv.goto(origin+'/tv');for(const name of['Александра ДлинноеИмя','Пётр']){const p=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});await p.goto(origin+'/play');await p.locator('#name').fill(name);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);}
 await api({type:'bots-set',count:0});await api({type:'launch',id:'chaos'});
 for(const p of phones){await p.waitForFunction(()=>document.querySelector('#gameFrame').src.includes('/games/chaos/'));await p.waitForFunction(()=>!document.getElementById('readyButton').disabled);await p.locator('#readyButton').click();}
 let host;for(let i=0;i<100;i++){host=tv.frames().find(f=>f.url().includes('/games/chaos/'));if(host&&await host.evaluate(()=>!!window.__OC_DEBUG).catch(()=>false))break;await sleep(100);}
 assert(host);
 if(process.env.QA_CHAOS_FIXTURE==='1'){
  report.method='VISUAL FIXTURE: production final renderer with explicit demo data on separate ephemeral server. No completed match; no integration acceptance.';
  for(let i=0;i<100;i++){if((await api()).active?.ui?.phase==='playing')break;await sleep(100);}
  await host.evaluate(()=>{roundIndex=14;roundRemaining=0;roundActive=false;state.lock=true;ws.send(JSON.stringify({type:'ui',phase:'playing',progress:'15 / 15',endsAt:null,label:'Финальный босс'}));score=12840;players.forEach((n,i)=>{stats[n]={presses:48+i*17,active:30+i*8,deaths:i,collects:12};});finish();});
  await sleep(5000);
  for(const [page,name]of[[phones[0],'chaos-results-fixture.png'],[tv,'chaos-tv-results-fixture.png']]){
   await page.evaluate(()=>{const b=document.createElement('div');b.textContent='ВИЗУАЛЬНЫЙ ПРИМЕР · ДЕМО-ДАННЫЕ · МАТЧ НЕ ПРОЙДЕН';b.style.cssText='position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;background:#ffd36d;color:#181323;padding:8px 12px;font:700 12px/1.4 system-ui;text-align:center;border:2px solid #181323;border-radius:10px;pointer-events:none';if(innerWidth<800)b.style.bottom='90px';document.body.appendChild(b);});
   await page.screenshot({path:path.join(out,name)});
  }
  report.visualFixture={ids:['1364','1365'],files:['chaos-results-fixture.png','chaos-tv-results-fixture.png'],demoScore:12840,notAcceptance:true};console.log('VISUAL FIXTURE ONLY');return;
 }
 const controllers=phones.map(p=>p.frames().find(f=>f.url().includes('/games/chaos/')));let oldRound=-1,ticks=0,lastLog=0,lastPolicy=null;const started=Date.now();
 while(!interrupted&&Date.now()-started<(Number(process.env.QA_GAME_TIMEOUT)||1800000)){
  const q=await host.evaluate(()=>{const d=window.__OC_DEBUG.getState(),s=d.state;return {round:d.roundIndex,c:{...d.cursor},immune:Math.max(0,(s.invulnerableUntil||0)-gameClock.performanceNow()),arms:s.arms?.map((a,i)=>({cx:a.cx,cy:a.cy,len:a.len,angle:a.current??a.angle,speed:d.roundIndex===14?(i?-.0009:.001):(i%2?-.00072:.00082)*(1+i*.15)})),lasers:s.lasers?.filter(a=>a.active).map(a=>({cx:a.cx,cy:a.cy,len:a.len,angle:a.current??a.angle,speed:(s.lasers.indexOf(a)%2?-.00052:.00058)*(1+s.lasers.indexOf(a)*.15)})),remaining:d.roundRemaining,score:d.score,lock:s.lock,lives:s.lives,deaths:s.deaths,trace:s.trace,si:s.si,i:s.i,targets:s.targets,samples:s.samples,pickups:s.pickups?.map(p=>({x:p.x,y:p.y,picked:p.picked})),cps:s.cps?.map(p=>({x:p.x,y:p.y,hit:p.hit})),goal:s.goal&&{x:s.goal.x,y:s.goal.y},b:s.b,slot:s.slot,core:s.core&&{x:s.core.x,y:s.core.y,held:s.core.held},base:s.base&&{x:s.base.x,y:s.base.y},switches:s.switches?.map(p=>({x:p.x,y:p.y,on:p.on})),walls:(s.walls||s.movers)?.map(p=>({x:p.x,y:p.y,w:p.w,h:p.h})),bullets:s.turret?.bullets.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy})),gates:s.gates?.map(g=>({y:g.y,gap:g.gap})),results:document.getElementById('results').style.display==='grid'};});
  if(q.results){assert.equal(q.round,14);report.result={round:q.round,score:q.score,elapsedMs:Date.now()-started};await sleep(1400);await phones[0].screenshot({path:path.join(out,'chaos-results.png')});await tv.screenshot({path:path.join(out,'chaos-tv-results.png')});console.log('REAL RESULTS',report.result);break;}
  if(q.round!==oldRound){oldRound=q.round;report.levels.push({level:q.round+1,atMs:Date.now()-started});console.log('LEVEL',q.round+1);}
  if(Date.now()-lastLog>5000){console.log('STATE',q.round+1,q.remaining.toFixed(1),q.c.x.toFixed(2),q.c.y.toFixed(2),'lives',q.lives,'idx',q.i,q.si,q.trace);lastLog=Date.now();}
  const policyText=fs.readFileSync(__filename,'utf8').split('// QA_POLICY_START\n')[1]?.split('// QA_POLICY_END')[0];
  if(policyText)lastPolicy=new Function('q','ticks','waypoint','distance',policyText);
  const {value,grab,click}=lastPolicy(q,ticks,waypoint,distance);
  await Promise.all(controllers.map(f=>f.evaluate(({value,grab,click,ticks})=>{movement=value;send('move','down',value);if(roles.includes('grab'))send('grab',grab?'down':'up');if(roles.includes('click'))send('click',click&&ticks%2===0?'down':'up');},{value,grab,click,ticks})));ticks++;await sleep(35);
 }
 if(!report.result)throw Error(interrupted?'Interrupted before real final':'No real final within configured QA_GAME_TIMEOUT');
}catch(e){report.errors.push(e.message);console.error(e);process.exitCode=1;}finally{report.games=[{id:'chaos',resultPhase:report.result?'results':null,...report.result,levels:report.levels,errors:report.errors}];fs.writeFileSync(path.join(out,process.env.QA_CHAOS_FIXTURE==='1'?'chaos-visual-fixture-report.json':'chaos-solver-report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,process.env.QA_CHAOS_FIXTURE==='1'?'chaos-visual-fixture-server.log':'chaos-solver-server.log'),log);await browser?.close();child.kill();}})();

function controlPolicy(q,ticks,waypoint,distance){
// QA_POLICY_START
  const policyStarted=Date.now();
  let target=q.c,grab=false,click=false;
  if(!q.lock){
   if(q.targets){const t=q.targets[q.i];if(t)target={x:t[0],y:t[1]};click=distance(q.c,target)<.04;}
   else if(q.samples){const t=q.samples[q.trace];if(t)target={x:t[0],y:t[1]};}
   else if(q.b){grab=true;target=q.b.held?q.slot:q.b;click=q.b.held&&distance(q.c,target)<.055;}
   else if(q.switches&&q.si<q.switches.length){target=q.switches[q.si];click=distance(q.c,target)<.04;}
   else if(q.core){grab=true;target=q.core.held?q.base:q.core;}
   else if(q.pickups){target=q.pickups.find(p=>!p.picked)||q.goal||q.c;}
   else if(q.cps)target=q.cps.find(p=>!p.hit)||q.goal;
   else if(q.gates){const up=q.round===8,cy=up?.75:.25;const upcoming=q.gates.filter(g=>up?g.y<cy+.04:g.y+.075>cy-.04).sort((a,b)=>up?b.y-a.y:a.y-b.y)[0];target={x:upcoming?.gap||.5,y:cy};}
   else if(q.goal)target=q.goal;
   // Outer ring avoids rotating arms/lasers while collecting corner objectives.
   if([10,14].includes(q.round)&&!(q.core&&(q.si??0)>=4)){
    const c=q.c,t=target;if(Math.abs(t.x-c.x)>.2&&Math.min(c.y,t.y)<.35&&Math.max(c.y,t.y)>.65)target={x:c.x<.5?.075:.925,y:t.y};
    else if(Math.abs(t.x-c.x)>.2&&c.y>.3&&c.y<.7)target={x:c.x,y:t.y<.5?.13:.87};
   }
   target=waypoint(q.c,target,q.walls);
  }
  const dx=target.x-q.c.x,dy=(target.y-q.c.y)*.6,n=Math.max(.012,Math.hypot(dx,dy)),slow=Math.min(1,n/.022),value={x:dx/n*slow,y:dy/n*slow};
  if(!q.lock&&q.bullets?.length){let best=Infinity,choice=value;for(let j=0;j<33;j++){const v=j===32?{x:0,y:0}:{x:Math.cos(j*Math.PI/16),y:Math.sin(j*Math.PI/16)};let cost=0;for(let k=1;k<=5;k++){const ms=k*80,p={x:q.c.x+v.x*.00026*ms,y:q.c.y+v.y*.00026*ms/.6};if(p.x<.03||p.x>.97||p.y<.05||p.y>.95)cost+=5;for(const b of q.bullets){const d=distance(p,{x:b.x+b.vx*ms,y:b.y+b.vy*ms});cost+=Math.max(0,.060-d)*100;}}cost+=distance({x:q.c.x+v.x*.00026*240,y:q.c.y+v.y*.00026*240/.6},target)*5;if(cost<best){best=cost;choice=v;}}Object.assign(value,choice);}
  if(!q.lock&&q.gates?.length){
   const speed=q.round===8?.00022:-.000235, drift=q.round===8?-.000035:.000035, step=150, sx=.027,sy=.045;
   const safe=(x,y,ms)=>x>.029&&x<.971&&y>.043&&y<.957&&!q.gates.some(g=>{const top=g.y+speed*ms;return y>top-.037&&y<top+.112&&Math.abs(x-g.gap)>.112;});
   let beam=[{ix:0,iy:0,cost:0,first:null}],best;
   for(let k=1;k<=17;k++){const next=new Map();for(const a of beam)for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy++){
     const nx=a.ix+ix,ny=a.iy+iy,ms=k*step,x=q.c.x+nx*sx,y=q.c.y+ny*sy+drift*ms;
     if(!safe(x,y,ms)||!safe(x-ix*sx/2,y-iy*sy/2-drift*step/2,ms-step/2))continue;
     const cost=a.cost+Math.abs(y-(q.round===8?.70:.30))*.025+(ix||iy?.0001:0),key=nx+','+ny;
     if(!next.has(key)||next.get(key).cost>cost)next.set(key,{ix:nx,iy:ny,cost,first:a.first||{x:ix*sx/(.00026*step),y:iy*sy*.6/(.00026*step)}});
   }if(!next.size)break;beam=[...next.values()].sort((a,b)=>a.cost-b.cost).slice(0,650);best=beam[0];}
   if(best?.first)Object.assign(value,best.first);
  }
  if(!q.lock&&(q.lasers?.length||q.arms?.length)){
   const beams=[...(q.lasers||[]).map(a=>({...a,full:true})),...(q.arms||[])],step=130,sx=.0169,sy=.0281666667;
   const segmentDistance=(p,a,b)=>{const vx=b.x-a.x,vy=(b.y-a.y)*.6,wx=p.x-a.x,wy=(p.y-a.y)*.6,z=Math.max(0,Math.min(1,(vx*wx+vy*wy)/(vx*vx+vy*vy||1)));return Math.hypot(wx-vx*z,wy-vy*z);};
   const safe=(x,y,ms)=>{if(x<.029||x>.971||y<.043||y>.957)return false;if(ms<q.immune-80)return true;return !beams.some(a=>{const ang=a.angle+a.speed*ms,dx=Math.cos(ang)*a.len/(a.full?2:1),dy=Math.sin(ang)*a.len/.6/(a.full?2:1);return segmentDistance({x,y},{x:a.cx-(a.full?dx:0),y:a.cy-(a.full?dy:0)},{x:a.cx+dx,y:a.cy+dy})<.033;})&&!(q.bullets||[]).some(b=>distance({x,y},{x:b.x+b.vx*ms,y:b.y+b.vy*ms})<.037);};
   let beam=[{ix:0,iy:0,cost:0,first:null}],best;
   // Short laser horizon avoids treating a soon-disabled switch beam as permanent.
   for(let k=1;k<=(q.lasers?.length?12:40);k++){const next=new Map();for(const a of beam)for(const [ix,iy] of [[0,0],[2,0],[-2,0],[0,2],[0,-2],[1,1],[1,-1],[-1,1],[-1,-1]]){
    const nx=a.ix+ix,ny=a.iy+iy,ms=k*step,x=q.c.x+nx*sx,y=q.c.y+ny*sy;
    if(!safe(x,y,ms)||!safe(x-ix*sx/2,y-iy*sy/2,ms-step/2))continue;
    const cost=a.cost+distance({x,y},target)*.02+(ix||iy?.00001:0),key=nx+','+ny;
    if(!next.has(key)||next.get(key).cost>cost)next.set(key,{ix:nx,iy:ny,cost,first:a.first||{x:ix*sx/(.00026*step),y:iy*sy*.6/(.00026*step)}});
   }if(!next.size)break;beam=[...next.values()].sort((a,b)=>a.cost-b.cost).slice(0,450);best=beam[0];}
   if(best?.first)Object.assign(value,best.first);
  }
  if(q.round>=11&&ticks%50===0)console.log("PLANNER_MS",Date.now()-policyStarted);
  return {value,grab,click};
// QA_POLICY_END
}
