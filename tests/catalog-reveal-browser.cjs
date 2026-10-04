'use strict';
const assert=require('node:assert/strict'),express=require('express'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function readable(page){
 return page.locator('article').evaluateAll(cards=>cards.map(card=>{
  const opacity=node=>{let value=1;for(let e=node;e&&e instanceof Element;e=e.parentElement)value*=Number(getComputedStyle(e).opacity);return value;};
  const title=card.querySelector('h3'),button=card.querySelector('button'),rect=button.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2,hit=document.elementFromPoint(x,y),eligible=x>0&&x<innerWidth&&y>0&&y<innerHeight;
  return{id:card.dataset.id,title:title.textContent,cardOpacity:opacity(card),titleOpacity:opacity(title),buttonOpacity:opacity(button),hidden:getComputedStyle(card).display==='none'||getComputedStyle(card).visibility==='hidden',eligible,hit:!eligible||hit===button||button.contains(hit),imageReady:card.querySelector('img').complete&&card.querySelector('img').naturalWidth>0};
 }));
}
async function assertReadable(page,label){const rows=await readable(page);assert.equal(rows.length,34,label+' keeps all cards rendered');assert(rows.every(r=>r.title&&r.cardOpacity===1&&r.titleOpacity===1&&r.buttonOpacity===1&&!r.hidden),label+' keeps card, title and control visible');assert(rows.some(r=>r.eligible),label+' has a viewport control');assert(rows.every(r=>r.hit),label+' keeps every fully visible control hit-testable');return rows;}
(async()=>{
 const app=express();app.get('/fixture',(req,res)=>res.send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/motion.css"><style>body{margin:0;background:#10131a;color:white}main{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px}article{height:220px;background:#30283e;border-radius:20px;padding:12px;box-sizing:border-box}img{width:100%;height:130px;object-fit:contain}h3{margin:8px 0}button{min-height:32px}</style></head><body><main>${Array.from({length:34},(_,i)=>`<article class="${req.query.guest?'guest-game':'lp-catalog-card'}" data-id="${i}"><img class="${req.query.guest?'guest-art':'symbol'}" src="/cover.svg?${i}" loading="lazy"><h3>Game ${i}</h3><button>Play</button></article>`).join('')}</main><script>window.plays=[];document.addEventListener('click',event=>{const button=event.target.closest('article button');if(button)plays.push(button.closest('article').dataset.id);});</script><script src="/motion.js"></script></body></html>`));
 // The initial visibility proof must run while the cover is still unavailable.
 app.get('/cover.svg',(req,res)=>setTimeout(()=>res.type('svg').send('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="44" fill="#b4ff39"/></svg>'),500));app.use(express.static(path.join(__dirname,'../public')));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const browser=await webkit.launch({headless:true});
 try{for(const guest of[false,true])for(const width of[320,393]){
  const page=await browser.newPage({viewport:{width,height:width===320?568:852},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.reveals=[];const animate=Element.prototype.animate;Element.prototype.animate=function(frames,options){if(this.matches('article'))reveals.push({id:this.dataset.id,time:performance.now(),duration:options.duration,changesOpacity:frames.some(frame=>'opacity'in frame)});return animate.call(this,frames,options);};});
  const url=`http://127.0.0.1:${server.address().port}/fixture?${guest?'guest=1':''}`;await page.goto(url,{waitUntil:'domcontentloaded'});
  const initial=await page.locator('main').evaluate(main=>main.scrollHeight),rows=await assertReadable(page,'Before slow cover arrival');assert(rows.some(r=>!r.imageReady),'Initial content is checked before the500ms image response');
  await page.locator('article').first().locator('button').click();assert.deepEqual(await page.evaluate(()=>plays),['0'],'Immediate control works before covers load');
  const entries=await page.evaluate(()=>reveals);assert(entries.every(r=>r.duration<=200&&!r.changesOpacity),'Optional first-entry motion never gates paint');assert.equal(new Set(entries.map(r=>r.id)).size,entries.length,'Each identity settles at most once');
  for(const index of[32,8,33,0]){
   await page.locator('article').nth(index).evaluate(card=>scrollTo({top:scrollY+card.getBoundingClientRect().top-16,behavior:'instant'}));await settle(page);await assertReadable(page,'Immediate far/reverse jump');
  }
  const before=await page.evaluate(()=>reveals.length);await page.evaluate(()=>dispatchEvent(new CustomEvent('party-lobby-enter',{detail:{root:document.querySelector('main')}})));await settle(page);assert.equal(await page.evaluate(()=>reveals.length),before,'Lobby return does not replay entrances');
  // A real renderer may replace cards on filtering/snapshot refresh. Keep their
  // logical identities so remounts cannot create another hidden/reveal interval.
  await page.locator('main').evaluate(main=>{main.innerHTML=main.innerHTML;});await settle(page);await assertReadable(page,'Logical-identity remount');assert.equal(await page.evaluate(()=>reveals.length),before,'Remount does not replay entrances');
  assert.equal(await page.locator('main').evaluate(main=>main.scrollHeight),initial,'Scroll, lobby and remount preserve layout');
  await page.waitForFunction(()=>[...document.querySelectorAll('article img')].every(img=>img.complete&&img.naturalWidth>0));await assertReadable(page,'After decode');assert.equal(await page.locator('main').evaluate(main=>main.scrollHeight),initial,'Image arrival preserves layout');
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url,{waitUntil:'domcontentloaded'});await assertReadable(page,'Reduced motion initial content');assert.equal(await page.evaluate(()=>reveals.length),0,'Reduced motion has no catalog entrances');assert.deepEqual(errors,[]);
  console.log('PASS',guest?'player catalog':'host catalog',width,'immediate cells/controls before slow art, far/reverse hit tests, no lobby/remount replay, stable layout, reduced motion');await page.close();
 }}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
