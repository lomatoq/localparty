'use strict';
// Real managed launcher and two joined human controller tabs, normal clock.
// Weather stress trace is a separate explicit renderer fixture (no server edits).
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/polish123-pocket');fs.mkdirSync(out,{recursive:true});
const sources=['games/arcade_deluxe/public/render.js','games/arcade_deluxe/public/pocket-world.js'];
const hashes=()=>Object.fromEntries(sources.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const report={started:new Date().toISOString(),method:'Actual managed TV + two human browser controllers. DOM Drone launch, joystick and drop on normal authoritative clock; reduced renderer preferences selected in-place to retain the same live server session; separate synthetic weather fixture trace identified below.',sourceStart:hashes(),errors:[],live:[],captures:[]};
let log='',browser;const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'pocket123'}});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,label,ms=25000){const end=Date.now()+ms;while(Date.now()<end){const v=await fn();if(v)return v;await sleep(60);}throw Error(label+' '+log.slice(-600));}
(async()=>{try{
 await until(()=>log.match(/localhost:(\d+)/),'port');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer pocket123','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
 browser=await webkit.launch();const ctx=await browser.newContext();await ctx.addInitScript(()=>localStorage.setItem('local-party-language','en'));const tv=await ctx.newPage();await tv.setViewportSize({width:1280,height:720});tv.on('pageerror',e=>report.errors.push(e.message));await tv.goto(origin+'/tv');
 const phones=[];for(const name of ['Drone Alice','Drone Bob']){const c=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});await c.addInitScript(()=>localStorage.setItem('local-party-language','en'));const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(origin+'/play');await p.locator('#name').fill(name);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);}
 await api({type:'settings',id:'pocket_siege',settings:{rounds:5,sandbox:true,draftMode:false}});await api({type:'launch',id:'pocket_siege'});
 for(const p of phones){await p.waitForFunction(()=>document.querySelector('#gameFrame').src.includes('/games/pocket_siege/'));await p.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await p.locator('#readyButton').click();}
 await until(async()=>(await api()).active?.ui?.phase==='playing','playing');const frame=await until(()=>tv.frames().find(f=>f.url().includes('/games/pocket_siege/')),'TV frame');await frame.waitForFunction(()=>__arcadeRenderer?.weapons&&__arcadeState?.stage==='aim');await frame.evaluate(()=>{const r=__arcadeRenderer,w=r.juice.world;window.weatherTrace=[];const step=w.step.bind(w);w.step=(dt,wind)=>{step(dt,wind);weatherTrace.push({clock:w.clock,dt,turn:r.s?.turn,wind,shown:w.windShown,target:w.weatherWind,cloud:w.cloudDrift,streak:w.streakDrift});};});
 async function capture(name){for(const f of tv.frames())await f.evaluate(()=>document.fonts.ready).catch(()=>{});await tv.screenshot({path:path.join(out,name)});report.captures.push(name);}
 for(const reduced of [false,true]){
  await tv.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  // Renderer reads preference at creation; changing that presentation flag
  // here exercises the same loaded entrypoint without changing game state.
  await frame.evaluate(reduced=>{const r=__arcadeRenderer;r.reduced=reduced;r.juice.reduced=reduced;r.juice.world.reduced=reduced;},reduced);
  const state=await until(()=>frame.evaluate(()=>__arcadeState.stage==='aim'?__arcadeState:null),'next turn',65000);let control;
  for(const p of phones){const f=p.frames().find(f=>f.url().includes('/games/pocket_siege/'));if(await f.evaluate(()=>__arcadeConnection.id)===state.activeId)control=f;}
  assert(control);await control.locator('#droneTab').click();await control.locator('#droneLaunch').click();await frame.waitForFunction(()=>__arcadeState.stage==='drone');await tv.locator('#phase').filter({hasText:'DRONE IN FLIGHT'}).waitFor();
  const label=reduced?'reduced':'full';await tv.setViewportSize({width:1280,height:720});await capture(`drone-launch-${label}-720.png`);
  const before=await frame.evaluate(()=>({...__arcadeState.drone}));const box=await control.locator('#droneStick').boundingBox();const page=control.page();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width-6,box.y+box.height*.35);await sleep(900);await page.mouse.up();
  const moved=await frame.evaluate(()=>({...__arcadeState.drone}));assert(moved.x>before.x+10);report.live.push({reduced,turn:state.turn,launch:before,inFlight:moved});
  await capture(`drone-flight-${label}-720.png`);await tv.setViewportSize({width:1920,height:1080});await sleep(180);await capture(`drone-flight-${label}-1080.png`);
  // Isolated drone materials are drawn from the current live drone, explicitly
  // a visual fixture. Test context restore and low-charge pause stability.
  const strip=await frame.evaluate(()=>{const r=__arcadeRenderer,el=document.createElement('canvas');el.width=420;el.height=90;const c=el.getContext('2d');c.fillStyle='#211546';c.fillRect(0,0,420,90);const colors=['#c4ff38','#ad8dff','#ff759e','#78d7ff'];for(let i=0;i<4;i++){c.save();c.translate(50+i*105,43);c.scale(2,2);r.drone(c,{x:0,y:0,bank:i%2?.22:-.22,charge:.15},r.s,colors[i]);c.restore();}const transform=c.getTransform();return{url:el.toDataURL(),identity:transform.a===1&&transform.d===1&&transform.e===0&&transform.f===0};});assert(strip.identity);fs.writeFileSync(path.join(out,`drone-material-fixture-${label}.png`),Buffer.from(strip.url.split(',')[1],'base64'));
  await control.locator('#droneDrop').click();await frame.waitForFunction(()=>__arcadeState.stage==='flight');await until(()=>frame.evaluate(()=>__arcadeState.stage==='aim'),'drop resolves',65000);await sleep(400);
 }
 report.actualWeather=await frame.evaluate(()=>weatherTrace);assert(new Set(report.actualWeather.map(q=>q.turn)).size>=2);
 for(let i=1;i<report.actualWeather.length;i++){const a=report.actualWeather[i-1],b=report.actualWeather[i];assert(Math.abs(b.cloud-a.cloud)<=31*b.dt+.001,'bounded continuous live cloud displacement');}
 report.weatherFixture=await frame.evaluate(async()=>{const {PocketWorld}=await import(new URL('pocket-world.js',location.href).href),w=new PocketWorld(),rows=[];for(let i=0;i<10800;i++){const wind=i<1800?3:i<3600?-3:i<5400?18:-18;w.step(1/60,wind);if(i%30===0||[1799,1800,3599,3600,5399,5400].includes(i))rows.push({t:w.clock,wind,shown:w.windShown,target:w.weatherWind,cloud:w.cloudDrift,streak:w.streakDrift});}const drift=w.cloudDrift;w.step(0,20);return{rows,paused:w.cloudDrift===drift};});assert(report.weatherFixture.paused);assert.deepEqual(report.errors,[]);report.sourceEnd=hashes();assert.deepEqual(report.sourceEnd,report.sourceStart);console.log('PASS managed live drone launch, joystick, drop, 720/1080 full/reduced; continuous weather across real turns and explicit 180s weather fixture');
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
