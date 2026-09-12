(()=>{
 if(!window.NAVAL_HOST_KEY)return;
 const $=id=>document.getElementById(id),workspace=document.querySelector('.screen-workspace'),stage=document.querySelector('.stage');
 if(!workspace||!stage)return;
 document.body.classList.add('naval-broadcast');
 const side=document.createElement('aside');side.className='naval-console panel';
 const heading=document.createElement('h2');heading.textContent='Капитанский мостик';side.append(heading,$('hostActions'));
 const standings=document.querySelector('.screen-standings');if(standings){const drawer=document.createElement('details'),label=document.createElement('summary');label.textContent='Все капитаны и счёт';drawer.append(label,standings);side.append(drawer);}
 workspace.prepend(side);document.querySelector('.screen-sidebar')?.remove();
 const feed=document.createElement('ol');feed.id='broadcastEvents';feed.setAttribute('aria-live','polite');
 const feedPanel=document.createElement('section');feedPanel.className='broadcast-feed';const feedTitle=document.createElement('h3');feedTitle.textContent='В эфире';feedPanel.append(feedTitle,feed);stage.append(feedPanel);
 const overview=$('oceanOverview');overview.classList.add('broadcast-fields');
 let lastKey='',phase='',events=[];
 function shotEffect(shot,s){
  const target=s.players.find(p=>p.id===shot.targetId)||s.players.find(p=>p.name===shot.target);
  const card=[...overview.children].find(c=>c.dataset.id===target?.id),cell=card?.querySelector('.miniOcean')?.children[shot.cell];
  if(!cell||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const r=cell.getBoundingClientRect(),base=stage.getBoundingClientRect(),effect=document.createElement('span');
  effect.className='naval-shot-effect '+shot.result;effect.style.left=(r.left-base.left+r.width/2)+'px';effect.style.top=(r.top-base.top+r.height/2)+'px';effect.style.width=effect.style.height=Math.max(14,Math.min(70,r.width*.7))+'px';effect.setAttribute('aria-hidden','true');stage.append(effect);
  const count=shot.result==='sunk'?14:shot.result==='hit'?10:7;
  for(let i=0;i<count;i++){const fragment=document.createElement('i');fragment.className='naval-fragment';effect.append(fragment);const angle=i/count*Math.PI*2,distance=Math.min(45,r.width*(shot.result==='sunk'?1.1:.8));fragment.animate([{transform:'translate(-50%,-50%) scale(.3)',opacity:1},{transform:`translate(${Math.cos(angle)*distance}px,${Math.sin(angle)*distance+(shot.result==='miss'?12:4)}px) rotate(${i*53}deg) scale(.3)`,opacity:0}],{duration:shot.result==='sunk'?700:500,easing:'cubic-bezier(.1,.65,.3,1)',fill:'forwards'});}
  effect.animate([{transform:'translate(-50%,-50%) scale(.2)',opacity:1},{transform:'translate(-50%,-50%) scale(1.15)',opacity:.85,offset:.3},{transform:'translate(-50%,-50%) scale(1.9)',opacity:0}],{duration:shot.result==='miss'?700:550,easing:'cubic-bezier(.15,.65,.3,1)'}).finished.finally(()=>effect.remove());
  for(const old of [...stage.querySelectorAll('.naval-shot-effect')].slice(0,-4))old.remove();
 }
 window.renderNavalBroadcast=s=>{
  if(phase!==s.phase&&s.phase==='battle'){events=[];lastKey='';}phase=s.phase;
  $('battle').hidden=true;overview.hidden=false;
  $('title').textContent=s.phase==='battle'?'Морской бой · прямой эфир':s.phase==='finished'?'Финальный залп':'Флоты выходят в море';
  if(s.phase==='finished')$('title').textContent='Победа · '+s.players.filter(p=>(s.winners||[]).includes(p.id)).map(p=>p.name).join(', ');
  const online=s.players.filter(p=>p.active||s.phase==='lobby');
  overview.style.setProperty('--fleet-columns',String(online.length<=2?2:online.length<=6?3:4));
  overview.style.setProperty('--fleet-rows',String(Math.max(1,Math.ceil(online.length/(online.length<=2?2:online.length<=6?3:4)))));
  // The broadcast shows only public shot results, never undiscovered ships.
  if(s.phase==='lobby'){
   overview.replaceChildren(...online.map(p=>{const card=document.createElement('article');card.dataset.id=p.id;card.className='oceanCard';const name=document.createElement('b');name.textContent=p.name;const grid=document.createElement('div');grid.className='miniOcean';for(let i=0;i<36;i++)grid.append(document.createElement('span'));card.append(name,grid);return card;}));
  }
  const shot=s.lastShot,key=shot?JSON.stringify(shot):'';
  if(key&&key!==lastKey){lastKey=key;shotEffect(shot,s);const result=shot.result==='sunk'?'потопление':shot.result==='hit'?'попадание':'мимо';events.unshift({text:shot.by+' → '+shot.target+' · '+result,result:shot.result});events=events.slice(0,4);}
  feed.replaceChildren(...(events.length?events:[{text:s.phase==='lobby'?'Ждём капитанов. Все поля будут видны здесь.':s.phase==='finished'?'Бой завершён. Итоги выше.':'Первый залп впереди',result:'waiting'}]).map(event=>{const row=document.createElement('li');row.textContent=event.text;row.dataset.result=event.result;return row;}));
 };
})();
