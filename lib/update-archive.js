'use strict';
// Small, bounded ZIP reader for GitHub source/portable archives. No install-time dependency.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const TABLE=Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
function crc32(b){let c=0xffffffff;for(const x of b)c=TABLE[(c^x)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function safeName(name){
 if(typeof name!=='string'||!name||name.includes('\\')||/[:\x00-\x1f]/.test(name)||name.startsWith('/')||name.split('/').some(s=>s==='.'||s==='..'||/[. ]$/.test(s)||/^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(s)))throw Error('Небезопасный путь в архиве');
 return name;
}
function extract(buffer,destination,{maxBytes=1024*1024*1024,maxFiles=40000}={}){
 let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50&&i+22+buffer.readUInt16LE(i+20)===buffer.length){end=i;break;}
 if(end<0)throw Error('Повреждён ZIP');
 const count=buffer.readUInt16LE(end+10),size=buffer.readUInt32LE(end+12),offset=buffer.readUInt32LE(end+16);
 if(buffer.readUInt16LE(end+4)||buffer.readUInt16LE(end+6)||count===65535||count>maxFiles||offset+size>end)throw Error('Неподдерживаемый ZIP');
 const entries=[],seen=new Set();let cursor=offset,total=0,root;
 for(let i=0;i<count;i++){
  if(cursor+46>offset+size||buffer.readUInt32LE(cursor)!==0x02014b50)throw Error('Повреждён каталог ZIP');
  const flags=buffer.readUInt16LE(cursor+8),method=buffer.readUInt16LE(cursor+10),crc=buffer.readUInt32LE(cursor+16),packed=buffer.readUInt32LE(cursor+20),unpacked=buffer.readUInt32LE(cursor+24),len=buffer.readUInt16LE(cursor+28),extra=buffer.readUInt16LE(cursor+30),comment=buffer.readUInt16LE(cursor+32),attr=buffer.readUInt32LE(cursor+38),local=buffer.readUInt32LE(cursor+42);
  if(cursor+46+len+extra+comment>offset+size||flags&1||![0,8].includes(method)||unpacked>128*1024*1024||((attr>>>16)&0o170000)===0o120000)throw Error('Небезопасная запись ZIP');
  const full=safeName(buffer.subarray(cursor+46,cursor+46+len).toString('utf8')),parts=full.split('/');root??=parts[0];if(root!==parts[0])throw Error('Ожидалась одна корневая папка');
  const name=parts.slice(1).join('/');cursor+=46+len+extra+comment;if(!name||name.endsWith('/'))continue;
  safeName(name);const key=name.toLowerCase();if(seen.has(key))throw Error('Повтор пути ZIP');seen.add(key);
  if(local+30>offset||buffer.readUInt32LE(local)!==0x04034b50)throw Error('Повреждён файл ZIP');
  const localNameLen=buffer.readUInt16LE(local+26),start=local+30+localNameLen+buffer.readUInt16LE(local+28);
  if(buffer.subarray(local+30,local+30+localNameLen).toString('utf8')!==full||start+packed>offset||((total+=unpacked)>maxBytes))throw Error('Превышен размер архива');
  entries.push({name,start,packed,unpacked,method,crc,mode:(attr>>>16)&0o777});
 }
 if(cursor!==offset+size)throw Error('Неверная длина каталога ZIP');
 // Destination must be freshly created, never an existing tree containing links.
 fs.mkdirSync(destination,{recursive:false,mode:0o700});
 try{for(const e of entries){const compressed=buffer.subarray(e.start,e.start+e.packed),data=e.method===8?zlib.inflateRawSync(compressed,{maxOutputLength:Math.max(1,e.unpacked)}):compressed;
   if(data.length!==e.unpacked||crc32(data)!==e.crc)throw Error('Контрольная сумма файла ZIP не совпала');
   const dest=path.join(destination,e.name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data,{mode:e.mode&0o111?0o755:0o644,flag:'wx'});
 }}catch(e){fs.rmSync(destination,{recursive:true,force:true});throw e;}
 return entries.map(e=>e.name);
}
module.exports={extract,safeName,crc32};
