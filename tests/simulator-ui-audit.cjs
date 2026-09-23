'use strict';
// Real simulator WKWebView driver. Requires a Debug simulator build launched with
// SIMCTL_CHILD_PARTY_UI_AUDIT=1 and SIMCTL_CHILD_PARTY_TEST_KEY=ui-simulator-audit.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const device=process.env.AUDIT_DEVICE||'67ECE888-2F77-45FC-89DE-127096A509C5';
const container=execFileSync('xcrun',['simctl','get_app_container',device,'com.localparty.launcher','data'],{encoding:'utf8'}).trim();
const out=path.resolve(process.env.AUDIT_OUTPUT||'.localparty-build/simulator-ui-audit');fs.mkdirSync(out,{recursive:true});
const gallery=process.env.AUDIT_GALLERY==='1',shots=process.env.AUDIT_APPEND&&fs.existsSync(path.join(out,'screens.json'))?JSON.parse(fs.readFileSync(path.join(out,'screens.json'))):[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let sequence=0;
async function js(script,surface='menu'){
 const id=Date.now()+'-'+(++sequence),file=path.join(container,'Documents/ui-audit-command.json');
 fs.writeFileSync(file+'.tmp',JSON.stringify({id,script,surface}));fs.renameSync(file+'.tmp',file);
 for(let i=0;i<150;i++){await sleep(100);let r;try{r=JSON.parse(fs.readFileSync(path.join(container,'Documents/ui-audit-result.json')));}catch{}if(r?.id===id){if(r.error)throw Error(r.error);return r.result;}}
 throw Error('Simulator script timed out: '+script.slice(0,100));
}
async function until(script,surface='controller'){for(let i=0;i<100;i++){if(await js(script,surface))return;await sleep(100);}throw Error('UI wait: '+script);}
function screenshot(name){execFileSync('xcrun',['simctl','io',device,'screenshot',path.join(out,name+'.png')],{stdio:'ignore'});recordShot(name,'iPhone simulator');}
function recordShot(name,surface){const entry={name,file:name+'.png',surface},i=shots.findIndex(s=>s.name===name);if(i>=0)shots[i]=entry;else shots.push(entry);fs.writeFileSync(path.join(out,'screens.json'),JSON.stringify(shots,null,2));}
async function main(){
 if(process.env.AUDIT_SCRIPT){console.log(await js(process.env.AUDIT_SCRIPT,process.env.AUDIT_SURFACE||'menu'));return;}
 await js("if(window.LocalPartyTabs)LocalPartyTabs.select('games');else document.querySelector('#partyNativeMenu')?.click();true",'controller');
 await until('Boolean(window.LocalPartyHost)','menu');await js("document.querySelector('#openHost').click();true");await sleep(1100);screenshot('host-panel');
 const samples=[];for(let i=0;i<10;i++){samples.push(await js("JSON.stringify({open:hostPanel.open,opacity:getComputedStyle(hostPanel).opacity,top:hostPanel.getBoundingClientRect().top})"));await sleep(100);}
 await js("document.querySelector('[data-close=hostPanel]').click();true");await sleep(500);
 if(gallery){
  await js('scrollTo(0,0);true');await sleep(1800);screenshot('menu-catalog-top');
  await js('scrollTo(0,1200);true');await sleep(1500);screenshot('menu-sticky-stack');
  await js('scrollTo(0,0);true');
  await js("document.querySelector('#openHost').click();true");await sleep(600);
  for(const [name,selector] of [['host-network','#networkToggle'],['host-players','#rosterTitle'],['host-settings','#hapticsToggle'],['host-language','#hostLanguageSettings'],['host-statistics','#standings'],['host-diagnostics','#backgroundStatus']]){
   await js(`document.querySelector(${JSON.stringify(selector)})?.closest('details')?.setAttribute('open','');document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'center'});true`);await sleep(400);screenshot(name);
  }
  await js("document.querySelector('[data-close=hostPanel]').click();true");await sleep(400);
 }
 if(process.env.AUDIT_PANEL_ONLY){fs.writeFileSync(path.join(out,'panel-samples.json'),JSON.stringify(samples,null,2));return;}
 await js("document.querySelector('#openController').click();true");
 await until('Boolean(document.querySelector("#joinForm"))');
 if(await js('!document.querySelector("#onboarding").hidden','controller'))await js("document.querySelector('#name').value='Александра';document.querySelector('#joinForm').requestSubmit();true",'controller');
 await until('!document.querySelector("#home").hidden');
 if(gallery){await js('scrollTo(0,0);true','controller');await sleep(1800);screenshot('controller-catalog-top');await js('scrollTo(0,1200);true','controller');await sleep(1800);screenshot('controller-catalog-scroll');await js('scrollTo(0,0);true','controller');}
 if(gallery){
  await js("document.querySelector('#editFromCatalog').click();true",'controller');await sleep(600);screenshot('controller-profile');
  await js("document.querySelector('#joinForm').requestSubmit();true",'controller');await sleep(500);
  await js("document.querySelector('#showStats').click();true",'controller');await sleep(500);screenshot('controller-leaderboard');
  await js("document.querySelector('#closeStats').click();true",'controller');
 }
 const base=await js('location.origin','controller');
 const api=async body=>{const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer ui-simulator-audit','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
 const browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}});const report={panelSamples:samples,games:[]};
 const tvShot=async name=>{await tv.screenshot({path:path.join(out,name+'.png')});recordShot(name,'TV · WebKit 1280×720');};
 try{await tv.goto(base+'/tv');if(gallery){await tvShot('tv-startup');await sleep(3000);await tvShot('tv-lobby');}const catalog=(await api()).catalog,selected=process.env.AUDIT_GAMES?.split(',');
 if(process.env.AUDIT_DETAILS_ONLY){
  await js("if(window.LocalPartyTabs)LocalPartyTabs.select('games');else document.querySelector('#partyNativeMenu').click();true",'controller');await sleep(300);
  for(const g of catalog){await js(`document.querySelector('#catalog [data-id="${g.id}"] .lp-card-open').click();true`);await until('document.querySelector("#gameDetail").open','menu');await sleep(450);screenshot(g.id+'-host-detail');await js("document.querySelector('[data-close=gameDetail]').click();true");await sleep(350);console.log('DETAIL',g.id);}
  return;
 }
 for(const g of catalog.filter(g=>!selected||selected.includes(g.id))){
  const item={id:g.id};report.games.push(item);
  try{
   if(gallery){
    await js("if(window.LocalPartyTabs)LocalPartyTabs.select('games');else document.querySelector('#partyNativeMenu').click();true",'controller');await sleep(300);
    await js(`document.querySelector('#catalog [data-id="${g.id}"] .lp-card-open').click();true`);await until('document.querySelector("#gameDetail").open','menu');await sleep(700);screenshot(g.id+'-host-detail');
    await js("document.querySelector('[data-close=gameDetail]').click();true");await sleep(350);
    await js("document.querySelector('#openController').click();true");
   }
   await api({type:'bots-set',count:Math.max(1,g.min-1)});await sleep(500);await api({type:'launch',id:g.id});
   await until(`document.querySelector('#gameFrame').src.includes('/games/${g.id}/') && !document.querySelector('#readyButton').disabled`);
   if(gallery){await sleep(500);screenshot(g.id+'-waiting');await tvShot(g.id+'-tv-waiting');}
   if(g.id==='push'){
    await js("if(window.LocalPartyTabs)LocalPartyTabs.select('games');else document.querySelector('#partyNativeMenu').click();true",'controller');await sleep(300);screenshot('active-game-top');
    await js('scrollTo(0,1200);true');await sleep(400);screenshot('active-game-pinned');
    item.activeStrip=JSON.parse(await js("JSON.stringify({top:activeCard.getBoundingClientRect().top,bottom:activeCard.getBoundingClientRect().bottom,height:innerHeight,title:activeTitle.textContent})"));
    if(item.activeStrip.top<0||item.activeStrip.bottom>item.activeStrip.height)throw Error('Active game is not pinned');
    await js("document.querySelector('#openController').click();true");
    await until("!document.querySelector('#readyButton').disabled");
   }
   await js("document.querySelector('#readyButton').click();true",'controller');
   for(let i=0;i<80;i++){if(!['waiting','countdown'].includes((await api()).active?.ui?.phase))break;await sleep(200);}
   const started=(await api()).active;
   if(!started||['waiting','countdown'].includes(started.ui?.phase))throw Error('Game never left readiness/countdown; controller screenshot would not verify gameplay');
   await sleep(600);screenshot(g.id+'-controller');
   if(gallery)await tvShot(g.id+'-tv-playing');
   if(g.id==='bow_club'){await js("document.querySelector('#gameFrame').contentDocument.querySelector('#touch').click();true",'controller');await sleep(300);screenshot('bow-club-touch');}
   item.metrics=JSON.parse(await js("JSON.stringify((()=>{const w=document.querySelector('#gameFrame').contentWindow;return {width:w.innerWidth,height:w.innerHeight,overflow:w.document.documentElement.scrollWidth>w.innerWidth+1,buttons:[...w.document.querySelectorAll('button')].filter(n=>n.getClientRects().length&&w.getComputedStyle(n).visibility!=='hidden').map(n=>({id:n.id,text:n.textContent.trim(),font:w.getComputedStyle(n).fontSize,width:n.clientWidth,height:n.clientHeight,clipped:n.scrollWidth>n.clientWidth+2}))}})())",'controller'));
   await js("document.querySelector('#pauseButton').click();true",'controller');await sleep(650);screenshot(g.id+'-pause');
   if(gallery){await tvShot(g.id+'-tv-pause');await js("document.querySelector('#sessionRules').click();true",'controller');await sleep(650);screenshot(g.id+'-rules');await js("document.querySelector('#closeRules').click();true",'controller');await sleep(300);}
   item.phase=(await api()).active?.ui?.phase;
   item.pauseGeometry=JSON.parse(await js("JSON.stringify((()=>{const dock=document.querySelector('#sessionControls'),overlay=document.querySelector('#pauseOverlay');return {dockTop:dock.getBoundingClientRect().top,overlayBottom:overlay.getBoundingClientRect().bottom,buttons:[...dock.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>{const r=b.getBoundingClientRect();return {id:b.id,hit:[4,r.height/2,r.height-4].every(y=>b.contains(document.elementFromPoint(r.x+r.width/2,r.y+y)))}})}})())",'controller'));
   if(item.pauseGeometry.overlayBottom>item.pauseGeometry.dockTop+1||item.pauseGeometry.buttons.some(b=>!b.hit))throw Error('Pause layer overlaps session controls');
   if(item.metrics.overflow||item.metrics.buttons.some(b=>b.clipped))throw Error('Controller overflow or clipped button label');
  }catch(e){item.error=e.message;screenshot(g.id+'-error');}
  await api({type:'stop'});await until('!document.querySelector("#home").hidden');
  await until('document.querySelector("#play").hidden');
  item.returnState=JSON.parse(await js("JSON.stringify({waiting:document.body.classList.contains('game-waiting'),pause:!document.querySelector('#pauseOverlay').hidden,dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.id),notice:document.querySelector('#notice').hidden?null:document.querySelector('#notice').textContent})",'controller'));
  if(item.returnState.waiting||item.returnState.pause||item.returnState.dialogs.length)item.error='Stale game surface on return to lobby';
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('SIMULATOR',g.id,item.error||'captured');
 }
 }finally{await api({type:'stop'});await browser.close();}
 if(report.games.some(g=>g.error))throw Error('Simulator audit has failures');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
