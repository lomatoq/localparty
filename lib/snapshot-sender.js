'use strict';
// Real-time retries must keep running while the managed game clock is paused.
const {setInterval,clearInterval,setTimeout}=require('node:timers');

// Packets passed to snapshot() are already encoded: one immutable JSON string
// can serve a whole audience. Only complete, replaceable states belong here.
// Deltas and acknowledgements use event(); a hard backlog forces a full rejoin.
function createSnapshotSender({softLimit=128*1024,hardLimit=1024*1024,retryMs=50}={}){
  const pending=new Map(),seen=new WeakSet(),delivered=new WeakMap();let timer;
  function forget(ws){pending.delete(ws);delivered.delete(ws);if(!pending.size&&timer){clearInterval(timer);timer=null;}}
  function ready(ws){
    if(ws.readyState!==1){forget(ws);return false;}
    if(ws.bufferedAmount>=hardLimit){forget(ws);ws.close(1013,'Slow receiver; reconnect');setTimeout(()=>{if(ws.readyState!==3)ws.terminate?.();},1000).unref();return false;}
    if(!seen.has(ws)){seen.add(ws);ws.once('close',()=>forget(ws));}
    return true;
  }
  function write(ws,packet){try{ws.send(packet);return true;}catch{forget(ws);ws.close(1013,'Delivery failed; reconnect');return false;}}
  function remember(ws,key,packet){let entries=delivered.get(ws);if(!entries)delivered.set(ws,entries=new Map());entries.set(key,packet);}
  function flush(){for(const [ws,entries] of pending){if(!ready(ws)||ws.bufferedAmount>=softLimit)continue;for(const [key,item] of entries){if(ws.bufferedAmount>=softLimit)break;if(!write(ws,item.packet))break;if(item.dedupe)remember(ws,key,item.packet);entries.delete(key);}if(!entries.size)pending.delete(ws);}if(!pending.size&&timer){clearInterval(timer);timer=null;}}
  function snapshot(ws,packet,key='state',dedupe=false){
    if(!ready(ws))return false;
    // Reverting to an already delivered state must also cancel a stale pending one.
    if(dedupe&&delivered.get(ws)?.get(key)===packet){pending.get(ws)?.delete(key);return true;}
    if(ws.bufferedAmount>=softLimit){let entries=pending.get(ws);if(!entries)pending.set(ws,entries=new Map());entries.set(key,{packet,dedupe});if(!timer){timer=setInterval(flush,retryMs);timer.unref();}return false;}
    pending.get(ws)?.delete(key);const sent=write(ws,packet);if(sent&&dedupe)remember(ws,key,packet);return sent;
  }
  function event(ws,value){return ready(ws)&&write(ws,typeof value==='string'?value:JSON.stringify(value));}
  return {snapshot,event};
}
// Adapter for the existing Party/Tanks framing; parsing and wire format stay put.
function socketAdapter(client,frame){
  let closing=false;
  return {
    get readyState(){return client.closed||client.socket.destroyed?3:closing?2:1;},
    get bufferedAmount(){return client.socket.writableLength;},
    send(packet){client.socket.write(frame(packet));},
    once(event,callback){client.socket.once(event,callback);},
    close(code,reason){closing=true;const payload=Buffer.alloc(2+Buffer.byteLength(reason));payload.writeUInt16BE(code);payload.write(reason,2);client.socket.end(frame(payload,8));},
    terminate(){client.socket.destroy();}
  };
}
module.exports={createSnapshotSender,socketAdapter};
