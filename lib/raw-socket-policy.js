'use strict';
const {performance}=require('node:perf_hooks');
const {setInterval,clearInterval}=require('node:timers');
const clients=new Map();let timer;
function attach(client,frame){
 if(clients.size>=64){client.socket.destroy();return;}
 clients.set(client,{frame,alive:true,joinedAt:performance.now(),at:performance.now(),credit:240});
 client.socket.once('close',()=>{clients.delete(client);if(!clients.size){clearInterval(timer);timer=null;}});
 if(!timer){timer=setInterval(()=>{for(const [c,s]of clients){
  if(!s.alive||(!c.trustedHost&&!c.data.playerId&&!c.partyIdentified&&performance.now()-s.joinedAt>15000)){c.socket.destroy();continue;}
  s.alive=false;c.socket.write(s.frame('',9));
 }},10000);timer.unref();}
}
function pong(client){const s=clients.get(client);if(s)s.alive=true;}
function allow(client){const s=clients.get(client);if(!s)return false;const now=performance.now();s.credit=Math.min(240,s.credit+(now-s.at)*.12);s.at=now;if(--s.credit<0){client.socket.destroy();return false;}return true;}
module.exports={attach,pong,allow};
