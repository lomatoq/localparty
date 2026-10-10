"use strict";
const http=require('node:http'),https=require('node:https');
const {performance}=require('node:perf_hooks');

// Desired sharing survives temporary loss of Wi-Fi and suspension; user-off does not.
class NetworkAccess {
 constructor(handler,upgrade,{port=8080,provision=null,address=()=>null,onChange=()=>{}}={}) {
  Object.assign(this,{handler,upgrade,preferredPort:port,provision,address,onChange});
  this.hostname='';this.boundAddress='';this.port=0;this.server=null;this.sockets=new Set();
  this.desired=false;this.suspended=false;this.revision=0;this.tail=Promise.resolve();this.retryAt=0;this.failures=0;this.lastError=null;this.reconciling=null;
 }
 get enabled(){return !!this.server?.listening;}
 enqueue(fn){const task=this.tail.then(fn);this.tail=task.catch(()=>{});return task;}
 setEnabled(value){this.desired=!!value;this.revision++;this.retryAt=0;return value?this.enqueue(()=>this.update()):this.close();}
 setSuspended(value){this.suspended=!!value;this.revision++;this.retryAt=0;if(value)return this.close();void this.reconcile();return Promise.resolve();}
 reconcile(){
  if(this.reconciling)return this.reconciling;
  if(performance.now()<this.retryAt)return Promise.resolve();
  this.reconciling=this.enqueue(()=>this.update()).catch(()=>{}).finally(()=>{this.reconciling=null;});return this.reconciling;
 }
 async update(){
  const ip=this.address();
  if(!this.desired||this.suspended||!ip){await this.close();return;}
  if(this.enabled&&this.boundAddress===ip)return;
  await this.close();
  try{await this.open(ip);this.failures=0;this.retryAt=0;this.lastError=null;}
  catch(error){this.lastError=error.message;this.retryAt=performance.now()+Math.min(30000,1000*2**Math.min(this.failures++,5));this.onChange();throw error;}
 }
 async open(ip=this.address()){
  const revision=this.revision;
  const current=()=>revision===this.revision&&this.desired&&!this.suspended&&ip===this.address();
  const certificate=this.provision?await this.provision(ip):null;
  if(!current())return;
  const handler=(req,res)=>{req.partyPublic=true;this.handler(req,res);};
  const server=certificate?https.createServer({key:certificate.key,cert:certificate.cert},handler):http.createServer(handler);
  const sockets=new Set();
  server.on('connection',socket=>{socket.setNoDelay(true);sockets.add(socket);socket.on('error',()=>{});socket.on('close',()=>sockets.delete(socket));});
  server.on('upgrade',(req,socket,head)=>{req.partyPublic=true;try{this.upgrade(req,socket,head);}catch{socket.destroy();}});
  server.on('error',error=>{if(this.server!==server)return;this.lastError=error.message;this.retryAt=performance.now()+1000;this.enqueue(()=>this.close()).catch(()=>{});});
  const listen=port=>new Promise((resolve,reject)=>{
   const fail=e=>{server.off('listening',done);reject(e);};
   const done=()=>{server.off('error',fail);resolve();};
   server.once('error',fail);server.once('listening',done);server.listen(port,'0.0.0.0');
  });
  try{try{await listen(this.preferredPort);}catch(e){if(this.preferredPort&&['EADDRINUSE','EACCES'].includes(e.code))await listen(0);else throw e;}}
  catch(error){for(const socket of sockets)socket.destroy();server.close();throw error;}
  if(!current()){for(const socket of sockets)socket.destroy();await new Promise(resolve=>server.close(resolve));return;}
  this.server=server;this.sockets=sockets;this.port=server.address().port;this.preferredPort=this.port;this.hostname=certificate?.hostname||'';this.boundAddress=ip;
  this.onChange();
 }
 async close(){
  const server=this.server;if(!server)return;
  const sockets=this.sockets;this.server=null;this.sockets=new Set();this.port=0;this.hostname='';this.boundAddress='';
  const closed=new Promise(resolve=>server.close(resolve));for(const socket of sockets)socket.destroy();await closed;this.onChange();
 }
}
module.exports={NetworkAccess};
