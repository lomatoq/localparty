'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {chromium}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve('output/playwright/runtime-optimization-2026-10-09');fs.mkdirSync(out,{recursive:true});
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'runtime-visual-')),wait=ms=>new Promise(r=>setTimeout(r,ms));let log='',browser;
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_DATA_FILE:path.join(dir,'party.json'),PARTY_PORT:'0',PARTY_INTERNAL_PORT:'0',PARTY_ADMIN_KEY:'runtime-visual',PARTY_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
const errors=[],checks=[];let activeGame='lobby';
(async()=>{try{
  for(let n=0;n<200&&!/localhost:(\d+)/.test(log);n++)await wait(50);assert(/localhost:(\d+)/.test(log),log);
  const base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
  const api=async data=>{const r=await fetch(base+'/api/manage',{method:data?'POST':'GET',headers:{Authorization:'Bearer runtime-visual','Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});const value=await r.json();assert(r.ok,JSON.stringify(value));return value;};
  browser=await chromium.launch({headless:true,executablePath:process.env.PARTY_CHROMIUM});
  const tv=await browser.newPage({viewport:{width:1280,height:720}}),phones=[];
  tv.on('pageerror',e=>errors.push(activeGame+' TV: '+e.stack));await tv.goto(base+'/tv');
  for(let n=0;n<2;n++){const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(activeGame+' phone '+n+': '+e.stack));await page.goto(base+'/play');await page.locator('#name').fill('Player '+(n+1));await page.locator('#joinForm button[type=submit]').click();await page.locator('#home').waitFor();phones.push(page);}
  for(const game of ['drawguess','airhockey','kart','tankarena','jenga','push','tanks']){
    activeGame=game;const run=(await api({type:'launch',id:game})).active;
    for(const page of phones){await page.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),game);await page.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await page.locator('#readyButton').click();}
    for(let n=0;n<180;n++){if((await api()).active.ui.phase==='playing')break;await wait(100);}
    assert.equal((await api()).active.ui.phase,'playing',game+' starts');await wait(1800);
    const frames=phones.map(p=>p.frames().find(f=>f.url().includes('/games/'+game+'/')));
    // Game sockets can join in a different order from lobby profiles.
    if(game==='drawguess'&&await frames[1].locator('#canvas').evaluate(c=>c.classList.contains('canDraw'))){phones.reverse();frames.reverse();}
    if(game==='jenga'&&await frames[0].locator('#blocks button:not(:disabled)').count()===0){phones.reverse();frames.reverse();}
    if(game==='drawguess'){
      const box=await frames[0].locator('#canvas').boundingBox();assert(box);await phones[0].mouse.move(box.x+box.width*.2,box.y+box.height*.4);await phones[0].mouse.down();
      for(let n=0;n<20;n++){await phones[0].mouse.move(box.x+box.width*(.2+n*.025),box.y+box.height*(.4+.15*Math.sin(n*.3)));await wait(40);}await phones[0].mouse.up();await wait(200);
      await frames[1].locator('#guess').fill('A test guess');await frames[1].locator('#guessForm button').click();await wait(250);
      const ink=await frames[1].locator('#canvas').evaluate(c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data).some((v,i)=>i%4===3&&v>0));assert(ink,'guesser retains drawing after compact guess update');
    }
    if(game==='jenga'){await frames[0].locator('#blocks button:not(:disabled)').first().click();await wait(200);}
    for(const f of [...frames,...tv.frames().filter(f=>f.url().includes('/games/'))])await f.evaluate(()=>document.fonts.ready);
    await tv.screenshot({path:path.join(out,game+'-tv.png')});await phones[0].screenshot({path:path.join(out,game+'-phone.png')});
    if(game==='drawguess')await phones[1].screenshot({path:path.join(out,game+'-guesser.png')});
    await frames[0].evaluate(()=>location.reload());await wait(1600);
    if(game==='drawguess'){const f=phones[0].frames().find(f=>f.url().includes('/games/drawguess/'));assert(await f.locator('#canvas').evaluate(c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data).some((v,i)=>i%4===3&&v>0)),'reload restores ink');}
    await phones[0].screenshot({path:path.join(out,game+'-rejoined.png')});
    checks.push({game,instance:run.instance,phase:(await api()).active.ui.phase,capturedAt:new Date().toISOString(),reload:true});
    await api({type:'stop'});await wait(300);console.log('PASS',game);
  }
  assert.deepEqual(errors,[]);
}finally{fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checks,errors},null,2));await browser?.close();if(child.exitCode===null){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e,log.slice(-1600));process.exitCode=1;});
