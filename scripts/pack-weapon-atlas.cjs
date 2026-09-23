// Deterministic asset packing, not artwork generation. Split only along empty
// alpha gutters, then give every complete sprite a 24px border in a 128px cell.
const sharp=require('sharp'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const [source,destination]=process.argv.slice(2);assert(source&&destination);
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const visible=(x,y)=>data[(y*info.width+x)*4+3]>16;
 function seam(expected,limit,count){
  let best=-1,score=Infinity;
  for(let p=Math.max(1,Math.floor(expected-38));p<Math.min(limit-1,expected+38);p++){
   const n=count(p),s=n*1000+Math.abs(p-expected);
   if(s<score){score=s;best=p;}
  }
  assert.equal(count(best),0,`No empty gutter near ${expected}; do not crop artwork`);return best;
 }
 const xs=[0];for(let i=1;i<12;i++)xs.push(seam(i*info.width/12,info.width,x=>{let n=0;for(let y=0;y<info.height;y++)n+=visible(x,y);return n;}));xs.push(info.width);
 const sprites=[],manifest=[];
 for(let col=0;col<12;col++){
  const ys=[0];for(let i=1;i<12;i++)ys.push(seam(i*info.height/12,info.height,y=>{let n=0;for(let x=xs[col];x<xs[col+1];x++)n+=visible(x,y);return n;}));ys.push(info.height);
  for(let row=0;row<12;row++){
   let left=xs[col+1],right=-1,top=ys[row+1],bottom=-1;
   for(let y=ys[row];y<ys[row+1];y++)for(let x=xs[col];x<xs[col+1];x++)if(visible(x,y)){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   assert(right>=left&&bottom>=top,'Empty weapon cell');
   assert(left>0&&top>0&&right<info.width-1&&bottom<info.height-1,'Source artwork touches image edge');
   const box={left,top,width:right-left+1,height:bottom-top+1};
   const buffer=await sharp(source).extract(box).resize(80,80,{fit:'contain',background:'#00000000'}).extend({top:24,bottom:24,left:24,right:24,background:'#00000000'}).png().toBuffer();
   sprites.push({input:buffer,left:col*128,top:row*128});manifest.push({index:row*12+col+1,source:box,x:col*128,y:row*128,width:128,height:128,padding:24});
  }
 }
 await sharp({create:{width:1536,height:1536,channels:4,background:'#00000000'}}).composite(sprites).png().toFile(destination);
 fs.writeFileSync(destination.replace(/\.png$/,'.json'),JSON.stringify(manifest.sort((a,b)=>a.index-b.index),null,2));
 console.log('Packed 144 complete icons; transparent 24px borders; 128px integer cells');
})().catch(e=>{console.error(e);process.exitCode=1;});
