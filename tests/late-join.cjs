const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/nirrt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const host=await browser.newPage();await host.goto('http://localhost:3210/host');
 async function player(name){const c=await browser.newContext();const p=await c.newPage();await p.goto('http://localhost:3210/');await p.locator('#name').fill(name);await p.locator('#joinForm button').click();await p.locator('#home').waitFor({state:'visible'});return p;}
 const a=await player('Первый'),b=await player('Второй');await host.locator('[data-id=push]').click();await a.locator('#play').waitFor({state:'visible'});await b.locator('#play').waitFor({state:'visible'});
 const late=await player('Опоздавший');await late.waitForFunction(()=>document.querySelector('#subtitle').textContent.includes('Сейчас играют'));if(await late.locator('#play').isVisible())throw Error('Late player incorrectly entered fixed roster');
 await a.reload();await a.locator('#play').waitFor({state:'visible'});await a.frames()[1].locator('#controllerScreen').waitFor({state:'visible'});
 await host.locator('#roomToggle').click();await host.locator('#back').click();await host.locator('[value=yes]').click();await late.locator('#home').waitFor({state:'visible'});await host.locator('[data-id=push]').click();await late.locator('#play').waitFor({state:'visible'});await late.frames()[1].locator('#controllerScreen').waitFor({state:'visible'});
 await host.locator('#roomToggle').click();await host.locator('#back').click();await host.locator('[value=yes]').click();console.log('LATE JOIN WAIT, ACTIVE RECONNECT, NEXT GAME ADMISSION PASS');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
