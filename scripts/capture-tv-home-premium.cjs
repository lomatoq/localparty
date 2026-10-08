'use strict';
// TV home (lobby) premium pass: real launcher, real /play joins, seeded company standings.
// QA_OUTPUT=<dir> node scripts/capture-tv-home-premium.cjs
// QA_PICK=1 selects a Host's Pick before capturing. QA_SIZES / QA_COUNTS override the matrix.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {webkit,chromium}=require(process.env.PARTY_PLAYWRIGHT||'/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/tv-home-premium/run');fs.mkdirSync(out,{recursive:true});
const pick=process.env.QA_PICK==='1',tag=pick?'pick':'nopick';
const sizes=(process.env.QA_SIZES||'1280x720,1920x1080,3840x2160').split(',').map(s=>s.split('x').map(Number));
const counts=(process.env.QA_COUNTS||'0,4,12').split(',').map(Number);
const names=['Alexandra LongSurname','Morgan','Kim','Dasha Petrova','Leo','Sam Okafor','Maya','Ivan','Noor','Tomás','Yuki','Bea'];
const seedFile=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'tvhome-')),'party.json');
const mk=(name,points,wins)=>({id:crypto.randomBytes(8).toString('hex'),token:crypto.randomBytes(24).toString('hex'),createdAt:Date.now(),name,hand:'right',stats:{played:Math.ceil(points/20),wins,points,games:{}}});
fs.writeFileSync(seedFile,JSON.stringify({version:1,players:[mk('Rosa Champion',190,4),mk('Pavel',140,2),mk('June',90,1),mk('Quinn',40,0)],events:[]}));
const engine=process.env.QA_BROWSER==='chromium'?'chromium':'webkit';
const report={startedAt:new Date().toISOString(),browser:engine,pick,captures:[],errors:[],resources:[]};
let log='',browser;const child=spawn(process.execPath,['server.js'],{env:{...process.env,...(process.env.QA_EMBEDDED==='1'?{PARTY_EMBEDDED:'1'}:{}),PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'tvhome',PARTY_DATA_FILE:seedFile}});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=t=>new Promise(r=>setTimeout(r,t));async function until(f){for(let i=0;i<200;i++){if(f())return;await sleep(200);}throw Error('launcher start');}
async function settle(p){await p.evaluate(async()=>{await document.fonts.ready;await Promise.race([Promise.allSettled([...document.images].filter(i=>{const r=i.getBoundingClientRect();return i.src&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}).map(i=>i.decode())),new Promise(r=>setTimeout(r,5000))]);await Promise.race([Promise.allSettled(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished)),new Promise(r=>setTimeout(r,2500))]);});await sleep(700);}
function listen(p,s){p.on('pageerror',e=>report.errors.push({surface:s,error:e.message}));p.on('response',r=>{if(r.status()>=400)report.resources.push({surface:s,status:r.status(),url:r.url()});});}
const probe=()=>{const stage=document.getElementById('tvStage'),sr=stage.getBoundingClientRect(),k=sr.width/1280;
 const box=e=>{if(!e||!e.getClientRects().length)return null;const r=e.getBoundingClientRect();return[(r.x-sr.x)/k,(r.y-sr.y)/k,r.width/k,r.height/k].map(v=>Math.round(v*10)/10);};
 const q=s=>document.querySelector(s),font=e=>e?getComputedStyle(e).fontSize+'/'+getComputedStyle(e).opacity:null;
 const regions={header:'.tv-header',logo:'.heypals-tv-logo',tabs:'.tv-menu-labels',audio:'#tvAudioToggle',intro:'#lobby .intro',headline:'.headline-stage h1',hero:'.heypals-hero',preview:'#preview',browse:'#tvBrowse',catalog:'#tvCatalog',fresh:'.lp-fresh-section',featured:'.lp-catalog-card.featured',sidebar:'#tvSidebar',invite:'.tv-invite',qr:'#qr',people:'#tvSidebar .company-people:not(.tv-invite)',players:'#players',ranking:'#tvRanking'};
 const boxes=Object.fromEntries(Object.entries(regions).map(([k2,s])=>[k2,box(q(s))]));
 const cards=[...document.querySelectorAll('#tvCatalog .lp-catalog-card')].slice(0,8).map(c=>({id:c.dataset.id,box:box(c),title:font(c.querySelector('.lp-card-title')),desc:font(c.querySelector('.game-info p')),descStyle:(()=>{const e=c.querySelector('.game-info p');if(!e)return null;const s=getComputedStyle(e);return{family:s.fontFamily,style:s.fontStyle,color:s.color,opacity:s.opacity,accent:getComputedStyle(c).getPropertyValue('--card')};})(),logo:box(c.querySelector('.lp-card-game-logo'))}));
 const visiblePlayers=[...document.querySelectorAll('#players .player')].filter(n=>!n.hidden&&n.getClientRects().length).length;
 // Sidebar sections must not overlap each other; the sidebar and browse column must not overlap.
 const inter=(a,b)=>a&&b&&a[0]<b[0]+b[2]-.5&&b[0]<a[0]+a[2]-.5&&a[1]<b[1]+b[3]-.5&&b[1]<a[1]+a[3]-.5;
 const overlaps=[['invite','people'],['people','ranking'],['invite','ranking'],['browse','sidebar'],['header','preview']].filter(([a,b])=>inter(boxes[a],boxes[b])).map(x=>x.join('×'));
 const outside=Object.entries(boxes).filter(([k2,b])=>b&&k2!=='browse'&&k2!=='catalog'&&(b[0]<-1||b[1]<-1||b[0]+b[2]>sr.width/k+1||b[1]+b[3]>721)).map(([k2])=>k2);
 const sidebar=q('#tvSidebar'),clip=[...sidebar.querySelectorAll('section')].filter(s=>s.getClientRects().length&&s.scrollHeight-s.clientHeight>4).map(s=>s.className);
 return{viewport:[innerWidth,innerHeight],scale:k,overflowX:document.documentElement.scrollWidth>innerWidth+1,browseScroll:q('#tvBrowse').scrollTop,boxes,cards,visiblePlayers,more:q('#players .tv-more')?.textContent||null,overlaps,outside,sidebarClip:clip,stageClass:stage.className};};
