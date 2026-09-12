from pathlib import Path
import json
p=Path('catalog.json'); data=json.loads(p.read_text(encoding='utf-8'))
if not any(g['id']=='millionaire' for g in data):
 data.append({'id':'millionaire','title':'Синяк-миллионер','version':'1.0','tag':'Квиз · 150 вопросов','icon':'?','color':'#c5c9ef','description':'Обсуждайте, рискуйте и выбирайте ответ. Кто заберётся выше по денежной лестнице?','controls':'Четыре варианта ответа и подсказки на телефоне. Общий вопрос — на экране.','min':2,'max':16,'runtime':'node','host':'/host','player':'/'})
data[3]['controls']='Поворачивай сенсорный руль и удерживай газ. Есть раскладка для левой руки.'
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
p=Path('public/index.html');s=p.read_text(encoding='utf-8').replace('6 наборов · без повторов','7 наборов · без повторов').replace('Квизы добавим позже. Сейчас — все игры из твоих архивов.','Теперь и квиз: «Синяк-миллионер» · 150 вопросов.');p.write_text(s,encoding='utf-8')
p=Path('public/app.js');s=p.read_text(encoding='utf-8').replace('state.catalog[i%6]','state.catalog[i%state.catalog.length]').replace('0${i+1} / 06','0${i+1} / 0${state.catalog.length}');p.write_text(s,encoding='utf-8')
p=Path('games/chaos/server.py');s=p.read_text(encoding='utf-8').replace('JOIN_URL = f"http://{LAN_IP}:{PORT}/controller?build={BUILD_ID}"','JOIN_URL = os.environ.get("PARTY_JOIN_URL") or f"http://{LAN_IP}:{PORT}/controller?build={BUILD_ID}"');p.write_text(s,encoding='utf-8')
p=Path('server.js');s=p.read_text(encoding='utf-8').replace('PARTY_PLAYER_LIMIT:String(connected().length),', 'PARTY_PLAYER_LIMIT:String(connected().length),PARTY_JOIN_URL:inviteUrl(),')
s=s.replace('const connected = ()', "function inviteUrl(req){const ips=addresses();const selected=req&&new URL(req.url,'http://localhost').searchParams.get('host');const ip=ips.find(x=>x.address===selected)?.address||ips[0]?.address;return ip?`http://${ip}:${PORT}/`:`http://${req?.headers.host||'localhost:'+PORT}/`;}\nconst connected = ()")
s=s.replace('const join=`http://${req.headers.host}/`;', 'const join=inviteUrl(req);').replace('QRCode.toBuffer(`http://${req.headers.host}/`)','QRCode.toBuffer(inviteUrl(req))')
p.write_text(s,encoding='utf-8')
