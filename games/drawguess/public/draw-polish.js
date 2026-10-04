/* Draw & Guess polish (social lane, 2026-10-02): guess-correct moments, turn
   entrance and the reveal beat. The word is only read from #revealWord, which
   the server fills in the public reveal phase. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)'),ease='cubic-bezier(.23,1,.32,1)';
 const motion=()=>!reduced.matches&&!document.hidden&&!window.PARTY_GAME_CLOCK?.paused;
 const feel=(t,o)=>{try{window.LocalPartyFeel?.emit(t,o);}catch{}};
 const burstAt=(el,count=14)=>{const r=el?.getBoundingClientRect();if(r?.width&&motion())window.HeyPalsSprites?.burst(r.left+r.width/2,r.top+r.height/2,{count,spread:Math.min(170,Math.max(90,r.width*.5))});};
 let last=null;
 window.addEventListener('draw:rendered',({detail:{state:s,host}})=>{
  if(!host&&s.phase==='drawing'&&s.me?.canGuess&&!s.me.guessed&&s.messages.some(m=>m.id===s.me.id&&!m.correct))$('status').textContent='Попробуйте ещё раз';
  const prev=last,correct=s.messages.filter(m=>m.correct).length;last={phase:s.phase,turnId:s.turnId,guessed:!!s.me?.guessed,correct,count:s.messages.length};
  if(!prev)return;
  if(s.phase==='drawing'&&prev.turnId!==s.turnId&&motion()){$('artist')?.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:320,easing:ease});$('canvas')?.animate([{opacity:.2,transform:'scale(.97)'},{opacity:1,transform:'none'}],{duration:360,delay:60,easing:ease,fill:'backwards'});}
  if(s.phase==='drawing'&&prev.turnId===s.turnId){
   if(s.me?.guessed&&!prev.guessed){feel('score',{intensity:.75,visual:false,shake:false,id:'draw-guess-'+s.turnId});const f=$('guessForm');f?.classList.remove('dp-correct');void f?.offsetWidth;f?.classList.add('dp-correct');burstAt(f,16);}
   if(s.messages.length>prev.count&&motion()){const newest=$('messages')?.firstElementChild;newest?.animate([{opacity:0,transform:'translateY(-8px) scale(.98)'},{opacity:1,transform:'none'}],{duration:300,easing:ease});if(correct>prev.correct&&newest?.classList.contains('correctGuess'))newest.classList.add('dp-pop');}
  }
  if(s.phase==='reveal'&&prev.phase!=='reveal'){const w=$('revealWord');if(w&&motion())setTimeout(()=>burstAt(w,host?20:12),220);}
 });
})();
