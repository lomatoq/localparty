'use strict';
let chromium;
try {
  ({chromium}=require('playwright'));
} catch {
  ({chromium}=require('C:/Users/nirrt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
const {spawn}=require('node:child_process');
const net=require('node:net');
const path=require('node:path');

const ROOT=path.resolve(__dirname,'..','..');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const freePort=()=>new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>resolve(port));});});
async function waitForHealth(base){for(let i=0;i<150;i++){try{if((await fetch(base+'/api/health')).ok)return;}catch{}await sleep(100);}throw Error('Launcher did not become healthy');}

(async()=>{
  const port=await freePort(),base=`http://127.0.0.1:${port}`;
  const launcher=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,PARTY_PORT:String(port),PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1'},stdio:'ignore'});
  let browser;
  try{
    await waitForHealth(base);
    browser=await chromium.launch({headless:true,executablePath:process.env.PARTY_TEST_BROWSER||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const host=await browser.newPage({viewport:{width:1440,height:900}});
    await host.goto(base+'/host');
    await host.locator('#connection.online').waitFor();
    const phone=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    await phone.goto(base+'/');
    await phone.locator('#name').fill('Очередь запуска');
    await phone.locator('#joinForm button[type="submit"]').click();
    await phone.locator('#home').waitFor();
    await phone.route('**/*',async route=>{const url=new URL(route.request().url());if(url.pathname==='/games/swarm_gate/'&&route.request().resourceType()==='document')await sleep(10000);await route.continue();});
    const launch=host.locator('.game[data-id="swarm_gate"] .start-game');
    await launch.waitFor();await launch.click();
    await host.locator('#gameFrame[src*="/games/swarm_gate/"]').waitFor({state:'attached'});
    const game=host.frameLocator('#gameFrame');
    const start=game.locator('#start');
    await start.waitFor();
    if(!await start.isEnabled())throw Error('Start must accept the first click while controllers connect');
    await start.click();
    await game.locator('#start[data-pending="true"]').waitFor();
    const lobby=game.locator('#ss-lobby');
    if(!await lobby.isVisible())throw Error('The game waiting screen has no visible route back to the lobby');

    await game.locator('#ss-overlay').waitFor({state:'hidden',timeout:25000});
    const phase=await game.locator('html').getAttribute('data-party-phase');
    if(phase!=='playing')throw Error(`Queued start did not reach playing phase: ${phase}`);
    console.log('PASS Sports Siege queues the first start click and exposes lobby exit');
  }finally{
    await browser?.close();
    launcher.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
