'use strict';
// The same validated settings drive the native form, TV preview and game worker.
const choice=(id,label,values,initial)=>({id,label,options:values.map(v=>Array.isArray(v)?{value:String(v[0]),label:v[1]}:{value:String(v),label:String(v)}),initial:String(initial)});
const fields={
 bowling:[choice('frames','Фреймы',[3,5,10],5)],
 curling:[choice('ends','Энды',[1,3,5],3)],
 swarm_gate:[choice('waves','Волны',[4,6,8],6)],
 peek_shoot:[choice('seconds','Секунд на матч',[60,90,120],90)],
 party:[choice('maxRounds','Раунды',[5,6,7,8,9,10],7)],
 tanks:[choice('mode','Режим',[['survival','Выживание'],['ctf','Захват флага'],['coop','Кооператив']], 'survival')],
 kart:[choice('laps','Круги',Array.from({length:99},(_,i)=>i+1),5)],
 quiz:[choice('mode','Команды',[['solo','Каждый за себя'],['teams','По командам']],'solo'),choice('count','Вопросы',[3,5,7,10,15,20,30],10),choice('seconds','Секунд на ответ',[5,8,10,15,20,30,45,60],15)],
 crocodile:[choice('mode','Команды',[['solo','Каждый за себя'],['teams','По командам']],'solo'),choice('seconds','Секунд на ход',[60,90,120],90),choice('turns','Ходы',[6,10,16],10)],
 drawguess:[choice('seconds','Секунд на рисунок',[30,60,90],60)],
 spy:[choice('spies','Шпионы',[1,2,3],1),choice('minutes','Минут на обсуждение',Array.from({length:19},(_,i)=>i+2),8),choice('categoryHint','Подсказка категории',[['true','Включена'],['false','Выключена']],'true')],
 millionaire:[choice('maxTurns','Вопросы',[3,5,7,10,15,20,30],5),choice('seconds','Секунд на ответ',[5,8,10,15,20,30,45,60],10)],
 monster:[choice('promptMode','Задания',[['chaos','Разные персонажи'],['same','Один персонаж']],'chaos')]
};
const actions={
 quiz:[['reveal','Показать ответ',['playing']],['next','Следующий вопрос',['reveal']]],
 crocodile:[['end','Завершить ход',['playing']],['next','Следующий ход',['reveal']]],
 drawguess:[['end','Показать слово',['playing']]],
 naval:[['finish','Завершить бой',['playing']]],
 spy:[['beginVote','Перейти к голосованию',['playing']],['finishVote','Завершить голосование',['playing']]],
 millionaire:[['next','Следующий вопрос',['reveal']]]
};
function schema(game){const engine=game.engine||game.id;const settings=[...(fields[game.id]||fields[engine]||[])];if(game.id==='shrink')settings.push(choice('shrinkSpeed','Сужение арены',[['normal','Обычное'],['fast','Быстрое']],'normal'));return {settings,actions:(actions[engine]||[]).map(([id,label,phases])=>({id,label,phases}))};}
function settingsFor(game,patch={}){if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('Некорректные настройки');const fields=schema(game).settings;if(Object.keys(patch).some(k=>!fields.some(f=>f.id===k)))throw Error('Неизвестная настройка игры');return Object.fromEntries(fields.map(f=>{const value=String(patch[f.id]??f.initial);if(!f.options.some(o=>o.value===value))throw Error('Некорректная настройка: '+f.label);return [f.id,value]}));}
function workerSettings(game,values){const out=Object.fromEntries(Object.entries(settingsFor(game,values)).map(([k,v])=>[k,v==='true'?true:v==='false'?false:/^\d+$/.test(v)?Number(v):v]));if(game.engine==='party')out.mode=game.id;if(game.engine==='quiz')out.topic=game.id==='warsaw'?'warsaw':'sinyak';return out;}
module.exports={schema,settingsFor,workerSettings};
