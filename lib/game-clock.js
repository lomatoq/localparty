'use strict';
// Only game timers use this scheduler. HTTP/WebSocket heartbeat timers stay real.
const realNow=Date.now.bind(Date), realSetInterval=setInterval;
let paused=false, pausedAt=0, offset=0;
const now=()=> (paused?pausedAt:realNow())-offset;
function setPaused(value){value=!!value;if(value===paused)return;if(value)pausedAt=realNow();else offset+=realNow()-pausedAt;paused=value;}
function interval(fn,delay,...args){return realSetInterval(()=>{if(!paused)fn(...args);},delay);}
function timeout(fn,delay,...args){const due=now()+Math.max(0,Number(delay)||0);const t=realSetInterval(()=>{if(!paused&&now()>=due){clearInterval(t);fn(...args);}},Math.min(25,Math.max(1,Number(delay)||1)));return t;}
module.exports={now,realNow,setPaused,interval,timeout,get paused(){return paused;},get offset(){return offset;}};
