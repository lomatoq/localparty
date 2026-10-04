/* Shared desktop-style catalog for the native menu and the display-only TV.
   All assets/classes come from the existing desktop launcher. The second IIFE
   starts TV transport ONLY when #tvStage exists; loading this in partyapp://
   never opens a network connection or grants host authority. */
(() => {
  'use strict';
  if (window.LocalPartyCatalog) return;
  const setupTVAudio=()=>{
    if(!document.getElementById('tvStage')||!window.HeyPalsAudio)return;
    const audio=window.HeyPalsAudio;audio.configure({surface:'tv',musicOwner:true});
    const button=document.getElementById('tvAudioToggle'),dialog=document.getElementById('tvAudioDialog');
    audio.mountSettings(document.getElementById('tvAudioSettings'));
    const label=()=>{const ru=(document.documentElement.lang||'ru').startsWith('ru'),enabled=audio.status().unlocked&&!audio.preferences().muted,title=enabled?(ru?'Настройки звука':'Audio settings'):(ru?'Включить звук':'Enable audio');button.classList.add('hp-audio-icon-button');button.setAttribute('aria-label',title);button.title=title;button.setAttribute('aria-pressed',String(enabled));button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4Z"/>'+(enabled?'<path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>':'<path d="m16 9 5 6m0-6-5 6"/>')+'</svg>';};
    button.onclick=async()=>{const wasUnlocked=audio.status().unlocked;await audio.unlock();label();if(wasUnlocked||!audio.status().unlocked)dialog.showModal();};
    document.getElementById('tvAudioClose').onclick=()=>dialog.close();
    document.addEventListener('pointerup',()=>setTimeout(label,0),{passive:true});document.addEventListener('keyup',()=>setTimeout(label,0));label();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupTVAudio,{once:true});else setupTVAudio();

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
  // Search matches what people call a game, not only its brand title:
  // "bowl" finds Pocket Strike via its id/tag, in either interface language.
  const searchText = g => {const t=window.PartyI18n?.t||(x=>x);return [g.title,g.id,g.tag,g.description,g.tag&&t(g.tag),g.description&&t(g.description)].filter(Boolean).join(' ').replace(/_/g,' ').toLocaleLowerCase();};
  const matches = (g, query, filter) => (!query || searchText(g).includes(query)) &&
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
      const info=node('div','game-info'),heading=node('h3','lp-card-wordmark'),title=node('span','lp-card-title',g.title),logo=node('img','lp-card-game-logo');
      logo.src='/assets/game-logos-v1/logos/'+encodeURIComponent(g.id)+'.png?v=1';logo.alt='';logo.decoding='async';logo.draggable=false;logo.dataset.hpGameLogo='';
      logo.onload=()=>heading.classList.add('is-loaded');logo.onerror=()=>logo.remove();heading.append(title,logo);
      info.append(heading,node('p','',g.description||g.goal||''));
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
      groups.forEach(({box,grid,count,extra,extraBox})=>{const shown=g=>[...g.children].filter(c=>!c.hidden).length;const more=extra?shown(extra):0,n=shown(grid)+more;box.hidden=!n;if(extraBox)extraBox.hidden=!more;const total=displayOnly&&box.dataset.catalogGroup==='arcade'?visible.length:n;const word=total%10===1&&total%100!==11?'игра':total%10>=2&&total%10<=4&&(total%100<12||total%100>14)?'игры':'игр',text=`${total} ${word}`;if(count.textContent!==text)count.textContent=text;});
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
let ws,state,key='',reconnect,offset=0,selected='',lastChoiceCount='',lastPlayers='',lastStandings='',accessClosed=false;
window.PARTY_PROFILE={};window.PARTY_DISPLAY_ONLY=true;
const catalog=window.LocalPartyCatalog.create($('tvCatalog'),{displayOnly:true});
const show=window.LocalPartyShow?.create($('tvStage'));
window.LocalPartyTVShow=show;
const tell=message=>{$('notice').textContent=message;$('notice').hidden=false;clearTimeout(tell.timer);tell.timer=setTimeout(()=>$('notice').hidden=true,6000);};
const art=id=>window.LocalPartyCatalog.artPath(state.catalog.find(g=>g.id===id));
const text=(id,value)=>{const node=$(id);value=String(value);if(node.textContent!==value)node.textContent=value;};
function choicePlayers(choice){
 if(!choice){lastChoiceCount='';return;}
 const count=state.players.length,min=state.botCount>0?1:choice.min,max=choice.max;
 const signature=JSON.stringify([choice.id,count,min,max]);
 if(signature===lastChoiceCount)return;lastChoiceCount=signature;
 const part=(cls,value)=>{const el=document.createElement('span');el.className=cls;el.textContent=String(value);return el;};
 const counter=part('hp-menu-counter',''),readout=part('hp-menu-counter-readout','');
 const value=part('hp-menu-counter-value',Math.min(count,max));value.dataset.noTranslate='';readout.append(value);
 if(count<min){const total=part('hp-menu-counter-total',min);total.dataset.noTranslate='';readout.append(part('hp-menu-counter-separator',' / '),total);}
 counter.append(readout,part('hp-menu-counter-label',count>max?'До '+max+' игроков':'игроков'));
 // Over-capacity uses the same "up to" meaning as the host controller.
 if(count>max)counter.replaceChildren(part('hp-menu-counter-label','До'),readout,part('hp-menu-counter-label','игроков'));
 $('playersNeeded').replaceChildren(counter);
}

let lastHUD='',lastMessage='',tvInfo=null,tvInfoAt=0,tvInfoInstance=null,displayConnected=false,waitingGameKey='';
// Existing status nodes share one authored contour rather than three floating wings.
const informationBar=$('play').querySelector('.gamebar'),informationDock=document.createElement('div'),informationActor=document.createElement('span'),informationClockLabel=document.createElement('small');
informationDock.className='tv-info-dock';informationActor.className='tv-info-actor hp-player-name';informationActor.dataset.noTranslate='';informationActor.hidden=true;
informationClockLabel.className='tv-info-clock-label';informationClockLabel.hidden=true;
const informationPrimaryReadout=document.createElement('div');informationPrimaryReadout.className='tv-info-primary-readout';
informationPrimaryReadout.append(informationClockLabel,$('gameTitle'));
informationBar.querySelector('.tv-info-center').append(informationPrimaryReadout);
// One decorative glass layer (shape, light sweep); absolutely placed, so it never takes a grid cell or changes the dock box.
const informationGlass=document.createElement('span');informationGlass.className='tv-info-glass';informationGlass.setAttribute('aria-hidden','true');
informationDock.append(informationGlass,informationBar.querySelector('.tv-info-center'),informationBar.querySelector('.tv-info-left'),informationBar.querySelector('.tv-info-right'),informationActor);
informationBar.append(informationDock);
function waitingWordmark(game){
 const heading=$('waitingGameTitle');if(!game||waitingGameKey===game.id&&heading.firstElementChild)return;
 waitingGameKey=game.id;heading.classList.remove('waiting-logo-loaded');
 const fallback=document.createElement('span'),logo=new Image();fallback.className='waiting-game-title';fallback.textContent=game.title;
 logo.className='waiting-game-logo';logo.alt='';logo.decoding='async';
 logo.onload=()=>{if(logo.isConnected&&logo.parentElement===heading)heading.classList.add('waiting-logo-loaded');};
 logo.onerror=()=>{if(logo.isConnected){heading.classList.remove('waiting-logo-loaded');logo.remove();}};
 logo.src='/assets/game-logos-v1/logos/'+encodeURIComponent(game.id)+'.png?v=1';heading.replaceChildren(fallback,logo);
 if(logo.complete&&logo.naturalWidth)heading.classList.add('waiting-logo-loaded');
}
function gameIdentity(game,title){
 const heading=$('gameContext'),id=game?.id||'',source=window.LocalPartyTVInformation?.logoFor?.(id);
 heading.setAttribute('data-no-translate','');heading.setAttribute('aria-label',title);
 if(heading.dataset.gameIdentity===id&&heading.querySelector('.tv-info-game-name')){
  const name=heading.querySelector('.tv-info-game-name');if(name.textContent!==title)name.textContent=title;
  return;
 }
 heading.dataset.gameIdentity=id;heading.classList.remove('has-game-logo');heading.removeAttribute('role');
 const name=document.createElement('span');name.className='tv-info-game-name';name.textContent=title;
 if(!source){heading.replaceChildren(name);return;}
 const logo=document.createElement('img');logo.className='tv-info-game-logo';logo.alt='';logo.setAttribute('aria-hidden','true');logo.dataset.hpGameLogo=id;
 logo.onload=()=>{if(logo.isConnected&&logo.parentElement===heading&&heading.dataset.gameIdentity===id){heading.classList.add('has-game-logo');heading.setAttribute('role','img');fitScreen();}};
 logo.onerror=()=>{if(logo.isConnected&&logo.parentElement===heading){heading.classList.remove('has-game-logo');heading.removeAttribute('role');fitScreen();}};
 heading.replaceChildren(name,logo);logo.src=source;
 if(logo.complete&&logo.naturalWidth){heading.classList.add('has-game-logo');heading.setAttribute('role','img');}
}
function information(){
 if(!state?.active||!window.LocalPartyTVInformation)return null;
 const game=state.catalog.find(g=>g.id===state.active.id),ui=state.active.ui;
 const base=window.LocalPartyTVInformation.normalize({game,ui,now:Date.now()-offset,paused:!!state.active.session?.paused});
 // Quiet phases (role assignment, voting, drawing) may publish only on change.
 // Their last public snapshot stays valid for this match until it is replaced.
 const fresh=tvInfoInstance===state.active.instance;
 const info=fresh?{...tvInfo,paused:base.paused,objective:tvInfo.objective||base.objective}:base;
 if(base.paused){info.phaseLabel='Пауза';info.timer=null;}
 if(!displayConnected){info.phaseLabel='Восстанавливаем связь';info.timer=null;}
 let seconds=info.timer?.remainingSeconds;
 if(info.timer?.clock==='epoch-ms')seconds=Number.isFinite(info.timer.endsAt)&&info.timer.endsAt>0?Math.max(0,(info.timer.endsAt-(Date.now()-offset))/1000):null;
 else if(fresh&&Number.isFinite(seconds)&&!info.paused)seconds=Math.max(0,seconds-(Date.now()-tvInfoAt)/1000);
 const formatted=Number.isFinite(seconds)?Math.floor(Math.ceil(seconds)/60)+':'+String(Math.ceil(seconds)%60).padStart(2,'0'):'';
 const scoreMetric=(info.metrics||[]).find(m=>['goals','teams'].includes(m.key));
 const untimedCrane=info.id==='crane'&&!formatted&&!info.paused;
 // Pocket's renderer owns the brief turn announcement in the playfield.
 // Keep the shared strip for the clock and match facts, including flight.
 const headerActor=info.id==='pocket_siege'?null:info.actor;
 const primary=untimedCrane?(ui?.label||info.statusLabel||info.phaseLabel):info.family==='live'&&scoreMetric?String(scoreMetric.value):info.family==='mission'&&info.progress?info.progress:info.id==='punchmeter'?info.progress||formatted||'':formatted||headerActor||info.phaseLabel||info.title||'';
 const rawPhase=info.phaseLabel||info.statusLabel||'',phase=info.id==='chaos'&&ui?.label&&!/^(?:Игра|Game)$/i.test(ui.label)?ui.label:/^(?:Игра|Game)$/i.test(rawPhase)?'':rawPhase;
 const translate=value=>window.PartyI18n?.t?.(value)||value;
 const clockCaption=formatted?translate(info.timer?.label||'Осталось'):'';
 if(informationClockLabel.textContent!==clockCaption)informationClockLabel.textContent=clockCaption;
 informationClockLabel.hidden=!clockCaption||informationBar.dataset.layout!=='content-cap';
 const bar=$('play').querySelector('.gamebar');bar.dataset.family=info.family||'live';bar.dataset.coverage=info.coverage;bar.dataset.primaryKind=untimedCrane?'state':primary===info.actor?'actor':formatted&&primary===formatted?'timer':'value';bar.classList.toggle('is-paused',info.paused);bar.classList.toggle('is-reconnecting',!displayConnected);
 // Last ten seconds warm the shown clock; motion.js ticks it once per changed second.
 const urgent=!!formatted&&!info.paused&&displayConnected&&seconds>0&&seconds<=10;bar.toggleAttribute('data-clock-urgent',urgent);$('gameTitle').toggleAttribute('data-motion-value',urgent&&primary===formatted);
 $('gameTitle').toggleAttribute('data-no-translate',primary===info.actor);
 text('gameTitle',primary===info.actor?primary:translate(primary));gameIdentity(game,translate(info.title||''));text('phase',translate(phase));$('phase').hidden=!phase||(primary!==info.actor&&translate(phase)===translate(primary));
 if(informationActor.textContent!==(info.actor||''))informationActor.textContent=info.actor||'';
 let actorOwnedLocally=false;
 if(informationBar.dataset.layout==='content-cap')try{actorOwnedLocally=!!$('gameFrame').contentDocument?.querySelector('[data-tv-hud-owns-actor]');}catch{}
 informationActor.hidden=!headerActor||primary===info.actor||actorOwnedLocally;
 $('gameObjective').setAttribute('data-no-translate','');text('gameObjective',(window.PartyI18n?.language==='en'?info.objective?.english:info.objective?.text)||info.objective?.text||info.statusLabel||'');$('gameObjective').dataset.source=info.objective?.kind||'runtime';
 $('gameObjective').hidden=document.body.classList.contains('tv-field-fullscreen')&&info.objective?.kind==='static';
 const priorities={wind:0,gate:0,goals:0,pot:0,teams:0,submitted:0,lives:0,alive:0,score:1,arrows:1,queue:1};
 const metrics=[...(info.metrics||[])].filter(m=>!(info.family==='live'&&scoreMetric===m)&&!(info.id==='poker'&&['score','leader','hand'].includes(m.key))&&!(info.id==='kart'&&m.key==='laps')).sort((a,b)=>(priorities[a.key]??3)-(priorities[b.key]??3)).slice(0,2);
 const playersReadout=$('gamePlayers');
 playersReadout.hidden=!!(info.progress&&primary===info.progress&&!formatted);
 let caption='',readout='',readoutKind='text';
 if(formatted&&primary!==formatted){caption=translate('Осталось');readout=formatted;readoutKind='timer';}
 else{
  const progress=String(translate(info.id==='spy'&&!formatted&&/роль|role/i.test(info.progress||'')?'Проверь роль':info.id==='poker'&&/^\d+\s*\/\s*\d+$/.test(info.progress||'')?'Раздача '+info.progress:info.progress||''));
  const ratio=progress.match(/^(.+?)\s+(\d+\s*\/\s*\d+)$/),quantity=progress.match(/^(\d+)\s+([^·]+)$/),pair=progress.match(/^(\d+)\s+(.+?)\s*·\s*(.+?)\s+(\d+)$/);
  if(ratio){caption=ratio[1];readout=ratio[2];readoutKind='progress';}
  else if(quantity){caption=quantity[2];readout=quantity[1];readoutKind='count';}
  else if(pair){caption=pair[2]+' · '+pair[3].toLowerCase();readout=pair[1]+' · '+pair[4];readoutKind='count';}
  else if(progress){readout=progress;}
  else{caption=translate('В игре');readout=String(state.active.roster?.length??state.players.length);readoutKind='count';}
 }
 if(playersReadout.dataset.readout!==readoutKind){
  playersReadout.dataset.readout=readoutKind;
  const label=document.createElement('small'),value=document.createElement('strong');
  label.className='tv-stat-label'+(readoutKind==='timer'?' tv-timer-label':readoutKind==='progress'?' tv-progress-label':'');
  value.className='tv-stat-value'+(readoutKind==='timer'?' tv-timer-value':readoutKind==='progress'?' tv-progress-value':readoutKind==='text'?' tv-text-value':'');
  playersReadout.replaceChildren(label,value);
 }
 playersReadout.firstElementChild.hidden=!caption;
 if(playersReadout.firstElementChild.textContent!==caption)playersReadout.firstElementChild.textContent=caption;
 playersReadout.lastElementChild.toggleAttribute('data-motion-value',urgent&&readoutKind==='timer');
 // Progress pips (quiz bar): current/total as CSS numbers; only short, sane ratios.
 {const [done,total]=readoutKind==='progress'?readout.split('/').map(Number):[];const pips=Number.isInteger(total)&&total>1&&total<=20&&Number.isInteger(done)&&done>=0;playersReadout.toggleAttribute('data-pips',pips);if(pips){playersReadout.style.setProperty('--tv-pip-done',String(Math.min(done,total)));playersReadout.style.setProperty('--tv-pip-total',String(total));}}
 if(playersReadout.lastElementChild.textContent!==readout)playersReadout.lastElementChild.textContent=readout;
 playersReadout.title=[caption,readout].filter(Boolean).join(' ');
 playersReadout.parentElement.style.setProperty('--tv-readout-count',String(metrics.length+(playersReadout.hidden?0:1)));
 playersReadout.parentElement.dataset.readouts=String(metrics.length+(playersReadout.hidden?0:1));
 // Discrete counters get motion.js's one-shot value pulse; continuous readouts
 // (race time, gate strength) would pulse at the 4Hz publish rate, so they stay still.
 const pulsedReadouts=new Set(['score','goals','teams','alive','moves','height','lives','frame','throw','hand','pot','waveLeft','round']);
 const metricHost=$('gameMetric'),metricKeys=metrics.map(m=>m.key).join('|');
 if(metricHost.dataset.keys!==metricKeys){
  metricHost.dataset.keys=metricKeys;
  metricHost.replaceChildren(...metrics.map(m=>{const chip=document.createElement('span'),label=document.createElement('small'),value=document.createElement('strong');chip.className='tv-stat';chip.dataset.key=m.key;label.className='tv-stat-label';value.className='tv-stat-value';chip.append(label,value);return chip;}));
 }
 metrics.forEach((m,i)=>{const chip=metricHost.children[i],label=chip.firstElementChild,value=chip.lastElementChild,literal=['leader','target'].includes(m.key);chip.dataset.source=m.source||'';chip.dataset.key=m.key;value.classList.toggle('hp-player-name',literal);value.toggleAttribute('data-no-translate',literal);value.toggleAttribute('data-motion-value',!literal&&pulsedReadouts.has(m.key));const caption=translate(m.label),readout=typeof m.value==='number'?String(Math.round(m.value*10)/10):String(m.value);if(label.textContent!==caption)label.textContent=caption;if(value.textContent!==readout)value.textContent=readout;value.title=readout;});
 text('timer',formatted);$('timer').hidden=true;window.LocalPartyTVCurrentInformation=info;
 return info;
}
function clock(){if(!state?.active)return;const {ui,session}=state.active;
 information();
}
// Set visibility before navigation and on worker-only phase updates.
// Keep the frame mounted while readiness handshakes complete.
function syncGameVisibility(game,phase='waiting'){
 const live=!!game&&['countdown','playing','reveal'].includes(phase);
 document.body.dataset.tvPhase=game?phase:'lobby';
 informationBar.hidden=!live;
 $('gameFrame').style.visibility=game&&phase!=='waiting'?'visible':'hidden';
}
function hud(force=false){if(!state?.active)return;window.HeyPalsAudio?.scene(state.active.session?.paused?'pause':state.active.ui?.phase==='waiting'?'matchmaking':state.active.ui?.phase==='results'?'results':'game');const {ui,session}=state.active;const game=state.catalog.find(g=>g.id===state.active.id);window.PARTY_UI=ui;window.PARTY_SESSION=session;window.PARTY_GAME=game;
 syncGameVisibility(game,ui?.phase||'waiting');
 const fullField=!!game&&['countdown','playing','reveal'].includes(ui?.phase);
 if(document.body.classList.contains('tv-field-fullscreen')!==fullField){document.body.classList.toggle('tv-field-fullscreen',fullField);fitScreen();}
 window.PARTY_ROSTER=state.players;
 const message={roster:state.players,type:'party-ui',ui,session,game,host:true},messageKey=JSON.stringify(message);
 if(force||messageKey!==lastMessage){lastMessage=messageKey;$('gameFrame').contentWindow?.postMessage(message,location.origin);}
 clock();
 const key=JSON.stringify([state.active.instance,ui?.phase,session,state.active.startError,state.active.roster||state.players]);
 if(!force&&key===lastHUD)return;lastHUD=key;
 const systemPause=session?.pauseReason==='host-background';text('pauseTitle',systemPause?'Ждём ведущего':'Пауза');text('pauseHint',systemPause?'Откройте HeyPals на iPhone ведущего. Игра продолжится автоматически.':'Ведущий или игрок может продолжить игру с телефона.');$('paused').hidden=!session?.paused;
 $('waiting').hidden=(ui?.phase||'waiting')!=='waiting';$('waiting').style.setProperty('--tv-waiting-art',`url("${art(state.active.id)}")`);if(ui?.phase==='waiting')waitingWordmark(game);text('waitingTitle',state.active.startError?'Нужен iPhone ведущего':'Готовимся к игре');
 const roster=state.active.roster||state.players,ready=new Set(session?.readyIds||[]),missing=roster.filter(p=>!p.testBot&&(!p.connected||!p.gameReady));
 $('waiting').classList.toggle('has-large-roster',roster.length>8);
 text('waitingHint',state.active.startError||(missing.length?'Ждём подключение: '+missing.map(p=>p.name).join(', '):'Нажмите «Я готов» на своём телефоне'));
 $('readyPlayers').replaceChildren(...roster.map(p=>{const chip=document.createElement('span');chip.className='ready-player '+(ready.has(p.id)?'is-ready':!p.connected?'is-missing':p.gameReady?'is-waiting':'is-loading');const status=document.createElement('span'),name=document.createElement('span');status.className='ready-status';status.textContent=ready.has(p.id)?'✓':!p.connected?'○':p.gameReady?'…':'↻';name.className='ready-name';name.dataset.noTranslate='';name.textContent=p.name;chip.append(status,name);return chip;}));
 text('readyCount',ready.size+' / '+roster.length+' готовы');
}
function render(){if(!state?.catalog||!state?.players)return;
 const banner=$('incident');banner.hidden=!state.incident;banner.textContent=state.incident?.message||'';
 const game=state.catalog.find(g=>g.id===state.active?.id),composition=window.LocalPartyTVInformation?.compositionFor(game?.id)||'centered-scoreboard';
 syncGameVisibility(game,state.active?.ui?.phase||'waiting');
 document.body.dataset.tvGame=game?.id||'';document.body.dataset.tvHudMode=composition;informationBar.dataset.layout=composition;
 document.body.classList.toggle('game-owns-hud',composition==='game-owned');document.body.classList.toggle('tv-in-game',!!game);$('play').hidden=!game;$('lobby').hidden=!!game;
 $('tvStage').classList.remove('large-roster','roster-mid','roster-big');
 // People-card density follows measured overflow: fitRoster() (fixed column width).
 if(game){const next=state.active.instance;if(key!==next){tvInfo=null;tvInfoInstance=null;fitScreen();key=next;window.PARTY_INSTANCE=key;$('gameFrame').src='/games/'+game.id+game.host;}hud();}
 else if(key){key='';window.PARTY_INSTANCE=null;$('gameFrame').src='about:blank';lastHUD='';lastMessage='';document.body.classList.remove('tv-field-fullscreen');fitScreen();}
 // Do not rebuild or animate the offscreen catalog for per-frame game traffic.
 if(!game){
  window.HeyPalsAudio?.scene('lobby');
  catalog.update(state);text('tvGameCount',state.catalog.length+' игр');
  const choice=state.tv?.browse?null:state.catalog.find(g=>g.id===state.selected);$('preview').hidden=!choice;$('tvStage').classList.toggle('tv-has-choice',!!choice);
  if(selected!==(choice?.id||'-')){selected=choice?.id||'-';if(choice){$('cover').hidden=false;$('cover').src=art(choice.id);$('cover').onerror=()=>{$('cover').hidden=true;};text('choiceTitle',choice.title);text('description',choice.goal||choice.description||'');text('controls',choice.controls||'');$('preview').style.setProperty('--pick-color',/^#[0-9a-f]{3,8}$/i.test(choice.color||'')?choice.color:'#9b7bff');catalog.revealFresh(choice.id);}$('tvBrowse').scrollTop=0;}
  choicePlayers(choice);
  const settings=choice?.hostControls?.settings||[];text('settings',settings.map(f=>f.label+': '+(f.options.find(o=>o.value===state.gameSettings?.[choice.id]?.[f.id])?.label||'')).join(' · '));
  const votes=(state.votes||[]).filter(v=>v.gameId===choice?.id).length;text('votes',votes?'За этот выбор: '+votes:'');
 }
 const sharing=state.networkEnabled!==false&&state.urls.length>0;for(const id of ['qr','qrCaption','address'])$(id).hidden=!sharing;
 const invitation=window.HeyPalsTVInvitation.presentation(state);
 text('inviteHint',sharing?invitation.hint:'Для гостей включите доступ по Wi-Fi на iPhone.');
 text('address',invitation.room);
 if(invitation.src&&$('qr').getAttribute('src')!==invitation.src)$('qr').src=invitation.src;
 if(!invitation.src)$('qr').removeAttribute('src');
 const signature=JSON.stringify(state.players.map(p=>[p.id,p.name,p.avatar]));if(signature!==lastPlayers){lastPlayers=signature;text('count',state.players.length+' / 16');$('players').replaceChildren(...state.players.map((p,i)=>{const n=document.createElement('div');n.className='player';const avatar=document.createElement('span');avatar.className='avatar';avatar.style.setProperty('--card',i%2?'#a96aff':'#c8f58b');avatar.dataset.initial=(Array.from((p.name||'?').trim())[0]||'?').toUpperCase();avatar.dataset.noTranslate='';avatar.textContent=avatar.dataset.initial;if(typeof p.avatar==='string'&&(/^data:image\/(jpeg|png|webp);base64,/.test(p.avatar)||/^\/api\/avatar\/[a-f0-9]{16}\?v=\d+$/.test(p.avatar))){const img=new Image();img.src=p.avatar;img.alt='';avatar.replaceChildren(img);avatar.classList.add('has-photo');}else window.HeyPalsAvatar?.paint(avatar,p.name);const name=document.createElement('b');name.textContent=p.name;n.append(avatar,name);return n;}));$('tvEmpty').hidden=!!state.players.length;}
 const companyPlaces=rows=>{let place=0,last='';return rows.map((p,i)=>{const key=`${Number(p.points)||0}:${Number(p.wins)||0}`;if(key!==last){place=i+1;last=key;}return place;});};
 const standings=state.leaderboard||[],places=companyPlaces(standings);
 const leaders=JSON.stringify((state.leaderboard||[]).slice(0,3));if(leaders!==lastStandings){lastStandings=leaders;$('tvLeaders').replaceChildren(...(state.leaderboard||[]).slice(0,3).map((p,i)=>{const row=document.createElement('div');row.className='mini-rank';const place=places[i];row.dataset.rank=String(place);row.dataset.place=String(place);row.dataset.hpRank=String(place);const rank=document.createElement('span'),name=document.createElement('b'),score=document.createElement('strong');rank.dataset.place=String(place);rank.dataset.hpRank=String(place);const medal=document.createElement('img');medal.className='hp-award';medal.dataset.hpRank=String(place);medal.src='/assets/awards/'+['medal-gold','medal-silver','medal-bronze'][place-1]+'.png';medal.alt=String(place)+' place';rank.append(medal);name.textContent=p.name;score.textContent=String(p.points||0);row.append(rank,name,score);return row;}));$('tvRanking').hidden=!(state.leaderboard||[]).length;}
if(!game)queueRosterFit();
show?.update(state);
if(botProfiles.length||window.PartyBots?.profiles?.length)window.PartyBots?.update(state,botProfiles.slice(0,state.botCount??botProfiles.length));
}
function connect(){clearTimeout(reconnect);const channel=ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/lobby');channel.onopen=()=>{if(ws!==channel)return;channel.send(JSON.stringify({type:'display',key:window.PARTY_DISPLAY_KEY}));text('connection','Подключаем экран…');};channel.onmessage=e=>{if(ws!==channel)return;const m=JSON.parse(e.data);if(m.type==='display-ok'){displayConnected=true;show?.setConnected(true);text('connection','Общий экран подключён');$('connection').classList.add('online');}if(m.type==='error'&&m.code==='DISPLAY_AUTH'){location.reload();return;}if(m.type==='access-closed'){accessClosed=true;state={...state,active:null,networkEnabled:false,urls:[]};render();text('connection','Ждём приглашения ведущего');}
if(m.type==='test-profiles'){botProfiles=Array.isArray(m.profiles)?m.profiles:[];if(state)window.PartyBots?.update(state,botProfiles);return;}if(m.type==='state'){window.PartyI18n?.protectPlayers([...(m.players||[]),...(m.leaderboard||[]),...(m.active?.roster||[])]);window.PartyI18n?.acceptRoomLanguage(m.languageOverride);accessClosed=false;state=m;if(m.active?.ui?.serverNow)offset=Date.now()-m.active.ui.serverNow;render();}if(m.type==='game-ui'&&m.instance===state?.active?.instance){state.active.ui=m.ui;offset=Date.now()-m.ui.serverNow;hud();show?.update(state);if(botProfiles.length)window.PartyBots?.update(state,botProfiles.slice(0,state.botCount??botProfiles.length));}if(m.type==='session-start')hud();if(m.type==='error')tell(m.message);};channel.onclose=()=>{if(ws!==channel)return;displayConnected=false;clock();show?.setConnected(false);text('connection',accessClosed?'Доступ по Wi-Fi закрыт ведущим':'Подключаем экран заново…');$('connection').classList.remove('online');reconnect=setTimeout(connect,1200);};channel.onerror=()=>{};}
let tvFitFrame=0;
function fitScreen(){if(tvFitFrame)return;tvFitFrame=requestAnimationFrame(()=>{tvFitFrame=0;performFitScreen();});}
function performFitScreen(){
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
 const liveField=document.body.classList.contains('tv-field-fullscreen');
 const notch=bar.querySelector('.tv-info-center'),playTop=play.getBoundingClientRect().top;
 // The scene fills the receiver. The bridge publishes the real header rectangle
 // for labels that need clearance, without letterboxing the entire world.
 // Receiver rectangles are physical pixels; the stage uses logical layout pixels.
 const hudHeight=bar.offsetHeight?Math.max(bar.getBoundingClientRect().bottom,notch?.getBoundingClientRect().bottom||0)-playTop:0;
 // Side rails already define the scene's outer contour. A second shell gutter
 // exposed a mismatched strip of the launcher wall above and below them.
 const fieldGutter=0;
 frame.dataset.fieldGutter=String(fieldGutter);
 const safeHeight=liveField?fieldGutter:hudHeight/z;
 frame.style.top=liveField?safeHeight*z+'px':'';
 frame.style.zoom=String(1/z);frame.style.flex='none';frame.style.transformOrigin='0 0';
 frame.style.width=physicalWidth/gameScale+'px';frame.style.height=Math.max(1,(height-safeHeight-(liveField?fieldGutter:0))*z/gameScale)+'px';
 frame.style.transform=gameScale>1?'scale('+gameScale+')':'none';
 // Attach the same surface to actual authored game composition, in stage pixels.
 const mode=informationBar.dataset.layout,playBounds=play.getBoundingClientRect(),frameBounds=frame.getBoundingClientRect();
 const fieldHeaderWidth=Math.min(600,layout.width*.6);
 let width=fieldHeaderWidth,left=(layout.width-width)/2,top=0;
 if(liveField&&mode!=='game-owned'){
  try{
   const doc=frame.contentDocument;
   const visible=selector=>[...(doc?.querySelectorAll(selector)||[])].find(node=>{const r=node.getBoundingClientRect();return r.width>0&&r.height>0;});
   const anchor=visible(mode==='rail-cap'?'[data-tv-hud-rail]':'[data-tv-hud-anchor]');
   const cluster=anchor;
   if(anchor){
    const bounds=anchor.getBoundingClientRect(),anchorLeft=(frameBounds.left-playBounds.left+bounds.left*gameScale)/z,anchorWidth=bounds.width*gameScale/z;
    width=['rail-cap','content-cap'].includes(mode)?anchorWidth:Math.min(fieldHeaderWidth,anchorWidth);left=anchorLeft+(anchorWidth-width)/2;
    if(['rail-cap','content-cap'].includes(mode)&&cluster)top=Math.max(0,(frameBounds.top-playBounds.top+cluster.getBoundingClientRect().top*gameScale)/z);
   }
  }catch{}
 }
 let geometryChanged=false;
 const setGeometry=(name,value)=>{const next=Math.round(value*100)/100+'px';if(informationBar.style.getPropertyValue(name)!==next){informationBar.style.setProperty(name,next);geometryChanged=true;}};
 setGeometry('--tv-hud-left',left);setGeometry('--tv-hud-width',width);setGeometry('--tv-hud-top',top);
 // ResizeObserver reports size, not a cap moving with its centered cluster.
 if(geometryChanged)frame.contentWindow?.postMessage({type:'party-tv-stage-geometry',instance:state?.active?.instance},location.origin);

}
const tvFieldObserver=new ResizeObserver(fitScreen);tvFieldObserver.observe($('play').querySelector('.gamebar'));tvFieldObserver.observe(informationDock);const tvNotch=$('play').querySelector('.tv-info-center');if(tvNotch)tvFieldObserver.observe(tvNotch);
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==$('gameFrame').contentWindow)return;
 const message=event.data;if(message?.type==='party-tv-layout'&&message.instance===state?.active?.instance){fitScreen();return;}if(message?.type!=='party-tv-information'||message.instance!==state?.active?.instance||message.info?.id!==state.active.id)return;
 tvInfo=message.info;tvInfoInstance=message.instance;tvInfoAt=Date.now();information();
});
// A TV cannot scroll the people card. The column keeps one width and readable
// rows; when the rows do not fit, the last visible ones fold into a "+N" chip.
let rosterFitKey='',rosterFrame=0;
function fitRoster(){rosterFrame=0;const stage=$('tvStage'),list=$('players'),card=list?.closest('section');if(!card||$('lobby').hidden)return;
 const key=[lastPlayers,lastStandings,stage.classList.contains('tv-has-choice'),stage.classList.contains('tv-browsing'),$('tvSidebar').clientHeight,$('qr').hidden,$('tvRanking').hidden,$('tvSidebar').querySelector('.tv-invite').offsetHeight,innerWidth,innerHeight].join('|');if(key===rosterFitKey)return;rosterFitKey=key;
 stage.classList.remove('roster-needs-space');
 const rows=[...list.children].filter(n=>!n.classList.contains('tv-more'));list.querySelector('.tv-more')?.remove();rows.forEach(n=>{n.hidden=false;});
 stage.classList.toggle('roster-compact',rows.length>4);
 const over=()=>card.scrollHeight-card.clientHeight>4;
 // Compact QR, ranking and roster together, keeping all three cards visible.
 if(over()&&!$('tvRanking').hidden)stage.classList.add('roster-needs-space');
 if(!over())return;
 const more=document.createElement('div');more.className='player tv-more';more.setAttribute('aria-hidden','true');list.append(more);
 let hidden=0;for(let i=rows.length-1;i>0&&over();i--){rows[i].hidden=true;hidden++;more.textContent='+'+hidden;}
 if(!hidden)more.remove();}
// Hero folds away while the catalog is scrolled (see branding.css .tv-browsing).
{const browse=$('tvBrowse');let browsing=false;browse.addEventListener('scroll',()=>{const on=browse.scrollTop>(browsing?2:24);if(on!==browsing){browsing=on;$('tvStage').classList.toggle('tv-browsing',on);queueRosterFit();}},{passive:true});}
function queueRosterFit(){if(!rosterFrame)rosterFrame=requestAnimationFrame(fitRoster);}
const rosterResize=new ResizeObserver(queueRosterFit);
rosterResize.observe($('tvSidebar'));rosterResize.observe($('tvSidebar').querySelector('.tv-invite'));
document.fonts?.ready.then(()=>{rosterFitKey='';queueRosterFit();});
fitScreen();window.addEventListener('resize',()=>{fitScreen();queueRosterFit();});
$('gameFrame').addEventListener('load',()=>{fitScreen();hud(true);show?.gameLoaded();});setInterval(clock,250);
// A TV is not a touchscreen. Quietly reveal the rest of Fresh only while idle.
setInterval(()=>{if(!document.hidden&&show?.canIdle()!==false&&state&&!state.active&&!state.selected&&!matchMedia('(prefers-reduced-motion: reduce)').matches)catalog.advanceFresh();},9000);
// Noninteractive AirPlay has no scroll input: browse the lower catalog while idle.
setInterval(()=>{if(document.hidden||show?.canIdle()===false||!state||state.active||state.selected||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const view=$('tvBrowse'),max=view.scrollHeight-view.clientHeight;if(max>1)view.scrollTo({top:view.scrollTop>=max-2?0:Math.min(max,view.scrollTop+view.clientHeight*.8),behavior:'smooth'});
},18000);
window.addEventListener('online',()=>{if(ws?.readyState===WebSocket.CLOSED)connect();});connect();
})();
