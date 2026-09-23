// Read-only crop-safety audit. Alpha > 16 counts as visible artwork.
const sharp=require('sharp'),assert=require('node:assert/strict');
(async()=>{
 const file=process.argv[2];assert(file,'Usage: node scripts/check-weapon-atlas.cjs atlas.png');
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,info.height,'Atlas must be square');
 const cells=[];
 for(let row=0;row<12;row++)for(let col=0;col<12;col++){
  const x0=Math.round(col*info.width/12),x1=Math.round((col+1)*info.width/12),y0=Math.round(row*info.height/12),y1=Math.round((row+1)*info.height/12);
  let left=x1,right=x0-1,top=y1,bottom=y0-1,pixels=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*info.width+x)*4+3]>16){pixels++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const padding=pixels?Math.min(left-x0,x1-1-right,top-y0,y1-1-bottom):-1;
  cells.push({index:row*12+col+1,pixels,padding,ratio:padding/(x1-x0)});
 }
 const unsafe=cells.filter(c=>c.ratio<.08||!c.pixels);
 console.log(JSON.stringify({file,width:info.width,height:info.height,cells:cells.length,minPadding:Math.min(...cells.map(c=>c.padding)),minimumPaddingRatio:Math.min(...cells.map(c=>c.ratio)),unsafe},null,2));
 if(unsafe.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
