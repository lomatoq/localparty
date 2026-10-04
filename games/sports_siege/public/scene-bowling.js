// Pocket Strike host scene: alley art, snapshot interpolation, camera, pinsetter, ball
// return and impact feedback. Purely visual. Every pin/ball pose comes from authoritative
// server snapshots; nothing here can change a roll, a pin count or a score. Decorative
// motion (sweep, respot, ball return, particles) is timed from the server clock, so a
// paused match freezes and a reconnecting screen resumes at the same phase.
import * as THREE from './vendor/three.module.js';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';
import {createBowlingExtras} from './bowling-extras.js'; // alley life, pinsetter/sweep beat, effects
import {createBowlingAlley} from './bowling-alley.js'; // environment art: fascia, lane reflection, return, rack, neighbour life
import {createBowlingFeel} from './bowling-feel.js'; // game feel: release charge, clatter sparks, pin blur, camera beats, tiers

// Shared with games/sports_siege/bowling.js (regression test compares the two lines).
const PIN_PROFILE=[[.089,0],[.136,.06],[.183,.17],[.204,.31],[.194,.44],[.157,.57],[.11,.69],[.083,.8],[.085,.88],[.117,.97],[.128,1.05],[.109,1.13],[.06,1.19],[0,1.21]];
// Stage windows set by match.js (token(), throw, recordRoll): the phase age is derived
// from the authoritative deadline, never from a local timer.
const AIM_WINDOW=25,ROLL_WINDOW=10,REVEAL_WINDOW=1.6;
const RACK=[];for(let row=0;row<4;row++)for(let col=0;col<=row;col++)RACK.push({x:(col-row/2)*.72,z:-9.8-row*.65});
const BALL_R=.33,START_Z=12.8,START_Y=.36,POSITION_SCALE=1.72,LANE_END=-15.4,FOUL_Z=10.5;
const HOOD={x:-3.8,y:.64,z:12.15},RACK_END={x:-3.8,y:.64,z:14.05};
const NEIGHBOURS=[{x:-7.6,number:'7'},{x:7.6,number:'9'},{x:-15.2,number:'6'},{x:15.2,number:'10'}];
const RENDER_DELAY=.075,PARTICLES=96;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=u=>{u=clamp(u,0,1);return u*u*(3-2*u);},easeOut=u=>1-Math.pow(1-clamp(u,0,1),3);

