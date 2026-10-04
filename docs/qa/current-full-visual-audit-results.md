# Current result-screen visual audit

Only newly captured real finals are recorded as reviewed here. The numbered IDs match the screen-review manifest. Captures use real server outcomes and either TEST_FAST durations or the existing supported-host-action helpers with their recorded QA clock. They verify presentation, not real-time physics. No scores or result states were injected. Old frames are archived before replacement.

The first refresh uncovered and fixed two presentation defects: a waiting panel remained visible above phone results because its grid declaration overrode `[hidden]`; and the game caption bypassed translation. The caption now translates while retaining an explicit heading role, so generic paragraph styling cannot remove its CAPS/italic hierarchy. Final captures wait for the podium entrance to finish.

## Individually reviewed current frames

| ID | Game / surface | Visual observation and disposition |
| --- | --- | --- |
|106|Push Pit · phone|Translated italic game caption sits above the larger MATCH OVER title; winner and self marker align with four complete score rows. Footer is clear. Current capture accepted.|
|107|Push Pit · TV|Winner crown and gold pedestal have visible separation; tied second-place silver pedestals retain equal height. Names remain upright and all four portraits/names fit. Current capture accepted.|
|116|Last Circle · phone|Previous waiting overlay and untranslated game caption are fixed. Four rows, tied second places and the self marker fit without collisions. Current capture accepted.|
|117|Last Circle · TV|Stale typography frame replaced with current real final. Anybody italic title, upright names and numeric scores are visible after entrance animation; no clipped crown or footer caption. Current capture accepted.|
|126|Color Knives · phone|Negative score −1 remains legible and aligned in the numeric column. The highlighted self row does not obscure adjacent names or rank labels. Current capture accepted.|
|127|Color Knives · TV|Fourth-place negative score fits inside its smaller purple pedestal; rank, score and units remain separate. Title and four podium positions fit. Current capture accepted.|
|136|Bomb Tag · phone|Tied second-place rows retain separate identities and equal ranks. Self marker sits beneath the winner name without touching the row divider. Footer remains fully visible. Current capture accepted.|
|137|Bomb Tag · TV|Winner, two tied runners-up and fourth place are visually distinct; firework effects do not obscure the result text in this frame. Current capture accepted.|

Evidence for these first eight frames: `.localparty-build/results-current-20260928/fast-final/`; contact sheets `visual-audit/batch-1-phone.png` and `batch-1-tv.png`. Current phone metrics: main title25.94px, game caption14px, names16px, values27px; font faces report loaded. All 70 final frames are individually listed in this document; missing Chaos finals remain unreviewed.

| ID | Game / surface | Visual observation and disposition |
| --- | --- | --- |
|146|One Shot Western · phone|Longer game caption fits one line, remains subordinate to MATCH OVER, and all four ranks/scores line up. Self marker in the last row is clear. Accepted.|
|147|One Shot Western · TV|Long title fits without crowding the celebration caption; tied second-place pedestals keep equal height and clear names. Accepted.|
|166|Tank Arsenal · phone|A real four-way zero-score tie renders four first-place rows; repeated winner emphasis does not overlap names or values. Accepted for this tied outcome.|
|167|Tank Arsenal · TV|Four equal gold podiums/crowns fit across the stage with consistent spacing. No false unique winner is introduced. Accepted.|
|306|Tap Race · phone|Three-digit scores242/241 fit the right column; the last self row and its zero score remain distinct. Accepted.|
|307|Tap Race · TV|Three-digit podium scores fit beneath rank numbers with visible separation; tied second-place participants remain separate. Accepted.|
|316|Punch Meter · phone|Four-way zero-score tie fits without clipped rows. The game caption and match heading have distinct sizes. Accepted for this outcome.|
|317|Punch Meter · TV|Four equal gold podiums retain readable names and score units; crowns clear the title area. Accepted.|
|326|Multiplayer Flappy · phone|Long game caption fits; three equal20-point leaders and a fourth-place self row remain readable. Accepted.|
|327|Multiplayer Flappy · TV|Long title stays inside the stage; three tied leaders receive equal crowns/podium height while fourth place remains lower. Accepted.|
|336|Hungry Arena · phone|Descending32/29/26/20 scores align with four readable names; the self marker adds a second line without touching the divider. Accepted.|
|337|Hungry Arena · TV|All four distinct ranks have appropriate pedestal heights, with readable two-digit scores and separated names. Accepted.|
|346|Snake Lines · phone|Four equal first-place zero scores are not misrepresented as distinct ranks. Result heading and round progress fit the header. Accepted.|
|347|Snake Lines · TV|Four equal podiums and crown silhouettes fit without touching title or bottom caption. Accepted.|
|356|Carry Ball · phone|Four tied rows fit, with self marker and footer fully visible. No gameplay controls remain over the results. Accepted.|
|357|Carry Ball · TV|Equal gold podium treatment accurately reflects this tied outcome. All four names, scores and units remain inside their regions. Accepted.|

