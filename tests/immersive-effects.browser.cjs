'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_IMMERSIVE_OUTPUT||'.localparty-build/design-round2/immersive/live');fs.mkdirSync(out,{recursive:true});
const tvWidth=Number(process.env.QA_IMMERSIVE_TV_WIDTH)||1280,tvHeight=tvWidth===1920?1080:720;
const hashes=()=>Object.fromEntries(['public/game-feel.js','public/game-feel.css','public/game-feel-state.js','public/bridge.js','server.js','games/arcade/controller-view.js','games/arcade/public/app.js','games/party/public/host.js','games/tankarena/public/app.js','games/tabletop/public/app.js','games/naval/public/broadcast.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const report={method:'Normal-clock real engine input/built-in bots. Screenshots never inject score, HP or outcomes. Native haptics uses shipped controller-bridge in a WebKit message-handler fixture; not a physical iPhone.',startedAt:new Date().toISOString(),sourceStart:hashes(),games:[],errors:[]};
const bridge=fs.readFileSync('public/native-shell/controller-bridge.js','utf8');
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'feel-qa'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,label,ms=30000){const end=Date.now()+ms;while(Date.now()<end){const v=await fn();if(v)return v;await sleep(35);}throw Error(label);}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'server ready');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer feel-qa','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});assert(r.ok,await r.clone().text());return r.json();};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:tvWidth,height:tvHeight},...(process.env.QA_IMMERSIVE_RECORD==='1'?{recordVideo:{dir:path.join(out,'video'),size:{width:1280,height:720}}}:{})});
 const ctx=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 await ctx.addInitScript(({bridge})=>{localStorage.setItem('local-party-language','en');window.__feelEvents=[];window.__hapticMessages=[];
  window.addEventListener('localparty:feel',e=>{window.__feelEvents.push({...e.detail,at:performance.now()});if(window.__feelEvents.length>100)window.__feelEvents.shift();});
  if(window!==top){window.webkit={messageHandlers:{partyShell:{postMessage:m=>{if(m.type==='haptic')window.__hapticMessages.push({pattern:m.pattern,at:performance.now()});}}}};(0,eval)(bridge);}
 },{bridge});
 await tv.addInitScript(()=>{localStorage.setItem('local-party-language','en');window.__feelEvents=[];addEventListener('localparty:feel',e=>{window.__feelEvents.push({...e.detail,at:performance.now()});if(window.__feelEvents.length>100)window.__feelEvents.shift();});});
 const phone=await ctx.newPage();for(const [surface,p] of [['phone',phone],['tv',tv]])p.on('pageerror',e=>report.errors.push({surface,error:e.message}));
 await tv.goto(origin+'/tv');await phone.goto(origin+'/play');await phone.locator('#name').fill('Alexandra LongName');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
 for(const game of (process.env.QA_IMMERSIVE_IDS||'carryball,airhockey,tankarena,push').split(',')){
  const row={game,events:[],captures:[],actions:[],startedAt:new Date().toISOString()};report.games.push(row);
  try{
   if(game==='taprace'){
    const idle=await browser.newPage({viewport:{width:393,height:852}});row.idlePage=idle;await idle.addInitScript(()=>localStorage.setItem('local-party-language','en'));await idle.goto(origin+'/play');await idle.locator('#name').fill('Idle test player');await idle.locator('#joinForm button[type=submit]').click();await idle.locator('#home').waitFor();row.actions.push('Two idle browser players: ordinary 45-second clock, no taps and no bots; no accelerated clock.');
   }
   await api({type:'bots-set',count:game==='taprace'?0:3});if(game==='tanks')await api({type:'settings',id:game,settings:{mode:'ctf'}});await api({type:'launch',id:game});await until(()=>phone.locator('#readyButton').isEnabled(),'phone ready');await phone.locator('#readyButton').click();if(row.idlePage){await until(()=>row.idlePage.locator('#readyButton').isEnabled(),'idle phone ready');await row.idlePage.locator('#readyButton').click();}
   await until(async()=>['playing','reveal'].includes((await api()).active?.ui.phase),'gameplay');
   const pf=await until(()=>phone.frames().find(f=>f.url().includes('/games/'+game+'/')),'phone iframe');const tf=tv.frames().find(f=>f.url().includes('/games/'+game+'/'));
   await pf.waitForFunction(()=>LocalPartyFeel?.observe&&LocalPartyFeelState);await sleep(400);await phone.screenshot({path:path.join(out,game+'-phone-before393.png')});await tv.screenshot({path:path.join(out,game+'-tv-before'+tvHeight+'.png')});row.captures.push(game+'-phone-before393.png',game+'-tv-before'+tvHeight+'.png');
   if(game==='tanks'||game==='tankarena'){const r=await pf.locator(game==='tanks'?'#fireBtn':'#fire').boundingBox();await phone.mouse.move(r.x+r.width/2,r.y+r.height/2);await phone.mouse.down();row.actions.push('Held actual Fire control; bots use their ordinary controllers.');}
   if(game==='push'){const r=await pf.locator('#joystickBase').boundingBox();await phone.mouse.move(r.x+r.width*.8,r.y+r.height/2);await phone.mouse.down();row.actions.push('Actual joystick pointer pushes own player toward the edge.');}
   const wanted=['tanks','tankarena'].includes(game)?'damage':game==='push'?'elimination':game==='naval'?'critical-health':game==='taprace'?'last-five':'goal';let observed=false;const end=Date.now()+Number(process.env.QA_IMMERSIVE_TIMEOUT||90000);
   if(game==='carryball'){const r=await pf.locator('#joy').boundingBox();await phone.mouse.move(r.x+r.width/2,r.y+r.height/2);await phone.mouse.down();row.actions.push('Real joystick follows the ball, then the opposing goal.');}
   while(Date.now()<end){
    const events=await pf.evaluate(()=>window.__feelEvents.filter(e=>e.semantic));if(events.some(e=>e.semantic===wanted)){row.events=events;observed=true;break;}
    if(game==='carryball'){
     const board=await tf.evaluate(()=>window.PARTY_BOT_VIEW),me=board?.players.find(p=>p.name==='Alexandra LongName');
     if(me){const target=board.ball.owner===me.id?{x:me.team?25:1175,y:360}:board.ball,dx=target.x-me.x,dy=target.y-me.y,n=Math.hypot(dx,dy)||1,r=await pf.locator('#joy').boundingBox();await phone.mouse.move(r.x+r.width*(.5+dx/n*.30),r.y+r.height*(.5+dy/n*.30));}
    }
    await sleep(70);
   }
   assert(observed,game+' actual '+wanted+' not observed');row.haptics=await pf.evaluate(()=>window.__hapticMessages);assert(row.haptics.length,game+' native fixture receives actual event haptics');
   if(wanted==='critical-health'){const file=game+'-phone-critical393.png';await phone.screenshot({path:path.join(out,file)});row.captures.push(file);row.criticalSnapshot=await pf.evaluate(()=>LocalPartyFeel.diagnostics());assert(row.haptics.some(m=>m.pattern.length===3&&m.pattern[1]===42),'actual critical-health uses danger haptic rather than same-packet damage');}
   const impactTV=game+'-tv-impact'+tvHeight+'.png';await tv.screenshot({path:path.join(out,impactTV)});row.captures.push(impactTV);
   for(const [width,height] of [[393,852],[320,568]]){await phone.setViewportSize({width,height});if(width===320)await sleep(250);const file=game+'-phone-after'+width+'.png';await phone.screenshot({path:path.join(out,file)});row.captures.push(file);const g=await pf.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,layerPointer:document.querySelector('.lp-feel-layer')?getComputedStyle(document.querySelector('.lp-feel-layer')).pointerEvents:null,...LocalPartyFeel.diagnostics()}));assert(g.scrollWidth<=g.width+1,game+' no new horizontal overflow');assert(g.layerPointer===null||g.layerPointer==='none');row['phone'+width]=g;}
   await tv.setViewportSize({width:1280,height:720});await tv.screenshot({path:path.join(out,game+'-tv-after720.png')});row.captures.push(game+'-tv-after720.png');await tv.setViewportSize({width:1920,height:1080});await sleep(250);await tv.screenshot({path:path.join(out,game+'-tv-after1080.png')});row.captures.push(game+'-tv-after1080.png');
   row.tv=await tf.evaluate(()=>LocalPartyFeel.diagnostics());
   // Explicit contract probes below are NOT gameplay screenshots or outcomes.
   const checks=await pf.evaluate(()=>{const before=window.__hapticMessages.length;const result=LocalPartyFeel.emit('score',{id:'protocol-once',visual:false});LocalPartyFeel.emit('score',{id:'protocol-once',visual:false});return{before,after:window.__hapticMessages.length,duplicate:LocalPartyFeel.emit('score',{id:'protocol-once',visual:false}).duplicate,result};});assert.equal(checks.duplicate,true);assert(checks.after-checks.before<=1);row.dedupeProbe=checks;
   await phone.emulateMedia({reducedMotion:'reduce'});await sleep(200);const reduced=await pf.evaluate(()=>{const before=window.__hapticMessages.length;const result=LocalPartyFeel.emit('explosion',{id:'reduce-probe'});return{before,after:window.__hapticMessages.length,result,children:LocalPartyFeel.diagnostics().children};});assert(reduced.result.suppressed);assert.equal(reduced.before,reduced.after);assert.equal(reduced.children,0);row.reducedProbe=reduced;
   await phone.emulateMedia({reducedMotion:'no-preference'});console.log('PASS immersive',game,wanted);
  }catch(e){row.error=e.message;console.log('UNCOVERED',game,e.message);}
  finally{if(row.idlePage){await row.idlePage.close();delete row.idlePage;}await phone.mouse.up().catch(()=>{});await api({type:'stop'});await phone.locator('#home').waitFor();await phone.setViewportSize({width:393,height:852});await tv.setViewportSize({width:tvWidth,height:tvHeight});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 }
 assert(!report.games.some(r=>r.error),JSON.stringify(report.games.filter(r=>r.error).map(r=>({game:r.game,error:r.error}))));assert.equal(report.errors.length,0);console.log('PASS actual feedback and native bridge fixture');
}finally{report.finishedAt=new Date().toISOString();report.sourceEnd=hashes();report.changedFiles=Object.keys(report.sourceStart).filter(f=>report.sourceStart[f]!==report.sourceEnd[f]);await browser?.close();if(process.env.QA_IMMERSIVE_RECORD==='1')report.videos=fs.existsSync(path.join(out,'video'))?fs.readdirSync(path.join(out,'video')).map(f=>'video/'+f):[];fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));child.kill();}})().catch(e=>{report.failure=e.message;report.serverLogTail=log.slice(-2000);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
