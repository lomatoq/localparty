'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),WS=require('ws');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'test-results/polish-v2');fs.mkdirSync(OUT,{recursive:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,ms=18000){const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await wait(60);}throw Error('Timeout: '+label);}
const report={testedCommit:process.env.GITHUB_SHA||'local',cases:[],errors:[],requests:[],protocol:[],art:[]};let current='lobby',browser,server,host,base,hostKey;const logs=[];
async function shot(page,name){try{const c=await page.context().newCDPSession(page),v=page.viewportSize();const {data}=await c.send('Page.captureScreenshot',{format:'jpeg',quality:52,clip:{x:0,y:0,width:v.width,height:v.height,scale:Math.min(1,600/v.width)},captureBeyondViewport:false});fs.writeFileSync(path.join(OUT,name+'.jpg'),Buffer.from(data,'base64'));await c.detach();}catch(e){console.log('SCREENSHOT_ERROR',name,e.message);}}
async function stop(){const s=new WS(base.replace('http:','ws:')+'/lobby');try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('stop channel timeout')),3500);s.on('open',()=>s.send(JSON.stringify({type:'host',key:hostKey})));s.on('message',raw=>{if(JSON.parse(raw).type==='host-ok'){clearTimeout(timer);resolve();}});s.on('error',reject);});s.send(JSON.stringify({type:'stop'}));await wait(100);}finally{s.terminate();}}
async function tap(page,locator){await locator.waitFor({state:'visible',timeout:5000});await until(()=>locator.isEnabled(),'tap enabled',3000);const b=await locator.boundingBox();if(!b)throw Error('No touch target');await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);}
async function bounds(page){return page.frameLocator('#gameFrame').locator('body').evaluate(body=>{const bad=[],ids=['ap-hand','ap-swipe','ap-offset','ap-spin','ap-precise-open','ap-fire','ap-ability','ap-aim','ap-sensitivity'];for(const id of ids){const el=document.getElementById(id),r=el?.getBoundingClientRect();if(r?.width&&r.height&&getComputedStyle(el).visibility!=='hidden'&&(r.x< -2||r.y< -2||r.right>innerWidth+2||r.bottom>innerHeight+2))bad.push({id,x:r.x,y:r.y,w:r.width,h:r.height});}return{viewport:[innerWidth,innerHeight],overflowX:body.scrollWidth-innerWidth,bad};});}
(async()=>{
 server=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_EPHEMERAL:'1'},stdio:['ignore','pipe','pipe']});server.stdout.on('data',b=>logs.push(String(b)));server.stderr.on('data',b=>logs.push(String(b)));
 await until(()=>/localhost:(\d+)\/host/.test(logs.join('')),'launcher');base='http://127.0.0.1:'+ /localhost:(\d+)\/host/.exec(logs.join(''))[1];
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
 function watch(page,screen){const data={lobby:null,game:null,identity:null};page.on('pageerror',e=>report.errors.push({game:current,screen,message:e.message}));page.on('response',r=>{if(r.status()>=400)report.requests.push({game:current,screen,url:r.url().replace(base,''),status:r.status()});});page.on('websocket',socket=>{const kind=socket.url().endsWith('/lobby')?'lobby':'game';socket.on('framereceived',event=>{let m;try{m=JSON.parse(String(event.payload));}catch{return;}
  if(m.type==='state'){if(kind==='lobby')data.lobby=m;else data.game=m.data||m;}
  if(m.type==='game-ui'&&data.lobby?.active?.instance===m.instance)data.lobby.active.ui=m.ui;
  if(m.type==='joined'&&kind==='game')data.identity=m.data?.id||m.id;
  if(['error','join_error','replaced'].includes(m.type)){const e={screen,kind,type:m.type,at:Date.now(),message:m.message||m.data?.message||''};report.protocol.push(e);console.log('PROTOCOL',JSON.stringify(e));}
 });});return data;}
 async function make(screen,mobile=false){const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:1});const page=await ctx.newPage();page.setDefaultTimeout(8000);const data=watch(page,screen);await page.goto(base+(mobile?'/':'/host'));return{ctx,page,data};}
 const h=await make('host');host=h.page;hostKey=await host.evaluate(()=>window.PARTY_HOST_KEY);await until(()=>h.data.lobby?.catalog?.length===30,'30-game catalog');
 await host.locator('.game[data-id="bowling"]').waitFor();await until(()=>host.locator('.game[data-art-loaded="true"]').count().then(n=>n===4),'approved artwork decoded');
 for(const id of ['bowling','curling','gate_siege','pop_shots']){const card=host.locator(`.game[data-id="${id}"]`);report.art.push(await card.evaluate(el=>{const im=el.querySelector('img.symbol');return{id:el.dataset.id,width:im.naturalWidth,height:im.naturalHeight,src:im.currentSrc,clip:getComputedStyle(el).overflow,mask:getComputedStyle(im).maskImage};}));await card.scrollIntoViewIfNeeded();await shot(host,'card-'+id);}
 if(report.art.some(a=>a.width!==512||a.height!==512||!a.src.includes('-v3.avif')||a.clip!=='hidden'||a.mask==='none'))throw Error('Approved artwork integration failed');
 const phones=[];for(let i=0;i<2;i++){const p=await make('phone'+i,true);await p.page.locator('#name').fill(i?'Арина':'Глеб');if(!i)await p.page.locator('input[name="hand"][value="left"]').check();await p.page.locator('#joinForm button').click();await until(()=>p.data.lobby?.players?.length>=i+1,'phone joins');phones.push(p);}
 const native=['bowling','curling','gate_siege','pop_shots'],modes=process.env.POLISH_GAMES?.split(',')||native;report.expected=modes.length;
 for(const mode of modes){current=mode;const entry={mode,native:native.includes(mode),ok:false,bounds:[]};report.cases.push(entry);h.data.game=null;for(const p of phones)p.data.game=null;
  try{
   await host.locator(`.game[data-id="${mode}"] .start-game`).click();await until(()=>h.data.lobby?.active?.id===mode,'launch '+mode);
   for(const p of phones){await p.page.locator(`#gameFrame[src*="/games/${mode}/"]`).waitFor({state:'attached'});await p.page.locator('#readyButton').waitFor();await until(()=>p.page.locator('#readyButton').isEnabled(),'ready '+mode);}
   for(const p of phones)await p.page.locator('#readyButton').click();await until(()=>['playing','countdown','reveal','results'].includes(h.data.lobby?.active?.ui?.phase)||h.data.game?.phase==='playing','start '+mode,22000);entry.started=true;console.log('STARTED',mode);
   const frame=host.frameLocator('#gameFrame');
   if(entry.native){
    await frame.locator('#ap-stage canvas').waitFor();if(await frame.locator('#ap-error').isVisible())throw Error(await frame.locator('#ap-error').innerText());
    if(await frame.locator('.lp-select,.lp-start-card,link[href="/game-polish.css"]').count())throw Error('Legacy UI duplicated in native engine');
    if(mode==='bowling'||mode==='curling'){
     const p=phones.find(p=>p.data.identity===h.data.game?.currentId);if(!p)throw Error('No current controller');const f=p.page.frameLocator('#gameFrame'),before=await frame.locator('#ap-stage').getAttribute('data-camera');
     await tap(p.page,f.locator('#ap-precise-open'));await f.locator('#ap-power').evaluate(el=>{el.value='.70';el.dispatchEvent(new Event('input',{bubbles:true}));});await shot(p.page,mode+'-precise');console.log('PRECISE_OPEN',mode,h.data.game?.state,h.data.game?.deadline-h.data.game?.time);
     await tap(p.page,f.locator('#ap-throw'));await until(()=>h.data.game?.state==='rolling','accepted real throw '+mode,5000);entry.throwAccepted=true;await wait(1100);
     const camera=await frame.locator('#ap-stage').getAttribute('data-camera'),ndc=await frame.locator('#ap-stage').getAttribute('data-projectile-ndc');entry.camera={before,after:camera,ndc};if(!camera||camera===before)throw Error('Camera did not follow');const xyz=(ndc||'').split(',').map(Number);if(xyz.length!==3||xyz.some(n=>!Number.isFinite(n))||Math.abs(xyz[0])>1||Math.abs(xyz[1])>1)throw Error('Projectile out of frame '+ndc);
    }else{const p=phones[0],f=p.page.frameLocator('#gameFrame');await wait(mode==='gate_siege'?4200:700);const b=await f.locator('#ap-fire').boundingBox();await p.page.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.page.mouse.down();await wait(450);await p.page.mouse.up();await wait(200);entry.fireReleased=!(await f.locator('#ap-fire').getAttribute('class')).includes('held');if(!entry.fireReleased)throw Error('Stuck fire button');}
    await shot(host,mode+'-host');await shot(phones[0].page,mode+'-phone');
    for(const p of phones){const b=await bounds(p.page);entry.bounds.push(b);if(b.bad.length||b.overflowX>2)throw Error('390px controller clipped: '+JSON.stringify(b));}
    await phones[0].page.setViewportSize({width:320,height:568});await wait(180);const small=await bounds(phones[0].page);entry.bounds.push(small);await shot(phones[0].page,mode+'-small');await phones[0].page.setViewportSize({width:390,height:844});if(small.bad.length||small.overflowX>2)throw Error('320px controller clipped: '+JSON.stringify(small));
   }else{await wait(500);entry.visibleButtons=await frame.locator('button:visible').count();await shot(host,mode+'-host');await shot(phones[0].page,mode+'-phone');}
   entry.ok=true;console.log('PASS_BROWSER',mode);
  }catch(e){entry.error=e.stack;entry.diagnostics={phase:h.data.lobby?.active?.ui?.phase,currentId:h.data.game?.currentId,state:h.data.game?.state,session:h.data.lobby?.active?.session,identities:phones.map(p=>p.data.identity)};console.log('FAIL_BROWSER',mode,e.message);await shot(host,mode+'-failure');await shot(phones[0].page,mode+'-failure-phone');}
  finally{
   for(const p of phones)await p.page.setViewportSize({width:390,height:844});
   try{await host.locator('#lobbyExit').click({timeout:4000});await host.locator('#confirmStop button[value="yes"]').click({timeout:4000});await until(()=>!h.data.lobby?.active,'UI return to lobby',5000);entry.returnUI=true;}catch(e){entry.returnUI=false;entry.returnError=e.message;await stop();}
   await until(()=>!h.data.lobby?.active,'cleanup',5000);await host.locator('#lobby').waitFor();
  }
 }
 console.log('SUMMARY',JSON.stringify(report.cases.map(c=>({mode:c.mode,ok:c.ok,error:c.error?.split('\n')[0],returnUI:c.returnUI}))));
})().catch(e=>{report.fatal=e.stack;console.error(e);}).finally(async()=>{
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(OUT,'server.log'),logs.join(''));console.log('SERVER_LOG_TAIL',logs.join('').slice(-2200));try{await browser?.close();}catch{}server?.kill();if(report.fatal||report.errors.length||report.cases.length!==report.expected||report.cases.some(c=>!c.ok))process.exitCode=1;
});
