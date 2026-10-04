'use strict';
// Actual matchmaking; no rewritten rules or session states. Native scripts are
// unchanged; only the Swift message transport is simulated in browser QA.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const pw=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/rules-scroll/before');fs.mkdirSync(out,{recursive:true});
const files=['public/app.js','public/background-scene.css','public/motion.js','public/native-shell/controller-bridge.js','public/native-shell/tabs.js'];
const hashes=()=>Object.fromEntries(files.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const report={startedAt:new Date().toISOString(),sourceStart:hashes(),cases:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'rules-scroll'}});let log='',browser;
child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
async function until(fn,label){for(let n=0;n<300;n++){const v=await fn();if(v)return v;await sleep(50);}throw Error(label);}
async function measure(p){return p.evaluate(()=>{const d=document.querySelector('.waiting-details'),b=d.querySelector('.waiting-rules-body'),box=e=>e.getBoundingClientRect().toJSON(),s=getComputedStyle(b);return{open:d.open,details:box(d),summary:box(d.querySelector('summary')),body:box(b),height:b.clientHeight,scrollHeight:b.scrollHeight,scrollTop:b.scrollTop,overflow:s.overflowY,touchAction:s.touchAction,ready:box(document.querySelector('#readyButton')),footer:box(document.querySelector('#sessionControls')),pseudo:getComputedStyle(d,'::details-content').display,text:b.textContent};});}
async function swipe(p,rect,down=true){const cdp=await p.context().newCDPSession(p),x=rect.x+rect.width/2,y=down?rect.bottom-12:rect.top+12,distance=Math.min(96,rect.height*.65)*(down?-1:1);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let n=1;n<=12;n++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+distance*n/12}]});await sleep(16);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();await sleep(180);}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'server');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async data=>{const r=await fetch(origin+'/api/manage',{method:'POST',headers:{Authorization:'Bearer rules-scroll','Content-Type':'application/json'},body:JSON.stringify(data)});assert(r.ok,await r.text());};
 const engine=process.env.QA_BROWSER||'webkit';browser=await pw[engine].launch({headless:true,...(process.env.QA_BROWSER_EXECUTABLE?{executablePath:process.env.QA_BROWSER_EXECUTABLE}:{})});
 const tv=await browser.newPage({viewport:{width:1280,height:720}});await tv.goto(origin+'/tv');
 const phones=[];for(const native of [false,true]){const context=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  await context.addInitScript({content:"localStorage.setItem('local-party-language','en');"+(native?"window.webkit={messageHandlers:{partyShell:{postMessage(){}}}};if(window===window.top)window.__partyPersistentTabs=true;\n"+fs.readFileSync('public/native-shell/controller-bridge.js','utf8')+'\n'+fs.readFileSync('public/native-shell/tabs.js','utf8'):'')});
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(origin+'/play');await p.locator('#name').fill(native?'Native rules':'Web rules');await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();phones.push({p,native});}
 for(const id of (process.env.QA_GAMES||'naval,push').split(',')){
  await api({type:'launch',id});
  for(const {p,native}of phones){await p.locator('#waitingRules').waitFor({state:'visible'});await p.waitForFunction(()=>!document.querySelector('#readyButton').disabled);
   for(const [width,height]of [[320,568],[393,852]]){
    await p.setViewportSize({width,height});const summary=p.locator('.waiting-details>summary');if(!(await measure(p)).open)await summary.click();await sleep(500);await p.evaluate(()=>document.fonts.ready);
    if(engine==='chromium')for(let n=0;n<8;n++){const m=await measure(p);if(m.scrollTop<=1)break;await swipe(p,m.body,false);}
    const before=await measure(p),file=`${id}-${engine}-${native?'native':'web'}-${width}`;
    await p.screenshot({path:path.join(out,file+'-top.png')});
    const x=before.body.x+before.body.width/2,y=Math.min(before.body.bottom-12,before.footer.top-16);
    if(engine==='chromium'){
     await swipe(p,before.body);for(let n=0;n<8;n++){const m=await measure(p);if(m.scrollTop+m.height>=m.scrollHeight-1)break;await swipe(p,m.body);}
    }else{
     // WebKit's mobile Playwright transport cannot dispatch wheel input. Probe
     // cancellation and containment without assigning scrollTop; trusted swipe
     // is separately exercised by Chromium below.
     const blocked=await p.evaluate(({x,y})=>{const e=document.elementFromPoint(x,y),make=(type,yy)=>{const event=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(event,'touches',{value:[{clientX:x,clientY:yy}]});return event;};e.dispatchEvent(make('touchstart',y));return !e.dispatchEvent(make('touchmove',y-80));},{x,y});report.webkitGestureProbe={cancelled:blocked};
    }
    await sleep(300);const after=await measure(p);await p.screenshot({path:path.join(out,file+'-scrolled.png')});
    const row={id,engine,native,width,before,after,gesture:engine==='chromium'?'trusted touch swipe':'WebKit uncancelled touch probe + geometry (not trusted swipe)',bounded:before.body.bottom<=before.details.bottom+1,scrollable:before.scrollHeight>before.height+1,moved:after.scrollTop>before.scrollTop,reachedBottom:after.scrollTop+after.height>=after.scrollHeight-1};report.cases.push(row);save();
    console.log(id,engine,native,width,'body',before.height,'scrollHeight',before.scrollHeight,'details',before.details.height,'bounded',row.bounded,'moved',row.moved);
    if(process.env.QA_ASSERT==='1'){assert(row.bounded,'reading region inside card');if(row.scrollable&&engine==='chromium'){assert(row.moved,'gesture scrolls actual rules');assert(row.reachedBottom,'swipes reach complete last rule');}assert(before.ready.bottom<=before.footer.top+1,'Ready above footer');}
    await summary.click();await sleep(350);
   }
  }
  await api({type:'stop'});for(const{p}of phones)await p.locator('#home').waitFor();
 }
 assert.deepEqual(report.errors,[]);report.status='passed';
}catch(e){report.status='failed';report.failure=e.stack;console.error(e);process.exitCode=1;}finally{report.sourceEnd=hashes();report.changedFiles=files.filter(p=>report.sourceStart[p]!==report.sourceEnd[p]);report.finishedAt=new Date().toISOString();save();fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();child.kill();}})();
