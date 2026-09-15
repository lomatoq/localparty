'use strict';
const http=require('node:http');

// The phone's loopback listener never closes when Wi-Fi sharing changes.
// Track upgraded sockets too: server.close() alone leaves game WebSockets alive.
class NetworkAccess {
 constructor(handler,upgrade,{port=8080}={}) {this.handler=handler;this.upgrade=upgrade;this.preferredPort=port;this.port=0;this.server=null;this.sockets=new Set();this.tail=Promise.resolve();}
 get enabled(){return this.server!==null;}
 setEnabled(value){const task=this.tail.then(()=>value?this.open():this.close());this.tail=task.catch(()=>{});return task;}
 async open(){
  if(this.server)return;
  const server=http.createServer((req,res)=>{req.partyPublic=true;this.handler(req,res);});
  server.on('connection',socket=>{socket.setNoDelay(true);this.sockets.add(socket);socket.on('close',()=>this.sockets.delete(socket));});
  server.on('upgrade',(req,socket,head)=>{req.partyPublic=true;this.upgrade(req,socket,head);});
  const listen=port=>new Promise((resolve,reject)=>{const fail=e=>{server.off('listening',done);reject(e);};const done=()=>{server.off('error',fail);resolve();};server.once('error',fail);server.once('listening',done);server.listen(port,'0.0.0.0');});
  try {await listen(this.preferredPort);} catch(e) {if(this.preferredPort&&['EADDRINUSE','EACCES'].includes(e.code))await listen(0);else throw e;}
  this.server=server;this.port=server.address().port;this.preferredPort=this.port;
 }
 async close(){
  const server=this.server;if(!server)return;
  this.server=null;this.port=0;
  const closed=new Promise(resolve=>server.close(resolve));
  for(const socket of this.sockets)socket.destroy();
  this.sockets.clear();await closed;
 }
}
module.exports={NetworkAccess};
