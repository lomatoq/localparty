'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {createSnapshotSender}=require('../lib/snapshot-sender');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
class Socket extends EventEmitter {
  constructor(){super();this.readyState=1;this.bufferedAmount=0;this.messages=[];}
  send(text){this.messages.push(JSON.parse(text));}
  close(code){this.code=code;this.readyState=3;this.emit('close');}
}
test('slow receiver retains only newest snapshot and drains without a new game tick',async()=>{
  const sender=createSnapshotSender({softLimit:100,hardLimit:1000,retryMs:5}),slow=new Socket(),fast=new Socket();
  slow.bufferedAmount=150;
  for(let seq=0;seq<100;seq++){const packet=JSON.stringify({seq});sender.snapshot(slow,packet);sender.snapshot(fast,packet);}
  assert.equal(slow.messages.length,0);assert.equal(fast.messages.length,100);
  slow.bufferedAmount=0;await wait(30);
  assert.deepEqual(slow.messages,[{seq:99}]);slow.close();fast.close();
});
test('private snapshots are isolated and unchanged delivery does not repeat',async()=>{
  const sender=createSnapshotSender({softLimit:100,retryMs:5}),a=new Socket(),b=new Socket();
  sender.snapshot(a,JSON.stringify({secret:'A'}),'private',true);
  sender.snapshot(b,JSON.stringify({secret:'B'}),'private',true);
  sender.snapshot(a,JSON.stringify({secret:'A'}),'private',true);
  a.bufferedAmount=200;sender.snapshot(a,JSON.stringify({secret:'new'}),'private',true);
  sender.snapshot(a,JSON.stringify({secret:'A'}),'private',true);
  a.bufferedAmount=0;await wait(30);
  assert.deepEqual(a.messages,[{secret:'A'}]);assert.deepEqual(b.messages,[{secret:'B'}]);a.close();b.close();
});
test('acknowledgements survive soft backlog; hard backlog disconnects for resync',()=>{
  const sender=createSnapshotSender({softLimit:100,hardLimit:1000}),ws=new Socket();
  ws.bufferedAmount=150;assert(sender.event(ws,{type:'joined',id:'one'}));
  assert.equal(ws.messages[0].type,'joined');ws.bufferedAmount=1001;
  assert.equal(sender.event(ws,{type:'stroke'}),false);assert.equal(ws.code,1013);
  assert.equal(ws.messages.length,1);
});
test('pending channels are removed on close and never written afterward',async()=>{
  const sender=createSnapshotSender({softLimit:100,retryMs:5}),ws=new Socket();ws.bufferedAmount=150;
  sender.snapshot(ws,'{"seq":1}');sender.snapshot(ws,'{"turn":2}','private');ws.close();ws.bufferedAmount=0;
  await wait(25);assert.deepEqual(ws.messages,[]);
});
