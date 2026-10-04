'use strict';
const fs=require('node:fs'),path=require('node:path');
const directory=path.resolve(process.argv[2]);
const report=JSON.parse(fs.readFileSync(path.join(directory,'report.json')));
const findings=[], add=(game,file,check,details)=>findings.push({game,file,check,details});
const assignments={
 'centered-scoreboard':'tanks western marble_bloom pocket_siege taprace punchmeter flappy hungry snakelines carryball chaos poker airhockey',
 'rail-cap':'push shrink knives bomb tankarena kart western_duel jenga crane naval mines',
 'content-cap':'monster spy crocodile drawguess sinyakquiz warsaw millionaire',
 'game-owned':'bow_club curling bowling swarm_gate peek_shoot'
};
const modes=Object.fromEntries(Object.entries(assignments).flatMap(([mode,ids])=>ids.split(' ').map(id=>[id,mode])));
const paints=new Set();
for(const row of report.games){
 const shots=(row.compositionScreens||[]).filter(s=>s.surface==='tv');
 if(!shots.length){add(row.id,null,'missing-adjacent-evidence','No TV screenshot-adjacent composition record');continue;}
 for(const shot of shots){
  const {parent:p,content:c}=shot.evidence||{},mode=modes[row.id];
  if(!p||!c){add(row.id,shot.file,'missing-frame-evidence',shot.evidence);continue;}
  if(!c.url.includes('/games/'+row.id+'/'))add(row.id,shot.file,'wrong-active-frame',c.url);
  if(c.rootAttributes['data-party-hud-mode']!==mode)add(row.id,shot.file,'wrong-composition-family',{expected:mode,actual:c.rootAttributes['data-party-hud-mode']});
  if(mode==='game-owned'){
   if(p.dock)add(row.id,shot.file,'duplicate-shared-sports-cap',p.dock);
   continue;
  }
  const dock=p.dock;if(!dock){add(row.id,shot.file,'missing-live-cap','No visible match surface');continue;}
  if(dock.x < -1 || dock.right > p.width+1 || dock.y < -1 || dock.bottom > p.height+1)add(row.id,shot.file,'cap-outside-screen',dock);
  if(!p.context?.text)add(row.id,shot.file,'missing-game-identity','Actual game name is absent');
  for(const value of [...(p.readouts||[]),p.title].filter(Boolean)){
   if(/^[0-9:/.%+\-\s·]+$/.test(value.text) && value.scrollWidth>value.clientWidth+1)
    add(row.id,shot.file,'clipped-numeric-readout',value);
  }
  // Construction explicitly owns one local wash, with a transparent shared cap.
  const localWash=['jenga','crane'].includes(row.id);
  const paint=localWash?c.rails[0]?.background:dock.decoration?.before?.background;
  if(!paint||paint==='none'||paint.includes('rgba(0, 0, 0, 0) none')&&!localWash)add(row.id,shot.file,'missing-rendered-cap-material',dock.decoration);
  if(paint)paints.add(paint);
  const local=mode==='rail-cap'?c.rails[0]:c.anchors[0];
  if(!local){add(row.id,shot.file,'missing-actual-anchor',mode);continue;}
  if(row.id==='crane'){
   const bg=c.backgroundProof,canvas=bg?.canvasBounds,cover=bg?.coverFitRect;
   if(!bg?.loaded||!bg.paintedInCanvas||!bg.assetPath?.includes('crane-city-minimal-20261003-v1'))add(row.id,shot.file,'missing-fullwidth-city-paint',bg);
   else if(!canvas||Math.abs(canvas.left)>1||Math.abs(canvas.top)>1||Math.abs(canvas.width-c.width)>2||Math.abs(canvas.height-c.height)>2||!cover||cover.x>1||cover.y>1||cover.x+cover.width<c.width-1||cover.y+cover.height<c.height-1)add(row.id,shot.file,'city-does-not-cover-viewport',bg);
   if(!local.background.includes('rgba(0, 0, 0, 0)')||!local.background.includes('none'))add(row.id,shot.file,'hard-crane-rail-backing',local.background);
  }
  const sx=p.frame.width/c.width,sy=p.frame.height/c.height;
  const expected={x:p.frame.x+local.x*sx,y:p.frame.y+local.y*sy,width:local.width*sx};
  const centerError=Math.abs(dock.x+dock.width/2-expected.x-expected.width/2);
  if(centerError>3)add(row.id,shot.file,'cap-detached-from-anchor-axis',{centerError,dock,expected});
  if(mode==='rail-cap'){
   if(Math.abs(dock.width-expected.width)>3)add(row.id,shot.file,'cap-overhangs-measured-rail',{dock,expected});
   if(Math.abs(dock.y-expected.y)>3)add(row.id,shot.file,'cap-detached-from-rail-head',{dock,expected});
  }
  if(mode==='content-cap'){
   const cluster=c.clusters[0];if(!cluster)add(row.id,shot.file,'missing-content-cluster','No intrinsic whole group');
   else if(Math.abs(dock.y-expected.y)>3)add(row.id,shot.file,'header-detached-from-task-head',{dock,anchor:local,cluster});
  }
  if(dock.decoration?.before?.mask&&dock.decoration.before.mask!=='none')add(row.id,shot.file,'obsolete-masked-header',dock.decoration.before);
  if(dock.decoration?.after?.content&&!['none','normal'].includes(dock.decoration.after.content))add(row.id,shot.file,'unwanted-header-ornament',dock.decoration.after);
  if(mode==='centered-scoreboard'){
   if(Math.abs(dock.y-p.frame.y)>2)add(row.id,shot.file,'header-not-attached-to-screen-top',{dock,frame:p.frame});
   if(p.frame.y>1||Math.abs(p.frame.bottom-p.height)>2)add(row.id,shot.file,'field-letterboxed',{frame:p.frame,viewport:p.height});
   const radii=dock.borderRadius.split(/[ /]+/).map(parseFloat);
   if(!(radii[0]===0&&radii[1]===0&&radii[2]>0&&radii[3]>0))add(row.id,shot.file,'wrong-screen-attached-corners',dock.borderRadius);
  }
 }
}
if(report.changedFiles?.length)add(null,null,'unstable-source-snapshot',report.changedFiles);
if(report.errors?.length)add(null,null,'browser-errors',report.errors);
const result={status:findings.length?'needs-correction':'passed',captured:report.games.length,distinctRenderedCapPaints:paints.size,
 scope:'Actual rendered cap attachment, on-screen bounds, identity and surface paint. Aesthetics, material quality, balance, camera grounding and action visibility require independent original-image review.',findings};
fs.writeFileSync(path.join(directory,'composition-check.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));process.exitCode=findings.length?1:0;
