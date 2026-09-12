const fs=require('fs');let s=fs.readFileSync('tests/audit-results.cjs','utf8');s=s.slice(0,s.indexOf('for(const id of'));
s+=`for(const id of ['push','shrink','knives','bomb','western','tanks','tankarena','chaos','kart','monster','spy','millionaire','sinyakquiz','warsaw','crocodile','jenga','crane','naval','drawguess','western_duel']){
for(const p of [host,phone])await p.evaluate(()=>{window.flashSamples=[];window.flashAudit=true;const sample=()=>{const f=document.querySelector('#gameFrame');try{const d=f.contentDocument;if(d?.body&&getComputedStyle(f).opacity!=='0'&&f.src.includes('/games/'))flashSamples.push({url:f.src,managed:d.documentElement.classList.contains('party-managed'),fonts:d.fonts.status,styles:[...d.styleSheets].some(s=>s.href?.includes('game-polish.css')),body:d.body.innerText.slice(0,100)});}catch{}if(flashAudit)requestAnimationFrame(sample)};requestAnimationFrame(sample);});
await host.evaluate(id=>qa.send(JSON.stringify({type:'launch',id})),id);
await host.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);await host.waitForTimeout(40);await host.screenshot({path:'tests/audit-flash-early-'+id+'.png'});
await host.waitForFunction(()=>document.querySelector('#gameFrame').dataset.loading==='false');await phone.waitForFunction(()=>document.querySelector('#gameFrame').dataset.loading==='false');await host.waitForTimeout(250);
const samples=[];for(const p of [host,phone])samples.push(await p.evaluate(()=>{flashAudit=false;return flashSamples}));
const bad=samples.flat().filter(x=>!x.managed||!x.styles||x.fonts!=='loaded');console.log('FLASH',id,'visible frames',samples.map(x=>x.length).join('/'),'bad',bad.length);report.games.push({id,samples,bad});await host.screenshot({path:'tests/audit-flash-ready-'+id+'.png'});
await host.evaluate(()=>qa.send(JSON.stringify({type:'stop'})));await host.waitForFunction(()=>!qaState.active);
}fs.writeFileSync('tests/audit-loading-flash.json',JSON.stringify(report,null,2));}finally{await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1});`;
fs.writeFileSync('tests/audit-loading-flash.cjs',s);
