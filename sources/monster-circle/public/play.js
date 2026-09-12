const socket=io();
const $=s=>document.querySelector(s);
const VIEWS=['joinView','waitView','drawView','confirmView'];
let me={id:localStorage.getItem('mc_playerId'),token:localStorage.getItem('mc_token'),name:localStorage.getItem('mc_name')||'',handedness:localStorage.getItem('mc_hand')||'right'};
let state=null, turn=null, color='#171513', size=11, drawing=false, last=null;
const canvas=$('#drawCanvas'), ctx=canvas.getContext('2d');
const history=[];

function show(id){VIEWS.forEach(v=>$('#'+v).classList.toggle('hidden',v!==id))}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.add('hidden'),2200)}
function setHand(hand){me.handedness=hand;localStorage.setItem('mc_hand',hand);document.querySelectorAll('.hand-btn').forEach(b=>b.classList.toggle('active',b.dataset.hand===hand));$('#toolDock').classList.toggle('lefty',hand==='left')}
setHand(me.handedness);$('#nameInput').value=me.name;
document.querySelectorAll('.hand-btn').forEach(b=>b.onclick=()=>setHand(b.dataset.hand));

$('#joinBtn').onclick=()=>{
  const name=$('#nameInput').value.trim();
  socket.emit('player:join',{name,handedness:me.handedness,playerId:me.id,token:me.token},r=>{
    if(!r.ok){$('#joinError').textContent=r.error;return}
    me.id=r.playerId;me.token=r.token;me.name=r.name;
    localStorage.setItem('mc_playerId',me.id);localStorage.setItem('mc_token',me.token);localStorage.setItem('mc_name',me.name);
    $('#joinError').textContent='';show('waitView');
  })
};

socket.on('connect',()=>{
  if(me.id&&me.token){socket.emit('player:resume',{playerId:me.id,token:me.token},r=>{if(r.ok){me.name=r.name;setHand(r.handedness||me.handedness);show('waitView')}else show('joinView')})}
});

socket.on('game:state',s=>{
  state=s;
  const mine=s.players.find(p=>p.id===me.id);
  if(!mine && me.id && s.phase==='lobby') { localStorage.removeItem('mc_playerId');localStorage.removeItem('mc_token');me.id=null;me.token=null;show('joinView'); return; }
  if(!mine) return;
  if(s.phase==='lobby'){
    $('#waitTitle').textContent=`В лобби ${s.players.length}/${s.maxPlayers}`;
    $('#waitText').textContent=s.players.length===s.maxPlayers?'Все на месте. Ждём старт с компьютера.':'Пусть остальные сканируют QR.';
    renderQueue(); if(!turn)show('waitView');
  } else if(s.phase==='playing'){
    renderQueue();
    if(s.activePlayerId!==me.id && !$('#confirmView').classList.contains('hidden')) show('waitView');
    if(s.activePlayerId!==me.id && $('#drawView').classList.contains('hidden')===false) show('waitView');
    if(s.activePlayerId!==me.id){$('#waitTitle').textContent=`Сейчас рисует ${s.activePlayerName}`;$('#waitText').textContent='Твой рисунок пока секрет. Не подсматривай 👀';show('waitView')}
  } else if(s.phase==='reveal'){
    turn=null;$('#waitTitle').textContent='Готово!';$('#waitText').textContent='Смотри на большой экран 😈';show('waitView')
  }
});

function renderQueue(){
  if(!state)return;const q=$('#phoneQueue');q.innerHTML='';
  state.players.forEach((p,i)=>{const d=document.createElement('div');d.textContent=(i<state.turnIndex?'✓ ':i===state.turnIndex?'✏️ ':'')+p.name+(p.id===me.id?' — ты':'');q.appendChild(d)})
}

socket.on('turn:start',payload=>{turn=payload;startTurn(payload)});
function startTurn(t){
  $('#partLabel').textContent=t.part;
  $('#prompt').textContent=t.prompt;
  $('#turnBadge').textContent=`${t.turnIndex+1}/${t.total}`;
  initCanvas(t.connectorXs||[]);show('drawView')
}

