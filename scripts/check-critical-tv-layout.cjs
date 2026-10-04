'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/critical-tv-layout');fs.mkdirSync(out,{recursive:true});
const report={method:'Live launcher + real player joins/ready and host actions. No score, question or game-state injection.',games:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'tv-layout-check'}});let log='',browser;
child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,label){const end=Date.now()+30000;while(Date.now()<end){const v=await fn();if(v)return v;await sleep(80);}throw Error(label);}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'launcher port');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{signal:AbortSignal.timeout(10000),method:body?'POST':'GET',headers:{Authorization:'Bearer tv-layout-check','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();assert(r.ok,JSON.stringify(s));return s;};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>report.errors.push(e.message));await tv.goto(origin+'/tv');
 const phones=[];for(const name of ['Александра ДлинноеИмя','Пётр']){const p=await browser.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true});await p.goto(origin+'/play');await p.locator('#name').fill(name);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push(p);}
 for(const id of (process.env.AUDIT_GAMES||'chaos,millionaire').split(',')){
  console.log('START',id);if(id==='millionaire')await api({type:'settings',id,settings:{seconds:60,maxTurns:30}});await api({type:'launch',id});
  await Promise.all(phones.map(async p=>{await p.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);await p.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await p.locator('#readyButton').click();}));
  const loaded=await api();if(loaded.active?.ui?.phase==='waiting')try{await api({type:'force-start',instance:loaded.active.instance});}catch(e){if(!e.message.includes('Игра уже началась или завершена'))throw e;}
  await until(async()=>(await api()).active?.ui?.phase==='playing','playing '+id);
  const frame=await until(()=>tv.frames().find(f=>f.url().includes('/games/'+id+'/')),'TV frame');
  const row={id,sizes:[],observedQuestions:[]};report.games.push(row);
  async function answer(){for(const p of phones){const f=p.frames().find(f=>f.url().includes('/games/millionaire/'));if(!f)continue;const buttons=f.locator('#answer:not(.hidden) #phoneAnswers button:not(:disabled)');if(await buttons.count()){await buttons.first().click();return;}}throw Error('No active answer controller');}
  if(id==='millionaire')for(let attempt=0;attempt<10;attempt++){
    await frame.locator('#questionText').waitFor({state:'visible'});const text=await frame.locator('#questionText').textContent();row.observedQuestions.push(text);if(text.length>=90||attempt===9)break;
    await answer();await until(async()=>(await api()).active?.ui?.phase==='reveal','reveal');const a=(await api()).active;await api({type:'game-action',instance:a.instance,action:'next'});await until(async()=>(await api()).active?.ui?.phase==='playing','next question');
  }
  await tv.locator('#tvSceneTransition').waitFor({state:'hidden'});
  for(const phase of id==='millionaire'?['question','reveal']:['playing']){
   if(phase==='reveal'){await answer();await frame.locator('#explanation').waitFor({state:'visible'});}

  for(const size of [{width:1280,height:720},{width:1920,height:1080}]){
   await tv.setViewportSize(size);await sleep(300);
   const metrics=await frame.evaluate(id=>{
    const selectors=id==='chaos'?['#arena','#damageFlash','#game','.hudTitle','.objectiveStatus']:['main.hostShell','#game','.stage','.activeBanner','.questionWrap','#questionText','#answers','#explanation',...Array.from({length:4},(_,i)=>'#answers > :nth-child('+(i+1)+')')];
    const nodes=selectors.map(selector=>{const el=document.querySelector(selector);if(!el)return{selector,missing:true};const r=el.getBoundingClientRect(),s=getComputedStyle(el);const rules=[];for(const sheet of document.styleSheets){try{for(const rule of sheet.cssRules){if(rule.selectorText&&el.matches(rule.selectorText)&&(rule.style.opacity||rule.style.background||rule.style.display||rule.style.fontSize))rules.push({source:sheet.href||'inline',selector:rule.selectorText,opacity:rule.style.opacity,background:rule.style.background,display:rule.style.display,fontSize:rule.style.fontSize});}}catch{}}return{selector,inline:el.getAttribute('style'),animations:el.getAnimations().map(a=>({name:a.animationName,playState:a.playState,timing:a.effect?.getComputedTiming(),frames:a.effect?.getKeyframes()})),text:selector==='#questionText'?el.textContent:undefined,rect:{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom},style:{display:s.display,opacity:s.opacity,background:s.background,fontSize:s.fontSize,lineHeight:s.lineHeight,overflow:s.overflow},rules};});return{width:innerWidth,height:innerHeight,nodes};
   },id);metrics.phase=phase;row.sizes.push(metrics);await tv.screenshot({path:path.join(out,id+'-'+phase+'-'+size.height+'.png')});
   if(process.env.QA_ASSERT==='1'){
    if(id==='chaos')assert.equal(metrics.nodes.find(n=>n.selector==='#damageFlash').style.opacity,'0','idle death overlay hidden');
    else for(const n of metrics.nodes.filter(n=>n.selector.startsWith('#answers >')||n.selector==='#questionText'||n.selector==='#explanation'))assert(n.rect.y>=0&&n.rect.bottom<=metrics.height+1,JSON.stringify(n));
   }
  }
  }
  await api({type:'stop'});await phones[0].locator('#home').waitFor();console.log('DONE',id);
 }
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
