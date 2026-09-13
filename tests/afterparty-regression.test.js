'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {curlingScore}=require('../games/afterparty/rules');
const {Sports}=require('../games/afterparty/sports');
test('curling: blue scores against pink, not against itself',()=>assert.deepEqual(curlingScore([{team:1,x:.1,z:25},{team:1,x:.4,z:25},{team:0,x:1,z:25}]),[0,2]));
test('curling: only blue in the house can score',()=>assert.deepEqual(curlingScore([{team:1,x:.2,z:25},{team:1,x:1,z:25}]),[0,2]));
test('curling: swapping team labels swaps the score',()=>{for(let i=0;i<50;i++){const stones=Array.from({length:8},(_,j)=>({team:j%2,x:Math.sin(i*7+j)*2,z:25+Math.cos(i+j)*2}));assert.deepEqual(curlingScore(stones.map(s=>({...s,team:1-s.team}))),curlingScore(stones).reverse());}});
test('curling: idle broom stamina regenerates after input expires',()=>{const ps=[{id:'a',name:'a',connected:true},{id:'b',name:'b',connected:true}],g=new Sports('curling',ps);ps[0].stamina=0;ps[0].sweeping=.3;g.input(g.current,'throw',{turnId:g.turnId,power:.6});for(let i=0;i<60;i++)g.update(1/60);assert.ok(ps[0].stamina>.08);});
