import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {PartyConnection} from './net.js';
const $=id=>document.getElementById(id),mode=window.SS_CONFIG.mode,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,clamp=(value,min,max)=>Math.max(min,Math.min(max,value)),seededUnit=seed=>{const n=Math.sin(seed*12.9898+78.233)*43758.5453;return n-Math.floor(n);};document.body.dataset.ssMode=mode;
const net=new PartyConnection(true);let state=null,lastEvent=0,lastTurn='',noticeUntil=0,uiCards=new Map(),view,pendingHostStart=false,startSent=false;
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
const connectedRequired=mode==='curling'?2:1;
function requestHostStart(){
  if(startSent||state?.phase!=='waiting'){if(!state)pendingHostStart=true;return;}
  const connected=state.players.filter(p=>p.connected).length;
  if(connected<connectedRequired){pendingHostStart=true;$('start').dataset.pending='true';$('start').textContent='Подключаем игроков…';$('start').setAttribute('aria-busy','true');$('ss-status').textContent='Подключаем игроков к матчу — запуск продолжится автоматически';return;}
  pendingHostStart=false;startSent=true;$('start').dataset.pending='';$('start').removeAttribute('aria-busy');$('start').textContent='Запускаем…';net.send('start',{[settings[1]]:Number(select.value)});
}
$('start').onclick=requestHostStart;$('ss-again').onclick=()=>{startSent=false;pendingHostStart=false;net.send('reset');};
$('ss-lobby').onclick=()=>{if(window.parent!==window)window.parent.postMessage({type:'party-exit',instance:window.parent.PARTY_INSTANCE},location.origin);else location.href='/host';};
window.addEventListener('message',e=>{if(e.source===window.parent&&e.origin===location.origin&&e.data?.type==='party-start'){pendingHostStart=true;requestHostStart();}});
net.addEventListener('status',e=>{if(!state||state.phase==='waiting')$('ss-status').textContent=e.detail;});
function text(tag,value){const e=document.createElement(tag);e.textContent=value;return e;}
function frameText(frames){return (frames||[]).map(f=>{const r=f.rolls;return r.map((v,i)=>v===10?'X':i>0&&r[i-1]+v===10&&r[i-1]!==10?'/':v===0?'–':String(v)).join('');}).join(' · ');}
function makePlayerCard(p){
  const card=document.createElement('div');card.className='ss-player-card';card.setAttribute('role','listitem');
  const badge=document.createElement('span');badge.className='ss-player-avatar';
  const avatar=document.createElement('img');avatar.alt='';avatar.hidden=true;avatar.addEventListener('error',()=>{avatar.hidden=true;badge.classList.remove('has-photo');});
  const initial=text('i','');const number=text('em','');badge.append(avatar,initial,number);
  const copy=document.createElement('span');copy.className='ss-player-copy';const name=text('b',''),detail=text('small','');
  const bar=document.createElement('span');bar.className='ss-bar';bar.append(document.createElement('i'));copy.append(name,detail,bar);
  const score=text('strong','0');score.className='ss-player-score';card.append(badge,copy,score);card._ui={avatar,badge,initial,number,name,detail,bar:bar.firstChild,score};return card;
}
function paintUI(s){
  const playing=s.phase==='playing',waiting=s.phase==='waiting',current=s.players.find(p=>p.id===s.currentId),time=Math.max(0,Math.ceil(s.deadline-s.t));
  if(!waiting){startSent=false;pendingHostStart=false;}
  $('ss-overlay').hidden=playing;$('start').hidden=!waiting;$('ss-again').hidden=s.phase!=='results';$('ss-settings').hidden=!waiting;
  const connected=s.players.filter(p=>p.connected).length,enoughPlayers=connected>=connectedRequired;
  $('start').disabled=false;$('start').removeAttribute('aria-disabled');
  if(waiting&&!startSent){$('start').textContent=pendingHostStart&&!enoughPlayers?'Подключаем игроков…':'Начать игру ↗';$('start').toggleAttribute('aria-busy',pendingHostStart&&!enoughPlayers);$('start').dataset.pending=pendingHostStart&&!enoughPlayers?'true':'';}
  $('ss-roster').textContent=waiting?(connected?`${connected} игроков подключились. Можно начинать.`:'Подключаем телефоны к матчу…'):'';
  $('ss-overlay-title').textContent=s.phase==='results'?s.result.reason:'Собираемся?';$('ss-instructions').hidden=s.phase==='results';
  $('ss-mode').textContent=`LOCALPARTY / ALPHA · ${mode==='bowling'?'3D BOWLING':mode==='curling'?'CURLING':mode==='swarm_gate'?'CO-OP DEFENCE':'SHOOTING GALLERY'}`;
  $('ss-stage').textContent=waiting?'ЛОББИ':s.phase==='results'?'ФИНАЛ':mode==='bowling'?({aim:'ПРИЦЕЛ',rolling:'ШАР В ИГРЕ',reveal:'КЕГЛИ'}[s.stage]||'МАТЧ'):mode==='curling'?({aim:'БРОСОК',rolling:'КАМЕНЬ ИДЁТ',reveal:'ЗАМЕР',end:'СЧЁТ ЭНДА'}[s.stage]||'МАТЧ'):mode==='swarm_gate'?s.stage==='break'?'РЕМОНТ':'ОБОРОНА':'ОХОТА';
  $('ss-status').textContent=waiting?(pendingHostStart&&!enoughPlayers?'Подключаем игроков — матч запустится автоматически':enoughPlayers?'Игроки подключены — можно начинать':'Откройте игру на телефонах'):mode==='bowling'?`${current?.name||''} · фрейм ${current?.frames.length||1}/${s.frameCount} · ${s.stage==='aim'?'готовит бросок':s.stage==='rolling'?'шар на дорожке':'считаем кегли'}`:mode==='curling'?`Энд ${s.endIndex}/${s.endCount} · камень ${(s.throwIndex||0)+1}/${s.throwCount||0} · ${current?.name||''}`:mode==='swarm_gate'?`Волна ${s.wave||0}/${s.waveCount||6} · ${s.enemies.length} у ворот · ещё ${s.waveLeft||0} в рое`:'Попадай в чудиков. Белый флажок — не цель.';
  let primary=['ИГРОКИ',String(s.players.filter(p=>p.connected).length)],secondary=['РЕЖИМ',settings[0].toUpperCase()];
  if(playing&&mode==='bowling'){primary=['ФРЕЙМ',`${current?.frames.length||1}/${s.frameCount}`];secondary=['НА БРОСОК',s.deadline?`${time} c`:'—'];}
  else if(playing&&mode==='curling'){primary=['КОМАНДЫ',`${s.teams?.[0]||0} : ${s.teams?.[1]||0}`];secondary=['ЭНД · ХОД',`${s.endIndex||1}/${s.endCount||3} · ${time} c`];}
  else if(playing&&mode==='swarm_gate'){primary=['ВОЛНА',`${s.wave||0}/${s.waveCount||6}`];secondary=['НА ПОЛЕ · В РОЕ',`${s.enemies.length} · ${s.waveLeft||0}`];}
  else if(playing){primary=['ДО ФИНАЛА',`${time} c`];secondary=['ЛУЧШАЯ СЕРИЯ',String(Math.max(0,...s.players.map(p=>p.streak||0)))+'/6'];}
  else if(s.phase==='results'){primary=['ИТОГ',s.result?.winners?.length===1?'1 ПОБЕДИТЕЛЬ':'ФИНАЛ'];secondary=['ИГРОКИ',String(s.players.length)];}
  $('ss-primary-label').textContent=primary[0];$('ss-primary-value').textContent=primary[1];$('ss-secondary-label').textContent=secondary[0];$('ss-secondary-value').textContent=secondary[1];
  const gatePercent=Math.max(0,Math.min(100,(s.gate??1000)/10));$('ss-gate-health').hidden=mode!=='swarm_gate'||!playing;$('ss-gate-value').textContent=Math.ceil(gatePercent)+'%';$('ss-gate').style.width=gatePercent+'%';
  const scoreboard=$('ss-scoreboard'),scoreRows=Math.max(1,Math.ceil(s.players.length/8));scoreboard.dataset.count=String(s.players.length);scoreboard.style.setProperty('--ss-cols',String(Math.max(1,Math.min(8,s.players.length))));document.body.dataset.ssScoreRows=String(scoreRows);scoreboard.setAttribute('role','list');scoreboard.setAttribute('aria-label','Игроки и счёт');
  for(const p of s.players){
    let card=uiCards.get(p.id);
    if(!card){card=makePlayerCard(p);uiCards.set(p.id,card);scoreboard.append(card);}
    card.style.setProperty('--ss-player',p.color);card.classList.toggle('current',playing&&p.id===s.currentId);card.classList.toggle('offline',!p.connected);
    const ui=card._ui;ui.name.textContent=p.name;ui.initial.textContent=(p.name.trim()[0]||'?').toLocaleUpperCase('ru-RU');ui.number.textContent=p.number;ui.score.textContent=p.score;
    if(p.avatar&&ui.avatar.dataset.src!==p.avatar){ui.avatar.dataset.src=p.avatar;ui.avatar.hidden=false;ui.badge.classList.add('has-photo');ui.avatar.src=p.avatar;}else if(!p.avatar){ui.avatar.dataset.src='';ui.avatar.removeAttribute('src');ui.avatar.hidden=true;ui.badge.classList.remove('has-photo');}
    ui.detail.textContent=!p.participant&&!waiting?'Наблюдает':mode==='bowling'?frameText(p.frames):mode==='curling'?(p.team===0?'Коралловые':'Бирюзовые'):mode==='swarm_gate'?`${p.kills} целей${p.lockedUntil>s.t?' · перегрев':''}`:p.gunUntil>s.t?`ПУЛЕМЁТ · ${Math.ceil(p.gunUntil-s.t)} c`:p.charge?'ПУЛЕМЁТ ГОТОВ':`${p.streak}/6 · ${p.hits} попаданий`;
    const percent=mode==='swarm_gate'?p.heat*100:mode==='curling'?p.energy*100:p.gunUntil>s.t?(p.gunUntil-s.t)/8*100:p.charge?100:p.streak/6*100;
    ui.bar.style.width=Math.max(0,Math.min(100,percent))+'%';card.title=mode==='bowling'?frameText(p.frames):`${p.name}: ${p.score}`;card.setAttribute('aria-label',`${p.number}. ${p.name}: ${p.score}`);
  }
  for(const [id,card] of uiCards)if(!s.players.some(p=>p.id===id)){card.remove();uiCards.delete(id);}
  if(s.phase==='results'&&$('ss-results').dataset.id!==s.result.eventId){
    $('ss-results').dataset.id=s.result.eventId;$('ss-results').replaceChildren(...[...s.result.players].sort((a,b)=>b.score-a.score).map(p=>{const row=document.createElement('div');row.className='ss-result-row'+(p.won?' winner':'');row.append(text('b',(p.won?'★ ':'')+p.name),text('strong',String(p.score)));return row;}));
  }else if(waiting){$('ss-results').replaceChildren();$('ss-results').dataset.id='';}
  if(waiting&&pendingHostStart&&enoughPlayers&&!startSent)queueMicrotask(requestHostStart);
  for(const e of s.events){if(e.id<=lastEvent)continue;lastEvent=e.id;view?.effect(e,s);
    const feelType=e.kind==='shot'?(e.dead?'elimination':e.hit?'hit':'shot'):e.kind==='pulse'?'explosion':e.kind==='score'||e.kind==='roll'?'score':e.kind==='friendly'?'danger':e.kind==='finish'?'round-result':null;
    if(feelType){const feelX=mode==='swarm_gate'?.5+(e.x??0)/40:(e.x??.5),feelY=mode==='swarm_gate'?.25+((e.z??-14)+27)/27*.55:(e.y??.5);window.LocalPartyFeel?.emit(feelType,{id:`sports:${e.id}`,x:feelX,y:feelY,intensity:e.dead?.78:e.kind==='pulse'?.72:.42,shake:e.kind!=='score'&&e.kind!=='roll'});}
    if(e.text&&e.kind!=='throw'&&e.kind!=='stone'){const el=$('ss-notice');el.textContent=e.text;el.classList.add('show');noticeUntil=performance.now()+2200;}}
}
net.addEventListener('state',e=>{state=e.detail;paintUI(state);view?.setState(state);});
class Stage {
  constructor(){
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(mode==='bowling'?'#0e1420':mode==='curling'?'#102b35':mode==='peek_shoot'?'#222539':'#111b25');
    this.scene.fog=new THREE.Fog(this.scene.background,65,130);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    const gl=this.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
    const gpu=debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'';
    this.software=/swiftshader|llvmpipe|softpipe|software/i.test(gpu);
    this.renderer.setPixelRatio(this.software?1:Math.min(devicePixelRatio||1,2));
    this.renderer.shadowMap.enabled=!this.software;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    document.body.dataset.renderQuality=this.software?'software-compatible':'full';
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=mode==='bowling'?1.34:mode==='curling'?1.28:1.18;
    $('ss-scene').append(this.renderer.domElement);
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('ss-error').hidden=false;$('ss-error').textContent='Графический контекст потерян. Перезагрузи экран ведущего — матч на сервере сохранится.';});
    this.camera=['bowling','curling'].includes(mode)?new THREE.PerspectiveCamera(mode==='bowling'?46:42,1,.1,180):new THREE.OrthographicCamera(-20,20,15,-15,.1,180);
    this.camera.position.set(...(mode==='bowling'?[0,5.3,17.5]:mode==='curling'?[0,2.65,13.2]:mode==='swarm_gate'?[0,30,22]:[0,0,35]));
    this.look=new THREE.Vector3(...(mode==='swarm_gate'?[0,0,-8]:mode==='peek_shoot'?[0,0,0]:[0,0,-2]));this.camera.lookAt(this.look);
    this.scene.add(new THREE.HemisphereLight(mode==='bowling'?'#d9eaff':'#d9fbff',mode==='bowling'?'#2e1838':'#163540',2.35));
    const key=new THREE.DirectionalLight(mode==='bowling'?'#ffe2ba':'#e8fbff',4.1);key.position.set(-10,25,13);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
    Object.assign(key.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:.5,far:90});key.shadow.bias=-.00015;key.shadow.normalBias=.035;this.scene.add(key);key.target.position.set(0,0,-6);this.scene.add(key.target);
    const fill=new THREE.DirectionalLight(mode==='bowling'?'#a976ff':'#65e7f1',1.55);fill.position.set(14,12,-15);this.scene.add(fill);
    if(['bowling','curling'].includes(mode)){const rim=new THREE.PointLight(mode==='bowling'?'#c878ff':'#67f2ff',22,34,1.7);rim.position.set(0,7,-12);this.scene.add(rim);}
    this.materials=new Map();this.assetTextures=new Map();this.environmentModels=new Map();this.gltfLoader=new GLTFLoader();this.dynamic=new Map();this.crosshairs=new Map();this.turrets=new Map();this.popups=[];this.smoothBots=new Map();
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
  localTexture(file,{repeat=null}={}){
    const key=`local:${file}:${repeat||''}`;if(this.assetTextures.has(key))return this.assetTextures.get(key);
    const texture=new THREE.TextureLoader().load(`./assets/environment/${file}`);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
    if(repeat){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(...repeat);}this.assetTextures.set(key,texture);return texture;
  }
  assetSprite(name,width,height,options={}){
    const material=new THREE.SpriteMaterial({map:this.assetTexture(name),transparent:true,alphaTest:.035,depthTest:options.depthTest!==false,depthWrite:!!options.depthWrite,toneMapped:false,opacity:options.opacity??1});
    const sprite=new THREE.Sprite(material);sprite.scale.set(width,height,1);sprite.renderOrder=options.renderOrder||0;sprite.userData.assetSprite=true;return sprite;
  }
  projectileTrail(color){
    if(!this.projectileTrailTexture){const canvas=document.createElement('canvas');canvas.width=96;canvas.height=256;const c=canvas.getContext('2d'),gradient=c.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.12,'#fffffff0');gradient.addColorStop(.55,'#ffffff58');gradient.addColorStop(1,'#ffffff00');c.fillStyle=gradient;c.beginPath();c.moveTo(7,18);c.quadraticCurveTo(7,1,24,0);c.lineTo(72,0);c.quadraticCurveTo(89,1,89,18);c.quadraticCurveTo(72,124,48,252);c.quadraticCurveTo(24,124,7,18);c.fill();this.projectileTrailTexture=new THREE.CanvasTexture(canvas);this.projectileTrailTexture.colorSpace=THREE.SRGBColorSpace;}
    const material=new THREE.SpriteMaterial({map:this.projectileTrailTexture,color,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending});const sprite=new THREE.Sprite(material);sprite.renderOrder=12;return sprite;
  }
  killHalo(color){
    if(!this.killHaloTexture){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d');c.translate(128,128);const glow=c.createRadialGradient(0,0,8,0,0,112);glow.addColorStop(0,'#ffffffff');glow.addColorStop(.18,'#ffffffd8');glow.addColorStop(.42,'#ffffff42');glow.addColorStop(1,'#ffffff00');c.fillStyle=glow;c.beginPath();c.arc(0,0,112,0,Math.PI*2);c.fill();c.strokeStyle='#ffffffff';c.lineWidth=9;c.beginPath();c.arc(0,0,54,0,Math.PI*2);c.stroke();c.lineCap='round';for(let i=0;i<12;i++){const a=i*Math.PI/6,inner=i%2?70:63,outer=i%2?91:108;c.lineWidth=i%2?5:8;c.beginPath();c.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);c.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);c.stroke();}this.killHaloTexture=new THREE.CanvasTexture(canvas);this.killHaloTexture.colorSpace=THREE.SRGBColorSpace;}
    const material=new THREE.SpriteMaterial({map:this.killHaloTexture,color,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending});const sprite=new THREE.Sprite(material);sprite.renderOrder=15;return sprite;
  }
  bowlingPitFog(){
    if(!this.bowlingPitFogTexture){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d'),depth=c.createRadialGradient(256,170,12,256,142,300);depth.addColorStop(0,'#010207ff');depth.addColorStop(.38,'#03050cf5');depth.addColorStop(.72,'#080b18d9');depth.addColorStop(1,'#18203c70');c.fillStyle=depth;c.fillRect(0,0,512,256);const veil=c.createLinearGradient(0,0,0,256);veil.addColorStop(0,'#28304d38');veil.addColorStop(.38,'#080b18a8');veil.addColorStop(1,'#000106f5');c.fillStyle=veil;c.fillRect(0,0,512,256);this.bowlingPitFogTexture=new THREE.CanvasTexture(canvas);this.bowlingPitFogTexture.colorSpace=THREE.SRGBColorSpace;}
    const material=new THREE.MeshBasicMaterial({map:this.bowlingPitFogTexture,transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});const fog=new THREE.Mesh(new THREE.PlaneGeometry(7.35,1.82),material);fog.renderOrder=1;return fog;
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
  playerBubble(p,size=.55){
    const canvas=document.createElement('canvas');canvas.width=192;canvas.height=72;const c=canvas.getContext('2d'),initial=(p.name?.trim()?.[0]||'?').toLocaleUpperCase('ru-RU');
    c.fillStyle='#080b12e8';c.beginPath();c.roundRect(3,5,186,62,28);c.fill();c.strokeStyle=p.color;c.lineWidth=4;c.stroke();
    c.fillStyle=p.color;c.beginPath();c.arc(34,36,23,0,Math.PI*2);c.fill();c.fillStyle='#0a0d12';c.font='900 25px Rubik, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(initial,34,37);
    c.fillStyle='#fff';c.font='850 21px Rubik, sans-serif';c.textAlign='left';c.fillText((p.name||`Игрок ${p.number}`).slice(0,10),66,31);c.fillStyle=p.color;c.font='850 15px Rubik, sans-serif';c.fillText(`#${p.number}`,66,51);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,depthWrite:false,toneMapped:false}));sprite.scale.set(size*2.7,size,1);sprite.renderOrder=16;return sprite;
  }
  environmentModel(file,{position=[0,0,0],rotation=[0,0,0],scale=1,tint=null,hideMaterials=[],omitRegions=[]}={}){
    let source=this.environmentModels.get(file);
    if(!source){source=new Promise((resolve,reject)=>this.gltfLoader.load(file,gltf=>resolve(gltf.scene),undefined,reject));this.environmentModels.set(file,source);}
    source.then(template=>{const model=template.clone(true);model.position.set(...position);model.rotation.set(...rotation);model.scale.setScalar(scale);model.traverse(child=>{if(!child.isMesh)return;const materialName=child.material?.name?.toLowerCase()||'';if(hideMaterials.some(name=>materialName.includes(name.toLowerCase()))){child.visible=false;return;}
      const regions=omitRegions.filter(region=>materialName.includes(region.material.toLowerCase()));if(regions.length&&child.geometry){child.geometry=child.geometry.clone();const position=child.geometry.getAttribute('position'),sourceIndex=child.geometry.index?Array.from(child.geometry.index.array):Array.from({length:position.count},(_,i)=>i),kept=[];for(let i=0;i<sourceIndex.length;i+=3){const ids=sourceIndex.slice(i,i+3),center=[0,0,0];for(const id of ids){center[0]+=position.getX(id)/3;center[1]+=position.getY(id)/3;center[2]+=position.getZ(id)/3;}if(!regions.some(region=>center.every((value,axis)=>value>=region.min[axis]&&value<=region.max[axis])))kept.push(...ids);}child.geometry.setIndex(kept);child.geometry.computeBoundingSphere();}
      child.castShadow=false;child.receiveShadow=true;if(child.material){child.material=child.material.clone();child.material.roughness=.72;child.material.metalness=Math.min(.12,child.material.metalness??0);if(child.material.color){if(tint)child.material.color.lerp(new THREE.Color(tint),.28);child.material.color.offsetHSL(0,.08,.025);child.material.emissive=child.material.color.clone().multiplyScalar(.045);child.material.emissiveIntensity=.5;}}});this.scene.add(model);}).catch(error=>console.warn('Environment asset failed',file,error));
  }
  staticScene(){
    if(mode==='bowling'){
      this.box(55,.5,65,'#202934',0,-.85,-1);
      // Strips are geometry, not a remote texture: portable/offline builds stay self-contained.
      for(let i=0;i<14;i++)this.box(4.4/14,.25,28,i%3===0?'#c8955a':i%3===1?'#d9ad70':'#ddb77e',-2.2+(i+.5)*4.4/14,-.13,2);
      for(const x of [-2.65,2.65]){this.box(.9,.16,32,'#253747',x,-.40,0);this.glowBox(.06,.05,31.5,'#60e1ed',Math.sign(x)*3.12,.03,0);}
      // Keep the room wall behind a recessed pinsetter. The pit itself has a
      // closed floor and dark local haze, while the upper opening remains deep.
      this.box(24,5.5,.6,'#1b2839',0,1.65,-16.8);this.glowBox(22,.08,.05,'#ba92ff',0,3.9,-16.44);this.glowBox(22,.045,.05,'#65e7f1',0,-.25,-16.44);
      for(const x of [-9,-6,-3,0,3,6,9])this.glowBox(.045,4.4,.05,x%6?'#65e7f1':'#ba92ff',x,1.7,-16.18);
      const pinDeck=this.box(4.4,.16,3.4,'#c79b64',0,-.08,-13.7);pinDeck.material=this.mat('#c79b64',.34);
      this.box(7.55,.16,2.45,'#191523',0,-.18,-15.38);this.box(7.55,.56,.34,'#55385f',0,.10,-14.55);
      this.box(7.55,1.9,.12,'#03050b',0,.82,-16.28);const pitFog=this.bowlingPitFog();pitFog.position.set(0,.82,-16.10);this.scene.add(pitFog);
      this.box(8.2,.38,2.75,'#7a5549',0,2.06,-14.78);this.box(8.2,.54,.42,'#d7b37f',0,1.82,-13.55);
      for(const x of [-2.7,-1.35,0,1.35,2.7])this.box(.055,.34,.08,'#9a7058',x,1.82,-13.31);
      this.glowBox(7.3,.055,.05,'#ffcf73',0,.42,-14.34);this.glowBox(7.3,.035,.05,'#bd92ff',0,1.54,-13.31);
      for(const x of [-3.85,3.85])this.box(.48,2.5,3.5,'#222d3b',x,.86,-13.0);
      for(let i=-2;i<=2;i++)this.sphere(.07,'#533c2c',i*.6,.018,6.7);
      this.box(4.4,.012,.08,'#513b34',0,.008,10.5);this.box(7,.25,8,'#3e454d',0,-.14,19.7);
      for(const x of [-10,10]){this.box(4,.3,36,'#263445',x,-.25,-2);for(let z=-12;z<15;z+=7)this.glowBox(2.5,.05,.08,'#8e6fbb',x,.02,z);}
      for(const x of [-9,-6,-3,3,6,9])this.environmentModel('./assets/environment/bowling/wall-panel.glb',{position:[x,-.1,-16.12],scale:2.05,tint:x%6?'#263c58':'#54316d'});
      this.environmentModel('./assets/environment/bowling/neon-sign.glb',{position:[0,2.45,-15.38],scale:1.8,tint:'#c58aff'});
      for(const x of [-6,0,6])for(const z of [-9,2,13])this.environmentModel('./assets/environment/bowling/ceiling-light.glb',{position:[x,7,z],scale:1.25,tint:'#88efff'});
    }else if(mode==='curling'){
      this.box(45,.5,55,'#203943',0,-.7,0);this.box(6.7,.35,30,'#cce9e6',0,-.18,0);
      // One coherent CC0 hall defines the architecture around the procedural
      // sheet. Its original 51 m axis is X, so quarter-turn it onto gameplay Z.
      // The slight negative Y offset keeps the hall floor below the ice surface.
      this.environmentModel('./assets/environment/curling/roofed-hall.glb',{position:[0,-.16,0],rotation:[0,Math.PI/2,0],scale:.6,tint:'#245363',omitRegions:['white','steel'].map(material=>({material,min:[.2,-1,-.3],max:[.82,1,-.12]}))});
      for(const x of [-3.45,3.45]){this.box(.24,.32,31,'#304e60',x,.05,0);this.glowBox(.045,.025,30,'#91e7e6',x,.24,0);}
      for(const [r,c] of [[2.6,'#51c9dc'],[1.8,'#e9f1df'],[.95,'#ee9385'],[.35,'#f8f3e2']]){
        const circle=this.mesh(new THREE.CircleGeometry(r,64),this.mat(c,.25),0,.012+(2.6-r)*.002,-9);circle.rotation.x=-Math.PI/2;circle.receiveShadow=true;
      }
      for(const z of [-9,0,10])this.box(6.7,.008,.055,'#6e9295',0,.015,z);
      this.box(.025,.008,29.5,'#88b5bb',0,.018,0);
      for(let i=0;i<55;i++){const scratch=this.box(.007,.002,2+(i%3),'#bbdcd9',((i*1.73)%6)-3,.012,((i*3.19)%27)-13);scratch.rotation.y=.04*(i%4);}
      this.brooms=new THREE.Group();const sweepMat=new THREE.MeshBasicMaterial({color:'#8ff7ff',transparent:true,opacity:.36,depthWrite:false,side:THREE.DoubleSide});const sweepRing=this.mesh(new THREE.RingGeometry(.62,.78,40),sweepMat,0,.035,0,this.brooms);sweepRing.rotation.x=-Math.PI/2;sweepRing.castShadow=false;sweepRing.receiveShadow=false;this.scene.add(this.brooms);this.brooms.visible=false;
    }else if(mode==='swarm_gate'){
      const ground=this.assetTexture('swarm-ground-tile',{root:'',repeat:[4,5]});
      const field=this.mesh(new THREE.PlaneGeometry(62,72),new THREE.MeshStandardMaterial({map:ground,color:'#a8afbf',roughness:1,metalness:0}),0,-.30,-12);field.rotation.x=-Math.PI/2;field.receiveShadow=true;
      this.wallGroup=new THREE.Group();this.scene.add(this.wallGroup);
      for(let x=-45;x<=45;x+=5){const wall=this.assetSprite('wall-straight',6.15,5.0,{depthWrite:true});wall.position.set(x,2.05,0);this.wallGroup.add(wall);}
      this.gateGroup=new THREE.Group();this.scene.add(this.gateGroup);
      this.gateSprite=this.assetSprite('gate-closed',7.2,5.2,{depthWrite:true});this.gateSprite.position.set(0,2.05,.12);this.gateGroup.add(this.gateSprite);
      this.repairSprite=this.assetSprite('wall-repair',3.2,4.0,{depthTest:false,renderOrder:8});this.repairSprite.position.set(0,2.7,.35);this.repairSprite.visible=false;this.scene.add(this.repairSprite);
      this.glowBox(90,.08,.07,'#6de2dc',0,4.72,-.18);
      this.makeBots();
    }else{
      this.scene.fog=null;
      const bgTexture=this.localTexture('gallery/bg-blue.png',{repeat:[4,3]}),bg=this.mesh(new THREE.PlaneGeometry(48,29),new THREE.MeshBasicMaterial({map:bgTexture,color:'#526988',toneMapped:false}),0,0,-4);bg.castShadow=false;
      this.galleryLayers=[];for(let i=0;i<9;i++){const texture=this.localTexture(`gallery/cloud-${i%2+1}.png`),cloud=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:i%3===0?'#7b91b1':'#506987',transparent:true,opacity:.66,depthTest:false,toneMapped:false}));cloud.position.set(-20+i*5,7+(i%2)*1.2,-2.6+i*.02);cloud.scale.set(4.4+(i%3),2.6+(i%2)*.4,1);cloud.userData.baseX=cloud.position.x;this.galleryLayers.push(cloud);this.scene.add(cloud);}
      const wood=this.mesh(new THREE.PlaneGeometry(46,5),new THREE.MeshBasicMaterial({map:this.localTexture('gallery/bg-wood.png',{repeat:[9,1]}),color:'#865b47',toneMapped:false}),0,-9,-1.8);wood.castShadow=false;
      const curtainTop=new THREE.Sprite(new THREE.SpriteMaterial({map:this.localTexture('gallery/curtain-top.png'),color:'#7f49ae',transparent:true,toneMapped:false}));curtainTop.position.set(0,9.5,-1.5);curtainTop.scale.set(44,6,1);this.scene.add(curtainTop);
      for(const x of [-19,19]){const curtain=new THREE.Sprite(new THREE.SpriteMaterial({map:this.localTexture('gallery/curtain-side.png'),color:x<0?'#8242b5':'#a04a95',transparent:true,toneMapped:false}));curtain.position.set(x,0,-1.4);curtain.scale.set(7,23,1);if(x>0)curtain.material.rotation=Math.PI;this.scene.add(curtain);}
      const coverNames=['cover-wood','cover-stone','cover-metal','cover-rounded'];
      for(let row=0;row<3;row++)for(let col=0;col<5;col++){
        const x=.025+col*.195+(row%2)*.012,y=.27+row*.225,w=.155,h=.1,depth=row+1,kind=(row+col)%4;
        const wx=(x+w/2-.5)*32,wy=(.5-y-h/2)*20,z=depth*2;
        const cover=this.assetSprite(coverNames[kind],w*32,h*20,{depthWrite:true});cover.position.set(wx,wy,z);this.scene.add(cover);
      }
    }
  }
  makePools(){
    this.particles=new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1,0),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false,transparent:true,opacity:.82,blending:THREE.AdditiveBlending,depthWrite:false}),360);this.particles.count=0;this.particles.frustumCulled=false;this.scene.add(this.particles);
    this.effects=[];
  }
  makeBots(){
    const geometry=new THREE.PlaneGeometry(1,1),names={termite:'swarm-termite',runner:'swarm-runner',tank:'swarm-tank',boss:'swarm-boss'};this.botSprites={};
    for(const [kind,name] of Object.entries(names)){
      const material=new THREE.MeshBasicMaterial({map:this.assetTexture(name),transparent:true,alphaTest:.035,depthWrite:true,toneMapped:false,side:THREE.DoubleSide});
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
    const g=new THREE.Group(),reticle=new THREE.Sprite(new THREE.SpriteMaterial({map:this.localTexture('gallery/crosshair-mask.png'),color:p.color,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));reticle.scale.set(.9,.9,1);reticle.renderOrder=15;g.add(reticle);
    const bubble=this.playerBubble(p,.44);bubble.position.set(.85,mode==='swarm_gate'?1.15:.8,.05);g.add(bubble);g.renderOrder=9;this.scene.add(g);return g;
  }
  turret(p){const g=new THREE.Group();
    // Every visible part uses one world-space anchor. The generated long head is
    // cropped tightly around the barrel, so its mechanical pivot is 31% up from
    // the bottom of the sprite rather than the centre of the cropped rectangle.
    const pivot=new THREE.Vector3(0,.68,1.12);
    const ring=this.assetSprite('turret-selection',4.55,4.55,{depthWrite:false,renderOrder:4});ring.position.copy(pivot);ring.material.color.set(p.color);ring.material.opacity=.82;g.add(ring);
    const pedestal=this.assetSprite('turret-base',4.25,4.25,{depthWrite:false,renderOrder:5});pedestal.position.copy(pivot);g.add(pedestal);
    const head=this.assetSprite('turret-head-long',2.55,3.75,{depthWrite:false,renderOrder:6});head.center.set(.5,.31);head.position.copy(pivot);head.userData.muzzleReach=2.34;g.add(head);
    const number=this.playerBubble(p,.48);number.position.set(pivot.x,pivot.y+3.0,pivot.z);g.add(number);
    g.userData.head=head;g.userData.base=pedestal;g.userData.ring=ring;g.userData.bubble=number;g.userData.pivot=pivot.clone();this.scene.add(g);return g;}
  turretMuzzle(turret){
    const head=turret?.userData.head;if(!head)return null;
    const origin=new THREE.Vector3();head.getWorldPosition(origin);
    const angle=head.material.rotation||0,up=new THREE.Vector3(0,1,0).applyQuaternion(this.camera.quaternion),right=new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion);
    return origin.addScaledVector(up,Math.cos(angle)*head.userData.muzzleReach).addScaledVector(right,-Math.sin(angle)*head.userData.muzzleReach);
  }
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
      if(this.brooms.visible){this.brooms.position.set(active.x,0,active.z-.72);this.brooms.rotation.y=0;const pulse=1+Math.sin(this.clock*12)*.08;this.brooms.scale.set(pulse,1,pulse);}
      const cameraPos=new THREE.Vector3(0,2.65,13.2),look=new THREE.Vector3(0,.1,-9);
      if(s.stage==='rolling'&&active?.valid){const elapsed=Math.max(0,s.t-(this.rollingStartedAt??s.t)),u=Math.max(0,Math.min(1,(elapsed-.12)/1.0)),fly=u*u*(3-2*u),chase=new THREE.Vector3(active.x+2.7,2.45,Math.max(-4,active.z+6.4)),ahead=new THREE.Vector3(active.x,.05,active.z-3.2);cameraPos.lerp(chase,fly);look.lerp(ahead,fly);}
      else if(['reveal','end'].includes(s.stage)){cameraPos.set(2.7,2.65,-1);look.set(0,0,-9);}
      this.moveCamera(cameraPos,look,dt,s.stage==='rolling'?3:2.2);
    }else if(mode==='swarm_gate'){
      for(const p of s.players.filter(p=>p.participant||s.phase==='waiting')){let turret=this.turrets.get(p.id);if(!turret){turret=this.turret(p);this.turrets.set(p.id,turret);}turret.position.x=p.turretX||0;turret.position.z=3.1;turret.updateMatrixWorld(true);const target=new THREE.Vector3((p.aim.x-.5)*36,.65,-27+p.aim.y*26),pivot=new THREE.Vector3();turret.userData.head.getWorldPosition(pivot);const pivotScreen=pivot.clone().project(this.camera),targetScreen=target.clone().project(this.camera);turret.userData.head.material.rotation=-Math.atan2(targetScreen.x-pivotScreen.x,targetScreen.y-pivotScreen.y);}
      this.updateBots(s.enemies,dt);
      const chewing=s.enemies.some(b=>b.z>=-1);this.gateGroup.position.x=chewing&&!reduced?Math.sin(this.clock*43)*.018:0;
      this.gateGroup.rotation.z=s.gate<=0?-.18:0;
      const gateName=s.gate<=0?'gate-open':s.gate<(s.maxGate||1000)*.55?'gate-damaged':'gate-closed';if(this.gateSprite.userData.assetName!==gateName){this.gateSprite.userData.assetName=gateName;this.gateSprite.material.map=this.assetTexture(gateName);this.gateSprite.material.needsUpdate=true;}
      this.repairSprite.visible=s.stage==='break';if(this.repairSprite.visible)this.repairSprite.material.opacity=.72+Math.sin(this.clock*7)*.20;
    }else{
      for(const [index,layer] of (this.galleryLayers||[]).entries())layer.position.x=layer.userData.baseX+Math.sin(this.clock*.22+index)*.18;
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
      const from=mode==='peek_shoot'?new THREE.Vector3((p.number/(s.players.length+1)-.5)*25,-11,10):(this.turretMuzzle(this.turrets.get(p.id))||new THREE.Vector3(e.ox,3.0,e.oz+2.6));
      const projectileName=mode==='peek_shoot'?(p.number%2?'shot-gold':'shot-violet'):(p.number%2?'turret-shell':'turret-bolt');
      const projectile=this.assetSprite(projectileName,mode==='peek_shoot'?1.65:1.05,mode==='peek_shoot'?2.3:1.75,{depthTest:false,renderOrder:13});projectile.position.copy(from);
      const fromScreen=from.clone().project(this.camera),toScreen=to.clone().project(this.camera),screenAngle=-Math.atan2(toScreen.x-fromScreen.x,toScreen.y-fromScreen.y);projectile.material.rotation=screenAngle;this.scene.add(projectile);
      const color=e.hit?(e.good===false?'#ff5e7a':'#ffe568'):p.color,trail=this.projectileTrail(color);trail.position.copy(from);trail.material.rotation=projectile.material.rotation;trail.visible=false;this.scene.add(trail);
      const muzzle=this.assetSprite('muzzle-a',2.3,3.05,{depthTest:false,renderOrder:12});muzzle.position.copy(from);muzzle.material.rotation=screenAngle;this.scene.add(muzzle);
      const impactPrefix=mode==='swarm_gate'&&e.dead?`swarm-death-${e.targetKind||'termite'}`:mode==='peek_shoot'&&e.hit?'gallery-death':e.hit?'hit':'miss';
      const impactFrames=impactPrefix.startsWith('swarm-death-')||impactPrefix==='gallery-death'?8:2,impactBase=mode==='swarm_gate'?[3.5,3.5]:mode==='peek_shoot'&&e.dead?[7.2,7.2]:[3,4],impact=this.assetSprite(`${impactPrefix}-${impactFrames===8?'0':'a'}`,...impactBase,{depthTest:false,renderOrder:14});impact.position.copy(to);impact.visible=false;
      const seed=Number(e.id||0)+to.x*17.17+to.y*7.31+to.z*23.03,kindScale=mode==='swarm_gate'?({termite:.82,runner:.9,tank:1.08,boss:1.22}[e.targetKind]||.9):e.targetKind==='gold'?1.08:e.targetKind==='friendly'?.94:1;
      impact.material.rotation=clamp((seededUnit(seed+1)-.5)*.86,-.4,.4);this.scene.add(impact);const halo=mode==='peek_shoot'&&e.dead?this.killHalo(e.good===false?'#ff496c':e.targetKind==='gold'?'#fff27a':'#ffb13b'):null;if(halo){halo.position.copy(to);halo.visible=false;this.scene.add(halo);}
      this.effects.push({kind:'beam',eventId:e.id,from,to,color,born:this.clock,life:mode==='peek_shoot'&&e.dead?1.15:.64,hit:e.hit,dead:e.dead,good:e.good,projectile,trail,muzzle,impact,halo,impactPrefix,impactFrames,impactBase,impactScale:clamp(kindScale*(.9+seededUnit(seed)*.2),.76,1.28)});
    }else if(e.kind==='pulse'){
      const pulseSprite=this.assetSprite('turret-selection',1,1,{depthTest:false,renderOrder:11});pulseSprite.position.set(e.x,.25,e.z);pulseSprite.material.color.set('#b9ff67');pulseSprite.visible=false;this.scene.add(pulseSprite);this.effects.push({kind:'pulse',pulseSprite,color:'#b9ff67',born:this.clock,life:.78});
    }
    else if(e.kind==='roll'&&e.pins>=8&&!reduced)this.effects.push({kind:'celebrate',origin:new THREE.Vector3(0,.4,-10.5),color:e.pins===10?'#ffe568':'#c8ff73',born:this.clock,life:1.05});
    if(this.effects.length>120){const removed=this.effects.splice(0,this.effects.length-120);for(const old of removed)for(const sprite of [old.projectile,old.trail,old.muzzle,old.impact,old.halo,old.pulseSprite])if(sprite){this.scene.remove(sprite);sprite.material.dispose();}}
  }
  updateEffects(){
    const alive=[];for(const e of this.effects){if(this.clock-e.born<e.life)alive.push(e);else for(const sprite of [e.projectile,e.trail,e.muzzle,e.impact,e.halo,e.pulseSprite])if(sprite){this.scene.remove(sprite);sprite.material.dispose();}}this.effects=alive;let particles=0;
    for(const e of this.effects){const age=(this.clock-e.born)/e.life,color=new THREE.Color(e.color);
      if(e.kind==='beam'){
        const gallery=mode==='peek_shoot',direction=e.to.clone().sub(e.from),length=direction.length(),flightEnd=gallery?.23:.62,travel=Math.min(1,age/flightEnd),settle=Math.max(0,(age-flightEnd)/(1-flightEnd)),projectileFade=travel<.82?1:Math.max(0,(1-travel)/.18);direction.normalize();
        e.projectile.position.copy(e.from).lerp(e.to,travel);e.projectile.visible=projectileFade>.01;e.projectile.material.opacity=projectileFade;e.projectile.scale.set(gallery?1.65:1.05,gallery?2.3:1.75,1).multiplyScalar(.72+.28*Math.sin(Math.min(1,travel*4)*Math.PI/2));
        const grown=Math.min(gallery?.82:2.15,length*travel),trailLength=grown*Math.max(.04,1-settle),trailWidth=gallery?.5:1.18;e.trail.visible=travel>.05&&settle<.95;e.trail.position.copy(travel<1?e.projectile.position:e.to).addScaledVector(direction,-trailLength*.5);e.trail.scale.set(trailWidth,trailLength,1);e.trail.material.opacity=(gallery?.46:.64+(gallery?0:.18)*Math.sin(travel*Math.PI))*Math.pow(1-settle,1.55);
        const muzzleFrame=age<.13?'a':'b';e.muzzle.visible=age<.30;if(e.muzzle.userData.frame!==muzzleFrame){e.muzzle.userData.frame=muzzleFrame;e.muzzle.material.map=this.assetTexture(`muzzle-${muzzleFrame}`);e.muzzle.material.needsUpdate=true;}e.muzzle.material.opacity=Math.max(0,1-age/.30);
        const impactStart=flightEnd*.74,impactAge=clamp((age-impactStart)/(1-impactStart),0,1);e.impact.visible=age>=impactStart;const frame=e.impactFrames===8?Math.min(gallery?6:7,Math.floor(Math.min(.999,impactAge/(gallery?.82:1))*8)):(impactAge<.45?'a':'b'),frameName=`${e.impactPrefix}-${frame}`;
        if(e.impact.userData.frame!==frameName){e.impact.userData.frame=frameName;e.impact.material.map=this.assetTexture(frameName);e.impact.material.needsUpdate=true;}const impactFade=gallery?(impactAge<.76?1:Math.max(0,(1-impactAge)/.24)):Math.min(1,(1-age)/.18);e.impact.material.opacity=impactFade;e.impact.scale.set(e.impactBase[0],e.impactBase[1],1).multiplyScalar(e.impactScale*(.82+impactAge*(gallery?.34:.22)));
        if(e.halo){e.halo.visible=age>=impactStart;const haloScale=3.6+impactAge*6.5;e.halo.scale.set(haloScale,haloScale,1);e.halo.material.opacity=Math.min(1,1.15*Math.pow(1-impactAge,1.05));e.halo.material.rotation=impactAge*.62;}
        if(gallery&&e.dead&&age>=impactStart)for(let i=0;i<18&&particles<360;i++){const angle=i*Math.PI/9+(Number(e.eventId||0)%9)*.17,spread=(.5+(i%4)*.20)+impactAge*3.1;this.instance(this.particles,particles,e.to.x+Math.cos(angle)*spread,e.to.y+Math.sin(angle)*spread,e.to.z+.1,.07,.28,.05,0,0,angle+impactAge*5);this.particles.setColorAt(particles++,new THREE.Color(i%3===0?'#ffffff':i%3===1?e.color:'#ff9f43'));}
      }else if(e.kind==='pulse'){
        const diameter=1.5+age*12.5;e.pulseSprite.visible=true;e.pulseSprite.scale.set(diameter,diameter,1);e.pulseSprite.material.opacity=Math.pow(1-age,1.35);e.pulseSprite.material.rotation=age*.32;
      }else if(e.kind==='celebrate')for(let i=0;i<28&&particles<360;i++){const a=i*2.399,spread=(.6+i%5*.32)*age,x=e.origin.x+Math.cos(a)*spread,y=e.origin.y+Math.sin(age*Math.PI)*(2+i%4*.45),z=e.origin.z+Math.sin(a)*spread;this.instance(this.particles,particles,x,y,z,.08,.22,.04,age*9,a,age*12);this.particles.setColorAt(particles++,new THREE.Color(i%3===0?'#ff6f91':i%3===1?'#66e7f0':e.color));}
    }
    this.particles.count=particles;this.particles.instanceMatrix.needsUpdate=true;if(particles)this.particles.instanceColor.needsUpdate=true;
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
