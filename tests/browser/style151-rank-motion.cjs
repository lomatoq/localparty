'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawn}=require('child_process'),pw=require('playwright');
const out=path.resolve('output/playwright/style151/ranking');fs.mkdirSync(out,{recursive:true});
const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_EMBEDDED:'1',PARTY_EPHEMERAL:'1',PARTY_INTERNAL_PORT:'0',PARTY_PORT:'0',PARTY_NO_BROWSER:'1'}});let log='';child.stdout.on('data',d=>log+=d);const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let browser;try{
 for(let i=0;i<300&&!/localhost:(\d+)/.test(log);i++)await sleep(50);
 const origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];browser=await pw.webkit.launch();const p=await browser.newPage({viewport:{width:393,height:852},recordVideo:{dir:out}});
 // Test-only state injection, through the actual production showTop/render path.
 await p.route('**/app.js',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('public/app.js','utf8').replace(' function showTop(){'," window.__rankFixture=ranks=>{state.leaderboard=ranks;showTop();}; function showTop(){")}));
 await p.goto(origin+'/play');await p.locator('#name').fill('Test');await p.locator('#joinForm button[type=submit]').click();await p.locator('#home').waitFor();await p.evaluate(()=>document.fonts.ready);
 const a={id:'qa-a',name:'Alex',points:100,wins:1,played:2},b={id:'qa-b',name:'Taylor',points:80,wins:0,played:2};
 await p.evaluate(r=>__rankFixture(r),[a,b]);await sleep(700);await p.screenshot({path:path.join(out,'before.png')});await p.evaluate(()=>statsDialog.close());await sleep(300);
 await p.evaluate(r=>__rankFixture(r),[{...b,points:120,wins:2},a]);await sleep(350);await p.screenshot({path:path.join(out,'moving.png')});
 const moving=await p.evaluate(()=>[...statsBody.querySelectorAll('.stats-rank')].map(r=>({id:r.dataset.id,animations:r.getAnimations().filter(a=>a.id==='hp-rank-shift').length})));assert(moving.every(r=>r.animations>0));
 await sleep(1100);await p.screenshot({path:path.join(out,'after.png')});assert.equal(await p.locator('.stats-rank').first().getAttribute('data-id'),'qa-b');
 await p.evaluate(()=>statsDialog.close());await sleep(300);await p.evaluate(r=>__rankFixture(r),[{...b,points:120,wins:2},a]);await sleep(400);assert.equal(await p.locator('.stats-rank').first().evaluate(r=>r.getAnimations().filter(a=>a.id==='hp-rank-shift').length),0,'unchanged ranking must not replay');
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({ok:true,moving,fixture:true},null,2));await p.close();
}finally{await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
