'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_LOGO_OUTPUT||'.localparty-build/design-round2/integration');fs.mkdirSync(out,{recursive:true});
const report={method:'Actual launcher matchmaking, shipped logos, WebKit mobile320/393. No native-device claim.',capturedAt:new Date().toISOString(),games:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'logos-layout-qa'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,label){for(let i=0;i<400;i++){const v=await fn();if(v)return v;await sleep(50);}throw Error(label);}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'server ready');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer logos-layout-qa','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});assert(r.ok,await r.clone().text());return r.json();};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}});await tv.goto(origin+'/tv');await tv.waitForFunction(()=>document.querySelector('#tvStartup').hidden);
 const phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:Number(process.env.QA_LOGO_DPR)||1});phone.on('pageerror',e=>report.errors.push(e.message));
 await phone.goto(origin+'/play');await phone.locator('#name').fill('Alex');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
 const catalog=(await api()).catalog;
 for(const game of catalog.filter(g=>!process.env.QA_LOGO_IDS||process.env.QA_LOGO_IDS.split(',').includes(g.id))){
  await api({type:'stop'});await api({type:'bots-set',count:Math.max(0,game.min-1)});await api({type:'launch',id:game.id});
  await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),game.id);
  await phone.waitForFunction(()=>document.querySelector('#waitingTitle').classList.contains('waiting-logo-loaded'));await phone.waitForFunction(()=>!document.getElementById('readyButton').disabled);await phone.evaluate(()=>document.fonts.ready);
  const row={id:game.id,screens:[]};report.games.push(row);
  for(const width of [320,393]){
   await phone.setViewportSize({width,height:width===320?568:852});
   for(const open of [false,true]){
    await phone.locator('.waiting-details').evaluate((el,value)=>el.open=value,open);await sleep(100);
    await phone.locator('#waitingRules').evaluate(async el=>{await Promise.allSettled(el.getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished));});
    await phone.waitForFunction(()=>{const img=document.querySelector('.waiting-game-logo'),canvas=img?.parentElement.querySelector('.hp-smooth-game-logo'),s=img&&getComputedStyle(img),ratio=Math.min(devicePixelRatio,3);return img?.dataset.hpLogoSmooth==='ready'&&canvas.width===Math.round(parseFloat(s.width)*ratio)&&canvas.height===Math.round(parseFloat(s.height)*ratio);});
    const geometry=await phone.evaluate(()=>{
     const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
     const logo=document.querySelector('.waiting-game-logo'),canvas=logo.parentElement.querySelector('.hp-smooth-game-logo'),card=document.querySelector('.waiting-details'),body=card.querySelector('.waiting-rules-body'),header=document.getElementById('brandHeader');
     return{logo:rect(logo),layoutWidth:parseFloat(getComputedStyle(logo).width),layoutHeight:parseFloat(getComputedStyle(logo).height),naturalWidth:logo.naturalWidth,naturalHeight:logo.naturalHeight,dpr:devicePixelRatio,painted:{width:canvas.width,height:canvas.height,box:rect(canvas),sourceOpacity:getComputedStyle(logo).opacity},header:rect(header),headerBacking:getComputedStyle(header,'::before').bottom,card:rect(card),content:rect(document.getElementById('waitingContent')),ready:rect(document.getElementById('readyButton')),footer:rect(document.getElementById('sessionControls')),bodyHeight:body.clientHeight,horizontal:document.documentElement.scrollWidth-innerWidth,text:document.getElementById('waitingContent').textContent,emojiDisplay:getComputedStyle(document.querySelector('.waiting-emoji-row')).display};
    });
    assert(geometry.naturalWidth>=1000,game.id+' native logo resolution');assert.equal(geometry.emojiDisplay,'none');assert.equal(geometry.headerBacking,'0px');assert(geometry.logo.y>=geometry.header.bottom-1,game.id+' logo under masthead');assert(geometry.logo.right<=width+1);assert.equal(geometry.horizontal,0);
    assert.equal(geometry.painted.sourceOpacity,'0');assert.equal(geometry.painted.width,Math.round(geometry.layoutWidth*Math.min(geometry.dpr,3)));assert.equal(geometry.painted.height,Math.round(geometry.layoutHeight*Math.min(geometry.dpr,3)));assert(Math.abs(geometry.painted.box.y-geometry.logo.y)<.6,game.id+' painted logo alignment');
    assert(geometry.ready.bottom<=geometry.footer.y+1,game.id+' Ready/footer');assert(geometry.card.bottom<=geometry.content.bottom+1,game.id+' rules content');assert(!/[А-Яа-яЁё]/.test(geometry.text),game.id+' English');
    const type=await phone.locator('.waiting-details').evaluate(el=>{const style=n=>{const s=getComputedStyle(n);return{family:s.fontFamily,size:parseFloat(s.fontSize),weight:s.fontWeight,italic:s.fontStyle};},label=el.querySelector('.waiting-summary-label'),arrow=el.querySelector('svg'),m=new DOMMatrix(getComputedStyle(arrow).transform);return{label:style(label),heading:style(el.querySelector('b')),paragraph:style(el.querySelector('p')),arrow:{b:m.b,c:m.c},labelHeight:label.getBoundingClientRect().height};});
    assert.match(type.label.family,/KardiaFatRunner/);assert.equal(type.label.italic,'italic');assert.equal(type.label.size,18);assert(type.labelHeight<27,game.id+' one-line Rules action');assert.match(type.heading.family,/KardiaFatRunner/);assert.equal(type.heading.italic,'italic');assert.equal(type.heading.size,16);assert(type.label.size>type.heading.size);assert.equal(type.arrow.b,0);assert.equal(type.arrow.c,0);
    assert.equal(await phone.locator('.waiting-rules-body').evaluate(el=>parseFloat(getComputedStyle(el).paddingTop)),20,game.id+' rules separated from summary');
    const goal=await phone.locator('.waiting-goal').evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return{height:r.height,line:parseFloat(s.lineHeight),max:parseFloat(s.maxHeight),scrollable:el.scrollHeight>el.clientHeight+2};});
    assert.equal(Math.round(goal.max/goal.line),3,game.id+' bounded whole-line goal');
    assert(Math.abs(goal.height/goal.line-Math.round(goal.height/goal.line))<.08,game.id+' goal never stops halfway through a line');
    if(goal.scrollable){await phone.waitForFunction(()=>document.querySelector('.waiting-goal').dataset.scrollBelow==='true');await phone.locator('.waiting-goal').evaluate(el=>el.scrollTop=el.scrollHeight);await phone.waitForFunction(()=>document.querySelector('.waiting-goal').dataset.scrollBelow==='false');await phone.locator('.waiting-goal').evaluate(el=>el.scrollTop=0);}
    if(open){assert(geometry.bodyHeight>=30,game.id+' rule scroll height');if(width===320){assert(geometry.bodyHeight>=110,game.id+' short-screen reading space');assert.equal(await phone.locator('.waiting-rule-goal').evaluate(el=>getComputedStyle(el).display),'block');assert.equal(await phone.locator('.waiting-goal').evaluate(el=>getComputedStyle(el).display),'none');}const scrollable=await phone.locator('.waiting-rules-body').evaluate(el=>el.scrollHeight>el.clientHeight+2);if(scrollable)await phone.waitForFunction(()=>document.querySelector('.waiting-rules-body').dataset.scrollBelow==='true');await phone.locator('.waiting-rules-body').evaluate(el=>el.scrollTop=el.scrollHeight);assert(await phone.locator('.waiting-rules-body').evaluate(el=>Math.abs(el.scrollHeight-el.clientHeight-el.scrollTop)<2));if(scrollable)await phone.waitForFunction(()=>document.querySelector('.waiting-rules-body').dataset.scrollBelow==='false');await phone.locator('.waiting-rules-body').evaluate(el=>el.scrollTop=0);if(scrollable)await phone.waitForFunction(()=>document.querySelector('.waiting-rules-body').dataset.scrollAbove==='false'&&document.querySelector('.waiting-rules-body').dataset.scrollBelow==='true');}
    const file=`${game.id}-${width}${open?'-open':''}.png`;await phone.screenshot({path:path.join(out,file)});row.screens.push({width,open,file,geometry});
   }
  }
  console.log('PASS logo waiting',game.id);
 }
 assert.deepEqual(report.errors,[]);console.log('PASS',report.games.length,'games');
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();}})().catch(e=>{report.failure=e.message;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
