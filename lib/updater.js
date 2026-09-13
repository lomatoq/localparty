'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),https=require('node:https');
const {execFile,spawn}=require('node:child_process'),{promisify}=require('node:util');
const exec=promisify(execFile),{extract}=require('./update-archive');
const REPO='lomatoq/localparty',BRANCH='alpha/sports-siege-swipe',API='https://api.github.com/repos/'+REPO;
const SHA=/^[a-f0-9]{40}$/i;
function digest(b){return crypto.createHash('sha256').update(b).digest('hex');}
function cacheFor(root){return path.join(os.homedir(),'.localparty-updates',digest(Buffer.from(path.resolve(root))).slice(0,16));}
function dependencyIdentity(lock){const p=JSON.parse(lock);delete p.version;if(p.packages?.[''])delete p.packages[''].version;return JSON.stringify(p);}
async function token(){if(process.env.PARTY_GITHUB_TOKEN)return process.env.PARTY_GITHUB_TOKEN.trim();try{return(await exec('gh',['auth','token'],{encoding:'utf8',timeout:4000,windowsHide:true})).stdout.trim();}catch{return '';}}
function allowedDownload(url){const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&['api.github.com','github.com','codeload.github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(u.hostname);}
function download(url,auth,{max=256*1024*1024,accept='application/vnd.github+json',redirect=0,onProgress}={}){
 if(!allowedDownload(url)||redirect>5)return Promise.reject(Error('Неожиданный адрес загрузки'));
 return new Promise((resolve,reject)=>{
  const u=new URL(url),headers={'User-Agent':'LocalParty-Alpha-Updater','Accept':accept,'X-GitHub-Api-Version':'2022-11-28'};
  if(auth&&u.hostname==='api.github.com')headers.Authorization='Bearer '+auth;
  const req=https.get(u,{headers,timeout:30000},res=>{
   if([301,302,303,307,308].includes(res.statusCode)&&res.headers.location){res.resume();download(new URL(res.headers.location,u).href,auth,{max,accept,redirect:redirect+1,onProgress}).then(resolve,reject);return;}
   if(res.statusCode!==200){res.resume();reject(Error([401,403,404].includes(res.statusCode)?'GitHub не дал доступ. Для приватной репы: gh auth login или PARTY_GITHUB_TOKEN с Contents: read.':'GitHub: HTTP '+res.statusCode));return;}
   let size=0;const chunks=[],total=Number(res.headers['content-length']||0);if(total>max){res.destroy();reject(Error('Архив слишком большой'));return;}
   res.on('data',b=>{size+=b.length;if(size>max){res.destroy(Error('Превышен размер загрузки'));return;}chunks.push(b);onProgress?.(size,total);});
   res.on('end',()=>resolve(Buffer.concat(chunks)));res.on('error',reject);
  });req.on('timeout',()=>req.destroy(Error('GitHub не отвечает. Текущая версия не менялась.')));req.on('error',reject);
 });
}
function createUpdater({root,hostKey,isLocal,isBusy,getPort,shutdown}){
 const cache=cacheFor(root);let running=false,candidate=null,status={phase:'idle',message:'Выберите канал и проверьте обновления.'};
 const pkg=()=>JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 function progress(phase,message,extra={}){status={phase,message,...extra};}
 async function git(args){return(await exec('git',['-C',root,...args],{encoding:'utf8',timeout:120000,windowsHide:true,maxBuffer:4*1024*1024})).stdout.trim();}
 async function sourceInfo(){if(!fs.existsSync(path.join(root,'.git')))return null;return {previous:await git(['rev-parse','HEAD']),dirty:!!(await git(['status','--porcelain']))};}
 async function check(channel){
  if(!['stable','alpha'].includes(channel))throw Error('Неизвестный канал');
  const auth=await token(),info=await sourceInfo();
  if(info?.dirty)throw Error('Есть незакоммиченные изменения. Сохраните их перед обновлением; они не будут перезаписаны.');
  const remote=JSON.parse((await download(channel==='alpha'?API+'/commits/'+encodeURIComponent(BRANCH):API+'/releases/latest',auth,{max:3*1024*1024})).toString());
  const revision=channel==='alpha'?remote.sha:null;
  if(revision&&!SHA.test(revision))throw Error('Некорректная ревизия GitHub');
  candidate={id:crypto.randomUUID(),channel,revision,tag:channel==='stable'?remote.tag_name:null,assets:remote.assets||[],version:channel==='alpha'?'alpha · '+revision.slice(0,8):remote.tag_name,previous:info?.previous,source:!!info,created:Date.now()};
  if(channel==='stable'){
   const commit=JSON.parse((await download(API+'/commits/'+encodeURIComponent(remote.tag_name),auth,{max:3*1024*1024})).toString());
   if(!SHA.test(commit.sha))throw Error('Некорректная ревизия релиза');candidate.revision=commit.sha;
  }
  const current=info?.previous;progress('checked',current===candidate.revision?'Эта ревизия уже установлена.':'Версия доступна. Установка перезапустит сервер.',{candidate:{id:candidate.id,channel,version:candidate.version,current:current===candidate.revision}});
 }
 async function prepare(id,rollback=false){
  if(isBusy())throw Error('Сначала вернитесь в лобби. Обновление во время игры запрещено.');
  if(running)throw Error('Обновление уже выполняется');
  if(!rollback&&(!candidate||candidate.id!==id||Date.now()-candidate.created>15*60000))throw Error('Сначала проверьте выбранный канал заново');
  running=true;fs.mkdirSync(cache,{recursive:true,mode:0o700});
  try{
   const info=await sourceInfo();if(info?.dirty)throw Error('Есть локальные изменения. Установка отменена.');
   const plan={root,cache,pid:process.pid,port:getPort(),tls:!!process.env.PARTY_TLS_PFX,executable:process.execPath,backup:path.join(cache,'backup-'+Date.now()),previous:info?.previous};
   if(rollback){
    const old=JSON.parse(fs.readFileSync(path.join(cache,'last-update.json'),'utf8'));if(old.root!==root)throw Error('Резервная копия другой установки');
    if(old.kind==='git')Object.assign(plan,{kind:'restore-git',revision:old.previous,channel:'rollback'});
    else{
     if(info)throw Error('Тип установки изменился');const stage=path.join(cache,'restore-'+Date.now());fs.mkdirSync(stage);
     for(const name of require('./update-worker.cjs').SCOPE.concat(old.full?['node_modules','runtime','RUNTIME_MANIFEST.json']:[])){const file=path.join(old.backup,name);if(fs.existsSync(file))fs.cpSync(file,path.join(stage,name),{recursive:true});}
     Object.assign(plan,{kind:'portable',stage,full:old.full,channel:'rollback'});
    }
   }else{
    const c=candidate,auth=await token();Object.assign(plan,{revision:c.revision,channel:c.channel});
    progress('downloading','Загружаем '+c.version+'…');
    if(info){
     // Credentials are process-local environment configuration, never URL/argv/logs.
     const env={...process.env,GIT_TERMINAL_PROMPT:'0'};if(auth){env.GIT_CONFIG_COUNT='1';env.GIT_CONFIG_KEY_0='http.https://github.com/.extraheader';env.GIT_CONFIG_VALUE_0='AUTHORIZATION: basic '+Buffer.from('x-access-token:'+auth).toString('base64');}
     await exec('git',['-C',root,'fetch','--no-tags','https://github.com/'+REPO+'.git',c.revision],{env,timeout:120000,windowsHide:true,maxBuffer:4*1024*1024});
     const next=await git(['show',c.revision+':package-lock.json']);
     if(dependencyIdentity(next)!==dependencyIdentity(fs.readFileSync(path.join(root,'package-lock.json'),'utf8')))throw Error('В новой версии изменились зависимости. Установите её отдельно с npm ci; текущая игра не изменена.');
     Object.assign(plan,{kind:'git',previous:info.previous});
    }else{
     let address=API+'/zipball/'+c.revision,hash=null,full=false;
     if(c.channel==='stable'){
      const target={win32:'windows',darwin:'macos'}[process.platform];if(!target)throw Error('Для этой платформы нет portable-релиза. Используйте git-копию.');
      const asset=c.assets.find(a=>a.name.endsWith('_'+target+'-'+process.arch+'.zip'));if(!asset)throw Error('В релизе нет архива для этой архитектуры');
      address=asset.url;hash=/^sha256:([a-f0-9]{64})$/i.exec(asset.digest||'')?.[1];
      if(!hash){const side=c.assets.find(a=>a.name===asset.name+'.sha256');if(!side)throw Error('У релиза нет SHA-256');hash=(await download(side.url,auth,{max:1024,accept:'application/octet-stream'})).toString().trim().split(/\s+/)[0];}
      if(!/^[a-f0-9]{64}$/i.test(hash))throw Error('Неверная контрольная сумма релиза');full=true;
     }
     const bytes=await download(address,auth,{accept:'application/octet-stream',onProgress:(n,total)=>progress('downloading','Загружаем '+c.version+'…',{bytes:n,total})});
     if(hash&&digest(bytes)!==hash.toLowerCase())throw Error('SHA-256 архива не совпал. Установка отменена.');
     const stage=path.join(cache,'stage-'+Date.now());extract(bytes,stage);
     for(const file of ['server.js','catalog.json','package.json','package-lock.json','lib/party-runtime.js'])if(!fs.existsSync(path.join(stage,file)))throw Error('В архиве отсутствует '+file);
     if(!full&&dependencyIdentity(fs.readFileSync(path.join(stage,'package-lock.json'),'utf8'))!==dependencyIdentity(fs.readFileSync(path.join(root,'package-lock.json'),'utf8')))throw Error('Alpha требует другие зависимости. Нужна новая portable-сборка. Текущая установка не изменена.');
     if(full&&!fs.existsSync(path.join(stage,'runtime','node',process.platform==='win32'?'node.exe':'bin/node')))throw Error('В portable-архиве нет Node.js');
     Object.assign(plan,{kind:'portable',stage,full});
    }
   }
   if(isBusy())throw Error('За время загрузки началась игра. Вернитесь в лобби и повторите установку.');
   const worker=path.join(cache,'worker-'+Date.now()+'.cjs'),node=worker+(process.platform==='win32'?'.node.exe':'.node');
   fs.copyFileSync(path.join(root,'lib','update-worker.cjs'),worker);fs.copyFileSync(process.execPath,node);fs.chmodSync(node,0o700);
   const planFile=worker+'.json';fs.writeFileSync(planFile,JSON.stringify(plan),{mode:0o600});
   const out=fs.openSync(path.join(cache,'updater.log'),'a');const child=spawn(node,[worker,planFile],{cwd:cache,stdio:['ignore',out,out],detached:true,windowsHide:true});
   await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});child.unref();fs.closeSync(out);
   progress('restarting','Перезапуск. Страница подключится к новой версии.');setTimeout(shutdown,750).unref();
  }catch(e){running=false;progress('error',e.message);throw e;}
 }
 async function route(req,res){
  const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/api/updates'))return false;
  const answer=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  const origin=(process.env.PARTY_TLS_PFX?'https':'http')+'://'+req.headers.host;
  if(!isLocal(req)||req.headers['x-party-host']!==hostKey||(req.headers.origin&&req.headers.origin!==origin)||req.headers['sec-fetch-site']==='cross-site'){answer(403,{error:'Обновление доступно только ведущему на компьютере запуска.'});return true;}
  try{
   if(req.method==='GET'&&url.pathname==='/api/updates'){let previous=null;try{previous=JSON.parse(fs.readFileSync(path.join(cache,'status.json'),'utf8'));}catch{}answer(200,{...status,version:pkg().version,build:'alpha',branch:BRANCH,rollback:fs.existsSync(path.join(cache,'last-update.json')),previous});return true;}
   if(req.method!=='POST')throw Error('Метод не поддерживается');
   if(!String(req.headers['content-type']).startsWith('application/json'))throw Error('Нужен JSON');
   let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>2048)throw Error('Запрос слишком большой');}const body=JSON.parse(text||'{}');
   if(running)throw Error('Обновление уже выполняется');
   if(url.pathname==='/api/updates/check'){running=true;try{await check(body.channel);}finally{running=false;}answer(200,status);}
   else if(url.pathname==='/api/updates/install'||url.pathname==='/api/updates/rollback'){
    if(body.confirm!==true)throw Error('Подтвердите перезапуск');
    if(isBusy())throw Error('Сначала вернитесь в лобби');
    // Finish downloads before stopping the launcher; reject concurrent installs.
    prepare(body.id,url.pathname.endsWith('/rollback')).catch(e=>progress('error',e.message));answer(202,{ok:true});
   }else answer(404,{error:'Не найдено'});
  }catch(e){answer(400,{error:e.message});}return true;
 }
 return {route,get running(){return running;}};
}
module.exports={createUpdater,dependencyIdentity,allowedDownload,cacheFor};
