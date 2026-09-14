// iOS forbids child processes. Each game gets its own V8 isolate and event loop.
'use strict';
const {Worker, isMainThread, parentPort, workerData}=require('worker_threads');
const path=require('path');
if(!isMainThread){
  process.cwd=()=>workerData.cwd;
  process.connected=true;
  process.send=message=>parentPort.postMessage(message);
  parentPort.on('message',message=>process.emit('message',message));
  if(process.env.PARTY_NATIVE_PHYSICS==='1')require('./mobile-physics.cjs').install(workerData.game);
  require(path.join(workerData.cwd,'server.js'));
}else{
  exports.spawnGame=(cwd,env)=>{
    const worker=new Worker(__filename,{workerData:{cwd,game:env.PARTY_GAME_ID},env,stdout:true,stderr:true});
    worker.exitCode=null;worker.connected=true;
    worker.send=message=>{if(worker.connected)worker.postMessage(message);};
    worker.kill=()=>{worker.connected=false;return worker.terminate();};
    worker.on('exit',code=>{worker.exitCode=code;worker.connected=false;});
    return worker;
  };
}
