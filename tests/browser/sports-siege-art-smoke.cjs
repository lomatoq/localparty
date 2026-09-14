let chromium;
try {
  ({chromium} = require('playwright'));
} catch {
  ({chromium} = require('C:/Users/nirrt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
const {spawn} = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'test-results', 'sports-siege-art');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const freePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();server.unref();server.on('error', reject);
  server.listen(0, '127.0.0.1', () => {const port=server.address().port;server.close(()=>resolve(port));});
});

async function main(){
  fs.mkdirSync(OUT,{recursive:true});const port=await freePort(),base=`http://127.0.0.1:${port}`;
  const launcher=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,PARTY_PORT:String(port),PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1'},stdio:'ignore'});let browser;
  try{
    for(let i=0;i<120;i++){try{if((await fetch(`${base}/api/health`)).ok)break;}catch{}await sleep(100);}
    browser=await chromium.launch({headless:true,executablePath:process.env.PARTY_TEST_BROWSER||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const errors=[],assets=new Set(),host=await browser.newPage({viewport:{width:1440,height:1000}});host.on('pageerror',error=>errors.push(String(error)));host.on('response',response=>{const pathname=new URL(response.url()).pathname;if(pathname.includes('/assets/gameplay/sports-siege/')||pathname.includes('/assets/environment/'))assets.add(pathname);});await host.goto(`${base}/host`);
    const installAssets=await host.evaluate(async()=>{const manifest=await fetch('/site.webmanifest').then(response=>response.json()),responses=await Promise.all(manifest.icons.map(icon=>fetch(icon.src)));return{manifestLinks:document.querySelectorAll('link[rel="manifest"]').length,appleLinks:document.querySelectorAll('link[rel="apple-touch-icon"]').length,sizes:manifest.icons.map(icon=>icon.sizes),ok:responses.every(response=>response.ok)&&(await fetch('/favicon.ico')).ok};});
    if(!installAssets.ok||installAssets.manifestLinks!==1||installAssets.appleLinks!==1||!installAssets.sizes.includes('192x192')||!installAssets.sizes.includes('512x512'))throw new Error(`Incomplete install icons: ${JSON.stringify(installAssets)}`);
    const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});phone.on('pageerror',error=>errors.push(String(error)));await phone.goto(base);await phone.locator('#name').fill('Asset QA');await phone.locator('#joinForm button[type="submit"]').click();await phone.locator('#home').waitFor();
    // Curling needs two connected players to start, but its Stage and static
    // environment load as soon as the host/controller frames attach. That is
    // enough to prove the locally vendored hall is requested without weakening
    // the real two-player start guard.
    const curlingPhone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});curlingPhone.on('pageerror',error=>errors.push(String(error)));await curlingPhone.goto(base);await curlingPhone.locator('#name').fill('Hall QA');await curlingPhone.locator('#joinForm button[type="submit"]').click();await curlingPhone.locator('#home').waitFor();
    await host.locator('.game[data-id="curling"] .start-game').click();await host.frameLocator('#gameFrame').locator('#ss-scene canvas').waitFor();await sleep(1200);
    await host.evaluate(async()=>{const ws=new WebSocket(`ws://${location.host}/lobby`);await new Promise(resolve=>ws.onopen=resolve);ws.send(JSON.stringify({type:'host',key:window.PARTY_HOST_KEY}));await new Promise(resolve=>ws.onmessage=event=>{if(JSON.parse(event.data).type==='host-ok')resolve();});ws.send(JSON.stringify({type:'stop'}));setTimeout(()=>ws.close(),50);});await host.locator('#lobby').waitFor();await phone.locator('#lobby').waitFor();await curlingPhone.locator('#lobby').waitFor();await curlingPhone.close();
    for(const mode of ['swarm_gate','peek_shoot']){
      await host.locator(`.game[data-id="${mode}"] .start-game`).click();await phone.locator(`#gameFrame[src*="/games/${mode}/"]`).waitFor({state:'attached'});await phone.frameLocator('#gameFrame').locator('#ss-name').waitFor();await phone.locator('#readyButton').click();
      const frame=host.frameLocator('#gameFrame');await frame.locator('#ss-overlay').waitFor({state:'hidden',timeout:20000});await sleep(mode==='swarm_gate'?4200:1800);await frame.locator('#ss-scene canvas').waitFor();if(await frame.locator('#ss-error').isVisible())throw new Error(await frame.locator('#ss-error').innerText());
      const fire=phone.frameLocator('#gameFrame').locator('#ss-fire'),box=await fire.boundingBox();await phone.mouse.move(box.x+box.width/2,box.y+box.height/2);await phone.mouse.down();await sleep(420);await host.screenshot({path:path.join(OUT,`${mode}.png`)});await phone.mouse.up();
      await host.evaluate(async()=>{const ws=new WebSocket(`ws://${location.host}/lobby`);await new Promise(resolve=>ws.onopen=resolve);ws.send(JSON.stringify({type:'host',key:window.PARTY_HOST_KEY}));await new Promise(resolve=>ws.onmessage=event=>{if(JSON.parse(event.data).type==='host-ok')resolve();});ws.send(JSON.stringify({type:'stop'}));setTimeout(()=>ws.close(),50);});await host.locator('#lobby').waitFor();await phone.locator('#lobby').waitFor();
    }
    const required=['/swarm-ground-tile.webp','/sprites/swarm-termite.webp','/sprites/turret-base.webp','/sprites/turret-head-long.webp','/sprites/wall-straight.webp','/sprites/cover-wood.webp','/assets/environment/curling/roofed-hall.glb'];
    for(const suffix of required)if(![...assets].some(value=>value.endsWith(suffix)))throw new Error(`Asset was not requested: ${suffix}`);
    if(![...assets].some(value=>/\/sprites\/turret-(shell|bolt)\.webp$/.test(value)))throw new Error('No turret projectile asset was requested');
    if(errors.length)throw new Error(errors.join('; '));fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({pageErrors:errors,assets:[...assets].sort()},null,2));console.log(`SPORTS_SIEGE_ART_REPORT ${JSON.stringify({pageErrors:errors,assetCount:assets.size})}`);
  }finally{await browser?.close();launcher.kill();}
}

main().catch(error=>{console.error(error);process.exitCode=1;});
