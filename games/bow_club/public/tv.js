import {RangeScene} from './src/range-scene.mjs';
import {BOARD,markerBits} from './src/markers.mjs';
import {BowConnection} from './net.js';
const $=id=>document.getElementById(id),config=window.BOW_CONFIG||{},ctx=$('board').getContext('2d');
let state={phase:'waiting',players:[],targets:[]},hit=null,lastHit=null,renderer=null,hits=[],seenHits=new Set(),hitRevision=null;
try{renderer=new RangeScene($('world'));}catch(e){$('error').textContent='3D: '+e.message+' — включено резервное 2D-поле.';}
if(config.managed||!config.hostKey)document.body.classList.add('managed');
$('address').textContent=(config.urls||[]).join(' · ')||'Подключайтесь через общий хаб LocalParty';
const connection=new BowConnection((type,data)=>{
 if(type==='state'){
  state=data;document.body.classList.toggle('is-playing',state.phase==='playing');
  $('phase').textContent=state.paused?'Пауза':state.phase==='waiting'?'Подключите телефоны, затем начните матч':state.phase==='results'?'Матч завершён':'По '+state.arrows+' стрел • '+state.remaining+' сек • '+({versus:'Каждый за себя',coop:'Одна команда',teams:'Две команды'}[state.mode]||'');
  $('start').hidden=state.phase!=='waiting';$('start').disabled=!state.players.some(p=>p.connected);$('reset').hidden=state.phase!=='results';
  $('scores').replaceChildren(...state.players.map(p=>{const item=document.createElement('div');item.className='score-chip';item.style.setProperty('--player',p.color);const b=document.createElement('b');b.textContent=p.name;const span=document.createElement('span');span.textContent=`${p.score} • ${p.shots}/${state.arrows||10}`+(state.mode==='teams'?` • ${p.team===0?'A':'B'}`:'')+(p.connected?'':' · offline');item.append(b,span);return item;}));
  if(hitRevision!==data.revision){hitRevision=data.revision;seenHits.clear();hits=[];hit=null;}for(const h of data.hits||[data.hit].filter(Boolean))if(!seenHits.has(h.id)){seenHits.add(h.id);hit={...h,visualAt:performance.now()};hits.push(hit);}if(hits.length>90)hits=hits.slice(-90);
 }else if(type==='error')$('error').textContent=data.message;
},status=>{if(status==='open'){connection.send('host',{key:config.hostKey});connection.send('display-layout',{key:config.displayKey,aspect:innerWidth/innerHeight});$('error').textContent='';}else $('error').textContent='Переподключение к серверу…';});
$('start').onclick=()=>connection.send('start',{mode:$('mode').value,arrows:Number($('arrows').value)});$('reset').onclick=()=>connection.send('reset');
function markers(){for(const tag of BOARD.tags){ctx.fillStyle='white';ctx.fillRect(tag.x-16,tag.y-16,tag.size+32,tag.size+32);const cells=markerBits(tag.id),unit=tag.size/6;ctx.fillStyle='#000';for(let y=0;y<6;y++)for(let x=0;x<6;x++)if(!cells[y*6+x])ctx.fillRect(tag.x+x*unit,tag.y+y*unit,unit,unit);}}
function fallback(){const g=ctx.createLinearGradient(0,0,0,720);g.addColorStop(0,'#9ed7ff');g.addColorStop(.62,'#d8f0ff');g.addColorStop(1,'#eff8ff');ctx.fillStyle=g;ctx.fillRect(0,0,1280,720);ctx.fillStyle='#fff1bf';ctx.beginPath();ctx.arc(1110,120,54,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6eb16f';ctx.fillRect(0,505,1280,215);ctx.fillStyle='#5a985d';ctx.fillRect(0,530,1280,190);for(let i=0;i<16;i++){const x=40+i*82,h=90+(i%4)*16;ctx.fillStyle='#6d4b2b';ctx.fillRect(x,355-h*0.15,10,h*0.18);ctx.fillStyle=i%2?'#4f844c':'#5f9a5b';ctx.beginPath();ctx.moveTo(x-38,365);ctx.lineTo(x,255-h*0.25);ctx.lineTo(x+38,365);ctx.fill();ctx.beginPath();ctx.moveTo(x-30,330);ctx.lineTo(x,235-h*0.2);ctx.lineTo(x+30,330);ctx.fill();}for(const t of state.targets){const x=t.u*1280,y=t.v*720;for(const [scale,c]of [[1,'#fff9e9'],[.78,'#27687c'],[.54,'#fff9e9'],[.32,'#e98358'],[.18,'#fbd568']]){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,t.r*scale,0,Math.PI*2);ctx.fill();}}}
function frame(now){ctx.clearRect(0,0,1280,720);if(renderer){renderer.frame(state.targets,hits,state.revision,$('stage').clientWidth,$('stage').clientHeight);}else fallback();markers();
 ctx.strokeStyle='rgba(30,70,75,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(628,360);ctx.lineTo(652,360);ctx.moveTo(640,348);ctx.lineTo(640,372);ctx.stroke();
 for(const hit of hits.filter(h=>now-h.visualAt<1000)){const a=Math.min(1,(now-hit.visualAt)/180);ctx.globalAlpha=1-(now-hit.visualAt)/1000;ctx.strokeStyle=hit.points?'#f9d96c':'#fff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(hit.u*1280,hit.v*720,12+30*a,0,Math.PI*2);ctx.stroke();ctx.font='900 36px system-ui';ctx.fillStyle='#25464d';ctx.textAlign='center';ctx.fillText(hit.points?'+'+hit.points:'Мимо',hit.u*1280,hit.v*720-25-a*30);ctx.globalAlpha=1;}
 if(state.phase==='results'){ctx.fillStyle='rgba(244,248,231,.96)';ctx.fillRect(260,238,760,190);ctx.fillStyle='#244e52';ctx.textAlign='center';ctx.font='900 46px system-ui';const winners=state.result?.players?.filter(p=>p.won).map(p=>state.players.find(x=>x.id===p.id)?.name||'Лучник')||[];ctx.fillText(winners.length?'Точно в цель!':'Матч завершён',640,307);ctx.font='600 22px system-ui';ctx.fillText(winners.join(' · ').slice(0,74)||'Попробуйте ещё раз',640,356);}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);window.addEventListener('pagehide',()=>connection.close());

window.addEventListener('resize',()=>connection.send('display-layout',{key:config.displayKey,aspect:innerWidth/innerHeight}));
