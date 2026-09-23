// Real TV + phone pages in WebKit. Exercises receiver resize without reconnecting a match.
const {spawn}=require('node:child_process'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright'),WS=require('ws');
const root=path.resolve(__dirname,'..'),measure=require('../public/tv-layout');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const sizes=[[1280,720],[1920,1080],[3840,2160],[2560,1600],[3024,1964],[1024,768],[3440,1440],[5120,1440],[1080,1920]];
let browser,base,log='',sockets=[];
const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'tv-layout-test',PARTY_PORT:'0'}});
child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
async function until(fn,label){for(let n=0;n<300;n++){if(await fn())return;await delay(50);}throw Error('Timeout '+label+' '+log.slice(-800));}
async function manage(value){const response=await fetch(base+'/api/manage',{method:value?'POST':'GET',headers:{Authorization:'Bearer tv-layout-test','Content-Type':'application/json'},body:value?JSON.stringify(value):undefined});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data;}
async function join(name){const ws=new WS(base.replace('http','ws')+'/lobby');sockets.push(ws);ws.on('message',b=>{const m=JSON.parse(b);if(m.type==='joined')ws.profile=m;});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});ws.send(JSON.stringify({type:'join',name}));await until(()=>ws.profile,'join');return ws;}
async function geometry(tv,lobby=false){return tv.evaluate(lobby=>{
 const box=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
 const stage=document.getElementById('tvStage'),frame=document.getElementById('gameFrame'),qr=document.getElementById('qr');
 return {stage:box(stage),frame:box(frame),qr:box(qr),width:innerWidth,height:innerHeight,logical:[stage.clientWidth,stage.clientHeight],
  overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,
  content:lobby?[...document.querySelectorAll('#lobby>.selection,#lobby>aside')].map(box):[],
  frameClient:[frame.clientWidth,frame.clientHeight],people:document.querySelectorAll('#players .player:not(.tv-more)').length};
 },lobby);}
