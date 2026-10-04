'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const catalog=require('../../lib/catalog');
const [baseDirectory,retryDirectory,outDirectory]=process.argv.slice(2).map(p=>path.resolve(p));
const read=d=>JSON.parse(fs.readFileSync(path.join(d,'report.json')));
const base=read(baseDirectory),retry=read(retryDirectory),replacements=new Map(retry.games.map(g=>[g.id,g]));
const tvOnly=base.captureSurfaces?.length===1&&base.captureSurfaces[0]==='tv';
assert.deepEqual(retry.captureSurfaces,base.captureSurfaces,'Confirmation surfaces must match the catalog capture');
assert(base.finishedAt&&retry.finishedAt,'Both raw capture attempts must be complete');
assert.deepEqual(retry.errors,[]);assert.deepEqual(retry.changedFiles,[]);
assert.deepEqual(retry.revisionStart,retry.revisionEnd,'Focused confirmation requires a globally stable snapshot');
const digest=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const current=()=>Object.fromEntries(Object.keys(retry.revisionEnd).map(f=>[f,digest(f)]));
const verified=current();assert.deepEqual(verified,retry.revisionEnd,'Current product sources must still match the focused confirmation');
fs.mkdirSync(outDirectory,{recursive:true});
const rows=[],sourceProofs=[];
for(const game of catalog){
 const isRetry=replacements.has(game.id),raw=isRetry?retry:base,directory=isRetry?retryDirectory:baseDirectory;
 const row=raw.games.find(g=>g.id===game.id);assert(row&&!row.error,'A valid real gameplay capture is required: '+game.id);
 assert.equal(row.compositionScreens?.length,tvOnly?2:3,'Required capture surfaces are missing: '+game.id);
 const engine=game.engine||game.id;
 // A different isolated game's stylesheet cannot affect this iframe. Common
 // parent files and every file belonging to this engine must match throughout.
 const dependencies=Object.keys(verified).filter(f=>!f.startsWith('games/')||f.startsWith('games/'+engine+'/'));
 for(const f of dependencies){
  assert.equal(raw.revisionStart[f],verified[f],game.id+' changed dependency before capture: '+f);
  assert.equal(raw.revisionEnd[f],verified[f],game.id+' changed dependency during capture: '+f);
 }
 for(const file of new Set(row.captures))fs.copyFileSync(path.join(directory,file),path.join(outDirectory,file));
 rows.push({...row,sourceOrigin:path.relative(process.cwd(),directory)});
 sourceProofs.push({game:game.id,engine,origin:path.relative(process.cwd(),directory),dependencyCount:dependencies.length,dependencies,status:'current-and-unchanged'});
}
for(const surface of tvOnly?['tv']:['tv','phone'])fs.copyFileSync(path.join(retryDirectory,'main-'+surface+'-lobby.png'),path.join(outDirectory,'main-'+surface+'-lobby.png'));
const after=current();assert.deepEqual(after,verified,'Product sources changed while assembling the accepted evidence');
const segments=[{directory:baseDirectory,report:base},{directory:retryDirectory,report:retry}].map(({directory,report})=>({
 report:path.relative(process.cwd(),path.join(directory,'report.json')),startedAt:report.startedAt,finishedAt:report.finishedAt,
 changedFiles:report.changedFiles,failedRows:report.games.filter(g=>g.error).map(g=>({id:g.id,error:g.error})),
 revisionStart:report.revisionStart,revisionEnd:report.revisionEnd
}));
const result={startedAt:base.startedAt,finishedAt:retry.finishedAt,mainCapturedAt:retry.mainCapturedAt||retry.startedAt,mainCaptureOrigin:path.relative(process.cwd(),retryDirectory),
 method:'Real normal-clock engines. Source-qualified evidence assembled from the complete catalog attempt and focused confirmation of '+[...replacements.keys()].join(', ')+'; all raw failures and drift remain in captureSegments. No injected state or scores.',
 revisionWindow:'revisionStart/revisionEnd describe the final source-verification and assembly window. Raw capture windows and their exact changes are preserved in captureSegments; included game dependencies were verified separately.',
 sourceVerifiedAt:new Date().toISOString(),revisionStart:verified,revisionEnd:after,changedFiles:[],errors:[],
 games:rows,captureSegments:segments,sourceProofs,captureSurfaces:tvOnly?['tv']:['tv','phone']};
fs.writeFileSync(path.join(outDirectory,'report.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({out:outDirectory,games:rows.length,retained:rows.length-replacements.size,replaced:[...replacements.keys()],dependencies:Object.keys(verified).length}));
