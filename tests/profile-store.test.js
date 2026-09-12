'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {ProfileStore}=require('../lib/profile-store');
test('profiles and comparable rankings persist, results deduplicate, records keep their meaning',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'party-profile-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'profiles.json'),s=new ProfileStore(file),p=s.register(null,'Аня','left');
 const result={eventId:'round1',players:[{id:p.id,score:100,won:true,metrics:{bestLap:40,bestStreak:3,kills:2}}]};assert(s.record(result,'instance1','kart'));assert(!s.record(result,'instance1','kart'));
 assert(s.record({...result,eventId:'round2',players:[{id:p.id,score:20,won:false,metrics:{bestLap:45,bestStreak:2,kills:1}}]},'instance1','kart'));
 const loaded=new ProfileStore(file);assert.equal(loaded.get(p.token).id,p.id);const row=loaded.leaderboard()[0];assert.equal(row.played,2);assert.equal(row.points,50);assert.equal(row.games.kart.metrics.bestLap,40);assert.equal(row.games.kart.metrics.bestStreak,3);assert.equal(row.games.kart.metrics.kills,3);assert(!('token'in row));assert.equal(loaded.data.completed,2);
});
