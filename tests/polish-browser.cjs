'use strict';
const fs=require('node:fs'),path=require('node:path'),net=require('node:net'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {chromium}=require('playwright');
const ROOT=path.join(__dirname,'..'),OUT=path.join(ROOT,'test-results/polish-v2');fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function thumbnail(page,name,width=760){const raw=await page.screenshot({animations:'disabled'});const base64=await page.evaluate(({base64,width})=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=width;c.height=Math.round(img.height*width/img.width);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.72).split(',')[1]);};img.onerror=reject;img.src='data:image/png;base64,'+base64;}),{base64:raw.toString('base64'),width});fs.writeFileSync(path.join(OUT,name+'.jpg'),Buffer.from(base64,'base64'));}
async function roomCommand(page,type,data={}){return page.evaluate(({type,data})=>{window.qaLobby.send(JSON.stringify({type,...data}));},{type,data});}
(async()=>{
 const port=await freePort(),base=`http://127.0.0.1:${port}`,logs=[],env={...process.env,PARTY_NO_BROWSER:'1',PARTY_EPHEMERAL:'1',PARTY_PORT:String(port)};delete env.PARTY_TLS_PFX;delete env.PARTY_MANAGED;
 const server=spawn(process.execPath,['server.js'],{cwd:ROOT,env,stdio:['ignore','pipe','pipe']});server.stdout.on('data',b=>logs.push(String(b)));server.stderr.on('data',b=>logs.push(String(b)));
 let browser;const report={testedCommit:process.env.GITHUB_SHA||'local',cases:[],errors:[],generatedAt:new Date().toISOString()};
 try{
  for(let i=0;i<150;i++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}await sleep(100);}
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
  const hc=await browser.newContext({viewport:{width:1440,height:1000}}),host=await hc.newPage();
  let current='lobby';const errors=[];host.on('pageerror',e=>errors.push({game:current,screen:'host',message:e.message}));await host.goto(base+'/host');
  await host.locator('.game[data-id="bowling"]').waitFor();
  await host.evaluate(()=>new Promise(resolve=>{window.qaLobby=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/lobby`);qaLobby.onopen=()=>qaLobby.send(JSON.stringify({type:'host',key:window.PARTY_HOST_KEY}));qaLobby.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='state')window.qaState=m;if(m.type==='host-ok')resolve();};}));
  const phones=[];for(let i=0;i<2;i++){const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await ctx.newPage();p.on('pageerror',e=>errors.push({game:current,screen:'phone'+i,message:e.message}));await p.goto(base+'/');await p.locator('#name').fill(i?'Арина':'Глеб');if(i===0)await p.locator('input[name="hand"][value="left"]').check();await p.locator('#joinForm button').click();await p.locator('#home').waitFor();phones.push(p);}
  const catalog=await host.evaluate(()=>window.qaState.catalog),newIds=['bowling','curling','gate_siege','pop_shots'];assert.equal(catalog.length,30);
  await thumbnail(host,'catalog');
  for(const mode of (process.env.POLISH_GAMES?process.env.POLISH_GAMES.split(','):[...newIds,...catalog.map(g=>g.id).filter(id=>!newIds.includes(id))])){
   current=mode;const entry={mode,native:newIds.includes(mode),loaded:false,started:false,phoneBounds:[]};report.cases.push(entry);console.log('POLISH_BEGIN',mode);
   try{
    await roomCommand(host,'launch',{id:mode});
    await host.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),mode,{timeout:20000});
    for(const p of phones){await p.bringToFront();await p.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),mode,{timeout:20000,polling:100});}
    await host.waitForFunction(id=>window.qaState?.active?.id===id&&window.qaState.players.every(p=>p.gameReady),mode,{timeout:20000,polling:100});
    for(const p of phones){await p.bringToFront();await p.locator('#readyButton').waitFor({state:'visible',timeout:12000});await p.locator('#readyButton').click({timeout:12000});}
    await host.bringToFront();
    const frame=host.frameLocator('#gameFrame');
    await host.waitForFunction(()=>['playing','countdown','reveal','results'].includes(document.body.dataset.phase),null,{timeout:20000,polling:100});entry.started=true;
    await sleep(entry.native?800:300);entry.loaded=true;
    entry.phase=await host.locator('body').getAttribute('data-phase');
    if(entry.native){
     await frame.locator('#ap-stage canvas').waitFor();assert.equal(await frame.locator('#ap-error').isVisible(),false);entry.canvas=await frame.locator('#ap-stage canvas').count();
     const h=await frame.locator('html').getAttribute('data-party-layout');assert.equal(h,'native-v2');
     entry.legacyCss=await frame.locator('link[href="/game-polish.css"]').count();entry.duplicateSelect=await frame.locator('.lp-select').count();assert.equal(entry.legacyCss,0);assert.equal(entry.duplicateSelect,0);
     for(const p of phones){const f=p.frameLocator('#gameFrame');await f.locator('#ap-state').waitFor();const bounds=await f.locator('body').evaluate(body=>{const rects=[...body.querySelectorAll('#ap-hand,#ap-phone-meter,#ap-swipe,#ap-sweep,#ap-aim,#ap-fire,#ap-ability')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {id:e.id,x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right};});return {w:innerWidth,h:innerHeight,overflow:document.documentElement.scrollWidth-innerWidth,rects};});entry.phoneBounds.push(bounds);assert.ok(bounds.overflow<=2);for(const r of bounds.rects){assert.ok(r.x>=-1&&r.y>=-1&&r.right<=bounds.w+2&&r.bottom<=bounds.h+2,mode+' control outside viewport '+r.id+': '+JSON.stringify(r));}}
     if(['bowling','curling'].includes(mode)){
      const startCamera=await frame.locator('#ap-stage').getAttribute('data-camera');let thrower;
      for(const p of phones){if((await p.frameLocator('#gameFrame').locator('#ap-state').innerText()).includes('Твой бросок'))thrower=p;}
      assert.ok(thrower,'active thrower missing');const controls=thrower.frameLocator('#gameFrame');await controls.locator('#ap-precise-open').click();await controls.locator('#ap-power').evaluate(e=>{e.value='.75';e.dispatchEvent(new Event('input',{bubbles:true}));});await controls.locator('#ap-throw').click();await sleep(1500);
      const endCamera=await frame.locator('#ap-stage').getAttribute('data-camera');entry.cameraChanged=startCamera!==endCamera;assert.ok(entry.cameraChanged,'camera did not follow');
      const ndc=await frame.locator('#ap-stage').getAttribute('data-projectile-ndc');entry.projectileNdc=ndc;if(ndc){const [x,y,z]=ndc.split(',').map(Number);assert.ok(Math.abs(x)<1&&Math.abs(y)<1&&z<1,'projectile outside view '+ndc);}
      await thumbnail(host,mode+'-action');
     }else{
      const f=phones[0].frameLocator('#gameFrame'),r=await f.locator('#ap-fire').boundingBox();await phones[0].mouse.move(r.x+r.width/2,r.y+r.height/2);await phones[0].mouse.down();await sleep(350);await phones[0].mouse.up();assert.equal(await f.locator('#ap-fire').evaluate(e=>e.classList.contains('held')),false);if(mode==='gate_siege')await sleep(2000);
     }
     await thumbnail(host,mode+'-host');await thumbnail(phones[0],mode+'-phone',390);
     await phones[0].setViewportSize({width:320,height:568});await sleep(250);entry.smallPhone=await phones[0].frameLocator('#gameFrame').locator('body').evaluate(()=>({w:innerWidth,h:innerHeight,scroll:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth-innerWidth}));await thumbnail(phones[0],mode+'-small',320);await phones[0].setViewportSize({width:390,height:844});
    }else{
     entry.hostTextLength=(await frame.locator('body').innerText()).length;
     entry.visibleControls=await frame.locator('button:visible').count();
     await thumbnail(host,'legacy-'+mode,560);
    }
    entry.ok=true;
   }catch(e){entry.ok=false;entry.error=e.message;console.error('POLISH_FAIL',mode,e.message);entry.diagnostics=[];for(const page of [host,...phones]){try{const d=await page.evaluate(()=>({bodyClass:document.body.className,phase:document.body.dataset.phase,game:window.PARTY_GAME?.id,ui:window.PARTY_UI,session:window.PARTY_SESSION,profile:window.PARTY_PROFILE?.name,notice:document.querySelector('#notice')?.textContent,frameSrc:document.querySelector('#gameFrame')?.getAttribute('src'),rects:['play','waitingRules','readyButton','gameFrame'].map(id=>{const e=document.getElementById(id),r=e?.getBoundingClientRect(),c=e&&getComputedStyle(e);return {id,hidden:e?.hidden,rect:r?{x:r.x,y:r.y,w:r.width,h:r.height}:null,display:c?.display,visibility:c?.visibility,text:e?.textContent?.slice(0,180)};})}));entry.diagnostics.push(d);console.log('POLISH_DIAG',JSON.stringify(d));}catch{}}try{await thumbnail(host,'failed-'+mode,720);await thumbnail(phones[0],'failed-phone-'+mode,390);}catch{}}
   finally{await roomCommand(host,'stop');await host.locator('#lobby').waitFor({state:'visible',timeout:15000});await sleep(200);}
   console.log('POLISH_CASE',JSON.stringify(entry));
  }
  report.errors=errors;report.ok=report.cases.every(c=>c.ok)&&errors.length===0;
 }catch(e){report.ok=false;report.failure=e.stack;}
 finally{
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(OUT,'server.log'),logs.join(''));await browser?.close();server.kill();
 }
 console.log('POLISH_REPORT',JSON.stringify(report));if(!report.ok)process.exitCode=1;
})();
