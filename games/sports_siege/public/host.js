import * as THREE from './vendor/three.module.js';
import {PartyConnection} from './net.js';
const $=id=>document.getElementById(id),mode=window.SS_CONFIG.mode,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;document.body.dataset.ssMode=mode;
const net=new PartyConnection(true);let state=null,lastEvent=0,lastTurn='',noticeUntil=0,uiCards=new Map(),view;
const instructions={
  bowling:'На телефоне выбери позицию и подкрутку. Проведи пальцем вверх: направление и скорость свайпа задают бросок. Играем по очереди; страйки, спэры и бонусные броски считаются автоматически.',
  curling:'Две команды. Свайпом отправляй камень к центру круга и выбивай чужие. Пока камень вашей команды едет, все могут держать свип на телефоне. Очки получают только камни ближе ближайшего чужого.',
  swarm_gate:'Каждый игрок — на своей турели. Тачпадом веди прицел, другой рукой держи огонь. Не подпускайте рой к воротам: укусившие продолжают грызть! Импульс бьёт по области, а между волнами ворота частично ремонтируются.',
  peek_shoot:'Води прицел тачпадом и стреляй отдельной кнопкой. Чудики выезжают из укрытий — попадать можно только в видимую часть. Шесть точных попаданий подряд заряжают пулемёт на 8 секунд. Его нужно включить! Белый флажок — мирный.'
};
$('ss-title').textContent=window.SS_CONFIG.title;$('ss-instructions').textContent=instructions[mode];
const settings={bowling:['Фреймов','frames',[3,5,10],5],curling:['Эндов','ends',[1,3,5],3],swarm_gate:['Волн','waves',[4,6,8],6],peek_shoot:['Секунд','seconds',[60,90,120],90]}[mode];
const select=document.createElement('select');select.id='ss-length';select.setAttribute('aria-label',settings[0]);
for(const n of settings[2]){const option=new Option(`${settings[0]}: ${n}`,n,n===settings[3],n===settings[3]);select.add(option);}$('ss-settings').append(select);
$('start').onclick=()=>net.send('start',{[settings[1]]:Number(select.value)});$('ss-again').onclick=()=>net.send('reset');
window.addEventListener('message',e=>{if(e.source===window.parent&&e.origin===location.origin&&e.data?.type==='party-start'&&state?.phase==='waiting')$('start').click();});
net.addEventListener('status',e=>{if(!state||state.phase==='waiting')$('ss-status').textContent=e.detail;});
function text(tag,value){const e=document.createElement(tag);e.textContent=value;return e;}
function frameText(frames){return (frames||[]).map(f=>{const r=f.rolls;return r.map((v,i)=>v===10?'X':i>0&&r[i-1]+v===10&&r[i-1]!==10?'/':v===0?'–':String(v)).join('');}).join(' · ');}
function paintUI(s){
  const playing=s.phase==='playing',waiting=s.phase==='waiting',current=s.players.find(p=>p.id===s.currentId),time=Math.max(0,Math.ceil(s.deadline-s.t));
  $('ss-overlay').hidden=playing;$('start').hidden=!waiting;$('ss-again').hidden=s.phase!=='results';$('ss-settings').hidden=!waiting;
  $('start').disabled=s.players.filter(p=>p.connected).length<(mode==='curling'?2:1);$('ss-roster').textContent=waiting?`${s.players.filter(p=>p.connected).length} игроков подключились. Готовность — на телефонах.`:'';
  $('ss-overlay-title').textContent=s.phase==='results'?s.result.reason:'Собираемся?';$('ss-instructions').hidden=s.phase==='results';
  $('ss-mode').textContent=`LOCALPARTY / ALPHA · ${mode==='bowling'?'3D BOWLING':mode==='curling'?'CURLING':mode==='swarm_gate'?'CO-OP DEFENCE':'SHOOTING GALLERY'}`;
  $('ss-stage').textContent=waiting?'ЛОББИ':s.phase==='results'?'ФИНАЛ':mode==='bowling'?({aim:'ПРИЦЕЛ',rolling:'ШАР В ИГРЕ',reveal:'КЕГЛИ'}[s.stage]||'МАТЧ'):mode==='curling'?({aim:'БРОСОК',rolling:'КАМЕНЬ ИДЁТ',reveal:'ЗАМЕР',end:'СЧЁТ ЭНДА'}[s.stage]||'МАТЧ'):mode==='swarm_gate'?s.stage==='break'?'РЕМОНТ':'ОБОРОНА':'ОХОТА';
  $('ss-status').textContent=waiting?'Отметьте готовность на телефонах':mode==='bowling'?`${current?.name||''} · фрейм ${current?.frames.length||1}/${s.frameCount} · ${s.stage==='aim'?'готовит бросок':s.stage==='rolling'?'шар на дорожке':'считаем кегли'}`:mode==='curling'?`Энд ${s.endIndex}/${s.endCount} · камень ${(s.throwIndex||0)+1}/${s.throwCount||0} · ${current?.name||''}`:mode==='swarm_gate'?`Волна ${s.wave||0}/${s.waveCount||6} · ${s.enemies.length} у ворот · ещё ${s.waveLeft||0} в рое`:'Попадай в чудиков. Белый флажок — не цель.';
  $('ss-metric-label').textContent=mode==='curling'?'КОМАНДЫ':mode==='swarm_gate'?'ВОРОТА':s.stage==='aim'?'НА БРОСОК':'ДО ФИНАЛА';
  $('ss-metric').textContent=mode==='curling'?`${s.teams?.[0]||0} : ${s.teams?.[1]||0}`:mode==='swarm_gate'?`${Math.ceil((s.gate??1000)/10)}%`:playing&&s.deadline?`${time} c`:'—';
  $('ss-gate').style.width=mode==='swarm_gate'?((s.gate??1000)/10)+'%':'0%';
  for(const p of s.players){
    let card=uiCards.get(p.id);
    if(!card){card=document.createElement('div');card.className='ss-player-card';card.append(text('b',''),text('strong',''),text('small',''));const bar=document.createElement('div');bar.className='ss-bar';bar.append(document.createElement('i'));card.append(bar);uiCards.set(p.id,card);$('ss-scoreboard').append(card);}
    card.style.setProperty('--ss-player',p.color);card.classList.toggle('current',playing&&p.id===s.currentId);card.classList.toggle('offline',!p.connected);
    card.children[0].textContent=`${p.number}. ${p.name}`;card.children[1].textContent=p.score;
    card.children[2].textContent=!p.participant&&!waiting?'Наблюдает':mode==='bowling'?frameText(p.frames):mode==='curling'?(p.team===0?'Коралловые':'Бирюзовые'):mode==='swarm_gate'?`${p.kills} целей${p.lockedUntil>s.t?' · перегрев':''}`:p.gunUntil>s.t?`ПУЛЕМЁТ · ${Math.ceil(p.gunUntil-s.t)} c`:p.charge?'ПУЛЕМЁТ ГОТОВ':`${p.streak}/6 · ${p.hits} попаданий`;
    const percent=mode==='swarm_gate'?p.heat*100:mode==='curling'?p.energy*100:p.gunUntil>s.t?(p.gunUntil-s.t)/8*100:p.charge?100:p.streak/6*100;
    card.querySelector('i').style.width=percent+'%';card.title=mode==='bowling'?frameText(p.frames):`${p.name}: ${p.score}`;
  }
  if(s.phase==='results'&&$('ss-results').dataset.id!==s.result.eventId){
    $('ss-results').dataset.id=s.result.eventId;$('ss-results').replaceChildren(...[...s.result.players].sort((a,b)=>b.score-a.score).map(p=>{const row=document.createElement('div');row.className='ss-result-row'+(p.won?' winner':'');row.append(text('b',(p.won?'★ ':'')+p.name),text('strong',String(p.score)));return row;}));
  }else if(waiting){$('ss-results').replaceChildren();$('ss-results').dataset.id='';}
  for(const e of s.events){if(e.id<=lastEvent)continue;lastEvent=e.id;view?.effect(e,s);
    if(e.text&&e.kind!=='throw'&&e.kind!=='stone'){const el=$('ss-notice');el.textContent=e.text;el.classList.add('show');noticeUntil=performance.now()+2200;}}
}
net.addEventListener('state',e=>{state=e.detail;paintUI(state);view?.setState(state);});
class Stage {
  constructor(){
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(mode==='curling'?'#172930':mode==='peek_shoot'?'#222539':'#111b25');
    this.scene.fog=new THREE.Fog(this.scene.background,65,130);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    const gl=this.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
    const gpu=debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'';
    this.software=/swiftshader|llvmpipe|softpipe|software/i.test(gpu);
    this.renderer.setPixelRatio(this.software?1:Math.min(devicePixelRatio||1,2));
    this.renderer.shadowMap.enabled=!this.software;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    document.body.dataset.renderQuality=this.software?'software-compatible':'full';
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;
    $('ss-scene').append(this.renderer.domElement);
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('ss-error').hidden=false;$('ss-error').textContent='Графический контекст потерян. Перезагрузи экран ведущего — матч на сервере сохранится.';});
    this.camera=['bowling','curling'].includes(mode)?new THREE.PerspectiveCamera(mode==='bowling'?46:42,1,.1,180):new THREE.OrthographicCamera(-20,20,15,-15,.1,180);
    this.camera.position.set(...(mode==='bowling'?[0,5.3,17.5]:mode==='curling'?[0,7.2,15]:mode==='swarm_gate'?[0,30,22]:[0,0,35]));
    this.look=new THREE.Vector3(...(mode==='swarm_gate'?[0,0,-8]:mode==='peek_shoot'?[0,0,0]:[0,0,-2]));this.camera.lookAt(this.look);
    this.scene.add(new THREE.HemisphereLight('#d9f2ff','#40313b',2.1));
    const key=new THREE.DirectionalLight('#ffecd7',3.5);key.position.set(-10,25,13);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
    Object.assign(key.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:.5,far:90});key.shadow.bias=-.00015;key.shadow.normalBias=.035;this.scene.add(key);key.target.position.set(0,0,-6);this.scene.add(key.target);
    const fill=new THREE.DirectionalLight('#77dce6',1.2);fill.position.set(14,12,-15);this.scene.add(fill);
    this.materials=new Map();this.assetTextures=new Map();this.dynamic=new Map();this.crosshairs=new Map();this.turrets=new Map();this.popups=[];this.smoothBots=new Map();
    this.unit=new THREE.Object3D();this.v=new THREE.Vector3();this.yAxis=new THREE.Vector3(0,1,0);this.clock=0;this.last=performance.now();this.cameraMode='wide';
    this.staticScene();this.makePools();this.resize();window.addEventListener('resize',()=>this.resize());
    this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
  }
  mat(color,rough=.5,metal=.05,emission=0){const key=`${color}:${rough}:${metal}:${emission}`;if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,emissive:color,emissiveIntensity:emission}));return this.materials.get(key);}
  assetTexture(name,options={}){
    if(this.assetTextures.has(name))return this.assetTextures.get(name);
    const root=options.root??'sprites',prefix=root?`${root}/`:'';
    const texture=new THREE.TextureLoader().load(`/assets/gameplay/sports-siege/${prefix}${name}.${options.ext||'webp'}`);
    texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
    if(options.repeat){texture.wrapS=texture.wrapT=THREE.MirroredRepeatWrapping;texture.repeat.set(...options.repeat);}
    this.assetTextures.set(name,texture);return texture;
  }
  assetSprite(name,width,height,options={}){
    const material=new THREE.SpriteMaterial({map:this.assetTexture(name),transparent:true,alphaTest:.035,depthTest:options.depthTest!==false,depthWrite:!!options.depthWrite,toneMapped:false,opacity:options.opacity??1});
    const sprite=new THREE.Sprite(material);sprite.scale.set(width,height,1);sprite.renderOrder=options.renderOrder||0;sprite.userData.assetSprite=true;return sprite;
  }
  projectileTrail(color){
    if(!this.projectileTrailTexture){const canvas=document.createElement('canvas');canvas.width=64;canvas.height=256;const c=canvas.getContext('2d'),gradient=c.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.16,'#ffffffd8');gradient.addColorStop(.62,'#ffffff3d');gradient.addColorStop(1,'#ffffff00');c.fillStyle=gradient;c.beginPath();c.moveTo(22,0);c.lineTo(42,0);c.quadraticCurveTo(38,105,32,250);c.quadraticCurveTo(26,105,22,0);c.fill();this.projectileTrailTexture=new THREE.CanvasTexture(canvas);this.projectileTrailTexture.colorSpace=THREE.SRGBColorSpace;}
    const material=new THREE.SpriteMaterial({map:this.projectileTrailTexture,color,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending});const sprite=new THREE.Sprite(material);sprite.renderOrder=12;return sprite;
  }
  mesh(geo,mat,x=0,y=0,z=0,parent=this.scene){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  box(w,h,d,color,x=0,y=0,z=0,parent=this.scene){return this.mesh(new THREE.BoxGeometry(w,h,d),this.mat(color),x,y,z,parent);}
  sphere(r,color,x=0,y=0,z=0,parent=this.scene){return this.mesh(new THREE.SphereGeometry(r,18,12),this.mat(color),x,y,z,parent);}
  cylinder(r,h,color,x,y,z,parent=this.scene){return this.mesh(new THREE.CylinderGeometry(r,r,h,28),this.mat(color),x,y,z,parent);}
  glowBox(w,h,d,color,x,y,z){return this.mesh(new THREE.BoxGeometry(w,h,d),this.mat(color,.4,.1,1.2),x,y,z);}
  label(value,color='#ffffff',size=1){
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;const c=canvas.getContext('2d');
    c.fillStyle='#0b1420';c.beginPath();c.roundRect(5,7,118,50,18);c.fill();c.strokeStyle=color;c.lineWidth=3;c.stroke();c.fillStyle=color;c.font='bold 34px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(value,64,34);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false}));sprite.scale.set(size*2,size,1);return sprite;
  }
  staticScene(){
    if(mode==='bowling'){
      this.box(55,.5,65,'#202934',0,-.85,-1);
      // Strips are geometry, not a remote texture: portable/offline builds stay self-contained.
      for(let i=0;i<14;i++)this.box(4.4/14,.25,32,i%3===0?'#c8955a':i%3===1?'#d9ad70':'#ddb77e',-2.2+(i+.5)*4.4/14,-.13,0);
      for(const x of [-2.65,2.65]){this.box(.9,.16,32,'#253747',x,-.40,0);this.glowBox(.06,.05,31.5,'#60e1ed',Math.sign(x)*3.12,.03,0);}
      this.box(7.2,3,.6,'#1b2839',0,1,-16.6);this.glowBox(6.7,.08,.05,'#ba92ff',0,2.1,-16.2);
      for(let i=-2;i<=2;i++)this.sphere(.07,'#533c2c',i*.6,.018,6.7);
      this.box(4.4,.012,.08,'#513b34',0,.008,10.5);this.box(7,.25,8,'#3e454d',0,-.14,19.7);
      for(const x of [-10,10]){this.box(4,.3,36,'#263445',x,-.25,-2);for(let z=-12;z<15;z+=7)this.glowBox(2.5,.05,.08,'#8e6fbb',x,.02,z);}
      const sign=this.label('STRIKE','#c8ff73',2.0);sign.position.set(0,3,-16);this.scene.add(sign);
    }else if(mode==='curling'){
      this.box(45,.5,55,'#203943',0,-.7,0);this.box(6.7,.35,30,'#cce9e6',0,-.18,0);
      for(const x of [-3.45,3.45]){this.box(.24,.32,31,'#304e60',x,.05,0);this.glowBox(.045,.025,30,'#91e7e6',x,.24,0);}
      for(const [r,c] of [[2.6,'#51c9dc'],[1.8,'#e9f1df'],[.95,'#ee9385'],[.35,'#f8f3e2']]){
        const circle=this.mesh(new THREE.CircleGeometry(r,64),this.mat(c,.25),0,.012+(2.6-r)*.002,-9);circle.rotation.x=-Math.PI/2;circle.receiveShadow=true;
      }
      for(const z of [-9,0,10])this.box(6.7,.008,.055,'#6e9295',0,.015,z);
      this.box(.025,.008,29.5,'#88b5bb',0,.018,0);
      for(let i=0;i<55;i++){const scratch=this.box(.007,.002,2+(i%3),'#bbdcd9',((i*1.73)%6)-3,.012,((i*3.19)%27)-13);scratch.rotation.y=.04*(i%4);}
      this.brooms=new THREE.Group();for(const x of [-.7,.7]){this.box(.6,.11,.20,'#ffc86b',x,.1,0,this.brooms);const handle=this.box(.045,1.5,.045,'#67768c',x,.8,0,this.brooms);handle.rotation.z=x>0?.45:-.45;}this.scene.add(this.brooms);this.brooms.visible=false;
    }else if(mode==='swarm_gate'){
      const ground=this.assetTexture('swarm-ground-tile',{root:'',repeat:[4,5]});
      const field=this.mesh(new THREE.PlaneGeometry(62,72),new THREE.MeshStandardMaterial({map:ground,color:'#a8afbf',roughness:1,metalness:0}),0,-.30,-12);field.rotation.x=-Math.PI/2;field.receiveShadow=true;
      this.wallGroup=new THREE.Group();this.scene.add(this.wallGroup);
      for(let x=-44.8;x<=44.8;x+=5.6){const wall=this.assetSprite('wall-straight',5.8,5.0,{depthWrite:true});wall.position.set(x,2.05,0);this.wallGroup.add(wall);}
      this.gateGroup=new THREE.Group();this.scene.add(this.gateGroup);
      this.gateSprite=this.assetSprite('gate-closed',7.2,5.2,{depthWrite:true});this.gateSprite.position.set(0,2.05,.12);this.gateGroup.add(this.gateSprite);
      this.repairSprite=this.assetSprite('wall-repair',3.2,4.0,{depthTest:false,renderOrder:8});this.repairSprite.position.set(0,2.7,.35);this.repairSprite.visible=false;this.scene.add(this.repairSprite);
      this.glowBox(90,.08,.07,'#6de2dc',0,4.72,-.18);
      this.makeBots();
    }else{
      this.scene.fog=null;
      this.box(48,29,.5,'#26364b',0,0,-4);
      for(let i=0;i<11;i++){const cloud=this.sphere(1.3+(i%3)*.4,i%2?'#334b66':'#30445f',-19+i*3.8,7+(i%2),-2);cloud.scale.set(1.8,.65,.6);}
      this.box(40,3,.3,'#4f796b',0,-10,-.3);
      const coverNames=['cover-wood','cover-stone','cover-metal','cover-rounded'];
      for(let row=0;row<3;row++)for(let col=0;col<5;col++){
        const x=.025+col*.195+(row%2)*.012,y=.27+row*.225,w=.155,h=.1,depth=row+1,kind=(row+col)%4;
        const wx=(x+w/2-.5)*32,wy=(.5-y-h/2)*20,z=depth*2;
        const cover=this.assetSprite(coverNames[kind],w*32,h*20,{depthWrite:true});cover.position.set(wx,wy,z);this.scene.add(cover);
      }
    }
  }
  makePools(){
    this.flashes=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}),180);this.flashes.count=0;this.flashes.frustumCulled=false;this.scene.add(this.flashes);
    this.particles=new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1,0),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false,transparent:true,opacity:.82,blending:THREE.AdditiveBlending,depthWrite:false}),360);this.particles.count=0;this.particles.frustumCulled=false;this.scene.add(this.particles);
    this.rings=new THREE.InstancedMesh(new THREE.RingGeometry(.82,1,36),new THREE.MeshBasicMaterial({color:'#ffffff',side:THREE.DoubleSide,toneMapped:false,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}),32);this.rings.count=0;this.rings.frustumCulled=false;this.scene.add(this.rings);
    this.effects=[];
  }
  makeBots(){
    const geometry=new THREE.PlaneGeometry(1,1),names={termite:'swarm-termite',runner:'swarm-runner',tank:'swarm-tank',boss:'swarm-boss'};this.botSprites={};
    for(const [kind,name] of Object.entries(names)){
      const material=new THREE.MeshBasicMaterial({map:this.assetTexture(name),transparent:true,alphaTest:.035,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
      const mesh=new THREE.InstancedMesh(geometry,material,300);mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.renderOrder=2;this.botSprites[kind]=mesh;this.scene.add(mesh);
    }
  }
  bowlingPin(){
    const g=new THREE.Group(),points=[[.16,.025],[.22,.08],[.24,.31],[.23,.46],[.17,.60],[.1,.76],[.095,.88],[.145,.99],[.155,1.08],[.11,1.18],[0,1.22]].map(p=>new THREE.Vector2(...p));
    this.mesh(new THREE.LatheGeometry(points,24),this.mat('#f3eedb',.2),0,0,0,g);
    for(const y of [.79,.86])this.mesh(new THREE.CylinderGeometry(.104,.104,.045,24),this.mat('#ef736f',.3),0,y,0,g);
    return g;
  }
  bowlingBall(){const g=new THREE.Group();this.mesh(new THREE.SphereGeometry(.33,28,20),this.mat('#a389ed',.13,.38),0,0,0,g);
    for(const [x,y,z] of [[-.09,.24,.21],[.08,.24,.21],[0,.12,.306]])this.sphere(.044,'#211c42',x,y,z,g);return g;}
  stone(team){const g=new THREE.Group();this.cylinder(.43,.28,'#94aaa9',0,.19,0,g);this.cylinder(.35,.045,team?'#66d8df':'#ef9384',0,.35,0,g);
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.22,.36,0),new THREE.Vector3(-.19,.60,0),new THREE.Vector3(.19,.60,0),new THREE.Vector3(.22,.36,0)]);
    this.mesh(new THREE.TubeGeometry(curve,14,.06,8,false),this.mat(team?'#45c6d9':'#e97778',.3),0,0,0,g);return g;}
  goof(t){
    const regular=['target-chicken','target-bug','target-beetle','target-boss','target-chicken'];
    const name=t.kind==='friendly'?'target-friendly':t.kind==='gold'?'target-bonus':regular[t.style%regular.length];
    const size=t.kind==='friendly'?[2.45,3.15]:t.style===3?[2.45,3.1]:[2.15,2.65];return this.assetSprite(name,...size);
  }
  crosshair(p){
    const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:p.color,depthTest:false});
    const ring=new THREE.Mesh(new THREE.RingGeometry(.23,.275,28),mat);g.add(ring);
    for(const rot of [0,Math.PI/2]){const line=new THREE.Mesh(new THREE.PlaneGeometry(.73,.025),mat);line.rotation.z=rot;g.add(line);}
    if(mode==='swarm_gate'){ring.rotation.x=-Math.PI/2;for(const child of g.children.slice(1)){child.rotation.x=-Math.PI/2;child.rotation.y=child.rotation.z;child.rotation.z=0;}}
    const number=this.label(String(p.number),p.color,.45);number.position.set(.42,mode==='swarm_gate'?.8:.5,0);g.add(number);g.renderOrder=9;this.scene.add(g);return g;
  }
  turret(p){const g=new THREE.Group(),pedestals=['turret-pedestal-stone','turret-pedestal-blue','turret-pedestal-wood','turret-pedestal-damaged'];
    const pedestal=this.assetSprite(pedestals[(p.number-1)%pedestals.length],4.25,4.3,{depthWrite:false});pedestal.position.set(0,1.62,1.0);g.add(pedestal);
    const head=this.assetSprite('turret-head-long',2.25,3.65,{depthWrite:false});head.position.set(0,4.25,1.22);g.add(head);
    const number=this.label(String(p.number),p.color,.48);number.position.set(0,6.15,1.3);g.add(number);
    g.userData.head=head;this.scene.add(g);return g;}
  setState(s){this.state=s;}
  getObject(key,create){let obj=this.dynamic.get(key);if(!obj){obj=create();this.dynamic.set(key,obj);this.scene.add(obj);obj.userData.fresh=true;}obj.userData.used=true;return obj;}
  place(obj,x,y,z,q,alpha=1){
    if(obj.userData.fresh){alpha=1;obj.userData.fresh=false;}
    obj.position.lerp(this.v.set(x,y,z),alpha);
    if(q){this.q||=new THREE.Quaternion();this.q.set(...q);obj.quaternion.slerp(this.q,alpha);}
  }
  moveCamera(position,target,dt,speed=3){const a=reduced?1:1-Math.exp(-dt*speed);this.camera.position.lerp(position,a);this.look.lerp(target,a);this.camera.lookAt(this.look);}
  updateObjects(s,dt){
    if(s.stage==='rolling'&&this.previousStage!=='rolling')this.rollingStartedAt=s.t;
    this.previousStage=s.stage;
    const a=1-Math.exp(-dt*20);for(const obj of this.dynamic.values())obj.userData.used=false;
    if(mode==='bowling'){
      let pins=s.physics?.pins||[];
      if(s.phase==='waiting'){pins=[];let id=0;for(let row=0;row<4;row++)for(let col=0;col<=row;col++)pins.push({id:id++,x:(col-row/2)*.72,y:.025,z:-9.8-row*.65,q:[0,0,0,1]});}
      for(const pin of pins){const obj=this.getObject('pin'+pin.id,()=>this.bowlingPin());this.place(obj,pin.x,pin.y,pin.z,pin.q,s.stage==='aim'?1:a);}
      const ball=s.physics?.ball;if(ball){const obj=this.getObject('ball',()=>this.bowlingBall());this.place(obj,ball.x,ball.y,ball.z,ball.q,a);}
      const cameraPos=new THREE.Vector3(0,5.3,17.5),look=new THREE.Vector3(0,.35,-9.5);
      if(s.stage==='rolling'&&ball){const elapsed=Math.max(0,s.t-(this.rollingStartedAt??s.t)),u=Math.max(0,Math.min(1,(elapsed-.16)/.9)),fly=u*u*(3-2*u),chase=new THREE.Vector3(ball.x+7.2,6.4,Math.max(-4,ball.z+10.5)),ahead=new THREE.Vector3(ball.x*.32,.3,Math.max(-12,ball.z-5.5));cameraPos.lerp(chase,fly);look.lerp(ahead,fly);}
      else if(s.stage==='reveal'){cameraPos.set(7.3,7.2,-.5);look.set(0,.35,-10.5);}
      this.moveCamera(cameraPos,look,dt,s.stage==='rolling'?3.2:2.4);
    }else if(mode==='curling'){
      for(const stone of s.stones||[]){if(!stone.valid)continue;const obj=this.getObject(stone.id,()=>this.stone(stone.team));this.place(obj,stone.x,0,stone.z,null,a);obj.rotation.y=stone.rotation;}
      const active=s.stones?.at(-1);this.brooms.visible=!!active&&active.valid&&s.stage==='rolling'&&s.sweepAmount>0;
      if(this.brooms.visible){this.brooms.position.set(active.x+Math.sin(this.clock*23)*.25,0,active.z-.85);this.brooms.rotation.y=Math.sin(this.clock*18)*.17;}
      const cameraPos=new THREE.Vector3(0,7.2,15),look=new THREE.Vector3(0,.1,-9);
      if(s.stage==='rolling'&&active?.valid){const elapsed=Math.max(0,s.t-(this.rollingStartedAt??s.t)),u=Math.max(0,Math.min(1,(elapsed-.12)/1.0)),fly=u*u*(3-2*u),chase=new THREE.Vector3(active.x+6.6,6.2,Math.max(-4,active.z+8.5)),ahead=new THREE.Vector3(active.x,.05,active.z-3.2);cameraPos.lerp(chase,fly);look.lerp(ahead,fly);}
      else if(['reveal','end'].includes(s.stage)){cameraPos.set(7.6,9.2,-1);look.set(0,0,-9);}
      this.moveCamera(cameraPos,look,dt,s.stage==='rolling'?3:2.2);
    }else if(mode==='swarm_gate'){
      for(const p of s.players.filter(p=>p.participant||s.phase==='waiting')){let turret=this.turrets.get(p.id);if(!turret){turret=this.turret(p);this.turrets.set(p.id,turret);}turret.position.x=p.turretX||0;const x=(p.aim.x-.5)*36,z=-27+p.aim.y*26;turret.userData.head.material.rotation=Math.atan2(turret.position.x-x,.9-z);}
      this.updateBots(s.enemies,dt);
      const chewing=s.enemies.some(b=>b.z>=-1);this.gateGroup.position.x=chewing&&!reduced?Math.sin(this.clock*43)*.018:0;
      this.gateGroup.rotation.z=s.gate<=0?-.18:0;
      const gateName=s.gate<=0?'gate-open':s.gate<(s.maxGate||1000)*.55?'gate-damaged':'gate-closed';if(this.gateSprite.userData.assetName!==gateName){this.gateSprite.userData.assetName=gateName;this.gateSprite.material.map=this.assetTexture(gateName);this.gateSprite.material.needsUpdate=true;}
      this.repairSprite.visible=s.stage==='break';if(this.repairSprite.visible)this.repairSprite.material.opacity=.72+Math.sin(this.clock*7)*.20;
    }else{
      for(const t of s.targets||[]){if(t.rise<.02)continue;const obj=this.getObject('target'+t.id,()=>this.goof(t));
        // Don't interpolate exposure: visuals and authoritative cover hitboxes agree.
        this.place(obj,(t.x-.5)*32,(.5-t.y)*20,(Math.ceil(t.depth))*2-.65,null,1);obj.material.rotation=Math.sin(this.clock*3+t.seed)*.025;}
    }
    for(const [key,obj]of this.dynamic)if(!obj.userData.used){this.scene.remove(obj);obj.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.userData.assetSprite)n.material.dispose();});this.dynamic.delete(key);}
    if(mode==='swarm_gate'||mode==='peek_shoot')for(const p of s.players.filter(p=>p.connected&&p.participant)){
      let cross=this.crosshairs.get(p.id);if(!cross){cross=this.crosshair(p);this.crosshairs.set(p.id,cross);}
      this.place(cross,mode==='peek_shoot'?(p.aim.x-.5)*32:(p.aim.x-.5)*36,mode==='peek_shoot'?(.5-p.aim.y)*20:.18,mode==='peek_shoot'?10:-27+p.aim.y*26,null,a);
    }
    for(const [id,cross]of this.crosshairs)cross.visible=!!s.players.find(p=>p.id===id&&p.connected&&p.participant);
  }
  instance(mesh,i,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){this.unit.position.set(x,y,z);this.unit.rotation.set(rx,ry,rz);this.unit.scale.set(sx,sy,sz);this.unit.updateMatrix();mesh.setMatrixAt(i,this.unit.matrix);}
  updateBots(bots,dt){
    const n=Math.min(300,bots.length),counts={termite:0,runner:0,tank:0,boss:0},used=new Set(),sizes={termite:[3.5,4.2],runner:[4,4],tank:[3.8,4],boss:[3.5,4.3]};
    for(let i=0;i<n;i++){
      const b=bots[i];used.add(b.id);let p=this.smoothBots.get(b.id);if(!p){p={x:b.x,z:b.z};this.smoothBots.set(b.id,p);}p.x+=(b.x-p.x)*(1-Math.exp(-dt*22));p.z+=(b.z-p.z)*(1-Math.exp(-dt*22));
      const r=b.r,y=r*.55+Math.sin(this.clock*(b.kind==='runner'?19:12)+b.seed)*.035,angle=Math.atan2(b.targetX-p.x,-.85-p.z),mesh=this.botSprites[b.kind],index=counts[b.kind]++,size=sizes[b.kind];
      this.unit.position.set(p.x,y,p.z);this.unit.quaternion.copy(this.camera.quaternion);this.unit.rotateZ(angle);this.unit.scale.set(r*size[0],r*size[1],1);this.unit.updateMatrix();mesh.setMatrixAt(index,this.unit.matrix);
    }
    for(const id of this.smoothBots.keys())if(!used.has(id))this.smoothBots.delete(id);
    for(const [kind,mesh] of Object.entries(this.botSprites)){mesh.count=counts[kind];mesh.instanceMatrix.needsUpdate=true;}
  }
  effect(e,s){
    if(e.kind==='shot'){
      const p=s.players.find(p=>p.id===e.player);if(!p)return;
      const to=mode==='peek_shoot'?new THREE.Vector3((e.x-.5)*32,(.5-e.y)*20,10):new THREE.Vector3(e.x,.65,e.z);
      const from=mode==='peek_shoot'?new THREE.Vector3((p.number/(s.players.length+1)-.5)*25,-11,10):new THREE.Vector3(e.ox,5.25,e.oz);
      const projectileName=mode==='peek_shoot'?(p.number%2?'shot-gold':'shot-violet'):(p.number%2?'turret-shell':'turret-bolt');
      const projectile=this.assetSprite(projectileName,mode==='peek_shoot'?2:1.05,mode==='peek_shoot'?2.8:1.75,{depthTest:false,renderOrder:13});projectile.position.copy(from);
      const screenUp=mode==='peek_shoot'?to.y-from.y:from.z-to.z;projectile.material.rotation=-Math.atan2(to.x-from.x,screenUp);this.scene.add(projectile);
      const color=e.hit?(e.good===false?'#ff5e7a':'#ffe568'):p.color,trail=this.projectileTrail(color);trail.position.copy(from);trail.material.rotation=projectile.material.rotation;trail.visible=false;this.scene.add(trail);
      const muzzle=this.assetSprite('muzzle-a',2.3,3.05,{depthTest:false,renderOrder:12});muzzle.position.copy(from);this.scene.add(muzzle);
      const impactPrefix=mode==='swarm_gate'&&e.dead?'swarm-explosion':mode==='peek_shoot'&&e.hit?'gallery-death':e.hit?'hit':'miss';
      const impactFrames=impactPrefix==='swarm-explosion'||impactPrefix==='gallery-death'?8:2,impact=this.assetSprite(`${impactPrefix}-${impactFrames===8?'0':'a'}`,mode==='swarm_gate'?3.2:3,mode==='swarm_gate'?4.25:4,{depthTest:false,renderOrder:14});impact.position.copy(to);impact.visible=false;this.scene.add(impact);
      this.effects.push({kind:'beam',from,to,color,born:this.clock,life:.5,hit:e.hit,good:e.good,projectile,trail,muzzle,impact,impactPrefix,impactFrames});
    }else if(e.kind==='pulse')this.effects.push({kind:'pulse',origin:new THREE.Vector3(e.x,.22,e.z),color:'#b9ff67',born:this.clock,life:.78});
    else if(e.kind==='roll'&&e.pins>=8&&!reduced)this.effects.push({kind:'celebrate',origin:new THREE.Vector3(0,.4,-10.5),color:e.pins===10?'#ffe568':'#c8ff73',born:this.clock,life:1.05});
    if(this.effects.length>120){const removed=this.effects.splice(0,this.effects.length-120);for(const old of removed)for(const sprite of [old.projectile,old.trail,old.muzzle,old.impact])if(sprite){this.scene.remove(sprite);sprite.material.dispose();}}
  }
  updateEffects(){
    const alive=[];for(const e of this.effects){if(this.clock-e.born<e.life)alive.push(e);else for(const sprite of [e.projectile,e.trail,e.muzzle,e.impact])if(sprite){this.scene.remove(sprite);sprite.material.dispose();}}this.effects=alive;let flashes=0,particles=0,rings=0;
    for(const e of this.effects){const age=(this.clock-e.born)/e.life,color=new THREE.Color(e.color);
      if(e.kind==='beam'){
        const direction=e.to.clone().sub(e.from),length=direction.length(),travel=Math.min(1,age/.68),projectileFade=travel<.88?1:Math.max(0,(1-travel)/.12);direction.normalize();
        e.projectile.position.copy(e.from).lerp(e.to,travel);e.projectile.visible=travel<1;e.projectile.material.opacity=projectileFade;e.projectile.scale.set(mode==='peek_shoot'?2:1.05,mode==='peek_shoot'?2.8:1.75,1).multiplyScalar(.72+.28*Math.sin(Math.min(1,travel*4)*Math.PI/2));
        const trailLength=Math.min(mode==='peek_shoot'?2.2:2.8,length*travel,.8+length*(1-travel));e.trail.visible=travel>.025&&travel<.98;e.trail.position.copy(e.projectile.position).addScaledVector(direction,-trailLength*.46);e.trail.scale.set(mode==='peek_shoot'?.72:.52,trailLength,1);e.trail.material.opacity=projectileFade*(.6+.2*Math.sin(travel*Math.PI));
        const muzzleFrame=age<.13?'a':'b';e.muzzle.visible=age<.30;if(e.muzzle.userData.frame!==muzzleFrame){e.muzzle.userData.frame=muzzleFrame;e.muzzle.material.map=this.assetTexture(`muzzle-${muzzleFrame}`);e.muzzle.material.needsUpdate=true;}e.muzzle.material.opacity=Math.max(0,1-age/.30);
        const impactAge=Math.max(0,(travel-.72)/.28);e.impact.visible=travel>=.72;const frame=e.impactFrames===8?Math.min(7,Math.floor(impactAge*8)):(impactAge<.45?'a':'b'),frameName=`${e.impactPrefix}-${frame}`;
        if(e.impact.userData.frame!==frameName){e.impact.userData.frame=frameName;e.impact.material.map=this.assetTexture(frameName);e.impact.material.needsUpdate=true;}e.impact.material.opacity=Math.min(1,(1-age)/.18);e.impact.scale.set(mode==='swarm_gate'?3.2:3,mode==='swarm_gate'?4.25:4,1).multiplyScalar(.82+impactAge*.22);
      }else if(e.kind==='pulse'){
        const radius=.8+age*6.4;this.instance(this.rings,rings,e.origin.x,e.origin.y,e.origin.z,radius,radius,radius,-Math.PI/2,0,0);this.rings.setColorAt(rings++,color);for(let i=0;i<20&&particles<360;i++){const a=i/20*Math.PI*2,travel=radius*(.75+.25*Math.sin(i*7));this.instance(this.particles,particles,e.origin.x+Math.cos(a)*travel,e.origin.y+.12+Math.sin(age*Math.PI)*.8,e.origin.z+Math.sin(a)*travel,.08*(1-age),.22*(1-age),.08*(1-age),age*7,a,0);this.particles.setColorAt(particles++,color);}
      }else if(e.kind==='celebrate')for(let i=0;i<28&&particles<360;i++){const a=i*2.399,spread=(.6+i%5*.32)*age,x=e.origin.x+Math.cos(a)*spread,y=e.origin.y+Math.sin(age*Math.PI)*(2+i%4*.45),z=e.origin.z+Math.sin(a)*spread;this.instance(this.particles,particles,x,y,z,.08,.22,.04,age*9,a,age*12);this.particles.setColorAt(particles++,new THREE.Color(i%3===0?'#ff6f91':i%3===1?'#66e7f0':e.color));}
    }
    this.flashes.count=flashes;this.particles.count=particles;this.rings.count=rings;for(const mesh of [this.flashes,this.particles,this.rings]){mesh.instanceMatrix.needsUpdate=true;if(mesh.count)mesh.instanceColor.needsUpdate=true;}
  }
  resize(){const r=$('ss-scene').getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);if(this.software)this.renderer.setPixelRatio(Math.min(1,640/w));this.renderer.setSize(w,h,false);
    if(this.camera.isPerspectiveCamera)this.camera.aspect=w/h;
    else{let height=mode==='peek_shoot'?22:mode==='curling'?32:32;height=Math.max(height,(mode==='peek_shoot'?35:mode==='curling'?17:42)/(w/h));this.camera.left=-height*w/h/2;this.camera.right=height*w/h/2;this.camera.top=height/2;this.camera.bottom=-height/2;}
    this.camera.updateProjectionMatrix();
  }
  loop(now){if(now-this.last<(this.software?1000/15:1000/60)-1){requestAnimationFrame(this.loop);return;}const dt=Math.min(.1,(now-this.last)/1000);this.last=now;this.clock+=dt;
    if(this.state)this.updateObjects(this.state,dt);this.updateEffects();this.renderer.render(this.scene,this.camera);
    if(now>noticeUntil)$('ss-notice').classList.remove('show');requestAnimationFrame(this.loop);
  }
}
try{view=new Stage();if(state)view.setState(state);}catch(e){console.error(e);$('ss-error').hidden=false;$('ss-error').textContent='Не удалось включить 3D. Нужен браузер с WebGL 2 и аппаратным ускорением. '+e.message;}
