// Presentation math is independent from the authoritative physics and scoring.
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const damp=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*Math.max(0,dt)));
export const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
const norm=a=>{const n=Math.hypot(...a)||1;return a.map(x=>x/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function basis(plan){const forward=norm(sub(plan.target,plan.position)),right=norm(cross(forward,[0,1,0]));return{forward,right,up:cross(right,forward)};}
export function projectPoint(plan,p,aspect=16/9){const b=basis(plan),v=sub(p,plan.position),depth=dot(v,b.forward),tan=Math.tan(plan.fov*Math.PI/360);return [dot(v,b.right)/(depth*tan*aspect),dot(v,b.up)/(depth*tan),depth];}
// Retreat along the optical axis, rather than zooming into an object that is
// outside the viewport. Solved analytically: stable at every screen aspect.
export function fitCamera(plan,points,aspect=16/9,safe={x:.84,top:.62,bottom:.78}){
 aspect=Number.isFinite(aspect)?clamp(aspect,.32,5):16/9;
 const b=basis(plan),tan=Math.tan(plan.fov*Math.PI/360);let retreat=0;
 for(const p of points){if(!p.every(Number.isFinite))continue;const v=sub(p,plan.position),z=dot(v,b.forward),x=Math.abs(dot(v,b.right)),y=dot(v,b.up);
  retreat=Math.max(retreat,x/(tan*aspect*safe.x)-z,Math.abs(y)/(tan*(y>0?safe.top:safe.bottom))-z,.6-z);
 }
 return {...plan,position:plan.position.map((x,i)=>x-b.forward[i]*retreat)};
}
export function focusPoints(mode,s,overview=false){
 const curling=mode==='curling',b=curling?s?.stones?.at(-1):s?.ball?.p;
 if(overview||!b||!['rolling','reveal'].includes(s?.state))return [[-3.65,0,0],[3.65,0,0],[-3.65,1.2,29.5],[3.65,1.2,29.5]];
 const x=-(b.x||0),y=b.y||.25,z=b.z,points=[[x-.5,y-.25,z-.5],[x+.5,y+.55,z+.5]];
 if(z>16){const centre=curling?25:22.7,r=curling?2.8:1.2;for(const dx of [-r,r])for(const dz of [-r,r])points.push([dx,curling?.1:1.1,centre+dz]);}
 return points;
}
export function cameraPlan(mode,s={},overview=false,aspect=16/9){
 const curling=mode==='curling',b=curling?s.stones?.at(-1):s.ball?.p,moving=b&&['rolling','reveal'].includes(s.state)&&!overview;
 let plan;
 if(!moving)plan={position:[curling?2.1:1.1,curling?17:12,-9.5],target:[0,.2,14],fov:49};
 else{
  const z=clamp(b.z,2,29),x=-(b.x||0),near=smooth((z-16)/8),end=s.state==='reveal';
  plan={position:[x*.65+(curling?2.3:1.35)*(1-near*.35),curling?6.6+near*4.1:3.75+near*2.65,Math.min(z,curling?28:26)-(curling?10:8.7)],
   target:[x*.6*(1-near*.65),.25,(1-near)*(z+3.5)+near*(curling?25:23)],fov:50-near*3};
  if(end){plan.position[0]+=curling?.4:1.1;plan.position[1]+=1;}
 }
 return fitCamera(plan,focusPoints(mode,s,overview),aspect);
}
export function serverTime(snapshot,received,now,paused=false){return (snapshot?.time||0)+(paused?0:clamp((now-received)/1000,0,.22));}
export class BoundedEffects{
 constructor(limit=180){this.limit=limit;this.items=[];}
 add(effect){if(this.items.length>=this.limit)this.items.shift();this.items.push(effect);}
 tick(dt){for(let i=this.items.length-1;i>=0;i--){const p=this.items[i];p.age+=dt;if(p.age>=p.life)this.items.splice(i,1);}}
 clear(){this.items.length=0;}
}
export class FrameBudget{
 constructor(){this.ema=16.7;this.samples=0;this.lastChange=0;this.scale=1;}
 sample(ms,now){if(!Number.isFinite(ms)||ms<0||ms>240)return false;this.ema=this.ema*.94+ms*.06;if(++this.samples<45||now-this.lastChange<2500)return false;
  let next=this.scale;if(this.ema>26)next=Math.max(.58,next*.84);else if(this.ema<18)next=Math.min(1,next+.07);
  if(Math.abs(next-this.scale)<.02)return false;this.scale=next;this.lastChange=now;this.samples=0;return true;
 }
}
