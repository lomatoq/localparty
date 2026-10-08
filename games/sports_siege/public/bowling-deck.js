// Pocket Strike pin-deck architecture: everything behind and above the pins. Chrome-framed
// masking units with neon piping, a ribbed soffit with downlight cans (open where the
// pinsetter table and the sweep bar pass), padded kickback walls with chrome cap rails and
// lit end posts, a folded velvet pit curtain, trimmed pit side walls, and machined arms and
// end caps on the sweep bar.
// Purely visual and static (no per-frame work except nothing): built once, merged per
// material, disposed in dispose(). Nothing here can change a roll, a pin count or a score.
import * as THREE from './vendor/three.module.js';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';

const LANES=[-15.2,-7.6,0,7.6,15.2],MASK={y:2.56,z:-9.29,w:6.9,h:1.62},LANE_END=-15.4;
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];}
function rr(w,h,r,path=new THREE.Shape()){const x=-w/2,y=-h/2;path.moveTo(x+r,y);path.lineTo(x+w-r,y);path.quadraticCurveTo(x+w,y,x+w,y+r);path.lineTo(x+w,y+h-r);path.quadraticCurveTo(x+w,y+h,x+w-r,y+h);path.lineTo(x+r,y+h);path.quadraticCurveTo(x,y+h,x,y+h-r);path.lineTo(x,y+r);path.quadraticCurveTo(x,y,x+r,y);return path;}
function frameShape(ow,oh,or,iw,ih,ir){const s=rr(ow,oh,or);s.holes.push(rr(iw,ih,ir,new THREE.Path()));return s;}

