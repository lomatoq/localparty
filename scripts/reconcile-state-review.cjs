'use strict';
// Retain the complete run and explicitly overlay successful scoped recaptures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const [baseArg,...overlayArgs]=process.argv.slice(2);assert(baseArg&&overlayArgs.length,'Pass a full capture directory and scoped capture directories');
const base=path.resolve(baseArg),reportPath=path.join(base,'states-report.json');
const read=dir=>JSON.parse(fs.readFileSync(path.join(dir,'states-report.json'),'utf8'));
const report=read(base);assert.equal(report.games.length,36,'Base must contain all36 games');
const archive=path.join(base,'full-sweep-before-reconciliation.json');assert(!fs.existsSync(archive),'Do not overwrite original sweep archive');fs.copyFileSync(reportPath,archive);
const provenance=[];
for(const arg of overlayArgs){const dir=path.resolve(arg),overlay=read(dir);assert(overlay.assetsStable,'Overlay must have stable assets');assert.deepEqual(overlay.errors,[],'Overlay must have no browser errors');
 const accepted=overlay.games.filter(g=>!g.error),failed=overlay.games.filter(g=>g.error).map(g=>({id:g.id,error:g.error}));
 for(const game of accepted){const index=report.games.findIndex(g=>g.id===game.id);assert(index>=0);report.games[index]={...game,captureSource:dir,assetHash:overlay.assetsAtStart.hash};
  for(const suffix of ['', '-tv','-waiting','-tv-waiting','-paused','-tv-paused','-reconnected','-results','-tv-results']){const name=game.id+suffix+'.png',from=path.join(dir,name);if(fs.existsSync(from)){const to=path.join(base,name);fs.copyFileSync(from,to);const stat=fs.statSync(from);fs.utimesSync(to,stat.atime,stat.mtime);}}
 }
 provenance.push({source:dir,startedAt:overlay.startedAt,finishedAt:overlay.finishedAt,assetHash:overlay.assetsAtStart.hash,acceptedGames:accepted.map(g=>g.id),failedGames:failed});
}
for(const g of report.games){assert(!g.error,g.id);for(const field of ['controllerButtons','shellButtons'])for(const kind of ['small','clipped','outsideViewport'])assert.deepEqual(g[field]?.[kind]||[],[],g.id+' '+field+' '+kind);}
for(const surface of ['waiting','controller','shell','screen'])for(const g of report.games){assert.deepEqual(g[surface]?.missing||[],[]);assert.deepEqual(g[surface]?.residual||[],[]);}
report.assetsReconciled=true;report.reconciledAt=new Date().toISOString();report.revisionReconciliation=provenance;report.reconciliationNote='Original full sweep is archived. Scoped later captures replace only listed games. Failed overlay rows remain in their original report and are not accepted. Earlier rows retain original revision evidence; final changes were scoped to later recaptured games.';
fs.writeFileSync(reportPath,JSON.stringify(report,null,2));for(const name of ['states-missing.json','states-residual.json'])fs.writeFileSync(path.join(base,name),'[]\n');
console.log(JSON.stringify({games:report.games.length,overlays:provenance,report:reportPath},null,2));
