'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const output=path.resolve(process.env.I18N_OUTPUT||'.localparty-build/i18n-all-games');fs.mkdirSync(output,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'locale-audit'}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let log='',browser;const report={games:[],errors:[]};child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
async function inspect(frame){return frame.evaluate(()=>{
 const names=[...(window.PARTY_ROSTER||[]).map(p=>p.name),window.PARTY_PROFILE?.name].filter(Boolean),texts=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){const el=node.parentElement;if(!el||el.closest('script,style,option,input,textarea,[data-no-translate],[translate=no]')||!el.getClientRects().length||getComputedStyle(el).visibility==='hidden')continue;let text=node.nodeValue.trim();for(const name of names)text=text.split(name).join('');text=text.replace(/Бот\s*\d+/g,'');if(/[А-Яа-яЁё]{2}/.test(text))texts.push(text);}
 return{language:window.PartyI18n?.language,residual:[...new Set(texts)],missing:window.PartyI18n?.missing||[]};
});}
(async()=>{try{
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await sleep(50);assert.match(log,/localhost:(\d+)/);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer locale-audit','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const state=await r.json();if(!r.ok)throw Error(JSON.stringify(state));return state;};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}}),phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),localeRequests=[];
 phone.on('request',request=>{const pathname=new URL(request.url()).pathname;if(pathname.startsWith('/i18n'))localeRequests.push(pathname);});
 for(const [surface,p]of[['tv',tv],['phone',phone]])p.on('pageerror',e=>report.errors.push({surface,error:e.message}));
 await tv.goto(origin+'/tv');await phone.goto(origin+'/play');await phone.locator('#name').fill('Анна');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();report.lobby=await inspect(phone.mainFrame());
 const selected=process.env.AUDIT_GAMES?.split(',');for(const game of (await api()).catalog.filter(g=>!selected||selected.includes(g.id))){
  const row={id:game.id},requestOffset=localeRequests.length;report.games.push(row);try{
   const count=Math.min(3,game.max-1);await api({type:'bots-set',count});for(let i=0;i<100;i++){if((await api()).players.filter(p=>p.testBot).length===count)break;await sleep(100);}assert.equal((await api()).players.filter(p=>p.testBot).length,count,'Bot roster must settle before launch');await api({type:'launch',id:game.id});
   await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),game.id);await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled,null,{timeout:20000});
   row.waiting=await inspect(phone.mainFrame());
   row.waitingAlignment=await phone.locator('.waiting-goal').evaluate(el=>{const box=el.getBoundingClientRect(),title=document.querySelector('#waitingTitle').getBoundingClientRect();return{align:getComputedStyle(el).textAlign,offset:Math.abs((box.left+box.right-title.left-title.right)/2),overflow:el.scrollWidth-el.clientWidth};});
   assert.equal(row.waitingAlignment.align,'center');assert(row.waitingAlignment.offset<1,'Loading subtitle must share the title centre');assert(row.waitingAlignment.overflow<2,'Loading subtitle must wrap within the screen');
   await phone.screenshot({path:path.join(output,game.id+'-waiting.png')});await phone.locator('#readyButton').click();
   for(let i=0;i<40;i++){if(!['waiting','countdown'].includes((await api()).active?.ui?.phase))break;await sleep(200);}await sleep(250);
   const frame=phone.frames().find(f=>f.url().includes('/games/'+game.id+'/'));await frame.waitForFunction(()=>!!window.PartyI18n);row.controller=await inspect(frame);row.shell=await inspect(phone.mainFrame());
   row.translationRequests=localeRequests.slice(requestOffset);assert(!row.translationRequests.includes('/i18n-dictionary.js'),'game frame must reuse shell UI vocabulary');
   assert.equal(row.translationRequests.includes('/i18n-content.js'),['millionaire','sinyakquiz','warsaw','spy','monster','crocodile','drawguess'].includes(game.id),'only word/quiz games load content banks');
   const screen=tv.frames().find(f=>f.url().includes('/games/'+game.id+'/'));if(screen)row.screen=await inspect(screen);
   await phone.screenshot({path:path.join(output,game.id+'.png')});
   await phone.evaluate(()=>PartyI18n.setLanguage('ru'));assert.equal(await frame.evaluate(()=>PartyI18n.language),'en');await phone.evaluate(()=>PartyI18n.setLanguage('en'));assert.equal(await frame.evaluate(()=>PartyI18n.language),'en');
   console.log('LOCALE',game.id,JSON.stringify(row.controller.residual));
  }catch(error){row.error=error.message;console.log('FAIL',game.id,error.message);}await api({type:'stop'});await phone.locator('#home').waitFor();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
 }
 if(report.errors.length||report.games.some(g=>g.error))throw Error('Locale audit runtime failures');
 const untranslated=report.games.flatMap(game=>['waiting','controller','shell','screen'].flatMap(surface=>(game[surface]?.residual||[]).map(text=>({game:game.id,surface,text}))));
 const missing=report.games.flatMap(game=>['waiting','controller','shell','screen'].flatMap(surface=>(game[surface]?.missing||[]).map(text=>({game:game.id,surface,text}))));fs.writeFileSync(path.join(output,'missing.json'),JSON.stringify(missing,null,2));assert.deepEqual(missing,[],'Every rendered production phrase needs dictionary coverage');
 assert.deepEqual(untranslated,[],'English controller and TV surfaces must not contain untranslated copy');
}finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();}})().catch(error=>{console.error(error);process.exitCode=1;});
