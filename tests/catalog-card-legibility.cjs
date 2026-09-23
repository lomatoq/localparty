'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit,devices}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve('.localparty-build/catalog-card-qa');fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_PORT:'0',PARTY_EMBEDDED:'0',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'card-qa'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await wait(50);
 assert.match(log,/localhost:(\d+)/);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const state=await(await fetch(origin+'/api/manage',{method:'POST',headers:{Authorization:'Bearer card-qa','Content-Type':'application/json'},body:JSON.stringify({type:'select',id:'pocket_siege'})})).json();
 browser=await webkit.launch({headless:true});const results=[];
 for(const [surface,width,height]of [['tv',960,540],['tv',1280,720],['tv',1440,900],['tv',1680,1050],['tv',1920,1080],['tv',2880,1800],['desktop',1280,900],['phone',393,852]]){
  const page=await browser.newPage({...(surface==='tv'?devices['iPhone 13']:{}),viewport:{width,height},reducedMotion:'reduce',...(surface==='phone'?{isMobile:true,hasTouch:true}:{})});
  if(surface==='phone'){
   await page.route('**/native-shell/**',route=>{const file=path.join(process.cwd(),'public',new URL(route.request().url()).pathname);return route.fulfill({path:file,contentType:file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html'});});
   await page.goto(origin+'/native-shell/index.html');await page.waitForFunction(()=>window.LocalPartyHost);
   await page.evaluate(state=>LocalPartyHost.update({...state,native:{ready:true,catalogReady:true}}),state);
  }else await page.goto(origin+(surface==='tv'?'/tv':'/host'));
  await page.locator('.game[data-id]').first().waitFor();await page.evaluate(()=>document.fonts.ready);await wait(1200);
  const metrics=await page.locator('.game[data-id]').evaluateAll(cards=>cards.filter(e=>e.getClientRects().length).map(e=>{const h=e.querySelector('h3'),p=e.querySelector('.game-info>p'),s=getComputedStyle(e,'::after'),r=e.getBoundingClientRect(),art=e.querySelector('.art'),a=getComputedStyle(art);return{id:e.dataset.id,title:parseFloat(getComputedStyle(h).fontSize),description:parseFloat(getComputedStyle(p).fontSize),blur:s.filter,image:s.backgroundImage,mask:s.maskImage||s.webkitMaskImage,caption:getComputedStyle(e.querySelector('.game-info')).backgroundImage,width:r.width,spill:h.scrollWidth-h.clientWidth,artRadius:a.borderRadius,artMask:a.maskImage||a.webkitMaskImage,artOverlay:getComputedStyle(art,'::after').display,symbolMask:getComputedStyle(art.querySelector('.symbol')).maskImage||getComputedStyle(art.querySelector('.symbol')).webkitMaskImage};}));
  assert(metrics.length>20);
  if(surface==='tv'){
   const rendered=await page.locator('.game[data-id]').evaluateAll(cards=>{const stage=document.getElementById('tvStage'),scale=stage.getBoundingClientRect().width/stage.offsetWidth;return cards.map(card=>{const bounds=card.getBoundingClientRect(),info=card.querySelector('.game-info').getBoundingClientRect();return {id:card.dataset.id,scale,infoInside:info.top>=bounds.top-1&&info.bottom<=bounds.bottom+1,text:[...card.querySelectorAll('h3,.game-info>p')].map(e=>{const r=document.createRange();r.setStart(e.firstChild,0);r.setEnd(e.firstChild,1);const font=parseFloat(getComputedStyle(e).fontSize);return{font,expected:font*scale,actual:r.getBoundingClientRect().height};})};});});
   for(const card of rendered){assert(card.infoInside,`TV ${width} ${card.id}: caption must remain inside card`);for(const t of card.text){assert(t.actual>=t.expected*.9&&t.actual<=t.expected*1.4,`TV ${width} ${card.id}: actual glyph scaling ${JSON.stringify(t)}`);}}
   results.push({surface:'tv-rendered-glyphs',width,height,cards:rendered});
  }
  for(const m of metrics){assert(m.title>=(surface==='phone'?18:surface==='tv'?26:20),`${surface} ${m.id} title ${m.title}`);assert.equal(m.description,surface==='tv'?18:12,`${surface} ${m.id} description ${m.description}`);assert(m.blur.includes('blur(12px)'));assert(m.blur.includes('brightness(0.8)'));assert(m.image.includes('/assets/games/'));assert(m.mask.includes('gradient'));assert(m.spill<=2,`${surface} title overflow ${m.id}`);}
  if(surface!=='desktop'){
   const capsule=page.locator(surface==='phone'?'#choiceStrip':'#preview');
   const box=await capsule.evaluate(e=>({height:e.offsetHeight,width:e.offsetWidth,scroll:e.scrollWidth,radius:getComputedStyle(e).borderRadius,animation:getComputedStyle(e,'::after').animationName,children:[...e.children].map(c=>({id:c.id,width:c.offsetWidth,scroll:c.scrollWidth,left:c.offsetLeft}))}));
   assert.equal(box.radius,'999px');assert(box.height<=70,`${surface}: selected capsule must remain slim`);for(const c of box.children)assert(c.left+c.width<=box.width+1,`${surface}: capsule child overflow ${JSON.stringify(box)}`);assert.equal(box.animation,'none');
   await page.emulateMedia({reducedMotion:'no-preference'});assert.equal(await capsule.evaluate(e=>getComputedStyle(e,'::after').animationDuration),'12s');await page.emulateMedia({reducedMotion:'reduce'});
  }
  const actionShadows=await page.locator('.game[data-id] :is(button,.start-game,.lp-direct-start,.rules-link),.game[data-id] :is(button,.start-game,.lp-direct-start,.rules-link) *').evaluateAll(es=>es.map(e=>({text:e.textContent,shadow:getComputedStyle(e).textShadow})));
  assert(actionShadows.length>20);for(const action of actionShadows)assert.equal(action.shadow,'none',`${surface}: action text ${action.text} must not inherit caption shadow`);
  for(const m of metrics){assert.equal(m.artRadius,'0px',`${surface} ${m.id}: media box must not add inner rounded corners`);assert.match(m.artMask,/linear-gradient/);assert.match(m.artMask,/(?:rgba\(0, 0, 0, 0\)|transparent) 100%\)/,`${surface} ${m.id}: parent mask must reach transparent before clipping`);assert.equal(m.artOverlay,'none',`${surface} ${m.id}: legacy media highlight must not cut a seam`);assert.equal(m.symbolMask,'none',`${surface} ${m.id}: fade must not rotate or scale with image`);}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:path.join(out,`${surface}-${width}.png`)});
  if(surface!=='tv'){await page.locator('.game[data-id]').first().scrollIntoViewIfNeeded();await wait(400);await page.screenshot({path:path.join(out,`${surface}-${width}-cards.png`)});}
  const first=page.locator('.game[data-id]').first();await first.hover({force:true});await wait(300);
  const hover=await first.evaluate(e=>({hover:e.matches(':hover'),opacity:getComputedStyle(e,'::after').opacity,coarse:matchMedia('(hover:none)').matches}));
  assert(hover.hover,`${surface}: test must actually exercise :hover`);assert.equal(hover.opacity,'0.8',`${surface}: touching/hovering a card must not remove its blur`);
  results.push({surface,width,height,cards:metrics,hover});await page.close();
 }
 fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(results,null,2));console.log('PASS mobile WebKit TV 960/1280/1440/1680/1920/2880, desktop1280, phone393; actual glyph scaling, fonts, gradient mask, capsule, hover blur, no overflow');
}finally{await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
