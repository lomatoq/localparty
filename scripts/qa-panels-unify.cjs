'use strict';
// Panels-unify sweep (Claude panels lane, 2026-10-05). Real launch path, one phone,
// per game: waiting (before Ready), playing (two moments), and optionally the
// finished/results state (run the server with TEST_FAST=1 and QA_RESULTS=1).
// Also dumps a geometry/typography inventory of the controller frame so panel
// paddings, radii, button heights and label styles can be compared across games.
// Env: QA_GAMES, QA_WIDTH, QA_HEIGHT, QA_OUTPUT, QA_NATIVE, QA_RESULTS, QA_SKIP_WAITING.
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/panels-unify-2026-10-05/run');fs.mkdirSync(out,{recursive:true});
const ALL='push,shrink,knives,bomb,western,tanks,tankarena,chaos,kart,monster,spy,millionaire,sinyakquiz,warsaw,crocodile,jenga,crane,naval,drawguess,western_duel,taprace,punchmeter,flappy,hungry,snakelines,carryball,marble_bloom,pocket_siege,bow_club,poker,airhockey,mines,curling,bowling,swarm_gate,peek_shoot';
const games=(process.env.QA_GAMES||ALL).split(',');
const width=Number(process.env.QA_WIDTH)||393,height=Number(process.env.QA_HEIGHT)||(width===320?568:852);
const tag=`${width}x${height}${process.env.QA_NATIVE?'-native':''}`;
const results=!!process.env.QA_RESULTS;
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'sweep',...(results?{TEST_FAST:'1'}:{})}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const report={width,height,games:{},errors:[]};
const INVENTORY=()=>{
 const vis=e=>{if(!e.getClientRects().length)return false;const s=getComputedStyle(e);return s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05;};
 const desc=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\s+/).filter(c=>!/^hp-(soft|turn|cta)/.test(c)).slice(0,3).join('.'):'');
 const box=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {el:desc(e),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),r:s.borderTopLeftRadius,pad:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft].map(v=>Math.round(parseFloat(v))).join('/'),bg:s.backgroundImage!=='none'?'img':s.backgroundColor,bd:s.borderTopWidth+' '+s.borderTopColor,ol:s.outlineStyle!=='none'?s.outlineWidth+' '+s.outlineColor:'',fs:s.fontSize,ff:s.fontFamily.split(',')[0],fw:s.fontWeight,fst:s.fontStyle,tt:s.textTransform,ls:s.letterSpacing,text:(e.innerText||e.value||'').trim().replace(/\s+/g,' ').slice(0,28)};};
 const buttons=[...document.querySelectorAll('button,[role=button]')].filter(vis).map(box);
 const cards=[...document.querySelectorAll('.hp-info-card,.hp-stat-group,[class*=card],[class*=panel],[class*=status],section,article')].filter(vis).filter(e=>e.getBoundingClientRect().width>60).slice(0,30).map(box);
 const headings=[...document.querySelectorAll('h1,h2,h3,.hp-heading,.hp-state-title,.hp-game-title')].filter(vis).map(box);
 const labels=[...document.querySelectorAll('.hp-stat-label,small,label,.label,.eyebrow')].filter(vis).slice(0,20).map(box);
 // content gutters: leftmost/rightmost visible block edges relative to the frame
 const blocks=[...document.querySelectorAll('body *')].filter(e=>vis(e)&&e.getBoundingClientRect().width>40&&e.getBoundingClientRect().height>20&&getComputedStyle(e).position!=='fixed'&&e.tagName!=='CANVAS');
 const xs=blocks.map(e=>e.getBoundingClientRect());const left=Math.min(...xs.map(r=>r.left)),right=Math.max(...xs.map(r=>r.right));
 // painted surfaces only (cards, buttons, pads): their outer edges are the real gutters
 const painted=[...document.querySelectorAll('body *')].filter(e=>{if(!vis(e)||e.tagName==='CANVAS')return false;const r=e.getBoundingClientRect();if(r.width<60||r.width>innerWidth-2||r.height<28)return false;const s=getComputedStyle(e);if(s.position==='fixed')return false;const a=(s.backgroundColor.match(/[\d.]+/g)||[]).map(Number);return (a.length===4?a[3]>0.05:a.length===3)||s.backgroundImage!=='none'||parseFloat(s.borderTopWidth)>0||s.outlineStyle!=='none';}).map(e=>e.getBoundingClientRect());
 const pL=painted.length?Math.round(Math.min(...painted.map(r=>r.left))):null,pR=painted.length?Math.round(innerWidth-Math.max(...painted.map(r=>r.right))):null;
 const surfaces=[...document.querySelectorAll('body *')].filter(e=>{if(!vis(e))return false;const r=e.getBoundingClientRect();return r.width>=innerWidth*0.5&&r.width<innerWidth-2&&r.height>=28&&getComputedStyle(e).position!=='fixed'&&(getComputedStyle(e).backgroundImage!=='none'||!/rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(e).backgroundColor))}).slice(0,12).map(box);
 const main=document.querySelector('main,#app,.controller,.phone,body>div');
 return {url:location.pathname+location.search.slice(0,40),vw:innerWidth,vh:innerHeight,gutterL:Math.round(left),gutterR:Math.round(innerWidth-right),paintL:pL,paintR:pR,surfaces,scrollH:document.documentElement.scrollHeight,main:main&&box(main),buttons,cards,headings,labels};
};
async function gameFrame(page){return page.frames().find(x=>/\/games\/|\/g\//.test(x.url())&&x!==page.mainFrame());}
async function shoot(phone,id,state,row){
 const f=await gameFrame(phone);
 try{row[state]=f?await f.evaluate(INVENTORY):null;}catch(e){row[state]={error:e.message.split('\n')[0]};}
 try{row[state+'Shell']=await phone.evaluate(()=>({phase:document.documentElement.dataset.partyPhase||'',body:document.body.className.slice(0,80),waiting:!document.getElementById('waitingRules')?.hidden}));}catch{}
 await phone.screenshot({path:path.join(out,`${id}-${state}-${tag}.png`)});
}
(async()=>{try{
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await sleep(50);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer sweep','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return r.json();};
 await api({type:'force-language',language:'en'}).catch(()=>{});
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}});await tv.goto(origin+'/tv');
 const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,locale:'en-US',deviceScaleFactor:2});
 const phone=await ctx.newPage();phone.on('pageerror',e=>report.errors.push(e.message));
 if(process.env.QA_NATIVE){await phone.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fs.readFileSync('public/native-shell/controller-bridge.js','utf8')});await phone.addInitScript({content:fs.readFileSync('public/native-shell/tabs.js','utf8')});}
 await phone.goto(origin+'/play');await phone.locator('#name').fill('Alexandria Longname');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
 for(const id of games){const row={};report.games[id]=row;const t0=Date.now();try{
  const g=(await api()).catalog.find(x=>x.id===id);await api({type:'bots-set',count:Math.max(0,Math.min(3,(g?.max||4)-1))});await sleep(700);
  await api({type:'launch',id});await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled,null,{timeout:20000});
  if(!process.env.QA_SKIP_WAITING&&!results){await sleep(1200);await shoot(phone,id,'waiting',row);}
  await phone.locator('#readyButton').click();
  const s=await api();if(s.active?.ui?.phase==='waiting')await api({type:'force-start',instance:s.active.instance}).catch(()=>{});
  if(!results){await sleep(2600);await shoot(phone,id,'play1',row);await sleep(3600);await shoot(phone,id,'play2',row);}
  else{
   const until=Date.now()+40000;let phase='';
   while(Date.now()<until){const st=await api();phase=st.active?.ui?.phase||st.active?.phase||'';if(/finish|result|over|podium/i.test(phase))break;await sleep(700);}
   row.phase=phase;await sleep(2400);await shoot(phone,id,'results',row);
  }
 }catch(e){row.error=e.message.split('\n')[0];try{await phone.screenshot({path:path.join(out,`${id}-error-${tag}.png`)});}catch{}}
 row.ms=Date.now()-t0;
 await api({type:'stop'}).catch(()=>{});await phone.locator('#home').waitFor({timeout:15000}).catch(()=>{});await sleep(500);}
}catch(e){report.failure=e.stack;process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,`inventory-${results?'results-':''}${tag}.json`),JSON.stringify(report,null,1));await browser?.close();child.kill();
 const sum={};for(const [k,v] of Object.entries(report.games))sum[k]=v.error||v.phase||'ok';console.log(JSON.stringify(sum));}})();
