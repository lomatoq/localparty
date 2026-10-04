'use strict';
// Bowling "classic physics bugs" stress: many random and extreme throws (first
// and second ball). Every step checks: no NaN, nothing sinks into the deck/lane
// or pit floor, nothing leaves through walls, no energy explosions; after the
// turn: settles, no late flips. Usage: node scripts/bowling-stress.cjs [throws]
const physics=require('../games/sports_siege/bowling.js');
const {LANE_END,PIN_PROFILE}=physics;
const PIN_H=PIN_PROFILE.at(-1)[1],DT=1/60,N=Number(process.argv[2])||600;
let seed=12345;const rnd=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296,pick=(a,b)=>a+(b-a)*rnd();
const fails=[],stats={throws:0,steps:0,maxPinSpeed:0,maxBallSpeed:0,minPinPointY:Infinity,minBallY:Infinity,settleMax:0,late:0,lateFlips:0};
// Static colliders copied from games/sports_siege/bowling.js (centre, half extents).
const SOLIDS=[[0,-.2,(16+LANE_END)/2,2.2,.2,(16-LANE_END)/2],[-2.65,-.55,(16+LANE_END)/2,.45,.15,(16-LANE_END)/2],[2.65,-.55,(16+LANE_END)/2,.45,.15,(16-LANE_END)/2],
 [-3.22,.7,0,.12,1.2,16.8],[3.22,.7,0,.12,1.2,16.8],[0,-1,-16.05,3.3,.2,.75],[0,.1,-16.75,3.3,1.3,.2]];
const TOL=.06;
// Signed distance from a point into the nearest solid box (positive = inside, negative = gap).
function insideDepth(pt){let d=-Infinity;for(const [cx,cy,cz,hx,hy,hz] of SOLIDS){const qx=Math.abs(pt.x-cx)-hx,qy=Math.abs(pt.y-cy)-hy,qz=Math.abs(pt.z-cz)-hz;
 const outside=Math.hypot(Math.max(qx,0),Math.max(qy,0),Math.max(qz,0)),inside=Math.min(Math.max(qx,qy,qz),0);d=Math.max(d,-(outside+inside));}return d;}
function radiusAt(y){for(let i=1;i<PIN_PROFILE.length;i++){const [r1,y1]=PIN_PROFILE[i-1],[r2,y2]=PIN_PROFILE[i];if(y<=y2)return r1+(r2-r1)*(y-y1)/Math.max(1e-6,y2-y1);}return 0;}
function worldPoint(t,q,ly){ // body-local (0,ly,0) rotated by quaternion q, plus translation
 const [x,y,z,w]=q;return {x:t.x+2*(x*y-w*z)*ly,y:t.y+(1-2*(x*x+z*z))*ly,z:t.z+2*(y*z+w*x)*ly};}
