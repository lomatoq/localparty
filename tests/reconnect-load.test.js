'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const WebSocket=require('ws');

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function until(check,message,timeout=8000){
 const end=Date.now()+timeout;
 while(Date.now()<end){const value=check();if(value)return value;await delay(20);}
 throw new Error(message);
}

test('eight phones keep one identity through reconnect and socket replacement',async t=>{
 const child=spawn(process.execPath,['server.js'],{
  env:{...process.env,PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_EPHEMERAL:'1'},
  stdio:['ignore','pipe','pipe']
 });
 let logs='';const sockets=[];
 child.stdout.on('data',chunk=>{logs+=chunk;});child.stderr.on('data',chunk=>{logs+=chunk;});
 t.after(()=>{for(const socket of sockets)socket.terminate();child.kill();});

 const port=await until(()=>Number(logs.match(/localhost:(\d+)/)?.[1])||0,'server did not start');
 async function connect(){
  const socket=new WebSocket(`ws://127.0.0.1:${port}/lobby`);socket.messages=[];sockets.push(socket);
  socket.on('message',raw=>socket.messages.push(JSON.parse(raw)));
  await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});
  return socket;
 }
 async function message(socket,type){return until(()=>socket.messages.find(item=>item.type===type),`missing ${type}: ${logs.slice(-500)}`);}
 const send=(socket,value)=>socket.send(JSON.stringify(value));

 const phones=[];
 const avatar='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
 for(let index=0;index<8;index++){
  const socket=await connect(),clientId=`phone-${index}`;send(socket,{type:'join',name:`Игрок ${index+1}`,clientId,...(index===0?{avatar}:{})});
  const profile=await message(socket,'joined');phones.push({socket,clientId,profile});
 }
 const fullState=await until(()=>phones.at(-1).socket.messages.find(item=>item.type==='state'&&item.players.length===8),'eight players never converged');
 assert.match(fullState.players[0].avatar,/^\/api\/avatar\/[a-f0-9]{16}\?v=\d+$/);assert.ok(!JSON.stringify(fullState).includes('data:image'));
 const image=await fetch(`http://127.0.0.1:${port}${fullState.players[0].avatar}`);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');

 // All phones resume together. Every replacement must keep the same player id and close
 // the stale transport with a deterministic code so it cannot reconnect and steal it back.
 const replacements=await Promise.all(phones.map(async phone=>{
  const close=new Promise(resolve=>phone.socket.once('close',(code)=>resolve(code)));
  const socket=await connect();send(socket,{...phone.profile,type:'join',clientId:phone.clientId});
  const profile=await message(socket,'joined');
  assert.equal(profile.id,phone.profile.id);assert.equal(await close,4001);
  return {...phone,socket,profile};
 }));
 await until(()=>replacements[0].socket.messages.some(item=>item.type==='state'&&item.players.length===8),'reconnect storm changed roster size');

 // Simulate Safari retaining the installation id while losing/corrupting the player token.
 const original=replacements[0],close=new Promise(resolve=>original.socket.once('close',code=>resolve(code))),recovered=await connect();
 send(recovered,{type:'join',token:'stale-token',id:original.profile.id,recoverId:original.profile.id,name:original.profile.name,hand:original.profile.hand,clientId:original.clientId});
 const recoveredProfile=await message(recovered,'joined');
 assert.equal(recoveredProfile.id,original.profile.id);assert.equal(recoveredProfile.token,original.profile.token);assert.equal(await close,4001);

 const stranger=await connect();send(stranger,{type:'join',name:original.profile.name,clientId:'different-phone'});
 const error=await message(stranger,'error');assert.match(error.message,/имя уже занято/i);
});
