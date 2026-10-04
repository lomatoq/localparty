'use strict';
// Slices generated atlases listed in docs/art/imagegen-requests-2026-10-02.json.
// Per cell: chroma-key #FF00A8 (if the image has no real alpha), fade any glow
// within FADE px of the cell border, trim, scale DOWN to fit the safe box,
// centre in the cell. Writes:
//   <dir>/<atlas-name>/<key>.webp          individual sprites (trimmed)
//   <dir>/<atlas-name>.webp                normalized atlas (padding bands empty)
//   <dir>/<atlas-name>.manifest.json       frames (same shape as public/assets/gameplay/manifest.json)
// The raw generated PNG stays untouched as the source.
// Usage: node scripts/slice-atlas.cjs [assetId ...]
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.join(__dirname,'..');
const spec=JSON.parse(fs.readFileSync(path.join(root,'docs/art/imagegen-requests-2026-10-02.json'),'utf8'));
const only=process.argv.slice(2),FADE=4;

function chromaKey(data,info){
 // Only when the source has no transparency at all.
 let transparent=0;for(let i=3;i<data.length;i+=4)if(data[i]<250){transparent++;if(transparent>1000)return false;}
 for(let i=0;i<data.length;i+=4){
  const r=data[i],g=data[i+1],b=data[i+2];
  const d=Math.hypot(r-255,g-0,b-168);
  if(d<60)data[i+3]=0;
  else if(d<120){const k=(d-60)/60;data[i+3]=Math.round(data[i+3]*k);
   // unmatte magenta spill
   data[i]=Math.round((r-255*(1-k))/Math.max(k,.01));data[i+2]=Math.round((b-168*(1-k))/Math.max(k,.01));
   data[i]=Math.max(0,Math.min(255,data[i]));data[i+2]=Math.max(0,Math.min(255,data[i+2]));}
 }
 return true;
}

