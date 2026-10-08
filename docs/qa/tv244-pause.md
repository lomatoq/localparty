# TV244: устранение верхней полосы Pause

Дата 2026-10-07. Production изменён только в `public/tv-information.css:201` для слоя `#paused`. TV243 размеры, кнопки и sidebar не менялись. Билд в этом lane не собирался.

## Причина и изменение

| Before | After | Why |
| --- | --- | --- |
| `#play` на paused Deluxe начинается под глобальной шапкой в y64, а `#paused` дополнительно имеет top64. Слой Pause начинается в y128 логической сцены. Между y64 и y128 остаётся открытый фон `#play` (#10151a), видимый на 4K как полоса y192–384. | Только Pause получает top0. Его верх совпадает с началом локального поля. `#waiting` по-прежнему top64; padding-top40 и все notch/motion стили сохранены. | Убирается лишний отступ внутри уже смещённого поля. Слой закрывает место, оставшееся после скрытия игровой шапки. |

`syncGameVisibility` показывает gamebar только в countdown/playing/reveal, а Deluxe на pause публикует ui phase paused. Поэтому эффект был старым общим layout-дефектом, а не результатом нового renderer delta. У tabletop Air Hockey ui остаётся playing при paused session: сохранённая gamebar имеет z10 над Pause z1, и её скульптурная маска остаётся видимой.

Полная ширина Host Pick, монеты, арт, sculpted notch и Pause/Lobby контроллеров не менялись. CSS SHA-256: `df305878b08ca79400eda80d59a7496aabf1cad9b366855035e3552fdba5876c`.

## Actual proof

Команда: `QA_ENGINE=webkit node scripts/capture-tv-pause244.cjs`.

Первый sandbox attempt остановился **до браузера** с `listen EPERM` на localhost. Разрешённый rerun вне sandbox прошёл. Actual proof завершился за 21.863s: `2026-10-07T16:47:13.605Z` → `2026-10-07T16:47:35.468Z`. Собственные WebKit и server процессы закрыты; CPU слот освобождён сразу после завершения.

Это настоящие embedded `server.js` и `/tv`, реальные game workers и два аутентифицированных встроенных bot controllers. Для Pocket baseline/after сменён только production TV stylesheet в том же смонтированном матче; worker/UI state не подменялись.

- Pocket Siege before: play y64 / paused y128, computed top64, gamebar hidden. Полоса воспроизвелась.
- Pocket Siege after: play y64 / paused y64, computed top0. Полоса исчезла.
- Marble Bloom after: play y64 / paused y64, computed top0. Полоса отсутствует.
- Air Hockey: реальный paused tabletop матч сохраняет видимую gamebar. Play y0 / Pause y0, gamebar z10 / veil z1. Notch полностью видим над паузой.
- Во всех трёх матчах pause/resume сохраняет instance; слой Pause скрывается, игра продолжается.
- Waiting computed top64 сохраняется во всех сценариях. Production JS не изменялся.
- JS errors 0, resource errors 0; report `ok:true`. 8 свежих полных 3840×2160 кадров.

## Визуальный просмотр

Все 8 изображений открыты и просмотрены:

- Pocket before/after: резкая зелёная полоса воспроизводится до, исчезает после. Общая фиолетовая поверхность Pause и глобальная шапка сохранены. Центр содержания сдвигается вверх на32 логических px вслед за устранением лишнего64px offset и правильной центровкой во всём поле.
- Pocket/Marble resume: исходные игровые арты, поле, показатели и sculpted notch видимы; новый матч не стартовал.
- Marble paused: цельная поверхность до глобальной шапки, без uncovered strip.
- Air Hockey playing/paused/resume: шапка над поверхностью Pause сохраняет светлый материал и скульптурные плечи. Поле нормально возвращается; Pause остается ниже шапки по z-order.

Существующая полупрозрачность позволяет едва видеть underlying игровое слово Pause в Deluxe; материал/степень blur и левый фонарь в этом узком исправлении не менялись.

Галерея `output/playwright/tv244-pause/index.html`; report `output/playwright/tv244-pause/webkit/report.json`. Root second review: `webkit/pocket_siege-after-paused.png` и `webkit/airhockey-after-paused.png`.

Это браузерная проверка геометрии/pause lifecycle, не физический iPhone/AirPlay FPS-замер. Физический cast остаётся отдельной проверкой root.
