// Original indexed object sprites, keyed to the exact authored node. This layer
// never changes shot positions, collisions, particle trails or terrain effects.
export class PocketProjectileArt {
 constructor(){this.data=null;this.frames=new Map();this.ready=fetch('assets/pocket-projectiles.json').then(r=>{if(!r.ok)throw Error('Projectile art unavailable');return r.json();}).then(data=>{this.data=data;return data;}).catch(()=>null);}
 profile(shot){return this.data?.nodes[`${shot.weapon}/${shot.sourceType||'BULLET'}/${shot.sourceBullet}`]||null;}
 frame(name){
  if(this.frames.has(name))return this.frames.get(name);const f=this.data?.frames[name];if(!f)return null;
  if(f.png){
   const img=new Image();this.frames.set(name,null);
   img.onload=()=>this.frames.set(name,img);
   img.src='data:image/png;base64,'+f.png;return null;
  }
  const el=document.createElement('canvas');el.width=f.w;el.height=f.h;const c=el.getContext('2d'),image=c.createImageData(f.w,f.h);
  for(let i=0;i<f.pixels.length;i++){const index=f.pixels[i];if(index===this.data.transparentIndex)continue;const color=f.colors[index]||[255,255,255];image.data.set([...color,255],i*4);}
  c.putImageData(image,0,0);this.frames.set(name,el);return el;
 }
 draw(c,shot,time){
  const p=this.profile(shot);if(!p)return false;const at=Math.floor(Math.max(0,shot.age??time)*p.fps)%p.frames.length,frame=this.frame(p.frames[at]);if(!frame)return false;
  c.save();c.translate(shot.x,shot.y);if(p.rotate)c.rotate(Math.atan2(shot.vy,shot.vx)+Math.PI/2);c.imageSmoothingEnabled=false;c.drawImage(frame,-p.xOffset,-p.yOffset);c.restore();return true;
 }
}
