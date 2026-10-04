'use strict';
const $=s=>document.querySelector(s),host=document.body.dataset.role==='host';const releases=[];let ws,state=null,reconnectTimer,me={id:localStorage.getItem('crane_id'),token:localStorage.getItem('crane_token'),name:localStorage.getItem('crane_name')||''},left=false,right=false,dropPending=false,lastTurn='',camera=0;
const canvas=$('#scene'),ctx=canvas.getContext('2d'),notice=text=>{if($('#notice'))$('#notice').textContent=text;};
const copyValues=new WeakMap();
function setCopy(selector,value){const node=$(selector),text=String(value??'');if(node&&copyValues.get(node)!==text){copyValues.set(node,text);node.textContent=text;}}
function feedbackCopy(message){const match=String(message??'').match(/^Идеально! \+(\d+)$/);return match?(window.PartyI18n?.t?.('Идеально! +150')||'Идеально! +150').replace(/\+150$/, '+'+match[1]):message;}
function send(o){if(o.type==='join'||o.type==='resume')Object.assign(o,{partyId:window.PARTY_PROFILE?.id,partyToken:window.PARTY_PROFILE?.token});if(ws?.readyState===1)ws.send(JSON.stringify(o));}
function join(){send({type:'join',id:me.id,token:me.token,name:window.PARTY_PROFILE?.name||$('#name')?.value||me.name});}

