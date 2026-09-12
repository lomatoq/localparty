const socket=io();
const $=s=>document.querySelector(s);
const VIEWS=['joinView','waitView','drawView','confirmView'];
let me={id:localStorage.getItem('mc_playerId'),token:localStorage.getItem('mc_token'),name:localStorage.getItem('mc_name')||'',handedness:localStorage.getItem('mc_hand')||'right'};
let strokeCount=0,activePointer=null,draftTimer=null,loadingCanvas=false;
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
  socket.emit('player:join',{name,handedness:me.handedness,playerId:me.id,token:me.token,partyId:window.PARTY_PROFILE?.id,partyToken:window.PARTY_PROFILE?.token},r=>{
    if(!r.ok){$('#joinError').textContent=r.error;return}
    me.id=r.playerId;me.token=r.token;me.name=r.name;
    localStorage.setItem('mc_playerId',me.id);localStorage.setItem('mc_token',me.token);localStorage.setItem('mc_name',me.name);
    $('#joinError').textContent='';show('waitView');
  })
};

socket.on('connect',()=>{
  const autoJoin=()=>{if(window.PARTY_PROFILE?.name){$('#nameInput').value=window.PARTY_PROFILE.name;$('#joinBtn').click();}else show('joinView');};
  if(me.id&&me.token){socket.emit('player:resume',{playerId:me.id,token:me.token},r=>{if(r.ok){me.id=r.playerId;me.token=r.token;localStorage.setItem('mc_playerId',me.id);localStorage.setItem('mc_token',me.token);me.name=r.name;setHand(r.handedness||me.handedness);show('waitView')}else{me.id=null;me.token=null;localStorage.removeItem('mc_playerId');localStorage.removeItem('mc_token');autoJoin();}})}
  else autoJoin();
});

socket.on('game:state',s=>{
  state=s;
  const mine=s.players.find(p=>p.id===me.id);
  if(!mine && me.id && s.phase==='lobby') { localStorage.removeItem('mc_playerId');localStorage.removeItem('mc_token');me.id=null;me.token=null;show('joinView'); return; }
  if(!mine) return;
  if(s.phase==='lobby'){
    $('#waitTitle').textContent=`В лобби ${s.players.length}/${s.maxPlayers}`;
    $('#waitText').textContent=s.players.length>=2?'Можно начинать. Остальные могут присоединиться позже.':'Нужен ещё один игрок.';
    renderQueue();turn=null;show('waitView');
  } else if(s.phase==='playing'){
    renderQueue();
    if(s.activePlayerId!==me.id && !$('#confirmView').classList.contains('hidden')) show('waitView');
    if(s.activePlayerId!==me.id && $('#drawView').classList.contains('hidden')===false) show('waitView');
    if(s.activePlayerId!==me.id){$('#waitTitle').textContent=`Сейчас рисует ${s.activePlayerName}`;$('#waitText').textContent='Ты в очереди на следующую часть. Продолжай только узкую полоску предыдущего рисунка — всё остальное секрет.';show('waitView')}
  } else if(s.phase==='reveal'){
    turn=null;$('#waitTitle').textContent='Готово!';$('#waitText').textContent='Смотри на большой экран 😈';show('waitView')
  }
});

function renderQueue(){
  if(!state)return;const q=$('#phoneQueue');q.innerHTML='';
  state.players.forEach((p,i)=>{const d=document.createElement('div');d.textContent=(state.phase==='reveal'||i<state.turnIndex?'✓ ':i===state.turnIndex?'✏️ ':'')+p.name+(p.id===me.id?' — ты':'');q.appendChild(d)})
}

socket.on('turn:start',payload=>{turn=payload;startTurn(payload)});
function startTurn(t){
  $('#partLabel').textContent=t.part;
  $('#prompt').textContent=t.prompt;
  $('#turnBadge').textContent=`${t.turnIndex+1}/${t.total}`;
  show('drawView');initCanvas(t.connectorXs||[]);const draft=localStorage.getItem(draftKey());if(draft){try{const d=JSON.parse(draft);strokeCount=d.strokes||0;restore(d.image);}catch{}}else if(t.stripData){loadingCanvas=true;const img=new Image();img.onload=()=>{ctx.drawImage(img,0,0);loadingCanvas=false;history.length=0;saveHistory()};img.src=t.stripData;}
}

const PALETTE=['#171513','#ff5e57','#ff9f43','#feca57','#d9ff57','#48dbfb','#54a0ff','#9b5de5','#ff4f9a','#ffffff'];
const colors=$('#colors');
PALETTE.forEach((c,i)=>{const b=document.createElement('button');b.className='color'+(i===0?' active':'');b.style.background=c;b.onclick=()=>{color=c;document.querySelectorAll('.color').forEach(x=>x.classList.remove('active'));b.classList.add('active')};colors.appendChild(b)});
$('#brushSize').oninput=e=>size=+e.target.value;

