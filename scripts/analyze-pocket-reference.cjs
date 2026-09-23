'use strict';

// Developer-only reference importer. It reads plaintext produced by summivox/ptd
// and emits a compact mechanics/effects summary. Original game data is neither
// required nor shipped by LocalParty.
const fs = require('node:fs');
const path = require('node:path');

function scalar(value) {
  const text = value.trim();
  if (/^(TRUE|FALSE)$/i.test(text)) return /^TRUE$/i.test(text);
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(text)) return Number(text);
  return text;
}

function parseDefinitions(text, source = '') {
  const blocks = [];
  const lines = text.replace(/\r/g, '').split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*DONE\s*(?:\/\/.*)?$/i.test(lines[index])) break;
    const match = lines[index].match(/^\s*([A-Z][A-Z_]*)\s*:\s*(.*?)\s*$/i);
    if (!match || !lines[index + 1]?.match(/^\s*\{\s*\d*\s*$/)) continue;
    const block = { type: match[1].toUpperCase(), name: match[2], source, values: {} };
    if(!/^\s*\{\s*$/.test(lines[index+1]))block.parseWarnings=['Ignored numeric debris after opening brace'];
    let command;
    const stack=[];
    let program;
    if(block.type==='TRIGGER'){block.commands=[];block.program=[];program=block.program;}
    index += 2;
    for (; index < lines.length && !lines[index].match(/^\s*}\s*$/); index += 1) {
      const clean = lines[index].replace(/\/\/.*$/, '');
      const control=clean.trim().match(/^(LOOP|IF|ELSE|ENDIF|ENDLOOP)\b\s*(.*)$/i);
      if (block.commands && control) {
        const op=control[1].toUpperCase();command=undefined;
        if(op==='LOOP'||op==='IF'){
          const node=op==='LOOP'?{op:'loop',count:scalar(control[2]),commands:[]}:{op:'if',condition:control[2],commands:[],elseCommands:[]};
          program.push(node);stack.push({program,node});program=node.commands;
        }else if(op==='ELSE'){
          if(stack.at(-1)?.node.op!=='if'){(block.parseWarnings||=[]).push('Unmatched ELSE');program.push({op:'unmatched-else'});continue;}
          program=stack.at(-1).node.elseCommands;
        }else{
          const frame=stack.pop();if(!frame||frame.node.op!==(op==='ENDIF'?'if':'loop')){(block.parseWarnings||=[]).push(`Unmatched ${op}`);program.push({op:`unmatched-${op.toLowerCase()}`});continue;}
          program=frame.program;
        }
        continue;
      }
      const property = clean.match(/^\s*(\d+\s+)?([A-Z][A-Z0-9_]*)\s*:\s*(.*?)\s*$/i);
      if (!property) continue;
      if(property[1])(block.parseWarnings||=[]).push(`Ignored numeric debris before ${property[2]}`);
      const key = property[2].toUpperCase();
      const value = scalar(property[3]);
      if(block.commands){
        if(key==='TIMEDELAY'||!command||(key==='COMMAND'&&Object.hasOwn(command,'COMMAND'))){command={statements:[]};block.commands.push(command);program.push(command);}
        command[key]=value;
        command.statements.push({key,value});
      }
      if (Object.hasOwn(block.values, key)) {
        block.values[key] = Array.isArray(block.values[key])
          ? [...block.values[key], value]
          : [block.values[key], value];
      } else block.values[key] = value;
    }
    if(stack.length)(block.parseWarnings||=[]).push('Unclosed control block');
    blocks.push(block);
  }
  return blocks;
}

function readDirectory(directory) {
  const packNumber = file => {
    const match = file.match(/^weaplist(?:_)?(\d+)?\.(?:wep|weap)\.decoded$/i);
    return match?.[1] ? Number(match[1]) : 1;
  };
  const files = fs.readdirSync(directory)
    .filter(file => /weaplist.*\.decoded$/i.test(file))
    .sort((a, b) => packNumber(a) - packNumber(b));
  return files.flatMap(file => parseDefinitions(
    fs.readFileSync(path.join(directory, file), 'utf8'), file,
  ));
}

