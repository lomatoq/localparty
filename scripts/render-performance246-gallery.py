#!/usr/bin/env python3
"""Build a review gallery from round-246 captures; never manufacture screenshots."""
import argparse
import html
import os
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--status', default='Проверки продолжаются. Новые изменения ещё не установлены на телефон.')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
out = root / 'output/playwright/performance246'
groups = [
    ('Телефон: меню и панель', out / 'phone/final', '*-candidate-*.png'),
    ('Встроенный пульт: реальные кнопки открытия', out / 'popups/actual-controller', '*.png'),
    ('Веб: профиль, игроки и топ', out / 'popups/actual-targets', '*.png'),
    ('Комнаты, правила и боты', out / 'popups', '*-native-*.png'),
    ('TV: исправленная геометрия', root / 'output/playwright/tv-layout246/final', '*.png'),
    ('Шторка: финальные кадры', out / 'curtain/final', '*.png'),
    ('Восстановление профиля в браузере', root / 'output/playwright/profile246/validated', '*-fixed-*-restored-profile.png'),
]
sections = []
for title, folder, pattern in groups:
    figures = []
    for path in sorted(folder.glob(pattern)):
        if folder == out / 'popups' and path.stem.endswith('-native-host'):
            continue  # Legacy hidden opener was an explicitly programmatic diagnostic.
        relative = Path(os.path.relpath(path, out)).as_posix()
        name = html.escape(path.stem)
        url = html.escape(relative, quote=True)
        figures.append(f'<figure><a href="{url}"><img loading="lazy" src="{url}" alt="{name}"></a><figcaption>{name}<p>Браузерный захват; результаты визуальной проверки и ограничения — в отчётах round246.</p></figcaption></figure>')
    if figures:
        sections.append(f'<section><h2>{html.escape(title)}</h2><div class="grid">{"".join(figures)}</div></section>')
out.mkdir(parents=True, exist_ok=True)
page = '''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HeyPals · Performance246</title>
<style>body{margin:0;padding:24px;background:#120c1f;color:#f1e9ff;font:16px/1.5 system-ui}main{max-width:1500px;margin:auto}h1{margin:0}a{color:#d0b2ff}.lead{max-width:980px;color:#d1bfeb}.status{color:#caff84}section{margin-top:36px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}figure{margin:0;background:#23192f;border:1px solid #5b496a;border-radius:18px;overflow:hidden}img{display:block;width:100%;height:auto}figcaption{padding:14px;font-size:13px;overflow-wrap:anywhere}figcaption p{color:#bdabc9;margin-bottom:0}</style>
<main><h1>Performance246</h1><p class="lead">Свежие состояния Chrome/WebKit. Native — реальный маршрут с bridge/tabs и тестовыми данными, а не физический iPhone. Браузерные результаты не подтверждают плавность отдельного TV при кастинге.</p>'''
page += f'<p class="status">{html.escape(args.status)}</p>'
page += '<p class="lead">Диагностические, исходные и неудачные кадры исключены из этой подборки. Текущие отчёты: docs/qa/integration246.md, phone-hotpath246.md, popup-performance246.md, curtain246.md, tv-layout246.md и profile-restore246.md.</p>'
page += ''.join(sections) + '</main></html>'
(out / 'index.html').write_text(page)
print(out / 'index.html')
