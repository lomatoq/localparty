/* Bounded discovery deck: one decoded slide and one composited progress animation. */
(() => {
 'use strict';
 let edgeLight,root,slide,play,pause,status,indicators,state,options,current,deck=[],index=-1,visible=false,paused=false,changing=false,pending=false,pendingTimer=0,progress=null,touch=null,keyboardFocus=false;
 const logoCache=new Map();let labelAnimation=null,motionEpoch=0,coastPosition=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const text=(tag,cls,value)=>{const n=document.createElement(tag);n.className=cls;n.textContent=value;return n;};
 const modal=()=>document.querySelector('dialog[open],:popover-open')||document.body.classList.contains('profile-editing');
 function mount(){
  const stage=document.querySelector('.headline-stage');if(!stage)return false;stage.classList.add('has-game-spotlight');stage.closest('.intro').classList.add('spotlight-intro');
  root=text('section','game-spotlight','');root.setAttribute('aria-label','Discover a game');root.dataset.noTranslate='';
  const top=text('div','spotlight-top','');top.append(text('span','spotlight-eyebrow','YOUR NEXT ROUND'));
  pause=text('button','spotlight-pause','Ⅱ');pause.type='button';pause.setAttribute('aria-label','Pause game suggestions');pause.setAttribute('aria-pressed','false');
  pause.onclick=()=>{paused=!paused;pause.replaceChildren(window.PartyIcons?.create(paused?'play':'pause')||text('span','',paused?'▶':'Ⅱ'));pause.setAttribute('aria-pressed',String(paused));pause.setAttribute('aria-label',paused?'Resume game suggestions':'Pause game suggestions');schedule();};if(window.PartyIcons)pause.replaceChildren(PartyIcons.create('pause'));top.append(pause);
  indicators=text('div','spotlight-indicators','');indicators.setAttribute('aria-label','Choose a suggested game');
  slide=text('div','spotlight-slide','');slide.setAttribute('aria-live','off');
  const actions=text('div','spotlight-actions','');play=text('button','primary spotlight-play','');play.type='button';play.append(text('span','spotlight-play-label','PLAY'));const playIcon=window.PartyIcons?.create('play')||text('span','','▶');playIcon.classList.add('spotlight-standard-icon');playIcon.setAttribute('aria-hidden','true');const iconTrail=text('span','spotlight-icon-trail','');iconTrail.setAttribute('aria-hidden','true');iconTrail.append(playIcon,playIcon.cloneNode(true),playIcon.cloneNode(true));play.append(iconTrail);const wave=text('span','spotlight-wave',''),glare=text('span','spotlight-glare','');wave.setAttribute('aria-hidden','true');glare.setAttribute('aria-hidden','true');glare.append(text('i','',''));const echo=wave.cloneNode();echo.classList.add('spotlight-wave-echo');play.append(wave,echo,glare);
  play.onclick=()=>{if(changing||touch||play.disabled||!current)return;pending=true;refresh();clearTimeout(pendingTimer);pendingTimer=setTimeout(()=>{pending=false;refresh();schedule();},8000);if(options.launch(current.id,play)===false){pending=false;clearTimeout(pendingTimer);refresh();schedule();}};
  actions.append(play);status=text('small','spotlight-status','');status.setAttribute('role','status');root.append(top,slide,actions,indicators,status);stage.append(root);
  const fixtures=text('div','spotlight-fixtures','');fixtures.setAttribute('aria-hidden','true');root.append(fixtures);
  for(const side of ['left','right']){const fixture=new Image();fixture.src='/assets/ui/spotlight-lamp181.webp';fixture.alt='';fixture.className='spotlight-fixture spotlight-fixture-'+side;fixture.decoding='async';fixtures.append(fixture);}

  // Equal 12px expansion on every side; measure only when the button resizes.
  new ResizeObserver(()=>{const w=wave.offsetWidth,h=wave.offsetHeight;if(w&&h){play.style.setProperty('--wave-x',String(1+24/w));play.style.setProperty('--wave-y',String(1+24/h));}}).observe(play);
  slide.addEventListener('pointerdown',e=>{if(!e.isPrimary||pending||state.active)return;const start=changing?interruptMotion():index;touch={x:e.clientX,y:e.clientY,id:e.pointerId,start,pos:start,lastX:e.clientX,time:performance.now(),velocity:0,nodes:new Map(),picked:Math.round(start),axis:null};schedule();},{passive:true});
  document.addEventListener('pointermove',e=>{if(!touch||touch.id!==e.pointerId)return;const t=touch,dx=e.clientX-t.x,dy=e.clientY-t.y;if(!t.axis&&Math.max(Math.abs(dx),Math.abs(dy))>5)t.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';if(t.axis!=='x')return;const now=performance.now();t.velocity=(e.clientX-t.lastX)/Math.max(16,now-t.time);t.lastX=e.clientX;t.time=now;t.pos=t.start-dx/Math.max(120,slide.clientWidth*.48);paintDrag(t);},{passive:true});
  document.addEventListener('pointerup',e=>{if(!touch||touch.id!==e.pointerId)return;const t=touch;if(!t.axis&&Math.abs(e.clientX-t.x)>36&&Math.abs(e.clientX-t.x)>Math.abs(e.clientY-t.y)*1.4){t.axis='x';t.pos=t.start-(e.clientX-t.x)/Math.max(120,slide.clientWidth*.48);paintDrag(t);}finishDrag(false);},{passive:true});
  document.addEventListener('pointercancel',()=>finishDrag(true),{passive:true});
  window.addEventListener('blur',()=>finishDrag(true));
  root.addEventListener('focusin',e=>{keyboardFocus=e.target.matches(':focus-visible');schedule();});root.addEventListener('focusout',()=>{keyboardFocus=false;schedule();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.15}).observe(root);
  document.addEventListener('visibilitychange',schedule);window.addEventListener('party-native-hide',schedule);window.addEventListener('party-native-resume',schedule);reduced.addEventListener('change',schedule);
  // Lifecycle attributes only; never watch subtree style changes or run a frame loop.
  const lifecycle=new MutationObserver(schedule);
  document.querySelectorAll('dialog,[popover]').forEach(n=>{lifecycle.observe(n,{attributes:true,attributeFilter:['open','hidden']});n.addEventListener('toggle',schedule);});
  lifecycle.observe(document.body,{attributes:true,attributeFilter:['class']});return true;
 }
 function makeDeck(){
  const all=(state.catalog||[]).filter(g=>g.id&&g.title),count=state.players?.length||0,fit=all.filter(g=>count>=g.min&&count<=g.max),pool=fit.length?fit:all;
  const plays=g=>state.gameActivity?.[g.id]?.matches||state.gamePopularity?.[g.id]||0;
  const shuffled=pool.slice();for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  const priority=['bowling','curling','pocket_siege'].map(id=>pool.find(g=>g.id===id)).filter(Boolean),popular=pool.filter(g=>plays(g)>0).sort((a,b)=>plays(b)-plays(a)),fresh=shuffled.filter(g=>!plays(g));
  const result=[];const add=g=>{if(g&&!result.some(x=>x.id===g.id)&&result.length<6)result.push(g);};
  add(priority[0]);add(popular[0]);add(priority[1]);add(fresh.find(g=>!priority.includes(g)));add(priority[2]);shuffled.forEach(add);return result;
 }
 function canCycle(){return visible&&!document.hidden&&!window.__partyNativeHidden&&!paused&&!reduced.matches&&!pending&&!changing&&!touch&&!keyboardFocus&&!state?.active&&!state?.busy&&options?.ready&&!modal();}
 function schedule(){const run=!!canCycle();root?.classList.toggle('spotlight-awake',run);if(progress){if(run&&progress.playState==='paused')progress.play();else if(!run&&progress.playState==='running')progress.pause();}}
 function rebuildIndicators(){indicators.replaceChildren(...deck.map((g,i)=>{const button=text('button','spotlight-step','');button.type='button';button.setAttribute('aria-label',g.title);button.append(text('span','spotlight-step-track',''));button.firstChild.append(text('i','spotlight-step-fill',''));button.onclick=()=>{if(i!==index&&!changing){advance(i);}};return button;}));}
 function refresh(){
  if(!current)return;const count=state.players?.length||0,fit=count>=current.min&&count<=current.max;
  const blocked=Boolean(pending||state.busy||state.active||!options.ready||(!options.host&&!fit));if(play.disabled!==blocked)play.disabled=blocked;
  const label=pending||state.busy?'STARTING':options.host&&!fit&&!options.displayOnly?'LET’S PLAY':'PLAY';const labelNode=play.querySelector('.spotlight-play-label');if(labelNode.dataset.word!==label){labelNode.dataset.word=label;labelAnimation?.cancel();const oldLabel=labelNode.querySelector('.spotlight-word-ink')?.cloneNode(true);labelNode.replaceChildren(text('span','spotlight-word-ink',label));if(!reduced.matches&&oldLabel){if(oldLabel){oldLabel.classList.add('spotlight-label-outgoing');oldLabel.setAttribute('aria-hidden','true');labelNode.append(oldLabel);oldLabel.animate([{opacity:1},{opacity:0}],{duration:140,easing:'ease-out'}).finished.then(()=>oldLabel.remove()).catch(()=>oldLabel.remove());}labelAnimation=labelNode.firstElementChild.animate([{opacity:0},{opacity:1}],{duration:220,easing:'ease-out'});}}if(labelNode.classList.contains('is-play-art'))labelNode.classList.remove('is-play-art');const accessible=label+' '+current.title;if(play.getAttribute('aria-label')!==accessible)play.setAttribute('aria-label',accessible);
  if(status.textContent)status.textContent='';if(!status.hidden)status.hidden=true;if(root.hidden!==!!state.active)root.hidden=!!state.active;
  if(touch?.axis==='x')return;indicators.querySelectorAll('button').forEach((b,i)=>{if(b.disabled!==Boolean(changing||pending))b.disabled=Boolean(changing||pending);const selected=String(i===index);if(b.getAttribute('aria-current')!==selected)b.setAttribute('aria-current',selected);});schedule();
 }
 function changeEdgeLight(color,direction,animate){
  const previous=edgeLight,layer=text('div','spotlight-edge-light','');layer.setAttribute('aria-hidden','true');layer.style.setProperty('--edge-color',color);
  layer.append(text('span','spotlight-edge-left',''),text('span','spotlight-edge-right',''));for(const n of layer.children)n.append(text('i','spotlight-beam',''));root.prepend(layer);edgeLight=layer;
  if(!previous||!animate){previous?.remove();return;}
  const transitions=[];
  [...layer.children].forEach((node,i)=>{const delay=(direction>0?i===0:i===1)?70:0;const timing={duration:650,delay:0,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'};
   transitions.push(node.animate([{opacity:0},{opacity:1}],timing));
   transitions.push(previous.children[i].animate([{opacity:1},{opacity:0}],timing));
  });
  Promise.all(transitions.map(a=>a.finished.catch(()=>{}))).then(()=>{previous.remove();transitions.forEach(a=>a.cancel());});
 }
 function selectionHaptic(){if(state.native?.haptics===false)return;if(document.body.classList.contains('native-shell'))window.webkit?.messageHandlers?.partyShell?.postMessage({type:'haptic',pattern:[5]});else if(window.LocalPartyNative?.haptic)window.LocalPartyNative.haptic([5]);else navigator.vibrate?.(5);}
 function logoFor(game){if(!logoCache.has(game.id)){const img=new Image();img.src='/assets/game-logos-v1/logos/'+encodeURIComponent(game.id)+'.png?v=1';img.decoding='async';logoCache.set(game.id,img);img.decode().catch(()=>{});}return logoCache.get(game.id);}
 function fillSlide(node,game){const image=logoFor(game).cloneNode();image.className='spotlight-logo';image.alt=game.title;
  const meta=text('div','spotlight-meta',''),activity=state.gameActivity?.[game.id],played=(activity?.matches||state.gamePopularity?.[game.id]||0)>0,seconds=activity?.seconds||0;
  const history=seconds>=3600?`${(seconds/3600).toFixed(1)} H PLAYED`:seconds>0?`${Math.max(1,Math.round(seconds/60))} MIN PLAYED`:played?'PLAY IT AGAIN':'FIRST PLAY';
  const players=text('span','spotlight-players','');players.setAttribute('aria-label',`${game.min} to ${game.max} players`);if(window.PartyIcons)players.append(PartyIcons.create('user-avatar'));players.append(text('span','',`${game.min}–${game.max}`));const historyNode=text('span','spotlight-history'+(history==='FIRST PLAY'?' spotlight-first-play':''),'');historyNode.append(text('span','spotlight-history-label',history));meta.append(historyNode,players);
  node.replaceChildren(image,meta);return meta;
 }
 function paintDrag(t,retain=false){
  t.layout??={left:slide.offsetLeft,top:slide.offsetTop,width:slide.offsetWidth,height:slide.offsetHeight,page:Math.max(120,slide.clientWidth*.48)};
  slide.style.opacity='0';const base=Math.floor(t.pos),wanted=[base-1,base,base+1,base+2];
  for(const [key,node] of t.nodes)if(!retain&&!wanted.includes(key)){node.remove();t.nodes.delete(key);}
  for(const key of wanted){let node=t.nodes.get(key);if(!node){node=text('div','spotlight-slide spotlight-drag-slide','');node.setAttribute('aria-hidden','true');fillSlide(node,deck[(key%deck.length+deck.length)%deck.length]);Object.assign(node.style,{position:'absolute',left:t.layout.left+'px',top:t.layout.top+'px',width:t.layout.width+'px',height:t.layout.height+'px',pointerEvents:'none'});root.append(node);t.nodes.set(key,node);}const delta=key-t.pos;node.style.transform=`translateX(${delta*t.layout.page}px) scale(${1-Math.min(1,Math.abs(delta))*.22})`;node.style.opacity=String(Math.max(0,1-Math.abs(delta)));}
  const picked=Math.round(t.pos);if(picked!==t.picked){t.picked=picked;selectionHaptic();changeEdgeLight(deck[(picked%deck.length+deck.length)%deck.length].color||'#ba91ff',picked>=t.start?1:-1,true);}
  indicators.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-current',String(i===(picked%deck.length+deck.length)%deck.length)));
 }
 function interruptMotion(){const position=coastPosition??index;coastPosition=null;motionEpoch++;root.querySelectorAll('.spotlight-drag-slide,.spotlight-slide-outgoing').forEach(n=>{n.getAnimations({subtree:true}).forEach(a=>a.cancel());n.remove();});slide.getAnimations({subtree:true}).forEach(a=>a.cancel());slide.style.opacity='';index=(Math.round(position)%deck.length+deck.length)%deck.length;current=deck[index];if(current){fillSlide(slide,current);root.dataset.game=current.id;}changing=false;return position;}
 async function finishDrag(cancelled){
  const t=touch;if(!t)return;touch=null;if(t.axis!=='x'){resetProgress();refresh();return;}changing=true;const epoch=++motionEpoch;progress?.cancel();progress=null;
  const speed=performance.now()-t.time<100?Math.abs(t.velocity):0;
  const target=Math.round(cancelled?t.start:t.pos+(speed?Math.max(-5,Math.min(5,-t.velocity*.9)):0));
  const releasePos=t.pos,distance=Math.abs(target-releasePos),pageWidth=Math.max(120,slide.clientWidth*.48);
  const duration=reduced.matches?0:Math.max(220,Math.min(850,speed>0.25?3*distance*pageWidth/speed:320));
  coastPosition=releasePos;
  await new Promise(resolve=>{
   const began=performance.now();const frame=now=>{
    if(epoch!==motionEpoch){resolve();return;}
    const progress=duration?Math.min(1,(now-began)/duration):1;
    t.pos=releasePos+(target-releasePos)*(1-Math.pow(1-progress,3));coastPosition=t.pos;paintDrag(t);
    if(progress<1)requestAnimationFrame(frame);else resolve();
   };requestAnimationFrame(frame);
  });
  if(epoch!==motionEpoch)return;
  index=(target%deck.length+deck.length)%deck.length;current=deck[index];fillSlide(slide,current);root.dataset.game=current.id;root.style.setProperty('--spotlight-color',current.color||'#ba91ff');
  coastPosition=null;slide.style.opacity='';t.nodes.forEach(n=>n.remove());changing=false;resetProgress();refresh();
 }
 function resetProgress(){progress?.cancel();const fill=indicators.children[index].querySelector('i');progress=fill.animate([{opacity:.35,transform:'scale(.45)'},{opacity:1,transform:'scale(1)'}],{duration:10000,fill:'forwards'});progress.pause();progress.onfinish=()=>{if(canCycle())advance(index+1);};}
 async function advance(target){
  if(changing||touch||pending||!deck.length||state.active)return;const nextIndex=(target+deck.length)%deck.length;if(current&&nextIndex===index)return;
  changing=true;const epoch=++motionEpoch;progress?.cancel();progress=null;refresh();
  const game=deck[nextIndex],image=new Image();image.className='spotlight-logo';image.alt=game.title;image.src='/assets/game-logos-v1/logos/'+encodeURIComponent(game.id)+'.png?v=1';image.decoding='async';
  let loaded=true;try{await image.decode();}catch{loaded=false;}
  if(epoch!==motionEpoch)return;const duration=reduced.matches||!current?0:650,easing='cubic-bezier(0.23,1,0.32,1)',direction=target<index?-1:1;
  changeEdgeLight(game.color||'#ba91ff',direction,Boolean(current&&duration));
  const outgoing=current&&duration?slide.cloneNode(true):null;
  if(outgoing){outgoing.classList.add('spotlight-slide-outgoing');outgoing.setAttribute('aria-hidden','true');outgoing.removeAttribute('aria-live');Object.assign(outgoing.style,{position:'absolute',left:slide.offsetLeft+'px',top:slide.offsetTop+'px',width:slide.offsetWidth+'px',height:slide.offsetHeight+'px',pointerEvents:'none'});root.append(outgoing);}
  current=game;index=nextIndex;root.dataset.game=game.id;root.style.setProperty('--spotlight-color',game.color||'#ba91ff');
  const meta=fillSlide(slide,game);
  if(!loaded)slide.firstElementChild.replaceWith(text('strong','spotlight-fallback',game.title));slide.getAnimations().forEach(a=>a.cancel());
  if(duration){
   const distance=slide.clientWidth*.5,animations=[];
   const move=(node,frames)=>{if(node)animations.push(node.animate(frames,{duration,easing,fill:'both'}));};
   move(outgoing?.firstElementChild,[{opacity:1,transform:'translateX(0) scale(1)'},{opacity:0,transform:`translateX(${-distance*direction}px) scale(.78)`,offset:.7},{opacity:0,transform:`translateX(${-distance*direction}px) scale(.78)`}]);
   move(outgoing?.lastElementChild,[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${-32*direction}px)`,offset:.6},{opacity:0,transform:`translateX(${-32*direction}px)`}]);
   move(slide.firstElementChild,[{opacity:0,transform:`translateX(${distance*direction}px) scale(.78)`},{opacity:1,transform:'translateX(0) scale(1)'}]);
   move(meta,[{opacity:0,transform:`translateX(${32*direction}px)`},{opacity:1,transform:'translateX(0)'}]);
   await Promise.all(animations.map(a=>a.finished.catch(()=>{})));outgoing?.remove();animations.forEach(a=>a.cancel());if(epoch!==motionEpoch)return;
  }
  changing=false;resetProgress();refresh();
 }
 window.PartySpotlight=Object.freeze({update(value,config){state=value;options=config;if(!root&&!mount())return;if(root.hidden!==!!state.active)root.hidden=!!state.active;if(!deck.length&&state.catalog?.length){deck=makeDeck();deck.forEach(logoFor);rebuildIndicators();}if(!current&&!changing&&!state.active&&deck.length)advance(0);if(state.active){pending=false;clearTimeout(pendingTimer);}refresh();}});
})();
