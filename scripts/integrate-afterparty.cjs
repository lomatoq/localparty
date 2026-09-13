'use strict';
// Idempotent overlay installer. The branch already contains its output after CI materialization.
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
function edit(file,fn){const name=path.join(ROOT,file),old=fs.readFileSync(name,'utf8').replace(/\r\n/g,'\n'),next=fn(old);if(next!==old)fs.writeFileSync(name,next);}
function once(text,from,to){if(text.includes(to))return text;const count=text.split(from).length-1;if(count!==1)throw Error(`Expected one integration anchor, got ${count}: ${from.slice(0,90)}`);return text.replace(from,to);}
const additions=require('../games/afterparty/catalog.json').map(g=>({...g,artwork:'/assets/games/'+g.id+'.svg'}));
const catalog=JSON.parse(fs.readFileSync(path.join(ROOT,'catalog.json'),'utf8'));
for(const game of additions){const i=catalog.findIndex(g=>g.id===game.id);if(i<0)catalog.push(game);else catalog[i]=game;}
fs.writeFileSync(path.join(ROOT,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
edit('server.js',text=>{
  text=once(text,"const addresses = () =>", "const updater = require('./lib/updater').createUpdater({root:ROOT,isLocal:local,hostKey,isIdle:()=>!active&&!busy&&!closing,shutdown,getPort:()=>PORT,scheme});\nconst addresses = () =>");
  text=once(text,"async function launch(id){\n  if(busy)throw Error('Подождите окончания запуска.');", "async function launch(id){\n  if(busy||updater.busy)throw Error('Подождите окончания запуска или обновления.');");
  text=once(text,"const handler=async(req,res)=>{\n  const url=new URL(req.url,'http://localhost');", "const handler=async(req,res)=>{\n  const url=new URL(req.url,'http://localhost');\n  if(await updater.handle(req,res,url))return;");
  text=once(text,"if(url.pathname==='/api/health')return json(res,200,{ok:true});", "if(url.pathname==='/api/health')return json(res,200,{ok:true,version:require('./build-info.json').version,pid:process.pid});");
  text=once(text,"server.on('upgrade',(req,socket,head)=>{\n  const url=new URL(req.url,'http://localhost');", "server.on('upgrade',(req,socket,head)=>{\n  const url=new URL(req.url,'http://localhost');\n  if(req.headers.origin&&req.headers.origin!==`${scheme}://${req.headers.host}`){socket.destroy();return;}");
  return text;
});
edit('public/app.js',text=>{
  text=once(text,"const freshIds=['taprace','punchmeter','flappy','hungry','snakelines','carryball'];", "const freshIds=['curling','bowling','gate_siege','pop_shots','taprace','punchmeter','flappy','hungry','snakelines','carryball'];");
  text=once(text,"artwork.src='/assets/games/'+(g.id==='tankarena'?'tankarena-hd':g.id)+'.webp?v=0.6-premium';", "artwork.src=g.artwork||('/assets/games/'+(g.id==='tankarena'?'tankarena-hd':g.id)+'.webp?v=0.6-premium');");
  return text.replace("track.setAttribute('aria-label','Шесть новых игр')","track.setAttribute('aria-label','Новые игры LocalParty')");
});
edit('public/index.html',text=>once(text,'<link rel="stylesheet" href="/fresh.css">','<link rel="stylesheet" href="/fresh.css"><link rel="stylesheet" href="/updates.css"><script src="/updates.js" defer></script>'));
for(const file of ['package.json','package-lock.json']){
  const data=JSON.parse(fs.readFileSync(path.join(ROOT,file),'utf8'));data.version='0.7.0-alpha.1';if(data.packages?.[''])data.packages[''].version=data.version;fs.writeFileSync(path.join(ROOT,file),JSON.stringify(data,null,2)+'\n');
}
edit('scripts/package-release.cjs',text=>{
  text=once(text,'const GAME_COUNT=26;','const GAME_COUNT=30;');
  text=once(text,"...catalog.map(g=>'public/assets/games/'+g.id+'.webp')", "...catalog.map(g=>g.artwork?'public/'+g.artwork.replace(/^\\//,''):'public/assets/games/'+g.id+'.webp')");
  text=once(text,"['server.js','catalog.json','package.json','package-lock.json','README.md','RELEASE_NOTES.md','ARCHIVE_AUDIT.md']", "['server.js','catalog.json','package.json','package-lock.json','build-info.json','README.md','README_ALPHA.md','RELEASE_NOTES.md','ARCHIVE_AUDIT.md']");
  return text;
});
edit('README.md',text=>text.includes('README_ALPHA.md')?text:text.replace('# Local Party','# Local Party\n\n> **This branch: 0.7.0-alpha.1 · 30 games.** Four new games and a host-only Stable/Alpha updater. See [Alpha instructions and verification](README_ALPHA.md). The portable release instructions below describe the published stable 0.6.2 packages; an Alpha portable release has not been published by this patch.'));
edit('RELEASE_NOTES.md',text=>text.startsWith('# 0.7.0-alpha.1')?text:'# 0.7.0-alpha.1 — Sports, Siege & Gallery\n\n- 3D curling with team sweeping and three ends.\n- Rapier 3D bowling with swipe/spin controls and 5/10-frame scoring.\n- Cooperative gate defence, eight scaled waves, overheating and repairs.\n- Cover-based shooting gallery with a manually triggered five-second machine gun.\n- Local-host-only Stable/Alpha update UI, verified staging, profile preservation and rollback.\n- No new production dependencies; original LAN lobby, identities, pause and results reused.\n- Source Alpha only: no portable Alpha asset has been published by this change.\n\n'+text);
console.log('Integrated Afterparty: '+catalog.length+' games, version 0.7.0-alpha.1');
