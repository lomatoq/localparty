// Pocket Strike alley environment: lit fascia signage above the masking units, a blurred
// reflection of the lane sign in the lacquer (real mirrored geometry, so it slides with the
// camera), a rebuilt ball return with house balls, a ball rack, lane dividers, ambient
// bowling on the neighbouring lanes and dust motes in the deck light.
// Purely visual and read-only: nothing here can change a roll, a pin count or a score.
// Ambient motion runs on the scene replay clock (server time), so a paused match freezes it.
// All meshes are built once, pools are bounded, dispose() removes and frees everything.
import * as THREE from './vendor/three.module.js';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';

const HOOD={x:-3.8,y:.64,z:12.15},RACK_END_Z=14.05,BALL_R=.33,LANE_END=-15.4;
const MASK={y:2.56,z:-9.29,w:6.9,h:1.62};
const RACK=[];for(let row=0;row<4;row++)for(let col=0;col<=row;col++)RACK.push({x:(col-row/2)*.72,z:-9.8-row*.65});
const AMBIENT=[{lane:0,x:-7.6,period:13.5,offset:4.2,color:'#ff7ad0'},{lane:1,x:7.6,period:17.2,offset:11.0,color:'#5fe3c8'}];
const MOTES=36;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=u=>{u=clamp(u,0,1);return u*u*(3-2*u);},easeOut=u=>1-Math.pow(1-clamp(u,0,1),3);
function seeded(seed){let s=seed>>>0;return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];}

