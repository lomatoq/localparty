// Reuse the project's eight-frame explosion library; no new GPU effect stack.
(() => {
 if(!/\/host(?:\.html)?$/.test(location.pathname))return;
 const frames=Array.from({length:8},(_,i)=>{const image=new Image();image.src='/assets/gameplay/sports-siege/sprites/swarm-explosion-'+i+'.webp';return image;});
 const active=new Set(),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 window.mineExplosion=(target)=>{
  if(!target||reduced.matches)return;
  while(active.size>=12){const first=active.values().next().value;first.remove();active.delete(first);}
  const el=document.createElement('img'),r=target.getBoundingClientRect(),size=r.width*(2.7+Math.random()*.7),duration=480+Math.random()*230,angle=(Math.random()-.5)*60;
  el.className='mine-explosion';el.alt='';el.style.cssText=`position:fixed;pointer-events:none;z-index:100;width:${size}px;height:${size}px;left:${r.left+r.width/2-size/2}px;top:${r.top+r.height/2-size/2}px;transform:rotate(${angle}deg);object-fit:contain`;
  document.body.append(el);active.add(el);const start=performance.now();let previous=-1;
  function frame(now){if(!active.has(el))return;const progress=(now-start)/duration;if(progress>=1){el.remove();active.delete(el);return;}const index=Math.min(7,Math.floor(progress*8));if(index!==previous){el.src=frames[index].src;previous=index;}el.style.opacity=String(Math.min(1,(1-progress)*4));requestAnimationFrame(frame);}requestAnimationFrame(frame);
 };
})();
