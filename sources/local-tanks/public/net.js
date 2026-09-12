function createSocketBus(){
  const handlers=new Map();
  let ws=null, open=false, closedByUser=false, retry=null;
  const queue=[];

  function fire(type,data){
    const set=handlers.get(type);
    if(set) for(const fn of [...set]){ try{fn(data)}catch(err){console.error(err)} }
  }
  function connect(){
    clearTimeout(retry);
    const proto=location.protocol==='https:'?'wss:':'ws:';
    ws=new WebSocket(`${proto}//${location.host}/ws`);
    ws.onopen=()=>{
      open=true;
      while(queue.length) ws.send(queue.shift());
      fire('connect');
    };
    ws.onmessage=e=>{
      try{const m=JSON.parse(e.data);fire(m.type,m.data)}catch(err){console.warn('Bad server message',err)}
    };
    ws.onclose=()=>{
      open=false;
      fire('disconnect');
      if(!closedByUser) retry=setTimeout(connect,450);
    };
    ws.onerror=()=>{};
  }
  connect();
  return {
    on(type,fn){if(!handlers.has(type))handlers.set(type,new Set());handlers.get(type).add(fn);return()=>handlers.get(type)?.delete(fn)},
    emit(type,data){
      const packet=JSON.stringify({type,data});
      if(open && ws?.readyState===WebSocket.OPEN) ws.send(packet);
      else queue.push(packet);
    },
    close(){closedByUser=true;clearTimeout(retry);ws?.close()}
  };
}
