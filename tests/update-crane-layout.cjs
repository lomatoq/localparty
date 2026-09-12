const fs=require('fs');
function edit(p,fn){fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')))}
edit('games/crane/physics.js',s=>s.replace('WIDTH=156,HEIGHT=54','WIDTH=110,HEIGHT=110'));
edit('games/crane/server.js',s=>s.replace('TowerPhysics,SCALE}', 'TowerPhysics,SCALE,WIDTH:BLOCK_W,HEIGHT:BLOCK_H}').replace('BLOCK_W=156,BLOCK_H=54,','DROP_GAP=230,').replaceAll('BLOCK_H/2-150','BLOCK_H/2-DROP_GAP').replace('phase,width:WIDTH,floor:FLOOR','phase,width:WIDTH,blockWidth:BLOCK_W,blockHeight:BLOCK_H,floor:FLOOR'));
edit('games/crane/public/client.js',s=>s.replace('function draw(){requestAnimationFrame(draw);','function draw(){if(!host)return;requestAnimationFrame(draw);').replaceAll('w:156,h:54','w:state.blockWidth||110,h:state.blockHeight||110').replace('hookY-28','hookY-(state.blockHeight||110)/2').replace('hookY+34','hookY+(state.blockHeight||110)/2+7').replace('y-=54','y-=110'));
