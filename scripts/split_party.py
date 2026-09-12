from pathlib import Path
import json
p=Path('catalog.json'); games=json.loads(p.read_text(encoding='utf-8'))
specs=[
 ('push','Push Pit','Арена','#d4ee77','◉','Выталкивай друзей за край сужающейся арены. Последний на площадке побеждает.','Веди виртуальный джойстик. Инерция помогает разогнаться и вытолкнуть соперника.'),
 ('knives','Color Knives','На меткость','#f2ce80','✦','Попади ножом в свой цвет на вращающейся мишени. Лови момент и не промахнись.','Касайся кнопки броска, когда твой сектор проходит перед ножом.'),
 ('bomb','Bomb Tag','Догонялки','#ee9c84','●','Бомба у тебя? Передай её касанием и успей убежать до взрыва.','Джойстик: догоняй соперников с бомбой и убегай от неё без бомбы.'),
 ('western','One Shot Western','Дуэль','#d9bc93','★','Кто выстрелит первым? Жди настоящего сигнала и не попадись на обманку.','Одна кнопка выстрела. Нажимай только после сигнала DRAW! на общем экране.')]
cards=[dict(id=id,title=title,version='1.1',tag=tag,color=color,icon=icon,description=desc,controls=controls,min=2,max=16,runtime='node',engine='party',mode=id,host='/host?mode='+id,player='/',section='arcade') for id,title,tag,color,icon,desc,controls in specs]
for g in games:
 if g['id'] in ['party','push','knives','bomb','western']:continue
 g['section']='table' if g['id'] in ['spy','millionaire'] else 'arcade'
 cards.append(g)
p.write_text(json.dumps(cards,ensure_ascii=False,indent=2),encoding='utf-8')
p=Path('server.js');s=p.read_text(encoding='utf-8').replace("cwd:path.join(ROOT,'games',id)","cwd:path.join(ROOT,'games',game.engine||id)");p.write_text(s,encoding='utf-8')
