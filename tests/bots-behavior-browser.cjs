'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'bots-audit'}});
let log='',browser;const report={games:[],errors:[]};child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<250;i++){const v=await fn();if(v)return v;await delay(80);}throw Error(label+' '+log.slice(-700));}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'server');const base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer bots-audit','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const s=await r.json();assert(r.ok,JSON.stringify(s));return s;};
 browser=await webkit.launch({headless:true});let tv=await browser.newPage();const spare=await browser.newPage(),phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 for(const p of [tv,spare,phone]){p.on('pageerror',e=>report.errors.push(e.message));p.on('console',e=>{if(e.type()==='error'&&e.text().includes('Bot tick failed'))report.errors.push(e.text());});}
 await tv.goto(base+'/tv');await spare.goto(base+'/tv');await phone.goto(base+'/play');await phone.locator('#name').fill('Bot audit');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor({state:'visible'});
 await api({type:'bots-set',count:2});await until(async()=>(await api()).players.length===3,'two bots');
 const botIds=(await api()).players.filter(p=>p.testBot).map(p=>p.id).sort();
 const botFrames=page=>page.frames().filter(f=>f.parentFrame()&&f.parentFrame()!==page.mainFrame()&&f.url().includes('/games/'));
 const diagnostics=async page=>Promise.all(botFrames(page).map(f=>f.evaluate(()=>({...window.PARTY_BOT_DIAGNOSTICS}))));
 for(const id of (process.env.BOT_GAMES||'push,shrink,bomb,western,taprace,punchmeter,flappy,hungry,snakelines,carryball,marble_bloom,pocket_siege,bow_club,curling,bowling,swarm_gate,peek_shoot').split(',')){
  await api({type:'launch',id});await phone.locator('#readyButton').waitFor({state:'visible'});
  await until(async()=>{const d=await diagnostics(tv);return d.length===2&&d.every(x=>x.game===id);},'bot scripts '+id);
  await delay(350);assert.equal((await api()).active.ui.phase,'waiting','bots must not start without the human');assert((await diagnostics(tv)).every(d=>d.actions===0),'bots must not act before ready');if(spare!==tv)assert.equal(botFrames(spare).length,0,'second TV must not duplicate bots');
  await phone.locator('#readyButton').click();await until(async()=>['playing','countdown'].includes((await api()).active?.ui?.phase),'start '+id);
  // In turn-based games the human must actually take their turn before asking
  // bots to act. Waiting on a human is correct, not an inactive-bot failure.
  const controller=phone.frames().find(f=>f.url().includes('/games/'+id+'/'));
  if(id==='punchmeter'){
   const action=controller.locator('#action');await until(()=>action.isVisible().then(v=>v&&action.isEnabled()),'human punch turn');
   const r=await action.boundingBox();await phone.mouse.move(r.x+r.width/2,r.y+r.height/2);await phone.mouse.down();await delay(700);await phone.mouse.up();
  }
  if(id==='pocket_siege'){const fire=controller.locator('#tankFire');if(await fire.isEnabled())await fire.click();}
  await until(async()=>{
   if((await diagnostics(tv)).some(d=>d.actions>0))return true;
   if(['curling','bowling'].includes(id)){
    const pad=controller.locator('#ss-throw-pad');if(!(await pad.getAttribute('class')).includes('disabled')){
     const r=await pad.boundingBox();await phone.mouse.move(r.x+r.width*.5,r.y+r.height*.85);await phone.mouse.down();await delay(100);await phone.mouse.move(r.x+r.width*.5,r.y+r.height*.2,{steps:8});await delay(100);await phone.mouse.up();
    }
   }
   return false;
  },'bots act '+id);
  if(['taprace','punchmeter','hungry','marble_bloom','pocket_siege','bow_club'].includes(id))await until(async()=>{
   const progress=await Promise.all(botFrames(tv).map(f=>f.evaluate(game=>{const p=window.PARTY_PROFILE,s=window.PARTY_BOT_SELF,me=s?.players?.find(x=>x.id===p.id||x.name===p.name);return (me?.shotsFired||me?.shots||me?.score||0)>(game==='hungry'?20:0);},id)));return progress.some(Boolean);
  },'server confirms bot action '+id);
  if(id==='flappy'){await delay(6000);const observed=await diagnostics(tv);console.log('FLAPPY observations',JSON.stringify(observed));assert(observed.some(d=>d.decisions>20),'flappy bots must observe the board');assert.equal((await api()).active.ui.phase,'playing','bots survive the initial pipes');}
  await api({type:'pause',paused:true});await delay(250);const frozen=(await diagnostics(tv)).map(d=>d.actions);await delay(900);assert.deepEqual((await diagnostics(tv)).map(d=>d.actions),frozen,'paused bots must stay idle');
  await api({type:'pause',paused:false});
  if(id==='push'){
   await tv.close();tv=spare;
   await until(async()=>{const s=await api();return s.players.length===3&&s.active.ready.length===3;},'owner handoff');
   await until(async()=>(await diagnostics(tv)).some(d=>d.actions>0),'new owner runs bots');
   await until(async()=>JSON.stringify((await api()).players.filter(p=>p.testBot).map(p=>p.id).sort())===JSON.stringify(botIds),'handoff keeps bot identities');report.ownerHandoff=true;
  }
  const d=await diagnostics(tv);report.games.push({id,bots:d});console.log('PASS bots',id,JSON.stringify(d));await api({type:'stop'});await phone.locator('#home').waitFor({state:'visible'});
 }
 await api({type:'bots-set',count:0});await until(async()=>(await api()).players.length===1,'removed bots');await delay(1500);assert.equal((await api()).players.length,1,'removed bots never reconnect');assert.equal((await api()).active,null);assert.deepEqual(report.errors,[]);
}finally{fs.mkdirSync('.localparty-build/bots-audit',{recursive:true});fs.writeFileSync('.localparty-build/bots-audit/report.json',JSON.stringify(report,null,2));await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
