// Swarm Gate shot/hit/kill juice. Everything is pooled: fixed sprite/plane pools that steal
// their oldest member, and instanced particle buffers with hard caps. Kill effects start
// exactly when the host projectile lands (same flight time), on the authoritative death
// centre. The host's own required death pop, death frames, spinning puffs and score popups
// still play; these layers add flash, staged fireball, debris, sparks and ground marks.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=seed=>{const n=Math.sin(seed*12.9898+78.233)*43758.5453;return n-Math.floor(n);};
const KIND={termite:{s:1,goo:'#f2a03c',shell:['#ff9a3d','#ffd27a','#7a3b1d']},runner:{s:.9,goo:'#d9c24a',shell:['#ffd23e','#7a3cc8','#fff1b8']},tank:{s:1.45,goo:'#7fcf4a',shell:['#3fae3c','#9be06a','#2b3a2c']},boss:{s:2.3,goo:'#d8466a',shell:['#e8414f','#8a3fc4','#ffb0b8']}};

class SpritePool{
  constructor(fx,size,{additive=false,renderOrder=16,depthTest=false}={}){
    const THREE=fx.THREE;this.fx=fx;this.items=[];this.cursor=0;
    for(let i=0;i<size;i++){const m=new THREE.SpriteMaterial({transparent:true,depthTest,depthWrite:false,toneMapped:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending});const s=new THREE.Sprite(m);s.visible=false;s.renderOrder=renderOrder;fx.stage.scene.add(s);this.items.push({sprite:s,active:false});}
  }
  acquire(map,born,life,step,data={}){
    // Prefer a free slot; otherwise recycle the oldest (cursor walks in spawn order).
    let item=this.items.find(i=>!i.active);if(!item){item=this.items[this.cursor];this.cursor=(this.cursor+1)%this.items.length;}
    Object.assign(item,{active:true,born,life,step,data});const m=item.sprite.material;if(m.map!==map){m.map=map;m.needsUpdate=true;}
    if('rotation' in m)m.rotation=0;m.opacity=1;m.color.set('#ffffff');item.sprite.center?.set(.5,.5);item.sprite.visible=false;return item;
  }
  update(now){let n=0;for(const i of this.items){if(!i.active)continue;const age=now-i.born;if(age>=i.life){i.active=false;i.sprite.visible=false;continue;}if(age<0){i.sprite.visible=false;continue;}i.sprite.visible=true;i.step(i,age/i.life,age);n++;}return n;}
}
class PlanePool{
  constructor(fx,size,{additive=false,renderOrder=1}={}){
    const THREE=fx.THREE;this.items=[];this.cursor=0;const geo=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
    for(let i=0;i<size;i++){const m=new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending});const mesh=new THREE.Mesh(geo,m);mesh.visible=false;mesh.renderOrder=renderOrder;fx.stage.scene.add(mesh);this.items.push({sprite:mesh,active:false});}
  }
}
PlanePool.prototype.acquire=SpritePool.prototype.acquire;PlanePool.prototype.update=SpritePool.prototype.update;

