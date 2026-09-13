import * as THREE from './vendor/three.module.js';
import {PartyConnection} from './net.js';
const $=id=>document.getElementById(id),mode=window.SS_CONFIG.mode,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    this.renderer.setPixelRatio(this.software?1:Math.min(devicePixelRatio||1,1.5));
    this.renderer.shadowMap.enabled=!this.software;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    document.body.dataset.renderQuality=this.software?'software-compatible':'full';
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;
    $('ss-scene').append(this.renderer.domElement);
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('ss-error').hidden=false;$('ss-error').textContent='Графический контекст потерян. Перезагрузи экран ведущего — матч на сервере сохранится.';});
    this.camera=mode==='bowling'?new THREE.PerspectiveCamera(43,1,.1,180):new THREE.OrthographicCamera(-20,20,15,-15,.1,180);
    this.camera.position.set(...(mode==='bowling'?[8,19,24]:mode==='curling'?[5,27,22]:mode==='swarm_gate'?[0,30,22]:[0,0,35]));
    this.look=new THREE.Vector3(...(mode==='swarm_gate'?[0,0,-8]:mode==='peek_shoot'?[0,0,0]:[0,0,-2]));this.camera.lookAt(this.look);
    this.scene.add(new THREE.HemisphereLight('#d9f2ff','#40313b',2.1));
    const key=new THREE.DirectionalLight('#ffecd7',3.5);key.position.set(-10,25,13);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
    Object.assign(key.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:.5,far:90});key.shadow.bias=-.00015;key.shadow.normalBias=.035;this.scene.add(key);key.target.position.set(0,0,-6);this.scene.add(key.target);
    const fill=new THREE.DirectionalLight('#77dce6',1.2);fill.position.set(14,12,-15);this.scene.add(fill);
    this.materials=new Map();this.dynamic=new Map();this.crosshairs=new Map();this.turrets=new Map();this.popups=[];this.smoothBots=new Map();
    this.unit=new THREE.Object3D();this.v=new THREE.Vector3();this.yAxis=new THREE.Vector3(0,1,0);this.clock=0;this.last=performance.now();
    this.staticScene();this.makePools();this.resize();window.addEventListener('resize',()=>this.resize());
    this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
  }
  mat(color,rough=.5,metal=.05,emission=0){const key=`${color}:${rough}:${metal}:${emission}`;if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,emissive:color,emissiveIntensity:emission}));return this.materials.get(key);}
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
      this.box(62,.6,72,'#253342',0,-.45,-12);
      for(let x=-22;x<=22;x+=4)for(let z=-28;z<=10;z+=4){this.box(3.94,.025,3.94,(Math.abs(x+z)%8===0)?'#293b4c':'#2a3a48',x,-.13,z);}
      for(const x of [-12,12])for(let z=-23;z<0;z+=5){const stripe=this.box(.16,.018,2,'#44686e',x,-.10,z);stripe.rotation.y=x>0?-.4:.4;}
      for(let x=-18;x<=18;x+=1.3){if(Math.abs(x)<2.8)continue;this.box(1.22,2.8,1.2,'#617281',x,1.25,0);this.box(1.28,.22,1.32,'#8a9ba2',x,2.76,0);this.box(.9,.7,.06,'#3b485d',x,1.3,-.65);}
      this.gateGroup=new THREE.Group();this.scene.add(this.gateGroup);
      for(let i=0;i<8;i++)this.box(.58,2.5,.3,i%2?'#e6b76a':'#cb965d',-2.2+i*.63,1.1,0,this.gateGroup);
      for(const y of [.3,1.9])this.box(5,.18,.42,'#687b87',0,y,0,this.gateGroup);
      for(const x of [-2.8,2.8]){this.box(.5,3.5,1.55,'#8d9aa1',x,1.5,0);this.glowBox(.17,2.2,.05,'#c8ff73',x,1.4,-.82);}
      this.glowBox(37,.08,.07,'#6de2dc',0,2.95,.7);
      for(const x of [-20,20])for(const z of [-24,-12,0]){this.cylinder(.16,3.5,'#617b8c',x,1.5,z);this.glowBox(.65,.12,.65,'#a6f2ea',x,3.3,z);}
      this.makeBots();
    }else{
      this.scene.fog=null;
      this.box(48,29,.5,'#26364b',0,0,-4);
      for(let i=0;i<11;i++){const cloud=this.sphere(1.3+(i%3)*.4,i%2?'#334b66':'#30445f',-19+i*3.8,7+(i%2),-2);cloud.scale.set(1.8,.65,.6);}
      this.box(40,3,.3,'#4f796b',0,-10,-.3);
      for(let row=0;row<3;row++)for(let col=0;col<5;col++){
        const x=.025+col*.195+(row%2)*.012,y=.27+row*.225,w=.155,h=.1,depth=row+1,kind=(row+col)%4;
        const wx=(x+w/2-.5)*32,wy=(.5-y-h/2)*20,z=depth*2;
        this.box(w*32,h*20,.5,['#b57d5d','#6a8990','#c79b60','#7a7f9f'][kind],wx,wy,z);
        this.box(w*32+.12,.17,.7,['#dbac7a','#8eb9b1','#e4c083','#a1a5c4'][kind],wx,wy+h*10,z);
        for(let k=-1;k<=1;k++)this.box(.07,h*20-.12,.045,'#344951',wx+k*w*7.5,wy,z+.28);
        if(kind===2){const brace=this.box(w*32-.15,.13,.06,'#9b6e53',wx,wy,z+.3);brace.rotation.z=.32;}
        else if(kind===1)for(const dx of [-1,1])this.sphere(.11,'#bad6cc',wx+dx*1.8,wy,z+.32);
      }
    }
  }
  makePools(){
    this.tracerGeo=new THREE.CylinderGeometry(1,1,1,6);this.tracers=new THREE.InstancedMesh(this.tracerGeo,new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),100);this.tracers.count=0;this.tracers.frustumCulled=false;this.scene.add(this.tracers);
    this.flashes=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),100);this.flashes.count=0;this.flashes.frustumCulled=false;this.scene.add(this.flashes);
    this.effects=[];
  }
  makeBots(){
    const body=new THREE.SphereGeometry(1,12,8),white=new THREE.SphereGeometry(1,8,6),leg=new THREE.CylinderGeometry(.055,.035,1,5);
    this.botsBody=new THREE.InstancedMesh(body,this.mat('#ffffff',.6,.12),300);this.botsEyes=new THREE.InstancedMesh(white,this.mat('#f4f2d5'),600);
    this.botsPupils=new THREE.InstancedMesh(white,this.mat('#172126'),600);this.botsLegs=new THREE.InstancedMesh(leg,this.mat('#435e67',.5,.2),1800);
    for(const m of [this.botsBody,this.botsEyes,this.botsPupils,this.botsLegs]){m.count=0;m.castShadow=true;m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.scene.add(m);}
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
    const g=new THREE.Group(),colors=['#aad17f','#eba67e','#8fbfdf','#be9de2','#e7a3b5'],color=t.kind==='gold'?'#f4cb67':colors[t.style];
    const body=t.style===2?this.box(1.27,1.25,.48,color,0,0,0,g):this.sphere(.78,color,0,0,0,g);body.scale.z=t.style===2?1:.40;
    if(t.style===0)for(const x of [-.32,.32]){const antenna=this.box(.05,.50,.05,'#749c5a',x,.80,0,g);antenna.rotation.z=x>0?-.3:.3;this.sphere(.12,'#d4e68d',x*1.2,1.04,0,g);}
    if(t.style===1){for(let i=0;i<3;i++)this.sphere(.17,'#e87679',-.20+i*.19,.80,0,g);this.mesh(new THREE.ConeGeometry(.2,.34,4),this.mat('#ffc86b'),0,-.08,.37,g).rotation.x=Math.PI/2;}
    if(t.style===4){this.sphere(.26,'#f2b1c2',0,-.10,.30,g);for(const x of [-.12,.12])this.sphere(.052,'#92576c',x,-.10,.54,g);}
    for(const x of [-.26,.26]){this.sphere(.20,'#fff8e7',x,.20,.26,g);this.sphere(.081,'#213047',x+.04,.20,.435,g);}
    if(t.style===3)for(const x of [-.17,.17]){const m=this.sphere(.16,'#55455f',x,-.20,.32,g);m.scale.set(1.45,.45,.5);m.rotation.z=x>0?.3:-.3;}
    else if(t.style!==4)this.box(.25,.055,.06,'#684862',0,-.32,.32,g);
    if(t.kind==='friendly'){
      this.box(.045,1.2,.045,'#d5d7c3',.76,.52,0,g);this.box(.60,.41,.035,'#fffef0',1.03,.94,0,g);
      const label=this.label('✓','#475d55',.23);label.position.set(1.02,.94,.06);g.add(label);
    }
    if(t.kind==='gold'){const halo=this.mesh(new THREE.TorusGeometry(.52,.055,8,24),this.mat('#ffe5a3',.2,.3,.7),0,1.05,0,g);halo.scale.y=.45;}
    return g;
  }
  crosshair(p){
    const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:p.color,depthTest:false});
    const ring=new THREE.Mesh(new THREE.RingGeometry(.23,.275,28),mat);g.add(ring);
    for(const rot of [0,Math.PI/2]){const line=new THREE.Mesh(new THREE.PlaneGeometry(.73,.025),mat);line.rotation.z=rot;g.add(line);}
    if(mode==='swarm_gate'){ring.rotation.x=-Math.PI/2;for(const child of g.children.slice(1)){child.rotation.x=-Math.PI/2;child.rotation.y=child.rotation.z;child.rotation.z=0;}}
    const number=this.label(String(p.number),p.color,.45);number.position.set(.42,mode==='swarm_gate'?.8:.5,0);g.add(number);g.renderOrder=9;this.scene.add(g);return g;
  }
  turret(p){const g=new THREE.Group();this.cylinder(.7,.45,'#819aa3',0,2.8,.9,g);const head=new THREE.Group();head.position.set(0,3.25,.9);g.add(head);
    this.box(.7,.55,.65,p.color,0,0,0,head);const barrel=this.cylinder(.105,1.55,'#b8c4c5',0,.05,-.65,head);barrel.rotation.x=Math.PI/2;
    const cap=this.cylinder(.18,.13,p.color,0,.05,-1.4,head);cap.rotation.x=Math.PI/2;const number=this.label(String(p.number),p.color,.48);number.position.set(0,4.1,1);g.add(number);
    g.userData.head=head;this.scene.add(g);return g;}
  setState(s){this.state=s;}
  getObject(key,create){let obj=this.dynamic.get(key);if(!obj){obj=create();this.dynamic.set(key,obj);this.scene.add(obj);obj.userData.fresh=true;}obj.userData.used=true;return obj;}
  place(obj,x,y,z,q,alpha=1){
    if(obj.userData.fresh){alpha=1;obj.userData.fresh=false;}
    obj.position.lerp(this.v.set(x,y,z),alpha);
    if(q){this.q||=new THREE.Quaternion();this.q.set(...q);obj.quaternion.slerp(this.q,alpha);}
  }
  updateObjects(s,dt){
    const a=1-Math.exp(-dt*20);for(const obj of this.dynamic.values())obj.userData.used=false;
    if(mode==='bowling'){
      let pins=s.physics?.pins||[];
      if(s.phase==='waiting'){pins=[];let id=0;for(let row=0;row<4;row++)for(let col=0;col<=row;col++)pins.push({id:id++,x:(col-row/2)*.72,y:.025,z:-9.8-row*.65,q:[0,0,0,1]});}
      for(const pin of pins){const obj=this.getObject('pin'+pin.id,()=>this.bowlingPin());this.place(obj,pin.x,pin.y,pin.z,pin.q,s.stage==='aim'?1:a);}
      const ball=s.physics?.ball;if(ball){const obj=this.getObject('ball',()=>this.bowlingBall());this.place(obj,ball.x,ball.y,ball.z,ball.q,a);}
      if(!reduced){const cameraPos=new THREE.Vector3(8,19,24),look=new THREE.Vector3(0,0,-2);
        if(s.stage==='rolling'&&ball){cameraPos.set(ball.x+5.5,10.5,Math.max(-1,ball.z+13));look.set(ball.x*.35,0,Math.max(-11,ball.z-7));}
        this.camera.position.lerp(cameraPos,1-Math.exp(-dt*1.5));this.look.lerp(look,1-Math.exp(-dt*1.7));this.camera.lookAt(this.look);}
    }else if(mode==='curling'){
      for(const stone of s.stones||[]){if(!stone.valid)continue;const obj=this.getObject(stone.id,()=>this.stone(stone.team));this.place(obj,stone.x,0,stone.z,null,a);obj.rotation.y=stone.rotation;}
      const active=s.stones?.at(-1);this.brooms.visible=!!active&&active.valid&&s.stage==='rolling'&&s.sweepAmount>0;
      if(this.brooms.visible){this.brooms.position.set(active.x+Math.sin(this.clock*23)*.25,0,active.z-.85);this.brooms.rotation.y=Math.sin(this.clock*18)*.17;}
    }else if(mode==='swarm_gate'){
      for(const p of s.players.filter(p=>p.participant||s.phase==='waiting')){let turret=this.turrets.get(p.id);if(!turret){turret=this.turret(p);this.turrets.set(p.id,turret);}turret.position.x=p.turretX||0;const x=(p.aim.x-.5)*36,z=-27+p.aim.y*26;turret.userData.head.rotation.y=Math.atan2(turret.position.x-x,.9-z);}
      this.updateBots(s.enemies,dt);
      const chewing=s.enemies.some(b=>b.z>=-1);this.gateGroup.position.x=chewing&&!reduced?Math.sin(this.clock*43)*.018:0;
      this.gateGroup.rotation.z=s.gate<=0?-.18:0;
    }else{
      for(const t of s.targets||[]){if(t.rise<.02)continue;const obj=this.getObject('target'+t.id,()=>this.goof(t));
        // Don't interpolate exposure: visuals and authoritative cover hitboxes agree.
        this.place(obj,(t.x-.5)*32,(.5-t.y)*20,(Math.ceil(t.depth))*2-.65,null,1);obj.rotation.z=Math.sin(this.clock*3+t.seed)*.025;}
    }
    for(const [key,obj]of this.dynamic)if(!obj.userData.used){this.scene.remove(obj);obj.traverse(n=>{if(n.geometry)n.geometry.dispose();});this.dynamic.delete(key);}
    if(mode==='swarm_gate'||mode==='peek_shoot')for(const p of s.players.filter(p=>p.connected&&p.participant)){
      let cross=this.crosshairs.get(p.id);if(!cross){cross=this.crosshair(p);this.crosshairs.set(p.id,cross);}
      this.place(cross,mode==='peek_shoot'?(p.aim.x-.5)*32:(p.aim.x-.5)*36,mode==='peek_shoot'?(.5-p.aim.y)*20:.18,mode==='peek_shoot'?10:-27+p.aim.y*26,null,a);
    }
    for(const [id,cross]of this.crosshairs)cross.visible=!!s.players.find(p=>p.id===id&&p.connected&&p.participant);
  }
  instance(mesh,i,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){this.unit.position.set(x,y,z);this.unit.rotation.set(rx,ry,rz);this.unit.scale.set(sx,sy,sz);this.unit.updateMatrix();mesh.setMatrixAt(i,this.unit.matrix);}
  updateBots(bots,dt){
    const n=Math.min(300,bots.length);this.botsBody.count=n;this.botsEyes.count=this.botsPupils.count=n*2;this.botsLegs.count=n*6;const used=new Set();
    for(let i=0;i<n;i++){
      const b=bots[i];used.add(b.id);let p=this.smoothBots.get(b.id);if(!p){p={x:b.x,z:b.z};this.smoothBots.set(b.id,p);}p.x+=(b.x-p.x)*(1-Math.exp(-dt*22));p.z+=(b.z-p.z)*(1-Math.exp(-dt*22));
      const r=b.r,y=r*.60+Math.sin(this.clock*(b.kind==='runner'?19:12)+b.seed)*.035,angle=Math.atan2(b.targetX-p.x,-.85-p.z);
      this.instance(this.botsBody,i,p.x,y,p.z,r*.85,r*.60,r*1.25,0,angle);this.botsBody.setColorAt(i,new THREE.Color({termite:'#c6d99b',runner:'#f3a28d',tank:'#b49ddd',boss:'#f6c378'}[b.kind]));
      for(let eye=0;eye<2;eye++){const ex=(eye?1:-1)*r*.37,ez=r*.98,rx=ex*Math.cos(angle)+ez*Math.sin(angle),rz=-ex*Math.sin(angle)+ez*Math.cos(angle);
        this.instance(this.botsEyes,i*2+eye,p.x+rx,y+r*.36,p.z+rz,r*.22,r*.22,r*.16);this.instance(this.botsPupils,i*2+eye,p.x+rx,y+r*.37,p.z+rz+r*.10,r*.10,r*.11,r*.10);}
      for(let k=0;k<6;k++){const side=k%2?1:-1,along=(Math.floor(k/2)-1)*r*.8,wiggle=Math.sin(this.clock*15+k+b.seed)*.17;
        this.instance(this.botsLegs,i*6+k,p.x+side*r*.8,y*.54,p.z+along,r*1.3,r*1.35,r*1.3,wiggle,0,side*.92);}
    }
    for(const id of this.smoothBots.keys())if(!used.has(id))this.smoothBots.delete(id);
    for(const m of [this.botsBody,this.botsEyes,this.botsPupils,this.botsLegs])m.instanceMatrix.needsUpdate=true;
    if(n)this.botsBody.instanceColor.needsUpdate=true;
  }
  effect(e,s){
    if(e.kind==='shot'){
      const p=s.players.find(p=>p.id===e.player);if(!p)return;
      const to=mode==='peek_shoot'?new THREE.Vector3((e.x-.5)*32,(.5-e.y)*20,10):new THREE.Vector3(e.x,.65,e.z);
      const from=mode==='peek_shoot'?new THREE.Vector3((p.number/(s.players.length+1)-.5)*25,-11,10):new THREE.Vector3(e.ox,3.3,e.oz);
      this.effects.push({from,to,color:p.color,born:this.clock,hit:e.hit});
    }else if(e.kind==='pulse'){for(let i=0;i<16;i++){const a=i/16*Math.PI*2;this.effects.push({from:new THREE.Vector3(e.x,.2,e.z),to:new THREE.Vector3(e.x+Math.cos(a)*4,.25,e.z+Math.sin(a)*4),color:'#c8ff73',born:this.clock,hit:true});}}
    else if(e.kind==='roll'&&e.pins>=8&&!reduced){for(let i=0;i<18;i++){const x=(Math.random()-.5)*5;this.effects.push({from:new THREE.Vector3(x,.2,-11),to:new THREE.Vector3(x*1.3,1+Math.random()*3,-10+Math.random()*2),color:i%2?'#c8ff73':'#ef9384',born:this.clock,hit:true});}}
    this.effects=this.effects.slice(-100);
  }
  updateEffects(){
    this.effects=this.effects.filter(e=>this.clock-e.born<.18);let beams=0,flashes=0;
    for(const e of this.effects){const age=(this.clock-e.born)/.18,direction=e.to.clone().sub(e.from),length=direction.length();
      this.unit.position.copy(e.from).lerp(e.to,.5);this.unit.quaternion.setFromUnitVectors(this.yAxis,direction.normalize());this.unit.scale.set(.022*(1-age),length,.022*(1-age));this.unit.updateMatrix();this.tracers.setMatrixAt(beams,this.unit.matrix);this.tracers.setColorAt(beams++,new THREE.Color(e.color));
      if(e.hit){const scale=.26*(1-age);this.instance(this.flashes,flashes,e.to.x,e.to.y,e.to.z,scale,scale,scale,this.clock,0,this.clock);this.flashes.setColorAt(flashes++,new THREE.Color(e.color));}
    }
    this.tracers.count=beams;this.flashes.count=flashes;this.tracers.instanceMatrix.needsUpdate=this.flashes.instanceMatrix.needsUpdate=true;
    if(beams)this.tracers.instanceColor.needsUpdate=true;if(flashes)this.flashes.instanceColor.needsUpdate=true;
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
