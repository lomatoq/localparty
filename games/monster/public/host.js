const socket = io();
const $ = (s) => document.querySelector(s);
let state = null;
let latestReveal = null;
let currentIp = null;

function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.add('hidden'),2400)}

async function loadInfo(ip){
  const q = ip ? `?host=${encodeURIComponent(ip)}` : '';
  try {
    const r = await fetch('/api/info'+q, { cache: 'no-store' });
    const info = await r.json();
    if (!currentIp) currentIp = info.selectedIp || info.ips?.[0]?.ip || 'localhost';

    const qr = $('#qr');
    qr.src = info.qr || '';
    qr.classList.toggle('qr-missing', !info.qr);
    $('#joinUrl').textContent = info.playUrl;

    const status = $('#qrStatus');
    if (info.lanReady) {
      status.textContent = `✓ QR ведёт на этот компьютер по Wi‑Fi: ${currentIp}`;
      status.className = 'qr-status ok';
    } else {
      status.textContent = 'Не вижу локальный Wi‑Fi/LAN адрес. Проверь подключение компьютера к сети.';
      status.className = 'qr-status warn';
    }

    const sel=$('#ipSelect');
    sel.innerHTML='';
    for(const x of info.ips || []){
      const o=document.createElement('option');
      o.value=x.ip;
      const tag = x.virtual ? 'виртуальная' : (x.private ? 'LAN' : 'сеть');
      o.textContent=`${x.ip} — ${x.name} · ${tag}`;
      sel.appendChild(o);
    }
    if(!(info.ips || []).length){
      const o=document.createElement('option');o.value='localhost';o.textContent='локальный адрес не найден';sel.appendChild(o)
    }
    if ([...sel.options].some(o => o.value === currentIp)) sel.value=currentIp;
  } catch (e) {
    $('#qrStatus').textContent = 'Не удалось создать QR';
    $('#qrStatus').className = 'qr-status warn';
  }
}

$('#ipSelect').addEventListener('change',e=>{currentIp=e.target.value;loadInfo(currentIp)});
$('#copyJoinUrl').addEventListener('click', async ()=>{
  try { await navigator.clipboard.writeText($('#joinUrl').textContent); toast('Ссылка скопирована'); }
  catch { toast('Не удалось скопировать'); }
});
$('#applyConfig').addEventListener('click',()=>{
  socket.emit('host:set-config',{maxPlayers:+$('#maxPlayers').value,promptMode:$('#promptMode').value},r=>{if(!r.ok)toast(r.error);else toast('Настройки применены')});
});
$('#startGame').addEventListener('click',()=>socket.emit('host:start',{},r=>{if(!r.ok)toast(r.error)}));
$('#nextRound').addEventListener('click',()=>socket.emit('host:next-round',{},r=>{if(!r.ok)toast(r.error)}));
$('#resetLobby').addEventListener('click',()=>socket.emit('host:reset',{},r=>{if(!r.ok)toast(r.error)}));
$('#downloadArt').addEventListener('click',()=>{
  const c=$('#revealCanvas'); const a=document.createElement('a'); a.href=c.toDataURL('image/png'); a.download=`monster-circle-round-${state?.round||1}.png`; a.click();
});

function render(s){
  state=s;
  $('#roundBadge').textContent=s.phase==='lobby'?'ЛОББИ':`РАУНД ${s.round}`;
  $('#lobbyPanel').classList.toggle('hidden',s.phase!=='lobby');
  $('#gamePanel').classList.toggle('hidden',s.phase!=='playing');
  $('#revealPanel').classList.toggle('hidden',s.phase!=='reveal');
  $('#playerCounter').textContent=`${s.players.length} / ${s.maxPlayers}`;
  $('#maxPlayers').value=s.maxPlayers;
  $('#startGame').disabled=s.players.filter(p=>p.connected).length<2;

  const list=$('#players'); list.innerHTML='';
  s.players.forEach((p,i)=>{
    const row=document.createElement('div');row.className='player-row';
    row.innerHTML=`<div class="avatar">${i+1}</div><div class="name"></div><div class="dot ${p.connected?'online':''}"></div><button class="kick" title="Удалить">×</button>`;
    row.querySelector('.name').textContent=p.name;
    row.querySelector('.kick').onclick=()=>socket.emit('host:kick',{playerId:p.id},r=>{if(!r.ok)toast(r.error)});
    list.appendChild(row);
  });

  if(s.phase==='playing'){
    $('#activePlayer').textContent=s.activePlayerName||'—';
    $('#progressText').textContent=`${s.completed} / ${s.total}`;
    const q=$('#queue');q.innerHTML='';
    s.players.forEach((p,i)=>{const e=document.createElement('div');e.className='queue-chip '+(i<s.turnIndex?'done':i===s.turnIndex?'active':'');e.textContent=(i<s.turnIndex?'✓ ':i===s.turnIndex?'✏️ ':'')+p.name;q.appendChild(e)});
  }
  if(s.phase==='reveal' && latestReveal) drawReveal(latestReveal);
}

socket.on('game:state',render);
socket.on('round:reveal',payload=>{latestReveal=payload;drawReveal(payload)});

function drawReveal(payload){
  $('#revealTitle').textContent=`Раунд ${payload.round}: ${payload.segments.length} частей хаоса`;
  const images=[]; let loaded=0;if(!payload.segments.length){const c=$('#revealCanvas');c.width=720;c.height=1;return;}
  payload.segments.forEach((seg,i)=>{const img=new Image();img.onload=()=>{images[i]=img;loaded++;if(loaded===payload.segments.length)compose(images,payload.segments)};img.src=seg.imageData});
  const credits=$('#credits');credits.innerHTML='';
  payload.segments.forEach(seg=>{const d=document.createElement('div');d.className='credit';d.innerHTML=`<b></b> · <span></span>`;d.querySelector('b').textContent=seg.playerName;d.querySelector('span').textContent=`${seg.part}: ${seg.prompt}`;credits.appendChild(d)});
}

function compose(images,segments){
 const c=$('#revealCanvas'),layout=MonsterDrawing.layout(segments.map((s,i)=>({height:images[i].height,overlap:s.overlap||0})));c.width=720;c.height=Math.max(1,layout.height);const ctx=c.getContext('2d');ctx.fillStyle='#f6efe3';ctx.fillRect(0,0,c.width,c.height);images.forEach((img,i)=>ctx.drawImage(img,0,layout.items[i].y));
}
$('#skipTurn').onclick=()=>{if(confirm('Пропустить эту часть? Несохранённый рисунок останется в черновике игрока.'))socket.emit('host:skip',{},r=>{if(!r.ok)toast(r.error)})};
setInterval(()=>{if(state?.phase!=='playing')return;const left=Math.max(0,Math.ceil((state.turnDeadline-Date.now())/1000));$('#hostTurnTimer').textContent=left?left+' сек':'Время вышло · можно закончить';const active=state.players.find(p=>p.id===state.activePlayerId);$('#skipTurn').disabled=!!active?.connected&&left>0;},250);

loadInfo();
