'use strict';
// Real Canvas renderer, authoritative state shape; escaped/returning paths are
// deterministic presentation fixtures, not a claim about weapon balance.
const assert=require('node:assert/strict'),express=require('express'),fs=require('node:fs'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs'),{BY_ID}=require('../games/arcade_deluxe/core/weapons.cjs');
(async()=>{
 const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/pocket119-camera');fs.mkdirSync(out,{recursive:true});
 const app=express().get('/hud-test',(_,res)=>res.send('<style>body{margin:0}.gamebar{position:fixed;top:0;left:0;right:0;z-index:2;pointer-events:none}.tv-info-dock{width:600px;height:120px;margin:auto;background:#1b273d;border-radius:0 0 24px 24px;color:white;text-align:center;padding-top:10px;box-sizing:border-box}iframe{position:fixed;left:0;top:0;width:66.666667vw;height:66.666667vh;transform:scale(1.5);transform-origin:0 0;border:0}</style><iframe src="/geometry.js"></iframe><div class="gamebar"><div class="tv-info-dock">MEASURED PARENT HUD</div></div>')).use('/shared',express.static('public/assets')).use(express.static('games/arcade_deluxe/public'));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));let browser;const rows=[];
 try{
  browser=await webkit.launch();const game=new Tanks(7);game.add({id:'a',name:'Alexandra LongSurname',connected:true});game.add({id:'b',name:'BRAVO',connected:true});game.start({sandbox:true});
  for(const reduced of [false,true])for(const viewport of [{width:1280,height:720},{width:1920,height:888}]){
   const page=await browser.newPage({viewport,reducedMotion:reduced?'reduce':'no-preference'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/geometry.js`);
   await page.evaluate(async({s,weapons})=>{
    document.body.innerHTML='<style>@font-face{font-family:KardiaFit;src:url(/shared/fonts/kardia/kardia-fit.otf)}@font-face{font-family:KardiaFatRunner;src:url(/shared/fonts/kardia/kardia-fat-runner.otf)}body{margin:0}canvas{width:100vw;height:100vh;display:block}</style><canvas></canvas>';
    const {Renderer}=await import('/render.js');window.r=new Renderer(document.querySelector('canvas'));r.weapons=weapons;r.siegeFX.setWeapons(weapons);r.setState({...s,stage:'aim',events:[]});cancelAnimationFrame(r.raf);await r.projectileArt.ready;await document.fonts.ready;
    window.paint=(s,n=90)=>{r.setState(s);for(let i=0;i<n;i++){r.frame(r.last+1000/60);cancelAnimationFrame(r.raf);}};
   },{s:game.snapshot(),weapons:BY_ID});
   const result=await page.evaluate(()=>{
    const base={...r.s,stage:'flight',events:[]},source=JSON.stringify(base),cam=[],cues=[];
    for(const [y,vy] of [[-900,-500],[-1e8,-500],[-900,500],[200,300]]){
     paint({...base,projectiles:[{id:100,x:640,y,vx:60,vy,owner:'a',weapon:'single_shot',sourceBullet:'SingleShotBullet'}]});
     cam.push({...r.cam});cues.push(r.flightCues.map(q=>({...q})));
    }
    paint({...base,projectiles:Array.from({length:200},(_,i)=>({id:200+i,x:630+i%20,y:-3000,vx:10,vy:200,owner:'a',weapon:'single_shot'}))});const capped=r.flightCues.length;
    const fill=r.c.fillText.bind(r.c),texts=[];r.c.fillText=(text,...args)=>{texts.push(String(text));return fill(text,...args);};
    paint({...base,turn:1,stage:'aim',activeId:'b',t:20,projectiles:[]},1);const notice=texts.includes('TURN')&&texts.includes('BRAVO');texts.length=0;paint({...r.s,t:22},1);const expired=!texts.includes('TURN');texts.length=0;paint({...base,turn:2,stage:'aim',activeId:'a',t:30,projectiles:[]},1);paint({...r.s,stage:'flight',t:30.1},1);const hidesOnFire=texts.filter(t=>t==='TURN').length===1;
    paint({...base,projectiles:[{id:999,x:640,y:-3000,vx:60,vy:500,owner:'a',weapon:'single_shot'}],paused:true},1);const before=r.el.toDataURL();paint(r.s,2);const paused=before===r.el.toDataURL();
    return {cam,cues,capped,notice,expired,hidesOnFire,paused,immutable:source===JSON.stringify(base)};
   });
   result.cam.forEach(c=>{assert(c.z>=.76&&c.z<=1);assert(c.y>=200&&c.y<=414);});assert.equal(result.cues[0].length,1);assert.equal(result.cues[1].length,1);assert(result.cues[0][0].angle<0);assert(result.cues[2][0].angle>0);assert.equal(result.cues[3].length,0);assert(result.capped<=3);assert(result.notice&&result.expired&&result.hidesOnFire&&result.paused&&result.immutable,JSON.stringify(result));assert.deepEqual(errors,[]);
   await page.evaluate(()=>paint({...r.s,paused:false,stage:'flight',projectiles:[{id:901,x:640,y:-3000,vx:60,vy:500,owner:'a',weapon:'single_shot'}]},90));await page.screenshot({path:path.join(out,`returning-${viewport.width}-${reduced?'reduced':'full'}.png`)});
   await page.evaluate(()=>paint({...r.s,stage:'aim',turn:30,activeId:'a',t:40,projectiles:[]},1));await page.evaluate(()=>{r.s.t=40.25;r.frame(r.last+16);cancelAnimationFrame(r.raf);});await page.screenshot({path:path.join(out,`turn-${viewport.width}-${reduced?'reduced':'full'}.png`)});
   rows.push({viewport,reduced,result,errors});console.log('PASS camera, edge direction, timed name',viewport.width,reduced?'reduced':'full');await page.close();
  }
  const parent=await browser.newPage({viewport:{width:1280,height:720}});await parent.goto(`http://127.0.0.1:${server.address().port}/hud-test`);const child=parent.frames().find(f=>f!==parent.mainFrame());
  const safe=await child.evaluate(async({s,weapons})=>{document.body.innerHTML='<style>body{margin:0}canvas{position:fixed;inset:0;width:100vw;height:100vh}</style><canvas></canvas>';const {Renderer}=await import('/render.js');const r=new Renderer(document.querySelector('canvas'));r.weapons=weapons;r.setState({...s,stage:'flight',projectiles:[{id:4000,x:640,y:-3000,vx:10,vy:300,weapon:'single_shot',owner:'a'}]});r.frame(r.last+16);cancelAnimationFrame(r.raf);return {bounds:r.pocketNoticeBounds(),cue:r.flightCues[0]};},{s:game.snapshot(),weapons:BY_ID});assert(safe.bounds.top>=150);assert(safe.cue.y-21>=120);rows.push({kind:'scaled parent HUD measurement',safe});await parent.screenshot({path:path.join(out,'parent-safe-1280.png')});await parent.close();console.log('PASS measured parent header clearance');
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
