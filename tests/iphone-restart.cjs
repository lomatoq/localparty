// Actual app process loss and relaunch; no debugger or fake execution grant.
const assert=require('node:assert/strict'),WS=require('ws'),{execFileSync}=require('node:child_process');
const device=process.env.PARTY_TEST_DEVICE||'B99A3347-E6C7-4D7B-8FBC-DF3F38DA90C4',base='http://127.0.0.1:8081',key='localparty-integration-test',all=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<300;i++){try{if(await fn())return;}catch{}await delay(100);}throw Error(label);}
async function manage(m){const r=await fetch(base+'/api/manage',{method:m?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:m?JSON.stringify(m):undefined,signal:AbortSignal.timeout(1500)});const s=await r.json();assert.equal(r.status,200,JSON.stringify(s));return s;}
async function socket(data,cookie=''){const ws=new WS(base.replace('http','ws')+'/lobby',{headers:{Cookie:cookie}});all.push(ws);ws.on('error',()=>{});ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='joined')ws.profile=m;});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});if(data){ws.send(JSON.stringify({...data,type:'join'}));await until(()=>ws.profile,'join');}return ws;}
function launch(){execFileSync('xcrun',['simctl','launch','--terminate-running-process',device,'com.localparty.launcher'],{env:{...process.env,SIMCTL_CHILD_PARTY_TEST_KEY:key}});}
(async()=>{try{
 execFileSync('xcrun',['simctl','install',device,'ios/build/Build/Products/Debug-iphonesimulator/LocalParty.app']);launch();await until(async()=>await manage(),'launch');
 await manage({type:'network-set',enabled:true});await manage({type:'stop'});for(const p of (await manage()).players)await manage({type:'kick',id:p.id});
 const r=await fetch(base+'/tv'),cookie=r.headers.get('set-cookie').split(';')[0],html=await r.text(),display=await socket(null,cookie);display.send(JSON.stringify({type:'display',key:JSON.parse(html.match(/PARTY_DISPLAY_KEY=(.*?);/)[1])}));
 const guests=[];for(let i=0;i<4;i++){const ws=await socket({name:'Restart '+i});guests.push(ws);}
 await manage({type:'settings',id:'tanks',settings:{mode:'ctf'}});const before=await manage({type:'launch',id:'tanks'});
 for(const g of guests)g.send(JSON.stringify({type:'vote-game',id:'tanks'}));
 await until(async()=>(await manage()).votes.length===4,'votes before restart');
 execFileSync('xcrun',['simctl','terminate',device,'com.localparty.launcher']);launch();
 await until(async()=>(await manage()).bootId!==before.bootId,'new process');
 const after=await manage();assert.equal(after.enabled,true);assert.equal(after.active,null);assert.equal(after.incident,null);assert.equal(after.networkEnabled,false);assert.equal(after.selected,'tanks');assert.equal(after.gameSettings.tanks.mode,'ctf');
 for(const g of guests){const resume=await socket(g.profile);assert.equal(resume.profile.id,g.profile.id);}
 assert.equal((await manage()).votes.length,0);assert.equal((await manage()).players.length,4);
 console.log('PASS actual iPhone app restart: quiet room recovery, four identities, cleared votes and preserved CTF settings');
 await manage({type:'dismiss-incident'});await manage({type:'network-set',enabled:false});launch();await until(async()=>await manage(),'clean restart');assert.equal((await manage()).enabled,true);assert.equal((await manage()).networkEnabled,false);assert.equal((await manage()).incident,null);
 console.log('PASS room ready after restart, Wi-Fi access off, no stale incident');
 }finally{for(const ws of all)ws.terminate();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
