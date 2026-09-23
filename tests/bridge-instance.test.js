'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');

test('a retiring game bridge never labels delayed socket events with the next match instance',()=>{
 const source=fs.readFileSync(require.resolve('../public/bridge.js'),'utf8');
 const messages=[],events=new Map();
 const parent={PARTY_INSTANCE:'old-match',PARTY_PROFILE:{id:'player-1',name:'Test',token:'test-token'},postMessage:m=>messages.push(m)};
 class Storage{getItem(){return null;}setItem(){}removeItem(){}}
 class Socket{constructor(url){this.url=url;this.readyState=1;this.listeners=new Map();}addEventListener(type,fn){this.listeners.set(type,fn);}send(){}emit(type,event={}){this.listeners.get(type)?.(event);}}
 const root={dataset:{},style:{setProperty(){}},classList:{add(){},toggle(){},remove(){}}};
 const document={currentScript:{dataset:{prefix:'/games/push'}},documentElement:root,head:{append(){}},addEventListener(){}};
 const context={document,parent,innerHeight:800,location:{href:'http://party.test/games/push/',host:'party.test',origin:'http://party.test'},Storage,localStorage:new Storage(),WebSocket:Socket,fetch:()=>Promise.resolve(),Request,URL,Event,dispatchEvent:e=>events.get(e.type)?.(e),Element:class{},addEventListener:(type,fn)=>events.set(type,fn),setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:()=>0,Date,Set,Promise};context.window=context;
 vm.runInNewContext(source.slice(0,source.indexOf("\ndocument.addEventListener('DOMContentLoaded'")),context);
 const socket=new context.WebSocket('ws://party.test/ws');
 parent.PARTY_INSTANCE='next-match';
 socket.emit('open');socket.emit('message',{data:JSON.stringify({type:'joined'})});socket.emit('close');
 assert.equal(messages.length,3);
 assert.deepEqual(messages.map(m=>m.instance),['old-match','old-match','old-match']);
 assert.deepEqual(messages.map(m=>m.status),['connecting','ready','connecting']);
});
