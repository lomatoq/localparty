'use strict';
// Actual managed Kart/controller + production native bridge/tabs. Ended-state
// release is an explicitly labelled renderer fixture, never an engine result.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium,webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.env.QA_OUTPUT||'output/playwright/performance243/kart-input');fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_PORT:'0',PARTY_ADMIN_KEY:'kart-input243'}});
let log='',base,browser;child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);const wait=ms=>new Promise(r=>setTimeout(r,ms));
const report={method:'Real worker/native route input; explicitly simulated finished renderer only for held-control cleanup',runs:[],errors:[]};
async function until(fn,label){for(let n=0;n<400;n++){if(await fn())return;await wait(50);}throw Error(label+' '+log.slice(-800));}
async function api(body){const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer kart-input243','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const s=await r.json();assert.equal(r.status,200,JSON.stringify(s));return s;}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'server');base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];await api({type:'server-start'});
 for(const[engine,provider]of Object.entries({chromium,webkit})){
  browser=await provider.launch({headless:true,...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
  const tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>report.errors.push(engine+' TV: '+e.message));await tv.goto(base+'/tv');await until(async()=>(await api()).screens===1,'actual shared screen');
  const phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});phone.on('pageerror',e=>report.errors.push(engine+': '+e.message));
  await phone.addInitScript({content:'window.__partyPersistentTabs=true;window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fs.readFileSync(path.join(root,'public/native-shell/controller-bridge.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'public/native-shell/tabs.js'),'utf8')});
  await phone.goto(base+'/play');await phone.locator('#name').fill('Kart input '+engine);await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();await api({type:'bots-set',count:1});await wait(500);
  const run=(await api({type:'launch',id:'kart'})).active;await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await phone.locator('#readyButton').click();await until(async()=>(await api()).active?.ui.phase==='playing','real race');
  const frame=phone.frames().find(f=>f.url().includes('/games/kart/'));assert(frame,'real controller iframe');await frame.waitForFunction(()=>playerId&&gameState?.status==='racing');
  await frame.evaluate(()=>{window.__inputSent=[];const original=ws.send.bind(ws);ws.send=value=>{const data=JSON.parse(value);if(data.type==='input')__inputSent.push(data);return original(value);};});
  const state=()=>frame.evaluate(()=>({steer,throttle,held:steeringHolds.size,gas:gasBtn.disabled,left:steeringButtons[0].disabled,right:steeringButtons[1].disabled,sent:__inputSent.at(-1)}));
  const point=async selector=>{const b=await frame.locator(selector).boundingBox();assert(b);return{x:b.x+b.width/2,y:b.y+b.height/2};};
  let touch;
  if(engine==='chromium'){
   const cdp=await phone.context().newCDPSession(phone);touch=async(type,points=[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
   const left=await point('#steerLeft'),right=await point('#steerRight'),gas=await point('#gasBtn');
   await touch('touchStart',[{id:1,...left},{id:2,...gas}]);await frame.waitForFunction(()=>steer===-1&&throttle===1);assert.deepEqual((await state()).sent.steer,-1);
   await phone.screenshot({path:path.join(out,'chromium-real-held.png')});
   await touch('touchCancel');await frame.waitForFunction(()=>steer===0&&throttle===0&&steeringHolds.size===0);
   // Opposite touches cancel steer numerically but both holds must be retired.
   await touch('touchStart',[{id:3,...left},{id:4,...right},{id:5,...gas}]);await frame.waitForFunction(()=>steer===0&&throttle===1&&steeringHolds.size===2);
  }else{
   const left=await point('#steerLeft');await phone.mouse.move(left.x,left.y);await phone.mouse.down();await frame.waitForFunction(()=>steer===-1);await phone.mouse.up();await frame.waitForFunction(()=>steer===0);
   const gas=await point('#gasBtn');await phone.mouse.move(gas.x,gas.y);await phone.mouse.down();await frame.waitForFunction(()=>throttle===1);await phone.screenshot({path:path.join(out,'webkit-real-held.png')});
  }
  const ended=await frame.evaluate(()=>{
   const live=gameState,handler=ws.onmessage;ws.onmessage=()=>{};
   gameState={...live,status:'results',players:live.players.map(p=>p.id===playerId?{...p,finish_order:1}:p)};
   updateStats();const first={steer,throttle,held:steeringHolds.size,disabled:[gasBtn.disabled,...steeringButtons.map(b=>b.disabled)],messages:__inputSent.length};updateStats();const duplicate=__inputSent.length-first.messages;
   window.__restoreLive=()=>{gameState=live;ws.onmessage=handler;updateStats();};return{fixture:'finished renderer only',...first,duplicate};
  });
  assert.equal(ended.steer,0);assert.equal(ended.throttle,0);assert.equal(ended.held,0);assert(ended.disabled.every(Boolean));assert.equal(ended.duplicate,0,'Unchanged finished snapshot cannot resend control releases');
  if(touch)await touch('touchEnd');else await phone.mouse.up();await frame.evaluate(()=>__restoreLive());await frame.waitForFunction(()=>!gasBtn.disabled&&!steeringButtons.some(b=>b.disabled));
  await frame.locator('#gasBtn').focus();await phone.keyboard.down('Space');await frame.waitForFunction(()=>throttle===1);await phone.keyboard.up('Space');await frame.waitForFunction(()=>throttle===0);
  await frame.evaluate(()=>__inputSent=[]);await wait(600);const heartbeat=await frame.evaluate(()=>__inputSent);assert(heartbeat.length>=12&&heartbeat.length<=26,'30Hz safety heartbeat remains active');assert(heartbeat.every(m=>m.steer===0&&m.throttle===0));
  assert.equal((await api()).active.instance,run.instance,'Input cleanup never restarts match');report.runs.push({engine,ended,heartbeatCount:heartbeat.length,instance:run.instance});await api({type:'stop'});
  await browser.close();browser=null;const players=(await api()).players;for(const p of players)if(!p.bot)await api({type:'kick',id:p.id});
 }
 assert.deepEqual(report.errors,[]);console.log('PASS Kart real input holds/cancel/keyboard/heartbeat and explicit ended cleanup in both engines');
}finally{await browser?.close();child.kill();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}})().catch(e=>{report.failure=e.message;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
