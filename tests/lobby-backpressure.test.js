'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('reconnect acknowledgements survive a snapshot backlog',()=>{
 const source=fs.readFileSync(require.resolve('../server'),'utf8'),sent=[];
 const start=source.indexOf('function send(ws, data)'),end=source.indexOf('\nfunction eligible',start);
 const ctx={WebSocket:{OPEN:1}};vm.runInNewContext(source.slice(start,end)+';this.deliver=send;',ctx);
 const ws={readyState:1,bufferedAmount:300*1024,send:raw=>sent.push(JSON.parse(raw))};
 ctx.deliver(ws,{type:'state'});ctx.deliver(ws,{type:'game-ui'});assert.equal(sent.length,0);
 for(const type of ['joined','profile-required','error','replaced'])ctx.deliver(ws,{type});
 assert.deepEqual(sent.map(m=>m.type),['joined','profile-required','error','replaced']);
});
for(const game of ['bow_club','arcade_deluxe','sports_siege'])test(`${game}: congestion never drops join/shot acknowledgements`,()=>{
 const source=fs.readFileSync(require.resolve(`../games/${game}/server`),'utf8');
 const line=source.split('\n').find(line=>line.startsWith('function send(ws,type,data)')||line.startsWith('const send=(ws,type,data)'));
 const ctx={},sent=[];vm.runInNewContext(line+';this.deliver=send;',ctx);
 const ws={readyState:1,bufferedAmount:600*1024,send:raw=>sent.push(JSON.parse(raw))};
 ctx.deliver(ws,'state',{});assert.equal(sent.length,0);
 for(const type of ['joined','shot-result','draw-result','error'])ctx.deliver(ws,type,{ok:true});
 assert.deepEqual(sent.map(m=>m.type),['joined','shot-result','draw-result','error']);
});
