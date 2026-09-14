'use strict';
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const net=require('node:net');
const path=require('node:path');

const ROOT=path.resolve(__dirname,'..','..');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>resolve(port));});});}
async function waitForHealth(base){for(let i=0;i<120;i++){try{if((await fetch(base+'/api/health')).ok)return;}catch{}await sleep(100);}throw Error('launcher did not become healthy');}

(async()=>{
 const port=await freePort(),base=`http://127.0.0.1:${port}`;
 const launcher=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,PARTY_PORT:String(port),PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1'},stdio:'ignore'});
 let browser;
 try{
  await waitForHealth(base);
  browser=await chromium.launch({headless:true,executablePath:process.env.PARTY_TEST_BROWSER||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
  const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto(base+'/host');await page.locator('#home').waitFor();
  for(const width of [320,390,700,900,1440,2560]){
   await page.setViewportSize({width,height:width<=430?800:900});await sleep(280);
   const result=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector)?.getBoundingClientRect();return r&&{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const visible=selector=>{const node=document.querySelector(selector);return !!node&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden';};
    return{mode:document.querySelector('#qrDock').dataset.mode,qr:rect('#qrDock'),image:rect('#dockQr'),join:rect('#joinOpen'),header:rect('.app-header'),company:visible('#home .company')?rect('#home .company'):null,leftRail:visible('#home>.evening-console')?rect('#home>.evening-console'):null,span:visible('#qrDock>span'),small:visible('#qrDock>small'),overflow:document.documentElement.scrollWidth>innerWidth,update:rect('#lp-updates'),updateText:visible('#lp-updates>span')};
   });
   if(result.overflow||!result.qr||!result.image)throw Error(`${width}px QR missing or overflowed: ${JSON.stringify(result)}`);
   const intersects=(a,b,gap=0)=>a&&b&&a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
   if(result.mode==='header'){
    const qrCenter=(result.qr.left+result.qr.right)/2,buttonCenter=(result.join.left+result.join.right)/2;
    if(result.span||result.small||Math.abs(qrCenter-buttonCenter)>3||Math.abs(result.qr.top-result.header.bottom-8)>3||result.image.width<48)throw Error(`${width}px compact QR is misaligned: ${JSON.stringify(result)}`);
   }else if(intersects(result.qr,result.company,8)||intersects(result.qr,result.leftRail,8))throw Error(`${width}px corner QR overlaps a rail: ${JSON.stringify(result)}`);
   if(width<=430&&result.mode!=='header')throw Error(`${width}px must use compact header QR`);
   if(width===1440&&(!result.updateText||result.update.width<150))throw Error(`wide update action is still collapsed: ${JSON.stringify(result.update)}`);
   if(width===900&&(result.updateText||result.update.width>80))throw Error(`narrow update action did not collapse: ${JSON.stringify(result.update)}`);
  }
  console.log('QR dock and update action responsive checks passed');
 }finally{await browser?.close();launcher.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
