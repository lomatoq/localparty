const fs=require('fs');let s=fs.readFileSync('tests/start-visibility.cjs','utf8');
s=s.replace("await phone.waitForTimeout(700);",`await phone.waitForTimeout(700);if(id==='naval'){
const playerFrame=phone.frames().find(f=>f.url().includes('/games/naval/'));await playerFrame.locator('#grid button:enabled').first().click();
const broadcast=host.frames().find(f=>f.url().includes('/games/naval/'));await broadcast.waitForFunction(()=>document.querySelector('#broadcastEvents')?.textContent.includes('→'));
await host.screenshot({path:'tests/naval-broadcast-live.png'});
await broadcast.evaluate(()=>{const players=Array.from({length:16},(_,i)=>({id:'stress'+i,name:'Капитан '+(i+1),active:true,health:5}));renderNavalBroadcast({phase:'lobby',players});});
const fields=await broadcast.evaluate(()=>{const cards=[...document.querySelectorAll('.oceanCard')];return {count:cards.length,clipped:cards.some(el=>{const r=el.getBoundingClientRect();return r.bottom>innerHeight||r.right>innerWidth})}});assert.equal(fields.count,16);assert(!fields.clipped,'all16 fleets fit');await host.screenshot({path:'tests/naval-broadcast-16.png'});
}`);
fs.writeFileSync('tests/naval-broadcast-check.cjs',s);
