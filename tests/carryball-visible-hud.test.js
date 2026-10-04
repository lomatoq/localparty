'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Arcade}=require('../games/arcade/simulation');
const {CarryHudReceiver}=require('../games/arcade/carryball-hud');
const {projectRect,overlaps}=require('../lib/tv-playfield-bounds');
function game(){const g=new Arcade('carryball',()=>.5);g.join('human','Human');g.join('bot','Bot');g.start();return g;}

test('measured cap projection keeps moving human and bot runner envelopes visible at both TV sizes',()=>{
 for(const [width,height]of [[1280,720],[1920,1080]]){
  const g=game(),scale=Math.min(width/1200,height/720),projection={left:(width-1200*scale)/2,top:(height-720*scale)/2,scale};
  const cap={left:(width-560*(height/720))/2,top:0,width:560*(height/720),height:96*(height/720)};
  const measured={left:cap.left-2,top:cap.top-2,width:cap.width+4,height:cap.height+4};
  const rect=projectRect(measured,projection,{width:1200,height:720}),receiver=new CarryHudReceiver(g),host={};
  receiver.registerHost(host,true);assert(receiver.receive(host,{sequence:1,width:1200,height:720,exclusions:[rect]}));
  for(const p of g.players)Object.assign(p,{x:600,y:160,vx:0,vy:0});
  for(let step=0;step<240;step++){
   for(const p of g.players)g.input(p.id,{x:0,y:-1});g.tick(1/30);
   for(const p of g.players){assert(!overlaps(p.x,p.y,g.view().actorEnvelope,rect),`${width}: ${p.name} visible on step ${step}`);assert(p.y*scale+projection.top-g.view().actorEnvelope*scale>=cap.height+2-1e-8);}
  }
  assert.equal(g.view().W,1200);assert.equal(g.view().H,720);
  // The scenery/field remain full height; movement beside the actual cap still reaches its original bound.
  const p=g.players[0];Object.assign(p,{x:100,y:80,vx:0,vy:0});for(let step=0;step<60;step++){g.input(p.id,{y:-1});g.tick(1/30);}assert.equal(p.y,20);
 }
});

test('only the active authenticated host can replace finite, sequenced Carry geometry',()=>{
 const g=game(),receiver=new CarryHudReceiver(g),oldHost={},host={},phone={},layout={sequence:1,width:1200,height:720,exclusions:[{x:400,y:0,w:400,h:96}]};
 assert.equal(receiver.registerHost(phone,false),false);assert.equal(receiver.receive(phone,layout),false);
 receiver.registerHost(oldHost,true);assert(receiver.receive(oldHost,layout));const previous=g.visibleHudLayout;
 assert.equal(receiver.receive(oldHost,{...layout,sequence:0}),false);assert.equal(receiver.receive(oldHost,{...layout,sequence:2,exclusions:[{x:NaN,y:0,w:10,h:10}]}),false);
 assert.equal(receiver.receive(oldHost,{...layout,sequence:2,width:10000}),false);assert.equal(g.visibleHudLayout,previous);
 receiver.registerHost(host,true);assert.equal(receiver.registerHost(oldHost,true),false);assert.equal(receiver.receive(oldHost,{...layout,sequence:99,exclusions:[]}),false);assert.equal(receiver.receive(phone,{...layout,sequence:99,exclusions:[]}),false);
 assert(receiver.receive(host,layout));assert.equal(g.visibleHudLayout.height,720);
 Object.assign(g.players[0],{x:600,y:160});assert(receiver.receive(host,{...layout,sequence:2,exclusions:[{x:400,y:0,w:400,h:200}]}));assert(!overlaps(g.players[0].x,g.players[0].y,g.view().actorEnvelope,g.visibleHudLayout.exclusions[0]));
 assert(receiver.registerHost(host,true));assert.equal(receiver.receive(host,{...layout,sequence:1,exclusions:[]}),false,'replayed registration cannot reset sequence');
 g.start();for(const p of g.players)assert(!overlaps(p.x,p.y,g.view().actorEnvelope,g.visibleHudLayout.exclusions[0]));
});

test('Carry cap exclusion leaves outside loose-ball momentum, directional pass and goals unchanged',()=>{
 const plain=game(),bounded=game();bounded.setVisibleHudLayout({width:1200,height:720,exclusions:[{x:400,y:0,w:400,h:96}]});
 for(const g of [plain,bounded])Object.assign(g.ball,{x:100,y:300,vx:130,vy:-200,owner:null,lock:1});
 for(let i=0;i<60;i++){plain.tick(1/30);bounded.tick(1/30);assert.deepEqual(bounded.ball,plain.ball);}
 bounded.ball.owner='human';bounded.input('human',{x:0,y:-1,action:'pass'});assert.equal(bounded.ball.vx,0);assert.equal(bounded.ball.vy,-600);
 Object.assign(bounded.ball,{owner:null,x:1170,y:360,vx:0,vy:0,lock:1});bounded.tick(1/30);assert.equal(bounded.teams[0],1);assert.equal(bounded.ball.x,600);assert.equal(bounded.ball.y,360);
});

test('a loose ball inside a new HUD exclusion is recovered and reflected immediately',()=>{
 const g=game(),rect={x:400,y:0,w:400,h:96};Object.assign(g.ball,{x:600,y:70,vx:120,vy:-200,owner:null,lock:1});
 g.setVisibleHudLayout({width:1200,height:720,exclusions:[rect]});
 assert.equal(g.ball.y,109);assert.equal(g.ball.vx,120);assert.equal(g.ball.vy,130);assert(!overlaps(g.ball.x,g.ball.y,13,rect));
 for(let i=0;i<60;i++){g.tick(1/30);assert(!overlaps(g.ball.x,g.ball.y,13,rect));}
});

