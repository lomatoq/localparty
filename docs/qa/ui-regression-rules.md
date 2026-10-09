# Правила против повторных дефектов UI

## Скроллбары — последнее прямое указание,2026-10-09

Видимых скроллбаров нет нигде: ни в приложении, ни на веб-пульте, ни на ТВ, ни в поп-апах и вложенных областях. Это относится и к раскрытым правилам/настройкам игры. Скроллинг и доступ ко всему содержимому должны сохраняться; нельзя заменять скрытие индикатора отключением прокрутки. Проверять Chrome/WebKit и нативные scroll indicators отдельно.

## Последнее уточнение пользователя: правила и логотипы,30сентября2026

- Стрелка Rules & Controls смотрит строго вниз/вверх даже во время раскрытия. Не вращать её через промежуточные45градусов; менять вертикальное направление без поворота.
- Нажимаемый заголовок Rules & Controls: KardiaFatRunner, жирный курсив,18px (последующее уменьшение по прямому запросу пользователя). Внутренние зелёные заголовки: тот же жирный курсив16px, по центру; основной текст сохраняет читаемый FitRunner. Между summary и содержимым правил20px верхнего внутреннего отступа. Заголовок управления крупнее внутренних заголовков. Такие же роли применять к заголовкам правил в web/native окнах.
- HD-логотипы и свежий UI проверять также на реальном TV экране ожидания каждой игры:1280×720 и1920×1080, без обрезания и пересечения с шапкой/готовностью игроков. Мобильная проверка этого не подтверждает.
- Хорошие HD-исходники логотипов не регенерировать из-за дефекта уменьшения. Проверять actual launcher загрузку renderer, его bitmap density и свежие превью3×; gallery-only проверка не подтверждает маршрут игрового сервера. Не показывать увеличенныеDPR1 screenshots как качественное превью.
- Мягкие края прокрутки принадлежат внутреннему `.waiting-rules-body`: проявляются только при содержимом за краем и исчезают у достигнутой границы. Непрокручиваемые заголовки/действия не маскировать.

Зафиксировано по прямым замечаниям пользователя 2026-09-28. Последующее явное решение пользователя имеет приоритет.

## TV: шапка и безопасная область

1. У шапки есть полоса и выступ ниже неё. Безопасную верхнюю границу карточек, текста, результатов и таблиц считать от **нижней границы выступа**, а не полосы.
2. Не компенсировать перекрытие произвольным отступом во всех играх. Игровое поле, которое намеренно продолжается под шапкой, и содержательные карточки имеют разные контейнеры. Проверять весь доступный прямоугольник и нижний край после исправления.
3. Текст внутри выступа должен учитывать его сужение: верхнее название получает больше ширины, нижнее имя/показатель — безопасную узкую область. Длинное имя можно сократить многоточием; название игры должно оставаться узнаваемым, по возможности целым.
4. Таймер и номер раунда — важные показания, а не мелкие метаданные. Не показывать фиктивное `0:00`, когда таймера нет; не выводить невозможный прогресс вроде `21/20`.
5. Проверять 1280×720 и 1920×1080, длинное имя, самое длинное название, результаты и максимум участников. Карточки не должны уходить нижним краем за экран.

## Мобильная компоновка

1. Базовая тесная проверка — 320×568; также 375 и 393 px, включая реальные safe-area и доступную высоту iframe под общей шапкой/футером.
2. Нижние Pause/Lobby сохраняют одобренные капсулы. Подложка — прозрачный градиент к фону, **не сплошная прямоугольная полоса**. Контент резервирует реальную высоту футера; кнопка выстрела/ответа/готовности не прячется под ним.
3. Никаких видимых грубых полос прокрутки и резких обрезов округлых карточек. Сохранять прокрутку жестом, клавиатурой и доступность содержимого. Мягкое затухание допустимо только на краю, за которым действительно есть продолжение; у достигнутого края оно исчезает.
4. Закрытый блок правил и основные действия полностью видны без прокрутки. Длинные раскрытые правила могут прокручиваться отдельно. Не обрезать текст ради прохождения проверки.
5. Ответы в викторине проверять **во время вопроса**, а не только на экране ожидания/раскрытия ответа. Все варианты должны быть доступны. После reload/reconnect повторять проверку геометрии, потому что состояние может измениться.

## Текст, кнопки, карточки

- Основной язык проверки — английский. Названия игр/режимов/состояний — утверждённый Anybody italic CAPS. Описания и правила — Anybody italic обычной насыщенности. Имена — Onest без принудительного CAPS; числа — Oxanium. Сохранять согласованную иерархию.
- Большая игровая кнопка: подпись 20–24 px, а не минимальные14 px. Компактный служебный контрол обычно16 px. Увеличение проверять с длинными подписями; не уменьшать всё автоматически.
- Иконка и текст — отдельные элементы с общей оптической системой: обычно20 px и10 px зазор, большие действия могут использовать30 px и12 px. Проверять центрирование и переносы.
- Эффект принадлежит **всей внешней информационной карточке**, а не вложенному блоку статистики внутри неё: единое скругление, контур и мягкая заливка; внутренние показатели разделяются без декоративных эффектов. Прямоугольный фон вокруг круглых внутренних блоков недопустим.
- Информационная карточка не должна притворяться кнопкой. Тонкий контур, мягкий перламутровый оттенок, короткие мягкие линии строго по центру сверху и снизу. Не удалять этот одобренный декор произвольно.
- Никаких мутных зелёных подложек, на которых теряются имена/очки. Цвет игрока — акцент/маркер, основной текст контрастный. В больших составах нельзя скрывать имена только ради компактности.
- Тени мягкие. Не возвращать жёсткие чёрные овалы, ступени и грубые обводки под полями. Не заменять их огромным беспричинным цветным свечением.
- Canvas-текст и круглые маркеры не должны сплющиваться при масштабировании. Оценивать размер в экранных пикселях, а не только в координатах canvas.

