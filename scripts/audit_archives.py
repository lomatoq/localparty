from pathlib import Path
import hashlib, zipfile, json

archives = ['LOCAL_TANKS_v1.1.zip','ONE_CURSOR_CHAOS_LAB_v4.zip','monster-circle-lan (1).zip','wifi_kart_party.zip','LOCAL_PARTY_PACK_v1.0.zip','LOCAL_PARTY_PACK_v1.1_WESTERN_BOMB.zip','spy-lan-game.zip','sinyak-millionaire-lan.zip']
def entries(name):
 with zipfile.ZipFile(Path.home()/'Downloads'/name) as z:
  return {'/'.join(p.filename.split('/')[1:]):hashlib.sha256(z.read(p)).hexdigest() for p in z.infolist() if not p.is_dir()}
old,new=entries(archives[4]),entries(archives[5])
same=[p for p in old if p in new and old[p]==new[p]]
changed=[p for p in old if p in new and old[p]!=new[p]]
text='''# Проверка восьми архивов

Оригинальные архивы и распакованные `sources/` сохранены без изменений. В релиз включены адаптированные копии в `games/`.

## Дубли и версии

- `LOCAL_PARTY_PACK_v1.0.zip` и `LOCAL_PARTY_PACK_v1.1_WESTERN_BOMB.zip` — версии одного проекта. Код 1.0 содержит Push Pit и Color Knives. В 1.1 сохранены оба режима, добавлены Bomb Tag и One Shot Western. В лаунчере только 1.1.
- Local Tanks 1.1 — отдельный проект: survival, capture-the-flag, coop. Сходные сетевые вспомогательные файлы с Party Pack не означают повтор игры.
- Chaos Lab: имя архива v4, константа BUILD_ID в сервере `CHAOS-LAB-v4.1`; сохранены 15 уровней.
- Monster Circle 1.0, Spy 1.0, Millionaire 1.0 — отдельные проекты по package.json. Суффикс `(1)` у архива Monster не является номером версии.
- У Wi-Fi Kart в архиве нет явного номера версии; более новой копии среди переданных файлов нет.
- Millionaire: 150 вопросов, без точных повторов текста и ID; 59 смысловых групп с вариантами. Проверка фактической правильности ответов не проводилась.

Результат: 7 отдельных наборов вместо 8 архивов. Общие CSS/сетевые подходы не использовались как основание удалять самостоятельные игры.

## Побайтовое сравнение Party Pack

'''
text+=f'Одинаковых файлов: {len(same)}. Изменённых: {len(changed)}.\n\n'
text+='Не изменились: '+', '.join(f'`{p}`' for p in same)+'.\n\n'
text+='Изменились: '+', '.join(f'`{p}`' for p in changed)+'.\n\n'
text+='## SHA-256 исходных архивов\n\n| Архив | SHA-256 |\n|---|---|\n'
for a in archives:
 p=Path.home()/'Downloads'/a
 text+=f'| {a} | `{hashlib.sha256(p.read_bytes()).hexdigest()}` |\n'
Path('ARCHIVE_AUDIT.md').write_text(text,encoding='utf-8')
