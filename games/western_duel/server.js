'use strict';
const express=require('express'),http=require('http'),{WebSocketServer}=require('ws'),crypto=require('crypto'),runtime=require('../../lib/party-runtime'),{Tournament}=require('./game');
const app=express(),server=http.createServer(app),wss=new WebSocketServer({server,path:'/ws'}),game=new Tournament(),clients=new Map();let reported='';
app.get('/host',(_,res)=>res.sendFile(__dirname+'/public/host.html'));app.use(express.static(__dirname+'/public'));
function send(ws,type,data){if(ws.readyState===1)ws.send(JSON.stringify({type,data}));}
wss.on('connection',(ws,req)=>{ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return;}const d=m.data||{};
if(m.type==='host'){ws.host=runtime.managed?req.headers['x-party-local']==='1':['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);return;}
if(m.type==='join'){const p=runtime.identify(d);if(runtime.managed&&!p)return send(ws,'error','Вернитесь в главное меню');const id=p?.id||String(d.token||crypto.randomUUID());if(!game.players.has(id)&&game.players.size>=16)return send(ws,'error','Все 16 мест заняты');game.join(id,p?.name||String(d.name||'Ковбой').slice(0,24));clients.set(id,ws);ws.pid=id;send(ws,'joined',{id});return;}
if(m.type==='start'&&ws.host){if(['waiting','results'].includes(game.phase))game.start([...clients.keys()]);return;}
if(clients.get(ws.pid)!==ws)return;if(m.type==='shot')game.shot(ws.pid,d.duelId);
});ws.on('close',()=>{if(clients.get(ws.pid)===ws){clients.delete(ws.pid);runtime.presence(ws.pid,false);}});});
runtime.setInterval(()=>{game.tick();const state=game.view();for(const p of state.players){p.connected=clients.has(p.id);p.queued=game.roster&&!game.roster.includes(p.id)&&!['waiting','results'].includes(game.phase);}
if(game.phase==='results'&&reported!==game.eventId){reported=game.eventId;const top=Math.max(...state.players.map(p=>p.score));runtime.report({gameId:'western_duel',eventId:game.eventId,duration:(Date.now()-game.started)/1000,players:state.players.filter(p=>game.roster.includes(p.id)).map(p=>({id:p.id,name:p.name,score:p.score,won:p.score===top,metrics:{duels:p.appearances,falseStarts:p.falseStarts,...(p.bestReactionMs===null?{}:{reactionMs:p.bestReactionMs})}}))});}
runtime.ui?.({phase:game.phase==='waitingSignal'||game.phase==='draw'?'playing':game.phase,endsAt:game.phase==='waitingSignal'?null:game.endsAt,label:game.phase==='draw'?'Окно выстрела':'До следующей дуэли',currentPlayer:game.duel?.pair.map(id=>game.players.get(id).name).join(' × '),progress:`Дуэль ${game.index} / ${game.queue.length}`});for(const ws of wss.clients)send(ws,'state',state);},33);
server.listen(Number(process.env.PORT||0),runtime.managed?'127.0.0.1':'0.0.0.0',()=>{process.send?.({type:'ready',port:server.address().port});console.log('Western Duel :'+server.address().port);});
