async function board({missing=[],shade=false}={}){
 const {BOARD,markerBits}=await import('../../../games/bow_club/public/src/markers.mjs');
 const width=720,height=1280,pixels=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const bx=(x-40)*2,by=(y-460)*2;let value=75;
  for(const tag of BOARD.tags){if(missing.includes(tag.id))continue;const tx=bx-tag.x,ty=by-tag.y;if(tx>=-8&&ty>=-8&&tx<tag.size+8&&ty<tag.size+8){value=245;if(tx>=0&&ty>=0&&tx<tag.size&&ty<tag.size)value=markerBits(tag.id)[Math.floor(ty/16)*6+Math.floor(tx/16)]?245:10;}}
  if(shade)value=Math.round(value*(.7+.3*x/width));const i=(y*width+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=value;pixels[i+3]=255;
 }
 return {pixels,width,height};
}

module.exports={board};
