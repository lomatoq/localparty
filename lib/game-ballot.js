"use strict";
function ballot(catalog,players,votes){
 const ids=players.filter(p=>!p.testBot).map(p=>p.id),counts=new Map();
 for(const id of ids){const game=votes.get(id);if(catalog.some(g=>g.id===game))counts.set(game,(counts.get(game)||0)+1);}
 const voted=[...counts.values()].reduce((a,b)=>a+b,0),leaders=[...counts].sort((a,b)=>b[1]-a[1]);
 if(!ids.length||voted<ids.length)return {voted,total:ids.length,winner:null,reason:'waiting'};
 if(leaders.length>1&&leaders[0][1]===leaders[1][1])return {voted,total:ids.length,winner:null,reason:'tie',candidates:leaders.filter(([,n])=>n===leaders[0][1]).map(([id])=>id)};
 const winner=catalog.find(g=>g.id===leaders[0][0]);
 if(ids.length<winner.min||ids.length>winner.max)return {voted,total:ids.length,winner:null,reason:'player-count'};
 return {voted,total:ids.length,winner:winner.id,reason:'ready'};
}
module.exports={ballot};
