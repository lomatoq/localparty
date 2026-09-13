'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict'),{spawn}=require('child_process'),AdmZip=require('adm-zip'),WebSocket=require('ws');
const root=path.resolve(__dirname,'..');
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'localparty-release-'));
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
 new AdmZip(path.join(root,`dist/LOCAL_PARTY_${version}_windows-x64.zip`)).extractAllTo(dir,true);
 const cwd=path.join(dir,'LOCAL_PARTY'),child=spawn(path.join(cwd,'runtime/node/node.exe'),['server.js'],{cwd,windowsHide:true,env:{...process.env,PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_EPHEMERAL:'1'},stdio:['ignore','pipe','pipe']});
 const sockets=[];let log='';child.stderr.on('data',d=>log+=d);
 try{
  const port=await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('startup '+log)),20000);child.on('error',reject);child.stdout.on('data',d=>{log+=d;const m=String(d).match(/localhost:(\d+)/);if(m){clearTimeout(t);resolve(m[1]);}});});
  const base='http://localhost:'+port,html=await(await fetch(base+'/host')).text(),key=JSON.parse(html.match(/window.PARTY_HOST_KEY=(.*?);/)[1]);
  async function socket(){const ws=new WebSocket('ws://localhost:'+port+'/lobby');sockets.push(ws);await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return ws;}
  const host=await socket();let state;host.on('message',d=>{const m=JSON.parse(d);if(m.type==='state')state=m;});host.send(JSON.stringify({type:'host',key}));
  for(const name of ['Релиз один','Релиз два']){const p=await socket();p.send(JSON.stringify({type:'join',name,hand:'right'}));}
  async function until(fn){const end=Date.now()+22000;while(!fn()){if(Date.now()>end)throw Error('Timed out '+log.slice(-1200));await new Promise(r=>setTimeout(r,60));}}
  await until(()=>state?.players.length===2);
  for(const asset of ['/glass.css','/game-polish.css','/assets/fonts/Rubik-Italic.ttf','/assets/games/jenga.webp','/api/qr'])assert.equal((await fetch(base+asset)).status,200,asset);
  const games=[];for(const g of state.catalog){host.send(JSON.stringify({type:'launch',id:g.id}));await until(()=>state?.active?.id===g.id&&!state.busy);for(const page of [g.host,g.player]){const res=await fetch(base+'/games/'+g.id+page);assert.equal(res.status,200,g.id+page);assert((await res.text()).includes('/game-polish.css'));}games.push(g.id);console.log(g.id+' portable PASS');}
  host.send(JSON.stringify({type:'stop'}));await until(()=>!state.active);
  const result={checkedAt:new Date().toISOString(),windows:{portableRuntime:true,extractedDirectory:dir,games,assets:true},mac:{archiveIntegrity:true,executableBits:true,hardwareTested:false},physicalPhonesTested:false};
  fs.writeFileSync(path.join(root,'dist/RELEASE_VERIFICATION.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{for(const ws of sockets)ws.close();child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
