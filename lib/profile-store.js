'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {rankResultRows,resultRanking,resultTeam}=require('./result-ranking');
class ProfileStore{
 constructor(file,{deferred=false,onError=error=>console.error('Profile persistence:',error.message)}={}){
  this.file=file;this.deferred=deferred;this.onError=onError;this.failures=0;this.dirty=0;this.written=0;this.timer=null;this.writing=null;this.avatars=new WeakMap();this.diskPhotos=new Set();this.gcKey=null;this.data={version:1,players:[],events:[]};
  if(file&&fs.existsSync(file)){try{const d=JSON.parse(fs.readFileSync(file,'utf8'));if(d.version===1&&Array.isArray(d.players)&&Array.isArray(d.events))this.data=d;}catch{fs.copyFileSync(file,file+'.corrupt-'+Date.now());}}
  if(file)for(const p of this.data.players)if(!p.avatar&&/^[a-f0-9]{64}$/.test(p.avatarFile||'')){try{p.avatar=fs.readFileSync(this.avatarPath(p.avatarFile),'utf8');this.diskPhotos.add(p.avatarFile);}catch{p.avatar=null;}}
 }
 avatarPath(hash){return path.join(this.file+'.avatars',hash);}
 snapshot(){
  const photos=[];
  const players=this.data.players.map(p=>{
   const {avatar,avatarFile:old,...metadata}=p;if(!avatar)return metadata;
   let cached=this.avatars.get(p);if(cached?.value!==avatar){cached={value:avatar,hash:crypto.createHash('sha256').update(avatar).digest('hex'),saved:false};this.avatars.set(p,cached);}
   if(!this.diskPhotos.has(cached.hash))photos.push(cached);return {...metadata,avatarFile:cached.hash};
  });
  return {json:JSON.stringify({...this.data,players}),photos,refs:new Set(players.map(p=>p.avatarFile).filter(Boolean))};
 }
 save(){
  if(!this.file)return;this.dirty++;
  if(this.deferred){if(!this.timer)this.timer=setTimeout(()=>{this.timer=null;this.flush().catch(this.onError);},100);return;}
  const {json,photos,refs}=this.snapshot();fs.mkdirSync(path.dirname(this.file),{recursive:true});
  for(const photo of photos){fs.mkdirSync(this.file+'.avatars',{recursive:true});const file=this.avatarPath(photo.hash);fs.writeFileSync(file+'.tmp',photo.value);fs.renameSync(file+'.tmp',file);photo.saved=true;this.diskPhotos.add(photo.hash);}
  fs.writeFileSync(this.file+'.tmp',json);fs.renameSync(this.file+'.tmp',this.file);this.written=this.dirty;
  const gcKey=[...refs].sort().join(',');if(gcKey!==this.gcKey){if(fs.existsSync(this.file+'.avatars'))for(const name of fs.readdirSync(this.file+'.avatars'))if(/^[a-f0-9]{64}$/.test(name)&&!refs.has(name)){fs.unlinkSync(this.avatarPath(name));this.diskPhotos.delete(name);}this.gcKey=gcKey;}
 }
 async flush(){
  clearTimeout(this.timer);this.timer=null;
  if(!this.file||!this.deferred)return;
  if(this.writing){await this.writing;if(this.written<this.dirty)return this.flush();return;}
  this.writing=(async()=>{
   while(this.written<this.dirty){
    const revision=this.dirty,{json,photos,refs}=this.snapshot();await fs.promises.mkdir(path.dirname(this.file),{recursive:true});
    for(const photo of photos){await fs.promises.mkdir(this.file+'.avatars',{recursive:true});const file=this.avatarPath(photo.hash);await fs.promises.writeFile(file+'.tmp',photo.value);await fs.promises.rename(file+'.tmp',file);photo.saved=true;this.diskPhotos.add(photo.hash);}
    await fs.promises.writeFile(this.file+'.tmp',json);await fs.promises.rename(this.file+'.tmp',this.file);this.written=revision;this.failures=0;
    // Only collect after metadata commits. A crash before commit keeps old photos.
    const gcKey=[...refs].sort().join(',');if(gcKey!==this.gcKey){for(const name of await fs.promises.readdir(this.file+'.avatars').catch(()=>[]))if(/^[a-f0-9]{64}$/.test(name)&&!refs.has(name)){await fs.promises.unlink(this.avatarPath(name)).catch(()=>{});this.diskPhotos.delete(name);}this.gcKey=gcKey;}
   }
  })();
  try{await this.writing;}catch(error){if(!this.timer){this.timer=setTimeout(()=>{this.timer=null;this.flush().catch(this.onError);},Math.min(30000,1000*2**Math.min(this.failures++,5)));this.timer.unref?.();}throw error;}finally{this.writing=null;}
 }

