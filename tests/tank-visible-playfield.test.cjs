'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createRequire}=require('node:module'),{EventEmitter}=require('node:events');
const bounds=require('../lib/tv-playfield-bounds');

function engine(name){
 const file=require.resolve('../games/'+name+'/server'),localRequire=createRequire(file),ticks=[];
 const runtime={now:Date.now,setInterval:fn=>ticks.push(fn),allowMessage:()=>true,onPause(){},host(){},presence(){},identify:data=>data.partyId?{id:data.partyId,name:data.partyId}:null,report(){}};
 const express=()=>({get(){},use(){}});express.static=()=>{};
 class MockWebSocketServer extends EventEmitter{constructor(){super();this.clients=new Set();}}
 const context=vm.createContext({require:module=>module==='../../lib/party-runtime'?runtime:module==='http'?{createServer:()=>({on(){},listen(){}})}:module==='express'?express:module==='ws'?{WebSocketServer:MockWebSocketServer}:localRequire(module),__dirname:path.dirname(file),process:{env:{},hrtime:process.hrtime},console,Buffer,URL,Date,Math,setInterval(){},assert,EventEmitter,ticks});
 vm.runInContext(fs.readFileSync(file,'utf8'),context);
 return {run:source=>vm.runInContext(source,context)};
}

test('uniform camera inverses protect the actual cap at both TV sizes',()=>{
 for(const scale of [1,1.5]){
  const world={width:1280,height:720};
  const rect=bounds.projectRect({left:340*scale,top:0,width:600*scale,height:125*scale},{left:0,top:0,scale},world);
  assert.deepEqual(rect,{x:340,y:0,w:600,h:125});
  const layout=bounds.normalizeLayout({...world,exclusions:[rect]},{width:1280,baseHeight:720});
  const point=bounds.recover({x:640,y:65},57,layout);
  assert(bounds.fits(point,57,layout));assert.equal(point.y,182);
 }
 assert.equal(bounds.normalizeLayout({width:1280,height:720,exclusions:[{x:NaN,y:0,w:600,h:120}]},{width:1280,baseHeight:720}),null);
});

test('Local Tanks human and bot hulls cannot enter measured cap; resize and respawn stay legal',()=>{
 const game=engine('tanks');game.run(`
 const host={trustedHost:true,data:{},send(){}};
 handleMessage(host,{type:'registerHost'});
 const client={id:'phone',data:{},send(){}};handleMessage(client,{type:'join',data:{partyId:'alex'}});
 const human=players.get(client.data.playerId);human.x=640;human.y=65;
 const bot=createBot('guard',640,65,100);
 assert(updateTVBounds(host,{sequence:1,width:1280,height:720,exclusions:[{x:340,y:0,w:600,h:125}]}));
 for(let i=0;i<1000;i++){
  moveEntity(human,0,-3);moveEntity(bot,0,-3);
  for(const actor of [human,bot])assert(tvPlayfield.fits(actor,tankEnvelope(actor),tvLayout,(x,y)=>blockedAt(x,y,actor.radius)));
 }
 assert(updateTVBounds(host,{sequence:2,width:1280,height:720,exclusions:[{x:300,y:0,w:680,h:190}]}));
 game.mode='survival';spawnFor(human,3);
 for(const actor of [human,bot])assert(tvPlayfield.fits(actor,tankEnvelope(actor),tvLayout,(x,y)=>blockedAt(x,y,actor.radius)));
 // Movement outside the exclusion retains the existing180-unit speed.
 human.x=100;human.y=300;moveEntity(human,3,0);assert.equal(human.x,103);
 `);
});

test('Local Tanks bounds reject nonhost, invalid, stale and replaced-host packets',()=>{
 const game=engine('tanks');game.run(`
 const old={trustedHost:true,data:{},send(){}},next={trustedHost:true,data:{},send(){}},phone={trustedHost:false,data:{},send(){}};
 handleMessage(old,{type:'registerHost'});const data={sequence:3,width:1280,height:720,exclusions:[{x:340,y:0,w:600,h:125}]};
 assert(updateTVBounds(old,data));const saved=JSON.stringify(tvLayout);
 assert(!updateTVBounds(phone,{...data,sequence:4}));assert(!updateTVBounds(old,data));
 assert(!updateTVBounds(old,{...data,sequence:4,exclusions:[{x:Infinity,y:0,w:10,h:10}]}));assert.equal(JSON.stringify(tvLayout),saved);
 handleMessage(next,{type:'registerHost'});handleMessage(old,{type:'registerHost'});assert(!updateTVBounds(old,{...data,sequence:5}));assert(updateTVBounds(next,{...data,sequence:0}));
 `);
});

