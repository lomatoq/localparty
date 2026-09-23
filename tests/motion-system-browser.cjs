const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');

const root=path.resolve(__dirname,'..','public');
const mime={'.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 const file=path.join(root,pathname.replace(/^\//,''));
 if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
 res.end(fs.readFileSync(file));
});

const shell=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="stylesheet" href="/motion.css"><script defer src="/motion.js"></script><style>*{box-sizing:border-box}html,body{margin:0;width:100%;min-height:100%;overflow-x:hidden;background:#0b1016;color:white;font-family:system-ui}.app-header{height:76px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:8px 14px}.app-header nav{justify-self:end;display:flex;gap:6px}button{min-width:44px;min-height:44px}.clock-block{position:absolute;left:50%;top:0;transform:translateX(-50%);width:140px;text-align:center}.playbar{margin:12px;padding:16px;border:1px solid #ffffff22}.live-top{display:flex;gap:8px;padding:8px}.score-value{display:inline-block}.modal{padding:30px;border:0;border-radius:20px}</style></head><body class="is-host in-game"><header class="app-header"><div>LOCALPARTY</div><div id="hudTimer" class="clock-block"><small id="hudLabel">РАУНД</small><strong>1</strong></div><nav><button>Топ</button><button>Назад</button></nav></header><section id="play"><div class="playbar"><b>Тестовый матч</b><strong class="score-value">0</strong></div><div id="liveTop" class="live-top"><span>Игрок 1</span><span>Игрок 2</span></div></section><dialog class="modal"><button>Продолжить</button></dialog></body></html>`;

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await webkit.launch({headless:true});
 try{
  for(const width of [320,390,700,1440]){
   const page=await browser.newPage({viewport:{width,height:Math.max(568,Math.round(width*.68))}});
   await page.goto(`http://127.0.0.1:${server.address().port}/motion.css`);
   await page.setContent(shell,{waitUntil:'load'});
   await page.waitForFunction(()=>document.documentElement.classList.contains('lp-motion-ready'));
   const before=await page.evaluate(()=>({
    width:innerWidth,scroll:document.documentElement.scrollWidth,
    header:getComputedStyle(document.querySelector('.app-header')).animationName,
    timer:getComputedStyle(document.querySelector('#hudTimer')).animationName,
    button:getComputedStyle(document.querySelector('button')).transitionDuration,
    timerTransform:getComputedStyle(document.querySelector('#hudTimer')).transform
   }));
   assert.equal(before.scroll,before.width,`horizontal overflow at ${width}px`);
   assert.equal(before.header,'lp-hud-top-in');
   assert.equal(before.timer,'lp-hud-chip-in');
   assert.notEqual(before.button,'0s');
   assert.match(before.timerTransform,/matrix\(1, 0, 0, 1, -70,/,'centered HUD transform changed');
   await page.locator('.score-value').evaluate(el=>{el.textContent='100';});
   await page.waitForFunction(()=>document.querySelector('.score-value').classList.contains('lp-motion-pulse'));
   await page.locator('dialog').evaluate(el=>el.showModal());
   assert.equal(await page.locator('dialog').evaluate(el=>getComputedStyle(el).animationName),'lp-dialog-in');
   await page.close();
  }
  const reduced=await browser.newPage({viewport:{width:390,height:700}});
  await reduced.emulateMedia({reducedMotion:'reduce'});
  await reduced.goto(`http://127.0.0.1:${server.address().port}/motion.css`);
  await reduced.setContent(shell,{waitUntil:'load'});
  await reduced.waitForFunction(()=>document.documentElement.classList.contains('lp-motion-ready'));
  const reducedState=await reduced.evaluate(()=>({
   root:document.documentElement.classList.contains('lp-motion-reduced'),
   header:getComputedStyle(document.querySelector('.app-header')).animationName,
   button:getComputedStyle(document.querySelector('button')).transitionDuration,
   scroll:document.documentElement.scrollWidth,width:innerWidth
  }));
  assert.equal(reducedState.root,true);
  assert.equal(reducedState.header,'none');
  assert.equal(reducedState.button,'0s');
  assert.equal(reducedState.scroll,reducedState.width);
  console.log('PASS motion tokens, HUD/dialog/value transitions, reduced motion, 320/390/700/1440 overflow');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1});
