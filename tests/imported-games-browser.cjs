'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{spawn}=require('node:child_process');
const {chromium}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out='.localparty-build/imported-ui';fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_INTERNAL_PORT:'0',PARTY_ADMIN_KEY:'import-ui',PARTY_NO_BROWSER:'1'}});let log='',browser;child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await wait(50);const base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async b=>{const r=await fetch(base+'/api/manage',{method:b?'POST':'GET',headers:{Authorization:'Bearer import-ui','Content-Type':'application/json'},...(b?{body:JSON.stringify(b)}:{})});const s=await r.json();assert.ok(r.ok,JSON.stringify(s));return s;};
 browser=await chromium.launch({headless:true,...(process.env.PARTY_CHROMIUM?{executablePath:process.env.PARTY_CHROMIUM}:{}),args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 const context=await browser.newContext({viewport:{width:393,height:852},permissions:['camera'],hasTouch:true});await context.addInitScript(()=>{const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=c=>{if(c.video?.facingMode)c={...c,video:{...c.video,facingMode:undefined}};return original(c);};});const phone=await context.newPage(),tv=await context.newPage();await tv.setViewportSize({width:1280,height:720});await tv.goto(base+'/tv');if(process.env.AUDIT_NATIVE)await phone.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fs.readFileSync('public/native-shell/controller-bridge.js','utf8')});await phone.goto(base+'/play');await phone.locator('#name').fill('Александра Максимова');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();const sent=[];phone.on('websocket',ws=>ws.on('framesent',e=>{try{sent.push(JSON.parse(e.payload));}catch{}}));const errors=[];phone.on('console',m=>{if(m.type()==='warning'||m.type()==='error')console.log('BROWSER',m.text());});phone.on('pageerror',e=>errors.push(e.message));tv.on('pageerror',e=>errors.push(e.message));
 for(const [id,bots]of [['marble_bloom',2],['pocket_siege',5],['bow_club',5]].filter(([id])=>!process.env.AUDIT_GAME||id===process.env.AUDIT_GAME)){
  await api({type:'bots-set',count:bots});await wait(800);await api({type:'launch',id});await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);
  await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await wait(250);const ready=await phone.locator('#readyButton').boundingBox(),footer=await phone.locator('#sessionControls').boundingBox();assert.ok(ready.y+ready.height<=footer.y,id+' ready button above footer');await phone.screenshot({path:out+'/'+id+'-waiting-phone.png'});await tv.screenshot({path:out+'/'+id+'-waiting-tv.png'});await phone.locator('#readyButton').click();
  for(let i=0;i<120;i++){if((await api()).active?.ui?.phase==='playing')break;await wait(100);}await wait(600);
  const frame=phone.frames().find(f=>f.url().includes('/games/'+id+'/')),host=tv.frames().find(f=>f.url().includes('/games/'+id+'/'));
  if(id==='bow_club'){
   if(await frame.locator('#setup').isVisible())await frame.locator('#start').click();
   await frame.waitForFunction(()=>document.getElementById('video').readyState>=2&&!document.getElementById('view').hidden);
   await frame.evaluate(async()=>{
    const {BOARD,markerBits}=await import('./src/markers.mjs');const c=document.createElement('canvas');c.width=720;c.height=1280;const ctx=c.getContext('2d');
    const paint=()=>{ctx.fillStyle='#4b4b4b';ctx.fillRect(0,0,720,1280);if(window.fixtureOccluded)return;for(const tag of BOARD.tags){const x=40+tag.x/2,y=460+tag.y/2;ctx.fillStyle='white';ctx.fillRect(x-4,y-4,56,56);const bits=markerBits(tag.id);for(let i=0;i<36;i++){ctx.fillStyle=bits[i]?'white':'black';ctx.fillRect(x+(i%6)*8,y+Math.floor(i/6)*8,8,8);}}};paint();window.cameraFixtureTimer=setInterval(paint,66);const video=document.getElementById('video');video.srcObject=c.captureStream(15);await video.play();
   });
   await frame.waitForFunction(()=>document.getElementById('view').dataset.engine==='opencv');await frame.waitForFunction(()=>!document.getElementById('draw').disabled);await frame.evaluate(()=>{window.drawEvents=[];for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.getElementById('draw').addEventListener(type,e=>window.drawEvents.push([type,e.target.tagName,performance.now()]));});
   const trackedButton=await frame.locator('#draw').boundingBox();await phone.mouse.move(trackedButton.x+trackedButton.width/2,trackedButton.y+trackedButton.height/2);await phone.mouse.down();await wait(220);await frame.evaluate(()=>window.fixtureOccluded=true);await wait(450);assert.equal(await frame.locator('#draw').evaluate(n=>n.classList.contains('held')),true,'tracking dropout preserves held draw');await frame.evaluate(()=>window.fixtureOccluded=false);await frame.waitForFunction(()=>/Экран найден|Screen found/.test(document.getElementById('tracking').textContent));await phone.mouse.up();await frame.waitForFunction(()=>/9 (стрел|arrows)/.test(document.getElementById('score').textContent));await frame.evaluate(()=>clearInterval(window.cameraFixtureTimer));
   const camera=await frame.locator('#video').evaluate(n=>({rect:{width:n.clientWidth,height:n.clientHeight},fit:getComputedStyle(n).objectFit,stream:!!n.srcObject}));assert.ok(camera.stream&&camera.rect.height>camera.rect.width);assert.equal(camera.fit,'cover');
  }
  for(const width of [393,320]){
   await phone.setViewportSize({width,height:width===320?700:852});await wait(200);assert.ok(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' no horizontal overflow');
   await phone.screenshot({path:out+'/'+id+'-'+width+'.png'});
  }
  assert.ok(await host.evaluate(()=>{const c=document.querySelector('#game,#stage').getBoundingClientRect();return Math.abs(c.width-innerWidth)<2&&Math.abs(c.height-innerHeight)<2;}),id+' fills TV viewport');await tv.screenshot({path:out+'/'+id+'-tv.png'});
  if(id==='marble_bloom'){
   const pad=await frame.locator('#aimpad').boundingBox(),button=await frame.locator('#marbleFire').boundingBox(),cdp=await context.newCDPSession(phone);
   const a={x:pad.x+pad.width*.5,y:pad.y+pad.height*.5,id:1},b={x:button.x+button.width*.5,y:button.y+button.height*.5,id:2};
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});a.x+=20;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[a]});await wait(60);
   const before=sent.filter(m=>m.type==='fire').length;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,b]});await wait(60);
   assert.equal(sent.filter(m=>m.type==='fire').length,before+1,'fires with aim finger still held');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[a]});const aims=sent.filter(m=>m.type==='aim').length;a.x+=20;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[a]});await wait(60);assert.ok(sent.filter(m=>m.type==='aim').length>aims,'aim continues after second finger fires');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(60);assert.equal(sent.filter(m=>m.type==='fire').length,before+1,'no duplicate click shot');await cdp.detach();
  }
  if(id==='pocket_siege'){
   await frame.locator('#weaponButton').click();await frame.locator('#arsenal:not(.hidden)').waitFor();await phone.screenshot({path:out+'/pocket-siege-arsenal.png'});assert.ok(await frame.locator('.weapon-tile').evaluateAll(ns=>ns.every(n=>n.scrollWidth<=n.clientWidth+1)),'weapon names wrap');await frame.locator('#closeArsenal').click();
  }
  if(id==='bow_club'){
   await frame.locator('#back').click();await frame.locator('#touch').click();
   const pad=await frame.locator('#touchPad').boundingBox();await phone.mouse.click(pad.x+pad.width*.5,pad.y+pad.height*.42);
   const button=await frame.locator('#draw').boundingBox();await phone.mouse.move(button.x+button.width/2,button.y+button.height/2);await phone.mouse.down();await wait(650);await phone.mouse.up();await frame.waitForFunction(()=>/8 (стрел|arrows)/.test(document.getElementById('score').textContent));await wait(3200);await tv.screenshot({path:out+'/bow-club-stuck-arrow.png'});
   assert.equal(await frame.evaluate(()=>getComputedStyle(document.querySelector('#draw small')).color),'rgb(40, 56, 23)');
   for(const pull of [0,1]){await frame.evaluate(async pull=>{const {Bow3D}=await import('./src/mini3d.mjs');let c=document.getElementById('bow-proof');if(!c){c=document.createElement('canvas');c.id='bow-proof';c.style='position:fixed;inset:0;width:100%;height:100%;z-index:100;background:#242135';document.body.append(c);}const r=new Bow3D(c);r.frame(innerWidth,innerHeight,pull,0,0,'right');},pull);await frame.locator('#bow-proof').screenshot({path:out+'/bow-string-'+pull+'.png'});await frame.locator('#bow-proof').evaluate(n=>n.remove());}
  }
  await phone.locator('#pauseButton').click();await phone.locator('#pauseOverlay').waitFor();await phone.screenshot({path:out+'/'+id+'-pause.png'});await phone.locator('#resumeButton').click();await api({type:'stop'});await phone.setViewportSize({width:393,height:852});await wait(250);console.log('PASS',id,'max roster, TV field, mobile widths, pause'+(id==='bow_club'?', explicit portrait camera':''));
 }
 assert.deepEqual(errors,[]);
}finally{await browser?.close();child.kill();}})().catch(e=>{console.error(e,log.slice(-500));process.exitCode=1;});
