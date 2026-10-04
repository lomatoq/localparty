'use strict';
// Authorized sprite slicing/composition only. No AI generation or upscale.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require(process.env.PARTY_SHARP||'/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=__dirname,repo=path.resolve(root,'../../..'),catalog=require(path.join(repo,'lib/catalog.js')),dictionary=require(path.join(repo,'public/i18n-dictionary.js'));
const groups=JSON.parse(fs.readFileSync(path.join(root,'prompts.json')));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
(async()=>{
 const logos=[],sources=[];
 for(const group of groups){
  const sourceFile=group.selectedSource||'originals/'+group.atlas+'.png';
  const source=path.join(root,sourceFile);
  if(!fs.existsSync(source))continue;
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true}),w=info.width,h=info.height;
  const occupied=new Array(h).fill(false);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>1){occupied[y]=true;break;}
  // Built-in exports contain scattered alpha=1/255 pixels in empty margins.
  // Ignore those only when locating crop bounds; never modify alpha in pixels.
  // Full untouched original is preserved as provenance.
  let split=-1,bestGap=0,start=-1;
  const from=Math.floor(h*.38),to=Math.ceil(h*.62);
  for(let y=from;y<=to;y++){
   if(y<to&&!occupied[y]){if(start<0)start=y;}
   else if(start>=0){const gap=y-start;if(gap>bestGap){bestGap=gap;split=start+Math.floor(gap/2);}start=-1;}
  }
  if(split<0||bestGap<8)throw new Error(group.atlas+': no wide transparent safe splitting gap');
  sources.push({file:sourceFile,nativeWidth:w,nativeHeight:h,splitRow:split,transparentSplitGap:bestGap,sha256:hash(source),trueAlpha:true});
  for(let row=0;row<2;row++){
   const id=group.ids[row],game=catalog.find(g=>g.id===id);if(!game)throw new Error('Unknown catalog id '+id);
   const lo=row?split:0,hi=row?h:split;let minX=w,minY=h,maxX=-1,maxY=-1;
   for(let y=lo;y<hi;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>1){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
   if(maxX<0)throw new Error('Empty logo '+id);
   if(minX===0||maxX===w-1||minY===lo||maxY===hi-1)throw new Error(id+': nontransparent source edge, inspect potential clipping');
   const content={x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1},pad=24;
   const file='logos/'+id+'.png';await sharp(source).extract({left:content.x,top:content.y,width:content.width,height:content.height}).extend({top:pad,bottom:pad,left:pad,right:pad,background:{r:0,g:0,b:0,alpha:0}}).png().toFile(path.join(root,file));
   logos.push({id,name:dictionary[game.title]||game.title,text:group.titles[row],path:'/assets/game-logos-v1/'+file,file,nativeWidth:content.width+pad*2,nativeHeight:content.height+pad*2,contentWidth:content.width,contentHeight:content.height,source:sources.at(-1).file,sourceRect:content,padding:pad,sha256:hash(path.join(root,file)),upscaled:false});
  }
 }
 logos.sort((a,b)=>catalog.findIndex(g=>g.id===a.id)-catalog.findIndex(g=>g.id===b.id));
 const cols=4,rows=3,cellW=1792,cellH=1152,atlases=[];
 for(let offset=0;offset<logos.length;offset+=12){
  const page=logos.slice(offset,offset+12),number=String(offset/12+1).padStart(2,'0'),file='atlases/games-'+number+'.png',inputs=[];
  for(let i=0;i<page.length;i++){
   const l=page[i];if(l.nativeWidth>cellW-512||l.nativeHeight>cellH-512)throw new Error(l.id+': cell would not leave >=256px safety margin');
   const left=(i%cols)*cellW+Math.floor((cellW-l.nativeWidth)/2),top=Math.floor(i/cols)*cellH+Math.floor((cellH-l.nativeHeight)/2);
   l.atlas={file,path:'/assets/game-logos-v1/'+file,x:left,y:top,width:l.nativeWidth,height:l.nativeHeight,cell:{x:(i%cols)*cellW,y:Math.floor(i/cols)*cellH,width:cellW,height:cellH}};
   inputs.push({input:path.join(root,l.file),left,top});
  }
  await sharp({create:{width:cellW*cols,height:cellH*rows,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(inputs).png().toFile(path.join(root,file));
  atlases.push({file,width:cellW*cols,height:cellH*rows,ids:page.map(l=>l.id),cellWidth:cellW,cellHeight:cellH,minimumPaddingEachSide:256,sha256:hash(path.join(root,file))});
 }
 let masterAtlas=null;
 if(logos.length===catalog.length){
  const masterCols=6,masterRows=6,file='atlases/master-atlas36.png',inputs=[];
  for(let i=0;i<logos.length;i++){
   const l=logos[i],left=(i%masterCols)*cellW+Math.floor((cellW-l.nativeWidth)/2),top=Math.floor(i/masterCols)*cellH+Math.floor((cellH-l.nativeHeight)/2);
   l.masterAtlas={file,path:'/assets/game-logos-v1/'+file,x:left,y:top,width:l.nativeWidth,height:l.nativeHeight};
   inputs.push({input:path.join(root,l.file),left,top});
  }
  await sharp({create:{width:cellW*masterCols,height:cellH*masterRows,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(inputs).png().toFile(path.join(root,file));
  masterAtlas={file,width:cellW*masterCols,height:cellH*masterRows,cellWidth:cellW,cellHeight:cellH,minimumPaddingEachSide:256,sha256:hash(path.join(root,file))};
 }
 const manifest={version:1,generatedWith:'built-in image_gen',generatedAt:new Date().toISOString(),status:logos.length===catalog.length?'complete':'partial',catalogCount:catalog.length,logoCount:logos.length,noUpscale:true,alpha:'Native generated RGBA preserved inside crops; only isolated alpha=1/255 margin noise excluded when selecting crop bounds. Full originals retained.',sources,atlases,masterAtlas,logos};
 fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const cards=logos.map(l=>'<article><div class="logo"><img src="'+l.file+'" alt="'+esc(l.name)+'"></div><h2>'+esc(l.name)+'</h2><p>'+l.id+' · '+l.nativeWidth+'×'+l.nativeHeight+' native crop</p><a href="'+l.file+'">PNG</a></article>').join('');
 fs.writeFileSync(path.join(root,'index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HeyPals game logos v1</title><style>body{margin:0;padding:32px;background:#151321;color:#f6f0e9;font:16px system-ui}h1{font-size:28px}p{color:#bbb3cc}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:24px}article{background:#252030;padding:16px;border:1px solid #514263;border-radius:20px;text-align:center}.logo{height:190px;display:grid;place-items:center}.logo img{width:240px;max-height:174px;object-fit:contain}h2{font-size:17px}a{color:#c4ff71}</style><h1>HeyPals · illustrated game logos v1</h1><p>'+logos.length+' / '+catalog.length+' game logos. Preview images displayed at 240 px wide. Native PNGs, genuine alpha, no upscale.</p><p>Review assets; not a gameplay capture or user approval.</p><main>'+cards+'</main></html>');
 console.log(JSON.stringify({logoCount:logos.length,catalogCount:catalog.length,atlases:atlases.map(a=>({file:a.file,width:a.width,height:a.height})),minimumNativeContentWidth:Math.min(...logos.map(l=>l.contentWidth)),maximumNativeContentHeight:Math.max(...logos.map(l=>l.contentHeight))}));
})().catch(e=>{console.error(e);process.exitCode=1;});
