/* One shell result view for every engine. Only the active match's server result is shown. */
(() => {
  'use strict';
  let panel=null,lastKey='';
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
  function update({active,selfId,host=false}={}){
    const result=active?.ui?.phase==='results'?active.result:null;
    const visible=!host&&!!result?.rows?.length;
    document.body.classList.toggle('hp-has-match-result',visible);
    if(!visible){if(panel)panel.hidden=true;lastKey='';celebration.stop();return;}
    if(!window.HeyPalsUI)return;
    if(!panel){panel=make('section','hp-match-results');panel.id='sharedMatchResults';panel.setAttribute('aria-labelledby','sharedResultTitle');panel.setAttribute('aria-live','polite');document.getElementById('play').append(panel);}
    panel.hidden=false;
    const key=JSON.stringify([result,selfId]);if(key===lastKey)return;lastKey=key;
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
      row.classList.toggle('is-self',result.rows[i].id===selfId);
      const firstPlace=result.rows[i].rank===1;
      row.classList.toggle('is-winner',firstPlace);
      if(result.rows[i].id===selfId){const name=row.querySelector('.hp-result-name');const wrapper=make('span','hp-result-name');name.className='';name.replaceWith(wrapper);const marker=make('small','hp-result-self','Это ты');wrapper.append(name,marker);}
    }
    panel.replaceChildren(heading,labels,content);
    // Scores count up as their rows land (plain integers only; text such as
    // "—" or formatted money is left as the engine wrote it).
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)[...content.querySelectorAll('.hp-result-value')].forEach((node,i)=>{
      const final=node.textContent.trim();if(!/^[-−]?\d{1,6}$/.test(final)||Number(final.replace('−','-'))===0)return;
      const target=Number(final.replace('−','-')),start=performance.now()+120+Math.min(i,7)*45,duration=650;node.textContent='0';
      const tick=now=>{if(!node.isConnected)return;const t=Math.min(1,Math.max(0,(now-start)/duration)),e=1-Math.pow(1-t,3);node.textContent=t>=1?final:String(Math.round(target*e)).replace('-','−');if(t<1)requestAnimationFrame(tick);};
      requestAnimationFrame(tick);
    });
    for(const el of [heading,labels,content]){el.style.position='relative';el.style.zIndex='1';}
    celebration.show(panel,result.key||`${active.instance}:${active.id}`);
    // Hide obsolete controls visually without unloading their engine/socket.
    window.PartyI18n?.apply?.(panel);
  }
  window.HeyPalsMatchResults=Object.freeze({update,diagnostics:celebration.diagnostics});
})();
