'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const inspectResultTypography=require('./capture-result-typography.cjs');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const root=path.resolve('.localparty-build/screen-review'),output=path.resolve(process.env.I18N_OUTPUT||path.join(root,'captures'));fs.mkdirSync(output,{recursive:true});
const clockRate=Number(process.env.QA_CLOCK_RATE)||12;
const child=spawn(process.execPath,['--require',path.resolve('scripts/capture-qa-clock.cjs'),'server.js'],{env:{...process.env,NODE_OPTIONS:[process.env.NODE_OPTIONS||'','--require='+path.resolve('scripts/capture-qa-clock.cjs')].join(' '),PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'screen-review',QA_CLOCK_RATE:String(clockRate)}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let log='',browser;
const report={capturedAt:new Date().toISOString(),method:'Real games, host actions, minimum supported settings; QA server clock '+clockRate+'x. Does not validate real-time physics or timing.',games:[],errors:[]};
let extras=[];try{extras=JSON.parse(fs.readFileSync(path.join(root,'manifest-extra.json')));}catch{}
child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const save=()=>{fs.writeFileSync(path.join(output,process.env.QA_REPORT_NAME||'complete-report.json'),JSON.stringify(report,null,2));if(process.env.QA_NO_MANIFEST!=='1')fs.writeFileSync(path.join(root,'manifest-extra.json'),JSON.stringify(extras,null,2));};
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{save();child.kill();browser?.close().finally(()=>process.exit(130));});
const deadline=setTimeout(()=>{console.error('Global review timeout');save();child.kill();process.exit(2);},45*60*1000);deadline.unref();
(async()=>{try{
 for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await sleep(50);assert.match(log,/localhost:(\d+)/);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{signal:AbortSignal.timeout(15000),method:body?'POST':'GET',headers:{Authorization:'Bearer screen-review','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const state=await r.json();if(!r.ok)throw Error(JSON.stringify(state));return state;};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}}),phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 for(const [surface,p]of[['tv',tv],['phone',phone]])p.on('pageerror',e=>report.errors.push({surface,error:e.message}));
 await tv.goto(origin+'/tv');await phone.goto(origin+'/play');await phone.locator('#name').fill('Александра ДлинноеИмя');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
 const catalog=(await api()).catalog, selected=process.env.AUDIT_GAMES?.split(',');
 for(const [index,game]of catalog.entries()){
  if(selected&&!selected.includes(game.id))continue;
  if(!selected&&fs.existsSync(path.join(output,game.id+'-results.png'))&&fs.existsSync(path.join(output,game.id+'-tv-results.png')))continue;
  const row={id:game.id,clockRate,settings:{},phases:[],captures:[],actions:[]};report.games.push(row);console.log('START',game.id);
  const capture=async(state,extra=false)=>{for(const [surface,p,k]of[['Телефон',phone,0],['ТВ',tv,1]]){const file=game.id+(k?'-tv':'')+'-'+state+'.png';if(state==='results'){row.typography??={};row.typography[k?'tv':'phone']=await inspectResultTypography(p);row.capturedAt=new Date().toISOString();}await p.screenshot({path:path.join(output,file)});row.captures.push(file);if(extra){const id=String(1000+index*10+({reveal:0,countdown:2,reconnected:4,spectator:6}[state]||0)+k);extras=extras.filter(x=>x.id!==id);extras.push({id,game:game.id,title:game.title,surface,state:state==='reveal'?'Промежуточный итог':state==='countdown'?'Отсчёт':state==='reconnected'?'После переподключения':'Зритель',file:'captures/'+file,method:report.method});}}save();};
  try{
   for(const field of game.hostControls?.settings||[]){let value=field.initial;if(['maxRounds','laps','count','seconds','minutes','maxTurns','turns','rounds','arrows','frames','ends','waves','levels'].includes(field.id))value=field.options[0].value;row.settings[field.id]=value;}
   if(game.id==='tanks')row.settings.mode='ctf';
   await api({type:'settings',id:game.id,settings:row.settings});const count=Math.min(3,game.max-1);await api({type:'bots-set',count});
   for(let i=0;i<100;i++){if((await api()).players.filter(p=>p.testBot).length===count)break;await sleep(100);}
   await api({type:'launch',id:game.id});await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),game.id);await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled,null,{timeout:30000});await phone.locator('#readyButton').click();
   const started=Date.now(),maxWait=Number(process.env.QA_GAME_TIMEOUT)||150000;let lastAction=0,lastPhase='',reveal=false,countdown=false;
   while(Date.now()-started<maxWait){const snapshot=await api(),ui=snapshot.active?.ui,phase=ui?.phase;if(phase!==lastPhase){row.phases.push({phase,afterMs:Date.now()-started,progress:ui?.progress});lastPhase=phase;console.log('PHASE',game.id,phase,ui?.progress);}
    if(phase==='waiting'&&Date.now()-started>5000&&Date.now()-lastAction>2000){try{await api({type:'force-start',instance:snapshot.active.instance});row.actions.push('force-start loaded clients');}catch(error){row.actions.push('force-start rejected: '+error.message);}lastAction=Date.now();}
    if(game.id==='spy'&&phase==='playing'&&ui.progress?.includes('роль')){for(const page of[phone,tv])for(const frame of page.frames()){if(!frame.url().includes('/games/spy/'))continue;const card=frame.locator('#secretCard');if(await card.count()){await card.dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',bubbles:true});await sleep(300);await card.dispatchEvent('pointerup',{pointerId:1,pointerType:'touch',bubbles:true});await frame.locator('#readyBtn').evaluate(el=>{if(!el.disabled)el.click()});}}row.actions.push('hold secret card and confirm ready');}
    if(phase==='results'){await sleep(5000);row.resultProgress=(await api()).active?.ui?.progress;if(game.id==='pocket_siege'){const parts=String(row.resultProgress).match(/(\d+)\s*\/\s*(\d+)/);assert(parts&&Number(parts[1])<=Number(parts[2]),'Final turn progress cannot exceed configured turns');}await capture('results');row.resultPhase=(await api()).active?.ui?.phase;break;}
    if(phase==='reveal'&&!reveal){await capture('reveal',true);reveal=true;}
    if(phase==='countdown'&&!countdown){await capture('countdown',true);countdown=true;}
    if(Date.now()-lastAction>800){const available=game.hostControls?.actions?.filter(a=>a.phases.includes(phase)&&(!Array.isArray(ui.hostActions)||ui.hostActions.includes(a.id)))||[];const action=available.find(a=>['end','finish','reveal','next','beginVote','finishVote'].includes(a.id));if(action){try{await api({type:'game-action',instance:snapshot.active.instance,action:action.id});row.actions.push(action.id);}catch(e){row.actions.push('rejected '+action.id+': '+e.message);}lastAction=Date.now();}}
    await sleep(120);
   }
   if(!row.captures.includes(game.id+'-results.png')){row.error='No real result within '+maxWait+'ms';const finalState=(await api()).active;row.lastUi=finalState?.ui;row.startError=finalState?.startError;row.session=finalState?.session;await capture('last-observed');}
   else console.log('CAPTURED',game.id);
  }catch(error){row.error=error.message;console.log('FAIL',game.id,error.message);}
  finally{try{await api({type:'stop'});await phone.locator('#home').waitFor({timeout:15000});}catch(e){row.cleanupError=e.message;}save();}
 }
}finally{clearTimeout(deadline);save();await browser?.close();child.kill();fs.writeFileSync(path.join(output,(process.env.QA_REPORT_NAME||'complete-report.json')+'.server.log'),log);}})().catch(error=>{console.error(error);process.exitCode=1;});
