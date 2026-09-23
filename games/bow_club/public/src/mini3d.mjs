/** Small dependency-free lit WebGL renderer for the AR bow and target range.
 * Geometry is original, generated at runtime. No network/CDN/assets required.
 */
const normalize=a=>{const d=Math.hypot(...a)||1;return a.map(x=>x/d);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export function color(hex){const n=parseInt(hex.replace('#',''),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
export class Mini3D {
 constructor(canvas,{alpha=false,cameraZ=12,fov=48}={}){
  this.canvas=canvas;this.cameraZ=cameraZ;this.fov=fov;this.vertices=[];this.alpha=alpha;
  this.gl=canvas.getContext('webgl',{alpha,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});
  if(!this.gl){this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('Нет графического контекста');this.software=true;canvas.dataset.renderer='software-3d';return;}canvas.dataset.renderer='webgl';this.init();
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;});canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.init();});
 }
 init(){const g=this.gl,shader=(type,source)=>{const s=g.createShader(type);g.shaderSource(s,source);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));return s;};
  const vs=shader(g.VERTEX_SHADER,`attribute vec3 position;attribute vec3 normal;attribute vec3 colour;uniform mat4 projection;uniform float cameraZ;varying vec3 vColour;varying vec3 vNormal;varying vec3 vPosition;void main(){vColour=colour;vNormal=normal;vPosition=position;gl_Position=projection*vec4(position-vec3(0.,0.,cameraZ),1.);}`);
  const fs=shader(g.FRAGMENT_SHADER,`precision mediump float;varying vec3 vColour;varying vec3 vNormal;varying vec3 vPosition;void main(){vec3 n=normalize(vNormal);vec3 l=normalize(vec3(-.45,1.1,1.45));vec3 v=normalize(vec3(0.,0.,1.));vec3 h=normalize(l+v);float diffuse=max(0.,dot(n,l));float spec=pow(max(0.,dot(n,h)),24.)*.28;float rim=pow(1.-max(0.,n.z),3.)*.10;vec3 rgb=vColour*(.38+.62*diffuse)+vec3(spec)+rim;gl_FragColor=vec4(rgb,1.);}`);
  this.program=g.createProgram();g.attachShader(this.program,vs);g.attachShader(this.program,fs);g.linkProgram(this.program);if(!g.getProgramParameter(this.program,g.LINK_STATUS))throw Error(g.getProgramInfoLog(this.program));g.deleteShader(vs);g.deleteShader(fs);
  this.buffer=g.createBuffer();this.locations=['position','normal','colour'].map(x=>g.getAttribLocation(this.program,x));this.projection=g.getUniformLocation(this.program,'projection');this.cameraLocation=g.getUniformLocation(this.program,'cameraZ');g.enable(g.DEPTH_TEST);g.disable(g.CULL_FACE);
 }
 vertex(p,n,c){this.vertices.push(...p,...n,...c);}
 tri(a,b,c,col,normal){const n=normal||normalize(cross(sub(b,a),sub(c,a)));this.vertex(a,n,col);this.vertex(b,n,col);this.vertex(c,n,col);}
 tube(a,b,r1,r2,col,sides=10){const axis=normalize(sub(b,a)),u=normalize(cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[1,0,0])),v=cross(axis,u);for(let i=0;i<sides;i++){
  const t=i*Math.PI*2/sides,t2=(i+1)*Math.PI*2/sides,n=u.map((x,k)=>x*Math.cos(t)+v[k]*Math.sin(t)),n2=u.map((x,k)=>x*Math.cos(t2)+v[k]*Math.sin(t2));
  const p=a.map((x,k)=>x+n[k]*r1),q=a.map((x,k)=>x+n2[k]*r1),r=b.map((x,k)=>x+n[k]*r2),s=b.map((x,k)=>x+n2[k]*r2);
  this.vertex(p,n,col);this.vertex(q,n2,col);this.vertex(s,n2,col);this.vertex(p,n,col);this.vertex(s,n2,col);this.vertex(r,n,col);this.tri(a,q,p,col,axis.map(x=>-x));this.tri(b,r,s,col,axis);
 }}
 disk(x,y,z,r,col,sides=48){for(let i=0;i<sides;i++){const a=i*Math.PI*2/sides,b=(i+1)*Math.PI*2/sides;this.tri([x,y,z],[x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(b)*r,y+Math.sin(b)*r,z],col,[0,0,1]);}}
 sphere(x,y,z,r,col,segments=12){for(let j=0;j<6;j++)for(let i=0;i<segments;i++){const point=(i,j)=>{const a=i*Math.PI*2/segments,b=j*Math.PI/6,n=[Math.cos(a)*Math.sin(b),Math.cos(b),Math.sin(a)*Math.sin(b)];return {p:[x+n[0]*r,y+n[1]*r,z+n[2]*r],n};};const a=point(i,j),b=point(i+1,j),c=point(i+1,j+1),d=point(i,j+1);for(const q of [a,b,c,a,c,d])this.vertex(q.p,q.n,col);}}
 clear(){this.vertices.length=0;}
 render(width,height,background=[.72,.9,.95,1]){
  if(this.lost)return;if(this.software){this.renderSoftware(width,height,background);return;}const g=this.gl,dpr=Math.min(devicePixelRatio||1,1.5),w=Math.round(width*dpr),h=Math.round(height*dpr);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}g.viewport(0,0,w,h);g.clearColor(...background);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);g.useProgram(this.program);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.bufferData(g.ARRAY_BUFFER,new Float32Array(this.vertices),g.DYNAMIC_DRAW);
  for(let i=0;i<3;i++){g.enableVertexAttribArray(this.locations[i]);g.vertexAttribPointer(this.locations[i],3,g.FLOAT,false,36,i*12);}const f=1/Math.tan(this.fov*Math.PI/360),near=.05,far=100;g.uniformMatrix4fv(this.projection,false,new Float32Array([f/(w/h),0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]));g.uniform1f(this.cameraLocation,this.cameraZ);g.drawArrays(g.TRIANGLES,0,this.vertices.length/9);
 }
 renderSoftware(width,height,background){
  // Perspective + face lighting on the same triangles; slower fallback, not a flat bow sprite.
  const now=performance.now();if(now-(this.softwareAt||0)<32)return;this.softwareAt=now;
  const c=this.ctx,w=Math.max(1,Math.round(width)),h=Math.max(1,Math.round(height));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}c.clearRect(0,0,w,h);if(background[3]){c.fillStyle=`rgba(${background[0]*255},${background[1]*255},${background[2]*255},${background[3]})`;c.fillRect(0,0,w,h);}
  const f=h/(2*Math.tan(this.fov*Math.PI/360)),v=this.vertices,faces=[];for(let i=0;i<v.length;i+=27){const a=[v[i],v[i+1],v[i+2]],b=[v[i+9],v[i+10],v[i+11]],d=[v[i+18],v[i+19],v[i+20]];if([a,b,d].some(p=>this.cameraZ-p[2]<.05))continue;faces.push({i,z:(a[2]+b[2]+d[2])/3,points:[a,b,d].map(p=>[w/2+p[0]*f/(this.cameraZ-p[2]),h/2-p[1]*f/(this.cameraZ-p[2])])});}faces.sort((a,b)=>a.z-b.z);
  for(const face of faces){const i=face.i,n=normalize([v[i+3]+v[i+12]+v[i+21],v[i+4]+v[i+13]+v[i+22],v[i+5]+v[i+14]+v[i+23]]),light=.47+.53*Math.max(0,(-.5*n[0]+n[1]+1.5*n[2])/Math.sqrt(3.5));c.fillStyle=`rgb(${Math.round(v[i+6]*light*255)},${Math.round(v[i+7]*light*255)},${Math.round(v[i+8]*light*255)})`;c.beginPath();c.moveTo(...face.points[0]);c.lineTo(...face.points[1]);c.lineTo(...face.points[2]);c.closePath();c.fill();c.strokeStyle=c.fillStyle;c.lineWidth=.45;c.stroke();}
 }
 destroy(){const g=this.gl;if(g){g.deleteBuffer(this.buffer);g.deleteProgram(this.program);}}

}
const wood=color('#8e5a31'),edge=color('#c6d2db'),grip=color('#25333a'),gold=color('#f3d18f'),string=color('#f4fbff');
export class Bow3D extends Mini3D {
 constructor(canvas){super(canvas,{alpha:true,cameraZ:5,fov:48});this.kick=0;}
 shoot(){this.kick=1;}
 frame(width,height,pull,now,dt,hand='right'){
  this.clear();this.kick=Math.max(0,this.kick-dt*4);const angle=-.25,mirror=hand==='left'?-1:1;
  const tr=p=>{const x=p[0],y=p[1];return [(x*Math.cos(angle)-y*Math.sin(angle)+.72)*mirror*.88,(y*Math.cos(angle)+x*Math.sin(angle)-.12)*.88, (p[2]-this.kick*.2)*.88];};
  // The string and limb mesh share the exact same attachment points.
  const limbPoint=(sign,t)=>[.1+Math.sin(t*Math.PI)*(.27+pull*.13)-Math.sin(t*Math.PI*1.3)*.17,sign*(.25+t*1.65),-.2-t*.15+pull*t*.20];
  for(const sign of [-1,1])for(let i=0;i<18;i++){
   const at=t=>limbPoint(sign,t);
   const a=at(i/18),b=at((i+1)/18);this.tube(tr(a),tr(b),.07-i*.0026,.067-i*.0026,wood,8);
   const ridge=p=>[p[0]+.045,p[1],p[2]+.025];this.tube(tr(ridge(a)),tr(ridge(b)),.027,.025,edge,6);
  }
  this.tube(tr([.12,-.35,-.12]),tr([.12,.35,-.12]),.11,.10,grip,12);
  for(let i=0;i<6;i++)this.tube(tr([.13,-.28+i*.10,-.12]),tr([.13,-.255+i*.10,-.12]),.114,.114,i%2?wood:gold,12);
  const nock=[.22,-.22,1.0+pull*.8],tip=[.08,.06,-2.1];for(const sign of [-1,1]){const end=limbPoint(sign,1);this.tube(tr(end),tr(nock),.007,.007,string,5);}
  this.tube(tr(nock),tr(tip),.017,.017,gold,8);const a=tr(tip),b=tr([tip[0],tip[1],tip[2]-.24]);this.tube(a,b,.070,0,color('#a7dbe0'),8);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3,base=tr([nock[0],nock[1],nock[2]-.30]),outer=tr([nock[0]+Math.cos(a)*.14,nock[1]+Math.sin(a)*.14,nock[2]-.10]);this.tri(tr(nock),base,outer,i%2?gold:edge);}
  this.render(width,height,[0,0,0,0]);
 }
}
export function rangeGeometry(g,targets,hit=null,now=0){
 g.clear();
 const skyTop=color('#8fd0ff'),skyMid=color('#b9e6ff'),skyLow=color('#eaf7ff'),ground=color('#78b87a'),ground2=color('#5f9e60'),trunk=color('#6b4b2b'),leaf1=color('#497f46'),leaf2=color('#5d9e58');
 // soft banded sky backdrop
 g.tri([-20,12,-28],[20,12,-28],[20,4,-28],skyTop); g.tri([-20,12,-28],[20,4,-28],[-20,4,-28],skyTop);
 g.tri([-20,4,-28],[20,4,-28],[20,-.5,-28],skyMid); g.tri([-20,4,-28],[20,-.5,-28],[-20,-.5,-28],skyMid);
 g.tri([-20,-.5,-28],[20,-.5,-28],[20,-4,-28],skyLow); g.tri([-20,-.5,-28],[20,-4,-28],[-20,-4,-28],skyLow);
 // sun glow
 g.sphere(10,5,-25,1.15,color('#fff1bf'),8);
 // distant tree line
 for(let i=0;i<15;i++){const x=-15+i*2.15, h=2.5+(i%4)*.45, z=-17-(i%3)*1.1; g.tube([x,-2.9,z],[x,-1.6,z],.12,.11,trunk,6); g.tube([x,-.2,z],[x,-2.0,z],1.25,0, i%2?leaf1:leaf2,8);} 
 // ground
 g.tri([-16,-2.9,7],[16,-2.9,7],[16,-2.9,-18],ground); g.tri([-16,-2.9,7],[16,-2.9,-18],[-16,-2.9,-18],ground);
 g.tri([-16,-2.75,2],[16,-2.75,2],[16,-2.75,-18],ground2); g.tri([-16,-2.75,2],[16,-2.75,-18],[-16,-2.75,-18],ground2);
 // foreground tree groups
 for(const [x,z,s] of [[-8,-7,1],[-11,-10,.78],[8.5,-8,.92],[11,-11,.8]]){g.tube([x,-2.9,z],[x,.2,z],.16*s,.14*s,trunk,8);for(let k=0;k<3;k++){const oy=.8+k*.75;g.tube([x,1.6+oy,z],[x,.1+oy,z],1.35*s*(1-k*.16),0, k%2?leaf1:leaf2,8);}}
 const half=Math.tan(g.fov*Math.PI/360)*g.cameraZ;
 for(const t of targets){const x=(t.u-.5)*2*half*16/9,y=(.5-t.v)*2*half,r=t.r/720*2*half;
  // rear supports stay behind the target, not in front of it
  g.tube([x-.72,-2.9,-.88],[x-.14,y+.18,-.52],.055,.055,color('#96683f'),8);
  g.tube([x+.72,-2.9,-.88],[x+.14,y+.18,-.52],.055,.055,color('#96683f'),8);
  g.tube([x,-2.9,-.96],[x,y-.15,-.56],.06,.06,color('#7c5732'),8);
  g.tube([x-.22,y+.18,-.54],[x+.22,y+.18,-.54],.05,.05,color('#b99055'),8);
  // target frame and disk
  g.tube([x,y,-.29],[x,y,.01],r*1.09,r*1.09,color('#aa8a58'),40);
  for(const [scale,hex,z]of [[1,'#fff7df',.03],[.78,'#347587',.04],[.54,'#fff7df',.05],[.32,'#e78154',.06],[.18,'#fcd967',.07]])g.disk(x,y,z,r*scale,color(hex));
 }
 if(hit){const x=(hit.u-.5)*2*half*16/9,y=(.5-hit.v)*2*half,age=Math.max(0,(now-hit.visualAt)/1000),z=Math.max(.07,4.5*(1-age/.22));if(age<1.8){g.tube([x,y,z],[x+.18,y-.12,z+1.05],.016,.016,color('#efd799'),8);g.tube([x,y,z-.15],[x,y,z+.08],0,.045,color('#d4f5ff'),8);}}
}
