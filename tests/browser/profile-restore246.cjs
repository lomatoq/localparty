'use strict';
// Real browser profile persistence; isolated LAN servers and disposable user data.
// No native/AirPlay timing or general performance claim is made by this harness.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawn,execFileSync}=require('node:child_process');
const pw=require(process.env.PARTY_PLAYWRIGHT||'playwright'),{ProfileStore}=require('../../lib/profile-store');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.env.QA_OUTPUT||'output/playwright/profile246');
fs.mkdirSync(out,{recursive:true});
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'hp-profile246-')),baseline=execFileSync('git',['show','db5e4f4:public/app.js'],{cwd:root,encoding:'utf8'});
const key=path.join(temporary,'qa.key'),certificate=path.join(temporary,'qa.crt'),pfx=path.join(temporary,'qa.pfx');
execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',certificate,'-days','1','-subj','/CN=localhost'],{stdio:'ignore'});
execFileSync('openssl',['pkcs12','-export','-out',pfx,'-inkey',key,'-in',certificate,'-passout','pass:'],{stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),report={capturedAt:new Date().toISOString(),method:'Disposable persistent Chromium/WebKit contexts; real /play onboarding, reload, process relaunch and host-only cookie recovery. Faults are injected only into browser storage.',rows:[],errors:[],limits:['No physical Safari/iPhone verification.','A different hostname cannot read prior credentials. Port/protocol changes create a fresh localStorage origin but same-host cookie recovery was verified in the ordinary-storage rows. Credentials are never shared through a parent-domain cookie or URL.','Injected restricted localStorage leaves cookies enabled; storage settings that block both mechanisms are outside this result.']};
report.sources={baseline:'db5e4f4',...Object.fromEntries(['public/app.js','lib/profile-store.js','lib/lancert-https.js','server.js'].map(file=>[file,require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]))};
let child;
async function start(file,tls=false){
 let logs='';child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PARTY_DATA_FILE:file,PARTY_EPHEMERAL:'0',PARTY_EMBEDDED:'0',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_ADMIN_KEY:'profile246',PARTY_TLS_PFX:tls?pfx:'',PARTY_TLS_PASSWORD:''},stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',chunk=>logs+=chunk);child.stderr.on('data',chunk=>logs+=chunk);
 for(let count=0;count<150&&!/localhost:(\d+)/.test(logs);count++){if(child.exitCode!==null)throw Error(logs);await delay(30);}
 const port=logs.match(/localhost:(\d+)/)?.[1];assert(port,logs);return (tls?'https':'http')+'://127.0.0.1:'+port;
}
async function stop(){if(!child||child.exitCode!==null)return;const current=child;await new Promise(resolve=>{current.once('exit',resolve);current.kill();});child=null;}
async function identity(page){return page.evaluate(()=>({id:window.PARTY_PROFILE?.id,name:window.PARTY_PROFILE?.name,token:window.PARTY_PROFILE?.token,hand:window.PARTY_PROFILE?.hand,avatar:window.PARTY_PROFILE?.avatar}));}
async function ready(page){await page.waitForFunction(()=>!!window.PARTY_PROFILE?.token&&!document.getElementById('home').hidden,{},{timeout:6000});}
async function join(page,name){
 const image=await require('sharp')({create:{width:24,height:24,channels:4,background:{r:162,g:80,b:240,alpha:1}}}).png().toBuffer();
 await page.locator('#avatarLibrary').setInputFiles({name:'qa-avatar.png',mimeType:'image/png',buffer:image});
 await page.locator('#name').fill(name);await page.locator('input[name="hand"][value="left"]').check();await page.locator('#joinForm button[type="submit"]').click();await ready(page);
 const value=await identity(page);assert.match(value.avatar,/^data:image\//);return value;
}
async function screenshot(page,label){await page.evaluate(()=>document.fonts.ready);await delay(400);await page.screenshot({path:path.join(out,label+'.png')});}
async function cookie(context){return (await context.cookies()).find(item=>item.name==='local_party_device');}
async function waitCookie(context){for(let count=0;count<100;count++){const value=await cookie(context);if(value)return value;await delay(20);}throw Error('No device cookie');}
async function fault(context,mode){
 if(!mode||mode==='normal')return;
 await context.addInitScript(mode=>{
  if(mode==='blocked')Object.defineProperty(window,'localStorage',{get(){throw new DOMException('QA browser storage disabled','SecurityError');}});
  else {const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='local-party-profile')throw new DOMException('QA storage full','QuotaExceededError');return set.call(this,key,value);};}
 },mode);
}
async function persistent(engine,name){return pw[engine].launchPersistentContext(path.join(temporary,name),{headless:true,ignoreHTTPSErrors:true,viewport:{width:393,height:852},isMobile:true,hasTouch:true,...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});}
async function main(){
 for(const engine of (process.env.QA_ENGINES||'chromium,webkit').split(',')){
  for(const revision of (process.env.QA_REVISIONS||'baseline,fixed').split(','))for(const mode of (process.env.QA_MODES||'normal,quota,blocked').split(',')){
   const label=engine+'-'+revision+'-'+mode,file=path.join(temporary,label+'.json');let context=await persistent(engine,label),page=context.pages()[0];
   const errors=[],http=[];
   const observe=next=>{next.on('pageerror',error=>errors.push(error.message));next.on('response',response=>{if(new URL(response.url()).pathname==='/api/profile')http.push({method:response.request().method(),status:response.status(),setsCookie:!!response.headers()['set-cookie']});});};
   const prepare=async()=>{context.on('page',observe);context.pages().forEach(observe);await fault(context,mode);if(revision==='baseline')await context.route('**/app.js',route=>route.fulfill({contentType:'application/javascript',body:baseline}));};
   await prepare();
   try{
    let origin=await start(file);await page.goto(origin+'/play');
    if(revision==='baseline'&&mode==='blocked'){
     await delay(450);assert(errors.some(value=>value.includes('QA browser storage disabled')));assert.equal((await cookie(context)),undefined);
     report.rows.push({engine,revision,mode,controllerBoots:false,deviceCookie:false,errors});await screenshot(page,label+'-blocked');continue;
    }
    const original=await join(page,'QA '+revision+' '+mode);await screenshot(page,label+'-joined');
    if(revision==='baseline'&&mode==='quota'){
     await delay(150);assert.equal((await cookie(context)),undefined);await page.reload();await page.locator('#onboarding').waitFor({state:'visible'});assert.equal((await identity(page)).token,undefined);
     report.rows.push({engine,revision,mode,firstJoin:true,deviceCookie:false,reloadRestored:false,errors});await screenshot(page,label+'-lost');continue;
    }
    const deviceCookie=await waitCookie(context);assert.equal(deviceCookie.domain,'127.0.0.1');assert.equal(deviceCookie.httpOnly,true);assert.equal(deviceCookie.path,'/');assert.equal(deviceCookie.sameSite,'Lax');
    await page.reload();await ready(page);assert.deepEqual(await identity(page),original);await screenshot(page,label+'-reloaded');
    await page.close();page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(origin+'/play');await ready(page);assert.deepEqual(await identity(page),original);
    // An actual gateway process restart restores saved IDs and statistics. A new
    // TCP port is a new storage origin, but a host-only cookie still reaches it.
    await page.close();await context.close();await stop();const persisted=new ProfileStore(file);persisted.record({eventId:'qa-preserved-stat',players:[{id:original.id,score:12,won:true}]},'qa-round','tanks');origin=await start(file);
    context=await persistent(engine,label);await prepare();page=context.pages()[0];await page.goto(origin+'/play');await ready(page);assert.deepEqual(await identity(page),original);
    const state=await (await fetch(origin+'/api/manage',{headers:{authorization:'Bearer profile246'}})).json(),standing=state.leaderboard.find(item=>item.id===original.id);assert.equal(standing.played,1);assert.equal(standing.coins,40);
    await screenshot(page,label+'-restarted');
    await page.locator('#editFromCatalog').click();await page.locator('#onboarding').waitFor({state:'visible'});assert.equal(await page.locator('#name').inputValue(),original.name);assert.equal(await page.locator('input[name="hand"][value="left"]').isChecked(),true);
    await screenshot(page,label+'-restored-profile');await page.locator('#profileCancel').click();await page.locator('#onboarding').waitFor({state:'hidden'});
    // A poisoned local token cannot override a valid cookie. A rejected cookie
    // cannot override a valid local token. No token is present in a URL.
    if(mode==='normal'){
     await page.evaluate(()=>localStorage.setItem('local-party-profile',JSON.stringify({id:'outsider',token:'unknown-token',name:'Wrong identity',hand:'right'})));await page.reload();await ready(page);assert.deepEqual(await identity(page),original);
     const current=await waitCookie(context);await context.addCookies([{name:current.name,value:'unknown-token',domain:current.domain,path:current.path,httpOnly:true,sameSite:'Lax'}]);await page.reload();await ready(page);assert.deepEqual(await identity(page),original);
    }
    const differentHost=origin.replace('127.0.0.1','localhost');await page.goto(differentHost+'/play');await page.locator('#onboarding').waitFor({state:'visible'});await delay(200);assert.equal((await identity(page)).token,undefined);assert.equal(new ProfileStore(file).data.players.length,1);
    await page.goto(origin+'/play');await ready(page);assert.deepEqual(await identity(page),original);
    if(mode==='normal'){
     // The current cookie is host-only, not port/origin-scoped. A same-host
     // HTTP -> HTTPS migration can recover despite empty HTTPS localStorage.
     await page.close();await stop();origin=await start(file,true);page=await context.newPage();await page.goto(origin+'/play');await ready(page);assert.deepEqual(await identity(page),original);await screenshot(page,label+'-https');
    }
    // Credentials for a separate gateway store are rejected, even on the same
    // hostname. They cannot claim a player from the previous host's database.
    await page.close();await stop();const differentStore=path.join(temporary,label+'-other-room.json');const otherOrigin=await start(differentStore);page=await context.newPage();await page.goto(otherOrigin+'/play');await page.locator('#onboarding').waitFor({state:'visible'});await delay(200);assert.equal((await identity(page)).token,undefined);assert.equal(new ProfileStore(differentStore).data.players.length,0);
    assert.deepEqual(errors,[]);report.rows.push({engine,revision,mode,firstJoin:true,deviceCookie:true,reloadRestored:true,newTabRestored:true,browserRestartRestored:true,processRestartRestored:true,newPortRestored:true,sameHostHTTPToHTTPSRestored:mode==='normal'?true:null,stats:{played:standing.played,coins:standing.coins},staleCookieLocalFallback:mode==='normal'?true:null,staleLocalCookieFallback:mode==='normal'?true:null,otherHostnameCannotClaim:true,otherStoreCannotClaim:true,errors});
   }catch(error){report.rows.push({engine,revision,mode,failed:true,errors,http});throw error;}finally{await context.close();await stop();}
  }
 }
 console.log(JSON.stringify(report.rows));
}
main().catch(error=>{report.errors.push(error.stack);console.error(error);process.exitCode=1;}).finally(async()=>{await stop();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));fs.rmSync(temporary,{recursive:true,force:true});});
