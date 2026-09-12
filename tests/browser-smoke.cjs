const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/nirrt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const errors=[];const capture=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))errors.push(`${r.status()} ${r.url()}`);});};
 const host=await browser.newPage({viewport:{width:1440,height:1100}});capture(host);await host.goto('http://localhost:3210/host');
 const phones=[];for(const name of ['Аня','Борис','Саша']){const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();capture(page);await page.goto('http://192.168.0.91:3210/');await page.locator('#name').fill(name);await page.locator('#joinForm button[type=submit]').click();await page.locator('#home').waitFor({state:'visible'});phones.push(page);}
 await host.waitForFunction(()=>document.querySelectorAll('#players .player').length===3);
 await host.screenshot({path:'tests/lobby-desktop.png',fullPage:true});await phones[0].screenshot({path:'tests/lobby-phone.png',fullPage:true});
 const games=require('../catalog.json');
 for(const g of games){
  const before=errors.length;
  await host.locator(`.game[data-id="${g.id}"]`).click();
  await host.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),g.id,{timeout:22000});
  for(const p of phones)await p.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),g.id,{timeout:22000});
  await new Promise(r=>setTimeout(r,1800));
  const frame=phones[0].frames()[1], hf=host.frames()[1];
  const start={push:'[data-mode="push"]',knives:'[data-mode="knives"]',bomb:'[data-mode="bomb"]',western:'[data-mode="western"]',tanks:'[data-mode="survival"]',chaos:'#start',kart:'#startBtn',monster:'#startGame',spy:'#startBtn',millionaire:'#start'}[g.id];
  await hf.locator(start).click();
  await new Promise(r=>setTimeout(r,1200));
  const phoneText=await frame.locator('body').innerText();
  const hostText=await hf.locator('body').innerText();
  const result={game:g.id,profile:await frame.evaluate(()=>window.PARTY_PROFILE),phone:phoneText.slice(0,600),host:hostText.slice(0,800),errors:errors.slice(before)};
  if(g.engine==='party'){await frame.locator('#modeLabel').waitFor({state:'visible'});if(await hf.locator('.mode-card:visible').count()>0)throw Error('Selected game did not start');}
  if(g.id==='tanks')await hf.locator('#lobbyOverlay').waitFor({state:'hidden'});
  if(g.id==='chaos')await hf.locator('#game').waitFor({state:'visible'});
  if(g.id==='kart')await frame.locator('#driveScreen').waitFor({state:'visible'});
  if(g.id==='monster')await hf.waitForFunction(()=>state?.phase==='playing');
  if(g.id==='spy')await frame.locator('#revealView').waitFor({state:'visible'});
  if(g.id==='millionaire')await hf.locator('#game').waitFor({state:'visible'});
  console.log(JSON.stringify(result));
  await host.screenshot({path:`tests/${g.id}-host.png`});await phones[0].screenshot({path:`tests/${g.id}-phone.png`});
  await host.locator('#roomToggle').click();await host.locator('#back').click();await host.locator('#confirmStop button[value=yes]').click();await host.locator('#home').waitFor({state:'visible'});
 }
 await phones[0].reload();await host.waitForFunction(()=>document.querySelectorAll('#players .player').length===3);console.log('RECONNECT COUNT PASS');
 await phones[1].close();await host.waitForFunction(()=>document.querySelectorAll('#players .player').length===2);console.log('DISCONNECT COUNT PASS');
 fs.writeFileSync('tests/browser-errors.json',JSON.stringify(errors,null,2));await browser.close();if(errors.length)throw Error(errors.join('\n'));console.log('ALL TEN GAME STARTS PASS');
})().catch(e=>{console.error(e);process.exit(1);});
