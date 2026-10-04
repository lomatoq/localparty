'use strict';
// Classic physics-bug guard for bowling: pins/ball never sink into the lane, gutters,
// pit or walls (surface sampled), never escape, never explode, no late flips.
const test=require('node:test'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),path=require('node:path');
test('bowling stress: 120 random + extreme throws stay inside the alley',()=>{
 const r=spawnSync(process.execPath,[path.join(__dirname,'../scripts/bowling-stress.cjs'),'120'],{encoding:'utf8',timeout:240000});
 const out=JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
 assert.equal(out.failures,0,JSON.stringify(out.firstFailures));
 assert.ok(out.maxPinPenetration<=.06,'pin surface penetration '+out.maxPinPenetration);
 assert.equal(out.lateFlips,0);
});
