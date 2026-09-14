const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('C:/Users/nirrt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root=path.resolve(__dirname,'..','public');
const mime={'.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 const file=path.join(root,pathname.replace(/^\//,''));
 if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
 res.end(fs.readFileSync(file));
});

const shell=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/glass.css"><link rel="stylesheet" href="/ux.css"><style>#gameFrame{position:absolute;inset:0;background:#172132}.identity-copy{color:white}.identity-copy b,.identity-copy small{display:block}</style></head><body class="is-host in-game" data-phase="results" style="--game-title-accent:#ffcf3f"><header class="app-header"><div class="identity"><div class="identity-copy"><b>МАТЧ ОКОНЧЕН</b><small>ОБЩИЙ ЭКРАН</small></div><img class="brand-mark" src="/assets/branding/localparty-mark.png" width="171" height="107" alt=""></div><div id="hudTimer"></div><nav></nav></header><section id="play"><div id="gameFrame"></div><div id="resultCelebration" class="result-celebration" aria-hidden="true"><i class="result-celebration__glow"></i><i class="result-celebration__rays"></i></div></section></body></html>`;

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  for(const width of [320,390,700,1440]){
   const page=await browser.newPage({viewport:{width,height:Math.max(568,Math.round(width*.64))}});
   await page.goto(`http://127.0.0.1:${server.address().port}/ux.css`);
   await page.setContent(shell);
   await page.waitForFunction(()=>getComputedStyle(document.querySelector('.result-celebration')).display==='block');
   const metrics=await page.evaluate(()=>{
    const h=document.querySelector('.app-header').getBoundingClientRect();
    const mark=document.querySelector('.brand-mark').getBoundingClientRect();
    const identity=document.querySelector('.identity').getBoundingClientRect();
    const rays=getComputedStyle(document.querySelector('.result-celebration__rays'));
    return {scrollWidth:document.documentElement.scrollWidth,innerWidth,mark:{top:mark.top,bottom:mark.bottom,width:mark.width,height:mark.height},header:{top:h.top,bottom:h.bottom},identity:{left:identity.left,right:identity.right},display:getComputedStyle(document.querySelector('.result-celebration')).display,pointer:getComputedStyle(document.querySelector('.result-celebration')).pointerEvents,animation:rays.animationName};
   });
   assert.equal(metrics.display,'block');
   assert.equal(metrics.pointer,'none');
   assert.equal(metrics.scrollWidth,metrics.innerWidth,`horizontal overflow at ${width}px`);
   assert(metrics.mark.width>=52,`brand mark too small at ${width}px`);
   assert(metrics.mark.bottom>=metrics.header.bottom-8&&metrics.mark.bottom<=metrics.header.bottom+14,`brand mark is not clipped by the header edge at ${width}px`);
   assert(metrics.identity.left>=-1&&metrics.identity.right<=width+1,`identity leaves the viewport at ${width}px`);
   await page.close();
  }
  const reduced=await browser.newPage({viewport:{width:390,height:700}});
  await reduced.emulateMedia({reducedMotion:'reduce'});
  await reduced.goto(`http://127.0.0.1:${server.address().port}/ux.css`);
  await reduced.setContent(shell);
  assert.equal(await reduced.locator('.result-celebration__rays').evaluate(el=>getComputedStyle(el).animationName),'none');
  console.log('PASS shared host result celebration, reduced motion, header clipping, 320/390/700/1440 overflow');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1});
