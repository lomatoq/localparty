const fs=require('fs'),file='games/arcade/public/app.js';let code=fs.readFileSync(file,'utf8');
const feedback=`
// Feedback follows authoritative event changes; simulation time freezes it on pause.
let feedbackState=null,feedbackKey='',feedbackBursts=[];
function drawFeedback(s){
 const key=s.mode+':'+s.round+':'+s.phase;
 if(key!==feedbackKey){feedbackBursts=[];feedbackState=null;feedbackKey=key;}
 const burst=(x,y,color,strength=1)=>{feedbackBursts.push({x,y,color,strength,time:s.time});if(feedbackBursts.length>20)feedbackBursts.shift();};
 if(state!==feedbackState){
  if(feedbackState&&s.phase==='playing'){
   for(const p of s.players){const old=feedbackState.players.find(q=>q.id===p.id);if(!old)continue;
    if(s.mode==='hungry'&&p.mass>old.mass+.5)burst(p.x,p.y,p.color,.55);
    if(['flappy','snakelines'].includes(s.mode)&&old.alive&&!p.alive)burst(p.x,p.y,p.color,1);
    if(s.mode==='punchmeter'&&p.hits.length>old.hits.length){const a=s.bag.angle;burst(600+Math.sin(a)*250,170+Math.cos(a)*250,p.color,1.5);}
   }
   if(s.mode==='carryball'){
    if(s.teams[0]>feedbackState.teams[0])burst(1180,360,'#b9ff4d',2);
    if(s.teams[1]>feedbackState.teams[1])burst(20,360,'#c295ff',2);
    if(feedbackState.ball.owner&&!s.ball.owner)burst(s.ball.x,s.ball.y,'#fff1c7',.5);
   }
  }
  feedbackState=state;
 }
 feedbackBursts=feedbackBursts.filter(b=>s.time-b.time<.7);
 g.save();for(const b of feedbackBursts){const t=Math.max(0,(s.time-b.time)/.7),ease=1-Math.pow(1-t,3);g.globalAlpha=Math.pow(1-t,2);g.strokeStyle=b.color;g.lineWidth=2.5*(1-t)+.5;g.beginPath();g.arc(b.x,b.y,8+ease*(reducedArtMotion?9:45)*b.strength,0,Math.PI*2);g.stroke();if(!reducedArtMotion){g.fillStyle=b.color;for(let i=0;i<6;i++){const a=i*Math.PI/3+b.time,d=ease*55*b.strength,x=b.x+Math.cos(a)*d,y=b.y+Math.sin(a)*d+t*t*30;g.fillRect(x-2,y-2,4,4);}}}g.restore();
}
`;
if(!code.includes('function drawFeedback')){code=code.replace('function draw(){g.clearRect',feedback+'\nfunction draw(){g.clearRect');code=code.replace('requestAnimationFrame(draw);}draw();}',"if(state)drawFeedback(state);requestAnimationFrame(draw);}draw();}");fs.writeFileSync(file,code);}
