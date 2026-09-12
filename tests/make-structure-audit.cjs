const fs=require('fs');let s=fs.readFileSync('tests/lobby-picker.cjs','utf8');
const begin=s.indexOf("await host.evaluate(()=>qa.send(JSON.stringify({type:'launch',id:'millionaire'})))");
const end=s.indexOf('assert.deepEqual(report.errors,[])',begin);
s=s.slice(0,begin)+`
await host.setViewportSize({width:3430,height:1300});
for(const id of ['push','shrink','knives','bomb','western','tanks','tankarena','chaos','kart','monster','spy','millionaire','sinyakquiz','warsaw','crocodile','jenga','crane','naval','drawguess','western_duel']){
 await host.evaluate(id=>qa.send(JSON.stringify({type:'launch',id})),id);
 await phone.waitForFunction(id=>document.querySelector('#gameFrame').src.includes('/games/'+id+'/'),id);
 await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);
 await host.waitForTimeout(250);
 const frame=host.frames().find(f=>f.url().includes('/games/'+id+'/'));
 const data=await frame.evaluate(()=>({rules:document.querySelector('.lp-lobby-rules')?.textContent,card:document.querySelector('.lp-start-card')?.outerHTML.slice(0,180),starts:[...document.querySelectorAll('button')].filter(b=>/начать|старт/i.test(b.textContent)).map(b=>({id:b.id,parent:b.parentElement.outerHTML.slice(0,150)}))}));
 console.log(id,JSON.stringify(data));
 if(['push','monster','tankarena','millionaire'].includes(id))await host.screenshot({path:'tests/structure-'+id+'.png'});
 await host.evaluate(()=>qa.send(JSON.stringify({type:'stop'})));await host.waitForFunction(()=>!qaState.active);
}
`+s.slice(end);fs.writeFileSync('tests/structure-audit.cjs',s);
