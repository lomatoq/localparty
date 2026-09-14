import * as T from './vendor/three.module.js';
// Authored geometry and local procedural textures: no network textures or fonts.
export class Venue {
 constructor(scene,renderer,mode,low){
  this.scene=scene;this.mode=mode;this.low=low;this.geos=[];this.mats=[];this.textures=[];
  this.root=new T.Group();scene.add(this.root);this.cache=new Map();this.geo=new T.BoxGeometry(1,1,1);this.geos.push(this.geo);
  this.lightMat=this.mat('#c09aff',.32,0,1.7);this.wood=this.woodMaterial();this.ice=this.iceMaterial();
  this.hall();if(mode==='bowling')this.bowling();else this.curling();this.batchBoxes();
  if(!low){const env=new T.Scene();env.background=new T.Color('#273348');const shell=new T.Mesh(new T.BoxGeometry(20,14,35),new T.MeshBasicMaterial({color:'#3b405c',side:T.BackSide}));env.add(shell);
   const emit=new T.MeshBasicMaterial({color:'#fff1d7'});for(const x of [-7,7]){const panel=new T.Mesh(new T.BoxGeometry(2,6,15),emit);panel.position.set(x,3,0);env.add(panel);}
   const pmrem=new T.PMREMGenerator(renderer);this.envTarget=pmrem.fromScene(env,.07);scene.environment=this.envTarget.texture;pmrem.dispose();env.traverse(o=>{if(o.geometry)o.geometry.dispose();});shell.material.dispose();emit.dispose();
  }
 }
 mat(color,roughness=.6,metalness=.05,glow=0){const k=[color,roughness,metalness,glow].join(':');if(!this.cache.has(k)){const m=new T.MeshStandardMaterial({color,roughness,metalness,emissive:color,emissiveIntensity:glow});this.cache.set(k,m);this.mats.push(m);}return this.cache.get(k);}
 box(x,y,z,w,h,d,color,group=this.root){const m=new T.Mesh(this.geo,typeof color==='string'?this.mat(color):color);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=h>.1;m.receiveShadow=true;group.add(m);return m;}
 cylinder(x,y,z,r,h,color,group=this.root){const g=new T.CylinderGeometry(r,r,h,24);this.geos.push(g);const m=new T.Mesh(g,this.mat(color,.35,.2));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 texture(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=this.low?1:4;this.textures.push(t);return t;}
 woodMaterial(){
  const map=this.texture(512,1024,(c,w,h)=>{c.fillStyle='#c18d56';c.fillRect(0,0,w,h);for(let i=0;i<18;i++){const x=i*w/18;c.fillStyle=['#d5af79','#c69a62','#dbb987','#bc8d58'][i%4];c.fillRect(x,0,w/18-1,h);
   for(let j=0;j<9;j++){const y=(j*137+i*73)%h;c.strokeStyle='rgba(72,39,20,.13)';c.lineWidth=.8;c.beginPath();c.moveTo(x,y);c.lineTo(x+w/18,y);c.stroke();}
   for(let k=0;k<5;k++){c.strokeStyle='rgba(88,51,20,.07)';c.beginPath();for(let y=0;y<h;y+=25){const xx=x+3+k*5+Math.sin(y*.023+i)*1.3;y?c.lineTo(xx,y):c.moveTo(xx,y);}c.stroke();}
  }});
  const m=new T.MeshStandardMaterial({map,roughness:.24,metalness:.06});this.mats.push(m);return m;
 }
 iceMaterial(){const map=this.texture(512,1024,(c,w,h)=>{c.fillStyle='#b7dee5';c.fillRect(0,0,w,h);for(let i=0;i<240;i++){const x=(i*139)%w,y=(i*283)%h;c.strokeStyle=i%3?'rgba(245,255,255,.23)':'rgba(66,138,172,.09)';c.lineWidth=.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.sin(i)*4,y+35+(i%60));c.stroke();}});const m=new T.MeshStandardMaterial({map,roughness:.28,metalness:.11});this.mats.push(m);return m;}
 hall(){
  const curl=this.mode==='curling';this.box(0,-.56,13,43,.6,57,'#161e30');
  // Real architectural volume: side walls, back wall, acoustic panels and roof trusses.
  this.box(-21,10.5,14,.65,22,56,'#2b3046');this.box(21,10.5,14,.65,22,56,'#2b3046');
  this.box(0,10.5,35,43,22,.65,'#272c40');this.box(0,22,12,43,.6,55,'#20273b');
  for(const side of [-1,1])for(let z=-10;z<=32;z+=6){
   this.box(side*20.55,4.0,z,.12,4.6,4.8,z%12?'#363b53':'#3e3b56');this.box(side*20.25,5.7,z,.10,.07,4.8,this.lightMat);
   this.box(side*19.8,5.5,z,.4,11,.5,'#525a70');this.box(side*19.55,1.1,z,.2,1.8,.5,'#a0a6b4');
  }
  for(let z=-8;z<=32;z+=8){this.box(0,19.7,z,42,.3,.36,'#4a5168');for(const x of [-13,-5,5,13])this.box(x,19.4,z,5,.08,.5,this.mat('#d8f9ff',.4,0,1.8));}
  // A distant lounge gives scale instead of a black void behind the lane.
  this.box(0,-.08,-8,40,.15,10,'#2e2940');
  for(const x of [-15,-9,9,15]){this.box(x,.7,-7,4.3,.6,1.4,'#60507d');this.box(x,1.45,-7.5,4.3,1.1,.3,'#8371a1');for(const dx of [-1.7,1.7])this.box(x+dx,.25,-7,.2,.55,1.1,'#bac6d0');}
  for(const side of [-1,1]){this.box(side*13,2,33,11,3.1,.15,'#3b3758');this.box(side*13,3.9,32.8,11,.07,.1,this.lightMat);}
  // Continuous skirting, structural depth, and doors are not flat black decals.
  this.box(0,.3,34.5,42,.45,.2,'#697489');
  for(const x of [-18,18]){this.box(x,1.6,34.45,1.8,3.1,.2,'#151d2c');this.box(x-1,1.7,34.25,.14,3.4,.35,'#77869c');this.box(x+1,1.7,34.25,.14,3.4,.35,'#77869c');this.box(x,3.4,34.25,2.1,.15,.35,'#77869c');this.box(x+.6,1.6,34.05,.08,.3,.06,'#c6d5d2');}
  if(curl){for(const side of [-1,1])for(let row=0;row<3;row++){
   this.box(side*(15+row*1.7),row*.55+.2,15,1.6,.55,31,'#46546c');
   for(let z=1;z<31;z+=1.8){this.box(side*(15+row*1.7),row*.55+.7,z,1.1,.25,1.2,row%2?'#8874ba':'#667dab');this.box(side*(15.5+row*1.7),row*.55+1.1,z,.25,.7,1.2,'#78749e');}
  }}
 }
 bowling(){
  for(const laneX of [-12,-6,0,6,12]){
   const focus=laneX===0;this.box(laneX,-.08,13,3.6,.16,28,this.wood);
   for(const sign of [-1,1]){
    // Depressed gutters, rounded in section, with a raised outside rail.
    this.box(laneX+sign*2.05,-.34,13,.5,.12,28,'#203043');
    this.box(laneX+sign*1.84,-.20,13,.06,.35,28,'#65798b');
    this.box(laneX+sign*2.34,.1,13,.13,.55,28,'#515d75');
    this.box(laneX+sign*2.35,.40,13,.04,.025,28,focus?this.lightMat:this.mat('#64d6e0',.4,0,.6));
   }
   // Pinsetter bay is a 4m deep recess with side returns, ceiling and rubber pit.
   this.box(laneX,-.25,28.4,4.9,.4,5,'#1b2532');this.box(laneX,2.55,29.2,5.5,.38,5.4,'#45485e');
   this.box(laneX-2.57,1.1,29.5,.3,2.8,5.4,'#454c62');this.box(laneX+2.57,1.1,29.5,.3,2.8,5.4,'#454c62');
   this.box(laneX,1.05,32.1,5.2,2.9,.3,'#242b3f');
   for(let z=27;z<=31;z+=.6)this.box(laneX,-.01,z,4.8,.07,.10,'#465062');
   this.box(laneX,1.9,29.7,4.2,.18,.28,'#7f8291');this.box(laneX,2.8,27.1,5.7,.4,.6,'#807697');
   this.box(laneX,2.55,26.93,5.3,.055,.035,focus?this.lightMat:this.mat('#b8c8d5',.5,0,.4));
   // Correct aspect, vector-like lane-number discs; no oversized pixelated word texture.
   const number=Math.round((laneX+12)/6)+1;for(let j=0;j<number;j++)this.cylinder(laneX+(j-(number-1)/2)*.15,2.82,26.76,.042,.08,'#dfd5f5');
   this.box(laneX,.013,3.4,3.6,.018,.06,'#5f4236');
   for(let i=-3;i<=3;i++){const g=new T.ConeGeometry(.06,.21,3);this.geos.push(g);const arrow=new T.Mesh(g,this.mat('#675143'));arrow.rotation.x=Math.PI/2;arrow.position.set(laneX+i*.38,.026,8+Math.abs(i)*.24);this.root.add(arrow);}
   // Adjacent lanes are furnished but their decorative pins aren't scoring bodies.
   if(!focus)for(let row=0;row<4;row++)for(let k=0;k<=row;k++){const x=laneX+(k-row/2)*.54,z=22+row*.48;this.cylinder(x,.36,z,.13,.70,'#d9e1e8');this.cylinder(x,.8,z,.07,.2,'#9976cd');}
  }
  for(const x of [-3,3]){this.box(x,.42,-2,1.15,.84,2.8,'#645983');this.box(x,.94,-2,.94,.12,2.5,'#8992ab');this.box(x,1.1,-3,.8,.65,.7,'#554470');for(let z=-2.7;z<-.6;z+=.65){const g=new T.SphereGeometry(.23,18,12);this.geos.push(g);const m=new T.Mesh(g,this.mat(z<-1.5?'#8854da':'#c8e982',.24,.15));m.position.set(x,1.14,z);this.root.add(m);}}
 }
 curling(){
  for(const cx of [-8,0,8]){
   this.box(cx,-.12,15,7,.24,30,this.ice);
   for(const sx of [-3.65,3.65]){this.box(cx+sx,.40,15,.24,.85,31,'#8197ad');this.box(cx+sx,.86,15,.30,.10,31,'#9b7bd4');this.box(cx+sx,.17,15,.27,.12,30,'#e4c574');}
   for(const z of [2,8,21,25])this.box(cx,.025,z,7,.011,z===8?.10:.035,z===8?'#9c62c6':'#669bad');
   this.box(cx,.027,15,.025,.010,29,'#a1cbd4');
   for(const [r,color] of [[2.4,'#7964b8'],[1.6,'#edf5ec'],[.8,'#62c8d8'],[.16,'#eee5fc']]){
    const geo=new T.CircleGeometry(r,72);this.geos.push(geo);const m=new T.Mesh(geo,this.mat(color,.32,.05));m.rotation.x=-Math.PI/2;m.position.set(cx,.032+(2.5-r)*.003,25);m.receiveShadow=true;this.root.add(m);
   }
   this.box(cx-.3,.11,1,.30,.18,.50,'#34455b');this.box(cx+.3,.11,1,.30,.18,.50,'#34455b');
  }
  this.box(0,.35,31,24,.7,.35,'#8a9faf');this.box(0,.78,31,24,.15,.45,'#aaa1cd');
  const glass=new T.MeshStandardMaterial({color:'#adc7e9',transparent:true,opacity:.18,roughness:.25,depthWrite:false});this.mats.push(glass);
  for(let x=-12;x<=12;x+=3){this.box(x,2,31,.08,3,.08,'#aebbd1');if(x<12)this.box(x+1.5,2,31,2.9,2.7,.05,glass);}
  for(const x of [-12.5,12.5]){this.box(x,1.1,15,.4,2.2,31,'#687c93');this.box(x,2.2,15,.1,.04,31,this.lightMat);}
 }
 batchBoxes(){
  const batches=new Map();for(const m of [...this.root.children])if(m.isMesh&&m.geometry===this.geo){let b=batches.get(m.material);if(!b){b=[];batches.set(m.material,b);}b.push(m);}
  for(const [mat,items] of batches){const mesh=new T.InstancedMesh(this.geo,mat,items.length);items.forEach((m,i)=>{m.updateMatrix();mesh.setMatrixAt(i,m.matrix);this.root.remove(m);});mesh.castShadow=true;mesh.receiveShadow=true;this.root.add(mesh);}
 }
 dispose(){this.scene.remove(this.root);this.envTarget?.dispose();for(const t of this.textures)t.dispose();for(const g of this.geos)g.dispose();for(const m of this.mats)m.dispose();}
}
