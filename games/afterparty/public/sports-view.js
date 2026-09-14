import * as T from './vendor/three.module.js';
import {Venue} from './venues.js';
import {cameraPlan,fitCamera,focusPoints,FrameBudget,damp,clamp,BoundedEffects} from './motion.js';
export class SportsView {
 constructor(container,mode,onError){
  this.container=container;this.mode=mode;this.onError=onError;this.objects=new Map();this.materials=[];this.geometries=[];this.textures=[];
  this.scene=new T.Scene();this.scene.background=new T.Color('#202435');this.scene.fog=new T.Fog('#202435',52,105);
  this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  const gl=this.renderer.getContext(),dbg=gl.getExtension('WEBGL_debug_renderer_info'),gpu=dbg?String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)):'';
  this.low=/swiftshader|llvmpipe|softpipe|software/i.test(gpu);this.quality='auto';this.budget=new FrameBudget();this.dirty=true;
  this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
  this.renderer.shadowMap.enabled=!this.low;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label',mode==='bowling'?'Трёхмерный боулинг-зал':'Трёхмерный ледовый зал');
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();onError('Графический контекст потерян. Обнови только экран ведущего — матч сохранён на сервере.');});
  this.camera=new T.PerspectiveCamera(49,1,.1,140);this.look=new T.Vector3();this.pos=new T.Vector3();this.quat=new T.Quaternion();this.v=new T.Vector3();this.dummy=new T.Object3D();
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.overview=this.reduced;
  this.scene.add(new T.HemisphereLight('#e5ecff','#4d304d',2.1));const light=new T.DirectionalLight('#fff0d6',3.1);light.position.set(-6,19,8);light.target.position.set(0,0,14);light.castShadow=true;light.shadow.mapSize.set(1536,1536);Object.assign(light.shadow.camera,{left:-9,right:9,top:23,bottom:-14,near:.5,far:60});light.shadow.normalBias=.018;this.scene.add(light,light.target);
  const rim=new T.DirectionalLight('#a584ff',1.3);rim.position.set(11,8,27);this.scene.add(rim);
  this.venue=new Venue(this.scene,this.renderer,mode,this.low);
  this.unitSphere=this.geo(new T.SphereGeometry(1,24,16));this.unitCylinder=this.geo(new T.CylinderGeometry(1,1,1,32));
  this.pinGeo=this.geo(new T.LatheGeometry([[.07,0],[.13,.07],[.155,.20],[.15,.4],[.105,.58],[.06,.72],[.065,.82],[.1,.91],[.085,1.01],[.02,1.05]].map(([r,y])=>new T.Vector2(r,y-.51)),28));
  this.fx=new BoundedEffects(this.low?100:240);this.fxMesh=new T.InstancedMesh(this.geo(new T.IcosahedronGeometry(1,0)),this.mat('#ffffff',.45,.1),this.fx.limit);this.fxMesh.count=0;this.fxMesh.frustumCulled=false;this.scene.add(this.fxMesh);
  this.colour=new T.Color();this.lastEvent=0;this.trailAt=0;this.elapsed=0;this.rackId=-1;this.fpsSamples=[];this.renderAt=0;
  this.guideGeo=this.geo(new T.BufferGeometry());this.guideGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(24*3),3));this.guideMat=new T.LineDashedMaterial({color:'#d8c6ff',transparent:true,opacity:.65,dashSize:.24,gapSize:.16});this.guide=new T.Line(this.guideGeo,this.guideMat);this.scene.add(this.guide);
  this.brooms=this.makeBrooms();this.scene.add(this.brooms);this.brooms.visible=false;
  const start=cameraPlan(mode,{});this.camera.position.set(...start.position);this.look.set(...start.target);this.camera.lookAt(this.look);
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
 }
 geo(g){this.geometries.push(g);return g;}
 mat(color,roughness=.45,metalness=.05){const m=new T.MeshStandardMaterial({color,roughness,metalness});this.materials.push(m);return m;}
 mesh(g,geo,mat,x,y,z,sx=1,sy=sx,sz=sx){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
 ring(g,r,y,color,tube=.013){const m=this.mesh(g,this.geo(new T.TorusGeometry(r,tube,8,36)),this.mat(color,.23,.4),0,y,0);m.rotation.x=-Math.PI/2;return m;}
 makePin(){if(this.pinTemplate)return this.pinTemplate.clone(true);const g=new T.Group();this.mesh(g,this.pinGeo,this.mat('#fff7e8',.22,.06),0,0,0);this.ring(g,.066,.23,'#8c45d8');this.ring(g,.069,.29,'#ad7ae3');this.ring(g,.070,.31,'#e9c378',.005);this.pinTemplate=g;return g.clone(true);}
 makeBall(colour){if(this.ballTemplate)return this.ballTemplate.clone(true);const g=new T.Group();const m=this.mat(colour||'#9655e7',.16,.28);
  if(!this.ballTex){const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');x.fillStyle='#ab88da';x.fillRect(0,0,256,128);for(let i=0;i<30;i++){x.strokeStyle=i%3?'rgba(76,30,135,.24)':'rgba(242,210,255,.35)';x.lineWidth=i%4+1;x.beginPath();for(let j=-20;j<276;j+=5){const y=i*5+Math.sin(j*.043+i)*10;j===-20?x.moveTo(j,y):x.lineTo(j,y);}x.stroke();}this.ballTex=new T.CanvasTexture(c);this.ballTex.colorSpace=T.SRGBColorSpace;this.textures.push(this.ballTex);}m.map=this.ballTex;
  this.mesh(g,this.unitSphere,m,0,0,0,.23);const holes=this.mat('#171020',.72);
  for(const [x,z]of [[-.04,.02],[.035,.025],[0,-.05]])this.mesh(g,this.unitSphere,holes,x,.218,z,.023,.012,.023);this.ballTemplate=g;return g.clone(true);
 }
 makeStone(s){this.stoneTemplates||=new Map();if(this.stoneTemplates.has(s.team))return this.stoneTemplates.get(s.team).clone(true);const g=new T.Group(),metal=this.mat('#6e8089',.29,.4),accent=this.mat(s.team?'#61c9df':'#a773df',.24,.23);
  this.mesh(g,this.unitCylinder,metal,0,.19,0,.32,.33,.32);this.mesh(g,this.unitCylinder,accent,0,.38,0,.277,.06,.277);this.ring(g,.318,.25,'#d3dce0',.007);
  const curve=new T.CatmullRomCurve3([new T.Vector3(-.14,.40,0),new T.Vector3(-.12,.56,0),new T.Vector3(.12,.56,0),new T.Vector3(.14,.4,0)]);
  this.mesh(g,this.geo(new T.TubeGeometry(curve,16,.035,8,false)),accent,0,0,0);this.stoneTemplates.set(s.team,g);return g.clone(true);
 }
 makeBrooms(){const g=new T.Group();for(const side of [-1,1]){const b=new T.Group();b.position.set(side*.6,0,0);g.add(b);this.mesh(b,this.venue.geo,this.mat('#8870b5'),0,.1,0,.5,.14,.22);this.mesh(b,this.venue.geo,this.mat('#c9e4dd'),0,.045,0,.48,.07,.2);const handle=this.mesh(b,this.unitCylinder,this.mat('#c6adc9',.25,.4),0,.62,.2,.018,1.3,.018);handle.rotation.x=.32;}return g;}
 clear(){for(const o of this.objects.values())this.scene.remove(o);this.objects.clear();this.fx.clear();this.lastEvent=0;this.rackId=-1;}
 setState(s){if(this.state?.phase!==s.phase||this.state?.state!==s.state||this.state?.rackId!==s.rackId)this.dirty=true;this.state=s;if(this.rackId!==s.rackId&&this.mode==='bowling'){for(const [k,o]of this.objects){if(k.startsWith('pin')||k==='ball'){this.scene.remove(o);this.objects.delete(k);}}this.rackId=s.rackId;}
  for(const e of s.events||[]){if(e.id<=this.lastEvent)continue;this.lastEvent=e.id;
   if(['impact','strike','spare'].includes(e.kind))this.burst(-(e.x||0),.6,e.z||22,e.kind==='impact'?12:32,e.kind==='impact'?'#e9d7b6':'#bd8be9');
  }
 }
 burst(x,y,z,count,color){if(this.reduced)return;for(let i=0;i<count;i++)this.fx.add({x,y,z,vx:(Math.random()-.5)*2.8,vy:.5+Math.random()*2,vz:(Math.random()-.5)*2,age:0,life:.4+Math.random()*.5,size:.018+Math.random()*.04,color});}
 object(key,factory){let o=this.objects.get(key);if(!o){o=factory();o.userData.fresh=true;this.objects.set(key,o);this.scene.add(o);}o.userData.used=true;return o;}
 pose(o,p,q,dt){const a=o.userData.fresh?1:1-Math.exp(-24*dt);this.v.set(-p.x,p.y,p.z);o.position.lerp(this.v,a);if(q){this.quat.set(q.x,-q.y,-q.z,q.w);o.quaternion.slerp(this.quat,a);}o.userData.fresh=false;}
 update(dt,now,paused){
  const s=this.state;if(!s||!this.renderer)return;const idle=s.phase==='waiting'||paused;if(!this.dirty&&now-this.renderAt<(idle?500:this.low?90:16))return;const frameMS=this.renderAt?now-this.renderAt:16;this.renderAt=now;this.dirty=false;if(!idle&&this.quality==='auto'&&!this.low&&this.budget.sample(frameMS,now))this.resize();
  const step=paused?0:Math.min(.12,(this.lastNow?now-this.lastNow:16)/1000);this.lastNow=now;this.elapsed+=step;
  for(const o of this.objects.values())o.userData.used=false;
  const preview=s.aimPreview&&s.aimPreview.owner===s.currentId?s.aimPreview:null;this.guide.visible=!!preview&&s.state==='aim';if(this.guide.visible){const a=this.guideGeo.attributes.position;for(let i=0;i<24;i++){const d=i/23*7,v=this.mode==='bowling'?7+preview.power*7:4.4+preview.power*4.5,x=preview.offset*(this.mode==='bowling'?1.25:1.4)+preview.angle*(this.mode==='bowling'?1.05:.62)*d/v;a.setXYZ(i,-x,.04,2+d);}a.needsUpdate=true;this.guide.computeLineDistances();}
  if(this.mode==='bowling'){
   let pins=s.pins||[];if(s.phase==='waiting'){pins=[];for(let r=0,id=0;r<4;r++)for(let k=0;k<=r;k++)pins.push({id:id++,p:{x:(k-r/2)*.54,y:.51,z:22+r*.48},q:{x:0,y:0,z:0,w:1}});}
   for(const p of pins)this.pose(this.object('pin'+p.id,()=>this.makePin()),p.p,p.q,step||dt);
   if(s.ball)this.pose(this.object('ball',()=>this.makeBall('#9e64e4')),s.ball.p,s.ball.q,step||dt);
   else if(s.state==='aim'||s.phase==='waiting'){const o=this.object('preview',()=>this.makeBall('#9e64e4'));o.position.set(-(preview?.offset||0)*1.25,.23,2);}
  }else{
   for(const p of s.stones||[]){const o=this.object('stone'+p.id,()=>this.makeStone(p));this.pose(o,{x:p.x,y:0,z:p.z},null,step||dt);if(!paused)o.rotation.y+=(p.spin||0)*step;}
   if(s.state==='aim'||s.phase==='waiting'){const o=this.object('preview',()=>this.makeStone({team:s.players.find(p=>p.id===s.currentId)?.team||0}));o.position.set(-(preview?.offset||0)*1.4,0,2);}
   const active=s.stones?.at(-1),owner=s.players.find(p=>p.id===s.currentId),sweep=s.players.some(p=>p.team===owner?.team&&p.sweeping>s.time&&p.stamina>.02);
   this.brooms.visible=!!active&&s.state==='rolling'&&sweep;if(this.brooms.visible){this.brooms.position.set(-active.x+Math.sin(this.elapsed*20)*.13,0,active.z+.72);}
   if(!paused&&active&&s.state==='rolling'&&this.elapsed-this.trailAt>.075&&Math.hypot(active.vx,active.vz)>.5){this.trailAt=this.elapsed;this.burst(-active.x,.03,active.z-.25,sweep?3:1,'#acdfe9');}
  }
  for(const [k,o]of this.objects)if(!o.userData.used){this.scene.remove(o);this.objects.delete(k);}
  const plan=cameraPlan(this.mode,s,this.overview||this.reduced,this.camera.aspect);const rate=s.state==='aim'?1.75:3.8;
  if(!paused){this.pos.set(...plan.position);this.camera.position.lerp(this.pos,1-Math.exp(-rate*step));this.v.set(...plan.target);this.look.lerp(this.v,1-Math.exp(-rate*step));this.camera.fov=damp(this.camera.fov,plan.fov,3,step);this.camera.updateProjectionMatrix();}
  if(!this.overview&&!this.reduced&&s.state==='rolling'){const fitted=fitCamera({position:this.camera.position.toArray(),target:this.look.toArray(),fov:this.camera.fov},focusPoints(this.mode,s),this.camera.aspect);this.camera.position.set(...fitted.position);}
  this.camera.lookAt(this.look);
  this.fx.tick(step);let i=0;for(const p of this.fx.items){p.x+=p.vx*step;p.y=Math.max(.02,p.y+p.vy*step);p.z+=p.vz*step;p.vy-=4*step;const k=1-p.age/p.life;this.dummy.position.set(p.x,p.y,p.z);this.dummy.scale.setScalar(p.size*k);this.dummy.rotation.set(p.age*3,p.age*2,0);this.dummy.updateMatrix();this.fxMesh.setMatrixAt(i,this.dummy.matrix);this.colour.set(p.color);this.fxMesh.setColorAt(i++,this.colour);}
  this.fxMesh.count=i;this.fxMesh.instanceMatrix.needsUpdate=true;if(i)this.fxMesh.instanceColor.needsUpdate=true;
  this.renderer.render(this.scene,this.camera);
  // Read-only diagnostics used by the browser regression suite.
  this.container.dataset.camera=this.camera.position.toArray().map(n=>n.toFixed(3)).join(',');this.container.dataset.drawCalls=String(this.renderer.info.render.calls);
  const projectile=this.mode==='bowling'?s.ball?.p:s.stones?.at(-1);if(projectile){this.v.set(-projectile.x,projectile.y||.2,projectile.z).project(this.camera);this.container.dataset.projectileNdc=[this.v.x,this.v.y,this.v.z].map(n=>n.toFixed(3)).join(',');}
 }
 setOverview(value){this.overview=value;this.dirty=true;}
 setQuality(value){this.quality=value;this.renderer.shadowMap.enabled=value!=='low'&&!this.low;this.resize();}
 resize(){const r=this.container.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height),low=this.low||this.quality==='low';this.renderer.setPixelRatio(low?Math.min(1,600/w):Math.min(devicePixelRatio||1,1.5)*(this.quality==='auto'?this.budget.scale:1));this.dirty=true;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 dispose(){this.resizeObserver.disconnect();this.guideMat.dispose();this.venue.dispose();for(const m of this.materials)m.dispose();for(const g of this.geometries)g.dispose();for(const t of this.textures)t.dispose();this.renderer.dispose();this.container.replaceChildren();}
}
