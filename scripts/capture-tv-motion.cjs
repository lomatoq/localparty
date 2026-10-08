'use strict';
// TV motion filmstrips: real server, real bots, real admin launch/start/pause/stop.
// Captures each scene transition as a timed frame sequence and measures rAF frame
// times in a separate pass (screenshots disturb frame timing).
//   QA_OUTPUT=<dir> QA_SIZES=1280x720,1920x1080 QA_GAME=flappy QA_REDUCED=1 node scripts/capture-tv-motion.cjs
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/tv-motion-2026-10-05/run');fs.mkdirSync(out,{recursive:true});
const sizes=(process.env.QA_SIZES||'1280x720,1920x1080').split(',').map(s=>s.split('x').map(Number));
const gameId=process.env.QA_GAME||'flappy',reduced=process.env.QA_REDUCED==='1',timing=process.env.QA_TIMING!=='0';
const motionURL=o=>o+'/tv'+(process.env.QA_LEGACY==='1'?'?motion=legacy':'');
const only=process.env.QA_ONLY?new Set(process.env.QA_ONLY.split(',')):null;
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'tvmotion'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const report={startedAt:new Date().toISOString(),reduced,gameId,films:{},timing:{},errors:[]};
async function until(fn,label,tries=600,step=50){for(let i=0;i<tries;i++){const v=await fn();if(v)return v;await sleep(step);}throw Error('timeout: '+label);}
const watchdog=setTimeout(()=>{console.error('watchdog');child.kill();process.exit(2);},14*60*1000);watchdog.unref();

// Slow motion (QA_SLOW=k): WAAPI/CSS animations play at 1/k and page timers run k× longer, so
// screenshots that take ~300 ms real time land every ~60 ms of transition time. Frame times
// recorded in the montage are transition time (real/k). Frame-time measurement runs at k=1.
const K=Math.max(1,Number(process.env.QA_SLOW||5));
function slowmo(k){if(k===1)return;const st=window.setTimeout,si=window.setInterval;
 window.setTimeout=(f,d,...a)=>st(f,(Number(d)||0)*k,...a);window.setInterval=(f,d,...a)=>si(f,(Number(d)||0)*k,...a);
 const animate=Element.prototype.animate;Element.prototype.animate=function(...a){const x=animate.apply(this,a);try{x.playbackRate=x.playbackRate/k;x.__qaSlow=1;}catch{}return x;};
 const tick=()=>{try{for(const a of document.getAnimations()){if(!a.__qaSlow){a.__qaSlow=1;a.playbackRate=a.playbackRate/k;}}}catch{}requestAnimationFrame(tick);};requestAnimationFrame(tick);}
async function film(page,dir,name,{trigger,ready,duration=1800,readyTries=1200}={}){
 if(only&&!only.has(name)){await trigger?.();return;}
 const folder=path.join(dir,name);fs.rmSync(folder,{recursive:true,force:true});fs.mkdirSync(folder,{recursive:true});
 const frames=[];let i=0;const shot=async t=>{const file=`f${String(i++).padStart(3,'0')}.jpg`;await page.screenshot({path:path.join(folder,file),type:'jpeg',quality:74});frames.push({file,t:Math.round(t)});};
 if(trigger)await shot(-1);
 const pending=trigger?.();
 if(ready)await until(ready,name+' ready',readyTries,15);
 const t0=Date.now();
 while(Date.now()-t0<duration*K)await shot((Date.now()-t0)/K);
 await pending;report.films[path.relative(out,folder)]=frames;fs.writeFileSync(path.join(folder,'frames.json'),JSON.stringify(frames));
 return frames;
}
// rAF deltas during a transition, no screenshots.
async function measure(page,key,trigger,duration=2200){
 await page.evaluate(()=>{window.__ft=[];let last=performance.now();window.__ftOn=true;const f=t=>{__ft.push(t-last);last=t;if(__ftOn)requestAnimationFrame(f);};requestAnimationFrame(f);});
 await trigger();await sleep(duration);
 const d=await page.evaluate(()=>{__ftOn=false;return __ft.slice(1);});d.sort((a,b)=>a-b);
 const q=p=>Math.round(d[Math.min(d.length-1,Math.floor(d.length*p))]*10)/10;
 report.timing[key]={frames:d.length,p50:q(.5),p95:q(.95),max:Math.round(d[d.length-1]*10)/10,over25:d.filter(x=>x>25).length,over50:d.filter(x=>x>50).length};
}
async function montage(dir,name,frames,w,h){
 if(!frames?.length)return;
 const pick=[];const want=Math.min(20,frames.length);
 for(let k=0;k<want;k++)pick.push(frames[Math.round(k*(frames.length-1)/Math.max(1,want-1))]);
 const uniq=[...new Map(pick.map(f=>[f.file,f])).values()];
 const cols=5,tw=Math.round(1280/cols)-8,th=Math.round(tw*h/w);
 const html=`<html><body style="margin:0;background:#111;font:12px system-ui;color:#ddd;display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:8px;padding:8px">`+uniq.map(f=>`<figure style="margin:0"><img src="file://${path.join(dir,name,f.file)}" style="width:${tw}px;height:${th}px;display:block"><figcaption>${f.t<0?'before':'+'+f.t+' ms'}</figcaption></figure>`).join('')+'</body></html>';
 const file=path.join(dir,name,'montage.html');fs.writeFileSync(file,html);
 const p=await browser.newPage({viewport:{width:1280+16,height:800}});await p.goto('file://'+file);await p.waitForLoadState('load');
 await p.screenshot({path:path.join(dir,`${name}-filmstrip.png`),fullPage:true});await p.close();
}

