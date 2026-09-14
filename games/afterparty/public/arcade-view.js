import {clamp,damp,BoundedEffects} from './motion.js';
const colours=['#aa72e5','#e994ad','#72c6b0','#92bbdf'];
function rounded(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
function ellipse(c,x,y,rx,ry,fill){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);c.fill();}
export class ArcadeView {
 constructor(container,mode){this.container=container;this.mode=mode;this.canvas=document.createElement('canvas');this.ctx=this.canvas.getContext('2d');container.append(this.canvas);this.canvas.setAttribute('aria-label',mode==='gate_siege'?'Командная оборона ворот':'Тир с укрытиями');this.bg=document.createElement('canvas');this.sprites=new Map();this.cursors=new Map();this.previous=new Map();this.fx=new BoundedEffects(240);this.seen=0;this.elapsed=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();}
 resize(){const b=this.container.getBoundingClientRect();this.w=Math.max(1,Math.round(b.width));this.h=Math.max(1,Math.round(b.height));this.d=Math.min(devicePixelRatio||1,1.5);this.canvas.width=Math.round(this.w*this.d);this.canvas.height=Math.round(this.h*this.d);this.ctx.setTransform(this.d,0,0,this.d,0,0);this.bg.width=this.canvas.width;this.bg.height=this.canvas.height;this.background();}
 point(x,z){const pad=Math.max(24,this.w*.04);return{x:pad+(x+22)/44*(this.w-pad*2),y:50+(z+(this.mode==='gate_siege'?38:16))/(this.mode==='gate_siege'?46:32)*(this.h-95)};}
 get sx(){return (this.w-Math.max(24,this.w*.04)*2)/44;}
 get sz(){return(this.h-95)/(this.mode==='gate_siege'?46:32);}
 background(){
  const c=this.bg.getContext('2d');c.setTransform(this.d,0,0,this.d,0,0);const w=this.w,h=this.h,gate=this.mode==='gate_siege';
  const grd=c.createLinearGradient(0,0,0,h);grd.addColorStop(0,gate?'#253047':'#332647');grd.addColorStop(1,gate?'#354c57':'#4e5363');c.fillStyle=grd;c.fillRect(0,0,w,h);
  // Authored floor plates and pathways, cached until viewport dimensions change.
  for(let row=0;row<12;row++)for(let col=-1;col<16;col++){const x=col*w/15+(row%2)*w/30,y=42+row*(h-45)/12;c.fillStyle=(row+col)%3===0?'rgba(162,184,201,.055)':'rgba(15,25,46,.12)';rounded(c,x+2,y+2,w/15-4,(h-45)/12-4,4);c.fill();}
  c.strokeStyle='#7da8b41d';c.lineWidth=2;for(const x of [w*.1,w*.9]){c.beginPath();c.moveTo(x,70);c.lineTo(x,h-45);c.stroke();}
  if(gate){
   const wall=this.point(0,0).y,doorW=5.4*this.sx,doorH=Math.min(100,this.h*.17),left=w/2-doorW/2;
   c.fillStyle='#152230';c.fillRect(0,wall-35,w,80);c.fillStyle='#8194a4';c.fillRect(0,wall-43,w,12);
   for(let row=0;row<2;row++)for(let x=-50;x<w+50;x+=56){const xx=x+(row%2)*28;if(xx>left-18&&xx<left+doorW)continue;c.fillStyle=row?'#52647a':'#60768a';rounded(c,xx,wall-27+row*32,51,28,5);c.fill();c.strokeStyle='#9eabb633';c.stroke();}
   for(let x=12;x<w;x+=63){if(Math.abs(x-w/2)<doorW*.7)continue;c.fillStyle='#899dac';rounded(c,x,wall-62,38,27,4);c.fill();c.fillStyle='#b2c3cd';c.fillRect(x+3,wall-62,32,3);}
   for(const sign of [-1,1]){const x=w/2+sign*(doorW*.5+12);c.fillStyle='#a2b1bf';rounded(c,x-10,wall-doorH,20,doorH+47,4);c.fill();c.fillStyle='#9270be';c.fillRect(x-6,wall-doorH+8,12,doorH-12);}
   c.fillStyle='#182230';rounded(c,left-2,wall-doorH-4,doorW+4,doorH+42,8);c.fill();
   const wood=c.createLinearGradient(left,0,left+doorW,0);wood.addColorStop(0,'#765148');wood.addColorStop(.5,'#bf9268');wood.addColorStop(1,'#805953');c.fillStyle=wood;rounded(c,left+3,wall-doorH+4,doorW-6,doorH+32,5);c.fill();
   for(let i=1;i<9;i++){c.strokeStyle='#53384477';c.beginPath();c.moveTo(left+i*doorW/9,wall-doorH+8);c.lineTo(left+i*doorW/9,wall+30);c.stroke();}
   for(const y of [wall-doorH+18,wall+5]){c.fillStyle='#4c4560';c.fillRect(left+4,y,doorW-8,9);for(let x=left+14;x<left+doorW;x+=20)ellipse(c,x,y+4.5,2,2,'#dabb7e');}
   c.fillStyle='#a380d9';c.fillRect(left-7,wall-doorH-9,doorW+14,5);
   for(const sign of [-1,1])for(let j=0;j<3;j++){const x=w/2+sign*(doorW*.7+100+j*130);ellipse(c,x,wall-83,3,3,'#a4edd4');c.fillStyle='#9bdccb18';c.fillRect(x-1,wall-82,2,10);}
  }else{
   // Velvet carnival header, scalloped awning, fairylights, and three booth rows.
   c.fillStyle='#211f36';c.fillRect(0,0,w,45);for(let x=0;x<w;x+=46){c.fillStyle=Math.floor(x/46)%2?'#796095':'#bc886a';c.beginPath();c.moveTo(x,0);c.lineTo(x+46,0);c.lineTo(x+40,31);c.quadraticCurveTo(x+23,44,x+6,31);c.closePath();c.fill();}
   c.strokeStyle='#bea9cf';c.lineWidth=1.5;c.beginPath();c.moveTo(0,10);c.quadraticCurveTo(w*.5,69,w,10);c.stroke();
   for(let i=0;i<18;i++){const t=i/17,x=t*w,y=10+100*t*(1-t);ellipse(c,x,y,8,8,'#ffdc8a17');ellipse(c,x,y,3.3,4,'#ffe0a4');}
   for(const z of [-9,-1,7]){const y=this.point(0,z).y+this.sz*1.65;c.fillStyle='#17233155';c.fillRect(0,y,w,this.sz*.8);c.fillStyle='#ad83bd33';c.fillRect(0,y,w,2);}
  }
 }
 sprite(kind,friendly=false){const key=kind+':'+friendly;if(this.sprites.has(key))return this.sprites.get(key);const cv=document.createElement('canvas');cv.width=cv.height=160;const c=cv.getContext('2d');c.translate(80,80);
  if(kind==='bug'||kind==='elite'){
   const elite=kind==='elite';ellipse(c,0,14,42,49,'#10152235');const body=c.createLinearGradient(-40,0,40,0);body.addColorStop(0,elite?'#70509c':'#dcc6a2');body.addColorStop(.45,elite?'#c5a1e7':'#fff1ce');body.addColorStop(1,elite?'#735ba1':'#bca68c');
   for(let i=0;i<6;i++){const side=i%2?1:-1,z=Math.floor(i/2)*19-8;c.strokeStyle=elite?'#9479ae':'#c07656';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(side*20,z);c.lineTo(side*41,z+7);c.lineTo(side*50,z+21);c.stroke();}
   ellipse(c,0,11,29,43,body);for(const y of [-4,10,24]){c.strokeStyle=elite?'#765a964c':'#b6917670';c.lineWidth=2;c.beginPath();c.ellipse(0,y,28,8,0,0,Math.PI);c.stroke();}
   ellipse(c,0,-30,28,25,elite?'#b389d9':'#eaa16e');for(const side of [-1,1]){c.strokeStyle='#d7b185';c.lineWidth=4;c.beginPath();c.moveTo(side*13,-49);c.quadraticCurveTo(side*27,-69,side*39,-66);c.stroke();ellipse(c,side*16,-32,12,14,'#292338');ellipse(c,side*19,-38,3.5,4,'#fff3df');}
   if(elite){c.strokeStyle='#e9c07a';c.lineWidth=4;c.beginPath();c.moveTo(-26,5);c.lineTo(0,15);c.lineTo(26,5);c.stroke();}
  }else{
   const col=friendly?'#f2ce70':colours[kind%4];ellipse(c,0,57,43,11,'#11182d55');
   const body=c.createRadialGradient(-20,-25,5,0,0,78);body.addColorStop(0,kind===0&&!friendly?'#fffbe9':col);body.addColorStop(1,kind===0&&!friendly?'#c3b3cd':col);
   ellipse(c,0,4,47,54,body);ellipse(c,-37,12,14,25,col);ellipse(c,37,12,14,25,col);
   if(kind===0){for(const [x,y,r]of [[-12,-48,13],[0,-58,15],[14,-51,12]])ellipse(c,x,y,r,r,'#df6c86');c.fillStyle='#f5b866';c.beginPath();c.moveTo(-13,7);c.lineTo(0,23);c.lineTo(15,7);c.closePath();c.fill();}
   if(kind===1){rounded(c,-42,-52,84,10,5);c.fillStyle='#7c52a2';c.fill();rounded(c,-27,-78,54,28,8);c.fillStyle='#a084cd';c.fill();c.fillStyle='#e4be75';c.fillRect(-26,-57,52,6);ellipse(c,0,10,25,17,'#e7a4b7');for(const x of [-9,9])ellipse(c,x,9,5,7,'#98576e');}
   if(kind===2){for(const side of [-1,1]){c.fillStyle=col;rounded(c,side*40-10,-30,19,50,8);c.fill();ellipse(c,side*39,-32,10,14,col);}c.strokeStyle='#4f9786';c.lineWidth=2;for(const x of [-25,0,25]){c.beginPath();c.moveTo(x,-37);c.lineTo(x,45);c.stroke();}}
   if(kind===3){c.fillStyle='#687cb2';rounded(c,-46,-46,92,92,18);c.fill();c.fillStyle='#c4d7ef';rounded(c,-40,-35,80,49,12);c.fill();c.strokeStyle='#d9be7c';c.lineWidth=5;c.beginPath();c.moveTo(0,-45);c.lineTo(0,-64);c.stroke();ellipse(c,0,-65,7,7,'#b07ce4');}
   for(const side of [-1,1]){ellipse(c,side*19,-16,16,20,'#fff9ed');ellipse(c,side*18,-12,7.3,11,'#292337');ellipse(c,side*18-2,-16,2.4,3,'#ffffff');}
   if(kind===2){for(const side of [-1,1]){ellipse(c,side*12,10,15,7,'#625047');} }
   if(friendly){c.strokeStyle='#eddec0';c.lineWidth=4;c.beginPath();c.moveTo(50,34);c.lineTo(50,-68);c.stroke();c.fillStyle='#fff9e8';c.beginPath();c.moveTo(51,-68);c.quadraticCurveTo(68,-77,78,-63);c.lineTo(78,-38);c.quadraticCurveTo(65,-48,51,-41);c.closePath();c.fill();}
  }
  this.sprites.set(key,cv);return cv;
 }
 cover(c,o){const p=this.point(o.x,o.z),w=o.w*this.sx,h=o.d*this.sz,x=p.x-w/2,y=p.y-h/2;
  c.fillStyle='#141c2b44';rounded(c,x+4,y+6,w,h,5);c.fill();const grad=c.createLinearGradient(x,y,x+w,y+h);grad.addColorStop(0,['#b39172','#8071a4','#759ca7'][o.id%3]);grad.addColorStop(1,['#785b57','#544967','#456779'][o.id%3]);c.fillStyle=grad;rounded(c,x,y,w,h,6);c.fill();c.strokeStyle='#e8d2b43d';c.lineWidth=1;c.stroke();
  c.save();rounded(c,x,y,w,h,6);c.clip();c.strokeStyle='#302c4159';for(let i=1;i<5;i++){c.beginPath();c.moveTo(x+w*i/5,y+3);c.lineTo(x+w*i/5,y+h-3);c.stroke();}c.strokeStyle='#dbc39c';c.lineWidth=4;c.beginPath();c.moveTo(x+2,y+h-3);c.lineTo(x+w-2,y+3);c.stroke();c.restore();
  c.fillStyle='#d5b384';rounded(c,x-2,y-3,w+4,6,3);c.fill();for(const dx of [6,w-6])for(const dy of [7,h-7])ellipse(c,x+dx,y+dy,2.6,2.6,'#353646');
 }
 turret(c,p,t){const base=this.point(p.towerX,3.3),to=this.point(p.aim?.x||0,p.aim?.z||-18),radius=clamp(this.sx*.75,12,24),firing=(t-p.lastShot)<.13,theta=Math.atan2(to.y-base.y,to.x-base.x);
  ellipse(c,base.x,base.y+7,radius*1.35,radius*.75,'#0f182b66');ellipse(c,base.x,base.y,radius*1.17,radius*.77,'#8f9daa');ellipse(c,base.x,base.y-3,radius,radius*.72,'#574867');
  c.save();c.translate(base.x,base.y-7);c.rotate(theta);const kick=firing&&!this.reduced?-4:0;c.fillStyle='#252e41';rounded(c,kick,-radius*.34,radius*2,radius*.68,4);c.fill();c.fillStyle=p.color;rounded(c,radius*.9+kick,-radius*.31,radius*.95,radius*.62,4);c.fill();c.fillStyle='#edc582';c.fillRect(radius*1.55+kick,-radius*.34,4,radius*.68);ellipse(c,0,0,radius*.64,radius*.62,p.color);
  if(firing){c.fillStyle='#ffe6a1';c.beginPath();c.moveTo(radius*1.95,-6);c.lineTo(radius*2.65,0);c.lineTo(radius*1.95,6);c.fill();}c.restore();
  if(p.heat>.04){c.strokeStyle=p.overheatUntil>t?'#f38b91':p.color;c.lineWidth=3;c.beginPath();c.arc(base.x,base.y-6,radius+6,-Math.PI/2,-Math.PI/2+Math.PI*2*p.heat);c.stroke();}
  this.label(c,String(this.state.players.indexOf(p)+1),base.x,base.y+radius+13,p.color);
 }
 label(c,text,x,y,color){c.font='700 11px Rubik,system-ui,sans-serif';c.textAlign='center';const w=c.measureText(text).width+12;c.fillStyle='#101c2be8';rounded(c,x-w/2,y-10,w,19,7);c.fill();c.fillStyle=color;c.fillText(text,x,y+3);}
 setState(s){this.state=s;for(const e of s.effects||[]){if(e.id<=this.seen)continue;this.seen=e.id;this.fx.add({kind:'shot',...e,age:0,life:.19});if(e.hit&&!this.reduced)for(let i=0;i<(e.killed?9:4);i++)this.fx.add({kind:'chip',x:e.x,z:e.z,vx:(Math.random()-.5)*5,vz:(Math.random()-.5)*5,age:0,life:.3+Math.random()*.25,color:e.friendly?'#f6cb77':'#c1adf5',size:2+Math.random()*3});if(e.points)this.fx.add({kind:'score',x:e.x,z:e.z,points:e.points,age:0,life:.7});}}
 clear(){this.previous.clear();this.cursors.clear();this.fx.clear();this.seen=0;}
 update(dt,now,paused){if(!this.state)return;dt=paused?0:Math.min(dt,.08);this.elapsed+=dt;const s=this.state,c=this.ctx;c.clearRect(0,0,this.w,this.h);c.drawImage(this.bg,0,0,this.w,this.h);this.fx.tick(dt);
  const entities=s.entities||[],used=new Set();for(const e of entities){used.add(e.id);let p=this.previous.get(e.id);if(!p){p={x:e.x,z:e.z};this.previous.set(e.id,p);}p.x=damp(p.x,e.x,30,dt||.001);p.z=damp(p.z,e.z,30,dt||.001);if(e.visible===false)continue;const at=this.point(p.x,p.z),bug=this.mode==='gate_siege';const size=bug?this.sx*(e.elite?2.1:1.55):this.sx*2.15;
   c.save();c.translate(at.x,at.y);if(bug){const angle=Math.atan2(Math.sin(e.seed)*2.15-e.x,-1.9-e.z);c.rotate(-angle+Math.PI);}
   else if(!this.reduced)c.rotate(Math.sin(this.elapsed*6+e.seed)*.035);
   c.drawImage(this.sprite(bug?(e.elite?'elite':'bug'):e.kind,!!e.friendly),-size/2,-size/2,size,size);if(e.flash>s.time){c.globalCompositeOperation='screen';c.globalAlpha=.45;c.drawImage(this.sprite(bug?(e.elite?'elite':'bug'):e.kind,!!e.friendly),-size/2,-size/2,size,size);}c.restore();
  }
  for(const id of this.previous.keys())if(!used.has(id))this.previous.delete(id);
  if(this.mode==='pop_shots')for(const o of s.obstacles||[])this.cover(c,o);else{
   const wall=this.point(0,0).y;
   if(s.hp<s.maxHp*.55){const k=1-s.hp/s.maxHp;c.strokeStyle='#372338';c.lineWidth=2+k*2;c.beginPath();c.moveTo(this.w/2-20,wall-65);c.lineTo(this.w/2+3,wall-39);c.lineTo(this.w/2-9,wall-20);c.lineTo(this.w/2+19,wall+14);c.stroke();}
   if(s.hp<s.maxHp*.25){c.fillStyle='#ed747917';c.fillRect(this.w*.40,wall-95,this.w*.2,135);}
   for(const p of s.players)if(Number.isFinite(p.towerX))this.turret(c,p,s.time);
  }
  for(const e of this.fx.items){const p=this.point(e.x,e.z),k=1-e.age/e.life;c.globalAlpha=k;
   if(e.kind==='shot'){const who=s.players.find(p=>p.id===e.owner);c.strokeStyle=who?.color||'#e7dcff';c.lineWidth=e.boost?3:2;if(this.mode==='gate_siege'){const from=this.point(e.fromX,3.3);c.beginPath();c.moveTo(from.x,from.y-8);c.lineTo(p.x,p.y);c.stroke();}c.beginPath();c.arc(p.x,p.y,4+(1-k)*15,0,Math.PI*2);c.stroke();if(e.hit){c.beginPath();for(const side of [-1,1]){c.moveTo(p.x+side*5,p.y+side*5);c.lineTo(p.x+side*10,p.y+side*10);c.moveTo(p.x-side*5,p.y+side*5);c.lineTo(p.x-side*10,p.y+side*10);}c.stroke();}}
   else if(e.kind==='chip'){e.x+=e.vx*dt;e.z+=e.vz*dt;c.fillStyle=e.color;c.save();c.translate(p.x,p.y);c.rotate(e.age*9);c.fillRect(-e.size/2,-e.size/2,e.size*k,e.size*k);c.restore();}
   else{c.fillStyle=e.points>0?'#d8f5a5':'#ffaf9c';c.font='800 19px Rubik,system-ui';c.textAlign='center';c.fillText((e.points>0?'+':'')+e.points,p.x,p.y-18-e.age*30);}
  }c.globalAlpha=1;
  for(const [i,p]of s.players.entries()){if(!p.aim||!p.connected)continue;let cursor=this.cursors.get(p.id);if(!cursor){cursor={...p.aim};this.cursors.set(p.id,cursor);}cursor.x=damp(cursor.x,p.aim.x,32,dt||.001);cursor.z=damp(cursor.z,p.aim.z,32,dt||.001);const at=this.point(cursor.x,cursor.z);c.strokeStyle='#152132';c.lineWidth=5;c.beginPath();c.arc(at.x,at.y,10,0,Math.PI*2);c.stroke();c.strokeStyle=p.color;c.lineWidth=2;c.beginPath();c.arc(at.x,at.y,10,0,Math.PI*2);for(const [dx,dy]of [[-17,0],[17,0],[0,-17],[0,17]]){c.moveTo(at.x+dx*.68,at.y+dy*.68);c.lineTo(at.x+dx,at.y+dy);}c.stroke();this.label(c,s.players.length>8?String(i+1):`${i+1} · ${p.name}`,at.x,at.y-26,p.color);}
  this.container.dataset.drawCalls='2d-cached';this.container.dataset.entities=String(entities.length);
 }
 setQuality(){} setOverview(){}
 dispose(){this.resizeObserver.disconnect();this.sprites.clear();this.container.replaceChildren();}
}