function check(w,label,t){
 const s=w.snapshot();
 for(const p of s.pins){
  const v=[p.x,p.y,p.z,...p.q];if(v.some(n=>!Number.isFinite(n))){fails.push(`${label} t=${t.toFixed(2)} NaN pin ${p.id}`);return false;}
  // Sample the pin SURFACE (7 rings x 8 points on the real profile); no point may sit
  // inside a static collider deeper than TOL.
  {const [qx,qy,qz,qw]=p.q,X=[1-2*(qy*qy+qz*qz),2*(qx*qy+qw*qz),2*(qx*qz-qw*qy)],Z=[2*(qx*qz+qw*qy),2*(qy*qz-qw*qx),1-2*(qx*qx+qy*qy)];let worst=-Infinity,at=null;
   for(let k=0;k<=6;k++){const ly=PIN_H*k/6,c=worldPoint(p,p.q,ly),r=radiusAt(ly);
    for(let a=0;a<8;a++){const ca=Math.cos(a*Math.PI/4)*r,sa=Math.sin(a*Math.PI/4)*r,pt={x:c.x+X[0]*ca+Z[0]*sa,y:c.y+X[1]*ca+Z[1]*sa,z:c.z+X[2]*ca+Z[2]*sa},d=insideDepth(pt);if(d>worst){worst=d;at=pt;}}}
   stats.minPinPointY=Math.min(stats.minPinPointY,-worst);
   if(worst>TOL)fails.push(`${label} t=${t.toFixed(2)} pin ${p.id} surface inside solid by ${worst.toFixed(3)}m at (${at.x.toFixed(2)},${at.y.toFixed(2)},${at.z.toFixed(2)})`);}
  if(Math.abs(p.x)>3.15||p.z<-16.6||p.y>3)fails.push(`${label} t=${t.toFixed(2)} pin ${p.id} escaped (${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)})`);
 }
 const b=s.ball;if(b){
  if(![b.x,b.y,b.z].every(Number.isFinite)){fails.push(`${label} NaN ball`);return false;}
  const bottom={x:b.x,y:b.y-.33,z:b.z},bd=insideDepth(bottom);stats.minBallY=Math.min(stats.minBallY,-bd);
  if(bd>TOL)fails.push(`${label} t=${t.toFixed(2)} ball inside solid by ${bd.toFixed(3)} at (${b.x.toFixed(2)},${b.y.toFixed(2)},${b.z.toFixed(2)})`);
  if(Math.abs(b.x)>3.15||b.z<-16.6||b.y>3)fails.push(`${label} ball escaped (${b.x.toFixed(2)},${b.y.toFixed(2)},${b.z.toFixed(2)})`);
 }
 return true;
}
function speeds(w){let pin=0;for(const p of w.pins){if(!p)continue;const v=p.body.linvel();pin=Math.max(pin,Math.hypot(v.x,v.y,v.z));}const bv=w.ball?.linvel();return {pin,ball:bv?Math.hypot(bv.x,bv.y,bv.z):0};}
function roll(input,mask,label){
 const w=new physics.BowlingWorld();if(mask)w.reset(mask);w.throw(input);let t=0,ok=true;
 for(;t<10&&ok;t+=DT){w.step(DT);stats.steps++;ok=check(w,label,t);const v=speeds(w);stats.maxPinSpeed=Math.max(stats.maxPinSpeed,v.pin);stats.maxBallSpeed=Math.max(stats.maxBallSpeed,v.ball);
  if(v.pin>30)fails.push(`${label} t=${t.toFixed(2)} pin speed explosion ${v.pin.toFixed(1)} m/s`);if(t>.5&&w.resting)break;}
 if(t>=10)stats.late++;stats.settleMax=Math.max(stats.settleMax,t);
 const before=w.standing().join();for(let i=0;i<2/DT;i++){w.step(DT);check(w,label+' post',10+i*DT);}
 if(w.standing().join()!==before){stats.lateFlips++;fails.push(`${label} standing set changed after settle`);}
 const standing=w.standing();w.free();return standing;
}
(async()=>{
 await physics.init();const t0=Date.now();
 const extremes=[{position:0,angle:0,power:1.25,spin:0},{position:0,angle:0,power:0,spin:0},{position:1.3,angle:-.4,power:1.2,spin:-1.6},{position:-1.3,angle:.4,power:1.2,spin:1.6},{position:0,angle:.03,power:1,spin:1.6},{position:.2,angle:0,power:.05,spin:0}];
 const inputs=[...extremes,...Array.from({length:N},()=>({position:pick(-1.2,1.2),angle:pick(-.35,.35),power:pick(0,1.15),spin:pick(-1.5,1.5)}))];
 for(const [i,input] of inputs.entries()){
  const label=`#${i} ${JSON.stringify(Object.fromEntries(Object.entries(input).map(([k,v])=>[k,+v.toFixed(2)])))}`;
  const standing=roll(input,null,label);stats.throws++;
  if(i%3===0&&standing.some(Boolean)&&!standing.every(Boolean)){roll({position:pick(-1,1),angle:pick(-.2,.2),power:pick(.3,1.1),spin:pick(-1,1)},standing,label+' 2nd');stats.throws++;}
 }
 const report={...stats,maxPinPenetration:+(-stats.minPinPointY).toFixed(3),maxBallPenetration:+(-stats.minBallY).toFixed(3),maxPinSpeed:+stats.maxPinSpeed.toFixed(1),maxBallSpeed:+stats.maxBallSpeed.toFixed(1),settleMax:+stats.settleMax.toFixed(2),seconds:(Date.now()-t0)/1000,failures:fails.length,firstFailures:fails.slice(0,15)};
 console.log(JSON.stringify(report,null,1));process.exitCode=fails.length?1:0;
})();
