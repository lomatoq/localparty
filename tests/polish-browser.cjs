'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'test-results/polish-v2');fs.mkdirSync(OUT,{recursive:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,ms=18000){const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await delay(80);}throw Error('Timeout: '+label);}
const report={testedCommit:process.env.GITHUB_SHA||'local',cases:[],errors:[],requests:[],protocol:[]};let current='lobby',browser,server,host;const logs=[];
(async()=>{
 server=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_EPHEMERAL:'1'},stdio:['ignore','pipe','pipe']});
 server.stdout.on('data',b=>logs.push(String(b)));server.stderr.on('data',b=>logs.push(String(b)));
 await until(()=>/localhost:(\d+)\/host/.test(logs.join('')),'launcher');const port=/localhost:(\d+)\/host/.exec(logs.join(''))[1],base='http://127.0.0.1:'+port;
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
 function watch(page,screen){const data={lobby:null,game:null,identity:null,connections:[]};page.on('pageerror',e=>report.errors.push({game:current,screen,message:e.message}));page.on('response',r=>{if(r.status()>=400)report.requests.push({game:current,screen,url:r.url().replace(base,''),status:r.status()});});
  page.on('websocket',socket=>{const kind=socket.url().endsWith('/lobby')?'lobby':'game';data.connections.push({kind,open:Date.now()});socket.on('framereceived',event=>{let m;try{m=JSON.parse(String(event.payload));}catch{return;}
   if(m.type==='state'){if(kind==='lobby')data.lobby=m;else data.game=m.data||m;}
   if(m.type==='game-ui'&&data.lobby?.active?.instance===m.instance)data.lobby.active.ui=m.ui;
   if(m.type==='joined'&&kind==='game')data.identity=m.data?.id||m.id;
   if(['joined','join_error','error','replaced'].includes(m.type)){const e={screen,kind,type:m.type,at:Date.now(),message:m.message||m.data?.message||''};report.protocol.push(e);console.log('PROTOCOL',JSON.stringify(e));}
  });socket.on('close',()=>{report.protocol.push({screen,kind,type:'closed',at:Date.now()});});});return data;
 }
 async function make(screen,mobile=false){const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:1});const page=await ctx.newPage(),data=watch(page,screen);await page.goto(base+(mobile?'/':'/host'));return {ctx,page,data};}
 const h=await make('host');host=h.page;await until(()=>h.data.lobby?.catalog?.length===30,'30-game catalog');
 await host.locator('.game[data-id="bowling"]').waitFor();await host.screenshot({path:path.join(OUT,'catalog.jpg'),type:'jpeg',quality:75});
 const phones=[];for(let i=0;i<2;i++){const p=await make('phone'+i,true);await p.page.locator('#name').fill(i?'Арина':'Глеб');if(!i)await p.page.locator('input[name="hand"][value="left"]').check();await p.page.locator('#joinForm button').click();await until(()=>p.data.lobby?.players?.length>=i+1,'phone joins lobby');phones.push(p);}
 const nativeIds=['bowling','curling','gate_siege','pop_shots'];const requested=process.env.POLISH_GAMES?.split(',');const modes=requested||[...nativeIds,...h.data.lobby.catalog.filter(g=>!nativeIds.includes(g.id)).map(g=>g.id)];
 for(const mode of modes){current=mode;const entry={mode,native:nativeIds.includes(mode),ok:false,phoneBounds:[]};report.cases.push(entry);h.data.game=null;for(const p of phones)p.data.game=null;
  try{
   await host.locator(`.game[data-id="${mode}"] .start-game`).click();await until(()=>h.data.lobby?.active?.id===mode,'launch '+mode);
   for(const p of phones){await p.page.locator(`#gameFrame[src*="/games/${mode}/"]`).waitFor({state:'attached'});await p.page.locator('#readyButton').waitFor({state:'visible'});await until(()=>p.page.locator('#readyButton').isEnabled(),'enabled ready '+mode);}
   entry.loaded=true;console.log('LOADED',mode);
   for(const p of phones)await p.page.locator('#readyButton').click();
   await until(()=>['playing','countdown','reveal','results'].includes(h.data.lobby?.active?.ui?.phase)||h.data.game?.phase==='playing','authoritative start '+mode,25000);
   entry.started=true;const frame=host.frameLocator('#gameFrame');
   await until(()=>host.locator('body').getAttribute('data-phase').then(p=>['playing','countdown','reveal','results'].includes(p)),'shell phase '+mode);
   if(entry.native){
    await frame.locator('#ap-stage canvas').waitFor();const err=await frame.locator('#ap-error').isVisible();if(err)throw Error(await frame.locator('#ap-error').innerText());
    if(await frame.locator('link[href="/game-polish.css"]').count())throw Error('Legacy CSS injected into native engine');
    if(await frame.locator('.lp-select,.lp-start-card').count())throw Error('Legacy DOM enhancer contaminated native HUD');
    for(const p of phones){const f=p.page.frameLocator('#gameFrame');await f.locator('#ap-state').waitFor();const bounds=await f.locator('body').evaluate(body=>{const ids=['ap-hand','ap-swipe','ap-offset','ap-spin','ap-precise-open','ap-fire','ap-ability','ap-aim','ap-sensitivity'];const bad=[];for(const id of ids){const e=document.getElementById(id),r=e?.getBoundingClientRect();if(r?.width&&r?.height&&getComputedStyle(e).visibility!=='hidden'&&(r.x< -2||r.y< -2||r.right>innerWidth+2||r.bottom>innerHeight+2))bad.push({id,x:r.x,y:r.y,w:r.width,h:r.height,viewport:[innerWidth,innerHeight]});}return{viewport:[innerWidth,innerHeight],overflowX:body.scrollWidth-innerWidth,bad};});entry.phoneBounds.push(bounds);if(bounds.bad.length||bounds.overflowX>2)throw Error('Controller clipped: '+JSON.stringify(bounds));}
    if(mode==='bowling'||mode==='curling'){
     const p=phones.find(p=>p.data.identity===h.data.game?.currentId);if(!p)throw Error('Current player has no controller');const f=p.page.frameLocator('#gameFrame'),before=await frame.locator('#ap-stage').getAttribute('data-camera');
     await f.locator('#ap-precise-open').click();await f.locator('#ap-power').evaluate(el=>{el.value='.70';el.dispatchEvent(new Event('input',{bubbles:true}));});await f.locator('#ap-throw').click();
     await until(()=>h.data.game?.state==='rolling','accepted physical throw '+mode,6000);await delay(1200);
     const camera=await frame.locator('#ap-stage').getAttribute('data-camera'),ndc=await frame.locator('#ap-stage').getAttribute('data-projectile-ndc');entry.camera={before,after:camera,ndc};if(!camera||camera===before)throw Error('Static camera after real throw');
     const xyz=(ndc||'').split(',').map(Number);if(xyz.length!==3||xyz.some(n=>!Number.isFinite(n))||Math.abs(xyz[0])>1||Math.abs(xyz[1])>1)throw Error('Projectile escaped frame: '+ndc);
    }else{
     const p=phones[0],f=p.page.frameLocator('#gameFrame');await delay(mode==='gate_siege'?4200:700);const shotBefore=h.data.game.players.find(x=>x.id===p.data.identity)?.shots||0,b=await f.locator('#ap-fire').boundingBox();await p.page.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.page.mouse.down();await delay(400);await p.page.mouse.up();await delay(250);entry.fireReleased=!(await f.locator('#ap-fire').getAttribute('class')).includes('held');if(!entry.fireReleased)throw Error('Fire button stuck');entry.shotsBefore=shotBefore;
    }
    await host.screenshot({path:path.join(OUT,mode+'-host.jpg'),type:'jpeg',quality:78});await phones[0].page.screenshot({path:path.join(OUT,mode+'-phone.jpg'),type:'jpeg',quality:78});
    await phones[0].page.setViewportSize({width:320,height:568});await delay(200);await phones[0].page.screenshot({path:path.join(OUT,mode+'-small.jpg'),type:'jpeg',quality:72});await phones[0].page.setViewportSize({width:390,height:844});
   }else{await delay(700);entry.textLength=(await frame.locator('body').innerText()).length;entry.visibleButtons=await frame.locator('button:visible').count();await host.screenshot({path:path.join(OUT,mode+'-host.jpg'),type:'jpeg',quality:66});await phones[0].page.screenshot({path:path.join(OUT,mode+'-phone.jpg'),type:'jpeg',quality:66});}
   entry.ok=true;console.log('PASS_BROWSER',mode);
  }catch(e){entry.error=e.stack;entry.network={lobbyPlayers:h.data.lobby?.players,session:h.data.lobby?.active?.session,hostGame:h.data.game?{phase:h.data.game.phase,state:h.data.game.state,players:h.data.game.players}:null,phoneIds:phones.map(p=>p.data.identity)};console.log('FAIL_BROWSER',mode,e.message);try{await host.screenshot({path:path.join(OUT,mode+'-failure.jpg'),type:'jpeg',quality:60,timeout:6000});}catch{} }
  finally{
   try{await host.locator('#exitVoteButton').click({timeout:6000});await until(()=>!h.data.lobby?.active,'return lobby',6000);await host.locator('#lobby').waitFor({state:'visible',timeout:6000});}catch(e){entry.returnError=e.message;break;}
  }
 }
 console.log('SUMMARY',JSON.stringify(report.cases.map(c=>({mode:c.mode,ok:c.ok,error:c.error?.split('\n')[0]}))));
})().catch(e=>{report.fatal=e.stack;console.error(e);}).finally(async()=>{
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(OUT,'server.log'),logs.join(''));console.log('SERVER_LOG_TAIL',logs.join('').slice(-3500));
 try{await browser?.close();}catch{}server?.kill();if(report.fatal||report.errors.length||report.cases.some(c=>!c.ok))process.exitCode=1;
});
