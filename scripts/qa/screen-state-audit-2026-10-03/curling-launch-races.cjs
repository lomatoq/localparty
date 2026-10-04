'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve('output/playwright/screen-state-audit-2026-10-03/curling-launch-races');fs.mkdirSync(out,{recursive:true});
const files=['server.js','lib/party-runtime.js','public/tv.js','public/app.js','lib/session-controls.js','games/sports_siege/server.js','games/sports_siege/public/controls.js'];
const hashes=()=>Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const report={method:'Normal clock, two persistent actual browser controller sessions; no bots, force-start, injected readiness or fabricated game state.',start:hashes(),games:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'transition-audit'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const sleep=ms=>new Promise(r=>setTimeout(r,ms));const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
async function until(fn,label,ms=30000){const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await sleep(100);}throw Error(label);}
(async()=>{try{
await until(()=>/localhost:(\d+)/.test(log),'launcher port');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer transition-audit','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
await api({type:'force-language',language:'en'});await api({type:'bots-set',count:0});browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}});await tv.goto(origin+'/tv');const players=[];
for(const name of ['Transition One','Transition Two']){const c=await browser.newContext({viewport:{width:402,height:874},isMobile:true,hasTouch:true});const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(origin+'/play');await p.locator('#name').fill(name);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();players.push(p);}
async function launchAndReady(id,variant='normal'){
const row={id,variant,samples:[]};report.games.push(row);row.beforeLaunch=await api();await api({type:'launch',id});row.launched=await api();
for(const p of players){await p.waitForFunction(id=>document.getElementById('gameFrame').src.includes('/games/'+id+'/'),id);await p.waitForFunction(()=>!document.getElementById('readyButton').disabled);}
await players[0].locator('#readyButton').click();
if(variant==='reload'){await players[0].reload();await players[0].waitForFunction(()=>!document.getElementById('readyButton').disabled);}
if(variant==='offline'){await players[0].context().setOffline(true);await sleep(2200);row.offline=await api();}
if(variant==='native-resume'){await players[0].evaluate(()=>window.dispatchEvent(new Event('party-native-resume')));await players[0].waitForFunction(()=>!document.getElementById('readyButton').disabled);}
await players[1].locator('#readyButton').click();
if(variant==='offline'){await sleep(500);row.pending=await api();await players[0].context().setOffline(false);await players[0].evaluate(()=>window.dispatchEvent(new Event('online')));}
const deadline=Date.now()+20000;while(Date.now()<deadline){const st=await api();row.samples.push({at:new Date().toISOString(),active:st.active,players:st.players.map(p=>({id:p.id,name:p.name,gameReady:p.gameReady}))});if(['playing','countdown','reveal'].includes(st.active?.ui?.phase)){row.started=true;break;}await sleep(250);}
row.end=await api();await tv.locator('#tvSceneTransition').waitFor({state:'hidden'});await sleep(600);const file=id+'-'+variant+'-1280.png';await tv.screenshot({path:path.join(out,file)});row.captures=[file];console.log(id,variant,'STARTED',row.started,row.end.active?.ui?.phase);save();if(!row.started)throw Error('Start stalled '+variant);
}
await launchAndReady('bowling');
await launchAndReady('curling','direct-switch');
await launchAndReady('bowling');
await launchAndReady('curling','reload');
await launchAndReady('bowling');
await launchAndReady('curling','offline');
await launchAndReady('bowling');
await launchAndReady('curling','native-resume');
report.ok=true;
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{report.end=hashes();report.drift=files.filter(f=>report.start[f]!==report.end[f]);save();fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();child.kill();console.log('CLOSED',JSON.stringify(report.games.map(g=>({id:g.id,started:g.started}))),report.failure||'');}})();