test('normal and fast passes bounce at the cap without tunnelling or repeated inward motion',()=>{
 for(const[width,height]of[[1280,720],[1920,1080]])for(const vy of[-600,-8000]){
  const g=game(),scale=height/720,rect=projectRect({left:(width-560*scale)/2,top:0,width:560*scale,height:96*scale},{left:(width-1200*scale)/2,top:0,scale},{width:1200,height:720});
  g.setVisibleHudLayout({width:1200,height:720,exclusions:[rect]});Object.assign(g.ball,{x:600,y:120,vx:90,vy,owner:null,lock:1});g.tick(.05);
  assert(!overlaps(g.ball.x,g.ball.y,13,rect));assert(g.ball.y>=109);assert(g.ball.vy>0);assert.equal(g.teams[0]+g.teams[1],0);
  assert(Math.abs(g.ball.vx-90*Math.exp(-.05*1.15))<1e-8,'tangential momentum preserved');
 }
});

test('a pass crossing an interior HUD box cannot skip it even when its endpoint is clear',()=>{
 const g=game(),rect={x:400,y:240,w:400,h:96};g.setVisibleHudLayout({width:1200,height:720,exclusions:[rect]});
 Object.assign(g.ball,{x:600,y:370,vx:0,vy:-6000,owner:null,lock:1});g.tick(.05);assert(g.ball.y>=349);assert(g.ball.vy>0);assert(!overlaps(g.ball.x,g.ball.y,13,rect));
});

test('rounded cap corners reflect approaching balls and let outgoing balls escape',()=>{
 const g=game(),rect={x:400,y:240,w:400,h:96};g.setVisibleHudLayout({width:1200,height:720,exclusions:[rect]});
 Object.assign(g.ball,{x:390,y:230,vx:100,vy:100,owner:null,lock:1});g.tick(.05);assert(g.ball.vx<0&&g.ball.vy<0);assert(!overlaps(g.ball.x,g.ball.y,13,rect));
 const x=g.ball.x,y=g.ball.y;g.tick(.05);assert(g.ball.x<x&&g.ball.y<y,'outgoing ball is not stuck on a zero-time collision');
});

test('held ball, explicit pass and close player pickup stay accessible along the cap',()=>{
 const g=game(),rect={x:400,y:0,w:400,h:96};g.setVisibleHudLayout({width:1200,height:720,exclusions:[rect]});
 const p=g.players[0];Object.assign(p,{x:600,y:160,vx:0,vy:0});g.ball.owner=p.id;
 for(let i=0;i<60;i++){g.input(p.id,{y:-1});g.tick(1/30);assert.equal(g.ball.owner,p.id);assert(!overlaps(p.x,p.y,44,rect));assert(!overlaps(g.ball.x,g.ball.y,13,rect));}
 g.input(p.id,{y:-1,action:'pass'});assert.equal(g.ball.owner,null);assert.equal(g.ball.vy,-600);g.tick(.05);g.tick(.05);assert(g.ball.vy>0);assert(!overlaps(g.ball.x,g.ball.y,13,rect));
 Object.assign(p,{x:600,y:140,vx:0,vy:0});Object.assign(g.ball,{x:600,y:109,vx:0,vy:0,owner:null,lock:0});g.input(p.id,{x:0,y:0});g.tick(1/30);assert.equal(g.ball.owner,p.id,'player circle can approach and pick up recovered ball');
});

test('both goals and original outer-wall bounce remain intact with the cap',()=>{
 for(const[x,team]of[[30,1],[1170,0]]){const g=game();g.setVisibleHudLayout({width:1200,height:720,exclusions:[{x:400,y:0,w:400,h:96}]});Object.assign(g.ball,{x,y:360,vx:0,vy:0,owner:null,lock:1});g.tick(1/30);assert.equal(g.teams[team],1);assert.equal(g.ball.x,600);assert.equal(g.ball.y,360);}
 const plain=game(),bounded=game();bounded.setVisibleHudLayout({width:1200,height:720,exclusions:[{x:400,y:0,w:400,h:96}]});
 for(const g of[plain,bounded])Object.assign(g.ball,{x:200,y:11,vx:0,vy:-600,owner:null,lock:1});plain.tick(.05);bounded.tick(.05);assert.deepEqual(bounded.ball,plain.ball);assert(bounded.ball.vy>0);
});

test('HUD resize keeps carried possession and tackles still release a visible ball',()=>{
 const g=game(),p=g.players[0],opponent=g.players[1],rect={x:400,y:0,w:400,h:200};
 Object.assign(p,{x:600,y:160,vx:0,vy:0});Object.assign(g.ball,{x:p.x,y:p.y,owner:p.id,lock:0});
 g.setVisibleHudLayout({width:1200,height:720,exclusions:[rect]});g.tick(1/30);
 assert.equal(g.ball.owner,p.id);assert(!overlaps(p.x,p.y,44,rect));assert(!overlaps(g.ball.x,g.ball.y,13,rect));
 Object.assign(opponent,{x:p.x+30,y:p.y,vx:0,vy:0});g.ball.lock=0;g.tick(1/30);
 assert.equal(g.ball.owner,null,'opponent tackle preserves existing possession transfer');assert(g.ball.lock>0);assert(!overlaps(g.ball.x,g.ball.y,13,rect));
});
