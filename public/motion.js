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
 const valueSelector=scoreSelector+','+statusSelector;
 const setPreference=()=>root.classList.toggle('lp-motion-reduced',media.matches);
 setPreference();media.addEventListener?.('change',setPreference);
 document.querySelectorAll(scoreSelector+','+statusSelector).forEach(el=>{el.dataset.lpMotionText=textOf(el);});
 // A renderer can write source-language text every tick; i18n rewrites it in a
 // following mutation microtask. Compare the settled visible value once before
 // paint, not each intermediate source/translation pair. Input stays synchronous.
 const pendingNodes=new Set(),addedRoots=new Set();let pendingFrame=0;
 const queueValue=node=>{
  // Text is often nested inside an icon/label wrapper. Only its matching
  // ancestors can have changed; sibling scores need no read or subtree scan.
  for(let el=node instanceof Element?node:node?.parentElement;el;el=el.parentElement)
   if(el.matches(valueSelector))pendingNodes.add(el);
 };
 const flushChanges=()=>{
  pendingFrame=0;
  for(const node of addedRoots){
   if(!node.isConnected)continue;
   if(node.matches(valueSelector))pendingNodes.add(node);
   node.querySelectorAll(valueSelector).forEach(el=>pendingNodes.add(el));
  }
  addedRoots.clear();const nodes=[...pendingNodes];pendingNodes.clear();
  nodes.forEach(el=>{if(el.isConnected)changed(el);});
 };
 const observer=new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='attributes'){
    if(record.target.matches(valueSelector))pendingNodes.add(record.target);
   }else{
    queueValue(record.target);
    if(record.type==='childList')for(const node of record.addedNodes)if(node instanceof Element)addedRoots.add(node);
   }
  }
  if((pendingNodes.size||addedRoots.size)&&!pendingFrame)pendingFrame=requestAnimationFrame(flushChanges);
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
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
 document.addEventListener('pointerdown',e=>{if(e.button!==0)return;const el=target(e.target);if(el){begin(e.pointerId,el,e.clientX,e.clientY,e.pointerType==='touch');if(e.isTrusted&&document.documentElement.classList.contains('party-player')&&el.closest('#controls,.game-controls')){const shot=/fire|shoot|throw|drop|draw|action/i.test(el.id);setTimeout(()=>{if(!el.isConnected||el.disabled)return;const pattern=shot?[14]:[6];if(window.LocalPartyNative?.haptic)window.LocalPartyNative.haptic(pattern);else navigator.vibrate?.(pattern);},0);}}},{capture:true,passive:true});
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
  else if(!el.closest('#controls,.game-controls')){if(window.LocalPartyNative?.haptic)window.LocalPartyNative.haptic(pattern);else navigator.vibrate?.(pattern);}
 },{capture:true,passive:true});
 window.addEventListener('blur',all);window.addEventListener('pagehide',all);window.addEventListener('party-native-hide',all);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)all();});
 media.addEventListener?.('change',all);
 window.LocalPartyUIFeel=Object.freeze({cancel:all,release:releaseElement,revision:'tactile-20260920.1'});
})();

/* Catalog content is ready to read and tap before optional first-entry motion. */
(()=>{
 'use strict';
 if(document.body.classList.contains('tv-screen'))return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),scanned=new WeakSet(),entered=new Set(),running=new Set();
 const cards='.lp-catalog-card,.guest-game,.game[data-id]';
 function scan(root){
  if(!(root instanceof Element))return;
  const list=[...(root.matches(cards)?[root]:[]),...root.querySelectorAll(cards)];
  for(const card of list){
   // Keep text, controls and available covers visible even on a long first jump.
   card.classList.remove('lp-reveal-pending','lp-art-loading');
   const img=card.querySelector('img.symbol,img.guest-art');
   if(img)img.loading='eager';
   if(scanned.has(card))continue;scanned.add(card);
   const identity=card.dataset.id||card.dataset.game;
   if(!identity||entered.has(identity))continue;entered.add(identity);
   const r=card.getBoundingClientRect();
   // Scroll, filtering and reconnects never queue or replay entrance effects.
   // Only cards already on screen receive a small, immediately readable settle.
   if(reduced.matches||document.hidden||card.hidden||r.width===0||r.height===0||r.bottom<=0||r.top>=innerHeight)continue;
   const animation=card.animate([{translate:'0 4px'},{translate:'0 0'}],{duration:180,easing:'cubic-bezier(.23,1,.32,1)'});
   running.add(animation);animation.finished.catch(()=>{}).finally(()=>running.delete(animation));
  }
 }
 scan(document.body);
 new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)scan(n);}).observe(document.body,{childList:true,subtree:true});
 reduced.addEventListener?.('change',()=>{if(reduced.matches)for(const animation of running)animation.cancel();});
})();

