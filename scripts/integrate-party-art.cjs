const fs=require('fs');function edit(file,pairs){let s=fs.readFileSync(file,'utf8');for(const[a,b]of pairs){if(!s.includes(a))throw Error(file+' missing '+a.slice(0,60));s=s.replace(a,b);}fs.writeFileSync(file,s);}
edit('games/party/public/host.js',[
["function drawKnifeShape(x,y,a,color,scale=1){","function drawKnifeShape(x,y,a,color,scale=1){if(window.PartyArt?.draw(ctx,'knife',x,y,12*scale,36*scale,{color,rotation:a+Math.PI/2}))return;"],
["function drawBombIcon(x,y,t=0){","function drawBombIcon(x,y,t=0){const sz=46*(1+Math.sin(t*12)*.04);if(window.PartyArt?.draw(ctx,'bomb',x,y-5,sz,sz))return;"],
["ctx.shadowBlur=22;ctx.shadowColor=p.color;","const puckArt=window.PartyArt?.draw(ctx,'puck',0,0,p.radius*2,p.radius*2,{color:p.color});ctx.globalAlpha=puckArt?0:(ghost?.18:1);ctx.shadowBlur=22;ctx.shadowColor=p.color;"],
["ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,14,33,9,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#30211d';","ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,14,33,9,0,0,Math.PI*2);ctx.fill();const cowboyArt=window.PartyArt?.draw(ctx,'cowboy',0,-66,100,150,{color:p.color,rotation:p.shotThisRound?-.035:0});ctx.globalAlpha=cowboyArt?0:(dead?.48:1);ctx.strokeStyle='#30211d';"],
["if(p.shotThisRound&&!p.falseStart&&s.game.status==='playing'){","ctx.globalAlpha=dead?.48:1;if(p.shotThisRound&&!p.falseStart&&s.game.status==='playing'){"]
]);
edit('games/western_duel/public/app.js',[
["ctx.lineCap='round';ctx.strokeStyle='#111714';","const cowboyArt=window.PartyArt?.draw(ctx,'cowboy',0,-87,118,174,{color,rotation:shot&&t<200?-.055:0});ctx.globalAlpha=cowboyArt?0:1;ctx.lineCap='round';ctx.strokeStyle='#111714';"],
["if(shot&&t<200){ctx.fillStyle='#ffe1a0';","ctx.globalAlpha=1;if(shot&&t<200){ctx.fillStyle='#ffe1a0';"]
]);
