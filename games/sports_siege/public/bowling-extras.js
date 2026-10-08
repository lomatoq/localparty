// Pocket Strike alley life: neon gutter chase, ball trail, deck lights, lane display,
// impact/strike/spare/gutter effects, disco reflections and ball-return polish.
// Purely visual and read-only: everything is derived from the BowlingScene's
// interpolated snapshot (stage, ball pose, impact, banner) and roll events; nothing
// here can change a roll, a pin count or a score. Timing uses the scene replay clock
// (renderT, server time), so a paused match freezes the effects too. Every pool is
// preallocated and bounded; dispose() removes and frees everything.
import * as THREE from './vendor/three.module.js';

const CEL='/assets/fx/atlas-fx-celebration/',CMB='/assets/fx/atlas-fx-combat/';
const CAP_X=3.22,CAP_Y=.087,STRIP_FROM=15.9,STRIP_TO=-8.9,SEGMENTS=60;
const START_Z=12.8,HOOD={x:-3.8,y:.64,z:12.15};
const MASK={y:2.56,z:-9.255,w:6.9,h:1.62};
const NEIGHBOUR_X=[-7.6,7.0,-14.5,13.9];
const RACK=[];for(let row=0;row<4;row++)for(let col=0;col<=row;col++)RACK.push({x:(col-row/2)*.72,z:-9.8-row*.65});
// Pinsetter: table bottom sits just above the pin tops (1.21) when it holds or sets pins;
// LIFT matches the scene's own pin-lowering height so a held pin never jumps.
const LANE_END=-15.4,PIN_TOP=1.24,LIFT=1.35,TABLE_REST=2.65,TABLE_Z=-10.78,REVEAL_WINDOW=1.6;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=u=>{u=clamp(u,0,1);return u*u*(3-2*u);};
function seeded(seed){let s=seed>>>0;return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];}
function frameComplete(r,last){if(!r.length)return false;if(!last)return r[0]===10||r.length>=2;if(r.length<2)return false;return r[0]===10||r[0]+r[1]===10?r.length>=3:true;}
function freshRack(r,last){if(!r.length)return true;if(!last)return false;return r.length===1?r[0]===10:r.length===2&&(r[1]===10||(r[0]!==10&&r[0]+r[1]===10));}
const easeOut=u=>1-Math.pow(1-clamp(u,0,1),3);
function freshBefore(prev,last){if(!prev.length)return true;if(!last)return false;return prev.length===1?prev[0]===10:prev.length===2&&(prev[1]===10||(prev[0]!==10&&prev[0]+prev[1]===10));}

// One billboard pool = one instanced draw. Particles are camera-facing quads whose
// colour is pre-multiplied by their fade (additive blending), so no per-instance alpha.
class Pool{
  constructor(owner,map,size,{depthTest=false,renderOrder=7}={}){
    this.owner=owner;this.items=Array.from({length:size},()=>({born:-1}));this.cursor=0;
    this.material=owner.track(new THREE.MeshBasicMaterial({map,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest,toneMapped:false,fog:false}));
    this.mesh=new THREE.InstancedMesh(owner.quad,this.material,size);this.mesh.frustumCulled=false;this.mesh.renderOrder=renderOrder;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.mesh.setColorAt(0,new THREE.Color(0));this.mesh.count=0;owner.add(this.mesh);
  }
  spawn(o){const p=this.items[this.cursor++%this.items.length];Object.assign(p,{born:0,life:1,x:0,y:0,z:0,vx:0,vy:0,vz:0,g:0,drag:0,s0:1,s1:1,rot:0,spin:0,r:1,gg:1,b:1,peak:.12},o);return p;}
  update(t,camQ){
    const O=this.owner,m=O.m,q=O.q,qz=O.qz,v=O.v,s=O.s,c=O.c;let n=0;
    for(const p of this.items){if(p.born<0)continue;const age=t-p.born;if(age<0)continue;if(age>p.life){p.born=-1;continue;}
      const u=age/p.life,k=p.drag?(1-Math.exp(-p.drag*age))/p.drag:age,fade=u<p.peak?u/p.peak:1-smooth((u-p.peak)/(1-p.peak)),size=p.s0+(p.s1-p.s0)*(1-Math.pow(1-u,2));
      v.set(p.x+p.vx*k,p.y+p.vy*k-.5*p.g*age*age,p.z+p.vz*k);qz.setFromAxisAngle(O.zAxis,p.rot+p.spin*age);q.copy(camQ).multiply(qz);
      m.compose(v,q,s.set(size,size,size));this.mesh.setMatrixAt(n,m);this.mesh.setColorAt(n++,c.setRGB(p.r*fade,p.gg*fade,p.b*fade));}
    this.mesh.count=n;if(n){this.mesh.instanceMatrix.needsUpdate=true;this.mesh.instanceColor.needsUpdate=true;}
  }
  clear(){for(const p of this.items)p.born=-1;this.mesh.count=0;}
}

