(function(root){'use strict';
const WORLD={width:1000,height:600};
function controlsForLevel(level){return['move','precision',...([0,2,11,13,14].includes(level)?['click']:[]),...([2,6,14].includes(level)?['grab']:[])];}
function average(players,inputs,now){let x=0,y=0,precision=0;for(const p of players){const input=inputs[p];if(!input||now-input.updated>450)continue;x+=Math.max(-1,Math.min(1,input.move?.x||0));y+=Math.max(-1,Math.min(1,input.move?.y||0));precision+=input.precision?1:0;}const n=Math.max(1,players.length),length=Math.hypot(x/n,y/n);return{x:x/n/Math.max(1,length),y:y/n/Math.max(1,length),speed:1-.65*precision/n};}
function fit(width,height){const scale=Math.min(width/WORLD.width,height/WORLD.height);return{scale,x:(width-WORLD.width*scale)/2,y:(height-WORLD.height*scale)/2};}
const api={WORLD,controlsForLevel,average,fit};if(typeof module!=='undefined')module.exports=api;else root.ChaosContract=api;
})(typeof window!=='undefined'?window:globalThis);
