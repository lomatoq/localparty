'use strict';

// Two equal opportunities per player. Random geometry previously overwrote
// guaranteed sectors and gave some players no matching color at larger rosters.
module.exports = function buildSectors(players, round) {
  const tau = Math.PI * 2, sectors = [];
  if (!players.length) return [{ start: 0, end: tau, ownerId: null, type: 'neutral', color: '#3a414c' }];
  const danger = round >= 3 ? .10 : .04;
  const colorShare = (1 - danger) * .82;
  const neutralShare = 1 - danger - colorShare;
  let angle = 0;
  function add(share, type, player, color) {
    const end = angle + tau * share;
    sectors.push({ start: angle, end, ownerId: player?.id || null, type, color: player?.color || color });
    angle = end;
  }
  for (let half = 0; half < 2; half++) {
    for (let i = 0; i < players.length; i++) {
      const player = players[(i + round + half) % players.length];
      add(colorShare / (players.length * 2), 'player', player);
    }
    add(neutralShare / 2, 'neutral', null, '#3a414c');
    add(danger / 2, 'danger', null, '#15191f');
  }
  sectors.at(-1).end = tau;
  return sectors;
};
