const fs=require('fs');
let p='games/arcade/simulation.js',s=fs.readFileSync(p,'utf8');
s=s.replace(' resetBall(){',' punchPlayer(){return this.players.filter(p=>p.connected&&p.hits.length<3).sort((a,b)=>a.hits.length-b.hits.length)[0];}\n resetBall(){');
s=s.replace("this.mode==='punchmeter'&&p.hits.length<3&&", "this.mode==='punchmeter'&&this.punchPlayer()?.id===id&&p.hits.length<3&&");
s=s.replace('return {mode:this.mode,title:',"return {punchTurn:this.mode==='punchmeter'?this.punchPlayer()?.id:null,mode:this.mode,title:");fs.writeFileSync(p,s);
p='games/arcade/public/app.js';s=fs.readFileSync(p,'utf8');s=s.replace("p.hits.length>=3;", "(p.hits.length>=3||s.punchTurn!==id);");
s=s.replace("`${p.hits.length}/3 · лучший ${Math.max(0,...p.hits)} · сумма ${p.score}`", "`${s.punchTurn===id?'ТВОЙ УДАР · попытка '+(p.hits.length+1)+'/3':'Сейчас бьёт: '+(s.players.find(q=>q.id===s.punchTurn)?.name||'—')} · лучший ${Math.max(0,...p.hits)} · сумма ${p.score}`");
s=s.replace("if(s.mode==='punchmeter'){const angle", "if(s.mode==='punchmeter'){const turn=s.players.find(p=>p.id===s.punchTurn);if(s.phase==='playing'&&turn){text('БЬЁТ: '+turn.name,600,35,26,turn.color);text('Попытка '+(turn.hits.length+1)+' из 3',600,690,22);}const angle");fs.writeFileSync(p,s);
p='public/test-bot.js';s=fs.readFileSync(p,'utf8').replace("if(game==='knives')", "if(game==='punchmeter'){const e=q('#action');if(available(e)){hold(e);setTimeout(()=>release(e),500);}}\n    if(game==='knives')");fs.writeFileSync(p,s);
