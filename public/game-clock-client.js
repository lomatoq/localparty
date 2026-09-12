/* Game clocks only. Reconnection, transport and UI transition timers remain real. */
(()=>{'use strict';
 const realNow=Date.now.bind(Date),nativeInterval=window.setInterval.bind(window),realPerformance=performance.now.bind(performance);
 const origin=realNow()-realPerformance();let session={clockOffset:0,paused:false,pausedAt:null};
 function update(value){if(!value)return;session={...session,...value};}
 try{update(parent.PARTY_SESSION);}catch{}
 const now=()=> (session.paused&&Number.isFinite(session.pausedAt)?session.pausedAt:realNow())-(Number(session.clockOffset)||0);
 Date.now=now;
 const clock={now,realNow,performanceNow:()=>now()-origin,get paused(){return !!session.paused;},setTimeout(fn,delay,...args){const due=now()+Math.max(0,Number(delay)||0);const id=nativeInterval(()=>{if(!session.paused&&now()>=due){clearInterval(id);fn(...args);}},Math.min(25,Math.max(1,Number(delay)||1)));return id;}};
 window.PARTY_GAME_CLOCK=clock;
 addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin)return;const m=e.data;if(m?.type==='party-ui')update(m.session||m.ui?.session);});
})();
