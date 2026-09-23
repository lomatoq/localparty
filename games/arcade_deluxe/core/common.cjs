'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const finite=(x,f=0)=>typeof x==='number'&&Number.isFinite(x)?x:f;
const lerp=(a,b,t)=>a+(b-a)*t;
class RNG {
  constructor(seed=1){this.seed=(seed>>>0)||1;}
  next(){let t=this.seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
  int(n){return Math.floor(this.next()*n);}
  pick(a){return a[this.int(a.length)];}
  shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=this.int(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
}
function segmentDistance(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);return {d:Math.hypot(px-ax-t*dx,py-ay-t*dy),t};}
const COLORS=['#c4ff38','#ad8dff','#ff875e','#67d8ff','#f6d970','#ff84be','#83eed0','#eef1e5'];
class BaseGame {
 constructor(seed){this.rng=new RNG(seed);this.players=[];this.phase='waiting';this.t=0;this.events=[];this.eventSerial=0;this.roundSerial=0;this.result=null;}
 add(profile,max){let p=this.players.find(p=>p.id===profile.id);if(p){p.connected=true;p.name=String(profile.name||p.name).slice(0,24);return p;}if(this.phase==='waiting')this.players=this.players.filter(p=>p.connected);if(this.players.length>=max)return null;p={id:profile.id,name:String(profile.name||'Гулец').slice(0,24),color:COLORS.find(c=>!this.players.some(p=>p.color===c))||COLORS[this.players.length],hand:profile.hand==='left'?'left':'right',avatar:profile.avatar||null,connected:true,participant:this.phase==='waiting',score:0,bot:!!profile.bot};this.players.push(p);return p;}
 disconnect(id){const p=this.players.find(p=>p.id===id);if(p){p.connected=false;p.lostAt=this.t;p.hold=false;}}
 emit(kind,data={}){this.events.push({id:++this.eventSerial,kind,t:this.t,...data});if(this.events.length>100)this.events.splice(0,this.events.length-100);}
 finish(reason,cooperative=false){if(this.phase==='results')return;this.phase='results';const ps=this.players.filter(p=>p.participant);const best=Math.max(...ps.map(p=>p.score));const won=reason==='victory';this.result={eventId:`${this.mode}-${this.roundSerial}-${this.rng.seed>>>0}`,reason,cooperative,players:ps.map(p=>({id:p.id,name:p.name,score:Math.round(p.score),won:cooperative?won:p.score===best,metrics:{score:Math.round(p.score)}}))};this.emit('finish',{reason});}
 reset(){this.phase='waiting';this.result=null;for(const p of this.players)p.participant=p.connected;}
}
module.exports={clamp,finite,lerp,RNG,segmentDistance,COLORS,BaseGame};
