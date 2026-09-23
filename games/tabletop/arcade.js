'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
class Mines {
 constructor(players,random=Math.random){this.players=players;this.random=random;this.phase='playing';this.t=0;this.cells=Array.from({length:100},()=>({open:false,mine:false,count:0,owner:null}));this.seeded=false;players.forEach((p,i)=>{p.score=0;p.cooldown=0;p.cursor=(44+i*13)%100;});}
 neighbors(i){const x=i%10,y=Math.floor(i/10),out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&x+dx>=0&&x+dx<10&&y+dy>=0&&y+dy<10)out.push((y+dy)*10+x+dx);return out;}
 seed(first){const safe=new Set([first,...this.neighbors(first)]),candidates=this.cells.map((_,i)=>i).filter(i=>!safe.has(i));for(let i=candidates.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}for(const i of candidates.slice(0,16))this.cells[i].mine=true;this.cells.forEach((c,i)=>c.count=this.neighbors(i).filter(j=>this.cells[j].mine).length);this.seeded=true;}
 action(id,type,index){const p=this.players.find(p=>p.id===id);if(!p||!p.connected||this.phase!=='playing')return false;
  if(type==='select'){const direction=index,delta={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[direction];if(!delta)return false;p.cursor=clamp(Math.floor(p.cursor/10)+delta[1],0,9)*10+clamp(p.cursor%10+delta[0],0,9);return true;}
  if(index===undefined)index=p.cursor;
  if(type!=='open'||p.cooldown>this.t||!Number.isInteger(index)||index<0||index>=100||this.cells[index].open)return false;
  if(!this.seeded)this.seed(index);const c=this.cells[index];p.cooldown=this.t+.3;
  if(c.mine){c.open=true;c.owner=id;p.score-=5;p.cooldown=this.t+2;this.explosion={id:(this.explosion?.id||0)+1,index,player:id};}
  else{const queue=[index],seen=new Set();while(queue.length){const i=queue.pop();if(seen.has(i))continue;seen.add(i);const v=this.cells[i];if(v.open||v.mine)continue;v.open=true;v.owner=id;p.score+=1;if(!v.count)queue.push(...this.neighbors(i));}}
  if(this.cells.every(c=>c.open||c.mine))this.phase='results';return true;
 }
 step(dt){this.t+=dt;if(this.t>=180)this.phase='results';}
 view(){return {remaining:Math.max(0,180-this.t),explosion:this.explosion,cells:this.cells.map(c=>c.open||this.phase==='results'?{open:true,mine:c.mine,count:c.count,owner:c.owner}:{open:false}),players:this.players.map(p=>({id:p.id,name:p.name,color:p.color,connected:p.connected,score:p.score,cursor:p.cursor,selectedOpen:this.cells[p.cursor].open,cooldown:Math.max(0,p.cooldown-this.t)}))};}
}
class Hockey {
 static MALLET_RADIUS=40;
 static PUCK_RADIUS=22;
 constructor(players,random=Math.random){if(players.length<2||players.length%2)throw Error('Air hockey needs two equal teams: 2, 4, 6 or 8 players.');this.players=players;this.random=random;this.t=0;this.phase='playing';this.goals=[0,0];this.serveAt=1;players.forEach((p,i)=>{p.team=i%2;p.lane=Math.floor(i/2);p.x=p.team?820:180;p.y=(p.lane+.5)*600/(players.length/2);p.target={x:p.x,y:p.y};p.score=0;});this.resetPuck();}
 resetPuck(){this.puck={x:500,y:300,vx:(this.random()<.5?-1:1)*260,vy:(this.random()-.5)*200};this.serveAt=this.t+1;}
 action(id,type,value){const p=this.players.find(p=>p.id===id);if(!p||!p.connected||!['move','steer'].includes(type)||!value||!Number.isFinite(value.x)||!Number.isFinite(value.y))return false;
  if(type==='steer'){const n=Math.max(1,Math.hypot(value.x,value.y));p.axis={x:value.x/n,y:value.y/n,until:this.t+.4};return true;}
  const radius=Hockey.MALLET_RADIUS,h=600/(this.players.length/2);p.target={x:clamp(value.x,p.team?500+radius:radius,p.team?1000-radius:500-radius),y:clamp(value.y,p.lane*h+radius,(p.lane+1)*h-radius)};return true;}
 step(dt){if(this.phase!=='playing')return;dt=clamp(dt,0,.05);this.t+=dt;const steps=4,h=dt/steps;
  for(let n=0;n<steps;n++){
   for(const p of this.players){if(p.axis){const radius=Hockey.MALLET_RADIUS,lane=600/(this.players.length/2),active=p.connected&&p.axis.until>=this.t;p.target={x:clamp(p.x+(active?p.axis.x:0)*480*h,p.team?500+radius:radius,p.team?1000-radius:500-radius),y:clamp(p.y+(active?p.axis.y:0)*480*h,p.lane*lane+radius,(p.lane+1)*lane-radius)};}const dx=p.target.x-p.x,dy=p.target.y-p.y,d=Math.hypot(dx,dy),f=d?Math.min(1,650*h/d):0;p.vx=h?dx*f/h:0;p.vy=h?dy*f/h:0;p.x+=dx*f;p.y+=dy*f;}
   if(this.t<this.serveAt)continue;const b=this.puck;b.x+=b.vx*h;b.y+=b.vy*h;
   const puckRadius=Hockey.PUCK_RADIUS,contactRadius=Hockey.MALLET_RADIUS+puckRadius;
   if(b.y<puckRadius||b.y>600-puckRadius){b.y=clamp(b.y,puckRadius,600-puckRadius);b.vy*=-1;}
   if((b.x<0||b.x>1000)&&b.y>205&&b.y<395){const team=b.x<0?1:0;this.goals[team]++;this.players.forEach(p=>p.score=this.goals[p.team]*100);this.resetPuck();if(this.goals[team]>=7)this.phase='results';continue;}
   if((b.x<puckRadius||b.x>1000-puckRadius)&&(b.y<=205||b.y>=395)){b.x=clamp(b.x,puckRadius,1000-puckRadius);b.vx*=-1;}
   for(const p of this.players){const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy);if(d<contactRadius){const nx=d?dx/d:1,ny=d?dy/d:0;b.x=p.x+nx*contactRadius;b.y=p.y+ny*contactRadius;const impact=(b.vx-p.vx)*nx+(b.vy-p.vy)*ny;if(impact<0){b.vx-=2*impact*nx;b.vy-=2*impact*ny;const speed=Math.hypot(b.vx,b.vy),factor=clamp(speed,180,900)/(speed||1);b.vx*=factor;b.vy*=factor;}}}
  }
  if(this.t>=120)this.phase='results';
 }
 view(){return {puck:this.puck,goals:this.goals,remaining:Math.max(0,120-this.t),serve:Math.max(0,this.serveAt-this.t),players:this.players.map(p=>({id:p.id,name:p.name,color:p.color,connected:p.connected,score:p.score,team:p.team,lane:p.lane,x:p.x,y:p.y}))};}
}
module.exports={Mines,Hockey};
