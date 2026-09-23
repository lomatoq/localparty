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
  function create(root, {displayOnly=false, onSelect=()=>{}, onLaunch=null}={}) {
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
      const directLaunch=!displayOnly&&typeof onLaunch==='function';
      const card=node(displayOnly||directLaunch?'article':'button','game lp-catalog-card'+(featured?' featured':''));
      card.dataset.game=g.id;card.dataset.id=g.id;card.dataset.category=category(g);
      if(!displayOnly&&!directLaunch){card.type='button';card.setAttribute('aria-haspopup','dialog');card.addEventListener('click',()=>onSelect(g.id));}
      card.setAttribute('aria-label',`${g.title}, ${g.min}–${g.max} игроков`);
      const palette=colors[g.id]||[g.color,g.secondaryColor||g.color];
      palette.forEach((v,i)=>{if(/^#[a-f\d]{6}$/i.test(v||''))card.style.setProperty(i?'--card-secondary':'--card',v);});
      const art=node('div','art'), img=node('img','symbol');img.src=artPath(g);img.alt='';img.loading=index<5?'eager':'lazy';img.decoding='async';img.draggable=false;
      // The same illustration continues behind the caption, softly defocused.
      card.style.setProperty('--lp-card-art',`url("${artPath(g)}")`);
      img.addEventListener('error',()=>{img.hidden=true;card.classList.add('lp-art-missing');},{once:true});
      art.append(node('span','tag',g.tag||({logic:'Логика',party:'Вечеринка',action:'Экшен'}[category(g)])),node('span','number',String(index+1).padStart(2,'0')),img);
      if(featured)art.append(node('span','featured-label','✳ Выбор вечера'));
      const info=node('div','game-info');info.append(node('h3','',g.title),node('p','',g.description||g.goal||''));
      const bottom=node('div','game-bottom');bottom.append(node('span','lp-player-range',`${g.min}–${g.max} игроков`));
      if(directLaunch){const rules=node('button','lp-card-open quiet','Правила'),start=node('button','lp-direct-start start-game','Старт ▶');rules.type=start.type='button';rules.onclick=()=>onSelect(g.id);start.onclick=()=>{window.LocalPartyUIFeel?.release?.(start);onLaunch(g.id);};bottom.append(rules,start);}
      else bottom.append(node('span','start-game',displayOnly?'На телефонах ↗':'Выбрать ↗'));
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
        if(g.section==='table')table.grid.append(card);else if(rest&&lead>=5)rest.append(card);else{main.grid.append(card);lead++;}}
      freshIds.forEach(id=>{if(cards.has(id))fresh.grid.append(cards.get(id));});
      if(track){track.scrollLeft=oldScroll;if(typeof ResizeObserver==='function'){resize=new ResizeObserver(scheduleBounds);resize.observe(track);}}
      scheduleBounds();
    }
    function update(state,{query='',filter='all',disabled=false,pendingId=null}={}) {
      latest=(state.catalog||[]).filter(g=>g&&typeof g.id==='string'&&typeof g.title==='string');
      const next=JSON.stringify(latest);if(next!==signature){signature=next;rebuild(latest);}
      const tallies=new Map();(state.votes||[]).forEach(v=>tallies.set(v.gameId,(tallies.get(v.gameId)||0)+1));
      const mostVotes=Math.max(0,...tallies.values());
      const mostPlayed=Math.max(0,...Object.values(state.gamePopularity||{}).map(Number));
      const visible=[];query=query.trim().toLocaleLowerCase();
      for(const g of latest){
        const card=cards.get(g.id);card.hidden=!matches(g,query,filter);if(!card.hidden)visible.push(g);
        const selected=g.id===(state.tv?.browse?state.tv.focusId:state.selected);card.classList.toggle('selected',selected);
        const running=state.active?.id===g.id;card.classList.toggle('is-running',running);card.classList.toggle('is-launching',pendingId===g.id);
        if(!displayOnly){if('disabled' in card)card.disabled=Boolean(disabled);card.querySelectorAll('button').forEach(button=>{button.disabled=Boolean(disabled);});card.setAttribute('aria-pressed',String(selected));}else{selected?card.setAttribute('aria-current','true'):card.removeAttribute('aria-current');}
        const launch=card.querySelector('.lp-direct-start');if(launch){launch.textContent=pendingId===g.id?'Запускаем…':running?'Сейчас играем':'Старт ▶';launch.disabled=Boolean(disabled||running);launch.setAttribute('aria-busy',String(pendingId===g.id));}
        card.classList.toggle('most-played',mostPlayed>0&&Number(state.gamePopularity?.[g.id])===mostPlayed);
        const n=tallies.get(g.id)||0,votes=card.querySelector('.lp-card-votes');votes.hidden=!n;
        const leader=n>=2&&n===mostVotes;card.classList.toggle('vote-leader',leader);card.classList.toggle('vote-popular',n>=2);card.style.setProperty('--vote-share',String(n/Math.max(1,state.players?.length||mostVotes)));
        const text=leader?`Лидер голосования · ${n}`:`${n} ${n===1?'голос':n<5?'голоса':'голосов'}`;if(votes.textContent!==text)votes.textContent=text;
      }
      groups.forEach(({box,grid,count,extra,extraBox})=>{const shown=g=>[...g.children].filter(c=>!c.hidden).length;const more=extra?shown(extra):0,n=shown(grid)+more;box.hidden=!n;if(extraBox)extraBox.hidden=!more;const total=displayOnly&&box.dataset.catalogGroup==='arcade'?visible.length:n;const text=`${total} игр`;if(count.textContent!==text)count.textContent=text;});
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
let lastHUD='',lastMessage='',tvInfo=null,tvInfoAt=0,tvInfoInstance=null,displayConnected=false;
function information(){
 if(!state?.active||!window.LocalPartyTVInformation)return null;
 const game=state.catalog.find(g=>g.id===state.active.id),ui=state.active.ui;
 const base=window.LocalPartyTVInformation.normalize({game,ui,now:Date.now()-offset,paused:!!state.active.session?.paused});
 const fresh=tvInfoInstance===state.active.instance&&Date.now()-tvInfoAt<2000;
 const info=fresh?{...tvInfo,paused:base.paused,objective:tvInfo.objective||base.objective}:base;
 if(base.paused){info.phaseLabel='Пауза';info.timer=null;}
 if(!displayConnected){info.phaseLabel='Восстанавливаем связь';info.timer=null;}
 let seconds=info.timer?.remainingSeconds;
 if(info.timer?.clock==='epoch-ms')seconds=Math.max(0,(info.timer.endsAt-(Date.now()-offset))/1000);
 else if(fresh&&Number.isFinite(seconds)&&!info.paused)seconds=Math.max(0,seconds-(Date.now()-tvInfoAt)/1000);
 const formatted=Number.isFinite(seconds)?Math.floor(Math.ceil(seconds)/60)+':'+String(Math.ceil(seconds)%60).padStart(2,'0'):'';
 const scoreMetric=(info.metrics||[]).find(m=>['goals','teams'].includes(m.key));
 const primary=info.family==='live'&&scoreMetric?String(scoreMetric.value):info.family==='mission'&&info.progress?info.progress:formatted||info.actor||info.phaseLabel||info.title||'';
 const phase=info.phaseLabel||info.statusLabel||'';
 const translate=value=>window.PartyI18n?.t?.(value)||value;
 const bar=$('play').querySelector('.gamebar');bar.dataset.family=info.family||'live';bar.dataset.coverage=info.coverage;bar.classList.toggle('is-paused',info.paused);bar.classList.toggle('is-reconnecting',!displayConnected);
 $('gameContext').toggleAttribute('data-no-translate',!!(formatted&&info.actor));$('gameTitle').toggleAttribute('data-no-translate',primary===info.actor);
 text('gameTitle',primary===info.actor?primary:translate(primary));text('gameContext',formatted&&info.actor?info.actor:translate(info.title||''));text('phase',translate(phase));
 $('gameObjective').setAttribute('data-no-translate','');text('gameObjective',(window.PartyI18n?.language==='en'?info.objective?.english:info.objective?.text)||info.objective?.text||info.statusLabel||'');$('gameObjective').dataset.source=info.objective?.kind||'runtime';
 const priorities={wind:0,gate:0,goals:0,pot:0,teams:0,submitted:0,lives:0,alive:0,score:1,arrows:1,queue:1};
 const metrics=[...(info.metrics||[])].filter(m=>!(info.family==='live'&&scoreMetric===m)).sort((a,b)=>(priorities[a.key]??3)-(priorities[b.key]??3)).slice(0,2);
 text('gamePlayers',formatted&&primary!==formatted?`${translate('Осталось')} ${formatted}`:info.progress||((state.active.roster?.length??state.players.length)+' в игре'));
 text('gameMetric',metrics.map(m=>`${translate(m.label)} ${typeof m.value==='number'?Math.round(m.value*10)/10:m.value}`).join(' · '));
 text('timer',formatted);$('timer').hidden=true;window.LocalPartyTVCurrentInformation=info;
 return info;
}
function clock(){if(!state?.active)return;const {ui,session}=state.active;
 information();
}
function hud(force=false){if(!state?.active)return;const {ui,session}=state.active;const game=state.catalog.find(g=>g.id===state.active.id);window.PARTY_UI=ui;window.PARTY_SESSION=session;window.PARTY_GAME=game;
 window.PARTY_ROSTER=state.players;
 const message={roster:state.players,type:'party-ui',ui,session,game,host:true},messageKey=JSON.stringify(message);
 if(force||messageKey!==lastMessage){lastMessage=messageKey;$('gameFrame').contentWindow?.postMessage(message,location.origin);}
 clock();
 const key=JSON.stringify([state.active.instance,ui?.phase,session,state.active.startError,state.active.roster||state.players]);
 if(!force&&key===lastHUD)return;lastHUD=key;
 const systemPause=session?.pauseReason==='host-background';text('pauseTitle',systemPause?'Ждём ведущего':'Пауза');text('pauseHint',systemPause?'Откройте HeyPals на iPhone ведущего. Игра продолжится автоматически.':'Ведущий или игрок может продолжить игру с телефона.');$('paused').hidden=!session?.paused;
 $('waiting').hidden=ui?.phase!=='waiting';$('waiting').style.setProperty('--tv-waiting-art',`url("${art(state.active.id)}")`);text('waitingTitle',state.active.startError?'Нужен iPhone ведущего':'Готовимся к игре');
 const roster=state.active.roster||state.players,ready=new Set(session?.readyIds||[]),missing=roster.filter(p=>!p.testBot&&(!p.connected||!p.gameReady));
 text('waitingHint',state.active.startError||(missing.length?'Ждём подключение: '+missing.map(p=>p.name).join(', '):'Нажмите «Я готов» на своём телефоне'));
 $('readyPlayers').replaceChildren(...roster.map(p=>{const chip=document.createElement('span');chip.className='ready-player '+(ready.has(p.id)?'is-ready':!p.connected?'is-missing':p.gameReady?'is-waiting':'is-loading');const status=document.createElement('span'),name=document.createElement('span');status.className='ready-status';status.textContent=ready.has(p.id)?'✓':!p.connected?'○':p.gameReady?'…':'↻';name.className='ready-name';name.dataset.noTranslate='';name.textContent=p.name;chip.append(status,name);return chip;}));
 text('readyCount',ready.size+' / '+roster.length+' готовы');
}
function render(){if(!state?.catalog||!state?.players)return;
 const banner=$('incident');banner.hidden=!state.incident;banner.textContent=state.incident?.message||'';
 const game=state.catalog.find(g=>g.id===state.active?.id);document.body.classList.toggle('game-owns-hud',game?.engine==='sports_siege'||game?.id==='bow_club');document.body.classList.toggle('tv-in-game',!!game);$('play').hidden=!game;$('lobby').hidden=!!game;
 $('tvStage').classList.remove('large-roster','roster-mid','roster-big');
 // People-card density follows measured overflow: fitRoster() (fixed column width).
 if(game){const next=state.active.instance;if(key!==next){tvInfo=null;tvInfoInstance=null;fitScreen();key=next;window.PARTY_INSTANCE=key;$('gameFrame').src='/games/'+game.id+game.host;}hud();}
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
 const signature=JSON.stringify(state.players.map(p=>[p.id,p.name,p.avatar]));if(signature!==lastPlayers){lastPlayers=signature;text('count',state.players.length+' / 16');$('players').replaceChildren(...state.players.map((p,i)=>{const n=document.createElement('div');n.className='player';const avatar=document.createElement('span');avatar.className='avatar';avatar.style.setProperty('--card',i%2?'#a96aff':'#c8f58b');avatar.textContent=Array.from(p.name||'?')[0];if(typeof p.avatar==='string'&&(/^data:image\/(jpeg|png|webp);base64,/.test(p.avatar)||/^\/api\/avatar\/[a-f0-9]{16}\?v=\d+$/.test(p.avatar))){const img=new Image();img.src=p.avatar;img.alt='';avatar.replaceChildren(img);}const name=document.createElement('b');name.textContent=p.name;n.append(avatar,name);return n;}));$('tvEmpty').hidden=!!state.players.length;}
 const leaders=JSON.stringify((state.leaderboard||[]).slice(0,3));if(leaders!==lastStandings){lastStandings=leaders;$('tvLeaders').replaceChildren(...(state.leaderboard||[]).slice(0,3).map((p,i)=>{const row=document.createElement('div');row.className='mini-rank';const rank=document.createElement('span'),name=document.createElement('b'),score=document.createElement('strong');rank.textContent=String(i+1);name.textContent=p.name;score.textContent=String(p.points||0);row.append(rank,name,score);return row;}));$('tvRanking').hidden=!(state.leaderboard||[]).length;}
if(!game)queueRosterFit();
show?.update(state);
if(botProfiles.length||window.PartyBots?.profiles?.length)window.PartyBots?.update(state,botProfiles.slice(0,state.botCount??botProfiles.length));
}
function connect(){clearTimeout(reconnect);const channel=ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/lobby');channel.onopen=()=>{if(ws!==channel)return;channel.send(JSON.stringify({type:'display',key:window.PARTY_DISPLAY_KEY}));text('connection','Подключаем экран…');};channel.onmessage=e=>{if(ws!==channel)return;const m=JSON.parse(e.data);if(m.type==='display-ok'){displayConnected=true;show?.setConnected(true);text('connection','Общий экран подключён');$('connection').classList.add('online');}if(m.type==='error'&&m.code==='DISPLAY_AUTH'){location.reload();return;}if(m.type==='access-closed'){accessClosed=true;state={...state,active:null,networkEnabled:false,urls:[]};render();text('connection','Ждём приглашения ведущего');}
if(m.type==='test-profiles'){botProfiles=Array.isArray(m.profiles)?m.profiles:[];if(state)window.PartyBots?.update(state,botProfiles);return;}if(m.type==='state'){window.PartyI18n?.protectPlayers([...(m.players||[]),...(m.leaderboard||[]),...(m.active?.roster||[])]);window.PartyI18n?.acceptRoomLanguage(m.languageOverride);accessClosed=false;state=m;if(m.active?.ui?.serverNow)offset=Date.now()-m.active.ui.serverNow;render();}if(m.type==='game-ui'&&m.instance===state?.active?.instance){state.active.ui=m.ui;offset=Date.now()-m.ui.serverNow;hud();show?.update(state);if(botProfiles.length)window.PartyBots?.update(state,botProfiles.slice(0,state.botCount??botProfiles.length));}if(m.type==='session-start')hud();if(m.type==='error')tell(m.message);};channel.onclose=()=>{if(ws!==channel)return;displayConnected=false;clock();show?.setConnected(false);text('connection',accessClosed?'Доступ по Wi-Fi закрыт ведущим':'Подключаем экран заново…');$('connection').classList.remove('online');reconnect=setTimeout(connect,1200);};channel.onerror=()=>{};}
function fitScreen(){
 const stage=$('tvStage'),layout=window.partyTVLayout(window.innerWidth,window.innerHeight);
 // zoom (not transform) re-lays text/art out at the receiver's real resolution, so a
 // 1080p AirPlay screen is sharp instead of an upscaled 720p bitmap. Own left/top are zoomed too.
 const z=layout.scale;stage.style.transform='none';stage.style.zoom=String(z);stage.style.width=layout.width+'px';stage.style.height=layout.height+'px';stage.style.left=layout.left/z+'px';stage.style.top=layout.top/z+'px';stage.style.setProperty('--tv-vw',layout.width/100+'px');
 // 16:10 AirPlay receivers have only 1152 logical pixels in the 720px stage.
 // Four catalog columns plus the sidebar left too little width for readable
 // text; reserve that density for wider 16:9 receivers.
 stage.classList.toggle('tv-compact',layout.width<=1180);
 const play=$('play'),bar=play.querySelector('.gamebar');const height=Math.max(1,layout.height-play.offsetTop);play.style.height=height+'px';const frame=$('gameFrame');
 // Games render at the receiver's real resolution (a 1080p TV gives them a native
 // 1920-wide viewport, like the computer host). Only above 1920 px is the viewport
 // capped and scaled up, so 4K keeps desktop-sized game layouts.
 const physicalWidth=layout.width*z,gameScale=Math.max(1,physicalWidth/1920);
 const hudHeight=bar.offsetHeight?bar.offsetHeight+(parseFloat(getComputedStyle(bar).marginBottom)||0):0;
 frame.style.zoom=String(1/z);frame.style.flex='none';frame.style.transformOrigin='0 0';
 frame.style.width=physicalWidth/gameScale+'px';frame.style.height=Math.max(1,(height-hudHeight)*z/gameScale)+'px';
 frame.style.transform=gameScale>1?'scale('+gameScale+')':'none';
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==$('gameFrame').contentWindow)return;
 const message=event.data;if(message?.type!=='party-tv-information'||message.instance!==state?.active?.instance||message.info?.id!==state.active.id)return;
 tvInfo=message.info;tvInfoInstance=message.instance;tvInfoAt=Date.now();information();
});
// A TV cannot scroll the people card. The column keeps one width and readable
// rows; when the rows do not fit, the last visible ones fold into a "+N" chip.
let rosterFitKey='',rosterFrame=0;
function fitRoster(){rosterFrame=0;const stage=$('tvStage'),list=$('players'),card=list?.closest('section');if(!card||$('lobby').hidden)return;
 const key=[lastPlayers,stage.classList.contains('tv-has-choice'),innerWidth,innerHeight].join('|');if(key===rosterFitKey)return;rosterFitKey=key;
 const rows=[...list.children].filter(n=>!n.classList.contains('tv-more'));list.querySelector('.tv-more')?.remove();rows.forEach(n=>{n.hidden=false;});
 stage.classList.toggle('roster-compact',rows.length>4);
 const over=()=>card.scrollHeight-card.clientHeight>4;if(!over())return;
 const more=document.createElement('div');more.className='player tv-more';more.setAttribute('aria-hidden','true');list.append(more);
 let hidden=0;for(let i=rows.length-1;i>0&&over();i--){rows[i].hidden=true;hidden++;more.textContent='+'+hidden;}
 if(!hidden)more.remove();}
