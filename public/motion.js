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
  const element=node instanceof Element?node:node.parentElement;if(!element)return;
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
 function all(){for(const id of [...pointers.keys()])release(id,false);for(const el of [...effects.keys()])forget(el);}
 function begin(id,el,x=0,y=0,touch=false){
  if(pointers.has(id))return;const p={el,x,y,timer:null};pointers.set(id,p);
  if(touch)p.timer=setTimeout(()=>{if(pointers.get(id)===p&&el.isConnected)down(el);},35);else down(el);
 }
 document.addEventListener('pointerdown',e=>{if(e.button!==0)return;const el=target(e.target);if(el)begin(e.pointerId,el,e.clientX,e.clientY,e.pointerType==='touch');},{capture:true,passive:true});
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
  const now=performance.now();if(now-lastHaptic<65)return;lastHaptic=now;
  // The native endpoint enforces the user's haptics toggle. Game-hit haptics
  // remain owned by the game, avoiding a second vibration on every fire button.
  if(document.body.classList.contains('native-shell'))window.webkit?.messageHandlers?.partyShell?.postMessage({type:'haptic',pattern:[7]});
  else if(el.closest('.app-header,dialog,.session-controls'))window.LocalPartyNative?.haptic?.(7);
 },{capture:true,passive:true});
 window.addEventListener('blur',all);window.addEventListener('pagehide',all);window.addEventListener('party-native-hide',all);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)all();});
 media.addEventListener?.('change',all);
 window.LocalPartyUIFeel=Object.freeze({cancel:all,revision:'tactile-20260918.1'});
})();
