const fs=require('fs');
function edit(file,fn){let s=fs.readFileSync(file,'utf8');fs.writeFileSync(file,fn(s));}
function replace(s,a,b){if(!s.includes(a))throw Error('Missing '+a.slice(0,90));return s.replace(a,b);}
// Exact primitive substitutions only: retain renderer, controls and state logic.
edit('games/arcade/public/app.js',s=>{
const pairs=[
["circle(x,y,Math.min(17,h*.3),p.color);","if(!window.PartyArt?.draw(g,'runner',x,y,Math.min(62,h*.9),Math.min(62,h*.9),{color:p.color,rotation:Math.sin(s.time*15)*.05}))circle(x,y,Math.min(17,h*.3),p.color);"],
["g.fillStyle='#ff5788';g.shadowColor","const bagArt=window.PartyArt?.draw(g,'punchbag',0,-20,150,230,{pivot:{x:.5,y:0}});g.globalAlpha=bagArt?0:1;g.fillStyle='#ff5788';g.shadowColor"],
["for(const f of s.food)text(['🍗','🍕','🍔','🍩'][f.kind],f.x,f.y,24);","for(const f of s.food)if(!window.PartyArt?.draw(g,['food-chicken','food-pizza','food-burger','food-donut'][f.kind],f.x,f.y,25,25))text(['🍗','🍕','🍔','🍩'][f.kind],f.x,f.y,24);"],
["circle(p.x,p.y,Math.sqrt(p.mass)*3,p.color);","if(!window.PartyArt?.draw(g,'blob',p.x,p.y,Math.sqrt(p.mass)*6,Math.sqrt(p.mass)*6,{color:p.color}))circle(p.x,p.y,Math.sqrt(p.mass)*3,p.color);"],
["circle(p.x,p.y,9,p.color);","if(!window.PartyArt?.draw(g,'puck',p.x,p.y,20,20,{color:p.color,rotation:p.angle}))circle(p.x,p.y,9,p.color);"],
["circle(p.x,p.y,11,p.color);","if(!window.PartyArt?.draw(g,'rugby-player',p.x,p.y,38,38,{color:p.color,rotation:Math.atan2(p.vy||0,p.vx||0)+Math.PI/2}))circle(p.x,p.y,11,p.color);"],
["circle(s.ball.x,s.ball.y,10,'#fff1c7');","if(!window.PartyArt?.draw(g,'ball',s.ball.x,s.ball.y,22,22,{rotation:(s.ball.x+s.ball.y)*.035}))circle(s.ball.x,s.ball.y,10,'#fff1c7');"],
["circle(p.x,p.y,16,p.color);circle(p.x+7,p.y-5,5,'#fff');","const birdArt=window.PartyArt?.draw(g,'bird',p.x,p.y,40,35,{color:p.color,rotation:Math.max(-.45,Math.min(.9,(p.vy||0)/650))});if(!birdArt){circle(p.x,p.y,16,p.color);circle(p.x+7,p.y-5,5,'#fff');"],
["g.fillRect(p.x-25,p.y+Math.sin(s.time*20)*8,16,6);text(p.name","g.fillRect(p.x-25,p.y+Math.sin(s.time*20)*8,16,6);}else window.PartyArt?.draw(g,'bird-wing',p.x-7,p.y+3,20,14,{color:p.color,rotation:Math.sin(s.time*19)*.6});text(p.name"]
];for(const[a,b]of pairs)s=replace(s,a,b);return s;});