class Particles{
  // One draw call per texture; per-instance colour; additive ones fade to black.
  constructor(fx,map,cap,{additive=false,renderOrder=19}={}){
    const THREE=fx.THREE;this.fx=fx;this.cap=cap;this.list=[];this.additive=additive;
    this.mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending}),cap);
    this.mesh.count=0;this.mesh.frustumCulled=false;this.mesh.renderOrder=renderOrder;this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.mesh.setColorAt(0,new THREE.Color());fx.stage.scene.add(this.mesh);
    this.o=new THREE.Object3D();this.c=new THREE.Color();this.q=new THREE.Quaternion();this.z=new THREE.Vector3(0,0,1);
  }
  spawn(p){if(this.list.length>=this.cap)this.list.shift();this.list.push(p);}
  update(now,dt){
    const o=this.o,camQ=this.fx.stage.camera.quaternion;let n=0;const keep=[];
    for(const p of this.list){const age=now-p.born;if(age>=p.life)continue;keep.push(p);if(age<0)continue;
      const step=Math.min(dt,.05);p.vy-=(p.g??0)*step;p.x+=p.vx*step;p.y+=p.vy*step;p.z+=p.vz*step;
      if(p.floor!=null&&p.y<p.floor){p.y=p.floor;p.vy=Math.abs(p.vy)*.38;p.vx*=.6;p.vz*=.6;p.spin*=.5;}
      p.vx*=Math.exp(-(p.drag||0)*step);p.vz*=Math.exp(-(p.drag||0)*step);p.vy*=Math.exp(-(p.dragY||0)*step);p.rot+=p.spin*step;
      const u=age/p.life,fade=this.additive?Math.pow(1-u,1.4):1,shrink=this.additive?1:(u<.7?1:1-(u-.7)/.3),size=p.size*(p.grow?1+u*p.grow:1)*shrink;
      o.position.set(p.x,p.y,p.z);o.quaternion.copy(camQ);this.q.setFromAxisAngle(this.z,p.rot);o.quaternion.multiply(this.q);o.scale.set(size*(p.aspect||1),size,1);o.updateMatrix();
      this.mesh.setMatrixAt(n,o.matrix);this.c.set(p.color).multiplyScalar(fade);this.mesh.setColorAt(n,this.c);n++;
    }
    this.list=keep;this.mesh.count=n;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;return n;
  }
}

