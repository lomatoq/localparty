'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
class ProfileStore{
 constructor(file){this.file=file;this.data={version:1,players:[],events:[]};if(file&&fs.existsSync(file)){try{const d=JSON.parse(fs.readFileSync(file,'utf8'));if(d.version===1&&Array.isArray(d.players)&&Array.isArray(d.events))this.data=d;}catch{fs.copyFileSync(file,file+'.corrupt-'+Date.now());}}}
 save(){if(!this.file)return;fs.mkdirSync(path.dirname(this.file),{recursive:true});const tmp=this.file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(this.data));fs.renameSync(tmp,this.file);}
 get(token){return this.data.players.find(p=>p.token===token);}
 register(token,name,hand,avatar){let p=this.get(token);if(!p){p={id:crypto.randomBytes(8).toString('hex'),token:crypto.randomBytes(24).toString('hex'),createdAt:Date.now(),stats:{played:0,wins:0,points:0,games:{}}};this.data.players.push(p);}p.name=name;p.hand=hand;if(avatar!==undefined)p.avatar=avatar||null;p.lastSeen=Date.now();this.save();return p;}
 record(result,session,game){
  const eventKey=session+':'+result.eventId;if(this.data.events.some(e=>e.key===eventKey))return false;
  const valid=[];
  for(const row of result.players||[]){const p=this.data.players.find(p=>p.id===row.id);if(!p||valid.some(x=>x.id===p.id))continue;
   const score=Number.isFinite(Number(row.score))?Math.max(-1e9,Math.min(1e9,Number(row.score))):0;
   const metrics={};for(const [k,v] of Object.entries(row.metrics||{}))if(/^[a-zA-Z][a-zA-Z0-9_]{0,30}$/.test(k)&&typeof v==='number'&&Number.isFinite(v))metrics[k]=v;
   const won=!!row.won;const rank=Number(row.rank)||0;
   // Overall standing uses comparable participation/win points, not incomparable game currencies.
   p.stats||={played:0,wins:0,points:0,games:{}};p.stats.played++;p.stats.wins+=Number(won);p.stats.points+=10+(won?30:0);
   const s=p.stats.games[game]||={played:0,wins:0,totalScore:0,bestScore:null,metrics:{}};s.played++;s.wins+=Number(won);s.totalScore+=score;s.bestScore=s.bestScore===null?score:Math.max(s.bestScore,score);
   for(const [k,v] of Object.entries(metrics)){
    const old=s.metrics[k];
    if(/^(bestLap|reactionMs|bestReactionMs|finishTime)$/.test(k)){if(v>0)s.metrics[k]=old>0?Math.min(old,v):v;}
    else if(/^(bestStreak|streak|level|levels|towerHeight)$/.test(k))s.metrics[k]=Math.max(old||0,v);
    else s.metrics[k]=(old||0)+v;
   }
   valid.push({id:p.id,name:p.name,score,won,rank,metrics});
  }
  if(!valid.length)return false;
  this.data.completed=(this.data.completed||this.data.events.length)+1;this.data.events.push({key:eventKey,game,at:Date.now(),duration:result.duration||0,players:valid});if(this.data.events.length>500)this.data.events.splice(0,this.data.events.length-500);this.save();return true;
 }
 leaderboard(){return this.data.players.filter(p=>p.stats?.played).map(({id,name,avatar,stats})=>({id,name,avatar:avatar||null,...stats})).sort((a,b)=>b.points-a.points||b.wins-a.wins||a.name.localeCompare(b.name));}
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
