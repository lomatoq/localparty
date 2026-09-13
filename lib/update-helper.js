'use strict';
// Runs from a separate temporary directory using a copied Node executable.
// In particular, Windows must not run this helper from the installation it renames.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),https=require('node:https'),{spawn}=require('node:child_process');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PRESERVE=['data','data-local','certs','.certificates','.env','user-config.json'];
function copyUserData(source,target){for(const name of PRESERVE){const from=path.join(source,name);if(fs.existsSync(from))fs.cpSync(from,path.join(target,name),{recursive:true,dereference:false,force:true});}}
function launch(root,plan){
  const node=plan.portable?path.join(root,plan.runtime):process.execPath;
  const logs=path.join(root,'data');fs.mkdirSync(logs,{recursive:true});const fd=fs.openSync(path.join(logs,'update-launch.log'),'a');
  const child=spawn(node,[path.join(root,'server.js')],{cwd:root,env:{...process.env,PARTY_PORT:String(plan.port),PARTY_NO_BROWSER:'1'},detached:true,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);child.on('error',()=>{});child.unref();return child;
}
function healthy(plan){return new Promise(resolve=>{
  // Only loopback is used here; a user's LAN certificate may not include localhost.
  const req=(plan.tls?https:http).get({host:'127.0.0.1',port:plan.port,path:'/api/health',rejectUnauthorized:false,timeout:700},res=>{let b='';res.on('data',d=>b+=d);res.on('end',()=>{try{resolve(res.statusCode===200&&JSON.parse(b).ok===true);}catch{resolve(false);}});});req.on('error',()=>resolve(false));req.on('timeout',()=>{req.destroy();resolve(false);});
});}
async function apply(plan){
  for(const key of ['root','stage','backup'])if(!path.isAbsolute(plan[key]||''))throw Error('Invalid update plan');
  if(path.dirname(plan.root)!==path.dirname(plan.stage)||path.dirname(plan.root)!==path.dirname(plan.backup)||path.dirname(plan.root)===plan.root||plan.root===plan.stage||plan.root===plan.backup||plan.stage===plan.backup)throw Error('Unsafe update paths');
  let stopped=false;for(let i=0;i<150;i++){try{process.kill(plan.pid,0);}catch{stopped=true;break;}await sleep(200);}
  if(!stopped)throw Error('Launcher did not stop; no files changed');
  let swapped=false,child;
  try{
    copyUserData(plan.root,plan.stage);
    fs.mkdirSync(path.join(plan.stage,'data'),{recursive:true});fs.writeFileSync(path.join(plan.stage,'data','update-version.json'),JSON.stringify({channel:plan.channel,version:plan.version,revision:plan.revision,backup:plan.backup,installedAt:new Date().toISOString()},null,2));
    fs.renameSync(plan.root,plan.backup);swapped=true;fs.renameSync(plan.stage,plan.root);
    child=launch(plan.root,plan);let ready=false;for(let i=0;i<40;i++){await sleep(500);if(await healthy(plan)){ready=true;break;}}
    if(!ready)throw Error('New launcher failed its health check');return {ok:true,backup:plan.backup};
  }catch(error){
    if(swapped){child?.kill();await sleep(900);if(fs.existsSync(plan.root))fs.renameSync(plan.root,plan.stage+'.failed');fs.renameSync(plan.backup,plan.root);launch(plan.root,plan);}
    else launch(plan.root,plan);
    throw error;
  }
}
if(require.main===module){const file=process.argv[2];apply(JSON.parse(fs.readFileSync(file,'utf8'))).then(result=>fs.writeFileSync(file+'.result',JSON.stringify(result))).catch(error=>{fs.writeFileSync(file+'.result',JSON.stringify({ok:false,error:error.message}));process.exitCode=1;});}
module.exports={copyUserData,apply};
