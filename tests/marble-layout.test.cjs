'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {PATHS}=require('../games/arcade_deluxe/core/marbles.cjs');
const Layout=require('../games/arcade_deluxe/public/marble-layout.js');
test('all six authored tracks, entrance balls and gate petals fit without side clipping',()=>{
 for(const path of PATHS)for(const rect of [{x:16,y:48,w:1248,h:454},...Layout.boards(3,1280,592).map(r=>({x:r.x+8,y:r.y+36,w:r.w-16,h:r.h-44}))]){
  const v=Layout.fit({path},rect);
  for(const p of path){const x=v.x+p.x*v.scale,y=v.y+p.y*v.scale,r=34*v.scale;assert(x-r>=rect.x-1e-7&&x+r<=rect.x+rect.w+1e-7);assert(y-r>=rect.y-1e-7&&y+r<=rect.y+rect.h+1e-7);}
  for(const p of [path[0],{x:0,y:0},{x:1280,y:720}]){const q=Layout.inverse(v,v.x+p.x*v.scale,v.y+p.y*v.scale);assert(Math.abs(q.x-p.x)<1e-7&&Math.abs(q.y-p.y)<1e-7);}
 }
});
test('versus frames leave space for the TV protrusion, separate headers, and stay within the stage',()=>{
 for(const n of [2,3]){const frames=Layout.boards(n,1280,592);assert.equal(frames.length,n);for(const r of frames){assert(r.y>=48&&r.y+r.h<=576);assert(r.x>=16&&r.x+r.w<=1264);}assert.equal(frames[0].y,frames[1].y);assert.equal(frames[0].h,frames[1].h);if(n===3){assert(frames[2].y>frames[0].y+frames[0].h);assert.equal(frames[2].w,frames[0].w);}}
});
