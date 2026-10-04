// Presentation-only framing. A shell leaving the stadium must not take the
// terrain and players with it; its actual direction remains visible at an edge.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function pocketFrame(s,half=360){
 const top=360-half,bottom=360+half,players=s.players.filter(p=>p.participant&&Number.isFinite(p.y));
 const shots=(s.projectiles||[]).filter(b=>Number.isFinite(b.x+b.y)&&b.x>=-80&&b.x<=1360&&b.y>=top-210&&b.y<=bottom+80);
 const target=shots.reduce((best,b)=>!best||b.y>best.y?b:best,null);
 const minY=target?Math.min(top,target.y-50):top,maxY=Math.max(bottom,...players.map(p=>p.y+90),target?target.y+80:bottom);
 return {x:640,y:clamp((minY+maxY)/2,360-half*.35,360+half*.15),z:clamp((half*2-20)/(maxY-20-minY),.76,1)};
}
export function offscreenShots(s,cam,bounds){
 const cues=[];
 for(const b of s.projectiles||[]){
  if(!Number.isFinite(b.x+b.y+b.vx+b.vy))continue;
  const x=640+(b.x-cam.x)*cam.z,y=360+(b.y-cam.y)*cam.z;
  if(x>=bounds.left&&x<=bounds.right&&y>=bounds.top&&y<=bounds.bottom)continue;
  const cx=clamp(x,bounds.left,bounds.right),cy=clamp(y,bounds.top,bounds.bottom);
  // Cluster carriers can produce hundreds of fragments; one nearby direction
  // cue per edge region says more than a wall of overlapping arrows.
  if(cues.some(q=>Math.hypot(q.x-cx,q.y-cy)<100))continue;
  cues.push({id:b.id,x:cx,y:cy,angle:Math.atan2(b.vy,b.vx),color:s.players.find(p=>p.id===b.owner)?.color||'#deffc4'});
  if(cues.length===3)break;
 }
 return cues;
}
