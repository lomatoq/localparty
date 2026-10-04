/* Spy polish (social lane, 2026-10-02). Phone: hold ring and a dossier-cover
   flip with identical timing for spies and locals, so a neighbour cannot read
   the role from the motion; release hides the content at once. TV: ready
   cards, vote count and the result land with short beats. Public DOM only. */
(()=>{'use strict';
 const $=s=>document.querySelector(s),reduced=matchMedia('(prefers-reduced-motion: reduce)'),ease='cubic-bezier(.23,1,.32,1)';
 const motion=()=>!reduced.matches&&!document.hidden;
 const card=$('#secretCard');
 if(card){const on=()=>{card.classList.add('holding');try{window.LocalPartyFeel?.emit('hit',{intensity:.25,visual:false,shake:false});}catch{}},off=()=>card.classList.remove('holding');
  card.addEventListener('pointerdown',on);for(const t of ['pointerup','pointercancel','pointerleave','blur'])card.addEventListener(t,off);window.addEventListener('blur',off);
  card.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)&&!e.repeat)on();});card.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key))off();});}
 const grid=$('#readyGrid');let ready=new Set();
 if(grid)new MutationObserver(()=>{const now=new Set();[...grid.children].forEach(item=>{const name=item.querySelector('.player-name')?.textContent||'';if(item.classList.contains('ready')){now.add(name);if(!ready.has(name)&&ready.size+grid.children.length&&motion())item.animate([{transform:'scale(.94)'},{transform:'scale(1.05)',offset:.4},{transform:'none'}],{duration:420,easing:ease});}});ready=now;}).observe(grid,{childList:true});
 const votes=$('#voteCount');let lastVotes=null;
 if(votes)new MutationObserver(()=>{const n=Number(votes.textContent)||0;if(lastVotes!=null&&n>lastVotes&&motion())$('.vote-orb')?.animate([{transform:'scale(1)'},{transform:'scale(1.12)',offset:.35},{transform:'none'}],{duration:380,easing:ease});lastVotes=n;}).observe(votes,{childList:true,characterData:true,subtree:true});
 const result=$('#resultView');
 if(result&&$('#resultTitle'))new MutationObserver(()=>{if(result.classList.contains('hidden')||!motion())return;
  $('#resultIcon')?.animate([{opacity:0,transform:'translateY(-24px) scale(.6) rotate(-10deg)'},{opacity:1,transform:'translateY(4px) scale(1.12) rotate(3deg)',offset:.6},{opacity:1,transform:'none'}],{duration:560,easing:ease});
  $('#resultTitle')?.animate([{opacity:0,transform:'scale(1.25)',letterSpacing:'.04em'},{opacity:1,transform:'none'}],{duration:380,delay:180,easing:ease,fill:'backwards'});
  [...($('#revealChips')?.children||[])].forEach((c,i)=>c.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:300,delay:420+i*80,easing:ease,fill:'backwards'}));
  const r=$('#resultIcon')?.getBoundingClientRect();if(r?.width)setTimeout(()=>window.HeyPalsSprites?.burst(r.left+r.width/2,r.top+r.height/2,{count:20,spread:160}),300);
 }).observe(result,{attributes:true,attributeFilter:['class']});
})();
