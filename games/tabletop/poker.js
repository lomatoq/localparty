'use strict';
// Server-owned Hold'em. Cards are integers: suit * 13 + rank (2..A).
const rank=c=>c%13+2;
function compare(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d;}return 0;}
function five(cards){
 const ranks=cards.map(rank).sort((a,b)=>b-a),counts=new Map();for(const r of ranks)counts.set(r,(counts.get(r)||0)+1);
 const groups=[...counts].sort((a,b)=>b[1]-a[1]||b[0]-a[0]),unique=[...new Set(ranks)];if(unique[0]===14)unique.push(1);
 let straight=0;for(let i=0;i<=unique.length-5;i++)if(unique[i]-unique[i+4]===4){straight=unique[i];break;}
 const flush=cards.every(c=>Math.floor(c/13)===Math.floor(cards[0]/13));
 if(flush&&straight)return [8,straight];if(groups[0][1]===4)return [7,groups[0][0],groups[1][0]];
 if(groups[0][1]===3&&groups[1][1]===2)return [6,groups[0][0],groups[1][0]];
 if(flush)return [5,...ranks];if(straight)return [4,straight];
 if(groups[0][1]===3)return [3,groups[0][0],...groups.slice(1).map(x=>x[0])];
 if(groups[0][1]===2&&groups[1][1]===2)return [2,...groups.slice(0,2).map(x=>x[0]).sort((a,b)=>b-a),groups[2][0]];
 if(groups[0][1]===2)return [1,...groups.map(x=>x[0])];return [0,...ranks];
}
function evaluate(cards){let best=[-1];for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)for(let c=b+1;c<cards.length-2;c++)for(let d=c+1;d<cards.length-1;d++)for(let e=d+1;e<cards.length;e++){const v=five([cards[a],cards[b],cards[c],cards[d],cards[e]]);if(compare(v,best)>0)best=v;}return best;}
class Poker {
 constructor(players,random=Math.random){this.players=players;this.random=random;this.hand=0;this.dealer=-1;this.phase='playing';this.t=0;this.board=[];this.winners=[];players.forEach(p=>p.chips=1000);this.nextHand();}
 active(){return this.players.filter(p=>p.inHand&&!p.folded);}
 nextSeat(index,predicate){for(let n=1;n<=this.players.length;n++){const i=(index+n)%this.players.length;if(predicate(this.players[i]))return i;}return -1;}
 pay(p,amount){const n=Math.min(p.chips,Math.max(0,Math.floor(amount)));p.chips-=n;p.bet+=n;p.total+=n;return n;}
 nextHand(){
  const eligible=this.players.filter(p=>p.chips>0&&p.connected);
  if(eligible.length<2||this.hand>=5){this.phase='results';return;}
  this.hand++;this.stage='preflop';this.board=[];this.winners=[];this.deck=Array.from({length:52},(_,i)=>i);
  for(let i=51;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.deck[i],this.deck[j]]=[this.deck[j],this.deck[i]];}
  this.players.forEach(p=>{p.inHand=eligible.includes(p);p.folded=!p.inHand;p.bet=0;p.total=0;p.acted=false;p.hole=p.inHand?[this.deck.pop(),this.deck.pop()]:[];});
  this.dealer=this.nextSeat(this.dealer,p=>p.inHand);const small=eligible.length===2?this.dealer:this.nextSeat(this.dealer,p=>p.inHand),big=this.nextSeat(small,p=>p.inHand);
  this.pay(this.players[small],10);this.pay(this.players[big],20);this.currentBet=20;this.minRaise=20;this.turn=this.nextSeat(big,p=>p.inHand&&p.chips>0);this.deadline=this.t+25;this.advance();
 }
 action(id,type,amount){
  const p=this.players[this.turn];if(this.phase!=='playing'||this.stage==='showdown'||!p||p.id!==id||p.folded||p.chips<=0)return false;
  const call=Math.max(0,this.currentBet-p.bet);
  if(type==='fold')p.folded=true;
  else if(type==='check'){if(call)return false;}
  else if(type==='call')this.pay(p,call);
  else if(type==='raise'){
   const target=Number(amount);if(!Number.isSafeInteger(target)||target<=this.currentBet||target>p.bet+p.chips||p.acted)return false;
   const increase=target-this.currentBet;if(increase<this.minRaise&&target!==p.bet+p.chips)return false;
   this.pay(p,target-p.bet);this.currentBet=target;
   if(increase>=this.minRaise){this.minRaise=increase;this.players.forEach(q=>q.acted=false);}
  }else return false;
  p.acted=true;this.turn=this.nextSeat(this.turn,q=>q.inHand&&!q.folded&&q.chips>0&&(!q.acted||q.bet<this.currentBet));this.deadline=this.t+25;this.advance();return true;
 }
 advance(){
  if(this.active().length<=1){this.showdown();return;}
  for(let guard=0;guard<5;guard++){
   const able=this.active().filter(p=>p.chips>0);
   if(able.some(p=>p.bet<this.currentBet||(!p.acted&&able.length>1)))return;
   if(this.stage==='river'){this.showdown();return;}
   this.stage=this.stage==='preflop'?'flop':this.stage==='flop'?'turn':'river';this.deck.pop();
   for(let i=0;i<(this.stage==='flop'?3:1);i++)this.board.push(this.deck.pop());
   this.players.forEach(p=>{p.bet=0;p.acted=false;});this.currentBet=0;this.minRaise=20;this.turn=this.nextSeat(this.dealer,p=>p.inHand&&!p.folded&&p.chips>0);this.deadline=this.t+25;
  }
 }
 showdown(){
  const contenders=this.active();while(contenders.length>1&&this.board.length<5)this.board.push(this.deck.pop());
  const levels=[...new Set(this.players.map(p=>p.total).filter(Boolean))].sort((a,b)=>a-b);let previous=0;const won=new Set();
  for(const level of levels){const contributors=this.players.filter(p=>p.total>=level),pot=(level-previous)*contributors.length;previous=level;
   let eligible=contenders.filter(p=>p.total>=level);
   // Uncalled excess belongs to its contributor, not to a side pot.
   if(!eligible.length)eligible=contributors;
   let best=[-1],winners=[];for(const p of eligible){const value=contenders.length===1?[0]:evaluate([...p.hole,...this.board]);const result=compare(value,best);if(result>0){best=value;winners=[p];}else if(result===0)winners.push(p);}
   winners.sort((a,b)=>((this.players.indexOf(a)-this.dealer-1+this.players.length)%this.players.length)-((this.players.indexOf(b)-this.dealer-1+this.players.length)%this.players.length));
   winners.forEach((p,i)=>{p.chips+=Math.floor(pot/winners.length)+(i<pot%winners.length?1:0);won.add(p.id);});
  }
  this.winners=[...won];this.stage='showdown';this.deadline=this.t+6;this.turn=-1;
 }
 step(dt){if(this.phase!=='playing')return;this.t+=dt;if(this.t>=this.deadline){if(this.stage==='showdown')this.nextHand();else{const p=this.players[this.turn];if(p)this.action(p.id,p.bet===this.currentBet?'check':'fold');}}}
 view(id){return {stage:this.stage,hand:this.hand,board:this.board,winners:this.winners,dealer:this.players[this.dealer]?.id,turn:this.players[this.turn]?.id,remaining:Math.max(0,this.deadline-this.t),pot:this.players.reduce((n,p)=>n+p.total,0),currentBet:this.currentBet,minRaise:this.minRaise,players:this.players.map(p=>({id:p.id,name:p.name,color:p.color,connected:p.connected,score:p.chips,chips:p.chips,bet:p.bet,folded:p.folded,inHand:p.inHand,canRaise:!p.acted,hole:p.id===id||(this.stage==='showdown'&&!p.folded&&this.active().length>1)?p.hole:p.hole.map(()=>-1)}))};}
}
module.exports={Poker,evaluate,compare};
