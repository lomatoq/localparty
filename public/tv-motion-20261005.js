/* HeyPals TV motion, 2026-10-05 (Claude "tv" lane). Presentation only.
 *
 * One motion language for the shared TV:
 *  - Scene changes (lobby -> game, game -> lobby, game -> another game) never cut.
 *    tv.js hands its render to gate(): two wall doors close over the outgoing scene,
 *    the new state is rendered behind them, the game's own wordmark lands on the seam,
 *    and the doors part over the incoming scene, which settles from a slight push-in.
 *  - Overlays that tv.js hides in one frame (waiting room, pause veil, notice, the
 *    match header) leave with a short exit instead of vanishing.
 *  - Entrances are staged: header, then content, then lists (45 ms stagger, max 10).
 * Transform and opacity only. Reduced motion: crossfades only, no movement.
 * Kill switch for A/B checks: /tv?motion=legacy. Server state is never delayed by more
 * than one door close (<=380 ms), and never while the TV tab is hidden. */
(() => {
  'use strict';
  const stage=document.getElementById('tvStage'),body=document.body;
  if(!stage||!body?.classList.contains('tv-screen'))return;
  if(/[?&]motion=legacy(?:&|$)/.test(location.search)){document.documentElement.dataset.tvMotion='legacy';return;}
  document.documentElement.classList.add('tvm-on');
  const revision='tv-motion-169';
  const nativeCurtain=window.webkit?.messageHandlers?.partyTVCurtain;
  if(nativeCurtain)document.documentElement.classList.add('tvm-native-curtain');
  const startup=document.getElementById('tvStartup');
  if(startup){const grain=document.createElement('i');grain.className='tvm-startup-grain';grain.setAttribute('aria-hidden','true');startup.append(grain);}
  const $=id=>document.getElementById(id);
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tokens live in tv-motion-20261005.css (extending motion.css); read once, lazily.
  let T=null;
  function tokens(){
    if(T)return T;
    const s=getComputedStyle(body),num=(n,f)=>{const v=parseFloat(s.getPropertyValue(n));return Number.isFinite(v)?v:f;},str=(n,f)=>s.getPropertyValue(n).trim()||f;
    T={veil:str('--motion-ease','cubic-bezier(.2,.78,.2,1)'),close:num('--tv-scene-close',380),hold:num('--tv-scene-hold',340),open:num('--tv-scene-open',460),enter:num('--tv-enter',420),exit:num('--tv-exit',220),stagger:num('--tv-stagger',45),
      out:str('--motion-ease-out','cubic-bezier(.16,1,.3,1)'),pop:str('--motion-ease-pop','cubic-bezier(.18,1.28,.35,1)'),travel:str('--motion-ease-travel','cubic-bezier(.77,0,.175,1)')};
    return T;
  }
  function play(el,frames,options){
    if(!el||typeof el.animate!=='function')return null;
    try{return el.animate(frames,{fill:'backwards',...options});}catch{return null;}
  }
  const visible=el=>!!el&&!el.hidden&&el.getClientRects().length>0;
  const zoom=()=>{const w=stage.offsetWidth;return w?stage.getBoundingClientRect().width/w:1;};

  /* ---------------- Scene curtain ---------------- */
  const curtain=$('tvSceneTransition'),heroLogo=$('tvTransitionLogo'),heroTitle=$('tvTransitionTitle');
  let doorL=null,doorR=null,seam=null,halo=null,brand=null;
  let failsafe=0,handoffNote='',cState='idle',gen=0,timers=[],anims=[],pending=null,committed=null,heroShown=null,recede=[],preparedLobby=[];
  function build(){
    if(doorL||!curtain)return;
    const doors=document.createElement('div');doors.className='tvm-doors';doors.setAttribute('aria-hidden','true');
    const door=side=>{const d=document.createElement('i'),p=document.createElement('i'),w=document.createElement('i');d.className='tvm-door tvm-door-'+side;p.className='tvm-panel';w.className='tvm-wall';p.append(w);d.append(p);return d;};
    doorL=door('l');doorR=door('r');seam=document.createElement('i');seam.className='tvm-seam';doors.append(doorL,doorR,seam);
    halo=document.createElement('i');halo.className='tvm-halo';halo.setAttribute('aria-hidden','true');
    brand=new Image();brand.className='tvm-brand';brand.alt='';brand.decoding='async';brand.src='/assets/branding/heypals-logo.png?v=rect2';
    curtain.prepend(doors,halo);curtain.append(brand);
  }
  const later=(fn,ms)=>{const g=gen,id=setTimeout(()=>{if(g===gen)fn();},ms);timers.push(id);return id;};
  function reset(){stage.classList.remove('tvm-menu-preparing');preparedLobby.forEach(a=>a.cancel());preparedLobby=[];gen++;timers.forEach(clearTimeout);timers=[];anims.forEach(a=>a?.cancel());anims=[];}
  const keep=a=>{if(a)anims.push(a);return a;};
  function endRecede(){recede.forEach(a=>a?.cancel());recede=[];}

  // Same wordmark source as tv-show.js; has-logo keeps its meaning for tests and CSS.
  function setHero(gameId,title){
    heroTitle.textContent=title||'';curtain.classList.remove('has-logo');heroLogo.hidden=true;heroLogo.onload=heroLogo.onerror=null;
    if(!gameId){heroShown=heroTitle;return heroTitle;}
    const src='/assets/game-logos-v1/logos/'+encodeURIComponent(gameId)+'.png?v=1';
    const ready=()=>heroLogo.complete&&heroLogo.naturalWidth>0;
    const use=()=>{heroLogo.hidden=false;curtain.classList.add('has-logo');heroShown=heroLogo;};
    if(heroLogo.getAttribute('src')!==src)heroLogo.src=src;
    if(ready()){use();return heroLogo;}
    heroShown=heroTitle;
    // A wordmark that arrives while the doors are still closed swaps in with a short pop.
    heroLogo.onload=()=>{if(!['closing','closed','revealing'].includes(cState)||!heroLogo.naturalWidth)return;use();keep(play(heroLogo,[{opacity:0,scale:.94},{opacity:1,scale:1}],{duration:240,easing:tokens().out}));};
    heroLogo.onerror=()=>{heroLogo.hidden=true;curtain.classList.remove('has-logo');};
    return heroTitle;
  }
  function heroIn(delay){
    const t=tokens(),hero=heroShown,eyebrow=curtain.querySelector(':scope>span');
    if(reduced()){keep(play(hero,[{opacity:0},{opacity:1}],{duration:200,delay,easing:'ease'}));keep(play(halo,[{opacity:0},{opacity:1}],{duration:200,delay,fill:'both'}));return;}
    keep(play(halo,[{opacity:0,scale:.82},{opacity:1,scale:1}],{duration:t.enter,delay,easing:t.out,fill:'both'}));
    keep(play(hero,[{opacity:0,transform:'translateY(18px) scale(.9)'},{opacity:1,transform:'none'}],{duration:t.enter,delay,easing:t.pop}));
    if(eyebrow&&!curtain.classList.contains('tvm-to-lobby'))keep(play(eyebrow,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:t.enter-80,delay:delay+90,easing:t.out}));
  }
  function outgoing(){
    if(visible($('tvPresentation')))return [$('tvPresentation')];
    if(!$('play').hidden)return [$('play')];
    return [$('lobby'),stage.querySelector(':scope>.tv-header')].filter(visible);
  }
  function closeDoors(to,hero){
    build();reset();endRecede();
    const t=tokens(),toLobby=to==='lobby',d=toLobby?t.close-40:t.close;
    if(toLobby)stage.classList.add('tvm-menu-preparing');
    curtain.classList.remove('tvm-resume');curtain.classList.add('tvm-curtain');curtain.classList.toggle('tvm-to-lobby',toLobby);
    if(toLobby)heroShown=brand;else setHero(hero.gameId,hero.title);
    curtain.hidden=false;cState='closing';
    if(nativeCurtain){const g=gen;return nativeCurtain.postMessage('close').then(()=>{if(g===gen)cState='closed';});}
    // Fail-safe: whatever happens, the curtain never stays over the TV for long.
    const fg=gen;clearTimeout(failsafe);failsafe=setTimeout(()=>{if(gen===fg&&cState!=='idle'&&!pending){curtain.hidden=true;curtain.classList.remove('tvm-curtain','tvm-to-lobby');reset();cState='idle';flushQueued();}},3200);
    return new Promise(resolve=>{
      const g=gen,done=()=>{if(g!==gen)return;cState='closed';requestAnimationFrame(()=>requestAnimationFrame(()=>{if(g===gen)resolve();}));};
      if(reduced()){keep(play(curtain,[{opacity:0},{opacity:1}],{duration:200,easing:'ease'}));heroIn(120);later(done,210);return;}
      keep(play(doorL,[{transform:'translateX(-101%)',easing:t.travel},{transform:'translateX(.8%)',offset:.86,easing:'ease-out'},{transform:'translateX(0)'}],{duration:d}));
      keep(play(doorR,[{transform:'translateX(101%)',easing:t.travel},{transform:'translateX(-.8%)',offset:.86,easing:'ease-out'},{transform:'translateX(0)'}],{duration:d}));
      keep(play(seam,[{opacity:0,transform:'skewX(-8deg) scaleY(.35)'},{opacity:1,transform:'skewX(-8deg) scaleY(1)',offset:.3},{opacity:0,transform:'skewX(-8deg) scaleY(1.04)'}],{duration:560,delay:d*.8,easing:t.out}));
      // The outgoing scene recedes under the doors (one transformed layer each).
      // Keep the live scene in its existing layers. Scaling the complete masked /
      // backdrop-filtered catalog or game forces huge WebKit surface re-rasterization.
      heroIn(toLobby?d-120:d-180);
      later(done,d);
    });
  }
  // Wait briefly for the waiting room's wordmark so the curtain copy can land on it.
  function openWhenReady(waited=0){
    const heading=$('waitingGameTitle'),wantsLogo=!curtain.classList.contains('tvm-to-lobby')&&heroShown===heroLogo&&visible($('waiting'));
    if(wantsLogo&&heading&&!heading.classList.contains('waiting-logo-loaded')&&waited<160){later(()=>openWhenReady(waited+40),40);return;}
    const g=gen;
    if(curtain.classList.contains('tvm-to-lobby'))preparedLobby=settleLobby(tokens().open,true);
    // Loading / shader compilation must happen behind closed doors, including
    // the first real GPU frames. Two RAFs alone run before the iframe is ready.
    clearTimeout(failsafe);
    const started=performance.now();let readySince=0,readyFrames=0;
    const prepared=now=>{
      if(g!==gen||cState!=='revealing')return;
      const frame=$('gameFrame');let ready=true;
      if(!curtain.classList.contains('tvm-to-lobby')&&frame?.getAttribute('src')?.startsWith('/games/')){
        try{const doc=frame.contentDocument;ready=!!doc&&doc.readyState==='complete'&&frame.contentWindow.location.pathname.startsWith('/games/')&&doc.body?.dataset.shaderWarmup!=='pending';}catch{ready=false;}
      }
      // Readiness comes from the loaded document and explicit shader warmup.
      // Requiring eight <50ms main-frame gaps kept already-ready games covered
      // for twelve seconds on a busy AirPlay renderer. Allow real drawn frames
      // to settle without using a high FPS threshold as a loading condition.
      if(ready){if(!readySince)readySince=now;readyFrames++;}else{readySince=readyFrames=0;}
      if((readyFrames>=2&&now-readySince>=100)||now-started>12000){openDoors();return;}
      requestAnimationFrame(prepared);
    };
    requestAnimationFrame(prepared);
  }
  function openDoors(){
    const t=tokens(),g=gen,toLobby=curtain.classList.contains('tvm-to-lobby');cState='opening';
    // The covered grid has already reached its destination. Re-enable normal
    // browsing reflow before revealing it; entrance motion stays compositor-only.
    stage.classList.remove('tvm-menu-preparing');
    const finish=()=>{if(g!==gen)return;curtain.hidden=true;curtain.classList.remove('tvm-curtain','tvm-to-lobby');reset();cState='idle';flushQueued();};
    if(nativeCurtain){nativeCurtain.postMessage('open').then(finish);return;}
    if(reduced()){keep(play(curtain,[{opacity:1},{opacity:0}],{duration:240,easing:'ease',fill:'forwards'}));later(finish,250);return;}
    const d=t.open;
    keep(play(doorL,[{transform:'translateX(0)'},{transform:'translateX(-101%)'}],{duration:d,easing:t.out,fill:'forwards'}));
    keep(play(doorR,[{transform:'translateX(0)'},{transform:'translateX(101%)'}],{duration:d,easing:t.out,fill:'forwards'}));
    keep(play(halo,[{opacity:1},{opacity:0}],{duration:d*.6,easing:t.out,fill:'forwards'}));
    const eyebrow=curtain.querySelector(':scope>span');if(eyebrow)keep(play(eyebrow,[{opacity:1},{opacity:0}],{duration:160,fill:'forwards'}));
    // Only the doors move; don't re-rasterize the full incoming WebGL/blur surface.
    const handed=!toLobby&&handOff(d);
    if(!handed)keep(play(heroShown,toLobby?[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(-10px) scale(1.04)'}]:[{opacity:1},{opacity:0}],{duration:toLobby?t.exit:160,easing:t.out,fill:'forwards'}));
    // Entrances are created now (hidden from the first opening frame) and delayed,
    // so nothing is seen, removed and shown again.
    if(toLobby){enterMenuCharacters();if(preparedLobby.length){const ready=preparedLobby;preparedLobby=[];ready.forEach(a=>a.play());}else settleLobby(d);}
    else if(visible($('waiting')))enterWaiting(handed,d*.35);
    later(finish,d+20);
  }
  // The curtain wordmark flies into the waiting room's own wordmark (same artwork),
  // so the game's identity never blinks between the two screens.
  function handOff(d){
    const target=$('waitingGameTitle')?.querySelector('.waiting-game-logo');
    handoffNote=heroShown!==heroLogo?'hero-not-logo':!target?'no-target':!visible(target)?'target-hidden':!target.naturalWidth?'target-unloaded':'ok';
    if(handoffNote!=='ok')return false;
    const paint=img=>{const r=img.getBoundingClientRect(),a=img.naturalWidth/img.naturalHeight,w=Math.min(r.width,r.height*a),h=w/a;return{x:r.left+r.width/2,y:r.top+r.height/2,w,h};};
    const from=paint(heroLogo),to=paint(target),z=zoom();
    if(!from.w||!to.w)return false;
    const dx=(to.x-from.x)/z,dy=(to.y-from.y)/z,s=to.w/from.w;
    const t=tokens();
    keep(play(heroLogo,[{transform:'none',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(${s})`,opacity:1}],{duration:d,easing:t.out,fill:'forwards'}));
    // Real wordmark stays invisible until the flying copy lands exactly on it. The
    // visible copy is game-logo-renderer's smoothed canvas when it exists.
    const painted=target.parentElement?.querySelector(':scope>.hp-smooth-game-logo:not([hidden])')||target;
    play(painted,[{opacity:0},{opacity:0,offset:.97},{opacity:1}],{duration:d+10});
    return true;
  }

  // Called by tv.js for every authoritative state. Returns true when it will render later.
  function sceneKey(s){return s?.active?.instance?'game:'+s.active.instance:'lobby';}
  function gate(s,render){
    const key=sceneKey(s);
    if(pending){pending.render=render;pending.state=s;return true;}
    const ready=stage.classList.contains('tv-show-ready')&&$('tvStartup')?.hidden!==false;
    if((committed===null&&!s.active)||key===committed||(!ready&&!s.active)||document.hidden||!curtain){committed=key;return false;}
    const game=s.active?s.catalog?.find(g=>g.id===s.active.id):null;
    pending={render,state:s};committed=key;
    closeDoors(s.active?'game':'lobby',{gameId:game?.id||null,title:game?.title||''}).then(()=>{if(pending)commit();else if(cState==='closed'){cState='revealing';later(openWhenReady,openDelay());}});
    // Watchdog: the state can never wait on a stalled animation.
    const p=pending;setTimeout(()=>{if(pending===p)commit();},tokens().close+400);
    return true;
  }
  function commit(){
    const p=pending;if(!p)return;pending=null;
    try{p.render();}catch(e){setTimeout(()=>{throw e;});}
    committed=sceneKey(p.state);endRecede();
    // tv-show normally asks for the scene (scene() below); if it did not, open anyway.
    // A watchdog commit during a stalled close opens once the close resolves.
    if(cState==='closed'){cState='revealing';later(openWhenReady,openDelay());}
  }
  function openDelay(){
    // Doors part once the wordmark has landed and been readable for a beat.
    const t=tokens();if(reduced())return curtain.classList.contains('tvm-to-lobby')?80:t.hold;
    return curtain.classList.contains('tvm-to-lobby')?160:Math.max(160,t.hold);
  }
  // Hook from tv-show.js showTransition(). true = handled here.
  function scene(title,{wait=false,gameId=null,kind=''}={}){
    if(!curtain)return false;
    if(kind==='resume'){if(pending||['closing','closed','revealing','opening'].includes(cState))return true;return resume(title);}
    if(cState==='closing'||cState==='closed'||cState==='revealing'){
      // The destination may have changed while the doors were closing (stop + relaunch).
      const toLobby=curtain.classList.contains('tvm-to-lobby');
      if(gameId&&(toLobby||heroShown!==heroLogo)){curtain.classList.remove('tvm-to-lobby');const hero=setHero(gameId,title);keep(play(hero,[{opacity:0,scale:.94},{opacity:1,scale:1}],{duration:240,easing:tokens().out}));}
      else if(!gameId&&!toLobby&&!$('lobby').hidden){curtain.classList.add('tvm-to-lobby');heroShown=brand;keep(play(brand,[{opacity:0,scale:.94},{opacity:1,scale:1}],{duration:240,easing:tokens().out}));}
      if(cState==='closed'){cState='revealing';later(openWhenReady,openDelay());}
      return true;
    }
    if(cState==='opening')return true;
    // A restored/late TV can reach showTransition without passing the ready gate.
    // It must still use the same doors, never the old independent fade timer.
    closeDoors(gameId?'game':'lobby',{gameId,title}).then(()=>{if(cState==='closed'){cState='revealing';later(openWhenReady,openDelay());}});
    return true;
  }
  function resume(title){
    const t=tokens();reset();endRecede();
    curtain.classList.remove('tvm-curtain','tvm-to-lobby','has-logo');curtain.classList.add('tvm-resume');
    heroTitle.textContent=title;heroLogo.hidden=true;curtain.hidden=false;cState='resume';
    const g=gen,end=()=>{if(g!==gen)return;curtain.hidden=true;curtain.classList.remove('tvm-resume');reset();cState='idle';flushQueued();};
    if(reduced()){keep(play(heroTitle,[{opacity:0},{opacity:1}],{duration:160}));later(()=>keep(play(heroTitle,[{opacity:1},{opacity:0}],{duration:200,fill:'forwards'})),560);later(end,780);return true;}
    // Enters just after the pause card has lifted away, so the two never overlap.
    keep(play(heroTitle,[{opacity:0,transform:'translateY(12px) scale(.9)'},{opacity:1,transform:'none'}],{duration:340,delay:140,easing:t.pop}));
    later(()=>keep(play(heroTitle,[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(-10px) scale(1.03)'}],{duration:t.exit,easing:t.out,fill:'forwards'})),760);
    later(end,760+t.exit+20);
    return true;
  }

  /* ---------------- Entrances ---------------- */
  // Loader -> lobby: the loader lifts away while the lobby is already entering beneath it.
  function leaveStartup(loader,end){
    if(!loader)return false;
    if(cState!=='idle'){end();return true;}
    build();reset();
    curtain.classList.add('tvm-curtain','tvm-to-lobby');
    heroShown=brand;curtain.hidden=false;cState='revealing';
    // Render the first menu while fully covered, then use the same prepared opening.
    end();
    later(openWhenReady,120);
    return true;
  }
  function stagger(list,frames,{delay=0,duration,easing,cap=10}={}){
    const t=tokens();list.forEach((el,i)=>play(el,frames,{duration:duration||t.enter,delay:delay+Math.min(i,cap)*t.stagger,easing:easing||t.out}));
  }
  function inView(el){if(!visible(el))return false;const r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;}
  let heroWasShown=false,heroEntrance=null;
  function enterMenuCharacters(){
    const hero=stage.querySelector('#lobby .heypals-hero');
    const shown=hero&&!$('lobby').hidden&&stage.classList.contains('tv-show-ready')&&!stage.classList.contains('tv-has-choice')&&!stage.classList.contains('tv-browsing');
    if(!shown){heroWasShown=false;heroEntrance?.cancel();heroEntrance=null;return;}
    if(heroWasShown||!['idle','opening'].includes(cState))return;
    heroWasShown=true;if(reduced())return;
    // Independent translation keeps the existing gentle breathing transform intact.
    heroEntrance=play(hero,[{translate:'0 96px',opacity:0},{translate:'0 0',opacity:1}],{duration:tokens().enter*3,easing:tokens().out});
  }
  const heroObserver=new MutationObserver(enterMenuCharacters);
  heroObserver.observe(stage,{attributes:true,attributeFilter:['class']});
  if($('lobby'))heroObserver.observe($('lobby'),{attributes:true,attributeFilter:['hidden']});
  function enterLobby(kind){
    if(cState!=='idle')return true;
    enterMenuCharacters();
    if(reduced())return kind==='startup';
    const header=stage.querySelector(':scope>.tv-header'),t=tokens();
    if(visible(header))play(header,[{opacity:0,translate:'0 -22px'},{opacity:1,translate:'0 0'}],{duration:t.enter,easing:t.out});
    const main=[...stage.querySelectorAll('#lobby>.intro,#tvBrowse>.tv-choice,#tvCatalog .section-title,#tvCatalog .fresh-heading,#tvCatalog .game')].filter(inView);
    const boxes=new Map(main.map(el=>[el,el.getBoundingClientRect()]));
    main.sort((a,b)=>{const ra=boxes.get(a),rb=boxes.get(b);return ra.top-rb.top||ra.left-rb.left;});
    stagger(main,[{opacity:0,transform:'translateY(22px) scale(.97)'},{opacity:1,transform:'none'}],{delay:70,duration:t.enter+100});
    const side=[...stage.querySelectorAll('#tvSidebar>section')].filter(inView);
    stagger(side,[{opacity:0,translate:'26px 0'},{opacity:1,translate:'0 0'}],{delay:140,duration:t.enter+60});
    return true;
  }
  function enterWaiting(handed,base=0){
    if(reduced())return;
    const w=$('waiting'),t=tokens();if(!visible(w))return;
    const parts=[handed?null:$('waitingGameTitle'),$('waitingTitle'),$('waitingHint')].filter(visible);
    stagger(parts,[{opacity:0,translate:'0 16px'},{opacity:1,translate:'0 0'}],{delay:base});
    const chips=[...w.querySelectorAll('#readyPlayers>.ready-player')].filter(visible);
    stagger(chips,[{opacity:0,translate:'0 12px',scale:.92},{opacity:1,translate:'0 0',scale:1}],{delay:base+parts.length*t.stagger+60,duration:t.enter-60,easing:t.pop,cap:12});
    const count=$('readyCount');if(visible(count))play(count,[{opacity:0},{opacity:1}],{duration:t.enter,delay:base+parts.length*t.stagger+120+Math.min(chips.length,12)*t.stagger});
  }
  // Return to the lobby: the doors part from the seam outwards, so content settles in
  // the same order (nearest the seam first). Already visible, so no opacity change.
  function settleLobby(d,prepare=false){
    if(!prepare)enterMenuCharacters();
    if(reduced())return [];
    const animations=[],run=(...args)=>{const a=play(...args);if(a&&prepare){a.pause();a.currentTime=0;animations.push(a);}return a;};
    const t=tokens(),cx=innerWidth/2;
    const items=[...stage.querySelectorAll('#lobby>.intro,#tvBrowse>.tv-choice,#tvCatalog .section-title,#tvCatalog .fresh-heading,#tvCatalog .game,#tvSidebar>section')].filter(inView);
    const boxes=items.map(el=>[el,el.getBoundingClientRect()]);
    for(const [el,r] of boxes){const far=Math.min(1,Math.abs(r.left+r.width/2-cx)/cx);
      run(el,[{translate:'0 18px'},{translate:'0 0'}],{duration:t.enter+80,delay:Math.round(far*d*.55),easing:t.out});}
    const header=stage.querySelector(':scope>.tv-header');
    if(visible(header))run(header,[{translate:'0 -64px'},{translate:'0 0'}],{duration:t.enter,delay:d*.45,easing:t.out});
    return animations;
  }

  /* ---------------- Overlay exits and the match header ---------------- */
  function ghost(el,{content=[],veilDelay=60,lift=-14,veil}={}){
    const t=tokens();el.classList.add('tvm-ghost');
    const quick=reduced();
    content.filter(Boolean).forEach((n,i)=>play(n,quick?[{opacity:1},{opacity:0}]:[{opacity:1,translate:'0 0'},{opacity:0,translate:`0 ${lift}px`}],{duration:t.exit,delay:i*25,easing:t.out,fill:'forwards'}));
    const d=veil||t.exit+120,a=play(el,[{opacity:1},{opacity:0}],{duration:d,delay:quick?0:veilDelay,easing:t.veil,fill:'forwards'});
    const done=()=>{if(!el.hidden)return;el.classList.remove('tvm-ghost');el.getAnimations().forEach(x=>x.cancel());content.forEach(n=>n?.getAnimations().forEach(x=>x.cancel()));};
    if(a)a.finished.then(done,done);else done();
  }
  function unghost(el){if(!el.classList.contains('tvm-ghost'))return;el.classList.remove('tvm-ghost');el.getAnimations().forEach(x=>x.cancel());for(const n of el.querySelectorAll('*'))n.getAnimations().forEach(x=>x.cancel());}
  function pauseIn(layer){
    const t=tokens();
    // Replace tv-show's generic fade with a staged one (veil, then title, then hint).
    layer.getAnimations().forEach(a=>{if(!(a instanceof CSSAnimation))a.cancel();});
    if(reduced()){play(layer,[{opacity:0},{opacity:1}],{duration:200});return;}
    play(layer,[{opacity:0},{opacity:1}],{duration:280,easing:t.veil});
    play($('pauseTitle'),[{opacity:0,translate:'0 14px',scale:.96},{opacity:1,translate:'0 0',scale:1}],{duration:t.enter-40,delay:70,easing:t.pop});
    play($('pauseHint'),[{opacity:0,translate:'0 10px'},{opacity:1,translate:'0 0'}],{duration:t.enter-80,delay:150,easing:t.out});
  }
  // The match header (notch/rail cap) drops in after the scene lands and retracts when
  // it ends. Its exit is a detached visual copy: the real bar must leave layout at once
  // because tv.js measures it to size the game frame.
  const bar=stage.querySelector('#play>.gamebar');
  let barHiddenAt=0,barShownAt=0,dockBox=null,queued=[];
  function flushQueued(){const q=queued;queued=[];q.forEach(fn=>fn());}
  function rememberDock(){const dock=bar?.querySelector('.tv-info-dock');if(!dock||bar.hidden)return;const r=dock.getBoundingClientRect(),p=$('play').getBoundingClientRect(),z=zoom();if(r.width)dockBox={left:(r.left-p.left)/z,top:(r.top-p.top)/z,width:r.width/z,height:r.height/z};}
  function barIn(){
    const dock=bar.querySelector('.tv-info-dock');if(!dock||!visible(bar))return;
    const t=tokens(),mode=body.dataset.tvHudMode||'centered-scoreboard';
    if(reduced()){play(dock,[{opacity:0},{opacity:1}],{duration:200});return;}
    if(mode==='centered-scoreboard')play(dock,[{translate:'0 -112%'},{translate:'0 0'}],{duration:t.enter+60,delay:120,easing:t.out});
    else play(dock,[{opacity:0,translate:'0 -16px',scale:.98},{opacity:1,translate:'0 0',scale:1}],{duration:t.enter,delay:120,easing:t.out});
    const parts=[dock.querySelector('.tv-info-center'),dock.querySelector('.tv-info-left'),dock.querySelector('.tv-info-right')].filter(visible);
    stagger(parts,[{opacity:0,translate:'0 -6px'},{opacity:1,translate:'0 0'}],{delay:200,duration:t.enter-100});
    requestAnimationFrame(rememberDock);
  }
  function barOut(){
    const dock=bar.querySelector('.tv-info-dock');if(!dock||!dockBox)return;
    const t=tokens(),copy=document.createElement('div');
    copy.className=bar.className+' tvm-bar-ghost';copy.setAttribute('aria-hidden','true');
    for(const a of bar.attributes)if(a.name.startsWith('data-'))copy.setAttribute(a.name,a.value);
    copy.style.cssText=bar.style.cssText;
    const clone=dock.cloneNode(true);clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));clone.removeAttribute('id');
    clone.style.left=dockBox.left+'px';clone.style.top=dockBox.top+'px';clone.style.width=dockBox.width+'px';
    copy.append(clone);$('play').append(copy);
    const mode=body.dataset.tvHudMode||'centered-scoreboard';
    const a=play(clone,reduced()?[{opacity:1},{opacity:0}]:mode==='centered-scoreboard'?[{translate:'0 0'},{translate:'0 -112%'}]:[{opacity:1,translate:'0 0'},{opacity:0,translate:'0 -14px'}],{duration:t.exit+60,easing:t.out,fill:'forwards'});
    const done=()=>copy.remove();if(a)a.finished.then(done,done);else done();
  }
  function onBar(){
    const now=performance.now();
    if(bar.hidden){barHiddenAt=now;if(now-barShownAt>300)barOut();return;}
    barShownAt=now;
    if(now-barHiddenAt<700&&barHiddenAt)return;           // rapid phase flicker: no replay
    if(cState!=='idle'){queued.push(barIn);return;}
    barIn();
  }
  // Lobby roster: only a person who was not on the list before springs in; rebuilds for
  // photos, order or rating never replay it (ui-regression-rules: no re-entrance on refresh).
  const roster=$('players'),seenNames=new Set();let rosterSeeded=false;
  const rowName=row=>row.querySelector(':scope>b')?.textContent||'';
  function onRoster(){
    const rows=[...roster.querySelectorAll(':scope>.player:not(.tv-more)')];
    if(!rosterSeeded){if(!rows.length)return;rosterSeeded=true;rows.forEach(r=>seenNames.add(rowName(r)));return;}
    const fresh=rows.filter(r=>{const n=rowName(r);if(!n||seenNames.has(n))return false;seenNames.add(n);return true;});
    if(!fresh.length||reduced()||$('lobby').hidden||cState!=='idle')return;
    const t=tokens();
    stagger(fresh.filter(visible),[{opacity:0,translate:'-16px 0',scale:.94},{opacity:1,translate:'0 0',scale:1}],{duration:t.enter,easing:t.pop,cap:4});
  }
  if(roster){onRoster();new MutationObserver(onRoster).observe(roster,{childList:true});}

  const watched=new Map();
  function observe(el,handler){if(!el)return;watched.set(el,el.hidden);mo.observe(el,{attributes:true,attributeFilter:['hidden']});}
  const mo=new MutationObserver(records=>{
    const seen=new Set();
    for(const r of records){const el=r.target;if(seen.has(el))continue;seen.add(el);
      const was=watched.get(el),now=el.hidden;if(was===now)continue;watched.set(el,now);
      try{handlers.get(el)?.(now,was);}catch(e){setTimeout(()=>{throw e;});}
    }
  });
  const handlers=new Map();
  const on=(el,fn)=>{if(!el)return;handlers.set(el,fn);observe(el);};
  on($('waiting'),hidden=>{
    const w=$('waiting');
    if(!hidden){unghost(w);if(cState==='idle')enterWaiting(false);return;}
    if(!$('play').hidden&&cState==='idle')ghost(w,{content:[$('waitingGameTitle'),$('waitingTitle'),$('waitingHint'),$('readyPlayers'),$('readyCount')],lift:-18,veil:420,veilDelay:90});
  });
  on($('paused'),hidden=>{
    const p=$('paused');
    if(!hidden){unghost(p);pauseIn(p);return;}
    if(!$('play').hidden&&cState!=='closing'&&cState!=='closed')ghost(p,{content:[$('pauseTitle'),$('pauseHint')],veil:320,veilDelay:80});
  });
  on($('notice'),hidden=>{const n=$('notice');if(!hidden){unghost(n);return;}ghost(n,{lift:10,veil:tokens().exit,veilDelay:0});});
  on(bar,onBar);
  // Dock geometry follows tv.js's --tv-hud-* properties; remember it for the exit copy.
  let dockFrame=0;
  const queueDock=()=>{if(!dockFrame)dockFrame=requestAnimationFrame(()=>{dockFrame=0;rememberDock();});};
  if(bar)new MutationObserver(records=>{if(records.some(r=>r.oldValue!==r.target.getAttribute(r.attributeName)))queueDock();}).observe(bar,{attributes:true,attributeOldValue:true,attributeFilter:['style','data-layout']});
  addEventListener('resize',()=>requestAnimationFrame(rememberDock));
  addEventListener('pagehide',()=>{reset();endRecede();mo.disconnect();heroObserver.disconnect();heroEntrance?.cancel();});

  window.HeyPalsTVMotion=Object.freeze({revision,gate,held:()=>!!pending,scene,enterLobby,leaveStartup,
    diagnostics:()=>({revision,handoff:handoffNote,state:cState,pending:!!pending,committed,curtain:!!curtain&&!curtain.hidden})});
})();
