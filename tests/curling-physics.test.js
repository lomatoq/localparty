'use strict';
// Focused deterministic regression for the authoritative curling ice model.
// Golden assertions keep the existing rules (house r2.6 + stone edge, hog at z0,
// out at |x|>3.35 / z<-14.6 / z>15, tie within 1e-4 gives a blank end).
const test=require('node:test'),assert=require('node:assert/strict');
const {Ice,CURL}=require('../games/sports_siege/curling');
const {Match}=require('../games/sports_siege/match');
const rules=require('../games/sports_siege/rules');
const TEE={x:0,z:-9},R=.43;
const put=(ice,id,team,x,z)=>{const s={id,owner:'o'+team,team,r:R,x,z,vx:0,vz:0,spin:0,rotation:0,valid:true,crossed:true};ice.stones.push(s);return s;};
const energy=ice=>ice.stones.filter(s=>s.valid).reduce((a,s)=>a+s.vx*s.vx+s.vz*s.vz,0);
// Runs until rest exactly like Match.curlingStep and records invariants every tick.
function shoot(input,{setup,sweep=0,dt=1/60,team=0}={}){
  const ice=new Ice();setup?.(ice);const stone=ice.throw(input,{id:'p',team});
  let t=0,energyRises=0,minGap=Infinity,last=energy(ice),nan=false;
  while(t<17){
    ice.step(dt,sweep);t+=dt;const e=energy(ice);if(e>last*(1+1e-9)+1e-12)energyRises++;last=e;
    for(const s of ice.stones)if(![s.x,s.z,s.vx,s.vz,s.rotation].every(Number.isFinite))nan=true;
    const live=ice.stones.filter(s=>s.valid);for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++)minGap=Math.min(minGap,Math.hypot(live[i].x-live[j].x,live[i].z-live[j].z));
    if(ice.resting&&t>.3)break;
  }
  const rested=ice.resting;ice.settle();return {ice,stone,t,energyRises,minGap,nan,rested};
}
const dist=s=>Math.hypot(s.x-TEE.x,s.z-TEE.z);
function sane(r,label){assert.equal(r.nan,false,label+': finite');assert.equal(r.energyRises,0,label+': energy never rises without input');assert.ok(r.rested,label+': reaches rest before the 17 s deadline');assert.ok(r.minGap>=2*R-1e-6,label+': no overlap/tunnelling, min gap '+r.minGap);}

