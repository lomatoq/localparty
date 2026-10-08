from pathlib import Path
import html, shutil
root=Path(__file__).resolve().parents[1]
base=root/'output/playwright';out=base/'console-motion135';out.mkdir(exist_ok=True)
sections=[]
def section(title,items,note=''):
 cards=[]
 for rel,label in items:
  src=base/rel
  if not src.exists():continue
  url='../'+rel
  media=f'<video controls muted playsinline preload="metadata" src="{url}"></video>' if src.suffix=='.webm' else f'<a href="{url}"><img loading="lazy" src="{url}" alt="{html.escape(label)}"></a>'
  cards.append('<figure>'+media+'<figcaption>'+html.escape(label)+'</figcaption></figure>')
 sections.append('<section><h2>'+title+'</h2><p>'+note+'</p><div class="grid">'+''.join(cards)+'</div></section>')
section('Выбор игры', [('console-motion135/choice/webkit-confirmed.png','TV: короткое подтверждение принятого выбора'),('console-motion135/choice/webkit-native-confirmed.png','Пульт приложения: такой же акцент'),('console-motion135/choice/webkit-choice.webm','Запись браузерного теста выбора')],'Первое подключение и повторные данные не запускают эффект.')
section('Реакции на события',[(f'semantic-feel133/webkit-{x}.png',label) for x,label in [('hungry-real-ko','Hungry: реальное поглощение в симуляции из контрольной позиции'),('hit','Попадание — постановочный показ эффекта'),('score','Награда — постановочный показ эффекта'),('round-result','Завершение раунда — постановочный показ эффекта'),('turn-ready','Передача хода — постановочный показ эффекта')]],'Разные акценты для разных событий. Родные эффекты игр сохранены. Максимум16 временных слоёв и48 частиц.')
section('Награждение',[(f'podium-motion136/webkit-{t}.png',f'TV · {t}мс') for t in [0,240,600,1100]]+[(f'podium-motion136/webkit-phone-{t}.png',f'Телефон · {t}мс') for t in [0,240,500,900]],'Контрольные кадры настоящих компонентов. Одинаковые места открываются вместе; счёт сразу конечный. Дополнительно проверен настоящий финиш Tap Race.')
section('Сыграть ещё раз',[(f'rematch-ui136/webkit-{who}-{w}.png',f'{who} · {w}px') for who in ['player','host'] for w in [320,393]],'Кнопка появляется после матча. Проверены игрок, браузерный ведущий и оболочка iPhone; одновременные запросы не создают два матча.')
section('Пульт и Host Pick',[(f'phone-copy133/webkit-393-{x}.png',label) for x,label in [('native','Подпись и счётчик в приложении'),('closed','QR-подсказка закрыта'),('opening-110','Середина раскрытия — затемнение остаётся'),('open','Подсказка раскрыта')]],'Настоящие компоненты с мостами приложения; контрольные данные комнаты. Проверены320/393px в двух браузерных движках.')
section('Проверка оттенков подписей',[(f'color133-before/{x}',label) for x,label in [('crane-play1-393x852-native.png','Night Shift · пульт'),('naval-tv.png','Quick Battleships · TV'),('knives-play1-393x852-native.png','Color Knives · пульт')]],'Общие подписи здесь уже были окрашены в тему. Их не меняли ради изменения: проверены фактические цвета и читаемость.')
section('Push Pit', [('push128/start-1280.png','Все стартовые направления обращены к центру')],'Контрольные неподвижные позиции четырёх игроков в реальном рендерере.')
page='<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HeyPals · Motion & Replay</title><style>body{margin:0;padding:32px;background:#151120;color:#f4efff;font:16px system-ui}main{max-width:1400px;margin:auto}h1{font-size:36px}h2{margin-top:48px}p{color:#c5bcd7;line-height:1.5}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}figure{margin:0;background:#231c32;border:1px solid #67567a;border-radius:18px;overflow:hidden}img,video{display:block;width:100%;height:300px;object-fit:contain;background:#100c18}figcaption{padding:16px;color:#ded4ec}a{color:#c9b1ff}</style><main><h1>HeyPals · анимации и повтор матча</h1><p>Свежие браузерные проверки · 6октября2026. Это проверка интерфейсов и игровых событий, не замер на физическом iPhone/AirPlay.</p>'
page+=''.join(sections)
page+='<p>Основа направления: <a href="https://www.nintendo.com/au/news-and-articles/ask-the-developer-vol-11-super-mario-bros-wonder-chapter-2/">Nintendo: Mario Wonder</a>; свои формы, эффекты и длительности HeyPals.</p></main></html>'
(out/'index.html').write_text(page)
print(out/'index.html')
