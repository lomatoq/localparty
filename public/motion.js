(()=>{
 'use strict';
 if(window.__localPartyMotionInstalled)return;
 window.__localPartyMotionInstalled=true;
 const root=document.documentElement;
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const state=new WeakMap();
 const scoreSelector='.points,.score-value,.ss-player-score,#score,#myScore,#height,#force,[data-motion-value]';
 const statusSelector='#hudLabel,#hudProgress,#phase,#ss-stage,#ss-status,#active,#message,#progress,#cue,[data-motion-status]';
 const visible=el=>{const style=getComputedStyle(el);return style.display!=='none'&&style.visibility!=='hidden'&&el.getClientRects().length>0;};
 const pulse=(el,className)=>{
  if(media.matches||!visible(el))return;
  el.classList.remove(className);void el.offsetWidth;el.classList.add(className);
  clearTimeout(state.get(el));state.set(el,setTimeout(()=>el.classList.remove(className),520));
 };
 const textOf=el=>(el.textContent||'').replace(/\s+/g,' ').trim();
 const changed=el=>{
  if(!(el instanceof Element))return;
  const text=textOf(el),previous=el.dataset.lpMotionText;el.dataset.lpMotionText=text;
  if(previous===undefined||previous===text)return;
  if(el.matches(scoreSelector))pulse(el,'lp-motion-pulse');else if(el.matches(statusSelector))pulse(el,'lp-motion-status');
 };
 const scan=node=>{
  const element=node instanceof Element?node:node?.parentElement;if(!element||!element.isConnected)return;
  if(element.matches(scoreSelector+','+statusSelector))changed(element);
  element.querySelectorAll?.(scoreSelector+','+statusSelector).forEach(changed);
 };
 const setPreference=()=>root.classList.toggle('lp-motion-reduced',media.matches);
 setPreference();media.addEventListener?.('change',setPreference);
 document.querySelectorAll(scoreSelector+','+statusSelector).forEach(el=>{el.dataset.lpMotionText=textOf(el);});
 const observer=new MutationObserver(records=>{
  const nodes=new Set();for(const record of records){if(record.type==='characterData')nodes.add(record.target.parentElement);else if(record.type==='childList')nodes.add(record.target);else if(record.attributeName==='open'||record.attributeName==='hidden'||record.attributeName==='class')nodes.add(record.target);}nodes.forEach(scan);
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['open','hidden','class']});
 requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('lp-motion-ready')));
})();

/* One delegated press layer on every existing motion.js surface. No new route,
   dependency, pointer capture, preventDefault, synthetic clicks or game inputs.
   Individual scale composes with existing positioned/rotated controls. */
