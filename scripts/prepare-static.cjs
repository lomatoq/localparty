'use strict';
// Precompress immutable JS/CSS in a staged release, never generated QA artifacts.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {cssFallbacks}=require('../lib/browser-compat');
const root=path.resolve(process.argv[2]||'.'),out=path.join(root,'.precompressed');fs.mkdirSync(out,{recursive:true});
let count=0;const current=new Set();
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()){if(!['node_modules','assets'].includes(entry.name))walk(file);continue;}if(!/\.(css|js)$/.test(entry.name))continue;const text=fs.readFileSync(file,'utf8'),body=Buffer.from(entry.name.endsWith('.css')?cssFallbacks(text):text);if(body.length<512)continue;const hash=crypto.createHash('sha256').update(body).digest('hex');current.add(hash+'.br');current.add(hash+'.gz');fs.writeFileSync(path.join(out,hash+'.br'),zlib.brotliCompressSync(body,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:5}}));fs.writeFileSync(path.join(out,hash+'.gz'),zlib.gzipSync(body));count++;}}
walk(path.join(root,'public'));for(const game of fs.readdirSync(path.join(root,'games')))for(const dir of ['public','static']){const folder=path.join(root,'games',game,dir);if(fs.existsSync(folder))walk(folder);}for(const file of fs.readdirSync(out))if(!current.has(file)&&/^[a-f0-9]{64}\.(br|gz)$/.test(file))fs.unlinkSync(path.join(out,file));console.log('Precompressed static resources:',count);
