'use strict';
const crypto = require('crypto');
const shuffle = xs => { const a=xs.slice(); for(let i=a.length-1;i>0;i--){const j=crypto.randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];} return a; };
class Quiz {
 constructor(banks,report=()=>{}){this.banks=banks;this.report=report;this.players=new Map();this.phase='lobby';this.settings={topic:'warsaw',mode:'solo',count:5,seconds:10};this.round=-1;this.answers=new Map();this.eligible=new Set();}
 join(id,name){let p=this.players.get(id);if(!p){p={id,name,team:this.smallestTeam(),score:0,correct:0,answers:0,streak:0,bestStreak:0,online:true};this.players.set(id,p);}p.name=name;p.online=true;return p;}
 smallestTeam(){const sizes=[0,0,0,0];for(const p of this.players.values())sizes[p.team]++;return sizes.indexOf(Math.min(...sizes));}
 team(id,team){if(this.phase!=='lobby'&&this.phase!=='finished')return false;const p=this.players.get(id);if(!p||!Number.isInteger(team)||team<0||team>3)return false;p.team=team;return true;}
 configure(s){if(!['lobby','finished'].includes(this.phase))return;for(const [k,values] of Object.entries({topic:['sinyak','warsaw'],mode:['solo','teams'],count:[3,5,7,10,15,20,30],seconds:[5,8,10,15,20,30,45,60]}))if(values.includes(s[k]))this.settings[k]=s[k];}
 disconnect(id,now=Date.now()){const p=this.players.get(id);if(p){p.online=false;p.disconnectedAt=now;}}
 tick(now=Date.now()){
  if(!['question','reveal','paused'].includes(this.phase))return false;
  const online=[...this.players.values()].filter(p=>p.online);
  if(!online.length&&this.phase!=='paused'){this.resumePhase=this.phase;this.remaining=Math.max(0,this.endsAt-now);this.phase='paused';this.endsAt=null;return true;}
  if(this.phase==='paused'){if(!online.length)return false;this.phase=this.resumePhase;this.endsAt=now+this.remaining;return true;}
  if(this.phase==='reveal'&&now>=this.endsAt){this.next();return true;}
  if(this.phase==='question'){
   const expected=new Set([...this.eligible].map(id=>this.players.get(id)).filter(p=>p&&(p.online||now-(p.disconnectedAt||now)<5000)).map(p=>this.key(p)));
   if(now>=this.endsAt||(expected.size>0&&[...expected].every(key=>this.answers.has(key)))){this.reveal(now);return true;}
  }return false;
 }
 start(){if(!['lobby','finished'].includes(this.phase)||[...this.players.values()].filter(p=>p.online).length<2)return false;const seen=new Set();this.deck=shuffle(this.banks[this.settings.topic]).filter(q=>{const k=q.group||q.id;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,this.settings.count).map(q=>({...q,answers:shuffle(q.answers)}));this.round=-1;this.startedAt=Date.now();this.eventId=crypto.randomUUID();this.teamScores=[0,0,0,0];for(const p of this.players.values())Object.assign(p,{score:0,correct:0,answers:0,streak:0,bestStreak:0});this.next();return true;}
 key(p){return this.settings.mode==='teams'?'team:'+p.team:p.id;}
 captain(p){return [...this.players.values()].find(x=>x.team===p.team&&x.online&&(['lobby','finished'].includes(this.phase)||this.eligible.has(x.id)))?.id;}
 next(){if(!['lobby','finished','reveal'].includes(this.phase))return false;if(++this.round>=this.deck.length){this.phase='finished';const top=Math.max(...[...this.players.values()].map(p=>this.score(p)),0);this.report({eventId:this.eventId,gameId:this.settings.topic==='warsaw'?'warsaw':'sinyakquiz',duration:Date.now()-this.startedAt,players:[...this.players.values()].filter(p=>p.answers>0).map(p=>({id:p.id,name:p.name,score:this.score(p),won:this.score(p)===top,metrics:{correct:p.correct,answers:p.answers,bestStreak:p.bestStreak}}))});return true;}this.phase='question';this.endsAt=Date.now()+this.settings.seconds*1000;this.answers.clear();this.eligible=new Set([...this.players.values()].filter(p=>p.online).map(p=>p.id));return true;}
 submit(id,round,answer,now=Date.now()){const p=this.players.get(id),q=this.deck?.[this.round];if(!p||this.phase!=='question'||round!==this.round||now>=this.endsAt||!this.eligible.has(id)||!Number.isInteger(answer)||answer<0||answer>3)return false;const key=this.key(p);if(this.answers.has(key)||(this.settings.mode==='teams'&&this.captain(p)!==id))return false;this.answers.set(key,{answer,by:id,elapsed:Math.max(0,this.settings.seconds*1000-(this.endsAt-now))});return true;}
 reveal(now=Date.now()){if(this.phase!=='question')return false;const q=this.deck[this.round];for(const [key,a] of this.answers){const correct=q.answers[a.answer]===q.correct;a.correct=correct;a.points=correct?1000+Math.round(300*(1-a.elapsed/(this.settings.seconds*1000))):0;if(key.startsWith('team:'))this.teamScores[Number(key.slice(5))]+=a.points;for(const p of this.players.values())if(this.eligible.has(p.id)&&this.key(p)===key){p.answers++;p.correct+=Number(correct);p.score+=a.points;p.streak=correct?p.streak+1:0;p.bestStreak=Math.max(p.bestStreak,p.streak);}}for(const p of this.players.values())if(this.eligible.has(p.id)&&!this.answers.has(this.key(p)))p.streak=0;this.phase='reveal';this.endsAt=now+3000;return true;}
 score(p){return this.settings.mode==='teams'?(this.teamScores?.[p.team]||0):p.score;}
 view(id){const p=this.players.get(id),q=this.deck?.[this.round],revealed=['reveal','finished'].includes(this.phase);return {type:'state',phase:this.phase,settings:this.settings,round:this.round,total:this.deck?.length||this.settings.count,endsAt:this.endsAt,serverTime:Date.now(),question:q?{id:q.id,question:q.question,answers:q.answers,category:q.category,...(revealed?{correct:q.answers.indexOf(q.correct),explanation:q.explanation,sourceUrl:q.sourceUrl,sourceTitle:q.sourceTitle}:{})}:null,players:[...this.players.values()].map(x=>({...x,score:this.score(x),captain:this.captain(x)===x.id})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)),teamScores:this.teamScores||[0,0,0,0],submitted:this.answers.size,me:p?{...p,score:this.score(p),eligible:this.eligible.has(p.id),captain:this.captain(p)===id,answer:this.answers.get(this.key(p))?.answer??null}:null};}
}
module.exports={Quiz,shuffle};
