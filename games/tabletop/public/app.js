'use strict';
const $=id=>document.getElementById(id),host=/\/host(?:\.html)?$/.test(location.pathname),t=(en,ru)=>window.PartyI18n?.language==='ru'?ru:en;
document.body.classList.toggle('host',host);let mineOpenSeen=[],ws,state,id,sequence=0,boardKey='',rosterKey='',holeKey='',lastExplosion=0,reconnect,pokerStatusKey='';
function ensureMineRail(){if(!host||$('mineSide'))return;const side=document.createElement('aside');side.id='mineSide';side.dataset.tvHudRail='';$('tabletop').append(side);side.append($('status'),$('mineHelp'),$('players'),$('start'));}
if(host&&(document.documentElement.dataset.partyGame==='mines'||/\/mines\//.test(location.pathname)))ensureMineRail();
const send=(type,data={})=>{if(ws?.readyState===1)ws.send(JSON.stringify({type,data}));};
function join(){const p=window.PARTY_PROFILE;let token;try{token=sessionStorage.getItem('tabletop-token');}catch{}send('join',{name:p?.name||$('nickname').value||'Player',token,partyId:p?.id,partyToken:p?.token,party:p});}
function connect(){clearTimeout(reconnect);ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws');ws.onopen=()=>{if(host)send('host');else if(window.PARTY_PROFILE)join();else $('join').hidden=false;};ws.onclose=e=>{if(e.code===4001||e.code===4003){window.dispatchEvent(new Event('blur'));return;}$('status').textContent=t('Reconnecting…','Переподключаемся…');reconnect=setTimeout(connect,800+Math.random()*400);};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='joined'){id=m.data.id;if(m.data.token)try{sessionStorage.setItem('tabletop-token',m.data.token);}catch{}$('join').hidden=true;$('error').textContent='';}if(m.type==='error')$('error').textContent=window.PartyI18n?.t(m.data)||m.data;if(m.type==='state'){state=m.data;observeHockey(state);render();}};}
$('join').onsubmit=e=>{e.preventDefault();join();};$('start').onclick=()=>send('start');connect();
window.addEventListener('party-language-change',()=>{pokerStatusKey='';if(state)render();});
window.addEventListener('party-profile',()=>{if(!host)join();});setInterval(()=>{if(!host&&!id&&window.PARTY_PROFILE&&ws?.readyState===1)join();},1000);
function action(action,value={}){send('action',{action,...value,seq:++sequence});}
// Unchanged cards keep their node, so a new deal animates only the new card and a showdown flips only revealed ones.
function cards(container,values,decorate){const old=[...container.children];values.forEach((c,i)=>{const prev=old[i];if(prev&&prev.dataset.card===String(c))return;const el=document.createElement('span');el.dataset.card=String(c);el.className='card'+(c<0?' back':[1,2].includes(Math.floor(c/13))?' red':'')+(prev&&Number(prev.dataset.card)<0&&c>=0?' flip':'');el.style.setProperty('--deal-i',String(prev?0:Math.max(0,i-old.length)));el.textContent=c<0?'◆':(['2','3','4','5','6','7','8','9','10','J','Q','K','A'][c%13]+['♠','♥','♦','♣'][Math.floor(c/13)]);decorate?.(el,c);if(prev)prev.replaceWith(el);else container.append(el);});for(const extra of old.slice(values.length))extra.remove();}
function identityImage(player,className){
 const person=(window.PARTY_ROSTER||[]).find(p=>p.id===player.id||p.id===player.partyId||p.name===player.name)||player;
 const image=document.createElement('img');image.className=className;image.alt='';image.draggable=false;
 const avatar=person.avatar||player.avatar;image.dataset.photo=String(!!avatar);
 image.src=window.PartyArt?.mascotSource({seed:person.id||player.name,avatar})||'/assets/avatars/atlas-mascots/mascot-01.webp';
 return image;
}
function render(){
 const s=state,me=s.players.find(p=>p.id===id),playing=s.phase==='playing';window.PARTY_BOT_SELF=s;if(host)window.PARTY_BOT_VIEW=s;document.body.dataset.game=s.mode;$('title').textContent=s.mode==='poker'?'POKER NIGHT':s.mode==='mines'?'MINE TOGETHER':'AIR HOCKEY';
 if(host){const field=s.mode==='poker'?document.querySelector('.felt'):s.mode==='airhockey'?$('rink'):null;for(const previous of document.querySelectorAll('[data-tv-hud-anchor]'))if(previous!==field)previous.removeAttribute('data-tv-hud-anchor');if(field&&!field.hasAttribute('data-tv-hud-anchor'))field.dataset.tvHudAnchor='';}
 $('status').textContent=s.phase==='waiting'?t('Ready when everyone is here','Ждём игроков'):s.phase==='results'?t('Match complete','Матч завершён'):s.mode==='poker'?`${t('Hand','Раздача')} ${s.hand} / 5 · ${Math.ceil(s.remaining)}s`:`${Math.ceil(s.remaining)}s`;
 $('start').hidden=!host||playing||!!window.PARTY_UI;for(const mode of ['poker','mines','airhockey'])$(mode).hidden=s.mode!==mode||s.phase==='waiting';
 const key=JSON.stringify([s.players.map(p=>[p.id,p.name,p.score,p.connected,p.folded]),s.turn]);if(key!==rosterKey){rosterKey=key;$('players').replaceChildren(...[...s.players].sort((a,b)=>s.mode==='mines'?b.score-a.score:0).map((p,i)=>{const el=document.createElement('div');el.dataset.playerId=p.id;el.className='player'+(p.id===s.turn?' turn':'')+(p.folded?' folded':'');const name=document.createElement('span');name.className='hp-player-name';name.dataset.noTranslate='';name.textContent=p.name+(p.connected?'':' · '+t('offline','нет связи'));const score=document.createElement('b');score.className='tabletop-score';score.textContent=p.score;const place=s.mode==='mines'?1+s.players.filter(other=>other.score>p.score).length:i+1;const rank=window.HeyPalsUI?.createPlace(place,{className:'tabletop-rank'})||document.createElement('strong');rank.classList.add('tabletop-rank');if(!rank.children.length)rank.textContent=place;el.append(rank,identityImage(p,'tabletop-avatar'),name,score);return el;}));}
 if(s.mode==='mines')ensureMineRail();
 if(s.phase==='waiting')return;
 if(s.mode==='poker'){
  renderSeats(s);
  $('pot').textContent=t('POT','БАНК')+' · '+s.pot;const bk=JSON.stringify(s.board);if(bk!==boardKey){boardKey=bk;cards($('community'),s.board);}
  const hk=JSON.stringify(me?.hole||[]);if(hk!==holeKey){holeKey=hk;cards($('hole'),me?.hole||[]);}$('hole').hidden=host;
  const statusKey=JSON.stringify([s.stage,s.turn,s.winners,s.players.map(p=>[p.id,p.name]),me?.chips]);if(statusKey!==pokerStatusKey){pokerStatusKey=statusKey;
   const names=s.stage==='showdown'?s.players.filter(p=>s.winners.includes(p.id)).map(p=>p.name).join(', '):s.turn!==id?s.players.find(p=>p.id===s.turn)?.name||'':'';
   const label=document.createElement('strong');label.className='poker-turn-label';label.dataset.i18nUi='';label.textContent=s.stage==='showdown'?t('WINNERS','ПОБЕДИТЕЛИ'):s.turn===id?t('YOUR TURN','ТВОЙ ХОД'):t('TURN','ХОД');
   const name=document.createElement('span');name.className='hp-player-name';name.dataset.noTranslate='';name.textContent=names;name.title=names;$('handStatus').replaceChildren(label,...(names?[document.createTextNode(' · '),name]:[]));
   const actor=document.createElement('span');actor.className='poker-actor';actor.append(...[...$('handStatus').childNodes].map(n=>n.cloneNode(true)));$('myPokerStatus').replaceChildren(actor);if(me){const bankroll=document.createElement('span');bankroll.className='poker-bankroll';const caption=document.createElement('small');caption.dataset.i18nUi='';caption.textContent=t('YOUR CHIPS','ТВОИ ФИШКИ');const chips=document.createElement('strong');chips.className='poker-chips';chips.textContent=me.chips;bankroll.append(caption,chips);$('myPokerStatus').append(bankroll);}
  }
  $('actions').hidden=host||!playing||s.stage==='showdown';const active=s.turn===id&&playing,call=Math.max(0,s.currentBet-(me?.bet||0));document.querySelectorAll('#actions button').forEach(b=>b.disabled=!active);
  const callButton=$('call');callButton.dataset.action=call?'call':'check';callButton.textContent=call?t('CALL ','УРАВНЯТЬ ')+Math.min(call,me?.chips||0):t('CHECK','ЧЕК');document.querySelector('[data-action=fold]').textContent=t('FOLD','ПАС');
  $('raiseLabel').textContent=t('Raise total to','Повысить ставку до');$('raiseButton').textContent=t('RAISE','ПОВЫСИТЬ');const max=(me?.bet||0)+(me?.chips||0),min=Math.min(max,s.currentBet+s.minRaise);$('raise').min=min;$('raise').max=max;$('raise').disabled=!active;$('raiseButton').disabled=!active||!me?.canRaise||max<=s.currentBet;if(document.activeElement!==$('raise'))$('raise').value=min;
 }else if(s.mode==='mines'){
  $('mineHelp').textContent=host?t('Open safe tiles: +1. Mine: −5 and a 2-second cooldown. First opening is safe.','Открывай клетки: +1. Мина: −5 и пауза 2 секунды. Первый ход безопасен.'):t('Safe +1 · Mine −5 · Cooldown 2s. First tile is safe.','Клетка +1 · Мина −5 · Пауза 2с. Первый ход безопасен.');
  if(host){
   if(!$('grid').children.length)for(let i=0;i<100;i++){const b=document.createElement('button');b.type='button';b.disabled=true;b.setAttribute('aria-label',`Row ${Math.floor(i/10)+1}, column ${i%10+1}`);$('grid').append(b);}
   // Reveal cascade: newly opened tiles pop outward from the tile the opener stood on (render only).
   const fresh=s.cells.map((c,i)=>c.open&&!mineOpenSeen[i]?i:-1).filter(i=>i>=0),firstPaint=!mineOpenSeen.length;mineOpenSeen=s.cells.map(c=>!!c.open);let origin=fresh.find(i=>s.players.some(p=>p.cursor===i))??fresh[0];
   s.cells.forEach((cell,i)=>{const b=$('grid').children[i];b.className=cell.open?'open'+(cell.mine?' mine':''):'';if(!firstPaint&&tableMotion&&fresh.includes(i)){const d=Math.hypot(i%10-origin%10,Math.floor(i/10)-Math.floor(origin/10));b.style.setProperty('--reveal-delay',Math.min(420,Math.round(d*38))+'ms');b.classList.add(cell.mine?'reveal-mine':'reveal');clearTimeout(b._revealTimer);b._revealTimer=setTimeout(()=>b.classList.remove('reveal','reveal-mine'),900);}b.dataset.count=cell.count||0;b.textContent=cell.open?cell.mine?'✹':cell.count||'':'';const cursors=s.players.filter(p=>p.cursor===i&&p.connected);b.style.outline=cursors.length?'3px solid '+cursors[0].color:'';if(cursors.length){const marker=document.createElement('small');marker.className='mine-cursor';marker.dataset.noTranslate='';marker.textContent=cursors.map(p=>{const bot=/^(?:бот|bot)\s*(\d+)$/i.exec(p.name.trim());return bot?t('B','Б')+bot[1]:Array.from(p.name).slice(0,3).join('');}).join(' · ');b.append(marker);}});
  }
  if(me){$('mineCoordinateLabel').textContent=t('TILE','КЛЕТКА');$('myMineScore').textContent=me.score;$('mineCoordinate').textContent=String.fromCharCode(65+me.cursor%10)+(Math.floor(me.cursor/10)+1);$('mineOpen').disabled=!playing||me.selectedOpen||me.cooldown>0;$('mineOpen').textContent=me.cooldown>0?Math.ceil(me.cooldown)+'s':me.selectedOpen?t('ALREADY OPEN','УЖЕ ОТКРЫТО'):t('OPEN TILE','ОТКРЫТЬ');}
  if(s.explosion&&s.explosion.id>lastExplosion){lastExplosion=s.explosion.id;if(host)window.mineExplosion?.($('grid').children[s.explosion.index]);if(s.explosion.player===id)navigator.vibrate?.([20,30,40]);}
 }else{renderLastHitters(s);$('goals').textContent=s.goals.join(' : ');$('hockeyHelp').textContent=host?t('First to 7 · two equal teams','До 7 голов · две равные команды'):t('Move the joystick. Watch your striker on the big screen.','Двигай джойстик. Следи за своей битой на большом экране.');if(me){$('hockeyJoy').style.setProperty('--team-color',me.team?'#b899ff':'#c4ff71');let pilot=$('hockeyPilot');if(!pilot){pilot=identityImage(me,'hockey-pilot');pilot.id='hockeyPilot';$('goals').before(pilot);}pilot.dataset.team=me.team;}}
}
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));$('raiseButton').onclick=()=>action('raise',{amount:Number($('raise').value)});
function renderLastHitters(s){
 if(!host)return;let rail=$('hockeyHitters');if(!rail){rail=document.createElement('div');rail.id='hockeyHitters';rail.setAttribute('aria-live','polite');for(let team=0;team<2;team++){const label=document.createElement('div');label.className='hockey-last-hitter';label.dataset.team=team;const caption=document.createElement('small'),name=document.createElement('strong');caption.textContent=t('Last touch','Последнее касание');label.append(caption,name);rail.append(label);}$('airhockey').append(rail);}
 rail.hidden=s.players.length<=2;
 [...rail.children].forEach((label,team)=>{const p=s.players.find(p=>p.id===s.lastHitters?.[team]);label.hidden=!p;const name=label.querySelector('strong'),text=p?.name||'';if(name.textContent!==text)name.textContent=text;});
 syncHockeyNameGeometry();
}
let seatKey='';const seatNodes=new Map(),seatBets=new Map();let showdownKey='';const tableMotion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
function decorateCard(el,c){if(c<0)return;const rank=document.createElement('span'),suit=document.createElement('span');rank.className='poker-card-rank';suit.className='poker-card-suit';rank.textContent=['2','3','4','5','6','7','8','9','10','J','Q','K','A'][c%13];suit.textContent=['♠','♥','♦','♣'][Math.floor(c/13)];el.replaceChildren(rank,suit);}
// Chips travel between a seat and the pot only when the server changes a bet or awards the pot.
function flyChips(from,to,count,stagger=55){const felt=document.querySelector('.felt');if(!tableMotion||!felt||!from||!to)return;const f=felt.getBoundingClientRect(),a=from.getBoundingClientRect(),b=to.getBoundingClientRect();if(!a.width||!b.width)return;const ax=a.left+a.width/2-f.left,ay=a.top+a.height/2-f.top,bx=b.left+b.width/2-f.left,by=b.top+b.height/2-f.top+(to.id==='pot'?b.height*.95:0);for(let i=0;i<count;i++){const chip=document.createElement('i');chip.className='poker-chip-fly';chip.style.left=ax+'px';chip.style.top=ay+'px';felt.append(chip);const jx=(i%3-1)*8,jy=(i%2)*6,lift=Math.min(60,Math.hypot(bx-ax,by-ay)*.18);chip.animate([{transform:'translate(-50%,-50%) scale(.9)',opacity:0},{transform:`translate(calc(-50% + ${(bx-ax)*.5+jx}px),calc(-50% + ${(by-ay)*.5-lift}px)) scale(1.08)`,opacity:1,offset:.45},{transform:`translate(calc(-50% + ${bx-ax+jx}px),calc(-50% + ${by-ay+jy}px)) scale(1)`,opacity:1,offset:.9},{transform:`translate(calc(-50% + ${bx-ax+jx}px),calc(-50% + ${by-ay+jy}px)) scale(.96)`,opacity:0}],{duration:520,delay:i*stagger,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'}).finished.then(()=>chip.remove(),()=>chip.remove());}}
function renderSeats(s){
 if(!host)return;const key=JSON.stringify([s.turn,s.stage,s.players.map(p=>[p.id,p.name,p.chips,p.bet,p.folded,p.hole])]);if(key===seatKey)return;seatKey=key;
 let seats=document.querySelector('.table-seats');if(!seats){seats=document.createElement('div');seats.className='table-seats';document.querySelector('.felt').append(seats);}
 const positions=s.players.length===2?[[12,50],[88,50]]:s.players.length===4?[[27,18],[88,50],[73,84],[12,50]]:s.players.map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/s.players.length;return [50+39*Math.cos(a),52+34*Math.sin(a)];});
 const live=new Set(s.players.map(p=>p.id));for(const [pid,node] of seatNodes)if(!live.has(pid)){node.seat.remove();seatNodes.delete(pid);seatBets.delete(pid);}
 s.players.forEach((p,i)=>{let n=seatNodes.get(p.id);if(!n){const seat=document.createElement('div');seat.dataset.playerId=p.id;const name=document.createElement('span');name.className='seat-name hp-player-name';name.dataset.noTranslate='';const score=document.createElement('b');score.className='seat-score';const hand=document.createElement('div');hand.className='seat-hand';const chips=document.createElement('i');chips.className='seat-chips';seat.append(identityImage(p,'seat-avatar'),name,score,hand,chips);n={seat,name,score,hand,chips};seatNodes.set(p.id,n);}
  seats.dataset.dense=String(s.players.length>6);n.seat.className='seat'+(s.turn===p.id?' current':'')+(p.folded?' folded':'');n.seat.style.left=positions[i][0]+'%';n.seat.style.top=positions[i][1]+'%';if(n.name.textContent!==p.name)n.name.textContent=p.name;if(n.score.textContent!==String(p.chips))n.score.textContent=p.chips;n.hand.dataset.revealed=String(p.hole.some(c=>c>=0));n.seat.dataset.handAnchor=positions[i][1]<35?'below':positions[i][1]>65?'above':positions[i][0]<50?'right':'left';cards(n.hand,p.hole,decorateCard);n.chips.hidden=!p.bet;
  if(seats.children[i]!==n.seat)seats.insertBefore(n.seat,seats.children[i]||null);
  const before=seatBets.get(p.id);if(before!=null&&p.bet>before)flyChips(n.seat,$('pot'),Math.min(4,1+Math.floor((p.bet-before)/40)));seatBets.set(p.id,p.bet);});
 const sk=s.stage==='showdown'?s.hand+':'+JSON.stringify(s.winners):'';if(sk&&sk!==showdownKey){for(const w of s.winners||[])flyChips($('pot'),seatNodes.get(w)?.seat,6,70);}showdownKey=sk;
}
const rinkArt=new Image();if(host)rinkArt.src='/assets/gameplay/tabletop/hockey-field.webp';
const rink=$('rink'),ctx=rink.getContext('2d'),joy=$('hockeyJoy'),knob=$('hockeyKnob');
const enamelSheen=ctx.createLinearGradient(0,0,1000,600);enamelSheen.addColorStop(0,'#176c8726');enamelSheen.addColorStop(.35,'#e5ffff26');enamelSheen.addColorStop(.52,'#ffffff3d');enamelSheen.addColorStop(.68,'#99d5e014');enamelSheen.addColorStop(1,'#195f7a26');
ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';let pointer=null,axis={x:0,y:0};
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
let hockeyNameFont='KardiaFit, system-ui, sans-serif',hockeyLabelFit=1,hockeyNameOcclusions=[];
function syncHockeyNameGeometry(){
 const r=rink.getBoundingClientRect();hockeyLabelFit=Math.max(.1,Math.min(r.width/1000,r.height/600));hockeyNameOcclusions=[];
 // TV readouts cover the canvas; reserve their measured ink/backing only for names.
 // Canvas world and striker coordinates remain authoritative and unchanged.
 if(!host||parent===window)return;
 try{
  const frame=parent.document.getElementById('gameFrame')?.getBoundingClientRect();if(!frame||!r.width||!r.height)return;
  const sx=frame.width/innerWidth,sy=frame.height/innerHeight,border=getComputedStyle(rink),left=parseFloat(border.borderLeftWidth)||0,top=parseFloat(border.borderTopWidth)||0;
  const width=r.width-left-(parseFloat(border.borderRightWidth)||0),height=r.height-top-(parseFloat(border.borderBottomWidth)||0);if(width<=0||height<=0)return;
  if(Array.isArray(window.PARTY_HUD_EXCLUSIONS)&&window.PARTY_HUD_EXCLUSIONS.length)hockeyNameOcclusions=window.PARTY_HUD_EXCLUSIONS.map(box=>({x:(box.left-r.left-left)*1000/width,y:(box.top-r.top-top)*600/height,width:box.width*1000/width,height:box.height*600/height}));
  else hockeyNameOcclusions=[...parent.document.querySelectorAll('#play .tv-info-center,#play .tv-info-right')].filter(e=>e.getClientRects().length).map(e=>{const box=e.getBoundingClientRect();return{x:((box.left-frame.left)/sx-r.left-left)*1000/width,y:((box.top-frame.top)/sy-r.top-top)*600/height,width:box.width/sx*1000/width,height:box.height/sy*600/height};});
  for(const label of document.querySelectorAll('#hockeyHitters>.hockey-last-hitter'))if(label.getClientRects().length){const box=label.getBoundingClientRect();hockeyNameOcclusions.push({x:(box.left-r.left-left)*1000/width,y:(box.top-r.top-top)*600/height,width:box.width*1000/width,height:box.height*600/height});}
 }catch{}
}
new ResizeObserver(syncHockeyNameGeometry).observe(rink);window.addEventListener('party-stage-resize',syncHockeyNameGeometry);window.addEventListener('resize',syncHockeyNameGeometry);
function syncHockeyFont(){hockeyNameFont=getComputedStyle(document.documentElement).getPropertyValue('--hp-font-body').trim()||hockeyNameFont;}
syncHockeyFont();document.fonts?.ready.then(syncHockeyFont);
function drawHockeyNames(players){
 ctx.save();ctx.font='550 '+(14/hockeyLabelFit)+'px '+hockeyNameFont;ctx.textAlign='center';ctx.textBaseline='middle';
 const placed=[],gap=4/hockeyLabelFit;
 for(const p of [...players].sort((a,b)=>a.y-b.y||String(a.id).localeCompare(String(b.id)))){
 const chars=Array.from(p.name||'');let label=chars.join('');while(chars.length>1&&ctx.measureText(label).width>150/hockeyLabelFit){chars.pop();label=chars.join('')+'…';}
 const width=Math.ceil(ctx.measureText(label).width)+12/hockeyLabelFit,height=22/hockeyLabelFit,x=Math.max(6,Math.min(994-width,p.x-width/2)),origin=Math.max(6,Math.min(594-height,p.y-76));
 const overlaps=(y,r)=>x<r.x+r.width+gap&&x+width+gap>r.x&&y<r.y+r.height+gap&&y+height+gap>r.y,collides=y=>placed.some(r=>overlaps(y,r));
 let y=origin;for(let step=1;collides(y)&&step<=players.length*2;step++){const direction=step%2?1:-1,distance=Math.ceil(step/2)*(height+gap);y=Math.max(6,Math.min(594-height,origin+direction*distance));}
 if(hockeyNameOcclusions.some(r=>overlaps(y,r))){
  const blockers=[...placed,...hockeyNameOcclusions,...players.map(player=>({x:player.x-40,y:player.y-40,width:80,height:80}))],clamp=y=>Math.max(6,Math.min(594-height,y)),candidates=[...blockers.flatMap(r=>[clamp(r.y+r.height+gap),clamp(r.y-height-gap)])];
  for(let step=1;step<=players.length*2;step++)candidates.push(clamp(y+step*(height+gap)),clamp(y-step*(height+gap)));
  y=candidates.sort((a,b)=>Math.abs(a-origin)-Math.abs(b-origin)).find(candidate=>!blockers.some(r=>overlaps(candidate,r)))??y;
 }
 placed.push({id:p.id,name:p.name,x,y,width,height});ctx.fillStyle='#21182cce';ctx.beginPath();ctx.roundRect(x,y,width,height,5);ctx.fill();ctx.fillStyle='#fff';ctx.fillText(label,x+width/2,y+height/2+.5);
 }
 if(host)window.PARTY_HOCKEY_NAMES={occlusions:hockeyNameOcclusions,labels:placed};
 ctx.restore();
}
const puckTrail=[],rinkSparks=[];let goalBeat=null,lastGoals=null,lastPuckV=null;
function observeHockey(s){if(!host||s.mode!=='airhockey'||!s.puck)return;const g=s.goals.join(':');if(lastGoals&&g!==lastGoals&&s.phase!=='waiting'){const team=s.goals[0]!==Number(lastGoals.split(':')[0])?0:1;goalBeat={team,at:performance.now()};puckTrail.length=0;}lastGoals=g;
 const v={x:s.puck.vx,y:s.puck.vy};if(Number.isFinite(v.x)&&lastPuckV&&s.phase==='playing'){const a=Math.hypot(lastPuckV.x,lastPuckV.y),b=Math.hypot(v.x,v.y),turn=(lastPuckV.x*v.x+lastPuckV.y*v.y)/Math.max(1,a*b);if(b-a>90||turn<.5&&b>140){const near=s.players.find(p=>Math.hypot(p.x-s.puck.x,p.y-s.puck.y)<80);if(rinkSparks.length>8)rinkSparks.shift();rinkSparks.push({x:s.puck.x,y:s.puck.y,at:performance.now(),color:near?(near.team?'#d9a8ff':'#e1ff9a'):'#eafcff',big:!!near,ang:Math.atan2(v.y,v.x)});}}lastPuckV=Number.isFinite(v.x)?v:null;}
function drawHockeyFx(now){if(!tableMotion)return;ctx.save();ctx.lineCap='round';
 for(let i=1;i<puckTrail.length;i++){const k=i/puckTrail.length;ctx.globalAlpha=k*.38;ctx.strokeStyle='#7ee7ff';ctx.lineWidth=22*k;ctx.beginPath();ctx.moveTo(puckTrail[i-1].x,puckTrail[i-1].y);ctx.lineTo(puckTrail[i].x,puckTrail[i].y);ctx.stroke();}
 for(let i=rinkSparks.length-1;i>=0;i--){const e=rinkSparks[i],t=(now-e.at)/(e.big?420:300);if(t>=1){rinkSparks.splice(i,1);continue;}ctx.globalAlpha=(1-t)*(1-t);ctx.strokeStyle=e.color;ctx.lineWidth=e.big?4:2.5;ctx.beginPath();ctx.arc(e.x,e.y,22+t*(e.big?46:26),0,Math.PI*2);ctx.stroke();const n=e.big?9:5;for(let j=0;j<n;j++){const a=e.ang+(j/(n-1)-.5)*2.2,d=26+Math.pow(t,.6)*(e.big?60:34);ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d);ctx.lineTo(e.x+Math.cos(a)*(d+10*(1-t)),e.y+Math.sin(a)*(d+10*(1-t)));ctx.stroke();}}
 if(goalBeat){const t=(now-goalBeat.at)/1100;if(t>=1)goalBeat=null;else{const x=goalBeat.team===0?1000:0,color=goalBeat.team===0?'200,255,115':'184,153,255',deep=goalBeat.team===0?'84,170,0':'143,25,237',g=ctx.createRadialGradient(x,300,0,x,300,320);g.addColorStop(0,`rgba(${color},${.55*(1-t)})`);g.addColorStop(1,`rgba(${color},0)`);ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fillRect(x?680:0,0,320,600);for(let r=0;r<3;r++){const k=Math.max(0,Math.min(1,t*1.6-r*.18));if(k<=0||k>=1)continue;ctx.globalAlpha=(1-k)*.8;ctx.strokeStyle=`rgb(${deep})`;ctx.lineWidth=9*(1-k)+2;ctx.beginPath();ctx.arc(x,300,40+k*300,0,Math.PI*2);ctx.stroke();}
  for(let j=0;j<22;j++){const a=(goalBeat.team===0?Math.PI:0)+((j*0.6180339)%1-.5)*2.4,sp=180+(j*37%100)*3.2,tt=t*1.1,px=x+Math.cos(a)*sp*tt,py=300+Math.sin(a)*sp*tt+260*tt*tt;ctx.globalAlpha=Math.max(0,1-t)*.95;ctx.fillStyle=j%3===0?'#f5a623':j%3===1?`rgb(${deep})`:'#ff8fd0';ctx.save();ctx.translate(px,py);ctx.rotate(j+t*9);ctx.fillRect(-7,-4,14,8);ctx.restore();}}}
 ctx.restore();}
let visual=null,last=performance.now();function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(state?.mode==='airhockey'&&state.puck){const blend=1-Math.exp(-dt*26);visual??={...state.puck};visual.x+=(state.puck.x-visual.x)*blend;visual.y+=(state.puck.y-visual.y)*blend;ctx.clearRect(0,0,1000,600);if(rinkArt.complete&&rinkArt.naturalWidth)ctx.drawImage(rinkArt,0,0,1000,600);else{ctx.fillStyle='#141a29';ctx.fillRect(0,0,1000,600);}ctx.fillStyle=enamelSheen;ctx.fillRect(18,18,964,564);ctx.strokeStyle='#b79ad455';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(500,0);ctx.lineTo(500,600);ctx.stroke();ctx.beginPath();ctx.arc(500,300,90,0,Math.PI*2);ctx.stroke();if(!goalBeat){puckTrail.push({x:visual.x,y:visual.y});const sp=Math.hypot(state.puck.vx||0,state.puck.vy||0);while(puckTrail.length>(sp>380?12:sp>220?7:2))puckTrail.shift();}drawHockeyFx(now);for(const p of state.players){drawMallet(p.x,p.y,40,p.team);if(p.id===id){ctx.strokeStyle='#fff';ctx.lineWidth=2;circle(p.x,p.y,43);ctx.stroke();}}drawHockeyNames(state.players);drawPuck(visual.x,visual.y,22);ctx.fillStyle='#c4ff71';ctx.fillRect(0,205,6,190);ctx.fillStyle='#b899ff';ctx.fillRect(994,205,6,190);}requestAnimationFrame(frame);}requestAnimationFrame(frame);
