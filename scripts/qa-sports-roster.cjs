'use strict';
// Bowling/curling with a 4-player roster: phones at 320×568 and 393×852, TV 1280×720.
// Real launch, real swipes (and a real teammate sweep in curling); no state injection.
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.localparty-build/ux-polish/sports-roster');fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'roster'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const report={startedAt:new Date().toISOString(),modes:{},errors:[]};
async function until(fn,label,ms=30000){const end=Date.now()+ms;while(Date.now()<end){if(await fn().catch(()=>false))return true;await sleep(80);}throw Error('timeout: '+label);}
const watchdog=setTimeout(()=>{child.kill();process.exit(2)},10*60*1000);watchdog.unref();
(async()=>{try{
 await until(async()=>/localhost:(\d+)/.test(log),'server');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer roster','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return r.json();};
 browser=await webkit.launch({headless:true});
 const tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>report.errors.push('tv: '+e.message));await tv.goto(origin+'/tv');
 const sizes=[[320,568,'Александра Длинноимённая'],[393,852,'Taylor'],[320,568,'Виктор'],[393,852,'Mia Longsurname']],phones=[];
 for(const [w,h,name] of sizes){const p=await browser.newPage({viewport:{width:w,height:h},isMobile:true,hasTouch:true});p.on('pageerror',e=>report.errors.push(w+': '+e.message));await p.goto(origin+'/play');await p.locator('#name').fill(name);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();p.qaWidth=w;phones.push(p);}
 for(const mode of ['bowling','curling']){
  const row={throws:0,shots:[]};report.modes[mode]=row;
  const frame=p=>p.frames().find(f=>f.url().includes('/games/'+mode+'/'));
  const shot=async(p,name)=>{const file=`${mode}-${name}.png`;await p.screenshot({path:path.join(out,file)});row.shots.push(file);};
  await api({type:'launch',id:mode});
  for(const p of phones){await p.waitForFunction(()=>!document.getElementById('readyButton').disabled,null,{timeout:20000});await p.locator('#readyButton').click();}
  const s=await api();if(s.active?.ui?.phase==='waiting')await api({type:'force-start',instance:s.active.instance}).catch(()=>{});
  const thrower=async()=>{for(const p of phones){const f=frame(p);if(f&&await f.evaluate(()=>{const pad=document.getElementById('ss-throw-pad');return !!pad&&!pad.classList.contains('disabled')&&pad.getClientRects().length>0;}).catch(()=>false))return p;}return null;};
  for(let n=0;n<4;n++){
   let p=null;await until(async()=>(p=await thrower()),'thrower '+n,40000);await sleep(500);
   if(n<2){await shot(p,`aim-phone${p.qaWidth}-${n}`);await shot(tv,`aim-tv-${n}`);}
   const f=frame(p),r=await f.locator('#ss-throw-pad').boundingBox();const x0=r.x+r.width*.5,y0=r.y+r.height*.86,y1=r.y+r.height*(mode==='curling'?.5:.26);
   await p.mouse.move(x0,y0);await p.mouse.down();await sleep(90);for(let i=1;i<=6;i++){await p.mouse.move(x0+(n%2?6:-4)*i/6,y0+(y1-y0)*i/6);await sleep(mode==='curling'?40:9);}await p.mouse.up();row.throws++;
   if(mode==='curling'){
    // A teammate holds sweep while the stone slides.
    await sleep(700);for(const mate of phones){if(mate===p)continue;const mf=frame(mate);const sw=mf&&mf.locator('#ss-sweep');if(sw&&await sw.isVisible().catch(()=>false)&&!(await sw.isDisabled().catch(()=>true))){const b=await sw.boundingBox();await mate.mouse.move(b.x+b.width/2,b.y+b.height/2);await mate.mouse.down();await sleep(400);if(n===0){await shot(mate,`sweep-phone${mate.qaWidth}`);await shot(tv,'sweep-tv');}await sleep(500);await mate.mouse.up();break;}}
   }else{await sleep(1100);if(n<2)await shot(tv,`roll-tv-${n}`);}
   await sleep(mode==='curling'?3500:4500);if(n===1)await shot(tv,'after-two');
  }
  await api({type:'stop'});await Promise.all(phones.map(p=>p.locator('#home').waitFor()));
 }
}catch(e){report.failure=e.stack||String(e);process.exitCode=1;}
finally{clearTimeout(watchdog);report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();child.kill();console.log(JSON.stringify(report));}})();