function initCanvas(connectorXs){
  ctx.fillStyle='#f6efe3';ctx.fillRect(0,0,canvas.width,canvas.height);
  strokeCount=0;
  history.length=0;saveHistory();
}

function point(e){const r=canvas.getBoundingClientRect();const touch=e.touches?.[0]||e;return{x:(touch.clientX-r.left)*(canvas.width/r.width),y:(touch.clientY-r.top)*(canvas.height/r.height)}}
function saveHistory(){if(history.length>18)history.shift();history.push(canvas.toDataURL('image/png'))}
function draftKey(){return 'mc_draft_'+me.id+'_'+(turn?.roundId||turn?.round)+'_'+turn?.turnIndex}
function saveDraft(){if(!turn)return;try{localStorage.setItem(draftKey(),JSON.stringify({image:canvas.toDataURL('image/png'),strokes:strokeCount}));}catch{toast('Не удалось сохранить черновик на телефоне');}}
function begin(e){e.preventDefault();if(activePointer!==null||loadingCanvas||!turn)return;activePointer=e.pointerId;canvas.setPointerCapture(activePointer);drawing=true;last=point(e);ctx.fillStyle=color;ctx.beginPath();ctx.arc(last.x,last.y,size/2,0,Math.PI*2);ctx.fill();strokeCount++;}
function move(e){if(!drawing||e.pointerId!==activePointer)return;e.preventDefault();const p=point(e);ctx.strokeStyle=color;ctx.lineWidth=size;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;if(!draftTimer)draftTimer=setTimeout(()=>{draftTimer=null;saveDraft()},250);}
function end(e){if(!drawing||(e&&e.pointerId!==undefined&&e.pointerId!==activePointer))return;e?.preventDefault?.();drawing=false;activePointer=null;saveHistory();saveDraft();}
canvas.addEventListener('pointerdown',begin);canvas.addEventListener('pointermove',move);for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,end);window.addEventListener('blur',()=>end());document.addEventListener('visibilitychange',()=>{if(document.hidden){end();saveDraft()}});

$('#undoBtn').onclick=()=>{if(history.length<=1)return;history.pop();restore(history[history.length-1])};
$('#clearBtn').onclick=()=>{if(confirm('Очистить свою часть?')){initCanvas([]);if(turn?.stripData){const img=new Image();img.onload=()=>{ctx.drawImage(img,0,0);saveDraft()};img.src=turn.stripData;}else saveDraft()}};
function restore(data){const img=new Image();img.onload=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0);loadingCanvas=false;saveDraft()};loadingCanvas=true;img.src=data}

$('#doneBtn').onclick=()=>{
  const p=$('#previewCanvas'),pc=p.getContext('2d');pc.clearRect(0,0,p.width,p.height);pc.drawImage(canvas,0,0,p.width,p.height);show('confirmView')
};
$('#backToDraw').onclick=()=>show('drawView');
$('#confirmSubmit').onclick=()=>{
  if(loadingCanvas||!strokeCount)return toast('Нарисуйте свою часть перед отправкой');
  const segment=exportSegment();if(!segment)return toast('Рисунок пока пустой');
  const btn=$('#confirmSubmit');btn.disabled=true;btn.textContent='Отправляем…';
  const submittedDraft=draftKey();socket.emit('turn:submit',segment,r=>{
    btn.disabled=false;btn.textContent='Да, отправить';
    if(!r.ok){toast(r.error);show('drawView');return}
    localStorage.removeItem(submittedDraft);turn=null;show('waitView')
  })
};

function exportSegment(){
 const w=canvas.width,h=canvas.height,pixels=ctx.getImageData(0,0,w,h).data,b=MonsterDrawing.bounds(pixels,w,h,!!turn?.stripData);if(!b)return null;
 const cropped=document.createElement('canvas');cropped.width=w;cropped.height=b.height;cropped.getContext('2d').drawImage(canvas,0,b.top,w,b.height,0,0,w,b.height);
 const stripHeight=Math.min(MonsterDrawing.STRIP,b.height),strip=document.createElement('canvas');strip.width=w;strip.height=stripHeight;strip.getContext('2d').drawImage(cropped,0,b.height-stripHeight,w,stripHeight,0,0,w,stripHeight);
 const connectorXs=MonsterDrawing.connectors(cropped.getContext('2d').getImageData(0,0,w,b.height).data,w,b.height);
 return{imageData:cropped.toDataURL('image/png'),height:b.height,stripData:strip.toDataURL('image/png'),stripHeight,connectorXs,overlap:turn?.overlap||0,strokes:strokeCount};
}
setInterval(()=>{if(!turn)return;const left=Math.max(0,Math.ceil((turn.turnDeadline-Date.now())/1000));$('#turnTimer').textContent=left?left+' сек':'Можно заканчивать';},250);
socket.on('player:replaced',()=>{end();saveDraft();toast('Игрок подключился в другой вкладке');});
show(me.id?'waitView':'joinView');

