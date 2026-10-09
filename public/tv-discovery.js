/* TV composition reuses the mobile discovery renderer and its motion timelines. */
(()=>{
 const intro=document.querySelector('#lobby>.intro'),browse=document.getElementById('tvBrowse'),pick=document.getElementById('preview');
 if(!intro||!browse||!pick)return;
 browse.prepend(intro);browse.prepend(pick);
 const medallion=document.createElement('span');medallion.className='tv-pick-medallion';pick.prepend(medallion);medallion.append(document.getElementById('cover'));
 const play=document.createElement('button');play.className='tv-pick-play';play.type='button';play.setAttribute('aria-label','Play on your controller');play.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4.8c-1.3-.8-3 .1-3 1.6v11.2c0 1.5 1.7 2.4 3 1.6l9-5.6c1.2-.7 1.2-2.5 0-3.2Z"/></svg>';pick.append(play);
 for(const cls of ['tv-pick-rim','tv-pick-flow','tv-pick-glare']){const layer=document.createElement('span');layer.className=cls;layer.setAttribute('aria-hidden','true');layer.append(document.createElement('i'));pick.append(layer);}
 const visible=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('tv-pick-awake',e.isIntersecting)),{threshold:.1});visible.observe(pick);
 function controllerHint(){const notice=document.getElementById('notice');notice.textContent='Press Play on your controller';notice.hidden=false;setTimeout(()=>notice.hidden=true,2500);return false;}
 play.onclick=controllerHint;
 // The lamp belongs to the screen edge, outside the catalog's clipping mask.
 const stage=document.getElementById('tvStage'),lobby=document.getElementById('lobby');let edgeLamp,lampFrame=0;
 const queueLamp=()=>{if(!lampFrame)lampFrame=requestAnimationFrame(()=>{lampFrame=0;placeLamp();});};
 // Reparented decoration no longer inherits the lobby's hidden state. Keep
 // visibility separate from positioning, including source removal, so a game
 // can hide these layers before the next paint without reading layout.
 function syncLampVisibility(source=intro.querySelector('.spotlight-fixture-left')){
  const shown=!!source&&!lobby.hidden&&!intro.hidden;
  if(edgeLamp&&edgeLamp.hidden===shown)edgeLamp.hidden=!shown;
  for(const light of stage.querySelectorAll('.tv-screen-light'))if(light.hidden===shown)light.hidden=!shown;
  return shown;
 }
 new MutationObserver(records=>{if(!records.some(r=>r.type==='attributes'||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches('.spotlight-edge-light,.spotlight-fixture-left')||n.querySelector('.spotlight-edge-light,.spotlight-fixture-left')))))return;for(const light of intro.querySelectorAll('.spotlight-edge-light')){light.classList.add('tv-screen-light');stage.append(light);}syncLampVisibility();queueLamp();}).observe(intro,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
 new MutationObserver(()=>{syncLampVisibility();queueLamp();}).observe(lobby,{attributes:true,attributeFilter:['hidden']});
 function placeLamp(){
  const source=intro.querySelector('.spotlight-fixture-left');if(!syncLampVisibility(source))return;
  if(!edgeLamp){edgeLamp=source.cloneNode(true);edgeLamp.classList.add('tv-screen-lamp');stage.append(edgeLamp);}
  const lights=stage.querySelectorAll('.tv-screen-light');
  const frame=stage.getBoundingClientRect(),area=intro.getBoundingClientRect(),scale=frame.width/stage.offsetWidth;
  const top=(area.top-frame.top)/scale,lampTop=(top+232)+'px',lightTop=top+'px';
  if(edgeLamp.style.top!==lampTop)edgeLamp.style.top=lampTop;
  for(const light of lights)if(light.style.top!==lightTop)light.style.top=lightTop;
 }
 browse.addEventListener('scroll',queueLamp,{passive:true});const size=new ResizeObserver(queueLamp);size.observe(stage);size.observe(intro);
 window.HeyPalsTVDiscovery={update(state){
  const suppressed=!!(state.selected||state.active),visibilityChanged=intro.hidden!==suppressed;if(visibilityChanged)intro.hidden=suppressed;
  if(!suppressed)window.PartySpotlight?.update(state,{host:true,ready:true,displayOnly:true,launch:controllerHint});
  if(visibilityChanged)queueLamp();
  const icon=document.getElementById('playersNeeded');if(icon&&!icon.querySelector('.tv-pick-person')){const person=window.PartyIcons?.create('user-avatar');if(person){person.classList.add('tv-pick-person');icon.prepend(person);}}
 }};
})();
