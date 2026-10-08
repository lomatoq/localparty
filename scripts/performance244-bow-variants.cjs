'use strict';
// Run only in the exclusive browser profile slot assigned by root.
const {spawn}=require('node:child_process'),path=require('node:path');const root=path.resolve(__dirname,'..');
const variants=[['cache','.localparty-build/perf244/canvas-cache-before-gate'],['gate','.localparty-build/perf244/canvas-gate-before-hud'],['hud',null]];
async function run(name,source,pair){return new Promise((resolve,reject)=>{const env={...process.env,QA_OUTPUT:path.join(root,'output/playwright/performance244/canvas/variants',name+'-'+pair)};if(source)env.PERF_SOURCE_DIR=path.join(root,source);else delete env.PERF_SOURCE_DIR;const p=spawn(process.execPath,['scripts/performance244-bow.cjs'],{cwd:root,env,stdio:'inherit'});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error(name+'-'+pair+' failed '+code)));});}
(async()=>{for(let pair=1;pair<=2;pair++)for(const[name,source]of variants)await run(name,source,pair);})().catch(e=>{console.error(e);process.exitCode=1;});