- Enable audio: компактная кнопка с иконкой справа в общей группе кнопок шапки. Доступное имя/подсказка и различимые состояния включения/выключения обязательны; touch target не меньше44px.

## Состояния и движение

- Выбывший игрок получает понятное сообщение, а управление показывает недоступность и сбрасывает удерживаемый ввод. Возвращение в следующий раунд снова включает его.
- Частое обновление рейтинга не запускает входную анимацию заново и не скрывает живые карточки. Проверять реальный состав16 игроков и смену порядка.
- `[hidden]` и реальные состояния имеют приоритет над декоративными `display:grid!important`. Проверять ожидание→игра→результаты, а не один изолированный экран.
- Проверять настоящие результаты матчей. Демоданные/ускоренный QA-режим явно подписывать; не выдавать визуальный стенд за завершённый матч.

## Порядок приёмки

1. Зафиксировать экран/состояние/роль/размер и конкретный дефект.
2. Найти общий источник и все экраны, которые его используют.
3. Внести ограниченное исправление без побочных изменений механики.
4. Запустить подходящие сценарии и проверки границ/кликабельности/состояний.
5. Снять свежие изображения после загрузки шрифтов, картинок и завершения входных анимаций. Проверить, что логотип и содержимое действительно нарисованы.
6. **Открыть и посмотреть каждый принимаемый снимок.** Записать отдельное наблюдение по номеру; общая фраза «всё хорошо» не является аудитом.
7. Исправить найденное, повторить затронутые состояния. Не смешивать ревизии молча: сохранить историю, время снимка и точную область повторной проверки.
8. В галерее комментарии агента держать отдельно от комментариев и одобрений пользователя. Обновлённый снимок требует нового решения.
9. Не объявлять полный успех при оставшихся дефектах, старых снимках, непройденных состояниях или непроверенных физических устройствах.

## Дополнения 2026-09-28: бренд и переключатели

