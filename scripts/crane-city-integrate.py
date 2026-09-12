from pathlib import Path
p=Path('games/crane/public/client.js');s=p.read_text(encoding='utf-8');start=s.index('function draw(){if(!host)return;');end=s.index('if(!state)return;const target=',start)
replacement="""const cityArtwork=new Image();cityArtwork.src='/assets/gameplay/crane-city.webp';let craneFrameTime=performance.now();
function draw(now=performance.now()){if(!host)return;requestAnimationFrame(draw);const dt=Math.min(.05,Math.max(0,(now-craneFrameTime)/1000));craneFrameTime=now;ctx.clearRect(0,0,1100,850);ctx.fillStyle='#07182b';ctx.fillRect(0,0,1100,850);if(cityArtwork.complete&&cityArtwork.naturalWidth)ctx.drawImage(cityArtwork,0,0,1100,850);
"""
s=s[:start]+replacement+s[end:];s=s.replace('camera+=(target-camera)*.055;','camera+=(target-camera)*(1-Math.exp(-3.4*dt));');s=s.replace('beamY=hookY-135','beamY=state.beamY??hookY-135');p.write_text(s,encoding='utf-8')
