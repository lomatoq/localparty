/* Presentation only. Server is authoritative for permissions, focus and results. */
(() => {
  'use strict';
  const revision='tv-show-20260918.1';
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
  // Place #1 centrally, then #2 left, #3 right, #4 left, #5 right, ...
  function podiumOrder(rows) {const out=[];rows.forEach((r,i)=>i%2?out.unshift(r):out.push(r));return out;}
  const crown='/assets/awards/crown.png';
  const safeAvatar=value=>typeof value==='string'&&value.length<145000&&(/^data:image\/(jpeg|png|webp);base64,[A-Za-z\d+/]+=*$/.test(value)||/^\/api\/avatar\/[a-f0-9]{16}\?v=\d+$/.test(value));
  const number=value=>new Intl.NumberFormat(window.PartyI18n?.language==='ru'?'ru-RU':'en-US',{maximumFractionDigits:1}).format(Number.isFinite(value)?value:0);

  function create(stage) {
    const loader=document.getElementById('tvStartup'),presentation=document.getElementById('tvPresentation'),qrCard=document.getElementById('tvLargeInvite'),podium=document.getElementById('tvPodium'),transition=document.getElementById('tvSceneTransition');
    let state=null,connected=false,done=false,started=performance.now(),boot=null,lastInstance=null,lastPaused=null;
    let startupTimer=0,startupFinish=0,overlayMode='none',overlayGeneration=0,overlayAnimation=null,boardKey='',effects=null;
    let resultIdentity=null,resultHeading='';const resultAnimations=new Set();
    const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
    const settleResults=()=>{for(const a of resultAnimations)a.cancel();resultAnimations.clear();};
    motionPreference.addEventListener?.('change',()=>{if(motionPreference.matches){settleResults();overlayAnimation?.cancel();}});
    addEventListener('pagehide',settleResults);
    function resultAnimate(el,frames,options){const a=animate(el,frames,options);if(a){resultAnimations.add(a);a.finished.then(()=>resultAnimations.delete(a),()=>resultAnimations.delete(a));}return a;}
    let focusRevision=-1,transitionGeneration=0,transitionTimer=0,transitionAnimation=null;
    const text=(id,value)=>{const n=document.getElementById(id);if(n&&n.textContent!==String(value))n.textContent=value;};
    function animate(el,frames,options={}) {
      if(!el||reduced()||typeof el.animate!=='function')return null;
      return el.animate(frames,{duration:420,easing:'cubic-bezier(.16,1,.3,1)',...options});
    }
    function revealLobby() {
      if(window.HeyPalsTVMotion?.enterLobby?.('startup'))return;
      const candidates=[stage.querySelector('.tv-header'),...stage.querySelectorAll('#lobby>.intro,#tvBrowse>.tv-choice,#tvCatalog .section-title,#tvCatalog .fresh-heading,#tvCatalog .game,#tvSidebar>section')].filter(el=>el&&!el.hidden&&el.getClientRects().length&&el.getBoundingClientRect().top<innerHeight&&el.getBoundingClientRect().bottom>0);
      candidates.sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);
      candidates.forEach((el,i)=>animate(el,[{opacity:0,scale:.965,translate:'0 18px'},{opacity:1,scale:1,translate:'0 0'}],{duration:780,delay:Math.min(i,8)*65,fill:'backwards'}));
    }
    function finishStartup(immediate=false) {
      if(done)return;done=true;clearTimeout(startupTimer);clearTimeout(startupFinish);
      text('tvLoadProgress','100');document.getElementById('tvLoadBar').style.setProperty('--progress','1');
      loader.querySelector('[role=progressbar]').setAttribute('aria-valuenow','100');
      const end=()=>{loader.hidden=true;stage.classList.add('tv-show-ready');if(!state?.active)revealLobby();};
      if(window.webkit?.messageHandlers?.partyTVCurtain){if(!window.HeyPalsTVMotion?.leaveStartup?.(loader,end)){end();window.webkit.messageHandlers.partyTVCurtain.postMessage('open');}}else if(immediate||reduced())end();else if(!window.HeyPalsTVMotion?.leaveStartup?.(loader,end)){animate(loader,[{opacity:1},{opacity:0}],{duration:300});startupFinish=setTimeout(end,300);}
      try{sessionStorage.setItem('lp-tv-intro:'+boot,'1');}catch{ /* private storage may be denied */ }
    }
    function tickStartup() {
      if(done)return;
      const elapsed=performance.now()-started,ready=connected&&!!state?.catalog?.length;
      if(state?.active){finishStartup(true);return;}
      if(ready&&(elapsed>=2400||reduced())){finishStartup();return;}
      const progress=Math.min(ready?97:88,Math.round((1-Math.exp(-elapsed/1050))*100));
      text('tvLoadProgress',progress);document.getElementById('tvLoadBar').style.setProperty('--progress',String(progress/100));loader.querySelector('[role=progressbar]').setAttribute('aria-valuenow',String(progress));
      text('tvLoadStatus',!connected?(elapsed>8000?'Ждём связь с iPhone…':'Соединяем общий экран…'):!state?.catalog?.length?'Получаем каталог игр…':'Собираем интерфейс вечера…');
      startupTimer=setTimeout(tickStartup,80);
    }
    // A game start shows its own wordmark; pause/lobby transitions stay typographic.
    function transitionLogo(gameId) {
      const logo=document.getElementById('tvTransitionLogo');if(!logo)return null;
      transition.classList.remove('has-logo');logo.hidden=true;logo.onload=logo.onerror=null;
      if(!gameId){logo.removeAttribute('src');return null;}
      const src='/assets/game-logos-v1/logos/'+encodeURIComponent(gameId)+'.png?v=1';
      const reveal=()=>{if(!logo.naturalWidth)return;logo.hidden=false;transition.classList.add('has-logo');};
      logo.onload=reveal;logo.onerror=()=>{logo.hidden=true;transition.classList.remove('has-logo');};
      if(logo.getAttribute('src')!==src)logo.src=src;else if(logo.complete)reveal();
      return logo;
    }
    function showTransition(title,{wait=false,gameId=null,kind=''}={}) {
      if(window.HeyPalsTVMotion?.scene){
        // One owner for this overlay: a previous legacy timer must not hide doors.
        ++transitionGeneration;clearTimeout(transitionTimer);transitionAnimation?.cancel();transitionAnimation=null;
        if(window.HeyPalsTVMotion.scene(title,{wait,gameId,kind}))return;
      }
      const generation=++transitionGeneration;clearTimeout(transitionTimer);transitionAnimation?.cancel();transition.hidden=false;text('tvTransitionTitle',title);
      const logo=transitionLogo(gameId),hero=logo&&!logo.hidden?logo:document.getElementById('tvTransitionTitle');
      transitionAnimation=animate(transition,[{opacity:0},{opacity:1}],{duration:120});
      animate(hero,[{opacity:0,transform:'translate3d(0,14px,0) scale(.94)'},{opacity:1,transform:'translate3d(0,0,0) scale(1)'}],{duration:wait?460:240,easing:'cubic-bezier(.23,1,.32,1)'});
      const leave=()=>{if(transitionGeneration!==generation)return;transitionAnimation?.cancel();transitionAnimation=animate(transition,[{opacity:1},{opacity:0}],{duration:260});transitionTimer=setTimeout(()=>{if(transitionGeneration===generation)transition.hidden=true;},reduced()?0:270);};
      transitionTimer=setTimeout(leave,wait?900:180);
    }
    function updatePause() {
      const paused=!!state?.active?.session?.paused,layer=document.getElementById('paused');
      if(lastPaused!==null&&lastPaused!==paused&&state?.active) {
        if(paused){layer.hidden=false;animate(layer,[{opacity:0,scale:.985},{opacity:1,scale:1}],{duration:320});}
        else showTransition('Продолжаем',{kind:'resume'});
      }
      lastPaused=state?.active?paused:null;
    }
    // Places after the medals get cheerful party colours instead of one pale tint.
    const funColors=['#a98bff','#4fe0c8','#ff7ac3','#6fb8ff','#ffa24d','#b8f35a','#ff6f7d','#7ee7ff'];
    function buildPodium(board) {
      const photos=new Map([...(state?.leaderboard||[]),...(state?.players||[])].map(p=>[p.id,p.avatar]));
      const key=JSON.stringify([board.key,board.title,board.subtitle,board.rows.map(r=>[r.id,r.name,r.rank,r.points,r.score,r.teamScore,photos.get(r.id)])]);
      const fresh=board.key!==resultIdentity;
      if(fresh){settleResults();resultIdentity=board.key;}
      if(key===boardKey)return;boardKey=key;
      const headingKey=JSON.stringify([board.key,board.title,board.game]);
      if(resultHeading!==headingKey){resultHeading=headingKey;
      const heading=document.getElementById('tvBoardTitle');
      heading.classList.remove('has-game-logo');heading.removeAttribute('aria-label');
      text('tvBoardTitle',board.title);text('tvBoardSubtitle',board.subtitle);
      if(board.kind==='match'&&state?.catalog?.some(game=>game.id===board.game)){
        const logo=make('img','tv-board-game-logo');logo.alt=board.title;logo.dataset.hpGameLogo='';
        logo.src='/assets/game-logos-v1/logos/'+encodeURIComponent(board.game)+'.png?v=1';
        // Keep the readable title until the original wordmark actually loads.
        logo.onload=()=>{if(resultHeading!==headingKey)return;heading.replaceChildren(logo);heading.classList.add('has-game-logo');heading.setAttribute('aria-label',board.title);};
      }
      }
      text('tvBoardSubtitle',board.subtitle);
      const rows=board.rows.slice(0,16).map((row,index)=>({...row,rank:row.rank||index+1})),mainRows=rows.slice(0,7),tailRows=rows.slice(7);
      const build=(list,tail=false)=>podiumOrder(list).map(row=>{
        const card=make('article','podium-seat'+(row.rank===1?' is-winner':''));
        card.dataset.playerId=String(row.id);card.dataset.portraitKey=JSON.stringify([row.name,photos.get(row.id)]);card.dataset.rank=String(row.rank||0);card.setAttribute('aria-label',`${row.rank?row.rank+' место':'Участник'}: ${row.name}`);
        const hue=row.rank===1?'#ffd45c':row.rank===2?'#dfe6f5':row.rank===3?'#e89a62':funColors[((row.rank||4)-4)%funColors.length];card.style.setProperty('--medal',hue);if(row.rank>=1&&row.rank<=3)card.classList.add('is-medal');
        const h=tail?52:row.rank===1?194:row.rank===2?148:row.rank===3?119:Math.max(58,100-(row.rank||9)*6);card.style.setProperty('--plinth-height',h+'px');
        const portrait=make('div','podium-portrait');portrait.append(make('span','podium-initial',Array.from(row.name||'?')[0].toUpperCase()));window.HeyPalsAvatar?.paint(portrait,row.name);
        if(safeAvatar(photos.get(row.id))){const img=new Image();img.src=photos.get(row.id);img.alt='';img.onerror=()=>img.remove();portrait.append(img);}
        else{
          let seed=0;for(const ch of String(row.name||'HeyPals'))seed=(seed*31+ch.charCodeAt(0))>>>0;
          const img=new Image();img.className='podium-mascot';img.alt='';img.decoding='async';
          img.onload=()=>{if(img.parentElement===portrait)portrait.classList.add('has-mascot');};
          img.onerror=()=>img.remove();img.src='/assets/avatars/atlas-mascots/mascot-'+String(1+seed%16).padStart(2,'0')+'.webp';portrait.append(img);
        }
        if(row.rank===1){const decoration=make('div','podium-crown');const image=make('img','');image.src=crown;image.alt='';decoration.append(image);portrait.append(decoration);}
        const name=make('h3','podium-name hp-player-name',row.name);name.title=row.name;name.dataset.noTranslate='';
        const base=make('div','podium-plinth'),points=make('span','podium-points',number(board.ranking?.kind==='teams'?row.teamScore:row.points??row.score));points.style.setProperty('--score-size',Math.max(16,Math.min(tail?16:mainRows.length>4?26:34,(tail?16:mainRows.length>4?26:34)*6/Math.max(6,points.textContent.length)))+'px');const rank=make('strong','podium-rank',row.rank?String(row.rank):'—');if(row.rank>=1&&row.rank<=3){const cup=make('img','hp-award podium-award');cup.src='/assets/awards/'+['cup-gold','cup-silver','cup-bronze'][row.rank-1]+'.png';cup.alt='';rank.prepend(cup);}if(board.kind==='company')window.HeyPalsCoins?.amount(points,row.coins??row.points??0);base.append(rank,points,make('small','',board.kind==='company'?'COINS':board.ranking?.kind==='teams'?'командных очков':'очков'));if(board.kind==='match'&&row.coinsEarned>0){const reward=window.HeyPalsCoins?.badge(row.coinsEarned);if(reward)name.append(reward);}
        card.append(portrait,name,base);return card;
      });
      const main=document.getElementById('tvPodiumMain'),tail=document.getElementById('tvPodiumTail');
      main.style.setProperty('--seats',String(mainRows.length));tail.style.setProperty('--seats',String(tailRows.length||1));
      const previous=new Map([...podium.querySelectorAll('.podium-seat')].map(el=>[el.dataset.playerId,el]));
      const reconcile=(parent,nodes)=>{let cursor=parent.firstElementChild;for(const node of nodes){const old=previous.get(node.dataset.playerId);if(!fresh&&old&&old.dataset.rank===node.dataset.rank){
        old.setAttribute('aria-label',node.getAttribute('aria-label'));
        const name=old.querySelector('.podium-name'),nextName=node.querySelector('.podium-name');if(name.textContent!==nextName.textContent){name.replaceChildren(...nextName.childNodes);name.title=nextName.title;}
        const points=old.querySelector('.podium-points'),nextPoints=node.querySelector('.podium-points');if(nextPoints.dataset.coinAmount)window.HeyPalsCoins?.amount(points,Number(nextPoints.dataset.coinAmount.split(':')[1]));else if(points.textContent!==nextPoints.textContent)points.textContent=nextPoints.textContent;points.style.cssText=nextPoints.style.cssText;
        if(old.dataset.portraitKey!==node.dataset.portraitKey){const portrait=old.querySelector('.podium-portrait'),nextPortrait=node.querySelector('.podium-portrait');portrait.className=nextPortrait.className;portrait.style.cssText=nextPortrait.style.cssText;const crown=portrait.querySelector('.podium-crown');nextPortrait.querySelector('.podium-crown')?.remove();portrait.replaceChildren(...nextPortrait.childNodes,...(crown?[crown]:[]));const mascot=portrait.querySelector('.podium-mascot');if(mascot){mascot.onload=()=>portrait.classList.add('has-mascot');if(mascot.complete&&mascot.naturalWidth)portrait.classList.add('has-mascot');}old.dataset.portraitKey=node.dataset.portraitKey;}
        if(old!==cursor)parent.insertBefore(old,cursor);cursor=old.nextElementSibling;previous.delete(node.dataset.playerId);
      }else{if(old===cursor)cursor=old.nextElementSibling;old?.remove();parent.insertBefore(node,cursor);previous.delete(node.dataset.playerId);}}};
      reconcile(main,build(mainRows));reconcile(tail,build(tailRows,true));for(const old of previous.values())old.remove();tail.hidden=!tailRows.length;podium.classList.toggle('has-tail',!!tailRows.length);
      if(!fresh)return;
      for(const seat of podium.querySelectorAll('.podium-seat')){const reward=seat.querySelector('.hp-coin-reward');if(reward)window.HeyPalsCoins?.award(reward,Number(reward.dataset.coinAmount.split(':')[1]),`${board.key}:${seat.dataset.playerId}`);}
      // One result owns one reveal. Equal ranks share the same beat, including ties.
      const style=getComputedStyle(document.documentElement),out=style.getPropertyValue('--motion-ease-out').trim()||'cubic-bezier(.16,1,.3,1)',pop=style.getPropertyValue('--motion-ease-pop').trim()||'cubic-bezier(.18,1.28,.35,1)';
      const seats=[...podium.querySelectorAll('.podium-seat')];
      for(const el of seats){
        const rank=Number(el.dataset.rank)||16,at=rank>3?0:rank===3?80:rank===2?160:240;
        const plinth=el.querySelector('.podium-plinth'),portrait=el.querySelector('.podium-portrait'),name=el.querySelector('.podium-name'),crownEl=el.querySelector('.podium-crown');
        plinth.style.transformOrigin='50% 100%';
        resultAnimate(plinth,[{transform:'translateY(18px) scaleY(.94)',opacity:1},{transform:'translateY(0) scaleY(1.025)',opacity:1,offset:.7},{transform:'none',opacity:1}],{duration:420,delay:at,easing:out,fill:'backwards'});
        resultAnimate(portrait,[{transform:'translateY(-14px) scale(.94)',opacity:0},{transform:'none',opacity:1}],{duration:300,delay:at+120,easing:pop,fill:'backwards'});
        resultAnimate(name,[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:240,delay:at+180,easing:out,fill:'backwards'});
        resultAnimate(crownEl,[{transform:'translateX(-50%) translateY(-24px) rotate(-18deg) scale(.94)',opacity:0},{transform:'translateX(-50%) translateY(2px) rotate(-5deg)',opacity:1,offset:.72},{transform:'translateX(-50%) rotate(-7deg)',opacity:1}],{duration:420,delay:at+360,easing:out,fill:'backwards'});
      }
      resultAnimate(podium.querySelector('.tv-board-heading'),[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:240,easing:out,fill:'backwards'});
      resultAnimate(podium.querySelector('.tv-board-footer'),[{opacity:0},{opacity:1}],{duration:240,delay:420,easing:out,fill:'backwards'});
    }
    function updateOverlay() {
      const mode=state?.tv?.mode||'none',board=state?.tv?.board,validMode=mode==='podium'&&!board?'none':mode;
      const invitation=window.HeyPalsTVInvitation.presentation(state,true);
      const qr=document.getElementById('tvLargeQR');
      if(invitation.src&&qr.getAttribute('src')!==invitation.src)qr.src=invitation.src;
      if(!invitation.src)qr.removeAttribute('src');
      const hint=qr.nextElementSibling;if(hint)hint.textContent=invitation.hint;
      text('tvLargeAddress',invitation.room);const ru=(window.PartyI18n?.language||document.documentElement.lang||'ru').startsWith('ru');text('tvInviteCount',`${state?.players?.length||0} / 16 ${ru?'уже в компании':'already here'}`);
      if(validMode==='podium')buildPodium(board);
      if(validMode!==overlayMode){
        const pose=presentation.hidden?{opacity:0,scale:.975}:{opacity:getComputedStyle(presentation).opacity,scale:getComputedStyle(presentation).scale};
        overlayMode=validMode;const generation=++overlayGeneration;overlayAnimation?.cancel();
        if(validMode==='none'){
          effects?.stop();
          if(!presentation.hidden){overlayAnimation=animate(presentation,[pose,{opacity:0,scale:.975}],{duration:240});setTimeout(()=>{if(overlayGeneration===generation){presentation.hidden=true;qrCard.hidden=true;podium.hidden=true;settleResults();}},reduced()?0:250);}
        }else{
          presentation.hidden=false;qrCard.hidden=validMode!=='qr';podium.hidden=validMode!=='podium';
          overlayAnimation=animate(presentation,[pose,{opacity:1,scale:1}],{duration:240});
        }
      }
      if(validMode==='podium'&&state.tv.effects&&!reduced()&&!document.hidden){try{effects ||= new CelebrationFX(document.getElementById('tvShader'),document.getElementById('tvFireworks'));effects.start(board?.key||'podium');}catch{effects?.stop(); /* Static shaded stage remains available. */ }}
      else effects?.stop();
    }
    // Native smooth scroll can be ignored by WebKit inside the zoomed TV stage.
    // Drive the actual scroll offset; a new D-pad step starts from the current pose.
    const focusScrolls=new Map();
    function cancelFocusScrolls(){for(const frame of focusScrolls.values())cancelAnimationFrame(frame);focusScrolls.clear();}
    stage.addEventListener('wheel',cancelFocusScrolls,{passive:true});
    stage.addEventListener('touchstart',cancelFocusScrolls,{passive:true});
    addEventListener('pagehide',cancelFocusScrolls);
    function scrollFocus(node,axis,target){
      if(node.id==='tvBrowse')stage.classList.toggle('tv-browsing',target>24);
      cancelAnimationFrame(focusScrolls.get(node));focusScrolls.delete(node);
      const max=axis==='scrollTop'?node.scrollHeight-node.clientHeight:node.scrollWidth-node.clientWidth;
      target=Math.max(0,Math.min(max,target));const from=node[axis],start=performance.now();
      if(reduced()||Math.abs(target-from)<1){node[axis]=target;return;}
      // Solve the shared ease-out cubic-bezier(.23,1,.32,1), rather than rely on
      // CSS smooth scrolling on an element whose ancestor uses CSS zoom.
      const ease=t=>{let lo=0,hi=1,u=t;for(let i=0;i<10;i++){u=(lo+hi)/2;const x=3*(1-u)*(1-u)*u*.23+3*(1-u)*u*u*.32+u*u*u;if(x<t)lo=u;else hi=u;}return 1-Math.pow(1-u,3);};
      const step=now=>{if(state?.active||!node.isConnected){focusScrolls.delete(node);return;}const t=Math.min(1,(now-start)/150);node[axis]=t===1?target:from+(target-from)*ease(t);if(t<1)focusScrolls.set(node,requestAnimationFrame(step));else focusScrolls.delete(node);};
      focusScrolls.set(node,requestAnimationFrame(step));
    }
    function followFocus() {
      const tv=state?.tv;if(!tv||focusRevision===tv.focusRevision||state.active)return;
      focusRevision=tv.focusRevision;if(!tv.browse){scrollFocus(document.getElementById('tvBrowse'),'scrollTop',0);return;}if(!tv.focusId)return;
      const card=[...stage.querySelectorAll('#tvCatalog .game')].find(n=>n.dataset.id===tv.focusId);if(!card)return;
      const view=document.getElementById('tvBrowse');const scale=stage.getBoundingClientRect().height/stage.offsetHeight||1;
      const rail=card.parentElement;
      if(rail.classList.contains('fresh-track'))scrollFocus(rail,'scrollLeft',rail.scrollLeft+(card.getBoundingClientRect().left-rail.getBoundingClientRect().left)/scale-20);
      scrollFocus(view,'scrollTop',view.scrollTop+(card.getBoundingClientRect().top-view.getBoundingClientRect().top)/scale-36);
      // The selected border is immediate feedback; stacking filter animations
      // during joystick repeats repaints the entire illustrated card.
    }
    // Arrivals: a newcomer gets a short welcome card with their avatar, bottom
    // left, away from the catalogue focus. Not on first load or on reconnects
    // of people already seen this session; at most three stacked.
    const seenPlayers=new Set();let seededPlayers=false;
    function welcome(players){
      const fresh=[];for(const p of players||[]){if(!p?.id||p.testBot)continue;if(!seenPlayers.has(p.id)){seenPlayers.add(p.id);if(seededPlayers)fresh.push(p);}}
      if(!seededPlayers){seededPlayers=true;return;}
      if(state?.active||!fresh.length)return;
      let host=document.getElementById('tvArrivals');
      if(!host){host=make('div','tv-arrivals');host.id='tvArrivals';host.setAttribute('aria-live','polite');(document.getElementById('tvStage')||document.body).append(host);}
      for(const p of fresh.slice(0,3)){
        const card=make('div','tv-arrival'),face=make('span','tv-arrival-face',Array.from(p.name||'?')[0].toUpperCase());
        if(safeAvatar(p.avatar)){const img=make('img');img.src=p.avatar;img.alt='';face.replaceChildren(img);face.classList.add('has-photo');}else window.HeyPalsAvatar?.paint(face,p.name);
        const copy=make('span','tv-arrival-copy'),name=make('b','',p.name);name.dataset.noTranslate='';copy.append(name,make('small','','В компании!'));card.append(face,copy);host.append(card);
        while(host.children.length>3)host.firstElementChild.remove();
        setTimeout(()=>{card.classList.add('is-leaving');setTimeout(()=>card.remove(),400);},2600);
      }
    }
    let layoutFrame=0;
    function scheduleLayout(){
      if(layoutFrame||document.hidden)return;
      layoutFrame=requestAnimationFrame(()=>{layoutFrame=0;followFocus();alignRoster();});
    }
    function update(next) {
      state=next;welcome(state?.players);
      if(!boot&&state?.bootId){boot=state.bootId;try{if(sessionStorage.getItem('lp-tv-intro:'+boot))finishStartup(true);}catch{}}
      const instance=state?.active?.instance||null;
      if(lastInstance!==instance){if(done)showTransition(instance?(state.catalog.find(g=>g.id===state.active.id)?.title||'Готовим игру'):'В компанию',{wait:!!instance,gameId:instance?state.active.id:null});lastInstance=instance;}
      updatePause();updateOverlay();scheduleLayout();
      if(!done&&state?.active)finishStartup(true);
    }
    function alignRoster(){
      const roster=document.querySelector('#tvSidebar>.company-people:not(.tv-invite)');
      if(roster&&roster.style.marginTop!=='0px')roster.style.marginTop='0px';
    }
    window.addEventListener('resize',scheduleLayout);
    const onVisibility=()=>{if(document.hidden){effects?.stop();cancelAnimationFrame(layoutFrame);layoutFrame=0;}else{updateOverlay();scheduleLayout();}};
    document.addEventListener('visibilitychange',onVisibility);
    const onPreference=()=>{if(reduced()&&!done&&connected&&state?.catalog?.length)finishStartup(true);updateOverlay();};
    const media=matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener?.('change',onPreference);
    window.addEventListener('pagehide',()=>{cancelAnimationFrame(layoutFrame);layoutFrame=0;effects?.destroy();clearTimeout(startupTimer);clearTimeout(startupFinish);clearTimeout(transitionTimer);overlayAnimation?.cancel();transitionAnimation?.cancel();});
    tickStartup();
    return Object.freeze({update,setConnected(value){connected=value;},canIdle:()=>done&&overlayMode==='none'&&!state?.tv?.browse&&state?.tv?.idleBrowse!==false,
      gameLoaded(){/* Transitions are short visual covers, never a gate on readiness. */},diagnostics:()=>({revision,ready:done,overlay:overlayMode,effectsRunning:!!effects?.running,particles:effects?.particles?.length||0,renderer:effects?.gl?'webgl2':'css-canvas'}),revision});
  }

  /** Procedural stage shading + bounded, ballistic sparkle trails. No dependency,
   * audio, flashing full-screen white, or idle game-loop. GPU use is optional. */
  class CelebrationFX {
    constructor(back,front){this.back=back;this.front=front;this.ctx=front.getContext('2d',{alpha:true});this.gl=null;this.frame=0;this.running=false;this.finished=false;this.effectKey='';this.particles=[];this.last=0;this.started=0;this.nextBurst=0;this.maxParticles=144;if(getComputedStyle(back).display!=='none')this.initGL();}
    initGL(){
      const gl=this.back.getContext('webgl2',{alpha:true,antialias:false,depth:false,powerPreference:'low-power'});if(!gl)return;
      const vertex=`#version 300 es\nin vec2 p;out vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
      const fragment=`#version 300 es
precision highp float;in vec2 uv;out vec4 outColor;uniform float t;uniform float aspect;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
void main(){vec2 p=(uv-.5)*vec2(aspect,1.);float n=noise(p*2.6+vec2(t*.035,-t*.02));float silk=sin(p.x*5.8+p.y*2.+n*4.+t*.16)*.5+.5;
float beam=exp(-abs(p.x+sin(p.y*3.+t*.1)*.12)*3.)*(.4+.6*silk);float ring=exp(-abs(length(p*vec2(.7,1.))- .33)*24.);
vec3 a=vec3(.045,.12,.13),b=vec3(.17,.075,.25),gold=vec3(.55,.38,.15);vec3 col=mix(a,b,silk)*(.5+.5*n)+gold*beam*.32+vec3(.17,.2,.1)*ring*.38;
col*=(1.-smoothstep(.18,.87,length(p*vec2(.5,1.))));outColor=vec4(col,1.);}`;
      const compile=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}return s;};
      const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs){if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);return;}
      const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);return;}
      gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      this.gl=gl;this.program=program;this.buffer=buffer;this.timeUniform=gl.getUniformLocation(program,'t');this.aspectUniform=gl.getUniformLocation(program,'aspect');
      this.back.addEventListener('webglcontextlost',()=>{this.gl=null;},{once:true});
    }
    // Canvas at the screen's real pixel size (not the 1280 logical stage), so glows stay sharp.
    size(){const parent=this.front.parentElement,w=Math.max(1,parent.offsetWidth),h=Math.max(1,parent.offsetHeight),box=this.front.getBoundingClientRect();this.w=w;this.h=h;
      const px=Math.min(1280,Math.max(w,Math.round(box.width*Math.min(1.5,window.devicePixelRatio||1))));
      this.front.width=px;this.front.height=Math.round(h*px/w);this.ctx?.setTransform(this.front.width/w,0,0,this.front.height/h,0,0);
      this.back.width=Math.min(960,w);this.back.height=Math.round(h*this.back.width/w);this.gl?.viewport(0,0,this.back.width,this.back.height);
    }
    // Pre-rendered glow sprites: the gradient reaches full transparency inside the sprite,
    // so a spark can never show a cut square edge.
    sprites(){if(this.glow)return this.glow;const make=color=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,31);
      r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.16,color);r.addColorStop(.42,color+'66');r.addColorStop(1,color+'00');g.fillStyle=r;g.fillRect(0,0,64,64);return c;};
      this.palette=['#ffd45c','#ff7ac3','#4fe0c8','#a98bff','#b8f35a','#6fb8ff','#ff6f7d','#fff1c9'];this.glow=this.palette.map(make);return this.glow;}
    spawn(p){if(this.particles.length<this.maxParticles)this.particles.push({age:0,px:p.x,py:p.y,drag:1.4,gravity:60,size:10,twinkle:false,flash:false,...p});}
    launch(){const side=Math.random()<.5,x=this.w*(side?.08+Math.random()*.26:.66+Math.random()*.26);
      this.spawn({kind:'rocket',x,y:this.h+8,vx:(this.w*.5-x)*.08*Math.random(),vy:-(this.h*(1.05+Math.random()*.35)),drag:.2,gravity:this.h*.62,life:3,size:9,color:7,apex:this.h*(.1+Math.random()*.28)});}
    explode(r){const S=this.h*.34,type=Math.random(),color=Math.floor(Math.random()*7),alt=(color+2+Math.floor(Math.random()*4))%7;
      this.spawn({x:r.x,y:r.y,vx:0,vy:0,life:.28,size:150,color,flash:true,gravity:0});
      if(type<.42){for(let i=0;i<34;i++){const a=Math.random()*Math.PI*2,v=S*(.55+Math.random()*.45);this.spawn({x:r.x,y:r.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1.3+Math.random()*.7,size:11+Math.random()*5,color:i%5?color:alt});}}
      else if(type<.72){for(let i=0;i<26;i++){const a=i/26*Math.PI*2,v=S*.92;this.spawn({x:r.x,y:r.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1.4,size:12,color});}
        for(let i=0;i<9;i++){const a=i/9*Math.PI*2,v=S*.42;this.spawn({x:r.x,y:r.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1.1,size:10,color:7});}}
      else{for(let i=0;i<32;i++){const a=Math.random()*Math.PI*2,v=S*(.35+Math.random()*.5);this.spawn({x:r.x,y:r.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-S*.1,life:2.4+Math.random()*.9,size:9+Math.random()*3,color:0,drag:1.05,gravity:34,twinkle:true});}}}
    draw(now){if(!this.running)return;this.frame=requestAnimationFrame(t=>this.draw(t));if(now-this.last<50)return;const dt=Math.min(.075,(now-this.last)/1000||.05);this.last=now;
      if(this.front.parentElement.offsetWidth!==this.w||this.front.parentElement.offsetHeight!==this.h)this.size();
      if(this.gl){const gl=this.gl;gl.uniform1f(this.timeUniform,(now-this.started)/1000);gl.uniform1f(this.aspectUniform,this.w/this.h);gl.drawArrays(gl.TRIANGLES,0,6);}
      const c=this.ctx;if(!c)return;const glow=this.sprites(),elapsed=now-this.started;
      // Fade the previous frame instead of clearing it: soft trails behind every spark.
      c.globalCompositeOperation='destination-out';c.globalAlpha=1;c.fillStyle='rgba(0,0,0,.3)';c.fillRect(0,0,this.w,this.h);
      c.globalCompositeOperation='lighter';
      if(elapsed<11000&&now>this.nextBurst){this.launch();if(elapsed>8600)this.launch();this.nextBurst=now+(elapsed>8600?260:480+Math.random()*520);}
      const next=[];
      for(const p of this.particles){p.age+=dt;p.px=p.x;p.py=p.y;const k=Math.exp(-p.drag*dt);p.vx*=k;p.vy=p.vy*k+p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
        if(p.kind==='rocket'){if(p.vy>-this.h*.12||p.y<p.apex){this.explode(p);continue;}if(this.particles.length<this.maxParticles-4)next.push({age:0,x:p.x+(Math.random()-.5)*3,y:p.y+6,px:p.x,py:p.y,vx:(Math.random()-.5)*14,vy:24,drag:2,gravity:40,life:.4,size:6,color:0});}
        if(p.age>=p.life)continue;
        let alpha=Math.pow(1-p.age/p.life,p.flash?1:1.3);if(p.twinkle)alpha*=.5+.5*Math.abs(Math.sin(p.age*23+p.x));
        const size=p.flash?p.size*(1+p.age*2):p.size*(1-.35*p.age/p.life);c.globalAlpha=Math.min(1,alpha*(p.flash?.45:1));
        if(!p.flash){c.globalAlpha*=.55;c.drawImage(glow[p.color],(p.x+p.px)/2-size*.45,(p.y+p.py)/2-size*.45,size*.9,size*.9);c.globalAlpha=Math.min(1,alpha);}
        c.drawImage(glow[p.color],p.x-size/2,p.y-size/2,size,size);next.push(p);}
      this.particles=next.slice(0,this.maxParticles);c.globalAlpha=1;c.globalCompositeOperation='source-over';
      if(elapsed>14000&&!this.particles.length){this.running=false;this.finished=true;cancelAnimationFrame(this.frame);this.frame=0;}
    }
    start(key){if(this.running||this.finished&&this.effectKey===key)return;this.effectKey=key;this.finished=false;this.running=true;this.started=performance.now();this.last=0;this.nextBurst=this.started+350;this.size();this.ctx?.clearRect(0,0,this.w,this.h);this.frame=requestAnimationFrame(t=>this.draw(t));}
    stop(){if(!this.running)return;this.running=false;cancelAnimationFrame(this.frame);this.frame=0;this.particles=[];this.ctx?.clearRect(0,0,this.w,this.h);}
    destroy(){this.stop();if(this.gl){this.gl.deleteBuffer(this.buffer);this.gl.deleteProgram(this.program);this.gl.getExtension('WEBGL_lose_context')?.loseContext();this.gl=null;}}
  }
  window.LocalPartyShow=Object.freeze({create,podiumOrder,revision});
})();
