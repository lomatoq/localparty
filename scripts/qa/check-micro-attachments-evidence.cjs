'use strict';

// Latest explicit human cancellation: no edge decoration anywhere in all36.
// Absence is qualified from real document/source history, never assumed from a
// missing API or an earlier rejected pair/single proof.
const fs=require('node:fs'),path=require('node:path');
if(!process.argv[2]){console.error('Usage: node scripts/qa/check-micro-attachments-evidence.cjs <capture-directory> [--stdout-only]');process.exit(2);}
const directory=path.resolve(process.argv[2]),report=JSON.parse(fs.readFileSync(path.join(directory,'report.json'),'utf8'));
const catalog=require('../../lib/catalog').map(g=>g.id),findings=[],checked=[],skipped=[],seen=new Map();
const add=(game,file,check,details)=>findings.push({game,file,check,details});
for(const row of report.games||[])for(const shot of(row.compositionScreens||[]).filter(s=>s.surface==='tv')){
  const file=shot.file,parent=shot.evidence?.parent,content=shot.evidence?.content;
  const records=[['parent',parent?.microAttachment],['game',content?.microAttachment]];
  if(records.some(([,record])=>!record)){add(row.id,file,'missing-passive-disabled-evidence',records.map(([document,record])=>({document,present:!!record})));continue;}
  const actualPhase=records[0][1].phase||records[1][1].phase;
  if(!actualPhase){skipped.push({game:row.id,file,reason:'Unknown actual phase; no invented playing assumption'});continue;}
  if(!['countdown','playing','reveal'].includes(actualPhase)||records.some(([,r])=>r.paused)){skipped.push({game:row.id,file,phase:actualPhase,reason:'Actual non-live or paused state'});continue;}
  const key=row.id+':'+shot.w;seen.set(key,(seen.get(key)||0)+1);
  if(typeof file!=='string'||!fs.existsSync(path.join(directory,file)))add(row.id,file,'missing-adjacent-original',file);
  for(const [document,r]of records){
    checked.push({game:row.id,file,w:shot.w,h:shot.h,document,phase:r.phase,profile:r.profile,visiblePieces:r.visiblePieces});
    if(r.game!==row.id)add(row.id,file,'wrong-actual-game',{document,expected:row.id,actual:r.game});
    if(r.profile!=='user-disabled-all'||!r.disabledReason)add(row.id,file,'missing-explicit-human-disabled-profile',{document,profile:r.profile,reason:r.disabledReason});
    if(r.adapterPresent!==false||r.adapterStarted!==false)add(row.id,file,'micro-adapter-still-present',{document,present:r.adapterPresent,started:r.adapterStarted});
    const sources=r.sourceEvidence;
    if(!sources||['scripts','links','stylesheets','resourceLoads'].some(k=>!Array.isArray(sources[k])))add(row.id,file,'missing-real-adapter-source-history',{document,sources});
    else for(const [kind,urls]of Object.entries(sources))if(urls.length)add(row.id,file,'micro-adapter-asset-still-loaded',{document,kind,urls});
    if(!Array.isArray(r.canvases)||r.visiblePieces!==0||r.canvases.some(c=>c.visible))add(row.id,file,'visible-edge-decoration-not-cancelled',{document,visible:r.visiblePieces,canvases:r.canvases});
  }
};
for(const game of catalog)for(const width of[1280,1920]){
  const count=seen.get(game+':'+width)||0;
  if(count!==1)add(game,null,'incomplete-36-by-2-live-evidence',{width,eligibleRecords:count,expected:1});
}
if(report.changedFiles?.length)add(null,null,'source-drift-during-capture',report.changedFiles);
if(report.errors?.length)add(null,null,'browser-errors',report.errors);
if((report.games||[]).some(row=>row.error))add(null,null,'incomplete-real-game-capture',report.games.filter(row=>row.error).map(row=>({game:row.id,error:row.error})));
const result={status:findings.length?'needs-correction':'passed',profile:'user-disabled-all',disabledReason:'Latest explicit human cancellation of all36 edge-decoration kits; themed panels/logos/notices remain outside this removal.',expectedRecords:catalog.length*2,expectedDocumentChecks:catalog.length*4,expectedPieces:0,checkedRecords:checked.length/2,checkedDocuments:checked.length,checked,skipped,findings,
  scope:'Fresh actual TV parent AND game document prove no microadapter scripts/styles/resource loads/API/start flag and zero visible cuff canvases for all36 games at bothsizes. Historical negative pair/single errors are preserved, not retroactively waived. No phone, state injection, runtime mutation or browser-error filtering.'};
if(!process.argv.includes('--stdout-only'))fs.writeFileSync(path.join(directory,'micro-attachments-check.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));process.exitCode=findings.length?1:0;
