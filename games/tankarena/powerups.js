'use strict';
const KINDS=['weapon','heal','shield','boost'];
function createPickup(random=Math.random){return {kind:KINDS[Math.floor(random()*KINDS.length)],ttl:18};}
function collect(player,pickup){
 if(pickup.kind==='heal')player.hp=Math.min(100,player.hp+40);
 else if(pickup.kind==='shield')player.shield=Math.max(player.shield,5);
 else if(pickup.kind==='boost')player.boost=6;
 else player.weapon=pickup.weapon;
 player.pickupSerial=(player.pickupSerial||0)+1;player.lastPickup=pickup.kind||'weapon';
}
module.exports={createPickup,collect};