function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];}
function seeded(seed){let s=seed>>>0;return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
// Shared HeyPals sound effects live on the TV shell page; they respect its mute/volume.
function sound(name){try{(window.parent!==window?window.parent:window).HeyPalsAudio?.play(name);}catch{}}
// Consecutive strikes ending at the latest roll (tenth-frame bonus strikes included): 2 = double, 3 = turkey.
function strikeRun(frames,frameCount){const flags=[];(frames||[]).forEach((f,i)=>{const r=f.rolls||[];if(i!==frameCount-1){if(r[0]===10)flags.push(true);else r.forEach(()=>flags.push(false));}else r.forEach((v,j)=>flags.push(v===10&&freshBefore(r.slice(0,j),true)));});let n=0;for(let i=flags.length-1;i>=0&&flags[i];i--)n++;return n;}
function freshBefore(prev,last){if(!prev.length)return true;if(!last)return false;return prev.length===1?prev[0]===10:prev.length===2&&(prev[1]===10||(prev[0]!==10&&prev[0]+prev[1]===10));}

export class BowlingScene{
  constructor(stage){
    this.stage=stage;this.scene=stage.scene;this.renderer=stage.renderer;this.camera=stage.camera;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.disposables=new Set();this.buffer=[];this.renderT=null;this.lastState=null;this.seenEvents=new Set();
    this.tmp={v:new THREE.Vector3(),v2:new THREE.Vector3(),q:new THREE.Quaternion(),q2:new THREE.Quaternion(),m:new THREE.Matrix4(),e:new THREE.Euler(),c:new THREE.Color(),s:new THREE.Vector3(1,1,1)};
    this.camPos=new THREE.Vector3();this.camLook=new THREE.Vector3();this.camGoalPos=new THREE.Vector3();this.camGoalLook=new THREE.Vector3();
    this.aimPose={pos:new THREE.Vector3(0,3.6,26),look:new THREE.Vector3(0,.6,-4),fov:18};
    this.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy?.()||1);
    window.__bowlingScene=this; // read-only QA handle (frame timing, camera checks)
    this.setupRenderer();this.buildEnvironment();this.buildMaterials();this.buildAlley();this.buildDynamic();
    this.camPos.copy(this.aimPose.pos);this.camLook.copy(this.aimPose.look);this.camera.position.copy(this.camPos);this.camera.lookAt(this.camLook);
    document.fonts?.ready.then(()=>{this.paintMasks();for(const t of this.bannerTextures.values())t.dispose();this.bannerTextures.clear();}).catch(()=>{});
    try{this.extras=createBowlingExtras(this);}catch(error){console.warn('bowling extras',error);}
    try{this.alley=createBowlingAlley(this);}catch(error){console.warn('bowling alley',error);}
    try{this.feel=createBowlingFeel(this);}catch(error){console.warn('bowling feel',error);}
    addEventListener('pagehide',()=>this.dispose(),{once:true});
  }
  track(x){this.disposables.add(x);return x;}
  setupRenderer(){
    const r=this.renderer;r.toneMapping=THREE.NeutralToneMapping;r.toneMappingExposure=1.0;
    r.shadowMap.type=THREE.PCFSoftShadowMap;
    for(const light of this.scene.children.filter(o=>o.isLight))this.scene.remove(light);
    this.scene.background=new THREE.Color('#0b0814');this.scene.fog=new THREE.Fog('#0b0814',34,120); // light depth haze: far racks and back wall recede
  }
  buildEnvironment(){
    // A small emissive room baked to a PMREM map: soft warm ceiling strips and purple/pink
    // side light give the lane, pins and ball moderate reflections without mirror noise.
    const env=new THREE.Scene(),geos=[],mats=[];
    const room=new THREE.Mesh(new THREE.BoxGeometry(40,14,60),new THREE.MeshBasicMaterial({color:'#120d1c',side:THREE.BackSide}));geos.push(room.geometry);mats.push(room.material);env.add(room);
    const panel=(color,w,h,x,y,z,rx=0,ry=0,intensity=1)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity),side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.set(rx,ry,0);env.add(m);geos.push(m.geometry);mats.push(m.material);};
    for(const z of [-18,-8,2,12])panel('#fff1dc',22,1.4,0,6.9,z,Math.PI/2,0,5.5);
    panel('#9b5cff',.8,9,-19.8,2,-6,0,Math.PI/2,2.0);panel('#ff4fa8',.8,9,19.8,2,-6,0,-Math.PI/2,2.0);
    panel('#ffd9b0',30,2,0,4.5,-29.8,0,0,1.1);panel('#8c5cff',8,1.2,0,6,-29.8,0,0,1.4);
    const pmrem=new THREE.PMREMGenerator(this.renderer);this.envTarget=pmrem.fromScene(env,.035);pmrem.dispose();
    for(const g of geos)g.dispose();for(const m of mats)m.dispose();
    this.scene.environment=this.envTarget.texture;this.scene.environmentIntensity=.5;
    // Lights: warm key with tight lane shadows, cool sky fill, purple/pink rims, pin-deck spot.
    const hemi=new THREE.HemisphereLight('#efe6f2','#2b1a33',.45);this.scene.add(hemi);
    const key=this.key=new THREE.DirectionalLight('#ffe7cc',2.7);key.position.set(-5,16,14);key.target.position.set(0,0,-3);
    key.castShadow=!this.stage.software;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:20,bottom:-20,near:2,far:60});
    key.shadow.bias=-.0002;key.shadow.normalBias=.02;key.shadow.radius=3;this.scene.add(key,key.target);
    // Deck spot: soft-edged (penumbra 1) and a little lower, so the rack is lit without a hard
    // hot ellipse on the deck or blown-out pin bodies in the close reveal view.
    const deck=new THREE.SpotLight('#fff1de',21,9.5,.8,1,1.3);deck.position.set(0,1.62,-9.75);deck.target.position.set(0,0,-11.6);this.scene.add(deck,deck.target);
    // Pit light: a violet work light under the deck lip, so pins and the ball that drop into
    // the pit stay readable as they fall instead of vanishing into black.
    const pit=new THREE.PointLight('#c7a6ff',7,3.6,1.4);pit.position.set(0,-.18,-15.7);this.scene.add(pit);
    const rimL=new THREE.PointLight('#9a5cff',9,9,1.6);rimL.position.set(-4.3,2.2,-12.6);const rimR=new THREE.PointLight('#ff4fa8',9,9,1.6);rimR.position.set(4.3,2.2,-12.6);this.scene.add(rimL,rimR);
    const approach=new THREE.PointLight('#ffd7b0',10,10,1.6);approach.position.set(0,2.6,14.5);this.scene.add(approach);
    // Impact flash stays in the scene at zero intensity so it never triggers a shader recompile.
    this.flash=new THREE.PointLight('#ffe2c8',0,5,1.6);this.flash.position.set(0,.8,-10);this.scene.add(this.flash);
    this.lights={deck,approach,rimL,rimR,base:{deck:deck.intensity,approach:approach.intensity,rimL:rimL.intensity,rimR:rimR.intensity}}; // feel module dips these on a gutter ball
  }
  texture(c,{repeat=null,srgb=true,aniso=true}={}){const t=this.track(new THREE.CanvasTexture(c));if(srgb)t.colorSpace=THREE.SRGBColorSpace;if(aniso)t.anisotropy=this.anisotropy;if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);}return t;}
  laneTexture(){
    // Maple boards (39 across), darker pine deck, foul line, dots, arrows and pin spots,
    // drawn once. 1 px = 1/64 m along the lane.
    const W=512,H=2048,L=16-LANE_END,[c,g]=canvas(W,H),rand=seeded(7),zToY=z=>(z-LANE_END)/L*H,xToX=x=>(x+2.2)/4.4*W;
    const boards=39,bw=W/boards;
    for(let i=0;i<boards;i++){
      const tone=rand(),deckY=zToY(-9.05);
      g.fillStyle=`hsl(${32+tone*6},${52+tone*10}%,${70+tone*7}%)`;g.fillRect(i*bw,deckY,bw+1,H-deckY);
      g.fillStyle=`hsl(${29+tone*5},${48+tone*8}%,${64+tone*8}%)`;g.fillRect(i*bw,0,bw+1,deckY);
      for(let k=0;k<26;k++){const x=i*bw+rand()*bw,y=rand()*H,len=40+rand()*240;g.strokeStyle=`rgba(${120+rand()*40|0},${70+rand()*30|0},30,${.05+rand()*.08})`;g.lineWidth=.6+rand()*1.2;g.beginPath();g.moveTo(x,y);g.lineTo(x+(rand()-.5)*2,y+len);g.stroke();}
      g.fillStyle='rgba(70,40,20,.28)';g.fillRect(i*bw,0,1,H);
    }
    // Board joints across the lane break the long strips, as on real lane panels.
    g.fillStyle='rgba(70,40,20,.22)';for(let i=0;i<boards;i++)for(let y=rand()*300;y<H;y+=260+rand()*240)g.fillRect(i*bw,y,bw,1.5);
    // Oil sheen fades out toward the deck.
    const oil=g.createLinearGradient(0,zToY(12),0,zToY(-6));oil.addColorStop(0,'rgba(255,240,220,.10)');oil.addColorStop(1,'rgba(255,240,220,0)');g.fillStyle=oil;g.fillRect(0,zToY(12),W,zToY(-6)-zToY(12));
    g.fillStyle='#3a2216';g.fillRect(0,zToY(FOUL_Z)-3,W,6);
    const dot=(x,z,r=4)=>{g.fillStyle='#4a2a1a';g.beginPath();g.ellipse(xToX(x),zToY(z),r,r*.9,0,0,Math.PI*2);g.fill();};
    for(const z of [11.6,13.6])for(const b of [3,5,8,11,14])for(const s of [-1,1])dot(s*(2.2-b*bw/W*4.4),z,3);
    for(const b of [3,5,8,11,14])for(const s of [-1,1])dot(s*(2.2-b*bw/W*4.4),6.7,3.5);
    // Seven target arrows in a shallow V, dark inlay (no glow on the playing surface).
    for(let i=0;i<7;i++){const b=5+i*5,x=-2.2+(b+.5)*bw/W*4.4,z=1.35-Math.abs(i-3)*.42,X=xToX(x),Y=zToY(z);g.fillStyle='#4d2c1c';g.beginPath();g.moveTo(X,Y-26);g.lineTo(X+bw*.62,Y+18);g.lineTo(X,Y+8);g.lineTo(X-bw*.62,Y+18);g.closePath();g.fill();}
    // Deck end lip: a pale edge so the pit reads as a drop, not a void.
    g.fillStyle='#f2d2a4';g.fillRect(0,0,W,5);
    for(const p of RACK){g.fillStyle='rgba(60,32,18,.55)';g.beginPath();g.arc(xToX(p.x),zToY(p.z),5,0,Math.PI*2);g.fill();}
    return this.texture(c);
  }
  laneRoughTexture(){
    // Roughness (G channel) in the same layout as the lane art: each board has its own
    // sheen, the oiled heads-to-arrows zone is glossier, the dry backends and deck are
    // satin, and fine along-the-grain streaks break up the clearcoat highlight.
    const W=128,H=1024,L=16-LANE_END,[c,g]=canvas(W,H),rand=seeded(29),zToY=z=>(z-LANE_END)/L*H,bw=W/39;
    for(let i=0;i<39;i++){const r=.3+rand()*.12;g.fillStyle=`rgb(0,${r*255|0},0)`;g.fillRect(i*bw,0,bw+1,H);}
    const oil=g.createLinearGradient(0,zToY(12.5),0,zToY(-7));oil.addColorStop(0,'rgba(0,40,0,.55)');oil.addColorStop(.7,'rgba(0,40,0,.4)');oil.addColorStop(1,'rgba(0,40,0,0)');
    g.fillStyle=oil;g.fillRect(W*.12,zToY(12.5),W*.76,zToY(-7)-zToY(12.5));
    g.fillStyle='rgba(0,120,0,.35)';g.fillRect(0,0,W,zToY(-9.05));
    for(let k=0;k<420;k++){const x=rand()*W,y=rand()*H;g.fillStyle=rand()<.5?'rgba(0,150,0,.16)':'rgba(0,30,0,.16)';g.fillRect(x,y,.8,30+rand()*140);}
    g.fillStyle='rgb(0,120,0)';g.fillRect(0,0,W,3);
    return this.texture(c,{srgb:false});
  }
  pinTexture(points){
    // Lathe UV.v follows the profile: ivory lacquer, two red neck bands with a fine white
    // keyline, a small crown mark front and back, and faint scuffs on the belly where
    // pins get hit. u runs around the pin.
    const W=256,H=256,[c,g]=canvas(W,H),rand=seeded(41),yAt=k=>{const v=1-k/(H-1),j=Math.round(v*(points.length-1));return points[j].y;};
    const base=g.createLinearGradient(0,0,0,H);base.addColorStop(0,'#fbf8f1');base.addColorStop(.7,'#f5f0e6');base.addColorStop(1,'#e9e2d6');g.fillStyle=base;g.fillRect(0,0,W,H);
    for(let k=0;k<H;k++){const y=yAt(k);
      if((y>.775&&y<.815)||(y>.855&&y<.895)){g.fillStyle='#e8204f';g.fillRect(0,k,W,1);}
      else if((y>.768&&y<.775)||(y>.815&&y<.822)||(y>.848&&y<.855)||(y>.895&&y<.902)){g.fillStyle='#fff8ee';g.fillRect(0,k,W,1);}
      else if(y>.12&&y<.42&&rand()<.06){g.fillStyle=`rgba(120,110,100,${.05+rand()*.07})`;g.fillRect(rand()*W,k,4+rand()*22,1);}}
    let top=0,bot=0;for(let k=0;k<H;k++){const y=yAt(k);if(y<.735&&!top)top=k;if(y<.63){bot=k;break;}}
    for(const u of [.25,.75]){const X=u*W,Y=(top+bot)/2,s=Math.max(3,(bot-top)*.42);g.fillStyle='#e8204f';g.beginPath();g.moveTo(X-s,Y+s*.55);g.lineTo(X-s,Y-s*.35);g.lineTo(X-s*.5,Y+s*.05);g.lineTo(X,Y-s*.6);g.lineTo(X+s*.5,Y+s*.05);g.lineTo(X+s,Y-s*.35);g.lineTo(X+s,Y+s*.55);g.closePath();g.fill();}
    return this.texture(c,{aniso:false});
  }
  // Mirrored pins/ball fade with depth below the lane, like a real oiled-lane reflection.
  fadeMirror(mat){mat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying float vMirrorY;').replace('#include <project_vertex>','#include <project_vertex>\nvMirrorY=(modelMatrix*vec4(transformed,1.)).y;');sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vMirrorY;').replace('#include <opaque_fragment>','diffuseColor.a*=exp(2.4*min(vMirrorY,0.));\n#include <opaque_fragment>');};mat.customProgramCacheKey=()=>'mirror-fade';return mat;}
  ballTexture(color){
    const key=color;this.ballTextures||=new Map();if(this.ballTextures.has(key))return this.ballTextures.get(key);
    const W=512,H=256,[c,g]=canvas(W,H),base=new THREE.Color(color),hsl={};base.getHSL(hsl);
    const deep=new THREE.Color().setHSL(hsl.h,clamp(hsl.s*1.15,.55,.95),.30),light=new THREE.Color().setHSL((hsl.h+.04)%1,clamp(hsl.s,.5,.9),.66),img=g.createImageData(W,H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const u=x/W*Math.PI*2,v=y/H*Math.PI;
      const swirl=Math.sin(u*2+Math.sin(v*3+u)*2.4+Math.sin(v*7)*.6),vein=Math.pow(Math.max(0,Math.sin(u*3-v*5+swirl*2.2)),10);
      const t=clamp(swirl*.5+.5,0,1)*.55,i=(y*W+x)*4;
      img.data[i]=clamp((deep.r+(light.r-deep.r)*t+vein*.5)*255,0,255);img.data[i+1]=clamp((deep.g+(light.g-deep.g)*t+vein*.5)*255,0,255);img.data[i+2]=clamp((deep.b+(light.b-deep.b)*t+vein*.5)*255,0,255);img.data[i+3]=255;}
    g.putImageData(img,0,0);
    // Finger and thumb holes rotate with the ball, so spin and roll are visible.
    for(const [x,y,r] of [[.5,.36,13],[.462,.47,11],[.538,.47,11]]){const X=x*W,Y=y*H;g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(X,Y,r+3,r+2,0,0,Math.PI*2);g.fill();g.fillStyle='#08050c';g.beginPath();g.ellipse(X,Y,r,r*.92,0,0,Math.PI*2);g.fill();}
    const t=this.texture(c);this.ballTextures.set(key,t);return t;
  }
  radialTexture(stops){const [c,g]=canvas(64,64),r=g.createRadialGradient(32,32,0,32,32,32);for(const [o,col] of stops)r.addColorStop(o,col);g.fillStyle=r;g.fillRect(0,0,64,64);return this.texture(c,{aniso:false});}
  buildMaterials(){
    const M=this.mat={};
    M.lane=this.track(new THREE.MeshPhysicalMaterial({map:this.laneTexture(),roughnessMap:this.laneRoughTexture(),roughness:1,metalness:0,clearcoat:.85,clearcoatRoughness:.09,envMapIntensity:1.15}));
    M.laneDim=this.track(M.lane.clone());M.laneDim.color.set('#8d7f74');M.laneDim.clearcoat=.35;
    // Lane gloss: the playing lane marks the stencil; mirrored pins and ball are added on
    // those pixels only (faint, no depth), like reflections on an oiled lane.
    Object.assign(M.lane,{stencilWrite:true,stencilRef:1,stencilFunc:THREE.AlwaysStencilFunc,stencilZPass:THREE.ReplaceStencilOp});
    const mirror=o=>this.track(new THREE.MeshBasicMaterial({...o,blending:THREE.CustomBlending,blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneMinusSrcAlphaFactor,transparent:false,depthTest:false,depthWrite:false,stencilWrite:true,stencilRef:1,stencilFunc:THREE.EqualStencilFunc,stencilZPass:THREE.KeepStencilOp,stencilFail:THREE.KeepStencilOp,stencilZFail:THREE.KeepStencilOp}));
    M.mirrorPin=this.fadeMirror(mirror({color:'#f3e6dc',opacity:.22}));M.mirrorBall=this.fadeMirror(mirror({color:'#d8d0e0',opacity:.28}));
    M.gutter=this.track(new THREE.MeshStandardMaterial({color:'#2b2c3c',roughness:.5,metalness:.45,side:THREE.DoubleSide}));
    M.capping=this.track(new THREE.MeshStandardMaterial({color:'#1b1528',roughness:.32,metalness:.15}));
    M.kickback=this.track(new THREE.MeshStandardMaterial({color:'#3d2e5c',roughness:.42,metalness:.15}));
    M.accentSoft=this.track(new THREE.MeshStandardMaterial({color:'#000000',emissive:'#c98cff',emissiveIntensity:.55}));
    M.accentPink=this.track(new THREE.MeshStandardMaterial({color:'#000000',emissive:'#ff4fa8',emissiveIntensity:1.1}));
    M.accentViolet=this.track(new THREE.MeshStandardMaterial({color:'#000000',emissive:'#8c5cff',emissiveIntensity:1.1}));
    M.housing=this.track(new THREE.MeshStandardMaterial({color:'#15101f',roughness:.6,metalness:.2}));
    M.pit=this.track(new THREE.MeshStandardMaterial({color:'#050308',roughness:1}));
    M.cushion=this.track(new THREE.MeshStandardMaterial({color:'#33264a',roughness:.95}));
    M.wall=this.track(new THREE.MeshStandardMaterial({color:'#140e20',roughness:.9}));
    M.floor=this.track(new THREE.MeshStandardMaterial({color:'#1a1226',roughness:.95}));
    M.light=this.track(new THREE.MeshBasicMaterial({color:new THREE.Color('#ffeedd').multiplyScalar(1.6)}));
    M.returnBody=this.track(new THREE.MeshPhysicalMaterial({color:'#4a2f86',roughness:.28,metalness:.2,clearcoat:.8,clearcoatRoughness:.2}));
    M.chrome=this.track(new THREE.MeshStandardMaterial({color:'#d6d3e6',roughness:.22,metalness:1}));
    M.hole=this.track(new THREE.MeshBasicMaterial({color:'#06040a'}));
    const pinPoints=this.pinPoints=this.makePinPoints();
    // Glossy lacquered maple: a soft ivory base (never clipped white under the deck spot) and
    // a hard, near-mirror clearcoat that carries the crisp highlights.
    M.pin=this.track(new THREE.MeshPhysicalMaterial({map:this.pinTexture(pinPoints),color:'#e6dfd4',roughness:.42,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:.8}));
    // Reactive-resin ball: polished clearcoat over a faint pearl (iridescent) shimmer.
    M.ball=this.track(new THREE.MeshPhysicalMaterial({map:this.ballTexture('#b493ff'),roughness:.2,metalness:.02,clearcoat:1,clearcoatRoughness:.04,iridescence:.35,iridescenceIOR:1.35,iridescenceThicknessRange:[180,420],envMapIntensity:1.2}));M.mirrorBall.map=M.ball.map;M.mirrorPin.map=M.pin.map;
    M.blob=this.track(new THREE.MeshBasicMaterial({map:this.radialTexture([[0,'rgba(0,0,0,.62)'],[.55,'rgba(0,0,0,.26)'],[1,'rgba(0,0,0,0)']]),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
    M.spark=this.track(new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
    M.confetti=this.track(new THREE.MeshBasicMaterial({color:'#ffffff',side:THREE.DoubleSide,toneMapped:false}));
    M.ring=this.track(new THREE.MeshBasicMaterial({color:'#ffd6f0',map:this.radialTexture([[0,'rgba(255,255,255,0)'],[.62,'rgba(255,255,255,0)'],[.8,'rgba(255,255,255,.9)'],[1,'rgba(255,255,255,0)']]),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
    M.guide=this.track(new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.0,depthWrite:false,toneMapped:false,map:this.radialTexture([[0,'rgba(255,255,255,1)'],[.55,'rgba(255,255,255,.9)'],[1,'rgba(255,255,255,0)']])}));
  }
  makePinPoints(){
    const profile=PIN_PROFILE.slice(0,-1).map(([r,y])=>new THREE.Vector2(r,y));
    const spline=new THREE.SplineCurve(profile),pts=[new THREE.Vector2(0,0),...spline.getSpacedPoints(46),new THREE.Vector2(.03,1.205),new THREE.Vector2(0,1.21)];
    return pts;
  }
  maskTexture(number,hue){
    const [c,g]=canvas(1024,256);this.maskCanvases||=[];this.maskCanvases.push({c,g,number,hue,primary:this.maskCanvases.length===0});return this.texture(c);
  }
  paintMasks(){
    for(const {c,g,number,hue,primary} of this.maskCanvases||[]){
      const W=c.width,H=c.height,bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,`hsl(${hue},70%,13%)`);bg.addColorStop(.55,`hsl(${hue+22},72%,21%)`);bg.addColorStop(1,`hsl(${hue+48},78%,24%)`);g.fillStyle=bg;g.fillRect(0,0,W,H);
      g.globalAlpha=.55;for(let i=-3;i<9;i++){const x=i*150;const grad=g.createLinearGradient(x,0,x+220,H);grad.addColorStop(0,'rgba(255,79,168,0)');grad.addColorStop(.5,i%2?'rgba(255,79,168,.55)':'rgba(140,92,255,.55)');grad.addColorStop(1,'rgba(255,79,168,0)');g.fillStyle=grad;g.beginPath();g.moveTo(x,H);g.lineTo(x+70,H);g.lineTo(x+260,0);g.lineTo(x+190,0);g.closePath();g.fill();}
      g.globalAlpha=1;g.fillStyle='rgba(255,255,255,.08)';g.fillRect(0,H-10,W,10);g.fillStyle='rgba(255,220,240,.85)';g.fillRect(0,H-6,W,2);
      if(number){g.fillStyle='rgba(10,6,18,.65)';g.beginPath();g.arc(92,H/2,64,0,Math.PI*2);g.fill();g.strokeStyle='#ffd36b';g.lineWidth=6;g.stroke();g.fillStyle='#fff';g.font='italic 900 84px KardiaFatRunner, "Arial Black", sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(number,92,H/2+4);}
      if(primary){g.fillStyle='#fff';g.shadowColor='rgba(255,79,168,.9)';g.shadowBlur=22;g.font='italic 900 92px KardiaFatRunner, "Arial Black", sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('POCKET STRIKE',W/2+40,H/2+4);g.shadowBlur=0;}
    }
    for(const t of this.maskTextures||[])t.needsUpdate=true;
  }
  buildAlley(){
    const groups=new Map(),add=(geo,mat,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{this.tmp.e.set(rx,ry,rz);this.tmp.q.setFromEuler(this.tmp.e);this.tmp.m.compose(this.tmp.v.set(x,y,z),this.tmp.q,this.tmp.s.set(1,1,1));const g=geo.clone().applyMatrix4(this.tmp.m);(groups.get(mat)||groups.set(mat,[]).get(mat)).push(g);};
    const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d),plane=(w,h)=>new THREE.PlaneGeometry(w,h);
    const L=16-LANE_END,laneZ=(16+LANE_END)/2;this.maskTextures=[];
    const gutterGeo=new THREE.CylinderGeometry(.45,.45,L+1.2,20,1,true,Math.PI/2,Math.PI);
    const lane=(cx,primary,number,hue)=>{
      add(plane(4.4,L),primary?this.mat.lane:this.mat.laneDim,cx,0,laneZ,-Math.PI/2);
      for(const s of [-1,1]){
        add(gutterGeo,this.mat.gutter,cx+s*2.65,.05,laneZ-.6,-Math.PI/2,0,0);
        add(box(.26,.12,25.2),this.mat.capping,cx+s*3.22,.02,3.6);
        add(box(.26,1.9,8.2),this.mat.kickback,cx+s*3.22,.4,-12.6);
        add(box(.28,.035,8.2),s<0?this.mat.accentViolet:this.mat.accentPink,cx+s*3.22,1.365,-12.6);
      }
      add(box(7,.4,1.4),this.mat.pit,cx,-1,-16.05);add(box(7,2.8,.3),this.mat.cushion,cx,.25,-16.75);
      // Masking unit: art panel in front of the pinsetter housing.
      const mask=this.maskTexture(number,hue);this.maskTextures.push(mask);
      const maskMat=this.track(new THREE.MeshStandardMaterial({color:'#0b0712',emissive:'#ffffff',emissiveMap:mask,emissiveIntensity:primary?1.05:.7,roughness:.5}));
      add(plane(6.9,1.62),maskMat,cx,2.56,-9.29);add(box(7,1.7,.3),this.mat.housing,cx,2.56,-9.46);add(box(7,1.4,6.8),this.mat.housing,cx,2.75,-12.9);
      add(box(6.9,.04,.05),this.mat.accentSoft,cx,1.73,-9.27);
    };
    lane(0,true,'8',262);for(const n of NEIGHBOURS)lane(n.x,false,n.number,n.x<0?226:292);
    // Approach floor, seating step, back wall with light slats, ceiling fixtures.
    add(plane(60,30),this.mat.floor,0,-.02,31,-Math.PI/2);add(plane(60,8),this.mat.floor,0,-1.2,-20,-Math.PI/2);
    add(box(60,9,.4),this.mat.wall,0,3.2,-17.4);
    add(box(60,.3,.12),this.mat.accentViolet,0,3.6,-17.15);
    for(const x of [-28,28])add(box(.4,9,60),this.mat.wall,x,3.2,-2);
    for(const z of [-12,-4,4,12])add(box(30,.08,.7),this.mat.light,0,7.4,z);
    // Ball return between this lane and the left neighbour: hood, rack and two rails.
    add(box(.88,.5,1.15),this.mat.returnBody,HOOD.x,.25,HOOD.z-.62);
    add(new THREE.CylinderGeometry(.44,.44,1.15,24,1,false,-Math.PI/2,Math.PI),this.mat.returnBody,HOOD.x,.5,HOOD.z-.62,-Math.PI/2,0,0);
    add(new THREE.CircleGeometry(.36,24),this.mat.hole,HOOD.x,.62,HOOD.z-.04);
    add(box(.6,.28,2.1),this.mat.returnBody,HOOD.x,.14,(HOOD.z+RACK_END.z)/2+.1);
    for(const s of [-1,1])add(new THREE.CylinderGeometry(.03,.03,2.2,8),this.mat.chrome,HOOD.x+s*.15,.32,(HOOD.z+RACK_END.z)/2+.1,Math.PI/2);
    const meshes=[];
    for(const [mat,list] of groups){const geo=this.track(mergeGeometries(list,false));for(const g of list)g.dispose();const mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=true;mesh.castShadow=false;mesh.matrixAutoUpdate=false;mesh.updateMatrix();this.scene.add(mesh);meshes.push(mesh);}
    gutterGeo.dispose();this.staticMeshes=meshes;this.paintMasks();
    // Neighbouring racks are static background: one instanced draw.
    this.pinGeometry=this.track(new THREE.LatheGeometry(this.pinPoints,40));
    const others=new THREE.InstancedMesh(this.pinGeometry,this.mat.pin,NEIGHBOURS.length*10);let i=0;
    for(const n of NEIGHBOURS)for(const p of RACK){this.tmp.m.makeTranslation(n.x+p.x,0,p.z);others.setMatrixAt(i++,this.tmp.m);}
    others.instanceMatrix.needsUpdate=true;others.castShadow=false;others.receiveShadow=true;this.scene.add(others);this.neighbourPins=others;
  }
  addBallHoles(){
    // Thumb and finger holes as real relief on top of the painted holes (same UV spots):
    // a pale insert rim and a recessed bowl whose lit inner wall sits on the upper edge.
    const [c,g]=canvas(64,64),r=g.createRadialGradient(32,26,2,32,32,32);r.addColorStop(0,'#000000');r.addColorStop(.55,'#050307');r.addColorStop(.82,'#2b2433');r.addColorStop(1,'#4a4152');g.fillStyle=r;g.fillRect(0,0,64,64);
    const bowl=this.track(new THREE.MeshBasicMaterial({map:this.texture(c,{aniso:false}),polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
    const rim=this.track(new THREE.MeshPhysicalMaterial({color:'#efeaf6',roughness:.28,clearcoat:1,clearcoatRoughness:.08}));
    const up=new THREE.Vector3(0,0,1);
    for(const [fx,fy,rad] of [[.5,.36,.048],[.462,.47,.043],[.538,.47,.043]]){
      const phi=fx*Math.PI*2,theta=fy*Math.PI,dir=new THREE.Vector3(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)),q=new THREE.Quaternion().setFromUnitVectors(up,dir);
      const disk=new THREE.Mesh(this.track(new THREE.CircleGeometry(rad,28)),bowl);disk.position.copy(dir).multiplyScalar(BALL_R+.0012);disk.quaternion.copy(q);
      const ring=new THREE.Mesh(this.track(new THREE.TorusGeometry(rad+.002,.0065,8,32)),rim);ring.position.copy(dir).multiplyScalar(BALL_R-.0005);ring.quaternion.copy(q);
      this.ball.add(disk,ring);}
  }
  buildDynamic(){
    const M=this.mat;
    this.pins=RACK.map(()=>{const m=new THREE.Mesh(this.pinGeometry,M.pin);m.castShadow=true;m.receiveShadow=true;m.visible=false;this.scene.add(m);return m;});
    this.ballGeometry=this.track(new THREE.SphereGeometry(BALL_R,48,32));
    this.ball=new THREE.Mesh(this.ballGeometry,M.ball);this.ball.castShadow=true;this.ball.visible=false;this.scene.add(this.ball);
    this.addBallHoles();
    this.mirrorPins=this.pins.map(()=>{const m=new THREE.Mesh(this.pinGeometry,M.mirrorPin);m.matrixAutoUpdate=false;m.renderOrder=1;m.visible=false;m.frustumCulled=false;this.scene.add(m);return m;});
    this.mirrorBall=new THREE.Mesh(this.ballGeometry,M.mirrorBall);this.mirrorBall.matrixAutoUpdate=false;this.mirrorBall.renderOrder=1;this.mirrorBall.frustumCulled=false;this.scene.add(this.mirrorBall);
    for(const m of [...this.pins,this.ball])m.renderOrder=2;this.reflect=new THREE.Matrix4().makeScale(1,-1,1);
    this.ballPos=new THREE.Vector3(0,START_Y,START_Z);this.ballPrev=new THREE.Vector3(0,START_Y,START_Z);this.ballColor='';
    const blobGeo=this.track(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2));
    this.blobs=new THREE.InstancedMesh(blobGeo,M.blob,11);this.blobs.frustumCulled=false;this.blobs.renderOrder=1;this.scene.add(this.blobs);
    // Sweep bar of the pinsetter, parked inside the masking unit when idle.
    this.sweep=new THREE.Group();const bar=new THREE.Mesh(this.track(new THREE.BoxGeometry(4.7,.72,.08)),M.housing),edge=new THREE.Mesh(this.track(new THREE.BoxGeometry(4.7,.05,.1)),M.accentPink);edge.position.y=-.36;bar.castShadow=true;this.sweep.add(bar,edge);this.sweep.position.set(0,2.6,-9.65);this.scene.add(this.sweep);
    // Aim guide: a short dotted path from the launch spot, in the bowler's colour.
    const dotGeo=this.track(new THREE.PlaneGeometry(.16,.5).rotateX(-Math.PI/2));this.guide=new THREE.InstancedMesh(dotGeo,M.guide,16);this.guide.frustumCulled=false;this.guide.renderOrder=2;this.scene.add(this.guide);
    this.launchRing=new THREE.Mesh(this.track(new THREE.RingGeometry(.4,.47,40).rotateX(-Math.PI/2)),M.guide);this.launchRing.renderOrder=2;this.scene.add(this.launchRing);
    // Bounded particles: additive sparks and confetti, preallocated, timed by server clock.
    this.sparks=new THREE.InstancedMesh(this.track(new THREE.OctahedronGeometry(.085,0)),M.spark,PARTICLES);this.confetti=new THREE.InstancedMesh(this.track(new THREE.PlaneGeometry(.12,.07)),M.confetti,PARTICLES);
    for(const mesh of [this.sparks,this.confetti]){mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.setColorAt(0,this.tmp.c.set('#fff'));mesh.renderOrder=6;this.scene.add(mesh);}
    this.particles=Array.from({length:PARTICLES*2},()=>({born:-1,life:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,size:1,spin:0,r:1,g:1,b:1,confetti:false}));this.particleCursor=0;
    this.ring=new THREE.Mesh(this.track(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2)),M.ring);this.ring.position.set(0,.02,-10);this.ring.renderOrder=5;this.ring.visible=false;this.scene.add(this.ring);
    this.banner=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));this.track(this.banner.material);this.banner.visible=false;this.banner.renderOrder=20;this.scene.add(this.banner);
    this.bannerTextures=new Map();this.bannerState=null;this.impact=null;this.impactToken='';
  }
  bannerWord(kind,tier,gutter){
    const ru=window.PartyI18n?.language==='ru';
    if(kind==='spare')return ru?'СПЭР!':'SPARE!';
    if(kind==='gutter')return gutter?(ru?'ЖЁЛОБ…':'GUTTER…'):(ru?'МИМО…':'MISS…');
    return tier>=4?(ru?`${tier} ПОДРЯД!`:`${tier}-BAGGER!`):tier===3?(ru?'ИНДЕЙКА!':'TURKEY!'):tier===2?(ru?'ДУБЛЬ!':'DOUBLE!'):(ru?'СТРАЙК!':'STRIKE!');
  }
  bannerTexture(kind,tier=1,gutter=true){
    // Celebration word scaled by importance: strike < double < turkey (rainbow edge),
    // spare in lime/teal, a gutter or miss in a deflated blue.
    const word=this.bannerWord(kind,tier,gutter),key=kind+':'+word;if(this.bannerTextures.has(key))return this.bannerTextures.get(key);
    const [c,g]=canvas(1024,288);let size=168;g.font=`italic 900 ${size}px KardiaFatRunner, "Arial Black", sans-serif`;while(g.measureText(word).width>930&&size>90){size-=8;g.font=`italic 900 ${size}px KardiaFatRunner, "Arial Black", sans-serif`;}
    g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
    if(kind==='strike'&&tier>=2){const rim=g.createLinearGradient(80,0,944,0);(tier>=3?['#ff4fa8','#ffd04a','#5fe3c8','#8c5cff','#ff4fa8']:['#ff4fa8','#ffd04a','#ff4fa8']).forEach((col,i,a)=>rim.addColorStop(i/(a.length-1),col));g.lineWidth=40;g.strokeStyle=rim;g.strokeText(word,512,150);}
    g.lineWidth=26;g.strokeStyle=kind==='gutter'?'#0b1030':'#1a0e2b';g.strokeText(word,512,150);
    const fill=g.createLinearGradient(0,60,0,240),stops=kind==='strike'?(tier>=3?['#ffffff','#ffe066','#ff8a3d']:tier===2?['#fff6d0','#ffc24a','#ff4fa8']:['#fff6b8','#ffd04a','#ff7a3d']):kind==='spare'?['#f2ffd6','#c8ff73','#5fe3c8']:['#e3ecff','#9fb6ff','#5f78ff'];
    stops.forEach((col,i)=>fill.addColorStop(i/2,col));
    g.fillStyle=fill;g.shadowColor=kind==='strike'?'rgba(255,79,168,.85)':kind==='spare'?'rgba(140,92,255,.85)':'rgba(60,90,255,.7)';g.shadowBlur=28;g.fillText(word,512,150);
    const t=this.texture(c,{aniso:false});this.bannerTextures.set(key,t);return t;
  }
  // ---- snapshots -------------------------------------------------------------------
  ingest(s){
    if(s===this.lastState)return;this.lastState=s;this.arrivedAt=performance.now();
    const current=s.players.find(p=>p.id===s.currentId),entry={t:s.t,stage:s.phase==='playing'?s.stage:s.phase,token:s.turnToken,deadline:s.deadline,pins:new Map(),ball:s.physics?.ball||null,gutter:!!s.physics?.gutter,color:current?.color||'#b493ff',
      // First turn of a match: nothing has been rolled yet, so the ball starts on the spot
      // instead of riding out of the return hood and the sweep has nothing to clear.
      first:s.phase==='playing'&&s.players.every(p=>!(p.frames||[]).some(f=>f.rolls?.length)),aimX:current?.aim?.x??.5,aimY:current?.aim?.y??.5};
    for(const p of s.physics?.pins||[])entry.pins.set(p.id,p);
    if(s.phase==='waiting')RACK.forEach((p,id)=>entry.pins.set(id,{id,x:p.x,y:0,z:p.z,q:[0,0,0,1]}));
    const last=this.buffer.at(-1);
    if(last&&entry.t<=last.t)this.buffer[this.buffer.length-1]=entry;else this.buffer.push(entry);
    if(this.buffer.length>12)this.buffer.shift();
  }
  advance(dt){
    // Server time estimate grows with local time since the newest packet (at most 0.1 s,
    // so a paused or stalled server freezes the picture on the newest real snapshot).
    const latest=this.buffer.at(-1).t,estimate=latest+Math.min(.1,(performance.now()-this.arrivedAt)/1000),target=estimate-RENDER_DELAY;
    if(this.renderT===null||Math.abs(this.renderT-target)>.9)this.renderT=target;
    // Pocket-hit slow motion: the picture runs at 30% for a beat, then eases back to live
    // (the server simulation never slows; only the replay clock of the TV does).
    const slow=this.slowUntil&&performance.now()<this.slowUntil;
    if(slow)this.renderT+=dt*(this.slowRate||.3);else{this.renderT+=dt;this.renderT+=(target-this.renderT)*Math.min(1,dt*(this.slowUntil&&performance.now()<this.slowUntil+700?3:8));}
    this.renderT=clamp(this.renderT,latest-.85,latest);
  }
  sample(){
    const b=this.buffer,t=this.renderT;let i=b.length-1;while(i>0&&b[i].t>t)i--;
    const A=b[i],B=b[i+1]&&b[i+1].token===A.token&&b[i+1].stage===A.stage?b[i+1]:null;
    return {A,B,alpha:B?clamp((t-A.t)/Math.max(1e-4,B.t-A.t),0,1):0};
  }
  // ---- per frame ---------------------------------------------------------------------
  update(s,dt){
    this.ingest(s);this.advance(dt);const {A,B,alpha}=this.sample(),t=this.renderT,stage=A.stage;
    const window=stage==='aim'?AIM_WINDOW:stage==='rolling'?ROLL_WINDOW:stage==='reveal'?REVEAL_WINDOW:0,age=window&&A.deadline?t-(A.deadline-window):99;
    this.updatePins(A,B,alpha,stage,age,t);this.updateBall(A,B,alpha,stage,age,dt,t);this.updateSweep(stage,age,A.first);this.updateGuide(A,stage,age);
    this.detectImpact(A,stage,t);this.updateCamera(A,stage,age,dt);this.updateParticles(t);this.updateBanner(t);this.updateBlobs();this.updateMirrors();
    this.extras?.update(A,stage,age,t,dt);this.alley?.update(A,stage,age,t,dt);this.feel?.update(A,stage,age,t,dt);
  }
  updatePins(A,B,alpha,stage,age,t){
    // Fresh rack or respotted survivors are lowered by the pinsetter after the sweep.
    const lower=stage==='aim'&&age<1.05?1.35*(1-easeOut((age-.42)/.6)):0,v=this.tmp.v,q=this.tmp.q,q2=this.tmp.q2;
    for(let id=0;id<10;id++){
      const mesh=this.pins[id],a=A.pins.get(id);if(!a){mesh.visible=false;continue;}
      const b=B?.pins.get(id);mesh.visible=true;
      v.set(a.x,a.y,a.z);q.set(a.q[0],a.q[1],a.q[2],a.q[3]);
      if(b){v.lerp(this.tmp.v2.set(b.x,b.y,b.z),alpha);q.slerp(q2.set(b.q[0],b.q[1],b.q[2],b.q[3]),alpha);}
      mesh.position.copy(v);mesh.position.y+=lower;mesh.quaternion.copy(q);
    }
  }
  returnPath(age,target){
    // aim age: .35 s inside the machine, rack roll out of the hood, short arc to the spot.
    const out=this.tmp.v2;
    if(age<.35)return null;
    if(age<.95){const u=smooth((age-.35)/.6);return out.set(HOOD.x,HOOD.y,HOOD.z+(RACK_END.z-HOOD.z)*u);}
    const u=smooth((age-.95)/.6);out.set(RACK_END.x+(target.x-RACK_END.x)*u,RACK_END.y+(target.y-RACK_END.y)*u+Math.sin(u*Math.PI)*.55,RACK_END.z+(target.z-RACK_END.z)*u);
    if(u>=1)return out.copy(target);return out;
  }
  updateBall(A,B,alpha,stage,age,dt,t){
    const ball=this.ball,pos=this.ballPos;let visible=true;
    const color=A.color;if(color!==this.ballColor){this.ballColor=color;this.mat.ball.map=this.ballTexture(color);this.mat.ball.needsUpdate=true;this.mat.mirrorBall.map=this.mat.ball.map;this.mat.mirrorBall.needsUpdate=true;}
    this.aimX=this.aimX??0;this.aimX+=(((A.aimX??.5)*2-1)*POSITION_SCALE-this.aimX)*Math.min(1,dt*10);
    if(A.ball&&(stage==='rolling'||stage==='reveal'||stage==='results')){
      pos.set(A.ball.x,A.ball.y,A.ball.z);if(B?.ball)pos.lerp(this.tmp.v.set(B.ball.x,B.ball.y,B.ball.z),alpha);
    }else if(stage==='aim'){
      const target=this.tmp.v.set(this.aimX,START_Y,START_Z),p=A.first?target:this.returnPath(age-(this.extras?.returnDelay?.(A)||0),target); // after the pin-deck camera, so the return is seen
      if(p)pos.copy(p);else visible=false;
    }else if(stage==='waiting'){pos.set(0,START_Y,START_Z);}else visible=false;
    // Visual spin from motion: rolling without slipping about (dz,0,-dx), plus side spin.
    const dx=pos.x-this.ballPrev.x,dz=pos.z-this.ballPrev.z,dist=Math.hypot(dx,dz);
    if(!ball.visible||dist>3)this.ballPrev.copy(pos);
    else if(dist>1e-5){this.tmp.v2.set(dz/dist,0,-dx/dist);this.tmp.q.setFromAxisAngle(this.tmp.v2,dist/BALL_R);ball.quaternion.premultiply(this.tmp.q);}
    if(stage==='rolling'&&!A.gutter&&this.throwSpin){this.tmp.q.setFromAxisAngle(this.tmp.v2.set(0,1,0),this.throwSpin*7*dt);ball.quaternion.premultiply(this.tmp.q);}
    this.ballPrev.copy(pos);ball.position.copy(pos);ball.visible=visible;
  }
  updateSweep(stage,age,first=false){
    // reveal end: bar drops in front of the deck; aim start: it sweeps to the pit and lifts.
    let y=2.6,z=-9.65;
    if(stage==='reveal'&&age>REVEAL_WINDOW-.5){y=2.6-(2.6-.42)*smooth((age-(REVEAL_WINDOW-.5))/.3);z=-9.45;}
    else if(stage==='aim'&&age<1.05&&!first){if(age<.42){y=.42;z=-9.45-5.4*smooth(age/.42);}else{const u=smooth((age-.42)/.4);y=.42+(2.6-.42)*u;z=-14.85+5.4*smooth((age-.62)/.4);}}
    this.sweep.position.set(0,y,z);this.sweep.visible=y<2.55;
  }
  updateGuide(A,stage,age){
    const from=A.first?.35:1.45+(this.extras?.returnDelay?.(A)||0),show=stage==='aim'&&age>from,opacity=show?Math.min(.8,(age-from)*2):0;
    this.mat.guide.opacity=opacity;this.guide.visible=this.launchRing.visible=opacity>.01;if(!this.guide.visible)return;
    this.mat.guide.color.set(A.color);const spin=(A.aimY??.5)*2-1,x0=this.aimX;
    this.launchRing.position.set(x0,.012,START_Z);
    for(let i=0;i<16;i++){const z=START_Z-1.3-i*.86,hook=z<3?spin*.012*Math.pow(3-z,2):0,s=1-i/26;this.tmp.m.compose(this.tmp.v.set(x0+hook,.012,z),this.tmp.q.identity(),this.tmp.s.set(s,1,s));this.guide.setMatrixAt(i,this.tmp.m);}
    this.guide.instanceMatrix.needsUpdate=true;
  }
  detectImpact(A,stage,t){
    if(stage!=='rolling'||!A.ball||this.impactToken===A.token)return;
    for(const [id,p] of A.pins){const r=RACK[id];if(Math.hypot(p.x-r.x,p.z-r.z)>.03&&Math.abs(A.ball.z-r.z)<2.2){this.impactToken=A.token;
      // A full rack hit in the pocket (head pin area) earns the slow-motion beat.
      const pocket=A.pins.size===10&&Math.abs(A.ball.x)<.55;this.burst(p.x,.55,p.z,t,pocket?1:.6);
      // Pocket hit: slow motion plus a cut to a low three-quarter angle on the deck (TV only).
      if(pocket&&!this.reduced){const now=performance.now();this.slowRate=.34;this.slowUntil=now+880;this.slowCam={until:now+1050,side:A.ball.x>0?-1:1,cut:false};}return;}}
  }
  burst(x,y,z,t,power=.6){
    this.impact={x,z,born:t,power,wall:performance.now()};this.flash.position.set(x,1.1,z+.6);sound('hit');
    if(this.reduced)return;
    // Hot wood-and-resin sparks as velocity streaks (feel module); the octahedron chips are the fallback.
    if(this.feel){this.feel.impactSparks(x,y,z,t,power);return;}
    const rand=seeded((t*1000)|0);
    for(let i=0;i<Math.round(24+power*20);i++){const p=this.particles[this.particleCursor++%PARTICLES],a=rand()*Math.PI*2,s=1.4+rand()*2.6;Object.assign(p,{born:t,life:.45+rand()*.35,x,y:y+rand()*.4,z,vx:Math.cos(a)*s,vy:1.2+rand()*2.6,vz:Math.sin(a)*s*.6-.6,size:.5+rand()*.9,spin:rand()*9,confetti:false});this.tmp.c.set(i%3===0?'#ffffff':i%3===1?'#ffd36b':'#ff6fb5');p.r=this.tmp.c.r;p.g=this.tmp.c.g;p.b=this.tmp.c.b;}
  }
  celebrate(kind,t,tier=1){
    if(this.reduced)return;const rand=seeded((t*977)|0),palette=kind==='strike'?(tier>=3?['#ffd04a','#ffe066','#ffffff','#ff8a3d','#ff4fa8']:['#ffd04a','#ff4fa8','#8c5cff','#5fe3c8','#ffffff']):['#c8ff73','#8c5cff','#5fe3c8','#ffffff'];
    for(let i=0;i<(kind==='strike'?Math.min(PARTICLES,52+16*tier):36);i++){const p=this.particles[PARTICLES+(this.confettiCursor=(this.confettiCursor||0)+1)%PARTICLES],a=rand()*Math.PI*2,s=.8+rand()*2.2;
      Object.assign(p,{born:t+rand()*.12,life:1.3+rand()*.5,x:(rand()-.5)*2.4,y:.6+rand()*.6,z:-10.8+(rand()-.5)*1.6,vx:Math.cos(a)*s,vy:3.2+rand()*2.8,vz:Math.sin(a)*s*.5+.8,size:.8+rand()*.7,spin:rand()*12,confetti:true});
      this.tmp.c.set(palette[i%palette.length]);p.r=this.tmp.c.r;p.g=this.tmp.c.g;p.b=this.tmp.c.b;}
  }
  updateParticles(t){
    let sparks=0,confetti=0;const m=this.tmp.m,q=this.tmp.q,e=this.tmp.e,c=this.tmp.c;
    for(const p of this.particles){if(p.born<0)continue;const age=t-p.born;if(age<0)continue;if(age>p.life){p.born=-1;continue;}
      const u=age/p.life,drag=p.confetti?1.6:0,fall=p.confetti?2.4:9.8,k=drag?(1-Math.exp(-drag*age))/drag:age;
      const x=p.x+p.vx*k,y=Math.max(.03,p.y+p.vy*k-.5*fall*age*age),z=p.z+p.vz*k,size=p.size*(p.confetti?1:(1-u));
      e.set(p.spin*age,p.spin*age*.7,p.spin*.3);q.setFromEuler(e);m.compose(this.tmp.v.set(x,y,z),q,this.tmp.s.set(size,size,size));
      if(p.confetti){if(confetti<PARTICLES){this.confetti.setMatrixAt(confetti,m);this.confetti.setColorAt(confetti++,c.setRGB(p.r,p.g,p.b));}}
      else if(sparks<PARTICLES){const fade=1-u;this.sparks.setMatrixAt(sparks,m);this.sparks.setColorAt(sparks++,c.setRGB(p.r*fade,p.g*fade,p.b*fade));}}
    for(const [mesh,n] of [[this.sparks,sparks],[this.confetti,confetti]]){mesh.count=n;if(n){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}}
    const im=this.impact,ia=im?t-im.born:9;
    // A short warm kick on the rack, not a wash: the pins keep their shading through the hit.
    this.flash.intensity=im&&ia>=0&&ia<.35&&!this.reduced?(4+6*(im.power||.6))*Math.pow(1-ia/.35,2):0;
    this.ring.visible=!!im&&ia>=0&&ia<.5&&!this.reduced;if(this.ring.visible){const s=1+ia*7;this.ring.position.set(im.x,.025,im.z);this.ring.scale.set(s,1,s);this.mat.ring.opacity=.75*(1-ia/.5);}
  }
  updateBanner(t){
    const b=this.bannerState,sprite=this.banner;if(!b){sprite.visible=false;return;}
    const age=t-b.born;if(age<0||age>1.5){sprite.visible=false;if(age>1.5)this.bannerState=null;return;}
    if(sprite.material.map!==b.texture){sprite.material.map=b.texture;sprite.material.needsUpdate=true;}
    // Pop with overshoot, scaled by importance; a gutter word lands small and droops.
    const gutter=b.kind==='gutter',big=b.kind==='strike'?1+.07*Math.min(3,b.tier-1):gutter?.72:.92,over=b.kind==='strike'&&b.tier>=3?.24:.15;
    const pop=this.reduced?1:gutter?.9+.1*easeOut(age/.25):age<.18?.6+(.4+over)*easeOut(age/.18):age<.32?1+over-over*smooth((age-.18)/.14):1,fade=age>1.15?1-(age-1.15)/.35:1;
    const half=this.bannerAnchor(sprite.position),h=half*.5*pop*big;sprite.visible=true;sprite.material.opacity=clamp(fade,0,1);sprite.scale.set(h/.281,h,1);
    sprite.material.rotation=this.reduced?0:gutter?-.07*smooth(age/.7):b.kind==='strike'&&b.tier>=2?.035*Math.sin(age*9)*Math.max(0,1-age/.8):0;
    if(gutter&&!this.reduced)sprite.position.addScaledVector(this.camera.up,-half*.06*smooth(age/.9));
  }
  bannerAnchor(out){
    // Screen-anchored in the upper middle of the measured field (camera space): below the TV
    // shell's event toast (top ~20%), above the rack, never under the HUD. A gutter word sits low
    // over the empty lane, under the untouched rack.
    const D=6,half=D*Math.tan(this.camera.fov*Math.PI/360);out.set(0,half*(this.bannerState?.kind==='gutter'?-.5:.36),-D).applyMatrix4(this.camera.matrixWorld);return half;
  }
  updateMirrors(){
    // Mirror = reflect(y) * world pose. Pins in the pit or a ball in the gutter have no reflection.
    const put=(mirror,src,ok)=>{mirror.visible=src.visible&&ok;if(!mirror.visible)return;src.updateMatrix();mirror.matrix.multiplyMatrices(this.reflect,src.matrix);mirror.matrixWorldNeedsUpdate=true;};
    this.pins.forEach((pin,i)=>put(this.mirrorPins[i],pin,pin.position.y>-.05&&Math.abs(pin.position.x)<2.3&&pin.position.z>LANE_END));
    const b=this.ball.position;put(this.mirrorBall,this.ball,b.y>BALL_R*.8&&Math.abs(b.x)<2.1);
  }
  updateBlobs(){
    let n=0;const m=this.tmp.m,q=this.tmp.q.identity();
    const put=(x,z,size,strength)=>{if(strength<.05)return;m.compose(this.tmp.v.set(x,.006,z),q,this.tmp.s.set(size*strength,1,size*strength));this.blobs.setMatrixAt(n++,m);};
    for(const pin of this.pins)if(pin.visible){const up=pin.matrixWorld.elements[5];put(pin.position.x,pin.position.z,.62,clamp(up,0,1)*clamp(1-pin.position.y*2,0,1));}
    if(this.ball.visible)put(this.ball.position.x,this.ball.position.z,.95,clamp(1-(this.ball.position.y-START_Y)*1.5,0,1)*(this.ball.position.y>-.1?1:0));
    this.blobs.count=n;this.blobs.instanceMatrix.needsUpdate=true;
  }
  updateCamera(A,stage,age,dt){
    const P=this.camGoalPos,L=this.camGoalLook,aim=this.aimPose;
    P.copy(aim.pos);L.copy(aim.look);
    if(!this.reduced){
      // Follow: behind the ball with a little lag, dropping from 2.5 m to a low deck-level
      // pose as it nears the pins, so the rack fills the frame under the masking unit (the
      // sign's lower lip stays at the top edge instead of a cropped giant lane number).
      if(stage==='rolling'&&this.ball.visible){const b=this.ball.position,near=smooth((8-b.z)/16),z=Math.max(b.z+8.6,-1.6);P.set(b.x*.25,2.5-1.2*near,z);L.set(b.x*.35,.5-.08*near,Math.max(b.z-9,-10.7));
        // Blend in over the first half second so the release itself is seen from the aim view.
        const u=smooth((age-.15)/.6);P.lerpVectors(aim.pos,P,u);L.lerpVectors(aim.look,L,u);}
      else if(stage==='reveal'&&age<1.2){P.set(.8,2.75,-.4);L.set(0,.36,-12.2);} // low enough to see under the masking unit into the pit
      const sc=this.slowCam;if(sc&&performance.now()<sc.until&&(stage==='rolling'||stage==='reveal')){P.set(sc.side*3.3,1.05,-4.6);L.set(-sc.side*.15,.5,-10.6);if(!sc.cut){sc.cut=true;this.camPos.copy(P);this.camLook.copy(L);}}
    }
    if(this.reduced){this.camPos.copy(P);this.camLook.copy(L);}
    else{const k=1-Math.exp(-dt*(stage==='rolling'?3.4:2.6));this.camPos.lerp(P,k);this.camLook.lerp(L,k);}
    this.camera.position.copy(this.camPos);
    if(!this.reduced){
      // Strike/spare beat: a short push toward the deck while the banner lands.
      const b=this.bannerState,ba=b?this.renderT-b.born:9;if(ba>=0&&ba<.9&&b.kind!=='gutter'){const k=Math.sin(Math.PI*clamp(ba/.9,0,1))*(b.kind==='strike'?Math.min(.26,.13+.045*b.tier):.09);this.camera.position.lerp(this.camLook,k);}
    }
    this.camera.lookAt(this.camLook);
    // Pin crash micro-shake (TV camera only, wall-clock timed so slow motion keeps it short).
    const im=this.impact,wall=im?(performance.now()-im.wall)/1000:9;
    if(!this.reduced&&wall<.32){const a=.045*(im.power||.6)*Math.pow(1-wall/.32,2),w=wall*60;this.camera.position.x+=Math.sin(w*1.7)*a;this.camera.position.y+=Math.sin(w*2.3+1.1)*a*.7;this.camera.rotation.z+=Math.sin(w*1.3+.4)*a*.06;}
    const fov=aim.fov*(this.feel?.fovScale||1);if(Math.abs(this.camera.fov-fov)>1e-3){this.camera.fov=fov;this.camera.updateProjectionMatrix();}
  }
  // ---- host hooks --------------------------------------------------------------------
  event(e,s){
    this.extras?.event(e,s);this.feel?.event(e,s);
    if(e.kind==='throw'){this.throwSpin=e.input?.spin||0;return;}
    if(e.kind!=='roll'||this.seenEvents.has(e.id))return;this.seenEvents.add(e.id);if(this.seenEvents.size>64)this.seenEvents.delete(this.seenEvents.values().next().value);
    if(s.t-e.at>1.0)return; // a reconnecting screen or replayed packet never replays a celebration
    const p=s.players.find(x=>x.id===e.player),rolls=p?.frames?.at(-1)?.rolls||[],last=p?.frames?.length===s.frameCount,prev=rolls.slice(0,-1);
    const fresh=freshBefore(prev,last),kind=e.pins===10&&fresh?'strike':!fresh&&prev.length&&prev.at(-1)+e.pins===10?'spare':e.pins===0?'gutter':null;
    if(!kind)return;const tier=kind==='strike'?Math.max(1,strikeRun(p?.frames,s.frameCount)):1,gutter=!!s.physics?.gutter||this.feel?.state?.gutterToken===s.turnToken;
    this.bannerState={kind,tier,born:e.at,texture:this.bannerTexture(kind,tier,gutter)};if(kind==='gutter')return;
    this.celebrate(kind,e.at,tier);sound(tier>=3?'win':'confirm');
  }
  resize(w,h){
    // Fit the aim view to the measured field: launch spot, return hood and the full rack
    // with the masking unit edge, centred vertically. FOV is fixed for the whole turn.
    const aspect=w/h,C=this.aimPose.pos.set(0,3.4,26.5),cam=new THREE.PerspectiveCamera(30,aspect,.1,200);cam.position.copy(C);
    const pts=[[0,-.05,START_Z+.45],[-POSITION_SCALE-BALL_R,.1,START_Z],[POSITION_SCALE+BALL_R,.1,START_Z],[HOOD.x-.45,.2,HOOD.z],[0,3.45,-9.3],[-1.3,1.25,-11.75],[1.3,1.25,-11.75],[-2.4,0,-9.3],[2.4,0,-9.3]].map(p=>new THREE.Vector3(...p));
    const fit=pitch=>{cam.rotation.set(pitch,0,0);cam.updateMatrixWorld(true);const inv=cam.matrixWorldInverse;let top=-9,bottom=9,side=0;for(const p of pts){const v=this.tmp.v.copy(p).applyMatrix4(inv),d=-v.z;top=Math.max(top,v.y/d);bottom=Math.min(bottom,v.y/d);side=Math.max(side,Math.abs(v.x/d));}return {top,bottom,side};};
    let lo=-.6,hi=.1;for(let i=0;i<32;i++){const mid=(lo+hi)/2,f=fit(mid);if(f.top+f.bottom>0)lo=mid;else hi=mid;}
    const pitch=(lo+hi)/2,f=fit(pitch),tanV=Math.max(f.top,-f.bottom,f.side/aspect)*1.1;
    this.aimPose.fov=clamp(2*Math.atan(tanV)*180/Math.PI,12,70);
    this.aimPose.look.set(0,C.y+Math.tan(pitch)*30,C.z-30);
    this.camera.fov=this.aimPose.fov;
  }
  dispose(){
    this.feel?.dispose();this.feel=null;this.alley?.dispose();this.alley=null;this.extras?.dispose();this.extras=null;
    for(const o of [...(this.staticMeshes||[]),this.neighbourPins,...this.pins,...(this.mirrorPins||[]),this.mirrorBall,this.ball,this.blobs,this.sweep,this.guide,this.launchRing,this.sparks,this.confetti,this.ring,this.banner])if(o)this.scene.remove(o);
    for(const t of this.ballTextures?.values()||[])t.dispose();for(const t of this.bannerTextures.values())t.dispose();
    for(const x of this.disposables)x.dispose?.();this.disposables.clear();this.envTarget?.dispose();this.scene.environment=null;
  }
}
export function createBowlingScene(stage){return new BowlingScene(stage);}