test('straight draw stops on the button line, keeps x, is valid',()=>{
  const r=shoot({power:.555,angle:0,spin:0,position:0});sane(r,'straight');
  assert.equal(r.stone.valid,true);assert.equal(r.stone.x,0);assert.ok(dist(r.stone)<.5,'draw lands near tee: '+dist(r.stone));
});
test('left / right curl are mirror images and full spin stays playable',()=>{
  const L=shoot({power:.555,angle:0,spin:-1,position:0}),Rt=shoot({power:.555,angle:0,spin:1,position:0});sane(L,'left');sane(Rt,'right');
  assert.ok(Math.abs(L.stone.x+Rt.stone.x)<1e-9&&Math.abs(L.stone.z-Rt.stone.z)<1e-9,'mirror symmetric');
  assert.ok(Rt.stone.x>.9,'positive spin curls to +x by a visible amount: '+Rt.stone.x);
  assert.ok(Rt.stone.valid&&Rt.stone.x<2.6,'full spin draw still ends in play/house reach: '+Rt.stone.x);
  const half=shoot({power:.555,angle:0,spin:.5,position:0});assert.ok(half.stone.x>.35&&half.stone.x<Rt.stone.x,'curl grows with spin');
  // Sweeping keeps the stone straighter (existing rule: curl *(1-.6*sweep)).
  const swept=shoot({power:.5,angle:0,spin:1,position:0},{sweep:1});assert.ok(Math.atan2(swept.stone.x,13-swept.stone.z)<Math.atan2(shoot({power:.5,angle:0,spin:1,position:0}).stone.x,13-shoot({power:.5,angle:0,spin:1,position:0}).stone.z));
});
test('weak / strong: distance grows with power; zero power is a hog violation; full power leaves the back',()=>{
  let previous=13;for(const power of [.3,.4,.5,.55,.6]){const r=shoot({power,angle:0,spin:0,position:0});sane(r,'power '+power);assert.ok(r.stone.z<previous,'monotonic distance');previous=r.stone.z;}
  const weak=shoot({power:0,angle:0,spin:0,position:0});assert.equal(weak.stone.crossed,false);assert.equal(weak.stone.valid,false,'not past hog -> removed only at settle');
  const strong=shoot({power:1,angle:0,spin:0,position:0});sane(strong,'strong');assert.equal(strong.stone.valid,false,'through the back');assert.ok(strong.stone.z<=-14.6);
});
test('hog line: a stone that crossed z0 and stopped is kept; one that stopped short is removed at settle',()=>{
  const crossed=shoot({power:.3,angle:0,spin:0,position:0});assert.ok(crossed.stone.z<0);assert.equal(crossed.stone.valid,true);
  const short=shoot({power:.2,angle:0,spin:0,position:0});assert.ok(short.stone.z>0);assert.equal(short.stone.valid,false);
  // Before settle the short stone is still valid (removal is a server decision at rest).
  const ice=new Ice();const s=ice.throw({power:.2,angle:0,spin:0,position:0},{id:'p',team:0});for(let i=0;i<17*60&&!ice.resting;i++)ice.step(1/60);assert.equal(s.valid,true);ice.settle();assert.equal(s.valid,false);
});
test('guarded draw: curl takes the stone around a centre guard into the house',()=>{
  // Released behind the guard's line (x-1.32) the stone would hit it straight; full spin curls it in.
  const gx=-.6*2.2+.05,straight=shoot({power:.555,angle:0,spin:0,position:-.6},{setup:ice=>put(ice,'guard',1,gx,-3.5)});
  assert.notEqual(straight.ice.stones.find(s=>s.id==='guard').z,-3.5,'without curl the guard is hit');
  const r=shoot({power:.555,angle:0,spin:1,position:-.6},{setup:ice=>put(ice,'guard',1,gx,-3.5)});sane(r,'guarded draw');
  const guard=r.ice.stones.find(s=>s.id==='guard');assert.equal(guard.x,gx,'guard untouched');assert.equal(guard.z,-3.5);
  assert.ok(r.stone.valid&&dist(r.stone)<1.2,'draw curls into the house: '+dist(r.stone));
});
test('direct takeout removes the target and the shooter stays near the house',()=>{
  const r=shoot({power:.86,angle:0,spin:0,position:0},{setup:ice=>put(ice,'target',1,0,-9)});sane(r,'takeout');
  const target=r.ice.stones.find(s=>s.id==='target');assert.equal(target.valid,false,'target driven out the back');
  assert.equal(r.stone.valid,true);assert.ok(r.stone.z<-6&&r.stone.z>-9.5,'shooter sticks near the house: '+r.stone.z);
});
test('glancing hit sends the target away from the contact side; momentum is shared',()=>{
  const r=shoot({power:.6,angle:0,spin:0,position:0},{setup:ice=>put(ice,'target',1,.45,-6)});sane(r,'glancing');
  const target=r.ice.stones.find(s=>s.id==='target');assert.ok(target.x>.45+.3,'target pushed to +x: '+target.x);assert.ok(r.stone.x<0,'shooter deflected to -x: '+r.stone.x);
});
test('collision chain passes momentum down the line; last stone travels farthest',()=>{
  const r=shoot({power:.86,angle:0,spin:0,position:0},{setup:ice=>{put(ice,'a',1,0,-6);put(ice,'b',0,0,-8);put(ice,'c',1,0,-10);}});sane(r,'chain');
  const [a,b,c]=['a','b','c'].map(id=>r.ice.stones.find(s=>s.id===id));assert.ok(a.z<-6&&b.z<-8,'every stone moved forward');
  assert.ok(c.z<b.z&&b.z<a.z,'order preserved, front stone farthest');
});
test('edge / out: a stone past |x|3.35 is removed, frozen, and never collides again',()=>{
  const r=shoot({power:.6,angle:.2,spin:0,position:0},{setup:ice=>put(ice,'far',1,3.0,-12)});sane(r,'edge');
  assert.equal(r.stone.valid,false);assert.ok(Math.abs(r.stone.x)>3.35);assert.equal(r.stone.vx,0);assert.equal(r.stone.vz,0);
  const far=r.ice.stones.find(s=>s.id==='far');assert.equal(far.x,3.0);assert.equal(far.z,-12,'removed stone could not push a live one');
});
test('close / disputed scoring: golden rules',()=>{
  const S=(id,team,x,z,extra={})=>({id,team,x,z,r:R,...extra});
  assert.deepEqual(rules.curlingScore([S(1,0,0,-9.5),S(2,1,0,-9.5+1e-5+0)]),{team:null,points:0,ids:[]},'equal within epsilon -> blank');
  assert.deepEqual(rules.curlingScore([S(1,0,0,-9.40),S(2,1,0,-8.59)]),{team:0,points:1,ids:[1]},'1 cm closer wins');
  assert.equal(rules.curlingScore([S(1,0,2.6+R-1e-3,-9)]).points,1,'edge biting the house counts');
  assert.equal(rules.curlingScore([S(1,0,2.6+R+1e-3,-9)]).points,0,'just outside does not');
  assert.deepEqual(rules.curlingScore([S(1,0,0,-9),S(2,0,.5,-9),S(3,1,0,-8),S(4,0,1.5,-9),S(5,1,0,-9.1,{valid:false})]),{team:0,points:2,ids:[1,2]},'counts only inside nearest opponent; removed stones ignored');
});
test('fuzz: random throws into random houses keep every invariant',()=>{
  let seed=20261001;const rnd=()=>(seed=(1664525*seed+1013904223)>>>0)/4294967296;
  for(let n=0;n<160;n++){
    const k=Math.floor(rnd()*7),input={power:.3+rnd()*.7,angle:(rnd()-.5)*.3,spin:rnd()*2-1,position:rnd()*2-1};
    const r=shoot(input,{setup:ice=>{for(let i=0;i<k;i++){let x,z,tries=0;do{x=(rnd()-.5)*5;z=-9+(rnd()-.5)*7;tries++;}while(tries<50&&ice.stones.some(s=>Math.hypot(s.x-x,s.z-z)<2*R+.01));put(ice,'r'+i,i%2,x,z);}},sweep:rnd()<.3?rnd():0});
    sane(r,'fuzz '+n+' '+JSON.stringify(input));
    for(const s of r.ice.stones)if(s.valid)assert.ok(Math.abs(s.x)<=3.35&&s.z>=-14.6&&s.z<=15&&s.crossed,'valid stones are in play');
  }
});
test('server step size / render rate does not change the outcome',()=>{
  const setup=ice=>{put(ice,'a',1,.2,-8.6);put(ice,'b',0,-.6,-9.4);};const input={power:.7,angle:.01,spin:.4,position:.1};
  const outcome=dt=>{const r=shoot(input,{setup,dt});return r.ice.stones.map(s=>[s.id,s.valid,+s.x.toFixed(6),+s.z.toFixed(6)]);};
  // The server always advances in fixed 1/60 ticks (render fps never reaches the model);
  // 120 Hz substeps make 1/120 and 1/60 identical. 1/30 differs only by when the
  // sub-4 cm/s rest check fires (<2 mm), never in validity or order.
  const ref=outcome(1/120);assert.deepEqual(outcome(1/60),ref);
  const coarse=outcome(1/30);coarse.forEach((s,i)=>{assert.equal(s[1],ref[i][1]);assert.ok(Math.hypot(s[2]-ref[i][2],s[3]-ref[i][3])<2e-3);});
});
function match(n=2){const m=new Match('curling');for(let i=0;i<n;i++)m.add({id:'p'+i,name:'P'+i});m.start({ends:3});return m;}
function playEnd(m,shots){
  const log=[];let guard=0;
  while(m.phase==='playing'&&guard++<20000){
    if(m.stage==='aim'){const shot=shots[m.throwIndex%shots.length];const before=m.world.stones.filter(s=>s.valid).map(s=>s.id);assert.equal(m.input(m.currentId,'throw',{...shot,turnToken:m.turnToken}),true);
      assert.equal(m.input(m.currentId,'throw',{...shot,turnToken:m.turnToken}),false,'duplicate packet rejected');log.push({before,count:m.world.stones.length});}
    const stage=m.stage,end=m.endIndex,valid=m.world.stones.filter(s=>s.valid).map(s=>s.id).join();m.step(1/60);
    if(stage==='reveal'&&m.stage==='aim'&&m.endIndex===end)assert.equal(m.world.stones.filter(s=>s.valid).map(s=>s.id).join(),valid,'no valid stone removed between turns');
    if(stage==='end'&&m.stage!=='end')return log;
  }
  return log;
}
test('match: duplicate throws, stones persist between turns, each end scored once on the server',()=>{
  const m=match();const shots=[{power:.555,angle:0,spin:.3,position:0},{power:.55,angle:.02,spin:-.4,position:.1},{power:.8,angle:0,spin:0,position:0},{power:.56,angle:-.02,spin:.6,position:-.2}];
  for(let end=1;end<=3;end++){const log=playEnd(m,shots);assert.equal(log.length,8,'8 stones in end '+end);assert.equal(m.endScores.length,end,'exactly one score per end');}
  assert.equal(m.phase,'results');const total=[0,1].map(t=>m.endScores.filter(e=>e.team===t).reduce((a,e)=>a+e.points,0));assert.deepEqual(m.teams,total,'team totals equal the per-end server results');
  const counted=new Set();for(const e of m.endScores)for(const id of e.ids){assert.equal(counted.has(id),false,'a stone is never counted twice');counted.add(id);}
});
test('curl constant is exported for the renderer guide and is in a playable range',()=>{assert.ok(CURL>0&&CURL<.052);});