export class BowlingExtras{
  constructor(scene){
    this.host=scene;this.scene=scene.scene;this.camera=scene.camera;this.reduced=!!scene.reduced;
    this.objects=[];this.disposables=new Set();
    this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.qz=new THREE.Quaternion();this.v=new THREE.Vector3();this.s=new THREE.Vector3(1,1,1);this.c=new THREE.Color();this.c2=new THREE.Color();
    this.zAxis=new THREE.Vector3(0,0,1);this.flatQ=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
    this.quad=this.track(new THREE.PlaneGeometry(1,1));this.flatQuad=this.track(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2));
    this.loader=new THREE.TextureLoader();this.textures=new Map();
    this.state={token:'',impact:null,banner:null,gutterAt:-1,rolledAt:-1,lastStage:'',returnPop:'',trail:[],trailToken:'',sparkleAt:0,display:null,flare:-9,celebrate:null};
    // The sweep bar must cover the lane reflections (opaque pass, after the mirrors).
    scene.sweep?.traverse(o=>{if(o.isMesh)o.renderOrder=3;});
    this.buildGlows();this.buildNeon();this.buildTrail();this.buildDeckLights();this.buildMarquee();this.buildDisplay();this.buildDisco();this.buildBeams();this.buildReturn();this.buildPools();this.buildPit();this.buildPinsetter();this.buildSweepSkin();
  }
  track(x){this.disposables.add(x);return x;}
  add(o){this.scene.add(o);this.objects.push(o);return o;}
  tex(url){if(this.textures.has(url))return this.textures.get(url);const t=this.track(this.loader.load(url));t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearMipmapLinearFilter;this.textures.set(url,t);return t;}
  canvasTex(c){const t=this.track(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;return t;}
  buildGlows(){
    const radial=stops=>{const [c,g]=canvas(64,64),r=g.createRadialGradient(32,32,0,32,32,32);for(const [o,col] of stops)r.addColorStop(o,col);g.fillStyle=r;g.fillRect(0,0,64,64);return this.canvasTex(c);};
    this.glowTex=radial([[0,'rgba(255,255,255,1)'],[.25,'rgba(255,255,255,.75)'],[.6,'rgba(255,255,255,.18)'],[1,'rgba(255,255,255,0)']]);
    this.softTex=radial([[0,'rgba(255,255,255,.9)'],[.5,'rgba(255,255,255,.45)'],[1,'rgba(255,255,255,0)']]);
    // Neon tube: bright narrow core with a soft spill to both sides (u across, v along).
    const [c,g]=canvas(64,16),h=g.createLinearGradient(0,0,64,0);
    h.addColorStop(0,'rgba(255,255,255,0)');h.addColorStop(.36,'rgba(255,255,255,.22)');h.addColorStop(.46,'rgba(255,255,255,1)');h.addColorStop(.54,'rgba(255,255,255,1)');h.addColorStop(.64,'rgba(255,255,255,.22)');h.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=h;g.fillRect(0,1,64,14);this.tubeTex=this.canvasTex(c);
  }
  additive(map,extra={}){return this.track(new THREE.MeshBasicMaterial({map,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false,...extra}));}
  instanced(geo,mat,count,order=3){const mesh=new THREE.InstancedMesh(geo,mat,count);mesh.frustumCulled=false;mesh.renderOrder=order;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);for(let i=0;i<count;i++)mesh.setColorAt(i,this.c.setRGB(0,0,0));return this.add(mesh);}
  // ---- builders ----------------------------------------------------------------------
  buildNeon(){
    // Light strips on top of both cappings: idle breathing wave, ball comet while rolling,
    // blue drain on a gutter ball, rainbow chase on a strike.
    const len=(STRIP_FROM-STRIP_TO)/SEGMENTS;this.segLen=len;
    this.neon=this.instanced(this.flatQuad,this.additive(this.tubeTex),SEGMENTS*2,3);
    for(let side=0;side<2;side++)for(let i=0;i<SEGMENTS;i++){const z=STRIP_FROM-(i+.5)*len;this.m.compose(this.v.set((side?1:-1)*CAP_X,CAP_Y,z),this.q.identity(),this.s.set(.34,1,len*.82));this.neon.setMatrixAt(side*SEGMENTS+i,this.m);}
    this.neon.instanceMatrix.needsUpdate=true;
    this.neonBase=[new THREE.Color('#8c5cff'),new THREE.Color('#ff4fa8')];this.gutterBlue=new THREE.Color(.1,.16,.5);this.white=new THREE.Color(1,1,1);
  }
  buildTrail(){
    this.trail=this.instanced(this.flatQuad,this.additive(this.softTex,{depthTest:true}),30,1);this.trail.count=0;
  }
  buildDeckLights(){
    // Light poured from the masking unit onto the deck: idle soft, flares on impact.
    const cone=this.tex(CEL+'spotlight-cone.webp');
    this.cones=this.instanced(this.quad,this.additive(cone,{depthTest:true}),3,4);
    this.conePos=[[-1.55,-10.35],[0,-10.1],[1.55,-10.35]];
    this.deckGlow=this.add(new THREE.Mesh(this.flatQuad,this.additive(this.glowTex,{depthTest:true,opacity:.0})));this.deckGlow.position.set(0,.02,-10.8);this.deckGlow.scale.set(5.6,1,4.2);this.deckGlow.renderOrder=1;
  }
  buildMarquee(){
    // Marquee bulbs on the bottom edge of this lane's masking unit (LED chase).
    const n=this.bulbCount=24;this.bulbs=this.instanced(this.quad,this.additive(this.glowTex,{depthTest:true}),n,4);
    for(let i=0;i<n;i++){const x=-3.3+i*(6.6/(n-1));this.m.compose(this.v.set(x,1.83,-9.2),this.q.identity(),this.s.set(.2,.2,.2));this.bulbs.setMatrixAt(i,this.m);}
    this.bulbs.instanceMatrix.needsUpdate=true;
  }
  buildDisplay(){
    // Lane display: after each roll this lane's masking panel briefly turns into a score
    // screen (STRIKE! / SPARE! / pins, bowler and total), then fades back to the art.
    const [c,g]=canvas(1024,240);this.displayCanvas=c;this.displayCtx=g;this.displayTex=this.canvasTex(c);
    this.displayMat=this.track(new THREE.MeshBasicMaterial({map:this.displayTex,transparent:true,opacity:0,depthWrite:false,toneMapped:false,fog:false}));
    this.display=this.add(new THREE.Mesh(this.track(new THREE.PlaneGeometry(MASK.w,MASK.w*240/1024)),this.displayMat));this.display.position.set(0,MASK.y,MASK.z);this.display.renderOrder=3;this.display.visible=false;
  }
  paintDisplay(d,shown=d.total){
    const g=this.displayCtx,W=1024,H=240,ru=window.PartyI18n?.language==='ru';d.painted=shown;
    g.clearRect(0,0,W,H);
    const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#3a1866');bg.addColorStop(.55,'#4a1a6e');bg.addColorStop(1,'#5a1a5c');g.fillStyle=bg;g.fillRect(0,0,W,H);
    // Same diagonal light bands as the sign art, so swapping sign <-> screen keeps the panel's energy.
    g.globalAlpha=.28;for(let i=-3;i<9;i++){const x=i*150;g.fillStyle=i%2?'#ff4fa8':'#8c5cff';g.beginPath();g.moveTo(x,H);g.lineTo(x+70,H);g.lineTo(x+200,0);g.lineTo(x+130,0);g.closePath();g.fill();}g.globalAlpha=1;
    // Dot-matrix screen texture.
    g.fillStyle='rgba(255,255,255,.035)';for(let y=10;y<H;y+=8)for(let x=10;x<W;x+=8)g.fillRect(x,y,3,3);
    const palette={strike:['#fff6b8','#ffd04a','#ff7a3d','rgba(255,79,168,.9)'],spare:['#f2ffd6','#c8ff73','#5fe3c8','rgba(140,92,255,.9)'],gutter:['#e3ecff','#9fb6ff','#5f78ff','rgba(80,120,255,.8)'],pins:['#ffffff','#f1e6ff','#c9a8ff','rgba(140,92,255,.8)']}[d.kind];
    g.lineWidth=5;g.strokeStyle=palette[2];g.strokeRect(6,6,W-12,H-12);
    const bs=this.host.bannerState,tier=bs&&bs.kind==='strike'&&bs.born===d.born?bs.tier||1:1,word=d.kind==='strike'?(this.host.bannerWord?.('strike',tier)||(ru?'СТРАЙК!':'STRIKE!')):d.kind==='spare'?(ru?'СПЭР!':'SPARE!'):d.kind==='gutter'?(d.gutter?(ru?'ЖЁЛОБ':'GUTTER'):(ru?'МИМО':'MISS')):ru?`${d.pins} ${d.pins===1?'КЕГЛЯ':d.pins<5?'КЕГЛИ':'КЕГЛЕЙ'}`:`${d.pins} ${d.pins===1?'PIN':'PINS'}`;
    g.textAlign='center';g.textBaseline='middle';g.font='italic 900 120px KardiaFatRunner, "Arial Black", sans-serif';
    let size=120;while(g.measureText(word).width>W*.62&&size>60){size-=6;g.font=`italic 900 ${size}px KardiaFatRunner, "Arial Black", sans-serif`;}
    const fill=g.createLinearGradient(0,40,0,170);fill.addColorStop(0,palette[0]);fill.addColorStop(.55,palette[1]);fill.addColorStop(1,palette[2]);
    g.lineJoin='round';g.lineWidth=16;g.strokeStyle='#1a0e2b';g.strokeText(word,W/2,100);g.shadowColor=palette[3];g.shadowBlur=26;g.fillStyle=fill;g.fillText(word,W/2,100);g.shadowBlur=0;
    // Bowler and running total, clipped so a long name never reaches the frame.
    g.font='800 38px "Nunito", "Arial Rounded MT Bold", sans-serif';let name=String(d.name||'');const total=ru?`  ·  ${shown} очк.`:`  ·  ${shown} pts`;
    while(name.length>1&&g.measureText(name+'…'+total).width>W*.8)name=name.slice(0,-1);if(name!==String(d.name||''))name+='…';
    g.fillStyle='rgba(255,255,255,.9)';g.fillText(name+total,W/2,192);
    // Points just earned, while the total counts up.
    const gain=d.total-d.from;if(gain>0&&shown<d.total){g.font='italic 900 54px KardiaFatRunner, "Arial Black", sans-serif';g.textAlign='right';g.lineWidth=10;g.strokeStyle='#1a0e2b';g.strokeText('+'+gain,W-34,62);g.fillStyle=palette[1];g.fillText('+'+gain,W-34,62);g.textAlign='center';}
    this.displayTex.needsUpdate=true;
  }
  buildDisco(){
    // Disco-ball reflections drifting over the neighbouring lanes (never on lane 8).
    const n=this.discoCount=34,rand=seeded(11),cols=['#ff7ad0','#a98bff','#7fe8ff','#ffe28a','#ffffff'];
    this.disco=this.instanced(this.flatQuad,this.additive(this.glowTex,{depthTest:true}),n,1);this.discoSpots=[];
    for(let i=0;i<n;i++){const lane=NEIGHBOUR_X[i%NEIGHBOUR_X.length];this.discoSpots.push({x:lane+(rand()-.5)*3,z:-7+rand()*22,r:.5+rand()*1.1,w:(rand()<.5?-1:1)*(.25+rand()*.3),p:rand()*6.3,size:.16+rand()*.16,color:new THREE.Color(cols[i%cols.length]),lane});}
  }
  buildBeams(){
    // Two slow haze beams over the side lanes (static under reduced motion).
    const [c,g]=canvas(128,256),grad=g.createLinearGradient(0,0,0,256);grad.addColorStop(0,'rgba(255,255,255,.9)');grad.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=grad;g.beginPath();g.moveTo(54,0);g.lineTo(74,0);g.lineTo(128,256);g.lineTo(0,256);g.closePath();g.fill();
    const across=g.createLinearGradient(0,0,128,0);across.addColorStop(0,'rgba(0,0,0,1)');across.addColorStop(.5,'rgba(0,0,0,0)');across.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=across;g.globalAlpha=.75;g.fillRect(0,0,128,256);
    const tex=this.canvasTex(c),geo=this.track(new THREE.PlaneGeometry(3.4,8).translate(0,-4,0));
    this.beams=[['#9a6bff',-6.2,-1],['#ff5fb4',6.2,1]].map(([color,x,dir])=>{const m=this.add(new THREE.Mesh(geo,this.additive(tex,{color,opacity:.12,depthTest:true,side:THREE.DoubleSide})));m.position.set(x,7.6,-3);m.renderOrder=2;m.userData.dir=dir;return m;});
  }
  buildReturn(){
    // Glowing ring around the ball-return hood mouth; pulses when a ball comes out.
    this.hoodRing=this.add(new THREE.Mesh(this.track(new THREE.RingGeometry(.37,.45,40)),this.additive(null,{color:'#b78cff',opacity:.55,depthTest:true})));
    this.hoodRing.position.set(HOOD.x,HOOD.y-.02,HOOD.z-.02);this.hoodRing.renderOrder=3;
  }
  buildPools(){
    this.sparkle=new Pool(this,this.tex(CEL+'sparkle-4.webp'),56);
    this.burst=new Pool(this,this.tex(CMB+'spark-burst.webp'),6);
    this.shock=new Pool(this,this.tex(CMB+'shockwave-ring.webp'),6);
    this.glow=new Pool(this,this.glowTex,14,{renderOrder:6,depthTest:true}); // depth-tested: glows sit behind the pins, never over them
    this.fireworks=['gold','violet','lime'].map(n=>new Pool(this,this.tex(CEL+`firework-burst-${n}.webp`),6,{renderOrder:8}));
    this.pools=[this.glow,this.sparkle,this.burst,this.shock,...this.fireworks];
  }
  // ---- events ------------------------------------------------------------------------
  event(e,s){
    this.seen||=new Set();if(e.kind!=='roll'||this.seen.has(e.id))return;this.seen.add(e.id);if(this.seen.size>64)this.seen.delete(this.seen.values().next().value);if(s.t-e.at>1.0)return;
    const p=s.players.find(x=>x.id===e.player),rolls=p?.frames?.at(-1)?.rolls||[],last=p?.frames?.length===s.frameCount,prev=rolls.slice(0,-1);
    const fresh=freshBefore(prev,last),kind=e.pins===10&&fresh?'strike':!fresh&&prev.length&&prev.at(-1)+e.pins===10?'spare':e.pins===0?'gutter':'pins';
    const total=p?.score??0;this.scores||=new Map();const from=Math.min(total,this.scores.get(e.player)??Math.max(0,total-e.pins));this.scores.set(e.player,total);
    const d={token:s.turnToken,kind,pins:e.pins,gutter:this.state.gutterToken===s.turnToken||!!s.physics?.gutter,name:p?.name||'',total,from,born:e.at};
    this.state.display=d;try{this.paintDisplay(d,this.reduced?total:from);}catch{}
    // Whether the next turn gets a fresh rack (frame over, or a tenth-frame strike/spare),
    // mirroring match.js recordRoll/nextBowler; otherwise standing pins are lifted and respotted.
    this.state.rackPlan={token:s.turnToken,fresh:frameComplete(rolls,last)||freshRack(rolls,last)};
  }
  // ---- per frame ---------------------------------------------------------------------
  update(A,stage,age,t,dt){
    const st=this.state,host=this.host,camQ=this.camera.quaternion;this.lastA=A;this.dt=Math.min(.1,Math.max(0,dt||0));
    // Light director: every light/glow that depends on the stage eases toward its target, so
    // nothing pops on a stage change (reveal start, slow-motion angle, new turn).
    const ease=(cur,target,up,down)=>cur+(target-cur)*Math.min(1,this.dt*(target>cur?up:down));
    const cel=st.celebrate,ca=cel?t-cel.born:9,slow=host.slowCam&&performance.now()<host.slowCam.until+300;
    this.lw||={cone:1,comet:0,party:0,rate:4,phase:0,cometZ:12.8};const lw=this.lw;
    lw.cone=ease(lw.cone,stage==='reveal'||slow?0:1,2.5,4);
    lw.comet=ease(lw.comet,stage==='rolling'&&host.ball.visible&&!A.gutter?1:0,8,2.2);if(stage==='rolling'&&host.ball.visible)lw.cometZ=host.ball.position.z;
    lw.party=ease(lw.party,ca>=0&&ca<1.9?1:0,6,1.4);
    lw.rate=ease(lw.rate,stage==='rolling'?14:4,3,1.5);lw.phase+=this.dt*lw.rate;
    if(A.token!==st.token){st.token=A.token;st.trail.length=0;}
    if(stage==='rolling'&&A.gutter&&st.gutterToken!==A.token){st.gutterToken=A.token;st.gutterAt=t;}
    // Impact and celebration beats come from the scene's own detection (same clock).
    if(host.impact&&host.impact!==st.impact){st.impact=host.impact;this.onImpact(host.impact);}
    if(host.bannerState&&host.bannerState!==st.banner){st.banner=host.bannerState;if(host.bannerState.kind!=='gutter')this.onCelebrate(host.bannerState.kind,host.bannerState.born,host.bannerState.tier||1);}
    if(stage==='aim'&&!A.first&&age>.42+this.returnDelay(A)&&st.returnPop!==A.token){st.returnPop=A.token;this.onReturn(t);}
    this.lastStage=stage;this.updateNeon(A,stage,t);this.updateTrail(A,stage,t);this.updateDeck(t);this.updateMarquee(stage,t);this.updateDisplay(stage,t);this.updateDisco(t);this.updateBeams(t);this.updateReturn(stage,age,t);
    this.updatePinsetter(A,stage,age,t);this.updateResetCamera(A,stage,age,dt);this.updatePit(t);
    for(const pool of this.pools)pool.update(t,camQ);
    this.debug={stage,age,token:A.token,ghosts:this.ghosts.count,table:+this.table.position.y.toFixed(2),cam:+this.camW.toFixed(2)};
  }
  // While the pin-deck camera shows the machine, the ball return waits: the ball comes out
  // of the hood once the aim view is back, so it is never moving off-screen.
  returnDelay(A){return !this.reduced&&A&&!A.first&&!this.state.noResetCam?3.3:0;}
  onImpact(im){
    const t=im.born,power=im.power||.6,rand=seeded((t*1311)|0);this.state.flare=t;
    // Billboards are sized for the long aim view; the close slow-motion and follow cameras
    // shrink and dim them so the hit never turns into a white blow-out over the pins.
    const d=this.camera.position.distanceTo(this.v.set(im.x,.6,im.z)),k=clamp((d-3)/16,.3,1),dim=.2+.8*k*k; // close-up: much dimmer, never a white-out
    this.glow.spawn({born:t,life:.45,x:im.x,y:.6,z:im.z-.35,s0:.8*k,s1:(1.8*power+.5)*k,r:.26*dim,gg:.2*dim,b:.14*dim,peak:.08});
    // The slow-motion close-up carries the hit with streak sparks and pin motion only: no
    // burst/glow billboards there (they washed the contact out at that range).
    const close=this.host.slowCam&&performance.now()<this.host.slowCam.until;if(close)this.glow.items.forEach(p=>{if(p.born===t)p.born=-1;});
    if(this.reduced||close)return;
    this.burst.spawn({born:t,life:.28,x:im.x,y:.6,z:im.z+.35,s0:.5*k,s1:(1.5*power+.35)*k,rot:rand()*6,r:.62*dim,gg:.56*dim,b:.42*dim,peak:.1});
    this.shock.spawn({born:t+.02,life:.45,x:im.x,y:.55,z:im.z+.3,s0:.5*k*k,s1:(2.8*power+.6)*k*k,r:.7*dim,gg:.5*dim,b:.68*dim,peak:.15});
    for(let i=0;i<Math.round(6+power*6);i++){const a=rand()*Math.PI*2,sp=1.2+rand()*2.4;this.c.setHSL(.08+rand()*.9,.9,.75);
      this.sparkle.spawn({born:t+rand()*.06,life:.5+rand()*.35,x:im.x,y:.45+rand()*.5,z:im.z,vx:Math.cos(a)*sp,vy:1.4+rand()*2.2,vz:Math.sin(a)*sp*.5,g:5.5,drag:1.2,s0:.32*k,s1:.12*k,rot:rand()*6,spin:(rand()-.5)*8,r:this.c.r,gg:this.c.g,b:this.c.b,peak:.1});}
  }
  onCelebrate(kind,t,tier=1){
    const strike=kind==='strike';this.state.celebrate={kind,born:t,tier};
    const rand=seeded((t*733)|0);
    this.glow.spawn({born:t,life:1.2,x:0,y:1.1,z:-12.2,s0:1.5,s1:4,r:strike?.4:.25,gg:strike?.3:.4,b:strike?.18:.3,peak:.15});
    if(this.reduced)return;
    // Fireworks scale with importance: spare 3, strike 5, double 7, turkey and beyond 9.
    const spots=strike?[[-1.9,1.35,-12.9],[1.9,1.4,-13.1],[0,1.55,-14.2],[-2.4,.9,-14.0],[2.4,.95,-14.1],[-1.1,1.75,-13.6],[1.2,1.8,-13.5],[-2.7,1.6,-13.0],[2.7,1.65,-13.1]].slice(0,Math.min(9,3+2*tier)):[[-1.7,1.3,-13],[1.7,1.35,-13.2],[0,1.5,-14.2]];
    spots.forEach(([x,y,z],i)=>{const pool=strike?this.fireworks[i%3]:this.fireworks[i%2?2:1],at=t+.12+i*.2;
      pool.spawn({born:at,life:.9,x,y,z,s0:.3,s1:1.25+rand()*.35,rot:(rand()-.5)*.6,r:.85,gg:.85,b:.85,peak:.12});
      for(let k=0;k<6;k++){const a=rand()*Math.PI*2,sp=.7+rand()*1.1;this.c.setHSL(rand(),.85,.78);this.sparkle.spawn({born:at+.05,life:.8+rand()*.4,x,y,z,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp+.3,vz:.2,g:1.2,drag:1.4,s0:.28,s1:.1,spin:(rand()-.5)*6,r:this.c.r,gg:this.c.g,b:this.c.b,peak:.08});}});
  }
  onReturn(t){
    this.glow.spawn({born:t,life:.6,x:HOOD.x,y:HOOD.y,z:HOOD.z+.15,s0:.6,s1:1.6,r:.75,gg:.55,b:1,peak:.12});
    if(this.reduced)return;const rand=seeded((t*97)|0);
    for(let i=0;i<6;i++){const a=rand()*Math.PI*2;this.sparkle.spawn({born:t+rand()*.08,life:.55,x:HOOD.x,y:HOOD.y,z:HOOD.z+.1,vx:Math.cos(a)*.9,vy:Math.sin(a)*.9+.4,vz:.6,g:1.5,drag:1.5,s0:.2,s1:.06,r:.9,gg:.8,b:1,peak:.1});}
  }
  updateNeon(A,stage,t){
    const st=this.state,cel=st.celebrate,ca=cel?t-cel.born:9,lw=this.lw,cw=lw.comet,bz=lw.cometZ;
    const gutter=st.gutterToken===A.token&&(stage==='rolling'||stage==='reveal'),ga=gutter?t-st.gutterAt:9,ballColor=this.c2.set(A.color||'#b493ff');
    // Gutter drain eases in over 1.1 s and recovers over ~1 s on the next turn (no snap back).
    lw.drain=gutter?smooth(ga/1.1):Math.max(0,(lw.drain||0)-this.dt*1.1);
    const motion=this.reduced?0:1,c=this.c;
    for(let side=0;side<2;side++)for(let i=0;i<SEGMENTS;i++){
      const z=STRIP_FROM-(i+.5)*this.segLen,base=this.neonBase[side];
      let k=.34+(motion?.26*Math.pow(Math.max(0,Math.sin(z*.55+t*2.2+side)),6):0);c.copy(base).multiplyScalar(k);
      if(cw>.003){const d=z-bz;
        if(d>=-.4&&d<7){const w=cw*Math.exp(-Math.max(0,d)*.55)*(d<0?1+d*2.5:1);c.lerp(ballColor,.6);c.r+=ballColor.r*1.6*w;c.g+=ballColor.g*1.6*w;c.b+=ballColor.b*1.6*w;c.addScalar(.35*w);}
        else if(d<0&&motion){const p=cw*Math.pow(Math.max(0,Math.sin((z+t*16)*.7)),10)*.9;c.r+=p*.9;c.g+=p*.75;c.b+=p;}}
      if(lw.drain>0){const u=lw.drain;c.lerp(this.gutterBlue,u).multiplyScalar(1-.55*u);}
      if(ca>=0&&ca<2.6){const fade=Math.min(smooth(ca/.3),1-smooth((ca-1.8)/.8));
        if(cel.kind==='strike'){const hue=motion?((z*.045+t*1.4+side*.5)%1+1)%1:.12,flash=motion?.7+.5*Math.pow(Math.max(0,Math.sin(t*14-z*.9)),3):1;c.lerp(this.c2.setHSL(hue,.95,.6).multiplyScalar(flash*1.6),fade);}
        else{const flash=motion?.7+.6*Math.pow(Math.max(0,Math.sin(t*10-z*.8)),4):1;c.lerp(this.c2.set(side?'#5fe3c8':'#c8ff73').multiplyScalar(flash*1.3),fade);}
        this.c2.set(A.color||'#b493ff');}
      this.neon.setColorAt(side*SEGMENTS+i,c);
    }
    this.neon.instanceColor.needsUpdate=true;
  }
  updateTrail(A,stage,t){
    const st=this.state,ball=this.host.ball,on=stage==='rolling'&&ball.visible&&ball.position.y>-.05;
    if(on){const p=ball.position,last=st.trail[0];if(!last||Math.hypot(p.x-last.x,p.z-last.z)>.2){st.trail.unshift({x:p.x,y:Math.max(.012,p.y-.33+.012),z:p.z});if(st.trail.length>30)st.trail.pop();}
      if(!this.reduced&&t-st.sparkleAt>.09&&!A.gutter&&p.z>-9){st.sparkleAt=t;const r=Math.random;this.c.set(A.color||'#b493ff').lerp(this.white,.45);
        this.sparkle.spawn({born:t,life:.55,x:p.x+(r()-.5)*.5,y:p.y+(r()-.2)*.35,z:p.z+.25,vy:.5,g:.4,s0:.26,s1:.08,spin:(r()-.5)*5,r:this.c.r,gg:this.c.g,b:this.c.b,peak:.15});}}
    else if(stage!=='reveal')st.trail.length=0;
    const n=st.trail.length,fadeOut=stage==='reveal'?.5:1,col=this.c2.set(A.color||'#b493ff').lerp(this.white,.15);if(A.gutter)col.lerp(this.c.setRGB(.25,.35,.9),.7);
    for(let i=0;i<n;i++){const p=st.trail[i],u=i/30,size=.75*(1-u*.6),k=.1*Math.pow(1-u,1.8)*fadeOut;/* quads overlap ~5x: a soft tint, not a white smear */this.m.compose(this.v.set(p.x,p.y,p.z),this.q.identity(),this.s.set(size,1,size*1.5));this.trail.setMatrixAt(i,this.m);this.trail.setColorAt(i,this.c.setRGB(col.r*k,col.g*k,col.b*k));}
    this.trail.count=n;if(n){this.trail.instanceMatrix.needsUpdate=true;this.trail.instanceColor.needsUpdate=true;}
  }
  updateDeck(t){
    const fa=t-this.state.flare,flare=fa>=0&&fa<1.2?Math.pow(1-fa/1.2,2):0,cel=this.state.celebrate,ca=cel?t-cel.born:9,party=ca>=0&&ca<2.4?1-smooth((ca-1.6)/.8):0;
    const camQ=this.camera.quaternion,c=this.c;
    for(let i=0;i<3;i++){const [x,z]=this.conePos[i],h=1.75;
      this.m.compose(this.v.set(x,h/2+.02,z),camQ,this.s.set(1.5,h,1));this.cones.setMatrixAt(i,this.m);
      let k=.065+.05*flare;c.setRGB(1,.9,.75).multiplyScalar(k);
      if(party>0){const hue=this.reduced?.9:((t*.9+i*.33)%1);c.lerp(this.c2.setHSL(hue,.9,.6).multiplyScalar(.32),party);}
      // Billboard cones read only from the long aim/roll view; the close reveal and
      // reset cameras would turn their floor ellipses into blotches.
      c.multiplyScalar((1-this.camW)*this.lw.cone);
      this.cones.setColorAt(i,c);}
    this.cones.instanceMatrix.needsUpdate=true;this.cones.instanceColor.needsUpdate=true;
    this.deckGlow.material.opacity=(.03+.07*flare+.08*party)*(1-.7*this.camW);this.deckGlow.material.color.setRGB(1,.85-.2*party,.7+.2*party);
  }
  updateMarquee(stage,t){
    const n=this.bulbCount,c=this.c,party=this.reduced?0:this.lw.party;
    for(let i=0;i<n;i++){
      let k;if(this.reduced)k=.55;else k=.25+.75*Math.pow(Math.max(0,Math.sin(i*.9-this.lw.phase)),4);
      c.setRGB(1,.82,.55).multiplyScalar(k*.9);if(party>0)c.lerp(this.c2.setHSL(((i/n+t*.8)%1),.9,.62).multiplyScalar(.6+.8*k),party);
      this.bulbs.setColorAt(i,c);}
    this.bulbs.instanceColor.needsUpdate=true;
  }
  updateDisplay(stage,t){
    // Shown once the camera is back on the aim view (the reveal has its own banner).
    const d=this.state.display;if(d&&d.shownAt===undefined&&stage==='aim'&&d.token!==this.state.token&&this.camW<.25)d.shownAt=t;
    const age=d&&d.shownAt!==undefined?t-d.shownAt:d?-1:99,LIFE=4.2;
    if(!d||age<0||age>LIFE||t-d.born>14){this.display.visible=false;if(age>LIFE||d&&t-d.born>14)this.state.display=null;return;}
    // The next throw takes the screen back at once (fast fade when the ball is released).
    if(stage!=='aim'&&d.hideAt===undefined)d.hideAt=t;const gone=d.hideAt!==undefined?smooth((t-d.hideAt)/.45):0;
    const fade=Math.min(smooth(age/.45),1-smooth((age-(LIFE-.8))/.8),1-gone);this.display.visible=fade>.01;this.displayMat.opacity=fade;
    // Score pop: the total counts up from the previous score, then the panel kicks once.
    const COUNT=.85;if(d.from!==undefined&&d.from!==d.total){const shown=age>=COUNT||this.reduced?d.total:Math.round(d.from+(d.total-d.from)*(1-Math.pow(1-clamp(age/COUNT,0,1),3)));if(shown!==d.painted)try{this.paintDisplay(d,shown);}catch{}}
    const kick=age>COUNT&&age<COUNT+.3?Math.sin(Math.PI*(age-COUNT)/.3)*.05:0;
    const pop=this.reduced?1:1+.06*Math.max(0,1-age/.35)*Math.sin(age*30)+kick;this.display.scale.set(pop,pop,1);
  }
  updateDisco(t){
    const motion=this.reduced?0:1,c=this.c;let n=0;
    for(const s of this.discoSpots){const a=s.p+s.w*t*motion,x=s.x+Math.cos(a)*s.r,z=s.z+Math.sin(a)*s.r*1.6;
      if(Math.abs(x-s.lane)>2.05)continue;const tw=.55+.45*Math.sin(t*1.7*motion+s.p*3);
      this.m.compose(this.v.set(x,.014,z),this.q.identity(),this.s.set(s.size,1,s.size*1.25));this.disco.setMatrixAt(n,this.m);this.disco.setColorAt(n++,c.copy(s.color).multiplyScalar(.42*tw));}
    this.disco.count=n;this.disco.instanceMatrix.needsUpdate=true;this.disco.instanceColor.needsUpdate=true;
  }
  updateBeams(t){
    const cel=this.state.celebrate,ca=cel?t-cel.born:9,party=ca>=0&&ca<2.4?1-smooth((ca-1.6)/.8):0;
    for(const b of this.beams){const dir=b.userData.dir;b.rotation.set(-.18,dir*-.25,this.reduced?dir*.22:dir*(.22+.16*Math.sin(t*.35+dir)));b.material.opacity=.075+.12*party;}
  }
  updateReturn(stage,age,t){
    const a=age-(this.lastA?this.returnDelay(this.lastA):0),out=stage==='aim'&&a>.3&&a<1.1?Math.sin(Math.PI*clamp((a-.3)/.8,0,1)):0;
    this.hoodRing.material.opacity=.32+(this.reduced?0:.1*Math.sin(t*2.2))+.6*out;
  }
  // ---- pit, sweep deadwood, pinsetter, reset camera ---------------------------------
  buildPit(){
    // The pit reads as a black opening: a lit lip at the lane end, a dark well and a
    // softly lit curtain behind it (the scene's own pit and cushion stay underneath).
    const lip=this.add(new THREE.Mesh(this.track(new THREE.BoxGeometry(4.5,.05,.06)),this.additive(null,{color:'#c9a2ff',opacity:.9,depthTest:true})));lip.position.set(0,.015,LANE_END+.02);lip.renderOrder=2;this.pitLip=lip;
    // Pit floor at the depth of the server's pit (top y -.8): a dark rubber conveyor mat lit by
    // the scene's pit light, so a pin or ball that drops in stays visible for a beat.
    const [mc,mg]=canvas(64,256);mg.fillStyle='#17111f';mg.fillRect(0,0,64,256);for(let y=0;y<256;y+=16){mg.fillStyle='#0a070e';mg.fillRect(0,y,64,6);mg.fillStyle='rgba(255,255,255,.05)';mg.fillRect(0,y+6,64,1);}
    const matTex=this.canvasTex(mc);
    const well=this.add(new THREE.Mesh(this.track(new THREE.PlaneGeometry(6.4,1.3).rotateX(-Math.PI/2)),this.track(new THREE.MeshStandardMaterial({map:matTex,roughness:.85,metalness:0}))));well.position.set(0,-.79,-16.05);well.receiveShadow=true;
    const [c,g]=canvas(256,128),grad=g.createLinearGradient(0,0,0,128);grad.addColorStop(0,'rgba(140,92,255,.0)');grad.addColorStop(.45,'rgba(140,92,255,.35)');grad.addColorStop(.75,'rgba(255,79,168,.22)');grad.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=grad;g.fillRect(0,0,256,128);
    g.globalCompositeOperation='destination-out';for(let x=0;x<256;x+=16){const f=g.createLinearGradient(x,0,x+16,0);f.addColorStop(0,'rgba(0,0,0,.55)');f.addColorStop(.5,'rgba(0,0,0,0)');f.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=f;g.fillRect(x,0,16,128);}
    const curtain=this.add(new THREE.Mesh(this.track(new THREE.PlaneGeometry(6.4,2.2)),this.additive(this.canvasTex(c),{depthTest:true,opacity:.8})));curtain.position.set(0,.55,-16.58);curtain.renderOrder=2;this.pitCurtain=curtain;
  }
  updatePit(t){this.pitLip.material.opacity=.55+(this.reduced?0:.2*Math.sin(t*2.4));}
  buildPinsetter(){
    // Pinsetter table that comes down out of the masking unit, with ten glowing pin cups,
    // two lift rods and an accent edge; parked inside the housing when idle.
    const g=this.table=new THREE.Group(),M=k=>this.track(new THREE.MeshStandardMaterial(k));
    const body=M({color:'#2a2240',roughness:.38,metalness:.55}),edge=M({color:'#000000',emissive:'#ff4fa8',emissiveIntensity:1.4}),rod=M({color:'#d6d3e6',roughness:.22,metalness:1});
    // Rounded, bevelled deck plate with a neon underglow ring and four hydraulic lift rods.
    const rr=(w,h,r,p=new THREE.Shape())=>{const x=-w/2,y=-h/2;p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);return p;};
    const plate=new THREE.Mesh(this.track(new THREE.ExtrudeGeometry(rr(4.5,2.55,.3),{depth:.1,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,curveSegments:6}).rotateX(Math.PI/2).translate(0,.125,0)),body);plate.castShadow=true;g.add(plate);
    const ringShape=rr(4.58,2.63,.33);ringShape.holes.push(rr(4.38,2.43,.26,new THREE.Path()));
    const glowRing=new THREE.Mesh(this.track(new THREE.ShapeGeometry(ringShape,6).rotateX(Math.PI/2)),edge);glowRing.position.y=-.004;g.add(glowRing);
    const sleeve=M({color:'#3a3450',roughness:.3,metalness:.85});
    for(const x of [-1.95,1.95])for(const z of [-.95,.95]){const r=new THREE.Mesh(this.track(new THREE.CylinderGeometry(.032,.032,.7,10)),rod);r.position.set(x,.48,z);g.add(r);const sl=new THREE.Mesh(this.track(new THREE.CylinderGeometry(.06,.06,.28,14)),sleeve);sl.position.set(x,.26,z);g.add(sl);}
    this.cupMat=this.additive(this.glowTex,{depthTest:true,color:'#ffd9a8',opacity:.0});
    const cupGeo=this.track(new THREE.PlaneGeometry(.42,.42).rotateX(Math.PI/2));
    for(const p of RACK){const cup=new THREE.Mesh(cupGeo,this.cupMat);cup.position.set(p.x,-.005,p.z-TABLE_Z);g.add(cup);}
    // Machine detail: chrome spotting cups under the table and two side frame beams.
    const cupRings=new THREE.InstancedMesh(this.track(new THREE.TorusGeometry(.17,.022,8,24).rotateX(Math.PI/2)),rod,RACK.length);
    RACK.forEach((p,i)=>{this.m.makeTranslation(p.x,-.02,p.z-TABLE_Z);cupRings.setMatrixAt(i,this.m);});cupRings.instanceMatrix.needsUpdate=true;g.add(cupRings);this.track(cupRings);
    for(const x of [-2.2,2.2]){const beam=new THREE.Mesh(this.track(new THREE.BoxGeometry(.1,.26,2.7)),body);beam.position.set(x,.2,0);g.add(beam);}
    g.traverse(o=>{if(o.isMesh&&o.material!==this.cupMat)o.renderOrder=3;});g.position.set(0,TABLE_REST,TABLE_Z);g.visible=false;this.add(g);
    // Deadwood: last reveal poses of knocked pins, pushed into the pit by the sweep bar.
    this.ghosts=new THREE.InstancedMesh(this.host.pinGeometry,this.host.mat.pin,10);this.ghosts.castShadow=true;this.ghosts.frustumCulled=false;this.ghosts.count=0;this.add(this.ghosts);this.track(this.ghosts);
    this.revealPose=Array.from({length:10},()=>({seen:false,p:new THREE.Vector3(),q:new THREE.Quaternion(),standing:false}));this.dead=[];this.camW=0;this.camP=new THREE.Vector3();this.camL=new THREE.Vector3();
  }
  buildSweepSkin(){
    // The sweep bar's face gets a machined panel: gunmetal with brushed lines, violet
    // chevrons pointing to the pit, rivets and a chrome top rail.
    const bar=this.host.sweep?.children?.[0];if(!bar?.isMesh)return;
    const [c,g]=canvas(512,80),bg=g.createLinearGradient(0,0,0,80);bg.addColorStop(0,'#3a3350');bg.addColorStop(.5,'#221d33');bg.addColorStop(1,'#151122');g.fillStyle=bg;g.fillRect(0,0,512,80);
    for(let y=2;y<80;y+=3){g.fillStyle=`rgba(255,255,255,${.015+((y*37)%7)/260})`;g.fillRect(0,y,512,1);}
    g.fillStyle='#8c5cff';for(let i=0;i<9;i++){const x=56+i*50;g.globalAlpha=.55+.45*Math.sin(i*.7)**2;g.beginPath();g.moveTo(x,24);g.lineTo(x+14,40);g.lineTo(x,56);g.lineTo(x+8,56);g.lineTo(x+22,40);g.lineTo(x+8,24);g.closePath();g.fill();}
    g.globalAlpha=1;g.fillStyle='rgba(255,255,255,.55)';for(const x of [14,498])for(const y of [16,64]){g.beginPath();g.arc(x,y,3.2,0,7);g.fill();}
    g.fillStyle='rgba(255,79,168,.8)';g.fillRect(0,76,512,4);
    const panel=this.track(new THREE.MeshStandardMaterial({map:this.canvasTex(c),roughness:.42,metalness:.55}));
    bar.material=[bar.material,bar.material,bar.material,bar.material,panel,bar.material];
    const rail=new THREE.Mesh(this.track(new THREE.CylinderGeometry(.03,.03,4.7,10).rotateZ(Math.PI/2)),this.track(new THREE.MeshStandardMaterial({color:'#d6d3e6',roughness:.22,metalness:1})));rail.position.set(0,.37,.03);rail.renderOrder=3;this.host.sweep.add(rail);this.sweepRail=rail;
  }
  standingPin(m){const e=m.matrixWorld.elements,t=m.position;return e[5]>.8&&t.y>-.1&&t.y<.06&&Math.abs(t.x)<2.3&&t.z>LANE_END-.1;}
  updatePinsetter(A,stage,age,t){
    const st=this.state,host=this.host,plan=st.rackPlan&&st.rackPlan.token===A.token?st.rackPlan:null;
    let tableY=TABLE_REST,cups=0;
    if(stage==='reveal'){
      // Remember every pin pose of this turn's final picture (deadwood for the sweep).
      host.pins.forEach((m,i)=>{const r=this.revealPose[i];r.seen=m.visible;if(!m.visible)return;m.updateMatrixWorld();r.p.copy(m.position);r.q.copy(m.quaternion);r.standing=this.standingPin(m);});
      st.revealToken=A.token;st.revealFresh=plan?plan.fresh:true;
      // Second ball: the table comes down onto the standing pins and lifts them clear
      // while the sweep bar guards the deck.
      if(!st.revealFresh&&age>1.0){
        const down=smooth((age-1.0)/.3),lift=age>1.3?LIFT*smooth((age-1.3)/.3):0;tableY=TABLE_REST+(PIN_TOP-TABLE_REST)*down+lift;cups=down;
        if(lift>0)host.pins.forEach((m,i)=>{if(m.visible&&this.revealPose[i].standing){m.position.y+=lift;m.position.x+=(RACK[i].x-m.position.x)*smooth((age-1.3)/.3);m.position.z+=(RACK[i].z-m.position.z)*smooth((age-1.3)/.3);}});
      }
    }
    if(stage==='aim'&&st.revealToken&&st.deadFor!==A.token){
      // New turn: everything that is not respotted is deadwood for the sweep.
      st.deadFor=A.token;this.dead.length=0;
      if(!A.first)this.revealPose.forEach((r,i)=>{if(!r.seen||r.p.y<-.3||r.p.z<LANE_END-.1)return;if(!st.revealFresh&&r.standing)return;this.dead.push({p:r.p.clone(),q:r.q.clone(),spin:(i%2?1:-1)*(.6+i*.07)});});
      st.aimFresh=st.revealFresh;
    }
    if(stage==='aim'&&!A.first){
      // The scene and table share one lift curve. Fresh pins stay inside the
      // housing during the sweep; survivors keep their lifted pose across the token.
      const lower=this.rackLift(A,stage,age);
      if(age<1.65)tableY=PIN_TOP+lower;else tableY=PIN_TOP+(TABLE_REST-PIN_TOP)*smooth((age-1.7)/.5);
      cups=age<1.65?1:1-smooth((age-1.65)/.3);
      this.liftedMirrors=true;
    }
    if(this.liftedMirrors||stage==='reveal'){host.updateBlobs();host.updateMirrors();host.pins.forEach((m,i)=>{if(m.position.y>.08)host.mirrorPins[i].visible=false;});this.liftedMirrors=false;}
    this.table.position.y=tableY;this.table.visible=tableY<TABLE_REST-.02;this.cupMat.opacity=.85*cups;
    // Deadwood ghosts follow the real sweep bar into the pit and drop out of sight.
    let n=0;
    if(stage==='aim'&&this.dead.length&&age<1.3){
      const barZ=host.sweep.visible?host.sweep.position.z-.3:-15.15;
      // At the end of its stroke the bar rakes everything over the deck edge.
      const rake=smooth((age-.65)/.4)*1.6;
      for(const d of this.dead){d.z=Math.min(d.z??d.p.z,barZ,age>.65?LANE_END+.25-rake:99);const z=d.z,push=d.p.z-z,over=LANE_END-z,y=over>0?Math.max(-1.6,d.p.y-over*2.2-over*over*3):d.p.y;/* lands on the pit mat */
        this.qz.setFromAxisAngle(this.zAxis,d.spin*push*.35);this.q.copy(this.qz).multiply(d.q);
        this.m.compose(this.v.set(clamp(d.p.x,-2.6,2.6),y,z),this.q,this.s.set(1,1,1));this.ghosts.setMatrixAt(n++,this.m);}
    }
    this.ghosts.count=n;if(n)this.ghosts.instanceMatrix.needsUpdate=true;
  }
  rackLift(A,stage,age){
    if(stage!=='aim')return 0;
    if(A.first)return age<1.05?LIFT*(1-easeOut((age-.42)/.6)):0;
    const fresh=this.state.revealFresh,height=fresh?2.35:LIFT;
    return height*(1-smooth((age-.82)/.83));
  }
  updateResetCamera(A,stage,age,dt){
    // Read-only progress for the display/idle effects. Camera transforms belong
    // solely to BowlingScene's interruptible spring.
    this.camW=!this.reduced&&!A.first&&!this.state.noResetCam?
      stage==='reveal'?1:stage==='aim'?1-smooth((age-1.65)/2.25):0:0;
  }
  dispose(){
    if(this.sweepRail)this.host.sweep?.remove(this.sweepRail);
    for(const o of this.objects)this.scene.remove(o);this.objects.length=0;
    for(const x of this.disposables)x.dispose?.();this.disposables.clear();this.textures.clear();
  }
}
export function createBowlingExtras(scene){return new BowlingExtras(scene);}