Evidence for IDs146–357 above: final current TEST_FAST outcomes in `fast-final`; contact sheets `batch-2-*` and `batch-3-*`. Zero-score ties are actual recorded outcomes, not fabricated visual fixtures.

## Remaining fresh finals

Each row below is an independently viewed current screenshot. The notes retain visible limitations rather than treating a successful capture as a clean visual review.

| ID | Game / surface | Observation |
| --- | --- | --- |
|156|tanks · phone|Четыре реальных нулевых результата показаны равными первыми местами; длинное имя и метка You помещаются.|
|157|tanks · TV|Четыре одинаковых золотых пьедестала отражают ничью; прямые имена и значения не пересекаются.|
|186|kart · phone|Очки 400/300/200/100 выровнены справа; длинное имя четвёртого игрока не заходит в числовой столбец.|
|187|kart · TV|Четыре разных места и трёхзначные очки читаются раздельно; крупное курсивное название помещается.|
|196|monster · phone|Два равных результата 100 отображаются без наложений; длинное название игры и имя помещаются.|
|197|monster · TV|Два равных золотых пьедестала не создают ложного единственного победителя; короны отделены от заголовка.|
|206|spy · phone|Первое место с 1 очком отделено от трёх равных вторых с 0; подписи и нижние кнопки целиком.|
|207|spy · TV|Победитель и три равных вторых места различимы; четыре имени помещаются под портретами.|
|216|millionaire · phone|Длинное название игры помещается над MATCH OVER; 100 очков победителя не сближаются с именем.|
|217|millionaire · TV|Длинный курсивный заголовок не касается корон; 100 и три нулевых результата читаются внутри пьедесталов.|
|226|sinyakquiz · phone|Исправлены прописные курсивные имена: теперь Onest 16 px, прямое начертание. Место вынесено отдельной строкой над именем, счёт справа; проверено также 320 px.|
|227|sinyakquiz · TV|Убрана пустая панель Gathering teams. Имена на пьедесталах прямые Onest 18 px; длинное переносится. После расширения выемки название SINYAK: PARTY QUIZ читается целиком.|
|236|warsaw · phone|Исправлены роль имени и тесная строка места: подпись места над именем, счёт справа. Длинное имя проверено на 320 и 393 px; нижние кнопки целиком.|
|237|warsaw · TV|Пустая панель настройки убрана, имена прямые и переносимые; результаты не пересекаются с боковым списком. Название WARSAW DISCOVERIES в обновлённой выемке читается целиком.|
|246|crocodile · phone|100 очков лидера и три нулевых результата стоят отдельным столбцом; длинное имя и метка You помещаются.|
|247|crocodile · TV|Золотой лидер и три равных вторых места сохраняют читаемые имена; подпись под пьедесталами не обрезана.|
|256|jenga · phone|Четыре равных результата по 2 очка показаны одинаковыми местами; игровой джойстик не остаётся поверх финала.|
|257|jenga · TV|Четыре равных золотых пьедестала и имена полностью помещаются; курсивный заголовок отделён от корон.|
|266|crane · phone|Два нулевых результата и длинное имя помещаются; строки финала и нижние кнопки разнесены. Краткая служебная строка в правом верхнем углу намеренная; полный прогресс доступен в title.|
|267|crane · TV|Ничья двух участников показана двумя одинаковыми пьедесталами; имя и очки не пересекаются.|
|276|naval · phone|Название QUICK BATTLESHIPS помещается в строку; четыре нулевых результата и метка игрока читаются.|
|277|naval · TV|Четыре равных пьедестала помещаются в ширину TV; у длинного имени достаточно места.|
|286|drawguess · phone|Четыре нулевых результата и длинное имя помещаются; поле ввода ответа не перекрывает итог.|
|287|drawguess · TV|Название DRAW & GUESS читается целиком; четыре равных результата не выглядят как разные места.|
|296|western_duel · phone|Реальный счёт 2:0 читается в двух строках; длинное имя не касается чисел, нижние кнопки целиком.|
|297|western_duel · TV|Первое и второе места разделены высотой и цветом; длинное имя и заголовок помещаются.|
|366|marble_bloom · phone|Четырёхзначные 2900/1200 и нулевой результат помещаются в правый столбец; длинное имя не обрезано.|
|367|marble_bloom · TV|Значения 2,900 и 1,200 помещаются в пьедесталах отдельно от ранга; три участника хорошо разделены.|
|376|pocket_siege · phone|Исправлен серверный финальный счётчик: TURN 20/20 вместо21/20. Реальный итог70/68/27/18, длинное имя и нижние кнопки помещаются.|
|377|pocket_siege · TV|Новый реальный итог70/68/27/18: разные места, прямые имена и двухзначные очки разнесены; длинное имя второго игрока помещается под портретом.|
|386|bow_club · phone|Четыре равных нулевых результата отображаются полностью; название и MATCH OVER имеют разный размер.|
|387|bow_club · TV|Четыре золотых пьедестала отражают ничью, а не уникального победителя; имена и нижняя подпись помещаются.|
|396|poker · phone|Четырёхзначные 1110/970/960/960 не задевают имена; две одинаковые бронзовые позиции читаются отдельно.|
|397|poker · TV|1,110/970/960/960 помещаются в пьедесталах; два равных третьих места имеют одинаковую высоту.|
|406|airhockey · phone|Два первых места по 200 и два третьих по 100 отображаются без ложного единственного победителя.|
|407|airhockey · TV|Два золотых и два бронзовых пьедестала сохраняют командную ничью; четыре имени читаются.|
|416|mines · phone|Очки 30/10/1/0 и четыре имени выровнены; кнопка открытия клетки не остаётся поверх финала.|
|417|mines · TV|Четыре различных места читаются по высоте и подписи; игровые инструкции не перекрывают пьедесталы.|
|426|curling · phone|Два первых места по 1 и два третьих по 0 читаются отдельно; длинное имя победителя помещается.|
|427|curling · TV|Два равных лидера выделены одинаково; длинное имя под золотым портретом не пересекается с соседним.|
|436|bowling · phone|Два первых места по 24 и третье с 22 показаны корректно; длинное имя четвёртого игрока не касается нулевого счёта.|
|437|bowling · TV|Два одинаковых золотых пьедестала отражают ничью 24:24; бронзовые 22 и четвёртое место отделены.|
|446|swarm_gate · phone|Командное первое место сохранено у всех четырёх; индивидуальные 0/1245/1330/825 помещаются без наложений.|
|447|swarm_gate · TV|Четыре равных золотых места сочетаются с разными личными очками; значения 1,245 и 1,330 помещаются.|
|456|peek_shoot · phone|350/100/40/0 выровнены справа; длинное имя последнего игрока и метка You помещаются над нижними кнопками.|
|457|peek_shoot · TV|Четыре различных места и трёхзначные очки читаются; крупный заголовок WHO’S POPPING UP? помещается.|

