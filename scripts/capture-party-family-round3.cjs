'use strict';
// Real launcher and pointer controls. Outcome-only QA clock is explicitly labelled.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const selected=(process.env.AUDIT_GAMES||'push,shrink,knives,bomb,western,tanks,western_duel').split(',');
const count=Number(process.env.QA_PLAYERS||2),results=process.env.QA_RESULTS==='1';
const output=path.resolve(process.env.QA_OUTPUT||'.localparty-build/design-round3/party-family/before');fs.mkdirSync(output,{recursive:true});
const watched=['games/party/public','games/tanks/public','games/western_duel/public'].flatMap(d=>fs.readdirSync(d).filter(f=>/\.(js|css|html)$/.test(f)).map(f=>d+'/'+f)).concat(['games/party/server.js','games/tanks/server.js','games/western_duel/server.js']);
const shared=['public/tv-information.js','public/tv.js','public/tv-information.css','public/app.js','public/game-ui-system.css','public/game-polish.css','public/bridge.js','public/match-results.js','lib/result-ranking.js'];
const hash=list=>Object.fromEntries(list.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const report={startedAt:new Date().toISOString(),method:results?'Real engine outcomes with explicitly accelerated12x server QA clock; this proves composition, not normal-time physics.':'Normal-clock real launcher, two human browser controllers plus real built-in bots when roster>2. Actual pointer actions; no injected states/scores/outcomes.',players:count,sourceStart:hash(watched),sharedStart:hash(shared),games:[],errors:[]};
const save=()=>fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let log='',browser;
const clock=path.resolve('scripts/capture-qa-clock.cjs');
const child=spawn(process.execPath,[...(results?['--require',clock]:[]),'server.js'],{env:{...process.env,...(results?{NODE_OPTIONS:[process.env.NODE_OPTIONS||'','--require='+clock].join(' '),QA_CLOCK_RATE:'12'}:{}),PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'party-family-round3'}});
child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
async function until(fn,label,timeout=30000){const end=Date.now()+timeout;while(Date.now()<end){const value=await fn();if(value)return value;await sleep(60);}throw Error(label);}
(async()=>{try{
 await until(()=>log.match(/localhost:(\d+)/),'launcher port');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer party-family-round3','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
 browser=await webkit.launch({headless:true});const tvContext=await browser.newContext({deviceScaleFactor:2});await tvContext.addInitScript(()=>localStorage.setItem('local-party-language','en'));const tv=await tvContext.newPage();await tv.setViewportSize({width:1280,height:720});await tv.goto(origin+'/tv');
 const humans=[];for(let i=0;i<2;i++){const ctx=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:2});await ctx.addInitScript(()=>localStorage.setItem('local-party-language','en'));const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(origin+'/play');await page.locator('#name').fill(['Alexandra LongSurname','Александр Длиннофамильный'][i]);await page.locator('#joinForm button[type=submit]').click();await page.locator('#home').waitFor();humans.push({ctx,page});}
 const phone=humans[0].page;tv.on('pageerror',e=>report.errors.push(e.message));await api({type:'bots-set',count:Math.max(0,count-2)});
 for(const game of (await api()).catalog.filter(g=>selected.includes(g.id))){
  const row={id:game.id,engine:game.engine||game.id,captures:[],actions:[],startedAt:new Date().toISOString()};report.games.push(row);console.log('START',game.id,count,results?'results':'normal');
  let screen,frame;
  const state=()=>screen.evaluate(engine=>engine==='tanks'?lastState:state,row.engine);
  const capture=async(label,p)=>{for(const f of p.frames())await f.evaluate(()=>document.fonts.ready).catch(()=>{});const name=game.id+'-'+label+'.png';await p.screenshot({path:path.join(output,name)});row.captures.push(name);row.captureStates??=[];row.captureStates.push({file:name,at:new Date().toISOString(),ui:(await api()).active?.ui});save();};
  const four=async(label)=>{for(const size of [{width:1280,height:720},{width:1920,height:1080}]){await tv.setViewportSize(size);await sleep(160);await capture('tv-'+size.height+'-'+label,tv);}for(const size of [{width:393,height:852},{width:320,height:568}]){await phone.setViewportSize(size);await sleep(150);await capture('phone-'+size.width+'-'+label,phone);}};
  try{
   const settings={};for(const field of game.hostControls?.settings||[])settings[field.id]=field.options[0].value;
   if(game.id==='tanks')settings.mode=process.env.QA_TANKS_MODE||'ctf';if(Object.keys(settings).length)await api({type:'settings',id:game.id,settings});row.settings=settings;
   await api({type:'launch',id:game.id});for(const h of humans){await h.page.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),game.id);await h.page.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await h.page.locator('#readyButton').click();}
   screen=tv.frames().find(f=>f.url().includes('/games/'+game.id+'/'));frame=phone.frames().find(f=>f.url().includes('/games/'+game.id+'/'));
   await until(async()=>['playing','reveal',...(results?['results']:[])].includes((await api()).active?.ui?.phase),'actual active game');await sleep(1400);
   if(results){
    await until(async()=>{
     const snap=await api();if(snap.active?.ui?.phase==='results')return true;
     if(game.id==='knives'&&await frame.locator('#throwBtn').isEnabled().catch(()=>false))await frame.locator('#throwBtn').click();
     if(game.id==='western'&&await frame.locator('#fireBtn').isEnabled().catch(()=>false)){const s=await state();if(s.western?.phase==='draw')await frame.locator('#fireBtn').click();}
     if(game.id==='western_duel'&&await frame.locator('#fire').isEnabled().catch(()=>false)){const s=await state();if(s.phase==='draw')await frame.locator('#fire').click();}
     return false;
    },'actual outcome',180000);
    await phone.locator('#sharedMatchResults').waitFor({state:'visible'});await tv.locator('#tvPodium').waitFor({state:'visible',timeout:60000});await sleep(3000);row.result=(await api()).active.result;await four('results');row.actions.push('Authoritative engine outcome under labelled12x QA clock; shared reveal delay2400ms');
   }else{
    await four('playing');row.authorityBefore=await state();row.visualGeometry=await screen.evaluate(()=>({labels:window.PartyNameLabels||window.LocalTankNameLabels||null,rig:window.westernRigFrame||null,blocks:Object.fromEntries(['main','.stage','.lp-duel-sidebar','.glass','#board','#game','#scene'].filter(q=>document.querySelector(q)).map(q=>{const e=document.querySelector(q);return[q,{rect:e.getBoundingClientRect().toJSON(),scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}];}))}));
    if(game.id==='western_duel'){
     row.railChecks=[];for(const size of [{width:1280,height:720},{width:1920,height:1080}]){
      await tv.setViewportSize(size);await sleep(180);const bounds=await screen.evaluate(()=>{const a=document.querySelector('.stage').getBoundingClientRect(),b=document.querySelector('.duel-playing-rail')?.getBoundingClientRect(),board=document.getElementById('board');return{height:innerHeight,stage:a.toJSON(),rail:b?.toJSON(),rows:board.children.length,scrollHeight:board.scrollHeight,clientHeight:board.clientHeight};});
      if(!bounds.rail||bounds.stage.bottom>bounds.height+1||bounds.stage.bottom<bounds.height-20||Math.abs(bounds.stage.bottom-bounds.rail.bottom)>1||Math.abs(bounds.stage.top-bounds.rail.top)>1)throw Error('Duel arena/rail common safe height');
      const box=await screen.locator('#board').boundingBox();await tv.mouse.move(box.x+box.width*.6,box.y+box.height*.6);await tv.mouse.wheel(0,2200);await screen.locator('#board').press('End');await sleep(400);const edge=await screen.locator('#board').evaluate(e=>({top:e.scrollTop,remaining:e.scrollHeight-e.clientHeight-e.scrollTop,last:e.lastElementChild.getBoundingClientRect().toJSON(),rect:e.getBoundingClientRect().toJSON(),scrollAbove:e.dataset.scrollAbove,scrollBelow:e.dataset.scrollBelow}));row.railChecks.push({size,bounds,edge});save();
      if(edge.remaining>2||edge.last.bottom>edge.rect.bottom+1)throw Error('Duel last standing row unreachable');await capture('tv-'+size.height+'-standings-bottom',tv);await screen.locator('#board').press('Home');await sleep(160);
     }
    }
    row.phoneGeometry=await frame.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,controls:[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length).map(e=>({id:e.id,text:e.textContent.trim(),rect:e.getBoundingClientRect().toJSON(),disabled:e.disabled}))}));
    if(['push','shrink','bomb'].includes(game.id)){
     const joy=await frame.locator('#joystickBase').boundingBox();await phone.mouse.move(joy.x+joy.width/2,joy.y+joy.height/2);await phone.mouse.down();await phone.mouse.move(joy.x+joy.width*.70,joy.y+joy.height*.55);await sleep(350);await phone.mouse.up();row.actions.push('Actual pointer joystick hold/move/release');
    }else if(game.id==='knives'){
     if(await frame.locator('#throwBtn').isEnabled()){await frame.locator('#throwBtn').click();await sleep(110);row.actions.push('Actual pointer Throw');}
    }else if(game.id==='tanks'){
     for(const id of ['forwardBtn','fireBtn'])if(await frame.locator('#'+id).isEnabled()){const b=await frame.locator('#'+id).boundingBox();await phone.mouse.move(b.x+b.width/2,b.y+b.height/2);await phone.mouse.down();await sleep(350);await phone.mouse.up();}row.actions.push('Actual pointer forward and Fire holds/releases');
    }else{
     const id=game.id==='western'?'fireBtn':'fire';await until(async()=>{const s=await state();return(game.id==='western'?s.western?.phase:s.phase)==='draw'&&await frame.locator('#'+id).isEnabled();},'real DRAW signal for human',45000);await frame.locator('#'+id).click();await sleep(90);row.actions.push('Actual pointer Fire after authoritative DRAW');
    }
    row.authorityAfter=await state();await four('action');row.metricRoles=await frame.evaluate(()=>Object.fromEntries(['moveStatA','knivesLeft','roundScore','totalScore','westernWins','westernBest','westernFalse','scoreMain'].filter(id=>document.getElementById(id)).map(id=>{const e=document.getElementById(id),s=getComputedStyle(e);return[id,{text:e.textContent,font:s.fontFamily,weight:s.fontWeight,style:s.fontStyle}];})));
    if(game.id==='western'&&['westernWins','westernBest','westernFalse'].some(id=>!row.metricRoles[id]?.font.includes('KardiaFatRunner')||row.metricRoles[id]?.weight!=='900'||row.metricRoles[id]?.style!=='italic'))throw Error('Western metrics lost their numeric face');
    await phone.locator('#pauseButton').click();await until(async()=>await phone.evaluate(()=>document.body.dataset.phase==='paused'),'actual Pause');await sleep(200);await capture('phone-320-paused',phone);await capture('tv-1080-paused',tv);await phone.locator('#pauseButton').click();await until(async()=>await phone.evaluate(()=>document.body.dataset.phase!=='paused'),'actual Resume');
    await phone.reload();await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),game.id);frame=phone.frames().find(f=>f.url().includes('/games/'+game.id+'/'));await sleep(400);await capture('phone-320-reloaded',phone);row.actions.push('Actual shared Pause/Resume and identity-preserving outer reload');
   }
  }catch(e){row.failure=e.message;console.log('FAIL',game.id,e.message);await capture('last-observed',phone).catch(()=>{});}
  finally{await api({type:'stop'}).catch(()=>{});for(const h of humans)await h.page.locator('#home').waitFor().catch(()=>{});await phone.setViewportSize({width:393,height:852});row.finishedAt=new Date().toISOString();save();}
 }
 }finally{report.finishedAt=new Date().toISOString();report.sourceEnd=hash(watched);report.sharedEnd=hash(shared);report.sourceChanged=watched.filter(f=>report.sourceStart[f]!==report.sourceEnd[f]);report.sharedChanged=shared.filter(f=>report.sharedStart[f]!==report.sharedEnd[f]);save();fs.writeFileSync(path.join(output,'server.log'),log);await browser?.close();child.kill();}
})().catch(e=>{report.failure=e.message;save();console.error(e);process.exitCode=1;});