test('Arsenal expands authoritative height uniformly and shields stay clear through movement and shrink',()=>{
 const game=engine('tankarena');game.run(`
 function hostSocket(){const socket=new EventEmitter();socket.readyState=1;socket.send=()=>{};wss.emit('connection',socket,{socket:{remoteAddress:'127.0.0.1'}});socket.emit('message',JSON.stringify({type:'host'}));return socket;}
 const host=hostSocket();
 assert(updateTVBounds(host,{sequence:1,width:1200,height:1200*720/892,exclusions:[{x:1120,y:0,w:80,h:1200}]}));
 assert.equal(H,1200*720/892);const tank={x:600,y:900,hp:100,dead:0,shield:2};players.set('p',tank);recoverArsenal(tank);
 assert(tank.y>720); // Surplus receiver height is now playable, not an apron.
 for(let i=0;i<1000;i++){moveArsenalTank(tank,3,3);assert(tvPlayfield.fits(tank,52,tvLayout));}
 assert(tank.x<=1068);assert(tank.y<=H-52);
 assert(updateTVBounds(host,{sequence:2,width:1200,height:868,exclusions:[{x:1100,y:0,w:100,h:1000}]}));assert(tvPlayfield.fits(tank,52,tvLayout));
 spawn(tank);assert(tvPlayfield.fits(tank,52,tvLayout));
  tank.x=500;tank.y=400;moveArsenalTank(tank,190/60,0);assert(Math.abs(tank.x-500-190/60)<1e-9);
 bullets.push({x:200,y:1000});assert(updateTVBounds(host,{sequence:3,width:1200,height:720,exclusions:[]}));assert.equal(bullets.length,0);
 `);
});

test('Arsenal rejects nonhost, invalid, stale and old-host updates; reconnect preserves safe arena',()=>{
 const game=engine('tankarena');game.run(`
 function socket(ip){const ws=new EventEmitter();ws.readyState=1;ws.send=()=>{};wss.emit('connection',ws,{socket:{remoteAddress:ip}});ws.emit('message',JSON.stringify({type:'host'}));return ws;}
 const old=socket('127.0.0.1'),phone=socket('192.168.1.4'),packet={sequence:2,width:1200,height:950,exclusions:[]};
 assert(updateTVBounds(old,packet));assert(!updateTVBounds(phone,{...packet,sequence:3}));assert(!updateTVBounds(old,packet));
 assert(!updateTVBounds(old,{...packet,sequence:3,height:NaN}));assert.equal(H,950);
 const fresh=socket('127.0.0.1');old.emit('message',JSON.stringify({type:'host'}));assert(!updateTVBounds(old,{...packet,sequence:4}));assert(updateTVBounds(fresh,{...packet,sequence:0}));assert.equal(H,950);
 `);
});

test('paused geometry publishes recovered authoritative positions without a game tick',()=>{
 engine('tanks').run(`
 runtime.paused=true;const received=[];
 const host={trustedHost:true,data:{},send(type,data){if(type==='state')received.push(data);},sendEncoded(type,packet){this.send(type,JSON.parse(packet).data);}};
 clients.add(host);handleMessage(host,{type:'registerHost'});
 const client={id:'paused-phone',data:{},send(){}};handleMessage(client,{type:'join',data:{partyId:'paused-human'}});
 const p=players.get(client.data.playerId);p.x=640;p.y=130;received.length=0;
 assert(updateTVBounds(host,{sequence:0,width:1280,height:720,exclusions:[{x:340,y:0,w:600,h:190}]}));
 assert.equal(received.length,1);assert.equal(received[0].playfield.exclusions[0].h,190);
 assert(tvPlayfield.fits(p,tankEnvelope(p),received[0].playfield,(x,y)=>blockedAt(x,y,p.radius)));
 `);
 engine('tankarena').run(`
 runtime.paused=true;const received=[],host=new EventEmitter();host.readyState=1;host.send=raw=>received.push(JSON.parse(raw));
 wss.clients.add(host);wss.emit('connection',host,{socket:{remoteAddress:'127.0.0.1'}});host.emit('message',JSON.stringify({type:'host'}));
 const p={x:600,y:900,dead:0};players.set('paused',p);
 assert(updateTVBounds(host,{sequence:0,width:1200,height:868,exclusions:[]}));
 assert.equal(received.length,1);assert.equal(received[0].data.H,868);
 assert(tvPlayfield.fits(received[0].data.players[0],52,received[0].data.playfield));
 `);
});
