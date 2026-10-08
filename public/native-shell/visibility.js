/* Native WKWebView isHidden does not reliably change document.visibilityState.
   Injected at document start, including game frames. Keep sockets/state alive,
   but park visual frame callbacks and preserve animation phase while hidden. */
(() => {
 'use strict';
 if(window.__partyNativeVisibility)return;
 window.__partyNativeVisibility=true;
 const raf=window.requestAnimationFrame.bind(window),caf=window.cancelAnimationFrame.bind(window);
 const pending=new Map(),held=new Set();let sequence=0;
 let hidden=!!window.__partyNativeInitialHidden;
 try{if(window!==top)hidden=!!top.__partyNativeHidden;}catch{}
 window.__partyNativeHidden=hidden;
 const arm=(id,task)=>{task.native=raf(now=>{
  task.native=0;if(hidden)return;
  pending.delete(id);task.callback(now);
 });};
 window.requestAnimationFrame=callback=>{
  if(typeof callback!=='function')throw new TypeError('requestAnimationFrame callback must be a function');
  const id=++sequence,task={callback,native:0};pending.set(id,task);
  if(!hidden)arm(id,task);return id;
 };
 window.cancelAnimationFrame=id=>{
  const task=pending.get(id);if(!task)return;
  if(task.native)caf(task.native);pending.delete(id);
 };
 const cssAnimation=a=>typeof CSSAnimation!=='undefined'&&a instanceof CSSAnimation;
 const hold=a=>{if(!cssAnimation(a)&&a.playState==='running'){held.add(a);a.pause();}};
 const animate=Element.prototype.animate;
 if(animate)Element.prototype.animate=function(...args){const a=animate.apply(this,args);if(hidden)hold(a);return a;};
 function material(){
  const root=document.documentElement;if(!root)return;
  root.toggleAttribute('data-party-native-hidden',hidden);
  if(document.getElementById('party-native-visibility-style'))return;
  const style=document.createElement('style');style.id='party-native-visibility-style';
  // An early important cascade layer wins existing unlayered important CTA rules.
  // Removing the attribute restores CSS-owned paused/running states unchanged.
  style.textContent='@layer partyNativeVisibility{html[data-party-native-hidden],html[data-party-native-hidden] *,html[data-party-native-hidden] *::before,html[data-party-native-hidden] *::after{animation-play-state:paused!important}}';
  root.prepend(style);
 }
 function visibility(value){
  if(hidden===value){material();return;}
  hidden=value;window.__partyNativeHidden=value;material();
  if(value){
   for(const task of pending.values()){if(task.native)caf(task.native);task.native=0;}
   document.getAnimations().forEach(hold);
  }else{
   for(const [id,task] of pending)if(!task.native)arm(id,task);
   for(const a of held)if(a.playState==='paused')a.play();held.clear();
  }
 }
 addEventListener('party-native-hide',()=>visibility(true));
 addEventListener('party-native-resume',()=>visibility(false));
 if(document.documentElement)material();
 else{const observer=new MutationObserver(()=>{if(document.documentElement){material();observer.disconnect();}});observer.observe(document,{childList:true});}
})();
