'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createRequire } = require('node:module');
const { Arcade, MODES } = require('../games/arcade/simulation');
const buildSectors = require('../games/party/knives-sectors');

function party(engine = 'party') {
  const file = require.resolve(`../games/${engine}/server`);
  const localRequire = createRequire(file), reports = [], pauses = [];
  const context = vm.createContext({
    require: name => name === '../../lib/raw-socket-policy' ? {allow:()=>true} : name === '../../lib/party-runtime' ? {
      now: Date.now, setInterval() {}, allowMessage: () => true,
      onPause: fn => pauses.push(fn), host() {}, presence() {},
      identify: data => data.partyId ? { id: data.partyId, name: data.partyId } : null,
      report: value => reports.push(value)
    } : name === 'http' ? { createServer: () => ({ on() {}, listen() {} }) } : localRequire(name),
    __dirname: path.dirname(file), process: { env: {}, hrtime: process.hrtime },
    console, Buffer, URL, setInterval() {}, assert
  });
  vm.runInContext(fs.readFileSync(file, 'utf8'), context);
  return { run: source => vm.runInContext(source, context), reports, pauses };
}

test('Color Knives gives all 2–16 players equal colored area in every round', () => {
  for (let count = 2; count <= 16; count++) for (let round = 1; round <= 10; round++) {
    const players = Array.from({ length: count }, (_, i) => ({ id: `p${i}`, color: `color${i}` }));
    const sectors = buildSectors(players, round);
    let previous = 0;
    for (const sector of sectors) {
      assert.equal(sector.start, previous);
      assert(sector.end > sector.start);
      previous = sector.end;
    }
    assert.equal(previous, Math.PI * 2);
    const areas = players.map(p => {
      const owned = sectors.filter(s => s.ownerId === p.id);
      assert.equal(owned.length, 2, `${count} players, round ${round}, ${p.id}`);
      return owned.reduce((sum, s) => sum + s.end - s.start, 0);
    });
    assert(Math.max(...areas) - Math.min(...areas) < 1e-12);
    assert(sectors.some(s => s.type === 'danger'));
    assert(sectors.some(s => s.type === 'neutral'));
  }
});

test('Color Knives late join waits without stealing sectors, then joins next round; duplicate throws consume one knife', () => {
  const game = party();
  game.run(`
    const sockets = Array.from({length:4},(_,i)=>({id:'s'+i,data:{},send(){}}));
    sockets.slice(0,3).forEach((s,i)=>handleMessage(s,{type:'join',data:{partyId:'p'+i}}));
    startGame({mode:'knives',maxRounds:5});beginRoundPlaying();
    const before=JSON.stringify(drum.sectors);
    handleMessage(sockets[3],{type:'join',data:{partyId:'p3'}});
    const late=players.get(sockets[3].data.playerId);
    assert.equal(late.active,false);assert.equal(JSON.stringify(drum.sectors),before);
    for(let i=0;i<100;i++)handleMessage(sockets[3],{type:'throw'});
    assert.equal(drum.flying.length,0);
    const first=players.get(sockets[0].data.playerId),knives=first.knivesRemaining;
    for(let i=0;i<100;i++)handleMessage(sockets[0],{type:'throw'});
    assert.equal(first.knivesRemaining,knives-1);assert.equal(drum.flying.length,1);
    nextRound();assert.equal(late.active,true);assert.equal(late.knivesRemaining,drum.knivesPerPlayer);
    assert.equal(drum.sectors.filter(s=>s.ownerId===late.id).length,2);
  `);
});

test('Bomb holder acceleration is 12% higher and transfer grants boost to the new holder', () => {
  const game = party();
  game.run(`
    for(let i=0;i<2;i++)handleMessage({id:'s'+i,data:{},send(){}},{type:'join',data:{partyId:'p'+i}});
    startGame({mode:'bomb',maxRounds:5});beginRoundPlaying();
    const ps=activePlayers();bomb.obstacles=[];bomb.fuse=20;bomb.passLock=10;
    bomb.holderId=ps[0].id;
    function reset(){ps.forEach((p,i)=>{p.x=570+i*140;p.y=360;p.vx=p.vy=0;p.input={jx:0,jy:1,at:Date.now()};});}
    reset();updateBomb(1/60);assert(Math.abs(ps[0].vy/ps[1].vy-1.12)<1e-10);
    transferBomb(ps[0],ps[1]);reset();updateBomb(1/60);
    assert(Math.abs(ps[1].vy/ps[0].vy-1.12)<1e-10);
  `);
});

