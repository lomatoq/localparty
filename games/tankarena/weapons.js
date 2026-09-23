'use strict';
const weapons={
 cannon:{name:'ПУШКА',speed:580,damage:34,cd:.48,count:1,ttl:2},
 shotgun:{name:'ДРОБОВИК',speed:480,damage:16,cd:.9,count:5,spread:.16,ttl:.65},
 rapid:{name:'ПУЛЕМЁТ',speed:760,damage:10,cd:.14,count:1,ttl:2},
 rocket:{name:'РАКЕТА',speed:330,damage:52,cd:1.2,count:1,ttl:2},
 twin:{name:'СПАРЕННАЯ ПУШКА',speed:620,damage:23,cd:.62,count:2,spread:0,barrel:16,ttl:2},
 sniper:{name:'СНАЙПЕРСКАЯ ПУШКА',speed:1150,damage:72,cd:1.45,count:1,ttl:1.5},
 flame:{name:'ОГНЕМЁТ',speed:350,damage:5,cd:.12,count:3,spread:.18,ttl:.38}
};
function randomWeapon(random=Math.random){const ids=Object.keys(weapons);return ids[Math.min(ids.length-1,Math.floor(random()*ids.length))];}
function projectiles(p){const w=weapons[p.weapon];return Array.from({length:w.count},(_,i)=>{
 const offset=i-(w.count-1)/2,a=p.angle+offset*(w.spread||0),side=offset*(w.barrel||0);
 return {owner:p.id,x:p.x+Math.cos(a)*30-Math.sin(a)*side,y:p.y+Math.sin(a)*30+Math.cos(a)*side,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,damage:w.damage,kind:p.weapon,color:p.weapon==='flame'?'#ff985b':p.weapon==='sniper'?'#97f4ff':p.color,ttl:w.ttl};
});}
function hitsTank(b,x0,y0,p){
 const dx=b.x-x0,dy=b.y-y0,length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((p.x-x0)*dx+(p.y-y0)*dy)/length)):0;
 return Math.hypot(p.x-x0-t*dx,p.y-y0-t*dy)<27;
}
module.exports={weapons,randomWeapon,projectiles,hitsTank};
