'use strict';
// Assertions against fresh browser measurements; run capture-gameplay-round2 first.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('.localparty-build/design-round2/gameplay'),checks=[];
for(const folder of ['final-normal-720','final-normal-1080','party-accepted-16-720','party-accepted-16-1080']){
 const report=JSON.parse(fs.readFileSync(path.join(root,folder,'report.json')));
 for(const row of report.games.filter(r=>['push','shrink','knives','bomb'].includes(r.id))){
  const labels=row.partyLabels;assert(labels?.length>=4,folder+' '+row.id+' has real name measurements');
  for(const label of labels)assert(label.pixelFont>=14,'name keeps readable CSS size');
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
   const a=labels[i],b=labels[j];assert(!(Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.y-b.y)<(a.h+b.h)/2),`${folder} ${row.id}: names ${a.id}/${b.id} overlap`);
  }
  checks.push({folder,game:row.id,labels:labels.length,overlappingPairs:0,minCssFont:Math.min(...labels.map(l=>l.pixelFont))});
 }
}
const bow=JSON.parse(fs.readFileSync(path.join(root,'bow-final/report.json'))).games[0];
for(const size of ['phone393','phone320']){
 const m=bow[size],b=m.bowGeometry,hand=b['#hand'],hud=b['.phone-hud'],pad=b['#touchPad'],shoot=b['.shoot-hud'];
 assert.equal(m.offscreenControls.length,0,'actual controller controls fit '+size);
 assert(hand.scrollWidth<=hand.clientWidth,'translated handedness label is not clipped');
 assert(hand.h<=48.1,'hand label stays one line in its capsule');
 assert.equal(hud.h,68,'HUD remains bounded');
 assert(pad.y>=hud.bottom+19,'touch field clears HUD');
 assert.equal(pad.x,12);assert.equal(pad.right,m.width-12,'field has matching portrait insets');
 assert(pad.bottom<shoot.y,'touch field clears shoot controls');
 checks.push({game:'bow_club',size,handHeight:hand.h,hudHeight:hud.h,padWidth:pad.w,padToShootGap:shoot.y-pad.bottom});
}
fs.writeFileSync(path.join(root,'layout-validation.json'),JSON.stringify({checkedAt:new Date().toISOString(),checks},null,2));
console.log('PASS 16 real party name layouts at 4/16 players and 1280/1920 TV; Bow Club actual touch HUD/field at320/393.');
