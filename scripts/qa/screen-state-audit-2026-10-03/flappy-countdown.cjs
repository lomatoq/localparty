'use strict';
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/screen-state-audit-2026-10-03/flappy-countdown-before');fs.mkdirSync(out,{recursive:true});
const files=['server.js','public/tv.js','public/tv.css','public/bridge.js','games/arcade/public/app.js','games/arcade/public/arcade-juice.js','games/arcade/simulation.js'];
const hashes=()=>Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const report={method:'Normal three-second engine countdown; two actual browser controllers, no bots or injected state.',start:hashes(),captures:[],errors:[]};
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_INTERNAL_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'flappy-countdown-audit'}});
let log='',browser;child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,ms=30000){const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await sleep(80);}throw Error(label);}
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'launcher port');const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 const api=async body=>{const r=await fetch(origin+'/api/manage',{method:body?'POST':'GET',headers:{Authorization:'Bearer flappy-countdown-audit','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const s=await r.json();if(!r.ok)throw Error(JSON.stringify(s));return s;};
 await api({type:'force-language',language:'en'});await api({type:'bots-set',count:0});browser=await webkit.launch({headless:true});
 const tvs=[];for(const [width,height] of [[1280,720],[1920,1080]]){const p=await browser.newPage({viewport:{width,height}});p.on('pageerror',e=>report.errors.push(e.message));
  await p.addInitScript(()=>{const original=CanvasRenderingContext2D.prototype.fillRect;CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){if(['#0b081899','#080b1099'].includes(this.fillStyle)||(typeof this.fillStyle==='string'&&this.fillStyle.includes('11, 8, 24'))){const t=this.getTransform();window.countdownPaint={color:this.fillStyle,rect:{x,y,width:w,height:h},transform:{a:t.a,b:t.b,c:t.c,d:t.d,e:t.e,f:t.f},canvas:{width:this.canvas.width,height:this.canvas.height},at:performance.now()};}return original.call(this,x,y,w,h);};});
  await p.goto(origin+'/tv');tvs.push(p);}
 const players=[];for(const name of ['Countdown One','Countdown Two']){const c=await browser.newContext({viewport:{width:402,height:874},isMobile:true,hasTouch:true});const p=await c.newPage();await p.goto(origin+'/play');await p.locator('#name').fill(name);await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();players.push(p);}
 await api({type:'launch',id:'flappy'});
 const frames=[];for(const p of tvs){await p.waitForFunction(()=>document.querySelector('#gameFrame').src.includes('/games/flappy/'));await until(()=>p.frames().some(f=>f.url().includes('/games/flappy/')),'actual host frame navigation');const f=p.frames().find(f=>f.url().includes('/games/flappy/'));await f.waitForFunction(()=>window.PARTY_BOT_VIEW?.mode==='flappy');await f.evaluate(()=>document.fonts.ready);await f.waitForFunction(()=>performance.getEntriesByType('resource').some(e=>e.name.includes('flappy-sky.png')&&e.responseEnd>0));await sleep(500);frames.push(f);}
 for(const p of players)await p.waitForFunction(()=>!document.getElementById('readyButton').disabled);
 await players[0].locator('#readyButton').click();await players[1].locator('#readyButton').click();
 await Promise.all(frames.map(f=>f.waitForFunction(()=>state?.countdown>1.5)));
 await Promise.all(tvs.map(p=>p.locator('#tvSceneTransition').waitFor({state:'hidden'})));await sleep(600);await Promise.all(frames.map(f=>f.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))));
 await Promise.all(tvs.map(async(p,i)=>{const name=`flappy-countdown-${p.viewportSize().width}.png`;const proof=await frames[i].evaluate(()=>({phase:state.phase,countdown:state.countdown,mode:state.mode,paint:window.countdownPaint,camera:window.ArcadeCamera,canvasRect:document.querySelector('canvas').getBoundingClientRect().toJSON()}));await p.screenshot({path:path.join(out,name)});report.captures.push({name,viewport:p.viewportSize(),proof});}));
 await Promise.all(frames.map(f=>f.waitForFunction(()=>state?.phase==='playing'&&state.countdown===0)));
 await Promise.all(tvs.map(async(p,i)=>{const name=`flappy-playing-${p.viewportSize().width}.png`;await p.screenshot({path:path.join(out,name)});report.captures.push({name,phase:await frames[i].evaluate(()=>({phase:state.phase,countdown:state.countdown}))});}));
 await api({type:'launch',id:'punchmeter'});
 for(const p of players){await p.waitForFunction(()=>document.getElementById('gameFrame').src.includes('/games/punchmeter/'));await p.waitForFunction(()=>!document.getElementById('readyButton').disabled);}
 await players[0].locator('#readyButton').click();await players[1].locator('#readyButton').click();
 const punchFrames=[];for(const p of tvs){await until(()=>p.frames().some(f=>f.url().includes('/games/punchmeter/')),'Punch actual frame');const f=p.frames().find(f=>f.url().includes('/games/punchmeter/'));await f.waitForFunction(()=>state?.mode==='punchmeter'&&state.phase==='playing');await f.evaluate(()=>document.fonts.ready);punchFrames.push(f);}
 await Promise.all(tvs.map(p=>p.locator('#tvSceneTransition').waitFor({state:'hidden'})));await sleep(600);
 for(let i=0;i<tvs.length;i++){const p=tvs[i],name=`punch-playing-${p.viewportSize().width}.png`;await p.screenshot({path:path.join(out,name)});const proof=await punchFrames[i].evaluate(()=>({mode:state.mode,phase:state.phase,countdown:state.countdown,paint:window.countdownPaint||null,camera:window.ArcadeCamera}));if(proof.countdown!==0||proof.paint)throw Error('Punch received countdown dim');report.captures.push({name,proof});}
 report.endState=await api();if(report.errors.length)throw Error('Browser error: '+report.errors.join('; '));report.ok=true;
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{report.end=hashes();report.drift=files.filter(f=>report.start[f]!==report.end[f]);save();fs.writeFileSync(path.join(out,'server.log'),log);await browser?.close();child.kill();console.log(JSON.stringify({ok:report.ok,failure:report.failure,errors:report.errors,drift:report.drift,captures:report.captures}));}})();