test('Party socket replacement and pause release held controls immediately; stale socket cannot restore them', () => {
  const game = party();
  game.run(`
    const old={id:'old',data:{},send(){}},replacement={id:'new',data:{},send(){}};
    handleMessage(old,{type:'join',data:{partyId:'p'}});
    handleMessage(old,{type:'joystick',data:{x:1,y:-1}});
    handleMessage(replacement,{type:'join',data:{partyId:'p'}});
    const p=players.get(old.data.playerId);assert.equal(p.input.jx,0);assert.equal(p.input.jy,0);
    handleDisconnect(old);handleMessage(old,{type:'joystick',data:{x:1,y:1}});
    assert.equal(p.connected,true);assert.equal(p.input.jx,0);
    handleMessage(replacement,{type:'joystick',data:{x:1,y:1}});
  `);
  game.pauses.forEach(fn => fn(true));
  game.run('assert.equal(p.input.jx,0);assert.equal(p.input.jy,0)');
});

test('Arcade restart, reconnect, and spawn never reuse a held direction from the previous life', () => {
  for (const mode of Object.keys(MODES)) {
    const game = new Arcade(mode);
    game.join('a', 'A');game.join('b', 'B');game.start();game.countdown=0;
    game.input('a', { x:1,y:-1 });
    game.finish();game.start();
    const p=game.players[0];
    assert.deepEqual(p.input,{x:0,y:0}, mode+' restart');
    game.countdown=0;game.input('a',{x:1,y:1});game.join('a','A');
    assert.deepEqual(p.input,{x:0,y:0},mode+' reconnect');
    game.input('a',{x:1,y:1});game.spawn(p,0);
    assert.deepEqual(p.input,{x:0,y:0},mode+' respawn');
  }
});

test('Local Tanks reconnect storm releases held fire and movement without duplicating players or projectiles', () => {
  const game = party('tanks');
  game.run(`
    const phones=Array.from({length:16},(_,i)=>({id:'old'+i,data:{},send(){}}));
    phones.forEach((s,i)=>handleMessage(s,{type:'join',data:{partyId:'p'+i}}));
    startGame('ctf');
    phones.forEach(s=>handleMessage(s,{type:'input',data:{forward:true,fire:true}}));
    for(let step=0;step<30;step++)updatePlayers(1/60);
    assert.equal(bullets.length,16);
    assert(snapshot().bullets.every(b=>b.radius>0&&b.life>0&&Number.isFinite(b.x)&&Number.isFinite(b.vx)));
    const replacements=phones.map((s,i)=>{
      const next={id:'new'+i,data:{},send(){}};
      handleMessage(next,{type:'join',data:{partyId:'p'+i}});
      handleDisconnect(s);
      for(let repeat=0;repeat<20;repeat++)handleMessage(s,{type:'input',data:{forward:true,fire:true}});
      return next;
    });
    assert.equal(players.size,16);
    for(const p of players.values()){
      assert.equal(p.connected,true);assert.equal(p.input.forward,false);assert.equal(p.input.fire,false);
    }
    updatePlayers(.5);assert.equal(bullets.length,16,'replaced sockets cannot fire another volley');
    replacements.forEach(s=>handleMessage(s,{type:'input',data:{forward:true,fire:true}}));
  `);
  game.pauses.forEach(fn=>fn(true));
  game.run(`for(const p of players.values()){assert.equal(p.input.forward,false);assert.equal(p.input.fire,false);}`);
});

test('Arcade sixteen-player repeated input and release remains finite through three successive matches', () => {
  for (const mode of Object.keys(MODES)) {
    const game=new Arcade(mode,()=>.5);
    for(let i=0;i<16;i++)game.join(String(i),'Player '+i);
    for(let match=0;match<3;match++) {
      assert(game.start());
      for(let step=0;game.phase==='playing'&&step<2600;step++) {
        for(let i=0;i<16;i++) {
          const id=String(i);
          game.input(id,{x:Math.sin(step+i),y:Math.cos(step+i),action:mode==='punchmeter'?'punch':'tap',power:.7});
          if(step%5===0)game.input(id,{x:0,y:0});
        }
        game.tick(.05);
      }
      assert.equal(game.phase,'finished',mode);
      assert.equal(game.players.length,16);
      for(const p of game.players)for(const key of ['x','y','vx','vy','score'])assert(Number.isFinite(p[key]),`${mode} ${key}`);
      const scores=game.players.map(p=>p.score);
      for(let i=0;i<100;i++)game.input('0',{action:'punch',power:1,x:1,y:1});
      assert.deepEqual(game.players.map(p=>p.score),scores,'finished inputs cannot change results');
    }
  }
});