- Утверждён прямоугольнее-дутый вариант логотипа `heypals-logo-rectangular-v2.png`; основной файл `heypals-logo.png` использует его. Старый сохранён отдельно.
- Логотип в шапках хоста, мобильного пульта и ТВ имеет одинаковый визуальный размер с сохранением пропорций. Загрузочный экран — отдельная композиция.
- Подпись Host’s Pick компактная, с уменьшенным межбуквенным интервалом. Не уменьшать её до нечитаемых размеров.
- Мобильные сегментированные переключатели используют курсивный шрифт заголовков; изменение шрифта не должно нарушать размеры кнопок и индикатора выбора.
- Все зелёные основные кнопки, включая вложенные игровые пульты, используют один жирный курсивный Anybody. Правило применяется к подписи, а не заменяет шрифт числового счётчика или иконки.
- Четыре кнопки TV-управления в панели хоста имеют одинаковую высоту, включая подписи в две строки. Размер не зависит от primary/quiet состояния.
- При замене растрового логотипа обновлять версию URL в веб-шапках: сервер кеширует изображения, и пульт иначе может показывать прежний логотип.
- В компьютерном/ТВ-каталоге общий блок карточек поднят на24px по запросу пользователя; обе колонки двигаются вместе, верхние края Host’s Pick и приглашения остаются выровнены. Мобильная компоновка от этого не меняется.
- Vote/Your vote в каталоге — основные кнопки, тот же жирный курсив Anybody, что зелёные действия панели хоста и пультов; проверять выбранное и невыбранное состояние.
- В узкой карточке активной игры название и зелёная точка сдвинуты вместе вправо на12px; положение кнопок сохраняется, длинное название проверяется на320px.
- Экран готовности: заголовок, цель и правила образуют центрированный вводный блок. Ready высотой56px. Декоративная картинка игры может уходить под кнопку и не занимает место в потоке; эмодзи увеличены2,5×. Раскрытые правила прокручиваются только в своей ограниченной области и не перекрывают участников, Ready или футер; их summary без отдельной тёмной прямоугольной подложки.
- Насыщенность всех основных зелёных кнопок и Vote: Anybody Black Italic900, нормальная ширина100%; вспомогательный текст и числовые показатели сохраняют свои роли.
- В компактных диалогах и парящих панелях заголовок центрирован относительно всей карточки и использует жирный курсивный шрифт заголовков. Кнопка закрытия не сдвигает центр текста: боковые резервы симметричны, длинное название переносится. Внутренние подписи и основной текст не центрировать автоматически.
- Зелёные акцентные плашки TV Host’s Pick (#playersNeeded, #votes) используют тот же Anybody Black Italic900, даже если размечены span/p, а не button. Проверять по визуальной роли, а не только тегу.
- Фоновая картинка игры в мобильном пульте размыта отдельным слоем. Блюр не применяется к родительскому контейнеру, тексту, эмодзи или кнопкам.
- Увеличенные эмодзи экрана готовности стоят над названием игры, не под Ready. Размытая картинка остаётся отдельным нижним фоном. Проверять отсутствие пересечения с шапкой и доступность правил на320px.
- При закреплении Host’s Pick, поиска и категорий вертикальный зазор между первым/вторым и вторым/третьим блоком одинаковый.
- Высота круглой кнопки звука в ТВ-шапке совпадает с высотой переключателя категорий; иконка центрирована.
- Радиальное свечение мобильного ожидания ослаблено вдвое, картинка поднята выше, блюр сохранён.
- ТВ с единственным центральным игровым полем: свободное место сверху считается от низа выступа шапки и равно нижнему отступу поля. Экраны с дополнительными панелями проверяются отдельно; не центрировать слепо все контейнеры.
- Верхняя левая метка ТВ-шапки читаемая и увеличенная; не вытесняет основное название и таймер.
- Под Pause/Lobby градиентная подложка обязательна во всех мобильных состояниях и встроенном пульте; верхняя часть прозрачна, нижняя плавно переходит в фон. Проверять видимость псевдоэлемента относительно stacking context.
- Мобильный итоговый рейтинг: более крупные строки и спокойная глубина на тёмных подложках; победитель и собственная строка отчётливо различимы. Использовать сдержанные акценты, не пёстрые заливки/множество значков. Победитель-ты сохраняет оба признака; длинные имена и16участников не ломают прокрутку и футер.
- Описания карточек игр ТВ-каталога имеют opacity0.7; не снижать яркость названий, зелёных подписей и всей карточки.

- Одно центральное игровое поле на ТВ центрируется в доступной области от нижней точки выступа шапки до низа экрана. Верхний и нижний зазоры относительно поля равны; вспомогательная подпись под полем не смещает его центр. Использовать измеренный `--party-field-inset-top`, не фиксированную высоту полосы. Сцены с собственным HUD и многоколоночные результаты проверяются отдельно.

- Настройка профиля: подпись Put a face to your name читаемая (12px), имя жирным Onest; выбор руки и его legend центрированы вместе.
- Закреплённый Host’s Pick: подложка закрывает всю высоту карточки и промежутки стека; затухание начинается только под нижним элементом. Полоса прокрутки не просвечивает сквозь подложку.
- Метаданные Waiting for screen компактны; часы отдельным декоративным элементом той же оптической высоты, центрированы относительно текста.
- В ТВ Host’s Pick расстояние от зелёной плашки до правого края равно верхнему и нижнему расстояниям, измеренным по реальной геометрии.
- Контур активной карточки хоста сохраняется в раскрытом, переходном и полностью свёрнутом состоянии.
- Информационные карточки ТВ-игр используют общий стиль с пультом: спокойная заливка, тонкий контур, скругления и центрированный декор. Эффект применяется к внешней карточке, не вложенным показателям.

## Swarm Gate и Take a Breather: обратная связь выстрела

- Начало серверного луча соответствует мировому центру турели. Угол дула и снаряда вычисляется с учётом размеров экранного прямоугольника, в том числе на диагоналях.
- ~~Платформа турели видна целиком перед стеной: пол не обрезает нижнюю часть спрайта.~~ Заменено решением пользователя 2026-10-05:
- **Последнее решение пользователя (2026-10-05):** важен порядок отрисовки. Стена, парапет и ворота рисуются ПОВЕРХ турелей по глубине: части турели, перекрывающие стену, закрыты ею, турели выглядывают из-за парапета. Ряды турелей тоже сортируются по реальной глубине: ряд ближе к стене рисуется поверх дальнего, никогда наоборот. Подписи дальнего ряда не накрывают ближний ряд. Проверять 4 и 16 игроков на 1080 (и 720); muzzleRayError 0 px.
- Скрытые стеной/воротами букашки видны спокойным полупрозрачным силуэтом только в области окклюзии; видимые враги сохраняют обычную картинку.
- Уничтоженная цель остаётся видимой до фактического прилёта снаряда. В момент попадания начинается увеличение/покраснение персонажа (утверждено пользователем), взрыв и вращающиеся облачка.
- Очки над погибшей целью совпадают с реально начисленной наградой; не угадывать значение по внешнему виду. Эффекты ограничены по времени и количеству.
- Проверять реальную стрельбу, убийство, импульс, врагов у ворот, диагональный выстрел и полную платформу на720/1080; статический кадр без этих событий недостаточен.

- Небольшие карточки ТВ-каталога: описания15px в логическом пространстве ТВ, крупная featured-карточка18px; прежняя opacity0.7 сохраняется.
- Свечение Fresh-карточек помещается в scrollport: верхний резерв44px и нижний48px, компенсированные отрицательными margin, сохраняют положение самих карточек.
- В открытом диалоге правил пульта фон не прокручивается; длинные правила прокручиваются внутри. После любого закрытия фон возвращается в ту же позицию.

### Дополнения сборки 87
- В профиле ряд кнопок фотографии отделять от портрета и подписи: вертикальный промежуток 18 px; проверять 320 и 393 px.
- Размытая иллюстрация ожидания располагается выше середины: контейнер top 10%, height 58%, центр 39%; не перекрывать доступные правила и Ready.
- У выбранной капсулы верхних переключателей крайние боковые отступы равны вертикальным (5 px с учётом контура); проверять первое, среднее и последнее положения.
- Декоративные номера карточек используют настоящий курсив заголовочного шрифта.
- В Audio дорожка 6 px, бегунок 20 px, область нажатия 44 px. Mute и чекбокс справа разделены 10 px; Connected 13 px; не возвращать пустые верхние отступы.

### Сборка 88 — новые решения пользователя
- Всё UI-семейство — Kardia; Fat Runner для основных заголовков/действий капсом с наклоном. Fit — минимальная толщина, Fit Runner — описания. Проверять файлы шрифтов и canvas-подписи, а не только каталог.
- Game Icon Pack: SVG, единые размеры и расстояния. Атлас отменён пользователем.
- Прогресс показывать светлым тоном внутри кнопки по реальным голосам/готовности/выходу, сохраняя подписи и значки.
- Mute размещать под громкостями, центрируя надпись с чекбоксом по ширине панели.

### Нативный путь ресурсов — исправление 89
- Проверка HTTP страницы хоста не подтверждает загрузку в iOS меню: оно использует `partyapp://local`, отдельный Swift MIME allowlist и CSP. OTF обязательно разрешён как font/otf в PartyBundleScheme.
- Для новой графики проверять не только файл в bundle: диагностировать фактическую загрузку KardiaFatRunner/Fit/FitRunner в WKWebView. Пассивное событие ui-assets пишет результат в lifecycle.log.
- Стрелки и значки старта в Host Pick, всех start-game и хост-панели — inline SVG из Game Icon Pack; текстовые ▶/↗/←/→ не считать заменёнными иконками. Inline paths устраняют зависимость от внешнего SVG use на custom scheme.

### Топ и прокрутка — уточнение 90
- Топ всегда открывается с scrollTop=0: фокус на заголовке preventScroll; первый ряд/вступление не должны автоматически пролистываться к первой фокусируемой карточке.
- Заголовок топа и кнопка закрытия находятся вне прокручиваемого списка. Не возвращать overflow:visible списку; проверить реальный scroll и pointerclick с16игроками на320/393.
- Первые3места различимы золотом/серебром/бронзой и числовыми badges; личная строка получает спокойный акцент You. Остальные карточки остаются читаемыми и менее яркими.
- Ограниченные вертикальные прокручиваемые области имеют мягкий fade16px сверху/24px снизу только при наличии продолжения за соответствующим краем. В начале содержимое сверху не маскируется. Заголовки и фиксированные кнопки не должны попасть под маску.
- Внутри Fresh маски нет. Бейдж Tonight's pick по высоте совпадает с бейджем жанра на карточке.
- В мобильном каталоге пульта не возвращать второй All/Arcade/Tabletop переключатель под поиском: категории управляются верхним переключателем, нижнее содержимое занимает освобождённое место.
- В native Controller tab не ждать бесконечно isLoading/didFinish/fonts.ready/2rAF. Сохранять раннее намерение открыть пульт до готовности сервера; ограничивать подготовку native deadline, раскрывать incoming view и при Reduce Motion. Проверять rapid taps и loading/error состояния.

## Brick wall mastheads — mandatory user rule, build 90
- Host, controller and TV header backings must fade downward to fully transparent over the shared wall. Never reintroduce a hard solid horizontal strip or mask behind the masthead. Controls and labels remain crisp; put the fade behind them, with no ambient green hotspots.
- Mobile readiness Rules & controls: the chevron stays at the right with a fixed inset at 320 px, independent of text width. The reading control needs an opaque enough lavender-gray backing to separate it from blurred artwork.
- Matchmaking artwork and enlarged emoji belong above the game title, nearer the header; keep Ready and roster visible and retain inner rules scrolling.

### Финальная поставка90: награды и карточки
- Новые награды использовать по смыслу: медали в рейтинге, кубки на пьедестале, тематические символы у существующих метрик. Наличие декоративной иконки не выдаёт игроку придуманное достижение.
- Растровые награды сохраняют альфу и прозрачный резерв; object-fit:contain. Не обрезать их контур масками декоративных групп.
- Start и Rules в мобильной карточке располагаются в один ряд,44pxвысотой; количество игроков отдельно. Проверять все36карточек на320/393.
- Активная игра в хост-хабе сворачивается без задержки ожидания сети, таймера или fontready. Изменения геометрии синхронизировать в кадре, сохранять место в потоке, не провоцировать ResizeObserver loop.
- Плавающие инструкции пульта не перекрывают Health/Weapon/Points или другие метрики; при совпадающей геометрии вернуть инструкции в поток с12pxотступом.

### Подложки91 — уточнение пользователя
- Под всей шапкой и верхними категориями заливка полностью непрозрачная; в прозрачность уходит только32pxза нижней границей закреплённых элементов. Нельзя начинать fade под самими кнопками.
- Тёмные поверхности хаба/панели ведущего и подложка верхнего стека имеют спокойную кирпичную текстуру около4–5%; основной фон14%. Игровые иллюстрации, фотографии и текст не текстурировать.
- Центральная иллюстрация персонажей имеет собственную непрозрачную основу; кирпич не просвечивает поверх персонажей. На мобильном иллюстрация ниже, поиск/категории отделены24pxотступом.

- Внутренние `.native-card` в Host Panel полностью непрозрачные, без кирпичной текстуры; на внешней панели текстура не более2%. Поиск имеет полностью непрозрачную читаемую заливку.
- Кирпич ослаблен минимум на20% относительно90: основной фон18%→14%, шапки7.1%→5.5%, поверхности5.9%→4.3%, внешняя Host Panel2.7%→2%.
- Start: текст и SVG центрировать одной группой, gap6px, без дополнительных боковых отступов SVG.
- Sticky на пульте: overflow-x:clip и overflow-y:visible у body каталога. overflow-x:hidden создаёт ложного предка прокрутки в WebKit; проверять видимость шапки после прокрутки500px.

### Фон92 — окончательная спецификация
Приоритет над предыдущими фоновыми правилами90/91: `background-layer-fixes-2026-09-28.md`.
- Пульт: единый градиент начинается за шапкой наtop0; заливка плотная под категориями, fade48pxниже. Не затемнять основной заголовок в начальном состоянии.
- Artworkпульта: верхнийalpha fade100px; нижний90pxcrossfadeцентрирован на ВЕРХНЕЙ границе What shall we play? Конец=title.top+45px. Пропорции сохраняетobject-fit:cover.
- Good friends. Great games. над основным заголовком на тёмном фоне. QRподсказка ниже24px, мягкое затемнение100pxвысотой/до360pxшириной/blur20px, без прямоугольных краёв. Обе подписи с лёгкой тенью текста.
- Поиск: заливка90%непрозрачности, текст/SVG100%.
- Хост-хаб: одна измеренная подложка за всеми закреплёнными строками; fade48pxниже последней. mainкаталога прозрачный. Не возвращать конкурирующие псевдослои строк.
- TV: подложка за шапкой, fade16pxниже; закончить ДОHost’s Pick. Host tab: глобальныйfade12pxниже логотипа, закончить ДОYour party. Внутренние карточкиHost Panelполностью непрозрачные.
- Tonight’s Pick: зелёнаяSVGзвезда в круглом32pxбейдже справа; жанр слева в отдельной области без пересечений. Accessible labelсохраняет смысл.
- QAс реальнымnative-tabs user-script обязательна: tabs.jsне задаёт конкурирующий фонmain/шапок. Проверять начало, момент закрепления и прокрутку320/393,TV720/1080.

### Последние уточнения93
- Текущий/общий раунд в игровых шапках: настоящий KardiaFatRunner900, существующие размеры и расположение сохраняются.
- Цветные SVG в кнопках и растровые награды внутри кнопок оптически увеличить на18%; не двигать текст и не менять высоту кнопки. Нейтральные Pause/Lobby сохраняют размер.

### Каталог94 — уточнения пользователя
- TV: малые карточки заголовок23px/описание14px; большая34px/18px. Иерархия сохраняется при прокрутке.
- Fresh: SVGстрелки18px, в nativeхабе15px; размер области нажатия сохраняется.
- Мобильные карточки: иллюстрация правее и ниже (left70%,top3%), пропорции и размеры сохраняются; проверить320/393 и Fresh.
- One screen. Everyone together. в мобильном хост-хабе центрируется по всей ширине.

### Слои95 — реальный скриншот пользователя
- Проверять хост-хаб не только с готовым сервером, но и с видимым Local server connection lost: заголовок, текст и рамка уведомления не перекрываются расширенной картинкой hero или её затемнением.
- Hero является декорацией без pointer events; сообщение комнаты — отдельный слой над ним с плотной подложкой. Stickyстек остаётся выше прокручиваемого контента.
- В браузерном воспроизведении явно учитывать нативныйtabs.js и safe area; при эмуляции59px сверху отмечать, что это fixture, а не снимок физического телефона.
- Host Panel: локальныйstickyзаголовок закрепляется ниже глобального masthead (paddingпанели=--host-head,stickytop0), общая плотная область не имеет дырки между ними; fade только ниже локального заголовка.
- Скроллбары отключены и у вложенных CSSскроллеров, и у UIScrollViewобоих WKWebView. В нативных вкладках viewportmin/max1,user-scalable=no; nativepinchвыключен при создании и после навигации. Не отключать игровые pointer-жесты.

## One-scan invitation — build 96
- Never replace the working LAN QR with an App Clip URL before a live invocation
  experience is configured and verified on a second physical phone.
- Personal Team does not support App Clip/Hotspot provisioning; an unsigned
  simulator build is not a working guest release.
- Wi-Fi approval is explicit. Check actual association before browser handoff;
  successful configuration alone is not proof the network was joined.
- No LAN requests inside the App Clip; never log Wi-Fi invitation URLs/passwords.
- Paid membership unlocks signing but does not prove App Review acceptance or
  physical Wi-Fi/browser behaviour. Report these limits separately.

## Matchmaking — explicit correction 2026-09-30
- The masthead backing ALWAYS uses a gradient. Never replace it with a solid fill to solve overlap.
- On the mobile waiting screen, fade within the masthead's own measured height; its backing must not extend down over emoji, headings or rules.
- The game illustration stays centered behind matchmaking content (latest decision supersedes top/corner proposals). Use a soft fade on the illustration itself; no straight container cutoff.
- Rules & controls label and dedicated SVG chevron align on the same optical center. Rules card fill is 70% opaque (30% transparent).
- On normal-height phones, center the getting-ready introduction. Keep bounded scrolling for long rules and preserve Ready/Pause/Lobby.
- Screenshot fixtures must never inject Russian body text into an English acceptance screenshot.
- Дополнение пользователя 2026-09-30: мелкие зелёные заголовки Controls и Win внутри прокручиваемого блока правил центрированы; строка Rules & Controls и выравнивание основного текста сохраняются.
- Controls/Win — 15px, минимум в1.5раза крупнее прежних10px; меньше Rules & Controls(16px), больше основного текста правил(14px).

## TV information hierarchy — explicit user correction 2026-10-01
- Right-side gameplay information must be compact and legible. Do not place each metric in a separate rectangle or expand small values to oversized cards.
- Several simultaneous metrics share the header gradient, with small explanatory labels above larger bold values and quiet separators. Align their baselines and maintain consistent spacing.
- A single secondary metric (for example remaining time) may use one small rounded capsule. This exception does not apply to multiple metrics.
- Preserve the measured header height and the safe boundary under its notch. A shared visual change needs new actual TV720p/1080p images; old boxed-header screenshots are superseded.

### Closing visual requests · 2026-10-01

- Right-side game readouts center within the64px side wing (latest screenshot correction supersedes the earlier full104px gamebar instruction). The central notch still determines the top safe boundary of game fields.
- The common gameplay backdrop uses our blurred brick wall with a dark overlay. A quiet game-specific glow fades from the lower edge to transparent at the middle; hues come from the current illustrated wordmark. Keep authored terrain, tracks, sky and other gameplay pictures intact.
- Quiz-style question/answer groups do not receive an extra full-height information card. Preserve answer-button surfaces and layout safe areas.
- Result/place typography is fully opaque; displayed points use opacity.84. Separate place and literal player name with a quiet internal divider and the existing award artwork.
- Current local device build99 is recorded in `.localparty-build/design-round3/build99-final-review.json`; rejected/old captures do not carry visual approval into this build.

### Последнее уточнение · телефон и ТВ · 2026-10-01
- Цветное свечение снизу до середины применяется только к ТВ. На телефоне свечение отсутствует; кирпичный фон сохраняется и на контроллерах, и на итогах, но втрое слабее за более тёмной подложкой.
- На ВСЕХ мобильных контроллерах и итогах подложки шапки и Pause/Lobby всегда градиентные, от плотного края к прозрачному. Не делать сплошную заливку ради исправления наложения. Fade шапки ограничен её высотой; место для нижних кнопок зарезервировано.
- Лого: хост Fresh×1.7, обычные×1.2; ТВ обычные×1.3, самая большая×2. Изображение сохраняет пропорции и остаётся внутри карточки, текст и кнопки не перекрываются.
- Последняя конкретная цель пользователя для круглых TV-арен: видимый круг занимает92–93% высоты между нижним краем центральной чёлки и нижним краем всего экрана. Базовая цель92.5%, небольшие равные зазоры по3.75% сверху и снизу. Это заменяет прежний неопределённый коэффициент×1.3. Проверять настоящий обод на свежем PNG, не только размеры canvas. Физика и действительное сужение Last Circle сохраняются; персонажей, ножи и подписи за пределами колеса не обрезать ради заполнения.

- Исправление по последнему скриншоту: правые TV-счётчики центрируются в боковой подложке64px, не в полном104pxконтейнере с центральной чёлкой. Значения не должны выходить за нижнюю линию боковой шапки. Это заменяет прежнее требование центрировать по полной высоте gamebar.

- Последнее увеличение самой большой TV-карточки: ещё×1.3 относительно×2, итоговый коэффициент×2.6. Обычные TV-карточки остаются×1.3.

### Универсальный мобильный chrome · исправление нативного каскада
- Шапка и фон под Pause/Lobby во ВСЕХ контроллерах и итогах всегда затухают градиентом. Никаких сплошных подложек, включая нативный пульт.
- Проверять действительный native-controller вместе с controller-bridge.js И tabs.js, а не только обычный /play. Более специфичный native #play фон не должен скрывать общий фон и превращать chrome в сплошную полосу.
- #play прозрачный в обоих пультах; кирпич принадлежит общему родительскому фону. Проверять вычисленные заливки элементов и видимые края, а не только наличие linear-gradient в CSS псевдослоя.

### Повторные дефекты · сборка102
- Для правил matchmaking проверять не только overflow:auto: браузерная обёртка details-content должна сжиматься, а высота внутреннего скроллера оставаться внутри карточки. На320/393px проверить настоящий свайп до последней строки в обычном и нативном пульте; Ready/Pause/Lobby остаются доступны. Синтетический touch event не доказывает прокрутку.
- Размер круглой TV-арены проверять после реального вылета в том же раунде, а не только на старте. Выбывшие шайбы после завершения эффекта не должны постоянно удерживать уменьшенную камеру; после восстановления цель92–93% и равные небольшие зазоры. Реальное сужение Last Circle сохраняется.
- Свежие доказательства и хеши102: `.localparty-build/design-round3/build102-root-visual-review.json`, `.localparty-build/rules-scroll/second-review.json`. Браузерная проверка не считается физическим AirPlay или касанием iPhone.

### Реальный AirPlay и все мобильные состояния ·103
- Телеметрия физического iPhone показала AirPlay viewport3840×2160, stage1280×720 со scale3 и игровой iframe1920px со scale2. Проверка только720p/1080p не покрывает этот путь. Обязательный TV-размер3840×2160 добавляется к проверкам круглых полей.
- Отступы от общей TV-шапки измеряются в координатах родителя и переводятся в локальные CSS-пиксели iframe через фактическое отношение его видимой высоты к innerHeight. Не передавать физические120px как120локальных при scale2; правильный отступ60px. Проверять одинаковые зазоры от нижнего края чёлки и низа экрана, а не только canvas.
- На телефоне пауза, итоги, пауза поверх итогов и возврат из паузы используют тот же непрерывный тёмный кирпичный фон под ОБЕИМИ градиентными подложками. Непрозрачная плоскость паузы внутри #play или скрытый лишь через opacity iframe могут создавать резкую границу. Проверять фактическую отрисовку верхнего и нижнего края.
- Наличие linear-gradient в computed style недостаточно: проверять реальные переходы состояний с обоими native user scripts и видимые слои. Не осветлять мобильный кирпич и не добавлять цветное свечение ради демонстрации градиента.

### Компактные рейтинги и короткий пульт ·104
- Стандартная строка итогов/рейтинга около56px вместо84px. Длинное имя с меткой You может увеличить строку: не обрезать имя или уменьшать очки ради фиксированной высоты. Разделитель места, награда и opacity.84 у очков сохраняются.
- Проверять правый край настоящих глифов, включая одиночный0. Авторский наклон выходит за ширину текста; резервировать2px слева и8px справа внутри собственного элемента очков, в том числе при opacity. Не заменять этот резерв уменьшением шрифта.
- На нативном320×568 карточка паузы целиком заканчивается над реальным Resume/Lobby: видны Language и нижнее скругление. Уменьшать внутренние промежутки короткого экрана, сохраняя цели нажатия≥44px. При ещё меньшей высоте содержимое доступно прокруткой; fade только к оставшемуся тексту и исчезает в конце.
- На закрытом matchmaking с6участниками Rules & Controls остаётся полностью видимой целью48px. Описание сжимается раньше переключателя; открытые правила сохраняют ограниченную внутреннюю прокрутку без сдвига Ready/Pause/Lobby.
- Финальные снимки104 проверяются по собственным хешам; прежние54снимка103 не подтверждают исправление обрезанной карточки паузы.

## Rooms and modal background stability — local build 106

- Rooms action buttons reset inherited primary margins and centre their 48px target in the whole room row. Reserve a separate action column; long room names wrap without crossing it.
- Room rows use a 10px gap. Players/Rankings are a separate utility group with a 24px gap above it. On short screens only the room list scrolls; Close and utilities remain visible. The final room must remain reachable.
- Opening a top-layer sheet preserves the underlying catalogue scroll and expanded active-game panel. Neither modal controls nor outside-pointer handling may collapse that panel while a modal is open.
- A player profile opens at the start of its own reading region, including after another long profile. Do not rely on resetting the outer dialog when the inner body scrolls.
- Preserve the existing HeyPals font/radius/icon system for lobby standings and Last match; verify the English label and zero scores.
- Browser captures and native discovery fixtures are labelled separately from physical USB screenshots and from a real two-phone App Clip/Wi-Fi test.

## Compact state presentation and ranking cards — build111 / 2026-10-02

- User rule: cards, popups and game HUDs use existing illustrated icons, meaningful numbers and short labels for states. Avoid redundant explanations and long visible lists of names. Waiting/ready summaries stay compact; full names remain available in the roster and accessible labels.
- Long names must not turn a state card into a tall paragraph beside a large action button. Check 320/402px, zero/partial/all ready, and two long names. Keep action targets, localization and existing native navigation intact.
- Inspect expanded, collapsed and intermediate animation frames, including direction reversal. A new counter's display rule must never override the compact card's hidden status.
- Separate ranking cards have consistent full rounding, an opaque dark base and visible gaps; do not accidentally join them. The approved unified controller ranking board retains its intentional joined rows.
- Names and surnames form a tight group; their line spacing is smaller than the gap to wins/games or another kind of metadata. Vertically center identity against the avatar, and the actual ink of a place against the whole row, including rows with a You label.
- Avatar clipping belongs to the photo itself; the initial badge stays above the photo/placeholder and outside its mask. Scores reserve room for italic ink, including zero and seven digits.
- Podium places are bright shaded primary numbers with a contrasting contour against each plinth. Cups form one nearby centered group with the place. Points use a distinct secondary type role, in the darker tone of their own plinth; verify the computed font after the complete CSS cascade.
- Check short fourth/lower podiums and two-digit places, not only the tall first three. All place/score/label groups must fit without floating against an edge.
- Preserve Claude game lanes and HeyPals/Flourishes blocks. Extend the separate rankings adapters instead of replacing gameplay files. Further broad popup/game state-copy audit continues next pass; do not claim it completed from a single card.

### Final review corrections — 2026-10-02

- Result rows retain one consistent place / identity / right-aligned score layout at every supported phone width. Long numeric values adapt their font size and reserved width; do not move only some scores below the name. Keep complete identity in accessible text when visible names must be bounded.
- Catalogue category tabs belong to the lobby only. Hide them explicitly during gameplay, pause and results, regardless of catalogue display rules or the HTML hidden attribute. Validate through the real state route and native controller bridge plus persistent tabs; a fixture that bypasses app state is insufficient.
- Test result-list scroll limits and header clearance on the actual controller route. Deliberately scrolled partial rows must not be presented as an overlap-free initial screen.

## Profile, results and returning-player help — 2026-10-06

- Player result screens retain one continuous viewport background, including safe areas. Never accept black rectangular header/footer bands; inspect entrance frames as well as settled screenshots through the native controller bridge.
- Place numbers remain upright and vertically centred throughout the reveal. Animate the award, not the number separately from its row.
- Profile editor must clear the top safe area. Its lower background extends behind native bottom tabs; keep Save Profile above the tabs using inner padding, with a 14px lift requested after physical iPhone review so the dock shadow clears Save Profile and Back. Prefer content height over a tall empty card. Only form fields scroll; dismissal must fade the blur and shade together with the sheet. Never add a second blur to the underlying page that disappears only after dismissal.
- Returning-player QR help keeps its soft dark backing during opening, closing and rapid reversal; test intermediate frames in WebKit, not just computed gradient strings.

### Popup motion acceptance — 2026-10-06

- Static settled captures do not approve transitions. Record real-time opening, dismissal at 65ms, reopen during dismissal, and final cleanup in Chrome and WebKit, including the native controller scripts.
- Sample panel and backdrop every animation frame. Neither may restart from opacity zero/one when reversing. Inspect the video as well as numerical samples; do not infer physical iPhone or AirPlay performance from desktop WebKit.
- Keep the before/after video and the list of tested popup IDs. Native host windows must also be opened through their real buttons, including the first-paint preparation path.

### Short-label casing (2026-10-06)
Prefer uppercase for short UI captions, including PLAYERS in Host Pick and counter labels. Preserve player names and descriptive prose/card descriptions in their authored casing. Browser-controller game count is plain text; native mobile menus retain the subtle violet capsule.

### Popup controls and sheets — 2026-10-06 follow-up
- Navigation popups use a circular 48px back action in the bottom action row, with the existing filled arrow. Retain accessible names; do not collapse destructive confirmation labels into ambiguous icons.
- Buttons sharing a row have equal 48px height and the same action font. Two-line labels use compact line-height and balanced padding, not a taller button. Center text and icon together.
- Mobile navigation sheets, including empty Party Rankings, continue below the viewport/under native tabs. Keep the action row above the dock via inner padding; small confirmation alerts stay centred.
- Empty Rankings uses intrinsic content height; never stretch its empty body to the viewport. Center headings and use a subtle fading header shade.
- Profile name input is capsule-shaped; selected language text is centred. Preserve Save Profile/Back clearance.
- Audit English/Russian, 320/393px, populated/empty, open/close/reversal, and actual native dock layering separately from browser fixtures.

### 2026-10-06 — Header lockups and material light
- Popup titles must be optically centered as one group with their illustration. Do not left-align Ready to Play or center the text while leaving the illustration outside its group.
- Short entered names use a brighter lavender left edge and a darker violet right edge. Native focused input text stays readable.
- CTA edge energy and its halo must not be cut off by form containers. Keep scroll clipping on the scrollable body, not the fixed action row.
- Grouped popup tasks share a soft nonlinear violet reflection. Do not put a nested surface around every individual label.

### 2026-10-06 — Section surfaces and fieldset regressions
- Section colour belongs in small diagonal corner reflections (top-left / bottom-right), with a transparent centre; do not place the lower reflection at mid-height. Keep the hue pink-violet, not grey.
- Do not paint a shared gradient directly on fieldset: legend can cut the surface into a hard horizontal edge. Use a separate rounded surface wrapper and leave fieldset transparent.
- When using transparent text fill, ensure the text-clipped background wins the cascade; verify actual rendered titles, not just their DOM existence.

### CTA hierarchy refinement
- Moving edge + bloom is reserved for priority actions (save/start/play and selected controller/photo actions). Do not animate genre filters, directional pads, mute/settings toggles or every quiet button.
- Ordinary controls use a subtle static violet surface/outline. Selected TV genre is lime, not pink/violet.
- Leave vertical paint room around horizontally scrolling genre controls so their soft edge is not sliced off.
