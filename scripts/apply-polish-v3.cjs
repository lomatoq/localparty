'use strict';
// Build-time migration only. CI commits these exact edits to the Alpha branch;
// users do NOT have to run a migration when starting LocalParty.
require('./apply-polish-v2.cjs');
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..');const changed=[];
function edit(file,fn){const p=path.join(root,file),s=fs.readFileSync(p,'utf8'),next=fn(s);if(next!==s){fs.writeFileSync(p,next);changed.push(file);}}
function replace(s,a,b){if(s.includes(b))return s;if(!s.includes(a))throw Error('v3 anchor missing: '+a.slice(0,100));return s.replace(a,b);}
edit('server.js',s=>{
 s=replace(s,'<base href="${prefix}/"><script src="/game-clock-client.js"></script><script src="/game-art.js"></script><script defer src="/game-art-dom.js"></script><script src="/bridge.js" data-prefix="${prefix}"></script>',
 '<base href="${prefix}/">${nativeLayout?\'\':\'<script src="/game-clock-client.js"></script><script src="/game-art.js"></script><script defer src="/game-art-dom.js"></script>\'}<script src="${nativeLayout?\'/native-bridge.js\':\'/bridge.js\'}" data-prefix="${prefix}"></script>');
 s=replace(s,"const files={'/shell-v2.css'","const files={'/native-bridge.js':'native-bridge.js','/shell-v2.css'");
 s=replace(s,"'.webp':'image/webp'","'.avif':'image/avif','.jpg':'image/jpeg','.webp':'image/webp'");
 s=replace(s,'const heartbeat=setInterval(()=>{for(const ws of clients)',`const startRelay=setInterval(()=>{if(active?.game.engine==='afterparty'&&active.session.startRequested&&!active.session.paused&&(active.ui?.phase||'waiting')==='waiting'){for(const ws of clients)if(ws.isHost)send(ws,{type:'session-start',instance:active.instance});}},400);\nconst heartbeat=setInterval(()=>{for(const ws of clients)`);
 s=replace(s,'closing=true;clearInterval(heartbeat);','closing=true;clearInterval(heartbeat);clearInterval(startRelay);');
 return s;
});
edit('public/app.js',s=>{
 s=replace(s,"const freshIds=['curling'","const freshIds=['curling'");
 return s;
});
edit('build-info.json',s=>{const o=JSON.parse(s);o.polish='venue-hud-v3';o.branch='alpha/party-sports-siege';return JSON.stringify(o,null,2)+'\n';});
console.log(JSON.stringify({migration:'venue-hud-v3',changed}));
