(()=>{
 'use strict';
 const root=document.documentElement;
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const state=new WeakMap();
 const scoreSelector='.points,.score-value,.ss-player-score,#score,#myScore,#height,#force,[data-motion-value]';
 const statusSelector='#hudLabel,#hudProgress,#phase,#ss-stage,#ss-status,#active,#message,#progress,#cue,[data-motion-status]';
 const visible=el=>{const style=getComputedStyle(el);return style.display!=='none'&&style.visibility!=='hidden'&&el.getClientRects().length>0;};
 const pulse=(el,className)=>{
  if(media.matches||!visible(el))return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  clearTimeout(state.get(el));
  state.set(el,setTimeout(()=>el.classList.remove(className),520));
 };
 const textOf=el=>(el.textContent||'').replace(/\s+/g,' ').trim();
 const changed=el=>{
  if(!(el instanceof Element))return;
  const text=textOf(el),previous=el.dataset.lpMotionText;
  el.dataset.lpMotionText=text;
  if(previous===undefined||previous===text)return;
  if(el.matches(scoreSelector))pulse(el,'lp-motion-pulse');
  else if(el.matches(statusSelector))pulse(el,'lp-motion-status');
 };
 const scan=node=>{
  const element=node instanceof Element?node:node.parentElement;
  if(!element)return;
  if(element.matches(scoreSelector+','+statusSelector))changed(element);
  element.querySelectorAll?.(scoreSelector+','+statusSelector).forEach(changed);
 };
 const setPreference=()=>root.classList.toggle('lp-motion-reduced',media.matches);
 setPreference();
 media.addEventListener?.('change',setPreference);
 document.querySelectorAll(scoreSelector+','+statusSelector).forEach(el=>{el.dataset.lpMotionText=textOf(el);});
 const observer=new MutationObserver(records=>{
  const nodes=new Set();
  for(const record of records){
   if(record.type==='characterData')nodes.add(record.target.parentElement);
   else if(record.type==='childList')nodes.add(record.target);
   else if(record.attributeName==='open'||record.attributeName==='hidden'||record.attributeName==='class')nodes.add(record.target);
  }
  nodes.forEach(scan);
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['open','hidden','class']});
 requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('lp-motion-ready')));
})();
