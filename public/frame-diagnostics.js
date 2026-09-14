/* Injected only into the native TV WebView. No frame-by-frame bridge traffic. */
(() => {
  'use strict';
  const sink=window.webkit?.messageHandlers?.partyFrameStats;
  if(!sink||window.__partyFrameStats)return;
  window.__partyFrameStats=true;
  const bins=new Uint32Array(501);
  let last=0,start=0,count=0,total=0,max=0,over50=0,over100=0;
  const reset=()=>{last=start=count=total=max=over50=over100=0;bins.fill(0);};
  document.addEventListener('visibilitychange',reset);
  function frame(now){
    if(!document.hidden){
      if(last){const gap=now-last;count++;total+=gap;max=Math.max(max,gap);bins[Math.min(500,Math.round(gap))]++;if(gap>50)over50++;if(gap>100)over100++;}
      if(!start)start=now;
      if(now-start>=10000&&count){
        let n=0,p95=0;for(;p95<500;p95++){n+=bins[p95];if(n>=count*.95)break;}
        sink.postMessage({surface:window===top?'shell':'game',path:location.pathname,fps:Math.round(count*10000/total)/10,p95,max:Math.round(max),over50,over100,frames:count});
        reset();start=now;
      }
      last=now;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