export class SwarmImpacts{
  constructor(fx){
    this.fx=fx;this.THREE=fx.THREE;const tex=n=>fx.texture('atlas-fx-combat/'+n+'.webp');
    this.tex={exp:[1,2,3,4].map(i=>tex('explosion-'+i)),spark:tex('spark-burst'),flash:tex('hit-flash'),muzzle:tex('muzzle-flash-side'),muzzleFront:tex('muzzle-flash-front'),smoke:tex('smoke-puff-b'),dust:tex('dust-puff'),ring:tex('shockwave-ring'),scorch:tex('scorch-decal'),glow:fx.texture('atlas-fx-celebration/glow-orb.webp'),casing:tex('shell-casing'),
      tracer:fx.canvasTexture('swarm-tracer',128,32,(c,w,h)=>{const g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.7,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,1)');c.fillStyle=g;const v=c.createLinearGradient(0,0,0,h);c.fillRect(0,h*.3,w,h*.4);c.globalAlpha=.35;c.fillRect(0,h*.12,w,h*.76);}),
      shard:fx.canvasTexture('swarm-shard',64,64,(c)=>{c.fillStyle='#fff';c.beginPath();c.moveTo(32,4);c.lineTo(58,40);c.lineTo(36,60);c.lineTo(8,44);c.closePath();c.fill();c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.moveTo(32,4);c.lineTo(36,60);c.lineTo(8,44);c.closePath();c.fill();c.strokeStyle='rgba(20,16,34,.9)';c.lineWidth=5;c.beginPath();c.moveTo(32,4);c.lineTo(58,40);c.lineTo(36,60);c.lineTo(8,44);c.closePath();c.stroke();}),
      dot:fx.canvasTexture('swarm-dot',64,64,(c)=>{const g=c.createRadialGradient(32,32,0,32,32,30);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.75)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64);})};
    this.add=new SpritePool(fx,72,{additive:true,renderOrder:20});
    this.norm=new SpritePool(fx,56,{additive:false,renderOrder:16});
    this.tracers=new SpritePool(fx,48,{additive:true,renderOrder:24});
    // Killed bugs are held on screen until the shell lands (the server drops them at once).
    this.held=new SpritePool(fx,24,{renderOrder:2,depthTest:true});
    this.bugTex=Object.fromEntries(['termite','runner','tank','boss'].map(k=>[k,fx.texture('/assets/gameplay/sports-siege/sprites/swarm-'+k+'.webp')]));
    this.ground=new PlanePool(fx,40,{renderOrder:1});
    this.groundGlow=new PlanePool(fx,10,{additive:true,renderOrder:3});
    this.debris=new Particles(fx,this.tex.shard,260,{renderOrder:19});
    this.sparks=new Particles(fx,this.tex.dot,240,{additive:true,renderOrder:21});
    this.casings=new Particles(fx,this.tex.casing,48,{renderOrder:23});
    this.smoke=new Particles(fx,this.tex.smoke,60,{renderOrder:18});
    this.counts={};
  }
  stats(){return{fxSprites:this.counts.sprites||0,fxParticles:this.counts.particles||0};}
  get reduced(){return this.fx.reduced;}
  now(){return this.fx.now();}

  tracer(from,to,color,flight,hit){
    const born=this.now(),{angle}=this.fx.planeAngle(from,to),dur=Math.max(.06,flight),tail=.045,width=hit?.26:.2,head=new this.THREE.Vector3(),back=new this.THREE.Vector3(),c=new this.THREE.Color(color).lerp(new this.THREE.Color('#fff6d0'),.45);
    this.tracers.acquire(this.tex.tracer,born,dur+tail+.04,(i,u,age)=>{const a=Math.min(1,age/dur),b=clamp((age-tail)/dur,0,1);head.copy(from).lerp(to,a);back.copy(from).lerp(to,b);
      const len=this.fx.planeAngle(back,head).length;i.sprite.position.copy(back).lerp(head,.5);i.sprite.material.rotation=angle;i.sprite.scale.set(Math.max(.05,len),width,1);i.sprite.material.color.copy(c);i.sprite.material.opacity=age>dur?Math.max(0,1-(age-dur)/(tail+.04)):1;});
  }
  muzzleFlash(at,angle,color){
    const born=this.now(),pos=at.clone(),flip=Math.random()<.5?1:-1,c=new this.THREE.Color(color).lerp(new this.THREE.Color('#fff2b0'),.6);
    this.add.acquire(this.tex.muzzle,born,.075,(i,u)=>{i.sprite.position.copy(pos);i.sprite.center.set(.06,.5);i.sprite.material.rotation=angle;const s=1-u*.4;i.sprite.scale.set(1.9*s,1.05*s*flip,1);i.sprite.material.opacity=1-u;});
    this.add.acquire(this.tex.glow,born,.09,(i,u)=>{i.sprite.position.copy(pos);const s=1.25*(1-u*.5);i.sprite.scale.set(s,s,1);i.sprite.material.color.copy(c);i.sprite.material.opacity=.9*(1-u);});
  }
  casing(at,side){
    if(this.reduced||this.fx.turrets.S<1)return;const born=this.now(),r=Math.random();
    this.casings.spawn({born,life:.6,x:at.x,y:at.y,z:at.z,vx:side.x*(2.2+r*1.5),vy:3.6+r*1.6,vz:side.z*(2.2+r*1.5),g:16,floor:at.y-.9,size:.26,aspect:1.1,rot:r*6,spin:(r-.5)*28,color:'#ffffff'});
  }
  steam(at){
    const born=this.now(),r=Math.random();
    this.smoke.spawn({born,life:.8,x:at.x+(r-.5)*.3,y:at.y+.2,z:at.z,vx:(r-.5)*.4,vy:1.6,vz:0,g:0,dragY:1.5,size:.55,grow:1.6,rot:r*6,spin:(r-.5)*2,color:'#d8dbe6'});
  }
  hit(to,delay,kind){
    const born=this.now()+delay,ks=(KIND[kind]||KIND.termite).s,pos=to.clone(),rot=Math.random()*6;
    this.add.acquire(this.tex.spark,born,.16,(i,u)=>{i.sprite.position.copy(pos);i.sprite.material.rotation=rot;const s=(.9+.5*ks)*(.7+u*.6);i.sprite.scale.set(s,s,1);i.sprite.material.color.set('#fff0b0');i.sprite.material.opacity=1-u*u;});
    if(this.reduced)return;
    for(let k=0;k<4;k++){const a=Math.random()*Math.PI*2,sp=3+Math.random()*4;this.sparks.spawn({born,life:.22,x:pos.x,y:pos.y,z:pos.z,vx:Math.cos(a)*sp,vy:2+Math.random()*3,vz:Math.sin(a)*sp,g:10,drag:4,size:.18,aspect:1,rot:a,spin:0,color:k%2?'#ffd36b':'#ffffff'});}
  }
  miss(to,delay){
    const born=this.now()+delay,pos=to.clone(),rot=(Math.random()-.5)*.6;
    this.norm.acquire(this.tex.dust,born,.42,(i,u)=>{i.sprite.position.copy(pos);i.sprite.material.rotation=rot;const s=.75+u*.7;i.sprite.scale.set(s*2.2,s,1);i.sprite.material.opacity=.6*(1-u);});
  }
  kill(e,p,delay,pulse=false){
    const THREE=this.THREE,kind=KIND[e.targetKind]?e.targetKind:'termite',K=KIND[kind],ks=K.s,dp=e.deathPosition||{x:e.x,z:e.z},o=new THREE.Vector3(dp.x,.68,dp.z),born=this.now()+delay,seed=Number(e.id||0)*7.13,big=kind==='tank'||kind==='boss';
    if(delay>0){const r={termite:.38,runner:.29,tank:.62,boss:1.1}[kind],size={termite:[3.5,4.2],runner:[4,4],tank:[3.8,4],boss:[3.5,4.3]}[kind],held=new THREE.Vector3(dp.x,r*.55,dp.z),angle=Math.atan2(-dp.x,-.85-dp.z);
      this.held.acquire(this.bugTex[kind],this.now(),delay,(i)=>{i.sprite.position.copy(held);i.sprite.scale.set(r*size[0],r*size[1],1);i.sprite.material.rotation=angle;i.sprite.material.color.set('#ffd0c8');});}
    // 1) white-hot flash the frame the shell lands
    this.add.acquire(this.tex.glow,born,.12,(i,u)=>{i.sprite.position.copy(o);const s=(1.2+1.1*ks)*(.6+Math.sqrt(u)*.7);i.sprite.scale.set(s,s,1);i.sprite.material.color.set('#ffd98a');i.sprite.material.opacity=.75*(1-u);});
    // 2) staged painted fireball: flash -> fireball -> fire in smoke -> smoke ring
    const rot=(rand(seed)-.5)*.8,stage=[.08,.22,.45,1],expLife=.62+.14*ks;
    this.norm.acquire(this.tex.exp[0],born,expLife,(i,u)=>{const f=stage.findIndex(v=>u<v),idx=f<0?3:f,m=this.tex.exp[idx];if(i.sprite.material.map!==m){i.sprite.material.map=m;}
      i.sprite.position.copy(o);i.sprite.material.rotation=rot+u*.35;const s=(1.55+.95*ks)*(.72+.55*(1-Math.pow(1-u,3)));i.sprite.scale.set(s,s,1);i.sprite.material.opacity=u<.7?1:Math.max(0,1-(u-.7)/.3);});
    // 3) additive spark star
    this.add.acquire(this.tex.spark,born,.22,(i,u)=>{i.sprite.position.copy(o);i.sprite.material.rotation=rot*2;const s=(1.6+ks)*(.6+u*.9);i.sprite.scale.set(s,s,1);i.sprite.material.color.set('#ffe39a');i.sprite.material.opacity=1-u;});
    // 4) goo splat on the ground that lingers and fades
    const splatRot=rand(seed+3)*Math.PI*2,splatSize=(1.25+.65*ks)*(.85+rand(seed+4)*.3),goo=new THREE.Color(K.goo),ground=new THREE.Vector3(dp.x,.02,dp.z);
    this.ground.acquire(this.tex.scorch,born+.05,this.reduced?3:5.5,(i,u)=>{i.sprite.position.copy(ground);i.sprite.rotation.y=splatRot;const g=u<.04?u/.04:1,s=splatSize*(.6+.4*g);i.sprite.scale.set(s,1,s);i.sprite.material.color.copy(goo);i.sprite.material.opacity=.78*(u<.65?1:1-(u-.65)/.35);});
    // 5) ground shock ring for heavies
    if(big){const size=kind==='boss'?8:5;this.groundGlow.acquire(this.tex.ring,born,.5,(i,u)=>{i.sprite.position.set(dp.x,.06,dp.z);const s=size*(.25+.75*(1-Math.pow(1-u,3)));i.sprite.scale.set(s,1,s);i.sprite.material.color.set(kind==='boss'?'#ffd36b':'#ffb36b');i.sprite.material.opacity=Math.pow(1-u,1.3);});}
    // 6) debris shards in the bug's own colours + embers + lingering smoke
    const shards=this.reduced||pulse?3:Math.round((6+5*ks)*(this.fx.turrets.S<1?.5:1));
    for(let k=0;k<shards;k++){const a=rand(seed+k*1.7)*Math.PI*2,sp=(2.4+rand(seed+k*2.3)*3.6)*(.8+ks*.35);this.debris.spawn({born,life:.55+rand(seed+k)*.35,x:o.x,y:o.y+.1,z:o.z,vx:Math.cos(a)*sp,vy:3.5+rand(seed+k*3.1)*4,vz:Math.sin(a)*sp,g:18,floor:.15,drag:1.5,size:(.16+rand(seed+k*5.3)*.2)*(.8+ks*.3),aspect:1,rot:a,spin:(rand(seed+k*4.1)-.5)*24,color:K.shell[k%K.shell.length]});}
    if(!this.reduced&&!pulse){const embers=Math.round(5+4*ks);for(let k=0;k<embers;k++){const a=rand(seed+k*9.1)*Math.PI*2,sp=1+rand(seed+k*6.7)*3;this.sparks.spawn({born,life:.35+rand(seed+k)*.4,x:o.x,y:o.y,z:o.z,vx:Math.cos(a)*sp,vy:2.5+rand(seed+k*8.3)*3.5,vz:Math.sin(a)*sp,g:4,drag:2.5,size:.16+rand(seed+k*2.9)*.14,aspect:1,rot:0,spin:0,color:k%3?'#ffb04a':'#fff2b0'});}
      for(let k=0;k<(big?4:2);k++){const a=rand(seed+k*3.3)*Math.PI*2;this.smoke.spawn({born:born+.12,life:.9+ks*.2,x:o.x+Math.cos(a)*.4*ks,y:o.y+.3,z:o.z+Math.sin(a)*.4*ks,vx:Math.cos(a)*.6,vy:1.1,vz:Math.sin(a)*.6,g:0,dragY:1.2,drag:1,size:(.7+.35*ks),grow:1.1,rot:a,spin:(rand(seed+k)-.5)*1.5,color:'#8f8aa0'});}}
    // 7) boss: chained secondary blasts + heavier camera punch at impact
    if(kind==='boss'){for(let k=0;k<3;k++){const a=k*2.1+rand(seed)*2,q=o.clone().add(new THREE.Vector3(Math.cos(a)*1.2,0,Math.sin(a)*1.2)),b=born+.1+k*.11;
        this.norm.acquire(this.tex.exp[1],b,.45,(i,u)=>{const m=this.tex.exp[u<.35?1:u<.7?2:3];if(i.sprite.material.map!==m)i.sprite.material.map=m;i.sprite.position.copy(q);const s=2.2*(.7+u*.5);i.sprite.scale.set(s,s,1);i.sprite.material.opacity=u<.75?1:1-(u-.75)/.25;});}
      this.fx.stage.kick?.(.5,.5,performance.now()+delay*1000);}
    else if(big)this.fx.stage.kick?.(.2,.24,performance.now()+delay*1000+30);
  }
  pulse(e){
    const born=this.now(),pos=new this.THREE.Vector3(e.x,.08,e.z);
    this.groundGlow.acquire(this.tex.ring,born,.6,(i,u)=>{i.sprite.position.copy(pos);const s=9.4*(.15+.85*(1-Math.pow(1-u,3)));i.sprite.scale.set(s,1,s);i.sprite.material.color.set('#b9ff67');i.sprite.material.opacity=Math.pow(1-u,1.2);});
    if(this.reduced)return;
    for(let k=0;k<18;k++){const a=k/18*Math.PI*2;this.smoke.spawn({born,life:.6,x:pos.x+Math.cos(a)*.6,y:.4,z:pos.z+Math.sin(a)*.6,vx:Math.cos(a)*7,vy:.6,vz:Math.sin(a)*7,g:0,drag:4.5,size:.7,grow:.8,rot:a,spin:0,color:'#c8e8a6'});}
  }
  update(dt){
    const now=this.now();let sprites=0,particles=0;
    for(const pool of [this.held,this.add,this.norm,this.tracers,this.ground,this.groundGlow])sprites+=pool.update(now);
    for(const p of [this.debris,this.sparks,this.casings,this.smoke])particles+=p.update(now,dt);
    this.counts={sprites,particles};
  }
}
