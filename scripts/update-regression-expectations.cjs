const fs=require('fs');
let p='tests/game-mechanics.test.js',s=fs.readFileSync(p,'utf8');
s=s.replace('initialize,TowerPhysics}', 'initialize,TowerPhysics,FLOOR,HEIGHT}').replace('let previous=807','let previous=FLOOR+HEIGHT/2').replace('(780-(floor-.5)*54)','(FLOOR-(floor-.5)*HEIGHT)').replace('previous-45','previous-HEIGHT*.8').replace('tower.top().y<-29','Math.abs(tower.top().y-(FLOOR-15*HEIGHT))<3').replace('tower.project(550,-210)','tower.project(550,tower.top().y-HEIGHT*2)').replace('ghost.y-(-57)','ghost.y-(FLOOR-15.5*HEIGHT)');
fs.writeFileSync(p,s);
p='games/drawguess/server.js';s=fs.readFileSync(p,'utf8').replace("progress:(game.turn+1)+' / '+(game.order?.length||0)","progress:Math.min(game.turn+1,game.order?.length||0)+' / '+(game.order?.length||0)");fs.writeFileSync(p,s);
