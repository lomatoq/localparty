// Swarm Gate cannons: modelled 3D turrets on stone plinths, one per player, standing on the
// enemy side of the wall. The yaw axis stays exactly on the server anchor (turretX/turretZ)
// and the barrel is level with the aim plane (y=.68), so the projected barrel, muzzle and
// projectile all lie on the authoritative ray. Owner decision 2026-10-05: turrets keep their
// true world depth (behind the wall), so the wall/parapet/gate occlude them and they read
// as peeking over the parapet; dense rows sort by real depth (row nearer the wall on top).
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';

const BARREL_Y=1.1,MUZZLE_REACH=2.78,AIM_Y=.68,CAMERA_LIFT=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class SwarmTurrets{
  constructor(fx){
    this.fx=fx;this.THREE=fx.THREE;this.stage=fx.stage;this.records=new Map();this.S=1.2;this.byGroup=new Map();
    const THREE=this.THREE;
    this.lift=this.fx.view.clone().multiplyScalar(-CAMERA_LIFT);
    // Toon ramp: painted-toy shading that matches the hand-painted bugs and never blows out
    // under the courtyard's strong key light.
    const ramp=new THREE.DataTexture(new Uint8Array([64,64,64,255,128,128,128,255,184,184,184,255,218,218,218,255]),4,1,THREE.RGBAFormat);ramp.minFilter=ramp.magFilter=THREE.NearestFilter;ramp.needsUpdate=true;this.ramp=ramp;
    this.mats={
      body:new THREE.MeshToonMaterial({vertexColors:true,gradientMap:ramp}),
      outline:new THREE.MeshBasicMaterial({color:'#141022',side:THREE.BackSide}),
      shadow:new THREE.MeshBasicMaterial({map:this.shadowTexture(),transparent:true,depthWrite:false,opacity:.62,toneMapped:false}),
    };
    this.geo={base:this.baseGeometry(),shadow:new THREE.PlaneGeometry(4.6,4.6).rotateX(-Math.PI/2)};
    this.ready=document.fonts?.ready?.then(()=>this.relabel());
  }
  count(){return this.records.size;}
  shadowTexture(){return this.fx.canvasTexture('swarm-turret-shadow',128,128,(c,w,h)=>{const g=c.createRadialGradient(64,64,6,64,64,62);g.addColorStop(0,'rgba(10,8,22,.9)');g.addColorStop(.5,'rgba(10,8,22,.55)');g.addColorStop(1,'rgba(10,8,22,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});}

  // ---- geometry helpers ----
  part(geometry,color,{x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1}={}){
    const THREE=this.THREE,g=geometry.index?geometry:geometry;g.scale(sx,sy,sz);g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);
    const c=new THREE.Color(color).multiplyScalar(.5),n=g.attributes.position.count,colors=new Float32Array(n*3);for(let i=0;i<n;i++){colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;}
    g.setAttribute('color',new THREE.BufferAttribute(colors,3));if(!g.attributes.uv){g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(n*2),2));}
    return g;
  }
  hull(geometries,thickness){
    // Inverted-hull outline: every part grown about its own centre by a constant thickness.
    const THREE=this.THREE;return mergeGeometries(geometries.map(source=>{const g=source.clone();g.computeBoundingBox();const b=g.boundingBox,c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3());
      const p=g.attributes.position;for(let i=0;i<p.count;i++){p.setXYZ(i,c.x+(p.getX(i)-c.x)*(1+2*thickness/Math.max(.05,s.x)),c.y+(p.getY(i)-c.y)*(1+2*thickness/Math.max(.05,s.y)),c.z+(p.getZ(i)-c.z)*(1+2*thickness/Math.max(.05,s.z)));}g.deleteAttribute('color');g.deleteAttribute('uv');g.deleteAttribute('normal');return g;}));
  }
  baseGeometry(){
    const T=this.THREE,stone='#59607e',stoneLight='#7c84a6',stoneDark='#3a3f58',parts=[
      this.part(new T.CylinderGeometry(1.38,1.58,.56,10),stone,{y:.28}),
      this.part(new T.CylinderGeometry(1.46,1.46,.11,10),stoneLight,{y:.6}),
      this.part(new T.CylinderGeometry(1.6,1.66,.1,10),stoneDark,{y:.05}),
    ];
    // Bolted brass collar, merged into the same draw call.
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8;parts.push(this.part(new T.SphereGeometry(.085,8,6),'#d9a441',{x:Math.cos(a)*1.28,y:.68,z:Math.sin(a)*1.28}));}
    const outline=this.hull(parts.slice(0,3),.05);return{mesh:mergeGeometries(parts),outline};
  }
  headGeometry(color){
    const T=this.THREE,paint=new T.Color(color).multiplyScalar(.82),dark=paint.clone().multiplyScalar(.55),light=paint.clone().lerp(new T.Color('#ffffff'),.12),metal='#2f344a',brass='#d9a441';
    const hull=[
      this.part(new T.CylinderGeometry(1.0,1.1,.26,28),metal,{y:.8}),
      this.part(new T.SphereGeometry(.9,28,14,0,Math.PI*2,0,Math.PI/2),paint,{y:.9,sy:.66,sz:1.04}),
      this.part(new T.BoxGeometry(.26,.62,1.0),dark,{x:.6,y:1.08,z:.22}),
      this.part(new T.BoxGeometry(.26,.62,1.0),dark,{x:-.6,y:1.08,z:.22}),
    ];
    const detail=[
      this.part(new T.CylinderGeometry(.95,.95,.13,28),dark,{y:.94}),
      this.part(new T.SphereGeometry(.4,18,10,0,Math.PI*2,0,Math.PI/2),light,{y:1.42,z:-.18,sy:.5}),
      this.part(new T.BoxGeometry(.74,.58,.42),metal,{y:BARREL_Y,z:.82}),
      this.part(new T.BoxGeometry(1.18,.5,.14),paint,{y:BARREL_Y-.02,z:.98,rx:-.35}),
      this.part(new T.BoxGeometry(1.22,.08,.18),light,{y:BARREL_Y+.24,z:.92,rx:-.35}),
      this.part(new T.BoxGeometry(.24,.2,.5),metal,{x:.42,y:1.4,z:-.25}),
      this.part(new T.CylinderGeometry(.03,.03,.72),'#22263a',{x:-.46,y:1.62,z:-.42}),
      this.part(new T.TorusGeometry(.24,.05,6,18),brass,{y:BARREL_Y,z:1.04}),
    ];
    return{mesh:mergeGeometries([...hull,...detail]),outline:this.hull(hull,.045)};
  }
  barrelGeometry(){
    if(this.geo.barrel)return this.geo.barrel;
    const T=this.THREE,metal='#3a4058',brass='#d9a441',r=Math.PI/2,parts=[
      this.part(new T.CylinderGeometry(.2,.25,1.9,20),metal,{z:1.7,rx:r}),
      this.part(new T.CylinderGeometry(.31,.31,.6,20),brass,{z:1.2,rx:r}),
      this.part(new T.CylinderGeometry(.34,.28,.38,20),metal,{z:2.58,rx:r}),
    ];
    const extras=[this.part(new T.TorusGeometry(.27,.06,6,20),brass,{z:2.76}),...[0,1,2,3].map(i=>this.part(new T.BoxGeometry(.07,.07,.5),'#565e80',{x:Math.cos(i*r+r/2)*.26,y:Math.sin(i*r+r/2)*.26,z:1.95}))];
    // Steel (heats up) and brass/rails (stay cool) are separate meshes so heat glow never whitens the brass.
    this.geo.barrel={mesh:mergeGeometries([parts[0],parts[2]]),trim:mergeGeometries([parts[1],...extras]),outline:this.hull(parts,.04)};return this.geo.barrel;
  }
  glowGeometry(){
    if(this.geo.glow)return this.geo.glow;const T=this.THREE;
    this.geo.glow=mergeGeometries([
      new T.TorusGeometry(1.2,.055,8,48).rotateX(Math.PI/2).translate(0,.665,0),
      new T.SphereGeometry(.08,10,8).translate(-.46,2.0,-.42),
      new T.SphereGeometry(.08,10,8).translate(.42,1.4,.01),
    ].map(g=>{g.deleteAttribute('uv');return g;}));return this.geo.glow;
  }

  build(p){
    const THREE=this.THREE,color=p.color||'#ffd36b',root=new THREE.Group(),yaw=new THREE.Group(),recoil=new THREE.Group();
    // No shadow-map casters: toon ramp + contact shadow carry the form, and 16 crews stay cheap.
    const mesh=(geo,mat,parent)=>{const m=new THREE.Mesh(geo,mat);parent.add(m);return m;};
    const shadow=mesh(this.geo.shadow,this.mats.shadow,root,false);shadow.position.y=.02;shadow.renderOrder=1;
    mesh(this.geo.base.mesh,this.mats.body,root);mesh(this.geo.base.outline,this.mats.outline,root,false);
    const head=this.headGeometry(color);mesh(head.mesh,this.mats.body,yaw);mesh(head.outline,this.mats.outline,yaw,false);
    const barrelMat=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:this.ramp,emissive:new THREE.Color('#ff3a00'),emissiveIntensity:0});
    const barrel=this.barrelGeometry();mesh(barrel.mesh,barrelMat,recoil);mesh(barrel.trim,this.mats.body,recoil);mesh(barrel.outline,this.mats.outline,recoil,false);
    const glowMat=new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(1.35),toneMapped:false});
    // LED ring stays on the plinth; tips ride with the head.
    const ring=mesh(this.glowGeometry(),glowMat,yaw,false);
    recoil.position.y=BARREL_Y;yaw.add(recoil);root.add(yaw);
    const tag=this.nameTag(p);tag.renderOrder=24;this.stage.scene.add(tag);
    this.stage.scene.add(root);
    const rec={id:p.id,root,yaw,recoil,barrelMat,glowMat,ring,tag,color,name:p.name,number:p.number,kick:0,heatShown:0,born:this.fx.now(),yawAngle:0,steamAt:0,anchor:new THREE.Vector3(),hostGroup:null,lastFire:-1};
    return rec;
  }
  nameTag(p){
    const THREE=this.THREE,canvas=document.createElement('canvas');canvas.width=320;canvas.height=72;
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));
    sprite.userData.canvas=canvas;sprite.userData.player={name:p.name,number:p.number,color:p.color};this.paintTag(sprite);return sprite;
  }
  paintTag(sprite){
    const {name,number,color}=sprite.userData.player,canvas=sprite.userData.canvas,c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);
    const label=String(name||'').trim(),short=[...label].length>11?[...label].slice(0,10).join('')+'…':label;
    c.font='800 34px KardiaFit, HeyPalsText, Rubik, sans-serif';const textW=Math.min(220,c.measureText(short).width),w=Math.round(72+textW+22),x0=Math.round((canvas.width-w)/2);
    c.fillStyle='rgba(19,15,32,.92)';c.beginPath();c.roundRect(x0+3,6,w-6,60,30);c.fill();c.lineWidth=4;c.strokeStyle=color;c.stroke();
    c.fillStyle=color;c.beginPath();c.arc(x0+36,36,23,0,Math.PI*2);c.fill();
    c.fillStyle='#171223';c.font='italic 900 30px KardiaFatRunner, HeyPalsDisplay, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(number??''),x0+36,38);
    c.fillStyle='#ffffff';c.font='800 34px KardiaFit, HeyPalsText, Rubik, sans-serif';c.textAlign='left';c.fillText(short,x0+68,38,220);
    sprite.material.map.needsUpdate=true;sprite.userData.aspect=canvas.width/canvas.height;
  }
  relabel(){for(const r of this.records.values())this.paintTag(r.tag);}
  dispose(rec){
    this.stage.scene.remove(rec.root);this.stage.scene.remove(rec.tag);rec.barrelMat.dispose();rec.glowMat.dispose();rec.tag.material.map.dispose();rec.tag.material.dispose();
    rec.root.traverse(n=>{if(n.isMesh&&n.geometry!==this.geo.base.mesh&&n.geometry!==this.geo.base.outline&&n.geometry!==this.geo.shadow&&n.geometry!==this.geo.barrel?.mesh&&n.geometry!==this.geo.barrel?.trim&&n.geometry!==this.geo.barrel?.outline&&n.geometry!==this.geo.glow)n.geometry.dispose();});
    if(rec.hostGroup)this.byGroup.delete(rec.hostGroup);this.records.delete(rec.id);
  }

  aimYaw(p,anchor){const tx=(p.aim.x-.5)*36,tz=-27+p.aim.y*26;return Math.atan2(tx-anchor.x,tz-anchor.z);}
  muzzlePoint(rec,out=new this.THREE.Vector3()){
    // Rest position of the muzzle (recoil is cosmetic); lifted with the turret so it projects on it.
    return out.set(rec.anchor.x+Math.sin(rec.yawAngle)*MUZZLE_REACH*this.S,AIM_Y,rec.anchor.z+Math.cos(rec.yawAngle)*MUZZLE_REACH*this.S).add(this.lift);
  }
  muzzleFor(id){const rec=this.records.get(id);return rec?this.muzzlePoint(rec):null;}
  muzzleForGroup(group){const rec=this.byGroup.get(group);return rec?this.muzzlePoint(rec):null;}
  syncAim(rec,p){rec.anchor.set(p.turretX||0,AIM_Y,p.turretZ??-9.5);rec.yawAngle=this.aimYaw(p,rec.anchor);}

  fired(id,s){
    const rec=this.records.get(id),p=s.players.find(q=>q.id===id);if(!rec||!p)return;this.syncAim(rec,p);
    rec.kick=1;rec.lastFire=this.fx.now();
    const muzzle=this.muzzlePoint(rec),angle=this.fx.planeAngle(rec.anchor.clone().add(this.lift),muzzle).angle;
    this.fx.impacts.muzzleFlash(muzzle,angle,rec.color);
    // Brass casing kicks out of the right cheek.
    const side=new this.THREE.Vector3(Math.cos(rec.yawAngle),0,-Math.sin(rec.yawAngle)),eject=rec.anchor.clone().add(this.lift).addScaledVector(side,.75*this.S);eject.y+=.4;
    this.fx.impacts.casing(eject,side);
  }

  update(s,dt){
    // Two dense rows (9-16 crews) need smaller cannons so rows and name tags stay clear.
    this.S=s.players.filter(p=>p.participant||s.phase==='waiting').length>8?.9:1.2;
    const THREE=this.THREE,now=this.fx.now(),reduced=this.fx.reduced,cam=this.stage.camera,h=this.stage.renderer.domElement.clientHeight||1,k=clamp(innerWidth/1280,.55,1.5),seen=new Set();
    for(const p of s.players){
      if(!(p.participant||s.phase==='waiting'))continue;seen.add(p.id);
      let rec=this.records.get(p.id);if(!rec){rec=this.build(p);this.records.set(p.id,rec);}
      if(rec.color!==p.color||rec.name!==p.name||rec.number!==p.number){rec.tag.userData.player={name:p.name,number:p.number,color:p.color};this.paintTag(rec.tag);rec.glowMat.color.set(p.color).multiplyScalar(1.35);rec.name=p.name;rec.number=p.number;}
      // Hide the host's flat turret sprites but keep their group (diagnostics/pivot) intact.
      const host=this.stage.turrets.get(p.id);if(host&&rec.hostGroup!==host){if(rec.hostGroup)this.byGroup.delete(rec.hostGroup);rec.hostGroup=host;this.byGroup.set(host,rec);}
      if(host)for(const child of host.children)child.visible=false;
      this.syncAim(rec,p);
      rec.root.position.set(rec.anchor.x,AIM_Y-BARREL_Y*this.S,rec.anchor.z).add(this.lift);
      rec.yaw.rotation.y=rec.yawAngle;
      // Recoil: sharp kick, quick spring home (reads as a pumping cannon at 8 shots/s).
      rec.kick*=Math.exp(-dt*(reduced?40:24));const kick=reduced?rec.kick*.35:rec.kick;
      rec.recoil.position.z=-.36*kick;rec.yaw.position.set(-Math.sin(rec.yawAngle)*.07*kick,0,-Math.cos(rec.yawAngle)*.07*kick);
      // Pop-in when a crew member joins.
      const age=now-rec.born,pop=reduced||age>.45?1:1+Math.sin(Math.min(1,age/.45)*Math.PI)*.12-(1-Math.min(1,age/.18))*.35;rec.root.scale.setScalar(pop*this.S);
      // Heat: barrel glows, LED ring warms; overheat lock blinks (<=2 Hz) and vents steam.
      const locked=p.lockedUntil>s.t,heat=clamp(p.heat||0,0,1);rec.heatShown+=(heat-rec.heatShown)*(1-Math.exp(-dt*10));
      rec.barrelMat.emissiveIntensity=Math.pow(rec.heatShown,2.2)*.75+(locked?.35:0);
      const base=(this._base||=new THREE.Color()).set(p.color||rec.color).multiplyScalar(1.35),hot=(this._hot||=new THREE.Color()).set('#ff4b3a').multiplyScalar(1.5);
      if(locked)rec.glowMat.color.copy(reduced||Math.sin(now*Math.PI*4)>0?hot:base.multiplyScalar(.35));
      else rec.glowMat.color.copy(base).lerp(hot,Math.max(0,rec.heatShown-.6)/.4).multiplyScalar(p.connected===false?.35:.85+.15*Math.sin(now*2.2+p.number));
      if(locked&&now>rec.steamAt){rec.steamAt=now+.16;this.fx.impacts.steam(this.muzzlePoint(rec));}
      // Name tag on the wall lip below the plinth, constant on-screen size.
      const worldPerPx=(cam.top-cam.bottom)/h,tagH=(this.S<1?24:30)*k*worldPerPx;rec.tag.scale.set(tagH*(rec.tag.userData.aspect||4.4),tagH,1);
      // Back-row (dense) tags ride above their cannon so they never cover the row nearer the wall.
      const backRow=rec.anchor.z<-12;rec.tag.position.copy(rec.anchor).add(this.lift).addScaledVector(this.fx.up,backRow?1.55*this.S+tagH*.5:-(BARREL_Y*this.S)*.7071-1.66*this.S-tagH*.5);rec.tag.visible=p.connected!==false||s.phase==='waiting';
    }
    for(const rec of [...this.records.values()])if(!seen.has(rec.id))this.dispose(rec);
  }
}
