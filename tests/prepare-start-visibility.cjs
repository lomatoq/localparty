const fs=require('fs');let s=fs.readFileSync('tests/rules-pause-regression.cjs','utf8');
s=s.replace("await phone.waitForTimeout(700);",`await phone.waitForTimeout(700);
const gameFrame=host.frames().find(f=>f.url().includes('/games/'+id+'/'));
const stale=await gameFrame.evaluate(()=>[...document.querySelectorAll('#lobbyOverlay.hidden,#lobbyPanel.hidden,#lobbyView.hidden,#setup[hidden],#lobby.hidden')].filter(el=>el.getBoundingClientRect().width&&getComputedStyle(el).display!=='none').map(el=>el.id));
assert.deepEqual(stale,[],id+' old lobby must disappear');`);
fs.writeFileSync('tests/start-visibility.cjs',s);
