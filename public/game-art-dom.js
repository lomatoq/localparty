/* Small shared prop accents for DOM-led games; authored drawings and 3D stay intact. */
(() => {
 'use strict';
 const game=document.documentElement.dataset.partyGame;
 const config={warsaw:['star','.screen-workspace .stage h2'],sinyakquiz:['badge','.screen-workspace .stage h2'],millionaire:['crystal','.lobbyPanel h2,#finish h1,.questionMeta'],spy:['badge','.host-shell .players-card h2,.roster-card h2,#resultTitle'],crocodile:['star','.screen-workspace .stage h2'],monster:['blob','#revealTitle'],drawguess:['sparkle','.screen-workspace .stage h2'],naval:['ship','.naval-console h2'],chaos:['sparkle','#game h1,#game h2'],jenga:['wood-block','.side-title']}[game];
 if(!config||!document.documentElement.classList.contains('party-host'))return;
 const style=document.createElement('style');style.textContent='.party-prop-heading{padding-inline-start:48px!important;background-repeat:no-repeat!important;background-size:38px 38px!important;background-position:left center!important;min-height:38px}.party-prop-accent{display:inline-block;width:38px;height:38px;object-fit:contain;vertical-align:middle;margin:0 10px 0 0;pointer-events:none;user-select:none;filter:drop-shadow(0 3px 5px #0004)}.party-event-accent{width:22px;height:22px;margin-right:8px}html[data-party-phase=results] .party-prop-accent{animation:party-prop-arrive .35s ease-out}@keyframes party-prop-arrive{from{transform:translateY(6px) scale(.9)}to{transform:none}}@media(prefers-reduced-motion:reduce){.party-prop-accent{animation:none!important}}';document.head.append(style);
 function decorate(){
  for(const node of document.querySelectorAll(config[1])){if(node.classList.contains('party-prop-heading'))continue;node.classList.add('party-prop-heading');node.style.backgroundImage='url(/assets/gameplay/sprites/'+config[0]+'.webp)';}
  if(game==='naval')for(const node of document.querySelectorAll('#broadcastEvents li')){if(node.querySelector('.party-event-accent'))continue;const img=document.createElement('img');img.className='party-prop-accent party-event-accent';img.src='/assets/gameplay/sprites/'+(/потоп/i.test(node.textContent)?'ship':/попад|попал/i.test(node.textContent)?'sparkle':'cloud')+'.webp';img.alt='';img.draggable=false;node.prepend(img);}
 }
 const start=()=>{decorate();let queued=false;new MutationObserver(records=>{if(records.every(r=>[...r.addedNodes].every(n=>n.nodeType===1&&n.classList.contains('party-prop-accent'))))return;if(queued)return;queued=true;setTimeout(()=>{queued=false;decorate()},100)}).observe(document.body,{childList:true,subtree:true});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
