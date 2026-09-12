# Проверка восьми архивов

Оригинальные архивы и распакованные `sources/` сохранены без изменений. В релиз включены адаптированные копии в `games/`.

## Дубли и версии

- `LOCAL_PARTY_PACK_v1.0.zip` и `LOCAL_PARTY_PACK_v1.1_WESTERN_BOMB.zip` — версии одного проекта. Код 1.0 содержит Push Pit и Color Knives. В 1.1 сохранены оба режима, добавлены Bomb Tag и One Shot Western. В лаунчере только 1.1.
- Local Tanks 1.1 — отдельный проект: survival, capture-the-flag, coop. Сходные сетевые вспомогательные файлы с Party Pack не означают повтор игры.
- Chaos Lab: имя архива v4, константа BUILD_ID в сервере `CHAOS-LAB-v4.1`; сохранены 15 уровней.
- Monster Circle 1.0, Spy 1.0, Millionaire 1.0 — отдельные проекты по package.json. Суффикс `(1)` у архива Monster не является номером версии.
- У Wi-Fi Kart в архиве нет явного номера версии; более новой копии среди переданных файлов нет.
- Millionaire: 150 вопросов, без точных повторов текста и ID; 59 смысловых групп с вариантами. Проверка фактической правильности ответов не проводилась.

Результат: 7 исходных проектов вместо 8 архивов. В меню 10 отдельных карточек: четыре игры Party Pack вынесены отдельно и используют одну общую копию кода. Шпион и квиз визуально выделены в собственный раздел. Общие CSS/сетевые подходы не использовались как основание удалять самостоятельные игры.

## Побайтовое сравнение Party Pack

Одинаковых файлов: 6. Изменённых: 9.

Не изменились: `GAME_IDEAS.md`, `public/net.js`, `public/qr-lite.js`, `start-linux.sh`, `start-mac.command`, `start-windows.bat`.

Изменились: `server.js`, `public/host.js`, `public/controller.js`, `public/host.html`, `public/controller.css`, `public/host.css`, `public/index.html`, `README.md`, `package.json`.

## SHA-256 исходных архивов

| Архив | SHA-256 |
|---|---|
| LOCAL_TANKS_v1.1.zip | `ce2a5fa1916de6329565248b624b76a42cca8b503840d4c823c32fd623ca6c53` |
| ONE_CURSOR_CHAOS_LAB_v4.zip | `db27aafd79f7fba78144741a72ab8f7da7442457f2f117397b834909f9aeb95b` |
| monster-circle-lan (1).zip | `9098771b092f7d0a5351a0071f9e04a5ecb96307f94ab87254b9126c373cd475` |
| wifi_kart_party.zip | `3fd15d20e86f829c6a692713acfaa7548636142ec096a62239955b0ba91b3b2c` |
| LOCAL_PARTY_PACK_v1.0.zip | `b70b5287b21917115c6a9011c56ef9bd50738ec769085f1adc221a2aa5306f52` |
| LOCAL_PARTY_PACK_v1.1_WESTERN_BOMB.zip | `1811c618edb869bcc56bb586fcc329a1bccdc0e530700837619951a398292a9f` |
| spy-lan-game.zip | `dfb87f586cd4bd7cc4dedcf38dd74bbe4f430aea1b5c03425400ed8748139d6e` |
| sinyak-millionaire-lan.zip | `2c3bdd5f4fb504d5d1866c2b7184ec4c1687bb51fa590f538d67433ecab5e9f0` |

## Обновление платформы
Игровые копии Chaos и Kart переписаны на JavaScript. Все 18 карточек используют Node.js; Python исключён из переносимого запуска. Добавлены отдельные режимы сужающейся арены, Tank Arsenal, два одновременных квиза, Крокодил, Дженга, Ночная стройка и Быстрый морской бой. Исходные архивы по-прежнему сохранены без изменений. Позднее подключение больше не ограничивается фиксированным составом лаунчера: допуск к ходу регулирует сама игра.

