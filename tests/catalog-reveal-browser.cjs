'use strict';
const assert=require('node:assert/strict'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
(async()=>{
 const app=express();app.get('/fixture',(req,res)=>res.send(`<!doctype html><html><head><link rel="stylesheet" href="/motion.css"><style>body{margin:0;background:#10131a;color:white}main{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px}article{height:220px;background:#30283e;border-radius:20px;padding:12px;box-sizing:border-box}img{width:100%;height:130px;object-fit:contain}</style></head><body><main>${Array.from({length:34},(_,i)=>`<article class="${req.query.guest?'guest-game':'lp-catalog-card'}" data-id="${i}"><img class="${req.query.guest?'guest-art':'symbol'}" src="/cover.svg?${i}" loading="lazy"><h3>Game ${i}</h3><button>Play</button></article>`).join('')}</main><script src="/motion.js"></script></body></html>`));
 app.get('/cover.svg',(req,res)=>setTimeout(()=>res.type('svg').send('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="44" fill="#b4ff39"/></svg>'),500));app.use(express.static('public'));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const browser=await webkit.launch({headless:true});
 try{for(const guest of [false,true]){
  const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.reveals=[];const animate=Element.prototype.animate;Element.prototype.animate=function(frames,options){if(this.matches('article'))reveals.push({id:this.dataset.id,time:performance.now(),duration:options.duration});return animate.call(this,frames,options);};});
  await page.goto(`http://127.0.0.1:${server.address().port}/fixture?${guest?'guest=1':''}`,{waitUntil:'domcontentloaded'});
  const initial=await page.locator('main').evaluate(el=>el.scrollHeight);
  for(const y of [400,1100,2200,3500,4800,6000]){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(65);}
  await page.waitForTimeout(2500);
  await page.waitForFunction(()=>[...document.querySelectorAll('article')].filter(c=>{const r=c.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;}).every(c=>getComputedStyle(c).opacity==='1'));
  await page.waitForFunction(()=>[...document.querySelectorAll('article')].filter(c=>{const r=c.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;}).every(c=>{const img=c.querySelector('img');return img.complete&&img.naturalWidth>0&&getComputedStyle(img).opacity==='1';}));
  assert.equal(await page.locator('main').evaluate(el=>el.scrollHeight),initial,'Revealing must not move layout');
  let rows=await page.evaluate(()=>reveals);assert(rows.length>=3);for(let i=1;i<rows.length;i++)assert(rows[i].time-rows[i-1].time>=100,'Batch changes must not reset the pacing');
  assert.equal(new Set(rows.map(r=>r.id)).size,rows.length,'Each card reveals only once');
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(2600);await page.waitForFunction(()=>getComputedStyle(document.querySelector('article')).opacity==='1');
  const beforeReplay=await page.evaluate(()=>{const count=reveals.length;dispatchEvent(new CustomEvent('party-lobby-enter',{detail:{root:document.querySelector('main')}}));return count;});
  await page.waitForFunction(count=>reveals.length>count,beforeReplay);
  await page.waitForTimeout(2200);
  assert.equal(await page.locator('main').evaluate(el=>el.scrollHeight),initial,'Lobby replay must not shift layout');
  rows=await page.evaluate(count=>reveals.slice(count),beforeReplay);
  assert(rows.some(r=>r.id==='0'),'First card animates again on returning to lobby');
  for(let i=1;i<rows.length;i++)assert(rows[i].time-rows[i-1].time>=100,'Replay preserves pacing: '+JSON.stringify(rows));
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!document.querySelector('.lp-reveal-pending'));assert.deepEqual(errors,[]);
  console.log('PASS',guest?'player catalog':'host catalog','fast scroll, global pacing, one-time reveal, stable layout, reduced motion');await page.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
