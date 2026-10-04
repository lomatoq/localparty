'use strict';
// Pocket Strike authoritative physics regression. Deterministic inputs through the real
// Rapier world and the real Match loop (fixed 1/60 server ticks, 120 Hz substeps).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let physics;try{physics=require('../games/sports_siege/bowling');require.resolve('@dimforge/rapier3d-compat');}catch{physics=null;}
const {Match}=require('../games/sports_siege/match');
const rules=require('../games/sports_siege/rules');
const skip=!physics;
const DT=1/60,DEADLINE=10;
const finitePose=p=>[p.x,p.y,p.z,...p.q].every(Number.isFinite);
const inWorld=p=>Math.abs(p.x)<3.4&&p.y>-1.3&&p.y<4&&p.z>-17&&p.z<14;
// Rolls a ball with the same settle rule as Match.bowlingStep and checks invariants on every tick.
function roll(input,mask){
  const w=new physics.BowlingWorld();if(mask)w.reset(mask);
  const start=w.snapshot().pins.map(p=>({...p}));w.throw(input);
  let t=0,restSince=null,settledAt=null,leftLane=false,minClearance=Infinity,firstContact=null,maxBallY=0;
  for(let i=0;i<DEADLINE/DT;i++){
    w.step(DT);t+=DT;const s=w.snapshot();
    for(const body of [...s.pins,s.ball]){assert.ok(finitePose(body),`finite pose at ${t.toFixed(2)}s`);assert.ok(inWorld(body),`body stays inside the alley at ${t.toFixed(2)}s: ${JSON.stringify(body)}`);}
    if(s.ball.z>-15.3)maxBallY=Math.max(maxBallY,s.ball.y);
    if(s.gutter)leftLane=true;else assert.equal(leftLane,false,'a gutter ball never returns to the lane');
    // Tunnelling guard: while a pin is still upright and untouched, the ball centre
    // can never get closer to its axis than contact distance minus a solver margin.
    for(const pin of s.pins){const rest=start.find(p=>p.id===pin.id);if(Math.hypot(pin.x-rest.x,pin.z-rest.z)>.02){firstContact??=t;continue;}
      if(s.ball.y>.2&&s.ball.y<.5)minClearance=Math.min(minClearance,Math.hypot(s.ball.x-pin.x,s.ball.z-pin.z));}
    if(w.resting){restSince??=t;}else restSince=null;
    if(t>1.3&&restSince!==null&&t-restSince>.6){settledAt=t;break;}
  }
  const standing=w.standing();
  return {w,standing,down:(mask||Array(10).fill(true)).filter(Boolean).length-standing.filter(Boolean).length,settledAt,gutter:w.gutter,minClearance,firstContact,maxBallY};
}
function finish(r){r.w.free();return r;}
const ballXAt=(input,z)=>{const w=new physics.BowlingWorld();w.throw(input);let x=null;for(let i=0;i<400&&x===null;i++){w.step(DT);const b=w.snapshot().ball;if(b.z<=z)x=b.x;}w.free();return x;};