export class BowlingAlley{
  constructor(scene){
    this.host=scene;this.scene=scene.scene;this.reduced=!!scene.reduced;this.objects=[];this.disposables=new Set();
    this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.q2=new THREE.Quaternion();this.v=new THREE.Vector3();this.v2=new THREE.Vector3();this.s=new THREE.Vector3(1,1,1);this.e=new THREE.Euler();this.c=new THREE.Color();
    this.furniture=new THREE.Group();this.buildFascia();this.buildReflection();this.buildReturn();this.buildRack();this.buildDividers();this.add(this.merge(this.furniture));this.furniture=null;this.buildAmbient();this.buildMotes();
    // The lane sign is repainted once the web fonts arrive: refresh its reflection with it.
    const paint=scene.paintMasks.bind(scene);scene.paintMasks=()=>{paint();try{this.paintReflection();}catch{}};this.restorePaint=()=>{scene.paintMasks=paint;};
  }
  track(x){this.disposables.add(x);return x;}
  add(o){this.scene.add(o);this.objects.push(o);return o;}
  tex(c,{srgb=true,repeat=null}={}){const t=this.track(new THREE.CanvasTexture(c));if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=this.host.anisotropy||1;if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);}return t;}
  // ---- fascia: lit signage band above the masking units ------------------------------
  buildFascia(){
    // 38 m wide, 1.3 m tall, directly above the masks. From the aim camera its lower edge
    // and both outer thirds show beside the TV header: a warm bulb marquee, neon signs
    // ("HEYPALS" / "BOWL") over lanes 7 and 9, lane numbers over every masking unit.
    const W=4096,H=144,[c,g]=canvas(W,H),X=x=>(x+19)/38*W;
    const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#07040d');bg.addColorStop(.55,'#160c26');bg.addColorStop(1,'#241338');g.fillStyle=bg;g.fillRect(0,0,W,H);
    // Panel seams and soft downlight washes from the ceiling cans.
    for(let i=0;i<=38;i++){g.fillStyle='rgba(255,255,255,.035)';g.fillRect(X(-19+i),0,2,H);}
    for(let x=-18;x<=18;x+=2.4){const r=g.createRadialGradient(X(x),0,2,X(x),0,90);r.addColorStop(0,'rgba(255,214,170,.22)');r.addColorStop(1,'rgba(255,214,170,0)');g.fillStyle=r;g.fillRect(X(x)-90,0,180,H);}
    // Neon helper: a soft wide glow, a coloured tube and a white-hot core.
    const neon=(draw,color,width=7)=>{g.save();g.lineJoin=g.lineCap='round';g.shadowColor=color;g.shadowBlur=26;g.strokeStyle=color;g.globalAlpha=.55;g.lineWidth=width*2.2;draw();g.stroke?.();g.globalAlpha=1;g.shadowBlur=14;g.lineWidth=width;draw();g.shadowBlur=0;g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=width*.36;draw();g.restore();};
    const neonText=(text,x,y,size,color)=>{g.save();g.font=`italic 900 ${size}px KardiaFatRunner, "Arial Black", sans-serif`;g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
      g.shadowColor=color;g.shadowBlur=30;g.strokeStyle=color;g.lineWidth=10;g.globalAlpha=.6;g.strokeText(text,x,y);g.globalAlpha=1;g.shadowBlur=12;g.lineWidth=5;g.strokeText(text,x,y);g.shadowBlur=0;g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=1.6;g.strokeText(text,x,y);g.restore();};
    neonText('HEYPALS',X(-9.6),60,72,'#ff4fa8');neonText('BOWL',X(9.9),60,76,'#5fe3c8');
    neonText('LANES',X(-16.3),60,52,'#8c5cff');neonText('ARCADE',X(16.2),60,52,'#ffb347');
    // Neon pin (left) and ball (right) icons next to the signs.
    const pin=(cx,cy,s,color)=>neon(()=>{g.beginPath();g.moveTo(cx,cy+s*.55);g.bezierCurveTo(cx-s*.34,cy+s*.5,cx-s*.32,cy+s*.05,cx-s*.12,cy-s*.12);g.bezierCurveTo(cx-s*.2,cy-s*.32,cx-s*.16,cy-s*.55,cx,cy-s*.56);g.bezierCurveTo(cx+s*.16,cy-s*.55,cx+s*.2,cy-s*.32,cx+s*.12,cy-s*.12);g.bezierCurveTo(cx+s*.32,cy+s*.05,cx+s*.34,cy+s*.5,cx,cy+s*.55);g.stroke();},color,5);
    const ball=(cx,cy,r,color)=>neon(()=>{g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.moveTo(cx-r*.18+5,cy-r*.32);g.arc(cx-r*.18,cy-r*.32,5,0,Math.PI*2);g.moveTo(cx+r*.2+5,cy-r*.3);g.arc(cx+r*.2,cy-r*.3,5,0,Math.PI*2);g.moveTo(cx+5,cy+r*.02);g.arc(cx,cy+r*.02,5,0,Math.PI*2);g.stroke();},color,5);
    pin(X(-12.3),58,86,'#ffd36b');pin(X(-6.8),58,86,'#ffd36b');ball(X(7.1),58,36,'#ff4fa8');ball(X(12.6),58,36,'#ff4fa8');
    // Stars between signs.
    const star=(cx,cy,r,color)=>neon(()=>{g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;g.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}g.closePath();g.stroke();},color,4);
    for(const x of [-13.9,-4.6,4.6,14.1])star(X(x),58,18,'#c98cff');
    // Marquee bulbs along the lower edge (visible across the whole width under the header).
    g.fillStyle='#1b0f2a';g.fillRect(0,H-26,W,26);g.fillStyle='rgba(255,79,168,.8)';g.fillRect(0,H-27,W,2);
    for(let x=10;x<W;x+=26){const r=g.createRadialGradient(x,H-13,0,x,H-13,11);r.addColorStop(0,'rgba(255,246,220,1)');r.addColorStop(.35,'rgba(255,200,120,.85)');r.addColorStop(1,'rgba(255,160,80,0)');g.fillStyle=r;g.fillRect(x-11,H-24,22,22);}
    this.fasciaMat=this.track(new THREE.MeshBasicMaterial({map:this.tex(c),fog:false}));
    const f=this.add(new THREE.Mesh(this.track(new THREE.PlaneGeometry(38,1.34)),this.fasciaMat));f.position.set(0,3.37+.67,-9.27);this.fascia=f;
    // A thin chrome lip where the fascia meets the masks.
    this.lipGeo=this.track(new THREE.BoxGeometry(38,.05,.08));
  }
  // ---- lane reflection of the masking-unit sign ----------------------------------------
  buildReflection(){
    // The sign mirrored in y=0, drawn only on lane-8 pixels (stencil written by the lane),
    // additive, before pins and ball. Blurred and faded toward the far edge like an
    // oiled-lane reflection; it moves correctly with every camera because it is geometry.
    const [c,g]=canvas(512,128);this.reflCanvas=c;this.reflCtx=g;this.reflTex=this.tex(c);
    const mat=o=>this.track(new THREE.MeshBasicMaterial({transparent:false,blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false,toneMapped:false,fog:false,side:THREE.DoubleSide,
      stencilWrite:true,stencilRef:1,stencilFunc:THREE.EqualStencilFunc,stencilZPass:THREE.KeepStencilOp,stencilFail:THREE.KeepStencilOp,stencilZFail:THREE.KeepStencilOp,...o}));
    this.reflMat=mat({map:this.reflTex,color:new THREE.Color(.34,.31,.36)});
    // Shown only near the pin end: each fragment finds where its view ray meets the lane (y=0)
    // and fades out unless that point is past z -1 (full by z -5). From the aim camera the
    // reflection would land on the arrows mid-lane, so there it stays invisible.
    this.reflMat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vReflW;').replace('#include <project_vertex>','#include <project_vertex>\nvReflW=(modelMatrix*vec4(transformed,1.)).xyz;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vReflW;').replace('#include <opaque_fragment>','{float k=cameraPosition.y/max(1e-3,cameraPosition.y-vReflW.y);float lz=cameraPosition.z+(vReflW.z-cameraPosition.z)*k;diffuseColor.a*=smoothstep(-1.,-5.,lz);}\n#include <opaque_fragment>');};
    this.reflMat.customProgramCacheKey=()=>'lane-sign-reflection';
    // Smeared along the lane (glossy, not a mirror): the image is stretched 1.8x downward from
    // the mask's lower edge, which lands it closer to the viewer on the lane.
    const SMEAR=1.8,geo=this.track(new THREE.PlaneGeometry(MASK.w,MASK.h*SMEAR));this.smear=SMEAR;
    this.refl=this.add(new THREE.Mesh(geo,this.reflMat));this.refl.position.set(0,-(MASK.y-MASK.h/2)-MASK.h*SMEAR/2,MASK.z);this.refl.scale.y=-1;this.refl.renderOrder=1;this.refl.frustumCulled=false;
    this.paintReflection();
  }
  // Soft glossy reflection of a sign canvas: heavy two-step blur (canvas filters are not
  // reliable on WebKit), a warm bulb row at the lower edge, faded away from the lane edge and
  // at both sides so it reads as sheen in the lacquer, never as a decal.
  blurInto(src,g,W,H,bulbs){
    const [sc,sg]=this.small||=canvas(96,24),[mc,mg]=this.mid||=canvas(192,48); // lighter blur: a crisper sheen
    sg.clearRect(0,0,96,24);sg.drawImage(src,0,0,96,24);mg.clearRect(0,0,192,48);mg.imageSmoothingEnabled=true;mg.drawImage(sc,0,0,192,48);
    g.clearRect(0,0,W,H);g.globalCompositeOperation='source-over';g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(mc,0,0,W,H);
    if(bulbs)for(let x=8;x<W;x+=W/24){const r=g.createRadialGradient(x,H-5,0,x,H-5,H*.16);r.addColorStop(0,'rgba(255,226,180,.55)');r.addColorStop(1,'rgba(255,200,140,0)');g.fillStyle=r;g.fillRect(x-H*.16,H-H*.2,H*.32,H*.2);}
    g.globalCompositeOperation='destination-in';const fade=g.createLinearGradient(0,0,0,H);fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(.5,'rgba(0,0,0,.35)');fade.addColorStop(.9,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=fade;g.fillRect(0,0,W,H);
    const side=g.createLinearGradient(0,0,W,0);side.addColorStop(0,'rgba(0,0,0,0)');side.addColorStop(.18,'rgba(0,0,0,1)');side.addColorStop(.82,'rgba(0,0,0,1)');side.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=side;g.fillRect(0,0,W,H);
    g.globalCompositeOperation='source-over';
  }
  paintReflection(){
    const src=this.host.maskCanvases?.find(m=>m.primary)?.c;if(!src)return;
    this.blurInto(src,this.reflCtx,512,128,true);this.reflTex.needsUpdate=true;
  }
  // ---- ball return and rack ------------------------------------------------------------
  houseBall(color,r=BALL_R){
    this.ballMats||=new Map();let mat=this.ballMats.get(color);
    if(!mat){mat=this.track(new THREE.MeshPhysicalMaterial({map:this.host.ballTexture(color),roughness:.22,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:1.1}));this.ballMats.set(color,mat);}
    this.ballGeo||=this.track(new THREE.SphereGeometry(1,32,20));const m=new THREE.Mesh(this.ballGeo,mat);m.scale.setScalar(r);m.castShadow=false;m.receiveShadow=true;return m;
  }
  buildReturn(){
    // Replace the scene's box-and-half-pipe return with a sculpted hood: a rounded pod with
    // a chrome-trimmed mouth, a pink belt line, a plinth and chrome rails with two house balls.
    const H=this.host,hide=new Set([H.mat.returnBody,H.mat.hole,H.mat.chrome]);for(const m of H.staticMeshes||[])if(hide.has(m.material))m.visible=false;
    const g=this.returnGroup=new THREE.Group();
    const K=this.kit=this.kit||{body:this.track(new THREE.MeshPhysicalMaterial({color:'#3a1f6e',roughness:.24,metalness:.15,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.2})),
      dark:this.track(new THREE.MeshStandardMaterial({color:'#120a1c',roughness:.55,metalness:.3})),chrome:this.track(new THREE.MeshStandardMaterial({color:'#e4e0f2',roughness:.16,metalness:1})),
      belt:this.track(new THREE.MeshStandardMaterial({color:'#000000',emissive:'#ff4fa8',emissiveIntensity:1.6}))};
    const {body,dark,chrome,belt}=K;
    const mouth=this.track(new THREE.MeshBasicMaterial({color:'#050308'}));
    // Pod: a capsule lying along z, its front cap trimmed by the mouth ring.
    // Pod: a capsule lying along z; its front cap sits just behind the black mouth disc.
    const pod=new THREE.Mesh(this.track(new THREE.CapsuleGeometry(.5,.8,10,28).rotateX(Math.PI/2)),body);pod.position.set(HOOD.x,HOOD.y,HOOD.z-1.05);pod.castShadow=true;g.add(pod);
    const ring=new THREE.Mesh(this.track(new THREE.TorusGeometry(.43,.07,14,40)),chrome);ring.position.set(HOOD.x,HOOD.y,HOOD.z-.04);g.add(ring);
    const hole=new THREE.Mesh(this.track(new THREE.CircleGeometry(.44,36)),mouth);hole.position.set(HOOD.x,HOOD.y,HOOD.z-.06);g.add(hole);
    const collar=new THREE.Mesh(this.track(new THREE.CylinderGeometry(.5,.5,.12,32,1,true).rotateX(Math.PI/2)),body);collar.position.set(HOOD.x,HOOD.y,HOOD.z-.12);g.add(collar);
    const band=new THREE.Mesh(this.track(new THREE.TorusGeometry(.505,.02,8,48)),belt);band.position.set(HOOD.x,HOOD.y,HOOD.z-.85);g.add(band);
    const plinth=new THREE.Mesh(this.track(new THREE.BoxGeometry(1.06,.2,1.9)),dark);plinth.position.set(HOOD.x,.1,HOOD.z-1.0);plinth.receiveShadow=true;g.add(plinth);
    // Rack: a dark tray with chrome rails from the hood to an end bumper.
    const lip=new THREE.Mesh(this.lipGeo,chrome);lip.position.set(0,3.39,-9.24);g.add(lip);
    const z0=HOOD.z-.1,z1=RACK_END_Z+1.62,len=z1-z0,zm=(z0+z1)/2;
    const tray=new THREE.Mesh(this.track(new THREE.BoxGeometry(.66,.22,len)),body);tray.position.set(HOOD.x,.11,zm);tray.receiveShadow=true;g.add(tray);
    for(const s of [-1,1]){const rail=new THREE.Mesh(this.track(new THREE.CylinderGeometry(.034,.034,len,10).rotateX(Math.PI/2)),chrome);rail.position.set(HOOD.x+s*.16,.335,zm);g.add(rail);
      const post=new THREE.Mesh(this.track(new THREE.CylinderGeometry(.03,.03,.14,8)),chrome);for(const z of [z0+.3,zm,z1-.15]){const p=post.clone();p.position.set(HOOD.x+s*.16,.27,z);g.add(p);}}
    const bumper=new THREE.Mesh(this.track(new THREE.CapsuleGeometry(.08,.42,6,12).rotateZ(Math.PI/2)),belt);bumper.position.set(HOOD.x,.42,z1-.04);g.add(bumper);
    // Two house balls waiting behind the bowler's own ball.
    for(const [color,dz] of [['#ff4fa8',.7],['#5fe3c8',1.36]]){const b=this.houseBall(color);b.position.set(HOOD.x,.3+BALL_R*.98,RACK_END_Z+dz);b.rotation.set(dz*2,dz*3,0);g.add(b);}
    this.furniture.add(g);
  }
  // Static furniture: one draw per material instead of one per part.
  merge(group){
    group.updateMatrixWorld(true);const byMat=new Map();
    group.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.index?o.geometry.clone():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);for(const k of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(k))geo.deleteAttribute(k);(byMat.get(o.material)||byMat.set(o.material,[]).get(o.material)).push({geo,cast:o.castShadow});});
    const out=new THREE.Group();
    for(const [mat,list] of byMat){if(list.some(x=>!x.geo.index))for(const x of list)if(x.geo.index){const n=x.geo.toNonIndexed();x.geo.dispose();x.geo=n;}const geo=this.track(mergeGeometries(list.map(x=>x.geo),false));for(const x of list)x.geo.dispose();const mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=true;mesh.castShadow=list.some(x=>x.cast);mesh.matrixAutoUpdate=false;out.add(mesh);}
    return out;
  }
  buildRack(){
    // A two-tier house-ball rack between lanes 8 and 9 at the approach (bottom-right of the
    // aim view), mirrored in form to the return on the left.
    const g=this.rackGroup=new THREE.Group(),x=3.85,Z=9.9-13.5; // whole rack sits beside the arrows
    const {dark:frame,chrome,body:led}=this.kit;
    const base=new THREE.Mesh(this.track(new THREE.BoxGeometry(.82,.16,3.3)),frame);base.position.set(x,.08,13.5+Z);g.add(base);
    const strip=new THREE.Mesh(this.track(new THREE.BoxGeometry(.84,.025,3.32)),led);strip.position.set(x,.165,13.5+Z);g.add(strip);
    for(const [y,zz] of [[.42,0],[1.02,.2]]){for(const s of [-1,1]){const rail=new THREE.Mesh(this.track(new THREE.CylinderGeometry(.03,.03,3.1,10).rotateX(Math.PI/2)),chrome);rail.position.set(x+s*.15,y,13.5+zz+Z);g.add(rail);}
      const shelf=new THREE.Mesh(this.track(new THREE.BoxGeometry(.5,.05,3.1)),frame);shelf.position.set(x,y-.12,13.5+zz+Z);g.add(shelf);}
    for(const z of [12.05,14.95]){for(const s of [-1,1]){const post=new THREE.Mesh(this.track(new THREE.CylinderGeometry(.035,.035,1.1,10)),chrome);post.position.set(x+s*.22,.62,z+Z);g.add(post);}}
    const colors=['#ffd04a','#8c5cff','#ff4fa8','#5fe3c8','#ff7a3d'];
    [[.42,12.6],[.42,13.27],[.42,13.94],[.42,14.6],[1.02,12.85],[1.02,13.6],[1.02,14.35]].forEach(([y,z],i)=>{const b=this.houseBall(colors[i%colors.length],.3);b.position.set(x,y+.28,z+Z);b.rotation.set(i*1.3,i*2.1,i*.7);g.add(b);});
    this.furniture.add(g);
  }
  buildDividers(){
    // Glossy capping between lanes with a thin LED line, so the gaps read as furniture,
    // not as holes into the dark.
    const mat=this.track(new THREE.MeshPhysicalMaterial({color:'#1d1230',roughness:.3,metalness:.25,clearcoat:.9,clearcoatRoughness:.12}));
    const led=this.track(new THREE.MeshBasicMaterial({color:new THREE.Color('#b78cff').multiplyScalar(.9),toneMapped:false}));
    const parts=[];
    for(const [x,z0,z1] of [[-3.8,-9.1,10.0],[3.8,-9.1,7.9],[3.8,11.75,16],[-11.4,-9.1,15.8],[11.4,-9.1,15.8]]){const len=z1-z0,zm=(z0+z1)/2;
      const top=new THREE.Mesh(this.track(new THREE.BoxGeometry(.9,.14,len)),mat);top.position.set(x,.03,zm);top.receiveShadow=true;parts.push(top);
      const line=new THREE.Mesh(this.track(new THREE.BoxGeometry(.035,.01,len)),led);line.position.set(x,.105,zm);parts.push(line);}
    for(const p of parts)this.furniture.add(p);
  }
  // ---- neighbour lanes: ambient bowlers --------------------------------------------------
  buildAmbient(){
    // Lanes 7 and 9 get an occasional house ball: it rolls, knocks a seeded share of the
    // rack over, the dead wood drops away and the machine lowers a fresh rack.
    this.ambient=AMBIENT.map(a=>{const ball=this.houseBall(a.color);ball.visible=false;ball.castShadow=true;this.add(ball);return {...a,ball,cycle:-1,plan:null,prev:new THREE.Vector3()};});
    this.pinBase=new THREE.Matrix4();this.ambientDirty=false;
  }
  ambientPlan(a,cycle){
    const rand=seeded(a.lane*7919+cycle*104729+17),x0=(rand()-.5)*1.6,target=(rand()-.5)*.9,strike=rand()<.35;
    const hit=RACK.map(p=>{const d=Math.abs(p.x-target)+(Math.abs(p.z+9.8))*.12,reach=strike?9:.55+rand()*.9;return d<reach&&rand()<(strike?1:.85);});
    const pins=RACK.map((p,i)=>{const dir=Math.atan2(p.x-target+(rand()-.5)*.6,-1),slide=.3+rand()*.9;return {hit:hit[i],dir,slide,roll:(rand()-.5)*2,delay:.02+Math.abs(p.z+9.8)*.09+rand()*.06,fall:.32+rand()*.18};});
    return {x0,target,pins,speed:9.5+rand()*2};
  }
  updateAmbient(t){
    const host=this.host,mesh=host.neighbourPins;if(!mesh)return;
    if(this.reduced){for(const a of this.ambient)a.ball.visible=false;return;}
    for(const a of this.ambient){
      const local=t+a.offset,cycle=Math.floor(local/a.period),c=local-cycle*a.period;
      if(cycle!==a.cycle){a.cycle=cycle;a.plan=this.ambientPlan(a,cycle);}
      const P=a.plan,rollT=(13+9.8)/P.speed,impactT=1.2+rollT;
      // Ball: 1.2 s idle, then rolls with a gentle hook into the pit.
      const bt=c-1.2;let visible=bt>0&&bt<impactT+1.2;
      if(visible){const z=13-P.speed*bt,u=clamp((13-z)/22.8,0,1),x=a.x+P.x0+(P.target-P.x0)*u*u;let y=BALL_R;
        if(z<LANE_END){y=BALL_R-(LANE_END-z)*1.4;if(z<LANE_END-1.2)visible=false;}
        a.ball.position.set(x,y,z);const d=a.prev.distanceTo(a.ball.position);if(d>1e-4&&d<2){this.q.setFromAxisAngle(this.v.set(-1,0,0),d/BALL_R);a.ball.quaternion.premultiply(this.q);}a.prev.copy(a.ball.position);}
      a.ball.visible=visible;
      // Pins: tumble after the impact, rest, drop into the pit, a fresh rack comes down.
      const it=c-impactT,base=a.lane*10;
      for(let i=0;i<10;i++){const p=RACK[i],pp=P.pins[i];let x=a.x+p.x,y=0,z=p.z;this.q.identity();
        const reset=c>impactT+4.2,lower=c>impactT+5.0;
        if(pp.hit&&it>pp.delay&&!reset){const u=(it-pp.delay)/pp.fall,k=easeOut(u),slide=pp.slide*easeOut((it-pp.delay)/1.1);
          x+=Math.sin(pp.dir)*slide;z+=Math.cos(pp.dir)*slide*.9-slide*.2;y=Math.sin(Math.min(1,u)*Math.PI)*.18*(1-clamp(u-1,0,1));
          this.v.set(Math.cos(pp.dir),0,-Math.sin(pp.dir));this.q.setFromAxisAngle(this.v,(Math.PI/2)*Math.min(1,k*1.04));
          this.q2.setFromAxisAngle(this.v2.set(0,1,0),pp.roll*clamp(it-pp.delay-.3,0,1.2));this.q.premultiply(this.q2);y+=.11*Math.min(1,k);}
        else if(pp.hit&&reset&&!lower){y=-3;} // swept into the pit, out of view under the mask
        else if(pp.hit&&lower){const u=smooth((c-impactT-5.0)/.7);y=1.3*(1-u);}
        this.m.compose(this.v.set(x,y,z),this.q,this.s.set(1,1,1));mesh.setMatrixAt(base+i,this.m);}
    }
    mesh.instanceMatrix.needsUpdate=true;
  }
  // ---- dust motes in the deck light ----------------------------------------------------
  buildMotes(){
    const [c,g]=canvas(32,32),r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.4,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32);
    const mat=this.track(new THREE.MeshBasicMaterial({map:this.tex(c),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false}));
    this.quad=this.track(new THREE.PlaneGeometry(1,1));
    this.motes=new THREE.InstancedMesh(this.quad,mat,MOTES);this.motes.frustumCulled=false;this.motes.renderOrder=5;this.motes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const rand=seeded(313);this.moteData=Array.from({length:MOTES},(_,i)=>({x:(rand()-.5)*5,y:.25+rand()*1.5,z:-12.2+rand()*3.4+(i%4===0?rand()*8:0),p:rand()*6.3,s:.022+rand()*.03,w:.15+rand()*.25}));
    for(let i=0;i<MOTES;i++)this.motes.setColorAt(i,this.c.setRGB(0,0,0));this.add(this.motes);
  }
  updateMotes(t){
    const camQ=this.host.camera.quaternion,motion=this.reduced?0:1;let n=0;
    for(const d of this.moteData){const a=d.p+t*d.w*motion,x=d.x+Math.sin(a)*.35,y=d.y+Math.sin(a*1.3+d.p)*.18+((t*.05*motion+d.p)%1)*.1,z=d.z+Math.cos(a*.8)*.25;
      const tw=.5+.5*Math.sin(t*1.9*motion+d.p*5),inLight=Math.exp(-Math.pow((x)/2.4,2));
      this.m.compose(this.v.set(x,y,z),camQ,this.s.set(d.s,d.s,d.s));this.motes.setMatrixAt(n,this.m);this.motes.setColorAt(n++,this.c.setRGB(1,.9,.75).multiplyScalar(.55*tw*inLight));}
    this.motes.count=n;this.motes.instanceMatrix.needsUpdate=true;this.motes.instanceColor.needsUpdate=true;
  }
  // ---- per frame -------------------------------------------------------------------------
  update(A,stage,age,t,dt){
    this.updateAmbient(t);this.updateMotes(t);
    const x=this.host.extras,dOp=x?.display?.visible?x.displayMat.opacity:0;
    // While the score screen covers the sign, its sheen dims (the screen is darker than the art).
    this.reflMat.color.setRGB(.17,.15,.18).multiplyScalar(1-.6*dOp);
  }
  dispose(){
    this.restorePaint?.();const H=this.host;for(const m of H.staticMeshes||[])m.visible=true;
    for(const o of this.objects)this.scene.remove(o);this.objects.length=0;
    for(const x of this.disposables)x.dispose?.();this.disposables.clear();
  }
}
export function createBowlingAlley(scene){return new BowlingAlley(scene);}
