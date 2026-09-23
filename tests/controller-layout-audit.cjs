'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const stress=process.env.AUDIT_STRESS==='1';
const out=path.resolve(process.env.AUDIT_OUTPUT||(stress?'.localparty-build/all-games-stress':process.env.AUDIT_NATIVE?'.localparty-build/native-controller-audit':'.localparty-build/controller-audit'));fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'layout-audit'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const report={games:[],errors:[]};
(async()=>{try{
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await sleep(50);
 const base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer layout-audit','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
 browser=await webkit.launch({headless:true});const host=await browser.newPage({viewport:{width:1280,height:720}});
 const phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 let currentGame='lobby';for(const [label,page] of [['tv',host],['phone',phone]]){page.on('pageerror',e=>report.errors.push({game:currentGame,surface:label,message:e.message}));if(stress)await page.addInitScript(()=>{window.__stressFrames=[];window.__stressLast=0;requestAnimationFrame(function tick(t){if(window.__stressLast)window.__stressFrames.push(t-window.__stressLast);if(window.__stressFrames.length>1200)window.__stressFrames.shift();window.__stressLast=t;requestAnimationFrame(tick);});});}
 await host.goto(base+'/tv');if(process.env.AUDIT_NATIVE){await phone.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fs.readFileSync('public/native-shell/controller-bridge.js','utf8')});}await phone.goto(base+'/play');await phone.locator('#name').fill('Александра');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
 const identity=await phone.evaluate(()=>JSON.parse(localStorage.getItem('local-party-profile')).id);
 const catalog=(await api()).catalog;const selected=process.env.AUDIT_GAMES?.split(',');
 for(const game of catalog.filter(g=>!selected||selected.includes(g.id))){
  currentGame=game.id;const item={id:game.id,metrics:[]};report.games.push(item);
  try{
   const bots=stress?Math.min(7,game.max-1):Math.max(1,game.min-1);item.players=bots+1;await api({type:'bots-set',count:bots});await sleep(500);const run=(await api({type:'launch',id:game.id})).active;
   await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),game.id);
   await phone.locator('#readyButton').waitFor({state:'visible'});await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled,null,{timeout:20000});await phone.locator('#readyButton').click();for(let t=0;t<80;t++){const s=await api();if(s.active?.ui?.phase&&!['waiting','countdown'].includes(s.active.ui.phase))break;await sleep(250);}await sleep(300);
   const startedPhase=(await api()).active?.ui?.phase;
   assert(startedPhase&&!['waiting','countdown'].includes(startedPhase),`Game must really start before layout capture (phase: ${startedPhase})`);
   let frame=phone.frames().find(f=>f.url().includes('/games/'+game.id+'/'));
   if(stress){
    item.scenarios=[];
    for(const f of [host.mainFrame(),host.frames().find(f=>f.url().includes('/games/'+game.id+'/')),phone.mainFrame(),frame])if(f)await f.evaluate(()=>{window.__stressFrames=[];window.__stressLast=0;});
    await sleep(3000);item.frames=[];
    for(const [label,f] of [['tv',host.mainFrame()],['game',host.frames().find(f=>f.url().includes('/games/'+game.id+'/'))],['phone',phone.mainFrame()],['controller',frame]])if(f)item.frames.push(await f.evaluate(label=>{const a=(window.__stressFrames||[]).slice().sort((a,b)=>a-b);return {label,frames:a.length,p95:a[Math.floor(a.length*.95)],max:a.at(-1),over50:a.filter(v=>v>50).length};},label));
    assert.notEqual((await api()).active?.ui?.phase,'waiting','Game must acknowledge start');item.scenarios.push('start');
    await phone.locator('#pauseButton').click();await phone.locator('#pauseOverlay').waitFor({state:'visible'});await sleep(300);await phone.screenshot({path:path.join(out,game.id+'-pause.png')});
    await phone.locator('#sessionRules').click();await phone.locator('#rulesDialog').waitFor({state:'visible'});await phone.locator('#closeRules').click();item.scenarios.push('pause-rules');
    await phone.reload();await phone.locator('#pauseOverlay').waitFor({state:'visible'});assert.equal(await phone.locator('#onboarding').isVisible(),false);item.scenarios.push('reload-while-paused');
    await phone.locator('#resumeButton').click();await phone.locator('#pauseOverlay').waitFor({state:'hidden'});
    await phone.reload();await phone.locator('#gameFrame').waitFor({state:'visible'});await phone.waitForFunction(id=>document.getElementById('gameFrame').src.includes('/games/'+id+'/'),game.id);
    assert.equal(await phone.evaluate(()=>JSON.parse(localStorage.getItem('local-party-profile')).id),identity);assert.equal((await api()).active.instance,run.instance);assert.equal(await phone.locator('#onboarding').isVisible(),false);
    let recovered=false;for(let t=0;t<160;t++){if((await api()).active?.ready.includes(identity)){recovered=true;break;}await sleep(100);}assert(recovered,'Controller must rejoin game after reload');item.scenarios.push('reload-while-playing');
    frame=phone.frames().find(f=>f.url().includes('/games/'+game.id+'/'));
   }
   if(game.id==='marble_bloom'){
    const before=await frame.evaluate(()=>window.__arcadeState.players.find(p=>p.id===window.__arcadeConnection.id).shotsFired);
    await frame.locator('#marbleFire').click();await frame.waitForFunction(n=>window.__arcadeState.players.find(p=>p.id===window.__arcadeConnection.id).shotsFired>n,before);item.fireVerified=true;
   }
   if(game.id==='pocket_siege'&&!stress&&!process.env.AUDIT_LAYOUT_ONLY){
    // A randomized first turn can belong to a bot; range inputs are not text fields.
    await frame.waitForFunction(()=>!document.getElementById('angle').disabled,null,{timeout:90000});
    await frame.locator('#angle').evaluate(el=>{el.value='70';el.dispatchEvent(new Event('input',{bubbles:true}));});await frame.waitForFunction(()=>Number(document.getElementById('angleValue').textContent.replace('°',''))===70);
    await frame.locator('#weaponButton').click();await frame.locator('.weapon-row').first().click();await frame.locator('#tankFire').click();await frame.waitForFunction(()=>window.__arcadeState.stage!=='aim');item.fireVerified=true;
   }

   for(const [width,height] of (process.env.AUDIT_SIZES?JSON.parse(process.env.AUDIT_SIZES):[[393,852],[320,700]])){
    await phone.setViewportSize({width,height});await sleep(250);
    const metrics=await frame.evaluate(()=>({viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth+1,buttons:[...document.querySelectorAll('button')].filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').map(n=>{const r=n.getBoundingClientRect();return {id:n.id,text:n.textContent.trim().slice(0,80),x:r.x,y:r.y,w:r.width,h:r.height,font:getComputedStyle(n).fontSize,clipped:n.scrollWidth>n.clientWidth+2};})}));metrics.top=await frame.evaluate(()=>({scroll:scrollY,bodyTop:document.body.getBoundingClientRect().top}));metrics.shell=await phone.evaluate(()=>({scrollY,header:document.querySelector('.app-header').getBoundingClientRect().bottom,controls:document.querySelector('#sessionControls').getBoundingClientRect().bottom,viewport:innerHeight}));item.metrics.push(metrics);
    metrics.shellGeometry=await phone.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};return {header:box('.app-header'),timer:box('#hudTimer'),logo:box('.heypals-header-logo'),dock:box('#sessionControls'),gradient:getComputedStyle(document.querySelector('#sessionControls')).backgroundImage};});
    assert(metrics.shellGeometry.header.height<=65,'Single-row branded game header must fit within64px without safe area');
    assert(Math.abs(metrics.shellGeometry.timer.top)<1,'Timer stays inside the single-row game header');
    metrics.shellGeometry.frame=await phone.locator('#gameFrame').evaluate(el=>{const r=el.getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:r.height};});
    metrics.background=await phone.evaluate(()=>['.app-header','#play','#sessionControls'].map(s=>getComputedStyle(document.querySelector(s)).backgroundColor));
    metrics.childBackground=await frame.evaluate(()=>{const body=getComputedStyle(document.body).backgroundColor;return body==='rgba(0, 0, 0, 0)'?getComputedStyle(document.documentElement).backgroundColor:body;});
    assert(metrics.background.every(c=>c==='rgb(21, 19, 33)')&&metrics.childBackground==='rgb(21, 19, 33)','Header/controller/footer share one continuous surface');
    assert(metrics.shellGeometry.frame.bottom<=metrics.shellGeometry.dock.top+1,'Iframe must end before session actions');
    assert(Math.abs(metrics.viewport[1]-metrics.shellGeometry.frame.height)<=1,'Game viewport equals reserved iframe height');
    metrics.unreachable=await frame.evaluate(async()=>{const failed=[];const buttons=[...document.querySelectorAll('button,input[type=range],[role=button]')].filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden');for(const n of buttons){n.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});const r=n.getBoundingClientRect();if(r.height>innerHeight)continue;let clipped=r.top< -1||r.bottom>innerHeight+1;for(let p=n.parentElement;p&&p!==document.body;p=p.parentElement){if(/hidden|clip/.test(getComputedStyle(p).overflowY)){const pr=p.getBoundingClientRect();if(r.top<pr.top-1||r.bottom>pr.bottom+1)clipped=true;}}if(clipped)failed.push({id:n.id,text:n.textContent.trim().slice(0,40),top:r.top,bottom:r.bottom,viewport:innerHeight});}window.scrollTo(0,0);return failed;});
    if(game.id==='naval'){metrics.fleet=await frame.evaluate(()=>{const r=document.querySelector('#own').getBoundingClientRect(),g=document.querySelector('#grid').getBoundingClientRect();return {top:r.top,bottom:r.bottom,gridBottom:g.bottom,height:innerHeight};});assert(metrics.fleet.bottom<=metrics.fleet.height,'Private fleet must stay visible');assert(metrics.fleet.gridBottom<=metrics.fleet.height,'Firing grid must stay visible');}
    await phone.screenshot({path:path.join(out,`${game.id}-${width}.png`)});
    assert(!metrics.overflow,game.id+' horizontal overflow');assert(metrics.shell.controls<=metrics.shell.viewport+1,game.id+' bottom controls clipped');assert(!metrics.buttons.some(b=>b.clipped),game.id+' clipped button labels');assert.equal(metrics.unreachable.length,0,game.id+' unreachable controls '+JSON.stringify(metrics.unreachable));
   }
   if(['marble_bloom','pocket_siege','bow_club'].includes(game.id)){await host.screenshot({path:path.join(out,game.id+'-tv.png')});if(game.id==='bow_club'){await frame.locator('#touch').click();await frame.locator('#draw').waitFor();const draw=await frame.locator('#draw').boundingBox();await phone.mouse.move(draw.x+draw.width/2,draw.y+draw.height/2);await phone.mouse.down();await sleep(650);await phone.mouse.up();await frame.waitForFunction(()=>/\b9\b/.test(document.getElementById('score').textContent));item.fireVerified=true;await phone.screenshot({path:path.join(out,'bow-club-touch.png')});}}
   if(game.id==='punchmeter'){await host.screenshot({path:path.join(out,'punchmeter-tv.png')});await phone.setViewportSize({width:393,height:852});await frame.evaluate(()=>{ws.onclose=null;ws.close();state={...state,phase:'finished',players:state.players.map(p=>p.id===id?{...p,score:2523,hits:[800,723,1000]}:p)};update();});await phone.screenshot({path:path.join(out,'punchmeter-results.png')});}
   item.phase=(await api()).active?.ui?.phase;console.log('CAPTURE',game.id,item.phase,item.metrics.map(m=>m.overflow?'OVERFLOW':'fits').join('/'));
  }catch(e){item.error=e.message;console.log('FAIL',game.id,e.message.slice(0,180));await phone.screenshot({path:path.join(out,game.id+'-failure.png')}).catch(()=>{});item.failureState=(await api()).active;}
  await api({type:'stop'});await phone.setViewportSize({width:393,height:852});await phone.locator('#home').waitFor({state:'visible'});assert.equal(await phone.locator('#gameFrame').getAttribute('src'),'about:blank');if(stress)item.scenarios?.push('stop-and-next-game');await sleep(250);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 }
 if(report.games.some(game=>game.error)||report.errors.length)throw Error('Controller audit failed; inspect report.json');
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();}})().catch(e=>{console.error(e,log.slice(-800));process.exitCode=1;});