function summarize(blocks) {
  const byName = new Map();
  const bySourceName = new Map();
  for (const block of blocks) {
    const key = `${block.type}:${block.name}`.toLowerCase();
    byName.set(key, block);
    bySourceName.set(`${block.source}:${key}`.toLowerCase(), block);
  }
  const lookup = (type, name, source) => {
    const exact=bySourceName.get(`${source}:${type}:${name}`.toLowerCase())||byName.get(`${type}:${name}`.toLowerCase());
    if(exact)return exact;
    // A few original TYPE labels are aliases/typos. Resolve only unambiguous
    // declarations with the exact authored name, never similar sibling names.
    const candidates=blocks.filter(b=>b.name.toLowerCase()===String(name).toLowerCase());
    const local=candidates.filter(b=>b.source===source),pool=local.length?local:candidates;
    return pool.length===1?pool[0]:undefined;
  };
  for(const block of blocks)for(const command of block.commands||[]){
    if(!command.COMMAND)continue;
    const target=lookup(command.TYPE,command.COMMAND,block.source);
    if(target)command.resolvedType=target.type;
  }
  const follow = (type, name, source, seen = new Set()) => {
    if (!name || /^(NONE|NULL)$/i.test(String(name))) return [];
    const key = `${source}:${type}:${name}`.toLowerCase();
    if (seen.has(key)) return [];
    seen.add(key);
    const block = lookup(type, name, source);
    if (!block) return [];
    const output = [block];
    if (block.type === 'TRIGGER') {
      for (const command of block.commands) {
        output.push(...follow(command.resolvedType||command.TYPE, command.COMMAND, block.source, seen));
      }
    }
    for (const [property, value] of Object.entries(block.values)) {
      if (property === 'COMMAND' || property === 'TYPE') continue;
      const targetType = property.endsWith('_TRIGGER') || property === 'TRIGGER' ? 'TRIGGER' : '';
      if (!targetType) continue;
      const values = Array.isArray(value) ? value : [value];
      for (const target of values) output.push(...follow(targetType, target, block.source, seen));
    }
    return output;
  };

  return blocks.filter(block => block.type === 'WEAPON').map(weapon => {
    const chain = follow('TRIGGER', weapon.values.TRIGGER, weapon.source);
    const explosions = chain.filter(block => block.type === 'EXPLOSION');
    const bullets = chain.filter(block => block.type === 'BULLET');
    const terrain = chain.filter(block => ['DIRTBALL', 'DIRTMOVER', 'DIRTSLINGER', 'MAGICWALL'].includes(block.type));
    const finite = (items, key) => items.map(item => item.values[key]).flat()
      .filter(value => Number.isFinite(value));
    return {
      name: weapon.name,
      source: weapon.source,
      description: weapon.values.DESCRIPTION,
      icon: weapon.values.ICON,
      trigger: weapon.values.TRIGGER,
      damage: [...finite(chain, 'DAMAGE'), ...finite(chain, 'DAMAGE_PER_SECOND')],
      radius: [...finite(chain, 'RADIUS'), ...finite(chain, 'DAMAGE_RADIUS')],
      eraseDelay: finite(explosions, 'ERASE_DELAY'),
      dirtFall: explosions.some(item => item.values.DIRTFALL_FLAG === true),
      eraseTerrain: explosions.some(item => item.values.ERASE_TERRAIN_FLAG === true),
      drawDirections: [...new Set(explosions.map(item => item.values.DRAW_DIRECTION).filter(Boolean))],
      eraseDirections: [...new Set(explosions.map(item => item.values.ERASE_DIRECTION).filter(Boolean))],
      bulletEmitters: [...new Set(bullets.map(item => item.values.BULLET_EMITTER_NAME).filter(value => value && value !== 'NONE'))],
      explosionEmitters: [...new Set(explosions.map(item => item.values.EXPLOSION_EMITTER_NAME).filter(value => value && value !== 'NONE'))],
      sounds: [...new Set(chain.map(item => item.values.SOUND_EFFECT).filter(value => value && value !== 'NONE'))],
      terrain: terrain.map(item => ({ type: item.type, name: item.name, ...item.values })),
      chain: chain.map(item => ({ type: item.type, name: item.name, values: item.values, ...(item.commands?{commands:item.commands}:{}),...(item.program?.some(row=>row.op)?{program:item.program}:{}),...(item.parseWarnings?{parseWarnings:item.parseWarnings}:{}) })),
    };
  });
}

function main(argv = process.argv.slice(2)) {
  const directory = argv[0];
  if (!directory || !fs.existsSync(directory)) {
    console.error('Usage: node scripts/analyze-pocket-reference.cjs <ptd-decoded-directory> [weapon names...]');
    process.exitCode = 1;
    return;
  }
  const requested = argv.slice(1).map(name => name.toLowerCase());
  const summary = summarize(readDirectory(directory));
  const selected = requested.length
    ? summary.filter(item => requested.includes(item.name.toLowerCase()))
    : summary;
  process.stdout.write(`${JSON.stringify(selected, null, 2)}\n`);
}

if (require.main === module) main();
module.exports = { parseDefinitions, readDirectory, summarize };
