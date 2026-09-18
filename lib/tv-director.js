'use strict';
/** Display-only presentation state. Invoked ONLY behind the existing host auth.
 * Never starts/stops games, changes player scores or grants TV admin rights. */
const SAFE_PHASES = new Set(['waiting', 'results']);
const LIMIT = 16;
const label = (v, limit=80) => String(v ?? '').replace(/[\x00-\x1f]/g,'').slice(0, limit);
const finite = v => typeof v === 'number' && Number.isFinite(v);
const validRank = v => Number.isInteger(v) && v > 0 && v <= LIMIT;
function context(active) {
  return active ? {instance:active.instance, game:active.game?.id || active.id,
    phase:active.ui?.phase || 'waiting', paused:!!(active.userPaused || active.session?.paused)} : null;
}
function canCover(active) { const a=context(active); return !a || a.paused || SAFE_PHASES.has(a.phase); }
function matchRows(result, knownPlayers) {
  const people=new Map(knownPlayers.map(p=>[p.id,p]));const seen=new Set();
  return (Array.isArray(result?.players)?result.players:[]).slice(0,64).flatMap(r=>{
    if(!r || typeof r.id!=='string' || seen.has(r.id) || !people.has(r.id))return [];
    seen.add(r.id);const p=people.get(r.id);
    return [{id:p.id,name:label(p.name),rank:validRank(r.rank)?r.rank:r.won===true?1:null,
      score:finite(r.score)?Math.max(-1e9,Math.min(1e9,r.score)):0,won:r.won===true}];
  }).sort((a,b)=>(a.rank??999)-(b.rank??999)).slice(0,LIMIT);
}
function companyRows(leaderboard) {
  let previous='',rank=0;
  return leaderboard.slice(0,LIMIT).map((p,i)=>{
    const signature=`${p.points}:${p.wins}`;
    if(signature!==previous)rank=i+1;previous=signature;
    return {id:p.id,name:label(p.name),rank,points:Number(p.points)||0,score:Number(p.points)||0,won:rank===1};
  });
}
class TVDirector {
  constructor({catalog, store}) {
    this.catalog=catalog;this.store=store;
    const saved=store.data.tvOptions||{};
    this.options={autoPodium:saved.autoPodium===true,effects:saved.effects!==false,idleBrowse:saved.idleBrowse!==false};
    this.overlay='none';this.boardKind='company';this.focusId=null;this.focusRevision=0;
    this.browse=false;this.revision=0;this.lastMatch=null;this.dismissedKey=null;
    const savedResult=store.data.events?.at(-1), game=catalog.find(g=>g.id===savedResult?.game);
    if(game&&typeof savedResult.key==='string'&&savedResult.key.includes(':')){const i=savedResult.key.indexOf(':');this.capture({...savedResult,eventId:savedResult.key.slice(i+1)},savedResult.key.slice(0,i),game);}
  }
  capture(result, instance, game, testMode=false) {
    if(!result || !['string','number'].includes(typeof result.eventId))return false;
    const rows=matchRows(result,this.store.data.players||[]);
    if(!rows.length)return false;
    const key=label(instance,64)+':'+label(result.eventId,128);
    if(key===this.lastMatch?.key)return false;
    this.lastMatch={key,instance,game:game.id,title:game.title,rows,testMode:!!testMode};
    this.revision++;return true;
  }
  resetRun() {this.overlay='none';this.dismissedKey=null;this.revision++;}
  dismiss() {this.overlay='none';this.dismissedKey=this.lastMatch?.key||null;this.revision++;}
  follow(id) {if(this.catalog.some(g=>g.id===id)){this.focusId=id;this.browse=false;this.focusRevision++;this.revision++;}}
  command(m, {active=null,busy=false,selected=null,sharing=false}={}) {
    if(busy)throw Error('Дождись завершения запуска игры.');
    if(m.type==='tv-options') {
      const patch=m.options;
      if(!patch || typeof patch!=='object' || Array.isArray(patch) || !Object.keys(patch).length ||
        Object.keys(patch).some(k=>!Object.hasOwn(this.options,k)||typeof patch[k]!=='boolean'))throw Error('Неизвестная настройка экрана.');
      Object.assign(this.options,patch);this.store.data.tvOptions={...this.options};this.store.save();
    } else if(m.type==='tv-focus') {
      if(active)throw Error('Листать каталог можно в лобби.');
      if(!this.catalog.length)throw Error('Каталог ещё не готов.');
      let index;
      if(Object.hasOwn(m,'number')) {
        if(!Number.isInteger(m.number)||m.number<1||m.number>this.catalog.length)throw Error('Такого номера игры нет.');
        index=m.number-1;
      } else {
        if(m.direction!==-1&&m.direction!==1)throw Error('Направление должно быть −1 или +1.');
        const current=this.catalog.findIndex(g=>g.id===(this.focusId||selected));
        index=current<0?(m.direction>0?0:this.catalog.length-1):(current+m.direction+this.catalog.length)%this.catalog.length;
      }
      this.focusId=this.catalog[index].id;this.browse=true;this.focusRevision++;this.overlay='none';
    } else if(m.type==='tv-overlay') {
      if(!['none','qr','podium'].includes(m.mode))throw Error('Неизвестный экран.');
      if(m.mode!=='none'&&!canCover(active))throw Error('Сначала поставь матч на паузу — экран игры останется доступным.');
      if(m.mode==='qr'&&!sharing)throw Error('Сначала включи доступ по Wi-Fi для гостей.');
      if(m.mode==='podium') {
        if(!['company','match'].includes(m.boardKind))throw Error('Выбери итоги матча или рейтинг компании.');
        if(m.boardKind==='match'&&!this.lastMatch)throw Error('Пока нет результатов матча.');
        if(m.boardKind==='company'&&!this.store.leaderboard().length)throw Error('В рейтинге пока нет результатов.');
        this.boardKind=m.boardKind;
      }
      this.overlay=m.mode;this.dismissedKey=this.lastMatch?.key||null;
    } else throw Error('Неизвестная команда показа.');
    this.revision++;
  }
  view({active=null,selected=null,sharing=false,leaderboard=null}={}) {
    const a=context(active), match=this.lastMatch,leaders=leaderboard||this.store.leaderboard();
    let mode=canCover(active)?this.overlay:'none',kind=this.boardKind,automatic=false;
    if(mode==='qr'&&!sharing)mode='none';
    if(mode==='none'&&this.options.autoPodium&&a?.phase==='results'&&match&&
       match.instance===a.instance&&match.game===a.game&&match.key!==this.dismissedKey) {
      mode='podium';kind='match';automatic=true;
    }
    const focus=this.focusId||selected;const ordinal=this.catalog.findIndex(g=>g.id===focus);
    let board=null;
    if(mode==='podium') {
      const rows=kind==='match'?match?.rows||[]:companyRows(leaders);
      if(!rows.length)mode='none';
      else board={key:kind==='match'?match.key:'company:'+JSON.stringify(rows.map(r=>[r.id,r.rank,r.points])),
        kind,title:kind==='match'?match.title:'Топ компании',
        subtitle:kind==='match'?(match.testMode?'Тестовый матч · без записи в рейтинг':'Итоги этого матча'):'Общие очки за все сыгранные матчи',rows};
    }
    return {...this.options,revision:this.revision,mode,automatic,board,focusId:ordinal<0?null:focus,
      focusNumber:ordinal<0?0:ordinal+1,focusRevision:this.focusRevision,browse:this.browse,
      total:this.catalog.length,canCover:canCover(active),hasMatch:!!match,hasCompany:!!leaders.length};
  }
}
module.exports={TVDirector,matchRows,companyRows,canCover};
