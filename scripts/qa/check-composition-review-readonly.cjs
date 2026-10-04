'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const root=path.resolve(process.argv[2]),base=process.argv[3]||'http://127.0.0.1:17808';
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))),notesBefore=await fetch(base+'/api/notes').then(r=>r.json());
 const games=manifest.groups.filter(g=>g.section==='games');assert.equal(games.length,36);assert.equal(new Set(games.map(g=>g.id)).size,36);
 const tvOnly=manifest.tvOnly===true,hostGroups=manifest.groups.filter(g=>/^native-host-/.test(g.id));assert([0,2].includes(hostGroups.length));assert.equal(manifest.screens.length,tvOnly?74:122+hostGroups.length*3);
 if(tvOnly){assert.equal(manifest.groups.length,37);assert(manifest.screens.every(s=>s.surface==='tv'));assert.equal(hostGroups.length,0);assert.deepEqual(manifest.groups.filter(g=>g.section==='main').map(g=>g.id),['main-tv']);assert.equal(manifest.groups.filter(g=>g.section==='waiting').length,0);}
 const failures=[],assets=[];
 for(let start=0;start<manifest.screens.length;start+=8)await Promise.all(manifest.screens.slice(start,start+8).map(async s=>{
  const response=await fetch(base+'/'+s.file),bytes=Buffer.from(await response.arrayBuffer());
  assert.equal(response.status,200,s.file);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),s.sha256,s.file);
  assert.equal(bytes.readUInt32BE(16),s.pixelWidth);assert.equal(bytes.readUInt32BE(20),s.pixelHeight);assets.push(s.id);
 }));
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>failures.push(e.message));
  page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))failures.push('Unexpected write: '+r.method()+' '+r.url());});
  await page.goto(base);await page.locator('.group').nth(35).waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('textarea').count(),tvOnly?36:72);assert.equal(await page.locator('.screen-warning').count(),36);
  await page.locator('#search').fill('naval');assert.equal(await page.locator('.group').count(),1);assert.equal(await page.locator('.group').getAttribute('id'),'game-naval');
  await page.locator('.image-button').first().click();assert.equal(await page.locator('#viewer').evaluate(e=>e.open),true);await page.locator('#viewerImage').evaluate(e=>e.decode());
  assert.equal(await page.locator('#original').getAttribute('href'),manifest.screens.find(s=>s.id==='naval-tv-live').file);await page.locator('#closeViewer').click();
  await page.screenshot({path:path.join(root,'gallery-naval-check.png'),fullPage:true});
  await page.locator('#search').fill('');
  let mainProof=null;
  if(tvOnly){
   assert.equal(await page.locator('[data-section="waiting"]').count(),0);
   await page.locator('[data-section="main"]').click();assert.equal(await page.locator('.group').count(),1);assert.equal(await page.locator('.group').getAttribute('id'),'main-tv');assert.equal(await page.locator('textarea').count(),1);
   const main=manifest.screens.find(s=>s.id==='main-tv-lobby'),compact=manifest.screens.find(s=>s.id==='main-tv-lobby-compact');assert(main&&compact);assert.deepEqual(manifest.groups.find(g=>g.id==='main-tv').screenIds,[main.id]);
   const image=page.locator('.image-button img');await image.evaluate(e=>e.decode());assert.deepEqual(await image.evaluate(e=>[e.naturalWidth,e.naturalHeight]),[1920,1080]);
   await page.locator('.image-button').click();await page.locator('#viewerImage').evaluate(e=>e.decode());assert.equal(await page.locator('#original').getAttribute('href'),main.file);assert.deepEqual(await page.locator('#viewerImage').evaluate(e=>[e.naturalWidth,e.naturalHeight]),[1920,1080]);await page.locator('#closeViewer').click();
   const alternate=page.locator('a.screen-warning');assert.equal(await alternate.count(),1);assert.equal(await alternate.getAttribute('href'),compact.file);
   const alternatePage=await browser.newPage();try{await alternatePage.goto(new URL(compact.file,base+'/').href);const original=alternatePage.locator('img');await original.evaluate(e=>e.decode());assert.deepEqual(await original.evaluate(e=>[e.naturalWidth,e.naturalHeight]),[1280,720]);}finally{await alternatePage.close();}
   mainProof={group:'main-tv',primary:[1920,1080],alternate:[1280,720],decoded:true};
  }else{await page.locator('[data-section="main"]').click();assert.equal(await page.locator('.group').count(),2+hostGroups.length);
  await page.locator('[data-section="waiting"]').click();assert.equal(await page.locator('.group').count(),6);}
  await page.locator('[data-section="games"]').click();assert.equal(await page.locator('.group').count(),36);
  const visibleImageCounts=await page.locator('.image-button img').evaluateAll(async images=>{for(const image of images){image.loading='eager';await image.decode();}return images.length;});assert.equal(visibleImageCounts,tvOnly?36:72);
  assert.deepEqual(await fetch(base+'/api/notes').then(r=>r.json()),notesBefore,'Read-only review must preserve all notes');assert.deepEqual(failures,[]);
  const report={status:'passed',checkedAt:new Date().toISOString(),base,games:36,primaryPanels:tvOnly?37:72,screensAndAssets:assets.length,groups:manifest.groups.length,hostPanelGroups:hostGroups.length,alternateLinks:tvOnly?37:36,filters:tvOnly?['naval','main','games']:['naval','main','waiting','games'],mainProof,viewer:'passed',fonts:'loaded',notes:'unchanged',writes:0,errors:failures};
  fs.writeFileSync(path.join(root,'gallery-check.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
