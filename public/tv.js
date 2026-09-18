/* Shared desktop-style catalog for the native menu and the display-only TV.
   All assets/classes come from the existing desktop launcher. The second IIFE
   starts TV transport ONLY when #tvStage exists; loading this in partyapp://
   never opens a network connection or grants host authority. */
(() => {
  'use strict';
  if (window.LocalPartyCatalog) return;
  const freshIds = Object.freeze(['curling','bowling','swarm_gate','peek_shoot','taprace','punchmeter','flappy','hungry','snakelines','carryball']);
  const logic = new Set(['chaos','jenga','crane','naval','millionaire','warsaw','sinyakquiz']);
  const party = new Set(['monster','spy','crocodile','drawguess']);
  const colors = {
    push:['#a96aff','#5ce9ef'],shrink:['#31dfff','#9760ff'],knives:['#ff5977','#41d7ef'],bomb:['#ae54ff','#ff9f35'],western:['#ffac43','#a75bff'],tanks:['#b4ec35','#8c55ff'],tankarena:['#b6fa32','#a45cff'],chaos:['#9b58ff','#17cfff'],kart:['#ff634b','#c0ef3a'],monster:['#25d8e5','#aa65f6'],spy:['#b56aff','#f5bf51'],millionaire:['#ffc949','#33dfff'],sinyakquiz:['#bcf735','#a663ff'],warsaw:['#efbb60','#b0ec3b'],crocodile:['#a8ec32','#a866ef'],jenga:['#f4b24e','#a872f5'],crane:['#ffcc36','#19cfe9'],naval:['#28d7f0','#8c68ef'],drawguess:['#9f63f5','#b5ed35'],western_duel:['#b363f5','#ffc440'],taprace:['#ffc04d','#be63f3'],punchmeter:['#ff6589','#ae63f5'],flappy:['#3adef5','#b259ff'],hungry:['#b2ef39','#ffad3e'],snakelines:['#b4ed3f','#a86bff'],carryball:['#36dbe9','#a7e83d']
  };
  const category = g => logic.has(g.id) ? 'logic' : party.has(g.id) ? 'party' : 'action';
  const artPath = g => {
    const fallback = ['curling','bowling','swarm_gate','peek_shoot'].includes(g.id) ? g.id+'.png' : (g.id==='tankarena'?'tankarena-hd':g.id)+'.webp';
    const file = g.artwork || fallback;
    return /^[a-zA-Z0-9_.-]+\.(webp|png|jpg|jpeg)$/i.test(file) ? '/assets/games/'+file : '';
  };
  const matches = (g, query, filter) => (!query || String(g.title).toLocaleLowerCase().includes(query)) &&
    (filter==='all' || filter==='fresh' && freshIds.includes(g.id) || filter==='arcade' && g.section!=='table' || filter==='table' && g.section==='table' || category(g)===filter);
  const node = (tag, cls, text) => {const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
  function create(root, {displayOnly=false, onSelect=()=>{}}={}) {
    let signature='', cards=new Map(), latest=[], groups=[], track=null, arrows=[], resize=null, frame=0;
    root.classList.add('lp-catalog');root.classList.toggle('lp-display-catalog',displayOnly);
    const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
    function railBounds() {
      if(!track)return;
      const max=Math.max(0,track.scrollWidth-track.clientWidth), x=Math.max(0,track.scrollLeft);
      if(arrows.length){arrows[0].disabled=x<2;arrows[1].disabled=x>max-2;}
      track.style.setProperty('--fresh-fade-left',x>2?'22px':'0px');
      track.style.setProperty('--fresh-fade-right',x<max-2?'22px':'0px');
    }
    function scheduleBounds(){cancelAnimationFrame(frame);frame=requestAnimationFrame(railBounds);}
    function moveRail(direction) {
      if(!track)return;
      track.scrollBy({left:direction*Math.max(1,track.clientWidth-32),behavior:reduced()?'auto':'smooth'});
    }
    function makeCard(g, index, featured) {
      const card=node(displayOnly?'article':'button','game lp-catalog-card'+(featured?' featured':''));
      card.dataset.game=g.id;card.dataset.id=g.id;card.dataset.category=category(g);
      if(!displayOnly){card.type='button';card.setAttribute('aria-haspopup','dialog');card.addEventListener('click',()=>onSelect(g.id));}
      card.setAttribute('aria-label',`${g.title}, ${g.min}–${g.max} игроков`);
      const palette=colors[g.id]||[g.color,g.secondaryColor||g.color];
      palette.forEach((v,i)=>{if(/^#[a-f\d]{6}$/i.test(v||''))card.style.setProperty(i?'--card-secondary':'--card',v);});
      const art=node('div','art'), img=node('img','symbol');img.src=artPath(g);img.alt='';img.loading=index<5?'eager':'lazy';img.decoding='async';img.draggable=false;
      img.addEventListener('error',()=>{img.hidden=true;card.classList.add('lp-art-missing');},{once:true});
      art.append(node('span','tag',g.tag||({logic:'Логика',party:'Вечеринка',action:'Экшен'}[category(g)])),node('span','number',String(index+1).padStart(2,'0')),img);
      if(featured)art.append(node('span','featured-label','✳ Выбор вечера'));
      const info=node('div','game-info');info.append(node('h3','',g.title),node('p','',g.description||g.goal||''));
      const bottom=node('div','game-bottom');bottom.append(node('span','lp-player-range',`${g.min}–${g.max} игроков`),node('span','start-game',displayOnly?'На телефонах ↗':'Выбрать ↗'));
      const votes=node('span','lp-card-votes');votes.hidden=true;info.append(bottom,votes);card.append(art,info);return card;
    }
    function group(title, fresh=false, table=false) {
      const box=node('section',fresh?'fresh-section lp-fresh-section':'lp-catalog-section');box.dataset.catalogGroup=fresh?'fresh':table?'table':'arcade';
      const heading=node('div',fresh?'fresh-heading':'section-title'),copy=node('div',fresh?'fresh-copy':'');
      if(fresh)copy.append(node('span','fresh-badge','ФРЕШ'));
      copy.append(node('h2','',title));if(fresh)copy.append(node('p','','Новые поводы сказать «ещё раз».'));
      heading.append(copy);const count=node('span','lp-group-count');heading.append(count);
      const grid=node('div',fresh?'fresh-track':'games'+(table?' table-games':''));
      if(fresh){
        track=grid;track.setAttribute('aria-label','Фреш — новые игры');
        if(!displayOnly){
          const buttons=node('div','fresh-arrows');arrows=[-1,1].map(d=>{const b=node('button','fresh-arrow',d<0?'←':'→');b.type='button';b.setAttribute('aria-label',d<0?'Предыдущие новые игры':'Следующие новые игры');b.onclick=()=>moveRail(d);buttons.append(b);return b;});heading.append(buttons);
        }
        track.addEventListener('scroll',scheduleBounds,{passive:true});
      }
      box.append(heading,grid);root.append(box);const data={box,grid,count};groups.push(data);return data;
    }
    function rebuild(games) {
      const oldScroll=track?.scrollLeft||0;
      resize?.disconnect();cancelAnimationFrame(frame);root.replaceChildren();cards.clear();groups=[];arrows=[];track=null;
      // TV: the featured bento block comes first; Fresh sits after its two rows (row 3).
      let fresh,main,rest=null;
      if(displayOnly){main=group('Во что влетаем?');fresh=group('Свежая партия.',true);
        const box=node('section','lp-catalog-section lp-catalog-continued');box.dataset.catalogGroup='arcade-more';rest=node('div','games');box.append(rest);root.append(box);main.extra=rest;main.extraBox=box;}
      else {fresh=group('Свежая партия.',true);main=group('Во что влетаем?');}
      const table=group('Слова, секреты и внезапные таланты.',false,true);
      const ordered=[...games].sort((a,b)=>Number(b.id==='tankarena')-Number(a.id==='tankarena'));
      let lead=0;
      for(const g of ordered){const index=games.findIndex(x=>x.id===g.id),card=makeCard(g,index,g.id==='tankarena');cards.set(g.id,card);if(freshIds.includes(g.id))continue;
        if(g.section==='table')table.grid.append(card);else if(rest&&lead>=3)rest.append(card);else{main.grid.append(card);lead++;}}
      freshIds.forEach(id=>{if(cards.has(id))fresh.grid.append(cards.get(id));});
      if(track){track.scrollLeft=oldScroll;if(typeof ResizeObserver==='function'){resize=new ResizeObserver(scheduleBounds);resize.observe(track);}}
      scheduleBounds();
    }
    function update(state,{query='',filter='all',disabled=false}={}) {
      latest=(state.catalog||[]).filter(g=>g&&typeof g.id==='string'&&typeof g.title==='string');
      const next=JSON.stringify(latest);if(next!==signature){signature=next;rebuild(latest);}
      const tallies=new Map();(state.votes||[]).forEach(v=>tallies.set(v.gameId,(tallies.get(v.gameId)||0)+1));
      const visible=[];query=query.trim().toLocaleLowerCase();
      for(const g of latest){
        const card=cards.get(g.id);card.hidden=!matches(g,query,filter);if(!card.hidden)visible.push(g);
        const selected=g.id===(state.tv?.browse?state.tv.focusId:state.selected);card.classList.toggle('selected',selected);
        if(!displayOnly){card.disabled=Boolean(disabled);card.setAttribute('aria-pressed',String(selected));}else{selected?card.setAttribute('aria-current','true'):card.removeAttribute('aria-current');}
        const n=tallies.get(g.id)||0,votes=card.querySelector('.lp-card-votes');votes.hidden=!n;
        const text=`Голосов: ${n}`;if(votes.textContent!==text)votes.textContent=text;
      }
      groups.forEach(({box,grid,count,extra,extraBox})=>{const shown=g=>[...g.children].filter(c=>!c.hidden).length;const more=extra?shown(extra):0,n=shown(grid)+more;box.hidden=!n;if(extraBox)extraBox.hidden=!more;const text=`${n} игр`;if(count.textContent!==text)count.textContent=text;});
      scheduleBounds();return visible;
    }
    function revealFresh(id){const card=cards.get(id);if(track&&card?.parentElement===track){const x=card.offsetLeft;track.scrollTo({left:Math.max(0,x-24),behavior:reduced()?'auto':'smooth'});}}
    function advanceFresh(){if(!track||track.closest('[hidden]'))return;const max=track.scrollWidth-track.clientWidth;if(max<2)return;if(track.scrollLeft>=max-3)track.scrollTo({left:0,behavior:reduced()?'auto':'smooth'});else moveRail(1);}
    return Object.freeze({update,revealFresh,advanceFresh,destroy(){resize?.disconnect();cancelAnimationFrame(frame);root.replaceChildren();cards.clear();}});
  }
  window.LocalPartyCatalog=Object.freeze({create,artPath,freshIds,category,matches,revision:'desktop-fresh-20260918.1'});
})();

(()=>{'use strict';
const $=id=>document.getElementById(id);if(!$('tvStage'))return;
// The TV hosts test bots for the iPhone room exactly like the computer host page does.
let botProfiles=[];
let ws,state,key='',reconnect,offset=0,selected='',lastPlayers='',lastStandings='',accessClosed=false;
window.PARTY_PROFILE={};window.PARTY_DISPLAY_ONLY=true;
const catalog=window.LocalPartyCatalog.create($('tvCatalog'),{displayOnly:true});
const show=window.LocalPartyShow?.create($('tvStage'));
window.LocalPartyTVShow=show;
const tell=message=>{$('notice').textContent=message;$('notice').hidden=false;clearTimeout(tell.timer);tell.timer=setTimeout(()=>$('notice').hidden=true,6000);};
const art=id=>window.LocalPartyCatalog.artPath(state.catalog.find(g=>g.id===id));
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
 const systemPause=session?.pauseReason==='host-background';text('pauseTitle',systemPause?'Ждём ведущего':'Пауза');text('pauseHint',systemPause?'Откройте LocalParty на iPhone ведущего. Игра продолжится автоматически.':'Ведущий или игрок может продолжить игру с телефона.');$('paused').hidden=!session?.paused;text('phase',session?.paused?'Пауза':({waiting:'Ждём готовности игроков',playing:'Играем',countdown:'На старт',results:'Результаты',reveal:'Итоги хода'}[ui?.phase]||''));
 $('waiting').hidden=ui?.phase!=='waiting';text('waitingTitle',state.active.startError?'Нужен iPhone ведущего':'Готовимся к игре');text('waitingHint',state.active.startError||'Нажмите «Я готов» на своём телефоне');text('readyCount',(session?.readyIds?.length||0)+' / '+state.players.length+' готовы');
}
function render(){if(!state?.catalog||!state?.players)return;
 const banner=$('incident');banner.hidden=!state.incident;banner.textContent=state.incident?.message||'';
 const game=state.catalog.find(g=>g.id===state.active?.id);document.body.classList.toggle('game-owns-hud',game?.engine==='sports_siege');document.body.classList.toggle('tv-in-game',!!game);$('play').hidden=!game;$('lobby').hidden=!!game;
 const crowd=state.players.length;$('tvStage').classList.toggle('large-roster',crowd>8);
 // The people column widens smoothly as the room fills, so every player stays on screen.
 $('tvStage').classList.toggle('roster-mid',crowd>5&&crowd<=10);$('tvStage').classList.toggle('roster-big',crowd>10);
 if(game){const next=state.active.instance;if(key!==next){fitScreen();key=next;window.PARTY_INSTANCE=key;$('gameFrame').src='/games/'+game.id+game.host;}text('gameTitle',game.title);text('gamePlayers',state.players.length+' в игре');hud();}
 else if(key){key='';window.PARTY_INSTANCE=null;$('gameFrame').src='about:blank';lastHUD='';lastMessage='';fitScreen();}
 // Do not rebuild or animate the offscreen catalog for per-frame game traffic.
 if(!game){
  catalog.update(state);text('tvGameCount',state.catalog.length+' игр');
  const choice=state.tv?.browse?null:state.catalog.find(g=>g.id===state.selected);$('preview').hidden=!choice;$('tvStage').classList.toggle('tv-has-choice',!!choice);
  if(selected!==(choice?.id||'-')){selected=choice?.id||'-';if(choice){$('cover').hidden=false;$('cover').src=art(choice.id);$('cover').onerror=()=>{$('cover').hidden=true;};text('choiceTitle',choice.title);text('description',choice.goal||choice.description||'');text('controls',choice.controls||'');text('playersNeeded',choice.min+'–'+choice.max+' игроков');catalog.revealFresh(choice.id);}$('tvBrowse').scrollTop=0;}
  const settings=choice?.hostControls?.settings||[];text('settings',settings.map(f=>f.label+': '+(f.options.find(o=>o.value===state.gameSettings?.[choice.id]?.[f.id])?.label||'')).join(' · '));
  const votes=(state.votes||[]).filter(v=>v.gameId===choice?.id).length;text('votes',votes?'За этот выбор: '+votes:'');
 }
 const sharing=state.networkEnabled!==false&&state.urls.length>0;for(const id of ['qr','qrCaption','address'])$(id).hidden=!sharing;
 text('inviteHint',sharing?'Один Wi-Fi. И ты в игре.':'Для гостей включите доступ по Wi-Fi на iPhone.');
 const join=state.urls[0]||'';if($('address').textContent!==join){text('address',join);if(join)$('qr').src='/api/qr?url='+encodeURIComponent(join);}
 const signature=JSON.stringify(state.players.map(p=>[p.id,p.name,p.avatar]));if(signature!==lastPlayers){lastPlayers=signature;text('count',state.players.length+' / 16');$('players').replaceChildren(...state.players.map((p,i)=>{const n=document.createElement('div');n.className='player';const avatar=document.createElement('span');avatar.className='avatar';avatar.style.setProperty('--card',i%2?'#a96aff':'#c8f58b');avatar.textContent=Array.from(p.name||'?')[0];if(typeof p.avatar==='string'&&/^data:image\/(jpeg|png|webp);base64,/.test(p.avatar)){const img=new Image();img.src=p.avatar;img.alt='';avatar.replaceChildren(img);}const name=document.createElement('b');name.textContent=p.name;n.append(avatar,name);return n;}));$('tvEmpty').hidden=!!state.players.length;}
 const leaders=JSON.stringify((state.leaderboard||[]).slice(0,3));if(leaders!==lastStandings){lastStandings=leaders;$('tvLeaders').replaceChildren(...(state.leaderboard||[]).slice(0,3).map((p,i)=>{const row=document.createElement('div');row.className='mini-rank';const rank=document.createElement('span'),name=document.createElement('b'),score=document.createElement('strong');rank.textContent=String(i+1);name.textContent=p.name;score.textContent=String(p.points||0);row.append(rank,name,score);return row;}));$('tvRanking').hidden=!(state.leaderboard||[]).length;}
show?.update(state);
if(botProfiles.length||window.PartyBots?.profiles?.length)window.PartyBots?.update(state,botProfiles.slice(0,state.botCount??botProfiles.length));
}
function connect(){clearTimeout(reconnect);const channel=ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/lobby');channel.onopen=()=>{if(ws!==channel)return;channel.send(JSON.stringify({type:'display',key:window.PARTY_DISPLAY_KEY}));text('connection','Подключаем экран…');};channel.onmessage=e=>{if(ws!==channel)return;const m=JSON.parse(e.data);if(m.type==='display-ok'){show?.setConnected(true);text('connection','Общий экран подключён');$('connection').classList.add('online');}if(m.type==='error'&&m.code==='DISPLAY_AUTH'){location.reload();return;}if(m.type==='access-closed'){accessClosed=true;state={...state,active:null,networkEnabled:false,urls:[]};render();text('connection','Ждём приглашения ведущего');}
if(m.type==='test-profiles'){botProfiles=Array.isArray(m.profiles)?m.profiles:[];if(state)window.PartyBots?.update(state,botProfiles);return;}if(m.type==='state'){accessClosed=false;state=m;if(m.active?.ui?.serverNow)offset=Date.now()-m.active.ui.serverNow;render();}if(m.type==='game-ui'&&m.instance===state?.active?.instance){state.active.ui=m.ui;offset=Date.now()-m.ui.serverNow;hud();show?.update(state);if(botProfiles.length)window.PartyBots?.update(state,botProfiles.slice(0,state.botCount??botProfiles.length));}if(m.type==='session-start')hud();if(m.type==='error')tell(m.message);};channel.onclose=()=>{if(ws!==channel)return;show?.setConnected(false);text('connection',accessClosed?'Доступ по Wi-Fi закрыт ведущим':'Подключаем экран заново…');$('connection').classList.remove('online');reconnect=setTimeout(connect,1200);};channel.onerror=()=>{};}
function fitScreen(){
 const stage=$('tvStage'),layout=window.partyTVLayout(window.innerWidth,window.innerHeight);
 // zoom (not transform) re-lays text/art out at the receiver's real resolution, so a
 // 1080p AirPlay screen is sharp instead of an upscaled 720p bitmap. Own left/top are zoomed too.
 const z=layout.scale;stage.style.transform='none';stage.style.zoom=String(z);stage.style.width=layout.width+'px';stage.style.height=layout.height+'px';stage.style.left=layout.left/z+'px';stage.style.top=layout.top/z+'px';stage.style.setProperty('--tv-vw',layout.width/100+'px');stage.classList.toggle('tv-compact',layout.width<=1100);
 const play=$('play'),bar=play.querySelector('.gamebar');const height=Math.max(1,layout.height-play.offsetTop);play.style.height=height+'px';const frame=$('gameFrame');
 // Games render at the receiver's real resolution (a 1080p TV gives them a native
 // 1920-wide viewport, like the computer host). Only above 1920 px is the viewport
 // capped and scaled up, so 4K keeps desktop-sized game layouts.
 const physicalWidth=layout.width*z,gameScale=Math.max(1,physicalWidth/1920);
 frame.style.zoom=String(1/z);frame.style.flex='none';frame.style.transformOrigin='0 0';
 frame.style.width=physicalWidth/gameScale+'px';frame.style.height=Math.max(1,(height-bar.offsetHeight)*z/gameScale)+'px';
 frame.style.transform=gameScale>1?'scale('+gameScale+')':'none';
}
fitScreen();window.addEventListener('resize',fitScreen);
$('gameFrame').addEventListener('load',()=>{fitScreen();hud(true);show?.gameLoaded();});setInterval(clock,250);
// A TV is not a touchscreen. Quietly reveal the rest of Fresh only while idle.
setInterval(()=>{if(!document.hidden&&show?.canIdle()!==false&&state&&!state.active&&!state.selected&&!matchMedia('(prefers-reduced-motion: reduce)').matches)catalog.advanceFresh();},9000);
// Noninteractive AirPlay has no scroll input: browse the lower catalog while idle.
setInterval(()=>{if(document.hidden||show?.canIdle()===false||!state||state.active||state.selected||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const view=$('tvBrowse'),max=view.scrollHeight-view.clientHeight;if(max>1)view.scrollTo({top:view.scrollTop>=max-2?0:Math.min(max,view.scrollTop+view.clientHeight*.8),behavior:'smooth'});
},18000);
window.addEventListener('online',()=>{if(ws?.readyState===WebSocket.CLOSED)connect();});connect();
})();
