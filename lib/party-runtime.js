'use strict';
// Shared identity and result contract for every game process. No network service needed.
const crypto=require('crypto');
const clock=require('./game-clock');
const pauseListeners=new Set();
if(process.env.PARTY_MANAGED==='1')Date.now=clock.now;
const allowedWhilePaused=new Set(['join','host','registerHost','ping','identify','hello']);
function neutralInput(m){if(!['input','joystick','control','controls'].includes(m.type||m.event))return false;const d=m.data&&typeof m.data==='object'?m.data:m;if(d.state&&d.state!=='up')return false;const axes=['x','y','jx','jy','steer','throttle','forward','fire','left','right','up','down','boost','grab','click'];for(const k of axes)if(d[k]!==undefined&&d[k]!==false&&d[k]!==0)return false;if(d.value!==undefined&&d.value!==null&&d.value!==false&&d.value!==0){if(typeof d.value!=='object'||Object.values(d.value).some(v=>v!==0&&v!==false))return false;}return true;}
function allowMessage(raw){if(!clock.paused)return true;const text=String(raw);if(/^[0-6]/.test(text))return true;try{const m=typeof raw==='object'&&!Buffer.isBuffer(raw)?raw:JSON.parse(text);return allowedWhilePaused.has(m.type||m.event)||neutralInput(m);}catch{return false;}}
if(process.env.PARTY_MANAGED==='1'){
 const WS=require('ws'),emit=WS.prototype.emit;
 WS.prototype.emit=function(event,...args){if(event==='message'&&!allowMessage(args[0]))return false;return emit.call(this,event,...args);};
}
function guardSocketIO(io){io.on('connection',socket=>socket.use((packet,next)=>{if(!clock.paused||allowedWhilePaused.has(packet[0])||neutralInput({type:packet[0],data:packet[1]}))next();}));}
let profiles=[];
try{profiles=JSON.parse(process.env.PARTY_ROSTER||'[]');}catch{}
const listeners=new Set(), reported=new Set();
let lastUI='',lastUIAt=0,lastUIPhase='';
function ui(value={}){
 const phase=['waiting','countdown','playing','reveal','results','paused'].includes(value.phase)?value.phase:'waiting';
 const next={phase:clock.paused?'paused':phase,endsAt:clock.paused?null:Number.isFinite(value.endsAt)?value.endsAt+clock.offset:null,label:clock.paused?'Пауза':String(value.label||'Время'),currentPlayer:value.currentPlayer?String(value.currentPlayer):null,progress:String(value.progress||''),actions:Array.isArray(value.actions)?value.actions:[],serverNow:clock.realNow()};
 if(Number.isFinite(next.endsAt))next.endsAt=Math.round(next.endsAt/50)*50;
 const signature=JSON.stringify({...next,serverNow:0});if(signature===lastUI&&Date.now()-lastUIAt<1000)return;
 lastUI=signature;lastUIPhase=phase;lastUIAt=Date.now();notify({type:'party:ui',ui:next});
}
function roster(){return profiles.map(p=>({...p}));}
function notify(message){if(process.send&&process.connected)try{process.send(message);}catch{}}
function presence(id,connected=true){notify({type:'party:presence',id,connected});}
function identify(payload={}){
 const id=payload.partyId||payload.party?.id;
 const token=payload.partyToken||payload.party?.token;
 const p=profiles.find(p=>p.id===id&&typeof token==='string'&&p.token===token);
 if(p){presence(p.id);return {...p};}
 return null;
}
function onRoster(fn){listeners.add(fn);return()=>listeners.delete(fn);}
process.on('message',m=>{if(m?.type==='party:roster'&&Array.isArray(m.players)){profiles=m.players;for(const fn of listeners)fn(roster());}});
process.on('message',m=>{if(m?.type==='party:pause'){clock.setPaused(m.paused);for(const fn of pauseListeners)fn(clock.paused);}});
function report(result){
 const eventId=String(result.eventId||crypto.randomUUID());
 if(reported.has(eventId))return false;
 reported.add(eventId);notify({type:'party:result',result:{...result,eventId,gameId:process.env.PARTY_GAME_ID||result.gameId}});return true;
}
module.exports={roster,identify,onRoster,presence,report,ui,guardSocketIO,allowMessage,onPause:fn=>{pauseListeners.add(fn);return()=>pauseListeners.delete(fn);},managed:process.env.PARTY_MANAGED==='1',now:clock.now,setInterval:clock.interval,setTimeout:clock.timeout,get paused(){return clock.paused;}};
