'use strict';
// Controller sweep: real launch + force-start, one phone per size, screenshot
// mid-play for each listed game. QA_GAMES=bomb,kart QA_WIDTH=320 to narrow.
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/ux-polish/controllers');fs.mkdirSync(out,{recursive:true});
const games=(process.env.QA_GAMES||'bomb,tankarena,western,punchmeter,kart,knives,bowling,tanks,carryball').split(',');
const width=Number(process.env.QA_WIDTH)||393,height=Number(process.env.QA_HEIGHT)||(width===320?568:852);
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'sweep'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const report={width,games:{},errors:[]};
(async()=>{try{
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await sleep(50);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer sweep','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return r.json();};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}});await tv.goto(origin+'/tv');
 const phone=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});phone.on('pageerror',e=>report.errors.push(e.message));
 if(process.env.QA_NATIVE){const fsm=require('node:fs');await phone.addInitScript({content:'window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};'+fsm.readFileSync('public/native-shell/controller-bridge.js','utf8')});await phone.addInitScript({content:fsm.readFileSync('public/native-shell/tabs.js','utf8')});}
 await phone.goto(origin+'/play');await phone.locator('#name').fill('Alexandria Longname');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
 for(const id of games){const row={};report.games[id]=row;try{
  const g=(await api()).catalog.find(x=>x.id===id);await api({type:'bots-set',count:Math.min(3,(g?.max||4)-1)});await sleep(700);
  await api({type:'launch',id});await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled,null,{timeout:20000});await phone.locator('#readyButton').click();
  const s=await api();if(s.active?.ui?.phase==='waiting')await api({type:'force-start',instance:s.active.instance}).catch(()=>{});
  await sleep(4500);
  const f=phone.frames().find(x=>x.url().includes('/games/'));
  row.glyphs=f?await f.evaluate(()=>[...document.querySelectorAll('[data-hp-glyph]')].filter(g=>g.getClientRects().length).map(g=>g.dataset.hpGlyph+':'+g.textContent.trim().slice(0,18))):[];
  row.missed=f?await f.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>!e.children.length&&e.getClientRects().length&&!e.dataset.hpGlyph&&!e.closest('button')&&/^(place|lap|points?|frame|score|health|weapon|wins?|status|bomb|round|total|best|speed|kills|deaths|team)\b/i.test(e.textContent.trim())&&e.textContent.trim().length<18).map(e=>e.tagName+'#'+e.id+'.'+String(e.className).slice(0,30)+' < '+(e.parentElement.id||String(e.parentElement.className).slice(0,30))+' :'+e.textContent.trim())):[];
  row.overflow=f?await f.evaluate(()=>document.documentElement.scrollWidth-innerWidth):null;
  await phone.screenshot({path:path.join(out,`${id}-${width}x${height}${process.env.QA_NATIVE?'-native':''}.png`)});
  if(process.env.QA_TV)await tv.screenshot({path:path.join(out,`${id}-tv.png`)});
 }catch(e){row.error=e.message.split('\n')[0];}
 await api({type:'stop'}).catch(()=>{});await phone.locator('#home').waitFor({timeout:15000}).catch(()=>{});}
}catch(e){report.failure=e.stack;process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,`report-${width}.json`),JSON.stringify(report,null,2));await browser?.close();child.kill();console.log(JSON.stringify(report));}})();
