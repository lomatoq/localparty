'use strict';
// Real DOM/animation identity check with synthetic score snapshots, no network.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
(async()=>{const browser=await webkit.launch({headless:true});try{
 const page=await browser.newPage();await page.setContent('<div id="title"></div><div id="lobbyStage"></div><button id="start"></button><div id="hint"></div><div id="phase"></div><div id="board"></div>');
 const source=fs.readFileSync('games/arcade/public/app.js','utf8');
 await page.evaluate("window.$=id=>document.getElementById(id);window.host=true;window.id='a';window.instructions={};window.esc=s=>String(s).replaceAll('<','&lt;');window.state={title:'Tap Race',phase:'playing',mode:'taprace',players:[{id:'a',name:'Alpha',color:'#abc',score:1,hits:[],alive:true,connected:true},{id:'b',name:'Beta',color:'#def',score:0,hits:[],alive:true,connected:true}]};");
 await page.evaluate(source.slice(source.indexOf('let boardKey='),source.indexOf('function renderPunchPhone(')));
 const result=await page.evaluate(()=>{
  update();const a=document.querySelector('#board').children[0],b=document.querySelector('#board').children[1];
  state.players[0].score=2;update();const scoreChanged=document.querySelector('#board').children[0]===a;
  state.players[1].score=3;update();const reordered=document.querySelector('#board').children[0]===b&&document.querySelector('#board').children[1]===a;
  state.players[0].name='<not-markup>';update();const safe=!document.querySelector('not-markup')&&a.textContent.includes('<not-markup>');
  return {scoreChanged,reordered,safe};
 });assert.deepEqual(result,{scoreChanged:true,reordered:true,safe:true});console.log('PASS Arcade score changes/rank changes preserve rows and animation identity; names are text');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
