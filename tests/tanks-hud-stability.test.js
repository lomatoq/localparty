'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

test('Tanks keeps unchanged lobby/result nodes instead of restarting their animations on every snapshot',()=>{
 const source=fs.readFileSync(require.resolve('../games/tanks/public/host.js'),'utf8');
 const element=()=>({writes:0,_html:'',textContent:'',classList:{add(){},remove(){}},set innerHTML(v){this._html=v;this.writes++;},get innerHTML(){return this._html;}});
 const context={lobbyPlayersKey:null,resultStatsKey:null,playerList:element(),playerCount:element(),lobbyOverlay:element(),resultOverlay:element(),joinBadge:element(),modeHud:element(),resultText:element(),resultStats:element(),escapeHtml:s=>s,formatTime:s=>String(s)};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function renderLobbyPlayers('),source.indexOf("for(const btn of document.querySelectorAll('.mode-card'))")),context);
 const players=[{id:'a',name:'Alpha',color:'#abc',team:'red',handedness:'right',score:100,roundWins:2,kills:1,captures:0}];
 const state={game:{status:'finished',mode:'survival',round:10,winnerText:'Alpha'},players};
 for(let i=0;i<100;i++){context.renderLobbyPlayers(players.map(p=>({...p,x:i})));context.updateUI(state);}
 assert.equal(context.playerList.writes,1,'Static lobby must not be rebuilt at server tick rate');
 assert.equal(context.resultStats.writes,1,'Identical result snapshots must keep their rows');
 players[0].name='Beta';context.renderLobbyPlayers(players);assert.equal(context.playerList.writes,2);
 players[0].score=150;context.updateUI(state);assert.equal(context.resultStats.writes,2);
 context.updateUI({...state,game:{...state.game,status:'playing'}});context.updateUI(state);assert.equal(context.resultStats.writes,3,'A later result gets one new presentation');
});
