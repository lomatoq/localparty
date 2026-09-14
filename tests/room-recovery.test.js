const {test}=require('node:test');
const assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),WS=require('ws');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<250;i++){if(await fn())return;await delay(20);}throw Error(label);}
test('16 guests: votes, duplicate sockets, removal, process loss, recovery and explicit stop',{timeout:45000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'party-recovery-'));let child,origin,screen;const sockets=[];
 async function boot(){let log='';child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PARTY_EMBEDDED:'1',PARTY_ADMIN_KEY:'test',PARTY_DATA_FILE:path.join(dir,'party.json'),PARTY_PORT:'0',PARTY_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);await until(()=>/localhost:(\d+)/.test(log),'server startup '+log);origin='http://127.0.0.1:'+log.match(/localhost:(\d+)/)[1];}
 async function command(data,status=200){const res=await fetch(origin+'/api/manage',{method:data?'POST':'GET',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});const body=await res.json();assert.equal(res.status,status,JSON.stringify(body));return body;}
 async function connect(data){const ws=new WS(origin.replace('http','ws')+'/lobby');sockets.push(ws);ws.messages=[];ws.on('error',()=>{});ws.on('message',raw=>{const m=JSON.parse(raw);ws.messages.push(m);if(m.type==='joined')ws.profile=m;});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});if(data){ws.send(JSON.stringify({...data,type:'join'}));await until(()=>ws.profile||ws.messages.some(m=>m.type==='kicked'),'join');}return ws;}
 async function kill(){const exited=new Promise(r=>child.once('exit',r));child.kill('SIGKILL');await exited;}
 try{
  await boot();assert.equal((await command()).enabled,false);await command({type:'server-start'});
  const guests=[];for(let i=0;i<16;i++)guests.push(await connect({name:'Guest '+i}));
  assert.equal((await command()).players.length,16);
  for(const g of guests)g.send(JSON.stringify({type:'vote-game',id:'tanks'}));
  await until(async()=>(await command()).votes.length===16,'votes');
  guests[0].send(JSON.stringify({type:'vote-game',id:'spy'}));await until(async()=>(await command()).votes.some(v=>v.playerId===guests[0].profile.id&&v.gameId==='spy'),'replace vote');assert.equal((await command()).votes.length,16);
  const outsider=await connect();outsider.send(JSON.stringify({type:'vote-game',id:'tanks'}));await until(()=>outsider.messages.some(m=>m.type==='error'),'unauthenticated vote');
  outsider.send(JSON.stringify({type:'kick',id:guests[1].profile.id}));assert.equal((await command()).players.length,16);
  const original=guests[0].profile;for(let i=0;i<10;i++){guests[0]=await connect(original);assert.equal(guests[0].profile.id,original.id);assert.equal((await command()).players.length,16);}
  await command({type:'kick',id:original.id});await until(()=>guests[0].messages.some(m=>m.type==='kicked'),'removed event');assert.equal((await command()).players.length,15);assert.equal((await command()).votes.length,15);
  const denied=await connect(original);assert.ok(!denied.profile);assert.ok(denied.messages.some(m=>m.type==='kicked'));
  await command({type:'settings',id:'tanks',settings:{mode:'ctf'}});const oldBoot=(await command()).bootId;
  await kill();await boot();let recovered=await command();assert.equal(recovered.enabled,true);assert.ok(recovered.incident?.message.includes('восстановлена'));assert.notEqual(recovered.bootId,oldBoot);assert.equal(recovered.selected,'tanks');assert.equal(recovered.gameSettings.tanks.mode,'ctf');
  for(let i=1;i<16;i++){const resumed=await connect(guests[i].profile);assert.equal(resumed.profile.id,guests[i].profile.id);}
  assert.equal((await command()).players.length,15);assert.equal((await command()).votes.length,15);assert.ok(!(await connect(original)).profile);
  await command({type:'dismiss-incident'});assert.equal((await command()).incident,null);
  await command({type:'server-stop'});await kill();await boot();recovered=await command();assert.equal(recovered.enabled,false);assert.equal(recovered.incident,null);
 }finally{for(const s of sockets)s.terminate();if(child?.exitCode===null)await kill();fs.rmSync(dir,{recursive:true,force:true});}
});
