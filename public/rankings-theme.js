/* Presentation adapters only. Engine order, values, ties and input stay intact. */
(function (global) {
  'use strict';
  function placeOf(value) {
    const m = /^\s*#?(\d+)(?:\s+.*)?$/.exec(String(value == null ? '' : value));
    const n = m ? Number(m[1]) : 0;
    return Number.isSafeInteger(n) && n > 0 ? {rank:n,digit:m[1]} : null;
  }
  const descriptors = {
    crane:[{rows:'#players>.player',place:'.rank',identity:'.details',score:'.score',grid:'crane'}],
    kart:[{rows:'#leaderboard>.leader-row',place:'.leader-pos',identity:'.leader-name',score:'.leader-meta>strong',grid:'kart'}],
    sinyakquiz:[{rows:'#board>.row',place:'.rank',identity:'.person',score:'.points',grid:'classic'}],
    warsaw:[{rows:'#board>.row',place:'.rank',identity:'.person',score:'.points',grid:'classic'}],
    naval:[{rows:'#board>.row',place:'.rank',identity:'.person',score:'.points',grid:'classic'}],
    crocodile:[{rows:'#board>.row',place:'.rank',identity:'.person',score:'.points',grid:'classic'}],
    drawguess:[{rows:'#board>.row',place:'.rank',identity:'.person',score:'.points',grid:'classic'}],
    tankarena:[{rows:'#board>.stat',place:'.arsenal-rank',identity:'.arsenal-name',score:'.arsenal-score',grid:'arsenal'}],
    western_duel:[{rows:'#board>.stat',place:'.duel-rank',identity:'.duel-player',score:'.duel-points',grid:'classic'}],
    tanks:[{rows:'#resultStats>.stat-row',place:':scope>b:first-child',identity:':scope>span:nth-child(2)',score:':scope>b:last-child',grid:'tanks'}],
    // These authored sorted score lists have no explicit place. Carry the
    // score hierarchy into them without inventing ranks or medals for ties.
    millionaire:[{rows:'#scoreList>.scoreItem',identity:'.player-name',score:'.money',grid:'author'}],
    marble_bloom:[{rows:'#overlayCopy>.result-row:not(.loadout-row)',identity:':scope>span',score:':scope>b',grid:'author'}],
    pocket_siege:[{rows:'#overlayCopy>.result-row:not(.loadout-row)',identity:':scope>span',score:':scope>b',grid:'author'}],
    curling:[{rows:'#ss-results>.ss-result-row',identity:':scope>b',score:':scope>strong',grid:'author'}],
    bowling:[{rows:'#ss-results>.ss-result-row',identity:':scope>b',score:':scope>strong',grid:'author'}],
    swarm_gate:[{rows:'#ss-results>.ss-result-row',identity:':scope>b',score:':scope>strong',grid:'author'}],
    peek_shoot:[{rows:'#ss-results>.ss-result-row',identity:':scope>b',score:':scope>strong',grid:'author'}]
  };
  for (const id of ['push','shrink','knives','bomb','western']) descriptors[id]=[
    {rows:'#resultStats>.stat-row',place:':scope>b:first-child',identity:'.name',score:'.score',grid:'tanks'}
  ];
  if (typeof module === 'object' && module.exports) module.exports = {placeOf,descriptors};
  if (!global.document) return;
  const doc=global.document,root=doc.documentElement;
  const scope=()=>root.dataset.partyGame||'';
  let pending=0,observer;const inkOffsets=new Map();
  const assign=(node,key,value)=>{if(node.dataset[key]!==value)node.dataset[key]=value;};
  function alignInk(number){
    const s=getComputedStyle(number),font=s.fontStyle+' '+s.fontWeight+' '+s.fontSize+' '+s.fontFamily;
    const key=[font,s.lineHeight,s.paddingTop,s.paddingBottom,number.textContent].join('|');
    if(!inkOffsets.has(key)){
      const probe=doc.createElement('span'),baseline=doc.createElement('i'),ctx=doc.createElement('canvas').getContext('2d');
      Object.assign(probe.style,{position:'fixed',left:'-10000px',top:'0',display:'inline-block',visibility:'hidden',font,lineHeight:s.lineHeight,padding:s.padding,whiteSpace:'nowrap',border:'0',margin:'0'});
      Object.assign(baseline.style,{display:'inline-block',width:'0',height:'0',padding:'0',margin:'0',border:'0',verticalAlign:'baseline'});
      probe.append(doc.createTextNode(number.textContent),baseline);doc.body.append(probe);
      ctx.font=font;const metrics=ctx.measureText(number.textContent),r=probe.getBoundingClientRect();
      const offset=r.height/2-(baseline.getBoundingClientRect().top-r.top)+(metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2;
      probe.remove();if(inkOffsets.size>256)inkOffsets.clear();inkOffsets.set(key,Math.round(offset*100)/100);
    }
    const offset=inkOffsets.get(key)+'px';if(number.style.getPropertyValue('--hp-ranking-ink-offset')!==offset)number.style.setProperty('--hp-ranking-ink-offset',offset);
  }
  function digit(place,raw) {
    let number=place.querySelector(':scope>.hp-ranking-digit,:scope>.hp-place-digit');
    if (!number) {
      const text=[...place.childNodes].filter(n=>n.nodeType===3).map(n=>n.nodeValue).join('').trim();
      if(text&&text!==raw)place.setAttribute('aria-label',text);
      number=doc.createElement('span');number.className='hp-ranking-digit';number.textContent=raw;
      for(const node of [...place.childNodes])if(node.nodeType===3)node.remove();
      place.append(number);
    }
    if(number.textContent!==raw)number.textContent=raw;
    return number;
  }
  function paintPlace(place,explicit) {
    const existing=place.querySelector(':scope>.hp-ranking-digit,:scope>.hp-place-digit');
    const info=explicit||(place.hasAttribute('data-place')?placeOf(place.dataset.place):placeOf(existing?existing.textContent:place.textContent));
    if(!info)return null;
    place.classList.add('hp-ranking-place');
    assign(place,'hpRank',String(info.rank));assign(place,'hpDigits',String(info.digit.length));
    const number=digit(place,info.digit);alignInk(number);
    let cup=place.querySelector(':scope>.hp-ranking-cup,:scope>.hp-place-award,:scope>.podium-award');
    if(info.rank<=3){
      if(!cup){cup=doc.createElement('img');cup.alt='';cup.setAttribute('aria-hidden','true');cup.decoding='async';place.prepend(cup);}
      cup.classList.add('hp-ranking-cup');const src='/assets/awards/cup-'+['gold','silver','bronze'][info.rank-1]+'.png';
      if(cup.getAttribute('src')!==src)cup.src=src;
    }else if(cup&&cup.classList.contains('hp-ranking-cup'))cup.remove();
    return info;
  }
  function paintRow(row,d) {
    if(row.closest('#rankSection,#hostPanel'))return;
    if(d.grid==='kart'){
      // Kart keeps references to these authored nodes. Move the existing lap
      // label beside its existing speed/best nodes; never clone their values.
      const lap=row.querySelector('.leader-name>span'),meta=row.querySelector('.leader-meta');
      if(lap&&meta){lap.classList.add('hp-ranking-lap');meta.prepend(lap);}
    }
    const place=d.place?row.querySelector(d.place):null;
    const info=place?paintPlace(place):null;
    if(d.grid!=='shared'&&d.grid!=='author'&&place)row.parentElement?.classList.add('hp-ranking-native-list');
    row.classList.add('hp-ranking-row');assign(row,'hpRank',info?String(info.rank):'');
    assign(row,'hpRankingLayout',d.grid||'shared');
    if(d.identity){const name=row.querySelector(d.identity);name?.classList.add('hp-ranking-identity');if(name&&d.grid!=='kart'){const full=(name.querySelector('.hp-result-self')?name.firstElementChild?.textContent:name.textContent)||'';if(name.title!==full)name.title=full;}}
    const score=d.score?row.querySelector(d.score):null;
    if(score){score.classList.add('hp-ranking-score');const length=score.textContent.trim().length;assign(score,'hpValueSize',length>10?'long':length>6?'medium':'short');assign(row,'hpWideScore',length>6?'true':'false');
      if(row.closest('#sharedMatchResults')&&innerWidth<=420){
        const ctx=doc.createElement('canvas').getContext('2d');ctx.font='900 italic 27px KardiaFatRunner';
        const m=ctx.measureText(score.textContent.trim()),width=m.actualBoundingBoxLeft+m.actualBoundingBoxRight;
        const size=Math.min(27,Math.floor(70/Math.max(1,width)*27*10)/10);
        score.style.setProperty('--hp-ranking-score-size',size+'px');
      }else score.style.removeProperty('--hp-ranking-score-size');
    }
  }
  function refresh() {
    pending=0;
    // Ignore our own decoration mutations. An engine can still replace the text
    // or row later; the observer adapts that real update without touching order.
    observer?.disconnect();
    for(const [rows,place,identity,score] of [
      ['#sharedMatchResults .hp-result-row','.hp-place','.hp-result-name','.hp-result-value'],
      ['#liveTop>.live-top-row','.hp-place','[data-no-translate]','.live-top-score'],
      ['#tvLeaders>.mini-rank','.hp-place','b',':scope>strong']
    ])doc.querySelectorAll(rows).forEach((row,i)=>paintRow(row,{place,identity,score},i));
    for(const d of descriptors[scope()]||[])doc.querySelectorAll(d.rows).forEach((row,i)=>paintRow(row,d,i));
    // Native local podiums have their own scene geometry; preserve it.
    if(scope())doc.querySelectorAll('.screen-podium>article').forEach(row=>{
      const place=row.querySelector(':scope>small');const info=place?paintPlace(place):null;
      row.classList.add('hp-ranking-local-podium');assign(row,'hpRank',info?String(info.rank):'');
      row.querySelector('strong')?.classList.add('hp-ranking-score');
    });
    doc.querySelectorAll('#tvPodium .podium-seat').forEach(row=>{
      const rank=Number(row.dataset.rank),place=row.querySelector('.podium-rank');
      if(place&&rank>0)paintPlace(place,{rank,digit:String(rank)});
      row.classList.add('hp-ranking-podium');assign(row,'hpRank',String(rank));
      row.querySelector('.podium-points')?.classList.add('hp-ranking-score');
      const portrait=row.querySelector('.podium-portrait');
      if(portrait){
        portrait.classList.toggle('hp-ranking-photo',!!portrait.querySelector(':scope>img'));
        assign(portrait,'hpInitial',Array.from(row.querySelector('.podium-name')?.textContent.trim()||'?')[0].toUpperCase());
      }
    });
    observer?.observe(doc.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-place','data-rank']});
  }
  function schedule(){if(!pending)pending=requestAnimationFrame(refresh);}
  function start(){observer=new MutationObserver(schedule);refresh();doc.fonts?.ready.then(()=>{inkOffsets.clear();schedule();});global.addEventListener('resize',schedule,{passive:true});}
  global.HeyPalsRankingsTheme=Object.freeze({refresh,placeOf,descriptors});
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window==='object'?window:globalThis);
