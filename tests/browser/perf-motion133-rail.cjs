'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),engines=require('playwright');
(async()=>{
 const rows=[];
 for(const engine of ['webkit','chromium']){
  const browser=await engines[engine].launch({headless:true,...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
  try{for(const displayOnly of [false,true]){
   const page=await browser.newPage({viewport:{width:800,height:600}});
   await page.setContent('<style>.fresh-track{display:flex;width:300px;overflow:auto}.fresh-track>.game{min-width:180px;flex:0 0 180px}img{display:none}</style><main id="catalog"></main>');
   await page.addScriptTag({path:'public/tv.js'});
   await page.evaluate(displayOnly=>{const catalog=LocalPartyCatalog.create(document.querySelector('#catalog'),{displayOnly});catalog.update({catalog:['curling','bowling','swarm_gate','peek_shoot'].map(id=>({id,title:id,min:1,max:4,color:'#ffffff'})),players:[],votes:[]});},displayOnly);
   await page.waitForTimeout(60);
   const result=await page.evaluate(async()=>{
    const track=document.querySelector('.fresh-track'),arrows=[...document.querySelectorAll('.fresh-arrow')],rows=[],wait=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const state=()=>({left:track.style.getPropertyValue('--fresh-fade-left'),right:track.style.getPropertyValue('--fresh-fade-right'),disabled:arrows.map(e=>e.disabled)});
    const mutations=[];const observer=new MutationObserver(rs=>mutations.push(...rs.map(r=>r.attributeName)));observer.observe(track,{attributes:true,attributeFilter:['style']});arrows.forEach(a=>observer.observe(a,{attributes:true,attributeFilter:['disabled']}));
    for(const [label,x] of [['start',0],['middle',90],['same-edge',130],['end',track.scrollWidth-track.clientWidth],['return-start',0]]){mutations.length=0;track.scrollLeft=x;track.dispatchEvent(new Event('scroll'));await wait();rows.push({label,...state(),mutations:[...mutations]});}
    mutations.length=0;for(let i=0;i<8;i++){track.dispatchEvent(new Event('scroll'));await wait();}const repeated=[...mutations];observer.disconnect();return{rows,repeated};
   });
   const expected=[['0px','22px',[true,false]],['22px','22px',[false,false]],['22px','22px',[false,false]],['22px','0px',[false,true]],['0px','22px',[true,false]]];
   result.rows.forEach((r,i)=>{assert.equal(r.left,expected[i][0]);assert.equal(r.right,expected[i][1]);assert.deepEqual(r.disabled,displayOnly?[]:expected[i][2]);});
   assert.deepEqual(result.rows[2].mutations,[]);assert.deepEqual(result.repeated,[]);rows.push({engine,displayOnly,...result});await page.close();
  }}finally{await browser.close();}
 }
 const out='output/playwright/perf-motion133-rail';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({ok:true,rows},null,2));console.log(JSON.stringify({ok:true,rows}));
})().catch(e=>{console.error(e);process.exitCode=1;});