 normalizeCoins(player){player.stats||={played:0,wins:0,games:{}};const stats=player.stats;stats.coins=Math.max(0,Number.isFinite(Number(stats.coins))?Number(stats.coins):Number(stats.points)||0);stats.points=stats.coins;stats.games||={};return stats;}
 get(token){return this.data.players.find(p=>p.token===token);}
 gameActivity(){
  if(!this.data.gameActivity){
   this.data.gameActivity={};
   for(const event of this.data.events){const item=this.data.gameActivity[event.game]||={matches:0,seconds:0};item.matches++;item.seconds+=Math.max(0,Number(event.duration)||0);}
  }
  return this.data.gameActivity;
 }
 resetStatistics(){
  this.statisticsRevision=(this.statisticsRevision||0)+1;
  for(const player of this.data.players)player.stats={played:0,wins:0,points:0,coins:0,games:{}};
  this.data.events=[];this.data.gameActivity={};this.data.completed=0;this.save();
 }
 register(token,name,hand,avatar){let p=this.get(token);if(!p){p={id:crypto.randomBytes(8).toString('hex'),token:crypto.randomBytes(24).toString('hex'),createdAt:Date.now(),stats:{played:0,wins:0,points:0,coins:0,games:{}}};this.data.players.push(p);}this.normalizeCoins(p);const changed=p.name!==name||p.hand!==hand||!p.lastSeen||(avatar!==undefined&&(p.avatar||null)!==(avatar||null));p.name=name;p.hand=hand;if(avatar!==undefined)p.avatar=avatar||null;p.lastSeen=Date.now();if(changed)this.save();return p;}
 record(result,session,game,revision=this.statisticsRevision||0){
  if(revision!==(this.statisticsRevision||0))return false;
  const eventKey=session+':'+result.eventId;if(this.data.events.some(e=>e.key===eventKey))return false;
  const valid=[];
  for(const row of result.players||[]){const p=this.data.players.find(p=>p.id===row.id);if(!p||valid.some(x=>x.id===p.id))continue;
   const score=Number.isFinite(Number(row.score))?Math.max(-1e9,Math.min(1e9,Number(row.score))):0;
   const metrics={};for(const [k,v] of Object.entries(row.metrics||{}))if(/^[a-zA-Z][a-zA-Z0-9_]{0,30}$/.test(k)&&typeof v==='number'&&Number.isFinite(v))metrics[k]=v;
   const won=!!row.won;const rank=Number(row.rank)||0;
   // Coins retain the existing comparable reward: 10 participation + 30 for a win.
   // points remains a compatibility alias, so historical balances never reset.
   this.normalizeCoins(p);const coinsEarned=10+(won?30:0);p.stats.played++;p.stats.wins+=Number(won);p.stats.coins+=coinsEarned;p.stats.points=p.stats.coins;
   const s=p.stats.games[game]||={played:0,wins:0,totalScore:0,bestScore:null,metrics:{}};s.played++;s.wins+=Number(won);s.totalScore+=score;s.bestScore=s.bestScore===null?score:Math.max(s.bestScore,score);
   for(const [k,v] of Object.entries(metrics)){
    const old=s.metrics[k];
    if(/^(bestLap|reactionMs|bestReactionMs|finishTime)$/.test(k)){if(v>0)s.metrics[k]=old>0?Math.min(old,v):v;}
    else if(/^(bestStreak|streak|level|levels|towerHeight)$/.test(k))s.metrics[k]=Math.max(old||0,v);
    else s.metrics[k]=(old||0)+v;
   }
   valid.push({id:p.id,name:p.name,score,won,rank,metrics,coinsEarned,coins:p.stats.coins,...resultTeam(row)});
  }
  if(!valid.length)return false;
  const activity=this.gameActivity()[game]||=( {matches:0,seconds:0} );activity.matches++;activity.seconds+=Math.max(0,Number(result.duration)||0);
  const ranked=rankResultRows(valid,result);this.data.completed=(this.data.completed||this.data.events.length)+1;this.data.events.push({key:eventKey,game,at:Date.now(),duration:result.duration||0,ranking:resultRanking(result),players:ranked});if(this.data.events.length>500)this.data.events.splice(0,this.data.events.length-500);this.save();return true;
 }
 leaderboard(){for(const p of this.data.players)this.normalizeCoins(p);return this.data.players.filter(p=>p.stats?.played).map(({id,name,avatar,stats})=>({id,name,avatar:avatar||null,...stats})).sort((a,b)=>b.coins-a.coins||b.wins-a.wins||a.name.localeCompare(b.name));}
}
const MAX_AVATAR_BYTES=96*1024;
function normalizeAvatar(value){
 if(value===null||value==='')return null;
 if(typeof value!=='string'||value.length>MAX_AVATAR_BYTES*1.45)throw Error('Фото слишком большое. Выберите другое изображение.');
 const match=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);if(!match)throw Error('Фото должно быть JPEG, PNG или WebP.');
 const bytes=Buffer.from(match[2],'base64');if(!bytes.length||bytes.length>MAX_AVATAR_BYTES)throw Error('Фото слишком большое. Максимум 96 КБ после обработки.');
 const jpeg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff,png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),webp=bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
 if(!(match[1]==='jpeg'&&jpeg||match[1]==='png'&&png||match[1]==='webp'&&webp))throw Error('Файл фото повреждён или имеет неверный формат.');
 return `data:image/${match[1]};base64,${match[2]}`;
}
module.exports={ProfileStore,normalizeAvatar,MAX_AVATAR_BYTES};