(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'server');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer tvmotion','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
 await api({type:'force-language',language:'en'}).catch(e=>report.errors.push({api:'force-language',error:e.message}));
 browser=await webkit.launch({headless:true});
 for(const [w,h] of sizes){
  const dir=path.join(out,`${w}x${h}`);fs.mkdirSync(dir,{recursive:true});let s;
  if(process.env.QA_FILMS!=='0'){
  const ctx=await browser.newContext({viewport:{width:w,height:h},reducedMotion:reduced?'reduce':'no-preference'});
  const tv=await ctx.newPage();tv.on('pageerror',e=>report.errors.push({surface:`tv${w}`,error:e.message}));
  await tv.addInitScript(slowmo,K);
  const q=fn=>()=>tv.evaluate(fn).catch(()=>false);
  const phase=()=>tv.evaluate(()=>document.body.dataset.tvPhase||'');
  // 1. Startup → lobby (fresh context, so the intro is not skipped by sessionStorage).
  const startup=await film(tv,dir,'startup',{trigger:()=>tv.goto(motionURL(origin)),duration:3800});
  await tv.locator('#tvStartup').waitFor({state:'hidden',timeout:60000});
  await api({type:'bots-set',count:3});await api({type:'select',id:gameId});await sleep(2200*K);
  await tv.screenshot({path:path.join(dir,'lobby-settled.png')});
  // 2. Lobby → game (waiting room)
  const launch=await film(tv,dir,'launch',{trigger:()=>api({type:'launch',id:gameId}),ready:q(()=>!document.getElementById('tvSceneTransition').hidden||!document.getElementById('play').hidden),duration:1900});
  s=await until(async()=>{const x=await api();return x.active?.ui?.phase==='waiting'&&x.active;},'waiting');
  await sleep(1400*K);report.diagnostics=report.diagnostics||{};report.diagnostics[`${w}:launch`]=await tv.evaluate(()=>window.HeyPalsTVMotion?.diagnostics()||null);await tv.screenshot({path:path.join(dir,'waiting-settled.png')});
  // 3. Waiting → countdown/playing
  const start=await film(tv,dir,'start',{trigger:()=>until(async()=>{try{await api({type:'force-start',instance:s.instance});return true;}catch{await sleep(300);return false;}},'force-start',40),ready:q(()=>document.body.dataset.tvPhase&&document.body.dataset.tvPhase!=='waiting'),duration:1400});
  await until(async()=>['playing','results'].includes((await api()).active?.ui?.phase),'playing',600);await sleep(300);
  await tv.screenshot({path:path.join(dir,'playing-settled.png')});
  // 4. Pause / resume
  const pause=await film(tv,dir,'pause',{trigger:()=>api({type:'pause',paused:true}),ready:q(()=>!document.getElementById('paused').hidden),duration:900});
  await sleep(600*K);await tv.screenshot({path:path.join(dir,'paused-settled.png')});
  const resume=await film(tv,dir,'resume',{trigger:()=>api({type:'pause',paused:false}),ready:q(()=>document.getElementById('paused').hidden||!document.getElementById('tvSceneTransition').hidden),duration:950});
  // 5. Playing → results (podium), filmed from the moment the phase flips.
  const results=await film(tv,dir,'results',{ready:async()=>(await phase())==='results',duration:2600,readyTries:6000});
  await sleep(2500*K);await tv.screenshot({path:path.join(dir,'results-settled.png')});
  // 6. Results → lobby
  const stop=await film(tv,dir,'stop',{trigger:()=>api({type:'stop'}),ready:q(()=>!document.getElementById('tvSceneTransition').hidden||document.getElementById('play').hidden),duration:1700});
  await sleep(1500*K);await tv.screenshot({path:path.join(dir,'lobby-return-settled.png')});
  for(const [n,f] of Object.entries({startup,launch,start,pause,resume,results,stop}))await montage(dir,n,f,w,h);
  await ctx.close();
  }
  const ctx2=await browser.newContext({viewport:{width:w,height:h},reducedMotion:reduced?'reduce':'no-preference'});
  const tv2=await ctx2.newPage();tv2.on('pageerror',e=>report.errors.push({surface:`tv${w}-timing`,error:e.message}));
  await tv2.goto(motionURL(origin));await tv2.locator('#tvStartup').waitFor({state:'hidden',timeout:60000});await api({type:'bots-set',count:3}).catch(()=>{});await api({type:'select',id:gameId}).catch(()=>{});await sleep(1500);
  // Frame timing pass, no screenshots.
  if(timing){
   await sleep(800);
   await measure(tv2,`${w}:launch`,()=>api({type:'launch',id:gameId}),2800);
   s=await until(async()=>{const x=await api();return x.active?.ui?.phase==='waiting'&&x.active;},'waiting2');await sleep(900);
   await measure(tv2,`${w}:start`,()=>until(async()=>{try{await api({type:'force-start',instance:s.instance});return true;}catch{await sleep(300);return false;}},'fs2',40),2400);
   await until(async()=>(await api()).active?.ui?.phase==='playing','playing2',600);await sleep(800);
   await measure(tv2,`${w}:pause`,()=>api({type:'pause',paused:true}),1200);
   await measure(tv2,`${w}:resume`,()=>api({type:'pause',paused:false}),1400);
   await measure(tv2,`${w}:stop`,()=>api({type:'stop'}),2400);
  }
  await ctx2.close();await api({type:'bots-set',count:0}).catch(()=>{});
 }
}finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,1));fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
