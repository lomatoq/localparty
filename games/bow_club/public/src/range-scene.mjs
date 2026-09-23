import * as THREE from '../vendor/three.module.js';
// Shared Three.js library; the phone continues using its small local bow renderer.
export class RangeScene {
 constructor(canvas){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  canvas.addEventListener('webglcontextrestored',()=>{this.key=null;});
  this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-640,640,360,-360,1,2000);this.camera.position.z=1000;
  const sky=document.createElement('canvas');sky.width=8;sky.height=512;const c=sky.getContext('2d'),g=c.createLinearGradient(0,0,0,512);g.addColorStop(0,'#1a1730');g.addColorStop(.55,'#41375d');g.addColorStop(1,'#19172a');c.fillStyle=g;c.fillRect(0,0,8,512);const texture=new THREE.CanvasTexture(sky);texture.colorSpace=THREE.SRGBColorSpace;this.scene.background=texture;
  this.scene.add(new THREE.HemisphereLight('#e4e8ff','#595076',2.1));const key=new THREE.DirectionalLight('#fff3da',3);key.position.set(-350,450,600);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-1000,right:1000,top:650,bottom:-650,near:1,far:2000});key.shadow.normalBias=.4;key.shadow.bias=-.0002;key.shadow.radius=5;this.scene.add(key);const fill=new THREE.DirectionalLight('#b8c9ff',1.2);fill.position.set(500,100,350);this.scene.add(fill);
  this.targets=new THREE.Group();this.arrows=new THREE.Group();this.scene.add(this.targets,this.arrows);this.arrowIds=new Set();this.materials=new Map();
  const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(2800,1600),new THREE.ShadowMaterial({opacity:.16}));backdrop.position.z=-45;backdrop.receiveShadow=true;this.scene.add(backdrop);
 }
 material(color,metalness=0){const key=color+metalness;if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.58,metalness}));return this.materials.get(key);}
 mesh(geometry,color,parent=this.targets,metal=0){const m=new THREE.Mesh(geometry,this.material(color,metal));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 rod(a,b,r,color,parent=this.targets){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av);const m=this.mesh(new THREE.CylinderGeometry(r,r,v.length(),12),color,parent);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
 clear(group){for(const m of [...group.children]){m.traverse(n=>n.geometry?.dispose());group.remove(m);}}
 layout(targets,aspect){this.clear(this.targets);this.targetGroups=new Map();const w=720*aspect;for(const t of targets){const group=new THREE.Group();this.targets.add(group);this.targetGroups.set(t.id,group);group.position.set((t.u-.5)*w,(.5-t.v)*720,0);const x=0,y=0,r=t.r;
   const body=this.mesh(new THREE.CylinderGeometry(r+7,r+7,18,80),'#bb9160',group);body.rotation.x=Math.PI/2;body.position.set(x,y,-10);
   const rim=this.mesh(new THREE.TorusGeometry(r+3,4,12,96),'#e9ca87',group,.28);rim.position.set(x,y,0);
   // Scoring radii exactly match BowMatch: .18 bullseye, .54 middle, 1 outer.
   for(const [scale,color,z]of [[1,'#f5eede',1],[.78,'#7583b6',1.4],[.54,'#f5eede',1.8],[.32,'#cd7252',2.2],[.18,'#efbe4f',2.6]]){const disc=this.mesh(new THREE.CircleGeometry(r*scale,96),color,group);disc.position.set(x,y,z);}
  }}
 addArrow(hit,aspect){const group=new THREE.Group();this.arrows.add(group);const x=(hit.u-.5)*720*aspect,y=(.5-hit.v)*720,tip=[x,y,hit.points?4:-30],tail=[x+18,y+24,tip[2]+85];this.rod(tip,tail,1.7,'#caa36a',group);const feather=this.mesh(new THREE.ConeGeometry(5,18,4),'#b79ae8',group);feather.position.set(...tail);feather.rotation.z=-.6;feather.rotation.x=1.05;group.userData.hit=hit;}
 frame(targets,hits,revision,width,height){const aspect=width/height,key=revision+':'+width+':'+height;let dirty=false;if(key!==this.key){dirty=true;this.key=key;this.camera.left=-360*aspect;this.camera.right=360*aspect;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);this.layout(targets,aspect);this.clear(this.arrows);this.arrowIds.clear();}
  for(const t of targets){const group=this.targetGroups?.get(t.id);if(group){const x=(t.u-.5)*720*aspect,y=(.5-t.v)*720;if(Math.abs(group.position.x-x)>.01||Math.abs(group.position.y-y)>.01){group.position.set(x,y,0);dirty=true;}}}
  for(const hit of hits)if(!this.arrowIds.has(hit.id)){dirty=true;this.arrowIds.add(hit.id);this.addArrow(hit,aspect);}
  // Targets and landed arrows are static. The separate 2D canvas owns the moving
  // hit feedback, so unchanged frames need no 3D draw or 2048px shadow-map pass.
  if(dirty)this.renderer.render(this.scene,this.camera);
 }
}