// A top-layer dialog must not leave the underlying document scrollable on iOS.
(() => {
 let saved=null,lastTouch=null;
 const modal=()=>[...document.querySelectorAll('dialog[open]')].reverse().find(d=>d.matches(':modal'));
 const sync=()=>{
  if(modal()){
   if(saved)return;
   // Freeze the document scrollport, not the body. Making the body fixed resets
   // WebKit's scrollY and moves sticky Host's Pick/catalogue rows behind a sheet.
   // The touch/wheel guard below keeps iOS rubber-banding inside the top modal.
   const html=document.documentElement;
   saved={x:scrollX,y:scrollY,styles:['overflow','overscroll-behavior'].map(k=>[k,html.style.getPropertyValue(k),html.style.getPropertyPriority(k)])};
   html.style.setProperty('overflow','hidden','important');html.style.setProperty('overscroll-behavior','none','important');
  }else if(saved){
   const previous=saved;saved=null;
   for(const [k,v,p]of previous.styles)if(v)document.documentElement.style.setProperty(k,v,p);else document.documentElement.style.removeProperty(k);
   const html=document.documentElement,behavior=html.style.scrollBehavior;html.style.scrollBehavior='auto';scrollTo(previous.x,previous.y);html.style.scrollBehavior=behavior;
  }
 };
 const guard=(event,dx,dy)=>{
  const dialog=modal();if(!dialog)return;
  let node=event.target instanceof Element?event.target:null;
  if(node&&dialog.contains(node))for(;node;node=node.parentElement){
   const style=getComputedStyle(node),vertical=Math.abs(dy)>=Math.abs(dx),delta=vertical?dy:dx;
   const overflow=vertical?style.overflowY:style.overflowX,position=vertical?node.scrollTop:node.scrollLeft,max=vertical?node.scrollHeight-node.clientHeight:node.scrollWidth-node.clientWidth;
   if(/auto|scroll/.test(overflow)&&max>1&&((delta>0&&position<max-1)||(delta<0&&position>1)))return;
   if(node===dialog)break;
  }
  if(event.cancelable)event.preventDefault();
 };
 document.addEventListener('wheel',e=>guard(e,e.deltaX,e.deltaY),{passive:false,capture:true});
 document.addEventListener('touchstart',e=>{const t=e.touches[0];lastTouch=t?{x:t.clientX,y:t.clientY}:null;},{passive:true,capture:true});
 document.addEventListener('touchmove',e=>{const t=e.touches[0];if(t&&lastTouch){guard(e,lastTouch.x-t.clientX,lastTouch.y-t.clientY);lastTouch={x:t.clientX,y:t.clientY};}},{passive:false,capture:true});
 document.addEventListener('close',sync,true);document.addEventListener('cancel',()=>queueMicrotask(sync),true);
 new MutationObserver(sync).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open'],childList:true});sync();
})();

/* Keep the real top-layer dialog alive for its exit. All existing callers,
   method=dialog forms and Escape share the same cancellation-safe lifecycle. */
