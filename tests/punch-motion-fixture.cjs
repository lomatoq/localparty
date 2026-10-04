'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
// Run the actual controller listener with platform-only mocks. No scoring copy.
const source=fs.readFileSync(path.join(__dirname,'../games/arcade/public/app.js'),'utf8');
const handler=source.slice(source.indexOf(' // Motion permission'),source.indexOf(' function charge()'));
function setup({secure=true,supported=true,permission='granted',sense='soft'}={}){
 const nodes={motion:{hidden:false,disabled:false,textContent:'Датчик',after(node){nodes[node.id]=node;}},punchReady:{textContent:''}},listeners={},sent=[];
 let timer,clock=5000;
 const DeviceMotionEvent=supported?{requestPermission:async()=>permission}:undefined;
 const context={$:id=>nodes[id],document:{createElement:()=>({style:{},setAttribute(){}})},window:{isSecureContext:secure,DeviceMotionEvent,localStorage:{getItem:()=>sense},addEventListener:(type,fn)=>listeners[type]=fn,removeEventListener:type=>delete listeners[type]},DeviceMotionEvent,performance:{now:()=>(clock+=50)},setTimeout:fn=>(timer=fn,1),clearTimeout:()=>{},send:(type,data)=>sent.push({type,data}),arcadeCopy:ru=>ru,update:()=>{},id:'p1',state:{mode:'punchmeter',phase:'playing',punchTurn:'p1'},motionEnabled:false,motionPeak:0,lastMotion:0,punchReady:false,punchArmed:false,punchTurnSince:0,punchStillSince:0};
 vm.createContext(context);vm.runInContext(handler,context);
 const event=x=>({acceleration:{x,y:0,z:0}});
 const arm=(makeEvent=event)=>{context.punchReady=true;context.punchArmed=false;context.punchTurnSince=clock;context.punchStillSince=0;for(let i=0;i<32;i++)listeners.devicemotion(makeEvent(0));};
 return{context,nodes,listeners,sent,event,arm,timeout:()=>timer()};
}
module.exports={setup};
