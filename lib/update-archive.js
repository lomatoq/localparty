'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const table=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let n=0xffffffff;for(const b of bytes)n=table[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
function safeName(name){
  if(!name||/[\\\x00-\x1f:]/.test(name)||name.startsWith('/'))throw Error('Unsafe archive path');
  const parts=name.replace(/\/$/,'').split('/');
  if(parts.some(s=>!s||s==='.'||s==='..'||/[. ]$/.test(s)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:[.]|$)/i.test(s)))throw Error('Unsafe archive path');
  return parts;
}
// Parse everything BEFORE writing. No external unzip utility, npm hook or shell is run.
function entries(buffer,{maxBytes=1600*1024*1024,maxFile=250*1024*1024,maxFiles=30000}={}){
  if(!Buffer.isBuffer(buffer)||buffer.length<22)throw Error('Invalid ZIP');
  let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50&&i+22+buffer.readUInt16LE(i+20)===buffer.length){end=i;break;}
  if(end<0)throw Error('ZIP directory missing');
  const count=buffer.readUInt16LE(end+10),size=buffer.readUInt32LE(end+12),offset=buffer.readUInt32LE(end+16);
  if(buffer.readUInt16LE(end+4)||buffer.readUInt16LE(end+6)||buffer.readUInt16LE(end+8)!==count||count===65535||count>maxFiles||offset+size>end)throw Error('Unsupported ZIP layout');
  let at=offset,total=0,root=null;const list=[],seen=new Set();
  for(let i=0;i<count;i++){
    if(at+46>end||buffer.readUInt32LE(at)!==0x02014b50)throw Error('Invalid ZIP entry');
    const flags=buffer.readUInt16LE(at+8),method=buffer.readUInt16LE(at+10),crc=buffer.readUInt32LE(at+16),compressed=buffer.readUInt32LE(at+20),length=buffer.readUInt32LE(at+24),n=buffer.readUInt16LE(at+28),extra=buffer.readUInt16LE(at+30),comment=buffer.readUInt16LE(at+32),mode=buffer.readUInt32LE(at+38)>>>16,local=buffer.readUInt32LE(at+42);
    if(at+46+n+extra+comment>offset+size)throw Error('Invalid ZIP directory bounds');
    const name=buffer.toString('utf8',at+46,at+46+n),parts=safeName(name),directory=name.endsWith('/');
    if(root===null)root=parts[0];if(parts[0]!==root)throw Error('Archive must have one root folder');
    if((mode&0xf000)===0xa000||(flags&1)||![0,8].includes(method)||length>maxFile||compressed===0xffffffff||local===0xffffffff)throw Error('Unsupported or unsafe archive member');
    const relative=parts.slice(1).join('/'),key=relative.toLowerCase();if(relative&&seen.has(key))throw Error('Duplicate archive member');if(relative)seen.add(key);
    if(!directory&&!relative)throw Error('Expected a root folder');total+=length;if(total>maxBytes)throw Error('Archive exceeds extracted-size limit');
    if(local+30>offset||buffer.readUInt32LE(local)!==0x04034b50)throw Error('Invalid ZIP local header');
    const localN=buffer.readUInt16LE(local+26),start=local+30+localN+buffer.readUInt16LE(local+28);
    if(start+compressed>offset||buffer.toString('utf8',local+30,local+30+localN)!==name||buffer.readUInt16LE(local+8)!==method)throw Error('ZIP header mismatch');
    list.push({relative,directory,mode,method,crc,length,start,compressed});at+=46+n+extra+comment;
  }
  if(at!==offset+size||!list.length)throw Error('Invalid ZIP directory size');return list;
}
function extract(buffer,target,limits){
  const list=entries(buffer,limits);if(!fs.existsSync(target))fs.mkdirSync(target,{recursive:true});if(fs.readdirSync(target).length)throw Error('Staging directory must be empty');
  for(const e of list){if(!e.relative)continue;const dest=path.resolve(target,e.relative);if(!dest.startsWith(path.resolve(target)+path.sep))throw Error('Archive path escapes staging');
    if(e.directory){fs.mkdirSync(dest,{recursive:true});continue;}
    const raw=buffer.subarray(e.start,e.start+e.compressed),bytes=e.method===0?raw:zlib.inflateRawSync(raw,{maxOutputLength:e.length+1});
    if(bytes.length!==e.length||crc32(bytes)!==e.crc)throw Error('ZIP checksum mismatch');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes,{flag:'wx',mode:e.mode&0o111?0o755:0o644});
  }
  return list.filter(e=>!e.directory).length;
}
module.exports={crc32,safeName,entries,extract};
