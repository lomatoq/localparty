/* Shared by the authoritative simulation and Canvas renderer. No DOM dependency.
 * Screen axes: +x right, +y down; aim degrees: 0 right, 90 up, 180 left.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ArcadeGeometry=api;})(globalThis,function(){
 'use strict';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const finite=(x,d=0)=>Number.isFinite(x)?x:d;
 const G=350,DT=1/120,BARREL=28,PIVOT_Y=-13;
 function pivot(p){const tilt=finite(p.surfaceAngle);return {x:p.x-Math.sin(tilt)*PIVOT_Y,y:p.y+Math.cos(tilt)*PIVOT_Y};}
 function direction(angle){const a=finite(angle,45)*Math.PI/180;return {x:Math.cos(a),y:-Math.sin(a)};}
 function gunPose(p){const center=pivot(p),dir=direction(p.angle);return {pivot:center,dir,muzzle:{x:center.x+BARREL*dir.x,y:center.y+BARREL*dir.y}};}
 function aimAngle(p,target){const o=pivot(p),dx=target.x-o.x,dy=o.y-target.y;if(Math.hypot(dx,dy)<.001)return finite(p.angle,45);return clamp(Math.atan2(Math.max(0,dy),dx)*180/Math.PI,3,177);}
 function launch(p,w={}){const pose=gunPose(p),v=(200+clamp(finite(p.power,65),8,100)*5.2)*finite(w.speed,1);return {x:pose.muzzle.x,y:pose.muzzle.y,vx:pose.dir.x*v,vy:pose.dir.y*v};}
 function integrate(b,wind,dt=DT,gravity=G){b.vx+=finite(wind)*dt;b.vy+=gravity*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;return b;}
 function preview(p,w,wind,seconds=.65){const b=launch(p,w),points=[{x:b.x,y:b.y}];for(let i=0;i<Math.floor(seconds/DT);i++){integrate(b,wind,DT,w?.gravity===0?0:G);if(i%6===5)points.push({x:b.x,y:b.y});}return points;}
 // Exact first segment/circle intersection; the old closest-point test could
 // pick the wrong object and award hits through terrain.
 function circleHit(ax,ay,bx,by,cx,cy,r){const dx=bx-ax,dy=by-ay,ox=ax-cx,oy=ay-cy,A=dx*dx+dy*dy,C=ox*ox+oy*oy-r*r;if(C<=0)return 0;if(A<1e-12)return null;const B=2*(ox*dx+oy*dy),disc=B*B-4*A*C;if(disc<0)return null;const t=(-B-Math.sqrt(disc))/(2*A);return t>=0&&t<=1?t:null;}
 function surfaceAt(h,x,dx=2){const q=clamp(x/dx,0,h.length-1),i=Math.floor(q);return h[i]+(h[Math.min(h.length-1,i+1)]-h[i])*(q-i);}
 // Fit a support line under the entire 36px track, then lift the chassis
 // enough that no contact sample penetrates terrain (including a small hump).
 function support(h,x){const half=18;let slope=(surfaceAt(h,x+half)-surfaceAt(h,x-half))/(2*half),angle=clamp(Math.atan(slope),-1.15,1.15);slope=Math.tan(angle);let intercept=Infinity,contactX=x;const reach=half*Math.cos(angle);for(let u=-reach-8*Math.sin(angle);u<=reach-8*Math.sin(angle)+.01;u+=Math.max(.5,reach/18)){const y=surfaceAt(h,x+u)-slope*u;if(y<intercept){intercept=y;contactX=x+u;}}const y=intercept-8/Math.cos(angle);return {x,y,angle,contactX};}
 return {G,DT,BARREL,PIVOT_Y,clamp,pivot,direction,gunPose,aimAngle,launch,integrate,preview,circleHit,surfaceAt,support};
});
