'use strict';
// Verifies generated atlases from docs/art/imagegen-requests-2026-10-02.json:
// size matches, and every cell's padding band is transparent, so no sprite
// touches or crosses a cell border (no overlap between neighbours).
// Usage: node scripts/check-atlas-grid.cjs [assetId ...]   (NORMALIZED=1 checks the sliced .webp atlas)
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const spec=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/art/imagegen-requests-2026-10-02.json'),'utf8'));
const only=process.argv.slice(2);
(async()=>{
 let failed=0;
 for(const a of spec.assets){
  if(!a.grid||(only.length&&!only.includes(a.id)))continue;
  const file=path.join(__dirname,'..',process.env.NORMALIZED?a.output.path.replace(/\.(png|webp|jpg)$/i,'.webp'):a.output.path);
  if(!fs.existsSync(file)){console.log('MISSING',a.id,a.output.path);continue;}
  const img=sharp(file).ensureAlpha();const meta=await img.metadata();
  const sx=meta.width/a.output.width,sy=meta.height/a.output.height;
  if(Math.abs(sx-sy)>.01){console.log('FAIL',a.id,`aspect ${meta.width}x${meta.height} ≠ ${a.output.width}x${a.output.height}`);failed++;continue;}
  const {data,info}=await img.raw().toBuffer({resolveWithObject:true});
  // Empty = transparent, or the #FF00A8 chroma fallback background (before keying).
  const empty=(x,y)=>{const i=(y*info.width+x)*4;if(data[i+3]<=8)return true;return Math.abs(data[i]-255)<24&&data[i+1]<24&&Math.abs(data[i+2]-168)<24;};
  const pad=Math.floor(a.grid.padding_px*sx),bad=[];
  for(const c of a.cells){
   const x0=Math.round(c.rect.x*sx),y0=Math.round(c.rect.y*sy),x1=Math.round((c.rect.x+c.rect.w)*sx),y1=Math.round((c.rect.y+c.rect.h)*sy);
   let hits=0;
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const inBand=x<x0+pad||x>=x1-pad||y<y0+pad||y>=y1-pad;
    if(inBand&&!empty(x,y))hits++;
   }
   if(hits)bad.push(`${c.key}(${hits}px)`);
  }
  if(bad.length){failed++;console.log('FAIL',a.id,'content in padding band:',bad.join(', '));}
  else console.log('OK  ',a.id,`${meta.width}x${meta.height}`);
 }
 process.exitCode=failed?1:0;
})();