(() => {
 'use strict';
 if(window.LocalPartyDialogs||!window.HTMLDialogElement)return;
 const quiet=()=>matchMedia('(prefers-reduced-motion: reduce)').matches,pending=new WeakMap(),panels=new WeakMap();
 const inactive=()=>document.hidden||window.__partyNativeHidden===true;
 const reopening=new WeakMap();
 const backdropRules=new WeakMap();let backdropId=0;
 // ::backdrop does not inherit the dialog's custom properties. Give its own
 // rule the sampled opacity so interrupted transitions never restart at 0/1.
 function backdropStart(dialog,opacity){
  let rule=backdropRules.get(dialog);if(!rule){const key=String(++backdropId),style=document.createElement('style');dialog.dataset.lpBackdrop=key;document.head.append(style);rule={key,style};backdropRules.set(dialog,rule);}
  rule.style.textContent=`dialog[data-lp-backdrop="${rule.key}"]::backdrop{--lp-backdrop-start:${Math.max(0,Math.min(1,Number(opacity)||0))}}`;
 }

 const prototype=HTMLDialogElement.prototype,nativeClose=prototype.close,nativeShow=prototype.show,nativeModal=prototype.showModal;
 function cancel(dialog){
  const record=pending.get(dialog);if(!record)return;
  clearTimeout(record.timer);pending.delete(dialog);dialog.classList.remove('lp-dialog-closing','sheet-closing');clearStart(dialog);record.resolve(false);
 }
 function clearStart(dialog){for(const key of ['opacity','scale','translate','transform'])dialog.style.removeProperty('--lp-close-'+key);}
 function close(dialog,value){
  if(!dialog.open){cancel(dialog);return;}
  // The nonmodal Host tab is a native navigation surface, not a popup. Its
  // outgoing screen is animated by the native tab coordinator.
  if(dialog.id==='hostPanel'&&!dialog.matches(':modal')){cancel(dialog);nativeClose.call(dialog,...(value===undefined?[]:[value]));return;}
  // UIKit can park a WKWebView without changing document.hidden. Authoritative
  // ACKs still close obsolete dialogs while parked, without sampling its paint.
  if(inactive()||quiet()){
   reopening.get(dialog)?.cancel();reopening.delete(dialog);
   const previous=pending.get(dialog);if(previous){clearTimeout(previous.timer);pending.delete(dialog);if(value===undefined)value=previous.value;}
   nativeClose.call(dialog,...(value===undefined?[]:[value]));
   dialog.classList.remove('lp-dialog-closing','sheet-closing');clearStart(dialog);previous?.resolve(true);return;
  }
  const resuming=reopening.get(dialog),live=resuming?getComputedStyle(dialog):null,resumePose=live?Object.fromEntries(['opacity','scale','translate','transform'].map(key=>[key,live[key]])):null;
  resuming?.cancel();reopening.delete(dialog);
  const previous=pending.get(dialog);if(previous){if(value!==undefined)previous.value=value;return;}
  let resolve;const promise=new Promise(r=>resolve=r),record={value,resolve,promise,timer:0};pending.set(dialog,record);
  const start=resumePose||getComputedStyle(dialog);for(const key of ['opacity','scale','translate','transform'])dialog.style.setProperty('--lp-close-'+key,start[key]==='none'?(key==='scale'?'1':key==='translate'?'0 0':'none'):start[key]);
  backdropStart(dialog,getComputedStyle(dialog,'::backdrop').opacity);
  dialog.classList.add('lp-dialog-closing','sheet-closing');
  record.timer=setTimeout(()=>{
   if(pending.get(dialog)!==record)return;
   pending.delete(dialog);
   // A nested popup can already own focus. Closing an outgoing sheet must not
   // restore the old opener over that incoming sheet.
   const focused=document.activeElement;
   if(dialog.open)nativeClose.call(dialog,...(record.value===undefined?[]:[record.value]));
   dialog.classList.remove('lp-dialog-closing','sheet-closing');
   clearStart(dialog);
   if(focused?.isConnected&&focused.closest?.('dialog[open]'))focused.focus({preventScroll:true});
   resolve(true);
  },190);
 }
 prototype.close=function(value){close(this,value);};
 function show(dialog,modal){
  if(modal)dialog.classList.add('lp-dialog-managed');
  const reversing=pending.has(dialog),animateReverse=reversing&&!inactive()&&!quiet(),s=animateReverse?getComputedStyle(dialog):null,pose=s?{opacity:s.opacity,transform:s.transform,scale:s.scale,translate:s.translate}:null;
  if(animateReverse)backdropStart(dialog,getComputedStyle(dialog,'::backdrop').opacity);
  const changeMode=reversing&&dialog.open&&dialog.matches(':modal')!==modal;
  if(reversing)dialog.classList.add('lp-dialog-resumed');else if(!dialog.open)dialog.classList.remove('lp-dialog-resumed');
  cancel(dialog);if(changeMode)nativeClose.call(dialog);
  const result=(modal?nativeModal:nativeShow).call(dialog);
  if(pose&&!quiet()){
   const a=dialog.animate([pose,{opacity:1,transform:'none',scale:'1',translate:'0 0'}],{duration:180,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
   reopening.set(dialog,a);a.finished.catch(()=>{}).then(()=>{if(reopening.get(dialog)===a){reopening.delete(dialog);a.cancel();}});
  }
  return result;
 }
 prototype.show=function(){return show(this,false);};
 prototype.showModal=function(){return show(this,true);};
 document.addEventListener('cancel',event=>{if(event.target instanceof HTMLDialogElement){event.preventDefault();event.target.close();}},true);
 // Dismiss modal sheets through the same animated close path as Back. Only a
 // complete stationary backdrop tap counts; scrolling or dragging out of the
 // panel must never dismiss it. The modal hit target is the top-layer dialog,
 // so a nested dialog cannot accidentally close the sheet underneath it.
 let backdropPress=null;
 const outside=(event,dialog)=>{
  if(event.target!==dialog)return false;
  const r=dialog.getBoundingClientRect();
  return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;
 };
 document.addEventListener('pointerdown',event=>{
  backdropPress=null;
  const dialog=event.target;
  if(event.button!==0||!event.isPrimary||!(dialog instanceof HTMLDialogElement)||!dialog.matches(':modal')||dialog.dataset.backdropDismiss==='false'||dialog.classList.contains('lp-dialog-closing')||!outside(event,dialog))return;
  backdropPress={dialog,id:event.pointerId,x:event.clientX,y:event.clientY};
 },true);
 document.addEventListener('pointermove',event=>{
  if(backdropPress&&(event.pointerId!==backdropPress.id||Math.hypot(event.clientX-backdropPress.x,event.clientY-backdropPress.y)>10))backdropPress=null;
 },{capture:true,passive:true});
 const cancelBackdrop=()=>{backdropPress=null;};
 document.addEventListener('pointercancel',cancelBackdrop,true);
 document.addEventListener('scroll',cancelBackdrop,{capture:true,passive:true});
 document.addEventListener('click',event=>{
  const press=backdropPress;backdropPress=null;
  if(!press||event.defaultPrevented||!press.dialog.matches(':modal')||press.dialog.dataset.backdropDismiss==='false'||!outside(event,press.dialog)||Math.hypot(event.clientX-press.x,event.clientY-press.y)>10)return;
  event.preventDefault();
  // Empty returnValue is cancellation, even if this confirmation was accepted
  // during a previous opening. Never synthesize a submit/primary-action click.
  press.dialog.close('');
 },true);
 document.addEventListener('submit',event=>{
  const form=event.target;if(!(form instanceof HTMLFormElement))return;const method=event.submitter?.hasAttribute('formmethod')?event.submitter.formMethod:form.method;if(String(method).toLowerCase()!=='dialog')return;
  const dialog=form.closest('dialog');if(!dialog)return;
  event.preventDefault();dialog.close(event.submitter?.value||'');
 },true);
 function setVisible(panel,show,prepare){
  const record=panels.get(panel),card=panel.id==='pauseOverlay'?panel.firstElementChild:panel;
  const immediate=inactive()||quiet();
  if(record?.show===show&&!immediate||!record&&panel.hidden===!show)return;
  // Retarget from the rendered pose, including a close reversed by a new update.
  const style=immediate?null:getComputedStyle(card),pose=style?{opacity:style.opacity,scale:style.scale==='none'?'1':style.scale,translate:style.translate==='none'?'0 0':style.translate}:null;
  clearTimeout(record?.timer);record?.animation.cancel();panels.delete(panel);
  const wasHidden=panel.hidden;panel.hidden=false;
  // Reparent/populate/promote popovers before starting their animation clock.
  // Preserve wasHidden so the first visible frame still starts transparent.
  if(show&&typeof prepare==='function')prepare();
  panel.toggleAttribute('data-lp-panel-closing',!show);
  panel.style.pointerEvents=show?'':'none';
  if(immediate){panel.hidden=!show;panel.removeAttribute('data-lp-panel-closing');panel.style.removeProperty('pointer-events');if(!show&&panel.matches(':popover-open'))panel.hidePopover();return;}
  const animation=card.animate([wasHidden?{opacity:0,scale:'.98',translate:'0 8px'}:pose,show?{opacity:1,scale:'1',translate:'0 0'}:{opacity:0,scale:'.98',translate:'0 8px'}],{duration:180,easing:getComputedStyle(rootElement()).getPropertyValue('--motion-ease-out').trim()||'cubic-bezier(.16,1,.3,1)',fill:'both'});
  const entry={animation,show,timer:0};panels.set(panel,entry);
  const finish=()=>{
   if(panels.get(panel)!==entry)return;
   clearTimeout(entry.timer);panel.hidden=!show;panel.removeAttribute('data-lp-panel-closing');panels.delete(panel);panel.style.removeProperty('pointer-events');animation.cancel();
   if(!show&&panel.matches(':popover-open'))panel.hidePopover();
  };
  animation.finished.catch(()=>{}).then(finish);
  // WebKit can defer the finish event when a popover or tab changes paint roots.
  entry.timer=setTimeout(finish,260);
 }
 // Non-dialog profile sheets retain their existing Save/Back semantics while
 // sharing the same accidental-drag protection as native modal backdrops.
 function bindBackdrop(backdrop,panel,dismiss){
  let press=null;
  const clear=()=>{press=null;};
  backdrop.addEventListener('pointerdown',event=>{
   press=event.target===backdrop&&event.button===0&&event.isPrimary&&!backdrop.hidden&&!panel.hidden?{id:event.pointerId,x:event.clientX,y:event.clientY}:null;
  });
  backdrop.addEventListener('pointermove',event=>{
   if(press&&(press.id!==event.pointerId||Math.hypot(event.clientX-press.x,event.clientY-press.y)>10))clear();
  },{passive:true});
  backdrop.addEventListener('pointercancel',clear);
  document.addEventListener('scroll',clear,{capture:true,passive:true});
  backdrop.addEventListener('click',event=>{
   const start=press;clear();
   if(!start||event.defaultPrevented||event.target!==backdrop||backdrop.hidden||panel.hidden||Math.hypot(event.clientX-start.x,event.clientY-start.y)>10)return;
   event.preventDefault();dismiss();
  });
 }
 function rootElement(){return document.documentElement;}
 window.LocalPartyDialogs=Object.freeze({close:dialog=>dialog.close(),whenClosed:dialog=>pending.get(dialog)?.promise||Promise.resolve(true),setVisible,cancel,bindBackdrop});
})();

/* Native details retain their semantics and focus. Delay the closing `open`
   mutation until the body has folded; a second click reverses from its live height. */
(()=>{
 const running=new WeakMap(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 document.addEventListener('click',event=>{
  const summary=event.target instanceof Element?event.target.closest('summary'):null,details=summary?.parentElement;
  if(!details?.matches('details')||details.hasAttribute('name')||event.defaultPrevented||reduced.matches||!details.closest('dialog,.native-shell,#waitingRules,#rulesBody,.return-entry-help'))return;
  event.preventDefault();
  const previous=running.get(details),opening=previous?!previous.opening:!details.open;
  if(details.matches('.return-entry-help')){
   const body=details.querySelector('.return-entry-body');if(!body)return;
   const before=details.open?body.getBoundingClientRect().height:0,opacity=details.open?getComputedStyle(body).opacity:'0';
   previous?.animation.cancel();details.open=true;
   const after=opening?body.scrollHeight:0;
   const animation=body.animate([{height:before+'px',opacity},{height:after+'px',opacity:opening?1:0}],{duration:opening?340:260,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
   const record={animation,opening};running.set(details,record);
   animation.finished.catch(()=>{}).then(()=>{if(running.get(details)!==record)return;details.open=opening;animation.cancel();running.delete(details);});
   return;
  }
  const before=details.getBoundingClientRect().height;
  previous?.animation.cancel();
  const original=previous?.original??{height:details.style.height,overflow:details.style.overflow,boxSizing:details.style.boxSizing};
  details.style.height=original.height;details.style.overflow=original.overflow;details.style.boxSizing=original.boxSizing;
  details.open=opening;const after=details.getBoundingClientRect().height;details.open=true;
  details.style.boxSizing='border-box';details.style.overflow='hidden';
  const animation=details.animate([{height:before+'px'},{height:after+'px'}],{duration:220,easing:getComputedStyle(document.documentElement).getPropertyValue('--motion-ease-out').trim()||'cubic-bezier(.16,1,.3,1)',fill:'both'});
  const record={animation,opening,original};running.set(details,record);
  animation.finished.catch(()=>{}).then(()=>{
   if(running.get(details)!==record)return;
   details.open=opening;animation.cancel();Object.assign(details.style,original);running.delete(details);
  });
 });
})();

/* Confirmed Host Pick: a brief inner rim settles after the server accepts a
   choice. Browsing, initial hydration and repeated snapshots never trigger it. */
(()=>{
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,ring=null,animation=null,confirms=0;
 function clear(){cancelAnimationFrame(frame);frame=0;animation?.cancel();animation=null;ring?.remove();ring=null;}
 addEventListener('localparty:selection-confirmed',event=>{
  clear();const card=event.detail?.card;if(!(card instanceof Element))return;
  frame=requestAnimationFrame(()=>{
   frame=0;if(document.hidden||!card.isConnected||card.closest('[hidden],[inert]')||!card.getClientRects().length)return;
   ring=document.createElement('span');ring.className='lp-choice-confirm';ring.setAttribute('aria-hidden','true');card.append(ring);confirms++;
   const node=ring,style=getComputedStyle(document.documentElement),ease=style.getPropertyValue('--motion-ease-out').trim()||'cubic-bezier(.16,1,.3,1)';
   animation=node.animate(reduced.matches?[{opacity:.7},{opacity:0}]:[{opacity:0,transform:'scale(.975)',offset:0},{opacity:.8,transform:'scale(1)',offset:.3},{opacity:0,transform:'scale(1)',offset:1}],{duration:reduced.matches?150:240,easing:ease});
   animation.finished.catch(()=>{}).then(()=>{node.remove();if(ring===node){ring=null;animation=null;}});
  });
 });
 addEventListener('pagehide',clear);addEventListener('party-native-hide',clear);reduced.addEventListener?.('change',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 window.HeyPalsChoiceMotion=Object.freeze({clear,diagnostics:()=>({confirms,active:!!ring,pending:!!frame})});
})();

/* Short, interruptible rail paging. Touch scrolling remains browser-native. */
(()=>{
 const active=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const cancel=node=>{const a=active.get(node);if(a)cancelAnimationFrame(a.frame);active.delete(node);};
 function by(node,delta){
  const previous=active.get(node),from=node.scrollLeft;
  const target=Math.max(0,Math.min(node.scrollWidth-node.clientWidth,(previous?.target??from)+delta));
  cancel(node);if(reduced.matches){node.scrollLeft=target;return true;}
  const start=performance.now(),record={target,frame:0};active.set(node,record);
  const tick=now=>{if(!node.isConnected){cancel(node);return;}const t=Math.min(1,(now-start)/180);node.scrollLeft=from+(target-from)*(1-Math.pow(1-t,3));if(t<1)record.frame=requestAnimationFrame(tick);else active.delete(node);};
  record.frame=requestAnimationFrame(tick);return true;
 }
 const stop=()=>{for(const node of active.keys())cancel(node);};
 document.addEventListener('touchstart',stop,{passive:true,capture:true});
 document.addEventListener('wheel',stop,{passive:true,capture:true});
 addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 window.HeyPalsScroll=Object.freeze({by});
})();
