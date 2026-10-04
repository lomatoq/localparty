// Pocket Strike game feel: release charge on the ball, speed streaks, pin clatter sparks and
// clatter sound, rotation blur on spinning pins, impact punch-in, gutter "aww", idle
// micro-motion and camera breathing between throws.
// Purely visual and read-only: it reads the BowlingScene's interpolated poses after every
// other system has run and only adds light, sprites and camera offsets. Nothing here can
// change a roll, a pin count or a score. Effects are timed on the replay clock (server
// time); camera beats on the wall clock so slow motion never stretches a shake.
// Reduced motion: no camera beats, no flying particles, no blur; static glows only.
import * as THREE from './vendor/three.module.js';

const STREAKS=64;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=u=>{u=clamp(u,0,1);return u*u*(3-2*u);};
function seeded(seed){let s=seed>>>0;return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];}
function sound(name){try{(window.parent!==window?window.parent:window).HeyPalsAudio?.play(name);}catch{}}

export class BowlingFeel{
  constructor(scene){
    this.host=scene;this.scene=scene.scene;this.camera=scene.camera;this.reduced=!!scene.reduced;this.objects=[];this.disposables=new Set();
    this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.v=new THREE.Vector3();this.v2=new THREE.Vector3();this.v3=new THREE.Vector3();this.s=new THREE.Vector3(1,1,1);this.c=new THREE.Color();this.c2=new THREE.Color();
    this.ax=new THREE.Vector3();this.ay=new THREE.Vector3();this.az=new THREE.Vector3();
    this.state={token:'',release:null,gutterToken:'',gutterWall:-1e9,lastT:null,clatter:0,streakAt:0,clatterWall:0};
    this.fovScale=1;this.debug={};
    this.buildStreaks();this.buildGhosts();
    this.hist=Array.from({length:10},()=>({p:new THREE.Vector3(),q:new THREE.Quaternion(),p2:new THREE.Vector3(),q2:new THREE.Quaternion(),vel:new THREE.Vector3(),seen:false,sparkAt:-9}));
  }
  track(x){this.disposables.add(x);return x;}
  add(o){this.scene.add(o);this.objects.push(o);return o;}
  buildStreaks(){
    // Velocity-aligned spark streaks: a bright head with a fading tail, one instanced draw.
    const [c,g]=canvas(128,16),h=g.createLinearGradient(0,0,128,0);h.addColorStop(0,'rgba(255,255,255,0)');h.addColorStop(.7,'rgba(255,255,255,.55)');h.addColorStop(.92,'rgba(255,255,255,1)');h.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=h;g.fillRect(0,0,128,16);const v=g.createLinearGradient(0,0,0,16);v.addColorStop(0,'rgba(0,0,0,1)');v.addColorStop(.5,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=v;g.fillRect(0,0,128,16);
    const tex=this.track(new THREE.CanvasTexture(c));tex.colorSpace=THREE.SRGBColorSpace;
    this.streakMat=this.track(new THREE.MeshBasicMaterial({map:tex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false,side:THREE.DoubleSide}));
    this.streaks=new THREE.InstancedMesh(this.track(new THREE.PlaneGeometry(1,1)),this.streakMat,STREAKS);this.streaks.frustumCulled=false;this.streaks.renderOrder=7;this.streaks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for(let i=0;i<STREAKS;i++)this.streaks.setColorAt(i,this.c.setRGB(0,0,0));this.streaks.count=0;this.add(this.streaks);
    this.sparks=Array.from({length:STREAKS},()=>({born:-1}));this.cursor=0;
  }
  buildGhosts(){
    // Rotation blur: the pin silhouette one and two frames back, additive and dim, only on
    // pins that spin fast. Two instanced draws.
    const map=this.host.mat.pin.map;
    this.ghosts=[.32,.16].map((k,i)=>{const mat=this.track(new THREE.MeshBasicMaterial({map,color:new THREE.Color(1,1,1),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false}));
      const mesh=new THREE.InstancedMesh(this.host.pinGeometry,mat,10);mesh.frustumCulled=false;mesh.renderOrder=3;mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);for(let j=0;j<10;j++)mesh.setColorAt(j,this.c.setRGB(0,0,0));this.add(mesh);mesh.userData.k=k;return mesh;});
  }
  spark(o){const p=this.sparks[this.cursor++%STREAKS];Object.assign(p,{born:0,life:.4,x:0,y:0,z:0,vx:0,vy:0,vz:0,g:6,len:.35,w:.05,r:1,gg:.85,b:.6},o);return p;}
  impactSparks(x,y,z,t,power){
    // Ball-on-pin hit: a fan of hot streaks thrown up and back off the rack.
    const rand=seeded((t*1000)|0),n=Math.round(14+power*12);
    for(let i=0;i<n;i++){const a=rand()*Math.PI*2,sp=2+rand()*4.5;this.c.setHSL(.07+rand()*.08,.95,.6+rand()*.3);if(i%4===0)this.c.setRGB(1,.97,.9);
      this.spark({born:t+rand()*.03,life:.3+rand()*.25,x:x+(rand()-.5)*.3,y:y+rand()*.35,z:z+.2,vx:Math.cos(a)*sp,vy:1.5+rand()*3.2,vz:Math.sin(a)*sp*.55-1,g:8,len:.3+rand()*.25,w:.04,r:this.c.r,gg:this.c.g,b:this.c.b});}
  }
  // ---- events ---------------------------------------------------------------------------
  event(e,s){
    if(e.kind==='throw'&&e.id!==this.state.releaseId&&s.t-e.at<1){this.state.releaseId=e.id;const p=s.players.find(x=>x.id===e.player);
      this.state.release={born:e.at,power:clamp(e.input?.power??.7,0,1),color:p?.color||'#b493ff',wall:performance.now(),popped:false};}
  }
  // ---- per frame ------------------------------------------------------------------------
  update(A,stage,age,t,dt){
    const st=this.state,host=this.host,now=performance.now();
    if(A.token!==st.token){st.token=A.token;st.clatter=0;for(const h of this.hist)h.seen=false;}
    const dtR=st.lastT===null?0:t-st.lastT;st.lastT=t;
    this.updateRelease(A,stage,age,t,now);
    // Gutter "aww": the moment the ball drops in, not when the pins are counted.
    if(stage==='rolling'&&A.gutter&&st.gutterToken!==A.token){st.gutterToken=A.token;st.gutterWall=now;sound('back');}
    this.updatePins(A,stage,age,t,dtR);
    this.updateStreaks(t);
    this.updateCamera(A,stage,age,t,now);
    this.debug={stage,age:+age.toFixed(2),fov:+this.fovScale.toFixed(3),sparks:this.streaks.count,ghosts:this.ghosts[0].count,clatter:st.clatter};
  }
  updateRelease(A,stage,age,t,now){
    // Ball charge: the ball lights up in the bowler's colour at release and cools down as
    // it rolls; a soft ready glow breathes while it waits on the spot.
    const st=this.state,host=this.host,mat=host.mat.ball,r=st.release,ra=r?t-r.born:9,ball=host.ball;
    let glow=0;
    if(r&&ra>=0&&ra<1.4&&(stage==='rolling'||stage==='aim')){glow=(.25+.5*r.power)*Math.pow(1-ra/1.4,2);
      if(!r.popped&&ball.visible){r.popped=true;
        // A ring pops off the ball and a fan of streaks is thrown back along the lane.
        const x=host.extras;this.c.set(r.color);x?.shock?.spawn({born:r.born,life:.36,x:ball.position.x,y:ball.position.y,z:ball.position.z+.05,s0:.45,s1:.95+.45*r.power,r:.22+.2*this.c.r,gg:.22+.2*this.c.g,b:.22+.2*this.c.b,peak:.12});
        x?.glow?.spawn({born:r.born,life:.4,x:ball.position.x,y:ball.position.y,z:ball.position.z,s0:.5,s1:.95,r:.18,gg:.15,b:.2,peak:.1});
        if(!this.reduced){const rand=seeded((r.born*1000)|0);this.c.set(r.color).lerp(this.c2.setRGB(1,1,1),.35);
          for(let i=0;i<10;i++){const a=(rand()-.5)*1.6,sp=3+rand()*3*r.power;this.spark({born:r.born,life:.3+rand()*.15,x:ball.position.x,y:.12+rand()*.4,z:ball.position.z+.1,vx:Math.sin(a)*sp*.5,vy:.6+rand()*1.2,vz:Math.cos(a)*sp,g:4,len:.4,w:.045,r:this.c.r,gg:this.c.g,b:this.c.b});}}}}
    else if(stage==='aim'&&ball.visible&&!this.reduced&&Math.abs(ball.position.z-12.8)<.05)glow=.05+.04*Math.sin(t*2.6);
    if(glow>.001){mat.emissive.set(r&&ra<1.4?r.color:A.color);mat.emissiveIntensity=glow;}else mat.emissiveIntensity=0;
    // Speed streaks peel off the ball for the first part of the roll.
    if(r&&stage==='rolling'&&ra>.05&&ra<1.1&&ball.visible&&!this.reduced&&!A.gutter&&t-this.state.streakAt>.06){this.state.streakAt=t;const rand=Math.random,p=ball.position,side=rand()<.5?-1:1;this.c.set(r.color).lerp(this.c2.setRGB(1,1,1),.25);
      const fade=(1-ra/1.1)*.8;this.spark({born:t,life:.2,x:p.x+side*(.3+rand()*.12),y:p.y+(rand()-.2)*.3,z:p.z+.2,vx:side*.6,vy:0,vz:4+rand()*2,g:0,len:.4+.3*fade,w:.025,r:this.c.r*fade,gg:this.c.g*fade,b:this.c.b*fade});}
  }
  updatePins(A,stage,age,t,dtR){
    const host=this.host,st=this.state,active=(stage==='rolling'||(stage==='reveal'&&age<.7))&&dtR>1e-4&&dtR<.1;
    let g0=0,g1=0;
    host.pins.forEach((pin,i)=>{const h=this.hist[i];if(!pin.visible){h.seen=false;return;}
      if(!h.seen){h.seen=true;h.p.copy(pin.position);h.p2.copy(pin.position);h.q.copy(pin.quaternion);h.q2.copy(pin.quaternion);h.vel.set(0,0,0);return;}
      if(active){
        // Velocity from the rendered poses; a sharp change is a collision: sparks + clatter.
        this.v.copy(pin.position).sub(h.p).divideScalar(dtR);const dv=this.v2.copy(this.v).sub(h.vel).length();
        if(dv>2.6&&t-h.sparkAt>.14&&this.v.length()>.8){h.sparkAt=t;st.clatter++;
          if(st.clatter<=5&&performance.now()-st.clatterWall>90){st.clatterWall=performance.now();sound('hit');}
          if(!this.reduced){const rand=seeded((t*7919+i*131)|0),n=Math.min(6,2+Math.round(dv/2.5));this.v3.set(0,.55,0).applyQuaternion(pin.quaternion).add(pin.position);
            for(let k=0;k<n;k++){const a=rand()*Math.PI*2,sp=1.5+rand()*2.8;this.c.setHSL(.09+rand()*.06,.9,.62+rand()*.2);
              this.spark({born:t,life:.28+rand()*.18,x:this.v3.x,y:this.v3.y,z:this.v3.z,vx:Math.cos(a)*sp+this.v.x*.2,vy:1+rand()*2.2,vz:Math.sin(a)*sp*.7+this.v.z*.2,g:7,len:.22+rand()*.18,w:.035,r:this.c.r,gg:this.c.g,b:this.c.b});}}}
        h.vel.copy(this.v);
        // Rotation blur on fast pins.
        const turn=2*Math.acos(Math.min(1,Math.abs(h.q.dot(pin.quaternion)))),move=h.p.distanceTo(pin.position);
        if(!this.reduced&&(turn>.09||move>.05)){const k=clamp((turn-.05)*2.2+move*2,0,1);
          this.m.compose(h.p,h.q,this.s.set(1,1,1));this.ghosts[0].setMatrixAt(g0,this.m);this.ghosts[0].setColorAt(g0++,this.c.setRGB(.95,.9,.85).multiplyScalar(this.ghosts[0].userData.k*k));
          this.m.compose(h.p2,h.q2,this.s.set(1,1,1));this.ghosts[1].setMatrixAt(g1,this.m);this.ghosts[1].setColorAt(g1++,this.c.setRGB(.95,.9,.85).multiplyScalar(this.ghosts[1].userData.k*k));}
      }else h.vel.set(0,0,0);
      h.p2.copy(h.p);h.q2.copy(h.q);h.p.copy(pin.position);h.q.copy(pin.quaternion);});
    for(const [mesh,n] of [[this.ghosts[0],g0],[this.ghosts[1],g1]]){mesh.count=n;mesh.visible=n>0;if(n){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}}
  }
  updateStreaks(t){
    const cam=this.camera.position;let n=0;
    for(const p of this.sparks){if(p.born<0)continue;const age=t-p.born;if(age<0)continue;if(age>p.life){p.born=-1;continue;}
      const u=age/p.life,x=p.x+p.vx*age,y=Math.max(.02,p.y+p.vy*age-.5*p.g*age*age),z=p.z+p.vz*age;
      // Orient along the current velocity as seen by the camera.
      this.v.set(p.vx,p.vy-p.g*age,p.vz);const speed=this.v.length();if(speed<1e-3)this.v.set(1,0,0);
      this.az.set(cam.x-x,cam.y-y,cam.z-z).normalize();this.ax.copy(this.v).addScaledVector(this.az,-this.v.dot(this.az));if(this.ax.lengthSq()<1e-6)this.ax.set(1,0,0);this.ax.normalize();this.ay.crossVectors(this.az,this.ax);
      const len=p.len*(.4+.6*Math.min(1,speed/5)),fade=1-u*u;
      this.m.makeBasis(this.ax.multiplyScalar(len),this.ay.multiplyScalar(p.w),this.az);this.m.setPosition(x,y,z);
      this.streaks.setMatrixAt(n,this.m);this.streaks.setColorAt(n++,this.c.setRGB(p.r*fade,p.gg*fade,p.b*fade));}
    this.streaks.count=n;this.streaks.visible=n>0;if(n){this.streaks.instanceMatrix.needsUpdate=true;this.streaks.instanceColor.needsUpdate=true;}
  }
  updateCamera(A,stage,age,t,now){
    const host=this.host,cam=this.camera,st=this.state;let fov=1;
    if(!this.reduced){
      // Impact punch-in: a quick narrowing of the lens that springs back.
      const im=host.impact,iw=im?(now-im.wall)/1000:9;if(iw>=0&&iw<.6){const u=iw<.06?iw/.06:1-smooth((iw-.06)/.54);fov-=.075*(im.power||.6)*u;}
      // Gutter "aww": the lens pulls back a touch and the camera sags and tilts.
      const gw=(now-st.gutterWall)/1000;if(gw>=0&&gw<2.2&&(stage==='rolling'||stage==='reveal')){const u=Math.sin(Math.PI*clamp(gw/2.2,0,1));fov+=.035*u;cam.position.y-=.16*u;cam.rotateZ(.014*u);}
      // ...and the house lights sigh: the deck and approach dim, the rims drop for a beat.
      const L=host.lights;if(L){const gu=gw>=0&&gw<3&&stage!=='aim'?Math.sin(Math.PI*clamp(gw/3,0,1)):0;L.deck.intensity=L.base.deck*(1-.45*gu);L.approach.intensity=L.base.approach*(1-.35*gu);L.rimL.intensity=L.base.rimL*(1-.5*gu);L.rimR.intensity=L.base.rimR*(1-.5*gu);}
      // Idle micro-motion: a slow handheld drift while the bowler lines up the shot.
      const resetCam=host.extras?.camW||0;if(stage==='aim'&&resetCam<.01){const w=smooth((age-2.6)/1.4);if(w>0){cam.position.x+=Math.sin(t*.41)*.05*w;cam.position.y+=Math.sin(t*.29+1.3)*.03*w;cam.rotateZ(Math.sin(t*.23)*.0025*w);}}
      host.launchRing.scale.setScalar(1+.06*Math.sin(t*3.2));
    }
    this.fovScale=fov;
  }
  dispose(){
    this.host.mat.ball.emissiveIntensity=0;
    for(const o of this.objects)this.scene.remove(o);this.objects.length=0;
    for(const x of this.disposables)x.dispose?.();this.disposables.clear();
  }
}
export function createBowlingFeel(scene){return new BowlingFeel(scene);}
