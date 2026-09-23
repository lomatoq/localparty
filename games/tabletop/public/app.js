'use strict';
const $=id=>document.getElementById(id),host=/\/host(?:\.html)?$/.test(location.pathname),t=(en,ru)=>window.PartyI18n?.language==='ru'?ru:en;
document.body.classList.toggle('host',host);let ws,state,id,sequence=0,boardKey='',rosterKey='',holeKey='',lastExplosion=0,reconnect;
const send=(type,data={})=>{if(ws?.readyState===1)ws.send(JSON.stringify({type,data}));};
function join(){const p=window.PARTY_PROFILE;let token;try{token=sessionStorage.getItem('tabletop-token');}catch{}send('join',{name:p?.name||$('nickname').value||'Player',token,partyId:p?.id,partyToken:p?.token,party:p});}
function connect(){clearTimeout(reconnect);ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws');ws.onopen=()=>{if(host)send('host');else if(window.PARTY_PROFILE)join();else $('join').hidden=false;};ws.onclose=()=>{$('status').textContent=t('Reconnecting…','Переподключаемся…');reconnect=setTimeout(connect,800);};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='joined'){id=m.data.id;if(m.data.token)try{sessionStorage.setItem('tabletop-token',m.data.token);}catch{}$('join').hidden=true;$('error').textContent='';}if(m.type==='error')$('error').textContent=window.PartyI18n?.t(m.data)||m.data;if(m.type==='state'){state=m.data;render();}};}
$('join').onsubmit=e=>{e.preventDefault();join();};$('start').onclick=()=>send('start');connect();
window.addEventListener('party-profile',()=>{if(!host)join();});setInterval(()=>{if(!host&&!id&&window.PARTY_PROFILE&&ws?.readyState===1)join();},1000);
function action(action,value={}){send('action',{action,...value,seq:++sequence});}
function cards(container,values){container.replaceChildren(...values.map(c=>{const el=document.createElement('span');el.className='card'+(c<0?' back':[1,2].includes(Math.floor(c/13))?' red':'');el.textContent=c<0?'◆':(['2','3','4','5','6','7','8','9','10','J','Q','K','A'][c%13]+['♠','♥','♦','♣'][Math.floor(c/13)]);return el;}));}
function render(){
 const s=state,me=s.players.find(p=>p.id===id),playing=s.phase==='playing';window.PARTY_BOT_SELF=s;if(host)window.PARTY_BOT_VIEW=s;document.body.dataset.game=s.mode;$('title').textContent=s.mode==='poker'?'POKER NIGHT':s.mode==='mines'?'MINE TOGETHER':'AIR HOCKEY';
 $('status').textContent=s.phase==='waiting'?t('Ready when everyone is here','Ждём игроков'):s.phase==='results'?t('Match complete','Матч завершён'):s.mode==='poker'?`${t('Hand','Раздача')} ${s.hand} / 5 · ${Math.ceil(s.remaining)}s`:`${Math.ceil(s.remaining)}s`;
 $('start').hidden=!host||playing||!!window.PARTY_UI;for(const mode of ['poker','mines','airhockey'])$(mode).hidden=s.mode!==mode||s.phase==='waiting';
 const key=JSON.stringify([s.players.map(p=>[p.id,p.name,p.score,p.connected,p.folded]),s.turn]);if(key!==rosterKey){rosterKey=key;$('players').replaceChildren(...s.players.map(p=>{const el=document.createElement('div');el.className='player'+(p.id===s.turn?' turn':'')+(p.folded?' folded':'');const name=document.createElement('span');name.textContent=p.name+(p.connected?'':' · '+t('offline','нет связи'));const score=document.createElement('b');score.textContent=p.score;el.append(name,score);return el;}));}
 if(s.phase==='waiting')return;
 if(s.mode==='poker'){
  renderSeats(s);
  $('pot').textContent=t('POT','БАНК')+' · '+s.pot;const bk=JSON.stringify(s.board);if(bk!==boardKey){boardKey=bk;cards($('community'),s.board);}
  const hk=JSON.stringify(me?.hole||[]);if(hk!==holeKey){holeKey=hk;cards($('hole'),me?.hole||[]);}$('hole').hidden=host;
  $('handStatus').textContent=s.stage==='showdown'?t('Winners: ','Победители: ')+s.players.filter(p=>s.winners.includes(p.id)).map(p=>p.name).join(', '):s.turn===id?t('YOUR TURN','ТВОЙ ХОД'):t('Turn: ','Ход: ')+(s.players.find(p=>p.id===s.turn)?.name||'');
  $('myPokerStatus').textContent=$('handStatus').textContent+(me?' · '+me.chips+' '+t('chips','фишек'):'');
  $('actions').hidden=host||!playing||s.stage==='showdown';const active=s.turn===id&&playing,call=Math.max(0,s.currentBet-(me?.bet||0));document.querySelectorAll('#actions button').forEach(b=>b.disabled=!active);
  const callButton=$('call');callButton.dataset.action=call?'call':'check';callButton.textContent=call?t('CALL ','УРАВНЯТЬ ')+Math.min(call,me?.chips||0):t('CHECK','ЧЕК');document.querySelector('[data-action=fold]').textContent=t('FOLD','ПАС');
  $('raiseLabel').textContent=t('Raise total to','Повысить ставку до');$('raiseButton').textContent=t('RAISE','ПОВЫСИТЬ');const max=(me?.bet||0)+(me?.chips||0),min=Math.min(max,s.currentBet+s.minRaise);$('raise').min=min;$('raise').max=max;$('raise').disabled=!active;$('raiseButton').disabled=!active||!me?.canRaise||max<=s.currentBet;if(document.activeElement!==$('raise'))$('raise').value=min;
 }else if(s.mode==='mines'){
  if(host&&!$('mineSide')){const side=document.createElement('aside');side.id='mineSide';$('tabletop').append(side);side.append($('status'),$('mineHelp'));}
  $('mineHelp').textContent=t('Open safe tiles: +1. Mine: −5 and a 2-second cooldown. First opening is safe.','Открывай клетки: +1. Мина: −5 и пауза 2 секунды. Первый ход безопасен.');
  if(host){
   if(!$('grid').children.length)for(let i=0;i<100;i++){const b=document.createElement('button');b.type='button';b.disabled=true;b.setAttribute('aria-label',`Row ${Math.floor(i/10)+1}, column ${i%10+1}`);$('grid').append(b);}
   s.cells.forEach((cell,i)=>{const b=$('grid').children[i];b.className=cell.open?'open'+(cell.mine?' mine':''):'';b.dataset.count=cell.count||0;b.textContent=cell.open?cell.mine?'✹':cell.count||'':'';const cursors=s.players.filter(p=>p.cursor===i&&p.connected);b.style.outline=cursors.length?'3px solid '+cursors[0].color:'';if(cursors.length){const marker=document.createElement('small');marker.className='mine-cursor';marker.textContent=cursors.map(p=>p.name.slice(0,3)).join(' · ');b.append(marker);}});
  }
  if(me){$('mineCoordinate').textContent=String.fromCharCode(65+me.cursor%10)+(Math.floor(me.cursor/10)+1);$('mineOpen').disabled=!playing||me.selectedOpen||me.cooldown>0;$('mineOpen').textContent=me.cooldown>0?Math.ceil(me.cooldown)+'s':me.selectedOpen?t('ALREADY OPEN','УЖЕ ОТКРЫТО'):t('OPEN TILE','ОТКРЫТЬ');}
  if(s.explosion&&s.explosion.id>lastExplosion){lastExplosion=s.explosion.id;if(host)window.mineExplosion?.($('grid').children[s.explosion.index]);if(s.explosion.player===id)navigator.vibrate?.([20,30,40]);}
 }else{$('goals').textContent=s.goals.join(' : ');$('hockeyHelp').textContent=host?t('First to 7 · two equal teams','До 7 голов · две равные команды'):t('Move the joystick. Watch your striker on the big screen.','Двигай джойстик. Следи за своей битой на большом экране.');if(me)$('hockeyJoy').style.setProperty('--team-color',me.team?'#b899ff':'#c4ff71');}
}
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));$('raiseButton').onclick=()=>action('raise',{amount:Number($('raise').value)});
let seatKey='';
function renderSeats(s){
 if(!host)return;const key=JSON.stringify([s.turn,s.stage,s.players.map(p=>[p.id,p.name,p.chips,p.bet,p.folded,p.hole])]);if(key===seatKey)return;seatKey=key;
 let seats=document.querySelector('.table-seats');if(!seats){seats=document.createElement('div');seats.className='table-seats';document.querySelector('.felt').append(seats);}
 const positions=s.players.length===2?[[8,50],[92,50]]:s.players.map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/s.players.length;return [50+44*Math.cos(a),50+45*Math.sin(a)];});
 seats.replaceChildren(...s.players.map((p,i)=>{const seat=document.createElement('div');seat.className='seat'+(s.turn===p.id?' current':'')+(p.folded?' folded':'');seat.style.left=positions[i][0]+'%';seat.style.top=positions[i][1]+'%';const name=document.createElement('span');name.className='seat-name';name.textContent=p.name;const score=document.createElement('b');score.className='seat-score';score.textContent=p.chips;const hand=document.createElement('div');hand.className='seat-hand';hand.textContent=p.hole.map(c=>c<0?'◆':(['2','3','4','5','6','7','8','9','10','J','Q','K','A'][c%13]+['♠','♥','♦','♣'][Math.floor(c/13)])).join(' ');seat.append(name,score,hand);if(p.bet){const chips=document.createElement('i');chips.className='seat-chips';seat.append(chips);}return seat;}));
}
const rinkArt=new Image();if(host)rinkArt.src='/assets/gameplay/tabletop/hockey-field.webp';
const rink=$('rink'),ctx=rink.getContext('2d'),joy=$('hockeyJoy'),knob=$('hockeyKnob');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';let pointer=null,axis={x:0,y:0};
function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);}
function drawMallet(x,y,r,team){
 const color=team?'#8f19ed':'#86e900',highlight=team?'#d9a8ff':'#e1ff9a',dark=team?'#3d075d':'#315b08';
 ctx.save();ctx.shadowColor='#090615b8';ctx.shadowBlur=r*.28;ctx.shadowOffsetY=r*.12;circle(x,y,r);ctx.fillStyle=dark;ctx.fill();ctx.shadowColor='transparent';
 const metal=ctx.createLinearGradient(x-r,y-r,x+r,y+r);metal.addColorStop(0,'#ffffff');metal.addColorStop(.2,'#6d7180');metal.addColorStop(.48,'#e7e9ef');metal.addColorStop(.72,'#515462');metal.addColorStop(1,'#d8dbe2');circle(x,y,r);ctx.fillStyle=metal;ctx.fill();
 const outer=ctx.createRadialGradient(x-r*.28,y-r*.34,r*.05,x,y,r*.84);outer.addColorStop(0,'#fff');outer.addColorStop(.16,highlight);outer.addColorStop(.46,color);outer.addColorStop(1,dark);circle(x,y,r*.86);ctx.fillStyle=outer;ctx.fill();
 circle(x,y,r*.68);ctx.strokeStyle='#ffffff8f';ctx.lineWidth=Math.max(2,r*.055);ctx.stroke();
 const dome=ctx.createRadialGradient(x-r*.22,y-r*.28,0,x,y,r*.58);dome.addColorStop(0,'#ffffff');dome.addColorStop(.18,highlight);dome.addColorStop(.6,color);dome.addColorStop(1,dark);circle(x,y,r*.57);ctx.fillStyle=dome;ctx.fill();
 ctx.restore();
}
function drawPuck(x,y,r){
 ctx.save();ctx.shadowColor='#080815b8';ctx.shadowBlur=r*.32;ctx.shadowOffsetY=r*.12;circle(x,y,r);ctx.fillStyle='#080c12';ctx.fill();ctx.shadowColor='transparent';
 const rim=ctx.createLinearGradient(x-r,y-r,x+r,y+r);rim.addColorStop(0,'#eafcff');rim.addColorStop(.18,'#21cfff');rim.addColorStop(.5,'#08394b');rim.addColorStop(.78,'#66e8ff');rim.addColorStop(1,'#071b25');circle(x,y,r);ctx.fillStyle=rim;ctx.fill();
 const face=ctx.createRadialGradient(x-r*.25,y-r*.28,0,x,y,r*.8);face.addColorStop(0,'#59606a');face.addColorStop(.45,'#252a32');face.addColorStop(1,'#080b10');circle(x,y,r*.78);ctx.fillStyle=face;ctx.fill();
 circle(x,y,r*.78);ctx.strokeStyle='#ffffff38';ctx.lineWidth=Math.max(1.5,r*.06);ctx.stroke();ctx.restore();
}
function move(e){if(host||state?.phase!=='playing'||state.mode!=='airhockey')return;const r=joy.getBoundingClientRect(),radius=r.width*.32,x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius,n=Math.max(1,Math.hypot(x,y));axis={x:x/n,y:y/n};knob.style.transform=`translate(calc(-50% + ${axis.x*radius}px),calc(-50% + ${axis.y*radius}px))`;action('steer',axis);}
function release(){pointer=null;axis={x:0,y:0};knob.style.transform='translate(-50%,-50%)';if(state?.mode==='airhockey')action('steer',axis);}
joy.onpointerdown=e=>{if(pointer!==null)return;e.preventDefault();pointer=e.pointerId;joy.setPointerCapture(pointer);move(e);};joy.onpointermove=e=>{if(e.pointerId===pointer)move(e);};joy.onpointerup=joy.onpointercancel=joy.onlostpointercapture=release;window.addEventListener('blur',release);window.addEventListener('pagehide',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});setInterval(()=>{if(pointer!==null)action('steer',axis);},100);
document.querySelectorAll('[data-direction]').forEach(b=>b.onclick=()=>action('select',{direction:b.dataset.direction}));$('mineOpen').onclick=()=>action('open');
let visual=null,last=performance.now();function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(state?.mode==='airhockey'&&state.puck){const blend=1-Math.exp(-dt*26);visual??={...state.puck};visual.x+=(state.puck.x-visual.x)*blend;visual.y+=(state.puck.y-visual.y)*blend;ctx.fillStyle='#141a29';ctx.fillRect(0,0,1000,600);if(rinkArt.complete&&rinkArt.naturalWidth)ctx.drawImage(rinkArt,0,0,1000,600);ctx.strokeStyle='#b79ad455';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(500,0);ctx.lineTo(500,600);ctx.stroke();ctx.beginPath();ctx.arc(500,300,90,0,Math.PI*2);ctx.stroke();for(const p of state.players){drawMallet(p.x,p.y,40,p.team);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='italic 900 18px Rubik,system-ui';ctx.fillText(p.name,p.x,Math.max(20,p.y-46),130);if(p.id===id){ctx.strokeStyle='#fff';ctx.lineWidth=2;circle(p.x,p.y,43);ctx.stroke();}}drawPuck(visual.x,visual.y,22);ctx.fillStyle='#c4ff71';ctx.fillRect(0,205,6,190);ctx.fillStyle='#b899ff';ctx.fillRect(994,205,6,190);}requestAnimationFrame(frame);}requestAnimationFrame(frame);
