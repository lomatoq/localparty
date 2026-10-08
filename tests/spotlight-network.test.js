const {test}=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),WS=require('ws');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
test('spotlight launch: authenticated guests only, display/count guards, simultaneous launch and active match safety',{timeout:30000},async()=>{
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);const sockets=[];
 async function until(fn){for(let i=0;i<400;i++){if(fn())return;await delay(25);}throw Error(logs.slice(-900));}
 try{await until(()=>/localhost:(\d+)/.test(logs));const origin='http://127.0.0.1:'+logs.match(/localhost:(\d+)/)[1];
 const html=await(await fetch(origin+'/host')).text(),key=JSON.parse(html.match(/window.PARTY_HOST_KEY=(.*?);/)[1]);
 async function connect(name){const w=new WS(origin.replace('http','ws')+'/lobby');sockets.push(w);w.messages=[];w.on('message',d=>{const m=JSON.parse(d);w.messages.push(m);if(m.type==='state')w.state=m;if(m.type==='joined')w.profile=m;});await new Promise(r=>w.once('open',r));if(name){w.send(JSON.stringify({type:'join',name}));await until(()=>w.profile);}return w;}
 const send=(w,m)=>w.send(JSON.stringify(m));const stranger=await connect();send(stranger,{type:'spotlight-launch',id:'push'});await until(()=>stranger.messages.some(m=>m.type==='error'));assert(!stranger.state?.active);
 const a=await connect('A');send(a,{type:'spotlight-launch',id:'push'});await until(()=>a.messages.some(m=>m.type==='error'));assert(!a.state.active);
 const tvHtml=await(await fetch(origin+'/tv')).text(),displayKey=JSON.parse(tvHtml.match(/window.PARTY_DISPLAY_KEY=(.*?);/)[1]);const tv=await connect();send(tv,{type:'display',key:displayKey});await until(()=>tv.messages.some(m=>m.type==='display-ok'));
 const host=await connect();send(host,{type:'host',key});await until(()=>host.messages.some(m=>m.type==='host-ok'));
 const errors=a.messages.filter(m=>m.type==='error').length;send(a,{type:'spotlight-launch',id:'push'});await until(()=>a.messages.filter(m=>m.type==='error').length>errors);assert(!a.state.active);
 const b=await connect('B');send(a,{type:'spotlight-launch',id:'push'});send(b,{type:'spotlight-launch',id:'warsaw'});await until(()=>a.state.active&&!a.state.busy);assert.equal(a.state.active.id,'push');const instance=a.state.active.instance;
 send(b,{type:'spotlight-launch',id:'warsaw'});await delay(200);assert.equal(a.state.active.instance,instance);
 assert.equal((await fetch(origin+'/game-spotlight.js')).status,200);assert.equal((await fetch(origin+'/game-spotlight.css')).status,200);
 }finally{sockets.forEach(w=>w.terminate());child.kill();await new Promise(r=>child.exitCode!==null?r():child.once('exit',r));}
});