function check(g,size,lobby=false){const expected=measure(...size);assert.deepEqual(g.logical,[expected.width,expected.height]);assert.equal(g.overflow,false,'receiver scrollbars');
 assert.ok(g.stage.x>=-1&&g.stage.y>=-1&&g.stage.right<=size[0]+1&&g.stage.bottom<=size[1]+1,JSON.stringify(g));
 assert.ok(Math.abs(g.stage.w/g.stage.h-expected.width/expected.height)<.001,'uniform scale');
 if(lobby){assert.ok(Math.abs(g.qr.w-g.qr.h)<1,'square QR');assert.equal(g.people,16);for(const r of g.content)assert.ok(r.bottom<=g.stage.bottom+1&&r.right<=g.stage.right+1,'lobby fits: '+JSON.stringify(g));}
 else assert.ok(g.frame.h>0&&g.frame.bottom<=g.stage.bottom+1&&g.frame.right<=g.stage.right+1,'game fits');
}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'server');base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];await manage({type:'server-start'});
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];tv.on('pageerror',e=>errors.push(e.message));await tv.goto(base+'/tv');await until(async()=>(await manage()).screens===1,'screen');
 const people=[];for(let i=0;i<16;i++)people.push(await join('Игрок '+i+' Длинное имя'));
 const catalog=(await manage()).catalog;
 if(!process.env.PARTY_LAYOUT_GAMES_ONLY)for(const size of sizes){await tv.setViewportSize({width:size[0],height:size[1]});await tv.waitForFunction(w=>document.getElementById('tvStage').clientWidth===w,measure(...size).width);for(const game of catalog){await manage({type:'select',id:game.id});await tv.waitForFunction(id=>!!document.querySelector(`[data-game="${id}"].selected`),game.id);check(await geometry(tv,true),size,true);}console.log('PASS lobby, 30 selections, 16 players '+size.join('x'));}
 for(const person of people.slice(2))await manage({type:'kick',id:person.profile.id});
 const phones=[];for(const p of people.slice(0,2)){const phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});phone.on('pageerror',e=>errors.push(e.message));await phone.goto(base+'/play');await phone.evaluate(({id,token,name,hand})=>localStorage.setItem('local-party-profile',JSON.stringify({id,token,name,hand})),p.profile);await phone.reload();await phone.locator('#home').waitFor();phones.push(phone);}
 for(const id of ['bowling','tankarena','kart','warsaw']){
  await tv.setViewportSize({width:1280,height:720});const run=(await manage({type:'launch',id})).active;
  for(const phone of phones){try{await phone.locator('#readyButton').click({timeout:15000});}catch(error){console.error('PHONE',await phone.locator('body').innerText());console.error('STATE',JSON.stringify((await manage()).active));throw error;}}
  await until(async()=>['playing','countdown'].includes((await manage()).active?.ui.phase),id+' start');
  const frame=tv.frames().find(f=>f.url().includes('/games/'+id+'/'));assert.ok(frame,id+' iframe');
  await frame.evaluate(()=>window.__resizeSentinel='same-game');
  let baseFont;
  for(const size of sizes){await tv.setViewportSize({width:size[0],height:size[1]});await tv.waitForFunction(w=>document.getElementById('tvStage').clientWidth===w,measure(...size).width);await delay(200);const g=await geometry(tv);check(g,size);
   const inner=await frame.evaluate(()=>({w:innerWidth,h:innerHeight,sentinel:window.__resizeSentinel,canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,w:c.clientWidth,h:c.clientHeight,bufferWidth:c.width,bufferHeight:c.height,fit:getComputedStyle(c).objectFit}))}));
   if(['tankarena','kart'].includes(id)){const canvas=inner.canvases.find(c=>c.id===(id==='kart'?'gameCanvas':'arena'));assert.ok(canvas&&canvas.w>0&&canvas.h>0,'visible game canvas');assert.ok(canvas.fit==='contain'||Math.abs(canvas.w/canvas.h-canvas.bufferWidth/canvas.bufferHeight)<.01,'preserved game aspect '+JSON.stringify(canvas));}
   assert.equal(inner.sentinel,'same-game');assert.ok(Math.abs(inner.w-g.frameClient[0])<2,'logical game width '+JSON.stringify({id,size,inner,g,expected:measure(...size)}));assert.ok(Math.abs(inner.h-g.frameClient[1])<2,'logical game height '+JSON.stringify({id,size,inner,g,expected:measure(...size)}));
   const font=await tv.locator('#connection').evaluate(n=>parseFloat(getComputedStyle(n).fontSize));baseFont??=font;assert.equal(font,baseFont,'stable logical text size');
   const current=await manage();assert.equal(current.active.instance,run.instance);assert.equal(current.players.length,2);assert.equal(current.screens,1);
   if(process.env.PARTY_LAYOUT_SHOTS&&[1920,3840,3024].includes(size[0])){fs.mkdirSync(process.env.PARTY_LAYOUT_SHOTS,{recursive:true});await tv.screenshot({path:path.join(process.env.PARTY_LAYOUT_SHOTS,id+'-'+size.join('x')+'.png')});}
  }
  await manage({type:'pause',paused:true});await tv.locator('#paused').waitFor();await tv.locator('#paused').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{})));});const overlay=await tv.locator('#paused').boundingBox(),f=await tv.locator('#gameFrame').boundingBox();assert.ok(Math.abs(overlay.y-f.y)<1&&Math.abs(overlay.height-f.height)<1,'pause covers game '+JSON.stringify({id,overlay,f}));
  await manage({type:'pause',paused:false});await manage({type:'stop'});console.log('PASS gameplay resize, unchanged match, pause '+id);
 }
 assert.deepEqual(errors,[]);console.log('PASS TV layout: all receiver sizes, no page errors');
}finally{for(const s of sockets)s.terminate();await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
