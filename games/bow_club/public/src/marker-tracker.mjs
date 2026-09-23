/** Original JS square-marker detector for the packaged DICT_4X4_50 board.
 * Not OpenCV running in the browser. Otsu -> black components -> convex hull ->
 * perspective cell sampling -> dictionary/rotation validation -> multi-tag fit.
 * Coded markers and >=3 spatially separated tags replace the alpha01 colour blobs.
 */
import {fitHomography,project} from './homography.mjs';
import {CODES,BOARD} from './markers.mjs';
const corners=[[0,0],[1,0],[1,1],[0,1]];
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function hull(points){points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const lo=[],hi=[];for(const p of points){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(let i=points.length-1;i>=0;i--){const p=points[i];while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}lo.pop();hi.pop();return lo.concat(hi);}
function quadOf(points){let q=hull(points);while(q.length>4){let best=Infinity,at=-1;for(let i=0;i<q.length;i++){const area=Math.abs(cross(q[(i+q.length-1)%q.length],q[i],q[(i+1)%q.length]));if(area<best){best=area;at=i;}}q.splice(at,1);}if(q.length!==4)return null;const area=Math.abs(q.reduce((a,p,i)=>a+p[0]*q[(i+1)%4][1]-p[1]*q[(i+1)%4][0],0))*.5;if(area<90)return null;const start=q.reduce((j,p,i)=>p[0]+p[1]<q[j][0]+q[j][1]?i:j,0);q=q.slice(start).concat(q.slice(0,start));const cx=q.reduce((s,p)=>s+p[0],0)/4,cy=q.reduce((s,p)=>s+p[1],0)/4;return q.map(p=>{const d=Math.hypot(p[0]-cx,p[1]-cy)||1;return [p[0]+(p[0]-cx)*.65/d,p[1]+(p[1]-cy)*.65/d];});}
function otsu(gray){const h=new Uint32Array(256);let sum=0;for(const g of gray){h[g]++;sum+=g;}let n=0,s=0,best=0,t=100;for(let i=0;i<255;i++){n+=h[i];s+=i*h[i];if(!n)continue;const other=gray.length-n;if(!other)break;const d=s/n-(sum-s)/other,v=n*other*d*d;if(v>best){best=v;t=i;}}return Math.max(45,Math.min(190,t+1));}
const ham=(a,b)=>{let n=a^b,c=0;while(n){n&=n-1;c++;}return c;};
const rotate=bits=>Array.from({length:16},(_,i)=>bits[(3-i%4)*4+Math.floor(i/4)]);
export function decodeCells(bits,maxErrors=1){let mat=bits.slice(),best=null,runner=99;for(let k=0;k<4;k++){const value=mat.reduce((n,v)=>(n<<1)|v,0);for(let id=0;id<CODES.length;id++){const d=ham(value,CODES[id]);if(!best||d<best.distance){runner=best?.distance??99;best={id,rotation:k,distance:d};}else if(d<runner)runner=d;}mat=rotate(mat);}return best&&best.distance<=maxErrors&&runner-best.distance>=2?best:null;}
/** Least-squares homography in normalized coordinates. */
export function fitMany(source,target){
 if(source.length<4||source.length!==target.length)return null;const rows=[];
 for(let i=0;i<source.length;i++){const [x,y]=source[i],[u,v]=target[i];if(![x,y,u,v].every(Number.isFinite))return null;rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);}
 const a=Array.from({length:8},()=>Array(9).fill(0));for(const r of rows)for(let i=0;i<8;i++)for(let j=0;j<9;j++)a[i][j]+=r[i]*r[j];
 for(let i=0;i<8;i++){let p=i;for(let j=i+1;j<8;j++)if(Math.abs(a[j][i])>Math.abs(a[p][i]))p=j;if(Math.abs(a[p][i])<1e-11)return null;[a[i],a[p]]=[a[p],a[i]];const v=a[i][i];for(let j=i;j<9;j++)a[i][j]/=v;for(let k=0;k<8;k++)if(k!==i){const v=a[k][i];for(let j=i;j<9;j++)a[k][j]-=v*a[i][j];}}
 const out=a.map(r=>r[8]).concat(1);return out.every(Number.isFinite)?out:null;
}
export class MarkerTracker {
 detect(rgba,width,height){if(!Number.isInteger(width)||!Number.isInteger(height)||width<24||height<24||width>1920||height>1920||width*height>1920*1080||!rgba||rgba.length!==width*height*4)return null;const gray=new Uint8Array(width*height);for(let i=0;i<gray.length;i++)gray[i]=(rgba[i*4]*77+rgba[i*4+1]*150+rgba[i*4+2]*29)>>8;return this.detectGray(gray,width,height);}
 detectGray(gray,w,h){
  if(gray.length!==w*h||w<24||h<24)return null;const threshold=otsu(gray),seen=new Uint8Array(w*h),stack=new Int32Array(w*h),tags=[];
  for(let start=0;start<gray.length;start++){
   if(seen[start]||gray[start]>=threshold)continue;let read=0,write=1,count=0,minX=w,maxX=0,minY=h,maxY=0;stack[0]=start;seen[start]=1;const boundary=[];
   while(read<write){const pos=stack[read++],x=pos%w,y=Math.floor(pos/w);count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);let edge=false;
    for(const n of [x>0?pos-1:-1,x<w-1?pos+1:-1,y>0?pos-w:-1,y<h-1?pos+w:-1]){if(n<0||gray[n]>=threshold){edge=true;continue;}if(!seen[n]){seen[n]=1;stack[write++]=n;}}
    if(edge&&boundary.length<16000)boundary.push([x,y]);
   }
   const bw=maxX-minX+1,bh=maxY-minY+1;if(count<60||bw<14||bh<14||bw>w*.7||bh>h*.7||count/(bw*bh)<.18||count/(bw*bh)>.94)continue;
   const q=quadOf(boundary);if(!q)continue;const matrix=fitHomography(corners,q);if(!matrix)continue;const cells=[];let borderErrors=0,minContrast=255;
   for(let gy=0;gy<6;gy++)for(let gx=0;gx<6;gx++){let sum=0,samples=0;for(const dx of [-.14,0,.14])for(const dy of [-.14,0,.14]){const p=project(matrix,(gx+.5+dx)/6,(gy+.5+dy)/6);if(!p)continue;const x=Math.round(p.u),y=Math.round(p.v);if(x>=0&&x<w&&y>=0&&y<h){sum+=gray[y*w+x];samples++;}}const mean=samples?sum/samples:255,bit=mean>=threshold?1:0;minContrast=Math.min(minContrast,Math.abs(mean-threshold));if(gx===0||gx===5||gy===0||gy===5)borderErrors+=bit;else cells.push(bit);}
   if(borderErrors>0)continue;const decoded=decodeCells(cells,1);if(!decoded||decoded.id>=4)continue;
   const shift=(4-decoded.rotation)%4,ordered=q.map((_,i)=>q[(i+shift)%4]);
   tags.push({...decoded,corners:ordered.map(p=>[p[0]/w,p[1]/h]),size:Math.min(bw,bh),contrast:minContrast});
  }
  // Duplicate IDs are not guessed between. Reject rather than shoot at the wrong plane.
  const unique=tags.filter(t=>tags.filter(q=>q.id===t.id).length===1);
  if(unique.length<2||(unique.length<3&&(!this.lockAt||performance.now()-this.lockAt>650)))return null;const source=[],target=[];
  for(const tag of unique){const m=BOARD.tags[tag.id];tag.corners.forEach((p,i)=>{source.push(p);target.push([(m.x+corners[i][0]*m.size)/BOARD.width,(m.y+corners[i][1]*m.size)/BOARD.height]);});}
  const matrix=fitMany(source,target),inverse=fitMany(target,source);if(!matrix||!inverse)return null;
  let error=0;for(let i=0;i<source.length;i++){const q=project(inverse,...target[i]);if(!q)return null;error+=Math.hypot((q.u-source[i][0])*w,(q.v-source[i][1])*h)**2;}error=Math.sqrt(error/source.length);
  const screen=corners.map(p=>project(inverse,...p));if(screen.some(p=>!p))return null;
  const area=Math.abs(screen.reduce((a,p,i)=>a+p.u*screen[(i+1)%4].v-p.v*screen[(i+1)%4].u,0))*.5;
  const uv=project(matrix,.5,.5),quality=Math.max(0,Math.min(1,(1-error/5)*Math.min(1,area/.1)));
  if(error>3.5||area<.025||!uv||quality<.6)return null;
  // Two decoded tags can maintain an existing plane, but cannot acquire or jump to a new one.
  if(unique.length===2&&(!this.lastScreen||screen.some((p,i)=>Math.hypot(p.u-this.lastScreen[i].u,p.v-this.lastScreen[i].v)>.12)))return null;
  this.lockAt=performance.now();this.lastScreen=screen;return {h:matrix,uv,quality,error,area,tags:unique,screen};
 }
}
/** Adaptive low-pass in display UV coordinates, reset after a tracking gap. */
export class AimFilter {
 constructor(){this.value=null;this.at=0;}
 reset(){this.value=null;this.at=0;}
 update(value,now){if(!this.value||now-this.at>220){this.value={...value};this.at=now;return this.value;}const dt=Math.max(.001,(now-this.at)/1000),speed=Math.hypot(value.u-this.value.u,value.v-this.value.v)/dt,cutoff=4+speed*14,a=1-Math.exp(-2*Math.PI*cutoff*dt);this.value={u:this.value.u+(value.u-this.value.u)*a,v:this.value.v+(value.v-this.value.v)*a};this.at=now;return this.value;}
}

/** Bounded velocity prediction bridges brief missed camera frames; never drifts indefinitely. */
export class PredictiveAim {
 constructor(){this.reset();}
 reset(){this.value=null;this.velocity={u:0,v:0};this.at=0;}
 update(p,now){if(!this.value||now-this.at>500){this.value={...p};this.velocity={u:0,v:0};this.at=now;return;}const dt=Math.max(.016,(now-this.at)/1000),a=1-Math.exp(-dt*14),old=this.value;const next={u:old.u+(p.u-old.u)*a,v:old.v+(p.v-old.v)*a};for(const k of ['u','v'])this.velocity[k]=this.velocity[k]*.55+Math.max(-1.2,Math.min(1.2,(next[k]-old[k])/dt))*.45;this.value=next;this.at=now;}
 sample(now){if(!this.value||now-this.at>500)return null;const dt=Math.min(.12,Math.max(0,now-this.at)/1000),lead=.075*(1-Math.exp(-dt/.075));return {u:this.value.u+this.velocity.u*lead,v:this.value.v+this.velocity.v*lead};}
}
