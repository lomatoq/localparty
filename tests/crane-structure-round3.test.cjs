'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {initialize,TowerPhysics,HEIGHT,SCALE}=require('../games/crane/physics');
const wind=t=>140*Math.sin(t*1.78)+55*Math.sin(t*.63+1.2);
test('18 centred real drops settle on a moving compliant tower; wind bends real collision bodies',async()=>{
 await initialize();const p=new TowerPhysics(),settled=[];let time=0;try{
  for(let i=0;i<18;i++){const top=p.top(settled),b=p.add(top.x,top.y-HEIGHT/2-230);let quiet=0;
   for(let k=0;k<2400;k++){time+=1/120;assert.equal(p.driveStructure(settled,wind(time)),false,'no wind-only joint break');p.step();quiet=p.quiet(b)?quiet+1:0;if(quiet>=42)break;}
   assert(quiet>=42,'floor '+(i+1)+' settles relative to its moving support');assert(p.connect(b,settled),'centred landing gets a structural seam');settled.push(b);
  }
  const samples=[];for(let i=0;i<2400;i++){time+=1/120;assert.equal(p.driveStructure(settled,wind(time)),false);p.step();if(i%12===0)samples.push(settled.map(b=>p.public(b)));}
  const angles=samples.map(s=>s.at(-1).angle),x=samples.map(s=>s.at(-1).x);console.log('STRUCTURE_METRICS', {angleRange:Math.max(...angles)-Math.min(...angles),topRange:Math.max(...x)-Math.min(...x),last:samples.at(-1).slice(0,4),connections:p.connections.length});assert(Math.max(...angles)-Math.min(...angles)>.025,'physical upper-floor sway is visible');assert(Math.max(...x)-Math.min(...x)>12,'real top position follows the wind');assert(Math.max(...samples.flatMap(s=>s.map(b=>Math.abs(b.angle))))<.85,'stable tower stays below collapse angle');
  for(const c of p.connections){const a=c.parent.translation(),b=c.block.body.translation(),u=c.joint.anchor1(),v=c.joint.anchor2(),ra=c.parent.rotation(),rb=c.block.body.rotation();const x1=a.x+Math.cos(ra)*u.x-Math.sin(ra)*u.y,y1=a.y+Math.sin(ra)*u.x+Math.cos(ra)*u.y,x2=b.x+Math.cos(rb)*v.x-Math.sin(rb)*v.y,y2=b.y+Math.sin(rb)*v.x+Math.cos(rb)*v.y;assert(Math.hypot(x1-x2,y1-y2)*SCALE<1,'seam endpoints remain connected');}
  console.log('18F_STRUCTURE',JSON.stringify({floors:settled.length,topRange:Math.max(...x)-Math.min(...x),angleRange:Math.max(...angles)-Math.min(...angles),maxAngle:Math.max(...samples.flatMap(s=>s.map(b=>Math.abs(b.angle))))}));p.releaseConnections();assert.equal(p.connections.length,0);assert(settled.every(b=>!b.connection),'collapse releases every seam');
 }finally{p.free();}
});
test('weak edge landing is not bonded; excessive joint deflection breaks the structure',async()=>{
 await initialize();const p=new TowerPhysics();try{const base=p.add(550,725);for(let i=0;i<240;i++)p.step();assert(p.connect(base,[]));const edge=p.add(600,615);assert.equal(p.connect(edge,[base]),false,'less than70% overlap stays ordinary physics');base.body.setRotation(.3,true);assert.equal(p.driveStructure([base],0),true,'large physical deflection breaks seam');assert.equal(p.connections.length,0);}finally{p.free();}
});
