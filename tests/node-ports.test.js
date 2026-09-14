const {test}=require('node:test'),assert=require('node:assert/strict'),{fork}=require('node:child_process'),{WebSocket}=require('ws'),path=require('node:path');
const profiles=Array.from({length:16},(_,i)=>({id:`port-player-${i}`,name:`Игрок ${i}`,token:`secret-${i}`,hand:'right'}));
function next(ws,predicate,ms=3000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',on);reject(new Error('Protocol timeout'));},ms);function on(raw){const d=JSON.parse(raw);if(predicate(d)){clearTimeout(timer);ws.off('message',on);resolve(d);}}ws.on('message',on);});}
async function connect(url){const ws=new WebSocket(url,{headers:{'x-party-local':'1'}});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return ws;}
for(const game of ['chaos','kart'])test(`${game}: 15 identities + 16th late, refresh takeover, late join, input, free port`,async t=>{
 const child=fork(path.resolve(`games/${game}/server.js`),[],{silent:true,env:{...process.env,PARTY_MANAGED:'1',PORT:'0',PARTY_ROSTER:JSON.stringify(profiles)}});const sockets=[];t.after(()=>{sockets.forEach(s=>s.terminate());child.kill();});
 const port=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(new Error('Server did not start: '+out)),5000);child.stdout.on('data',b=>{out+=b;const m=out.match(/127\.0\.0\.1:(\d+)/);if(m){clearTimeout(timer);resolve(+m[1]);}});child.stderr.on('data',b=>out+=b);});
 const host=await connect(`ws://127.0.0.1:${port}/ws${game==='chaos'?'?type=host':''}`);sockets.push(host);
 async function join(i){const ws=await connect(`ws://127.0.0.1:${port}/ws${game==='chaos'?'?type=controller':''}`);sockets.push(ws);const ack=next(ws,d=>d.type==='joined');ws.send(JSON.stringify({type:'join',partyId:profiles[i].id,partyToken:profiles[i].token,name:'wrong'}));const p=await ack;assert.equal(p.name,profiles[i].name);assert.equal(p.id||p.player_id,profiles[i].id);return ws;}
 for(let i=0;i<15;i++)await join(i);
 const old=sockets[1],closed=new Promise(r=>old.once('close',r));const replacement=await join(0);await closed;
 let statePromise=next(host,d=>game==='chaos'?d.type==='players':d.type==='state');
 if(game==='chaos'){host.send(JSON.stringify({type:'assign_roles',round:1,roles:Object.fromEntries(profiles.slice(0,15).map(p=>[p.name,['click']]))}));}else host.send(JSON.stringify({type:'host_start'}));
 let state=await statePromise;assert.equal(state.players.length,15);assert.equal(state.players.filter(p=>p.connected).length,15);
 const late=await join(15);state=await next(host,d=>(game==='chaos'?d.type==='players':d.type==='state')&&d.players.length===16).catch(async()=>{if(game==='chaos'){const pending=next(host,d=>d.type==='players');host.send(JSON.stringify({type:'assign_roles',round:1,roles:{}}));return pending;}throw new Error('Missing late join');});assert.equal(state.players.length,16);if(game==='kart')assert.equal(state.players.find(p=>p.id===profiles[15].id).in_race,true);
 if(game==='chaos'){const got=next(host,d=>d.type==='input'&&d.name===profiles[0].name);replacement.send(JSON.stringify({type:'input',control:'click',state:'down'}));await got;}
 const res=await fetch(`http://127.0.0.1:${port}/${game==='chaos'?'api/config':'api/info'}`);assert.equal((await res.json()).port,port);assert.equal((await fetch(`http://127.0.0.1:${port}/controller`)).status,200);
});
