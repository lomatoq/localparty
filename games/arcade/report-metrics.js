'use strict';
// Report only measurements actually tracked by this game's simulation.
module.exports=function reportMetrics(game,player){
 switch(game.mode){
  case 'taprace':return {distance:Math.round(player.progress||0)};
  case 'punchmeter':return {bestPunch:Math.max(0,...player.hits),punches:player.hits.length};
  case 'flappy':return {flightSeconds:player.score/10};
  case 'hungry':return {finalMass:Math.round(player.mass||0)};
  case 'snakelines':return {roundWins:player.score,rounds:game.round};
  case 'carryball':return {teamGoals:game.teams[player.team]||0};
  default:return {};
 }
};
