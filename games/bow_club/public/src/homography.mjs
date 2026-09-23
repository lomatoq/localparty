/** Planar, normalized camera coordinates -> normalized TV coordinates.
 * No camera calibration is assumed; this is NOT a 6-DoF pose estimator.
 */
export function validQuad(points,minArea=0.015){
 if(!Array.isArray(points)||points.length!==4||points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))return false;
 let area=0,sign=0;
 for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4],c=points[(i+2)%4],cross=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);if(Math.abs(cross)<1e-6)return false;if(sign&&Math.sign(cross)!==sign)return false;sign=Math.sign(cross);area+=a[0]*b[1]-b[0]*a[1];}
 return Math.abs(area)/2>=minArea;
}
export function fitHomography(source,target){
 if(!validQuad(source,1e-8)||!validQuad(target,1e-8))return null;
 const a=[];
 for(let i=0;i<4;i++){const [x,y]=source[i],[u,v]=target[i];a.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);}
 for(let col=0;col<8;col++){
  let pivot=col;for(let r=col+1;r<8;r++)if(Math.abs(a[r][col])>Math.abs(a[pivot][col]))pivot=r;
  if(Math.abs(a[pivot][col])<1e-10)return null;[a[pivot],a[col]]=[a[col],a[pivot]];
  const d=a[col][col];for(let k=col;k<=8;k++)a[col][k]/=d;
  for(let r=0;r<8;r++)if(r!==col){const f=a[r][col];for(let k=col;k<=8;k++)a[r][k]-=f*a[col][k];}
 }
 const h=a.map(r=>r[8]);h.push(1);return h.every(Number.isFinite)?h:null;
}
export function project(h,x,y){
 if(!h||h.length!==9||!Number.isFinite(x+y))return null;
 const d=h[6]*x+h[7]*y+h[8];if(!Number.isFinite(d)||Math.abs(d)<1e-9)return null;
 const u=(h[0]*x+h[1]*y+h[2])/d,v=(h[3]*x+h[4]*y+h[5])/d;
 return Number.isFinite(u+v)?{u,v}:null;
}
/** object-fit:cover, object-position:center. Output is in video pixels. */
export function coverToImage(x,y,viewWidth,viewHeight,videoWidth,videoHeight){
 if([viewWidth,viewHeight,videoWidth,videoHeight].some(v=>!Number.isFinite(v)||v<=0))return null;
 const scale=Math.max(viewWidth/videoWidth,viewHeight/videoHeight);
 return {x:(x-(viewWidth-videoWidth*scale)/2)/scale,y:(y-(viewHeight-videoHeight*scale)/2)/scale};
}
