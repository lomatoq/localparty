'use strict';
// Actual production pages; native transport/tabs/model are explicitly fixtures.
// This proves scrollbar policy + scroll reachability, not phone gesture/cast speed.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const pw=require(process.env.PARTY_PLAYWRIGHT||'playwright'),root=path.resolve(__dirname,'..'),out=path.join(root,'output/playwright/scrollbar248');
const catalog=require('../lib/catalog').map(g=>({...g,hostControls:require('../lib/host-controls').schema(g)}));
fs.mkdirSync(out,{recursive:true});
const css=fs.readFileSync(path.join(root,'public/game-ui-system.css'));
const report={method:'Actual native gameDetail and real /play rulesDialog at 320×568/393×852, Chrome/WebKit; native tabs/bridge/model are fixtures. Real /tv 16-player server roster. Wheel/programmatic scroll reachability and computed/pixel scrollbar policy; no physical keyboard/touch/cast acceptance.',cssSha256:crypto.createHash('sha256').update(css).digest('hex'),cases:[],errors:[],captures:[]};
if(process.env.QA_TV_ONLY==='1'){const previous=JSON.parse(fs.readFileSync(path.join(out,'report.json')));assert.equal(previous.cssSha256,report.cssSha256,'TV recapture retains identical production CSS');report.cases=previous.cases.filter(c=>!c.id.includes('-tv-'));report.captures=previous.captures.filter(c=>!c.includes('-tv-'));report.errors=previous.errors;}
const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'scrollbar248',PARTY_PORT:'0',PARTY_INTERNAL_PORT:'0'}});
let log='',browser,base;child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function api(body){const res=await fetch(base+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer scrollbar248','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(res.status,200);return res.json();}
async function inspect(page,selector,footer,last){
 const before=await page.locator(selector).evaluate(el=>{const s=getComputedStyle(el),bar=getComputedStyle(el,'::-webkit-scrollbar');return{scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,max:el.scrollHeight-el.clientHeight,overflow:s.overflowY,width:s.scrollbarWidth,gutter:s.scrollbarGutter,pseudo:{display:bar.display,width:bar.width,height:bar.height}};});
 assert.equal(before.width,'none');assert.equal(before.gutter,'auto');assert.equal(before.pseudo.display,'none');assert.equal(before.pseudo.width,'0px');
 const rect=await page.locator(selector).boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);let method='trusted wheel';
 try{await page.mouse.wheel(0,10000);await page.waitForTimeout(220);}catch(e){if(!e.message.includes('not supported in mobile WebKit'))throw e;await page.locator(selector).evaluate(el=>el.scrollTop=el.scrollHeight);await page.waitForTimeout(80);method='programmatic scroll (mobile WebKit wheel unsupported)';}
 if(await page.locator(selector).evaluate(el=>el.scrollTop<el.scrollHeight-el.clientHeight-2)){await page.locator(selector).evaluate(el=>el.scrollTop=el.scrollHeight);await page.waitForTimeout(80);method='programmatic fallback (wheel did not reach end)';}
 const after=await page.locator(selector).evaluate(el=>({top:el.scrollTop,max:el.scrollHeight-el.clientHeight}));assert(Math.abs(after.max-after.top)<2,'Scroll reaches actual end');
 const end=await page.locator(last).last().evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,hidden:!!el.closest('[hidden]')};});assert(!end.hidden&&end.height>0&&end.y<page.viewportSize().height&&end.y+end.height>0,'Last real content is reachable');
 const actions=footer?await page.locator(footer).evaluate(el=>[...el.querySelectorAll('button')].filter(n=>!n.hidden&&getComputedStyle(n).display!=='none').map(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{id:n.id||n.dataset.close,rect:{x:r.x,y:r.y,width:r.width,height:r.height},hit:hit===n||n.contains(hit),disabled:n.disabled};})):[];
 assert(actions.every(a=>a.rect.y>=0&&a.rect.y+a.rect.height<=page.viewportSize().height+1&&a.hit),'Footer actions accessible at content end');
 const policy=await page.locator(selector).evaluate(el=>[el,...el.querySelectorAll('*')].filter(n=>{const s=getComputedStyle(n);return /(auto|scroll)/.test(s.overflow+s.overflowX+s.overflowY);}).map(n=>({id:n.id||n.className,width:getComputedStyle(n).scrollbarWidth,pseudo:getComputedStyle(n,'::-webkit-scrollbar').width})));
 assert(policy.every(n=>n.width==='none'&&n.pseudo==='0px'),'Every real scroll descendant follows policy');
 return{before,after,method,last:end,footer:actions,scrollDescendants:policy};
}
async function capture(page,name){const file=name+'.png';await page.screenshot({path:path.join(out,file)});report.captures.push(file);}
(async()=>{try{
 for(let i=0;i<160&&!/localhost:(\d+)/.test(log);i++)await sleep(50);assert(/localhost:(\d+)/.test(log),log);base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];await api({type:'server-start'});
 for(const engine of (process.env.QA_ENGINES||'chromium,webkit').split(',')){
  browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
  for(const viewport of (process.env.QA_TV_ONLY==='1'?[]:[{width:320,height:568},{width:393,height:852}]))for(const mode of ['native','web']){
   const ctx=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1});
   if(mode==='native'){
    // The app loads these exact files through its Swift route, outside server.js's public allowlist.
    await ctx.route('**/native-shell/**',route=>{const file=path.join(root,'public',new URL(route.request().url()).pathname);return fs.existsSync(file)?route.fulfill({path:file}):route.continue();});
    await ctx.addInitScript({content:"window.__partyPersistentTabs=true;window.__scrollCommands=[];window.webkit={messageHandlers:{partyShell:{postMessage:m=>__scrollCommands.push(m)}}};"+fs.readFileSync(path.join(root,'public/native-shell/visibility.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'public/native-shell/tabs.js'),'utf8')});
   }
   const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push({engine,mode,width:viewport.width,error:e.message}));
   await page.goto(base+(mode==='native'?'/native-shell/index.html':'/play'));await page.evaluate(()=>document.fonts.ready);
   let selector,footer,last;
   if(mode==='native'){
    await page.waitForFunction(()=>window.LocalPartyHost);await page.evaluate(model=>LocalPartyHost.update(model),{catalog,players:[{id:'qa',name:'Scrollbar QA',connected:true}],leaderboard:[],votes:[],selected:'pocket_siege',screens:1,native:{ready:true,catalogReady:true},tv:{canCover:true,mode:'none',focusNumber:1,total:36}});
    await page.locator('#choiceOpen').tap();await page.locator('#gameDetail').waitFor();await page.waitForTimeout(700);
    for(const summary of await page.locator('#gameDetail details summary').all()){await summary.tap();await page.waitForTimeout(480);}
    assert.equal(await page.locator('#gameSettings select').count(),4,'Real Pocket Siege settings rendered');
    selector='#gameDetailBody';footer='#gameDetail .native-actions';last='#launchHint';
   }else{
    await page.locator('#name').fill('Scrollbar QA');await page.locator('#joinForm button[type=submit]').tap();await page.locator('#home').waitFor();
    await page.locator('[data-id="curling"] .guest-info').tap();await page.locator('#rulesDialog').waitFor();await page.waitForTimeout(700);
    for(const row of await page.locator('#rulesBody .rule-row').all()){await row.tap();await page.waitForTimeout(100);}
    selector='#rulesBody';footer='#rulesDialog .hp-popup-actions';last='#rulesBody .rule-row:last-child';
   }
   const id=engine+'-'+mode+'-'+viewport.width;await capture(page,id+'-expanded');const proof=await inspect(page,selector,footer,last);await capture(page,id+'-bottom');report.cases.push({id,...proof});await ctx.close();
  }
  const tv=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});tv.on('pageerror',e=>report.errors.push({engine,mode:'tv',error:e.message}));await tv.goto(base+'/tv');
  const phone=await browser.newPage({viewport:{width:393,height:852}});await phone.goto(base+'/play');await phone.locator('#name').fill('TV Scrollbar QA');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();await api({type:'bots-set',count:15});await tv.waitForFunction(()=>document.querySelector('#count').textContent.includes('16'));await tv.evaluate(()=>document.fonts.ready);await tv.waitForTimeout(900);
  await tv.waitForFunction(()=>document.querySelector('#tvStartup').hidden&&document.querySelector('#tvStage').classList.contains('tv-show-ready'));await tv.waitForTimeout(750);
  const id=engine+'-tv-16p';await capture(tv,id+'-top');const proof=await inspect(tv,'#tvBrowse',null,'#tvCatalog .game:last-child');assert(proof.before.max>0,'TV real catalogue overflows');await capture(tv,id+'-bottom');report.cases.push({id,...proof});await tv.close();await api({type:'bots-set',count:0});await phone.close();await browser.close();browser=null;
 }
 assert.deepEqual(report.errors,[]);report.ok=true;
}catch(e){report.failure=e.stack;throw e;}finally{await browser?.close();child.kill();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:report.ok,cases:report.cases.length,captures:report.captures.length,failure:report.failure}));}
})().catch(e=>{console.error(e);process.exitCode=1});
