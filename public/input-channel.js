/* Continuous controls share one latest-value slot; actions retain their order. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PartyInputChannel=api;})(typeof globalThis==='object'?globalThis:this,()=>{
 function create(socket,write,{interval=1000/30,keepalive=180,now=()=>performance.now()}={}){
  let pending=null,timer=null,last=-Infinity,previous=null,blockedAt=null,lastRaw=null;
  const clear=()=>{clearTimeout(timer);timer=null;pending=null;previous=null;blockedAt=null;lastRaw=null;last=-Infinity;};
  socket.addEventListener('close',clear);
  function flush(){
   timer=null;if(socket.readyState!==1){clear();return;}
   if(!pending)return;
   const time=now();
   if(socket.bufferedAmount>=16384){
    blockedAt??=time;if(time-blockedAt>=2000){clear();socket.close(4008,'Input backlog');return;}
    timer=setTimeout(flush,interval);return;
   }
   blockedAt=null;const item=pending;pending=null;
   if(time-item.at<=250&&(item.raw!==lastRaw||time-last>=keepalive)){write(item.raw);last=time;lastRaw=item.raw;}
  }
  return {send(raw,m){
   const d=m.data||m;
   const continuous=(m.type==='joystick'||m.type==='input')&&!d.action&&!d.state&&
     ['x','y','jx','jy','steer','throttle'].some(k=>typeof d[k]==='number');
   if(!continuous)return false;
   const neutral=['x','y','jx','jy','steer','throttle'].every(k=>!d[k]);
   const buttons=[d.fire,d.sweep,d.throttle,d.boost,d.brake,d.grab,neutral];
   const edge=!previous||buttons.some((v,i)=>v!==previous[i]);previous=buttons;
   pending={raw,at:now()};
   if(edge||now()-last>=interval){clearTimeout(timer);flush();}
   else if(!timer)timer=setTimeout(flush,Math.max(0,interval-(now()-last)));
   return true;
  },clear};
 }
 return {create};
});
