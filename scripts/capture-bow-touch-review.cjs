'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const root=path.resolve('.localparty-build/screen-review'),output=path.join(root,'bow-touch');fs.mkdirSync(output,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'shell-review'}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const report={method:'Real two-phone Bow Club Touch selection and pointer aim/draw/release, normal-speed five-arrow match; no camera permission fixture.',capturedAt:new Date().toISOString(),captures:[],errors:[]};
const watchdog=setTimeout(()=>{child.kill();process.exit(2);},180000);watchdog.unref();
(async()=>{try{
 for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await sleep(50);assert.match(log,/localhost:(\d+)/);const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{signal:AbortSignal.timeout(15000),method:body?'POST':'GET',headers:{Authorization:'Bearer shell-review','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1280,height:720}}),phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});phone.setDefaultTimeout(10000);phone.on('pageerror',e=>report.errors.push(e.message));
 const shot=async(id,title,name,page=phone,surface='Телефон')=>{await sleep(300);const file=name+'.png';await page.screenshot({path:path.join(output,file)});const card={id,game:'bow_club',title,surface,state:'Touch · игровой поток',file:'bow-touch/'+file,method:report.method};report.captures.push(card);let extras=[];try{extras=JSON.parse(fs.readFileSync(path.join(root,'manifest-extra.json')))}catch{}fs.writeFileSync(path.join(root,'manifest-extra.json'),JSON.stringify([...extras.filter(x=>x.id!==id),card],null,2));};
 await tv.goto(origin+'/tv');await phone.goto(origin+'/play');await phone.locator('#name').fill('Александра ДлинноеИмя');await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();const second=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});await second.goto(origin+'/play');await second.locator('#name').fill('Пётр');await second.locator('#joinForm button[type=submit]').click();await second.locator('#home').waitFor();await sleep(1200);
 await api({type:'settings',id:'bow_club',settings:{mode:'versus',arrows:'5'}});await api({type:'launch',id:'bow_club'});
 for(const page of[phone,second]){await page.waitForFunction(()=>!document.getElementById('readyButton').disabled);await page.locator('#readyButton').click();}
 for(let i=0;i<100;i++){if((await api()).active?.ui?.phase==='playing')break;await sleep(100);}assert.equal((await api()).active?.ui?.phase,'playing');
 for(const page of[phone,second]){const frame=page.frames().find(f=>f.url().includes('/games/bow_club/'));assert(frame);await frame.locator('#touch').click();await frame.locator('#view').waitFor();await frame.locator('#draw').waitFor();await page.waitForTimeout(300);}
 await shot('1360','Bow Club · настоящий сенсорный прицел','controller');
 report.inputs=[];
 for(let arrow=0;arrow<5;arrow++)for(const [i,page]of[phone,second].entries()){
  const frame=page.frames().find(f=>f.url().includes('/games/bow_club/'));
  const pad=frame.locator('#touchPad');await pad.click({position:{x:110+arrow*9,y:110+arrow*7}});
  const draw=frame.locator('#draw');await draw.waitFor();for(let n=0;n<30&&!await draw.isEnabled();n++)await sleep(100);assert(await draw.isEnabled(),'Draw must be enabled for a real arrow');
  const box=await draw.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await sleep(550);await page.mouse.up();await sleep(500);report.inputs.push({player:i,arrow:arrow+1,action:'real pointer aim, hold550ms and release'});
 }
 for(let i=0;i<100;i++){if((await api()).active?.ui?.phase==='results')break;await sleep(100);}assert.equal((await api()).active?.ui?.phase,'results','All ten real arrow releases must end the round');
 await sleep(900);await shot('1361','Bow Club · итог после Touch','phone-results');await shot('1362','Bow Club · итог Touch-матча на ТВ','tv-results',tv,'ТВ');
 report.resultPhase='results';report.arrowsAttempted=report.inputs.length;
 console.log('CAPTURED',report.captures.map(x=>x.id).join(','));
}finally{clearTimeout(watchdog);fs.writeFileSync(path.join(output,'bow-touch-report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();}})().catch(error=>{report.failure=error.message;fs.writeFileSync(path.join(output,'bow-touch-report.json'),JSON.stringify(report,null,2));console.error(error);process.exitCode=1});
