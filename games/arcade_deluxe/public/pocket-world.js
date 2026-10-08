// Pocket Siege world art (TV renderer only): painterly night sky, clouds,
// stars, distant silhouettes, wind streaks, soil-strata terrain texture,
// grass/flower dressing on undisturbed ground and cooling crater embers.
// Everything is procedural, seeded and cached; animated layers run on the
// renderer's dt clock (0 while paused) so paused frames stay pixel-identical.
// Reads snapshots only; nothing is written back.
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const DEEP_SOIL='#2a1b24';
// Debris/crumb palette that matches the strata below.
export const SOIL_CHIPS=['#5fbf45','#7a5236','#8c6440','#6a4230','#3d3624','#9a7a52'];
const BANDS=[ // depth from the original surface → colour
 [0,null],[16,'#3d3a22'],[23,'#7a5236'],[50,'#8c6440'],[82,'#6b4330'],[122,'#58372d'],[172,'#472c2b'],[245,'#33212a']];
function seeded(id){let seed=(((id||1)*2654435761)^0x5bd1e995)>>>0;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const hash=i=>{let h=Math.imul(i^0x9e3779b9,0x85ebca6b)>>>0;h^=h>>>13;h=Math.imul(h,0xc2b2ae35)>>>0;h^=h>>>16;return (h>>>0)/4294967296;};
function cv(w,h){const e=document.createElement('canvas');e.width=w;e.height=h;return e;}

export class PocketWorld {
 constructor(reduced=false){this.reduced=reduced;this.clock=0;this.embers=[];this.wind=0;this.windShown=0;this.weatherWind=0;this.cloudDrift=0;this.streakDrift=0;}
 clear(){this.embers=[];}
 step(dt,wind){
  dt=Math.max(0,Number(dt)||0);this.clock+=dt;
  if(Number.isFinite(wind)){
   this.wind=wind;
   // Ballistic turn wind is not a new weather system. Ignore weak gusts and
   // small changes; a sustained substantial wind can steer the cloud decks.
   const target=clamp(wind,-20,20);
   if(Math.abs(target)>=6&&Math.abs(target-this.weatherWind)>=3)this.weatherWind=target;
  }
  // Integrate velocity, never elapsed time × the latest wind. Retargeting
  // preserves displacement and momentum, including across turn/round changes.
  const tau=18,k=1-Math.exp(-dt/tau),before=this.windShown;
  const windTravel=this.weatherWind*dt+(before-this.weatherWind)*tau*k;
  this.windShown=before+(this.weatherWind-before)*k;
  if(!this.reduced){this.cloudDrift+=4*dt+1.3*windTravel;this.streakDrift+=14*windTravel;}
  if(dt)this.embers=this.embers.filter(q=>this.clock-q.at<q.life);
 }

 // ---------- sky ----------
 buildSky(){
  const el=cv(1280,720),c=el.getContext('2d'),g=c.createLinearGradient(0,0,0,720);
  g.addColorStop(0,'#05061a');g.addColorStop(.3,'#0e0d2e');g.addColorStop(.52,'#211546');g.addColorStop(.68,'#3c1b5c');g.addColorStop(.8,'#5e2468');g.addColorStop(.9,'#7c3170');g.addColorStop(1,'#8f3d6e');
  c.fillStyle=g;c.fillRect(0,0,1280,720);
  const rand=seeded(4242);
  // Soft nebula washes (low alpha so shells stay the brightest things in the sky).
  for(const [x,y,r,col] of [[260,150,330,'#1d4f7a'],[820,90,380,'#4a1f6e'],[1120,260,300,'#6a2a6a'],[520,300,420,'#2b1d5e'],[60,330,260,'#46205a']]){const q=c.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,col+'55');q.addColorStop(.5,col+'22');q.addColorStop(1,col+'00');c.fillStyle=q;c.fillRect(x-r,y-r,r*2,r*2);}
  // Milky band of dust.
  c.save();c.translate(640,210);c.rotate(-.22);for(let i=0;i<260;i++){const x=(rand()-.5)*1500,y=(rand()-.5)*(60+rand()*60);c.globalAlpha=.05+rand()*.08;c.fillStyle=rand()<.5?'#c9b8ff':'#9fd2ff';c.beginPath();c.arc(x,y,.6+rand()*1.6,0,TAU);c.fill();}c.restore();
  // Static far stars, faint and tiny.
  for(let i=0;i<300;i++){const x=rand()*1280,y=rand()*rand()*560,a=.12+rand()*.42*(1-y/620);c.globalAlpha=a;c.fillStyle=rand()<.2?'#ffe9c4':rand()<.4?'#bfe0ff':'#e2dcff';const s=rand()<.08?1.6:rand()<.4?1.1:.7;c.beginPath();c.arc(x,y,s,0,TAU);c.fill();}
  c.globalAlpha=1;
  // Moon with craters and a soft halo.
  const mx=1010,my=112;let q=c.createRadialGradient(mx,my,10,mx,my,150);q.addColorStop(0,'#f6e7c855');q.addColorStop(.25,'#c9a8d633');q.addColorStop(1,'#c9a8d600');c.fillStyle=q;c.fillRect(mx-150,my-150,300,300);
  q=c.createRadialGradient(mx-9,my-10,4,mx,my,30);q.addColorStop(0,'#fff7e2');q.addColorStop(.7,'#ead8b8');q.addColorStop(1,'#c6abb0');c.fillStyle=q;c.beginPath();c.arc(mx,my,28,0,TAU);c.fill();
  for(const [dx,dy,r,a] of [[-8,6,6,.16],[9,-8,4,.13],[11,9,3.4,.12],[-3,-14,2.6,.12],[-15,-4,2.2,.1]]){c.globalAlpha=a;c.fillStyle='#7d6274';c.beginPath();c.arc(mx+dx,my+dy,r,0,TAU);c.fill();c.globalAlpha=a*.9;c.fillStyle='#fff8e6';c.beginPath();c.arc(mx+dx-.8,my+dy-.8,r*.55,0,TAU);c.fill();}
  c.globalAlpha=.32;c.fillStyle='#4a2f5c';c.beginPath();c.arc(mx,my,28,-.6,1.9);c.arc(mx-9,my-5,26,1.75,-.45,true);c.fill();c.globalAlpha=1;
  return el;
 }
 buildRidges(){
  const make=(seed,base,amp,top,bottom,rim,props)=>{const W=2200,H=900,el=cv(W,H),q=el.getContext('2d'),rand=seeded(seed),ph=[rand()*TAU,rand()*TAU,rand()*TAU],ys=[];
   for(let x=0;x<=W;x+=4)ys.push(base-amp*(.55*Math.sin(x/260+ph[0])+.3*Math.sin(x/97+ph[1])+.15*Math.sin(x/41+ph[2])));
   const at=x=>ys[clamp(Math.round(x/4),0,ys.length-1)];
   const path=()=>{q.beginPath();q.moveTo(0,H);ys.forEach((y,i)=>q.lineTo(i*4,y));q.lineTo(W,H);q.closePath();};
   // Silhouette props sit on the ridge line: pines, round trees, a far keep.
   q.fillStyle=top;
   for(let x=10;x<W;x+=6+rand()*22){const y=at(x)+2,h=props.tree*(.6+rand()*.8);if(rand()<.55){q.beginPath();q.moveTo(x-h*.32,y);q.lineTo(x,y-h);q.lineTo(x+h*.32,y);q.fill();}else{q.beginPath();q.arc(x,y-h*.45,h*.42,0,TAU);q.fill();q.fillRect(x-1,y-h*.3,2,h*.3);}}
   if(props.keep){for(const kx of props.keep){const y=at(kx)+4;q.fillRect(kx-26,y-34,52,34);q.fillRect(kx-34,y-52,16,52);q.fillRect(kx+18,y-58,16,58);for(let i=0;i<4;i++){q.fillRect(kx-34+i*5,y-57,3,5);q.fillRect(kx+18+i*5,y-63,3,5);}q.fillRect(kx-6,y-46,12,12);q.fillStyle=props.window;q.fillRect(kx+24,y-44,3,5);q.fillRect(kx-29,y-40,3,4);q.fillStyle=top;}}
   path();const g=q.createLinearGradient(0,base-amp,0,base+amp*2.4);g.addColorStop(0,top);g.addColorStop(.5,bottom);g.addColorStop(1,bottom+'00');q.fillStyle=g;q.fill();
   // Moonlit rim from the upper right.
   q.save();q.lineWidth=1;q.strokeStyle=rim;q.globalAlpha=.22;q.beginPath();ys.forEach((y,i)=>q[i?'lineTo':'moveTo'](i*4,y+.8));q.stroke();q.restore();
   return el;};
  return [make(31,400,74,'#2c1c55','#3a1f5e','#8f78c9',{tree:7}),make(57,452,58,'#21143f','#2f164c','#7a64b4',{tree:10,keep:[1480],window:'#ffcf7a'}),make(77,512,44,'#170c2d','#24103a','#6a5498',{tree:15})];
 }
 // Painterly cloud: soft brush dabs inside a flat-bottomed silhouette, dark
 // belly, moonlit crown. Built once.
 cloud(seed,w,h){const el=cv(w,h),c=el.getContext('2d'),rand=seeded(seed);
  const dab=(col)=>{const d=cv(64,64),q=d.getContext('2d'),g=q.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,col);g.addColorStop(.55,col+'b0');g.addColorStop(1,col+'00');q.fillStyle=g;q.fillRect(0,0,64,64);return d;};
  const belly=dab('#33285e'),body=dab('#5a4890'),crown=dab('#a993e6');
  const humps=[];const n=3+Math.floor(rand()*2);for(let i=0;i<n;i++){const t=(i+.5)/n;humps.push([w*(.18+t*.64)+(rand()-.5)*w*.06,h*(.18+rand()*.16),h*(.3+rand()*.12)*(1-Math.abs(t-.5)*.6)]);}
  const top=x=>{let y=h*.78;for(const [hx,hy,hr] of humps){const d=(x-hx)/hr;if(Math.abs(d)<1)y=Math.min(y,hy+hr*(1-Math.sqrt(1-d*d))+hr*.15);}return y;};
  for(let k=0;k<70;k++){const x=w*(.1+rand()*.8),y0=top(x),y=y0+rand()*(h*.8-y0),r=h*(.13+rand()*.12);c.globalAlpha=.55;c.drawImage(y>h*.6?belly:body,x-r,y-r,r*2,r*2);}
  for(let k=0;k<26;k++){const x=w*(.14+rand()*.72),y=top(x)+h*.06+rand()*h*.08,r=h*(.08+rand()*.08);c.globalAlpha=.42;c.drawImage(crown,x-r,y-r,r*2,r*2);}
  c.globalAlpha=1;c.globalCompositeOperation='destination-out';const b=c.createLinearGradient(0,h*.7,0,h*.86);b.addColorStop(0,'#0000');b.addColorStop(1,'#000f');c.fillStyle=b;c.fillRect(0,h*.7,w,h*.3);c.globalCompositeOperation='source-over';
  return el;}
 drawSky(c,cam){
  this.sky??=this.buildSky();this.ridges??=this.buildRidges();
  if(!this.clouds)this.clouds=[0,1,2,3,4,5].map(i=>this.cloud(900+i*17,180+i*28,64+i*8));
  c.drawImage(this.sky,0,0);
  // Twinkling stars with tiny cross flares (static under reduced motion).
  if(!this.twinkles){const r=seeded(777);this.twinkles=Array.from({length:26},()=>({x:r()*1280,y:20+r()*r()*360,p:r()*TAU,v:.5+r()*1.4,s:.8+r()*1.3,warm:r()<.3}));}
  c.save();for(const q of this.twinkles){const k=this.reduced?.7:.45+.55*Math.max(0,Math.sin(this.clock*q.v+q.p));c.globalAlpha=.55*k;c.fillStyle=q.warm?'#ffe7c2':'#dcd6ff';c.fillRect(q.x-q.s*2.2,q.y-.35,q.s*4.4,.7);c.fillRect(q.x-.35,q.y-q.s*2.2,.7,q.s*4.4);c.globalAlpha=.9*k;c.beginPath();c.arc(q.x,q.y,q.s*.7,0,TAU);c.fill();}c.restore();
  // A rare shooting star, only while someone is aiming, so it is never read as a shell.
  if(!this.reduced&&this.stage==='aim'){const P=13,n=Math.floor(this.clock/P),ph=this.clock-n*P;if(ph<.75&&n>0){const k=ph/.75,x0=180+hash(n*3+1)*760,y0=50+hash(n*5+2)*110,len=150,x=x0+k*260,y=y0+k*90,g=c.createLinearGradient(x-len,y-len*.35,x,y);g.addColorStop(0,'#ffffff00');g.addColorStop(1,'#fff6e0');c.save();c.globalAlpha=Math.sin(Math.PI*k)*.75;c.strokeStyle=g;c.lineWidth=1.6;c.lineCap='round';c.beginPath();c.moveTo(x-len,y-len*.35);c.lineTo(x,y);c.stroke();c.restore();}}
  const z=cam?.z||1,y=cam?.y||360,wind=this.windShown;
  // Two cloud decks drift with the wind: an in-world wind cue.
  const deck=(list,yBase,par,alpha,speed)=>{for(const [i,id] of list.entries()){const el=this.clouds[id],span=1280+el.width+160,x0=hash(id*31+i)*span,drift=this.cloudDrift*speed,x=((x0+drift)%span+span)%span-el.width-80,yy=yBase+hash(id*7+i)*60-(y-360)*par*z;c.globalAlpha=alpha;c.drawImage(el,x,yy);}};
  c.save();deck([0,2,4],190,.06,.42,.55);c.restore();
  for(const [i,el] of this.ridges.entries()){const depth=[.12,.2,.3][i],k=1+(z-1)*depth,dy=-(y-360)*depth*z;c.save();c.translate(640,360+dy);c.scale(k,k);c.drawImage(el,-1100,-360);c.restore();}
  // Horizon haze over the ridges.
  if(!this.haze){this.haze=cv(4,240);const q=this.haze.getContext('2d'),g=q.createLinearGradient(0,0,0,240);g.addColorStop(0,'#9a4a8000');g.addColorStop(.55,'#9a4a8030');g.addColorStop(1,'#9a4a8000');q.fillStyle=g;q.fillRect(0,0,4,240);}
  c.drawImage(this.haze,0,380-(y-360)*.25*z,1280,240);
  c.save();deck([1,3,5],110,.1,.62,1);c.restore();
  // Wind streaks share the integrated weather flow; new streaks fade in.
  const strength=this.reduced?0:Math.min(18,Math.abs(wind)*.9),n=Math.ceil(strength);
  if(n){c.save();c.lineCap='round';const dir=1;for(let i=0;i<n;i++){const h=hash(i*13+5),len=26+h*44,span=1280+len*2,x=((hash(i*3+1)*span+this.streakDrift*(.7+h*.6))%span+span)%span-len,yy=70+hash(i*11+2)*330,wob=Math.sin(this.clock*2+i)*3;const g=c.createLinearGradient(x,0,x+len*dir,0);g.addColorStop(0,'#dcd2ff00');g.addColorStop(.7,'#dcd2ff33');g.addColorStop(1,'#dcd2ff00');c.globalAlpha=clamp(strength-i,0,1);c.strokeStyle=g;c.lineWidth=1.3;c.beginPath();c.moveTo(x,yy+wob);c.quadraticCurveTo(x+len*dir*.5,yy+wob-2,x+len*dir,yy+wob);c.stroke();}c.restore();}
  c.globalAlpha=1;
 }

 // ---------- terrain art ----------
 // A full-size painted soil texture, built once per round from the original
 // surface profile; soil columns are then filled with it as a pattern, so a
 // terrain rebake costs no more than the old banded fill.
 art(s,cols,depth){
  // Original-ground origin of each column: the first segment that is not a
  // deposited material. Frozen per round so deposits/craters never shift strata.
  const origin=i=>{const st=s.terrainStrata?.[i],mat=s.terrainMaterials?.[i];if(st)for(let j=0;j<st.length;j++)if(!mat?.[j]&&Number.isFinite(st[j]))return st[j];return cols[i]?.[0]??depth;};
  const sig=String(s.roundSerial)+':'+depth+':'+cols.length;
  if(this.artSig===sig&&this.artCanvas)return this.artCanvas;
  this.artSig=sig;this.patternFor=null;const H=depth+170,el=this.artCanvas=cv(1280,H),c=el.getContext('2d'),n=cols.length,rand=seeded(1+(s.roundSerial|0)*7919);
  const o=Array.from({length:n},(_,i)=>origin(i)),wob=(x,k)=>3*Math.sin(x/37+k*1.7)+2*Math.sin(x/13+k*2.9)+1.2*Math.sin(x/5.3+k);
  this.origins=o;
  // Ground grown above the original surface (dirt weapons) reads as fresh turf.
  const fresh=c.createLinearGradient(0,0,0,H);fresh.addColorStop(0,'#5fae3e');fresh.addColorStop(1,'#3f8a36');c.fillStyle=fresh;c.fillRect(0,0,1280,H);
  if(!this.grassStrip){this.grassStrip=cv(1,20);const q=this.grassStrip.getContext('2d'),g=q.createLinearGradient(0,0,0,20);g.addColorStop(0,'#9ee865');g.addColorStop(.18,'#62c449');g.addColorStop(.6,'#3d9a3a');g.addColorStop(1,'#2c7833');q.fillStyle=g;q.fillRect(0,0,1,20);}
  for(let i=0;i<n;i++){const x=i*2,top=o[i];
   for(let k=1;k<BANDS.length;k++){const a=top+BANDS[k][0]+(k>1?wob(x,k):wob(x,k)*.4),b=k+1<BANDS.length?top+BANDS[k+1][0]+wob(x,k+1):H;c.fillStyle=BANDS[k][1];c.fillRect(x,Math.floor(a),2,Math.ceil(b-a)+1);}
   const gb=top+BANDS[1][0]+wob(x,1)*.4;c.drawImage(this.grassStrip,x,Math.floor(top),2,Math.ceil(gb-top)+1);
  }
  // Depth darkening, one stretched strip per column.
  if(!this.darkStrip){this.darkStrip=cv(1,64);const q=this.darkStrip.getContext('2d'),g=q.createLinearGradient(0,0,0,64);g.addColorStop(0,'#0e061400');g.addColorStop(1,'#0e0614c0');q.fillStyle=g;q.fillRect(0,0,1,64);}
  for(let i=0;i<n;i++)c.drawImage(this.darkStrip,i*2,o[i]+40,2,360);
  c.fillStyle='#0e0614c0';for(let i=0;i<n;i++)c.fillRect(i*2,o[i]+399,2,H);
  // Sediment lines that follow the original contour.
  c.lineWidth=1;
  for(const [d,light] of [[23,1],[34,0],[50,1],[64,0],[82,1],[100,0],[122,1],[146,0],[172,1],[205,0],[245,1]]){c.beginPath();for(let i=0;i<n;i+=2){const x=i*2,y=o[i]+d+wob(x,d%7)+1.5*Math.sin(x/9+d);c[i?'lineTo':'moveTo'](x,y);}c.strokeStyle=light?'rgba(255,224,180,.13)':'rgba(10,4,12,.2)';c.stroke();c.save();c.translate(0,1.2);c.strokeStyle=light?'rgba(20,8,10,.18)':'rgba(255,224,180,.06)';c.stroke();c.restore();}
  // Roots under the turf.
  c.strokeStyle='rgba(40,28,18,.55)';c.lineWidth=.8;for(let i=0;i<n;i+=2+Math.floor(rand()*3)){const x=i*2,y=o[i]+15;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+(rand()-.5)*6,y+5,x+(rand()-.5)*8,y+6+rand()*7);c.stroke();}
  // Grass blades texture inside the turf band.
  for(let i=0;i<n;i++){const x=i*2,h=3+rand()*8;c.fillStyle=rand()<.5?'rgba(30,96,40,.45)':'rgba(170,240,120,.25)';c.fillRect(x+(rand()<.5?0:1),o[i]+2+rand()*4,1,h);}
  // Embedded stones and pebbles.
  const stones=['#9c8a7a','#b4a28c','#75675c','#c9b89e','#8a7b8e'];
  for(let k=0;k<250;k++){const i=Math.floor(rand()*n),x=i*2+rand()*2,d=26+Math.pow(rand(),1.6)*280,y=o[i]+d,w=(1.3+rand()*rand()*5)*(1-d/520),h=w*(.55+rand()*.3),col=stones[Math.floor(rand()*stones.length)];
   c.globalAlpha=Math.max(.35,1-d/360);c.fillStyle='rgba(12,5,10,.45)';c.beginPath();c.ellipse(x+.6,y+1,w,h,0,0,TAU);c.fill();c.fillStyle=col;c.beginPath();c.ellipse(x,y,w,h,0,0,TAU);c.fill();c.fillStyle='rgba(255,250,235,.35)';c.beginPath();c.ellipse(x-w*.3,y-h*.35,w*.45,h*.3,0,0,TAU);c.fill();}
  c.globalAlpha=1;
  return el;
 }
 soilFill(c,s,cols,depth){return this.art(s,cols,depth);}
 // Surface dressing baked into the terrain texture after the fill: a smooth
 // anti-aliased turf lip (hides the 2 px column steps), tufts, flowers and
 // pebbles on ground that has never been cut.
 dress(c,s,cols){
  if(!this.tufts){this.tufts=[];for(let v=0;v<6;v++){const el=cv(14,12),q=el.getContext('2d'),r=seeded(50+v);for(let b=0;b<4+v%3;b++){const x=2+r()*10,h=4+r()*7,lean=(r()-.5)*5;q.fillStyle=['#3f9e3a','#62c449','#8fdf5e','#2f8433'][b%4];q.beginPath();q.moveTo(x-1.3,12);q.quadraticCurveTo(x+lean*.3,12-h*.6,x+lean,12-h);q.quadraticCurveTo(x+lean*.2+.4,12-h*.5,x+1.3,12);q.fill();}this.tufts.push(el);}
   this.flowers=['#ffd3ef','#ffe08a','#c4e6ff','#ff9fbd','#ffffff'].map(col=>{const el=cv(9,12),q=el.getContext('2d');q.strokeStyle='#3c8a3a';q.lineWidth=1;q.beginPath();q.moveTo(4.5,12);q.lineTo(4.5,5);q.stroke();q.fillStyle=col;for(let a=0;a<5;a++){q.beginPath();q.arc(4.5+Math.cos(a*TAU/5)*1.8,3.5+Math.sin(a*TAU/5)*1.8,1.25,0,TAU);q.fill();}q.fillStyle='#ffcf4a';q.beginPath();q.arc(4.5,3.5,1,0,TAU);q.fill();return el;});}
  const o=this.origins||[],n=cols.length,intact=i=>{const col=cols[i];return col&&Number.isFinite(col[0])&&o[i]!=null&&Math.abs(col[0]-o[i])<=2.5&&!s.terrainMaterials?.[i]?.[0];};
  c.save();c.lineJoin=c.lineCap='round';
  // Turf lip along runs of intact ground.
  const runs=[];let run=null;for(let i=0;i<n;i++){if(intact(i)){(run??=[]).push(i);}else if(run){runs.push(run);run=null;}}if(run)runs.push(run);
  for(const r of runs){if(r.length<2)continue;const pts=r.map(i=>[i*2+1,cols[i][0]]);
   c.beginPath();pts.forEach(([x,y],k)=>c[k?'lineTo':'moveTo'](x,y+1.2));c.strokeStyle='#4fb043';c.lineWidth=3;c.stroke();
   c.beginPath();pts.forEach(([x,y],k)=>c[k?'lineTo':'moveTo'](x,y+.2));c.strokeStyle='#b6f27c';c.lineWidth=1.3;c.stroke();}
  for(let i=4;i<n-4;i++){if(!intact(i)||!intact(i-1)||!intact(i+1))continue;const h=hash(i*7+3),x=i*2+1,y=cols[i][0];
   if(h<.34){const el=this.tufts[Math.floor(hash(i)*6)];c.drawImage(el,x-7,y-10.5);}
   else if(h<.385){const el=this.flowers[Math.floor(hash(i*5)*5)];c.drawImage(el,x-4.5,y-10.5);}
   else if(h<.41){const w=1.6+hash(i*9)*1.8;c.fillStyle='#6f6470';c.beginPath();c.ellipse(x,y+.8,w,w*.7,0,0,TAU);c.fill();c.fillStyle='#c2b6c0';c.beginPath();c.ellipse(x-w*.3,y+.2,w*.45,w*.3,0,0,TAU);c.fill();}}
  c.restore();
 }

 // ---------- crater embers ----------
 // Fireflies drifting just above intact grass: night ambience, dimmer than any shell.
 drawLife(c,ground,stage){
  this.stage=stage;if(!this.fly){this.fly=cv(16,16);const q=this.fly.getContext('2d'),g=q.createRadialGradient(8,8,0,8,8,8);g.addColorStop(0,'#f2ffb0');g.addColorStop(.35,'#c8ff6a99');g.addColorStop(1,'#c8ff6a00');q.fillStyle=g;q.fillRect(0,0,16,16);}
  c.save();c.globalCompositeOperation='lighter';
  for(let i=0;i<16;i++){const bx=40+hash(i*17+3)*1200,t=this.clock,x=bx+(this.reduced?0:Math.sin(t*.31+i)*26+Math.sin(t*.9+i*2.3)*6),floor=ground(x),y=floor-10-(this.reduced?8:14*(.5+.5*Math.sin(t*.47+i*1.7))),a=this.reduced?.25:.08+.42*Math.pow(Math.max(0,Math.sin(t*1.1+i*2.1)),2);
   if(!Number.isFinite(y)||a<.02)continue;c.globalAlpha=a;c.drawImage(this.fly,x-7,y-7,14,14);}
  c.restore();
 }
 addEmber(x,y,r){if(this.reduced&&this.embers.length>=4)return;this.embers.push({x,y,r:clamp(r,8,150),at:this.clock,life:2.6+Math.min(1.6,r/90)});if(this.embers.length>10)this.embers.shift();}
 drawEmbers(c,texture){
  if(!this.embers.length)return;this.emberCanvas??=cv(64,64);const e=this.emberCanvas,q=e.getContext('2d');
  for(const m of this.embers){const t=(this.clock-m.at)/m.life;if(t<0||t>=1)continue;const R=m.r*1.3,S=Math.ceil(R*2+4);if(e.width<S||e.height<S){e.width=e.height=Math.max(S,e.width);}
   q.globalCompositeOperation='source-over';q.clearRect(0,0,S,S);q.drawImage(texture,m.x-S/2,m.y-S/2,S,S,0,0,S,S);q.globalCompositeOperation='source-in';
   // Hot rim right at the crater wall, cooling from yellow-orange to deep red.
   const heat=1-t,g=q.createRadialGradient(S/2,S/2,m.r*.6,S/2,S/2,R);const a=Math.pow(heat,1.4);
   g.addColorStop(0,`rgba(255,${Math.round(170+70*heat)},${Math.round(80*heat)},${(.95*a).toFixed(3)})`);g.addColorStop(.62,`rgba(255,${Math.round(60+110*heat)},${Math.round(20+20*heat)},${(.8*a).toFixed(3)})`);g.addColorStop(1,'rgba(150,20,10,0)');
   q.fillStyle=g;q.fillRect(0,0,S,S);q.globalCompositeOperation='source-over';
   c.save();c.globalCompositeOperation='lighter';c.drawImage(e,0,0,S,S,m.x-S/2,m.y-S/2,S,S);c.restore();}
 }
}
