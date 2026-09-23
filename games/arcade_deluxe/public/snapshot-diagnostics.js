// Constant-size counters; consumed by the native ten-second frame report only.
export function recordSnapshot(state,now=performance.now()){
 const d=window.__partySnapshotStats??={last:null,count:0,maxGap:0,simLast:null,simMaxGap:0,unchanged:0};
 if(d.last!==null)d.maxGap=Math.max(d.maxGap,now-d.last);
 const t=Number(state.t);if(Number.isFinite(t)){
  if(d.simLast!==null){d.simMaxGap=Math.max(d.simMaxGap,Math.max(0,t-d.simLast)*1000);if(t===d.simLast&&!state.paused)d.unchanged++;}
  d.simLast=t;
 }
 d.last=now;d.count++;
}
