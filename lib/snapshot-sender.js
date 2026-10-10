'use strict';
const {setInterval,clearInterval,setTimeout}=require('node:timers');
const {performance}=require('node:perf_hooks');
// Negotiated end-to-end window: kernel/proxy buffers are invisible to bufferedAmount.
const protocols=new WeakMap();
function snapshotControl(ws,raw){
 let m=raw;if(Buffer.isBuffer(raw)||typeof raw==='string'){if(raw.length>160)return false;try{m=JSON.parse(String(raw));}catch{return false;}}
 if(m?.type!=='party:snapshots'&&m?.type!=='party:ack')return false;
 let state=protocols.get(ws);
 if(m.type==='party:snapshots'&&m.version===1){if(!state)protocols.set(ws,state={sequence:0,inflight:new Map(),flush:null});return true;}
 if(state&&Number.isSafeInteger(m.seq)&&m.seq>0&&m.seq<=state.sequence){
  for(const seq of state.inflight.keys())if(seq<=m.seq)state.inflight.delete(seq);
  state.flush?.();
 }
 return true;
}
// Complete snapshots may be replaced. Ordered events must be written or force
// a reconnect; pretending to deliver an event can corrupt incremental state.
function createSnapshotSender({softLimit=128*1024,hardLimit=1024*1024,retryMs=50,maxLagMs=2000,maxInFlight=2,maxReliableInFlight=32}={}){
  const pending=new Map(),congested=new Map(),awaiting=new Set(),seen=new WeakSet(),delivered=new WeakMap();let timer;
  function stopIdle(){if(!pending.size&&!congested.size&&!awaiting.size&&timer){clearInterval(timer);timer=null;}}
  function watch(){if(!timer){timer=setInterval(flush,retryMs);timer.unref();}}
  function forget(ws){pending.delete(ws);congested.delete(ws);delivered.delete(ws);awaiting.delete(ws);protocols.delete(ws);stopIdle();}
  function disconnect(ws,reason){forget(ws);ws.close(1013,reason);setTimeout(()=>{if(ws.readyState!==3)ws.terminate?.();},1000).unref();return false;}
  function ready(ws){
    if(ws.readyState!==1){forget(ws);return false;}
    if(!seen.has(ws)){seen.add(ws);ws.once('close',()=>forget(ws));}
    const protocol=protocols.get(ws);if(protocol){protocol.flush=flush;const first=protocol.inflight.values().next().value;if(first!==undefined&&performance.now()-first>=maxLagMs)return disconnect(ws,'Snapshot acknowledgement timed out');}
    if(ws.bufferedAmount>=hardLimit)return disconnect(ws,'Slow receiver; reconnect');
    if(ws.bufferedAmount>=softLimit){
      if(!congested.has(ws))congested.set(ws,performance.now());
      if(performance.now()-congested.get(ws)>=maxLagMs)return disconnect(ws,'Receiver fell behind; reconnect');
      watch();
    }else congested.delete(ws);
    return true;
  }
  function write(ws,packet){
    if(ws.bufferedAmount+Buffer.byteLength(packet)>hardLimit)return disconnect(ws,'Delivery backlog; reconnect');
    try{ws.send(packet);if(ws.bufferedAmount>=softLimit){if(!congested.has(ws))congested.set(ws,performance.now());watch();}return true;}catch{return disconnect(ws,'Delivery failed; reconnect');}
  }
  function blocked(ws){return ws.bufferedAmount>=softLimit||(protocols.get(ws)?.inflight.size||0)>=maxInFlight;}
  function writeSnapshot(ws,packet){
    const protocol=protocols.get(ws);if(!protocol)return write(ws,packet);
    // Existing snapshots are JSON objects; preserve their public shape.
    const seq=protocol.sequence+1;
    const encoded=packet[0]==='{'?'{"_partySnapshot":'+seq+(packet.length>2?',':'')+packet.slice(1):packet;
    if(encoded===packet)return write(ws,packet);
    protocol.sequence=seq;protocol.inflight.set(seq,performance.now());awaiting.add(ws);watch();
    return write(ws,encoded);
  }
  function remember(ws,key,packet){let entries=delivered.get(ws);if(!entries)delivered.set(ws,entries=new Map());entries.set(key,packet);}
  function flush(){
    for(const ws of new Set([...congested.keys(),...pending.keys(),...awaiting])){
      if(!ready(ws))continue;
      if(!protocols.get(ws)?.inflight.size)awaiting.delete(ws);
      if(blocked(ws))continue;
      const entries=pending.get(ws);if(!entries)continue;
      for(const [key,item] of entries){
        if(blocked(ws))break;
        if(!writeSnapshot(ws,item.packet))break;
        if(item.dedupe)remember(ws,key,item.packet);entries.delete(key);
      }
      if(!entries.size)pending.delete(ws);
    }
    stopIdle();
  }
  function snapshot(ws,packet,key='state',dedupe=false){
    if(!ready(ws))return false;
    if(dedupe&&delivered.get(ws)?.get(key)===packet){pending.get(ws)?.delete(key);return true;}
    if(blocked(ws)){
      let entries=pending.get(ws);if(!entries)pending.set(ws,entries=new Map());
      entries.set(key,{packet,dedupe});watch();return false;
    }
    // Drain older channels before a newly writable channel so a delayed public
    // snapshot cannot arrive after its newer game-ui/private update.
    if(pending.get(ws)?.size){pending.get(ws).set(key,{packet,dedupe});flush();return ws.readyState===1&&!pending.get(ws)?.has(key);}
    pending.get(ws)?.delete(key);const sent=writeSnapshot(ws,packet);
    if(sent&&dedupe)remember(ws,key,packet);return sent;
  }
  function event(ws,value){
    if(!ready(ws))return false;
    // Incremental trails/terrain and acknowledgements cannot be replaced. Bound
    // their end-to-end backlog by reconnecting, never silently drop an event.
    if((protocols.get(ws)?.inflight.size||0)>=maxReliableInFlight)return disconnect(ws,'Event acknowledgement backlog');
    return writeSnapshot(ws,typeof value==='string'?value:JSON.stringify(value));
  }
  return {snapshot,event,discard:(ws,key)=>{pending.get(ws)?.delete(key);}};
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
module.exports={createSnapshotSender,socketAdapter,snapshotControl,supportsSnapshots:ws=>protocols.has(ws)};