70 current result frames from 35 real completed games were individually viewed. Chaos has no captured real completion and its two missing result slots are not marked reviewed. Shared result frames use 393×852 phone / 1280×720 TV; the two native Quiz finals additionally received a 320×568 recheck. TEST_FAST and QA-clock captures verify presentation only, not normal-speed physics. Methods and revisions are preserved in `result-refresh-report.json`.

The native Quiz fix is finished-state-only: names use upright Onest, phone rank captions sit above names, and the empty display-only TV setup panel is hidden. The two Quiz TV notch titles fit after the shell update. Crane’s compact header caption is intentional; its full progress remains available in title. Pocket’s terminal counter received a separate real-result recheck. No result outcomes were fabricated.

Final safe-area reconciliation: result IDs226/227/236/237/286/287 were recaptured from real finished rounds after the Quiz/DrawGuess TV inset fix. Each of these six new frames was viewed; native Quiz result panels now sit below the notch, and DrawGuess shared podium remains complete. Revisions in the JSON refer to these latest frames.

Latest requested corrections: native Quiz podium transform−8px removed; final720p Sinyak/Warsaw cards now share top and bottom edges. Common phone result rows use8px gaps and18px radius on all four corners with clipped backgrounds. Actual320px Knives result0/−1/−4/−6 fits completely above the footer. Only these requested affected examples were recaptured; other previously reviewed common-result images predate this last row-spacing revision and must not be represented as fresh proof of the new radius/gap.
