'use strict';
// Experimental route-intercepted source only. It is not loaded by HeyPals.
// The foreground owns one viewport backdrop with a constant blur radius;
// its existing arrival/exit opacity animation remains authoritative.
function viewportBackdrop(file,source){
 let text=String(source);
 if(file==='app-ux-20261005.js'){
  const anchor='const foreground=modalOrder.slice(-1);';
  if(!text.includes(anchor))throw Error('Shared foreground selector changed');
  text=text.replace(anchor,anchor+`
  for(const node of body.querySelectorAll('[data-hp-modal-foreground]'))if(!foreground.includes(node))node.removeAttribute('data-hp-modal-foreground');
  for(const node of foreground)if(!node.hasAttribute('data-hp-modal-foreground'))node.setAttribute('data-hp-modal-foreground','');`);
 }
 if(file==='app-ux-20261005.css'){
  const anchor='html body[data-hp-modal-active] [data-hp-modal-background]{filter:blur(8px)!important}';
  if(!text.includes(anchor))throw Error('Shared branch blur selector changed');
  text=text.replace(anchor,'/* Experimental viewport backdrop supplies the same 8px blur. */');
  text+=`
html.hp-ui body dialog[open]::backdrop,html.hp-ui body [popover][role=dialog]::backdrop,html body .profile-sheet-backdrop{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
html.hp-ui body dialog[open][data-hp-modal-foreground]::backdrop,
html.hp-ui body [popover][role=dialog][data-hp-modal-foreground]::backdrop,
html.hp-ui body:has(#onboarding[data-hp-modal-foreground]) .profile-sheet-backdrop,
html.hp-ui body #pauseOverlay[data-hp-modal-foreground]{-webkit-backdrop-filter:blur(8px)!important;backdrop-filter:blur(8px)!important}
@media(prefers-reduced-transparency:reduce){
html.hp-ui body dialog[open][data-hp-modal-foreground]::backdrop,
html.hp-ui body [popover][role=dialog][data-hp-modal-foreground]::backdrop,
html.hp-ui body:has(#onboarding[data-hp-modal-foreground]) .profile-sheet-backdrop,
html.hp-ui body #pauseOverlay[data-hp-modal-foreground]{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}}
`;
 }
 return Buffer.from(text);
}
// Real element alternative: WebKit can report a filtered ::backdrop while
// painting sharp pixels. A bounded plane is created below each open top-layer
// popup; profile uses its existing real backdrop. No background DOM is copied.
function actualViewportVeil(file,source,bodyFirst=false){
 let text=String(viewportBackdrop(file,source));
 if(file==='app-ux-20261005.js')text+=`
;(() => {
 const body=document.body;if(!body||window!==window.top||body.classList.contains('tv-screen')||window.PARTY_DISPLAY_ONLY)return;const records=new Map(),bodyFirst=${bodyFirst?'true':'false'};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const opened=node=>node.tagName==='DIALOG'?node.open:node.matches(':popover-open');
 const closing=node=>node.classList.contains('lp-dialog-closing')||node.hasAttribute('data-lp-panel-closing');
 function fade(record,to,duration){
  if(record.to===to)return;record.to=to;
  const from=Number(getComputedStyle(record.veil).opacity);record.animation?.cancel();
  record.veil.style.opacity=String(to);
  if(!reduced.matches&&!document.hidden)record.animation=record.veil.animate([{opacity:from},{opacity:to}],{duration,easing:to===0||record.veil.dataset.hpVeilFor==='startBots'?'ease-out':'cubic-bezier(.23,1,.32,1)'});
 }
 function prepare(node){
  if(node.id==='onboarding')return;
  let record=records.get(node);
  if(!record){const veil=document.createElement('div'),nested=[...records.keys()].some(n=>opened(n));veil.className='hp-viewport-veil';if(!bodyFirst||nested)veil.setAttribute('popover','manual');else veil.dataset.hpVeilBody='';veil.setAttribute('aria-hidden','true');veil.dataset.hpVeilFor=node.id;veil.style.opacity='0';body.append(veil);if(veil.hasAttribute('popover'))veil.showPopover();record={veil,animation:null,to:null};records.set(node,record);}
  fade(record,1,closing(node)?180:node.tagName==='DIALOG'?240:180);
 }
 // Prepare before modal insertion; a nonmodal native Host tab must never
 // receive a viewport veil. Popovers already expose beforetoggle for ordering.
 const showModal=HTMLDialogElement.prototype.showModal;HTMLDialogElement.prototype.showModal=function(){prepare(this);return showModal.apply(this,arguments);};
 document.addEventListener('beforetoggle',event=>{if(event.newState==='open'&&event.target.matches?.('[popover][role=dialog]'))prepare(event.target);},true);
 function sync(){
  for(const node of document.querySelectorAll('dialog[open]:modal,[popover][role=dialog]:popover-open')){
   if(!records.has(node))prepare(node);
   fade(records.get(node),closing(node)?0:1,closing(node)?180:node.tagName==='DIALOG'?240:180);
  }
  for(const [node,record]of records)if(!node.isConnected||!opened(node)){record.animation?.cancel();if(record.veil.matches(':popover-open'))record.veil.hidePopover();record.veil.remove();records.delete(node);}
 }
 new MutationObserver(records=>{if(records.some(r=>r.target===body||r.target.matches?.('dialog,[popover][role=dialog]')||(r.type==='childList'&&[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&n.matches?.('dialog,[popover][role=dialog]')))))sync();}).observe(body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden','class','data-lp-panel-closing']});
 document.addEventListener('toggle',event=>{if(event.target.matches?.('dialog,[popover][role=dialog]'))sync();},true);
 sync();
})();`;
 if(file==='app-ux-20261005.css')text+=`
html.hp-ui body dialog[open][data-hp-modal-foreground][data-hp-modal-foreground]::backdrop,
html.hp-ui body [popover][role=dialog][data-hp-modal-foreground][data-hp-modal-foreground]::backdrop{
 background:transparent!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
html.hp-ui body .hp-viewport-veil{position:fixed!important;inset:0!important;margin:0!important;padding:0!important;border:0!important;box-sizing:border-box!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;overflow:hidden!important;pointer-events:none!important;background:linear-gradient(180deg,#0c081a75,#0c081a50 55%,#0c081a80)!important;-webkit-backdrop-filter:blur(8px)!important;backdrop-filter:blur(8px)!important}
html.hp-ui body .hp-viewport-veil[data-hp-veil-body]{z-index:2147483646!important}
html.hp-ui body .hp-viewport-veil[popover]::backdrop{background:transparent!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;pointer-events:none!important;animation:none!important}
@media(prefers-reduced-transparency:reduce){html.hp-ui body .hp-viewport-veil{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}}
`;
 return Buffer.from(text);
}
module.exports={viewportBackdrop,actualViewportVeil};
