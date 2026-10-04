'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const output=path.resolve('.localparty-build/lan98/screens');fs.mkdirSync(output,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'lan-layout-qa'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 for(let i=0;i<200&&!/localhost:(\d+)/.test(log);i++)await sleep(50);assert.match(log,/localhost:(\d+)/);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async data=>{const r=await fetch(origin+'/api/manage',{method:data?'POST':'GET',headers:{Authorization:'Bearer lan-layout-qa','Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});assert(r.ok,await r.clone().text());return r.json();};
 const errors=[],captures=[];browser=await webkit.launch({headless:true});
 const tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>errors.push(e.message));await tv.goto(origin+'/tv');await tv.waitForFunction(()=>document.querySelector('#tvStartup').hidden,{},{timeout:20000});await tv.evaluate(()=>document.fonts.ready);await sleep(300);
 for(const width of [1280,1920]){
  await tv.setViewportSize({width,height:width===1280?720:1080});await sleep(250);
  const ink=await tv.locator('.headline-stage h1').evaluate(n=>({overflow:getComputedStyle(n).overflow,right:n.getBoundingClientRect().right,screen:innerWidth}));assert.equal(ink.overflow,'visible');assert(ink.right<=ink.screen);await tv.screenshot({path:path.join(output,'tv-'+width+'.png')});captures.push('tv-'+width+'.png');
 }
 const phone=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true});phone.on('pageerror',e=>errors.push(e.message));await phone.goto(origin+'/play');await phone.locator('#name').fill('Alex');await phone.locator('#joinForm button[type=submit]').click();await api({type:'bots-set',count:3});await api({type:'launch',id:'push'});await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await phone.evaluate(()=>document.fonts.ready);await sleep(200);
 for(const width of [320,375,393]){
  await phone.setViewportSize({width,height:width===320?568:width===375?667:852});
  for(const open of [false,true]){
   await phone.locator('.waiting-details').evaluate((n,open)=>n.open=open,open);await sleep(150);
   const m=await phone.evaluate(()=>{const details=document.querySelector('.waiting-details'),summary=details.querySelector('summary'),body=details.querySelector('.waiting-rules-body'),r=details.getBoundingClientRect(),c=document.querySelector('#waitingContent').getBoundingClientRect(),ready=document.querySelector('#readyButton').getBoundingClientRect(),footer=document.querySelector('#sessionControls').getBoundingClientRect();return{open:details.open,display:getComputedStyle(summary).display,align:getComputedStyle(summary).alignItems,cardBottom:r.bottom,contentBottom:c.bottom,readyBottom:ready.bottom,footerTop:footer.top,scrollable:body.scrollHeight>body.clientHeight,bodyHeight:body.clientHeight,horizontal:document.documentElement.scrollWidth-innerWidth};});
   const backing=await phone.evaluate(()=>{const h=document.querySelector('#brandHeader'),s=getComputedStyle(h,'::before');return{height:h.getBoundingClientRect().height,bottom:parseFloat(s.bottom),background:s.backgroundImage};});assert.equal(backing.bottom,0);assert(backing.background.includes('gradient'));
   assert.equal(m.display,'flex');assert.equal(m.align,'center');assert(m.cardBottom<=m.contentBottom+1);assert(m.readyBottom<=m.footerTop);assert.equal(m.horizontal,0);if(open)assert(m.bodyHeight>35);
   assert(await phone.locator('.waiting-rules-body>div>b').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).textAlign==='center')),'green rule headings are centered');
   assert(await phone.locator('.waiting-rules-body>div>b').evaluateAll(nodes=>nodes.every(n=>parseFloat(getComputedStyle(n).fontSize)===15)),'green rule headings are 15px');
   if(open){await phone.locator('.waiting-rules-body').evaluate(n=>n.scrollTop=n.scrollHeight);await sleep(80);assert(await phone.locator('.waiting-rules-body').evaluate(n=>Math.abs(n.scrollHeight-n.clientHeight-n.scrollTop)<2));await phone.locator('.waiting-rules-body').evaluate(n=>n.scrollTop=0);}
   const file='web-rules-'+width+(open?'-open':'')+'.png';await phone.screenshot({path:path.join(output,file)});captures.push(file);
  }
 }
 // Explicit fixture: real controller page + shipped native scripts, discovery data
 // supplied by the test. This is UI coverage, not two-physical-phone LAN evidence.
 const native=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 await native.addInitScript(()=>{window.__qaMessages=[];window.webkit={messageHandlers:{partyShell:{postMessage:m=>window.__qaMessages.push(m)}}};});
 await native.addInitScript({path:'public/native-shell/controller-bridge.js'});await native.goto(origin+'/play');await native.addScriptTag({path:'public/native-shell/nearby-rooms.js'});
 await native.evaluate(()=>LocalPartyRooms.update([{id:'own',name:'Your room',game:'Push Pit',phase:'waiting',players:3},{id:'other',name:'Taylor’s iPhone',game:'Marble Bloom',phase:'waiting',players:2},{id:'third',name:'Sam’s iPhone',game:'',phase:'lobby',players:1}],'own'));
 await native.locator('#nearbyToggle').click();await native.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled(document.querySelector('#nearbyDialog').getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished));});await native.screenshot({path:path.join(output,'rooms-three-fixture.png')});captures.push('rooms-three-fixture.png');
 await native.locator('[data-room="other"] button').click();assert(await native.evaluate(()=>__qaMessages.some(m=>m.type==='join-room'&&m.id==='other')));
 await native.evaluate(()=>LocalPartyRooms.update([{id:'own',name:'Your room',game:'Push Pit',phase:'waiting',players:3}],'other'));await native.locator('#nearbyToggle').click();await native.evaluate(async()=>{await Promise.allSettled(document.querySelector('#nearbyDialog').getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished));});await native.screenshot({path:path.join(output,'rooms-disconnected-fixture.png')});captures.push('rooms-disconnected-fixture.png');await native.locator('[data-room="own"] button').click();assert(await native.evaluate(()=>__qaMessages.some(m=>m.type==='join-room'&&m.id==='own')));
 await native.evaluate(()=>LocalPartyRooms.update([{id:'own',name:'Your room',game:'',phase:'lobby',players:0}],'own'));assert(await native.locator('#nearbyToggle').isHidden());
 const allGames=[];
 if(process.env.QA_ALL_WAITING==='1'){
  const catalog=(await api()).catalog;
  for(const game of catalog.filter(g=>!process.env.QA_WAITING_START||catalog.indexOf(g)>=catalog.findIndex(x=>x.id===process.env.QA_WAITING_START))){
   await api({type:'stop'});await api({type:'bots-set',count:Math.max(0,game.min-1)});await api({type:'launch',id:game.id});
   await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),game.id);
   await phone.waitForFunction(()=>!document.querySelector('#waitingRules').hidden);
   for(const width of [320,393]){
    await phone.setViewportSize({width,height:width===320?568:852});
    for(const open of [false,true]){
     await phone.locator('.waiting-details').evaluate((n,open)=>n.open=open,open);await sleep(100);
     const geometry=await phone.evaluate(()=>{const ready=document.querySelector('#readyButton').getBoundingClientRect(),footer=document.querySelector('#sessionControls').getBoundingClientRect(),details=document.querySelector('.waiting-details').getBoundingClientRect(),content=document.querySelector('#waitingContent').getBoundingClientRect();return{ready:ready.bottom,footer:footer.top,details:details.bottom,content:content.bottom,text:document.querySelector('#waitingContent').textContent,horizontal:document.documentElement.scrollWidth-innerWidth};});
     assert.equal(geometry.horizontal,0,game.id);assert(geometry.ready<=geometry.footer+1,game.id+' Ready');assert(geometry.details<=geometry.content+1,game.id+' '+width+' '+open+' rules clipped '+JSON.stringify(geometry));assert(!/[А-Яа-яЁё]/.test(geometry.text),game.id+' English rules');
     const file='all-'+game.id+'-'+width+(open?'-open':'')+'.png';await phone.screenshot({path:path.join(output,file)});captures.push(file);
    }
   }
   allGames.push(game.id);console.log('PASS waiting',game.id);
  }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({capturedAt:new Date().toISOString(),captures,allGames,checks:'TV ink overflow, rules summary center, bounded scroll, reachable final rule, Ready/footer, three rooms, explicit join, own room return, disconnected host. Room screenshots use a native bridge fixture.',errors},null,2));console.log('PASS',captures.length,'captures');
 }finally{await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
