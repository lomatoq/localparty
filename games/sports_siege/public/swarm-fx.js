// Swarm Gate TV presentation layer (render-only). Owns framing, 3D turrets, shot/kill juice,
// gate damage drama, wave moments and ambient life. Never touches rules, scores or the
// authoritative ray: turret pivots stay on the server anchors and every effect starts from
// the same world points the host already uses. All effect storage is pooled and bounded.
import {SwarmTurrets} from './swarm-turrets.js';
import {SwarmImpacts} from './swarm-impacts.js';
import {SwarmAmbience} from './swarm-ambience.js';

const FX_ROOT='/assets/fx/';

export class SwarmFX{
  constructor(stage,THREE,{reduced=false}={}){
    this.stage=stage;this.THREE=THREE;this.reduced=reduced;this.textures=new Map();
    this.up=new THREE.Vector3(0,1,0).applyQuaternion(stage.camera.quaternion);
    this.right=new THREE.Vector3(1,0,0).applyQuaternion(stage.camera.quaternion);
    this.view=new THREE.Vector3();stage.camera.getWorldDirection(this.view);
    this.frameKey='';this.frameCheckAt=0;
    this.turrets=new SwarmTurrets(this);
    this.impacts=new SwarmImpacts(this);
    this.ambience=new SwarmAmbience(this);
    // The host computed its camera before this module loaded; re-run its resize so framing applies.
    stage.viewportKey=null;stage.resize();
  }
  texture(path,{additive=false}={}){
    const THREE=this.THREE,url=path.startsWith('/')?path:FX_ROOT+path;
    if(this.textures.has(url))return this.textures.get(url);
    const t=new THREE.TextureLoader().load(url);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;
    this.textures.set(url,t);return t;
  }
  canvasTexture(key,w,h,draw){
    if(this.textures.has(key))return this.textures.get(key);
    const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
    const t=new this.THREE.CanvasTexture(c);t.colorSpace=this.THREE.SRGBColorSpace;this.textures.set(key,t);return t;
  }
  // Camera-plane coordinates of a world point (ortho: equal units on both screen axes).
  planeAngle(a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,r=dx*this.right.x+dy*this.right.y+dz*this.right.z,u=dx*this.up.x+dy*this.up.y+dz*this.up.z;return{angle:Math.atan2(u,r),length:Math.hypot(r,u)};}
  now(){return this.stage.clock;}

  // ---- Framing -------------------------------------------------------------------------
  // Fit the playable band (spawn line .. wall foot) between the HUD capsule and the roster
  // instead of a fixed span that left a dead floor strip under the wall.
  frame(w,h){
    const cam=this.stage.camera;if(!cam.isOrthographicCamera||innerWidth<=700)return;
    const fit=this.fitBand(w,h);if(!fit)return;
    const {top,bottom,span}=fit;cam.top=top;cam.bottom=bottom;cam.left=-span*w/h/2;cam.right=span*w/h/2;
    this.frameKey=fit.key;
  }
  fitBand(w,h){
    const stage=this.stage,cam=stage.camera,base=stage.cameraBase||cam.position;
    const u=p=>(p.x-base.x)*this.up.x+(p.y-base.y)*this.up.y+(p.z-base.z)*this.up.z;
    const scene=document.getElementById('ss-scene')?.getBoundingClientRect();if(!scene||scene.height<10)return null;
    const hud=document.querySelector('.ss-host-top')?.getBoundingClientRect(),board=document.getElementById('ss-scoreboard')?.getBoundingClientRect();
    const k=Math.max(.55,Math.min(1.5,innerWidth/1280));
    const pxTop=Math.max(0,(hud&&hud.height?hud.bottom-scene.top:h*.14))+14*k;
    const pxBottom=(board&&board.height&&board.top-scene.top>h*.5?board.top-scene.top:h*.88)-10*k;
    const wall=stage.wallGroup?.children?.[0],wallFoot=wall?u(wall.position)-.35:-6.2;
    const spawn=u(new this.THREE.Vector3(0,.6,-28));
    if(pxBottom-pxTop<h*.35)return null;
    let span=(spawn-wallFoot)*h/(pxBottom-pxTop);
    span=Math.max(span,40*h/w,22);span=Math.min(span,52);
    // Anchor the wall foot to the roster edge; extra span (narrow screens) opens above the spawn.
    const bottom=wallFoot-(h-pxBottom)*span/h,top=bottom+span;
    return{top,bottom,span,key:[w,h,Math.round(pxTop),Math.round(pxBottom)].join(':')};
  }
  refit(){
    const el=this.stage.renderer.domElement,w=el.clientWidth||1,h=el.clientHeight||1,fit=this.fitBand(w,h);
    if(!fit||fit.key===this.frameKey)return;
    this.frame(w,h);const cam=this.stage.camera;cam.updateProjectionMatrix();
    const scale=Math.max(.55,Math.min(1.5,innerWidth/1280));
    for(const bubble of this.stage.identityBubbles||[]){const hh=24*scale*(cam.top-cam.bottom)/h;bubble.scale.set(hh*1.5,hh,1);}
    this.turrets.relabel();
  }

  // ---- Hooks from host.js ----------------------------------------------------------------
  // The host must never lose its own feedback because of this layer: failures are contained.
  update(s,dt){try{this.updateInner(s,dt);}catch(error){this.fail(error);}}
  effect(e,s){try{this.effectInner(e,s);}catch(error){this.fail(error);}}
  fail(error){if(!this.failed){this.failed=true;console.warn('Swarm FX error',error);}(window.__swarmErrors||=[]).length<20&&window.__swarmErrors.push(String(error?.stack||error).slice(0,400));}
  updateInner(s,dt){
    const t=performance.now();if(t>this.frameCheckAt){this.frameCheckAt=t+900;this.refit();}
    this.turrets.update(s,dt);this.impacts.update(dt);this.ambience.update(s,dt);
  }
  effectInner(e,s){
    if(e.kind==='shot'){
      const p=s.players.find(p=>p.id===e.player);if(!p)return;
      const from=e.source==='pulse'?null:this.turrets.muzzleFor(p.id);
      const to=new this.THREE.Vector3(e.x,.68,e.z);
      // Same flight time as the host projectile, so kill juice lands with the shell.
      const flight=e.source==='pulse'||!from?0:Math.max(.055,Math.min(.18,from.distanceTo(to)/100));
      if(from){this.turrets.fired(p.id,s);this.impacts.tracer(from,to,p.color,flight,!!e.hit);}
      if(e.dead)this.impacts.kill(e,p,flight,e.source==='pulse');
      else if(e.hit)this.impacts.hit(to,flight,e.targetKind);
      else if(from)this.impacts.miss(to,flight);
    }else if(e.kind==='pulse')this.impacts.pulse(e);
    else if(e.kind==='wave')this.ambience.waveStart(e,s);
    else if(e.kind==='repair')this.ambience.waveClear(e,s);
  }
  muzzle(turret){return this.turrets.muzzleForGroup(turret);}
  stats(){return{turrets:this.turrets.count(),...this.impacts.stats(),...this.ambience.stats()};}
}
