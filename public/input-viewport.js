/* Shared focused-field visibility. Actual visualViewport plus the pre-focus
   layout height covers keyboards that overlay OR resize a WKWebView. */
(() => {
 'use strict';
 if(window!==window.top||window.PARTY_DISPLAY_ONLY||document.body.classList.contains('tv-screen')||window.PartyInputViewport)return;
 const body=document.body,viewport=window.visualViewport;
 const selector='textarea,input:not([type]),input[type=text],input[type=search],input[type=email],input[type=password],input[type=url],input[type=tel],input[type=number],[contenteditable=true]';
 let fullHeight=Math.max(innerHeight,viewport?.height||0),frame=0,panel=null,lastBox='',settle=0;
 const editable=node=>node instanceof HTMLElement&&node.matches(selector)&&!node.hasAttribute('readonly')&&!node.hasAttribute('disabled');
 const removePanel=()=>{if(!panel)return;panel.removeAttribute('data-hp-keyboard-panel');panel.style.removeProperty('--hp-input-height');panel.style.removeProperty('--hp-input-top');panel=null;lastBox='';};
 function fit(){
  frame=0;const input=editable(document.activeElement)?document.activeElement:null;
  const height=viewport?.height||innerHeight,top=viewport?.offsetTop||0,scale=viewport?.scale||1;
  if(!input&&height>=fullHeight-100)fullHeight=Math.max(innerHeight,height);
  const activePanel=panel?.matches('dialog[open],#onboarding[role=dialog]:not([hidden])')&&!panel.classList.contains('lp-dialog-closing')&&!body.hasAttribute('data-profile-closing');
  const keyboard=scale<=1.05&&fullHeight-height>100&&!!(input||activePanel);
  body.toggleAttribute('data-hp-keyboard',keyboard);
  const next=keyboard?(input?.closest('dialog[open],#onboarding[role=dialog]')||panel):null;
  if(panel!==next){removePanel();panel=next;}
  if(panel){const box=height+'|'+top;if(box!==lastBox){panel.style.setProperty('--hp-input-height',height+'px');panel.style.setProperty('--hp-input-top',top+'px');panel.setAttribute('data-hp-keyboard-panel','');lastBox=box;}}
  if(!input||!input.isConnected||input.closest('[inert],[hidden],.lp-dialog-closing')||!input.getClientRects().length)return;
  // Scroll one field-and-action group; caret visibility alone can leave Save
  // hidden under the keyboard. Each ancestor owns its real clipping bounds.
  const group=input.closest('[data-hp-input-group]')||input;
  const action=group.querySelector?.('[data-hp-input-action]');
  const bottom=top+height-12,readTop=top+12;
  for(let n=group.parentElement;n&&n!==body;n=n.parentElement){
   const style=getComputedStyle(n);if(!/(auto|scroll)/.test(style.overflowY)||n.scrollHeight<=n.clientHeight+1)continue;
   const area=n.getBoundingClientRect(),r=group.getBoundingClientRect(),a=action?.getBoundingClientRect();
   const lo=Math.max(readTop,area.top+6),hi=Math.min(bottom,area.bottom-6);
   const groupTop=Math.min(r.top,a?.top??r.top),groupBottom=Math.max(r.bottom,a?.bottom??r.bottom);
   let delta=groupBottom>hi?groupBottom-hi:groupTop<lo?groupTop-lo:0;
   if(groupBottom-groupTop>hi-lo){const field=input.getBoundingClientRect();delta=field.bottom>hi?field.bottom-hi:field.top<lo?field.top-lo:0;}
   if(Math.abs(delta)>1)n.scrollTop+=delta;
  }
  const r=input.getBoundingClientRect();if(!panel&&(r.bottom>bottom||r.top<readTop))window.scrollBy({top:r.bottom>bottom?r.bottom-bottom:r.top-readTop,behavior:'instant'});
 }
 function queue(){if(!frame)frame=requestAnimationFrame(fit);}
 function ensureVisible(input){if(editable(input))queue();clearTimeout(settle);settle=setTimeout(queue,280);}
 // Observe only the focused field’s ancestors, never the whole live catalog.
 const focusObserver=new MutationObserver(records=>{const input=document.activeElement;if(!editable(input))return;if(records.some(r=>r.target.contains(input)&&(r.target.hidden||r.target.classList.contains('lp-dialog-closing')||r.target.hasAttribute('data-profile-closing')))){input.blur();queue();}});
 function observeFocus(input){focusObserver.disconnect();for(let n=input?.parentElement;n;n=n.parentElement)focusObserver.observe(n,{attributes:true,attributeFilter:['hidden','class','data-profile-closing']});}
 document.addEventListener('focusin',e=>{if(editable(e.target)){observeFocus(e.target);fullHeight=Math.max(fullHeight,innerHeight,viewport?.height||0);ensureVisible(e.target);}},true);
 document.addEventListener('focusout',()=>{queue();clearTimeout(settle);settle=setTimeout(()=>{if(!editable(document.activeElement))focusObserver.disconnect();queue();},280);},true);
 viewport?.addEventListener('resize',queue,{passive:true});viewport?.addEventListener('scroll',queue,{passive:true});
 window.addEventListener('resize',queue,{passive:true});window.addEventListener('orientationchange',()=>{fullHeight=innerHeight;queue();});
 document.addEventListener('transitionend',e=>{if(e.target.closest?.('[data-hp-input-group]'))queue();},true);
 document.addEventListener('close',queue,true);
 window.PartyInputViewport=Object.freeze({ensureVisible});
})();
