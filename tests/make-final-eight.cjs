const fs=require('fs'),path=require('path');
fs.writeFileSync('tests/audit-fast-clock.cjs',`if(['jenga','kart','tanks','western_duel','spy'].includes(process.env.PARTY_GAME_ID)){const r=require('../lib/party-runtime');const original=r.now;const start=original();const fast=()=>start+(original()-start)*40;r.now=fast;Date.now=fast;const interval=r.setInterval;r.setInterval=(fn,ms)=>interval(fn,Math.max(2,ms/40));}`);
let s=fs.readFileSync('tests/audit-results-more.cjs','utf8');s=s.replace("TEST_FAST:'1'","TEST_FAST:'1',NODE_OPTIONS:'--require '+JSON.stringify(path.resolve('tests/audit-fast-clock.cjs'))");s="const path=require('path');\n"+s;
s=s.replace("for(const id of ['monster','crane'])", "for(const id of ['jenga','kart','tanks','chaos','spy','crocodile','drawguess','western_duel'])");
const at=s.indexOf("if(id==='monster')");const end=s.indexOf("await host.waitForFunction(()=>['results'",at);
s=s.slice(0,at)+`if(id==='chaos'){for(let i=0;i<15;i++){await frame.evaluate(()=>__OC_DEBUG.completeRound());await host.waitForTimeout(1350);}}
if(id==='crocodile'){for(let i=0;i<6;i++){await frame.locator('#end').click();await host.waitForTimeout(200);if(await frame.locator('#next').isVisible())await frame.locator('#next').click();await host.waitForTimeout(200);}}
if(id==='drawguess'){for(let i=0;i<2;i++){await frame.locator('#end').click();await host.waitForTimeout(3400);}}
if(id==='spy'){await frame.locator('#forcePlayBtn').click();}
`+s.slice(end);s=s.replace("['results','reveal'].includes(qaState?.active?.ui?.phase)","qaState?.active?.ui?.phase==='results'");s=s.replace('timeout:35000','timeout:65000');
fs.writeFileSync('tests/audit-results-final-eight.cjs',s);
