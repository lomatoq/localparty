'use strict';
const {normalizeLayout}=require('../../lib/tv-playfield-bounds');

// The current display host supplies measured paint geometry, never player positions.
class CarryHudReceiver {
 constructor(game){this.game=game;this.host=null;this.sequence=0;this.registered=new WeakSet();}
 registerHost(socket,authorized){if(!authorized)return false;if(this.registered.has(socket))return socket===this.host;this.registered.add(socket);this.host=socket;this.sequence=0;return true;}
 receive(socket,data){
  if(this.game.mode!=='carryball'||socket!==this.host||!Number.isSafeInteger(data?.sequence)||data.sequence<=this.sequence)return false;
  const layout=normalizeLayout(data,{width:1200,baseHeight:720});if(!layout)return false;
  this.sequence=data.sequence;this.game.setVisibleHudLayout(layout);return true;
 }
}
module.exports={CarryHudReceiver};
