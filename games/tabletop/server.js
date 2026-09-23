'use strict';
const express=require('express'),http=require('http'),crypto=require('crypto'),{WebSocketServer}=require('ws'),runtime=require('../../lib/party-runtime');
const {Poker}=require('./poker'),{Mines,Hockey}=require('./arcade');
const mode=process.env.PARTY_GAME_ID||'poker',engines={poker:Poker,airhockey:Hockey,mines:Mines};if(!engines[mode])throw Error('Unknown game');
const app=express(),server=http.createServer(app),wss=new WebSocketServer({server,path:'/ws',maxPayload:4096}),players=new Map(),sessions=new Map();
app.get('/host',(_,res)=>res.sendFile(__dirname+'/public/index.html'));app.use(express.static(__dirname+'/public'));
let game=null,eventId='',reported=false,started=0;const max=mode==='mines'?16:8;
const colors=['#c4ff71','#bd9bff','#77e0ff','#ff9bab','#ffd780','#7bffc5','#edb5ff','#b7bfff'];
const send=(ws,type,data)=>{if(ws.readyState===1&&ws.bufferedAmount<128*1024)ws.send(JSON.stringify({type,data}));};
function snapshot(id){const out={mode,phase:game?.phase||'waiting',...(game?game.view(id):{players:[...players.values()].map(p=>({id:p.id,name:p.name,color:p.color,connected:p.connected,score:0}))})};if(id){if(mode==='mines')delete out.cells;if(mode==='airhockey')delete out.puck;}return out;}
function broadcast(){for(const ws of wss.clients)if(ws.host||ws.pid)send(ws,'state',snapshot(ws.host?null:ws.pid));}
function start(){const roster=[...players.values()].filter(p=>p.connected);if(game?.phase==='playing')return false;if(roster.length<2||roster.length>max)return {ok:false,error:'Connect at least two players.'};if(mode==='airhockey'&&roster.length%2)return {ok:false,error:'Air hockey needs an even number of players.'};game=new engines[mode](roster);eventId=crypto.randomUUID();reported=false;started=Date.now();broadcast();return true;}
wss.on('connection',(ws,req)=>{let tokens=90,last=Date.now();ws.on('message',raw=>{
 const now=Date.now();tokens=Math.min(90,tokens+(now-last)*.06);last=now;if(--tokens<0)return ws.close(1008,'Rate limit');let m;try{m=JSON.parse(raw);}catch{return;}if(!m||typeof m!=='object')return;const d=m.data&&typeof m.data==='object'?m.data:{};
 if(m.type==='host'){const local=runtime.managed?req.headers['x-party-local']==='1':['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);if(local){ws.host=true;send(ws,'state',snapshot(null));}return;}
 if(m.type==='join'){
  let identity=runtime.identify(d,ws);if(runtime.managed&&!identity)return send(ws,'error','Join from the LocalParty menu.');
  if(!identity){identity=sessions.get(d.token);if(!identity){if(sessions.size>=64)return;identity={id:crypto.randomUUID(),name:String(d.name||'Player').trim().slice(0,24)||'Player',token:crypto.randomBytes(24).toString('hex')};sessions.set(identity.token,identity);}}
  if(ws.pid&&ws.pid!==identity.id)return;let p=players.get(identity.id);if(!p){if(players.size>=max)return send(ws,'error','This game is full.');if(game?.phase==='playing')return send(ws,'error','A match is running. Join the next match.');p={id:identity.id,name:identity.name,color:colors[players.size%colors.length],connected:true};players.set(p.id,p);}
  const old=p.ws;p.ws=ws;p.connected=true;ws.pid=p.id;if(old&&old!==ws)old.close(4001,'Reconnected');send(ws,'joined',{id:p.id,token:runtime.managed?null:identity.token});broadcast();return;
 }
 if(m.type==='start'&&ws.host&&!runtime.displayOnly){const result=start();if(result!==true)send(ws,'error',result.error||'Cannot start yet.');return;}
 const p=players.get(ws.pid);if(!p||p.ws!==ws||!game||runtime.paused)return;
 if(m.type==='action'&&game.phase==='playing'){const value=mode==='poker'?d.amount:mode==='mines'?(d.action==='select'?d.direction:d.index):d;if(game.action(p.id,d.action,value))broadcast();}
 });ws.on('close',()=>{const p=players.get(ws.pid);if(p?.ws===ws){p.connected=false;if(p.target)p.target={x:p.x,y:p.y};runtime.presence(p.id,false);broadcast();}});
});
runtime.onPause(()=>{for(const p of players.values())if(p.target){p.target={x:p.x,y:p.y};p.axis=null;}});
runtime.host({start});let last=Date.now(),elapsed=0;
runtime.setInterval(()=>{const now=Date.now(),dt=Math.min(.05,(now-last)/1000);last=now;if(game?.phase==='playing')game.step(dt);
 if(game?.phase==='results'&&!reported){reported=true;const ps=game.view(null).players,best=Math.max(...ps.map(p=>p.score));runtime.report({gameId:mode,eventId,duration:(Date.now()-started)/1000,players:ps.map(p=>({id:p.id,name:p.name,score:p.score,won:p.score===best}))});}
 runtime.ui({phase:game?.phase||'waiting',label:mode==='poker'?'Poker Night':mode==='mines'?'Mine Together':'Air Hockey',progress:mode==='poker'&&game?`${game.hand} / 5`:''});elapsed+=dt;if(elapsed>=(mode==='airhockey'?.05:.2)){elapsed=0;broadcast();}
},16);
server.listen(Number(process.env.PORT||0),runtime.managed?'127.0.0.1':'0.0.0.0',()=>{console.log('Tabletop '+mode+' port '+server.address().port);process.send?.({type:'ready',port:server.address().port});});