test('bowling physics: rack stands still, sleeps and never jitters without a throw',{skip},async()=>{
  await physics.init();const w=new physics.BowlingWorld();
  try{for(let i=0;i<10/DT;i++)w.step(DT);
    assert.deepEqual(w.standing(),Array(10).fill(true));
    for(const p of w.pins){assert.ok(p.body.isSleeping(),'idle pin sleeps');const t=p.body.translation(),rest=physics.PIN_POS[p.id];assert.ok(Math.hypot(t.x-rest.x,t.z-rest.z)<.005,'idle pin did not creep');}
    for(const p of w.snapshot().pins)assert.ok(finitePose(p));
  }finally{w.free();}
});
test('bowling physics: weak and strong straight balls hit pins, settle before the turn deadline',{skip},async()=>{
  await physics.init();
  const weak=finish(roll({power:0,angle:0,spin:0,position:0})),strong=finish(roll({power:1,angle:0,spin:0,position:0}));
  for(const r of [weak,strong]){assert.ok(r.down>=3,`straight centre ball knocks pins (${r.down})`);assert.ok(r.settledAt!==null&&r.settledAt<DEADLINE-.5,`settles before the turn deadline (${r.settledAt})`);assert.ok(r.minClearance>.4,`no tunnelling (${r.minClearance.toFixed(3)})`);}
  assert.ok(strong.firstContact<weak.firstContact,'stronger ball reaches the rack sooner');
});
test('bowling physics: an edge hit takes only part of the rack',{skip},async()=>{
  await physics.init();const r=finish(roll({power:.7,angle:0,spin:0,position:.6}));
  assert.ok(r.down>=1&&r.down<=6,`edge hit is partial (${r.down})`);assert.ok(r.standing[6]&&r.standing[3],'far-side pins remain');assert.ok(r.minClearance>.4);
});
test('bowling physics: spin hooks both ways symmetrically and only on the lane',{skip},async()=>{
  await physics.init();const base={power:.5,angle:0,position:0};
  const left=ballXAt({...base,spin:-1},-8.8),none=ballXAt({...base,spin:0},-8.8),right=ballXAt({...base,spin:1},-8.8);
  assert.ok(Math.abs(none)<1e-6,'no spin rolls straight');assert.ok(right>.15&&left< -.15,`hook visible both ways (${left.toFixed(2)} / ${right.toFixed(2)})`);
  assert.ok(Math.abs(right+left)<.01,'hook is mirror-symmetric');
  for(const spin of [-1,1]){const r=finish(roll({...base,spin}));assert.ok(r.settledAt!==null&&r.settledAt<9,'hook ball settles');}
});
test('bowling physics: gutter ball scores zero and stays in the channel',{skip},async()=>{
  await physics.init();for(const side of [-1,1]){const r=finish(roll({power:.9,angle:.32*side,spin:-side,position:side}));
    assert.equal(r.gutter,true);assert.equal(r.down,0);assert.ok(r.settledAt<5,'gutter turn resolves quickly');}
});
test('bowling physics: a pocket strike is reachable without forcing every centre ball to strike',{skip},async()=>{
  await physics.init();
  const pocket=[{power:.75,angle:0,spin:0,position:.1},{power:.75,angle:0,spin:-.4,position:.1},{power:.75,angle:0,spin:0,position:-.15}].map(i=>finish(roll(i)));
  assert.ok(pocket.some(r=>r.down===10),'at least one pocket ball strikes: '+pocket.map(r=>r.down));
  const outcomes=[0,.25,.5,.75,1].map(power=>finish(roll({power,angle:0,spin:0,position:0})).down);
  assert.ok(outcomes.some(d=>d<10),'head-on balls are not all strikes: '+outcomes);
});
test('bowling physics: second ball rolls only at survivors; fallen pins never come back',{skip},async()=>{
  await physics.init();
  const first=finish(roll({power:.5,angle:0,spin:0,position:-.15}));assert.ok(first.down>0&&first.down<10,'first ball leaves pins: '+first.down);
  const mask=first.standing,second=roll({power:.8,angle:0,spin:0,position:.1},mask);
  try{
    assert.equal(second.w.snapshot().pins.length,mask.filter(Boolean).length);
    second.standing.forEach((s,i)=>{if(s)assert.ok(mask[i],`pin ${i} cannot stand again after falling`);});
    assert.ok(second.down>=0&&second.down<=mask.filter(Boolean).length);
  }finally{second.w.free();}
  // A spare is reachable for some second ball over the actual leave.
  const pickups=[-.5,-.3,-.1,.1,.3,.5].map(position=>finish(roll({power:.8,angle:0,spin:0,position},mask)).standing.filter(Boolean).length);
  assert.ok(pickups.some(n=>n===0),'some pickup converts the spare: '+pickups);
});
test('bowling physics: settled result is stable (no late jitter flips a pin)',{skip},async()=>{
  await physics.init();
  for(const input of [{power:.75,angle:0,spin:0,position:.1},{power:.3,angle:.02,spin:.5,position:-.3},{power:1,angle:-.03,spin:-1,position:.4}]){
    const r=roll(input);try{const before=r.standing.join();for(let i=0;i<3/DT;i++)r.w.step(DT);assert.equal(r.w.standing().join(),before,'standing set unchanged 3 s after settle');
      for(const p of r.w.pins)if(p)assert.ok(Math.hypot(...Object.values(p.body.linvel()))<.12,'pins are quiet');}finally{r.w.free();}
  }
});
test('bowling physics: broad input sweep has no NaN, escapes, or turn-deadline settles beyond a few edge cases',{skip},async()=>{
  await physics.init();let late=0,n=0;const hist=Array(11).fill(0);
  for(const power of [.15,.6,1])for(const position of [-.6,-.3,-.1,0,.1,.3,.6])for(const spin of [-.7,0,.7]){const r=finish(roll({power,angle:0,spin,position}));n++;hist[r.down]++;if(r.settledAt===null)late++;assert.ok(r.minClearance>.4,'no tunnelling');
    // The ball (r=.33) may hop over a fallen pin but is never launched off the deck.
    assert.ok(r.maxBallY<.8,`ball stays on the deck (max centre height ${r.maxBallY.toFixed(2)})`);}
  assert.ok(late<=2,`at most 2/${n} throws reach the 10 s deadline (got ${late})`);
  assert.ok(hist[10]>0&&hist[10]<n*.6,'strikes exist but are not automatic: '+hist);
  assert.ok(hist.slice(1,10).reduce((a,b)=>a+b,0)>n*.3,'many open results: '+hist);
});
function runMatch(inputs,snapshotHz){
  const m=new Match('bowling',{bowlingFactory:()=>new physics.BowlingWorld()});m.add({id:'a',name:'A'});m.add({id:'b',name:'B'});m.start({frames:3});
  let k=0,throws=0,steps=0,snapshotEvery=snapshotHz?Math.max(1,Math.round(60/snapshotHz)):0;const rolls=[];
  while(m.phase==='playing'&&steps<60*400){
    if(m.stage==='aim'){const input=inputs[k++%inputs.length];assert.equal(m.input(m.currentId,'throw',{...input,turnToken:m.turnToken}),true);throws++;
      assert.equal(m.input(m.currentId,'throw',{...input,turnToken:m.turnToken}),false,'duplicate packet is rejected');}
    m.step(DT);steps++;
    if(snapshotEvery&&steps%snapshotEvery===0)JSON.stringify(m.snapshot());
    for(const e of m.events)if(e.kind==='roll'&&!rolls.some(r=>r.id===e.id))rolls.push({id:e.id,pins:e.pins,player:e.player});
  }
  m.world?.free();
  return {m,throws,rolls,scores:m.playing().map(p=>p.score),frames:m.playing().map(p=>p.frames.map(f=>f.rolls))};
}
test('bowling match: real physics, no double scoring, identical result at any snapshot (render) rate',{skip},async()=>{
  await physics.init();
  const inputs=[{power:.75,angle:0,spin:0,position:.1},{power:.5,angle:0,spin:0,position:-.15},{power:.8,angle:0,spin:0,position:.1},{power:.9,angle:.32,spin:-1,position:1},{power:.3,angle:0,spin:.5,position:-.3}];
  const runs=[0,30,60,120].map(hz=>runMatch(inputs,hz));
  for(const r of runs){
    assert.equal(r.m.phase,'results','match finishes');assert.equal(r.rolls.length,r.throws,'each throw records exactly one roll');
    r.m.playing().forEach(p=>{assert.equal(p.score,rules.scoreBowling(p.frames,3).provisional);for(const f of p.frames.slice(0,-1))assert.ok(f.rolls.reduce((s,n)=>s+n,0)<=10,'a frame never exceeds the rack');});
  }
  for(const r of runs.slice(1)){assert.deepEqual(r.frames,runs[0].frames,'same rolls regardless of snapshot rate');assert.deepEqual(r.scores,runs[0].scores);}
});
test('bowling scene: renderer pin lathe matches the physical pin profile',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../games/sports_siege/public/scene-bowling.js'),'utf8');
  const match=source.match(/const PIN_PROFILE=(\[\[.*?\]\]);/);assert.ok(match,'scene declares PIN_PROFILE');
  const server=fs.readFileSync(path.join(__dirname,'../games/sports_siege/bowling.js'),'utf8').match(/const PIN_PROFILE=(\[\[.*?\]\]);/);
  assert.equal(match[1],server[1]);
});
