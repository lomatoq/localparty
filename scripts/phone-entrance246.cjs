'use strict';
// Isolated native dialog clock candidates. The shared style/material/art-flight
// sources are frozen; desktop WebKit is not physical phone/cast performance.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),express=require('express'),crypto=require('node:crypto');
const pw=require(process.env.PARTY_PLAYWRIGHT||'playwright'),catalog=require('../lib/catalog'),root=path.resolve(__dirname,'..'),frozen=path.join(root,'.localparty-build/perf246/phone-source-before');
const out=path.resolve(process.env.QA_OUTPUT||'output/playwright/performance246/phone/entrance'),engineName=process.env.QA_ENGINE||'webkit';fs.mkdirSync(out,{recursive:true});
const host=fs.readFileSync(path.join(root,'.localparty-build/perf246/phone-candidate/host.js'),'utf8');
const original=host.slice(host.indexOf('  function holdEntranceUntilPainted(d) {'),host.indexOf('  function close(id) {'));
const finite=`  function holdEntranceUntilPainted(d) {
    if(d.classList.contains('lp-dialog-resumed'))return;
    const entrance=d.getAnimations().filter(a=>a.effect?.target===d&&!a.effect.pseudoElement&&a.playState==='running'&&a.effect.getTiming().iterations!==Infinity);
    if(!entrance.length)return;
    entrance.forEach(a=>{a.pause();a.currentTime=1;});
    requestAnimationFrame(()=>requestAnimationFrame(()=>entrance.forEach(a=>{if(d.open&&a.playState==='paused')a.play();})));
  }
`;
const sources={baseline:host,finite:host.replace(original,finite),nohold:host.replace(original,'  function holdEntranceUntilPainted(d) {}\n')};
const report={engine:engineName,method:'Actual native Host Pick art tap, cold/warm/reversal; frozen shared material/art-flight; independent clock only; browser firstvisible/frames/layout, no physical-device assertion',sources:Object.fromEntries(Object.entries(sources).map(([k,s])=>[k,crypto.createHash('sha256').update(s).digest('hex')])),cases:[],errors:[]};
const fixture={catalog,players:[{id:'a',name:'Alexandra',gameReady:true,connected:true}],leaderboard:[],votes:[],screens:1,native:{ready:true,catalogReady:true},selected:'bowling',tv:{canCover:true,mode:'none',focusNumber:34,total:36}};
function sample(){const d=document.querySelector('#gameDetail'),art=document.querySelector('#detailArt'),r=d.getBoundingClientRect(),s=getComputedStyle(d);return {now:performance.now(),open:d.open,closing:d.classList.contains('lp-dialog-closing'),resumed:d.classList.contains('lp-dialog-resumed'),x:r.x,y:r.y,width:r.width,height:r.height,opacity:+s.opacity,transform:s.transform,translate:s.translate,art:{ready:art.complete&&art.naturalWidth>0,opacity:+getComputedStyle(art).opacity,src:art.getAttribute('src')},flight:document.querySelectorAll('.ux-flight').length,animations:d.getAnimations({subtree:true}).map(a=>({name:a.animationName||'waapi',target:a.effect?.target?.id||a.effect?.target?.className,pseudo:a.effect?.pseudoElement||'',iterations:a.effect?.getTiming().iterations,currentTime:Number(a.currentTime),state:a.playState}))};}
(async()=>{const server=express().use(express.static(path.join(root,'public'))).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));let browser;
try{browser=await pw[engineName].launch({headless:true,...(engineName==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
for(const variant of ['baseline','finite','nohold']){
 const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:3,recordVideo:{dir:out,size:{width:393,height:852}}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/*',route=>{const pathname=new URL(route.request().url()).pathname,old=path.join(frozen,'public'+pathname);if(pathname==='/native-shell/host.js')return route.fulfill({body:sources[variant],contentType:'application/javascript'});if(fs.existsSync(old)&&fs.statSync(old).isFile())return route.fulfill({path:old,contentType:old.endsWith('.css')?'text/css':old.endsWith('.html')?'text/html':'application/javascript'});return route.continue();});
 await page.addInitScript({content:"window.__partyPersistentTabs=true;window.__commands=[];window.webkit={messageHandlers:{partyShell:{postMessage:m=>__commands.push(m)}}};Math.random=()=>.25;\n"+fs.readFileSync(path.join(frozen,'public/native-shell/visibility.js'),'utf8')+'\n'+fs.readFileSync(path.join(frozen,'public/native-shell/tabs.js'),'utf8')});await page.goto('http://127.0.0.1:'+server.address().port+'/native-shell/index.html');await page.evaluate(f=>LocalPartyHost.update(f),fixture);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(850);
 await page.evaluate(({sample})=>{window.__sampleEntrance=(0,eval)('('+sample+')');window.__frames246=[];let active=false;window.__startEntrance=()=>{active=true;__frames246=[];window.__startTime246=performance.now();requestAnimationFrame(function frame(){__frames246.push(__sampleEntrance());if(active)requestAnimationFrame(frame);});};window.__stopEntrance=()=>{active=false;return __frames246.map(f=>({...f,elapsed:f.now-__startTime246}));};}, {sample:sample.toString()});
 for(const kind of ['cold','warm','reversal']){
  await page.evaluate(()=>__startEntrance());await page.locator('#choiceOpen').click();
  if(kind==='reversal'){await page.waitForTimeout(65);await page.locator('[data-close=gameDetail]').click();await page.waitForTimeout(65);await page.locator('#choiceOpen').evaluate(e=>e.click());}
  await page.waitForTimeout(1000);await page.waitForFunction(()=>{const d=document.querySelector('#gameDetail'),art=document.querySelector('#detailArt');return d.open&&!d.classList.contains('lp-dialog-closing')&&art.complete&&art.naturalWidth>0&&+getComputedStyle(art).opacity>.98&&!document.querySelector('.ux-flight')&&d.getAnimations({subtree:true}).every(a=>a.effect.getTiming().iterations===Infinity||['finished','idle'].includes(a.playState));},null,{timeout:3000});const frames=await page.evaluate(()=>__stopEntrance());const firstGeometry=frames.find(f=>f.open&&f.opacity>.02&&f.width>0),first=frames.find(f=>f.open&&f.opacity>.02&&f.width>0&&f.y<852&&f.y+f.height>0),settled=frames.find(f=>f.open&&!f.closing&&f.opacity>.98&&f.art.ready&&f.art.opacity>.98&&f.flight===0&&f.animations.every(a=>a.iterations===Infinity||a.state==='finished'||a.state==='idle'));
  report.cases.push({variant,kind,firstGeometry:firstGeometry?.elapsed,first:first?.elapsed,settled:settled?.elapsed,frames});assert(first,variant+' '+kind+' first visible viewport geometry');assert(settled,variant+' '+kind+' fully revealed art/finished finite effects');assert(await page.locator('#detailArt').evaluate(n=>n.complete&&n.naturalWidth>0));
  const file=`${engineName}-${variant}-${kind}.png`;await page.screenshot({path:path.join(out,file)});
  await page.locator('[data-close=gameDetail]').click();await page.waitForFunction(()=>!document.querySelector('#gameDetail').open);await page.waitForTimeout(200);assert.equal(await page.locator('.ux-flight').count(),0,'flight cleanup');assert.equal(await page.locator('#choiceArt').evaluate(n=>getComputedStyle(n).opacity),'1');assert(!(await page.locator('body').evaluate(n=>n.hasAttribute('data-hp-modal-present'))),'modal marker clean');
 }
 await context.close();
}
assert.deepEqual(report.errors,[]);report.ok=true;
}finally{await browser?.close();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,`${engineName}-report.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:report.ok,engine:engineName,cases:report.cases.map(({frames,...c})=>c)}));}
})().catch(e=>{console.error(e);process.exitCode=1});
