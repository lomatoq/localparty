from pathlib import Path
p=Path('games/crane/public/client.js');s=p.read_text(encoding='utf-8');start=s.index('function block(');end=s.index('const cityArtwork=',start)
s=s[:start]+"""function block(b,suspended=false){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle||0);ctx.shadowColor='#0006';ctx.shadowBlur=10;const variant=[...' '+(b.owner||'')].reduce((n,c)=>n+c.charCodeAt(0),0)%3;const painted=window.PartyArt?.draw(ctx,['facade-floor-a','facade-floor-b','facade-floor-c'][variant],0,0,b.w,b.h,{color:b.color});if(!painted){roundRect(-b.w/2,-b.h/2,b.w,b.h,3,b.color);roundRect(-b.w/2+12,-b.h/2+22,b.w-24,b.h-40,2,'#133c52');}ctx.shadowBlur=0;if(suspended){ctx.strokeStyle='#bbcbd1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-b.w*.3,-b.h*.5);ctx.lineTo(0,-b.h*.5-20);ctx.lineTo(b.w*.3,-b.h*.5);ctx.stroke();}ctx.restore();}
"""+s[end:]
start=s.index("ctx.strokeStyle='#71717d';");end=s.index('for(const b of state.blocks)',start)
s=s[:start]+"""const art=window.PartyArt;for(let y=780;y>beamY;y-=126){const height=Math.min(126,y-beamY);if(!art?.draw(ctx,'crane-mast',110,y-height/2,52,height)){ctx.fillStyle='#df9d23';ctx.fillRect(88,y-height,44,height);}}for(let x=110;x<1010;x+=150){const width=Math.min(150,1010-x);if(!art?.draw(ctx,'crane-boom',x+width/2,beamY-16,width,54)){ctx.fillStyle='#e3aa30';ctx.fillRect(x,beamY-32,width,30);}}
"""+s[end:]
s=s.replace("roundRect(state.trolley-20,beamY-12,40,25,5,'#ffbc79');", "if(!art?.draw(ctx,'crane-trolley',state.trolley,beamY+3,54,70))roundRect(state.trolley-20,beamY-12,40,25,5,'#ffbc79');")
s=s.replace("window.PartyArt?.draw(ctx,'hook',state.hookX,hookY-(state.blockHeight||110)/2-10,16,30);", "art?.draw(ctx,'crane-hook',state.hookX,hookY-(state.blockHeight||110)/2-23,19,40);")
p.write_text(s,encoding='utf-8')
