'use strict';
// Pure rules shared by the authoritative game process and the regression tests.
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const finite = (n, fallback = 0) => typeof n === 'number' && Number.isFinite(n) ? n : fallback;
const COLORS = ['#c8ff73','#b493ff','#ff8276','#60e1ed','#ffc86b','#ff94d9','#72a8ff','#b6e5b0','#ffae85','#d0bbff','#8bdfcb','#d9e77b','#c9d7f6','#efa4b2','#8db5a0','#efdfbf'];

function shotInput(value) {
  if (!value || ['power','angle','spin','position'].some(k => typeof value[k] !== 'number' || !Number.isFinite(value[k]))) return null;
  return {power:clamp(value.power,0,1),angle:clamp(value.angle,-.32,.32),spin:clamp(value.spin,-1,1),position:clamp(value.position,-1,1)};
}

// A frame's bonus is scored only once enough subsequent rolls exist.
// frames can be 3/5/10; the selected last frame uses the usual tenth-frame rules.
function scoreBowling(frames, frameCount = 10) {
  const flat = frames.flatMap(f => f.rolls);
  let index=0, total=0, provisional=0;
  const rows=[];
  for(let f=0;f<frames.length && f<frameCount;f++) {
    const rolls=frames[f].rolls, a=rolls[0], b=rolls[1];
    let score=null;
    if(f===frameCount-1) { if(frameComplete(rolls,true)) score=rolls.reduce((s,n)=>s+n,0); }
    else if(a===10) { if(flat.length>=index+3) score=10+flat[index+1]+flat[index+2]; }
    else if(rolls.length>=2) { if(a+b===10) { if(flat.length>=index+3) score=10+flat[index+2]; } else score=a+b; }
    if(score!==null) total+=score;
    provisional+=score===null ? rolls.reduce((s,n)=>s+n,0) : score;
    rows.push({rolls:[...rolls],score,cumulative:score===null?null:total});
    index+=rolls.length;
  }
  return {total,provisional,rows};
}
function frameComplete(r, last=false) {
  if(!r.length) return false;
  if(!last) return r[0]===10 || r.length>=2;
  if(r.length<2) return false;
  return r[0]===10 || r[0]+r[1]===10 ? r.length>=3 : true;
}
function freshRack(r,last=false) {
  if(!r.length) return true;
  if(!last) return false;
  return r.length===1 ? r[0]===10 : r.length===2 && (r[1]===10 || (r[0]!==10 && r[0]+r[1]===10));
}
function curlingScore(stones, house={x:0,z:-9,r:2.6}, epsilon=1e-4) {
  const scored=stones.filter(s=>s.valid!==false).map(s=>({...s,d:Math.hypot(s.x-house.x,s.z-house.z)}))
    .filter(s=>s.d<=house.r+(s.r||.43)).sort((a,b)=>a.d-b.d);
  if(!scored.length) return {team:null,points:0,ids:[]};
  const first=scored[0], other=scored.find(s=>s.team!==first.team), limit=other?other.d:Infinity;
  if(other && Math.abs(first.d-other.d)<=epsilon) return {team:null,points:0,ids:[]};
  const winning=scored.filter(s=>s.team===first.team && s.d<limit-epsilon);
  return {team:first.team,points:winning.length,ids:winning.map(s=>s.id)};
}
function insideRect(x,y,r) { return x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h; }
function targetAt(t, now) {
  const age=now-t.born, life=t.life;
  const rise=clamp(Math.min(age/.32,(life-age)/.4),0,1);
  const ease=rise*rise*(3-2*rise);
  return {...t,x:t.baseX+Math.sin(age*t.speed+t.seed)*.021*ease,y:t.coverY+t.r*.8-t.r*2.1*ease,rise:ease};
}
function hitTarget(targets, covers, x, y, now) {
  // Larger depth is in front. A target's own cover hides its lower body.
  return targets.filter(t=>t.hp>0 && now>=t.born && now<t.born+t.life).map(t=>targetAt(t,now))
    .sort((a,b)=>b.depth-a.depth).find(t=>t.rise>.05 && Math.hypot((x-t.x)*1.6,y-t.y)<=t.r &&
      !covers.some(c=>c.depth>=t.depth && insideRect(x,y,c))) || null;
}
function rayCircle(ox,oz,dx,dz,cx,cz,r,max=80) {
  const vx=cx-ox,vz=cz-oz,t=vx*dx+vz*dz,d2=vx*vx+vz*vz-t*t;
  if(d2>r*r || t+r<0) return null;
  const near=t-Math.sqrt(Math.max(0,r*r-d2));
  return near<=max ? Math.max(0,near) : null;
}
module.exports={clamp,finite,COLORS,shotInput,scoreBowling,frameComplete,freshRack,curlingScore,targetAt,hitTarget,insideRect,rayCircle};
