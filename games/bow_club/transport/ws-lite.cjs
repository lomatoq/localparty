'use strict';
// Small no-dependency RFC6455 transport for the standalone demo. Managed LocalParty
// uses its existing `ws` package instead. Text/binary fragmentation, control frames,
// masked input, ping/pong, payload limits, and backpressure are explicitly handled.
const {EventEmitter}=require('node:events');const crypto=require('node:crypto');
function frame(op,payload){payload=Buffer.isBuffer(payload)?payload:Buffer.from(payload||'');const n=payload.length;let h;if(n<126){h=Buffer.alloc(2);h[1]=n;}else if(n<65536){h=Buffer.alloc(4);h[1]=126;h.writeUInt16BE(n,2);}else{h=Buffer.alloc(10);h[1]=127;h.writeBigUInt64BE(BigInt(n),2);}h[0]=128|op;return Buffer.concat([h,payload]);}
class Socket extends EventEmitter {
 constructor(socket,head,max){super();this.socket=socket;this.max=max;this.readyState=1;this.buf=Buffer.alloc(0);this.fragments=[];this.fragmentBytes=0;this.fragmentOp=0;socket.setNoDelay(true);socket.on('data',b=>this.feed(b));socket.on('error',e=>this.emit('error',e));socket.on('close',()=>{this.readyState=3;this.emit('close');});this.on('error',()=>{});if(head?.length)queueMicrotask(()=>this.feed(head));}
 get bufferedAmount(){return this.socket.writableLength;}
 send(data,cb){if(this.readyState!==1){cb?.(Error('Socket closed'));return;}this.socket.write(frame(typeof data==='string'?1:2,data),cb);}
 ping(){if(this.readyState===1)this.socket.write(frame(9,''));}
 close(code=1000,reason=''){if(this.readyState!==1)return;this.readyState=2;const text=Buffer.from(reason).subarray(0,123),b=Buffer.alloc(2+text.length);b.writeUInt16BE(code);text.copy(b,2);this.socket.end(frame(8,b));const timer=setTimeout(()=>this.socket.destroy(),600);timer.unref();}
 terminate(){this.readyState=3;this.socket.destroy();}
 fail(code=1002){this.close(code,'Invalid frame');}
 feed(chunk){
  if(this.readyState!==1)return;if(this.buf.length+chunk.length>Math.max(65536,this.max*16))return this.close(1009,'Buffer limit');this.buf=Buffer.concat([this.buf,chunk]);
  while(this.buf.length>=2&&this.readyState===1){const a=this.buf[0],b=this.buf[1],fin=!!(a&128),op=a&15,masked=!!(b&128);let n=b&127,off=2;
   if(a&112||!masked||![0,1,2,8,9,10].includes(op))return this.fail();
   if(n===126){if(this.buf.length<4)return;n=this.buf.readUInt16BE(2);off=4;if(n<126)return this.fail();}
   else if(n===127){if(this.buf.length<10)return;const big=this.buf.readBigUInt64BE(2);if(big>BigInt(this.max))return this.close(1009,'Payload limit');n=Number(big);off=10;if(n<65536)return this.fail();}
   if(op>=8&&(!fin||n>125))return this.fail();if(n>this.max||this.fragmentBytes+n>this.max)return this.close(1009,'Payload limit');if(this.buf.length<off+4+n)return;
   const key=this.buf.subarray(off,off+4),data=Buffer.from(this.buf.subarray(off+4,off+4+n));for(let i=0;i<n;i++)data[i]^=key[i%4];this.buf=this.buf.subarray(off+4+n);
   if(op===8){if(n===1)return this.fail();this.close();return;}if(op===9){this.socket.write(frame(10,data));continue;}if(op===10){this.emit('pong',data);continue;}
   if(op===0){if(!this.fragmentOp)return this.fail();this.fragments.push(data);this.fragmentBytes+=n;}else{if(this.fragmentOp)return this.fail();this.fragmentOp=op;this.fragments=[data];this.fragmentBytes=n;}
   if(fin){const payload=Buffer.concat(this.fragments),binary=this.fragmentOp===2;this.fragments=[];this.fragmentBytes=0;this.fragmentOp=0;if(!binary){try{new TextDecoder('utf-8',{fatal:true}).decode(payload);}catch{return this.close(1007,'Invalid UTF-8');}}this.emit('message',payload,binary);}
  }
 }
}
class WebSocketServer extends EventEmitter {
 constructor({server,path='/ws',maxPayload=4096}){super();this.clients=new Set();server.on('upgrade',(req,socket,head)=>{let url;try{url=new URL(req.url,'http://localhost');}catch{socket.destroy();return;}if(url.pathname!==path){socket.destroy();return;}const key=req.headers['sec-websocket-key'];if(req.headers['sec-websocket-version']!=='13'||typeof key!=='string'||Buffer.from(key,'base64').length!==16||String(req.headers.upgrade).toLowerCase()!=='websocket'){socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');return;}const accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');const ws=new Socket(socket,head,maxPayload);this.clients.add(ws);ws.once('close',()=>this.clients.delete(ws));this.emit('connection',ws,req);});}
 close(){for(const ws of this.clients)ws.terminate();}
}
module.exports={WebSocketServer};
