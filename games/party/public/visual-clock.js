(function(root){
  'use strict';
  const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  class VisualClock {
    constructor(delay=50){this.delay=delay;this.frames=[];this.key='';}
    push(state,now){
      const key=state.game.mode+':'+state.game.round+':'+state.game.status;
      if(key!==this.key){this.frames=[];this.key=key;}
      const t=state.visualTime??now;
      if(this.frames.at(-1)?.t===t)return;
      this.frames.push({state,t,arrival:now});
      if(this.frames.length>8)this.frames.shift();
    }
    sample(now){
      const frames=this.frames,last=frames.at(-1);if(!last)return null;
      const time=Math.min(last.t,last.t+Math.max(0,now-last.arrival)-this.delay);
      let a=frames[0],b=a;
      for(const f of frames){if(f.t<=time)a=f;if(f.t>=time){b=f;break;}b=f;}
      const q=b.t===a.t?0:Math.max(0,Math.min(1,(time-a.t)/(b.t-a.t)));
      const mix=(x,y)=>x+(y-x)*q;
      const interpolate=(old,list)=>{const lookup=new Map(list.map(p=>[p.id,p]));return old.map(p=>{const next=lookup.get(p.id);if(!next)return p;return {...p,x:mix(p.x,next.x),y:mix(p.y,next.y)};});};
      return {...a.state,visualTime:Math.max(frames[0].t,time),
        players:interpolate(a.state.players,b.state.players),
        flying:interpolate(a.state.flying||[],b.state.flying||[]),
        drum:{...a.state.drum,angle:a.state.drum.angle+angleDelta(a.state.drum.angle,b.state.drum.angle)*q},
        game:{...a.state.game,arenaRadius:mix(a.state.game.arenaRadius,b.state.game.arenaRadius)},
        visualEvents:b.state.visualEvents||[]};
    }
  }
  if(typeof module==='object'&&module.exports)module.exports={VisualClock,angleDelta};else root.PartyVisualClock=VisualClock;
})(typeof window==='object'?window:globalThis);
