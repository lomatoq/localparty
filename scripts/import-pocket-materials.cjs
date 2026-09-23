'use strict';
// Preserve the authored indexed plasma masks, frame order and emitter settings.
const fs=require('node:fs'),path=require('node:path');
const reference=require('../games/arcade_deluxe/core/pocket-reference.generated.json');
const root=process.argv[2];if(!root)throw Error('Expected extracted weapdata directory');
const frames={},weapons={},emissions={};
const list=v=>Array.isArray(v)?v:[v];
function range(v,fallback){if(v==null)return [fallback,0];if(typeof v==='number')return [v,0];const text=String(v),rnd=Number(text.match(/RND\s+(-?[\d.]+)/i)?.[1]||0),base=text.replace(/RND\s+-?[\d.]+/gi,'').match(/[+-]?\s*\d+(?:\.\d+)?/g)||[];return [base.reduce((a,n)=>a+Number(n.replace(/\s/g,'')),0),rnd];}
function frame(name){
 name=name.replaceAll('\\','/').toLowerCase();if(frames[name])return name;
 const b=fs.readFileSync(path.join(root,name)),w=b.readInt32LE(18),signed=b.readInt32LE(22),h=Math.abs(signed),bits=b.readUInt16LE(28),off=b.readUInt32LE(10),stride=Math.ceil(w/4)*4;
 if(bits!==8||b.readUInt32LE(30)!==0)throw Error('Expected uncompressed indexed mask: '+name);
 const pixels=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)pixels.push(b[off+(signed>0?h-1-y:y)*stride+x]);
 const paletteOffset=14+b.readUInt32LE(14),colors={};for(const i of new Set(pixels))colors[i]=[b[paletteOffset+i*4+2],b[paletteOffset+i*4+1],b[paletteOffset+i*4]];
 frames[name]={w,h,pixels,colors};return name;
}
for(const w of reference.weapons){
 const nodes=w.chain.filter(n=>['FIRE','FOG','SUPERBALL'].includes(n.type)&&n.values.DRAW_ANIM);
 if(!nodes.length)continue;
 weapons[w.id]=nodes.map(n=>{const v=n.values;return {name:n.name,type:n.type,frames:String(v.DRAW_ANIM).split(/\s+/).filter(f=>/\.bmp$/i.test(f)).map(frame),fps:v.DRAW_ANIM_SPEED||v.DRAW_SPEED||60,life:(v.BURN_TIME||v.ACTIVE_TIME||1000)/1000,gravity:v.GRAVITY_FLAG??n.type==='SUPERBALL',bounce:v.BOUNCE_IMPULSE||0,mode:v.PLASMA_TYPE||v.BLIT_MODE||'SCREEN',radius:v.DAMAGE_RADIUS||2,density:v.FOG_DENSITY||1,size:v.FOG_SIZE||0,flicker:!!v.FLICKER_FLAG};});
 emissions[w.id]=[];
 for(const trigger of w.chain.filter(n=>n.type==='TRIGGER')){
  let at=0;const v=trigger.values,get=(key,i)=>trigger.commands?trigger.commands[i]?.[key]:list(v[key])[i]??list(v[key])[0],last={ANGLE:270,POWER:5,XOFFSET:0,YOFFSET:0};
  const resolve=(key,i)=>{const value=get(key,i),fallback=key==='ANGLE'?270:key==='POWER'?5:0,result=range(value,value==null?last[key]:fallback);if(typeof value==='string'&&!/SET/i.test(value))result[0]+=last[key];else if(typeof value==='string'&&/RESET/i.test(value))result[0]+=fallback;last[key]=result[0];return result;};
  for(const [i,name] of list(v.COMMAND).entries()){at+=Number(get('TIMEDELAY',i)||0)/1000;const angle=resolve('ANGLE',i),power=resolve('POWER',i),x=resolve('XOFFSET',i),y=resolve('YOFFSET',i),index=nodes.findIndex(n=>n.name===name&&n.type===get('TYPE',i));if(index<0)continue;emissions[w.id].push({trigger:trigger.name,index,delay:at,x,y,angle,power});}
 }
}
const output=path.resolve(__dirname,'../games/arcade_deluxe/public/assets/pocket-materials.json');
fs.writeFileSync(output,JSON.stringify({version:1,frames,weapons,emissions})+'\n');
console.log(`${Object.keys(frames).length} original indexed masks; ${Object.keys(weapons).length} weapon material profiles`);
