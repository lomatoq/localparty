'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(Number(v))?Number(v):a));

// A single parser is used by the scoreboard, turn manager and rack reset logic.
function bowlingCard(rolls, frames=10) {
  let i=0, total=0, complete=true;
  const card=[];
  for(let f=0;f<frames;f++) {
    const a=rolls[i], b=rolls[i+1], c=rolls[i+2], last=f===frames-1;
    let count, done, points=null;
    if(last) {
      count=a===10||(a!==undefined&&b!==undefined&&a+b===10)?3:2;
      done=a!==undefined&&b!==undefined&&(count===2||c!==undefined);
      if(done) points=a+b+(count===3?c:0);
    } else {
      count=a===10?1:2;
      done=a!==undefined&&(a===10||b!==undefined);
      if(a===10&&c!==undefined)points=10+b+c;
      else if(a!==undefined&&b!==undefined&&a+b===10&&c!==undefined)points=10+c;
      else if(a!==undefined&&b!==undefined&&a+b<10)points=a+b;
    }
    if(points!==null)total+=points;
    card.push({rolls:rolls.slice(i,i+count),points,total:points===null?null:total,done});
    if(!done){complete=false;break;} i+=count;
  }
  const frame=card.length-1, r=card.at(-1)?.rolls||[];
  let fresh=true, allowed=10;
  if(!complete) {
    if(frame<frames-1){fresh=r.length===0;allowed=fresh?10:10-r[0];}
    else if(r.length===1){fresh=r[0]===10;allowed=fresh?10:10-r[0];}
    else if(r.length===2){fresh=r[0]!==10||r[1]===10;allowed=fresh?10:10-r[1];}
  }
  return {card,total,complete,frame,fresh,allowed};
}
function appendRoll(rolls,pins,frames=10){
  const before=bowlingCard(rolls,frames);
  if(before.complete||!Number.isInteger(pins)||pins<0||pins>before.allowed)throw Error('Invalid bowling roll');
  rolls.push(pins);return bowlingCard(rolls,frames);
}
function curlingScore(stones) {
  const distances=[0,1].map(team=>stones.filter(s=>s.team===team&&!s.out).map(s=>Math.hypot(s.x,s.z-25)).filter(d=>d<=2.72).sort((a,b)=>a-b));
  const nearest=distances.map(a=>a[0]??Infinity);
  if(nearest[0]===nearest[1]||Math.abs(nearest[0]-nearest[1])<.005)return [0,0];
  const winner=nearest[0]<nearest[1]?0:1;
  const score=[0,0];score[winner]=distances[winner].filter(d=>d<nearest[1-winner]-.005).length;return score;
}
function gesture(samples,width,height) {
  if(samples.length<2||width<=0||height<=0)return null;
  const first=samples[0],last=samples.at(-1),duration=last.t-first.t;
  const travel=(first.y-last.y)/height;
  if(duration<70||duration>2200||travel<.13)return null;
  const speed=travel/(duration/1000);
  const tail=samples.find(s=>s!==last&&s.t>=last.t-110)||samples.at(-2)||first;
  const bend=(last.x-tail.x)-(last.y-tail.y)*(last.x-first.x)/(last.y-first.y);
  return {power:clamp(travel*.65+speed*.20,.1,1),angle:clamp((last.x-first.x)/width,-1,1),spin:clamp(bend/width*12,-1,1)};
}
function pointCovered(x,z,obstacles){return obstacles.some(o=>x>o.x-o.w/2&&x<o.x+o.w/2&&z>o.z-o.d/2&&z<o.z+o.d/2);}
const rules={clamp,bowlingCard,appendRoll,curlingScore,gesture,pointCovered};
if(typeof module!=='undefined')module.exports=rules;else globalThis.PartyRules=rules;