async function shot(p,file,state){await settle(p);
 // The 18 s idle auto-browse can fire during settle; re-apply the intended scroll before capture.
 const want=state.scrolled?null:0;if(want===0&&await p.evaluate(()=>document.getElementById('tvBrowse').scrollTop>2)){await p.evaluate(()=>{const b=document.getElementById('tvBrowse');b.scrollTo({top:0,behavior:'instant'});b.dispatchEvent(new Event("scroll"));});await settle(p);await sleep(1500);}if(!state.scrolled){
  await p.evaluate(()=>{const b=document.getElementById('tvBrowse');b.scrollTo({top:0,behavior:'instant'});b.dispatchEvent(new Event('scroll'));});
  await p.waitForFunction(()=>!document.getElementById('tvStage').classList.contains('tv-browsing'));
  await p.evaluate(async()=>{await Promise.allSettled(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished));});
  await sleep(350);
 }const proof=await p.evaluate(probe);await p.screenshot({path:path.join(out,file)});report.captures.push({file,state,at:new Date().toISOString(),proof});fs.writeFileSync(path.join(out,'report-'+tag+'.json'),JSON.stringify(report,null,2));}
(async()=>{try{await until(()=>/localhost:(\d+)/.test(log));const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];report.origin=origin;
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer tvhome','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error(await r.text());return r.json();};
 await api({type:'force-language',language:'en'});browser=await (engine==='chromium'?chromium:webkit).launch({headless:true,...(engine==='chromium'&&process.env.QA_BROWSER_EXECUTABLE?{executablePath:process.env.QA_BROWSER_EXECUTABLE}:{})});
 const tv=await browser.newPage({viewport:{width:sizes[0][0],height:sizes[0][1]}});listen(tv,'tv');await tv.goto(origin+'/tv');await tv.locator('#tvStartup').waitFor({state:'hidden'});
 if(pick){await api({type:'select',id:process.env.QA_PICK_ID||'tanks'});await tv.locator('#preview').waitFor({state:'visible'});}
 let joined=0;const phones=[];
 async function join(i){const p=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});listen(p,'phone');await p.addInitScript(()=>localStorage.setItem('local-party-language','en'));await p.goto(origin+'/play');await p.locator('#name').fill(names[i]);if(i%3===0){await p.locator('#avatarLibrary').setInputFiles(path.resolve('scripts/qa/fixtures/uploaded-nonsquare-'+(1+(i/3)%4)+'.png'));await p.waitForFunction(()=>document.querySelector('.profile-photo-field').getAttribute('aria-busy')==='false');}await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);}
 for(const n of counts){while(joined<n)await join(joined++);await tv.waitForFunction(n=>document.querySelectorAll('#players .player:not(.tv-more)').length===n,n);
  for(const [w,h] of sizes){await tv.setViewportSize({width:w,height:h});await tv.evaluate(()=>{const b=document.getElementById('tvBrowse');b.scrollTo({top:0,behavior:'instant'});document.querySelector('.lp-fresh-section .fresh-track, .fresh-track')?.scrollTo?.({left:0,behavior:'instant'});});await shot(tv,`tv-${tag}-p${n}-${w}.png`,{players:n,pick,scrolled:false});
   if(n===4){await tv.evaluate(()=>{const b=document.getElementById('tvBrowse');b.scrollTo({top:Math.min(b.scrollHeight-b.clientHeight,520),behavior:'instant'});b.dispatchEvent(new Event('scroll'));});await shot(tv,`tv-${tag}-p${n}-${w}-scrolled.png`,{players:n,pick,scrolled:true});}}}
}finally{report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'report-'+tag+'.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'server-'+tag+'.log'),log);await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
