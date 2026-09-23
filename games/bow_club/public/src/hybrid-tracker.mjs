import {BOARD} from './markers.mjs';
import {fitMany} from './marker-tracker.mjs';
import {project,validQuad,fitHomography} from './homography.mjs';
const QUAD=[[0,0],[1,0],[1,1],[0,1]];

/** OpenCV ArUco + bidirectional pyramidal LK. Only static marker pixels seed flow. */
export class HybridTracker {
 constructor(cv){
  this.cv=cv;this.dictionary=cv.getPredefinedDictionary(cv.DICT_4X4_50);
  this.parameters=new cv.aruco_DetectorParameters();const p=this.parameters;
  p.cornerRefinementMethod=cv.CORNER_REFINE_SUBPIX;p.cornerRefinementWinSize=3;
  p.adaptiveThreshWinSizeMax=53;p.adaptiveThreshWinSizeStep=10;p.minMarkerPerimeterRate=.018;
  p.minDistanceToBorder=2;p.perspectiveRemovePixelPerCell=8;
  this.refine=new cv.aruco_RefineParameters(10,3,true);
  this.detector=new cv.aruco_ArucoDetector(this.dictionary,p,this.refine);this.reset();
 }
 reset(){this.previous?.delete();this.previous=null;this.points=[];this.last=null;this.lastDecoded=-Infinity;this.lastDetect=-Infinity;this.at=-Infinity;}
 close(){this.reset();for(const value of [this.detector,this.refine,this.parameters,this.dictionary])value.delete();}
 detect(pixels,w,h,at=performance.now(),gyro=null){
  if(w<24||h<24||w*h>2073600||pixels.length!==w*h*4)return null;
  const cv=this.cv,rgba=cv.matFromArray(h,w,cv.CV_8UC4,pixels),gray=new cv.Mat();
  try{cv.cvtColor(rgba,gray,cv.COLOR_RGBA2GRAY);return this.process(gray,w,h,at,gyro);}finally{rgba.delete();gray.delete();}
 }
 process(gray,w,h,at,gyro){
  if(this.previous&&(this.previous.cols!==w||this.previous.rows!==h||at-this.at>500))this.reset();
  let result=null;
  if(!this.last||at-this.lastDetect>=180){
   this.lastDetect=at;const tags=this.decode(gray,w,h);this.decodedCount=tags.length;
   // Two separated decoded tags establish a plane. A single tag only maintains a recent lock.
   if(tags.length>=2||tags.length===1&&this.last&&at-this.lastDecoded<1000){
    const pairs=[];for(const tag of tags){const m=BOARD.tags[tag.id];tag.corners.forEach((p,i)=>pairs.push({image:p,board:[(m.x+QUAD[i][0]*m.size)/BOARD.width,(m.y+QUAD[i][1]*m.size)/BOARD.height]}));}
    result=this.fit(pairs,w,h,'markers',tags.length===1);
    if(result){result.tags=tags;this.points=this.seed(tags,w,h);this.lastDecoded=at;}
   }
  }
  if(!result&&this.previous&&this.last&&this.points.length>=8&&at-this.lastDecoded<=1400){
   let hint=null;if(gyro&&this.previousGyro&&at-this.at<250){hint={x:gyro.x-this.previousGyro.x,y:gyro.y-this.previousGyro.y,z:gyro.z-this.previousGyro.z,focal:gyro.focal};if(Math.hypot(hint.x,hint.y,hint.z)>.2)hint=null;}
   let pairs=this.flow(gray,w,h,hint);if(hint&&pairs.length<8)pairs=this.flow(gray,w,h);result=this.fit(pairs,w,h,'flow');
   if(result)this.points=result.inliers;
  }
  this.previous?.delete();this.previous=gray.clone();this.at=at;this.previousGyro=gyro;
  if(!result){this.points=[];this.last=null;return null;}
  this.last=result;return {h:result.h,uv:result.uv,screen:result.screen,quality:result.quality,error:result.error,area:result.area,tags:result.tags||[],source:result.source,pointCount:this.points.length};
 }
 decode(gray,w,h){
  const cv=this.cv,found=new cv.MatVector(),ids=new cv.Mat(),rejected=new cv.MatVector(),tags=[];
  try{this.detector.detectMarkers(gray,found,ids,rejected);for(let i=0;i<ids.total();i++){const id=ids.data32S[i];if(id<0||id>=BOARD.tags.length)continue;const c=found.get(i);try{const corners=[];for(let j=0;j<4;j++)corners.push([c.data32F[j*2]/w,c.data32F[j*2+1]/h]);tags.push({id,corners});}finally{c.delete();}}return tags.filter(t=>tags.filter(q=>q.id===t.id).length===1);}finally{found.delete();ids.delete();rejected.delete();}
 }
 seed(tags,w,h){
  const points=[];for(const tag of tags){const m=BOARD.tags[tag.id],H=fitHomography(QUAD,tag.corners);if(!H)continue;
   // Marker corners plus its internal cell intersections: static, spatially distributed texture.
   const grid=[...QUAD];for(let y=1;y<6;y++)for(let x=1;x<6;x++)grid.push([x/6,y/6]);
   for(const [u,v]of grid){const p=project(H,u,v);if(p)points.push({image:[p.u,p.v],board:[(m.x+u*m.size)/BOARD.width,(m.y+v*m.size)/BOARD.height]});}
  }return points;
 }
 flow(gray,w,h,hint=null){
  const cv=this.cv,n=this.points.length,prev=cv.matFromArray(n,1,cv.CV_32FC2,this.points.flatMap(p=>[p.image[0]*w,p.image[1]*h])),next=new cv.Mat(),back=new cv.Mat(),status=new cv.Mat(),reverse=new cv.Mat(),error=new cv.Mat(),backError=new cv.Mat(),pairs=[];
  try{
   const criteria=new cv.TermCriteria(cv.TermCriteria_COUNT|cv.TermCriteria_EPS,25,.015),size=new cv.Size(17,17);
   if(hint){next.create(n,1,cv.CV_32FC2);const f=w*(hint.focal||.85);for(let i=0;i<n;i++){const x=prev.data32F[i*2],y=prev.data32F[i*2+1],nx=(x-w/2)/f,ny=(y-h/2)/f,d=1-hint.x*ny-hint.y*nx;next.data32F[i*2]=w/2+f*(nx+hint.y-hint.z*ny)/d;next.data32F[i*2+1]=h/2+f*(ny+hint.x+hint.z*nx)/d;}}
   cv.calcOpticalFlowPyrLK(this.previous,gray,prev,next,status,error,size,3,criteria,hint?cv.OPTFLOW_USE_INITIAL_FLOW:0);
   cv.calcOpticalFlowPyrLK(gray,this.previous,next,back,reverse,backError,size,3,criteria);
   for(let i=0;i<n;i++){if(!status.data[i]||!reverse.data[i]||error.data32F[i]>32)continue;
    const x=next.data32F[2*i],y=next.data32F[2*i+1];
    if(!Number.isFinite(x+y)||x<3||y<3||x>w-3||y>h-3||Math.hypot(back.data32F[2*i]-prev.data32F[2*i],back.data32F[2*i+1]-prev.data32F[2*i+1])>1.2)continue;
    pairs.push({image:[x/w,y/h],board:this.points[i].board});
   }return pairs;
  }finally{for(const m of [prev,next,back,status,reverse,error,backError])m.delete();}
 }
 fit(pairs,w,h,source,single=false){
  if(pairs.length<(source==='flow'?8:4))return null;
  const xs=pairs.map(p=>p.board[0]),ys=pairs.map(p=>p.board[1]);
  if(!single&&(Math.max(...xs)-Math.min(...xs)<.3&&Math.max(...ys)-Math.min(...ys)<.3))return null;
  const cv=this.cv,from=cv.matFromArray(pairs.length,1,cv.CV_32FC2,pairs.flatMap(p=>p.board)),to=cv.matFromArray(pairs.length,1,cv.CV_32FC2,pairs.flatMap(p=>[p.image[0]*w,p.image[1]*h])),mask=new cv.Mat();let robust;
  try{
   robust=cv.findHomography(from,to,cv.RANSAC,2.5,mask,600,.995);if(robust.empty())return null;
   const inliers=pairs.filter((_,i)=>mask.data[i]);if(inliers.length<(source==='flow'?8:4)||inliers.length/pairs.length<.65)return null;
   // A fit must be supported by a board area, not just a single straight row of points.
   const bx=inliers.map(p=>p.board[0]),by=inliers.map(p=>p.board[1]);
   if(!single&&((Math.max(...bx)-Math.min(...bx))*(Math.max(...by)-Math.min(...by))<.025))return null;
   const inverse=fitMany(inliers.map(p=>p.board),inliers.map(p=>p.image)),H=fitMany(inliers.map(p=>p.image),inliers.map(p=>p.board));if(!H||!inverse)return null;
   const screen=QUAD.map(p=>project(inverse,...p));if(screen.some(p=>!p)||!validQuad(screen.map(p=>[p.u,p.v]),.008))return null;
   if(screen.some(p=>Math.abs(p.u)>4||Math.abs(p.v)>4))return null;
   if(single&&screen.some((p,i)=>Math.hypot(p.u-this.last.screen[i].u,p.v-this.last.screen[i].v)>.04))return null;
   let error=0;for(const p of inliers){const q=project(inverse,...p.board);if(!q)return null;error+=((q.u-p.image[0])*w)**2+((q.v-p.image[1])*h)**2;}error=Math.sqrt(error/inliers.length);if(error>2.5)return null;
   const area=Math.abs(screen.reduce((a,p,i)=>a+p.u*screen[(i+1)%4].v-p.v*screen[(i+1)%4].u,0))/2,uv=project(H,.5,.5);if(!uv)return null;
   const quality=Math.max(.61,Math.min(1,.98-error*.09-(source==='flow'?.06:0)-(single?.12:0)));
   return {h:H,screen,uv,quality,error,area,inliers,source};
  }finally{from.delete();to.delete();mask.delete();robust?.delete();}
 }
}
