'use strict';
// The phone renders text/turn controls, not the arena. Keep this contract
// independent of growing physics state (trails, food, effects and velocities).
module.exports=v=>({mode:v.mode,title:v.title,phase:v.phase,countdown:Math.ceil(v.countdown||0),timer:Math.ceil(v.timer),round:v.round,punchTurn:v.punchTurn,
 ...(v.mode==='carryball'?{teams:v.teams.slice(0,2),ball:{owner:v.ball?.owner||null}}:{}),
 players:v.players.map(p=>({id:p.id,name:p.name,color:p.color,score:p.score,hits:p.hits,alive:p.alive,connected:p.connected,dead:Math.ceil(p.dead||0),...(v.mode==='carryball'?{team:p.team}:{})}))});
