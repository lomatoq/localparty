'use strict';
// Developer-only visual replay using production simulation and renderer.
const express=require('express');
const {Tanks}=require('../games/arcade_deluxe/core/tanks.cjs');
const {BY_ID}=require('../games/arcade_deluxe/core/weapons.cjs');
function frames(scenario){
 const g=new Tanks();g.add({id:'a',name:'ALPHA',connected:true});g.add({id:'b',name:'BRAVO',connected:true});g.start({sandbox:true});
 g.soil.fromHeights(Array(640).fill(440));g.syncTerrain();for(const p of g.players)g.seat(p);
 g.stage='flight';g.flightStarted=g.t;const result=[g.snapshot()];
 const w=BY_ID[scenario==='fission'?'fission_bomb':'pebble'];
 g.explode(640,scenario==='buried'?535:440,w,'a',1,true,scenario==='fission'?'FissionBombSplitBullet1':undefined);
 for(let i=0;i<180;i++){g.step(1/60);result.push(g.snapshot());}
 return result;
}
const app=express();app.use(express.static('games/arcade_deluxe/public'));
app.get('/frames',(req,res)=>res.json(frames(req.query.scenario)));
app.get('/replay',(req,res)=>res.type('html').send(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:#0b1015;color:white;font:16px system-ui}canvas{position:fixed;inset:48px 0 0;width:100%;height:calc(100% - 48px)}nav{position:fixed;z-index:2;top:0;padding:8px;display:flex;gap:14px;background:#181321}a,button{color:white}button{background:#39304c}#stats{font:14px monospace}</style><nav><a href="?scenario=surface">Surface</a><a href="?scenario=buried">Buried</a><a href="?scenario=fission">Fission</a><button id="restart">Replay</button><button id="pause">Pause</button><span id="stats"></span></nav><canvas></canvas><script type="module">
import {Renderer} from '/render.js';
const scenario=new URLSearchParams(location.search).get('scenario')||'surface';
const frames=await fetch('/frames?scenario='+scenario).then(r=>r.json());
const renderer=new Renderer(document.querySelector('canvas'));let frame=0,playing=true,last=0;
document.querySelector('#restart').onclick=()=>{frame=0;playing=true;renderer.siegeFX.clear();renderer.lastEvent=0;};
document.querySelector('#pause').onclick=()=>playing=!playing;
function tick(t){if(playing&&t-last>16){last=t;const s=frames[Math.min(frame,frames.length-1)];renderer.setState(s);document.querySelector('#stats').textContent=scenario+' '+s.t.toFixed(2)+'s falling='+s.fallingColumns;if(frame<frames.length-1)frame++;else playing=false;}requestAnimationFrame(tick);}requestAnimationFrame(tick);
</script>`));
const server=app.listen(0,'127.0.0.1',()=>console.log(`http://127.0.0.1:${server.address().port}/replay`));
