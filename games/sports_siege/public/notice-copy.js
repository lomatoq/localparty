/* Event-kind copy avoids partially translating free-form protocol messages. */
export function eventNotice(event,players,language='en'){
 if(event.kind!=='machinegun'&&event.kind!=='friendly')return{text:event.text||'',localized:false};
 const name=players.find(player=>player.id===event.player)?.name||'';
 if(event.kind==='friendly')return{text:language==='ru'?`${name}: это был мирный!`:`${name}: that was a friendly!`,localized:true};
 return{text:language==='ru'?`${name} получает пулемёт на 8 секунд!`:`${name} gets a machine gun for 8 seconds!`,localized:true};
}
