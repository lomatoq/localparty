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
module.exports={viewportBackdrop};
