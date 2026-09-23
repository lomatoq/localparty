'use strict';
// Average circle chord over the complete column footprint. Sampling just the
// centre loses a radius-1 blast exactly between two 2px columns. Integrating
// also keeps the removed area independent of its sub-column x position.
function circleHalf(r,left,right,dx){
 if(r<=0||left>=r||right<=-r)return 0;
 const primitive=d=>{d=Math.max(-r,Math.min(r,d));return .5*(d*Math.sqrt(Math.max(0,r*r-d*d))+r*r*Math.asin(d/r));};
 return (primitive(right)-primitive(left))/dx;
}
/** Sparse column-solid terrain. Each 2px column is a sorted union of [top,bottom]
 * spans, not a heightmap. Blasts subtract material; unsupported spans fall under
 * gravity and merge on contact. No cellular sand / horizontal diffusion.
 * Original implementation, deliberately using column collapse for artillery.
 */
class ColumnTerrain {
 constructor(width=1280,bottom=680,dx=2){this.width=width;this.bottom=bottom;this.dx=dx;this.columns=Array.from({length:Math.ceil(width/dx)},()=>[]);this.active=new Set();this.revision=0;}
 fromHeights(heights){this.columns=this.columns.map((_,i)=>{const top=Math.min(this.bottom,Math.max(0,heights[i]??500));return [{top,bottom:this.bottom,origin:top,v:0}];});this.active.clear();this.revision++;return this;}
 index(x){return Math.max(0,Math.min(this.columns.length-1,Math.floor(x/this.dx)));}
 surface(x){return this.columns[this.index(x)][0]?.top??this.bottom;}
 solid(x,y){if(x<0||x>=this.width||y<0)return false;if(y>=this.bottom)return true;return this.columns[this.index(x)].some(r=>y>=r.top&&y<r.bottom);}
 volume(){return this.columns.reduce((a,c)=>a+c.reduce((b,r)=>b+r.bottom-r.top,0)*this.dx,0);}
 heightmap(){const h=this.columns.map(c=>c[0]?.top??this.bottom);h.push(h.at(-1));return h;}
 snapshot(){if(this._snapshotRev!==this.revision){this._snapshotRev=this.revision;this._snapshot=this.columns.map(c=>c.flatMap(r=>[Math.round(r.top*10)/10,Math.round(r.bottom*10)/10]));}return this._snapshot;}
 strataSnapshot(){if(this._strataRev!==this.revision){this._strataRev=this.revision;this._strata=this.columns.map(c=>c.map(r=>Math.round((r.origin??r.top)*10)/10));}return this._strata;}
 materialsSnapshot(){if(this._materialsRev!==this.revision){this._materialsRev=this.revision;this._materials=this.columns.map(c=>c.map(r=>r.material||null));}return this._materials;}
 merge(i){const c=this.columns[i].sort((a,b)=>a.top-b.top),out=[];for(const r of c){if(r.bottom-r.top<1e-6)continue;const last=out.at(-1),a=last?.material,b=r.material,same=a===b||a&&b&&a[0]===b[0]&&a[1]===b[1];if(last&&r.top<=last.bottom+1e-6&&!last.layered&&!r.layered&&same){last.bottom=Math.max(last.bottom,r.bottom);last.v=Math.max(last.v||0,r.v||0);}else out.push({...r});}this.columns[i]=out;}
 addSpan(i,top,bottom,material=null){
  // New dirt fills air, not old material: preserve source-coloured strata and
  // avoid overlapping spans/double volume where growing circles intersect.
  let fresh=[{top,bottom,origin:top,v:0,...(material?{material}: {})}];
  for(const old of this.columns[i])fresh=fresh.flatMap(q=>q.bottom<=old.top||q.top>=old.bottom?[q]:[...(q.top<old.top?[{...q,bottom:old.top}]:[]),...(q.bottom>old.bottom?[{...q,top:old.bottom}]:[])]);
  this.columns[i].push(...fresh);this.merge(i);
 }
 layerize(i){
  const c=this.columns[i].sort((a,b)=>a.top-b.top),out=[];
  for(let j=0;j<c.length;j++){
   const r=c[j],below=c[j+1],unsupported=below&&below.top-r.bottom>1e-6;
   if(r.layered||!unsupported||r.bottom-r.top<=3){out.push(r);continue;}
   // Pocket-style cave collapse: split a hanging slab into thin horizontal
   // slices. The lowest slice starts first, then releases the next one above.
   const layers=Math.ceil((r.bottom-r.top)/3),h=(r.bottom-r.top)/layers;
   for(let k=0;k<layers;k++)out.push({top:r.top+k*h,bottom:r.top+(k+1)*h,origin:r.origin??r.top,v:0,delay:(layers-1-k)*.018,layered:true,...(r.material?{material:r.material}: {})});
  }
  this.columns[i]=out;
 }
 hasUnsupported(i){const c=this.columns[i];for(let j=0;j<c.length-1;j++)if(c[j+1].top-c[j].bottom>1e-6)return true;return false;}
 buriedCircle(x,y,r){
  // A shallow impact on a slope can be below the centre column's surface
  // while still open to the sky. Only a closed roof permits cave collapse.
  for(let i=this.index(x-r);i<=this.index(x+r);i++){
   const d=(i+.5)*this.dx-x;if(Math.abs(d)>=r)continue;
   if(y-Math.sqrt(r*r-d*d)<=this.surface((i+.5)*this.dx)+2)return false;
  }
  return true;
 }
 activateUnsupported(x1=0,x2=this.width){
  const lo=this.index(Math.min(x1,x2)),hi=this.index(Math.max(x1,x2));let activated=0;
  for(let i=lo;i<=hi;i++){if(!this.hasUnsupported(i))continue;this.layerize(i);this.active.add(i);activated++;}
  return activated;
 }
 circle(x,y,r,build=false,collapse=true,innerRadius=0,material=null){
  if(![x,y,r].every(Number.isFinite)||r<=0)return 0;
  const before=this.volume(),lo=this.index(x-r),hi=this.index(x+r);
  collapse=collapse&&!build&&this.buriedCircle(x,y,r);
  let changed=false;
  for(let i=lo;i<=hi;i++){
   const left=i*this.dx-x,right=left+this.dx;
   const half=circleHalf(r,left,right,this.dx),a=Math.max(0,y-half),b=Math.min(this.bottom,y+half);if(a>=b)continue;
   const original=this.columns[i];
   if(build){this.columns[i]=[...original];this.addSpan(i,a,b,material);}
   else {
    const inner=circleHalf(innerRadius,left,right,this.dx);
    const cuts=inner>0?[[a,y-inner],[y+inner,b]]:[[a,b]];
    let next=original;
    for(const [start,end] of cuts){if(start>=end)continue;next=next.flatMap(q=>q.bottom<=start||q.top>=end?[q]:[...(q.top<start?[{...q,bottom:start}]:[]),...(q.bottom>end?[{...q,top:end}]:[])]);}
    this.columns[i]=next;
   }
   const out=this.columns[i];if(out.length!==original.length||out.some((v,j)=>v.top!==original[j]?.top||v.bottom!==original[j]?.bottom)){changed=true;if(!build&&collapse&&this.hasUnsupported(i)){this.layerize(i);this.active.add(i);}}
  }
  if(changed)this.revision++;
  return this.volume()-before;
 }
 rect(x1,y1,x2,y2,build=true,material=null){
  if(![x1,y1,x2,y2].every(Number.isFinite))return false;
  const lo=this.index(Math.min(x1,x2)),hi=this.index(Math.max(x1,x2)),a=Math.max(0,Math.min(y1,y2)),b=Math.min(this.bottom,Math.max(y1,y2));if(a>=b)return false;
  for(let i=lo;i<=hi;i++){
   if(build){this.addSpan(i,a,b,material);}
   else this.columns[i]=this.columns[i].flatMap(q=>q.bottom<=a||q.top>=b?[q]:[...(q.top<a?[{...q,bottom:a}]:[]),...(q.bottom>b?[{...q,top:b}]:[])]);
  }
  this.revision++;return true;
 }
 step(dt){
  if(!Number.isFinite(dt)||dt<=0||!this.active.size)return false;dt=Math.min(dt,.05);let moved=false;
  for(const i of [...this.active]){
   const c=this.columns[i];let support=this.bottom,unstable=false;
   for(let j=c.length-1;j>=0;j--){const r=c[j],gap=Math.max(0,support-r.bottom);
    // layerize assigns release times relative to activation, not relative to
    // the instant this slice first loses support. Counting only while a gap
    // exists makes a deep roof wait the sum of all stagger times (quadratic).
    if((r.delay||0)>0)r.delay=Math.max(0,r.delay-dt);
    if(gap>1e-6){if((r.delay||0)>0){unstable=true;}else{r.v=Math.min(220,(r.v||0)+280*dt);const dy=Math.min(gap,r.v*dt);r.origin=(r.origin??r.top)+dy;r.top+=dy;r.bottom+=dy;moved=moved||dy>0;if(gap-dy>1e-6)unstable=true;else r.v=0;}}else r.v=0;
    support=r.top;
   }
   if(unstable)this.columns[i].sort((a,b)=>a.top-b.top);else{for(const r of c){delete r.layered;delete r.delay;}this.merge(i);this.active.delete(i);}
  }
  if(moved)this.revision++;return moved;
 }
 settle(){for(let n=0;this.active.size&&n<600;n++)this.step(1/60);return !this.active.size;}
}
module.exports={ColumnTerrain};
