'use strict';
// Review-only preload. Never imported by production. It does not fabricate states
// or scores: game workers still execute their normal simulation and completion.
if(process.env.PARTY_MANAGED==='1' && (/[/\\]games[/\\]/.test(process.argv[1]||'') || require('node:worker_threads').workerData?.game)){
 const clockPath=require.resolve('../lib/game-clock');
 const original=require(clockPath),rate=Math.max(1,Math.min(20,Number(process.env.QA_CLOCK_RATE)||1));
 const origin=original.now();
 const now=()=>origin+(original.now()-origin)*rate;
 require.cache[clockPath].exports={now,realNow:original.realNow,setPaused:original.setPaused,
  interval:(fn,delay,...args)=>original.interval(fn,Math.max(1,delay/rate),...args),
  timeout:(fn,delay,...args)=>original.timeout(fn,delay/rate,...args),
  get paused(){return original.paused;},get offset(){return original.realNow()-now();}};
 console.log('[screen-review] QA game clock '+rate+'x; visual states only, not timing/physics validation');
}
