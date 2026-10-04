/* Edge decorations are postponed by the user. No assets or observers load. */
(function(root){
 'use strict';
 const clear=win=>{win?.document?.querySelectorAll('.hp-game-ui-micro-cuff').forEach(node=>node.remove());};
 const api={enabled:false,profileFor:()=> 'disabled',inspect:()=>null,diagnostics:()=>({profile:'disabled',reason:'human-disabled'}),refresh:()=>null,start:clear};
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document){clear(root);root.LocalPartyMicroAssets=api;}
})(typeof window==='undefined'?null:window);
