'use strict';
const express=require('express'),http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {WebSocketServer,WebSocket}=require('ws');
const party=require('../../lib/party-runtime');
const {Quiz}=require('./engine');
const banks={warsaw:require('./data/warsaw.json'),sinyak:require('../millionaire/data/questions.json')};
const app=express(),server=http.createServer(app),wss=new WebSocketServer({server,maxPayload:8192});
const hostKey=crypto.randomBytes(24).toString('hex'),quiz=new Quiz(banks,party.report),clients=new Map(),standalone=new Map();
const local=req=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
app.get('/host',(req,res)=>{if(!local(req))return res.sendStatus(403);res.type('html').send(fs.readFileSync(path.join(__dirname,'public/index.html'),'utf8').replace('window.QUIZ_HOST_KEY=null','window.QUIZ_HOST_KEY='+JSON.stringify(hostKey)));});
app.use(express.static(path.join(__dirname,'public')));
function send(ws,value){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(value));}
function broadcast(){party.ui?.({phase:({lobby:'waiting',question:'playing',reveal:'reveal',finished:'results',paused:'paused'})[quiz.phase],endsAt:quiz.endsAt||null,label:quiz.phase==='finished'?'Итоги':quiz.phase==='reveal'?'Следующий вопрос':'На ответ',currentPlayer:null,progress:Math.min(quiz.round+1,quiz.deck?.length||quiz.settings.count)+' / '+(quiz.deck?.length||quiz.settings.count),actions:[]});for(const [ws,c] of clients)send(ws,quiz.view(c.id));}
wss.on('connection',(ws,req)=>{
 const c={id:null,host:false};clients.set(ws,c);send(ws,quiz.view());
 ws.on('message',raw=>{let m;try{m=JSON.parse(raw);}catch{return;}if(!m||typeof m!=='object')return;
 if(m.type==='host'&&m.key===hostKey&&local(req)){c.host=true;if(!party.displayOnly)quiz.configure({topic:m.topic});}
 else if(m.type==='join'){
  let p=party.identify(m,ws);
  if(!party.managed&&!p){const old=standalone.get(m.id);if(old&&old.token===m.token)p=old;else{p={id:crypto.randomUUID(),token:crypto.randomBytes(18).toString('hex'),name:String(m.name||'Игрок').trim().slice(0,24)||'Игрок'};standalone.set(p.id,p);}send(ws,{type:'identity',...p});}
  if(!p){send(ws,{type:'error',message:'Вернитесь в главное лобби: профиль не найден.'});return;}
  if(!quiz.players.has(p.id)&&quiz.players.size>=16){send(ws,{type:'error',message:'Уже 16 игроков.'});return;}
  for(const [other,oc]of clients)if(other!==ws&&oc.id===p.id){oc.id=null;other.close(4001,'Replaced');}
  c.id=p.id;quiz.join(p.id,p.name);send(ws,{type:'joined',id:p.id});party.presence(p.id,true);
 }else if(m.type==='team'&&c.id)quiz.team(c.id,m.team);
 else if(m.type==='answer'&&c.id){if(!quiz.submit(c.id,m.round,m.answer))send(ws,{type:'error',message:'Ответ уже принят, время вышло или отвечает капитан.'});}
 else if(c.host){if(m.type==='configure')quiz.configure(m.settings||{});if(m.type==='start')quiz.start();if(m.type==='reveal')quiz.reveal();if(m.type==='next'&&quiz.phase==='reveal')quiz.next();}
 quiz.tick();broadcast();
 });
 ws.on('close',()=>{clients.delete(ws);if(c.id&&![...clients.values()].some(x=>x.id===c.id)){quiz.disconnect(c.id);party.presence(c.id,false);}broadcast();});
});
party.setInterval(()=>{if(quiz.tick())broadcast();},150).unref();
server.listen(Number(process.env.PORT||0),party.managed?'127.0.0.1':'0.0.0.0',()=>console.log('Quiz http://localhost:'+server.address().port+'/host'));


// Commands from the iPhone server console.
party.host({configure:s=>quiz.configure(s),start:()=>{const ok=quiz.start();broadcast();return ok;},reveal:()=>{quiz.reveal();broadcast();},next:()=>{if(quiz.phase!=='reveal')return false;quiz.next();broadcast();}});
