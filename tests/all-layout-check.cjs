const {spawn}=require('child_process'),fs=require('fs'),assert=require('assert/strict');
const {chromium}=require('C:/Users/nirrt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1'},windowsHide:true});let browser;const report={games:[],errors:[]};let log='';child.stderr.on('data',d=>log+=d);try{const port=await new Promise((r,j)=>{child.stdout.on('data',d=>{log+=d;const m=String(d).match(/localhost:(\d+)/);if(m)r(m[1])});setTimeout(()=>j(Error(log)),15000).unref()});const base='http://localhost:'+port;browser=await chromium.launch({channel:'msedge',headless:true});const host=await browser.newPage({viewport:{width:1920,height:1080}});host.on('pageerror',e=>report.errors.push('host:'+e.message));await host.goto(base+'/host');await host.locator('#testModeBox').waitFor({state:'visible'});await host.evaluate(()=>{window.qa=new WebSocket('ws://'+location.host+'/lobby');qa.onopen=()=>qa.send(JSON.stringify({type:'host',key:PARTY_HOST_KEY}));qa.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='state')window.qaState=m;if(m.type==='game-ui'&&window.qaState?.active)window.qaState.active.ui=m.ui;};});const context=await browser.newContext({viewport:{width:402,height:874},isMobile:true,hasTouch:true});const phone=await context.newPage();phone.on('pageerror',e=>report.errors.push('phone:'+e.message));await phone.goto(base);await phone.locator('#name').fill('Один телефон');await phone.locator('#joinForm button').click();await host.locator('#botPlus').click();await host.waitForFunction(()=>qaState?.players.length===2);const ids=process.env.UX_GAMES?.split(',')||['push','tankarena','jenga','warsaw','crane'];

await host.setViewportSize({width:3430,height:1300});
for(const id of ['push','shrink','knives','bomb','western','tanks','tankarena','chaos','kart','monster','spy','millionaire','sinyakquiz','warsaw','crocodile','jenga','crane','naval','drawguess','western_duel']){
 await host.evaluate(id=>qa.send(JSON.stringify({type:'launch',id})),id);
 await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);
 await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);
 await host.waitForTimeout(250);
 const frame=host.frames().find(f=>f.url().includes('/games/'+id+'/'));
 const data=await frame.evaluate(()=>({rules:document.querySelector('.lp-lobby-rules')?.textContent,card:document.querySelector('.lp-start-card')?.outerHTML.slice(0,180),starts:[...document.querySelectorAll('button')].filter(b=>/начать|старт/i.test(b.textContent)).map(b=>({id:b.id,parent:b.parentElement.outerHTML.slice(0,150)}))}));
 assert(data.rules&&data.rules.length>60,id+' has game-specific rules');
 assert.equal(await frame.locator('.lp-lobby-rules:visible').count(),1,id+' rules visible');
 await frame.locator('.lp-lobby-rules summary').click();assert(await frame.locator('.lp-lobby-rules').evaluate(el=>el.open),id+' rules open');
 await frame.locator('.lp-lobby-rules summary').click();
 
 for(const size of [{width:1920,height:1080},{width:3430,height:1300}]){
  await host.setViewportSize(size);await host.waitForTimeout(150);
  const layout=await frame.evaluate(()=>{const r=document.querySelector('.lp-lobby-rules').getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:innerHeight,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1};});
  assert(!layout.overflow,id+' host horizontal overflow '+JSON.stringify(layout));
  assert(layout.top>=120,id+' rules overlap title '+JSON.stringify(layout));
  assert(layout.bottom<=layout.height,id+' rules outside frame '+JSON.stringify(layout));
  if(size.width===1920)await host.screenshot({path:'tests/layout-host-'+id+'.png'});
 }
 for(const height of [760,874]){
  await phone.setViewportSize({width:402,height});await phone.waitForTimeout(100);
  const details=phone.locator('.waiting-details');
  const closed=await details.boundingBox();const ready=await phone.locator('#readyButton').boundingBox();
  assert(closed.y+closed.height<=ready.y,id+' mobile closed rules overlap ready');
  await details.locator('summary').click();const open=await details.boundingBox();
  const nextReady=await phone.locator('#readyButton').boundingBox();
  assert(Math.abs(open.width-nextReady.width)<3,id+' mobile expanded rules width');
  assert(open.y+open.height<=nextReady.y+1,id+' mobile open rules overlap ready');
  assert(nextReady.y+nextReady.height<height-60,id+' mobile ready clipped');
  await details.locator('summary').click();
  if(height===760)await phone.screenshot({path:'tests/layout-phone-'+id+'.png'});
 }
 console.log('PASS',id,'two desktop sizes and two mobile heights; rules open and close without overlap');
 if(['push','monster','tankarena','millionaire'].includes(id))await host.screenshot({path:'tests/structure-'+id+'.png'});
 await host.evaluate(()=>qa.send(JSON.stringify({type:'stop'})));await host.waitForFunction(()=>!qaState.active);
}
assert.deepEqual(report.errors,[]);await host.waitForFunction(()=>qaState.totalMatches===0);console.log('PASS no test statistics');}finally{fs.writeFileSync('tests/session-ux-browser.json',JSON.stringify({...report,log:log.slice(-2000)},null,2));await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
