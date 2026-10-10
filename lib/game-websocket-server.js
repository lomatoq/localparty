'use strict';
const {WebSocketServer:Base}=require('ws');
const {performance}=require('node:perf_hooks');
const {setInterval,clearInterval,setTimeout,clearTimeout}=require('node:timers');

// Transport clocks never pause with the game. Media uploads use Socket.IO's
// separate limits; this server only accepts small game-control messages.
class WebSocketServer extends Base {
  constructor(options){
    super({maxPayload:8192,...options});
    this.on('connection',(ws,req)=>{
      ws.networkAlive=true;ws.on('pong',()=>ws.networkAlive=true);
      ws.on('error',()=>{});
      let credit=240,at=performance.now();const emit=ws.emit;
      ws.emit=function(event,...args){
        if(event==='message'){
          const now=performance.now();credit=Math.min(240,credit+(now-at)*.12);at=now;
          if(--credit<0){this.close(1008,'Too many messages');return false;}
        }
        return emit.call(this,event,...args);
      };
      const trusted=process.env.PARTY_MANAGED==='1'?req.headers['x-party-local']==='1':
        ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      const admission=setTimeout(()=>{
        if(!trusted&&!ws.pid&&!ws.player&&!ws.host&&!ws.partyIdentified)ws.close(1008,'Join timeout');
      },15000);admission.unref();ws.once('close',()=>clearTimeout(admission));
    });
    const heartbeat=setInterval(()=>{for(const ws of this.clients){
      if(!ws.networkAlive){ws.terminate();continue;}
      ws.networkAlive=false;if(ws.readyState===1)ws.ping();
    }},10000);heartbeat.unref();this.once('close',()=>clearInterval(heartbeat));
  }
  emit(event,...args){
    if(event==='connection'&&this.clients.size>64){args[0].close(1013,'Room connection limit');return false;}
    return super.emit(event,...args);
  }
}
module.exports={WebSocketServer};
