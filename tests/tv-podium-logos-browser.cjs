'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright'),catalog=require('../lib/catalog');
(async()=>{
 const fixture=fs.readFileSync(path.join(__dirname,'../public/tv.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace('</body>','<script src="/tv-show.js"></script><script src="/game-logo-renderer.js"></script></body>');
 const server=express().get('/podium-fixture',(_q,r)=>r.type('html').send(fixture)).use(express.static(path.join(__dirname,'../public'))).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/podium-fixture');
  await page.evaluate(catalog=>{window.HeyPalsTVInvitation={presentation:()=>({src:'',room:'',hint:''})};window.testShow=LocalPartyShow.create(document.getElementById('tvStage'));testShow.setConnected(true);window.testCatalog=catalog;window.showBoard=(kind,game,key)=>testShow.update({bootId:'logo-test',catalog:testCatalog,players:[],tv:{mode:'podium',effects:false,board:{kind,game,key,title:kind==='company'?'Party rankings':testCatalog.find(g=>g.id===game)?.title||'Readable fallback',subtitle:'Results',rows:[{id:'a',name:'Player',rank:1,score:12}]}},active:{instance:'logo-run',id:testCatalog[0].id,session:{paused:false}}});},catalog);
  await page.route('**/assets/game-logos-v1/logos/push.png?*',r=>r.abort());await page.evaluate(()=>showBoard('match','push','missing-file'));await page.waitForTimeout(150);assert.equal(await page.locator('#tvBoardTitle img').count(),0);assert.equal(await page.locator('#tvBoardTitle').textContent(),catalog.find(g=>g.id==='push').title);
  await page.unroute('**/assets/game-logos-v1/logos/push.png?*');let release;const gate=new Promise(r=>release=r);await page.route('**/assets/game-logos-v1/logos/bomb.png?*',async r=>{await gate;await r.continue();});await page.evaluate(()=>{showBoard('match','bomb','late-image');showBoard('company',null,'company-after-match');});release();await page.waitForTimeout(250);assert.equal(await page.locator('#tvBoardTitle img').count(),0,'late match image must not replace company board');assert.equal(await page.locator('#tvBoardTitle').textContent(),'Party rankings');await page.unroute("**/assets/game-logos-v1/logos/bomb.png?*");
  for(const game of catalog){await page.evaluate(id=>showBoard('match',id,id),game.id);await page.waitForFunction(id=>{const i=document.querySelector('#tvBoardTitle img');return i?.getAttribute('src').includes('/'+id+'.png')&&i.naturalWidth>0;},game.id);assert.equal(await page.locator('#tvBoardTitle').getAttribute('aria-label'),game.title);}
  await page.evaluate(()=>showBoard('company',null,'company'));assert.equal(await page.locator('#tvBoardTitle img').count(),0);assert.equal(await page.locator('#tvBoardTitle').textContent(),'Party rankings');
  assert.deepEqual(errors,[]);
  console.log('PASS:36 game logos, company title, failed image fallback and late-load race; WebKit, reduced motion');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
