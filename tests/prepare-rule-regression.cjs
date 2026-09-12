const fs=require('fs');let s=fs.readFileSync('tests/session-ux-browser.cjs','utf8');
s=s.replace("await phone.locator('#resumeButton').click();await host.waitForFunction(()=>!qaState.active.session.paused);await phone.locator('#sessionRules').click();", "await phone.locator('#sessionRules').click();");
s=s.replace("await phone.locator('#closeRules').click();", "await phone.locator('#closeRules').click();await phone.locator('#resumeButton').click();await host.waitForFunction(()=>!qaState.active.session.paused);await phone.waitForTimeout(250);");
fs.writeFileSync('tests/rules-pause-regression.cjs',s);
