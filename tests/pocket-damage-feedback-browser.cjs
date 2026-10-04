'use strict';
// Isolated authoritative collision/handler -> unchanged production renderer.
// No live room, controller, build or gameplay state is modified.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),express=require('express');
const {webkit}=require(process.env.PARTY_PLAYWRIGHT||'playwright');
const {makeGame}=require('../scripts/audit-pocket-runtime.cjs');
const {definitions}=require('../games/arcade_deluxe/core/pocket-terrain.cjs');
const {BY_ID}=require('../games/arcade_deluxe/core/weapons.cjs');
const Pocket=require('../games/arcade_deluxe/core/pocket-runtime.cjs');
const OUT=process.env.QA_OUTPUT||'output/qa/pocket-damage-2026-10-03/browser';
const watched=['games/arcade_deluxe/core/pocket-runtime.cjs','games/arcade_deluxe/core/tanks.cjs','games/arcade_deluxe/public/render.js','games/arcade_deluxe/public/siege-fx.js','games/arcade_deluxe/public/pocket-plasma.js','games/arcade_deluxe/public/explosion-waves.js'];
const hashes=()=>Object.fromEntries(watched.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
function game(){const g=makeGame();g.soil.fromHeights(g.terrain.map(()=>600));g.syncTerrain();g.players[0].x=300;g.players[1].x=700;for(const p of g.players)g.seat(p);g.wind=0;g.stage='flight';g.events=[];return g;}
function contact(weapon,name){const g=game(),p=g.players[1];g.currentWeapon=weapon;g.projectile(p.x-30,p.y-8,600,0,BY_ID[weapon],'a',{sourceBullet:name,sourceType:'BULLET',fragment:true});const b=g.projectiles.pop();b.age=.2;g.advanceProjectile(b,1/30);assert.equal(b.hitTank,p.id);assert(g.players[0].score>0);for(let i=0;i<12;i++)g.step(1/120);return{kind:'swept contact',weapon,score:g.players[0].score,state:g.snapshot()};}
function effect(weapon,type,amount=1){const g=game(),n=definitions.get(weapon).chain.find(n=>n.type===type),p=g.players[1];g.currentWeapon=weapon;
 for(let i=0;i<amount;i++)Pocket.command(g,{weapon,owner:'a',type,name:n.name,x:p.x-(['ZAPPER','LIGHTNING'].includes(type)?80:0),y:p.y-8,angle:0,power:0});
 if(['FIRE','FOG','SUPERBALL'].includes(type)){for(let i=0;i<12;i++){g.t+=1/120;for(const z of g.zones){z.gravity=false;Pocket.materialStep(g,z,1/120);}}}
 return{kind:type+' handler',weapon,source:n.name,score:g.players[0].score,state:g.snapshot()};}
async function main(){fs.mkdirSync(OUT,{recursive:true});const start=hashes(),fixtures=[contact('sonic_blast','SonicBlastMiniBullet'),contact('sniper_rifle','SniperRifleBullet'),contact('laser','LaserBullet'),contact('pebble','SingleShotBullet'),effect('zapper','ZAPPER'),effect('tesla_coil','LIGHTNING'),effect('burn_barrel','FIRE',10),effect('chalk_dust','FOG',10),effect('wacky_tank','SHRAPNEL')];
 assert.equal(fixtures[7].score,1);assert.equal(fixtures[8].score,0);fs.writeFileSync(path.join(OUT,'authoritative-fixtures.json'),JSON.stringify(fixtures,null,2));
 const server=express().use(express.static('games/arcade_deluxe/public')).listen(0,'127.0.0.1');await new Promise((r,j)=>{server.once('listening',r);server.once('error',j);});let browser;
 const errors=[],proof=[];
 try{browser=await webkit.launch();const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/geometry.js`);
  await page.evaluate(async weapons=>{const {Renderer}=await import('/render.js');document.body.innerHTML='<style>html,body{margin:0;background:#10151f}canvas{display:block;width:100vw;height:100vh}</style><canvas></canvas>';window.renderer=new Renderer(document.querySelector('canvas'));renderer.weapons=weapons;renderer.siegeFX.setWeapons(weapons);cancelAnimationFrame(renderer.raf);await renderer.siegeFX.plasma.ready;await document.fonts.ready;},BY_ID);
  for(const size of [[1280,720],[1920,1080]]){await page.setViewportSize({width:size[0],height:size[1]});for(const f of fixtures){
   const p=await page.evaluate(f=>{const r=renderer;r.roundSerial=undefined;r.setState(f.state);cancelAnimationFrame(r.raf);const scoreItems=r.siegeFX.items.filter(p=>p.kind==='damage').map(p=>p.value),seen=[],text=r.c.fillText.bind(r.c);r.c.fillText=(s,...a)=>{seen.push(String(s));text(s,...a);};r.frame(performance.now()+150);cancelAnimationFrame(r.raf);r.c.fillText=text;
    // Isolate the actual score event to prove its glyphs paint nontransparent
    // pixels, independently of the field background and larger effects.
    const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const c=canvas.getContext('2d');const old=r.siegeFX.items;r.siegeFX.items=old.filter(p=>p.kind==='damage');r.siegeFX.draw(c,.1,f.state.t);r.siegeFX.items=old;
    let pixels=0;for(const a of c.getImageData(0,0,1280,720).data.filter((_,i)=>i%4===3))if(a>0)pixels++;
    return{weapon:f.weapon,kind:f.kind,score:f.score,scoreItems,paintedText:seen.filter(t=>/^[-+]\d+$/.test(t)),scorePixels:pixels,materialSources:r.siegeFX.plasma.sources.length,materialReady:!!r.siegeFX.plasma.data,waves:f.state.explosionWaves.length,beamItems:r.siegeFX.items.filter(p=>p.kind==='beam').length,finite:r.siegeFX.items.every(p=>Number.isFinite(p.x+p.y+p.age)),liveZones:f.state.zones.length};
   },f);assert(p.materialReady&&p.finite);if(f.score>0){assert(p.scoreItems.length&&p.scorePixels>0,`${f.weapon}: actual awarded points must paint`);}if(f.kind==='ZAPPER handler'||f.kind==='LIGHTNING handler')assert(p.beamItems>0);if(f.kind==='FIRE handler'||f.kind==='FOG handler')assert(p.materialSources>0);if(f.weapon==='wacky_tank')assert.equal(p.scoreItems.length,0);
   const filename=`${f.weapon}-${size[0]}.png`;await page.screenshot({path:path.join(OUT,filename)});proof.push({...p,width:size[0],height:size[1],screenshot:filename});
  }}
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
 const end=hashes(),changedFiles=watched.filter(p=>start[p]!==end[p]);fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({finished:new Date().toISOString(),kind:'isolated authoritative contact/handler fixtures rendered by current production Canvas2D',start,end,changedFiles,errors,proof},null,2));assert.deepEqual(errors,[]);assert.deepEqual(changedFiles,[]);console.log(JSON.stringify({proofs:proof.length,errors,changedFiles,output:OUT}));}
main().catch(e=>{console.error(e);process.exitCode=1;});
