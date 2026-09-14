const {test}=require('node:test'),assert=require('node:assert/strict');
const {ballot}=require('../lib/game-ballot');
const catalog=[{id:'a',min:2,max:4},{id:'b',min:2,max:4},{id:'c',min:4,max:4}];
const people=['1','2','3'].map(id=>({id}));
const result=v=>ballot(catalog,people,new Map(v));
test('ballot waits for every connected player and counts each identity once',()=>{
 assert.equal(result([['1','a'],['2','a']]).reason,'waiting');
 assert.equal(result([['1','a'],['2','a'],['3','b']]).winner,'a');
 assert.equal(result([['1','a'],['2','a'],['3','invalid']]).reason,'waiting');
 assert.equal(result([['1','a'],['2','a'],['3','b'],['offline','b']]).winner,'a');
});
test('ties expose leaders; unsupported player counts do not select another game',()=>{
 assert.deepEqual(result([['1','a'],['2','b'],['3','c']]).candidates,['a','b','c']);
 assert.equal(result(people.map(p=>[p.id,'c'])).reason,'player-count');
 assert.equal(ballot(catalog,[],new Map()).reason,'waiting');
 assert.equal(ballot(catalog,[...people,{id:'bot',testBot:true}],new Map(people.map(p=>[p.id,'a']))).winner,'a');
});
