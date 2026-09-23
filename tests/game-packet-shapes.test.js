'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),WS=require('ws'),path=require('node:path');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
for(const engine of ['arcade','tankarena','jenga','crane','kart','chaos','western_duel'])test(`${engine} ignores invalid packet shapes without losing the game process`,{timeout:15000},async t=>{
 const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'../games',engine),env:{...process.env,PORT:'0',PARTY_MANAGED:'0',PARTY_GAME_ID:engine==='arcade'?'taprace':engine}});let log='',port,ws;
 child.stdout.on('data',d=>{log+=d;port=log.match(/(?:localhost|127\.0\.0\.1):(\d+)/)?.[1]||log.match(/Western Duel :(\d+)/)?.[1];});child.stderr.on('data',d=>log+=d);
 t.after(()=>{ws?.terminate();child.kill();});
 for(let i=0;i<150&&!port;i++)await delay(40);assert(port,log);
 ws=new WS('ws://127.0.0.1:'+port+'/ws');ws.on('error',()=>{});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});
 for(const raw of ['{','null','true','42','"hello"','[]','[null]',JSON.stringify({type:'unknown',data:null})])ws.send(raw);
 // WebSocket pong is handled after the preceding frames. An uncaught parser
 // exception closes this connection/worker instead of acknowledging the ping.
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('No pong: '+log)),2000);ws.once('pong',()=>{clearTimeout(timer);resolve();});ws.once('close',()=>{clearTimeout(timer);reject(Error('Worker lost after invalid packet: '+log));});ws.ping();});
 assert.equal(child.exitCode,null,log);
});
