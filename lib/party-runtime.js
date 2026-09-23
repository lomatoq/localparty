'use strict';
// Shared identity and result contract for every game process. No network service needed.
const crypto=require('crypto');
const clock=require('./game-clock');
const pauseListeners=new Set();
if(process.env.PARTY_MANAGED==='1')Date.now=clock.now;
const displayOnly=process.env.PARTY_DISPLAY_ONLY==='1';
const hostMutations=new Set(['start','startGame','backToLobby','configure','configure_lobby','reset','host_start','host_reset','host_set_laps','reveal','next','end','finish']);
const allowedWhilePaused=new Set(['join','host','registerHost','ping','identify','hello']);
function neutralInput(m){if(!['input','joystick','control','controls'].includes(m.type||m.event))return false;const d=m.data&&typeof m.data==='object'?m.data:m;if(d.state&&d.state!=='up')return false;const axes=['x','y','jx','jy','steer','throttle','forward','fire','left','right','up','down','boost','grab','click'];for(const k of axes)if(d[k]!==undefined&&d[k]!==false&&d[k]!==0)return false;if(d.value!==undefined&&d.value!==null&&d.value!==false&&d.value!==0){if(typeof d.value!=='object'||Object.values(d.value).some(v=>v!==0&&v!==false))return false;}return true;}
function allowMessage(raw){if(displayOnly){try{const m=typeof raw==='object'&&!Buffer.isBuffer(raw)?raw:JSON.parse(String(raw));const type=m.type||m.event;if(hostMutations.has(type)||(String(type).startsWith('host:')&&type!=='host:hello'))return false;}catch{}}if(!clock.paused)return true;const text=String(raw);if(/^[0-6]/.test(text))return true;try{const m=typeof raw==='object'&&!Buffer.isBuffer(raw)?raw:JSON.parse(text);return allowedWhilePaused.has(m.type||m.event)||neutralInput(m);}catch{return false;}}
if(process.env.PARTY_MANAGED==='1'){
 const WS=require('ws'),emit=WS.prototype.emit,originalSend=WS.prototype.send;
 // A slow TV must receive fresh snapshots instead of accumulating seconds of old frames.
 WS.prototype.send=function(data,...args){if(this.bufferedAmount>256*1024&&typeof data==='string'&&data.startsWith('{"type":"state"')){const callback=args.at(-1);if(typeof callback==='function')callback();return;}return originalSend.call(this,data,...args);};
 WS.prototype.emit=function(event,...args){if(event==='message'&&(this.partyRemoved||!allowMessage(args[0])))return false;return emit.call(this,event,...args);};
}
function guardSocketIO(io){io.on('connection',socket=>socket.use((packet,next)=>{if(socket.partyRemoved)return;if(displayOnly&&String(packet[0]).startsWith('host:')&&packet[0]!=='host:hello')return;if(!clock.paused||packet[0]==='host:hello'||allowedWhilePaused.has(packet[0])||neutralInput({type:packet[0],data:packet[1]}))next();}));}
let profiles=[];
try{profiles=JSON.parse(process.env.PARTY_ROSTER||'[]');}catch{}
const listeners=new Set(), reported=new Set();
let lastUI='',lastUIAt=0,availableHostActions=null;
function ui(value={}){
 const phase=['waiting','countdown','playing','reveal','results','paused'].includes(value.phase)?value.phase:'waiting';
 const next={hostActions:availableHostActions?.()??null,stage:typeof value.stage==='string'?value.stage.slice(0,32):null,phase:clock.paused?'paused':phase,endsAt:clock.paused?null:Number.isFinite(value.endsAt)?Math.round(value.endsAt+clock.offset):null,label:clock.paused?'Пауза':String(value.label||'Время'),currentPlayer:value.currentPlayer?String(value.currentPlayer):null,progress:String(value.progress||''),actions:Array.isArray(value.actions)?value.actions:[],serverNow:clock.realNow()};
 // Floating-point simulation timers can differ by fractions of a millisecond
 // on every tick. They are the same UI deadline, not a new room update.
 const signature=JSON.stringify({...next,serverNow:0});if(signature===lastUI&&Date.now()-lastUIAt<1000)return;
 lastUI=signature;lastUIAt=Date.now();notify({type:'party:ui',ui:next});
}
function roster(){return profiles.map(p=>({...p}));}
function notify(message){if(process.send&&process.connected)try{process.send(message);}catch{}}
function presence(id,connected=true){notify({type:'party:presence',id,connected});}
const transports=new Map();
function identify(payload={},socket){
 const id=payload.partyId||payload.party?.id;
 const token=payload.partyToken||payload.party?.token;
 const p=profiles.find(p=>p.id===id&&typeof token==='string'&&p.token===token);
 if(p){
  if(socket&&!transports.has(socket)){
    transports.set(socket,p.id);
    const cleanup=()=>transports.delete(socket);
    if(socket.socket)socket.socket.once('close',cleanup);else socket.once('disconnect' in socket?'disconnect':'close',cleanup);
  }
  presence(p.id);return {...p};
 }
 return null;
}
process.on('message',m=>{
 if(m?.type!=='party:kick')return;
 profiles=profiles.filter(p=>p.id!==m.id);
 for(const [socket,id] of transports)if(id===m.id){
  socket.partyRemoved=true;transports.delete(socket);
  if(typeof socket.disconnect==='function')socket.disconnect(true);
  else if(socket.socket)socket.socket.destroy();
  else socket.terminate();
 }
 presence(m.id,false);
});
function onRoster(fn){listeners.add(fn);return()=>listeners.delete(fn);}
process.on('message',m=>{if(m?.type==='party:roster'&&Array.isArray(m.players)){profiles=m.players;for(const fn of listeners)fn(roster());}});
process.on('message',m=>{if(m?.type==='party:pause'){clock.setPaused(m.paused);for(const fn of pauseListeners)fn(clock.paused);notify({type:'party:paused',paused:clock.paused});}});
function report(result){
 const eventId=String(result.eventId||crypto.randomUUID());
 if(reported.has(eventId))return false;
 reported.add(eventId);notify({type:'party:result',result:{...result,eventId,gameId:process.env.PARTY_GAME_ID||result.gameId}});return true;
}
module.exports={roster,identify,onRoster,presence,report,ui,guardSocketIO,allowMessage,onPause:fn=>{pauseListeners.add(fn);return()=>pauseListeners.delete(fn);},managed:process.env.PARTY_MANAGED==='1',now:clock.now,setInterval:clock.interval,setTimeout:clock.timeout,get paused(){return clock.paused;}};

// Native management uses IPC; a TV socket can subscribe but cannot start/configure games.
function host(handlers){
 if(!displayOnly)return;
 const settings=JSON.parse(process.env.PARTY_HOST_SETTINGS||'{}');
 availableHostActions=handlers.available||null;
 handlers.configure?.(settings);
 const completed=new Map();
 process.on('message',m=>{
  if(m?.type!=='party:host-command'||typeof m.id!=='string')return;
  if(!completed.has(m.id)){
   const operation=Promise.resolve().then(()=>{
    if(clock.paused)throw Error('Сервер временно приостановлен');
    if(!Object.hasOwn(handlers,m.action)||m.action==='configure')throw Error('Действие недоступно');
    return handlers[m.action](settings);
   }).then(result=>{if(result===false||result?.ok===false)throw Error(result?.error||'Подождите подключения игроков');return {ok:true};}).catch(e=>({ok:false,error:e.message}));
   completed.set(m.id,operation);if(completed.size>64)completed.delete(completed.keys().next().value);
  }
  completed.get(m.id).then(result=>notify({type:'party:host-result',id:m.id,...result}));
 });
}
module.exports.host=host;
module.exports.displayOnly=displayOnly;
