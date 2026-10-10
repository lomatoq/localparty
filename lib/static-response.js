'use strict';
const crypto=require('node:crypto'),zlib=require('node:zlib'),fs=require('node:fs'),path=require('node:path');
const {promisify}=require('node:util');
const brotli=promisify(zlib.brotliCompress),gzip=promisify(zlib.gzip);
const {cssFallbacks}=require('./browser-compat');
const css=new Map(),responses=new Map();
function boundedSet(map,key,value){if(map.size>=256)map.delete(map.keys().next().value);map.set(key,value);return value;}
function compatibleCSS(source){if(css.has(source))return css.get(source);return boundedSet(css,source,cssFallbacks(source));}
async function staticResponse(req,res,key,source,type,transform=value=>value){
 let entry=responses.get(key);
 if(!entry||!entry.source.equals(source)){
  const body=Buffer.from(transform(source.toString('utf8'))),hash=crypto.createHash('sha256').update(body).digest('hex');
  entry=boundedSet(responses,key,{source,body,hash,encodings:{}});
 }
 const headers={'Content-Type':type,'Cache-Control':process.env.PARTY_EMBEDDED==='1'&&new URL(req.url,'http://local').searchParams.get('party_v')===global.__partyAssetVersion?'public,max-age=31536000,immutable':'public,max-age=0,must-revalidate','ETag':'W/"'+entry.hash+'"','Vary':'Accept-Encoding','X-Content-Type-Options':'nosniff'};
 if((req.headers['if-none-match']||'').split(/\s*,\s*/).includes(headers.ETag)){res.writeHead(304,headers);return res.end();}
 // Build-time variants in the iOS bundle; desktop generates each variant once
 // on the zlib worker pool, never synchronously on the network event loop.
 const accepted=(req.headers['accept-encoding']||'').split(',').map(s=>s.trim().split(';')).filter(([,q])=>!q||!/^q=0(?:\.0*)?$/.test(q.trim())).map(([name])=>name);
 const encoding=accepted.includes('br')?'br':accepted.includes('gzip')?'gzip':null;
 let body=entry.body;
 if(encoding&&body.length>=512){
  entry.encodings[encoding]??=(async()=>{
   const prepared=path.join(__dirname,'../.precompressed',entry.hash+(encoding==='br'?'.br':'.gz'));
   try{return await fs.promises.readFile(prepared);}catch{}
   return encoding==='br'?brotli(entry.body,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:4}}):gzip(entry.body);
  })();
  body=await entry.encodings[encoding];headers['Content-Encoding']=encoding;
 }
 headers['Content-Length']=body.length;res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:body);
}
module.exports={staticResponse,compatibleCSS};
