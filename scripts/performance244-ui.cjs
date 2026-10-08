'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),WS=require('ws');
const pw=require(process.env.PARTY_PLAYWRIGHT||'playwright'),root=path.resolve(__dirname,'..'),out=path.resolve(process.env.QA_OUTPUT||'output/playwright/performance244/ui');fs.mkdirSync(out,{recursive:true});
const game=process.env.QA_GAME||'spy',gameId=game==='quiz'?'sinyakquiz':game,engine=process.env.QA_ENGINE||'chromium',variant=process.env.QA_VARIANT||'baseline';const sourcePath='games/'+game+'/public/'+(['monster','spy','millionaire'].includes(game)?'host':'app')+'.js';
const before=path.join(root,'output/playwright/performance244/ui/before',sourcePath),current=path.join(root,sourcePath);const delay=ms=>new Promise(r=>setTimeout(r,ms));let log='',browser,base,sockets=[],gameSockets=[];
const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'ui244',PARTY_PORT:'0',PARTY_INTERNAL_PORT:'0'}});child.stdout.on('data',x=>log+=x);child.stderr.on('data',x=>log+=x);
const report={game,engine,variant,method:'Actual launcher/authoritative 16 authenticated game controllers. Identical snapshot replay is a bounded state-update stress test, not a real network snapshot rate or physical AirPlay proof.',samples:[],screens:[],errors:[]};
async function until(fn,label){for(let i=0;i<400;i++){const v=await fn();if(v)return v;await delay(40);}throw Error(label+' '+log.slice(-500));}
async function api(body){const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer ui244','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));return j;}
async function connect(route){const s=new WS(base.replace('http','ws')+route);sockets.push(s);s.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='joined')s.profile=m.data||m;if(m.type==='state')s.state=m;});await new Promise((r,j)=>{s.once('open',r);s.once('error',j);});return s;}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'launcher');base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];await api({type:'server-start'});
 browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>report.errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('local-party-language','en'));
 await page.route('**/games/'+gameId+'/**',async route=>{const url=new URL(route.request().url());if(url.pathname.endsWith('/'+path.basename(sourcePath))){let source=fs.readFileSync(process.env.QA_SOURCE_DIR?path.join(root,process.env.QA_SOURCE_DIR,sourcePath):variant==='baseline'?before:current,'utf8');const probe=game==='monster'?'window.__ui244={snapshot:()=>state,replay:s=>render(s)}':game==='spy'||game==='millionaire'?'window.__ui244={snapshot:()=>state,replay:s=>{state=s;render()},tick:()=>'+(game==='spy'?'updateTimer':'tick')+'()}':'window.__ui244={snapshot:()=>state,replay:s=>{state=s;render(s)},tick}';if(source.includes('})();'))source=source.replace(/\}\)\(\);\s*$/,probe+';})();');else source+='\n'+probe+';';source=source.replace(/\bio\(\)/g,"partyIO({path:'/games/"+gameId+"/socket.io'})");await route.fulfill({body:source,contentType:'application/javascript'});}else if(game==='naval'&&process.env.QA_NAVAL_ACTIONS==='1'&&url.pathname.endsWith('/broadcast.js')){await route.fulfill({body:fs.readFileSync(process.env.QA_SOURCE_DIR?path.join(root,process.env.QA_SOURCE_DIR,'games/naval/public/broadcast.js'):path.join(root,'games/naval/public/broadcast.js'),'utf8'),contentType:'application/javascript'});}else await route.continue();});
 await page.goto(base+'/tv');await until(async()=>(await api()).screens===1,'tv registration');
 const people=[];for(let n=0;n<16;n++){const s=await connect('/lobby');s.send(JSON.stringify({type:'join',name:n===0?'Бот 3':n===1?'Александра Длинное имя':'UI Player '+n}));await until(()=>s.profile,'profile');people.push(s);}
 const active=(await api({type:'launch',id:game==='quiz'?'sinyakquiz':game})).active;
 const frame=await until(()=>page.frames().find(f=>f.url().includes('/games/'+(game==='quiz'?'sinyakquiz':game)+'/')&&!f.url().includes('about:')),'game frame');await frame.waitForFunction(()=>window.__ui244?.snapshot());
 if(['monster','spy','millionaire'].includes(game)){await frame.evaluate(async profiles=>{window.__players244=[];for(const p of profiles){const s=io({path:new URL('socket.io',document.baseURI).pathname});__players244.push(s);await new Promise((r,j)=>s.emit('player:join',{partyId:p.id,partyToken:p.token,name:p.name},ack=>ack?.ok?r():j(Error(JSON.stringify(ack)))));}},people.map(s=>s.profile));}
 else for(const p of people){const s=await connect('/games/'+(game==='quiz'?'sinyakquiz':game)+'/ws');gameSockets.push(s);s.playerId=p.profile.id;s.send(JSON.stringify({type:'join',partyId:p.profile.id,partyToken:p.profile.token}));await until(()=>s.profile,'game joined');}
 await until(()=>frame.evaluate(()=>__ui244.snapshot().players.length===16),'16 game roster');await frame.evaluate(()=>document.fonts.ready);await delay(500);
 const cdp=engine==='chromium'?await page.context().newCDPSession(page):null;if(cdp)await cdp.send('Performance.enable');const cpu=async()=>cdp?Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value])):{};
 async function capture(phase){const file=variant+'-'+engine+'-'+game+'-'+phase+'.png';await page.screenshot({path:path.join(out,file)});report.screens.push(file);}
 async function measure(phase){await delay(500);for(let pair=0;pair<3;pair++){const start=await cpu();const sample=await frame.evaluate(async()=>{const before=document.createElement,stats={created:0,added:0,removed:0,mutations:0,ms:0};document.createElement=function(...args){stats.created++;return before.apply(this,args)};const observer=new MutationObserver(rs=>{stats.mutations+=rs.length;for(const r of rs){stats.added+=r.addedNodes.length;stats.removed+=r.removedNodes.length;}});observer.observe(document.body,{subtree:true,attributes:true,childList:true,characterData:true});const snap=JSON.parse(JSON.stringify(__ui244.snapshot())),begin=performance.now();for(let n=0;n<100;n++)__ui244.replay(JSON.parse(JSON.stringify(snap)));stats.ms=performance.now()-begin;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));observer.disconnect();document.createElement=before;return stats;});const end=await cpu();report.samples.push({phase,pair,...sample,cpu:Object.fromEntries(['TaskDuration','ScriptDuration','RecalcStyleDuration','LayoutDuration','LayoutCount','RecalcStyleCount'].map(k=>[k,(end[k]||0)-(start[k]||0)]))});}await capture(phase);}
 await measure('lobby');
 if(variant!=='baseline'&&game!=='naval'){
  report.lobbyBehavior=await frame.evaluate(game=>{const saved=JSON.parse(JSON.stringify(__ui244.snapshot())),fields=game==='monster'?['maxPlayers']:game==='spy'?['minutes']:game==='millionaire'?['turns','seconds']:game==='quiz'?['mode','seconds','count']:['mode','seconds','turns'];return Object.fromEntries(fields.map(id=>{const n=document.getElementById(id),expected=n.value;n.value='invalid-local-draft';__ui244.replay(JSON.parse(JSON.stringify(saved)));return[id,n.value===expected];}));},game);
  for(const [field,ok]of Object.entries(report.lobbyBehavior))assert(ok,game+' accepted settings restore '+field);
 }

 for(const s of people)s.send(JSON.stringify({type:'game-status',status:'ready',instance:active.instance}));await delay(100);await api({type:'force-start',instance:active.instance});
 await until(()=>frame.evaluate(()=>__ui244.snapshot().phase!=='lobby'),'start');
 if(game==='spy'){await measure('reveal');await frame.evaluate(()=>__players244.forEach(s=>s.emit('player:ready')));await until(()=>frame.evaluate(()=>__ui244.snapshot().phase==='playing'),'ready');}
 await measure('playing');
 if(game==='spy'||game==='millionaire'||!['monster'].includes(game)){const start=await cpu();const timers=await frame.evaluate(async()=>{const records={mutations:0,targets:{}};const o=new MutationObserver(rs=>{records.mutations+=rs.length;for(const r of rs){const t=r.target.nodeType===1?r.target:r.target.parentElement,id=t?.id||t?.className||'unknown';records.targets[id]=(records.targets[id]||0)+1;}});o.observe(document.body,{attributes:true,subtree:true,childList:true,characterData:true});await new Promise(r=>setTimeout(r,2100));o.disconnect();return records;});const end=await cpu();report.timers={...timers,cpu:Object.fromEntries(['TaskDuration','ScriptDuration','RecalcStyleDuration','LayoutDuration'].map(k=>[k,end[k]-start[k]]))};}


 if(game==='naval'&&process.env.QA_NAVAL_ACTIONS==='1'){
  report.actions={method:'Three authoritative waves of16 real authenticated shots;15 misses + one hit in the final wave, other waves16 misses, chosen from target controller private fleet. Cooldown/public grids/rank changes stay production. Includes normal projectile/impact/timer work for1.1s after receipt.',waves:[]};
  for(let wave=0;wave<3;wave++){
   if(wave)await delay(2600);
   await frame.evaluate(()=>{const original=document.createElement,stats=window.__actions244={created:0,mutations:0,added:0,removed:0,mutationAreas:{}};document.createElement=function(...a){stats.created++;return original.apply(this,a)};const observer=new MutationObserver(rs=>{stats.mutations+=rs.length;for(const r of rs){stats.added+=r.addedNodes.length;stats.removed+=r.removedNodes.length;const n=r.target.nodeType===1?r.target:r.target.parentElement,area=n?.closest('#board')?'crew':n?.closest('.miniOcean')?'public-grid':n?.closest('.oceanCard > b')?'fleet-title':n?.closest('#broadcastEvents')?'feed':n?.closest('.naval-shell,.naval-shot-effect')?'shot-effect':n?.closest('#grid,#ownGrid')?'controller-grid':n?.id==='timer'||n?.id==='bar'?'timer':'other';stats.mutationAreas[area]=(stats.mutationAreas[area]||0)+1}});observer.observe(document.body,{subtree:true,attributes:true,characterData:true,childList:true});stats.stop=()=>{observer.disconnect();document.createElement=original;delete stats.stop;return stats;};});
   const beforeCPU=await cpu(),started=Date.now(),shotsBefore=await frame.evaluate(()=>__ui244.snapshot().players.reduce((n,p)=>n+p.shots,0));
   for(let index=0;index<gameSockets.length;index++){
    const shooter=gameSockets[index],target=gameSockets[(index+1)%gameSockets.length],own=target.state?.me,publicTarget=shooter.state.players.find(p=>p.id===target.playerId),ships=new Set(own.ships.flat()),cell=publicTarget.board.findIndex((v,i)=>v===null&&(wave===2&&index===0?ships.has(i):!ships.has(i)));assert(cell>=0,'legal shot cell');
    shooter.send(JSON.stringify({type:'shoot',target:target.playerId,cell,shotId:'ui244-'+wave+'-'+index}));
   }
   await until(()=>frame.evaluate(expected=>__ui244.snapshot().players.reduce((n,p)=>n+p.shots,0)===expected,shotsBefore+16),'16 accepted authoritative shots');const receiveMs=Date.now()-started;
   await delay(1100);const stats=await frame.evaluate(()=>__actions244.stop()),endCPU=await cpu(),order=await frame.evaluate(()=>[...document.querySelectorAll('#board .row')].map(n=>n.dataset.id).join('|')===__ui244.snapshot().players.map(p=>p.id).join('|'));assert(order,'genuine crew order remains authoritative');report.actions.waves.push({wave,receiveMs,windowMs:Date.now()-started,order,...stats,cpu:Object.fromEntries(['TaskDuration','ScriptDuration','RecalcStyleDuration','LayoutDuration','LayoutCount'].map(k=>[k,(endCPU[k]||0)-(beforeCPU[k]||0)]))});
  }
  await capture('authoritative-shots');
 }
 if(variant!=='baseline'){
  report.behavior=await frame.evaluate(async game=>{
   const saved=JSON.parse(JSON.stringify(__ui244.snapshot())),roster=window.PARTY_ROSTER,lang=PartyI18n.language;
   const rowSelector=game==='monster'?'#queue .queue-chip':game==='spy'?'#playRoster .roster-item':game==='millionaire'?'#scoreList .scoreItem':'#board .row';
   const first=document.querySelector(rowSelector);__ui244.replay(JSON.parse(JSON.stringify(saved)));const retained=first===document.querySelector(rowSelector);
   const changed=JSON.parse(JSON.stringify(saved)),name='<bold> & Алекс';changed.players[0].name=name;if('connected' in changed.players[0])changed.players[0].connected=false;if('online' in changed.players[0])changed.players[0].online=false;
   __ui244.replay(changed);await new Promise(r=>setTimeout(r,80));const rename=document.body.textContent.includes(name),safe=!document.querySelector('bold');
   PartyI18n.setLanguage('ru',{persist:false});__ui244.replay(JSON.parse(JSON.stringify(changed)));await new Promise(r=>setTimeout(r,80));const russian=document.documentElement.lang==='ru'&&document.body.textContent.includes(name);
   PartyI18n.setLanguage('en',{persist:false});__ui244.replay(JSON.parse(JSON.stringify(changed)));await new Promise(r=>setTimeout(r,80));const english=document.documentElement.lang==='en'&&document.body.textContent.includes(name);
   let avatar=true;
   if(['spy','millionaire','quiz','naval'].includes(game)){
    const marker='/assets/avatars/atlas-mascots/mascot-04.webp',id=saved.players[0].id;
    window.PARTY_ROSTER=[...(roster||[]).filter(p=>p.id!==id),{id,name:saved.players[0].name,avatar:marker}];__ui244.replay(JSON.parse(JSON.stringify(saved)));
    const selector=game==='spy'?'#playRoster .spy-roster-avatar img':game==='millionaire'?'#scoreList .mq-identity img':game==='quiz'?'#board .quiz-identity img':'#board .crew-avatar';
    avatar=[...document.querySelectorAll(selector)].some(n=>n.getAttribute('src')===marker);
    window.PARTY_ROSTER=roster;
   }
   const fewer={...saved,players:saved.players.slice(1)};__ui244.replay(fewer);await new Promise(r=>setTimeout(r,40));const removed=document.querySelectorAll(rowSelector).length===15;
   window.PARTY_ROSTER=roster;PartyI18n.setLanguage(lang,{persist:false});__ui244.replay(saved);await new Promise(r=>setTimeout(r,80));
   return{retained,rename,safe,russian,english,avatar,removed,restored:document.querySelectorAll(rowSelector).length===16};
  },game);
  for(const [check,passed]of Object.entries(report.behavior))assert(passed,game+' '+check);
 }

 if(variant!=='baseline'){
  const phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});phone.on('pageerror',e=>report.errors.push('native-controller: '+e.message));
  const bridge=fs.readFileSync(path.join(root,'public/native-shell/controller-bridge.js'),'utf8'),tabs=fs.readFileSync(path.join(root,'public/native-shell/tabs.js'),'utf8');
  await phone.addInitScript({content:'window.__messages=[];window.webkit={messageHandlers:{partyShell:{postMessage(m){__messages.push(m)}}}};'+bridge+'\nwindow.__partyPersistentTabs=true;'+tabs});
  await phone.addInitScript(profile=>{localStorage.setItem('local-party-language','en');localStorage.setItem('local-party-profile',JSON.stringify({id:profile.id,token:profile.token,name:profile.name,avatar:profile.avatar||null,hand:'right'}));},people[0].profile);
  if(!['monster','spy','millionaire'].includes(game))await phone.route('**/games/'+gameId+'/app.js',async route=>{const source=fs.readFileSync(current,'utf8').replace(/\}\)\(\);\s*$/,'window.__ui244={snapshot:()=>state,replay:s=>{state=s;render(s)},tick};})();');await route.fulfill({body:source,contentType:'application/javascript'});});
  await phone.goto(base+'/play');await phone.waitForSelector('body.native-controller');await phone.waitForSelector('#partyNativeDock.native-tabs',{state:'attached'});
  const pf=await until(()=>phone.frames().find(f=>f.url().includes('/games/'+gameId+'/')),'native controller frame');await pf.waitForFunction(()=>window.PARTY_PROFILE?.id);await pf.evaluate(()=>document.fonts.ready);await delay(650);
  report.native=await phone.evaluate(()=>({nativeBridge:!!window.LocalPartyNative?.isNative,persistentTabs:!!document.querySelector('#partyNativeDock.native-tabs'),height:innerHeight,gameFrame:document.querySelector('#gameFrame').src,profile:window.PARTY_PROFILE?.id}));
  assert(report.native.nativeBridge&&report.native.persistentTabs,'native bridge AND tabs');assert.equal(await pf.evaluate(()=>PARTY_PROFILE.id),people[0].profile.id,'authenticated controller profile');
  if(!['monster','spy','millionaire'].includes(game)){
   await pf.waitForFunction(()=>__ui244?.snapshot()?.me);
   report.native.behavior=await pf.evaluate(()=>{const saved=JSON.parse(JSON.stringify(__ui244.snapshot())),first=document.querySelector('#board .row');__ui244.replay(JSON.parse(JSON.stringify(saved)));const stable=first===document.querySelector('#board .row'),changed=JSON.parse(JSON.stringify(saved)),name='Native <b> Алекс';changed.players[0].name=name;__ui244.replay(changed);const rename=document.body.textContent.includes(name),safe=!document.querySelector('b b');__ui244.replay(saved);return{stable,rename,safe,phase:saved.phase,privateIdentity:saved.me.id};});
   assert(report.native.behavior.stable&&report.native.behavior.rename&&report.native.behavior.safe,'native state behavior');
  }
  const file=variant+'-'+engine+'-'+game+'-native-controller.png';await phone.screenshot({path:path.join(out,file)});report.screens.push(file);await phone.close();
 }
 report.state=await frame.evaluate(()=>({phase:__ui244.snapshot().phase,players:__ui244.snapshot().players.length,text:document.body.innerText}));
 assert.equal(report.errors.length,0,report.errors.join('\n'));console.log(JSON.stringify(report));
 }finally{fs.writeFileSync(path.join(out,variant+'-'+engine+'-'+game+'.json'),JSON.stringify(report,null,2));for(const s of sockets)s.terminate();await browser?.close();child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
