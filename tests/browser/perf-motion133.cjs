'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const engine=process.env.QA_ENGINE||'webkit',engines=require('playwright');
const output=path.resolve(process.env.QA_OUTPUT||'output/playwright/perf-motion133-'+engine);
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await engines[engine].launch({headless:true,...(engine==='chromium'&&process.env.QA_CHROMIUM?{executablePath:process.env.QA_CHROMIUM}:{})});
 try{
 const page=await browser.newPage({viewport:{width:393,height:852}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<body class="tv-screen"><main>'+Array.from({length:300},(_,i)=>'<div class="score-value" id="value'+i+'"><span>0</span></div>').join('')+'</main></body>');
 await page.addStyleTag({path:'public/motion.css'});
 await page.addScriptTag({path:process.env.QA_MOTION_SOURCE||'public/motion.js'});
 await page.waitForTimeout(80);
 await page.evaluate(()=>{
  window.scans=[];const original=Element.prototype.querySelectorAll;
  Element.prototype.querySelectorAll=function(selector){const result=original.call(this,selector);if(selector.includes('.points'))scans.push({tag:this.tagName,count:result.length});return result;};
  document.body.classList.add('unrelated-shell-state');
 });
 await page.waitForTimeout(60);
 const unrelated=await page.evaluate(()=>scans.splice(0));
 await page.evaluate(()=>document.querySelector('#value0 span').firstChild.data='1');
 await page.waitForTimeout(60);
 const nested=await page.evaluate(()=>({text:document.querySelector('#value0').dataset.lpMotionText,pulse:document.querySelector('#value0').classList.contains('lp-motion-pulse'),scans:scans.splice(0)}));
 await page.evaluate(()=>{const x=document.createElement('section');x.innerHTML='<div data-motion-value id="newValue"><span>10</span></div>';document.body.append(x);});
 await page.waitForTimeout(60);
 const inserted=await page.evaluate(()=>document.querySelector('#newValue').dataset.lpMotionText);
 await page.evaluate(()=>{const s=document.querySelector('#newValue span');s.textContent='11';s.textContent='10';});
 await page.waitForTimeout(60);
 const settled=await page.evaluate(()=>document.querySelector('#newValue').classList.contains('lp-motion-pulse'));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>document.querySelector('#newValue span').textContent='12');
 await page.waitForTimeout(60);
 const reduced=await page.evaluate(()=>({text:document.querySelector('#newValue').dataset.lpMotionText,pulse:document.querySelector('#newValue').classList.contains('lp-motion-pulse')}));
 const result={engine,source:process.env.QA_MOTION_SOURCE||'public/motion.js',unrelated,nested,inserted,settled,reduced,errors};
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 if(!process.env.QA_BASELINE){assert.deepEqual(unrelated,[]);assert.equal(nested.text,'1');assert(nested.pulse);assert.deepEqual(nested.scans,[]);assert.equal(inserted,'10');assert.equal(settled,false);assert.deepEqual(reduced,{text:'12',pulse:false});assert.deepEqual(errors,[]);}
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
