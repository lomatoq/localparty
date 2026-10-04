'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {rankResultRows}=require('../lib/result-ranking'),{TVDirector,matchRows}=require('../lib/tv-director'),{ProfileStore}=require('../lib/profile-store');
const catalog=require('../lib/catalog'),contracts=require('./fixtures/result-ranking-contracts.cjs');
const people=[{id:'a',name:'Alexandra LongSurname'},{id:'b',name:'Виктория Александров'},{id:'c',name:'Jamie ThirdBuilder'}];
const rows=(scores,won=true,rank)=>scores.map((score,i)=>({id:people[i]?.id||'p'+i,name:people[i]?.name||'Player '+i,score,won,...(rank?{rank}:{})}));
const places=rs=>rs.map(r=>[r.id,r.score,r.rank]);
test('collective won is independent from personal place, including stale all-first inputs',()=>{
 for(const rank of [undefined,1]){const input=rows([60,120,50],true,rank),before=JSON.stringify(input);assert.deepEqual(places(rankResultRows(input)),[['b',120,1],['a',60,2],['c',50,3]]);assert(rankResultRows(input).every(r=>r.won));assert.equal(JSON.stringify(input),before);}
});
test('real ties, zero ties and negative contributions use competition places',()=>{
 assert.deepEqual(rankResultRows(rows([120,120,50])).map(r=>r.rank),[1,1,3]);
 assert.deepEqual(rankResultRows(rows([0,0,0],false)).map(r=>r.rank),[1,1,1]);
 assert.deepEqual(places(rankResultRows(rows([-10,-50,0]))),[['c',0,1],['a',-10,2],['b',-50,3]]);
});
test('game outcomes and genuine explicit race/tiebreaker places remain authoritative',()=>{
 const input=rows([60,120,50],false);input[2].won=true;
 assert.deepEqual(places(rankResultRows(input)),[['c',50,1],['b',120,2],['a',60,3]]);
 input[0].rank=2;input[1].rank=3;input[2].rank=1;
 assert.deepEqual(rankResultRows(input).map(r=>r.id),['c','a','b']);
 assert.deepEqual(rankResultRows(rows([60,120,50]),{ranking:{kind:'score'}}).map(r=>r.id),['b','a','c']);
});
test('an explicit lower-is-better score contract ranks time without changing values',()=>{
 assert.deepEqual(places(rankResultRows(rows([60,120,50]),{ranking:{kind:'score',direction:'asc'}})),[['c',50,1],['a',60,2],['b',120,3]]);
});
test('genuine teams share a place despite different personal contributions',()=>{
 const input=[{id:'a',team:0,teamScore:170,score:120,won:true,rank:1},{id:'b',team:0,teamScore:170,score:50,won:true,rank:1},{id:'c',team:1,teamScore:160,score:160,won:false,rank:3},{id:'d',team:1,teamScore:160,score:0,won:false,rank:3}];
 const result=rankResultRows(input,{ranking:{kind:'teams'}});assert.deepEqual(result.map(r=>r.rank),[1,1,2,2]);assert.deepEqual(result.map(r=>r.score),[120,50,160,0]);
 input.forEach(p=>{p.rank=1;p.teamScore=170;p.won=true;});assert.deepEqual(rankResultRows(input,{ranking:{kind:'teams'}}).map(r=>r.rank),[1,1,1,1]);
});
test('incomplete team metadata does not invent scores or hide personal differences',()=>{
 const input=rows([60,120,50],true,1);input[0].team=0;input[0].teamScore=100;
 assert.deepEqual(rankResultRows(input,{ranking:{kind:'teams'}}).map(r=>r.rank),[1,2,3]);
});
test('TV capture, shared phone payload and stored restart rows use the same repaired order',()=>{
 const store=new ProfileStore(null),profiles=people.map(p=>store.register(null,p.name,'right'));
 const game={id:'crane',title:'Stack Blocks'},result={eventId:'fixture-contract',ranking:{kind:'score'},players:rows([60,120,50],true,1).map((r,i)=>({...r,id:profiles[i].id}))};
 store.record(result,'session',game.id);const director=new TVDirector({catalog:[game],store});director.capture(result,'session',game);
 const active={instance:'session',game,ui:{phase:'results'}};
 const stored=store.data.events[0].players,phone=director.resultFor(active).rows,tv=director.view({active}).board.rows;
 assert.deepEqual(places(phone),places(stored));assert.deepEqual(places(tv),places(phone));assert(store.data.players.every(p=>p.stats.wins===1));
 assert.deepEqual(places(new TVDirector({catalog:[game],store}).lastMatch.rows),places(phone));
});
test('team metadata survives sanitized adapters and cold restart, without profile secrets',()=>{
 const store=new ProfileStore(null),profiles=people.map(p=>store.register(null,p.name,'right')),game={id:'bow_club',title:'Bow Club'};
 const result={eventId:'fixture-team',ranking:{kind:'teams'},players:profiles.map((p,i)=>({id:p.id,score:[120,50,160][i],won:i<2,team:i<2?0:1,teamScore:i<2?170:160}))};
 store.record(result,'team-session',game.id);const d=new TVDirector({catalog:[game],store});d.capture(result,'team-session',game);
 assert.deepEqual(d.lastMatch.rows.map(p=>[p.rank,p.team,p.teamScore]),[[1,0,170],[1,0,170],[2,1,160]]);
 assert.deepEqual(new TVDirector({catalog:[game],store}).lastMatch.rows,d.lastMatch.rows);
 assert(!JSON.stringify(d.lastMatch).includes(profiles[0].token));
});
test('the source audit covers exactly all 36 released games',()=>{
 assert.equal(contracts.length,36);assert.deepEqual(contracts.map(c=>c.id).sort(),catalog.map(g=>g.id).sort());
 for(const c of contracts){const source=fs.readFileSync(c.source,'utf8');assert.match(source,/report\(|this\.result=/,c.id+' actual producer');}
});
for(const contract of contracts)test(contract.id+' contract fixtures: different/tied/zero scores, 2/16 players, no synthetic all-first',()=>{
 for(const count of [2,16]){
  const input=Array.from({length:count},(_,i)=>({id:'p'+i,name:i===0?'Виктория Александров':'Player '+i,score:(count-i)*10,won:true,rank:1}));
  const ranking={kind:contract.kind==='teams'?'score':contract.kind};
  // Personal-score fixtures test the universal adapter; actual team payloads are tested above.
  const result=matchRows({players:input,ranking},input);
  assert.deepEqual(result.map(r=>r.rank),Array.from({length:count},(_,i)=>i+1));
  for(const p of input)p.score=0;assert(matchRows({players:input,ranking},input).every(p=>p.rank===1));
  input[0].score=input[1].score=20;const tied=matchRows({players:input,ranking},input);assert.equal(tied[0].rank,1);assert.equal(tied[1].rank,1);if(count>2)assert.equal(tied[2].rank,3);
 }
});
test('declared score policy repairs distinct places ordered against the scoring direction',()=>{
 const input=rows([60,120,50],true).map((r,i)=>({...r,rank:i+1}));
 assert.deepEqual(places(rankResultRows(input,{ranking:{kind:'score'}})),[['b',120,1],['a',60,2],['c',50,3]]);
 input[0].score=input[1].score=120;assert.deepEqual(rankResultRows(input,{ranking:{kind:'score'}}).map(r=>r.rank),[1,1,3]);
});
test('16 participants occupy two actual team places, not places1 and9',()=>{
 const input=Array.from({length:16},(_,i)=>({id:'p'+i,team:i%2,teamScore:i%2?60:120,score:i*5,won:i%2===0,rank:1}));
 const result=rankResultRows(input,{ranking:{kind:'teams'}});assert.equal(result.length,16);
 assert(result.filter(p=>p.team===0).every(p=>p.rank===1));assert(result.filter(p=>p.team===1).every(p=>p.rank===2));
});
test('inconsistent scores inside one team fall back to personal outcomes',()=>{
 const input=rows([60,120,50],true,1).map((r,i)=>({...r,team:0,teamScore:i}));
 assert.deepEqual(places(rankResultRows(input,{ranking:{kind:'teams'}})),[['b',120,1],['a',60,2],['c',50,3]]);
});
test('declared team score controls places independently of stale or collective win flags',()=>{
 const input=[{id:'a',team:0,teamScore:60,score:60,won:true},{id:'b',team:1,teamScore:120,score:120,won:false}];
 assert.deepEqual(rankResultRows(input,{ranking:{kind:'teams'}}).map(p=>[p.id,p.rank,p.won]),[['b',1,false],['a',2,true]]);
 input[0].teamScore=120;assert.deepEqual(rankResultRows(input,{ranking:{kind:'teams'}}).map(p=>p.rank),[1,1]);
 input[1].team=0;assert.deepEqual(rankResultRows(input,{ranking:{kind:'teams'}}).map(p=>p.rank),[1,1]);
});
test('Bow producer earns a real collective victory through normal draw/shoot actions with different scores',()=>{
 const {BowMatch}=require('../games/bow_club/core/match.cjs'),g=new BowMatch();people.slice(0,2).forEach(p=>g.add(p));assert(g.start({mode:'coop',arrows:5},0));
 for(let round=0;round<5;round++)for(let i=0;i<2;i++){const now=1000+round*1800+i*800,aim={quality:1,ageMs:0,revision:g.revision};assert(g.draw(people[i].id,aim,now));const target=g.targetsAt(now+600)[1],u=target.u+(i?target.r*.7/(720*g.aspect):0);assert(g.shoot(people[i].id,{...aim,u,v:target.v,seq:round+1},now+600).ok);}
 assert.equal(g.phase,'results');assert(g.result.players.every(p=>p.won));assert.equal(g.result.ranking.kind,'score');
 assert.deepEqual(rankResultRows(g.result.players,g.result).map(p=>[p.score,p.rank]),[[500,1],[125,2]]);
});
test('Bow teams producer ranks summed earned arrow points while retaining personal contributions',()=>{
 const {BowMatch}=require('../games/bow_club/core/match.cjs'),g=new BowMatch(),ids=['a','b','c','d'];ids.forEach(id=>g.add({id,name:id}));assert(g.start({mode:'teams',arrows:5},0));
 const fractions=[0,.3,.7,.3];for(let round=0;round<5;round++)for(let i=0;i<4;i++){const now=1000+round*3600+i*800,aim={quality:1,ageMs:0,revision:g.revision};assert(g.draw(ids[i],aim,now));const t=g.targetsAt(now+600)[1];assert(g.shoot(ids[i],{...aim,u:t.u+t.r*fractions[i]/(720*g.aspect),v:t.v,seq:round+1},now+600).ok);}
 assert.equal(g.result.ranking.kind,'teams');assert.deepEqual(g.result.players.map(p=>[p.score,p.teamScore]),[[500,625],[300,600],[125,625],[300,600]]);
 assert.deepEqual(rankResultRows(g.result.players,g.result).map(p=>[p.id,p.rank]),[['a',1],['c',1],['b',2],['d',2]]);
});
test('Quiz actual answer producer emits team totals once for captain and members',()=>{
 const {Quiz}=require('../games/quiz/engine'),banks={warsaw:require('../games/quiz/data/warsaw.json')};let result;
 const g=new Quiz(banks,r=>result=r);for(const id of['a','b','c','d'])g.join(id,id);g.team('a',0);g.team('b',0);g.team('c',1);g.team('d',1);g.configure({mode:'teams',count:3});assert(g.start());
 for(let i=0;i<3;i++){const right=g.deck[g.round].answers.indexOf(g.deck[g.round].correct);assert(g.submit('a',g.round,right));assert(g.submit('c',g.round,(right+1)%4));g.reveal();g.next();}
 assert.equal(result.ranking.kind,'teams');assert(result.players.every(p=>p.teamScore===g.teamScores[p.team]));assert.deepEqual(rankResultRows(result.players,result).map(p=>[p.id,p.rank]),[['a',1],['b',1],['c',2],['d',2]]);
});
test('Crocodile actual guessed/skip producer distinguishes team ranking from two-person coop',()=>{
 const {Crocodile}=require('../games/crocodile/engine');for(const count of[2,4]){let result;const g=new Crocodile(r=>result=r);for(let i=0;i<count;i++){g.join('p'+i,'Player '+i);g.setTeam('p'+i,i%2);}g.configure({mode:'teams',turns:6});assert(g.start());for(let turn=0;turn<6;turn++){const p=g.players.get(g.actor);assert(g.action(g.actor,g.wordId,p.team===0?'guessed':'skip'));g.end();g.next();}
 if(count===2){assert.equal(result.ranking,undefined);assert(result.players.every(p=>p.score===300&&p.won));}else{assert.equal(result.ranking.kind,'teams');assert(result.players.every(p=>p.teamScore===g.teamScores[p.team]));assert.deepEqual(rankResultRows(result.players,result).map(p=>p.rank),[1,1,2,2]);}}
});
test('Pocket Siege team producer contract fixture sums negative/positive contributions instead of highest player alone',()=>{
 const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs'),g=new Tanks(17);for(let i=0;i<4;i++)g.add({id:'p'+i,name:'Player '+i});assert(g.start({teams:true,rounds:2}));
 // Explicit producer CONTRACT FIXTURE; not an actual shot or captured final.
 g.players.forEach((p,i)=>p.score=[120,160,50,-5][i]);for(let i=0;i<8;i++)g.nextTurn();
 assert.equal(g.result.ranking.kind,'teams');assert.deepEqual(g.result.teamScores,[170,155]);assert.deepEqual(rankResultRows(g.result.players,g.result).map(p=>[p.id,p.rank,p.teamScore]),[['p0',1,170],['p2',1,170],['p1',2,155],['p3',2,155]]);
});
test('Curling and Swarm producers retain explicit team vs personal contribution policies',()=>{
 const {Match}=require('../games/sports_siege/match');for(const mode of['curling','swarm_gate']){const g=new Match(mode);for(let i=0;i<4;i++)g.add({id:'p'+i,name:'Player '+i});assert(g.start({ends:1,waves:4}));
 // Explicit producer CONTRACT FIXTURE; no fake gameplay final capture.
 g.playing().forEach((p,i)=>p.score=[120,60,50,0][i]);if(mode==='curling')g.teams=[170,60];g.finish('contract-fixture',mode==='curling'?['p0','p2']:g.playing().map(p=>p.id));
 const ranked=rankResultRows(g.result.players,g.result);assert.equal(g.result.ranking.kind,mode==='curling'?'teams':'score');assert.deepEqual(ranked.map(p=>p.rank),mode==='curling'?[1,1,2,2]:[1,2,3,4]);g.world?.free();}
});
