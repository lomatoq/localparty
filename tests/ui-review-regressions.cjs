'use strict';
const {spawn}=require('node:child_process'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const server=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'review-regression'}});
let log='',browser;server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 for(let n=0;n<200&&!/localhost:(\d+)/.test(log);n++)await sleep(100);
 assert.match(log,/localhost:(\d+)/);const base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(base+'/api/manage',{method:'POST',headers:{Authorization:'Bearer review-regression','Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();assert(r.ok,JSON.stringify(data));return data;};
 browser=await webkit.launch({headless:true});const phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 const tv=await browser.newPage();await tv.goto(base+'/tv');
 await phone.goto(base+'/play');await phone.locator('#name').fill('Review');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();
 await phone.locator('#editFromCatalog').click();await phone.locator('#profileCancel').waitFor({state:'visible'});
 const profileActions=await phone.locator('.profile-submit-row').evaluate(row=>{const save=row.querySelector('[type=submit]').getBoundingClientRect(),back=row.querySelector('#profileCancel').getBoundingClientRect(),style=getComputedStyle(row.querySelector('#profileCancel'));return{save:{width:save.width,height:save.height,bottom:save.bottom},back:{width:back.width,height:back.height,bottom:back.bottom},radius:style.borderRadius};});
 assert(profileActions.save.width>profileActions.back.width);assert(Math.abs(profileActions.save.height-profileActions.back.height)<1,JSON.stringify(profileActions));assert(Math.abs(profileActions.save.bottom-profileActions.back.bottom)<1,JSON.stringify(profileActions));assert.equal(profileActions.radius,'50%');
 await phone.locator('#profileCancel').click();await phone.locator('#home').waitFor();
 const catalog=await (await fetch(base+'/api/manage',{headers:{Authorization:'Bearer review-regression'}})).json();
 for(const id of (process.env.AUDIT_ALL?catalog.catalog.map(g=>g.id):['chaos','kart','drawguess'])){
  await api({type:'bots-set',count:Math.max(1,catalog.catalog.find(g=>g.id===id).min-1)});await sleep(200);await api({type:'launch',id});await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await phone.locator('#readyButton').click();
  await sleep(1800);const frame=phone.frames().find(f=>f.url().includes('/games/'+id+'/'));assert(frame);
  for(const width of [320,393,430]){
   await phone.setViewportSize({width,height:852});await sleep(150);
   const header=await phone.evaluate(()=>{
    const box=s=>document.querySelector(s).getBoundingClientRect(),h=box('.app-header'),nav=box('.app-header>nav:last-of-type'),mascot=box('.app-header .brand-mark'),badge=box('#hudTimer');
    return {height:h.height,iconCenter:Math.abs((nav.top+nav.bottom-h.top-h.bottom)/2),mascotBottom:Math.abs(mascot.bottom-h.bottom),overhang:badge.bottom-h.bottom,mascotWidth:mascot.width,mascotHeight:mascot.height,textAbove:Number(getComputedStyle(document.querySelector('.identity-copy')).zIndex)>Number(getComputedStyle(document.querySelector('.brand-mark')).zIndex)};
   });
   assert.equal(header.height,48,JSON.stringify(header));assert(header.iconCenter<1,JSON.stringify(header));assert(header.mascotBottom<1,JSON.stringify(header));assert(header.overhang>=14,JSON.stringify(header));assert.equal(header.mascotWidth,60);assert.equal(header.mascotHeight,48);assert(header.textAbove);
   const result=await frame.evaluate(id=>{
    const rect=el=>el.getBoundingClientRect(),css=el=>getComputedStyle(el);const result={overflow:document.documentElement.scrollWidth-innerWidth};
    if(id==='chaos'){const label=document.querySelector('#controlArea .ctrl small');result.size=parseFloat(css(label).fontSize);result.italic=css(label).fontStyle;}
    if(id==='kart'){const button=document.querySelector('#swapHandBtn'),speed=document.querySelector('#speedText').parentElement;result.icon=button.textContent.trim();result.label=button.getAttribute('aria-label');result.center=Math.abs((rect(speed).left+rect(speed).right)/2-innerWidth/2);}
    if(id==='drawguess'){const canvas=document.querySelector('#canvas'),stage=canvas.closest('.stage');result.radius=parseFloat(css(canvas).borderRadius);result.edge=Math.abs(rect(canvas).width-rect(stage).width);}
    return result;
   },id);
   if(['chaos','kart','drawguess'].includes(id))assert(result.overflow<=1,`${id} overflow ${width}`);
   else if(result.overflow>1)console.warn('GAME CONTENT OVERFLOW',id,width,result.overflow);
   if(id==='chaos'){assert(result.size>=18);assert.equal(result.italic,'italic');}
   if(id==='kart'){assert.equal(result.icon,'⇄');assert(result.label);assert(result.center<3,JSON.stringify(result));}
   if(id==='drawguess'){assert.equal(result.radius,0);assert(result.edge<4,JSON.stringify(result));}
   console.log('PASS',id,width,JSON.stringify(result));
   if(id==='drawguess'){
    const safe=await phone.evaluate(()=>{
     const css=[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules].map(r=>r.cssText);}catch{return [];}}).join('\n');
     const style=document.createElement('style');style.textContent=css.replaceAll('env(safe-area-inset-top)','59px');document.head.append(style);document.body.classList.add('native-controller');
     const rect=s=>document.querySelector(s).getBoundingClientRect(),h=rect('.app-header'),n=rect('.app-header>nav:last-of-type'),m=rect('.brand-mark'),b=rect('#hudTimer');
     const result={height:h.height,center:Math.abs((n.top+n.bottom)/2-(h.top+59+24)),bottom:Math.abs(m.bottom-h.bottom),overhang:b.bottom-h.bottom};
     document.body.classList.remove('native-controller');style.remove();return result;
    });
    assert.equal(safe.height,107,JSON.stringify(safe));assert(safe.center<1&&safe.bottom<1&&safe.overhang>=14,JSON.stringify(safe));console.log('PASS simulated native safe area',width,JSON.stringify(safe));
   }
  }
  await api({type:'stop'});await phone.locator('#home').waitFor();
 }
}finally{await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
