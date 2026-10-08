from pathlib import Path
import json, html, hashlib, datetime
root=Path('output/playwright/ui244-detail')
current=root/'after-motion' if (root/'after-motion/report.json').exists() else root/'after'
notes={
 'cached-main-noTV':'Комната ещё готовится, TV не подключён. Host Pick сохраняет оформление и показывает приглушённый Play.',
 'cached-noTV':'Правила Ice & Nerves открыты из локального каталога без готового TV/server. Запуск и настройки остаются ограничены.',
 'ready-green-main':'Готовая комната: обычный зелёный Play и оформление Host Pick сохранены.',
 'nearbyDialog':'Nearby Rooms: Host Pick и галерея остаются видимыми под общим размытием. Ввод/rename проверялись отдельно в keyboard243.',
 'hostPanel':'Программно открыт существующий Host Panel; его техническая кнопка скрыта tabs как и в приложении. Подложка главного экрана не меняет геометрию.',
 'reduced-motion':'Reduced motion: арт появляется без перелёта; это браузерная проверка accessibility preference.'}
parts=['<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UI244 — Rules and detail artwork</title><style>body{background:#120d1b;color:#eadfff;font:16px/1.5 system-ui;margin:0;padding:24px;max-width:1600px;margin:auto}h1,h2{color:#d2b2ff}a{color:#c4ff8b}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:22px}figure{margin:0;background:#241b30;border:1px solid #5b416e;border-radius:22px;padding:16px}img,video{width:100%;max-width:393px;display:block;margin:auto;border-radius:14px}figcaption{font-size:14px;margin-top:12px}small{color:#c7aee0}</style><h1>Rules без TV и переход арта — UI244</h1><p>Chrome / WebKit, 393×852, фактический native host HTML с visibility + tabs injection. Это browser fixtures, без утверждения о физическом iPhone или AirPlay.</p>']
parts+=['<p><a href="before/report.json">Baseline report</a> · <a href="after/report.json">36 Rules + popup backgrounds</a> · <a href="'+current.name+'/report.json">Final motion report</a> · <a href="visual-review.json">Source hashes / reviewed files</a></p>']
parts+=['<h2>Локальные правила, готовность и общий фон</h2><div class="grid">']
for engine in ['webkit','chromium']:
 for key,note in notes.items():
  p=root/'after'/f'{engine}-{key}.png'
  if p.exists():parts.append(f'<figure><img loading="lazy" src="{p.relative_to(root)}"><figcaption><b>{engine} — {html.escape(key)}</b><br>{note}</figcaption></figure>')
parts+=['</div><h2>Перелёт: мягкое движение → резкий арт внутри попапа</h2><p>Play и прочая вёрстка не перестраиваются. Блюр самого летящего арта управляется отдельно от общего фона, затем совпадающие картинки плавно перекрываются. Кадры захвачены в реальном времени; screenshot/video может влиять на frame pacing WebKit.</p><div class="grid">']
for engine in ['webkit','chromium']:
 for kind in ['cold','warm','interrupt','reopen']:
  for n,phase in [(1,'ранний кадр'),(2,'движение / прибытие'),(3,'завершённое состояние')]:
   p=current/f'{engine}-{kind}-{n}.png'
   if p.exists():parts.append(f'<figure><img loading="lazy" src="{p.relative_to(root)}"><figcaption><b>{engine} / {kind} / {phase}</b><br>Cold — первое открытие; warm — повтор; interrupt — закрытие через 65 ms; reopen — закрытие и повторное открытие через 65 ms.</figcaption></figure>')
parts+=['</div><h2>Реальная запись переходов</h2><div class="grid">']
for p in sorted((current/'video').glob('*.webm')):
 parts.append(f'<figure><video controls preload="metadata" src="{p.relative_to(root)}"></video><figcaption>Native-host fixture, 393×852. В начале запись локального чтения; далее cold / warm / interrupt / reopen.</figcaption></figure>')
parts+=['</div><h2>До исправления</h2><div class="grid">']
for engine in ['webkit','chromium']:
 for key in ['cached-noTV','warm-2','warm-3']:
  p=root/'before'/f'{engine}-{key}.png'
  if p.exists():parts.append(f'<figure><img loading="lazy" src="{p.relative_to(root)}"><figcaption>{engine} baseline {key}: Rules отключены вместе со Start; clone ошибочно получает background blur и резко сменяется финальным изображением.</figcaption></figure>')
parts+=['</div>'];(root/'index.html').write_text('\n'.join(parts))
