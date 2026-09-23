'use strict';

const reference = require('./pocket-reference.generated.json');

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const finite = values => values.flat().filter(Number.isFinite);
const max = (values, fallback = 0) => values.length ? Math.max(...values) : fallback;
const median = (values, fallback = 0) => {
  if (!values.length) return fallback;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
const hex = (r, g, b) => `#${[r, g, b].map(value => clamp(Math.round(value || 0), 0, 255).toString(16).padStart(2, '0')).join('')}`;
const list = value => Array.isArray(value) ? value : value === undefined ? [] : [value];
const at = (values, index) => values[index] ?? values[0];
const STAGE_CODES = { EXPLOSION: 'E', SHRAPNEL: 'S', FIRE: 'F', FOG: 'G', LIGHTNING: 'L', ZAPPER: 'Z', MAGICWALL: 'W', DIRTBALL: 'D', DIRTMOVER: 'M', DIRTSLINGER: 'T', SUPERBALL: 'B' };
function materialOf(block){
  const name=block.name.toLowerCase(),mode=block.values.BLIT_MODE;
  if(!['SUPERBALL','FIRE','FOG'].includes(block.type))return null;
  if(/nitro|freeze|feeze|\bice|glacier/i.test(name))return 'ice';
  if(/acid/.test(name))return 'acid';
  if(/water|aqua|swim|puddle|tidal|rapids/.test(name)&&!/mist|foam/.test(name))return 'water';
  if(/lava|melt/.test(name))return 'lava';
  if(block.type==='FOG'||mode==='FOG')return 'fog';
  if(block.type==='FIRE'||mode==='FIRE')return 'fire';
  if(/glue|rubber|oil.*blob/.test(name))return 'goo';
  if(mode==='GAS')return 'water';
  return null;
}
const MATERIAL_CODE={water:'Q',ice:'I',acid:'A',lava:'V',fog:'G',fire:'F',goo:'U'};

function offsetRange(value) {
  if (Number.isFinite(value)) return { min: value, max: value };
  const text = String(value || '').toUpperCase();
  if (!text || text === 'NONE') return { min: 0, max: 0 };
  const random = text.match(/RND\s+(-?\d+(?:\.\d+)?)/);
  const stripped = text.replace(/RESET|SET/g, '').replace(/RND\s+-?\d+(?:\.\d+)?/g, '');
  const base = [...stripped.matchAll(/[+-]?\s*\d+(?:\.\d+)?/g)]
    .reduce((sum, match) => sum + Number(match[0].replace(/\s/g, '')), 0);
  const span = Math.abs(Number(random?.[1] || 0));
  return { min: base, max: base + span };
}

function emitterNames(weapon) {
  const names = new Set();
  for (const block of weapon.chain) {
    for (const [key, value] of Object.entries(block.values || {})) {
      if (!key.includes('EMITTER_NAME')) continue;
      for (const name of Array.isArray(value) ? value : [value]) {
        if (name && !/^(NONE|NULL)$/i.test(String(name))) names.add(String(name));
      }
    }
  }
  return [...names];
}

// A colour that still reads when drawn over the black sky (and additively).
const visible = node => (node.a ?? 255) > 0 && Math.max(node.r || 0, node.g || 0, node.b || 0) >= 0x60;

// BULLET_NONE nodes without a sprite have no body of their own in the source:
// what the player sees in flight is their BULLET_EMITTER particle trail. Keep
// that authored trail colour so the renderer can still show the projectile.
// Near-black trails (e.g. Sneak Attack) stay unlisted and therefore hidden.
function emitterTrails(weapon) {
  const trails = {};
  for (const block of weapon.chain) {
    if (!['BULLET', 'CRUISER'].includes(block.type)) continue;
    const values = block.values || {};
    if (values.DRAW_METHOD !== 'BULLET_NONE' || /\.(bmp|png)/i.test(String(values.DRAW_ANIM || ''))) continue;
    const node = list(values.BULLET_EMITTER_NAME).filter(name => name && !/^(NONE|NULL)$/i.test(String(name)))
      .flatMap(name => reference.emitters[name] || []).find(visible);
    // Grouped as {colour: 'NameA NameB'} to keep the shared weapon payload small.
    if (node) (trails[hex(node.r, node.g, node.b)] ||= []).push(block.name);
  }
  // Grouped as {colour: 'NameA Stem#'} to keep the shared weapon payload small;
  // 'Stem#' stands for every numbered node Stem1..N, used only when all of them share the colour.
  const stemOf = name => name.replace(/\d+$/, '');
  const numbered = weapon.chain.filter(b => ['BULLET', 'CRUISER'].includes(b.type) && /\d$/.test(b.name));
  for (const [color, names] of Object.entries(trails)) {
    const out = new Set();
    for (const name of names) {
      const stem = stemOf(name), all = numbered.filter(b => stemOf(b.name) === stem);
      out.add(/\d$/.test(name) && all.length > 1 && all.every(b => names.includes(b.name)) ? stem + '#' : name);
    }
    trails[color] = [...out].join(' ');
  }
  return trails;
}

function compileEffect(weapon) {
  const names = emitterNames(weapon);
  const nodes = names.flatMap(name => reference.emitters[name] || []);
  const rates = finite(nodes.map(node => node.particlesPerSecond));
  const lowSpeeds = finite(nodes.map(node => node.particleLowSpeed_PPS));
  const highSpeeds = finite(nodes.map(node => node.particleHighSpeed_PPS));
  const lengths = finite(nodes.map(node => node.emitLength));
  const colors = [...new Set(nodes.map(node => hex(node.r, node.g, node.b)))].slice(0, 5);
  const alphas = finite(nodes.map(node => node.a));
  const explosion = weapon.chain.filter(block => block.type === 'EXPLOSION');
  const eraseDelay = finite(explosion.map(block => block.values.ERASE_DELAY));
  const commandTypes = [...new Set(weapon.chain.map(block => block.type))];
  const rawRate = rates.reduce((sum, value) => sum + value, 0);
  const particleBudget = clamp(Math.round(8 + Math.log2(1 + rawRate) * 4 + nodes.length * 2), 10, 72);
  const timeline = [];
  const visualTypes = new Set(['EXPLOSION','SHRAPNEL','FIRE','FOG','LIGHTNING','ZAPPER','MAGICWALL','DIRTBALL','DIRTMOVER','DIRTSLINGER','SUPERBALL']);
  const targets = new Map(weapon.chain.map(block => [`${block.type}:${block.name}`.toLowerCase(), block]));
  for (const trigger of weapon.chain.filter(block => block.type === 'TRIGGER')) {
    const commands = list(trigger.values.COMMAND);
    const types = list(trigger.values.TYPE);
    const delays = list(trigger.values.TIMEDELAY);
    const xOffsets = list(trigger.values.XOFFSET);
    const yOffsets = list(trigger.values.YOFFSET);
    let time = 0;
    for (let index = 0; index < commands.length && timeline.length < 64; index += 1) {
      const delay = at(delays, index);
      time += Number.isFinite(delay) ? delay / 1000 : 0;
      const type = at(types, index);
      if (!visualTypes.has(type)) continue;
      const name = commands[index];
      const target = targets.get(`${type}:${name}`.toLowerCase());
      const values = target?.values || {};
      const x = offsetRange(at(xOffsets, index));
      const y = offsetRange(at(yOffsets, index));
      // Compact tuple: type, delay, xMin, xMax, yMin, yMax, radius, duration.
      // This preserves thousands of authored stages without bloating the state
      // sent to the shared screen with repeated property names.
      timeline.push([
        (target&&MATERIAL_CODE[materialOf(target)])||STAGE_CODES[type],
        Math.round(clamp(time, 0, 5) * 1000) / 1000,
        x.min, x.max, y.min, y.max,
        clamp(Number(values.RADIUS || values.DAMAGE_RADIUS || values.WIDTH || 0), 0, 180),
        clamp(Number(values.TOTAL_TIME || values.EMITTER_TIME || values.BURN_TIME / 1000 || values.ACTIVE_TIME / 1000 || 0), 0, 9),
      ]);
    }
  }
  const bullet = weapon.chain.find(block => block.type === 'BULLET')?.values || {};
  const explosions = weapon.chain.filter(block => block.type === 'EXPLOSION').map(block => block.values || {});
  const throwFlags = explosions.map(values => values.THROW_TANK_FLAG).filter(value => typeof value === 'boolean');
  const throwMagnitudes = finite(explosions.map(values => [values.THROW_TANK_MAGNITUDE, values.TANK_THROW_MAGNITUDE]));
  const trails = emitterTrails(weapon);
  return {
    // et = emitter trails; only weapons with bodiless emitter shots carry it (payload bound).
    ...(Object.keys(trails).length ? { et: trails } : {}),
    commandTypes,
    colors,
    particleBudget,
    speedMin: clamp(median(lowSpeeds, 45), 5, 500),
    speedMax: clamp(max(highSpeeds, 160), 20, 650),
    duration: clamp(max(lengths, .55), .18, 3.5),
    alpha: clamp(median(alphas, 220) / 255, .15, 1),
    sprayAngle: median(finite(nodes.map(node => node.sprayAngle)), 270),
    spraySpread: clamp(max(finite(nodes.map(node => node.spraySpread)), 360), 1, 360),
    matchSpeed: nodes.some(node => node.matchSpeedFlag === true),
    smoke: nodes.some(node => Math.max(node.r || 0, node.g || 0, node.b || 0) - Math.min(node.r || 0, node.g || 0, node.b || 0) < 35),
    dirtFall: weapon.dirtFall,
    eraseTerrain: weapon.eraseTerrain,
    eraseDelayMs: clamp(median(eraseDelay, 12), 3, 80),
    inward: weapon.drawDirections.includes('EXPLOSION_IN'),
    throwTank: throwFlags.length ? throwFlags.some(Boolean) : undefined,
    throwMagnitude: max(throwMagnitudes, 1.25),
    bullet: {
      method: bullet.DRAW_METHOD || 'BULLET_TRAIL',
      size: clamp(Number(bullet.DRAW_SIZE || 1), 0, 12),
      trailLength: clamp(Number(bullet.TRAIL_LENGTH || 0), 0, 80),
      dim: clamp(Number(bullet.DIM_TRAIL_LEVEL || 0), 0, 100),
      gravityMode: bullet.GRAVITY_MODE || 'DOWN',
      collision: bullet.COLLISION_METHOD || 'HIT_TERRAIN',
      homing: bullet.HOMING_FLAG === true,
      homingDistance: clamp(Number(bullet.HOMING_DISTANCE || 0), 0, 1200),
      homingMagnitude: clamp(Number(bullet.HOMING_MAGNITUDE || 0), -1000, 1000),
      proximity: bullet.PROXIMITY_FLAG === true,
      proximityDistance: clamp(Number(bullet.PROXIMITY_DISTANCE || 0), 0, 300),
      timed: bullet.TIMED_DETONATION_FLAG === true && Number.isFinite(bullet.TIMED_DETONATION_TIME),
      fuse: clamp(Number(bullet.TIMED_DETONATION_TIME || 0), 0, 9),
      bypassTank: bullet.BYPASS_TANK_FLAG === true || bullet.BYPASS_TANK_FALG === true,
      windResistance: bullet.WIND_RESISTANCE_FLAG === true,
    },
    timeline,
  };
}

function compileWeapon(weapon) {
  const damageValues = finite(weapon.damage || []);
  const radiusValues = finite(weapon.radius || []);
  const bullets = weapon.chain.filter(block => block.type === 'BULLET');
  const bulletFanouts = weapon.chain.filter(block => block.type === 'TRIGGER').map(block => {
    const commands = Array.isArray(block.values.COMMAND) ? block.values.COMMAND : [block.values.COMMAND];
    const types = Array.isArray(block.values.TYPE) ? block.values.TYPE : [block.values.TYPE];
    return commands.filter((_, index) => (types[index] || types[0]) === 'BULLET').length;
  });
  const bounces = max(finite(bullets.map(block => block.values.BOUNCE_COUNT)), 0);
  const duration = max(finite(weapon.chain.map(block => [block.values.ACTIVE_TIME, block.values.BURN_TIME])), 2.5);
  const damage = clamp(max(damageValues, weapon.family === 'dirt' || weapon.family === 'jump' ? 0 : 24), 0, 180);
  const radius = clamp(max(radiusValues, 22) * 1.35, 10, 150);
  const fx = compileEffect(weapon);
  const terrainWidths = finite(weapon.terrain.map(item => [item.WIDTH, item.MAX_WIDTH]));
  const terrainHeights = finite(weapon.terrain.map(item => item.HEIGHT));
  const gravityMode = bullets[0]?.values.GRAVITY_MODE;
  const terrainTypes = new Set(weapon.terrain.map(item => item.type));
  const lowerName = weapon.name.toLowerCase();
  let behavior;
  if (terrainTypes.has('DIRTMOVER')) behavior = 'excavate';
  else if (terrainTypes.has('DIRTSLINGER')) behavior = 'slinger';
  else if (terrainTypes.has('MAGICWALL')) behavior = /pedest|pedist/.test(lowerName) ? 'pedestal' : /glue/.test(lowerName) ? 'glue-wall' : 'wall';
  else if (terrainTypes.has('DIRTBALL') && /dome/.test(lowerName)) behavior = 'dome';
  else if (/glue/.test(lowerName)) behavior = 'glue';
  else if (/rubber paint|burning rubber/.test(lowerName)) behavior = 'rubber';
  return {
    id: weapon.id,
    name: weapon.name,
    family: weapon.family,
    damage,
    radius,
    description: weapon.description || 'Pocket artillery weapon.',
    color: fx.colors[0],
    count: clamp(max(bulletFanouts, bullets.length || 1), 1, 32),
    bounces: clamp(bounces, 0, 12),
    duration: clamp(duration, .3, 8),
    depth: clamp(max(terrainHeights, 60), 12, 900),
    height: clamp(max(terrainHeights, 70), 12, 220),
    width: clamp(max(terrainWidths, 0), 0, 420),
    behavior,
    gravity: gravityMode === 'NONE' ? 0 : undefined,
    speed: 1,
    rarity: weapon.index % 3,
    index: weapon.index,
    fx,
    draft: true,
    status: 'reference-imported',
  };
}

module.exports = { reference, compileEffect, compileWeapon };
