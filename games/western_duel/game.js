'use strict';
const crypto=require('crypto');
function schedule(ids){if(ids.length===2)return Array.from({length:3},()=>[...ids]);return ids.map((id,i)=>[id,ids[(i+1)%ids.length]]);}
class Tournament{
 constructor(){this.phase='waiting';this.players=new Map();this.queue=[];this.index=0;this.duel=null;this.endsAt=null;this.eventId='';}
 join(id,name){if(!this.players.has(id))this.players.set(id,{id,name,score:0,appearances:0,falseStarts:0,bestReactionMs:null});return this.players.get(id);}
 start(ids,now=Date.now()){if(ids.length<2)return false;this.roster=[...ids];this.queue=schedule(ids);this.index=0;this.eventId=crypto.randomUUID();this.started=now;for(const p of this.players.values()){p.score=0;p.appearances=0;p.falseStarts=0;p.bestReactionMs=null;}this.next(now);return true;}
 next(now){if(this.index>=this.queue.length||(this.roster.length===2&&this.roster.some(id=>this.players.get(id).score>=2))){this.phase='results';this.endsAt=null;return;}
 const pair=this.queue[this.index++];this.duel={id:crypto.randomUUID(),pair,shots:[],winner:null,loser:null,reason:null,drawAt:null};this.phase='countdown';this.endsAt=now+3000;for(const id of pair)this.players.get(id).appearances++;}
 shot(id,duelId,now=Date.now()){if(!this.duel||this.duel.id!==duelId||!this.duel.pair.includes(id)||!['countdown','waitingSignal','draw'].includes(this.phase)||this.duel.shots.some(s=>s.id===id))return false;
 const early=this.phase!=='draw',other=this.duel.pair.find(x=>x!==id);this.duel.shots.push({id,at:now,early});if(early)this.players.get(id).falseStarts++;else{const p=this.players.get(id),ms=Math.max(0,now-this.duel.drawAt);p.bestReactionMs=p.bestReactionMs===null?ms:Math.min(p.bestReactionMs,ms);}
 this.resolve(early?other:id,early?id:other,early?'Ранний выстрел':'Точный выстрел',now);return true;}
 resolve(winner,loser,reason,now){this.duel.winner=winner;this.duel.loser=loser;this.duel.reason=reason;if(winner)this.players.get(winner).score++;this.phase='reveal';this.endsAt=now+3200;}
 tick(now=Date.now()){if(this.endsAt===null||now<this.endsAt)return;if(this.phase==='countdown'){this.phase='waitingSignal';this.endsAt=now+1500+Math.random()*3000;}else if(this.phase==='waitingSignal'){this.phase='draw';this.duel.drawAt=now;this.endsAt=null;}else if(this.phase==='reveal')this.next(now);}
 view(){return {phase:this.phase,endsAt:this.endsAt,duel:this.duel,index:this.index,total:this.queue.length,queue:this.queue.slice(this.index),players:[...this.players.values()]};}
}
module.exports={Tournament,schedule};
