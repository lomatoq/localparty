'use strict';
// Copied outside the installation before the old process stops (also on Windows).
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),https=require('node:https');
const {spawn,spawnSync}=require('node:child_process');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SCOPE=['server.js','catalog.json','package.json','package-lock.json','README.md','RELEASE_NOTES.md','ARCHIVE_AUDIT.md','build-info.json','START_WINDOWS.bat','START_MAC.command','START_HTTPS.bat','public','lib','games','scripts','licenses'];
function json(file,value){fs.writeFileSync(file,JSON.stringify(value,null,2),{mode:0o600});}
function git(root,args){const r=spawnSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,timeout:60000});if(r.error||r.status)throw Error('Git не смог безопасно переключить версию');return r.stdout.trim();}
function restart(plan){
 const bundled=path.join(plan.root,'runtime','node',process.platform==='win32'?'node.exe':'bin/node');
 const executable=fs.existsSync(bundled)?bundled:plan.executable;
 const out=fs.openSync(path.join(plan.cache,'launcher.log'),'a');
 const child=spawn(executable,[path.join(plan.root,'server.js')],{cwd:plan.root,env:{...process.env,PARTY_PORT:String(plan.port),PARTY_NO_BROWSER:'1'},stdio:['ignore',out,out],detached:true,windowsHide:true});child.on('error',()=>{});child.unref();fs.closeSync(out);return child;
}
async function healthy(plan,child){
 for(let i=0;i<80;i++){
  if(child.exitCode!==null)return false;
  const ok=await new Promise(resolve=>{
   const request=(plan.tls?https:http).get({host:'127.0.0.1',port:plan.port,path:'/api/health',rejectUnauthorized:false,timeout:700},res=>{
    let b='';res.on('data',d=>{b+=d;if(b.length>4096)request.destroy();});
    res.on('end',()=>{try{const value=JSON.parse(b);resolve(res.statusCode===200&&value.ok===true&&(!value.pid||value.pid===child.pid));}catch{resolve(false);}});
   });
   request.on('error',()=>resolve(false));request.on('timeout',()=>{request.destroy();resolve(false);});
  });
  if(ok){await sleep(800);if(child.exitCode===null)return true;}await sleep(250);
 }
 return false;
}
function restorePortable(plan,journal){
 for(const item of [...journal].reverse()){
  const dest=path.join(plan.root,item.name),backup=path.join(plan.backup,item.name);
  if(item.installed)fs.rmSync(dest,{recursive:true,force:true});
  if(fs.existsSync(backup)){fs.rmSync(dest,{recursive:true,force:true});fs.renameSync(backup,dest);}
 }
}
async function run(plan){
 let journal=[],child=null,changed=false;
 const status=(phase,message)=>json(path.join(plan.cache,'status.json'),{phase,message,at:Date.now()});
 status('restarting','Ждём завершения сервера');
 for(let i=0;i<60;i++){try{process.kill(plan.pid,0);}catch{break;}if(i===59)throw Error('Старый сервер не завершился. Файлы не менялись.');await sleep(250);}
 fs.mkdirSync(plan.backup,{recursive:true,mode:0o700});
 const data=path.join(plan.root,'data','party.json');if(fs.existsSync(data))fs.copyFileSync(data,path.join(plan.backup,'party-profiles.backup.json'));
 try{
  if(plan.kind==='git'){
   if(git(plan.root,['status','--porcelain','--untracked-files=no']).length)throw Error('После подготовки изменились файлы проекта');
   if(git(plan.root,['rev-parse','HEAD'])!==plan.previous)throw Error('Текущая версия изменилась после подготовки');
   git(plan.root,['-c','core.hooksPath='+path.join(plan.cache,'no-hooks'),'checkout','--detach',plan.revision]);changed=true;
  }else if(plan.kind==='restore-git'){
   if(git(plan.root,['status','--porcelain']).length)throw Error('Локальные изменения мешают откату');
   git(plan.root,['-c','core.hooksPath='+path.join(plan.cache,'no-hooks'),'checkout','--detach',plan.revision]);changed=true;
  }else{
   const names=plan.full?[...SCOPE,'node_modules','runtime','RUNTIME_MANIFEST.json']:SCOPE;
   for(const name of names){
    const incoming=path.join(plan.stage,name),dest=path.join(plan.root,name),backup=path.join(plan.backup,name);
    const item={name,hadOriginal:fs.existsSync(dest),installed:false};journal.push(item);json(path.join(plan.backup,'journal.json'),journal);
    if(item.hadOriginal)fs.renameSync(dest,backup);
    if(fs.existsSync(incoming)){item.installed=true;json(path.join(plan.backup,'journal.json'),journal);fs.cpSync(incoming,dest,{recursive:true,dereference:false,preserveTimestamps:true});}
    json(path.join(plan.backup,'journal.json'),journal);
   }changed=true;
  }
  status('restarting','Запускаем обновлённую версию');child=restart(plan);
  if(!await healthy(plan,child))throw Error('Новая версия не прошла проверку запуска');
  json(path.join(plan.cache,'last-update.json'),{root:plan.root,kind:plan.kind==='git'||plan.kind==='restore-git'?'git':'portable',backup:plan.backup,previous:plan.previous,channel:plan.channel,revision:plan.revision,full:!!plan.full});
  status('done','Обновление установлено. Профили сохранены.');
 }catch(error){
  if(child){try{child.kill();}catch{}await sleep(1200);}
  if(plan.kind==='git'||plan.kind==='restore-git'){if(changed)git(plan.root,['-c','core.hooksPath='+path.join(plan.cache,'no-hooks'),'checkout','--detach',plan.previous]);}
  else restorePortable(plan,journal);
  restart(plan);status('error','Установка отменена, предыдущие файлы восстановлены. '+error.message);
 }
}
if(require.main===module){const file=process.argv[2];let plan;try{plan=JSON.parse(fs.readFileSync(file,'utf8'));}catch{process.exit(1);}run(plan).catch(e=>{try{process.kill(plan.pid,0);}catch{restart(plan);}json(path.join(plan.cache,'status.json'),{phase:'error',message:e.message});});}
module.exports={SCOPE,restorePortable,run};
