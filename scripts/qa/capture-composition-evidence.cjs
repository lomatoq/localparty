'use strict';

// This runs unchanged in either real document. The latest human cancellation
// requires source-load history and zero visible cuffs, not an absent API alone.
// No refresh(), fixture, state change or image substitution.
function captureMicroAttachment() {
  const game=document.body?.dataset.tvGame||document.documentElement.dataset.partyGame||null;
  const phase=window.PARTY_UI?.phase||document.documentElement.dataset.partyPhase||null;
  const matching=url=>typeof url==='string'&&/game-ui-micro-assets\.(?:js|css)(?:[?#]|$)/.test(url);
  const sources={
    scripts:[...document.scripts].map(e=>e.src).filter(matching),
    links:[...document.querySelectorAll('link[href]')].map(e=>e.href).filter(matching),
    stylesheets:[...document.styleSheets].map(s=>s.href).filter(matching),
    resourceLoads:performance.getEntriesByType('resource').map(e=>e.name).filter(matching)
  };
  const canvases=[...document.querySelectorAll('canvas.hp-game-ui-micro-cuff')].map(e=>{
    const r=e.getBoundingClientRect(),style=getComputedStyle(e),visible=!!e.getClientRects().length&&!e.hidden&&style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0;
    let paint=null;
    if(visible)try{const data=e.getContext('2d').getImageData(0,0,e.width,e.height).data;let pixels=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)pixels++;paint={readable:true,nontransparentPixels:pixels};}catch(error){paint={readable:false,error:String(error)};}
    return{visible,hidden:e.hidden,width:e.width,height:e.height,dataset:{...e.dataset},box:{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom},display:style.display,visibility:style.visibility,opacity:style.opacity,paint};
  });
  const adapterPresent=!!window.LocalPartyMicroAssets,adapterStarted=!!window.__partyMicroAssetsStarted;
  return{at:Date.now(),game,phase,paused:!!window.PARTY_SESSION?.paused,
    profile:adapterPresent?'unexpected-loaded-adapter':'user-disabled-all',
    disabledReason:'Explicit latest human request removes edge decorations in all36 games; this record qualifies only with no adapter sources/API and zero visible cuffs in both documents.',
    adapterPresent,adapterStarted,sourceEvidence:sources,canvases,visiblePieces:canvases.filter(c=>c.visible).length,
    viewport:{width:innerWidth,height:innerHeight},method:'Passive existing DOM, stylesheet/resource history and canvas visibility/pixel read; no refresh, state mutation or decoration injection.'};
}

// Record the rendered composition beside each original screenshot. These are
// guardrails and provenance, never a replacement for opening the actual image.
module.exports = async function captureCompositionEvidence(page) {
  const parent = await page.evaluate(() => {
    const box = el => {
      if (!el || !el.getClientRects().length) return null;
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return null;
      const before = getComputedStyle(el,'::before'), after = getComputedStyle(el,'::after');
      return { x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom,
        background:s.background, border:s.border, borderRadius:s.borderRadius,
        color:s.color, opacity:s.opacity, text:el.textContent.trim().slice(0,220),
        font:s.font,fontFamily:s.fontFamily,fontSize:s.fontSize,fontStyle:s.fontStyle,fontWeight:s.fontWeight,
        lineHeight:s.lineHeight,padding:s.padding,overflowX:s.overflowX,overflowY:s.overflowY,
        scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,
        scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,
        decoration:{before:{content:before.content,background:before.background,mask:before.maskImage,borderRadius:before.borderRadius,boxShadow:before.boxShadow},
          after:{content:after.content,background:after.background,opacity:after.opacity,borderRadius:after.borderRadius}} };
    };
    const bar = document.querySelector('#play .gamebar');
    return { at:Date.now(), width:innerWidth, height:innerHeight,
      bodyClasses:document.body.className, frame:box(document.getElementById('gameFrame')),
      bar:box(bar), dock:box(document.querySelector('#play .tv-info-dock')),
      actor:box(document.querySelector('#play .tv-info-actor')),
      primaryReadout:box(document.querySelector('#play .tv-info-primary-readout')),
      factGroups:[...document.querySelectorAll('#play .tv-info-dock #gamePlayers,#play .tv-info-dock .tv-stat')].map(box).filter(Boolean),
      readouts:[...document.querySelectorAll('#play .tv-info-dock .tv-stat-value,#play .tv-info-dock .tv-progress-value,#play .tv-info-dock .tv-timer-value')].map(e=>({className:e.className,...box(e)})).filter(e=>e.width),
      children:bar ? [...bar.children].map(e => ({className:e.className, ...box(e)})) : [],
      title:box(document.getElementById('gameTitle')), context:box(document.getElementById('gameContext')),
      attributes:bar ? Object.fromEntries([...bar.attributes].map(a => [a.name,a.value])) : {},
      variables:bar ? bar.getAttribute('style') : null };
  });
  parent.microAttachment=await page.evaluate(captureMicroAttachment);
  const element = await page.$('#gameFrame'), frame = element ? await element.contentFrame() : null;
  if (!frame) return {parent, error:'No active game iframe'};
  const content = await frame.evaluate(() => {
    const rect = el => {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,
        id:el.id,className:el.className,text:el.textContent.trim().slice(0,180),
        background:s.background,backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage,boxShadow:s.boxShadow,border:s.border,borderRadius:s.borderRadius,
        color:s.color,opacity:s.opacity,font:s.font,padding:s.padding};
    };
    const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
    const select = selector => [...document.querySelectorAll(selector)].filter(visible).map(rect);
    return {at:Date.now(), url:location.href, width:innerWidth,height:innerHeight,
      phase:window.PARTY_UI?.phase,rootAttributes:Object.fromEntries([...document.documentElement.attributes].map(a=>[a.name,a.value])),
      anchors:select('[data-tv-hud-anchor]'),rails:select('[data-tv-hud-rail]'),clusters:select('[data-tv-hud-cluster]'),
      surfaces:select('[data-hp-theme-surface],.ss-host-top,.ss-host-stats,.party-roster-rail,.naval-console,.block-info,.arena-status,.playerRow,.party-standing,.quiz-card,.question,.score-strip').slice(0,60),
      backgroundProof:window.CraneBackgroundProof || null,
      scrollRegions:[...document.querySelectorAll('[data-scroll-above],[data-scroll-below]')].filter(visible).map(el=>({
        ...rect(el),scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,
        above:el.dataset.scrollAbove,below:el.dataset.scrollBelow,mask:getComputedStyle(el).maskImage
      })),
      theme:window.HeyPalsGameThemes?.diagnostics?.(),
      exclusions:window.PARTY_HUD_EXCLUSIONS || null,
      variables:Object.fromEntries(['--party-hud-height','--party-hud-left','--party-hud-width','--party-hud-bottom','--party-rail-hud-bottom','--party-native-inset-top'].map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue(k).trim()]))};
  });
  content.microAttachment=await frame.evaluate(captureMicroAttachment);
  return {parent,content,method:'Rendered boxes and material styles sampled immediately after the adjacent original PNG; phase recorded again because the normal-clock engine continues running.'};
};
