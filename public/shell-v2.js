(() => {
 'use strict';
 const ids=['bowling','curling','gate_siege','pop_shots'],root=document.documentElement;
 // Image replacement is atomic per card; fall back to its current art if a file is missing.
 function art(){for(const id of ids){const card=document.querySelector(`.game[data-id="${id}"]`);if(!card||card.dataset.polishArt)return;card.dataset.polishArt='v2';const image=card.querySelector('img.symbol');if(!image)continue;
   const next=new Image();next.onload=()=>{image.src=next.src;image.decoding='async';card.classList.add('lp-art-v2');};next.src=`/assets/games/${id}-card-v2.webp`;
 }}
 let queued=false;const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;art();measure();});};
 function measure(){const head=document.querySelector('.app-header'),controls=document.getElementById('sessionControls');if(head){const b=head.getBoundingClientRect();root.style.setProperty('--lp-shell-top',Math.ceil(Math.max(0,b.bottom)+8)+'px');}const h=controls&&!controls.hidden?Math.max(40,controls.getBoundingClientRect().height):40;root.style.setProperty('--lp-shell-bottom',Math.ceil(h+15)+'px');}
 const watcher=new ResizeObserver(queue);const head=document.querySelector('.app-header'),controls=document.getElementById('sessionControls');if(head)watcher.observe(head);if(controls)watcher.observe(controls);
 const catalog=document.getElementById('catalogSection');if(catalog)new MutationObserver(queue).observe(catalog,{childList:true,subtree:true});new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['class','data-game']});
 window.addEventListener('resize',queue,{passive:true});window.visualViewport?.addEventListener('resize',queue,{passive:true});document.fonts?.ready.then(queue);queue();
 // The shared shell owns room, identity, pause and timer. A native game owns only its HUD.
 window.addEventListener('message',e=>{if(e.source!==document.getElementById('gameFrame')?.contentWindow||e.origin!==location.origin)return;if(e.data?.type==='party-visual-ready')queue();});
})();
