'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {relayStart}=require('../lib/start-delivery');
function active(){return {instance:'round-1',game:{engine:'sports_siege'},session:{startRequested:true,paused:false},ui:{phase:'waiting'}};}
test('ready intent is redelivered to a late host until the game acknowledges playing',()=>{
  const a=active(),host={isHost:true},phone={isHost:false},out=[];
  assert.equal(relayStart(a,[],()=>assert.fail()),0);
  for(let n=0;n<3;n++)assert.equal(relayStart(a,[host,phone],(c,m)=>out.push([c,m])),1);
  assert.equal(out.length,3);assert.ok(out.every(([c,m])=>c===host&&m.instance==='round-1'));
  a.ui.phase='playing';assert.equal(relayStart(a,[host],()=>assert.fail()),0);
});
test('start relay does not bypass pause, votes, results, absent games, or legacy engines',()=>{
  const cases=[null,{...active(),session:{startRequested:false}},{...active(),session:{startRequested:true,paused:true}},
    {...active(),ui:{phase:'results'}},{...active(),game:{engine:'other'}}];
  for(const a of cases)assert.equal(relayStart(a,[{isHost:true}],()=>assert.fail()),0);
});
