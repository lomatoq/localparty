'use strict';
// One-time, idempotent migration of the existing launcher. Every anchor is checked.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),changed=[];
function edit(file,change){const p=path.join(root,file),before=fs.readFileSync(p,'utf8'),after=change(before);if(after!==before){fs.writeFileSync(p,after);changed.push(file);}}
function replace(s,a,b){if(s.includes(b))return s;if(!s.includes(a))throw Error('Migration anchor missing: '+a.slice(0,90));return s.replace(a,b);}
edit('server.js',s=>{
 s=replace(s,"if(type.includes('text/html')){","if(type.includes('text/html')){\n    const nativeLayout=/data-party-layout=[\"']native-v2[\"']/i.test(text);");
 s=replace(s,"text=text.replace(/<\\/head>/i,'<link rel=\"stylesheet\" href=\"/game-polish.css\"></head>');","if(!nativeLayout)text=text.replace(/<\\/head>/i,'<link rel=\"stylesheet\" href=\"/game-polish.css\"></head>');");
 s=replace(s,"const files={'/':'index.html'","const files={'/shell-v2.css':'shell-v2.css','/shell-v2.js':'shell-v2.js','/':'index.html'");
 return s;
});
edit('public/index.html',s=>s.includes('/shell-v2.css')?s:s.replace('</head>','<link rel="stylesheet" href="/shell-v2.css"><script defer src="/shell-v2.js"></script></head>'));
edit('public/bridge.js',s=>{
 s=replace(s,"if (!document.documentElement.classList.contains('party-host')) return;","if (!document.documentElement.classList.contains('party-host') || document.documentElement.dataset.partyLayout==='native-v2') return;");
 s=replace(s,"if(!document.documentElement.classList.contains('party-host'))return;","if(!document.documentElement.classList.contains('party-host')||document.documentElement.dataset.partyLayout==='native-v2')return;");
 s=replace(s,'button.disabled = select.disabled;','button.disabled = select.disabled; button.hidden = select.hidden;');
 // Numeric fitting remains available to old engines, but never resizes authored HUDs.
 s=replace(s,'{const fitScript=document.createElement("script");','if(document.documentElement.dataset.partyLayout!=="native-v2"){const fitScript=document.createElement("script");');
 return s;
});
edit('public/app.js',s=>replace(s,'window.PARTY_GAME_INFO=titleGame;','window.PARTY_GAME_INFO=titleGame;document.body.dataset.game=titleGame?.id||"";document.body.classList.toggle("native-game",titleGame?.engine==="afterparty");'));
edit('games/afterparty/sports.js',s=>replace(s,'module.exports={Sports};','module.exports={Sports:require("./feel").enhanceSports(Sports)};'));
edit('games/afterparty/arcade.js',s=>replace(s,'module.exports={Arcade};','module.exports={Arcade:require("./feel").enhanceArcade(Arcade)};'));
edit('games/afterparty/server.js',s=>{
 s=replace(s,"'/game.css':'game.css'","'/game.css':'game.css','/venues.js':'venues.js','/sports-view.js':'sports-view.js','/arcade-view.js':'arcade-view.js','/motion.js':'motion.js'");
 s=replace(s,"if(m.type==='host'){","if(m.type==='ping'){send(ws,'pong',{client:d.client});return;}\n    if(m.type==='host'){");
 s=replace(s,"function broadcast(){", "let phoneFrame=0;\nfunction broadcast(){\n  phoneFrame++;");
 const previous="for(const ws of wss.clients){send(ws,'state',ws.host?full:slim);if(ws.pid)send(ws,'private',{id:ws.pid,spectator:!!game&&!game.players.some(p=>p.id===ws.pid),hand:players.get(ws.pid)?.hand||'right'});}";
 const next="for(const ws of wss.clients){if(ws.host||phoneFrame%2===0||!game)send(ws,'state',ws.host?full:slim);if(ws.pid){const privateState={id:ws.pid,spectator:!!game&&!game.players.some(p=>p.id===ws.pid),hand:players.get(ws.pid)?.hand||'right'},key=JSON.stringify(privateState);if(key!==ws.privateKey){ws.privateKey=key;send(ws,'private',privateState);}}}";
 s=replace(s,previous,next);
 return s;
});
edit('tests/afterparty-browser.cjs',s=>s.replace("phone.locator('details summary')","phone.locator('#ap-precise-open')").replace('hasText:/ЭНД/','hasText:/Энд/i'));
edit('build-info.json',s=>{const o=JSON.parse(s);if(o.polish==='venue-hud-v2')return s;o.polish='venue-hud-v2';return JSON.stringify(o,null,2)+'\n';});
console.log(JSON.stringify({migration:'venue-hud-v2',changed},null,2));
