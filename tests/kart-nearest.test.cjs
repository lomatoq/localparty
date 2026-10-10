'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),track=require('../games/kart/static/track');
function reference(x,y){let s=0,best=null;for(let i=0;i<track.points.length;i++){const a=track.points[i],b=track.points[(i+1)%track.points.length],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(len*len))),px=a.x+t*dx,py=a.y+t*dy,distance=Math.hypot(x-px,y-py);if(!best||distance<best.distance)best={x:px,y:py,distance,s:s+t*len,angle:Math.atan2(dy,dx)};s+=len;}return best;}
test('Kart nearest pruning is equivalent to complete search across track, collisions and far-away resets',()=>{
 let seed=713;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);
 const points=[...track.points,...Array.from({length:10000},()=>({x:random()*3200-800,y:random()*1800-450}))];
 for(const {x,y} of points)assert.deepEqual(track.nearest(x,y),reference(x,y));
});
