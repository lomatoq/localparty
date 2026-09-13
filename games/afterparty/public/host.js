import * as THREE from './vendor/three.module.js';
const $=id=>document.getElementById(id);
const titles={curling:'Лёд & характер',bowling:'После страйка',gate_siege:'Последние ворота',pop_shots:'Ну, попались!'};
let state=null,mode=null,ws,reconnect,scene,camera,renderer,root,enemyBodies,enemyEyes,enemyLegs,sound=false,audio,lastSound=0,lastEffect=0;
const groups=new Map(),materials=new Map(),dummy=new THREE.Object3D(),v=new THREE.Vector3();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sphere=new THREE.SphereGeometry(1,16,12),box=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,18),legGeo=new THREE.CylinderGeometry(.035,.035,1,5);
const material=(color,roughness=.6)=>{const key=color+'/'+roughness;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness:roughness<.4?.25:0}));return materials.get(key);};
function mesh(geo,color,x,y,z,sx=1,sy=sx,sz=sx,group=root){const m=new THREE.Mesh(geo,material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
function boxAt(color,x,y,z,w,h,d,group=root){return mesh(box,color,x,y,z,w,h,d,group);}
function ballAt(color,x,y,z,r,group=root){return mesh(sphere,color,x,y,z,r,r,r,group);}
function ring(color,x,y,z,r,tube=.07,group=root){const m=new THREE.Mesh(new THREE.TorusGeometry(r,tube,8,64),material(color));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);group.add(m);return m;}
function setup(next){
  mode=next;$('ap-title').textContent=titles[mode];$('ap-frames').hidden=mode!=='bowling';
  scene=new THREE.Scene();scene.background=new THREE.Color('#0c151e');scene.fog=new THREE.Fog('#0c151e',65,125);
  const sports=['curling','bowling'].includes(mode);
  camera=new THREE.PerspectiveCamera(sports?43:48,innerWidth/innerHeight,.1,180);
  if(mode==='bowling'){camera.position.set(0,10,-11);camera.lookAt(0,0,14);}
  else if(mode==='curling'){camera.position.set(0,25,-7);camera.lookAt(0,0,15);}
  else{camera.position.set(0,mode==='gate_siege'?43:35,mode==='gate_siege'?26:25);camera.lookAt(0,0,mode==='gate_siege'?-11:0);}
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){$('ap-error').hidden=false;$('ap-error').textContent='Не удалось запустить WebGL. Включи аппаратное ускорение браузера. '+e.message;return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;$('ap-stage').append(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#c9efff','#333044',2.1));
  const sun=new THREE.DirectionalLight('#fff2d9',3.2);sun.position.set(-12,30,-5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-27;sun.shadow.camera.right=27;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-35;sun.shadow.camera.far=90;sun.shadow.normalBias=.04;scene.add(sun);scene.add(sun.target);
  root=new THREE.Group();scene.add(root);
  if(mode==='curling')buildCurl();else if(mode==='bowling')buildBowl();else if(mode==='gate_siege')buildGate();else buildGallery();
  resize();
}
function buildCurl(){
  boxAt('#263c53',0,-.45,15,8,.9,31);const ice=boxAt('#c3e8ea',0,.005,15,7,.02,30);ice.material=new THREE.MeshPhysicalMaterial({color:'#bddde3',roughness:.25,metalness:.08,clearcoat:1});
  boxAt('#78919e',-3.8,.45,15,.35,1.1,31);boxAt('#78919e',3.8,.45,15,.35,1.1,31);
  for(const z of [2,8,21])boxAt(z===8?'#d86c7b':'#6593ae',0,.025,z,7,.015,.06);
  for(const [r,color] of [[2.4,'#488ba7'],[1.6,'#f2e9d6'],[.8,'#da7c89']]){const circle=new THREE.Mesh(new THREE.CircleGeometry(r,64),material(color));circle.rotation.x=-Math.PI/2;circle.position.set(0,.035+(2.5-r)*.005,25);root.add(circle);}
  ring('#f0eee7',0,.06,25,.2,.035);
  for(let z=0;z<30;z+=3)for(const x of [-3.7,3.7])boxAt('#c8ff73',x,.9,z,.10,.10,1.8);
  $('ap-hint').textContent='Свайп — сила и направление · Загни конец свайпа для подкрутки · Команда удерживает щётку';
}
function buildBowl(){
  boxAt('#222b3b',0,-.6,14,9,.6,32);
  for(let i=0;i<18;i++)boxAt(i%3===0?'#c69b61':i%3===1?'#d2aa71':'#b58b55',-1.7+i*.2,-.05,13,.196,.10,28);
  for(const x of [-2.02,2.02]){boxAt('#283744',x,-.17,13,.44,.15,28);boxAt('#728f96',x*1.17,.18,13,.12,.55,28);boxAt('#c8ff73',x*1.17,.48,13,.045,.03,28);}
  for(let i=-3;i<=3;i++){const a=new THREE.Mesh(new THREE.ConeGeometry(.08,.18,3),material('#544c3e'));a.rotation.x=Math.PI/2;a.position.set(i*.34,.015,8+Math.abs(i)*.25);root.add(a);}
  boxAt('#182635',0,1.5,28,7,3.4,.7);boxAt('#be8bff',0,2.4,27.6,5,.07,.07);
  for(const x of [-4.5,4.5])for(let z=0;z<31;z+=4){boxAt('#202c42',x,2,z,.35,4,.35);boxAt('#a883cf',x,4,z,.5,.12,1.5);}
  $('ap-hint').textContent='Свайп вверх — бросок · Позиция и подкрутка на телефоне · Жёлоб не прощает · Страйки и спэры дают бонусы';
}
function buildGate(){
  boxAt('#344448',0,-.35,-12,45,.7,52);
  for(let i=0;i<28;i++){const x=((i*17)%41)-20,z=-3-((i*11)%33);boxAt('#465658',x,-.01,z,2,.03,.025);}
  for(const side of [-1,1]){boxAt('#61727b',side*11,1.8,0,16,3.6,1.25);boxAt('#8fa5aa',side*11,3.65,0,16,.18,1.5);for(let i=0;i<8;i++)boxAt('#495966',side*(4+i*2),4.1,0,1,1.1,1.4);}
  for(const x of [-3,3]){boxAt('#92a3a3',x,2,0,.7,4.5,2);boxAt('#c8ff73',x,3.2,-1.04,.12,.5,.1);}
  const gate=new THREE.Group();gate.name='gate';root.add(gate);boxAt('#8b6871',0,1.65,.08,5.4,3.3,.8,gate);for(let x=-2.4;x<2.6;x+=.48)boxAt('#bca397',x,1.65,-.37,.12,3.1,.12,gate);boxAt('#313e49',0,1.0,-.47,5.4,.30,.2,gate);
  boxAt('#c8ff73',0,4.0,0,6.5,.14,1.7);
  enemyBodies=new THREE.InstancedMesh(sphere,material('#8cbaa2'),600);enemyEyes=new THREE.InstancedMesh(sphere,new THREE.MeshBasicMaterial({color:'#eea9ff'}),600);enemyLegs=new THREE.InstancedMesh(legGeo,material('#3a242e'),1800);
  enemyBodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);enemyEyes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);enemyLegs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);enemyBodies.frustumCulled=enemyEyes.frustumCulled=enemyLegs.frustumCulled=false;
  scene.add(enemyBodies,enemyEyes,enemyLegs);enemyBodies.count=enemyEyes.count=enemyLegs.count=0;
  $('ap-hint').textContent='Прицел и огонь — на телефоне · Удерживай огонь, следи за нагревом · Починка возвращает 8 HP воротам';
}
function buildGallery(){
  boxAt('#596b62',0,-.5,0,45,1,34);
  for(let x=-21;x<22;x+=3)for(let z=-15;z<16;z+=3)boxAt((x+z)%2?'#64786b':'#5d7065',x,.005,z,2.92,.012,2.92);
  for(let i=0;i<15;i++){
    const x=-15+(i%5)*7.5,z=-9+Math.floor(i/5)*8,h=1.4+(i%3)*.3,color=['#8b799f','#c29867','#69989b'][i%3];
    boxAt(color,x,h/2,z,3.4,h,3);boxAt('#dec7a3',x,h+.05,z,3.55,.12,3.15);boxAt('#4a5261',x,h*.45,z+1.52,2.4,.18,.1);
    if(i%2===0){const pipe=mesh(cylinder,'#789393',x-.8,h+.45,z,.4,.8,.4);pipe.rotation.z=.1;}
    else{boxAt('#c8ff73',x+.7,h+.25,z,.8,.4,.8);}
  }
  for(const side of [-1,1])boxAt('#293e43',side*22,1,0,.35,2,35);
  $('ap-hint').textContent='Попадай в смешных беглецов · 5 попаданий подряд = пулемёт · Активируй вручную на 5 секунд · Жёлтый курьер: −3';
}
function makeStone(s){const g=new THREE.Group(),color=s.team===0?'#d990a5':'#75c3df';mesh(cylinder,'#52636e',0,.19,0,.32,.35,.32,g);mesh(cylinder,color,0,.39,0,.27,.06,.27,g);const handle=ring(color,0,.48,0,.15,.05,g);handle.rotation.x=0;scene.add(g);return g;}
const pinGeometry=new THREE.LatheGeometry([[.06,0],[.13,.07],[.155,.2],[.15,.4],[.105,.58],[.06,.72],[.065,.82],[.10,.91],[.085,1.01],[.02,1.05]].map(([r,y])=>new THREE.Vector2(r,y-.51)),24);
function makePin(){const g=new THREE.Group();const pin=new THREE.Mesh(pinGeometry,material('#f5edda',.25));pin.castShadow=true;g.add(pin);ring('#dd708a',0,.23,0,.066,.014,g);ring('#dd708a',0,.29,0,.069,.013,g);scene.add(g);return g;}
function makeBall(color){const g=new THREE.Group(),m=ballAt(color,0,0,0,.23,g);m.material=material(color,.22);for(const [x,z] of [[-.04,.02],[.035,.025],[0,-.05]])ballAt('#202029',x,.222,z,.023,g);scene.add(g);return g;}
function makeTarget(e){
  const g=new THREE.Group(),color=e.friendly?'#ffe580':['#be8bff','#e596aa','#83c9b6','#91badf'][e.kind];
  ballAt(color,0,.68,0,.65,g);ballAt('#f4efe4',-.22,.98,.51,.18,g);ballAt('#f4efe4',.22,.98,.51,.18,g);ballAt('#20222d',-.22,1.01,.66,.075,g);ballAt('#20222d',.22,1.01,.66,.075,g);
  const mouth=mesh(cylinder,'#443041',0,.63,.60,.2,.09,.1,g);mouth.rotation.x=Math.PI/2;
  for(const x of [-.23,.23])boxAt('#303f4a',x,.12,.14,.27,.20,.44,g);
  if(e.kind===1){mesh(cylinder,'#c8ff73',0,1.36,0,.64,.09,.64,g);mesh(cylinder,'#c8ff73',0,1.58,0,.39,.38,.39,g);}
  if(e.kind===2)for(const x of [-.30,.30])mesh(cylinder,color,x,1.48,0,.13,.75,.13,g);
  if(e.kind===3)boxAt('#ffd781',0,.86,.65,.50,.20,.3,g);
  if(e.friendly){boxAt('#f4e7bf',.7,.65,0,.6,.8,.5,g);ring('#fff4b0',0,1.58,0,.28,.07,g);}
  scene.add(g);return g;
}
function makeTurret(p){const g=new THREE.Group();boxAt('#6f8890',0,.65,3,1.3,1.3,1.6,g);mesh(cylinder,'#b4c3bf',0,1.43,3,.73,.24,.73,g);const top=new THREE.Group();top.name='gun';top.position.set(0,1.8,3);g.add(top);ballAt(p.color,0,0,0,.45,top);boxAt('#283341',0,0,-.6,.26,.26,1.3,top);boxAt(p.color,0,0,-1.15,.35,.32,.18,top);g.position.x=p.towerX;scene.add(g);return g;}
function syncObjects(items,prefix,create,update){const seen=new Set();for(const item of items||[]){const key=prefix+item.id;seen.add(key);let g=groups.get(key);if(!g){g=create(item);g.userData.fresh=true;groups.set(key,g);}update(g,item);g.userData.fresh=false;}for(const [key,g] of groups)if(key.startsWith(prefix)&&!seen.has(key)){scene.remove(g);groups.delete(key);}}
function pose(g,p,q,mirror=false){v.set(mirror?-p.x:p.x,p.y,p.z);g.position.lerp(v,g.userData.fresh?1:.45);if(q){const target=new THREE.Quaternion(q.x,mirror?-q.y:q.y,mirror?-q.z:q.z,q.w);g.quaternion.slerp(target,g.userData.fresh?1:.45);}}
function enemies(t){
  const entities=state.entities||[];let b=0,e=0,l=0;
  for(const ent of entities){const x=ent.x,z=ent.z,scale=ent.elite?1.45:1,hop=reduced?0:Math.sin(t*15+ent.seed)*.04;
    for(const [dz,sx,sy,sz] of [[0,.42,.34,.65],[-.62,.31,.27,.36]]){dummy.position.set(x,.45+hop,z+dz);dummy.scale.set(sx*scale,sy*scale,sz*scale);dummy.rotation.set(0,0,0);dummy.updateMatrix();enemyBodies.setMatrixAt(b,dummy.matrix);enemyBodies.setColorAt(b++,new THREE.Color(ent.flash>state.time?'#ffffff':ent.elite?'#d5a16f':'#94b7a4'));}
    for(const side of [-1,1]){dummy.position.set(x+side*.16*scale,.67+hop,z+.38*scale);dummy.scale.setScalar(.095*scale);dummy.rotation.set(0,0,0);dummy.updateMatrix();enemyEyes.setMatrixAt(e++,dummy.matrix);}
    for(let i=0;i<6;i++){const side=i%2?1:-1,wave=reduced?0:Math.sin(t*15+i+ent.seed)*.35;dummy.position.set(x+side*.45*scale,.20,z+((i>>1)-1)*.35);dummy.scale.set(1,.72*scale,1);dummy.rotation.set(wave,0,side*.9);dummy.updateMatrix();enemyLegs.setMatrixAt(l++,dummy.matrix);}
  }
  enemyBodies.count=b;enemyEyes.count=e;enemyLegs.count=l;enemyBodies.instanceMatrix.needsUpdate=enemyEyes.instanceMatrix.needsUpdate=enemyLegs.instanceMatrix.needsUpdate=true;if(enemyBodies.instanceColor)enemyBodies.instanceColor.needsUpdate=true;
}
function tick(ms){requestAnimationFrame(tick);if(!renderer||!state)return;const t=ms/1000;
  if(mode==='curling')syncObjects(state.stones,'stone',makeStone,(g,s)=>{pose(g,{x:s.x,y:0,z:s.z},null,true);if(!reduced)g.rotation.y+=Math.hypot(s.vx,s.vz)*.01;});
  if(mode==='bowling'){
    syncObjects(state.pins,'pin',makePin,(g,p)=>pose(g,p.p,p.q,true));syncObjects(state.ball?[{id:0,...state.ball}]:[],'ball',()=>makeBall(state.players.find(p=>p.id===state.currentId)?.color||'#be8bff'),(g,b)=>pose(g,b.p,b.q,true));
    const z=state.ball?.p.z||2;camera.position.lerp(new THREE.Vector3(0,8.5,Math.min(7,-10+z*.38)),.025);camera.lookAt(0,0,14+Math.min(7,z*.18));
  }
  if(mode==='gate_siege'){
    enemies(t);syncObjects(state.players.filter(p=>Number.isFinite(p.towerX)),'turret',makeTurret,(g,p)=>{g.position.x=p.towerX;g.getObjectByName('gun').rotation.y=Math.atan2(p.aim.x-p.towerX,-(p.aim.z-3));});
    const gate=root.getObjectByName('gate');gate.position.x=state.hp<state.maxHp*.25&&!reduced?Math.sin(t*22)*.045:0;
  }
  if(mode==='pop_shots')syncObjects(state.entities,'target',makeTarget,(g,e)=>{pose(g,{x:e.x,y:reduced?0:Math.abs(Math.sin(t*8+e.seed))*.1,z:e.z});g.visible=e.visible;g.rotation.z=reduced?0:Math.sin(t*5+e.seed)*.12;});
  renderer.render(scene,camera);drawOverlay();
}
function project(x,y,z){return new THREE.Vector3(x,y,z).project(camera);}
function drawOverlay(){const c=$('ap-overlay'),ctx=c.getContext('2d'),w=innerWidth,h=innerHeight;ctx.clearRect(0,0,w,h);
  if(['gate_siege','pop_shots'].includes(mode)){
    for(const p of state.players){if(!p.aim)continue;const v=project(p.aim.x,1,p.aim.z),x=(v.x+1)*w/2,y=(1-v.y)*h/2;ctx.strokeStyle=p.color;ctx.fillStyle=p.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);for(const [dx,dy] of [[-20,0],[20,0],[0,-20],[0,20]]){ctx.moveTo(x+dx*.75,y+dy*.75);ctx.lineTo(x+dx,y+dy);}ctx.stroke();ctx.font='600 11px Rubik, sans-serif';ctx.textAlign='center';ctx.fillText(p.name,x,y-25);}
    for(const e of state.effects||[]){const p=state.players.find(p=>p.id===e.owner),v=project(e.x,1,e.z),x=(v.x+1)*w/2,y=(1-v.y)*h/2;ctx.strokeStyle=p?.color||'#fff';ctx.lineWidth=e.hit?3:1;ctx.beginPath();ctx.arc(x,y,e.hit?23:9,0,Math.PI*2);ctx.stroke();
      if(mode==='gate_siege'){const a=project(e.fromX,1.8,1.7);ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo((a.x+1)*w/2,(1-a.y)*h/2);ctx.lineTo(x,y);ctx.stroke();ctx.globalAlpha=1;}
      if(e.id>lastEffect){lastEffect=e.id;if(e.hit)beep(mode==='bowling'?110:240,.045);}
    }
  }
}
function beep(freq,duration){if(!sound||!audio||audio.state!=='running'||performance.now()-lastSound<70)return;lastSound=performance.now();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='triangle';osc.frequency.setValueAtTime(freq,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*.45,audio.currentTime+duration);gain.gain.setValueAtTime(.10,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);}
function node(tag,text,className){const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;}
let lastScores='',lastPhase='';
function hud(){
  const waiting=state.phase==='waiting',result=state.phase==='results',current=state.players.find(p=>p.id===state.currentId);
  $('start').hidden=!waiting;$('start').disabled=state.players.filter(p=>p.connected).length<2;$('ap-frames').disabled=!waiting;$('ap-again').hidden=!result;
  $('ap-status').textContent=waiting?'Игроки нажимают «Я готов» на телефонах':result?'Партия завершена':mode==='gate_siege'?`ВОЛНА ${state.wave} / 8 · Ещё ${state.remaining}`:mode==='pop_shots'?`Ещё ${Math.max(0,Math.ceil(state.deadline-state.time))} с`:mode==='curling'?`ЭНД ${state.end} / 3 · ${state.teamScore?.join(' : ')} · ${current?.name||'Считаем камни'}`:`${current?.name||''} · ${state.state==='rolling'?'Смотрим бросок!':'Твой выход'}`;
  $('ap-subtitle').textContent=state.message||'';$('ap-health').hidden=mode!=='gate_siege'||waiting;
  if(mode==='gate_siege'){$('ap-health-label').textContent=`ВОРОТА · ${Math.ceil(state.hp||0)} / ${state.maxHp||240}`;$('ap-health').querySelector('i').style.width=`${100*(state.hp||0)/(state.maxHp||240)}%`;}
  $('ap-toast').textContent=(state.events||[]).slice(-3).map(e=>e.text).join('\n');
  const signature=JSON.stringify(state.players.map(p=>[p.id,p.score,p.connected,p.card,p.ready,Math.ceil(Math.max(0,(p.boostUntil||0)-state.time))]).concat(state.currentId));
  if(signature!==lastScores){lastScores=signature;$('ap-scores').replaceChildren(...state.players.map(p=>{const row=node('section','',`ap-score${state.currentId===p.id?' current':''}`);row.style.setProperty('--player',p.color);const top=node('div','');top.append(node('b',p.name),node('strong',String(p.score||0)));row.append(top);
      let hint=!p.connected?'Восстанавливает связь':mode==='curling'?['Розовая команда','Голубая команда'][p.team]:`${p.hits||0} попаданий`;
      if(p.boostUntil>state.time)hint=`ПУЛЕМЁТ · ${(p.boostUntil-state.time).toFixed(1)} с`;else if(p.ready)hint='ПУЛЕМЁТ ГОТОВ';
      if(mode==='bowling'&&p.card){const frames=node('div','','ap-frames');for(const [i,f] of p.card.entries()){const rolls=f.rolls.map((n,j)=>n===10?'X':j===1&&f.rolls[0]+n===10?'/':n===0?'—':n).join(' ');const cell=node('span',rolls||'·');cell.title=`Фрейм ${i+1}: ${f.total??'ждём бонус'}`;frames.append(cell);}row.append(frames);hint='Фреймы: X — страйк, / — спэр';}
      row.append(node('small',hint));return row;}));}
  $('ap-result').hidden=!result;if(result){$('ap-result').querySelector('h2').textContent=state.result.title;$('ap-result').querySelector('p').textContent='Победители: '+(state.players.filter(p=>state.result.winners.includes(p.id)).map(p=>p.name).join(', ')||'В этот раз — термиты. Реванш?');}
  if(lastPhase!==state.phase&&state.phase==='results')beep(600,.25);lastPhase=state.phase;
}
function send(type,data={}){if(ws?.readyState===1)ws.send(JSON.stringify({type,data}));}
function connect(){clearTimeout(reconnect);const socket=ws=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws`);socket.onopen=()=>send('host');socket.onmessage=e=>{if(ws!==socket)return;const m=JSON.parse(e.data);if(m.type==='state'){state=m.data;if(!mode)setup(state.mode);hud();}if(m.type==='error'){$('ap-error').textContent=m.data;$('ap-error').hidden=false;}};socket.onclose=()=>{if(ws===socket){$('ap-status').textContent='Восстанавливаем связь…';reconnect=setTimeout(connect,800);}};socket.onerror=()=>{};}
$('start').onclick=()=>{audio?.resume();send('start',{frames:Number($('ap-frames').value)});};$('ap-again').onclick=()=>{lastScores='';send('reset');};
$('ap-sound').onclick=async()=>{sound=!sound;if(sound){audio||=new AudioContext();await audio.resume();beep(400,.1);}$('ap-sound').textContent=sound?'Звук вкл.':'Звук выкл.';};
function resize(){if(!renderer)return;renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();const c=$('ap-overlay'),d=Math.min(devicePixelRatio,2);c.width=innerWidth*d;c.height=innerHeight*d;c.getContext('2d').setTransform(d,0,0,d,0,0);}
window.addEventListener('resize',resize);connect();requestAnimationFrame(tick);
