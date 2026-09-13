'use strict';
const https=require('node:https'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {spawn,spawnSync}=require('node:child_process'),{extract}=require('./update-archive');
const REPO='lomatoq/localparty',ALPHA='alpha/party-sports-siege',API=`https://api.github.com/repos/${REPO}`;
const ALLOWED=new Set(['api.github.com','github.com','codeload.github.com','objects.githubusercontent.com','release-assets.githubusercontent.com']);
function download(url,{accept='application/vnd.github+json',limit=450*1024*1024,onProgress=()=>{},redirects=0}={}){
  const target=new URL(url);if(target.protocol!=='https:'||!ALLOWED.has(target.hostname)||target.username||target.password||target.port&&target.port!=='443')return Promise.reject(Error('Untrusted update URL'));
  if(redirects>5)return Promise.reject(Error('Too many download redirects'));
  return new Promise((resolve,reject)=>{
    const headers={'User-Agent':'LocalParty-Updater','Accept':accept,'X-GitHub-Api-Version':'2022-11-28'};
    // Never forward the user's token to a redirected asset/CDN host.
    if(target.hostname==='api.github.com'&&process.env.PARTY_GITHUB_TOKEN)headers.Authorization='Bearer '+process.env.PARTY_GITHUB_TOKEN;
    const req=https.get(target,{headers,timeout:20000},res=>{
      if([301,302,303,307,308].includes(res.statusCode)&&res.headers.location){res.resume();download(new URL(res.headers.location,target).href,{accept,limit,onProgress,redirects:redirects+1}).then(resolve,reject);return;}
      if(res.statusCode!==200){res.resume();reject(Error(res.statusCode===404?'GitHub: репозиторий или релиз недоступен. Для закрытой репы задайте PARTY_GITHUB_TOKEN на компьютере.':res.statusCode===403?'GitHub отклонил запрос: проверь права токена и лимит API.':`GitHub HTTP ${res.statusCode}`));return;}
      const total=Number(res.headers['content-length'])||0;if(total>limit){res.destroy();reject(Error('Update archive too large'));return;}
      let size=0;const chunks=[];res.on('data',b=>{size+=b.length;if(size>limit){res.destroy(Error('Download exceeds size limit'));return;}chunks.push(b);onProgress(total?size/total:null,size);});res.on('end',()=>resolve(Buffer.concat(chunks)));res.on('error',reject);
    });req.on('error',reject);req.on('timeout',()=>req.destroy(Error('GitHub download timed out')));
  });
}
const api=async url=>JSON.parse((await download(url,{limit:4*1024*1024})).toString('utf8'));
function sameDependencies(a,b){const stable=o=>JSON.stringify(Object.entries(o.dependencies||{}).sort(([a],[b])=>a.localeCompare(b)));return stable(a)===stable(b);}
function selectAsset(release,platform=process.platform,arch=process.arch){
  const target=platform==='win32'&&arch==='x64'?'windows-x64':platform==='darwin'&&['arm64','x64'].includes(arch)?`macos-${arch}`:null;
  if(!target)throw Error('Для этой ОС пока есть только Alpha из исходников.');
  const asset=release.assets?.find(a=>a.name.endsWith(`_${target}.zip`)&&a.state==='uploaded');
  if(!asset||!/^sha256:[a-f0-9]{64}$/.test(asset.digest||''))throw Error('В релизе нет подходящего архива с SHA-256.');return asset;
}
function createUpdater({root,isLocal,hostKey,isIdle,shutdown,getPort,scheme}){
  let running=false,target=null,state={status:'idle',progress:0,message:'Выбери канал и проверь обновления.'};
  const read=(file,fallback)=>{try{return JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));}catch{return fallback;}};
  const info=read('build-info.json',read('package.json',{})),installed=read('data/update-version.json',{});
  const view=()=>({...state,busy:running,version:info.version,channel:installed.channel||info.channel||'stable',hasToken:!!process.env.PARTY_GITHUB_TOKEN,target:target?{channel:target.channel,version:target.version,revision:target.revision}:null});
  const set=(status,message,progress=0)=>{state={status,message,progress};};
  async function check(channel){
    if(!['stable','alpha'].includes(channel))throw Error('Unknown update channel');
    if(channel==='stable'){const release=await api(API+'/releases/latest');if(release.draft||release.prerelease)throw Error('Stable release expected');const asset=selectAsset(release);return {channel,version:release.tag_name,revision:String(release.id),url:asset.url,digest:asset.digest,portable:true};}
    const ref=await api(API+'/git/ref/heads/'+ALPHA),sha=ref.object?.sha;if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('Invalid Alpha revision');
    return {channel,version:'Alpha · '+sha.slice(0,8),revision:sha,url:API+'/zipball/'+sha,portable:false};
  }
  async function install(selected){
    if(!isIdle())throw Error('Сначала завершите игру и вернитесь в лобби.');
    if(fs.existsSync(path.join(root,'.git'))){const status=spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8',windowsHide:true,timeout:5000});if(status.status!==0||status.stdout.trim())throw Error('В git-копии есть несохранённые изменения. Обновление не будет их перезаписывать.');}
    const parent=path.dirname(root),base=path.basename(root),suffix=Date.now()+'-'+crypto.randomBytes(3).toString('hex');
    const stage=path.join(parent,'.'+base+'.update-'+suffix),backup=path.join(parent,base+'.backup-'+suffix);let started=false;
    fs.mkdirSync(stage);
    try{
      set('downloading','Скачиваем проверенную версию…');
      const bytes=await download(selected.url,{accept:selected.portable?'application/octet-stream':'application/vnd.github+json',onProgress:(p,n)=>set('downloading',`Получено ${(n/1048576).toFixed(1)} МБ`,p===null?0:p*.65)});
      if(selected.digest&&'sha256:'+crypto.createHash('sha256').update(bytes).digest('hex')!==selected.digest)throw Error('SHA-256 архива не совпал. Установка отменена.');
      set('verifying','Проверяем архив и готовим отдельную папку…',.7);extract(bytes,stage);
      for(const file of ['server.js','catalog.json','package.json','lib/party-runtime.js'])if(!fs.existsSync(path.join(stage,file)))throw Error('В архиве отсутствует '+file);
      if(!selected.portable){
        const old=read('package.json',{}),next=JSON.parse(fs.readFileSync(path.join(stage,'package.json'),'utf8'));if(!sameDependencies(old,next))throw Error('В Alpha изменились зависимости. Нужен полный portable-релиз или npm ci в отдельной копии.');
        for(const name of ['node_modules','runtime']){const from=path.join(root,name);if(fs.existsSync(from))fs.cpSync(from,path.join(stage,name),{recursive:true,dereference:false});}
      }
      for(const file of ['node_modules/ws/package.json','node_modules/three/build/three.module.js','node_modules/@dimforge/rapier3d-compat/package.json'])if(!fs.existsSync(path.join(stage,file)))throw Error('В обновлении нет локальной зависимости: '+file);
      const runtime=process.platform==='win32'?'runtime/node/node.exe':'runtime/node/bin/node',portable=fs.existsSync(path.join(stage,runtime));
      const dir=fs.mkdtempSync(path.join(os.tmpdir(),'localparty-update-')),runner=path.join(dir,process.platform==='win32'?'node.exe':'node');fs.copyFileSync(process.execPath,runner);if(process.platform!=='win32')fs.chmodSync(runner,0o755);
      const helper=path.join(dir,'helper.js');fs.copyFileSync(path.join(root,'lib/update-helper.js'),helper);
      const plan={root,stage,backup,pid:process.pid,port:getPort(),tls:scheme==='https',runtime,portable,channel:selected.channel,version:selected.version,revision:selected.revision};const planFile=path.join(dir,'plan.json');fs.writeFileSync(planFile,JSON.stringify(plan),{mode:0o600});
      set('restarting','Перезапускаем. Старая версия сохранится рядом.',1);
      const child=spawn(runner,[helper,planFile],{cwd:dir,env:process.env,detached:true,windowsHide:true,stdio:'ignore'});
      await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});child.unref();started=true;setTimeout(shutdown,700);
    }finally{if(!started){fs.rmSync(stage,{recursive:true,force:true});running=false;}}
  }
  function reply(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
  async function handle(req,res,url){
    if(['/updates.js','/updates.css'].includes(url.pathname)){
      const file=path.join(root,'public',url.pathname.slice(1));res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);return true;
    }
    if(!url.pathname.startsWith('/api/update'))return false;
    if(!isLocal(req)||req.headers['x-party-host']!==hostKey||req.headers.origin&&req.headers.origin!==`${scheme}://${req.headers.host}`){reply(res,403,{error:'Обновление доступно только ведущему на этом компьютере.'});return true;}
    if(req.method==='GET'&&url.pathname==='/api/update'){reply(res,200,view());return true;}
    if(req.method!=='POST'||!['/api/update/check','/api/update/apply'].includes(url.pathname)){reply(res,405,{error:'Method not allowed'});return true;}
    if(running){reply(res,409,{error:'Обновление уже выполняется.'});return true;}
    running=true;
    try{
      if(url.pathname.endsWith('/check')){
        const channel=url.searchParams.get('channel');set('checking','Проверяем GitHub…');target=await check(channel);set('ready','Версия найдена. Перед установкой сохраним предыдущую папку.');running=false;reply(res,200,view());
      }else{
        if(!target)throw Error('Сначала проверь обновления.');if(!isIdle())throw Error('Сначала вернитесь в лобби.');const selected={...target};
        reply(res,202,{ok:true});install(selected).catch(e=>{running=false;set('error',e.message);});
      }
    }catch(e){running=false;target=null;set('error',e.message);reply(res,400,{error:e.message,...view()});}
    return true;
  }
  return {handle,view,get busy(){return running;}};
}
module.exports={createUpdater,download,sameDependencies,selectAsset,ALPHA};
