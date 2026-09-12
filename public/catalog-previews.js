/* Local, illustrative mechanic previews. These diagrams are not gameplay recordings. */
(() => {
  'use strict';
  const descriptions = {
    taprace:['track','Тапай быстрее → обгони друзей'], punchmeter:['arena','Три удара → лучший результат'], flappy:['arena','Взмах → пролети между трубами'], hungry:['arena','Ешь → расти → догоняй'], snakelines:['track','Поворачивай → избегай следов'], carryball:['arena','Подбери мяч → передай → забей'],
    push:['arena','Разгонись → вытолкни соперника'], shrink:['shrink','Круг сужается. Держись центра'],
    knives:['knives','Лови свой сектор → бросай'], bomb:['bomb','Догони → передай бомбу'],
    western:['duel','Жди DRAW! → нажми огонь'], tanks:['tank','Движение + огонь'],
    tankarena:['tank','Подбирай оружие → стреляй'], chaos:['cursor','Ваши движения → один курсор'],
    kart:['track','Слайдер + газ → пройди ворота'], monster:['draw','Каждый рисует часть монстра'],
    spy:['secret','Задавай вопросы → найди шпиона'], millionaire:['quiz','Ответь в свой ход → поднимись'],
    sinyakquiz:['quiz','Обсуди → выбери ответ'], warsaw:['quiz','Узнай место → выбери ответ'],
    crocodile:['secret','Покажи слово → друзья угадают'], jenga:['blocks','Тяни аккуратно → сохрани башню'],
    crane:['crane','Совмести груз → отпусти'], naval:['naval','Выбери клетку → потопи флот'],
    drawguess:['draw','Один рисует → остальные угадывают'], western_duel:['duel','Сигнал → первый выстрел побеждает']
  };
  const shapes = {
    arena:'<ellipse cx="160" cy="90" rx="105" ry="53"/><circle class="cp-move" cx="110" cy="90" r="19" fill="currentColor"/><circle cx="195" cy="90" r="19" fill="#ac94f5"/>',
    shrink:'<ellipse class="cp-shrink" cx="160" cy="90" rx="108" ry="61"/><circle cx="145" cy="85" r="17" fill="currentColor"/><circle cx="185" cy="106" r="17" fill="#ac94f5"/>',
    bomb:'<path d="M70 110 Q155 5 240 100" stroke-dasharray="6 8"/><circle class="cp-move" cx="100" cy="90" r="22" fill="currentColor"/><path d="m100 65 5-12 15-3"/><circle cx="225" cy="94" r="17" fill="#ac94f5"/>',
    knives:'<g class="cp-spin"><circle cx="160" cy="85" r="57"/><path d="M160 85 160 28 A57 57 0 0 1 217 85Z" fill="currentColor"/></g><path class="cp-rise" d="m160 151-7 15h14z" fill="currentColor"/>',
    tank:'<rect x="73" y="62" width="89" height="56" rx="15"/><rect x="92" y="70" width="47" height="40" rx="9" fill="currentColor"/><path d="M117 90h70"/><path class="cp-move" d="M205 90h20"/><rect x="238" y="70" width="32" height="32" rx="6" stroke="#ac94f5"/>',
    cursor:'<path d="m143 51 9 79 17-23 27-3Z" fill="currentColor"/><path class="cp-move" d="M63 80h42m-12-12 12 12-12 12M250 80h-42m12-12-12 12 12 12"/>',
    track:'<path d="M85 133C15 121 48 40 96 47S128 122 175 113 180 29 234 39 282 151 229 140 144 146 85 133Z" stroke-width="18" stroke="#626b73"/><path d="M85 133C15 121 48 40 96 47S128 122 175 113 180 29 234 39 282 151 229 140 144 146 85 133Z" stroke-dasharray="7 10"/><rect class="cp-move" x="180" y="131" width="24" height="14" rx="4" fill="currentColor"/>',
    secret:'<rect x="79" y="32" width="74" height="113" rx="14"/><path d="M99 66h33m-33 15h26m-26 15h30"/><circle cx="218" cy="89" r="34" stroke="#ac94f5"/><path class="cp-rise" d="M209 80q0-19 18-10t-9 26m0 12v1"/>',
    quiz:'<rect x="60" y="25" width="200" height="34" rx="9"/><rect x="60" y="76" width="92" height="32" rx="8"/><rect x="168" y="76" width="92" height="32" rx="8"/><rect x="60" y="121" width="92" height="32" rx="8"/><rect class="cp-answer" x="168" y="121" width="92" height="32" rx="8" fill="currentColor"/><path d="m197 136 8 8 18-18" stroke="#101719"/>',
    draw:'<rect x="66" y="21" width="188" height="135" rx="14"/><path class="cp-ink" d="M99 118 113 74 132 90 151 55 178 73 210 46 228 120 99 118M136 103q28 28 54-1"/>',
    blocks:'<path d="M112 145h97v-23h-97v-24h97V74h-97V50h97V26h-97v119m32-119v24m32-24v24m-32 24v24m32-24v24m-32 24v23m32-23v23"/><rect class="cp-move" x="111" y="74" width="32" height="24" fill="currentColor"/>',
    crane:'<path d="M81 150V27h170m-78 0v43"/><rect class="cp-drop" x="145" y="70" width="60" height="26" rx="3" fill="currentColor"/><path d="M132 148h87v-27h-87z"/>',
    naval:'<path d="M85 25h150v125H85zm25 0v125m25-125v125m25-125v125m25-125v125m25-125v125M85 50h150M85 75h150M85 100h150M85 125h150" stroke="#6e7d87"/><rect x="112" y="78" width="72" height="19" rx="9" fill="#ac94f5"/><path class="cp-answer" d="m139 80 17 15m0-15-17 15"/>',
    duel:'<circle cx="82" cy="66" r="18"/><path d="M82 85v43m0-30h54m-54 30-20 20m20-20 20 20"/><circle cx="239" cy="66" r="18" stroke="#ac94f5"/><path d="M239 85v43m0-30h-54m54 30-20 20m20-20 20 20" stroke="#ac94f5"/><path class="cp-answer" d="m155 49 13-24-3 18h11l-16 25 4-19z" fill="currentColor"/>'
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cards = new Map();
  const observer = new IntersectionObserver(entries => entries.forEach(e => {
    const state = cards.get(e.target); if(state) {if(e.isIntersecting&&!state.visible)state.last=performance.now();state.visible=e.isIntersecting;e.target.classList.toggle('cp-visible',e.isIntersecting);}
  }), {threshold:.25});
  function add(card) {
    if(cards.has(card) || !descriptions[card.dataset.id]) return;
    const [shape,caption]=descriptions[card.dataset.id];
    const panel=document.createElement('div');panel.className='mechanic-preview';panel.setAttribute('aria-hidden','true');
    const screenshot=document.createElement('img');screenshot.src='/assets/gameplay/'+card.dataset.id+'.webp?v=live-art-20260913';screenshot.alt='Скриншот игры';screenshot.loading='lazy';panel.append(screenshot,document.createElement('span'));panel.lastChild.className='cp-caption';
    panel.querySelector('span').textContent=caption;
    const nav=document.createElement('div');nav.className='mechanic-dots';nav.setAttribute('role','group');nav.setAttribute('aria-label','Арт и скриншот игры');
    const state={index:0,visible:false,last:performance.now()};cards.set(card,state);
    function select(index) {if(!isLarge(card))index=0;state.index=index;state.last=performance.now();card.classList.toggle('cp-show',index===1);panel.setAttribute('aria-hidden',String(index!==1));[...nav.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));}
    ['Иллюстрация','Геймплей: '+caption].forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(i===0));b.addEventListener('click',e=>{e.stopPropagation();select(i);});b.addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();const next=e.key==='Home'?0:e.key==='End'?1:1-state.index;select(next);nav.children[next].focus();}});nav.append(b);});
    state.select=select;card.append(panel,nav);card.classList.toggle('cp-large',isLarge(card));observer.observe(card);
  }
  function isLarge(card){const grid=getComputedStyle(card);return card.classList.contains('featured')||grid.gridColumnStart==='span 2'||grid.gridColumnEnd==='span 2';}
  function resize(){cards.forEach((s,c)=>{const large=isLarge(c);c.classList.toggle('cp-large',large);if(!large)s.select(0);});}
  window.addEventListener('resize',resize);
  const scan=()=>document.querySelectorAll('.game[data-id]').forEach(add);
  new MutationObserver(scan).observe(document.getElementById('home')||document.body,{childList:true,subtree:true});scan();
  setInterval(()=>{if(document.hidden||reduced.matches||document.body.classList.contains('in-game'))return;const now=performance.now();cards.forEach((s,c)=>{if(!c.isConnected){observer.unobserve(c);cards.delete(c);return;}if(isLarge(c)&&s.visible&&!c.hidden&&!c.matches(':hover,:focus-within')&&now-s.last>9000)s.select(1-s.index);});},500);
})();