const sceneSnapshots=[];
function recordScene(value){recordCraneImpacts(value);const time=performance.now();if(sceneSnapshots.at(-1)?.value.roundId!==value.roundId)sceneSnapshots.length=0;sceneSnapshots.push({time,value});while(sceneSnapshots.length>8)sceneSnapshots.shift();}
// Presentation-only impacts follow authoritative placement/miss counters, never predict a hit.
const craneImpacts=[];let impactState=null,impactRecoil=0,landedSquash=null;
function recordCraneImpacts(next){
 if(impactState?.roundId===next.roundId){
  const placed=next.players.reduce((n,p)=>n+p.placed,0),oldPlaced=impactState.players.reduce((n,p)=>n+p.placed,0);
  const misses=next.players.reduce((n,p)=>n+p.misses,0),oldMisses=impactState.players.reduce((n,p)=>n+p.misses,0);
  if(placed>oldPlaced||misses>oldMisses){const miss=misses>oldMisses,b=miss?impactState.falling:next.blocks.at(-1);if(b){
   const perfect=!miss&&next.players.some(p=>p.perfects>(impactState.players.find(q=>q.id===p.id)?.perfects||0));
   const gain=next.players.reduce((n,p)=>n+p.score,0)-impactState.players.reduce((n,p)=>n+p.score,0);
   craneImpacts.push({x:b.x,y:miss?(next.floor||780):b.y+b.h*.5,top:miss?(next.floor||780)-60:b.y-b.h*.5,age:0,miss,perfect,gain,color:b.color||'#caff78'});if(!miss)landedSquash={x:b.x,y:b.y+b.h*.5,age:0,perfect};if(craneImpacts.length>8)craneImpacts.shift();impactRecoil=miss?5:perfect?3:2;
  }}
 }else{craneImpacts.length=0;impactRecoil=0;}
 impactState=next;
}
function drawCraneImpacts(dt){
 for(let i=craneImpacts.length-1;i>=0;i--){const e=craneImpacts[i];e.age+=dt;if(e.age>1.05){craneImpacts.splice(i,1);continue;}const t=e.age,k=1-t/1.05;ctx.save();
  ctx.globalAlpha=k*.75;ctx.strokeStyle=e.perfect?'#dfff94':e.miss?'#ffb497':e.color;ctx.lineWidth=3*k;ctx.beginPath();ctx.ellipse(e.x,e.y,18+150*(1-Math.exp(-t*5)),5+24*(1-Math.exp(-t*5)),0,0,Math.PI*2);ctx.stroke();
  for(let j=0;j<18;j++){const a=j*2.39996,speed=45+(j%5)*23,px=e.x+Math.cos(a)*speed*t,py=e.y-Math.abs(Math.sin(a))*95*t+65*t*t;ctx.globalAlpha=k*(e.miss?.28:.2);ctx.fillStyle=e.miss?'#e2c3a6':'#e7efcf';ctx.beginPath();ctx.ellipse(px,py,5+t*18,3+t*8,0,0,Math.PI*2);ctx.fill();if(j%3===0){ctx.globalAlpha=k*.85;ctx.fillStyle=e.color;ctx.fillRect(px,py,3+k*3,3+k*2);}}
  // Score callout: rises and settles above the landing point; PERFECT reads larger than a plain place.
  const label=e.miss?'MISS':e.perfect?'PERFECT!':e.gain>0?'+'+e.gain:'';if(label){const rise=1-Math.exp(-t*7),pop=t<.12?.86+t/.12*.24:1.1-Math.min(.1,(t-.12)*.5);ctx.save();ctx.globalAlpha=Math.min(1,k*1.6);ctx.translate(e.x,e.top-36-rise*70);ctx.scale(pop,pop);ctx.font=`800 ${e.perfect?72:e.miss?54:60}px KardiaFatRunner, PartyRubik, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=12;ctx.strokeStyle='#120f22d9';ctx.strokeText(label,0,0);ctx.fillStyle=e.miss?'#ff9c86':e.perfect?'#dfff94':'#ffffff';ctx.fillText(label,0,0);if(e.perfect&&e.gain>0){ctx.font='800 38px KardiaFatRunner, PartyRubik, sans-serif';ctx.lineWidth=9;ctx.strokeText('+'+e.gain,0,58);ctx.fillStyle='#ffffff';ctx.fillText('+'+e.gain,0,58);}ctx.restore();}
  ctx.restore();
 }
}
// Night-site life: aviation beacons blink on the mast head and boom tip; a warm work light hangs from the trolley.
function drawCraneLights(beamY,trolley,hookY,playing){const blink=craneReduce.matches?1:Math.max(0,Math.sin(craneFxTime*2.6)),soft=.35+blink*.65;ctx.save();ctx.globalCompositeOperation='lighter';for(const [x,y] of [[114,beamY-70],[1000,beamY-40]]){const g=ctx.createRadialGradient(x,y,0,x,y,26);g.addColorStop(0,`rgba(255,90,90,${.75*soft})`);g.addColorStop(1,'rgba(255,60,60,0)');ctx.fillStyle=g;ctx.fillRect(x-26,y-26,52,52);ctx.fillStyle=`rgba(255,200,200,${soft})`;ctx.beginPath();ctx.arc(x,y,2.6,0,Math.PI*2);ctx.fill();}
 if(playing){const y0=beamY+20,y1=Math.max(y0+60,hookY+70),spread=56+(y1-y0)*.18,g=ctx.createLinearGradient(0,y0,0,y1);g.addColorStop(0,'rgba(255,214,140,.16)');g.addColorStop(1,'rgba(255,214,140,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(trolley-8,y0);ctx.lineTo(trolley+8,y0);ctx.lineTo(trolley+spread,y1);ctx.lineTo(trolley-spread,y1);ctx.closePath();ctx.fill();}
 ctx.restore();}
function sceneAt(now){if(sceneSnapshots.length<2)return state;const target=now-40;let a=sceneSnapshots[0],b=sceneSnapshots.at(-1);for(let i=1;i<sceneSnapshots.length;i++){if(sceneSnapshots[i].time>=target){a=sceneSnapshots[i-1];b=sceneSnapshots[i];break;}}if(a.value.roundId!==b.value.roundId||a.value.phase!==b.value.phase)return b.value;const t=Math.max(0,Math.min(1,(target-a.time)/Math.max(1,b.time-a.time))),mix=(x,y)=>x+(y-x)*t;const pose=(x,y)=>!x||!y?y:{...y,x:mix(x.x,y.x),y:mix(x.y,y.y),angle:x.angle+Math.atan2(Math.sin(y.angle-x.angle),Math.cos(y.angle-x.angle))*t};return {...b.value,trolley:mix(a.value.trolley,b.value.trolley),hookX:mix(a.value.hookX,b.value.hookX),hookY:mix(a.value.hookY,b.value.hookY),hookAngle:mix(a.value.hookAngle||0,b.value.hookAngle||0),hookAttachmentX:mix(a.value.hookAttachmentX,b.value.hookAttachmentX),hookAttachmentY:mix(a.value.hookAttachmentY,b.value.hookAttachmentY),topY:mix(a.value.topY,b.value.topY),beamY:mix(a.value.beamY,b.value.beamY),blocks:b.value.blocks.map((v,i)=>pose(a.value.blocks[i],v)),falling:pose(a.value.falling,b.value.falling)};}

function connect(){ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws${host?'?role=host':''}`);ws.onopen=()=>{notice('');if(!host&&(window.PARTY_PROFILE||me.id))join();};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='state'){if(host)recordScene(m);state=m;render();}else if(m.type==='joined'){Object.assign(me,m);for(const k of ['id','token','name'])localStorage.setItem('crane_'+k,me[k]);$('#join').hidden=true;$('#controller').hidden=false;$('#me').textContent=me.name;render();}else if(m.type==='error')notice(m.message);};ws.onclose=e=>{release();if(e.code===4001)return notice('Ты подключился в другой вкладке');notice('Восстанавливаем связь…');clearTimeout(reconnectTimer);reconnectTimer=setTimeout(connect,700);};}
function release(){left=right=false;releases.forEach(fn=>fn());document.querySelectorAll('.held').forEach(e=>e.classList.remove('held'));send({type:'input',left:false,right:false,turnId:state?.turnId});}
function bindHold(id,key){const el=$(id);let pointer=null;releases.push(()=>pointer=null);el.onpointerdown=e=>{e.preventDefault();if(pointer!==null||el.disabled)return;pointer=e.pointerId;el.setPointerCapture(pointer);if(key==='left')left=true;else right=true;el.classList.add('held');send({type:'input',left,right,turnId:state?.turnId});};const up=e=>{if(pointer!==e.pointerId)return;pointer=null;if(key==='left')left=false;else right=false;el.classList.remove('held');send({type:'input',left,right,turnId:state?.turnId});};for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,up);}
if(host){$('#start').onclick=()=>send({type:'start'});$('#reset').onclick=()=>send({type:'reset'});fetch('/api/info').then(r=>r.json()).then(d=>$('#joinUrl').textContent=d.joinUrl);}else{$('#name').value=window.PARTY_PROFILE?.name||me.name;$('#joinButton').onclick=join;bindHold('#left','left');bindHold('#right','right');$('#drop').onpointerdown=e=>{e.preventDefault();if($('#drop').disabled||dropPending)return;dropPending=true;send({type:'drop',turnId:state?.turnId});navigator.vibrate?.(20);};setInterval(()=>{if(state?.activeId===me.id)send({type:'input',left,right,turnId:state.turnId});},90);}
window.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();else if(ws?.readyState!==1)connect();});
function render(){if(!state)return;if(lastTurn!==state.turnId){lastTurn=state.turnId;dropPending=false;release();}setCopy('#height',state.heightRecord);setCopy('#lives',host?'● '.repeat(state.lives).trim():state.lives);setCopy('#message',host&&state.phase==='playing'&&state.turnStage==='aiming'?'Твой блок':feedbackCopy(state.message));setCopy('#active',host&&state.phase==='playing'?state.activeName:state.phase==='lobby'?'Собираем бригаду':state.phase==='results'?'Смена окончена':state.phase==='collapsing'?'Осторожно!':state.activeId===me.id?'Твой ход!':`${state.activeName||'—'} у крана`);setCopy('#progress',state.phase==='lobby'?'2–16 игроков · поздний вход разрешён':state.phase==='results'?'Итог: этажей '+state.height+' · ходов '+state.turns:`Ход ${state.turns+1} · башня ${state.height} этажей · строим до обрушения`);
if(host){if(!document.querySelector('.crane-columns')){const labels=document.createElement('div');labels.className='crane-columns';labels.innerHTML='<span>Очки</span>';document.querySelector('.scores h2').after(labels);}$('#count').textContent=state.players.filter(p=>p.connected).length+'/16';$('#joinPanel').hidden=state.phase!=='lobby'&&state.phase!=='results';$('#start').disabled=state.players.filter(p=>p.connected).length<2;$('#start').textContent=state.phase==='results'?'Ещё одна смена':'Начать стройку';renderPlayers();}else{const p=state.players.find(p=>p.id===me.id);$('#myScore').textContent=p?.score||0;const enabled=state.phase==='playing'&&state.activeId===me.id&&!state.falling&&state.turnStage==='aiming';for(const id of ['left','right','drop'])$('#'+id).disabled=!enabled||id==='drop'&&dropPending;setCopy('.phone-hint',enabled?'Hold to move. Tap Drop when aligned.':state.activeId===me.id?'Watch the landing.':'Your controls unlock on your turn.');}}
let rankingRenderKey='',crewEndAnchor=null;
// Keep an already-reached crew end visible as the live cap changes height.
function watchCrewEnd(list){
 let pinned=false,knownMax=Math.max(0,list.scrollHeight-list.clientHeight),frame=0,endTop=-1,priorEndTop=-1;
 const max=()=>Math.max(0,list.scrollHeight-list.clientHeight);
 const atEnd=()=>max()-list.scrollTop<=2;
 const rememberEnd=()=>{if(Math.abs(list.scrollTop-endTop)>1){priorEndTop=endTop;endTop=list.scrollTop;}};
 const restore=()=>{if(pinned){list.scrollTop=list.scrollHeight;rememberEnd();}knownMax=max();};
 const settle=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{restore();frame=requestAnimationFrame(restore);});};
 list.addEventListener('scroll',()=>{const nextMax=max();if(atEnd()){pinned=true;rememberEnd();}else if(pinned&&(Math.abs(nextMax-knownMax)>=1||Math.abs(list.scrollTop-endTop)<=1||Math.abs(list.scrollTop-priorEndTop)<=1))settle();else pinned=false;knownMax=nextMax;},{passive:true});
 const manual=()=>{pinned=false;cancelAnimationFrame(frame);};
 for(const type of ['wheel','pointerdown','touchstart','keydown'])list.addEventListener(type,manual,{passive:true});
 const observer=new ResizeObserver(()=>{restore();});observer.observe(list);
 return{remember(){if(list.children.length&&max()>0&&atEnd())pinned=true;},restore(){restore();if(pinned)settle();}};
}
function renderPlayers(){const key=JSON.stringify([state.activeId,state.players.map(p=>[p.id,p.name,p.color,p.score,p.placed,p.perfects,p.misses,p.connected])]);if(key===rankingRenderKey)return;rankingRenderKey=key;const list=$('#players');crewEndAnchor??=watchCrewEnd(list);crewEndAnchor.remember();const existing=new Map([...list.children].map(e=>[e.dataset.id,e])),tops=new Map([...list.children].map(e=>[e.dataset.id,e.offsetTop]));const ranked=[...state.players].sort((a,b)=>b.score-a.score);ranked.forEach((p,i)=>{let row=existing.get(p.id);if(!row){row=document.createElement('div');row.dataset.id=p.id;row.innerHTML='<span class="rank"></span><img class="avatar" alt=""><div class="details"><strong></strong><small></small></div><b class="score"></b>';}row.classList.add('player');row.classList.toggle('turn',p.id===state.activeId);row.querySelector('.rank').textContent=String(ranked.findIndex(q=>q.score===p.score)+1).padStart(2,'0');const portrait=row.querySelector('.avatar'),profile=(window.PARTY_ROSTER||[]).find(q=>q.id===p.id)||p;let seed=0;for(const c of String(p.id||p.name))seed=(seed*31+c.charCodeAt(0))>>>0;const src=profile.avatar||'/assets/avatars/atlas-mascots/mascot-'+String(seed%16+1).padStart(2,'0')+'.webp';if(portrait.getAttribute('src')!==src)portrait.src=src;portrait.classList.toggle('has-photo',!!profile.avatar);row.querySelector('strong').textContent=p.name+(p.connected?'':' · офлайн');row.querySelector('small').textContent=`${p.placed} блоков · ${p.perfects} точно · ${p.misses} мимо`;row.querySelector('.score').textContent=p.score;list.appendChild(row);existing.delete(p.id);});for(const row of existing.values())row.remove();for(const row of list.children){const old=tops.get(row.dataset.id),dy=old===undefined?25:old-row.offsetTop;if(dy&&!matchMedia('(prefers-reduced-motion: reduce)').matches){row._craneReorderAnimation?.cancel();row._craneReorderAnimation=row.animate([{transform:'translateY(4px)',opacity:old===undefined?0:.55},{transform:'translateY(0)',opacity:1}],{duration:180,easing:'cubic-bezier(.2,.8,.2,1)'});}}crewEndAnchor.restore();}
setInterval(()=>{if(state)$('#timer').textContent=state.phase==='playing'&&state.turnStage==='aiming'?Math.max(0,Math.ceil((state.deadline-Date.now())/1000)):'—';},150);
function roundRect(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
const siteArt={};for(const key of ['foundation','head','footing','counterweight']){const image=new Image();image.src='/assets/gameplay/crane-'+key+'.webp';siteArt[key]=image;}
function site(key,x,y,w,h){const image=siteArt[key];if(!image.complete||!image.naturalWidth)return false;ctx.drawImage(image,x-w/2,y,w,h);return true;}
function block(b,suspended=false){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle||0);const variant=[...' '+(b.owner||'')].reduce((n,c)=>n+c.charCodeAt(0),0)%3;const art=window.PartyArt?.sprite(['facade-floor-a','facade-floor-b','facade-floor-c'][variant],b.color);ctx.shadowColor='#0005';ctx.shadowBlur=5;if(art){const trim=art.h*.15;ctx.drawImage(art.image,art.x,art.y+trim,art.w,art.h-trim*2,-b.w/2,-b.h/2,b.w,b.h);}else roundRect(-b.w/2,-b.h/2,b.w,b.h,2,b.color);ctx.shadowBlur=0;ctx.fillStyle='#dbe3ce';ctx.fillRect(-b.w/2,-b.h/2,b.w,3);ctx.fillStyle='#101e2c55';ctx.fillRect(-b.w/2,b.h/2-2,b.w,2);if(suspended){ctx.strokeStyle='#bbcbd1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-b.w*.3,-b.h*.5);ctx.lineTo(0,-b.h*.5-20);ctx.lineTo(b.w*.3,-b.h*.5);ctx.stroke();}ctx.restore();}
// All rig endpoints share one geometry, including the rotated bridle apex.
function craneRigGeometry(scene){
 const h=scene.blockHeight||110,a=(scene.hookAngle||0)*.6;
 const apex={x:scene.hookX+Math.sin(a)*(h*.5+20),y:scene.hookY-Math.cos(a)*(h*.5+20)};
 const anchor={x:scene.trolley,y:scene.beamY+38},dx=anchor.x-apex.x,dy=anchor.y-apex.y,n=Math.max(1,Math.hypot(dx,dy));
 return{apex,anchor,cableEnd:{x:apex.x+dx/n*38,y:apex.y+dy/n*38},hookCenter:{x:apex.x+dx/n*18,y:apex.y+dy/n*18},angle:Math.atan2(dx/n,-dy/n),loadAngle:a,ropeLength:n};
}
const cityArtwork=new Image();cityArtwork.src='/assets/gameplay/crane-city-minimal-20261003-v1.png';let craneFrameTime=performance.now(),craneFxTime=0,craneZoom=.92;
const craneReduce=matchMedia('(prefers-reduced-motion: reduce)');
function drawCraneSky(scene){
 const altitude=Math.max(0,scene.height-4),space=Math.min(1,altitude/10);
 const stage=document.querySelector('.stage');stage.style.setProperty('--crane-space-top',String(space*.94));stage.style.setProperty('--crane-space-bottom',String(space*.68));
 if(altitude){ctx.save();ctx.fillStyle='#eaf1ff';for(let i=0;i<64;i++){const x=(i*137.53+41)%1100,y=((i*79.37+19)+(craneReduce.matches?0:camera*.08))%850;ctx.globalAlpha=space*(.2+(i%5)*.09);ctx.beginPath();ctx.arc(x,y,i%9===0?1.6:.85,0,Math.PI*2);ctx.fill();}ctx.restore();}
}
function draw(now=performance.now()){
 if(!host)return;requestAnimationFrame(draw);const rect=canvas.getBoundingClientRect(),actorWidth=Math.max(1,rect.width-384);window.PartyArt?.beginFrame(ctx,rect.width,rect.height);
 const dt=window.PARTY_GAME_CLOCK?.paused?0:Math.min(.05,Math.max(0,(now-craneFrameTime)/1000));craneFrameTime=now;craneFxTime+=dt;ctx.clearRect(0,0,rect.width,rect.height);
 ctx.fillStyle='#07182b';ctx.fillRect(0,0,rect.width,rect.height);
 let coverRect=null;if(cityArtwork.complete&&cityArtwork.naturalWidth){const cover=Math.max(rect.width/cityArtwork.naturalWidth,rect.height/cityArtwork.naturalHeight),w=cityArtwork.naturalWidth*cover,h=cityArtwork.naturalHeight*cover;coverRect={x:(rect.width-w)/2,y:(rect.height-h)/2,width:w,height:h};ctx.drawImage(cityArtwork,coverRect.x,coverRect.y,w,h);}
 const wash=ctx.createLinearGradient(rect.width*.60,0,rect.width,0);wash.addColorStop(0,'rgba(7,24,43,0)');wash.addColorStop(.62,'rgba(18,48,61,.70)');wash.addColorStop(1,'rgba(13,39,53,.84)');ctx.fillStyle=wash;ctx.fillRect(0,0,rect.width,rect.height);
 const railRect=document.querySelector('aside[data-tv-hud-rail]')?.getBoundingClientRect();window.CraneBackgroundProof={assetPath:'/assets/gameplay/crane-city-minimal-20261003-v1.png',loaded:!!coverRect,naturalWidth:cityArtwork.naturalWidth,naturalHeight:cityArtwork.naturalHeight,canvasBounds:{left:rect.left,top:rect.top,width:rect.width,height:rect.height,right:rect.right,bottom:rect.bottom},canvasBuffer:{width:canvas.width,height:canvas.height},coverFitRect:coverRect,gradient:{startX:rect.width*.60,endX:rect.width,stops:[[0,'rgba(7,24,43,0)'],[.62,'rgba(18,48,61,.70)'],[1,'rgba(13,39,53,.84)']]},railBounds:railRect?{left:railRect.left,top:railRect.top,width:railRect.width,height:railRect.height,right:railRect.right,bottom:railRect.bottom}:null,paintedInCanvas:!!coverRect};if(!state)return;
 const scene=sceneAt(now),scale=Math.min(actorWidth/1100,rect.height/850),letterTop=Math.max(0,rect.height-850*scale),hudInset=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--party-field-inset-top'))||150;
 const safeTop=Math.max(20,(hudInset-letterTop+18)/Math.max(.01,scale)),bottom=842,worldTop=scene.beamY-88,worldBottom=838;
 const space=Math.min(1,Math.max(0,scene.height-4)/10);if(space){const dusk=ctx.createLinearGradient(0,0,0,rect.height);dusk.addColorStop(0,`rgba(3,5,22,${space*.94})`);dusk.addColorStop(1,`rgba(8,17,34,${space*.68})`);ctx.fillStyle=dusk;ctx.fillRect(0,0,rect.width,rect.height);}
 const fit=Math.min(.92,(bottom-safeTop)/Math.max(1,worldBottom-worldTop));craneZoom+= (fit-craneZoom)*(1-Math.exp(-dt*5));craneZoom=Math.min(craneZoom,fit);
 const target=bottom/craneZoom-worldBottom;camera+=(target-camera)*(1-Math.exp(-dt*5));camera=Math.max(camera,target);
 ctx.save();ctx.translate((actorWidth-1100*scale)/2,letterTop/2);ctx.scale(scale,scale);drawCraneSky(scene);ctx.save();ctx.translate((1100-1100*craneZoom)/2,0);ctx.scale(craneZoom,craneZoom);impactRecoil*=Math.exp(-dt*12);const recoil=craneReduce.matches?0:impactRecoil*Math.sin(craneFxTime*75);ctx.translate(0,camera+recoil);
 // Contact shadows sit beneath the complete alpha footprint, before either base is painted.
 ctx.save();ctx.shadowColor='#020b16aa';ctx.shadowBlur=5;ctx.fillStyle='#050e1980';ctx.beginPath();ctx.ellipse(550,825,146,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#06132280';ctx.beginPath();ctx.ellipse(110,831,80,7,0,0,Math.PI*2);ctx.fill();ctx.restore();site('foundation',550,780,270,44);site('footing',110,750,145,80);
 const hookY=scene.hookY||580,beamY=scene.beamY??hookY-135,art=window.PartyArt;
 for(let y=780;y>beamY;y-=126){const height=Math.min(126,y-beamY);if(!art?.draw(ctx,'crane-mast',110,y-height/2,52,height)){ctx.fillStyle='#df9d23';ctx.fillRect(88,y-height,44,height);}}
 for(let x=110;x<1010;x+=150){const width=Math.min(150,1010-x);if(!art?.draw(ctx,'crane-boom',x+width/2,beamY-16,width,54)){ctx.fillStyle='#e3aa30';ctx.fillRect(x,beamY-32,width,30);}}
 ctx.strokeStyle='#ffe298';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(110,beamY-65);ctx.lineTo(965,beamY-25);ctx.moveTo(110,beamY-65);ctx.lineTo(30,beamY-25);ctx.stroke();site('counterweight',35,beamY-10,45,49);site('head',114,beamY-70,130,106);
 drawCraneLights(beamY,scene.trolley,hookY,scene.phase==='playing');
 // Landing squash: the newest floor compresses briefly about its base and springs back (render only).
 if(landedSquash){landedSquash.age+=dt;if(landedSquash.age>.36||craneReduce.matches)landedSquash=null;}
 scene.blocks.forEach((b,i)=>{if(landedSquash&&i===scene.blocks.length-1){const t=landedSquash.age/.36,amp=(landedSquash.perfect?.16:.11)*Math.exp(-t*4)*Math.cos(t*Math.PI*2.4);ctx.save();ctx.translate(b.x,b.y+b.h/2);ctx.scale(1+amp*.6,1-amp);ctx.translate(-b.x,-(b.y+b.h/2));block(b);ctx.restore();}else block(b);});
 const rig=craneRigGeometry(scene);
 if(scene.phase==='playing'){
  if(!art?.draw(ctx,'crane-trolley',scene.trolley,beamY+3,54,70))roundRect(scene.trolley-20,beamY-12,40,25,5,'#ffbc79');
  ctx.strokeStyle='#c5d5cd';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(rig.anchor.x,rig.anchor.y);ctx.lineTo(rig.cableEnd.x,rig.cableEnd.y);ctx.stroke();
  ctx.save();ctx.translate(rig.hookCenter.x,rig.hookCenter.y);ctx.rotate(rig.angle);art?.draw(ctx,'crane-hook',0,0,19,40);ctx.restore();
  if(!scene.falling){block({x:scene.hookX,y:hookY,w:scene.blockWidth||110,h:scene.blockHeight||110,color:scene.players.find(p=>p.id===scene.activeId)?.color||'#bcf781',angle:rig.loadAngle},true);
   ctx.setLineDash([5,9]);ctx.strokeStyle='#bcf78155';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(scene.hookX,hookY+(scene.blockHeight||110)/2+7);const projection=scene.projection;for(let i=1;i<=12;i++){const t=(projection?.flightTime||0)*i/12;ctx.lineTo(scene.hookX+(projection?.vx||0)*t,hookY+(projection?.vy||0)*t+.5*1056*t*t+(scene.blockHeight||110)/2);}ctx.stroke();ctx.setLineDash([]);
   if(scene.projection?.hit){ctx.save();ctx.globalAlpha=.4;ctx.strokeStyle='#b4ff39';ctx.lineWidth=2;ctx.strokeRect(scene.projection.x-(scene.blockWidth||110)/2,scene.projection.y-(scene.blockHeight||110)/2,scene.blockWidth||110,scene.blockHeight||110);ctx.restore();}
  }
 }
 if(scene.falling)block(scene.falling);
 for(const p of scene.particles||[]){ctx.globalAlpha=Math.max(0,p.life);roundRect(p.x,p.y,5,5,1,p.color);}ctx.globalAlpha=1;drawCraneImpacts(dt);ctx.restore();ctx.restore();
 window.CranePresentation={rig,groundContacts:{foundation:{spriteTop:780,spriteBottom:824,shadowY:825},footing:{spriteTop:750,spriteBottom:830,shadowY:831},trolley:{centerY:beamY+3,spriteBottom:beamY+38,cableOriginY:rig.anchor.y}},zoom:craneZoom,camera,safeTop,worldTop,worldBottom,rigScreenTop:craneZoom*(worldTop+camera),visibleBottom:craneZoom*(worldBottom+camera),cssScale:scale,altitude:scene.height,reducedMotion:craneReduce.matches,background:{src:cityArtwork.src,loaded:cityArtwork.complete&&cityArtwork.naturalWidth>0,viewportWidth:rect.width,viewportHeight:rect.height,actorWidth,assetWidth:cityArtwork.naturalWidth,assetHeight:cityArtwork.naturalHeight}};
}
connect();draw();


