// Swarm Gate atmosphere and stakes: spawn-zone darkness, drifting motes, gate braziers,
// progressive gate cracks + chewing splinters + damage thumps, danger vignette, gate-bar
// drama, wave-start horn flare and wave-clear celebration. Render-only, bounded, and calm
// under reduced motion (no pulsing, no drift, no particles; static state cues remain).
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const STYLE_ID='swarm-gate-ambience-style';

export class SwarmAmbience{
  constructor(fx){
    this.fx=fx;const THREE=fx.THREE,stage=fx.stage;this.THREE=THREE;this.stage=stage;
    this.lastGate=null;this.dropAcc=0;this.thumpAt=-9;this.splinterAt=0;this.hurt=0;this.vigLevel=0;this.waveFlash=-9;
    const cel=n=>fx.texture('atlas-fx-celebration/'+n+'.webp'),com=n=>fx.texture('atlas-fx-combat/'+n+'.webp');
    this.tex={glow:cel('glow-orb'),fwGold:cel('firework-burst-gold'),fwLime:cel('firework-burst-lime'),sparkle:cel('sparkle-cluster'),heal:com('heal-plus'),dust:com('dust-puff'),
      fog:fx.canvasTexture('swarm-fog',16,256,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(6,8,18,.86)');g.addColorStop(.38,'rgba(8,10,22,.5)');g.addColorStop(1,'rgba(8,10,22,0)');c.fillStyle=g;c.fillRect(0,0,w,h);}),
      band:fx.canvasTexture('swarm-band',256,64,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h);const e=c.createLinearGradient(0,0,w,0);e.addColorStop(0,'rgba(0,0,0,1)');e.addColorStop(.12,'rgba(0,0,0,0)');e.addColorStop(.88,'rgba(0,0,0,0)');e.addColorStop(1,'rgba(0,0,0,1)');c.globalCompositeOperation='destination-out';c.fillStyle=e;c.fillRect(0,0,w,h);}),
      flame:fx.canvasTexture('swarm-flame',64,128,(c,w,h)=>{const g=c.createRadialGradient(32,92,2,32,84,40);g.addColorStop(0,'rgba(255,250,220,1)');g.addColorStop(.3,'rgba(255,196,90,.95)');g.addColorStop(.7,'rgba(255,96,40,.55)');g.addColorStop(1,'rgba(255,60,30,0)');c.fillStyle=g;c.beginPath();c.moveTo(32,6);c.bezierCurveTo(52,44,60,70,56,92);c.bezierCurveTo(52,118,12,118,8,92);c.bezierCurveTo(4,70,12,44,32,6);c.fill();}),
      cracks:[1,2,3].map(level=>fx.canvasTexture('swarm-cracks-'+level,256,256,(c,w,h)=>this.drawCracks(c,w,h,level)))};
    const sprite=(map,order,{additive=false,depthTest=false}={})=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthTest,depthWrite:false,toneMapped:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending}));s.renderOrder=order;stage.scene.add(s);return s;};
    this.sprite=sprite;
    // Spawn-zone darkness: bugs emerge out of it.
    this.fog=sprite(this.tex.fog,11);
    // Gate overlays: cracks (under occluded-bug silhouettes), red hurt flash, repair glow.
    this.crack=sprite(this.tex.cracks[0],8);this.crack.visible=false;
    this.hurtFlash=sprite(this.tex.glow,9,{additive:true});this.hurtFlash.visible=false;
    // Braziers on the gate towers.
    this.braziers=[-1,1].map(side=>({side,flame:sprite(this.tex.flame,9,{additive:true}),glow:sprite(this.tex.glow,7,{additive:true}),seed:side*3.7}));
    // Ambient motes (one draw call).
    const moteCount=fx.reduced?0:30;this.motes=[];
    if(moteCount){this.moteMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:fx.impacts.tex.dot,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),moteCount);this.moteMesh.frustumCulled=false;this.moteMesh.renderOrder=6;this.moteMesh.setColorAt(0,new THREE.Color());stage.scene.add(this.moteMesh);
      for(let i=0;i<moteCount;i++)this.motes.push({x:(Math.random()-.5)*44,z:-27+Math.random()*25,y:.6+Math.random()*2.6,s:.1+Math.random()*.16,p:Math.random()*9,v:.15+Math.random()*.35,c:new THREE.Color(i%3?'#9fe8ff':'#ffd58a')});}
    // One-shot celebration/announcement sprites.
    this.oneShots=[];for(let i=0;i<18;i++){const s=sprite(this.tex.glow,22);s.visible=false;this.oneShots.push({sprite:s,active:false});}
    this.band=sprite(this.tex.band,12,{additive:true});this.band.visible=false;
    // Danger vignette + gate bar drama (DOM, inside the scene, under the HUD).
    this.vignette=document.createElement('div');this.vignette.setAttribute('aria-hidden','true');this.vignette.dataset.swarmVignette='';
    this.vignette.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:1;opacity:0;background:radial-gradient(120% 95% at 50% 46%,rgba(0,0,0,0) 58%,rgba(160,18,36,.42) 84%,rgba(110,6,22,.78) 100%);';
    document.getElementById('ss-scene')?.append(this.vignette);
    if(!document.getElementById(STYLE_ID)){const st=document.createElement('style');st.id=STYLE_ID;st.textContent=`
body[data-ss-mode="swarm_gate"] #ss-gate-health #ss-gate{transition:width .12s,background-color .2s,box-shadow .2s}
body[data-ss-mode="swarm_gate"] #ss-gate-health.swarm-gate-hit #ss-gate{background:#fff4f0!important;box-shadow:0 0 10px 2px #ff5a4f}
body[data-ss-mode="swarm_gate"] #ss-gate-health.swarm-gate-hit #ss-gate-value{animation:swarmGateKnock .26s cubic-bezier(.2,.9,.3,1)}
body[data-ss-mode="swarm_gate"] #ss-gate-health.swarm-gate-low #ss-gate{background:linear-gradient(90deg,#ff3f55,#ff9a52)!important;animation:swarmGateLow 1.1s ease-in-out infinite}
body[data-ss-mode="swarm_gate"] #ss-gate-health.swarm-gate-low #ss-gate-value{color:#ff8a7a}
@keyframes swarmGateKnock{0%{transform:scale(1)}35%{transform:scale(1.12) translateY(1px);color:#ffb0a6}100%{transform:scale(1)}}
@keyframes swarmGateLow{50%{filter:brightness(1.55) saturate(1.2)}}
@media (prefers-reduced-motion: reduce){body[data-ss-mode="swarm_gate"] #ss-gate-health #ss-gate,body[data-ss-mode="swarm_gate"] #ss-gate-health #ss-gate-value{animation:none!important}}`;document.head.append(st);}
    this.bar=document.getElementById('ss-gate-health');
  }
  stats(){return{ambientActive:this.oneShots.filter(o=>o.active).length};}
  drawCracks(c,w,h,level){
    // Deterministic jagged fractures radiating from bite points along the door foot.
    let seed=level*97+13;const r=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    const origins=[[.5,.97],[.3,.95],[.72,.96],[.5,.55]].slice(0,level+1);
    for(const [ox,oy] of origins){const branches=4+level*2;for(let b=0;b<branches;b++){let x=ox*w,y=oy*h,a=-Math.PI/2+(r()-.5)*2.4,len=(46+r()*52)*(.85+level*.4);
      const pts=[[x,y]];for(let s=0;s<5+level;s++){a+=(r()-.5)*.9;x+=Math.cos(a)*len/5;y+=Math.sin(a)*len/5;pts.push([x,y]);}
      for(const [width,color] of [[8+level,'rgba(255,220,180,.42)'],[4.6+level*.6,'rgba(14,8,10,.95)']]){c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.beginPath();c.moveTo(pts[0][0]+(width>4?1.5:0),pts[0][1]+(width>4?1.5:0));for(const [px,py] of pts.slice(1))c.lineTo(px+(width>4?1.5:0),py+(width>4?1.5:0));c.stroke();}}}
    // Bite notches at the foot.
    c.fillStyle='rgba(16,10,12,.85)';for(let i=0;i<level*2;i++){const x=w*(.22+r()*.56);c.beginPath();c.arc(x,h,8+r()*10+level*3,Math.PI,0);c.fill();}
  }
  gateFrame(){
    // Door rectangle in world: centred on the gate anchor, ~6 x 5.6 units up the camera plane.
    const g=this.stage.gateSprite;if(!g)return null;const base=g.getWorldPosition(new this.THREE.Vector3());
    const at=(right,up)=>base.clone().addScaledVector(this.fx.right,right).addScaledVector(this.fx.up,up);return{base,at,width:6.1,height:5.5};
  }
  shot(map,born,life,step,order=22){let o=this.oneShots.find(o=>!o.active);if(!o){o=this.oneShots[0];this.oneShots.push(this.oneShots.shift());}Object.assign(o,{active:true,born,life,step});const m=o.sprite.material;if(m.map!==map){m.map=map;m.needsUpdate=true;}m.opacity=1;m.rotation=0;m.color.set('#fff');o.sprite.renderOrder=order;o.sprite.visible=false;return o;}

  waveStart(e,s){
    const now=this.fx.now();this.waveFlash=now;
    for(const rec of this.fx.turrets.records.values())rec.kick=Math.max(rec.kick,.5);
    if(!this.fx.reduced){this.stage.kick?.(.12,.3,performance.now());
      for(let k=0;k<26;k++){const x=(Math.random()-.5)*40;this.fx.impacts.sparks.spawn({born:now+Math.random()*.4,life:.9+Math.random()*.5,x,y:.6,z:-26.5+Math.random()*2,vx:0,vy:2+Math.random()*2.5,vz:0,g:0,dragY:.6,size:.18+Math.random()*.16,aspect:1,rot:0,spin:0,color:k%2?'#ff7a52':'#ffcf7a'});}}
  }
  waveClear(e,s){
    const now=this.fx.now(),gf=this.gateFrame();if(!gf)return;
    const bursts=[[-3.6,6.4,this.tex.fwGold,0],[3.8,7.1,this.tex.fwLime,.22],[0,8.4,this.tex.fwGold,.44],[-6.5,5.2,this.tex.sparkle,.3],[6.4,5.4,this.tex.sparkle,.55]];
    for(const [x,u,map,delay] of bursts){const pos=gf.at(x,u),rot=Math.random()*.6-.3;this.shot(map,now+delay,.9,(o,t)=>{o.sprite.position.copy(pos);const sc=this.fx.reduced?3.2:3.6*(.3+.7*(1-Math.pow(1-Math.min(1,t*1.8),3)));o.sprite.scale.set(sc,sc,1);o.sprite.material.rotation=rot;o.sprite.material.opacity=t<.55?1:1-(t-.55)/.45;});}
    for(let k=0;k<6;k++){const x=(k-2.5)*.95,pos0=gf.at(x,1.4+(k%2)*.8);this.shot(this.tex.heal,now+.1+k*.09,1.25,(o,t)=>{o.sprite.position.copy(pos0).addScaledVector(this.fx.up,this.fx.reduced?0:t*3.2);const sc=.95*(t<.15?t/.15:1);o.sprite.scale.set(sc,sc,1);o.sprite.material.opacity=t<.6?1:1-(t-.6)/.4;},21);}
    const glowPos=gf.at(0,2.7);this.shot(this.tex.glow,now,.9,(o,t)=>{o.sprite.position.copy(glowPos);o.sprite.scale.set(9,8,1);o.sprite.material.color.set('#9dffb0');o.sprite.material.opacity=.55*Math.sin(Math.PI*t);},7);
    for(const rec of this.fx.turrets.records.values())rec.kick=Math.max(rec.kick,.6);
    if(this.fx.reduced)return;
    const colors=['#ffd36b','#b9ff67','#7fe0ff','#ff7bb0','#c99bff'];
    for(let k=0;k<44;k++){const a=Math.random()*Math.PI*2,sp=2+Math.random()*5,o=gf.at((Math.random()-.5)*4,5.2);this.fx.impacts.debris.spawn({born:now+Math.random()*.25,life:1.3+Math.random()*.6,x:o.x,y:o.y,z:o.z,vx:Math.cos(a)*sp,vy:5+Math.random()*5,vz:Math.sin(a)*sp*.5,g:9,dragY:.4,drag:.8,size:.2+Math.random()*.14,aspect:.6,rot:a,spin:(Math.random()-.5)*16,color:colors[k%colors.length]});}
  }

  update(s,dt){
    const THREE=this.THREE,now=this.fx.now(),cam=this.stage.camera,reduced=this.fx.reduced,base=this.stage.cameraBase||cam.position;
    // Fog band over the spawn line, sized to the current frame.
    const fogCenter=new THREE.Vector3(0,.6,-27.5).addScaledVector(this.fx.up,1.5),width=(cam.right-cam.left)*1.1;this.fog.position.copy(fogCenter);this.fog.scale.set(width,9.5,1);
    this.fog.material.opacity=reduced?.9:.82+.12*Math.sin(now*.7)+(now-this.waveFlash<1.2?-.25*Math.sin(Math.PI*(now-this.waveFlash)/1.2):0);
    // Horn flare on wave start: a hot band sweeps the spawn line.
    const wf=now-this.waveFlash;this.band.visible=wf>=0&&wf<1.4;if(this.band.visible){const u=wf/1.4;this.band.position.set(0,.6,-26.2);this.band.scale.set(width*(reduced?1:.4+.6*Math.min(1,u*3)),reduced?1.6:1.2+2.4*Math.sin(Math.PI*Math.min(1,u*1.4)),1);this.band.material.color.set('#ff5a3c');this.band.material.opacity=Math.sin(Math.PI*u)*.85;}
    // Gate state.
    const gf=this.gateFrame(),max=s.maxGate||1000,gate=s.gate??max,frac=clamp(gate/max,0,1);
    if(gf){
      const level=frac>.8?0:frac>.55?1:frac>.3?2:3;this.crack.visible=level>0&&gate>0;if(this.crack.visible){const map=this.tex.cracks[level-1];if(this.crack.material.map!==map){this.crack.material.map=map;this.crack.material.needsUpdate=true;}this.crack.position.copy(gf.at(0,gf.height/2));this.crack.scale.set(gf.width,gf.height,1);this.crack.material.opacity=.92;}
      // Damage thumps: integrate the real gate loss, punch every ~1.5% (rate-limited).
      if(this.lastGate!=null&&gate<this.lastGate&&s.phase==='playing')this.dropAcc+=this.lastGate-gate;else if(this.lastGate!=null&&gate>this.lastGate)this.dropAcc=0;
      this.lastGate=gate;
      if(this.dropAcc>=15&&now-this.thumpAt>.38){this.dropAcc=0;this.thumpAt=now;this.hurt=1;if(!reduced)this.stage.kick?.(.06,.14,performance.now());
        this.bar?.classList.add('swarm-gate-hit');clearTimeout(this.barTimer);this.barTimer=setTimeout(()=>this.bar?.classList.remove('swarm-gate-hit'),260);}
      this.hurt*=Math.exp(-dt*6);this.hurtFlash.visible=this.hurt>.02;if(this.hurtFlash.visible){this.hurtFlash.position.copy(gf.at(0,2.4));this.hurtFlash.scale.set(9,7,1);this.hurtFlash.material.color.set('#ff3a3a');this.hurtFlash.material.opacity=.55*this.hurt;}
      this.bar?.classList.toggle('swarm-gate-low',frac<.35&&s.phase==='playing');
      // Chewing: wood splinters + dust fly off the door where bugs gnaw.
      const chewers=s.phase==='playing'?s.enemies.filter(b=>b.z>=-1):[];
      if(chewers.length&&!reduced&&now>=this.splinterAt){this.splinterAt=now+Math.max(.07,.5/Math.min(8,chewers.length));const b=chewers[Math.floor(Math.random()*chewers.length)],x=clamp(b.x,-2.8,2.8),o=gf.at(x,.9+Math.random()*1.3);
        for(let k=0;k<3;k++){const a=-Math.PI/2+(Math.random()-.5)*2.2;this.fx.impacts.debris.spawn({born:now,life:.45+Math.random()*.25,x:o.x,y:o.y,z:o.z,vx:Math.cos(a)*2.4,vy:2.5+Math.random()*2.5,vz:0,g:14,drag:1,size:.15+Math.random()*.12,aspect:.45,rot:Math.random()*6,spin:(Math.random()-.5)*20,color:k%2?'#9a6a3e':'#d19a5a'});}
        if(Math.random()<.35)this.fx.impacts.smoke.spawn({born:now,life:.5,x:o.x,y:o.y,z:o.z,vx:(Math.random()-.5)*.6,vy:.8,vz:0,g:0,size:.55,grow:1,rot:Math.random()*6,spin:0,color:'#b9a48c'});}
      // Braziers flicker on the tower tops.
      for(const b of this.braziers){const pos=gf.at(b.side*4.25,7.05),f=reduced?1:.85+.12*Math.sin(now*11+b.seed)+.08*Math.sin(now*23.7+b.seed*2);b.flame.position.copy(pos).addScaledVector(this.fx.up,.75);b.flame.scale.set(1.15*f,1.9*(reduced?1:.9+.18*Math.sin(now*9+b.seed)),1);b.flame.material.opacity=.95;
        b.glow.position.copy(pos);b.glow.scale.setScalar(3.2*f);b.glow.material.color.set('#ff9a3c');b.glow.material.opacity=.42*f;
        if(!reduced&&Math.random()<dt*3)this.fx.impacts.sparks.spawn({born:now,life:.9,x:pos.x+(Math.random()-.5)*.3,y:pos.y+.6,z:pos.z,vx:(Math.random()-.5)*.4,vy:1.4,vz:0,g:-.3,size:.1,aspect:1,rot:0,spin:0,color:'#ffb45a'});}
    }
    // Danger vignette: rises below half gate, spikes on thumps; static under reduced motion.
    const danger=s.phase==='playing'?clamp((.55-frac)/.45,0,1):0,target=danger*.7+this.hurt*.35*(reduced?0:1);this.vigLevel+=(target-this.vigLevel)*(1-Math.exp(-dt*4));
    if(this.vignette){const pulse=reduced||danger<.05?1:.82+.18*Math.sin(now*Math.PI*1.6);this.vignette.style.opacity=(this.vigLevel*pulse).toFixed(3);}
    // Motes drift slowly through the courtyard light.
    if(this.moteMesh){const o=this._o||=new THREE.Object3D(),c=this._c||=new THREE.Color();let i=0;for(const m of this.motes){m.x+=m.v*dt*.6;m.z+=Math.sin(now*.3+m.p)*dt*.25;if(m.x>23)m.x=-23;o.position.set(m.x,m.y+Math.sin(now*.8+m.p)*.25,m.z);o.quaternion.copy(cam.quaternion);o.scale.setScalar(m.s);o.updateMatrix();this.moteMesh.setMatrixAt(i,o.matrix);c.copy(m.c).multiplyScalar(.28+.22*Math.sin(now*1.3+m.p*2));this.moteMesh.setColorAt(i++,c);}this.moteMesh.instanceMatrix.needsUpdate=true;this.moteMesh.instanceColor.needsUpdate=true;}
    // One-shot sprites.
    for(const o of this.oneShots){if(!o.active)continue;const t=(now-o.born)/o.life;if(t>=1){o.active=false;o.sprite.visible=false;continue;}if(t<0){o.sprite.visible=false;continue;}o.sprite.visible=true;o.step(o,t);}
  }
}
