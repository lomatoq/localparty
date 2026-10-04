/* Quiz polish (social lane, 2026-10-02): question entrance, lock-in, reveal
   beats, score count-ups and haptics. Reads the snapshot app.js just rendered;
   never sends input and never reads anything the server has not published.
   The correct index only exists in reveal snapshots, so nothing here can hint
   at it earlier. */
(()=>{'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),$=id=>document.getElementById(id);
 const ease='cubic-bezier(.23,1,.32,1)';
 let lastKey='',lastPhase='',lastState='open',lastSubmitted=-1,lastScore=null,scores=new Map(),counting=new WeakMap();
 const feel=(type,options)=>{try{window.LocalPartyFeel?.emit(type,options);}catch{}};
 const motion=()=>!reduced.matches&&!document.hidden&&!window.PARTY_GAME_CLOCK?.paused;
 function countUp(node,from,to,format){if(!node)return;if(!motion()||from===to){node.textContent=format(to);return;}
  node.textContent=format(from);const start=performance.now(),duration=Math.min(900,420+Math.abs(to-from)/6),token={};counting.set(node,token);
  const step=now=>{if(counting.get(node)!==token)return;const t=Math.min(1,(now-start)/duration),k=1-Math.pow(1-t,3);node.textContent=format(Math.round(from+(to-from)*k));if(t<1)requestAnimationFrame(step);};requestAnimationFrame(step);}
 const ru=n=>Number(n).toLocaleString('ru');
 function floatGain(anchor,text){if(!anchor||!motion())return;const r=anchor.getBoundingClientRect();if(!r.width)return;const chip=document.createElement('span');chip.className='qp-gain';chip.setAttribute('aria-hidden','true');chip.textContent=text;chip.style.left=(r.left+r.width/2)+'px';chip.style.top=(r.top)+'px';document.body.append(chip);
  chip.animate([{opacity:0,transform:'translate(-50%,6px) scale(.9)'},{opacity:1,transform:'translate(-50%,-14px) scale(1.06)',offset:.3},{opacity:1,transform:'translate(-50%,-22px) scale(1)',offset:.7},{opacity:0,transform:'translate(-50%,-34px) scale(.98)'}],{duration:1150,easing:ease}).onfinish=()=>chip.remove();}
 function enterQuestion(){if(!motion())return;
  $('question')?.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:320,easing:ease});
  [...$('answers').children].forEach((b,i)=>b.animate([{opacity:0,transform:'translateY(14px) scale(.98)'},{opacity:1,transform:'none'}],{duration:280,delay:110+i*60,easing:ease,fill:'backwards'}));}
 function revealBeat(host,s){const answers=$('answers');if(!answers)return;answers.classList.remove('qp-revealing');void answers.offsetWidth;answers.classList.add('qp-revealing');
  if(!motion())return;
  $('explanation')?.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:300,delay:380,easing:ease,fill:'backwards'});}
 window.addEventListener('quiz:rendered',({detail:{state:s,host,pending}})=>{
  const q=s.question,key=(q?.id||'')+'|'+s.phase+'|'+s.round,me=s.me;
  const answerState=me?.answer!=null?'accepted':pending!=null?'pending':'open';
  if(key!==lastKey){
   if(s.phase==='question'&&!(lastPhase==='paused'))enterQuestion();
   if(s.phase==='reveal')revealBeat(host,s);
  }
  // Lock-in: the tap itself is acknowledged at once (pending), the server confirmation (accepted) settles it.
  if(!host&&s.phase==='question'&&answerState!=='open'&&lastState==='open'&&key===lastKey){
   feel('hit',{intensity:.35,visual:false,shake:false,id:'quiz-lock-'+s.round});
   const picked=$('answers')?.querySelector('.picked');picked?.classList.add('qp-locking');setTimeout(()=>picked?.classList.remove('qp-locking'),520);
  }
  if(!host&&s.phase==='reveal'&&key!==lastKey&&me&&me.answer!=null){
   const right=me.answer===q?.correct;feel(right?'score':'danger',{intensity:right?.75:.3,visual:false,shake:false,id:'quiz-result-'+s.round});
  }
  // TV: every new locked answer ticks the received count.
  if(host&&s.phase==='question'&&key===lastKey&&s.submitted>lastSubmitted&&lastSubmitted>=0&&motion())$('status')?.animate([{transform:'scale(1)'},{transform:'scale(1.07)',offset:.35},{transform:'scale(1)'}],{duration:320,easing:ease});
  lastSubmitted=s.phase==='question'?s.submitted:-1;
  // Score count-ups: personal HUD and standings, only when the authoritative score rises.
  if(me){const score=Number(me.score)||0;if(lastScore!==null&&score>lastScore){countUp($('quizScore'),lastScore,score,ru);floatGain($('quizScore'),'+'+ru(score-lastScore));}lastScore=score;}
  for(const p of s.players){const row=$('board')?.querySelector(`.row[data-id="${CSS.escape(p.id)}"]`),before=scores.get(p.id);if(row&&before!=null&&p.score>before){countUp(row.querySelector('.points'),before,p.score,ru);row.classList.remove('qp-gained');void row.offsetWidth;row.classList.add('qp-gained');}scores.set(p.id,p.score);}
  lastKey=key;lastPhase=s.phase;lastState=answerState;
 });
})();