// Hero folds away while the catalog is scrolled (see branding.css .tv-browsing).
{const browse=$('tvBrowse');let browsing=false;browse.addEventListener('scroll',()=>{const on=browse.scrollTop>(browsing?2:24);if(on!==browsing){browsing=on;$('tvStage').classList.toggle('tv-browsing',on);}},{passive:true});}
function queueRosterFit(){if(!rosterFrame)rosterFrame=requestAnimationFrame(fitRoster);}
fitScreen();window.addEventListener('resize',()=>{fitScreen();queueRosterFit();});
if(typeof ResizeObserver==='function')new ResizeObserver(fitScreen).observe($('play').querySelector('.gamebar'));
$('gameFrame').addEventListener('load',()=>{fitScreen();hud(true);show?.gameLoaded();});setInterval(clock,250);
// A TV is not a touchscreen. Quietly reveal the rest of Fresh only while idle.
setInterval(()=>{if(!document.hidden&&show?.canIdle()!==false&&state&&!state.active&&!state.selected&&!matchMedia('(prefers-reduced-motion: reduce)').matches)catalog.advanceFresh();},9000);
// Noninteractive AirPlay has no scroll input: browse the lower catalog while idle.
setInterval(()=>{if(document.hidden||show?.canIdle()===false||!state||state.active||state.selected||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const view=$('tvBrowse'),max=view.scrollHeight-view.clientHeight;if(max>1)view.scrollTo({top:view.scrollTop>=max-2?0:Math.min(max,view.scrollTop+view.clientHeight*.8),behavior:'smooth'});
},18000);
window.addEventListener('online',()=>{if(ws?.readyState===WebSocket.CLOSED)connect();});connect();
})();
