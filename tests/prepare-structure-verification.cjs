const fs=require('fs');let s=fs.readFileSync('tests/structure-audit.cjs','utf8');
s=s.replace("console.log(id,JSON.stringify(data));",`assert(data.rules&&data.rules.length>60,id+' has game-specific rules');
 assert.equal(await frame.locator('.lp-lobby-rules:visible').count(),1,id+' rules visible');
 await frame.locator('.lp-lobby-rules summary').click();assert(await frame.locator('.lp-lobby-rules').evaluate(el=>el.open),id+' rules open');
 await frame.locator('.lp-lobby-rules summary').click();
 console.log('PASS',id,'visible game-specific rules open and close');`);
fs.writeFileSync('tests/structure-verification.cjs',s);
