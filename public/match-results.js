/* One shell result view for every engine. Only the active match's server result is shown. */
(() => {
  'use strict';
  let panel=null,lastKey='',layoutKey='',replayInstance=null,replayTimer=0,replayContext=null;
  const replayText=text=>window.PartyI18n?.t?.(text)||text;
  function resetReplay(message=''){clearTimeout(replayTimer);replayInstance=null;syncReplay();const status=panel?.querySelector('.hp-rematch-status');if(status)status.textContent=message;}
  function syncReplay(){const b=panel?.querySelector('.hp-rematch-button');if(!b)return;const pending=!!replayInstance;b.dataset.instance=replayContext?.active?.instance||'';b.disabled=pending||!!replayContext?.busy||!replayContext?.onReplay;b.setAttribute('aria-busy',String(pending));b.querySelector('span').textContent=replayText(pending?'Запускаем…':'Сыграть ещё раз');}
  function replayFooter(){const footer=make('footer','hp-result-actions'),b=make('button','hp-rematch-button quiet'),status=make('small','hp-rematch-status');b.id='resultRematch';b.type='button';b.append(make('span','','Сыграть ещё раз'));status.setAttribute('role','status');b.onclick=()=>{const c=replayContext;if(b.disabled||!c?.active?.instance||c.active.ui?.phase!=='results')return;replayInstance=c.active.instance;syncReplay();status.textContent='';try{if(c.onReplay?.(replayInstance)===false){resetReplay(replayText('Нет соединения. Попробуй ещё раз.'));return;}}catch{resetReplay(replayText('Не удалось начать. Попробуй ещё раз.'));return;}replayTimer=setTimeout(()=>resetReplay(replayText('Запуск не подтвердился. Нажми ещё раз.')),8000);};footer.append(b,status);return footer;}
  const seenReveals=new Set(),revealAnimations=new Set(),motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
  const settleReveal=()=>{for(const a of revealAnimations)a.cancel();revealAnimations.clear();};
  motionPreference.addEventListener?.('change',()=>{if(motionPreference.matches)settleReveal();});
  addEventListener('pagehide',settleReveal);addEventListener('party-native-hide',settleReveal);
  function revealRows(rows,resultKey){
    if(seenReveals.has(resultKey))return;seenReveals.add(resultKey);if(seenReveals.size>32)seenReveals.delete(seenReveals.values().next().value);
    if(motionPreference.matches||document.hidden)return;
    const style=getComputedStyle(document.documentElement),out=style.getPropertyValue('--motion-ease-out').trim()||'cubic-bezier(.16,1,.3,1)',pop=style.getPropertyValue('--motion-ease-pop').trim()||'cubic-bezier(.18,1.28,.35,1)';
    const play=(el,frames,options)=>{if(!el)return;const a=el.animate(frames,options);revealAnimations.add(a);a.finished.then(()=>revealAnimations.delete(a),()=>revealAnimations.delete(a));};
    for(const row of rows){const rank=Number(row.dataset.resultRank),delay=rank>3?0:rank===3?80:rank===2?160:240;
      play(row,[{transform:'translateY(8px) scale(.99)'},{transform:'none'}],{duration:300,delay,easing:out,fill:'backwards'});
      if(rank===1)play(row.querySelector('.hp-result-crown'),[{transform:'scale(.94)'},{transform:'none'}],{duration:420,delay:delay+240,easing:pop,fill:'backwards'});
    }
  }
  const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  // The shell owns the finish effect, so every engine gets the same celebration.
  // Remember result keys across reconnects; ordinary roster updates never replay it.
  const celebration=(()=>{
    const reduced=matchMedia('(prefers-reduced-motion: reduce)'),seen=new Set();
    const colors=['#ffe49d','#bbf58a','#b9a4ff','#72e6ec'];
    let canvas=null,ctx=null,frame=0,key='',started=0,last=0,burst=0,particles=[],width=0,height=0,starts=0;
    function stop(){cancelAnimationFrame(frame);frame=0;particles=[];canvas?.remove();canvas=null;ctx=null;}
    function resize(){if(!canvas)return;const r=canvas.parentElement?.getBoundingClientRect();if(!r)return;width=r.width;height=r.height;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx?.setTransform(ratio,0,0,ratio,0,0);}
    function explode(index){
      const x=width*[.16,.84,.5][index],y=height*[.27,.4,.16][index];
      for(let i=0;i<28;i++){const angle=Math.PI*2*i/28,speed=46+Math.random()*68;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,life:1.35+Math.random()*.4,color:colors[(i+index)%colors.length],size:1.2+Math.random()*1.6});}
      particles=particles.slice(-84);
    }
    function tick(now){
      if(!canvas?.isConnected||document.hidden||reduced.matches){stop();return;}
      const elapsed=now-started,dt=Math.min((now-last)/1000,.04);last=now;
      if(burst<3&&elapsed>=[0,620,1260][burst])explode(burst++);
      ctx.clearRect(0,0,width,height);
      for(const p of particles){p.age+=dt;p.vx*=Math.exp(-dt*.85);p.vy+=dt*27;p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.globalAlpha=Math.max(0,1-p.age/p.life)*.78;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
      particles=particles.filter(p=>p.age<p.life);ctx.globalAlpha=1;
      if((burst===3&&!particles.length)||elapsed>4500){stop();return;}
      frame=requestAnimationFrame(tick);
    }
    function show(parent,nextKey){
      if(key===nextKey&&canvas){parent.prepend(canvas);return;}
      stop();key=nextKey;
      if(seen.has(key))return;seen.add(key);if(seen.size>32)seen.delete(seen.values().next().value);
      if(reduced.matches||document.hidden)return;
      canvas=make('canvas','hp-result-fireworks');canvas.setAttribute('aria-hidden','true');
      Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',maxWidth:'none',margin:'0',pointerEvents:'none',zIndex:'0'});
      ctx=canvas.getContext('2d',{alpha:true});if(!ctx){stop();return;}
      parent.prepend(canvas);resize();started=last=performance.now();burst=0;starts++;frame=requestAnimationFrame(tick);
    }
    window.addEventListener('resize',resize);window.addEventListener('pagehide',stop);window.addEventListener('party-native-hide',stop);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});reduced.addEventListener?.('change',()=>{if(reduced.matches)stop();});
    return {show,stop,diagnostics:()=>({running:!!frame,particles:particles.length,key,starts})};
  })();
  function update({active,selfId,host=false,busy=false,onReplay}={}){
    replayContext={active,busy,onReplay};if(replayInstance&&(active?.instance!==replayInstance||active?.ui?.phase!=='results'))resetReplay();
    const result=active?.ui?.phase==='results'?active.result:null;
    const visible=!!result?.rows?.length;
    document.body.classList.toggle('hp-has-match-result',visible);
    if(!visible){if(panel)panel.hidden=true;lastKey='';settleReveal();celebration.stop();window.HeyPalsCoins?.stop();return;}
    if(!window.HeyPalsUI)return;
    if(!panel){panel=make('section','hp-match-results');panel.id='sharedMatchResults';panel.setAttribute('aria-labelledby','sharedResultTitle');panel.setAttribute('aria-live','polite');document.getElementById('play').append(panel);}
    panel.hidden=false;syncReplay();
    const key=JSON.stringify([result,selfId]);if(key===lastKey)return;lastKey=key;
    const resultKey=result.key||`${active.instance}:${active.id}`,nextLayout=JSON.stringify([resultKey,selfId,result.ranking?.kind,result.rows.map(r=>[r.id,r.rank])]);
    if(nextLayout===layoutKey&&panel.querySelector('.hp-result-list')){
      const rows=[...panel.querySelectorAll('.hp-result-row')];result.rows.forEach((entry,i)=>{const row=rows[i],name=row.querySelector('.hp-result-name'),value=row.querySelector('.hp-result-value');const target=name.querySelector('span')||name;if(target.textContent!==String(entry.name))target.textContent=entry.name;if(value)value.textContent=String(result.ranking?.kind==='teams'?entry.teamScore:entry.value??entry.score??'—');});
      panel.querySelector('.hp-result-game').textContent=result.title;panel.querySelector('.hp-result-subtitle').textContent=result.rows.find(p=>p.id===selfId)?.won?'Отличная игра!':'Результаты всей компании';window.PartyI18n?.apply?.(panel);celebration.show(panel,resultKey);return;
    }
    layoutKey=nextLayout;settleReveal();
    const heading=make('header','hp-result-header');
    const game=make('p','hp-result-game hp-heading',result.title);
    const title=make('h2','','Матч окончен');title.id='sharedResultTitle';
    const self=result.rows.find(p=>p.id===selfId);
    const subtitle=make('p','hp-result-subtitle',self?.won?'Отличная игра!': 'Результаты всей компании');
    heading.append(game,title,subtitle);
    const labels=make('div','hp-result-columns');labels.setAttribute('aria-hidden','true');
    const teams=result.ranking?.kind==='teams';
    for(const text of ['Место','Игрок',teams?'Счёт команды':'Счёт'])labels.append(make('span','',text));
    const content=make('div','hp-result-scroll');
    const displayRows=teams?result.rows.map(row=>({...row,value:row.teamScore})):result.rows;
    const list=window.HeyPalsUI.renderResults(content,displayRows,{selfId,label:'Результаты матча'});
    for(const [i,row] of [...list.children].entries()){
      row.dataset.resultRank=String(result.rows[i].rank);row.classList.toggle('is-self',result.rows[i].id===selfId);
      const firstPlace=result.rows[i].rank===1;
      row.classList.toggle('is-winner',firstPlace);
      if(result.rows[i].id===selfId){const name=row.querySelector('.hp-result-name');const wrapper=make('span','hp-result-name');name.className='';name.replaceWith(wrapper);const marker=make('small','hp-result-self','Это ты');wrapper.append(name,marker);}
    }
    panel.replaceChildren(heading,labels,content,replayFooter());syncReplay();
    for(const [i,row] of [...list.children].entries()){const earned=result.rows[i].coinsEarned;if(earned>0){const badge=window.HeyPalsCoins?.badge(earned);if(badge){const name=row.querySelector('.hp-result-name');if(!name.querySelector(':scope>span')){const label=make('span','',name.textContent);name.replaceChildren(label);}name.append(badge);window.HeyPalsCoins.award(badge,earned,`${resultKey}:${result.rows[i].id}`);}}}
    revealRows([...list.children],resultKey);
    for(const el of [heading,labels,content]){el.style.position='relative';el.style.zIndex='1';}
    celebration.show(panel,result.key||`${active.instance}:${active.id}`);
    // Hide obsolete controls visually without unloading their engine/socket.
    window.PartyI18n?.apply?.(panel);
  }
  window.HeyPalsMatchResults=Object.freeze({update,rejectRematch(message){if(replayInstance)resetReplay(message||replayText('Не удалось начать. Попробуй ещё раз.'));},diagnostics:celebration.diagnostics});
})();
