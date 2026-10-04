// Pocket Siege toy tank (TV renderer only). Pure drawing: geometry comes from
// the shared gun pose, so the drawn muzzle stays where the simulation fires.
// The turret dome is drawn after the barrel and is angle-independent, so the
// barrel never paints over the turret centre.
const TAU=Math.PI*2;
const tone=new Map();
export function shade(color,k){
 const key=color+k;let out=tone.get(key);if(out)return out;
 let m=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(color||''));if(!m){out=color||'#888';}
 else{let h=m[1];if(h.length===3)h=[...h].map(x=>x+x).join('');const v=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)),t=k>0?255:0,a=Math.abs(k);out='#'+v.map(x=>Math.round(x+(t-x)*a).toString(16).padStart(2,'0')).join('');}
 if(tone.size>256)tone.clear();tone.set(key,out);return out;
}
function hullPath(c){c.beginPath();c.moveTo(-21,-3.5);c.lineTo(-16.5,-10.5);c.quadraticCurveTo(-15,-12.6,-12,-12.6);c.lineTo(12,-12.6);c.quadraticCurveTo(15,-12.6,16.5,-10.5);c.lineTo(21.5,-3.5);c.closePath();}
// o: {x,y,tilt,color,pivot,end,dir,recoilKick,fx:{bob,sx,sy,dx,flash},wheel,crown,battered,clock}
export function drawToyTank(c,o){
 const {x,y,tilt,color,pivot,end,dir}=o,fx=o.fx||{},ink='#150c22',light=shade(color,.42),mid=color,dark=shade(color,-.45);
 c.save();c.translate(fx.dx||0,fx.bob||0);
 // Soft contact shadow.
 c.save();c.translate(x,y);c.rotate(tilt);c.fillStyle='rgba(10,4,18,.45)';c.beginPath();c.ellipse(0,9.5,27,4.6,0,0,TAU);c.fill();c.restore();
 // Barrel in world space: ink outline, metal body, team band and muzzle cap.
 const ex=end.x,ey=end.y,nx=-dir.y,ny=dir.x;c.lineCap='round';
 c.strokeStyle=ink;c.lineWidth=7.2;c.beginPath();c.moveTo(pivot.x,pivot.y);c.lineTo(ex,ey);c.stroke();
 c.strokeStyle='#bdb6cf';c.lineWidth=4.4;c.beginPath();c.moveTo(pivot.x,pivot.y);c.lineTo(ex,ey);c.stroke();
 c.strokeStyle='#f4f0ff';c.lineWidth=1.3;c.beginPath();c.moveTo(pivot.x-nx*1,pivot.y-ny*1);c.lineTo(ex-nx*1-dir.x*2,ey-ny*1-dir.y*2);c.stroke();
 c.lineCap='butt';c.strokeStyle=ink;c.lineWidth=7.6;c.beginPath();c.moveTo(ex-dir.x*7.5,ey-dir.y*7.5);c.lineTo(ex+dir.x*.6,ey+dir.y*.6);c.stroke();
 c.strokeStyle=mid;c.lineWidth=5.4;c.beginPath();c.moveTo(ex-dir.x*6.8,ey-dir.y*6.8);c.lineTo(ex-dir.x*3.2,ey-dir.y*3.2);c.stroke();
 c.strokeStyle='#d9d3e6';c.beginPath();c.moveTo(ex-dir.x*2.6,ey-dir.y*2.6);c.lineTo(ex,ey);c.stroke();
 c.lineCap='round';
 // Hull in the tilt frame, a touch larger than the hitbox so it reads on TV;
 // hit squash pivots on the tread contact line.
 c.save();c.translate(x,y);c.rotate(tilt);c.translate(0,8);c.scale(1.12,1.12);c.translate(0,-8);
 if(o.recoilKick){c.translate(-Math.sign(dir.x||1)*o.recoilKick*1.6,0);c.scale(1+.05*o.recoilKick,1-.09*o.recoilKick);}
 if(fx.sx&&(fx.sx!==1||fx.sy!==1)){c.translate(0,9);c.scale(fx.sx,fx.sy);c.translate(0,-9);}
 // Tread: rounded pill, rolling wheels and moving links.
 c.fillStyle=ink;c.beginPath();c.roundRect(-24,-4.2,48,14.4,7.2);c.fill();
 c.fillStyle='#3a3350';c.beginPath();c.roundRect(-22.4,-2.6,44.8,11.2,5.6);c.fill();
 const roll=(o.wheel||0)/3.4,links=(((o.wheel||0)%5)+5)%5;
 c.fillStyle='#5b5274';for(let lx=-20+links;lx<20;lx+=5)c.fillRect(lx,-2.6,2,1.6);
 for(let i=0;i<5;i++){const wx=-16+i*8;c.fillStyle='#71688c';c.beginPath();c.arc(wx,3.4,3.5,0,TAU);c.fill();c.fillStyle='#2a2440';c.beginPath();c.arc(wx,3.4,1.9,0,TAU);c.fill();c.strokeStyle='#cfc8e2';c.lineWidth=.9;c.beginPath();c.moveTo(wx+Math.cos(roll)*2.8,3.4+Math.sin(roll)*2.8);c.lineTo(wx-Math.cos(roll)*2.8,3.4-Math.sin(roll)*2.8);c.stroke();}
 // Body.
 const g=c.createLinearGradient(0,-13,0,-3);g.addColorStop(0,light);g.addColorStop(.45,mid);g.addColorStop(1,dark);
 hullPath(c);c.fillStyle=g;c.fill();c.lineWidth=1.6;c.strokeStyle=ink;c.lineJoin='round';c.stroke();
 c.fillStyle=shade(color,-.6);c.fillRect(-21,-5,42.5,2);
 c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1.3;c.beginPath();c.moveTo(-12.5,-11.2);c.lineTo(11.5,-11.2);c.stroke();
 c.fillStyle=shade(color,-.3);for(const rx of [-14,14]){c.beginPath();c.arc(rx,-7.5,1.1,0,TAU);c.fill();}
 // Turret dome (covers the barrel root and the pivot).
 const d=c.createRadialGradient(-3.2,-17.2,1,0,-13,10.5);d.addColorStop(0,shade(color,.65));d.addColorStop(.35,light);d.addColorStop(.8,mid);d.addColorStop(1,dark);
 c.beginPath();c.arc(0,-13,9.6,0,TAU);c.fillStyle=d;c.fill();c.lineWidth=1.6;c.strokeStyle=ink;c.stroke();
 c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.ellipse(-3.6,-17.4,2.6,1.4,-.5,0,TAU);c.fill();
 c.fillStyle=shade(color,-.55);c.beginPath();c.ellipse(1.5,-21.3,3.2,1.3,0,0,TAU);c.fill();
 if(fx.flash){c.globalAlpha=fx.flash*.85;hullPath(c);c.fillStyle='#fff8e8';c.fill();c.beginPath();c.arc(0,-13,9.6,0,TAU);c.fill();c.globalAlpha=1;}
 c.restore();
 // Battered tanks wear soot.
 if(o.battered){c.save();c.translate(x,y);c.rotate(tilt);c.globalAlpha=Math.min(.5,o.battered*.5);c.fillStyle='#1a1018';c.beginPath();c.ellipse(-8,-8,6,3,.3,0,TAU);c.ellipse(9,-6,4,2.2,-.2,0,TAU);c.fill();c.restore();}
 // Leader crown.
 if(o.crown){const cy=y-34+(o.crownBob||0);c.save();c.translate(x,cy);c.fillStyle=ink;c.beginPath();c.moveTo(-8.5,4.5);c.lineTo(-9.5,-5);c.lineTo(-4.5,-.5);c.lineTo(0,-7.5);c.lineTo(4.5,-.5);c.lineTo(9.5,-5);c.lineTo(8.5,4.5);c.closePath();c.fill();
  const cg=c.createLinearGradient(0,-6,0,4);cg.addColorStop(0,'#fff1a8');cg.addColorStop(1,'#f0a92c');c.fillStyle=cg;c.beginPath();c.moveTo(-7,3.2);c.lineTo(-7.8,-2.8);c.lineTo(-4,.8);c.lineTo(0,-5.4);c.lineTo(4,.8);c.lineTo(7.8,-2.8);c.lineTo(7,3.2);c.closePath();c.fill();c.fillStyle='#ff5f8f';c.beginPath();c.arc(0,1,1.3,0,TAU);c.fill();c.restore();}
 c.restore();
}
