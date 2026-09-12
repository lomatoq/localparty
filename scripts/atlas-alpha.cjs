// Convert the generator's neutral transparency preview into a real alpha matte.
// Only neutral background connected to each cell's exterior is removed; enclosed object details remain.
const sharp=require('C:/Users/nirrt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{const {data,info}=await sharp(process.argv[2]).removeAlpha().raw().toBuffer({resolveWithObject:true});const {width:w,height:h}=info,out=Buffer.alloc(w*h*4),mask=new Uint8Array(w*h),queue=new Int32Array(w*h);
const neutral=i=>{const a=data[i*3],b=data[i*3+1],c=data[i*3+2];return Math.max(a,b,c)-Math.min(a,b,c)<22&&Math.min(a,b,c)>100&&Math.max(a,b,c)<240;};
for(let row=0;row<5;row++)for(let col=0;col<4;col++){const x0=Math.round(col*w/4),x1=Math.round((col+1)*w/4)-1,y0=Math.round(row*h/5),y1=Math.round((row+1)*h/5)-1;let head=0,tail=0;const push=i=>{if(!mask[i]&&neutral(i)){mask[i]=1;queue[tail++]=i;}};for(let x=x0;x<=x1;x++){push(y0*w+x);push(y1*w+x);}for(let y=y0;y<=y1;y++){push(y*w+x0);push(y*w+x1);}while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);if(x>x0)push(i-1);if(x<x1)push(i+1);if(y>y0)push(i-w);if(y<y1)push(i+w);}}
for(let i=0;i<w*h;i++){out[i*4]=data[i*3];out[i*4+1]=data[i*3+1];out[i*4+2]=data[i*3+2];out[i*4+3]=mask[i]?0:255;}
await sharp(out,{raw:{width:w,height:h,channels:4}}).png().toFile('public/assets/games/atlas-transparent.png');console.log({transparentPixels:mask.reduce((a,b)=>a+b,0),total:w*h});})();
