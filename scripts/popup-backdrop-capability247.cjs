'use strict';
// Rendering capability diagnostic, not an app or performance test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require('playwright');
const engine=process.env.QA_ENGINE||'webkit',headed=process.env.QA_HEADED==='1',out=path.resolve(process.env.QA_OUTPUT||'output/playwright/performance247/backdrop-capability');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await pw[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:!headed}:{headless:!headed});const report={engine,headed,method:'Minimal HTML checker+constant8px blur capability; no HeyPals source, no timings/device claim.',cases:[]};try{
 const page=await browser.newPage({viewport:{width:393,height:852}});
 const modes=['sharp','branch-filter','body-static','body-prefixed','body-unprefixed','body-transform','body-will-change','body-animated','body-animated-cancelled','body-wrapper','wrapper-opacity','body-isolation','stage-isolation','stage-opacity','body-filter-root','popover-static','dialog-backdrop'];
 for(const mode of (process.env.QA_MODES?process.env.QA_MODES.split(','):modes)){
  await page.setContent(`<style>html,body{margin:0;background:#202020}.checker{position:fixed;inset:0;background:repeating-linear-gradient(0deg,#fff 0 2px,#000 2px 4px)}.veil,.wrapper{position:fixed;inset:0;margin:0;padding:0;border:0;width:100vw;height:100vh;max-width:none;max-height:none}.veil{background:#0004;${mode==='body-prefixed'?'-webkit-backdrop-filter:blur(8px)':mode==='body-unprefixed'?'backdrop-filter:blur(8px)':'-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)'}}.veil::backdrop{background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none}.wrapper>.veil{position:absolute}dialog{background:#888;border:0;width:200px;height:100px}dialog::backdrop{background:#0004;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}</style><div class=checker></div>`);
  await page.evaluate(async mode=>{
   if(mode==='sharp')return;
   if(mode==='branch-filter'){document.querySelector('.checker').style.filter='blur(8px)';return;}
   if(mode==='dialog-backdrop'){const d=document.createElement('dialog');document.body.append(d);d.showModal();return;}
   const veil=document.createElement('div');veil.className='veil';
   if(mode==='popover-static'){veil.setAttribute('popover','manual');document.body.append(veil);veil.showPopover();}
   else if(mode==='body-wrapper'||mode==='wrapper-opacity'){const wrapper=document.createElement('div');wrapper.className='wrapper';if(mode==='body-wrapper')wrapper.style.willChange='opacity';else wrapper.style.opacity='1';wrapper.append(veil);document.body.append(wrapper);}
   else{if(mode.startsWith('stage-')){const stage=document.createElement('div');stage.className='wrapper';if(mode==='stage-isolation')stage.style.isolation='isolate';else stage.style.opacity='.99';stage.append(document.querySelector('.checker'),veil);document.body.append(stage);}else document.body.append(veil);if(mode==='body-isolation')document.body.style.isolation='isolate';if(mode==='body-filter-root')document.body.style.filter='blur(0px)';if(mode==='body-transform')veil.style.transform='translateZ(0)';if(mode==='body-will-change')veil.style.willChange='transform,opacity';if(mode.startsWith('body-animated')){const a=veil.animate([{opacity:0},{opacity:1}],{duration:180});await a.finished;if(mode==='body-animated-cancelled')a.cancel();}}
  },mode);await page.waitForTimeout(60);
  const file=engine+'-'+mode+'.png',bytes=await page.screenshot({path:path.join(out,file)});
  const data=await page.evaluate(async base=>{const i=new Image();i.src='data:image/png;base64,'+base;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const ctx=c.getContext('2d');ctx.drawImage(i,0,0);const p=ctx.getImageData(8,20,8,48).data;let sum=0,n=0;for(let y=1;y<48;y++)for(let x=0;x<8;x++)for(let k=0;k<3;k++){sum+=Math.abs(p[(y*8+x)*4+k]-p[((y-1)*8+x)*4+k]);n++;}const node=document.querySelector('.veil'),s=node&&getComputedStyle(node);const checker=document.querySelector('.checker'),r=checker.getBoundingClientRect();return{energy:sum/n,filter:s&&(s.backdropFilter||s.webkitBackdropFilter),opacity:s?.opacity,checkerRect:{x:r.x,y:r.y,width:r.width,height:r.height},valid:r.width>=393&&r.height>=852};},bytes.toString('base64'));
  report.cases.push({mode,file,...data});
 }
 const sharp=report.cases.find(c=>c.mode==='sharp').energy;assert(sharp>50);for(const c of report.cases)c.ratio=c.energy/sharp;
 }finally{await browser.close();fs.writeFileSync(path.join(out,engine+'-report.json'),JSON.stringify(report,null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