export class BowlingDeck{
  constructor(scene){
    this.host=scene;this.scene=scene.scene;this.objects=[];this.disposables=new Set();this.parts=new THREE.Group();
    const T=x=>this.track(x);
    this.M={
      chrome:T(new THREE.MeshStandardMaterial({color:'#d9d4ea',roughness:.18,metalness:1,envMapIntensity:1.3})),
      gunmetal:T(new THREE.MeshStandardMaterial({color:'#4a4460',roughness:.32,metalness:.85,envMapIntensity:1.1})),
      pink:T(new THREE.MeshBasicMaterial({color:new THREE.Color('#ff4fa8').multiplyScalar(1.25),toneMapped:false})),
      violet:T(new THREE.MeshBasicMaterial({color:new THREE.Color('#9a6bff').multiplyScalar(1.25),toneMapped:false})),
      can:T(new THREE.MeshBasicMaterial({color:new THREE.Color('#ffe3c0').multiplyScalar(1.5)})),
    };
    this.buildBackdrop();this.buildMaskFrames();this.buildSoffit();this.buildKickbacks();this.buildCurtain();this.buildPit();
    this.add(this.merge(this.parts));this.parts=null;
    this.buildSweepArms();
    // The extras' additive curtain glow now sits just in front of the velvet folds.
    if(scene.extras?.pitCurtain)scene.extras.pitCurtain.position.z=-16.36;
  }
  track(x){this.disposables.add(x);return x;}
  add(o){this.scene.add(o);this.objects.push(o);return o;}
  put(geo,mat,x=0,y=0,z=0,rx=0,ry=0,rz=0,cast=false){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=cast;this.parts.add(m);return m;}
  tex(c,srgb=true){const t=this.track(new THREE.CanvasTexture(c));if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=this.host.anisotropy||1;return t;}
  // ---- backdrop: back wall and machine housings ---------------------------------------
  buildBackdrop(){
    // Back wall (scene box, 60 x 9 m at z -17.4): dark plum with lit pilasters exactly in the
    // gaps between the pinsetter housings (x = +-3.8, +-11.4, +-19), so the slivers of wall seen
    // between lanes glow with depth instead of reading as black holes; a violet LED band, a
    // HeyPals wordmark and a star field above. Housings get ribbed machine panels.
    const H=this.host,W=2048,Hh=512,[c,g]=canvas(W,Hh),[e,eg]=canvas(W,Hh),X=x=>(x+30)/60*W,Y=y=>(7.7-y)/9*Hh;
    const bg=g.createLinearGradient(0,0,0,Hh);bg.addColorStop(0,'#0c0716');bg.addColorStop(.6,'#1b1030');bg.addColorStop(1,'#120a1e');g.fillStyle=bg;g.fillRect(0,0,W,Hh);eg.fillStyle='#000';eg.fillRect(0,0,W,Hh);
    for(let x=0;x<W;x+=34){g.fillStyle='rgba(255,255,255,.025)';g.fillRect(x,0,2,Hh);}
    for(const k of [g,eg])for(const px of [-19,-11.4,-3.8,3.8,11.4,19]){const x=X(px),gr=k.createLinearGradient(x-22,0,x+22,0);gr.addColorStop(0,'rgba(140,92,255,0)');gr.addColorStop(.5,px%2?'rgba(255,120,200,.95)':'rgba(170,130,255,.95)');gr.addColorStop(1,'rgba(140,92,255,0)');k.fillStyle=gr;k.fillRect(x-22,Y(4.4),44,Y(-1.3)-Y(4.4));}
    for(const k of [g,eg]){k.fillStyle='rgba(160,110,255,.9)';k.fillRect(0,Y(3.75),W,5);}
    const rnd=(i=>()=>(i=(i*16807)%2147483647)/2147483647)(7);for(let i=0;i<220;i++){const x=rnd()*W,y=rnd()*Y(4.2),r=rnd()*1.6+.4;for(const k of [g,eg]){k.fillStyle=`rgba(255,240,255,${.25+rnd()*.5})`;k.beginPath();k.arc(x,y,r,0,7);k.fill();}}
    for(const k of [g,eg]){k.save();k.font='italic 900 120px KardiaFatRunner, "Arial Black", sans-serif';k.textAlign='center';k.textBaseline='middle';k.shadowColor='#ff4fa8';k.shadowBlur=30;k.strokeStyle='#ff6fbf';k.lineWidth=6;k.strokeText('HEYPALS LANES',W/2,Y(6.1));k.restore();}
    const wm=H.mat.wall;wm.map=this.tex(c);wm.emissiveMap=this.tex(e);wm.emissive=new THREE.Color('#ffffff');wm.emissiveIntensity=.85;wm.color.set('#ffffff');wm.needsUpdate=true;
    // Housing boxes: ribbed gunmetal panels with a thin lit seam (shared with the sweep bar's sides).
    const [hc,hg]=canvas(256,128);hg.fillStyle='#1c1528';hg.fillRect(0,0,256,128);for(let x=0;x<256;x+=32){hg.fillStyle='#2a2140';hg.fillRect(x+2,6,26,116);hg.fillStyle='rgba(255,255,255,.07)';hg.fillRect(x+2,6,26,2);}hg.fillStyle='rgba(183,140,255,.55)';hg.fillRect(0,124,256,3);
    const hm=H.mat.housing,ht=this.tex(hc);ht.wrapS=ht.wrapT=THREE.RepeatWrapping;ht.repeat.set(3,1);hm.map=ht;hm.color.set('#ffffff');hm.metalness=.45;hm.roughness=.45;hm.needsUpdate=true;
  }
  // ---- masking units -----------------------------------------------------------------
  buildMaskFrames(){
    // A bevelled chrome frame around every sign panel, with pink neon piping just inside it.
    const frame=this.track(new THREE.ExtrudeGeometry(frameShape(7.08,1.76,.12,MASK.w,MASK.h,.05),{depth:.1,bevelEnabled:true,bevelThickness:.022,bevelSize:.016,bevelSegments:2,curveSegments:6}));
    const pipe=this.track(new THREE.ShapeGeometry(frameShape(MASK.w-.01,MASK.h-.01,.05,MASK.w-.07,MASK.h-.07,.04),6));
    for(const x of LANES){this.put(frame,this.M.chrome,x,MASK.y,MASK.z-.05);this.put(pipe,x===0?this.M.pink:this.M.violet,x,MASK.y,MASK.z+.012);}
  }
  buildSoffit(){
    // Underside of the masking unit (seen from the low follow, reset and roll cameras): ribbed
    // gunmetal panels with warm downlight cans. Left open where the pinsetter table drops
    // (z -9.6..-12.15) and along the sweep bar's lift line (z -14.6..-15.1).
    const [c,g]=canvas(256,256);g.fillStyle='#17111f';g.fillRect(0,0,256,256);for(let x=0;x<256;x+=16){g.fillStyle='#231a30';g.fillRect(x,0,9,256);g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x,0,1,256);}
    const map=this.tex(c);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(4,4);
    const mat=this.track(new THREE.MeshStandardMaterial({map,roughness:.55,metalness:.5,side:THREE.DoubleSide}));this.soffitMat=mat;
    const Y=2.03,piece=(x0,x1,z0,z1)=>{const w=x1-x0,d=z0-z1,geo=this.track(new THREE.PlaneGeometry(w,d).rotateX(Math.PI/2));this.put(geo,mat,(x0+x1)/2,Y,(z0+z1)/2);};
    piece(-3.1,-2.42,-9.62,-16.3);piece(2.42,3.1,-9.62,-16.3);piece(-2.42,2.42,-12.15,-14.6);piece(-2.42,2.42,-15.1,-16.3);
    // Opening trims (chrome) so the cut-outs read as machined slots, not holes.
    const trimX=this.track(new THREE.BoxGeometry(4.84,.04,.05)),trimZ=this.track(new THREE.BoxGeometry(.05,.04,2.55));
    for(const z of [-12.15,-14.6,-15.1])this.put(trimX,this.M.chrome,0,Y-.01,z);for(const x of [-2.42,2.42])this.put(trimZ,this.M.chrome,x,Y-.01,-10.88);
    const can=this.track(new THREE.CircleGeometry(.09,20).rotateX(Math.PI/2)),bezel=this.track(new THREE.RingGeometry(.09,.13,24).rotateX(Math.PI/2));
    const spots=[];for(const x of [-2.76,2.76])for(let z=-10.2;z>-16;z-=1.15)spots.push([x,z]);for(const x of [-1.6,0,1.6])for(const z of [-13.4,-15.75])spots.push([x,z]);
    for(const [x,z] of spots){this.put(can,this.M.can,x,Y-.012,z);this.put(bezel,this.M.chrome,x,Y-.011,z);}
  }
  // ---- kickbacks ---------------------------------------------------------------------
  kickbackTextures(){
    // Padded side walls: two rows of quilted pads with chrome studs, a low LED line and
    // chevrons pointing to the pit. The emissive map carries only the LED and chevrons.
    const W=1024,H=176,[c,g]=canvas(W,H),[e,eg]=canvas(W,H);
    const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#2a1840');bg.addColorStop(1,'#120a1c');g.fillStyle=bg;g.fillRect(0,0,W,H);eg.fillStyle='#000';eg.fillRect(0,0,W,H);
    const padW=64,padH=62;
    for(let row=0;row<2;row++)for(let x=4;x<W;x+=padW){const y=8+row*(padH+6),r=g.createRadialGradient(x+padW*.42,y+padH*.35,4,x+padW/2,y+padH/2,padW*.7);r.addColorStop(0,'#5a3a86');r.addColorStop(.6,'#3a2358');r.addColorStop(1,'#1d1130');g.fillStyle=r;g.beginPath();g.roundRect?.(x+2,y,padW-6,padH,12);g.fill();
      g.strokeStyle='rgba(255,255,255,.08)';g.lineWidth=1.5;g.stroke();}
    g.fillStyle='rgba(235,230,250,.85)';for(let x=4;x<=W;x+=padW)for(const y of [6,74,142]){g.beginPath();g.arc(x-1,y,2.6,0,7);g.fill();}
    // LED line and chevrons (also in the emissive map).
    for(const k of [g,eg]){k.fillStyle='#ff4fa8';k.fillRect(0,H-22,W,4);k.fillStyle='#b78cff';for(let x=40;x<W;x+=128){k.beginPath();k.moveTo(x,H-36);k.lineTo(x+14,H-30);k.lineTo(x,H-24);k.lineTo(x+6,H-30);k.closePath();k.fill();}}
    g.fillStyle='#0c0714';g.fillRect(0,H-16,W,16);
    return [this.tex(c),this.tex(e)];
  }
  buildKickbacks(){
    const [map,emissiveMap]=this.kickbackTextures();
    const mat=this.track(new THREE.MeshStandardMaterial({map,emissiveMap,emissive:'#ffffff',emissiveIntensity:.9,roughness:.62,metalness:.1}));
    const panel=this.track(new THREE.PlaneGeometry(8.2,1.38)),rail=this.track(new THREE.CylinderGeometry(.04,.04,8.2,12).rotateX(Math.PI/2));
    // End posts facing the bowler: a bevelled chrome-edged column with a lit fin.
    const post=this.track(new THREE.ExtrudeGeometry(rr(.34,1.98,.08),{depth:.12,bevelEnabled:true,bevelThickness:.02,bevelSize:.018,bevelSegments:2,curveSegments:5}));
    const fin=this.track(new THREE.BoxGeometry(.05,1.62,.03));
    for(const cx of LANES)for(const s of [-1,1]){
      const x=cx+s*3.22;
      if(Math.abs(cx)<8){this.put(panel,mat,cx+s*3.083,.64,-12.6,0,-s*Math.PI/2);this.put(rail,this.M.chrome,cx+s*3.1,1.385,-12.6);}
      this.put(post,this.M.gunmetal,x,.43,-8.58);this.put(fin,s<0?this.M.violet:this.M.pink,x,.47,-8.43);
    }
  }
  // ---- pit curtain and pit surround --------------------------------------------------
  buildCurtain(){
    // Velvet drape in deep folds; the pit work light and the rims catch the ridges.
    const [c,g]=canvas(64,256),grad=g.createLinearGradient(0,0,0,256);grad.addColorStop(0,'#6a3a9a');grad.addColorStop(.55,'#4a2373');grad.addColorStop(1,'#1e0d30');g.fillStyle=grad;g.fillRect(0,0,64,256);
    for(let x=0;x<64;x+=2){g.fillStyle=`rgba(255,255,255,${.015+(x*7%5)/200})`;g.fillRect(x,0,1,256);}
    const mat=this.track(new THREE.MeshStandardMaterial({map:this.tex(c),roughness:.86,metalness:0,envMapIntensity:.6}));
    const geo=this.track(new THREE.PlaneGeometry(6.3,2.85,126,6)),p=geo.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),flare=.7+.3*(1.425-y)/2.85;p.setZ(i,(.06*Math.sin(x*8.4)+.022*Math.sin(x*21+1.3))*flare);}
    geo.computeVertexNormals();
    for(const cx of [-7.6,0,7.6])this.put(geo,mat,cx,.625,-16.52);
    // A chrome curtain rod with end finials across the top of each drape.
    const rod=this.track(new THREE.CylinderGeometry(.035,.035,6.5,12).rotateZ(Math.PI/2)),knob=this.track(new THREE.SphereGeometry(.07,14,10));
    for(const cx of [-7.6,0,7.6]){this.put(rod,this.M.chrome,cx,1.98,-16.44);for(const s of [-1,1])this.put(knob,this.M.chrome,cx+s*3.25,1.98,-16.44);}
  }
  buildPit(){
    // Pit side walls (inner faces of the deck sides, below the deck) with a chrome top edge,
    // and a rounded rubber pit nose under the lit lip.
    const [c,g]=canvas(128,64);g.fillStyle='#1a1226';g.fillRect(0,0,128,64);for(let y=0;y<64;y+=8){g.fillStyle='#120b1a';g.fillRect(0,y,128,3);}g.fillStyle='rgba(255,79,168,.6)';g.fillRect(0,4,128,2);
    const mat=this.track(new THREE.MeshStandardMaterial({map:this.tex(c),roughness:.7,metalness:.25}));
    const wall=this.track(new THREE.PlaneGeometry(1.3,.85)),edge=this.track(new THREE.BoxGeometry(.05,.05,1.3));
    for(const s of [-1,1]){this.put(wall,mat,s*2.23,-.42,-16.05,0,-s*Math.PI/2);this.put(edge,this.M.chrome,s*2.25,0,-16.05);}
    const nose=this.track(new THREE.CylinderGeometry(.06,.06,4.46,16).rotateZ(Math.PI/2));this.put(nose,this.M.gunmetal,0,-.07,LANE_END-.05);
  }
  // ---- sweep bar ---------------------------------------------------------------------
  buildSweepArms(){
    // Machined chrome end caps and two lift arms on the scene's sweep bar (they travel and
    // hide with it; the bar's own group toggles visibility).
    const sweep=this.host.sweep;if(!sweep)return;const parts=[];
    const cap=this.track(new THREE.CapsuleGeometry(.06,.6,6,14)),arm=this.track(new THREE.CylinderGeometry(.03,.03,1.55,10)),collar=this.track(new THREE.CylinderGeometry(.055,.055,.12,14));
    for(const s of [-1,1]){const c=new THREE.Mesh(cap,this.M.chrome);c.position.set(s*2.38,0,0);parts.push(c);const a=new THREE.Mesh(arm,this.M.chrome);a.position.set(s*2.15,.36+.78,-.02);parts.push(a);const k=new THREE.Mesh(collar,this.M.gunmetal);k.position.set(s*2.15,.42,-.02);parts.push(k);}
    for(const m of parts){m.renderOrder=3;sweep.add(m);}this.sweepParts=parts;
  }
  // Static parts: one draw per material.
  merge(group){
    group.updateMatrixWorld(true);const byMat=new Map();
    group.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);for(const k of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(k))geo.deleteAttribute(k);(byMat.get(o.material)||byMat.set(o.material,[]).get(o.material)).push({geo,cast:o.castShadow});});
    const out=new THREE.Group();
    for(const [mat,list] of byMat){if(list.some(x=>!x.geo.index))for(const x of list)if(x.geo.index){const n=x.geo.toNonIndexed();x.geo.dispose();x.geo=n;}
      const geo=this.track(mergeGeometries(list.map(x=>x.geo),false));for(const x of list)x.geo.dispose();const mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=true;mesh.castShadow=list.some(x=>x.cast);mesh.matrixAutoUpdate=false;out.add(mesh);}
    return out;
  }
  update(){}
  dispose(){
    for(const m of this.sweepParts||[])this.host.sweep?.remove(m);
    for(const o of this.objects)this.scene.remove(o);this.objects.length=0;
    for(const x of this.disposables)x.dispose?.();this.disposables.clear();
  }
}
export function createBowlingDeck(scene){return new BowlingDeck(scene);}
