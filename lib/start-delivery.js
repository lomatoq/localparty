'use strict';
// Readiness is an intent, not a one-shot DOM event. Keep relaying it until the
// game process acknowledges its playing phase (a slow host can miss postMessage).
function relayStart(active, clients, send) {
  if (!active || active.game.engine !== 'sports_siege' || !active.session.startRequested ||
      active.session.paused || (active.ui?.phase || 'waiting') !== 'waiting') return 0;
  let count = 0;
  for (const client of clients) if (client.isHost) {
    send(client, {type:'session-start', instance:active.instance});
    count++;
  }
  return count;
}
module.exports = {relayStart};