(()=>{
 'use strict';
 if(window.LocalPartyUIFeel)return;
 const media=matchMedia('(prefers-reduced-motion: reduce)'), pointers=new Map(), effects=new Map();
 const selector='button,a[href],summary,select,input[type=button],input[type=submit],input[type=checkbox],input[type=radio],label[for],[role=button],[role=switch],.game[data-id],[data-lp-press]';
 const excluded='[inert],[hidden],[aria-disabled=true],[data-lp-press="off"],canvas,[data-joystick],.joystick,.joystick-zone,.draw-canvas,input[type=range]';
 let lastHaptic=0;
 function target(node){
  if(!(node instanceof Element)||document.body.classList.contains('tv-screen')||window.PARTY_DISPLAY_ONLY)return null;
  const el=node.closest(selector);if(!el||el.matches(':disabled')||el.closest(excluded))return null;
  // Do not deform continuous game controls inside the game iframe.
  if(window!==window.top&&!el.closest('dialog,[data-lp-press],[data-lp-decorative]'))return null;
  if(el.matches('label')&&(!el.control||el.control.disabled||!['checkbox','radio','file'].includes(el.control.type)))return null;
  return el;
 }
 function forget(el){const a=effects.get(el);if(a){clearTimeout(a.timer);a.animation?.cancel();effects.delete(el);}el.removeAttribute('data-lp-press-state');}
 function scaleOf(el){const s=getComputedStyle(el).scale;return s&&s!=='none'?s:'1';}
 function down(el){
  forget(el);if(!el.isConnected)return;
  const base=scaleOf(el), nums=base.split(/\s+/).map(Number), ratio=el.classList.contains('game')?.985:.974;
  const scale=nums.every(Number.isFinite)?nums.map(n=>n*ratio).join(' '):String(ratio);
  const record={base,scale,animation:null,timer:null};effects.set(el,record);el.setAttribute('data-lp-press-state','down');
  if(!media.matches&&typeof el.animate==='function')record.animation=el.animate([{scale:base},{scale}],{duration:85,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});
 }
 function up(el,commit){
  const a=effects.get(el);if(!a)return;
  const current=scaleOf(el);a.animation?.cancel();clearTimeout(a.timer);
  if(!commit||!el.isConnected||media.matches||typeof el.animate!=='function'){forget(el);return;}
  el.setAttribute('data-lp-press-state','release');
  const nums=a.base.split(/\s+/).map(Number), overshoot=nums.every(Number.isFinite)?nums.map(n=>n*1.012).join(' '):'1.012';
  a.animation=el.animate([{scale:current,offset:0},{scale:overshoot,offset:.55},{scale:a.base,offset:1}],{duration:260,easing:'cubic-bezier(.2,.8,.25,1)'});
  a.timer=setTimeout(()=>{if(effects.get(el)===a)forget(el);},280);
 }
 function release(id,commit){const p=pointers.get(id);if(!p)return;clearTimeout(p.timer);pointers.delete(id);if(![...pointers.values()].some(x=>x.el===p.el))up(p.el,commit);}
 function releaseElement(el){
  // A WKWebView can deliver `click` after navigation/state work without the
  // matching pointerup. Never leave the fill-forwards press animation behind.
  for(const [id,p] of [...pointers])if(p.el===el)release(id,false);
  forget(el);
  el.classList.remove('party-pressed');
 }
 function all(){for(const id of [...pointers.keys()])release(id,false);for(const el of [...effects.keys()])forget(el);}
 function begin(id,el,x=0,y=0,touch=false){
  if(pointers.has(id))return;const p={el,x,y,timer:null};pointers.set(id,p);
  if(document.body.classList.contains('native-shell'))window.webkit?.messageHandlers?.partyShell?.postMessage({type:'haptic-prepare'});
  else if(el.closest('.app-header,dialog,.session-controls,#partyNativeDock'))window.LocalPartyNative?.prepare?.();
  if(touch)p.timer=setTimeout(()=>{if(pointers.get(id)===p&&el.isConnected)down(el);},35);else down(el);
 }
 document.addEventListener('pointerdown',e=>{if(e.button!==0)return;const el=target(e.target);if(el){begin(e.pointerId,el,e.clientX,e.clientY,e.pointerType==='touch');if(e.isTrusted&&document.documentElement.classList.contains('party-player')){const shot=/fire|shoot|throw|drop|draw|action/i.test(el.id);setTimeout(()=>{if(!el.isConnected||el.disabled)return;const pattern=shot?[14]:[6];if(window.LocalPartyNative?.haptic)window.LocalPartyNative.haptic(pattern);else navigator.vibrate?.(pattern);},0);}}},{capture:true,passive:true});
 document.addEventListener('pointermove',e=>{
  const p=pointers.get(e.pointerId);if(!p)return;
  if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>12){release(e.pointerId,false);return;}
  if(e.pointerType==='mouse'&&!p.el.contains(e.target))release(e.pointerId,false);
 },{capture:true,passive:true});
 document.addEventListener('pointerup',e=>release(e.pointerId,true),{capture:true,passive:true});
 for(const name of ['pointercancel','lostpointercapture'])document.addEventListener(name,e=>release(e.pointerId,false),{capture:true,passive:true});
 document.addEventListener('keydown',e=>{if(e.repeat||e.altKey||e.metaKey||e.ctrlKey||!['Enter',' '].includes(e.key))return;const el=target(e.target);if(el&&!(el.matches('a')&&e.key===' '))begin('key:'+e.key,el);},{capture:true});
 document.addEventListener('keyup',e=>release('key:'+e.key,true),{capture:true});
 document.addEventListener('click',e=>{
  const el=target(e.target);if(!e.isTrusted||!el||['testHaptics','hapticsToggle'].includes(el.id))return;
  releaseElement(el);
  const now=performance.now();if(now-lastHaptic<65)return;lastHaptic=now;
  // The native endpoint enforces the user's haptics toggle. Game-hit haptics
  // remain owned by the game, avoiding a second vibration on every fire button.
  const selection=el.matches('[aria-pressed],[role=tab],.filter-tab,[data-section]'),confirmation=el.matches('[type=submit],#confirmYes,#readyButton,#resumeButton,#startBotsLaunch'),pattern=confirmation?[14,35,9]:selection?[5]:[9];
  if(document.body.classList.contains('native-shell'))window.webkit?.messageHandlers?.partyShell?.postMessage({type:'haptic',pattern});
  else if(el.closest('.app-header,dialog,.session-controls,#partyNativeDock,.profile-photo-field,.guest-catalog-tools,.catalog-filters')||confirmation){if(window.LocalPartyNative?.haptic)window.LocalPartyNative.haptic(pattern);else navigator.vibrate?.(pattern);}
 },{capture:true,passive:true});
 window.addEventListener('blur',all);window.addEventListener('pagehide',all);window.addEventListener('party-native-hide',all);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)all();});
 media.addEventListener?.('change',all);
 window.LocalPartyUIFeel=Object.freeze({cancel:all,release:releaseElement,revision:'tactile-20260920.1'});
})();