const PALETTE=['#171513','#ff5e57','#ff9f43','#feca57','#d9ff57','#48dbfb','#54a0ff','#9b5de5','#ff4f9a','#ffffff'];
const colors=$('#colors');
PALETTE.forEach((c,i)=>{const b=document.createElement('button');b.className='color'+(i===0?' active':'');b.style.background=c;b.onclick=()=>{color=c;document.querySelectorAll('.color').forEach(x=>x.classList.remove('active'));b.classList.add('active')};colors.appendChild(b)});
$('#brushSize').oninput=e=>size=+e.target.value;

function initCanvas(connectorXs){
  ctx.fillStyle='#f6efe3';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#736a61';ctx.lineWidth=8;ctx.lineCap='round';
  for(const x of connectorXs){const px=x*canvas.width;ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,24);ctx.stroke()}
  history.length=0;saveHistory();
}

function point(e){const r=canvas.getBoundingClientRect();const touch=e.touches?.[0]||e;return{x:(touch.clientX-r.left)*(canvas.width/r.width),y:(touch.clientY-r.top)*(canvas.height/r.height)}}
function saveHistory(){if(history.length>18)history.shift();history.push(canvas.toDataURL('image/png'))}
function begin(e){e.preventDefault();drawing=true;last=point(e)}
function move(e){if(!drawing)return;e.preventDefault();const p=point(e);ctx.strokeStyle=color;ctx.lineWidth=size;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p}
function end(e){if(!drawing)return;e?.preventDefault?.();drawing=false;saveHistory()}
canvas.addEventListener('pointerdown',begin);canvas.addEventListener('pointermove',move);window.addEventListener('pointerup',end);

$('#undoBtn').onclick=()=>{if(history.length<=1)return;history.pop();restore(history[history.length-1])};
$('#clearBtn').onclick=()=>{if(confirm('Очистить свою часть?'))initCanvas(turn?.connectorXs||[])};
function restore(data){const img=new Image();img.onload=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0)};img.src=data}

$('#doneBtn').onclick=()=>{
  const p=$('#previewCanvas'),pc=p.getContext('2d');pc.clearRect(0,0,p.width,p.height);pc.drawImage(canvas,0,0,p.width,p.height);show('confirmView')
};
$('#backToDraw').onclick=()=>show('drawView');
$('#confirmSubmit').onclick=()=>{
  const connectorXs=detectConnectors();
  const btn=$('#confirmSubmit');btn.disabled=true;btn.textContent='Отправляем…';
  socket.emit('turn:submit',{imageData:canvas.toDataURL('image/png'),connectorXs},r=>{
    btn.disabled=false;btn.textContent='Да, отправить';
    if(!r.ok){toast(r.error);show('drawView');return}
    turn=null;show('waitView')
  })
};

function detectConnectors(){
  const w=canvas.width,h=canvas.height,band=56;
  const data=ctx.getImageData(0,h-band,w,band).data;
  const xs=[];
  for(let x=0;x<w;x+=3){
    let ink=0;
    for(let y=0;y<band;y+=3){const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2];const bg=Math.abs(r-246)+Math.abs(g-239)+Math.abs(b-227);if(bg>80)ink++}
    if(ink>=2)xs.push(x/w);
  }
  if(!xs.length)return [.38,.62];
  // two robust clusters: split by largest gap, else quartiles
  let bestGap=0,split=-1;
  for(let i=1;i<xs.length;i++){const g=xs[i]-xs[i-1];if(g>bestGap){bestGap=g;split=i}}
  let a,b;
  if(split>0&&bestGap>.08){a=xs.slice(0,split);b=xs.slice(split)}
  else {const mid=Math.floor(xs.length/2);a=xs.slice(0,mid);b=xs.slice(mid)}
  const mean=arr=>arr.reduce((s,v)=>s+v,0)/Math.max(1,arr.length);
  const out=[mean(a),mean(b)].filter(Number.isFinite).sort((x,y)=>x-y);
  return out.length===2?out:[.38,.62]
}

show(me.id?'waitView':'joinView');
