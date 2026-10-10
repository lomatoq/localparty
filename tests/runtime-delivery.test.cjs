'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),WS=require('ws');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let n=0;n<250;n++){const v=fn();if(v)return v;await wait(20);}throw Error(label);}
async function fixture(t,game,engine=game){
  const child=spawn(process.execPath,[path.join('games',engine,'server.js')],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:'0',PARTY_GAME_ID:game,PARTY_MANAGED:'0'},stdio:['ignore','pipe','pipe']});
  let log='';const sockets=[];child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
  t.after(async()=>{for(const s of sockets)s.terminate();if(child.exitCode===null){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}});
  const port=await until(()=>log.match(/(?:localhost:|127\.0\.0\.1:|port )(\d+)/)?.[1],game+' startup '+log),base='http://127.0.0.1:'+port;
  async function connect(){const ws=new WS(base.replace('http','ws')+'/ws');sockets.push(ws);ws.messages=[];ws.on('message',b=>ws.messages.push(JSON.parse(b)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return ws;}
  return {base,connect};
}
test('Air Hockey input does not amplify broadcasts and control still moves players',{timeout:15000},async t=>{
  const f=await fixture(t,'airhockey','tabletop'),host=await f.connect(),players=[];
  host.send(JSON.stringify({type:'host'}));
  for(let n=0;n<8;n++){const p=await f.connect();p.send(JSON.stringify({type:'join',data:{name:'P'+n}}));await until(()=>p.messages.some(m=>m.type==='joined'),'join');players.push(p);}
  host.send(JSON.stringify({type:'start'}));await until(()=>host.messages.some(m=>m.data?.phase==='playing'),'playing');
  const before=host.messages.findLast(m=>m.type==='state').data.players.map(p=>[p.x,p.y]);host.messages=[];
  for(let tick=0;tick<18;tick++){for(const p of players)p.send(JSON.stringify({type:'action',data:{action:'steer',x:1,y:.4}}));await wait(33);}
  const updates=host.messages.filter(m=>m.type==='state');assert(updates.length>=5&&updates.length<25,'bounded snapshot rate: '+updates.length);
  assert.notDeepEqual(updates.at(-1).data.players.map(p=>[p.x,p.y]),before);
});
test('Kart keeps full TV state and a compact controller snapshot across resume',{timeout:15000},async t=>{
  const f=await fixture(t,'kart'),host=await f.connect(),pad=await f.connect();
  pad.send(JSON.stringify({type:'join',name:'Driver'}));const id=await until(()=>pad.messages.find(m=>m.type==='joined'),'join');
  const small=await until(()=>pad.messages.find(m=>m.type==='state'&&!m.track),'compact state');assert(small.players.some(p=>p.id===id.player_id));assert((await until(()=>host.messages.find(m=>m.track),'TV track')).track.points.length);
  const resumed=await f.connect();resumed.send(JSON.stringify({type:'resume',player_id:id.player_id,token:id.token}));
  await until(()=>resumed.messages.some(m=>m.type==='joined'),'resume');assert((await until(()=>resumed.messages.find(m=>m.type==='state'&&!m.track),'resume state')).players.some(p=>p.id===id.player_id));
});
