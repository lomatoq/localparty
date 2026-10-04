/* Crocodile polish (social lane, 2026-10-02). The secret word only exists in
   the actor's own snapshot; this file animates it there and never copies it
   anywhere else. Other screens react to public counters only. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)'),ease='cubic-bezier(.23,1,.32,1)';
 const motion=()=>!reduced.matches&&!document.hidden&&!window.PARTY_GAME_CLOCK?.paused;
 const feel=(t,o)=>{try{window.LocalPartyFeel?.emit(t,o);}catch{}};
 let last=null;
 function chip(anchor,text,cls){if(!anchor||!motion())return;const r=anchor.getBoundingClientRect();if(!r.width)return;const c=document.createElement('span');c.className='cp-gain '+(cls||'');c.setAttribute('aria-hidden','true');c.textContent=text;c.style.left=(r.left+r.width/2)+'px';c.style.top=r.top+'px';document.body.append(c);
  c.animate([{opacity:0,transform:'translate(-50%,6px) scale(.9)'},{opacity:1,transform:'translate(-50%,-16px) scale(1.08)',offset:.3},{opacity:1,transform:'translate(-50%,-24px)',offset:.7},{opacity:0,transform:'translate(-50%,-38px)'}],{duration:1100,easing:ease}).onfinish=()=>c.remove();}
 window.addEventListener('croc:rendered',({detail:{state:s,host}})=>{
  if(!host&&s.phase==='between')$('actor').textContent='Следующий актёр';
  const prev=last;last={phase:s.phase,turn:s.turn,wordId:s.wordId,guessed:s.turnGuessed,skips:s.turnSkips,secret:!!s.secret};
  if(!prev)return;const word=$('word'),panel=$('secretPanel');
  const newTurn=s.phase==='turn'&&(prev.phase!=='turn'||prev.turn!==s.turn);
  if(newTurn&&motion()){$('actor')?.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:320,easing:ease});
   if(s.secret)panel?.animate([{opacity:0,transform:'perspective(900px) rotateY(-70deg) scale(.94)'},{opacity:1,transform:'none'}],{duration:460,delay:80,easing:ease,fill:'backwards'});}
  if(s.phase!=='turn'||newTurn)return;
  const guessed=s.turnGuessed>prev.guessed,skipped=s.turnSkips>prev.skips;
  if(guessed){chip(s.secret?$('guessed'):($('turnStats')||$('actor')),'+100');$('turnStats')?.animate([{transform:'scale(1)'},{transform:'scale(1.06)',offset:.35},{transform:'none'}],{duration:340,easing:ease});
   if(s.secret){feel('score',{intensity:.7,visual:false,shake:false,id:'croc-guess-'+s.wordId});const r=$('guessed')?.getBoundingClientRect();if(r&&motion())window.HeyPalsSprites?.burst(r.left+r.width/2,r.top+r.height/2,{count:14,spread:Math.min(150,r.width*.7)});panel?.classList.remove('cp-hit');void panel?.offsetWidth;panel?.classList.add('cp-hit');}}
  if(s.secret&&s.wordId!==prev.wordId&&motion()&&word){
   if(skipped&&!guessed)word.animate([{opacity:0,transform:'translateX(38px)'},{opacity:1,transform:'none'}],{duration:280,easing:ease});
   else word.animate([{opacity:0,transform:'perspective(700px) rotateX(-80deg)'},{opacity:1,transform:'none'}],{duration:380,delay:guessed?140:0,easing:ease,fill:'backwards'});}
  if(skipped&&s.secret)feel('hit',{intensity:.25,visual:false,shake:false,id:'croc-skip-'+s.wordId});
 });
})();
