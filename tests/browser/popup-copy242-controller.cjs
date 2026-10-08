'use strict';
// Browser fixtures exercise real application actions. Seeded history is QA data.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawn}=require('child_process');
const pw=require('playwright'),{ProfileStore}=require('../../lib/profile-store');
const width=Number(process.env.QA_WIDTH||393),height=Number(process.env.QA_HEIGHT||852),out=path.resolve(process.env.QA_OUTPUT||'output/playwright/popups242/controller-'+width);fs.mkdirSync(out,{recursive:true});
const fixture=path.join(out,'qa-profile-fixture.json'),store=new ProfileStore(null);
const people=['Alex Morgan','Sam Rivera','Jamie Park'].map(name=>store.register(null,name,'right'));
for(let i=0;i<3;i++)store.record({eventId:'qa'+i,players:people.map((p,j)=>({id:p.id,score:120-j*25+i*8,won:j===i,rank:j+1,metrics:{taps:120-j*25}}))},'qa-history','taprace');
fs.writeFileSync(fixture,JSON.stringify(store.data));
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'0',PARTY_DATA_FILE:fixture,PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'popup240'}});
let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const report={method:'393x852 browser fixtures: ordinary /play and native bridge + persistent tabs. Real actions; isolated seeded history, not a physical iPhone or completed match.',rows:[],errors:[],failures:[],inventory:[],capturedAt:new Date().toISOString()};
function check(ok,message){if(!ok)report.failures.push(message);}
(async()=>{try{
 for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await wait(50);assert(/localhost:(\d+)/.test(log),log);
 const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const manage=async data=>{const r=await fetch(origin+'/api/manage',{method:'POST',headers:{authorization:'Bearer popup240','content-type':'application/json'},body:JSON.stringify(data)});const value=await r.json();assert(r.ok,JSON.stringify(value));return value;};
 for(const engine of ['webkit','chromium']){
  const browser=await pw[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
  try{for(const route of ['web','native']){
   await manage({type:'stop'});
   const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
   if(route==='native')await context.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fs.readFileSync('public/native-shell/controller-bridge.js','utf8')+'\nwindow.__partyPersistentTabs=true;'+fs.readFileSync('public/native-shell/tabs.js','utf8')});
   const p=await context.newPage();p.on('pageerror',e=>report.errors.push({engine,route,message:e.message}));
   const prefix=engine+'-'+route;
   const action=selector=>p.evaluate(selector=>{const node=document.querySelector(selector);if(!node)throw Error('Missing action '+selector);node.click();},selector);
   const cleanup=async()=>{await p.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();if(document.body.classList.contains('profile-editing'))document.getElementById('profileCancel').click();});await wait(650);const remaining=await p.evaluate(()=>({active:document.body.hasAttribute('data-hp-modal-active'),markers:document.querySelectorAll('[data-hp-modal-background]').length,open:document.querySelectorAll('dialog[open]').length}));check(!remaining.active&&!remaining.markers&&!remaining.open,prefix+' cleanup '+JSON.stringify(remaining));};
   const capture=async(name,modal=false)=>{if(process.env.QA_CATALOG_ONLY&&!['profile','profile-fields-scrolled','active-catalog-populated'].includes(name))return;if(process.env.QA_BEFORE&&!['profile','rules','rankings-populated','pause-overlay'].includes(name))return;
    await p.evaluate(()=>document.fonts.ready);await wait(750);
    const data=await p.evaluate(()=>{
     const pause=document.querySelector('#pauseOverlay'),panel=document.querySelector('dialog[open]:modal')||(document.body.classList.contains('profile-editing')?document.querySelector('#onboarding'):pause&&!pause.hidden?pause:null);
     const rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
     const s=panel&&getComputedStyle(panel),b=panel&&(panel.tagName==='DIALOG'?getComputedStyle(panel,'::backdrop'):panel.id==='pauseOverlay'?getComputedStyle(panel,'::before'):getComputedStyle(document.querySelector('.profile-sheet-backdrop')));
     return{body:document.body.className,modalActive:document.body.hasAttribute('data-hp-modal-active'),panel:panel&&{id:panel.id,rect:rect(panel),background:s.background,opacity:s.opacity,filter:s.filter,backdropFilter:s.backdropFilter,backdrop:b.background,backdropOpacity:b.opacity},branches:[...document.querySelectorAll('[data-hp-modal-background]')].map(n=>({tag:n.tagName,id:n.id,filter:getComputedStyle(n).filter,rect:rect(n)})),backs:panel?[...panel.querySelectorAll('.hp-popup-back,.profile-cancel')].filter(n=>n.getClientRects().length&&!n.hidden).map(n=>({id:n.id,rect:rect(n),panel:rect(panel)})):[],text:panel?.innerText?.slice(0,1600),dock:document.querySelector('#partyNativeDock')&&rect(document.querySelector('#partyNativeDock'))};
    });
    data.copy=await p.evaluate(()=>{const root=document.querySelector('dialog[open]:modal')||(document.body.classList.contains('profile-editing')?document.querySelector('#onboarding'):document.querySelector('#pauseOverlay:not([hidden])'));return root?[...root.querySelectorAll('p:not([data-no-translate]):not(.lp-join-address),#photoHint')].filter(n=>n.getClientRects().length).map(n=>({id:n.id,text:n.textContent.trim(),color:getComputedStyle(n).color,align:getComputedStyle(n).textAlign,opacity:getComputedStyle(n).opacity})):[];});data.width=width;data.height=height;const file=prefix+'-'+name+'.png';await p.screenshot({path:path.join(out,file)});report.rows.push({engine,route,name,file,...data});
    if(name==='active-catalog-populated'){const overlap=await p.evaluate(()=>[...document.querySelectorAll('#catalogQuick .guest-game')].map(card=>{const count=card.querySelector('.guest-player-range').getBoundingClientRect(),actions=card.querySelector('.guest-actions').getBoundingClientRect(),readout=card.querySelector('.hp-menu-counter-readout').getBoundingClientRect(),label=card.querySelector('.hp-menu-counter-label').getBoundingClientRect();return {game:card.dataset.id,count:count.right,readout:readout.right,label:label.right,actions:actions.left};}).filter(r=>Math.max(r.readout,r.label)>r.actions+1));check(!overlap.length,prefix+' compact metadata fits '+JSON.stringify(overlap));}if(modal){for(const copy of data.copy.filter(c=>c.text&&!process.env.QA_BEFORE))check(copy.color==='rgb(206, 175, 255)',prefix+' '+name+' lavender copy '+copy.id+' '+copy.color);check(data.modalActive,prefix+' '+name+' active marker');check(data.branches.some(b=>b.filter.includes('blur(8px)')),prefix+' '+name+' actual branch blur');check(data.panel?.backdrop.includes('gradient'),prefix+' '+name+' backdrop shade');check(data.panel?.filter==='none',prefix+' '+name+' foreground filter '+data.panel?.filter);if(data.panel?.id!=='pauseOverlay')check(data.panel?.background.includes('0.93'),prefix+' '+name+' final93% material '+data.panel?.background);for(const b of data.backs){check(b.rect.x-b.panel.x>=14&&b.panel.right-b.rect.right>=14,prefix+' '+name+' back sides '+JSON.stringify(b));check(b.rect.bottom<=height-(route==='native'?56:10),prefix+' '+name+' back bottom '+JSON.stringify(b));}}
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
   };
   await p.goto(origin+'/play');await p.locator('#name').waitFor({state:'visible'});await capture('main-onboarding');
   await p.locator('#name').fill('Alex Morgan');await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor({state:'visible'});
   // Two real connected controller profiles populate the room list.
   await p.evaluate(people=>{window.__qaRosterSockets=people.map(profile=>{const ws=new WebSocket('ws://'+location.host+'/lobby');ws.onopen=()=>ws.send(JSON.stringify({type:'join',...profile}));return ws;});},people.slice(1));await wait(350);
   await capture('main-lobby');check(await p.evaluate(()=>document.querySelector('#onboarding').hidden&&getComputedStyle(document.querySelector('#onboarding')).display==='none'),prefix+' onboarding hidden after join');
   await action('#edit');await capture('profile',true);
   if(!process.env.QA_BEFORE){await p.evaluate(()=>{const fields=document.querySelector('#onboarding .profile-fields');fields.scrollTop=fields.scrollHeight;});await wait(80);const fields=await p.evaluate(()=>{const fields=document.querySelector('#onboarding .profile-fields'),hand=fields.querySelector('fieldset'),language=fields.querySelector('.party-language-setting'),save=document.querySelector('#joinForm button[type=submit]'),r=n=>{const b=n.getBoundingClientRect();return {y:b.y,bottom:b.bottom,height:b.height};};return {scrollTop:fields.scrollTop,scrollHeight:fields.scrollHeight,clientHeight:fields.clientHeight,viewport:r(fields),hand:r(hand),language:r(language),save:r(save)};});check(fields.hand.y>=fields.viewport.y-1&&fields.hand.bottom<=fields.viewport.bottom+1,prefix+' profile handedness reachable '+JSON.stringify(fields));check(fields.language.y>=fields.viewport.y-1&&fields.language.bottom<=fields.viewport.bottom+1,prefix+' profile language reachable '+JSON.stringify(fields));check(fields.save.y>=0&&fields.save.bottom<=height-(route==='native'?56:10),prefix+' profile Save visible while scrolled '+JSON.stringify(fields));report.inventory.push({engine,route,profileFields:fields});await capture('profile-fields-scrolled',true);}
   await cleanup();
   await action('.guest-info');await capture('rules',true);await cleanup();
   await action('#allRanks');await capture('rankings-populated',true);
   await action('#statsBody .stats-rank');await capture('player-stats-populated',true);await cleanup();
   await action('#companyRoomOpen');await capture('players-audio-settings',true);await cleanup();
   await p.locator('.return-entry-help>summary').scrollIntoViewIfNeeded();await action('.return-entry-help>summary');await capture('return-without-qr');await action('.return-entry-help>summary');
   await manage({type:'launch',id:'taprace',externalDisplay:true});await p.locator('#play').waitFor({state:'visible'});await p.locator('#waitingRules').waitFor({state:'visible'});await capture('main-game-waiting');
   await action('#showGames');await capture('active-catalog-populated',true);await cleanup();
   await action('#roomToggle');await capture('game-players-audio-settings',true);await cleanup();
   await action('#gameRules');await capture('game-rules',true);await cleanup();
   await action('#pauseButton');await p.locator('#pauseOverlay').waitFor({state:'visible'});await capture('pause-overlay',true);await action('#resumeButton');await wait(650);check(!await p.evaluate(()=>document.body.hasAttribute('data-hp-modal-active')||document.querySelector('[data-hp-modal-background]')),prefix+' pause cleanup');
   report.inventory.push({engine,route,dialogs:await p.evaluate(()=>[...document.querySelectorAll('dialog')].map(d=>({id:d.id,reachableGuest:!['joinDialog','confirmStop'].includes(d.id)})))});
   // Legacy host route opens host-only QR and exit confirmation through real actions.
   const hp=await context.newPage();await hp.goto(origin+'/host');await hp.locator('#play').waitFor({state:'visible'});await hp.evaluate(()=>document.fonts.ready);await wait(600);
   for(const [name,open,close]of [['host-join-qr','#joinOpen','#closeJoin'],['host-confirm-stop','#lobbyExit','#confirmStop button[value=cancel]']]){
    await hp.evaluate(selector=>document.querySelector(selector).click(),open);if(name==='host-join-qr')await hp.waitForFunction(()=>document.querySelector('#dialogQr').complete&&document.querySelector('#dialogQr').naturalWidth>0);await wait(750);await hp.screenshot({path:path.join(out,prefix+'-'+name+'.png')});
    const data=await hp.evaluate(()=>{const d=document.querySelector('dialog[open]');return{id:d?.id,text:d?.innerText,background:d&&getComputedStyle(d).background,active:document.body.hasAttribute('data-hp-modal-active'),branches:[...document.querySelectorAll('[data-hp-modal-background]')].map(n=>({id:n.id,filter:getComputedStyle(n).filter})),shade:d&&getComputedStyle(d,'::backdrop').background};});
    report.rows.push({engine,route,name,file:prefix+'-'+name+'.png',hostRole:true,...data});check(data.active&&data.branches.some(n=>n.filter.includes('blur(8px)')),prefix+' '+name+' actual blur');check(data.background.includes('0.93'),prefix+' '+name+' final93% material '+data.background);
    await hp.evaluate(selector=>document.querySelector(selector).click(),close);await wait(650);check(!await hp.evaluate(()=>document.body.hasAttribute('data-hp-modal-active')||document.querySelector('[data-hp-modal-background]')),prefix+' '+name+' cleanup');
   }
   await context.close();
  }}finally{await browser.close();}
 }
 report.ok=!report.failures.length&&!report.errors.length;
}finally{child.kill();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({rows:report.rows.length,errors:report.errors,failures:report.failures,ok:report.ok}));if(!report.ok)process.exitCode=1;
})().catch(e=>{report.errors.push({message:e.stack});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
