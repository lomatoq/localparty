'use strict';
const fs=require('node:fs'),path=require('node:path'),catalog=require('../../lib/catalog');
const directory=path.resolve(process.argv[2]||'output/playwright/ui-rework-2026-10-02/final-games');
const capture=JSON.parse(fs.readFileSync(path.join(directory,'report.json'))),findings=[];
const tvOnly=capture.captureSurfaces?.length===1&&capture.captureSurfaces[0]==='tv';
const add=(game,check,details)=>findings.push({game,check,details});
const seen=new Set();
for(const row of capture.games){
 if(seen.has(row.id))add(row.id,'duplicate-game','Multiple rows');seen.add(row.id);
 if(row.error)add(row.id,'runtime',row.error);
 if(row.themeProofs?.length!==2)add(row.id,'missing-theme-geometry-proof','Expected both current TV and phone comparisons');for(const proof of row.themeProofs||[])if(!proof.sourceGeometryUnchanged)add(row.id,'theme-altered-geometry-'+proof.surface,proof.changed);
 for(const proof of row.themeProofs||[]){const expected=proof.surface==='tv'?'host':'phone';if(proof.role!==expected)add(row.id,'wrong-frame-role-'+proof.surface,{role:proof.role,expected,url:proof.url});const metrics=proof.surface==='tv'?row.tv:row.phone393;if(proof.url!==metrics?.url)add(row.id,'different-frame-'+proof.surface,{proof:proof.url,metrics:metrics?.url});}
 if(!['playing','reveal'].includes(row.gameplayPhase))add(row.id,'missing-live-state',row.gameplayPhase||'No real gameplay state');
 if(!row.captureStates?.some(s=>s.state==='gameplay'&&['playing','reveal'].includes(s.ui?.phase)))add(row.id,'missing-authoritative-capture','No matching room UI state');
 for(const [surface,metrics,width,height]of[['phone',row.phone393,1206,2622],['tv',row.tv,1920,1080]]){
  if(tvOnly&&surface==='phone')continue;
  const filename=row.id+'-'+surface+'-live-'+(surface==='tv'?'1920':'402')+'.png',file=path.join(directory,filename);
  if(!fs.existsSync(file)){add(row.id,'missing-'+surface,filename);continue;}
  const bytes=fs.readFileSync(file);if(bytes.toString('hex',0,8)!=='89504e470d0a1a0a'||bytes.readUInt32BE(16)!==width||bytes.readUInt32BE(20)!==height)add(row.id,'wrong-image-size',filename);
  if(!metrics){add(row.id,'missing-'+surface+'-geometry','No measured iframe');continue;}
  if(metrics.fonts!=='loaded')add(row.id,'fonts-'+surface,metrics.fonts);
  if(metrics.scrollWidth>metrics.width+1)add(row.id,'horizontal-overflow-'+surface,{width:metrics.width,scrollWidth:metrics.scrollWidth});
  if(surface==='phone'&&metrics.offscreenControls?.length)add(row.id,'offscreen-phone-controls',metrics.offscreenControls);
  if(surface==='phone'&&(metrics.backgroundPlane?.root!=='rgba(0, 0, 0, 0)'||metrics.backgroundPlane?.body!=='rgba(0, 0, 0, 0)'||metrics.backgroundPlane?.pseudo!=='none'))add(row.id,'opaque-controller-plane',metrics.backgroundPlane);
 }
 const field=row.tvField;if(![0,12].includes(field?.gutterLogical))add(row.id,'unrecorded-field-gutter',field);if(!field?.fullscreen)add(row.id,'missing-shared-field-layout',field);else{if(field.frame.y<field.gutterLogical*field.scale-1||field.frame.y>field.gutterLogical*field.scale+1)add(row.id,'incorrect-field-gutter',field);if(field.frame.bottom>field.height-field.gutterLogical*field.scale+1)add(row.id,'field-bottom-gap',field);}
 const chrome=row.phoneChrome;if(!tvOnly&&(!chrome||!chrome.headerGradient.includes('linear-gradient')||!chrome.footerGradient.includes('linear-gradient')||chrome.playBackground!=='rgba(0, 0, 0, 0)'))add(row.id,'phone-shared-gradients',chrome);
}
for(const game of catalog)if(!seen.has(game.id))add(game.id,'missing-game','Not captured');
for(const error of capture.errors||[])add(null,'browser-error',error);
if(capture.changedFiles?.length)add(null,'unstable-source-snapshot',capture.changedFiles);
const result={status:findings.length?'needs-correction':'passed',catalog:catalog.length,captured:seen.size,scope:tvOnly?'Actual normal-clock TV1920x1080 with adjacent720 evidence; fonts, overflow, field and source stability. TV-only screenshot scope. Does not establish physical-device or aesthetic approval.':'Actual normal-clock TV1920x1080 and iPhone17 WebKit gameplay snapshots; fonts, overflow, visible controls and source stability. Does not establish physical-device or aesthetic approval.',findings};
fs.writeFileSync(path.join(directory,'layout-check.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exitCode=findings.length?1:0;
