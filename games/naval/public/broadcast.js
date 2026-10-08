(()=>{
 if(!window.NAVAL_HOST_KEY)return;
 const $=id=>document.getElementById(id),workspace=document.querySelector('.screen-workspace'),stage=document.querySelector('.stage');
 if(!workspace||!stage)return;
 document.body.classList.add('naval-broadcast');
 const side=document.createElement('aside');side.className='naval-console panel';side.dataset.tvHudRail='';
 const heading=document.createElement('h2');heading.textContent='Капитанский мостик';side.append(heading,$('hostActions'));
 const standings=document.querySelector('.screen-standings');if(standings){const drawer=document.createElement('details'),label=document.createElement('summary');label.textContent='Все капитаны и счёт';drawer.className='scroll-area';drawer.append(label,standings);side.append(drawer);}
 workspace.prepend(side);document.querySelector('.screen-sidebar')?.remove();
 const feed=document.createElement('ol');feed.id='broadcastEvents';feed.setAttribute('aria-live','polite');
 const feedPanel=document.createElement('section');feedPanel.className='broadcast-feed';const feedTitle=document.createElement('h3');feedTitle.textContent='В эфире';feedPanel.append(feedTitle,feed);side.append(feedPanel);
 const overview=$('oceanOverview');overview.classList.add('broadcast-fields');
 let lastKey='',phase='',events=[];
 function shotEffect(shot,s){
  const target=s.players.find(p=>p.id===shot.targetId)||s.players.find(p=>p.name===shot.target);
  const card=[...overview.children].find(c=>c.dataset.id===target?.id),cell=card?.querySelector('.miniOcean')?.children[shot.cell];
  if(!cell||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  // A shell arcs from the shooter's fleet card to the target cell; the impact lands when it arrives (render only).
  const shooter=s.players.find(p=>p.id===shot.byId)||s.players.find(p=>p.name===shot.by),from=[...overview.children].find(c=>c.dataset.id===shooter?.id)?.firstElementChild;
  const base0=stage.getBoundingClientRect(),cr=cell.getBoundingClientRect();
  if(from&&from.closest('.oceanCard')!==card){const fr=from.getBoundingClientRect(),shell=document.createElement('i');shell.className='naval-shell '+shot.result;shell.setAttribute('aria-hidden','true');const ax=fr.left-base0.left+fr.width/2,ay=fr.top-base0.top+fr.height/2,bx=cr.left-base0.left+cr.width/2,by=cr.top-base0.top+cr.height/2,lift=Math.min(140,Math.hypot(bx-ax,by-ay)*.35);shell.style.left=ax+'px';shell.style.top=ay+'px';stage.append(shell);const frames=[];for(let i=0;i<=8;i++){const t=i/8,x=(bx-ax)*t,y=(by-ay)*t-Math.sin(t*Math.PI)*lift;frames.push({transform:`translate(-50%,-50%) translate(${x}px,${y}px) scale(${1-.35*t})`,opacity:i===0?0:1});}shell.animate(frames,{duration:300,easing:'cubic-bezier(.35,0,.65,1)'}).finished.finally(()=>{shell.remove();impact(cell,card,shot);});return;}
  impact(cell,card,shot);
 }
 function impact(cell,card,shot){
  if(!cell.isConnected)return;if(shot.result!=='miss')card.animate([{transform:'translate(0,0)'},{transform:'translate(-4px,1px)'},{transform:'translate(3px,-1px)'},{transform:'translate(-2px,0)'},{transform:'translate(0,0)'}],{duration:shot.result==='sunk'?320:220,easing:'ease-out'});
  const r=cell.getBoundingClientRect(),base=stage.getBoundingClientRect(),effect=document.createElement('span');
  effect.className='naval-shot-effect '+shot.result;effect.style.left=(r.left-base.left+r.width/2)+'px';effect.style.top=(r.top-base.top+r.height/2)+'px';effect.style.width=effect.style.height=Math.max(14,Math.min(70,r.width*.7))+'px';effect.setAttribute('aria-hidden','true');stage.append(effect);
  const count=shot.result==='sunk'?14:shot.result==='hit'?10:7;
  for(let i=0;i<count;i++){const fragment=document.createElement('i');fragment.className='naval-fragment';effect.append(fragment);const angle=i/count*Math.PI*2,distance=Math.min(45,r.width*(shot.result==='sunk'?1.1:.8));fragment.animate([{transform:'translate(-50%,-50%) scale(.3)',opacity:1},{transform:`translate(${Math.cos(angle)*distance}px,${Math.sin(angle)*distance+(shot.result==='miss'?12:4)}px) rotate(${i*53}deg) scale(.3)`,opacity:0}],{duration:shot.result==='sunk'?700:500,easing:'cubic-bezier(.1,.65,.3,1)',fill:'forwards'});}
  effect.animate([{transform:'translate(-50%,-50%) scale(.2)',opacity:1},{transform:'translate(-50%,-50%) scale(1.15)',opacity:.85,offset:.3},{transform:'translate(-50%,-50%) scale(1.9)',opacity:0}],{duration:shot.result==='miss'?700:550,easing:'cubic-bezier(.15,.65,.3,1)'}).finished.finally(()=>effect.remove());
  for(const old of [...stage.querySelectorAll('.naval-shot-effect')].slice(0,-4))old.remove();
 }
 // Keep decorated crew facts and fleet-title artwork when their authored fields
 // match. WeakMap keys follow live DOM nodes and include current locale/profile.
 const crewViews244=new WeakMap(),titleViews244=new WeakMap();
 function sameFields244(cache,node,fields){const previous=cache.get(node);if(previous&&fields.length===previous.length&&fields.every((value,i)=>value===previous[i]))return true;cache.set(node,fields);return false;}
 window.renderNavalBroadcast=s=>{
  const board=$('board');if(board){const rows=new Map([...board.children].map(row=>[row.dataset.id,row]));let rowIndex=0;for(const player of s.players){const row=rows.get(player.id);if(!row)continue;if(board.children[rowIndex]!==row)board.insertBefore(row,board.children[rowIndex]||null);rowIndex++;let avatar=row.querySelector('.crew-avatar');if(!avatar){avatar=document.createElement('img');avatar.className='crew-avatar';avatar.alt='';avatar.draggable=false;row.querySelector('.rank').after(avatar);}const person=(window.PARTY_ROSTER||[]).find(p=>p.id===player.id||p.name===player.name)||player;const source=window.PartyArt?.mascotSource({seed:person.id||player.name,avatar:person.avatar})||'/assets/avatars/atlas-mascots/mascot-01.webp';if(avatar.getAttribute('src')!==source)avatar.src=source;if(avatar.dataset.photo!==String(!!person.avatar))avatar.dataset.photo=String(!!person.avatar);if(row.dataset.online!==String(player.online))row.dataset.online=String(player.online);const copy=row.querySelector('.person strong');if(copy.textContent!==player.name)copy.textContent=player.name;if(copy.title!==player.name)copy.title=player.name;const label=window.PartyI18n?.t||((text)=>text);const facts=row.querySelector('.person small');if(!facts.classList.contains('crew-facts'))facts.classList.add('crew-facts');if(!sameFields244(crewViews244,facts,[player.health,player.hits,player.shots,player.sunk,window.PartyI18n?.language])||!facts.querySelector('.crew-fact'))facts.replaceChildren(...[
    ['health',String(player.health),label('Жизни')],
    ['target',player.hits+'/'+player.shots,label('Попаданий')],
    ['anchor',String(player.sunk),label('потоплено')]
   ].map(([icon,value,title])=>{const fact=document.createElement('span'),glyph=document.createElement('i');fact.className='crew-fact';fact.title=title;fact.setAttribute('aria-label',title+': '+value);glyph.className='crew-fact-icon';glyph.dataset.icon=icon;glyph.setAttribute('aria-hidden','true');fact.append(glyph,document.createTextNode(value));return fact;}));const points=row.querySelector('.points'),aria=String(player.score)+' points';if(points.getAttribute('aria-label')!==aria)points.setAttribute('aria-label',aria);}}
  if(phase!==s.phase&&s.phase==='battle'){events=[];lastKey='';const drawer=side.querySelector('details');if(drawer)drawer.open=true;}phase=s.phase;
  $('battle').hidden=true;overview.hidden=false;
  $('title').textContent=s.phase==='battle'?'Морской бой · прямой эфир':s.phase==='finished'?'Финальный залп':'Флоты выходят в море';
  if(s.phase==='finished')$('title').textContent='Победа · '+s.players.filter(p=>(s.winners||[]).includes(p.id)).map(p=>p.name).join(', ');
  const online=s.players.filter(p=>p.active||s.phase==='lobby');
  const columns=online.length<=2||online.length===4?2:online.length<=6?3:4;
  overview.dataset.dense=String(online.length>8);
  overview.dataset.small=String(online.length<=2);
  overview.style.setProperty('--fleet-columns',String(columns));
  overview.style.setProperty('--fleet-rows',String(Math.max(1,Math.ceil(online.length/columns))));
  workspace.style.setProperty('--fleet-columns',String(columns));
  workspace.style.setProperty('--fleet-rows',String(Math.max(1,Math.ceil(online.length/columns))));
  // The broadcast shows only public shot results, never undiscovered ships.
  if(s.phase==='lobby'){
   overview.replaceChildren(...online.map(p=>{const card=document.createElement('article');card.dataset.id=p.id;card.className='oceanCard';const name=document.createElement('b');name.textContent=p.name;const grid=document.createElement('div');grid.className='miniOcean';for(let i=0;i<36;i++)grid.append(document.createElement('span'));card.append(name,grid);return card;}));
  }
  for(const card of overview.children){
   const player=s.players.find(p=>p.id===card.dataset.id),title=card.firstElementChild;if(!player||!title)continue;
   const person=(window.PARTY_ROSTER||[]).find(p=>p.id===player.id||p.name===player.name)||player,botNumber=online.length>8&&person.testBot?player.name.match(/^(?:Бот|Bot)\s+(\d+)$/iu):null,nameText=botNumber?(window.PartyI18n?.language==='ru'?'Б':'B')+botNumber[1]:player.name,healthText=s.phase==='lobby'?'':' · '+player.health+'♥',source=window.PartyArt?.mascotSource({seed:person.id||player.name,avatar:person.avatar})||'/assets/avatars/atlas-mascots/mascot-01.webp';
   if(!sameFields244(titleViews244,title,[nameText,player.name,healthText,source,!!person.avatar])||!title.querySelector('.fleet-avatar')){const name=document.createElement('span'),health=document.createElement('span');name.className='fleet-name';health.className='fleet-health';name.textContent=nameText;name.title=player.name;name.setAttribute('aria-label',player.name);health.textContent=healthText;const identity=document.createElement('img');identity.className='fleet-avatar';identity.alt='';identity.draggable=false;identity.dataset.photo=String(!!person.avatar);identity.src=source;title.replaceChildren(identity,name,health);}const down=String(s.phase==='battle'&&player.health<=0);if(card.dataset.down!==down)card.dataset.down=down;
  }
  const shot=s.lastShot,key=shot?JSON.stringify(shot):'';
  if(key&&key!==lastKey){lastKey=key;shotEffect(shot,s);const result=shot.result==='sunk'?'потопление':shot.result==='hit'?'попадание':'мимо';events.unshift({text:shot.by+' → '+shot.target+' · '+result,result:shot.result});events=events.slice(0,2);}
  feed.replaceChildren(...(events.length?events:[{text:s.phase==='lobby'?'Ждём капитанов. Все поля будут видны здесь.':s.phase==='finished'?'Бой завершён. Итоги выше.':'Первый залп впереди',result:'waiting'}]).map(event=>{const row=document.createElement('li');row.textContent=event.text;row.dataset.result=event.result;const image=document.createElement('img');image.className='party-prop-accent party-event-accent';image.alt='';image.draggable=false;image.src='/assets/gameplay/sprites/'+(event.result==='sunk'?'ship':event.result==='hit'?'sparkle':'cloud')+'.webp';row.prepend(image);return row;}));
 };
})();
