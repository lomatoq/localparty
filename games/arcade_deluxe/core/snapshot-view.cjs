'use strict';
// Avatars belong to the room UI, not the60Hz game state. A three-player photo
// room otherwise resends the same base64 images in every20Hz TV snapshot.
const TERRAIN_FIELDS=['terrain','terrainColumns','terrainStrata','terrainMaterials'];
function withoutAvatar(player){const {avatar,...rest}=player;return rest;}
function view(s,{id=null,host=false,localPlayerId=null,paused=false,airDefense}={}){
 const out={...s,paused};
 if(host){out.localPlayerId=localPlayerId;out.players=s.players.map(withoutAvatar);return out;}
 if(airDefense)out.airDefense=airDefense;
 for(const key of [...TERRAIN_FIELDS,'explosionWaves','interceptors','boards','path','chain','shots','projectiles','zones'])delete out[key];
 if(s.arenaMode==='versus'){const board=s.boards.find(b=>b.players.some(p=>p.id===id));if(board)for(const key of ['levelName','queue','combo','phase','progress'])out[key==='phase'?'ownPhase':key==='progress'?'ownProgress':key]=board[key];}
 out.events=s.events.filter(e=>e.player===id||['turn','finish','level','clear'].includes(e.kind)).slice(-12);
 out.players=s.players.map(p=>p.id===id?withoutAvatar(p):{id:p.id,name:p.name,color:p.color,connected:p.connected,participant:p.participant,score:p.score,lane:p.lane,team:p.team,x:p.x,y:p.y});
 return out;
}
function omitUnchangedTerrain(state){for(const field of TERRAIN_FIELDS)delete state[field];return state;}
module.exports={view,omitUnchangedTerrain,TERRAIN_FIELDS};
