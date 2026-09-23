/* Deterministic novice strategies using only the public board, never secrets. */
((root,factory)=>{const policy=factory();if(typeof module==='object')module.exports=policy;else root.PartyBotPolicy=policy;})(globalThis,()=>{
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const direction=(a,b)=>{const x=b.x-a.x,y=b.y-a.y,n=Math.max(1,Math.hypot(x,y));return {x:x/n,y:y/n};};
 function decide(game,s,profile,t=0){
  const me=s?.players?.find(p=>p.id===profile.id||p.name===profile.name);
  if(!me||me.alive===false||me.dead>0)return null;
  const others=s.players.filter(p=>p!==me&&p.alive!==false&&p.connected!==false&&!(p.dead>0));
  const nearest=list=>list.reduce((best,p)=>!best||distance(me,p)<distance(me,best)?p:best,null);
  if(game==='pocket_siege'){
   const target=nearest(others.filter(p=>p.participant!==false&&p.team!==me.team));if(!target)return null;
   const dx=Math.abs(target.x-me.x),elevation=Math.PI/4,den=2*Math.cos(elevation)**2*(target.y-me.y+dx*Math.tan(elevation));
   const speed=Math.sqrt(Math.max(1,350*dx*dx/Math.max(1,den)));
   return {angle:target.x>me.x?45:135,power:Math.max(8,Math.min(100,(speed-200)/5.2))};
  }
  if(game==='marble_bloom'){
   const board=s.boards?.find(b=>b.players.some(p=>p.id===me.id))||s,chain=board.chain||[],same=chain.filter(b=>b.color===me.ball);
   const target=(same.length?same:chain).find(b=>Number.isFinite(b.x)&&Number.isFinite(b.y));return target?{aim:{x:target.x,y:target.y}}:null;
  }
  if(['push','shrink','bomb'].includes(game)){
   const center=s.center||{x:600,y:400},radius=(game==='bomb'?s.bomb?.arenaRadius:s.game?.arenaRadius)||292;
   const look={x:me.x+(me.vx||0)*.25,y:me.y+(me.vy||0)*.25};
   if(distance(look,center)>radius*.68)return {axis:direction(me,center)};
   const target=nearest(others);if(!target)return {axis:direction(me,center)};
   if(game==='bomb'&&s.bomb?.holderId!==me.id){const carrier=others.find(p=>p.id===s.bomb?.holderId);if(carrier&&distance(me,carrier)<180)return {axis:direction(carrier,me)};}
   return {axis:direction(me,target)};
  }
  if(game==='western')return {fire:s.western?.phase==='draw'&&s.western?.cueReal===true};
  if(game==='hungry'){
   const danger=nearest(others.filter(p=>p.mass>me.mass*1.3));
   if(danger&&distance(me,danger)<140)return {axis:direction(danger,me)};
   const target=nearest(s.food||[])||{x:600,y:360};return {axis:direction(me,target)};
  }
  if(game==='carryball'){
   const goal={x:me.team?25:1175,y:360},owns=s.ball?.owner===me.id;
   return {axis:direction(me,owns?goal:s.ball||goal),pass:owns&&distance(me,goal)<220};
  }
  if(game==='flappy'){
   const pipe=(s.pipes||[]).filter(p=>p.x>me.x-48).sort((a,b)=>a.x-b.x)[0],target=pipe?.gap||350;
   return {flap:me.y+(me.vy||0)*.14>target+20};
  }
  if(game==='snakelines'){
   // Pick a short collision-free heading, penalizing hard turns and edges.
   // Filter once, not seven full trail scans for every bot decision.
   const nearby=[];for(const p of s.players){const trail=p.trail||[],end=trail.length-(p===me?6:0);for(let j=0;j<end;j++){const point=trail[j];if(Math.abs(point.x-me.x)<130&&Math.abs(point.y-me.y)<130)nearby.push(point);}}
   let best=null;
   for(let i=-3;i<=3;i++){
    const angle=(me.angle||0)+i*Math.PI/6,end={x:me.x+Math.cos(angle)*85,y:me.y+Math.sin(angle)*85};
    let score=-Math.abs(i)*4;
    if(end.x<45||end.x>1155||end.y<45||end.y>675)score-=1000;
    for(const point of nearby)if((end.x-point.x)**2+(end.y-point.y)**2<32**2)score-=150;
    if(!best||score>best.score)best={score,axis:{x:Math.cos(angle),y:Math.sin(angle)}};
   }
   return {axis:best.axis};
  }
  return null;
 }
 return {decide};
});
