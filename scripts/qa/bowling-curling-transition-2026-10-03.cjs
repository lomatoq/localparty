'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve('output/playwright/screen-state-audit-2026-10-03/bowling-curling-two-human');fs.mkdirSync(out,{recursive:true});
const files=['server.js','lib/party-runtime.js','public/tv.js','public/app.js','games/sports_siege/server.js','games/sports_siege/public/controls.js'];
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
for(const id of ['bowling','curling']){
const row={id,samples:[]};report.games.push(row);row.beforeLaunch=await api();await api({type:'launch',id});row.launched=await api();console.log(id,'LAUNCHED',row.launched.active?.ui?.phase);
for(const p of players){await p.waitForFunction(id=>document.getElementById('gameFrame').src.includes('/games/'+id+'/'),id);await p.waitForFunction(()=>!document.getElementById('readyButton').disabled);await p.locator('#readyButton').click();}
const deadline=Date.now()+20000;while(Date.now()<deadline){const s=await api();row.samples.push({at:new Date().toISOString(),active:s.active,players:s.players.map(p=>({id:p.id,name:p.name,online:p.online,ready:p.ready}))});if(['playing','countdown','reveal'].includes(s.active?.ui?.phase)){row.started=true;break;}await sleep(250);}
await tv.locator('#tvSceneTransition').waitFor({state:'hidden'});for(const [width,height]of [[1280,720],[1920,1080]]){await tv.setViewportSize({width,height});await sleep(550);const file=id+'-after-ready-'+width+'.png';await tv.screenshot({path:path.join(out,file)});row.captures??=[];row.captures.push(file);}
row.end=await api();console.log(id,'STARTED',row.started,row.end.active?.ui?.phase);save();await api({type:'stop'});for(const p of players)await p.locator('#home').waitFor();row.afterStop=await api();}
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{report.end=hashes();report.drift=files.filter(f=>report.start[f]!==report.end[f]);save();fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();child.kill();console.log('CLOSED',JSON.stringify(report.games.map(g=>({id:g.id,started:g.started}))),report.failure||'');}})();