/* One paced reveal queue, shared by native-host and player catalogs. */
(()=>{
 'use strict';
 if(document.body.classList.contains('tv-screen'))return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'), seen=new WeakSet(), images=new WeakSet();
 const pending=new Set(),visible=new Set(),ready=new WeakSet(),running=new Set(),cardAnimations=new WeakMap();
 let timer=0,nextStart=0;
 const cards='.lp-catalog-card,.guest-game,.game[data-id]';
 function pump(){
  clearTimeout(timer);timer=0;
  for(const card of pending)if(!card.isConnected){pending.delete(card);visible.delete(card);}
  if(document.hidden||running.size>=3)return;
  const card=[...pending].find(c=>visible.has(c)&&ready.has(c)&&!c.hidden);
  if(!card)return;
  const wait=nextStart-performance.now();if(wait>0){timer=setTimeout(pump,wait);return;}
  pending.delete(card);visible.delete(card);watcher.unobserve(card);
  card.classList.remove('lp-reveal-pending');
  if(reduced.matches){pump();return;}
  nextStart=performance.now()+120;
  const animation=card.animate([{opacity:0,translate:'0 14px'},{opacity:1,translate:'0 0'}],{duration:640,easing:'cubic-bezier(.2,.65,.3,1)',fill:'backwards'});
  cardAnimations.set(card,animation);running.add(animation);animation.finished.catch(()=>{}).finally(()=>{running.delete(animation);if(cardAnimations.get(card)===animation)cardAnimations.delete(card);pump();});pump();
 }
 const watcher=new IntersectionObserver(entries=>{
  for(const entry of entries){
   const card=entry.target;
   if(entry.isIntersecting)visible.add(card);else visible.delete(card);
  }
  pump();
 },{threshold:0,rootMargin:'120px 0px'});
 function scan(root){
  if(!(root instanceof Element))return;
  const list=[...(root.matches(cards)?[root]:[]),...root.querySelectorAll(cards)];
  for(const card of list){
   if(seen.has(card))continue;seen.add(card);
   if(reduced.matches){ready.add(card);continue;}
   pending.add(card);card.classList.add('lp-reveal-pending');watcher.observe(card);
   const img=card.querySelector('img.symbol,img.guest-art');
   if(!img||images.has(img)){ready.add(card);pump();continue;}images.add(img);
   // Decode before revealing when possible; a broken/slow cover must never
   // prevent a card's title and controls from appearing.
   card.classList.add('lp-art-loading');let settled=false;
   const finish=()=>{if(settled)return;settled=true;clearTimeout(deadline);card.classList.remove('lp-art-loading');ready.add(card);pump();};
   const deadline=setTimeout(()=>{ready.add(card);pump();},1200);
   const decoded=()=>Promise.resolve(img.decode?.()).catch(()=>{}).then(finish);
   img.addEventListener('load',decoded,{once:true});img.addEventListener('error',finish,{once:true});
   if(img.complete)decoded();
  }
 }
 scan(document.body);
 // Replay only on a real game → lobby transition, never on room updates or
 // ordinary scrolling. Cached images stay decoded and card geometry is stable.
 window.addEventListener('party-lobby-enter',event=>{
  const root=event.detail?.root||document.body;
  clearTimeout(timer);nextStart=0;
  for(const card of root.querySelectorAll(cards)){
   cardAnimations.get(card)?.cancel();seen.delete(card);
   pending.delete(card);visible.delete(card);watcher.unobserve(card);
   card.classList.remove('lp-reveal-pending');
  }
  scan(root);
 });
 new MutationObserver(records=>{for(const r of records){for(const n of r.addedNodes)scan(n);if(r.target.id==='tvStartup'&&r.target.hidden)document.querySelectorAll(cards).forEach(card=>{watcher.unobserve(card);watcher.observe(card);});}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',pump);
 reduced.addEventListener?.('change',()=>{if(reduced.matches){for(const card of pending){card.classList.remove('lp-reveal-pending');watcher.unobserve(card);}pending.clear();visible.clear();for(const a of running)a.cancel();clearTimeout(timer);}else pump();});
})();
