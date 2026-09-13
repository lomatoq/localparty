'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),net=require('node:net'),{spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const ROOT=path.join(__dirname,'..'),OUT=path.join(ROOT,'test-results/afterparty');fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const freePort=()=>new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const request=url=>new Promise((resolve,reject)=>{const q=http.get(url,res=>{res.resume();resolve(res.statusCode);});q.on('error',reject);q.setTimeout(500,()=>q.destroy(Error('timeout')));});
async function launchGame(mode){const port=await freePort(),cwd=mode?path.join(ROOT,'games/afterparty'):ROOT,log=[];
  const env={...process.env,PARTY_NO_BROWSER:'1',PARTY_EPHEMERAL:'1',PORT:String(port),PARTY_PORT:String(port)};delete env.PARTY_MANAGED;delete env.PARTY_TLS_PFX;if(mode)env.PARTY_GAME_ID=mode;
  const child=spawn(process.execPath,['server.js'],{cwd,env,stdio:['ignore','pipe','pipe']});child.stdout.on('data',b=>log.push(String(b)));child.stderr.on('data',b=>log.push(String(b)));
  for(let i=0;i<150;i++){if(child.exitCode!==null)throw Error(log.join(''));try{if(await request(`http://127.0.0.1:${port}/`)===200)return {child,port,log};}catch{}await sleep(100);}child.kill();throw Error('Server start timeout: '+log.join(''));
}
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});const report={browser:await browser.version(),cases:[],errors:[]};
  try{
    for(const mode of ['curling','bowling','gate_siege','pop_shots']){
      const run=await launchGame(mode),contexts=[];try{
        const hostContext=await browser.newContext({viewport:{width:1600,height:1000}});contexts.push(hostContext);const host=await hostContext.newPage();host.on('pageerror',e=>report.errors.push(mode+':host:'+e.message));
        await host.goto(`http://127.0.0.1:${run.port}/host`);await host.locator('#ap-stage canvas').waitFor({timeout:20000});
        const phones=[];for(let i=0;i<2;i++){const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});contexts.push(ctx);await ctx.addInitScript(({name,hand})=>{window.PARTY_PROFILE={name,hand};},{name:'Тестер '+(i+1),hand:i?'right':'left'});const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(mode+':phone:'+e.message));await p.goto(`http://127.0.0.1:${run.port}/`);phones.push(p);}
        await host.waitForFunction(()=>!document.querySelector('#start').disabled);await host.locator('#start').click();await host.waitForFunction(()=>document.querySelector('#start').hidden,null,{timeout:20000});
        const phone=phones[0];await phone.waitForFunction(()=>document.querySelector('#ap-you').textContent.includes('Тестер'));
        assert.equal(await phone.locator('body').evaluate(e=>e.classList.contains('ap-left')),true);await phone.locator('#ap-hand').click();assert.equal(await phone.locator('body').evaluate(e=>e.classList.contains('ap-left')),false);
        if(['curling','bowling'].includes(mode)){
          await phone.waitForFunction(()=>document.querySelector('#ap-state').textContent==='Твой бросок');await phone.locator('details summary').click();await phone.locator('#ap-throw').click();await sleep(900);assert.match(await phone.locator('#ap-state').textContent(),/Смотри|Бросает/);
        }else{
          const fire=phone.locator('#ap-fire'),r=await fire.boundingBox();await phone.mouse.move(r.x+r.width/2,r.y+r.height/2);await phone.mouse.down();await sleep(1100);assert.equal(await fire.evaluate(e=>e.classList.contains('held')),true);await phone.mouse.up();
          const r2=await phone.locator('#ap-aim').boundingBox();await phone.mouse.move(r2.x+r2.width*.5,r2.y+r2.height*.5);await phone.mouse.down();await phone.mouse.move(r2.x+r2.width*.75,r2.y+r2.height*.3,{steps:6});await phone.mouse.up();
        }
        await host.screenshot({path:path.join(OUT,mode+'-host.png')});await phone.screenshot({path:path.join(OUT,mode+'-phone.png')});
        report.cases.push({mode,hostCanvas:await host.locator('#ap-stage canvas').count(),phoneState:await phone.locator('#ap-state').textContent(),leftHandToggle:true});
      }finally{for(const ctx of contexts)await ctx.close();run.child.kill();fs.writeFileSync(path.join(OUT,mode+'-server.log'),run.log.join(''));}
    }
    const run=await launchGame(null),contexts=[];try{
      const hc=await browser.newContext({viewport:{width:1600,height:1000}});contexts.push(hc);const host=await hc.newPage();host.on('pageerror',e=>report.errors.push('launcher:'+e.message));await host.goto(`http://127.0.0.1:${run.port}/host`);
      await host.locator('.game[data-id="bowling"]').waitFor();assert.equal(await host.locator('.game').count(),30);
      await host.locator('#lp-update-button').click();await host.waitForFunction(()=>document.querySelector('#lp-current-version').textContent.includes('0.7.0-alpha.1'));await host.screenshot({path:path.join(OUT,'launcher-updates.png')});await host.locator('#lp-update-close').click();
      const phones=[];for(let i=0;i<2;i++){const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});contexts.push(ctx);const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push('managed-phone:'+e.message));await p.goto(`http://127.0.0.1:${run.port}/`);await p.locator('#name').fill('Игрок '+(i+1));await p.locator('#joinForm button').click();phones.push(p);}
      await host.locator('.game[data-id="curling"] .start-game').click();for(const p of phones){await p.locator('#readyButton').waitFor({state:'visible',timeout:20000});await p.locator('#readyButton').click();}
      const f=host.frameLocator('#gameFrame');await f.locator('#ap-status').filter({hasText:/ЭНД/}).waitFor({timeout:20000});await host.screenshot({path:path.join(OUT,'managed-curling.png')});
      assert.equal(await request(`http://127.0.0.1:${run.port}/api/update`),403);report.cases.push({mode:'launcher',catalog:30,managedReadiness:true,updaterDialog:true,unauthorizedUpdate:403});
    }finally{for(const ctx of contexts)await ctx.close();run.child.kill();fs.writeFileSync(path.join(OUT,'launcher-server.log'),run.log.join(''));}
    assert.deepEqual(report.errors,[]);report.ok=true;
  }catch(e){report.ok=false;report.failure=e.stack;process.exitCode=1;}
  finally{fs.writeFileSync(path.join(OUT,'browser-report.json'),JSON.stringify(report,null,2));await browser.close();}
  console.log(JSON.stringify(report,null,2));
})();
