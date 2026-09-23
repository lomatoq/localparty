/* Pure TV information adapters. Pass public host snapshots only; no DOM/writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LocalPartyTVInformation=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const groups=[
  ['party','live','push shrink knives bomb western'],['tanks','live','tanks'],['tankarena','live','tankarena'],
  ['chaos','mission','chaos'],['kart','live','kart'],['monster','prompt','monster'],['spy','prompt','spy'],
  ['millionaire','prompt','millionaire'],['quiz','prompt','sinyakquiz warsaw'],['crocodile','prompt','crocodile'],
  ['jenga','turn','jenga'],['crane','turn','crane'],['naval','live','naval'],['drawguess','prompt','drawguess'],
  ['western_duel','turn','western_duel'],['arcade','live','taprace flappy hungry snakelines carryball'],['arcade','turn','punchmeter'],
  ['arcade_deluxe','mission','marble_bloom'],['arcade_deluxe','turn','pocket_siege'],['bow_club','live','bow_club'],
  ['tabletop','turn','poker'],['tabletop','live','airhockey'],['tabletop','mission','mines'],
  ['sports_siege','turn','curling bowling'],['sports_siege','mission','swarm_gate'],['sports_siege','live','peek_shoot']
 ];
 const registry=Object.freeze(Object.fromEntries(groups.flatMap(([engine,family,ids])=>ids.split(' ').map(id=>[id,Object.freeze({engine,family})]))));
 // Editorial summaries of catalog rules, not claims about live state.
 const objectives={
 push:['Вытолкни остальных с арены.','Push rivals out. Stay inside.'],
 shrink:['Удержись на сужающейся арене.','Stay inside the shrinking arena.'],
 knives:['Попадай ножами в свой цвет.','Hit your color with each knife.'],
 bomb:['Передай бомбу до взрыва.','Pass the bomb before it explodes.'],
 western:['Жди сигнал. Стреляй первым.','Wait for the signal. Shoot first.'],
 tanks:['Выполняй цель выбранного режима.','Play the objective of this mode.'],
 tankarena:['Собирай оружие. Попадай в соперников.','Collect weapons. Hit your rivals.'],
 chaos:['Один курсор. Действуйте вместе.','One cursor. Work together.'],
 kart:['Проходи круги. Финишируй первым.','Complete your laps. Finish first.'],
 monster:['Нарисуй свою часть общего монстра.','Draw your part of the monster.'],
 spy:['Задавай вопросы. Найди шпиона.','Ask questions. Find the spy.'],
 millionaire:['Выбери ответ на телефоне.','Answer on your phone.'],
 sinyakquiz:['Выбери ответ на телефоне.','Answer on your phone.'],
 warsaw:['Выбери ответ на телефоне.','Answer on your phone.'],
 crocodile:['Показывай без слов. Угадывайте.','Act it out. Others guess.'],
 jenga:['Вытащи блок. Не урони башню.','Pull a block. Keep it standing.'],
 crane:['Ставь блоки. Сохрани башню.','Stack blocks. Keep it standing.'],
 naval:['Находи и топи корабли соперников.','Find and sink the enemy ships.'],
 drawguess:['Один рисует. Остальные угадывают.','One draws. Everyone else guesses.'],
 western_duel:['Жди сигнал. Не стреляй раньше.','Wait for GO. Do not fire early.'],
 taprace:['Тапай быстрее. Доберись до финиша.','Tap faster. Reach the finish.'],
 punchmeter:['Три удара. Набери больше очков.','Three hits. Score the most points.'],
 flappy:['Пролетай между препятствиями.','Fly through the gaps.'],
 hungry:['Собирай еду. Стань больше соперников.','Collect food. Outgrow your rivals.'],
 snakelines:['Не врезайся в стены и следы.','Avoid walls and trails.'],
 carryball:['Передавай мяч. Забивай командой.','Pass the ball. Score as a team.'],
 marble_bloom:['Собирай цепочки одного цвета.','Match marbles of the same color.'],
 pocket_siege:['Попадай в соперников. Набирай очки.','Hit rivals. Most points wins.'],
 bow_club:['Попадай в мишени. Набирай очки.','Hit targets. Score points.'],
 poker:['Собери комбинацию или блефуй.','Make a hand or make rivals fold.'],
 airhockey:['Защищай ворота. Забивай голы.','Defend your goal. Score goals.'],
 mines:['Открывайте клетки. Избегайте мин.','Open safe cells. Avoid the mines.'],
 curling:['Подведи камень ближе к центру.','Slide closest to the center.'],
 bowling:['Сбей кегли. Набери больше очков.','Knock down pins. Score the most.'],
 swarm_gate:['Защищайте ворота от роя.','Protect the gate from the swarm.'],
 peek_shoot:['Попадай в цели. Не трогай белый флаг.','Hit targets. Spare the white flags.']
 };
 const text=v=>typeof v==='string'?v.replace(/[\x00-\x1f]/g,'').slice(0,180):null;
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 const phaseLabels={waiting:'Ожидание',lobby:'Ожидание',countdown:'Приготовиться',playing:'Игра',racing:'Гонка',results:'Результаты',finished:'Результаты',result:'Результаты',paused:'Пауза',reveal:'Результат раунда',between:'Между раундами',question:'На ответ',turn:'Показываем',drawing:'Рисуем',battle:'Бой',voting:'Голосование',waitingSignal:'Ждём сигнал',draw:'Огонь'};
 const pocketStages={loadout:'Выбор арсенала',aim:'Прицеливание',drone:'Дрон в полёте',flight:'Выстрел / осыпание'};
 function normalize({game={},ui=null,snapshot=null,now=null,paused=false}={}){
  const id=game.id,config=registry[id]||{engine:null,family:null},u=ui&&typeof ui==='object'?ui:{},s=snapshot&&typeof snapshot==='object'?snapshot:null;
  const status=s?.game||s||{},rawPhase=text(s?.phase)||text(status.status)||text(s?.status)||text(u.phase),isPaused=paused||u.phase==='paused'||s?.paused===true;
  const out={id:text(id),title:text(game.title),family:config.family,phase:rawPhase,phaseLabel:isPaused?'Пауза':phaseLabels[rawPhase]||null,
   objective:objectives[id]?{text:objectives[id][0],english:objectives[id][1],kind:'static',source:'catalog-rule-summary'}:game.goal?{text:text(game.goal),kind:'static',source:'catalog.goal'}:null,actor:text(u.currentPlayer),progress:text(u.progress)||null,timer:null,metrics:[],paused:isPaused,
   statusLabel:text(u.label),coverage:config.engine?'runtime-ui':'unsupported',sources:{phase:s?'public-snapshot':'runtime.ui',actor:u.currentPlayer?'runtime.ui':null,progress:u.progress?'runtime.ui':null}};
  const wall=(end,label='Осталось')=>{if(finite(end)&&end>0)out.timer={kind:'deadline',clock:'epoch-ms',endsAt:end,remainingSeconds:finite(now)?Math.max(0,(end-now)/1000):null,label,paused:isPaused};};
  const remaining=(n,label='Осталось',clock='remaining-seconds')=>{if(finite(n))out.timer={kind:'remaining',clock,remainingSeconds:Math.max(0,n),label,paused:isPaused};};
  const simulation=end=>{if(finite(end)&&end>0&&finite(s?.t)&&rawPhase==='playing')remaining(end-s.t,'Осталось','simulation-seconds');};
  if(!isPaused)wall(u.endsAt,text(u.label)||'Осталось');
  if(!s){if(id==='pocket_siege'&&rawPhase==='playing'&&!isPaused)out.phaseLabel=pocketStages[u.stage]||out.phaseLabel;return out;}
  out.coverage='public-snapshot';const players=Array.isArray(s.players)?s.players:[];
  const actor=value=>{const name=typeof value==='object'?text(value?.name):text(players.find(p=>p.id===value)?.name);if(name){out.actor=name;out.sources.actor='public-snapshot';}};
  const progress=(a,b,label)=>{if(finite(a)&&finite(b)){out.progress=`${label} ${a} / ${b}`;out.sources.progress='public-snapshot';}};
  const metric=(key,label,value)=>{if(finite(value)||typeof value==='string')out.metrics.push({key,label,value:typeof value==='string'?text(value):value,source:'public-snapshot'});};
  const scored=players.filter(p=>finite(p.score));if(scored.length){const leader=scored.reduce((a,b)=>b.score>a.score?b:a);metric('leader','Лидер',leader.name);metric('score','Очки',leader.score);}
  // Public snapshots sometimes contain internal deadlines (Western's secret
  // random draw moment). Only explicitly public phase clocks enter the HUD.
  const publicDeadlinePhases={millionaire:['question','reveal'],sinyakquiz:['question','reveal'],warsaw:['question','reveal'],crocodile:['turn','between'],drawguess:['drawing','reveal'],naval:['battle'],western_duel:['countdown','reveal']};
  if(!isPaused&&publicDeadlinePhases[id]?.includes(rawPhase))wall(s.endsAt);
  if(id==='western_duel'&&['waitingSignal','draw'].includes(rawPhase))out.timer=null;
  if(config.engine==='party'||id==='tanks'){
   progress(status.round,status.maxRounds,'Раунд');if(rawPhase==='playing')remaining(status.timer);if(rawPhase==='countdown')remaining(status.countdown,'Старт');
   if(players.some(p=>typeof p.alive==='boolean'))metric('alive','В игре',players.filter(p=>p.alive&&p.connected!==false).length);
  }
  if(config.engine==='arcade'||id==='tankarena'){
   if(rawPhase==='playing')remaining(s.timer);
   if(id==='snakelines'&&finite(s.round))metric('round','Раунд',s.round);
   if(id==='punchmeter'){actor(s.punchTurn);const p=players.find(p=>p.id===s.punchTurn);if(Array.isArray(p?.hits))progress(Math.min(3,p.hits.length+1),3,'Попытка');}
   if(id==='carryball'&&Array.isArray(s.teams)&&s.teams.every(finite))metric('teams','Команды',s.teams.join(' : '));
  }
  if(id==='pocket_siege'){
   actor(s.activeId);if(!isPaused&&rawPhase==='playing')out.phaseLabel=pocketStages[s.stage]||out.phaseLabel;
   out.timer=null;if(s.stage==='aim')simulation(s.deadline);else if(s.stage==='drone')simulation(s.drone?.deadline);else if(s.stage==='loadout')simulation(s.loadoutDeadline);
   if(finite(s.turn))metric('turn','Ход',s.turn+1);metric('rounds','Раундов',s.rounds);metric('wind','Ветер',s.wind);
   if(s.stage==='loadout'){metric('ready','Арсенал готов',players.filter(p=>p.participant&&p.loadoutReady).length);metric('draftSize','Оружий в арсенале',s.draftSize);}
  }
  if(id==='marble_bloom'){
   out.family=s.arenaMode==='versus'?'live':'mission';if(rawPhase==='playing'&&s.arenaMode==='versus'&&finite(s.duration)&&finite(s.t))remaining(s.duration-s.t);
   metric('level','Уровень',s.levelName);metric('queue','В очереди',s.queue);if(Array.isArray(s.chain))metric('chain','На поле',s.chain.length);if(s.combo>1)metric('combo','Комбо',s.combo);
  }
  if(id==='kart'){metric('laps','Кругов',s.laps);metric('raceTime','Время гонки, с',s.race_time);if(s.status==='countdown')remaining(s.countdown,'Старт');}
  if(id==='monster'){actor(s.activePlayerId);progress(s.completed,s.total,'Частей');if(rawPhase==='playing')wall(s.turnDeadline);}
  if(id==='spy'){if(s.currentTurn?.asker){actor(s.currentTurn.asker);const target=text(s.currentTurn.target?.name);if(target)metric('target','Отвечает',target);}if(rawPhase==='playing')wall(s.timerEndsAt);}
  if(id==='millionaire'){actor(s.activePlayerId);progress(s.turnsUsed,s.settings?.maxTurns,'Ходов');metric('turnsLeft','Осталось ходов',s.turnsLeft);}
  if(config.engine==='quiz'){progress(finite(s.round)?Math.min(s.round+1,s.total):null,s.total,'Вопрос');metric('submitted','Ответов',s.submitted);}
  if(id==='crocodile'){actor(s.actor);metric('guessed','Угадано',s.turnGuessed);metric('skipped','Пропущено',s.turnSkips);}
  if(id==='drawguess'){actor(s.artistId??s.artist);progress(finite(s.turn)?Math.min(s.turn+1,s.total):null,s.total,'Ход');}
  if(id==='jenga'){actor(s.currentId);if(rawPhase==='playing')wall(s.turnEnds);metric('moves','Блоков',s.moves);metric('stability','Устойчивость',s.stability?.level);if(s.settling&&!isPaused)out.phaseLabel='Башня успокаивается';}
  if(id==='crane'){actor(s.activeId);metric('height','Этажей',s.height);metric('lives','Жизни',s.lives);progress(finite(s.turns)?Math.min(s.turns+(rawPhase==='results'?0:1),s.maxTurns):null,s.maxTurns,'Ход');if(rawPhase==='playing'&&s.turnStage==='aiming')wall(s.deadline);}
  if(id==='western_duel'&&Array.isArray(s.duel?.pair)){const names=s.duel.pair.map(pid=>text(players.find(p=>p.id===pid)?.name)).filter(Boolean);if(names.length){out.actor=names.join(' × ');out.sources.actor='public-snapshot';}}
  if(id==='bow_club'){if(rawPhase==='playing')remaining(s.remaining);metric('arrows','Стрел на игрока',s.arrows);}
  if(config.engine==='tabletop'){if(rawPhase==='playing')remaining(s.remaining);if(id==='poker'){actor(s.turn);metric('hand','Раздача',s.hand);metric('pot','Банк',s.pot);metric('bet','Текущая ставка',s.currentBet);}if(id==='airhockey'&&Array.isArray(s.goals)&&s.goals.every(finite))metric('goals','Счёт',s.goals.join(' : '));}
  if(config.engine==='sports_siege'){
   actor(s.currentId);simulation(s.deadline);
   if(id==='curling'){progress(s.endIndex,s.endCount,'Энд');metric('throw','Камень',finite(s.throwIndex)?s.throwIndex+1:null);}
   if(id==='bowling'){metric('frames','Фреймов',s.frameCount);const p=players.find(p=>p.id===s.currentId);if(Array.isArray(p?.frames))metric('frame','Фрейм',p.frames.length);}
   if(id==='swarm_gate'){progress(s.wave,s.waveCount,'Волна');metric('gate','Прочность ворот',s.gate);metric('waveLeft','Ещё в рое',s.waveLeft);}
  }
  // No secrets, questions, answer payloads, hole cards or nested state copied.
  if(['waiting','lobby','results','finished','result'].includes(rawPhase))out.timer=null;
  if(isPaused&&out.timer)out.timer.paused=true;
  return out;
 }
 function createPublisher({game,ui=()=>null,instance,send,now=()=>Date.now(),enabled=true}){
  let last=-Infinity,signature='';
  return function publish(snapshot){
   if(!enabled||!snapshot||typeof snapshot!=='object')return false;
   const at=now();if(at-last<250)return false;
   const info=normalize({game:typeof game==='function'?game():game,ui:ui(),snapshot,now:at});
   const next=JSON.stringify(info);if(next===signature&&at-last<1000)return false;
   signature=next;last=at;send({type:'party-tv-information',instance,info});return true;
  };
 }
 return Object.freeze({registry,normalize,createPublisher,objectives,pocketStageLabel:stage=>pocketStages[stage]||null});
});
