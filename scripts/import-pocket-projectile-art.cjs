'use strict';
// Import every explicitly authored projectile animation, never invisible graph
// helpers or an inferred sprite based on a weapon name.
const fs=require('node:fs'),path=require('node:path');
const reference=require('../games/arcade_deluxe/core/pocket-reference.generated.json');
function importArt(root){
 const frames={},nodes={};
 const offset=(value,fallback)=>{const parsed=Number.parseFloat(value);return Number.isFinite(parsed)?parsed:fallback;};
 function frame(name){
  if(frames[name])return;const b=fs.readFileSync(path.join(root,name));
  if(name.endsWith('.png')){
   if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Invalid PNG '+name);
   const w=b.readUInt32BE(16),h=b.readUInt32BE(20);
   if(!w||!h||w>1024||h>1024)throw Error('Unbounded object '+name);
   frames[name]={w,h,png:b.toString('base64')};return;
  }
  if(b.toString('ascii',0,2)!=='BM'||b.readUInt16LE(28)!==8||b.readUInt32LE(30)!==0)throw Error('Expected8bit uncompressedBMP '+name);
  const w=b.readInt32LE(18),signed=b.readInt32LE(22),h=Math.abs(signed),off=b.readUInt32LE(10),stride=Math.ceil(w/4)*4,pal=14+b.readUInt32LE(14),pixels=[],colors={};
  if(w<1||h<1||w>1024||h>1024)throw Error('Unbounded object '+name);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)pixels.push(b[off+(signed>0?h-1-y:y)*stride+x]);
  for(const i of new Set(pixels))colors[i]=[b[pal+i*4+2],b[pal+i*4+1],b[pal+i*4]];
  frames[name]={w,h,pixels,colors};
 }
 for(const weapon of reference.weapons)for(const n of weapon.chain){
  if(!['BULLET','CRUISER'].includes(n.type))continue;
  const v=n.values,names=String(v.DRAW_ANIM||'').replaceAll('\\','/').toLowerCase().split(/\s+/).filter(s=>/\.(bmp|png)$/.test(s));
  if(!names.length)continue;
  if(names.some(s=>s.split('/').includes('..')))throw Error('Invalid asset path');
  names.forEach(frame);const first=frames[names[0]];
  nodes[`${weapon.id}/${n.type}/${n.name}`]={frames:names,fps:Number(v.DRAW_ANIM_SPEED)||0,rotate:v.DRAW_ANIM_ROTATE===true,xOffset:offset(v.DRAW_ANIM_XOFFSET,Math.floor(first.w/2)),yOffset:offset(v.DRAW_ANIM_YOFFSET,Math.floor(first.h/2)),sourceDirection:v.DRAW_ANIM_DIRECTION||null};
 }
 return {version:1,pixelScale:1,transparentIndex:0,frames,nodes};
}
if(require.main===module){if(!process.argv[2])throw Error('Expected extracted original weapdata directory');const result=importArt(process.argv[2]);fs.writeFileSync(path.join(__dirname,'../games/arcade_deluxe/public/assets/pocket-projectiles.json'),JSON.stringify(result)+'\n');console.log(`${Object.keys(result.nodes).length} exact object nodes / ${Object.keys(result.frames).length} original frames`);}
module.exports={importArt};
