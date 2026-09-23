// Asset packing only: preserve generated artwork, find empty alpha gutters,
// normalize complete subjects into the existing 128px atlas cells.
const sharp=require('sharp'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const [source,base,destination]=process.argv.slice(2);assert(destination);
 const ids=[50,65,68,83,89,97,100,103,118,133,136,139,21,64,92,143];
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const visible=(x,y)=>data[(y*info.width+x)*4+3]>16;
 const seam=(expected,limit,count)=>{let best=-1,score=Infinity;for(let p=Math.max(1,Math.floor(expected-50));p<Math.min(limit-1,expected+50);p++){const value=count(p)*1000+Math.abs(p-expected);if(value<score){score=value;best=p;}}assert.equal(count(best),0,'No empty gutter: do not crop');return best;};
 const xs=[0];for(let c=1;c<4;c++)xs.push(seam(c*info.width/4,info.width,x=>{let n=0;for(let y=0;y<info.height;y++)n+=visible(x,y);return n;}));xs.push(info.width);
 const atlas=await sharp(base).ensureAlpha().raw().toBuffer({resolveWithObject:true}),sprites=[],manifest=[];
 for(let col=0;col<4;col++){
  const ys=[0];for(let row=1;row<4;row++)ys.push(seam(row*info.height/4,info.height,y=>{let n=0;for(let x=xs[col];x<xs[col+1];x++)n+=visible(x,y);return n;}));ys.push(info.height);
  for(let row=0;row<4;row++){
   let left=xs[col+1],right=-1,top=ys[row+1],bottom=-1;for(let y=ys[row];y<ys[row+1];y++)for(let x=xs[col];x<xs[col+1];x++)if(visible(x,y)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   assert(right>=left&&bottom>=top);assert(left>0&&top>0&&right<info.width-1&&bottom<info.height-1,'Clipped source');
   const index=ids[row*4+col],x=(index-1)%12*128,y=Math.floor((index-1)/12)*128;
   for(let py=y;py<y+128;py++)atlas.data.fill(0,(py*atlas.info.width+x)*4,(py*atlas.info.width+x+128)*4);
   const box={left,top,width:right-left+1,height:bottom-top+1};const input=await sharp(source).extract(box).resize(80,80,{fit:'contain',background:'#0000'}).extend({top:24,bottom:24,left:24,right:24,background:'#0000'}).png().toBuffer();sprites.push({input,left:x,top:y});manifest.push({index,source:box,padding:24});
  }
 }
 await sharp(atlas.data,{raw:atlas.info}).composite(sprites).png().toFile(destination);
 fs.writeFileSync(destination.replace(/\.png$/,'.json'),JSON.stringify({replaced:manifest},null,2));console.log('Replaced 16 repeated silhouettes; 24px padding preserved');
})().catch(e=>{console.error(e);process.exitCode=1;});
