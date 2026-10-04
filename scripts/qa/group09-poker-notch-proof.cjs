'use strict';
// One normal-engine sequence. No state, card, bankroll or seating injection.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const output=path.resolve(process.env.QA_OUTPUT||'output/playwright/ui-rework-2026-10-02/group09-fresh/poker-lowered-table');fs.mkdirSync(output,{recursive:true});
const watched=['games/tabletop/public/arena.css','games/tabletop/public/app.js','games/tabletop/poker.js','games/tabletop/server.js','public/game-ui-themes.css','public/game-ui-themes.js','public/tv-information.css','public/tv.js','public/bridge.js'];
const hashes=()=>Object.fromEntries(watched.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const report={startedAt:new Date().toISOString(),method:'Normal real launcher/engine, actual joined controller and built-in bots; actual call/check and fold, no injected state. TV-only source change.',revisionStart:hashes(),games:[],errors:[]};
const save=()=>fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=30000){const end=Date.now()+timeout;while(Date.now()<end){const v=await fn();if(v)return v;await sleep(120);}throw Error(label);}
let log='',browser;const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'poker-lower-proof'}});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'launcher port');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{signal:AbortSignal.timeout(15000),method:body?'POST':'GET',headers:{Authorization:'Bearer poker-lower-proof','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
 await api({type:'force-language',language:'en'});browser=await webkit.launch({headless:true});const context=await browser.newContext();await context.addInitScript(()=>localStorage.setItem('local-party-language','en'));
 const tv=await context.newPage(),phone=await context.newPage();await tv.setViewportSize({width:1920,height:1080});await phone.setViewportSize({width:402,height:874});
 for(const [surface,p]of[['tv',tv],['phone',phone]])p.on('pageerror',e=>report.errors.push({surface,error:e.message}));
 await tv.goto(origin+'/tv');await phone.goto(origin+'/play');await phone.locator('#name').fill('Alexandra LongSurname');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
 for(const count of (process.env.QA_COUNTS||'2,4,8').split(',').map(Number)){
  const row={count,captures:[],geometry:[],actions:[]};report.games.push(row);console.log('START',count);
  try{
   await api({type:'bots-set',count:count-1});await until(async()=>(await api()).players.filter(p=>p.testBot).length===count-1,'actual bot roster');await api({type:'launch',id:'poker'});await phone.waitForFunction(()=>document.querySelector('#gameFrame').src.includes('/games/poker/'));await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled);await phone.locator('#readyButton').click();
   await until(async()=>{const s=await api();if(s.active?.ui?.phase==='playing')return true;if(s.active?.ui?.phase==='waiting'&&s.active?.instance)await api({type:'force-start',instance:s.active.instance}).catch(()=>{});return false;},'actual play');
   const screen=tv.frames().find(f=>f.url().includes('/games/poker/')),controller=phone.frames().find(f=>f.url().includes('/games/poker/'));await screen.waitForSelector('.seat');await sleep(700);
   const capture=async state=>{
    for(const width of [1920,1280]){await tv.setViewportSize({width,height:width*9/16});await sleep(300);await screen.evaluate(()=>document.fonts.ready);
     const parent=await tv.evaluate(()=>{const f=document.getElementById('gameFrame').getBoundingClientRect(),n=document.querySelector('.tv-info-center').getBoundingClientRect();return{frame:{x:f.x,y:f.y,w:f.width,h:f.height},notch:{x:n.x,y:n.y,w:n.width,h:n.height,bottom:n.bottom}};});
     const geometry=await screen.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};return{width:innerWidth,height:innerHeight,nativeInset:getComputedStyle(document.documentElement).getPropertyValue('--party-native-inset-top'),felt:rect(document.querySelector('.felt')),seats:[...document.querySelectorAll('.seat')].map(e=>({name:e.querySelector('.seat-name').textContent,current:e.classList.contains('current'),folded:e.classList.contains('folded'),box:rect(e),cards:[...e.querySelectorAll('.seat-hand .card')].map(rect)})),community:[...document.querySelectorAll('#community .card')].map(rect),pot:rect(document.getElementById('pot')),status:rect(document.getElementById('handStatus')),theme:window.HeyPalsGameThemes?.diagnostics?.(),phase:window.PARTY_BOT_VIEW.stage};});
     const scale=parent.frame.w/geometry.width,toParent=r=>({x:parent.frame.x+r.x*scale,y:parent.frame.y+r.y*scale,right:parent.frame.x+r.right*scale,bottom:parent.frame.y+r.bottom*scale});
     const felt=toParent(geometry.felt),boxes=geometry.seats.flatMap(s=>[s.box,...s.cards]).concat(geometry.community),outside=boxes.filter(r=>r.x<0||r.y<0||r.right>geometry.width+.5||r.bottom>geometry.height+.5);
     const potCardOverlap=boxes.filter(r=>r.x<geometry.pot.right&&r.right>geometry.pot.x&&r.y<geometry.pot.bottom&&r.bottom>geometry.pot.y);
     row.geometry.push({state,tvWidth:width,parent,...geometry,feltBelowNotch:felt.y>=parent.notch.bottom+8,notchClearance:felt.y-parent.notch.bottom,lowerGutter:width*9/16-felt.bottom,outside,potCardOverlap});
     if(outside.length||felt.y<parent.notch.bottom+8||felt.bottom>width*9/16+.5)throw Error('Poker composition escaped safe frame at '+count+'/'+width+'/'+state);
     if(state==='showdown'&&process.env.QA_CONFIRM_SHOWDOWN==='1'&&potCardOverlap.length)throw Error('Dense Pot readout overlaps revealed cards');
     const file='poker-'+count+'-tv-'+width+'-'+state+'.png';await tv.screenshot({path:path.join(output,file)});row.captures.push(file);save();
    }
   };
   row.privateCardsProtected=await screen.evaluate(()=>window.PARTY_BOT_VIEW.players.every(p=>p.hole.every(c=>c<0)));if(process.env.QA_CONFIRM_SHOWDOWN!=='1')await capture('playing');
   let called=false,offturn=false,showdown=false,folded=false;const end=Date.now()+115000;
   while(Date.now()<end){const s=await screen.evaluate(()=>window.PARTY_BOT_VIEW);if(s.phase!=='playing')break;
    if(s.stage==='showdown'&&!showdown){showdown=true;await capture('showdown');if(process.env.QA_CONFIRM_SHOWDOWN==='1')break;}
    if(await controller.locator('#call').isEnabled()){
     if(showdown&&!folded){await controller.locator('[data-action=fold]').click();folded=true;row.actions.push('actual Fold');await sleep(250);await capture('folded');}
     else{await controller.locator('#call').click();if(!called){called=true;row.actions.push('actual Call/check');await sleep(180);if(!await controller.locator('#call').isEnabled()){offturn=true;await capture('off-turn');}}}
    }
    if(called&&offturn&&showdown&&folded)break;await sleep(180);
   }
   row.outcomes={called,offturn,showdown,folded};if(!(process.env.QA_CONFIRM_SHOWDOWN==='1'?called&&showdown:Object.values(row.outcomes).every(Boolean)))throw Error('Actual Poker state coverage incomplete');console.log('CAPTURED',count);
  }catch(e){row.error=e.message;console.log('FAIL',count,e.message);}finally{await api({type:'stop'}).catch(()=>{});await phone.locator('#home').waitFor().catch(()=>{});save();}
 }
}finally{await browser?.close();child.kill();report.finishedAt=new Date().toISOString();report.revisionEnd=hashes();report.changedFiles=watched.filter(f=>report.revisionStart[f]!==report.revisionEnd[f]);save();fs.writeFileSync(path.join(output,'server.log'),log);}})().catch(e=>{report.failure=e.message;save();console.error(e);process.exitCode=1;});
