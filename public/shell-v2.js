(() => {
 'use strict';
 const ids=['bowling','curling','gate_siege','pop_shots'],root=document.documentElement;
 // Load the approved alpha-matted cutouts atomically; never replace a good image
 // with a broken URL. Per-card CSS clips shaft exits and fades the cut grip.
 function art(){for(const id of ids){const card=document.querySelector(`.game[data-id="${id}"]`);if(!card||card.dataset.polishArt==='v3')continue;const image=card.querySelector('img.symbol');if(!image)continue;card.dataset.polishArt='v3';
   const next=new Image();next.decoding='async';next.onload=()=>{image.src=next.src;image.decoding='async';card.classList.add('lp-art-v2');card.dataset.artLoaded='true';};next.onerror=()=>{card.dataset.artLoaded='false';};next.src=`/assets/games/${id}-card-v3.avif`;
 }}
 let queued=false;const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;art();measure();});};
 function css(name,value){if(root.style.getPropertyValue(name)!==value)root.style.setProperty(name,value);}
 function measure(){const head=document.querySelector('.app-header'),controls=document.getElementById('sessionControls');if(head){const b=head.getBoundingClientRect();css('--lp-shell-top',Math.ceil(Math.max(0,b.bottom)+8)+'px');}const h=controls&&!controls.hidden?Math.max(40,controls.getBoundingClientRect().height):40;css('--lp-shell-bottom',Math.ceil(h+15)+'px');}
 const watcher=new ResizeObserver(queue);const head=document.querySelector('.app-header'),controls=document.getElementById('sessionControls');if(head)watcher.observe(head);if(controls)watcher.observe(controls);
 const catalog=document.getElementById('catalogSection');if(catalog)new MutationObserver(queue).observe(catalog,{childList:true,subtree:true});new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['class','data-game']});
 window.addEventListener('resize',queue,{passive:true});window.visualViewport?.addEventListener('resize',queue,{passive:true});document.fonts?.ready.then(queue);queue();
 window.addEventListener('message',e=>{if(e.source!==document.getElementById('gameFrame')?.contentWindow||e.origin!==location.origin)return;if(e.data?.type==='party-visual-ready')queue();});
})();
