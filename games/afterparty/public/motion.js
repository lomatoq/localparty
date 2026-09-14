// Pure, frame-rate-independent presentation math. Never changes simulation state.
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const damp=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*Math.max(0,dt)));
export const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
export function cameraPlan(mode,s,overview=false){
 const curling=mode==='curling',rolling=['rolling','reveal'].includes(s?.state);
 const b=curling?s?.stones?.at(-1):s?.ball?.p;
 const moving=!!b&&rolling&&!overview;
 if(!moving)return {position:[curling?2.2:1.5,curling?16:10,curling?-10:-10],target:[0,0,curling?14:13],fov:49};
 const z=clamp(b.z,2,curling?28:27),x=-(b.x||0),near=smooth((z-16)/8);
 return {position:[x*.45+(curling?2.5:3.2)*(1-near*.45),curling?7+near*3.2:5.8+near*1.6,Math.min(z,curling?25:23)-(curling?9.5:8.5)],
  target:[x*.35,.30,Math.min(curling?25:23,z+(curling?6:5))],fov:49-near*3};
}
export function serverTime(snapshot,received,now,paused=false){return (snapshot?.time||0)+(paused?0:clamp((now-received)/1000,0,.22));}
export class BoundedEffects {
 constructor(limit=180){this.limit=limit;this.items=[];}
 add(effect){if(this.items.length>=this.limit)this.items.shift();this.items.push(effect);}
 tick(dt){for(let i=this.items.length-1;i>=0;i--){const p=this.items[i];p.age+=dt;if(p.age>=p.life)this.items.splice(i,1);}}
 clear(){this.items.length=0;}
}
