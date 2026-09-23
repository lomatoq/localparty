'use strict';
// Index sheets for visual inspection; original captures remain untouched.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const dir=path.resolve(process.argv[2]||'.localparty-build/screens-review');
const inputs=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort();
const target=path.join(dir,'inspection');fs.mkdirSync(target,{recursive:true});
const escape=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
(async()=>{for(let start=0;start<inputs.length;start+=12){const batch=inputs.slice(start,start+12),layers=[];
 for(let i=0;i<batch.length;i++){const name=batch[i],x=(i%4)*240,y=Math.floor(i/4)*550;
  layers.push({input:await sharp(path.join(dir,name)).resize(232,510,{fit:'inside'}).toBuffer(),left:x+4,top:y+36});
  layers.push({input:Buffer.from(`<svg width="240" height="34"><rect width="240" height="34" fill="#fff"/><text x="4" y="20" font-family="sans-serif" font-size="11">${escape(name)}</text></svg>`),left:x,top:y});
 }
 await sharp({create:{width:960,height:Math.ceil(batch.length/4)*550,channels:3,background:'#ddd'}}).composite(layers).png().toFile(path.join(target,String(start/12+1).padStart(2,'0')+'.png'));
}console.log(inputs.length+' screenshots in '+Math.ceil(inputs.length/12)+' inspection sheets');})().catch(e=>{console.error(e);process.exitCode=1;});
