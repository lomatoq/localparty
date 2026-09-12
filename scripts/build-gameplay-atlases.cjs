const fs=require('fs'),path=require('path');
const sharp=require('C:/Users/nirrt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'../public/assets/gameplay');
const sources=JSON.parse(fs.readFileSync(path.join(root,'sources.json')));
(async()=>{
 fs.mkdirSync(path.join(root,'sprites'),{recursive:true});fs.mkdirSync(path.join(root,'masks'),{recursive:true});
 const manifest={version:1,revision:Date.now().toString(36),style:'LocalParty soft toy arcade / orthographic / upper-left light',frames:{},atlases:[],tint:{method:'semantic paint regions with neutral material and specular protection',saturationMax:.20,luminanceMin:115,highlightFadeStart:215,highlightProtectedAt:235}};
 for(const source of sources){
  const {data,info}=await sharp(source.path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width!==1536||info.height!==1024)throw Error('Unexpected atlas dimensions');
  const seen=new Uint8Array(1536*1024),queue=new Int32Array(1536*1024),bounds=Array.from({length:8},()=>({x:1536,y:1024,r:0,b:0}));
  for(let start=0;start<seen.length;start++){if(seen[start]||data[start*4+3]<=12)continue;let head=0,tail=1;queue[0]=start;seen[start]=1;let x0=1536,y0=1024,x1=0,y1=0,sx=0,sy=0;
   while(head<tail){const p=queue[head++],x=p%1536,y=Math.floor(p/1536);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);sx+=x;sy+=y;for(const q of [x? p-1:-1,x<1535?p+1:-1,y?p-1536:-1,y<1023?p+1536:-1])if(q>=0&&!seen[q]&&data[q*4+3]>12){seen[q]=1;queue[tail++]=q;}}
   if(tail<10)continue;const owner=Math.min(3,Math.floor(sx/tail/384))+Math.min(1,Math.floor(sy/tail/512))*4,b=bounds[owner];b.x=Math.min(b.x,x0);b.y=Math.min(b.y,y0);b.r=Math.max(b.r,x1);b.b=Math.max(b.b,y1);
  }
  const composites=[];
  manifest.atlases.push({file:`atlas-${source.name}.webp`,width:1536,height:1024});
  for(let i=0;i<source.keys.length;i++){
   const key=source.keys[i],left=i%4*384,top=Math.floor(i/4)*512;
   const b=bounds[i],extract={left:Math.max(0,b.x-3),top:Math.max(0,b.y-3),width:Math.min(1535,b.r+3)-Math.max(0,b.x-3)+1,height:Math.min(1023,b.b+3)-Math.max(0,b.y-3)+1};
   const {data:d,info:si}=await sharp(source.path).extract(extract).resize({width:352,height:480,fit:'inside'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   const frame={x:left+Math.floor((384-si.width)/2),y:top+Math.floor((512-si.height)/2),w:si.width,h:si.height},edge=0;
   composites.push({input:await sharp(d,{raw:si}).png().toBuffer(),left:frame.x,top:frame.y});
   await sharp(d,{raw:si}).webp({quality:95,alphaQuality:100}).toFile(path.join(root,'sprites',key+'.webp'));
   const tintable=source.tint.includes(key)&&!['ship','wheel'].includes(key);let mask;
   if(tintable){const m=Buffer.alloc(d.length);for(let p=0;p<d.length;p+=4){const max=Math.max(d[p],d[p+1],d[p+2]),min=Math.min(d[p],d[p+1],d[p+2]),sat=max?(max-min)/max:0,l=.2126*d[p]+.7152*d[p+1]+.0722*d[p+2],x=(p/4%si.width)/si.width,y=Math.floor(p/4/si.width)/si.height;
    let region=1;if(key==='knife')region=y>.63&&y<.84?1:0;if(key==='cowboy')region=y>.39&&y<.67?1:0;if(key==='tank'||key==='tank-body')region=x>.24&&x<.76?1:0;if(key==='bird')region=x>.69&&y<.65?0:1;if(key==='rugby-player')region=y<.48?1:0;if(key==='puck')region=Math.hypot(x-.5,y-.5)<.32?1:0;
    if(key==='runner'&&x>.50&&x<.95&&y<.48)region=0;if(key==='blob'&&((y>.3&&y<.9&&x>.2&&x<.8)||y<.30))region=0;if(key==='knife-handle'&&(y<.2||y>.65))region=0;
    if(key.startsWith('facade-floor-'))region=y>.18&&y<.84&&x>.08&&x<.92?1:0;const paintLimit=key.startsWith('facade-floor-')?.42:.20;const highlight=Math.max(0,Math.min(1,(235-l)/20));m[p]=m[p+1]=m[p+2]=255;m[p+3]=Math.round(d[p+3]*region*highlight*Math.max(0,Math.min(1,(l-115)/65))*Math.max(0,Math.min(1,(paintLimit-sat)/.10)));}mask='masks/'+key+'.png';await sharp(m,{raw:si}).png().toFile(path.join(root,mask));}
   manifest.frames[key]={atlas:`atlas-${source.name}.webp`,frame,sourceSize:{w:frame.w,h:frame.h},pivot:{x:.5,y:key==='tank-turret'?.74:key==='punchbag'?.035:.5},sprite:'sprites/'+key+'.webp',...(mask?{tintMask:mask}:{}),cell:{x:left,y:top,w:384,h:512},edgeAlphaPixels:edge};
  }
  await sharp({create:{width:1536,height:1024,channels:4,background:'#00000000'}}).composite(composites).webp({quality:95,alphaQuality:100}).toFile(path.join(root,`atlas-${source.name}.webp`));
 }
 fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify({frames:Object.keys(manifest.frames).length,edgeWarnings:Object.entries(manifest.frames).filter(([k,v])=>v.edgeAlphaPixels>0).map(([k,v])=>[k,v.edgeAlphaPixels])}));
})();

