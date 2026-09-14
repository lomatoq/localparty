(()=>{'use strict';
const $=id=>document.getElementById(id);let ws,state,key='',reconnect,offset=0,selected='',lastPlayers='';
window.PARTY_PROFILE={};window.PARTY_DISPLAY_ONLY=true;
const tell=message=>{$('notice').textContent=message;$('notice').hidden=false;clearTimeout(tell.timer);tell.timer=setTimeout(()=>$('notice').hidden=true,6000);};
const art=id=>'/assets/games/'+(state?.catalog.find(g=>g.id===id)?.artwork||((id==='tankarena'?'tankarena-hd':id)+'.webp'));
const text=(id,value)=>{const node=$(id);value=String(value);if(node.textContent!==value)node.textContent=value;};
let lastHUD='',lastMessage='';
function clock(){if(!state?.active)return;const {ui,session}=state.active;
 const seconds=ui?.endsAt&&!session?.paused?Math.max(0,Math.ceil((ui.endsAt-(Date.now()-offset))/1000)):null;
 text('timer',seconds===null?'':Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'));
}
function hud(force=false){if(!state?.active)return;const {ui,session}=state.active;const game=state.catalog.find(g=>g.id===state.active.id);window.PARTY_UI=ui;window.PARTY_SESSION=session;window.PARTY_GAME=game;
 window.PARTY_ROSTER=state.players;
 const message={roster:state.players,type:'party-ui',ui,session,game,host:true},messageKey=JSON.stringify(message);
 if(force||messageKey!==lastMessage){lastMessage=messageKey;$('gameFrame').contentWindow?.postMessage(message,location.origin);}
 clock();
 const key=JSON.stringify([state.active.instance,ui?.phase,session,state.active.startError,state.players.length]);
 if(!force&&key===lastHUD)return;lastHUD=key;
 const systemPause=session?.pauseReason==='host-background';text('pauseTitle',systemPause?'Ждём iPhone-сервер':'Пауза');text('pauseHint',systemPause?'Откройте LocalParty на iPhone-сервере. Игра продолжится автоматически.':'Ведущий или игрок может продолжить игру с телефона.');$('paused').hidden=!session?.paused;text('phase',session?.paused?'Пауза':({waiting:'Ждём готовности игроков',playing:'Играем',countdown:'На старт',results:'Результаты',reveal:'Итоги хода'}[ui?.phase]||''));
 $('waiting').hidden=ui?.phase!=='waiting';text('waitingTitle',state.active.startError?'Нужен iPhone ведущего':'Готовимся к игре');text('waitingHint',state.active.startError||'Нажмите «Я готов» на своём телефоне');text('readyCount',(session?.readyIds?.length||0)+' / '+state.players.length+' готовы');
}
function render(){if(!state)return;const banner=$('incident');banner.hidden=!state.incident;banner.textContent=state.incident?.message||'';const tallies=new Map();for(const v of state.votes||[])tallies.set(v.gameId,(tallies.get(v.gameId)||0)+1);$('votes').textContent=[...tallies].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([id,n])=>(state.catalog.find(g=>g.id===id)?.title||id)+' · '+n).join('     ');const game=state.catalog.find(g=>g.id===state.active?.id);document.body.classList.toggle('game-owns-hud',game?.engine==='sports_siege');$('play').hidden=!game;$('lobby').hidden=!!game;
$('tvStage').classList.toggle('large-roster',state.players.length>8);
if(game){const next=state.active.instance;if(key!==next){fitScreen();key=next;window.PARTY_INSTANCE=key;$('gameFrame').src='/games/'+game.id+game.host;}$('gameTitle').textContent=game.title;$('gamePlayers').textContent=state.players.length+' в игре';hud();}
else if(key){key='';window.PARTY_INSTANCE=null;$('gameFrame').src='about:blank';}
const choice=state.catalog.find(g=>g.id===state.selected);if(selected!==(choice?.id||'-')){selected=choice?.id||'-';$('preview').hidden=!choice;$('title').textContent=choice?.title||'Собираемся. Играем вместе.';$('description').textContent=choice?.goal||'Выбирайте игру в приложении iPhone. Остальные подключаются по QR-коду.';if(choice){$('cover').src=art(choice.id);$('controls').textContent=choice.controls;$('playersNeeded').textContent=choice.min+'–'+choice.max+' игроков';}const games=choice?[choice,...state.catalog.filter(g=>g.id!==choice.id)]:state.catalog;const tiles=games.slice(0,8).map(g=>{const tile=document.createElement('div');tile.className='tile'+(g.id===choice?.id?' selected':'');const img=new Image();img.src=art(g.id);img.alt='';const name=document.createElement('span');name.textContent=g.title;tile.append(img,name);return tile;});$('catalog').replaceChildren(...tiles);}
const settings=choice?.hostControls?.settings||[];$('settings').textContent=settings.map(f=>f.label+': '+(f.options.find(o=>o.value===state.gameSettings?.[choice.id]?.[f.id])?.label||'')).join(' · ');
const join=state.urls[0]||location.origin+'/';if($('address').textContent!==join){$('address').textContent=join;$('qr').src='/api/qr?url='+encodeURIComponent(join);}
const signature=JSON.stringify(state.players.map(p=>[p.id,p.name]));if(signature!==lastPlayers){lastPlayers=signature;$('count').textContent=state.players.length?state.players.length+' в комнате':'Ждём компанию';$('players').replaceChildren(...state.players.map(p=>{const n=document.createElement('span');n.className='person';n.textContent=p.name;n.title=p.name;return n;}));}
}
function connect(){clearTimeout(reconnect);const channel=ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/lobby');channel.onopen=()=>{if(ws!==channel)return;channel.send(JSON.stringify({type:'display',key:window.PARTY_DISPLAY_KEY}));$('connection').textContent='Подключаем экран…';};channel.onmessage=e=>{if(ws!==channel)return;const m=JSON.parse(e.data);if(m.type==='display-ok')$('connection').textContent='Экран подключён к iPhone';if(m.type==='error'&&m.code==='DISPLAY_AUTH'){location.reload();return;}if(m.type==='state'){state=m;if(m.active?.ui?.serverNow)offset=Date.now()-m.active.ui.serverNow;render();}if(m.type==='game-ui'&&m.instance===state?.active?.instance){state.active.ui=m.ui;offset=Date.now()-m.ui.serverNow;hud();}if(m.type==='session-start')hud();if(m.type==='error')tell(m.message);};channel.onclose=()=>{if(ws!==channel)return;$('connection').textContent='Восстанавливаем связь с iPhone…';reconnect=setTimeout(connect,1200);};channel.onerror=()=>{};}
function fitScreen(){
 const stage=$('tvStage'),layout=window.partyTVLayout(window.innerWidth,window.innerHeight);
 stage.style.width=layout.width+'px';stage.style.height=layout.height+'px';
 stage.style.left=layout.left+'px';stage.style.top=layout.top+'px';
 stage.style.transform='scale('+layout.scale+')';
 stage.style.setProperty('--tv-vw',layout.width/100+'px');
 stage.classList.toggle('tv-compact',layout.width<=1100);
 // offsetTop/offsetHeight are logical pixels. A transformed DOMRect is in
 // receiver pixels and would apply the display scale a second time.
 const play=$('play'),bar=play.querySelector('.gamebar');
 const height=Math.max(1,layout.height-play.offsetTop);
 play.style.height=height+'px';$('gameFrame').style.height=Math.max(1,height-bar.offsetHeight)+'px';
}
fitScreen();
window.addEventListener('resize',fitScreen);
$('gameFrame').addEventListener('load',()=>{fitScreen();hud(true);});setInterval(clock,250);

window.addEventListener('online',()=>{if(ws?.readyState===WebSocket.CLOSED)connect();});connect();
})();