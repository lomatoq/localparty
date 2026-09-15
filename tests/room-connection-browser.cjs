// WebKit guests use the public listener; the AirPlay page stays on loopback.
const {spawn}=require('node:child_process'),assert=require('node:assert/strict'),path=require('node:path');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let log='',browser,base;
const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_ADMIN_KEY:'browser-test',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_NO_BROWSER:'1'}});
child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
async function until(fn,label){for(let n=0;n<300;n++){if(await fn())return;await wait(50);}throw Error(label+' '+log.slice(-500));}
async function manage(command){const r=await fetch(base+'/api/manage',{method:command?'POST':'GET',headers:{Authorization:'Bearer browser-test','Content-Type':'application/json'},body:command?JSON.stringify(command):undefined});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data;}
(async()=>{try{
 await until(()=>/localhost:(\d+)/.test(log),'start');base='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];
 browser=await webkit.launch({headless:true});const tv=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];tv.on('pageerror',e=>errors.push(e.message));await tv.goto(base+'/tv');await until(async()=>(await manage()).screens===1,'AirPlay ready without sharing');
 await tv.locator('#qr').waitFor({state:'hidden'});assert.match(await tv.locator('#inviteHint').innerText(),/Доступ по Wi-Fi/);
 const shared=await manage({type:'network-set',enabled:true}),origin='http://127.0.0.1:'+new URL(shared.urls[0]).port;
 await tv.locator('#qr').waitFor({state:'visible'});
 const phones=[];
 for(const name of ['Первый','Второй']){
  const phone=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});phone.on('pageerror',e=>errors.push(e.message));await phone.goto(origin+'/play');await phone.locator('#name').fill(name);await phone.locator('#joinForm button[type=submit]').click();await phone.locator('#home').waitFor();phones.push(phone);
 }
 const before=await manage(),ids=before.players.map(p=>p.id).sort();
 const active=(await manage({type:'launch',id:'bowling'})).active;
 for(const phone of phones)await phone.locator('#readyButton').click();
 await until(async()=>['playing','countdown'].includes((await manage()).active.ui.phase),'live game');
 const frame=tv.frames().find(f=>f.url().includes('/games/bowling/'));assert.ok(frame);await frame.evaluate(()=>window.__roomSentinel='preserved');
 await manage({type:'network-set',enabled:false});
 await until(async()=>(await manage()).players.length===0,'guests disconnected');
 for(const phone of phones){await phone.locator('#connection').filter({hasText:'Ждём приглашения ведущего'}).waitFor();assert.equal(await phone.locator('#notice').isVisible(),false);assert.equal(await phone.locator('#play').isVisible(),false);}
 assert.equal((await manage()).active.instance,active.instance);assert.equal(await frame.evaluate(()=>window.__roomSentinel),'preserved');assert.equal(await tv.locator('#notice').isVisible(),false);assert.equal(await tv.locator('#incident').isVisible(),false);
 await manage({type:'network-set',enabled:true});await until(async()=>(await manage()).players.length===2,'automatic reconnect');assert.deepEqual((await manage()).players.map(p=>p.id).sort(),ids);assert.equal((await manage()).active.instance,active.instance);
 for(const phone of phones){await phone.locator('#play').waitFor();assert.equal(await phone.locator('#notice').isVisible(),false);}
 await manage({type:'stop'});for(const phone of phones)await phone.locator('#lobby').waitFor();
 await phones[0].reload();await phones[0].locator('#home').waitFor();await until(async()=>(await manage()).players.length===2,'cookie identity');assert.deepEqual((await manage()).players.map(p=>p.id).sort(),ids);
 assert.deepEqual(errors,[]);console.log('PASS WebKit: automatic TV, Wi-Fi QR, two live guest controllers, quiet close, same match, reconnect and cookie identity');
 await manage({type:'network-set',enabled:false});
}finally{await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