(async()=>{
 let done=0;
 for(const a of spec.assets){
  if(!a.grid||(only.length&&!only.includes(a.id)))continue;
  // SOURCE_<ID>=path overrides the input (e.g. a raw version with correct alpha).
  const envKey='SOURCE_'+a.id.replace(/[^a-z0-9]/gi,'_').toUpperCase();
  const out=path.join(root,a.output.path),src=process.env[envKey]?path.resolve(root,process.env[envKey]):out;if(!fs.existsSync(src))continue;
  const {data,info}=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const keyed=chromaKey(data,info);
  const sx=info.width/a.output.width,sy=info.height/a.output.height;
  const {cols,rows,cell_w:CW,cell_h:CH,padding_px:PAD}=a.grid;const HAZE=a.style_profile==='fx'?0:56;const SW=CW-2*PAD,SH=CH-2*PAD;
  // If dense content bridges cell borders (generator ignored the grid), assign
  // whole connected objects to the cell containing their centroid instead of
  // cutting at the grid line. Each object then lives in exactly one cell buffer.
  const cellOf=new Int32Array(info.width*info.height).fill(-1);
  {const W=info.width,H=info.height,cwp=Math.round(CW*sx),chp=Math.round(CH*sy);let bridging=0;
   for(let c=1;c<cols;c++){const x=c*cwp;for(let y=0;y<H;y++)if(data[(y*W+x-1)*4+3]>160&&data[(y*W+x)*4+3]>160)bridging++;}
   for(let r=1;r<rows;r++){const y=r*chp;for(let x=0;x<W;x++)if(data[((y-1)*W+x)*4+3]>160&&data[(y*W+x)*4+3]>160)bridging++;}
   if(bridging>40){
    const lab=new Int32Array(W*H).fill(-1),stack=[];let n=0;const sums=[];
    for(let i=0;i<W*H;i++){if(lab[i]>=0||data[i*4+3]<=120)continue;lab[i]=n;stack.push(i);let sx_=0,sy_=0,cnt=0;
     while(stack.length){const j=stack.pop(),x=j%W,y=(j/W)|0;sx_+=x;sy_+=y;cnt++;for(const k of [j-1,j+1,j-W,j+W]){if(k<0||k>=W*H)continue;if((k===j-1&&x===0)||(k===j+1&&x===W-1))continue;if(lab[k]<0&&data[k*4+3]>120){lab[k]=n;stack.push(k);}}}
     sums.push([sx_/cnt,sy_/cnt]);n++;}
    for(let i=0;i<W*H;i++){const l=lab[i];if(l<0)continue;const [mx,my]=sums[l];cellOf[i]=Math.min(rows-1,(my/chp)|0)*cols+Math.min(cols-1,(mx/cwp)|0);}
    console.log('  component mode:',a.id,'bridging px',bridging,'objects',n);
   }}
  const base=out.replace(/\.(png|webp|jpg)$/i,''),spriteDir=base;fs.mkdirSync(spriteDir,{recursive:true});
  const composites=[],frames={},report=[];
  for(const c of a.cells){
   let x0=Math.round(c.rect.x*sx),y0=Math.round(c.rect.y*sy),w=Math.round(c.rect.w*sx),h=Math.round(c.rect.h*sy);
   const idx=a.cells.indexOf(c),comp=cellOf[0]!==undefined&&cellOf.some?null:null;
   const useComp=cellOf.length&&cellOf.indexOf(idx)>=0;
   if(useComp){ // expand window to all pixels owned by this cell
    let ax=1e9,ay=1e9,bx=-1,by=-1;for(let i=0;i<cellOf.length;i++)if(cellOf[i]===idx){const x=i%info.width,y=(i/info.width)|0;if(x<ax)ax=x;if(x>bx)bx=x;if(y<ay)ay=y;if(y>by)by=y;}
    x0=Math.min(x0,ax);y0=Math.min(y0,ay);w=Math.max(x0+w,bx+1)-x0;h=Math.max(y0+h,by+1)-y0;}
   x0=Math.max(0,x0);y0=Math.max(0,y0);w=Math.min(w,info.width-x0);h=Math.min(h,info.height-y0);
   const cell=Buffer.alloc(w*h*4);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const gi=(y0+y)*info.width+(x0+x),si=gi*4,di=(y*w+x)*4;
    if(useComp){const own=cellOf[gi];const inRect=(x0+x)>=Math.round(c.rect.x*sx)&&(x0+x)<Math.round((c.rect.x+c.rect.w)*sx)&&(y0+y)>=Math.round(c.rect.y*sy)&&(y0+y)<Math.round((c.rect.y+c.rect.h)*sy);
     // dense pixels follow their object; soft pixels stay with the cell they lie in
     if(own===idx||(own<0&&inRect))data.copy(cell,di,si,si+4);continue;}
    data.copy(cell,di,si,si+4);
    // Generators sometimes leave a faint translucent backdrop box (alpha ~1-30).
    // Solid-object profiles drop it; FX keep soft glows.
    if(HAZE&&cell[di+3]<=HAZE)cell[di+3]=0;else if(HAZE&&cell[di+3]<HAZE*2)cell[di+3]=Math.round((cell[di+3]-HAZE)*2);
    const edge=Math.min(x,y,w-1-x,h-1-y);
    if(edge<FADE)cell[di+3]=Math.round(cell[di+3]*edge/FADE);
   }
   // Solid-object profiles: keep only pixels within GROW px of the object's dense
   // body (alpha>160); detached haze/speckles left by the generator are removed.
   if(HAZE){const GROW=10,dense=new Uint8Array(w*h);for(let i=0;i<w*h;i++)dense[i]=cell[i*4+3]>160?1:0;
    // separable distance-limited dilation (box) on rows then columns
    const tmp=new Uint8Array(w*h);for(let y=0;y<h;y++){let last=-1e9;for(let x=0;x<w;x++){if(dense[y*w+x])last=x;tmp[y*w+x]=x-last<=GROW?1:0;}last=1e9;for(let x=w-1;x>=0;x--){if(dense[y*w+x])last=x;if(last-x<=GROW)tmp[y*w+x]=1;}}
    for(let x=0;x<w;x++){let last=-1e9;for(let y=0;y<h;y++){if(tmp[y*w+x])last=y;dense[y*w+x]=y-last<=GROW?1:0;}last=1e9;for(let y=h-1;y>=0;y--){if(tmp[y*w+x])last=y;if(last-y<=GROW)dense[y*w+x]=1;}}
    for(let i=0;i<w*h;i++)if(!dense[i])cell[i*4+3]=0;
    // Drop detached fragments much smaller than the main object (stray bits from neighbours).
    const lab=new Int32Array(w*h).fill(-1),sizes=[],st=[];
    for(let i=0;i<w*h;i++){if(lab[i]>=0||cell[i*4+3]<=24)continue;const id=sizes.length;let n=0;lab[i]=id;st.push(i);
     while(st.length){const j=st.pop(),x=j%w;n++;for(const k of [j-1,j+1,j-w,j+w]){if(k<0||k>=w*h||(k===j-1&&x===0)||(k===j+1&&x===w-1))continue;if(lab[k]<0&&cell[k*4+3]>24){lab[k]=id;st.push(k);}}}
     sizes.push(n);}
    const big=Math.max(0,...sizes);for(let i=0;i<w*h;i++){const l=lab[i];if(l>=0&&sizes[l]<big*.03)cell[i*4+3]=0;}}
   let minX=w,minY=h,maxX=-1,maxY=-1;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(cell[(y*w+x)*4+3]>8){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
   if(maxX<0){report.push(`${c.key}:EMPTY`);continue;}
   const tw=maxX-minX+1,th=maxY-minY+1;
   // Scale to atlas units, then down to the safe box if needed (never up).
   const unitW=tw/sx,unitH=th/sy,scale=Math.min(1,SW/unitW,SH/unitH);
   const outW=Math.max(1,Math.round(unitW*scale)),outH=Math.max(1,Math.round(unitH*scale));
   const sprite=await sharp(cell,{raw:{width:w,height:h,channels:4}}).extract({left:minX,top:minY,width:tw,height:th}).resize(outW,outH,{fit:'fill',kernel:'lanczos3'}).png().toBuffer();
   await sharp(sprite).webp({quality:92,alphaQuality:100}).toFile(path.join(spriteDir,c.key+'.webp'));
   // Centre every sprite in its cell (pivot = cell centre).
   const left=Math.round(c.rect.x+(c.rect.w-outW)/2),top=Math.round(c.rect.y+(c.rect.h-outH)/2);
   composites.push({input:sprite,left,top});
   frames[c.key]={atlas:path.basename(base)+'.webp',frame:{x:left,y:top,w:outW,h:outH},sourceSize:{w:outW,h:outH},pivot:{x:.5,y:.5},sprite:path.basename(base)+'/'+c.key+'.webp',cell:c.rect,...(c.tintable?{tintable:true}:{})};
   report.push(`${c.key}:${Math.round(scale*100)}%`);
  }
  await sharp({create:{width:a.output.width,height:a.output.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composites).webp({quality:92,alphaQuality:100}).toFile(base+'.webp');
  fs.writeFileSync(base+'.manifest.json',JSON.stringify({version:1,source:path.basename(src),styleProfile:a.style_profile,chromaKeyed:keyed,frames},null,2)+'\n');
  console.log('SLICED',a.id,keyed?'(chroma-keyed)':'',report.join(' '));done++;
 }
 if(!done)console.log('nothing to slice');
})();
