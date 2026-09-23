'use strict';
const {spawn}=require('node:child_process'),assert=require('node:assert/strict'),fs=require('node:fs');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'input-release-audit'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const delay=ms=>new Promise(r=>setTimeout(r,ms)),report={games:[],errors:[]};
async function until(fn){for(let i=0;i<200;i++){if(await fn())return;await delay(50);}throw Error('Timeout '+log.slice(-500));}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log));const base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer input-release-audit','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const s=await r.json();assert(r.ok,JSON.stringify(s));return s;};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage();await tv.goto(base+'/tv');const phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 await phone.addInitScript(()=>{window.__opened=0;window.__auditSockets=[];const Original=WebSocket;window.WebSocket=class extends Original{constructor(...args){super(...args);window.__auditSockets.push(this);this.addEventListener('open',()=>window.__opened++);}};});
 phone.on('pageerror',e=>report.errors.push(e.message));await phone.goto(base+'/play');await phone.locator('#name').fill('Input test');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor({state:'visible'});await api({type:'bots-set',count:1});
 const games=[['push','#joystickZone','joy.x!==0||joy.y!==0','joy.x===0&&joy.y===0&&joyPointer===null'],['shrink','#joystickZone','joy.x!==0||joy.y!==0','joy.x===0&&joy.y===0&&joyPointer===null'],['bomb','#joystickZone','joy.x!==0||joy.y!==0','joy.x===0&&joy.y===0&&joyPointer===null'],['tankarena','#joy','joy.x!==0||joy.y!==0','joy.x===0&&joy.y===0&&pointer===null'],['hungry','#joy','axis.x!==0||axis.y!==0','axis.x===0&&axis.y===0'],['snakelines','#joy','axis.x!==0||axis.y!==0','axis.x===0&&axis.y===0'],['carryball','#joy','axis.x!==0||axis.y!==0','axis.x===0&&axis.y===0'],['kart','#steerLeft','steer===-1','steer===0&&steeringHolds.size===0'],['kart','#steerRight','steer===1','steer===0&&steeringHolds.size===0'],['kart','#gasBtn','throttle===1','throttle===0&&gasPointer===null'],['tanks','#forwardBtn','input.forward','!input.forward&&!input.fire']];
 for(const [id,selector,held,neutral] of games){
  await api({type:'launch',id});await phone.locator('#readyButton').waitFor({state:'visible'});
  // This suite isolates input recovery, not combat: an active opponent can kill
  // the phone between mouse-down and the assertion. Bot combat has its own suite.
  await until(()=>tv.frames().some(f=>f.parentFrame()&&f.parentFrame()!==tv.mainFrame()&&f.url().includes('/games/'+id+'/')));
  for(const bot of tv.frames().filter(f=>f.parentFrame()&&f.parentFrame()!==tv.mainFrame()&&f.url().includes('/games/'+id+'/'))){await bot.waitForFunction(()=>typeof window.PARTY_BOT_TICK==='function');await bot.evaluate(()=>{window.PARTY_BOT_TICK=()=>{};});}
  await phone.locator('#readyButton').click();await until(async()=>['countdown','playing'].includes((await api()).active?.ui?.phase));
  const f=phone.frames().find(f=>f.url().includes('/games/'+id+'/')),control=f.locator(selector);await control.waitFor({state:'visible'});await until(()=>control.isEnabled());
  for(const event of ['pointercancel','lostpointercapture','blur','offline']){
   const r=await control.boundingBox();await phone.mouse.move(r.x+r.width*.72,r.y+r.height*.5);await phone.mouse.down();assert(await f.evaluate(held),id+' press must engage control');
   if(event==='blur'||event==='offline')await f.evaluate(type=>window.dispatchEvent(new Event(type)),event);else await control.dispatchEvent(event,{pointerId:1,pointerType:'mouse'});
   assert(await f.evaluate(neutral),id+' '+event+' must release state');await phone.mouse.up();
  }
  // Reconnect while the finger is still DOWN, not after a convenient release.
  const r=await control.boundingBox();await phone.mouse.move(r.x+r.width*.72,r.y+r.height*.5);await phone.mouse.down();assert(await f.evaluate(held),id+' held before reconnect');
  const opened=await f.evaluate(()=>window.__opened);await f.evaluate(()=>window.dispatchEvent(new Event('online')));await f.waitForFunction(n=>window.__opened>n,opened);await until(async()=>(await api()).active.ready.length===2);
  assert(await f.evaluate(neutral),id+' recovery must not restore a held direction');await phone.mouse.up();
  // A neutral but permanently disabled controller is also a failure.
  await until(()=>control.isEnabled());const resumed=await control.boundingBox();await phone.mouse.move(resumed.x+resumed.width*.72,resumed.y+resumed.height*.5);
  await phone.mouse.down();assert(await f.evaluate(held),id+' new press after reconnect');await phone.mouse.up();assert(await f.evaluate(neutral),id+' release after reconnect');
  await phone.mouse.down();assert(await f.evaluate(held),id+' held before transport loss');
  const transportOpened=await f.evaluate(()=>window.__opened);await f.evaluate(()=>{for(const socket of window.__auditSockets)if(socket.readyState===1)socket.close(4000,'test transport interruption');});
  await f.waitForFunction(n=>window.__opened>n,transportOpened);await until(async()=>(await api()).active.ready.length===2);
  assert(await f.evaluate(neutral),id+' bare transport recovery must clear held direction');await phone.mouse.up();
  await until(()=>control.isEnabled());const recovered=await control.boundingBox();await phone.mouse.move(recovered.x+recovered.width*.72,recovered.y+recovered.height*.5);
  await phone.mouse.down();assert(await f.evaluate(held),id+' press after transport recovery');await phone.mouse.up();assert(await f.evaluate(neutral));
  report.games.push({id,scenarios:['pointercancel','lostpointercapture','blur','offline','reconnect-while-held','press-after-reconnect','transport-loss-while-held','press-after-transport-loss'],passed:true});console.log('PASS',id,'release/re-arm and connection recovery');
  await api({type:'stop'});await phone.locator('#home').waitFor({state:'visible'});
 }
 assert.deepEqual(report.errors,[]);
}finally{fs.mkdirSync('.localparty-build/input-release-audit',{recursive:true});fs.writeFileSync('.localparty-build/input-release-audit/report.json',JSON.stringify(report,null,2));await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
