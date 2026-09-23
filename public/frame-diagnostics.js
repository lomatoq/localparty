/* Injected only into the native TV WebView. No frame-by-frame bridge traffic. */
(() => {
  'use strict';
  const sink=window.webkit?.messageHandlers?.partyFrameStats;
  if(!sink||window.__partyFrameStats)return;
  window.__partyFrameStats=true;
  const bins=new Uint32Array(501);
  function snapshotStats(now){
    const d=window.__partySnapshotStats;if(!d)return{};
    const result={snapshots:d.count,snapshotAge:Math.round(Math.max(0,now-d.last)),snapshotGap:Math.round(d.maxGap),simulationGap:Math.round(d.simMaxGap),simulationUnchanged:d.unchanged};
    d.count=d.maxGap=d.simMaxGap=d.unchanged=0;
    return result;
  }
  // Numeric layout evidence from the actual AirPlay WKWebView, never player text.
  function layoutStats(){
    const stage=document.getElementById('tvStage');if(!stage)return{};
    const rect=stage.getBoundingClientRect(),scale=rect.width/Math.max(1,stage.offsetWidth);
    const measure=selector=>{const el=stage.querySelector(selector);if(!el?.firstChild||el.firstChild.nodeType!==3)return'none';const range=document.createRange();range.setStart(el.firstChild,0);range.setEnd(el.firstChild,Math.min(1,el.firstChild.length));return`css:${parseFloat(getComputedStyle(el).fontSize).toFixed(2)},glyph:${range.getBoundingClientRect().height.toFixed(2)}`;};
    return{viewport:`${innerWidth}x${innerHeight},dpr:${devicePixelRatio},visual:${visualViewport?.scale||1}`,screen:`${screen.width}x${screen.height}`,stage:`${stage.offsetWidth}x${stage.offsetHeight},scale:${scale.toFixed(3)},compact:${stage.classList.contains('tv-compact')}`,title:measure('.game:not(.featured) h3'),description:measure('.game:not(.featured) .game-info>p')};
  }
  let last=0,start=0,count=0,total=0,max=0,over50=0,over100=0;
  const reset=()=>{last=start=count=total=max=over50=over100=0;bins.fill(0);};
  document.addEventListener('visibilitychange',()=>{
    reset();
    const d=window.__partySnapshotStats;if(d){d.last=d.simLast=null;d.count=d.maxGap=d.simMaxGap=d.unchanged=0;}
  });
  function frame(now){
    if(!document.hidden){
      if(last){const gap=now-last;count++;total+=gap;max=Math.max(max,gap);bins[Math.min(500,Math.round(gap))]++;if(gap>50)over50++;if(gap>100)over100++;}
      if(!start)start=now;
      if(now-start>=10000&&count){
        let n=0,p95=0;for(;p95<500;p95++){n+=bins[p95];if(n>=count*.95)break;}
        sink.postMessage({surface:window===top?'shell':'game',path:location.pathname,fps:Math.round(count*10000/total)/10,p95,max:Math.round(max),over50,over100,frames:count,...layoutStats(),...snapshotStats(now)});
        reset();start=now;
      }
      last=now;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
