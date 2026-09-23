const sharp=require('sharp'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const [table,field,sprites]=process.argv.slice(2),out='public/assets/gameplay/tabletop';assert(sprites);fs.mkdirSync(out,{recursive:true});
 await sharp(table).resize(1600,900,{fit:'contain',background:'#0000'}).webp({quality:88}).toFile(path.join(out,'poker-table.webp'));
 await sharp(field).resize(1500,900,{fit:'cover',position:'centre'}).webp({quality:88}).toFile(path.join(out,'hockey-field.webp'));
 const {data,info}=await sharp(sprites).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(const [i,name]of ['tile-covered','tile-open','mine','flag'].entries()){
  const x0=Math.floor(i%2*info.width/2),y0=Math.floor(Math.floor(i/2)*info.height/2),x1=Math.floor((i%2+1)*info.width/2),y1=Math.floor((Math.floor(i/2)+1)*info.height/2);let left=x1,top=y1,right=-1,bottom=-1;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*info.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  assert(left>x0&&right<x1-1&&top>y0&&bottom<y1-1,'Sprite touches cutting boundary: '+name);
  await sharp(sprites).extract({left,top,width:right-left+1,height:bottom-top+1}).resize(256,256,{fit:'contain',background:'#0000'}).webp({quality:92}).toFile(path.join(out,name+'.webp'));
 }
 console.log('Gameplay table, wide rink, four unclipped transparent sprites packed');
})().catch(e=>{console.error(e);process.exitCode=1;});
