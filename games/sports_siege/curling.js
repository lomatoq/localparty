'use strict';
// Deterministic planar ice/contact solver; rendered as real 3D meshes on the host.
// Fixed 120 Hz substeps keep fast take-outs from tunnelling through other stones.
const {clamp}=require('./rules');
class Ice {
  constructor(){this.stones=[];this.active=null;this.serial=0;}
  reset(){this.stones=[];this.active=null;}
  throw(input,player){
    const speed=2.4+input.power*3.8;
    const s={id:'s'+(++this.serial),owner:player.id,team:player.team,r:.43,x:input.position*2.2,z:13,
      vx:Math.sin(input.angle)*speed,vz:-Math.cos(input.angle)*speed,spin:input.spin,rotation:0,valid:true,crossed:false};
    this.stones.push(s);this.active=s;return s;
  }
  step(dt,sweep=0){
    const count=Math.ceil(dt/(1/120)),h=dt/count;
    for(let n=0;n<count;n++) {
      for(const s of this.stones) {
        if(!s.valid)continue;
        const v=Math.hypot(s.vx,s.vz), sw=s===this.active?clamp(sweep,0,1):0;
        if(v>.018){
          const next=Math.max(0,v-(.46-.11*sw)*h), angle=s.spin*.052*(1-sw*.6)*h;
          const vx=s.vx*Math.cos(angle)-s.vz*Math.sin(angle),vz=s.vx*Math.sin(angle)+s.vz*Math.cos(angle);
          s.vx=vx*next/v;s.vz=vz*next/v;s.x+=s.vx*h;s.z+=s.vz*h;s.rotation+=s.spin*h*2;
        }else{s.vx=s.vz=0;}
        if(s.z<0)s.crossed=true;
        if(Math.abs(s.x)>3.35 || s.z< -14.6 || s.z>15){s.valid=false;s.vx=s.vz=0;}
      }
      for(let i=0;i<this.stones.length;i++)for(let j=i+1;j<this.stones.length;j++){
        const a=this.stones[i],b=this.stones[j];if(!a.valid||!b.valid)continue;
        const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),r=a.r+b.r;if(d>=r)continue;
        const nx=d>1e-8?dx/d:1,nz=d>1e-8?dz/d:0,overlap=r-d;
        a.x-=nx*overlap*.5;a.z-=nz*overlap*.5;b.x+=nx*overlap*.5;b.z+=nz*overlap*.5;
        const relative=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz;
        if(relative<0){const impulse=-relative*.96;a.vx-=impulse*nx;a.vz-=impulse*nz;b.vx+=impulse*nx;b.vz+=impulse*nz;}
      }
    }
  }
  get resting(){return this.stones.every(s=>!s.valid||Math.hypot(s.vx,s.vz)<.04);}
  settle(){for(const s of this.stones){s.vx=s.vz=0;if(!s.crossed)s.valid=false;}}
  snapshot(){return this.stones.map(({vx,vz,spin,...s})=>s);}
  free(){}
}
module.exports={Ice};
