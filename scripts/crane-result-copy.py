from pathlib import Path
p=Path('games/crane/public/client.js');s=p.read_text(encoding='utf-8');s=s.replace("state.phase==='lobby'?'2–16 игроков · поздний вход разрешён':", "state.phase==='lobby'?'2–16 игроков · поздний вход разрешён':state.phase==='results'?'Итог: этажей '+state.height+' · ходов '+state.turns:");p.write_text(s,encoding='utf-8')
p=Path('games/crane/server.js');s=p.read_text(encoding='utf-8');s=s.replace("progress:heightRecord+' этажей · ход '+(turns+1)","progress:heightRecord+' этажей · ход '+(turns+(phase==='results'?0:1))");p.write_text(s,encoding='utf-8')
