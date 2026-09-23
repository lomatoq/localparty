const {test}=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),WS=require('ws');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
test('network ballot: partial, tie, unique winner, load barrier, no duplicate start or replay',{timeout:30000},async()=>{
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});
 let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);const sockets=[];
 async function until(fn,label){for(let i=0;i<400;i++){if(fn())return;await delay(25);}throw Error(label+' '+logs.slice(-800));}
 try {
 await until(()=>/localhost:(\d+)/.test(logs),'boot');const origin='http://127.0.0.1:'+logs.match(/localhost:(\d+)/)[1];
 const html=await(await fetch(origin+'/host')).text(),key=JSON.parse(html.match(/window.PARTY_HOST_KEY=(.*?);/)[1]);
 async function connect(name){const ws=new WS(origin.replace('http','ws')+'/lobby');sockets.push(ws);ws.messages=[];ws.on('message',d=>{const m=JSON.parse(d);ws.messages.push(m);if(m.type==='state')ws.state=m;if(m.type==='joined')ws.profile=m;});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});if(name){ws.send(JSON.stringify({type:'join',name}));await until(()=>ws.profile,'join');}return ws;}
 const send=(ws,m)=>ws.send(JSON.stringify({...m,instance:ws.state?.active?.instance}));
 const a=await connect('Native path'),b=await connect('Guest path'),c=await connect('Third');
 send(a,{type:'vote-game',id:'warsaw'});send(b,{type:'vote-game',id:'warsaw'});await until(()=>a.state.ballot.voted===2,'partial');assert.equal(a.state.active,null);
 send(b,{type:'vote-game',id:'tanks'});send(c,{type:'vote-game',id:'push'});await until(()=>a.state.ballot.reason==='tie','tie');assert.equal(a.state.active,null);
 send(b,{type:'vote-game',id:'warsaw'});await until(()=>a.state.ballot.winner==='warsaw','winner without screen');await delay(150);assert.equal(a.state.active,null);
 const host=await connect();send(host,{type:'host',key});await until(()=>host.state?.active?.id==='warsaw','screen triggers launch');
 assert.equal(host.state.votes.length,0);
 async function connectGame(player){const ws=new WS(origin.replace('http','ws')+'/games/warsaw/ws');sockets.push(ws);ws.messages=[];ws.on('message',d=>ws.messages.push(JSON.parse(d)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});ws.send(JSON.stringify({type:'join',partyId:player.profile.id,partyToken:player.profile.token}));await until(()=>ws.messages.some(m=>m.type==='joined'),'game join');return ws;}
 await Promise.all([a,b,c].map(connectGame));
 send(a,{type:'game-status',status:'ready'});send(b,{type:'game-status',status:'ready'});await delay(150);assert.equal(host.messages.some(m=>m.type==='session-start'),false,'wait for all controllers');
 send(c,{type:'game-status',status:'ready'});await until(()=>host.messages.some(m=>m.type==='session-start'),'auto-ready starts without Ready taps');
 send(c,{type:'game-status',status:'ready'});await delay(150);assert.equal(host.messages.filter(m=>m.type==='session-start').length,1);
 const instance=host.state.active.instance;for(const ws of [a,b,c])send(ws,{type:'vote-game',id:'tanks'});await until(()=>host.state.votes.length===3,'votes while active');assert.equal(host.state.active.instance,instance,'must not interrupt match');
 send(host,{type:'stop'});await until(()=>!host.state.active,'stop');await delay(250);assert.equal(host.state.active,null,'no auto replay');assert.equal(host.state.votes.length,0);
 send(a,{type:'vote-game',id:'warsaw'});send(b,{type:'vote-game',id:'tanks'});send(c,{type:'vote-game',id:'push'});await until(()=>!!host.state.active,'tie resolves automatically');assert.ok(['warsaw','tanks','push'].includes(host.state.active.id));
 }finally{for(const ws of sockets)ws.terminate();child.kill();await new Promise(r=>child.exitCode!==null?r():child.once('exit',r));}
});
