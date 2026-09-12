const fs=require('fs');const s=fs.readFileSync('tests/start-visibility.cjs','utf8');const prefix=s.slice(0,s.indexOf('for(const id of ids)')).replace("PARTY_NO_BROWSER:'1'","PARTY_NO_BROWSER:'1',TEST_FAST:'1'");const body=`
for(const id of ['push','tankarena','warsaw','naval']){
await host.evaluate(id=>qa.send(JSON.stringify({type:'launch',id})),id);await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);await phone.locator('#readyButton').click();const frame=host.frames().find(f=>f.url().includes('/games/'+id+'/'));await host.waitForFunction(()=>qaState?.active?.ui?.phase!=='waiting');
if(id==='warsaw'){for(let i=0;i<5;i++){await frame.locator('#reveal').click();await frame.locator('#next').click();}}
if(id==='naval')await frame.locator('#finish').click();
await host.waitForFunction(()=>qaState?.active?.ui?.phase==='results',null,{timeout:30000});await host.waitForTimeout(400);await host.screenshot({path:'tests/audit-results-host-'+id+'.png'});await phone.screenshot({path:'tests/audit-results-phone-'+id+'.png'});console.log('RESULTS',id);await host.evaluate(()=>qa.send(JSON.stringify({type:'stop'})));await host.waitForFunction(()=>!qaState.active);
}
}finally{await browser?.close();child.kill();}})().catch(e=>{console.error(e);process.exitCode=1});`;
fs.writeFileSync('tests/audit-results.cjs',prefix+body);
