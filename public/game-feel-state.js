/* Public snapshot feedback. Never creates game outcomes or reads secrets. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LocalPartyFeelState=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const ids='push shrink knives bomb western tanks tankarena chaos kart monster spy millionaire sinyakquiz warsaw crocodile jenga crane naval drawguess western_duel taprace punchmeter flappy hungry snakelines carryball marble_bloom pocket_siege bow_club poker airhockey mines curling bowling swarm_gate peek_shoot'.split(' ');
 const live=new Set(['playing','racing','battle','drawing','question','turn','draw','waitingSignal']);
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 const scoreKeys={knives:'roundScore',western:'roundWins',tankarena:'score',punchmeter:'score',bow_club:'score',drawguess:'score',sinyakquiz:'score',warsaw:'score',millionaire:'money',mines:'score',crocodile:'score',marble_bloom:'score',poker:'chips',curling:'score',bowling:'score'};
 const selectors={knives:'#roundScore',western:'#westernWins',tanks:'#scoreMain',tankarena:'#combatScore,.arsenal-score',kart:'#lapText',punchmeter:'#punchResult strong',bow_club:'.shoot-hud strong,.score-chip .bow-points',drawguess:'.points',sinyakquiz:'.points',warsaw:'.points',millionaire:'#myMoney,#moneyPill,#moneyNow,#finalMoney,.scoreTop .money',mines:'#myMineScore,#players .tabletop-score',crocodile:'.points',marble_bloom:'#scores .score-readout strong',poker:'.seat-score',curling:'#ss-personal-score,.ss-player-score',bowling:'#ss-personal-score,.ss-player-score',carryball:'#hudValue',airhockey:'#goals'};
 function project(game,s={},selfId,info){
  const g=s.game||s,phase=s.phase||g.status||s.status||info?.phase,players=Array.isArray(s.players)?s.players:[],self=s.me||players.find(p=>p.id===selfId)||(s.id===selfId?s:null);
  const scope=String(s.roundSerial??s.serial??s.turnId??s.turnToken??g.round??s.hand??s.gameNumber??'match');
  const active=live.has(phase)&&!s.paused&&!info?.paused;
  const remaining=active&&info?.timer&&finite(info.timer.remainingSeconds)?info.timer.remainingSeconds:null;
  const teamGoals=game==='airhockey'?s.goals:game==='carryball'?s.teams:game==='tanks'&&g.mode==='ctf'?[g.redScore,g.blueScore]:null;
  let health=null,maxHealth=null,alive=null;
  const ownHealth=p=>{if(!p)return null;const h=game==='naval'?p.health:p.hp;return finite(h)?h:null;};
  if(['tanks','tankarena','naval'].includes(game)){
   const remainingPlayers=players.filter(p=>p.connected!==false&&p.active!==false&&(game==='tankarena'?p.dead<=0:game==='naval'?p.health>0:p.alive));
   const p=self||(remainingPlayers.length===1?remainingPlayers[0]:null);
   health=ownHealth(p);maxHealth=game==='naval'?5:(finite(p?.maxHp)?p.maxHp:100);alive=p?game==='tankarena'?p.dead<=0:game==='naval'?p.health>0:p.alive:null;
  }
  if(game==='crane'){health=s.lives;maxHealth=3;alive=health>0;}
  if(game==='swarm_gate'){health=s.gate;maxHealth=1000;alive=health>0;}
  const scoreKey=scoreKeys[game],score=self&&scoreKey?self[scoreKey]:null;
  const allScores=scoreKey?Object.fromEntries(players.filter(p=>finite(p[scoreKey])).map(p=>[p.id,p[scoreKey]])):{};
  const turnOwner={jenga:s.currentId,crane:s.activeId,monster:s.activePlayerId,millionaire:s.activePlayerId,pocket_siege:s.activeId,poker:s.turn,punchmeter:s.punchTurn,curling:s.currentId,bowling:s.currentId}[game];
  return {phase,scope,active,remaining,turnOwner,turnIdentity:s.turnId??s.turnToken??null,selfId:self?.id||selfId,score,allScores,
   health:finite(health)?health:null,maxHealth,alive,
   ownAlive:self?['tankarena','hungry'].includes(game)?finite(self.dead)?self.dead<=0:null:typeof self.alive==='boolean'?self.alive:null:null,
   critical:active&&finite(health)&&health>0&&(game==='crane'?health===1:health/Math.max(1,maxHealth)<=.25),
   goals:Array.isArray(teamGoals)&&teamGoals.every(finite)?teamGoals.slice(0,2):null,
   team:game==='tanks'?self?.team==='red'?0:self?.team==='blue'?1:null:self?.team,
   canAct:!!self&&self.active!==false&&self.participant!==false&&self.alive!==false&&alive!==false&&!(self.dead>0)&&(!turnOwner||self.id===turnOwner),
   lap:game==='kart'&&finite(self?.lap)?self.lap:null,impact:game==='kart'?self?.impact:null,
   hits:game==='bow_club'?s.hit:null};
 }
 function createTracker(game){
  if(!ids.includes(game))throw new TypeError('Unsupported feedback game');
  const previous=new Map(),goalsSeen=new Set();let serial=0,critical=false,urgent=false;
  return Object.freeze({reset:()=>{previous.clear();goalsSeen.clear();critical=urgent=false;},observe(snapshot,{channel='state',selfId=null,info=null}={}){
   const next=project(game,snapshot,selfId,info),old=previous.get(channel);previous.set(channel,next);
   // Public/private packets can be interleaved. An absent metric does not
   // overwrite an authoritative personal health/timer metric from another
   // channel. A real pause/end clears both immediately.
   if(!next.active)critical=urgent=false;
   else {if(next.health!==null)critical=next.critical;if(next.remaining!==null)urgent=next.remaining>0&&next.remaining<=5;}
   const events=[],add=(type,semantic,extra={})=>events.push({type,id:`${game}:${channel}:${next.scope}:${++serial}:${semantic}`,semantic,intensity:.45,shake:false,haptic:!!selfId,...extra});
   // Joining/reconnecting midway must not replay old goals, hits or danger.
   if(!old)return {events,critical,urgent};
   // Public turn ownership, never private answers/input. A handoff may change
   // turn scope; compare only consecutive live snapshots with a known owner.
   if(old.active&&next.active&&old.turnIdentity!=null&&next.turnIdentity!=null&&old.turnIdentity!==next.turnIdentity&&next.turnOwner===next.selfId&&next.canAct)add('turn-ready','turn-ready',{id:`${game}:turn:${next.turnIdentity}:${next.turnOwner}`,hudOnly:true,impactSelector:{jenga:'#turn',curling:'#ss-turn',bowling:'#ss-turn'}[game]||selectors[game],impactPlayer:next.selfId,particles:true});
   if(old.scope!==next.scope)return {events,critical,urgent};
   const currentRound=old.active&&next.active;
   if(old.active&&next.goals&&old.goals){
    const team=next.goals.findIndex((n,i)=>n>old.goals[i]);
    const key=next.scope+':'+next.goals.join(':');
    if(team>=0&&!goalsSeen.has(key)){goalsSeen.add(key);if(goalsSeen.size>32)goalsSeen.delete(goalsSeen.values().next().value);add('goal',game==='tanks'?'flag-capture':'goal',{id:`${game}:goal:${key}`,announcement:game==='tanks'?'flag':'goal',team,intensity:.8,duration:360,particles:game!=='carryball',shake:!selfId,color:game==='tanks'?(team?'#9cb7ff':'#ff9aab'):team?'#b899ff':'#c8ff73',haptic:!!selfId,conceded:next.team!=null&&next.team!==team,impactSelector:selectors[game]});}
   }
   // Correct answers and end-of-turn rewards are often awarded atomically with
   // the reveal. Use the numeric award, never inspect the secret answer.
   if(old.active&&['reveal','between','finished','results'].includes(next.phase)&&finite(old.score)&&finite(next.score)&&next.score>old.score)add('score','score',{id:`${game}:score:${next.scope}:${next.selfId}:${next.score}`,visual:false,impactSelector:selectors[game],impactPlayer:next.selfId});
   if(currentRound){
    if(finite(old.health)&&finite(next.health)&&next.health<old.health&&['tanks','tankarena','naval'].includes(game))add('hit','damage',{intensity:Math.min(1,.35+(old.health-next.health)/Math.max(1,next.maxHealth)),haptic:!!selfId,color:'#ff667c'});
    if(old.ownAlive===false&&next.ownAlive===true&&['tanks','tankarena','hungry'].includes(game))add('recovery','respawn',{hudOnly:true,impactSelector:selectors[game],impactPlayer:next.selfId,color:'#c8ff73'});
    if(old.ownAlive===true&&next.ownAlive===false&&['push','shrink','snakelines','flappy','hungry'].includes(game))add('elimination','elimination',{color:'#ff667c',intensity:.7,haptic:!!selfId});
    // Scores that represent food/taps/frame ticks intentionally do not burst.
    if(finite(old.score)&&finite(next.score)&&next.score>old.score)add('score','score',{id:`${game}:score:${next.scope}:${next.selfId}:${next.score}`,visual:!['curling','bowling','marble_bloom','mines'].includes(game),hudOnly:true,impactSelector:selectors[game],impactPlayer:next.selfId});
    else if(!selfId){const award=Object.entries(next.allScores).find(([id,n])=>finite(old.allScores[id])&&n>old.allScores[id]);if(award)add('score','score',{haptic:false,visual:false,impactSelector:selectors[game],impactPlayer:award[0]});}
    if(finite(old.lap)&&finite(next.lap)&&next.lap>old.lap)add('score','lap',{intensity:.65,visual:false,impactSelector:selectors.kart});
    if(next.impact&&next.impact.seq!==old.impact?.seq&&next.impact.strength>=70)add('collision','wall-hit',{intensity:Math.min(1,next.impact.strength/180),haptic:!!selfId,visual:false});
    if(old.remaining>5&&next.remaining>0&&next.remaining<=5)add('danger','last-five',{intensity:.45,haptic:!!selfId&&next.canAct});
    if(!old.critical&&next.critical)add('danger','critical-health',{intensity:.65,haptic:!!selfId,color:'#ff667c'});
    if(game==='crane'&&finite(old.health)&&next.health<old.health)add('hit','lost-life',{intensity:.5,haptic:!!selfId,color:'#ff667c'});
   }
   // One packet may both damage the player and cross a danger threshold.
   // Preserve both visual cues, but send the most meaningful haptic first;
   // otherwise the runtime cooldown would swallow the critical warning.
   const priorities={'critical-health':5,goal:4,'flag-capture':4,elimination:4,'last-five':3,'lost-life':2,damage:1,score:1};
   const strongest=events.filter(e=>e.haptic).reduce((best,e)=>!best||(priorities[e.semantic]||0)>(priorities[best.semantic]||0)?e:best,null);
   if(strongest)for(const event of events)if(event!==strongest)event.haptic=false;
   return {events,critical,urgent};
  }});
 }
 return Object.freeze({ids:Object.freeze(ids),createTracker,project});
});
