# Spy: исправление игрового UI, round3

Изменены только `games/spy/public/index.html`, `player.js`, `host.html`, `host.js` и новый `spy-layout.css`. Существовавшие до этого изменения `action-glass.css`/`host.css` сохранены побайтно. Main menu, matchmaking, общие Pause/Lobby и механика игры этим агентом не менялись. Baseline owner sources: `.localparty-build/design-round3/spy/baseline-source/`.

## Почему новая композиция устроена так

- Вопрос/ответ — основная задача. Действие Ask/Answer набрано KardiaFatRunner italic900 CAPS; имя вынесено на следующую строку в KardiaFit и защищено `data-no-translate`. Это исправляет склеенные текстовые узлы и сохраняет Cyrillic имя Бот 3 при English action. Подсказка FitRunner объясняет задачу и остаётся ниже, а не конкурирует с именем.
- Task, private role и decisive guess — разные назначения. Они разделены настоящими8/16px промежутками; private card не выглядит продолжением кнопки. Spy guess остаётся последним ярким действием. Для Spy, который задаёт вопрос, оба CTA помещаются на320 без прокрутки.
- Рабочая высота берётся из доступного игрового iframe. Удалены старые минимальные высоты, которые игнорировали верхнюю оболочку и нижние session actions.16px поля одинаковые у карточек и CTA. На393 задача центрируется в доступной области; Round/Duel остаются компактными над ней.
- Secret card действительно скрывается при отпускании удержания. Ready остаётся отдельным действием над footer. Для final attempt есть bounded dialog,220ms fade/scale, закрытие Escape/backdrop и возврат focus; быстрое повторное открытие не попадает под старый closing timer.
- НаTV общий таймер уже находится в шапке. Его пустой дубль убран только в display-only режиме, поэтому conversation и roster получили одинаковый верх и низ. Текущие собеседники и инструкция центрированы; длинные имена могут переноситься вместо вылезания за карточку.
- TV использует пропорциональный шаг от1280 к1920, согласованный с общей оболочкой. При1080 текст/отступы растут вместе с панелями: это сохраняет читаемость на расстоянии. Reveal использует фактическое число колонок2/4, поэтому двое не остаются на левой половине четырёхколоночной сетки. Vote count получил FatRunner900 при прежнем размере круга и числе.
- В списках vote/roster сохраняется scrollTop после обновления state.16 участников доступны полностью; session actions не прокручиваются вместе со списком. Результаты — общий компонент root, локального override здесь нет.

## Свежие доказательства и проверка

`tests/spy-ui.browser.cjs` поднимает отдельный ephemeral loopback launcher, использует настоящий WebKit и нормальные часы сервера.2/4 игрока подключаются реальными браузерами;16-player max — один настоящий browser player и15 встроенных test controllers. State, роли и результаты не подменяются.

| Run | Что проверено | Результат |
| --- | --- | --- |
| `acceptance/` | Reveal hold/release, Ask/Answer/Listen, реальный next question, два CTA Spy asker, final attempt, реальные wrong guess и4 votes,16 roster/vote last row | PASS50 PNG,17 labeled guards; первоначальные TV/results снимки впоследствии заменены |
| `tv-results-final/` | Финальные TV720/1080, центрирование reveal2/4, пропорциональные панели; точный English Answer Бот 3 на320/393 | PASS23 PNG,17 guards |
| `results-final/` | Последний shared results: реальные результаты2/4/16; верх и дно списка4/16 на320/393 | PASS10 PNG,19 guards |
| `vote-tv-final/` | Финальный KardiaFatRunner vote count наTV720/1080 | PASS2 PNG,19 guards |

Каждый run записывает source hashes до/после, geometry, viewport и реальные state/role. Во всех четырёх ownerChanged/sharedChanged внутри run — пустые списки. `review.json` содержит58 выбранных кадров с SHA256, датой, scope и индивидуальным выводом после ручного просмотра.29 неизменных phone кадров исходного acceptance сохранены: поздний CSS блок применяется только кTV, что подтверждено побайтным совпадением phone prefix. Старые4 phone results и17TV заменены актуальными целевыми захватами;2 TV vote кадра заменены ещё раз после финального шрифта числа.

Существенные guards: кнопки/панели не выходят за viewport; conversation/roster имеют одинаковый верх/низ; Ask/Answer имя соответствует настоящему authoritative turn; next question действительно меняет index; guess option English label сохраняет исходный protocol value; closing на70ms имеет opacity<1 и scale matrix; rapid reopen остаётся открытым; publicTV во время playing не содержит location, spyIds или private roles; votes принимаются один раз; all16 rows сохранены; последний result row полностью виден выше footer; scrollbar не занимает gutter; result rank/score и name имеют разные контрактные шрифты.

Engine integration `node games/spy/integration.test.cjs` PASS:2p duel, запрет trivial vote, ready gate, private late-spectator semantics, reconnect,16 players и stats. Syntax checks player.js/host.js/browser QA PASS.

Ключевые actual PNG:

- `.localparty-build/design-round3/spy/tv-results-final/literal-bot-answer-320.png` — последний пользовательский дефект исправлен: Answer отдельно от literal Бот 3.
- `.localparty-build/design-round3/spy/acceptance/duel-spy-ask-320.png` — Spy asker, оба CTA, private card, footer.
- `.localparty-build/design-round3/spy/tv-results-final/party-conversation-1080.png` — одинаковая высота панелей, имена и инструкция читаемы.
- `.localparty-build/design-round3/spy/results-final/max-result-bottom-320.png` — последний из16 результатов полностью доступен.
- `.localparty-build/design-round3/spy/vote-tv-final/party-vote-open-1080.png` — финальный локальный vote count.

Before `.localparty-build/design-round3/spy/before/spy-phone-answering-320.png`, `spy-phone-asking-320.png`, `spy-tv-gameplay.png` просмотрены как originals: склеенные action/name, touching CTA/cards и пустой TV timer panel видны в реальной игре.

## Границы подтверждения

Физические устройства/app bridge не проверялись; это WebKit при320×568,393×852,1280×720 и1920×1080. Correct Spy guess и настоящий восьмиминутный timeout в UI прогоне не доводились; timeout покрывает engine integration.16-player reveal снимок отсутствует, проверены16 playing/roster/vote/results. PNG `duel-guess-closing-320` снят после завершения закрытия; промежуточное движение подтверждает computed-style guard, а не этот кадр.

Общие дефекты переданы root и не маскируются local CSS: в свежем voting body при state.phase=voting верхний TV semantic header ещё показывает GAME/Find the spy; sharedTV podium использует CAPS/italic имена и иной numeric face. Подиумная геометрия в снимках помещается, но типографика не объявляется исправленной этим агентом. Root-owned shared results scrollbar/fade/font, header fade, i18n и trailing public publisher включены в соответствующие source hashes и targeted coverage.
