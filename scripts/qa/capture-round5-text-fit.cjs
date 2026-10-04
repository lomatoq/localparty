'use strict';
// Add read-only text/field evidence to the canonical real-engine capture.
const assert=require('node:assert/strict');
const evidencePath=require.resolve('./capture-composition-evidence.cjs');
const original=require(evidencePath);
require.cache[evidencePath].exports=async page=>{
 const evidence=await original(page);
 const frame=await(await page.locator('#gameFrame').elementHandle()).contentFrame();
 const proof=await frame.evaluate(()=>{
  const game=document.documentElement.dataset.partyGame,box=e=>e?.getBoundingClientRect().toJSON(),ink=e=>{if(!e)return null;const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect().toJSON();};
  const field=document.querySelector(game==='drawguess'?'#canvas':'#stage');
  const rows=[...document.querySelectorAll(game==='drawguess'?'#board .row':'.score-chip')].map(e=>{
   const name=e.querySelector(game==='drawguess'?'.person strong':'.hp-player-name'),meta=e.querySelector(game==='drawguess'?'.person small':':scope>span'),score=e.querySelector(game==='drawguess'?'.points':'.bow-points');
   return {card:box(e),name:{text:name?.textContent,box:box(name),ink:ink(name),scrollWidth:name?.scrollWidth,clientWidth:name?.clientWidth},meta:{text:meta?.textContent,box:box(meta),ink:ink(meta),scrollWidth:meta?.scrollWidth,clientWidth:meta?.clientWidth},score:{text:score?.textContent,box:box(score),ink:ink(score)}};
  });
  return {game,viewport:{width:innerWidth,height:innerHeight},field:box(field),rows,scroll:game==='drawguess'?{box:box(document.querySelector('#board')),height:document.querySelector('#board').scrollHeight,client:document.querySelector('#board').clientHeight,mask:getComputedStyle(document.querySelector('#board')).maskImage}:null};
 });
 if(['drawguess','bow_club'].includes(proof.game)){
  assert(proof.rows.length>=4,'actual four-player roster');
  assert(proof.field.left>=-.1&&proof.field.top>=-.1&&proof.field.right<=proof.viewport.width+.1&&proof.field.bottom<=proof.viewport.height+.1,'unchanged field fits viewport');
  for(const row of proof.rows){
   assert(row.meta.ink.top>=row.card.top+1&&row.meta.ink.bottom<=row.card.bottom-1,'complete supporting ink fits its own card');
   assert(row.name.ink.top>=row.card.top+1&&row.name.ink.bottom<=row.card.bottom-1,'complete name lines fit their card');
   assert(row.score.ink.top>=row.card.top+1&&row.score.ink.bottom<=row.card.bottom-1,'whole score ink fits card');
   if(proof.game==='bow_club'){
    assert(row.card.left>=0&&row.card.right<=proof.viewport.width&&row.card.top>=0&&row.card.bottom<=proof.viewport.height,'score card on screen');
    if(/^(?:Бот|Bot)\s*\d+$/u.test(row.name.text))assert(row.name.ink.width<=row.name.box.width+.5,'whole numbered bot name visible');
   }
  }
  evidence.round5TextFit=proof;
 }
 return evidence;
};
require('../capture-interface-review.cjs');
