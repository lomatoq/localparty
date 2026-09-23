(function(root){
 'use strict';
 const dictionary=root.PARTY_TRANSLATIONS||(root.PARTY_TRANSLATIONS=Object.create(null));
const pairs=`
HeyPals · сервер|HeyPals · server
HeyPals — вечер начинается|HeyPals — your night starts here
Ждём первых миллионеров…|Waiting for the first millionaires…
Угадал!|Correct!
Войдите через главное лобби|Join through the main lobby
Все 16 мест заняты|All 16 places are taken
Гулец|Player
Серпантин|Serpentine
Лунная петля|Moon Loop
Янтарный путь|Amber Trail
Двойной изгиб|Double Bend
Последняя орбита|Final Orbit
Пять вертикальных подскоков; взрыв при каждом ударе, без бокового отскока.|Five vertical bounces, each causing an explosion, with no sideways bounce.
Пять пробных траекторий без урона и кратеров. Метки показывают угол и расстояние до цели.|Five harmless trial trajectories. Markers show the angle and distance to the target.
Десять пробных траекторий: угол и расстояние до ближайшего танка, без урона.|Ten harmless trial trajectories showing angle and distance to the nearest tank.
Быстрый прямой снаряд: прямое попадание даёт очки и толчок. Грунт останавливает пулю.|A fast, straight projectile. Direct hits score and push tanks; terrain stops the bullet.
Очередь из восьми пуль с интервалом 80 мс, а не одновременный веер.|Eight bullets fired 80ms apart.
Двенадцать последовательных пуль с небольшими взрывами.|Twelve consecutive bullets with small explosions.
Шесть последовательно выпущенных светящихся зарядов.|Six glowing charges fired in sequence.
Начинает наведение только вблизи танка; вдали летит по обычной дуге.|Homes in only near a tank; otherwise follows a ballistic arc.
При пролёте над противником гасит горизонтальную скорость и падает вертикально.|Stops moving horizontally above an enemy and drops straight down.
Четыре одновременно выпущенных самонаводящихся снаряда.|Four homing projectiles fired together.
Шесть малых самонаводящихся снарядов; это адаптация, не оригинальный рой.|Six small homing projectiles; an adaptation of the original swarm.
Прокладывает неглубокий подземный ход по направлению выстрела и выходит на поверхность.|Digs a shallow tunnel in the firing direction, then resurfaces.
После входа в землю изгибает подземную траекторию вверх, оставляя тоннель.|Curves upward underground, leaving a tunnel.
Идёт под землёй к танку, затем поднимается вертикально.|Travels underground toward a tank, then rises vertically.
Идёт под землёй; при выходе выбрасывает пять снарядов.|Travels underground and releases five projectiles on surfacing.
Вырезает направленный тоннель по вектору полёта. Не начисляет очки.|Cuts a tunnel along its flight direction. Awards no points.
Вырезает узкий направленный тоннель от точки попадания.|Cuts a narrow tunnel from the impact point.
Вырезает направленный тоннель после приземления.|Cuts a directional tunnel after landing.
Перед выстрелом очищает вертикальный канал над своим танком.|Clears a vertical passage above your tank before firing.
Строит узкую вертикальную стену высотой 130 единиц.|Builds a narrow wall 130 units high.
Строит узкую прямоугольную стену высотой 120 единиц.|Builds a narrow rectangular wall 120 units high.
Поднимает собственный танк на столб грунта.|Raises your tank on a pillar of terrain.
Создаёт два наклонных плеча грунта в форме V.|Creates two sloping banks in a V shape.
Формирует земляной купол вокруг своего танка, с пустым пространством внутри.|Builds a hollow earth dome around your tank.
Покрывает поверхность упругим слоем. Следующий обычный снаряд отскакивает.|Coats the surface with rubber. The next standard projectile bounces.
Строит стену и покрывает её упругим слоем.|Builds a wall and coats it with rubber.
Снимает упругий слой и останавливает катящиеся снаряды на покрытом участке.|Removes rubber and stops rolling projectiles on the coated area.
Тяжёлый шар катится по уклону и даёт очки за контакт, без взрывного кратера.|A heavy ball rolls downhill and scores on contact without making a crater.
Катится под действием уклона; взрывается при контакте с танком или после остановки.|Rolls downhill; explodes when it hits a tank or stops.
Катится по поверхности, затем создаёт земляной шар вместо взрыва.|Rolls along the surface, then creates an earth ball.
После попадания изменяет угол и силу ближайших танков.|Changes nearby tanks' angle and power on impact.
48 мелких ледяных частиц с отскоками от уклона. Прямые контакты дают очки.|48 small ice particles bounce off slopes. Direct contacts score.
80 отскакивающих частиц с ограниченным временем жизни.|80 bouncing particles with a limited lifetime.
Разбрасывает 14 горящих капель; они оседают на земле и наносят периодический урон.|Scatters 14 burning drops that settle on the ground and deal periodic damage.
18 горящих капель образуют широкий участок огня.|18 burning drops create a wide fire zone.
Из точки попадания испускает 12 радиальных лучей.|Emits 12 radial beams from the impact point.
Летящий заряд выпускает короткий луч при приближении к танку.|Fires a short beam while passing close to a tank.
Летящий заряд выпускает луч с увеличенной дистанции.|Fires a beam from a greater distance.
Взрыв начисляет очки и отбрасывает танки, но не вырезает грунт.|Scores points and pushes tanks without removing terrain.
Обычный баллистический взрыв.|A standard ballistic explosion.
Одновременный веер снарядов.|A simultaneous fan of projectiles.
Разделение на фрагменты в вершине траектории.|Splits into fragments at the top of its arc.
Отложенные падающие заряды над точкой попадания.|Delayed charges fall above the impact point.
Отскоки по нормали поверхности, затем взрыв.|Bounces off the surface, then explodes.
Движение по поверхности к ближайшей цели.|Travels along the surface toward the nearest target.
Движение по поверхности с малыми взрывами.|Travels along the surface with small explosions.
Заглубление снаряда и подземный взрыв.|Burrows into the ground and explodes underground.
Последовательные взрывы вниз.|A sequence of downward explosions.
Горящая зона с периодическими попаданиями.|A fire zone that deals periodic hits.
Зона с периодическим разрушением земли.|A zone that gradually destroys terrain.
Мгновенный пробивающий луч.|An instant piercing beam.
Вертикальная молния в точке удара.|Vertical lightning at the impact point.
Вертикальный луч и узкая шахта.|A vertical beam cuts a narrow shaft.
Цепочка ударов по поверхности.|A chain of impacts along the surface.
Создание земляного шара.|Creates an earth ball.
Перенос танка в точку приземления.|Teleports your tank to the landing point.
Баллистический прыжок собственного танка.|Launches your tank in a ballistic jump.
Притягивание ближайших танков.|Pulls nearby tanks inward.
Отбрасывание ближайших танков.|Pushes nearby tanks away.
Периодическое притяжение и финальный взрыв.|Repeated attraction pulses followed by an explosion.
Смена горизонтального направления в полёте.|Reverses horizontal direction in flight.
Взрыв с дополнительными ударами по бокам.|An explosion with extra strikes on either side.
Наведение на ближайший вражеский танк.|Homes in on the nearest enemy tank.
Разделение на фрагменты по таймеру.|Splits into fragments after a delay.
Последовательные взрывы в направлении цели.|A sequence of explosions toward the target.
Несколько взрывных импульсов.|Several explosive pulses.
Веер новых снарядов из точки удара.|A fan of new projectiles from the impact point.
Взрыв блокирует движение на один ход.|An explosion that blocks movement for one turn.
Отложенный повторный взрыв.|A delayed second explosion.
Упрощённая адаптация; оригинальное поведение не воспроизведено полностью.|Simplified adaptation; original behavior is not fully reproduced.
Гром|Thunder
Крупный кратер и более широкая зона поражения.|A large crater and a wider blast area.
Мини-луна|Mini Moon
Тяжёлый медленный снаряд с большим взрывом.|A heavy, slow projectile with a large explosion.
Искра|Spark
Быстрый точный снаряд.|A fast, precise projectile.
Трио|Trio
Три снаряда веером.|Three projectiles in a fan.
Веер|Fan
Пять снарядов веером.|Five projectiles in a fan.
Конфетти|Confetti
Семь маленьких снарядов.|Seven small projectiles.
Близнецы|Twins
Два тяжёлых снаряда.|Two heavy projectiles.
Стручок|Seedpod
Разделяется на шесть частей в верхней точке.|Splits into six pieces at the top of its arc.
Пиньята|Piñata
Двенадцать маленьких подарков.|Twelve tiny surprises.
Звёздный дождь|Star Rain
Пять ударов сверху возле точки попадания.|Five strikes from above near the impact point.
Метеорный рой|Meteor Swarm
Восемь метеоров на большой площади.|Eight meteors across a large area.
Один рикошет от земли.|Bounces off the ground once.
Супермяч|Superball
Три рикошета перед взрывом.|Three bounces before exploding.
Резина|Rubber
Пять небольших прыжков.|Five small bounces.
Колобок|Roller
После посадки катится к ближайшему танку.|Rolls toward the nearest tank after landing.
Пила|Saw
Едет по земле и оставляет цепочку взрывов.|Travels along the ground, leaving a chain of explosions.
Крот|Mole
Проходит под поверхностью и взрывается глубже.|Travels below the surface and explodes deeper underground.
Глубина|Depth
Глубокий взрыв под танком.|A deep explosion below a tank.
Бур|Drill
Четыре взрыва один под другим.|Four explosions, one below another.
Уголёк|Ember
Оставляет горящую зону на три секунды.|Leaves a fire zone for three seconds.
Огненный сад|Fire Garden
Широкая горящая зона.|A wide fire zone.
Кислотная капля|Acid Drop
Постепенно разъедает землю.|Gradually eats through terrain.
Слизь|Slime
Широкая медленная кислотная лужа.|A wide, slow acid pool.
Игла|Needle
Мгновенный узкий луч через рельеф.|An instant narrow beam through terrain.
Призма|Prism
Широкий луч, проходящий через несколько танков.|A wide beam that passes through multiple tanks.
Молния|Lightning
Вертикальный удар в точку приземления.|A vertical strike at the landing point.
Орбитальный разрез|Orbital Cut
Вертикальный луч вырезает узкую шахту.|A vertical beam cuts a narrow shaft.
Семь взрывов расходятся вдоль земли.|Seven explosions spread along the ground.
Разлом|Rift
Одиннадцать ударов вдоль поверхности.|Eleven strikes along the surface.
Насыпает холм. Само создание грунта не даёт очков.|Builds a hill. Creating terrain awards no points.
Бастион|Bastion
Строит высокую узкую преграду.|Builds a tall, narrow barrier.
Блинк|Blink
Переносит твой танк в точку попадания.|Teleports your tank to the impact point.
Прыжок|Jump
Перемещает танк на 140 единиц по направлению ствола.|Moves your tank 140 units in the barrel's direction.
Магнит|Magnet
Стягивает ближайшие танки к центру.|Pulls nearby tanks toward the center.
Толчок|Push
Отбрасывает танки от взрыва.|Pushes tanks away from the explosion.
Пустота|Void
Несколько импульсов притяжения, затем взрыв.|Several attraction pulses followed by an explosion.
Бумеранг|Boomerang
В полёте меняет горизонтальное направление.|Reverses horizontal direction in flight.
Комета|Comet
Быстрый снаряд с дополнительными взрывами по бокам.|A fast projectile with extra explosions on either side.
Искатель|Seeker
Плавно поворачивает к ближайшему противнику.|Gradually turns toward the nearest enemy.
Пчёлы|Bees
Три маленьких самонаводящихся снаряда.|Three small homing projectiles.
Вилка|Fork
Разделяется в полёте на пять частей.|Splits into five pieces in flight.
Ковёр|Carpet
Десять ударов вдоль широкой полосы.|Ten strikes across a wide strip.
Цепь|Chain
Последовательные взрывы к ближайшему танку.|A sequence of explosions toward the nearest tank.
Пульс|Pulse
Три расширяющихся взрыва.|Three expanding explosions.
Ромашка|Daisy
Из места удара вылетают восемь снарядов.|Eight projectiles launch from the impact point.
Иней|Frost
Взрыв и блокировка движения на один ход танка.|Explodes and blocks a tank's movement for one turn.
Эхо|Echo
Повторяет взрыв в той же точке через полсекунды.|Repeats the explosion at the same point half a second later.
ДРОН ИСПОЛЬЗОВАН|DRONE USED
УПРАВЛЯЙ ДРОНОМ|PILOT THE DRONE
с|s
ВРАЖЕСКИЙ СНАРЯД В ЗОНЕ|ENEMY PROJECTILE IN RANGE
ПВО ДОСТУПНО НА ХОДУ ПРОТИВНИКА|AA IS AVAILABLE ON AN OPPONENT'S TURN
ОЖИДАЕМ ВРАЖЕСКИЙ ВЫСТРЕЛ|WAITING FOR AN ENEMY SHOT
МАТЧ НА ПАУЗЕ|MATCH PAUSED
ВСЕ ПЕРЕХВАТЧИКИ ИСПОЛЬЗОВАНЫ|ALL INTERCEPTORS USED
В ЗОНЕ НЕТ ВРАЖЕСКИХ СНАРЯДОВ|NO ENEMY PROJECTILES IN RANGE
ОЖИДАЕМ НАЧАЛО МАТЧА|WAITING FOR THE MATCH
РЕЖИМ НАБЛЮДАТЕЛЯ|SPECTATOR MODE
НАПРАВЛЕНИЕ|DIRECTION
ЗАПУСТИТЬ ДРОН|LAUNCH DRONE
10 ПЕРЕХВАТЧИКОВ ЗА МАТЧ · АВТОВЫБОР ЦЕЛИ|10 INTERCEPTORS PER MATCH · AUTOMATIC TARGETING
Далучыся праз галоўны хаб Local Party.|Join through the main HeyPals hub.
Ліміт сесій. Перазапусці дэма-сервер.|Session limit reached. Restart the demo server.
Гэты пульт ужо далучаны.|This controller is already connected.
Максимум 6 игроков.|Maximum 6 players.
Максимум 3 игрока.|Maximum 3 players.
Патрэбныя гульцы: далучы тэлефоны або націсні «Паспрабаваць».|Connect phones or select Try it to add players.
Бот|Bot
. Прицел и стрельба останутся рабочими.|. Aiming and shooting will still work.
Базовый трекинг. Перезапусти камеру для повторной загрузки.|Basic tracking. Restart the camera to load tracking again.
Нет графического контекста|Graphics context unavailable
Подключитесь через общий хаб.|Join through the shared hub.
Лимит сессий.|Session limit reached.
Матч уже идёт или подключено 6 игроков. Подождите следующего.|A match is underway or all six places are taken. Please wait for the next match.
Сначала подключите телефоны.|Connect phones first.
Вернитесь в общее лобби для подключения|Return to the shared lobby to join
Неверный ключ игрока|Invalid player key
Максимум 16 игроков|Maximum 16 players
Экран игры ещё подключается. Повторите запуск на iPhone.|The game screen is still connecting. Try starting again on your iPhone.
Телевизор не подтвердил запуск|The TV did not confirm startup
Веди по светящейся линии|Follow the glowing line
СОШЛИ С ЛИНИИ|OFF THE LINE
Возьми батарею: удерживай GRAB|Hold GRAB to pick up the battery
НЕСЁМ: НЕТ|CARRYING: NOTHING
БАТАРЕЯ ЗАХВАЧЕНА|BATTERY PICKED UP
CLICK ДЛЯ ФИКСАЦИИ|CLICK TO LOCK
ДОНЕСИ В SLOT|CARRY IT TO SLOT
УДЕРЖИВАЙ GRAB|HOLD GRAB
НУЖНО ДЕРЖАТЬ БАТАРЕЮ В SLOT|HOLD THE BATTERY IN SLOT
Собери 6 кристаллов касанием|Touch all six crystals
Все кристаллы собраны — доберитесь до EXIT|All crystals collected — reach EXIT
На выходе CLICK не нужен: просто коснитесь круга.|No CLICK needed at the exit: just touch the circle.
Стены теперь убивают|Walls are now lethal
0 / 4 чекпоинта|0 / 4 checkpoints
СТЕНА|WALL
Пройди сквозь движущиеся ворота|Pass through the moving gates
ДОЙДИ ДО EXIT|REACH EXIT
ДВИЖУЩАЯСЯ СТЕНА|MOVING WALL
Подкрадись к башне и удерживай GRAB|Approach the tower and hold GRAB
ЯДРО У БАШНИ|CORE AT THE TOWER
ЯДРО В РУКАХ|CARRYING THE CORE
ВЕРНИ ЯДРО НА БАЗУ|RETURN THE CORE TO BASE
GRAB ЯДРО|GRAB THE CORE
Конвейеры сами толкают курсор|Conveyors push the cursor automatically
0 / 4 груза|0 / 4 loads
Выживи: мир летит вниз, ты взлетаешь вверх|Survive: the world falls while you fly upward
ВЫЖИВИ ДО 0|SURVIVE UNTIL ZERO
Теперь падаем: стены летят вверх|Now fall: the walls move upward
Собери 4 узла, не коснувшись вращающихся рук|Collect four nodes without touching the rotating arms
ВРАЩАЮЩАЯСЯ БАЛКА|ROTATING BEAM
CLICK по переключателям 1 → 2 → 3|CLICK switches 1 → 2 → 3
ЛАЗЕР|LASER
ВСЕ ЛАЗЕРЫ OFF|ALL LASERS OFF
НУЖНО CLICK ПО ТЕКУЩЕМУ SWITCH|CLICK THE CURRENT SWITCH
Магниты тянут и отталкивают курсор|Magnets pull and push the cursor
Каждые ~5 сек управление перемешивается|Controls shuffle about every five seconds
РОЛИ ПЕРЕМЕШАНЫ|ROLES SHUFFLED
Смотри на телефон|Look at your phone
ФАЗА 1: выключи 4 щита CLICK|PHASE 1: CLICK to disable four shields
БОСС: БАЛКА|BOSS: BEAM
Роли снова другие|Roles changed again
ЩИТЫ СБИТЫ|SHIELDS DOWN
ФАЗА 2: удерживай GRAB у ядра и тащи его в ESCAPE|PHASE 2: hold GRAB near the core and drag it to ESCAPE
Башня теперь стреляет веером. Не отпускайте GRAB.|The tower now fires a spread. Keep holding GRAB.
ЖМИ ТЕКУЩИЙ SHIELD|PRESS THE CURRENT SHIELD
ЯДРО УКРАДЕНО|CORE STOLEN
ДОНЕСИ В ESCAPE|CARRY IT TO ESCAPE
Сначала отключите телефоны|Disconnect phones first
SOLO: стрелки + SPACE(click) + SHIFT(grab)|SOLO: arrows + SPACE (click) + SHIFT (grab)
Блок садится|Block settling
Блок падает|Block falling
Закончились попытки|No attempts left
Смена закончена — отличная работа!|Shift complete — great work!
Ждём возвращения строителей|Waiting for the builders to return
Блок падает…|Block falling…
Мимо опоры · минус попытка|Missed the support · one attempt lost
Башня потеряла равновесие|The tower lost its balance
Идеально! +150|Perfect! +150
Этаж готов ·|Floor complete ·
Войди через общее лобби|Join through the shared lobby
Не удалось восстановить игрока|Could not restore the player
Нужно минимум 2 игрока|At least two players needed
Откройте главное лобби для подключения.|Open the main lobby to join.
Уже 16 игроков.|Already 16 players.
Действие уже принято или ход завершён.|Action already accepted or the turn has ended.
Следующий художник|Next artist
с|s
Выбери блок. Вниз джойстиком — вытянуть, вверх — вернуть, вбок — сдвиг и давление. Чем дальше палец, тем сильнее движение.|Choose a block. Pull the stick down to extract, up to return, or sideways to push. Move farther from center to apply more force.
Башня устояла — считаем успешные ходы.|The tower stood — counting successful turns.
Открой главное лобби для входа|Open the main lobby to join
Максимум16 игроков|Maximum 16 players
Тяни джойстик вниз. Боковое давление раскачивает башню; вверх — вернуть блок.|Pull the stick down. Sideways pressure rocks the tower; push up to return the block.
Блок возвращён по длине. Отпусти джойстик, чтобы выбрать другой.|Block returned. Release the stick to choose another.
Блок наверху. Ждём, пока башня успокоится…|Block placed on top. Waiting for the tower to settle…
Ход передан. Частично выдвинутый блок можно вернуть или вытянуть.|Turn passed. The partly extracted block can be returned or pulled out.
Следующий игрок|Next player
Войдите через общее лобби|Join through the shared lobby
Нужно имя|Enter a name
Ответ уже принят|Answer already accepted
Этот вопрос уже завершён|This question has ended
Некорректный ответ|Invalid answer
Игра уже началась|The game has already started
Уже запущено|Already started
Нужно минимум 2 подключённых игрока|At least two connected players needed
Нет игроков|No players
Удалять игроков можно только в лобби|Players can only be removed in the lobby
Введите имя|Enter a name
Нет активного хода|No active turn
Дайте игроку закончить ход|Let the player finish their turn
Сейчас не ваш ход|It is not your turn
Некорректный рисунок|Invalid drawing
Рисунок слишком большой|Drawing too large
Некорректный размер рисунка|Invalid drawing size
Некорректный стык|Invalid seam
Подключитесь через главное лобби.|Join through the main lobby.
Перезарядка, клетка уже обстреляна или бой завершён.|Reloading, cell already targeted, or battle finished.
Подключите хотя бы двух игроков|Connect at least two players
💥 Все вылетели одновременно!|💥 Everyone was eliminated at once!
💣 У ТЕБЯ БОМБА!|💣 YOU HAVE THE BOMB!
💣 БОМБА! ПЕРЕДАЙ!|💣 BOMB! PASS IT!
ПЕРЕДАЧА|PASS
💥 Никто не пережил раунд!|💥 Nobody survived the round!
Время вышло|Time is up
🤠 Никто не выстрелил после DRAW!|🤠 Nobody fired after DRAW!
💀 Не успел — следующий раунд|💀 Too late — next round
Все выстрелили раньше сигнала|Everyone fired before the signal
Вернитесь в главное лобби: профиль не найден.|Return to the main lobby: profile not found.
Ответ уже принят, время вышло или отвечает капитан.|Answer already accepted, time is up, or the captain is answering.
Все фреймы сыграны|All frames played
Мимо кеглей|Missed the pins
Пустой энд|Empty end
Все игроки отключились|All players disconnected
Камень остановился|Stone stopped
Камень не прошёл линию или ушёл за борт|The stone did not cross the line or went out of bounds
Ничья на льду!|A tie on the ice!
Матч на льду закончен|Match on the ice finished
Ворота прогрызены. Рой прорвался!|The gate fell. The swarm broke through!
Док защищён. Вся команда победила!|The dock is safe. The whole team wins!
Перерыв: ремонт ворот +120|Break: gate repaired +120
Рой не отступил за 10 минут|The swarm held on for ten minutes
Время! Считаем попадания|Time! Counting hits
Войди через главное лобби|Join through the main lobby
В комнате уже 16 игроков|There are already 16 players in the room
Не удалось начать игру:|Could not start the game:
Мини-режим: вопрос и догадка|Mini mode: ask and guess
Локация тебе неизвестна|You do not know the location
Время вышло — голосуем!|Time is up — vote!
Началось голосование|Voting started
Сейчас не голосование|Voting is not open
Некорректный голос|Invalid vote
Недоступно|Unavailable
нет связи|offline
фишек|chips
УРАВНЯТЬ|CALL
ЧЕК|CHECK
Повысить ставку до|Raise to
ПОВЫСИТЬ|RAISE
Открывай клетки: +1. Мина: −5 и пауза 2 секунды. Первый ход безопасен.|Open cells: +1. Mine: −5 and a two-second pause. Your first move is safe.
УЖЕ ОТКРЫТО|ALREADY OPEN
До 7 голов · две равные команды|First to seven goals · two equal teams
Двигай джойстик. Следи за своей битой на большом экране.|Move the stick and watch your striker on the big screen.
Вернитесь в главное меню для входа|Return to the main menu to join
Взаимное уничтожение|Mutual elimination
Ядро украдено. Команда победила!|Core stolen. The team wins!
Босс удержал ядро. Попробуйте ещё раз.|The boss kept the core. Try again.
Команда победила|The team wins
Ранний выстрел|Early shot
Точный выстрел|Accurate shot
Вернитесь в главное меню|Return to the main menu
Окно выстрела|Firing window
Тапай быстрее → обгони друзей|Tap faster → race your friends
Три удара → лучший результат|Three hits → best score
Взмах → пролети между трубами|Flap → fly between pipes
Ешь → расти → догоняй|Eat → grow → chase
Поворачивай → избегай следов|Turn → avoid trails
Подбери мяч → передай → забей|Pick up → pass → score
Разгонись → вытолкни соперника|Accelerate → push rivals out
Круг сужается. Держись центра|The circle shrinks. Stay near the center
Лови свой сектор → бросай|Catch your color → throw
Догони → передай бомбу|Catch up → pass the bomb
Жди DRAW! → нажми огонь|Wait for DRAW! → fire
Подбирай оружие → стреляй|Collect weapons → fire
Ваши движения → один курсор|Your movements → one cursor
Слайдер + газ → пройди ворота|Hold to steer + throttle → pass the gates
Каждый рисует часть монстра|Everyone draws a part of the monster
Задавай вопросы → найди шпиона|Ask questions → find the spy
Ответь в свой ход → поднимись|Answer on your turn → climb
Обсуди → выбери ответ|Discuss → choose an answer
Узнай место → выбери ответ|Recognize the place → choose an answer
Покажи слово → друзья угадают|Act out a word → friends guess
Тяни аккуратно → сохрани башню|Pull carefully → keep the tower standing
Совмести груз → отпусти|Align the load → release
Выбери клетку → потопи флот|Choose a cell → sink the fleet
Один рисует → остальные угадывают|One draws → everyone else guesses
Сигнал → первый выстрел побеждает|Wait for the signal → first shot wins
Скриншот игры|Game screenshot
Арт и скриншот игры|Game art and screenshot
Иллюстрация|Illustration
Геймплей:|Gameplay:
Карточка выше на ТВ|Card above on TV
Предыдущая карточка на ТВ|Previous card on TV
Номер игры на телевизоре|Game number on TV
Следующая карточка на ТВ|Next card on TV
Карточка ниже на ТВ|Card below on TV
Вытолкни остальных с арены.|Push rivals out. Stay inside.
Удержись на сужающейся арене.|Stay inside the shrinking arena.
Попадай ножами в свой цвет.|Hit your color with each knife.
Передай бомбу до взрыва.|Pass the bomb before it explodes.
Жди сигнал. Стреляй первым.|Wait for the signal. Shoot first.
Выполняй цель выбранного режима.|Play the objective of this mode.
Собирай оружие. Попадай в соперников.|Collect weapons. Hit your rivals.
Один курсор. Действуйте вместе.|One cursor. Work together.
Проходи круги. Финишируй первым.|Complete your laps. Finish first.
Нарисуй свою часть общего монстра.|Draw your part of the monster.
Задавай вопросы. Найди шпиона.|Ask questions. Find the spy.
Выбери ответ на телефоне.|Answer on your phone.
Показывай без слов. Угадывайте.|Act it out. Others guess.
Вытащи блок. Не урони башню.|Pull a block. Keep it standing.
Ставь блоки. Сохрани башню.|Stack blocks. Keep it standing.
Находи и топи корабли соперников.|Find and sink the enemy ships.
Один рисует. Остальные угадывают.|One draws. Everyone else guesses.
Жди сигнал. Не стреляй раньше.|Wait for GO. Do not fire early.
Тапай быстрее. Доберись до финиша.|Tap faster. Reach the finish.
Три удара. Набери больше очков.|Three hits. Score the most.
Пролетай между препятствиями.|Fly through the gaps.
Собирай еду. Стань больше соперников.|Collect food. Outgrow your rivals.
Не врезайся в стены и следы.|Avoid walls and trails.
Передавай мяч. Забивай командой.|Pass the ball. Score as a team.
Собирай цепочки одного цвета.|Match marbles of the same color.
Попадай в соперников. Набирай очки.|Hit rivals. Most points wins.
Попадай в мишени. Набирай очки.|Hit targets. Score points.
Собери комбинацию или блефуй.|Make a hand or make rivals fold.
Защищай ворота. Забивай голы.|Defend your goal. Score goals.
Открывайте клетки. Избегайте мин.|Open safe cells. Avoid the mines.
Подведи камень ближе к центру.|Slide closest to the center.
Сбей кегли. Набери больше очков.|Knock down pins. Score the most.
Защищайте ворота от роя.|Protect the gate from the swarm.
Попадай в цели. Не трогай белый флаг.|Hit targets. Spare the white flags.
Бой|Battle
Лидер|Leader
Жизни|Lives
Счёт|Score
Продолжаем|Resuming
Готовим игру|Preparing the game
В компанию|Join the party
Состояние игры|Game status
Ошибка обновления|Update error
Автоподключение не удалось. Запустите START_WINDOWS.bat / START_MAC.command. Журнал — ~/.localparty-updates.|Automatic connection failed. Run START_WINDOWS.bat / START_MAC.command. Logs: ~/.localparty-updates.
Экспериментальная версия: четыре новые игры. Сохраняется резервная копия.|Experimental release with four new games. A backup will be saved.
Стабильный релиз может не содержать alpha-игры и кнопку обновления. Профили сохраняются.|The stable release may not include alpha games or the update button. Profiles are preserved.
Проверяем GitHub…|Checking GitHub…
Готовим установку…|Preparing installation…

ПОДГОТОВКА|PREPARING
ТАНК|TANK
СБРОСИТЬ|DROP

Переподключиться|Reconnect
Показать всех игроков|Show all players
В комнате|In the room
QR для подключения к игре|Scan to join the game
QR подключения|Scan to join
Вместе или друг против друга.|Play together or against each other.
Води прицел тачпадом и стреляй отдельной кнопкой. Чудики выезжают из укрытий — попадать можно только в видимую часть. Шесть точных попаданий подряд заряжают пулемёт на 8 секунд. Его нужно включить! Белый флажок — мирный.|Aim with the touchpad and use the fire button. Hit the visible part of each target. Six accurate hits charge an eight-second machine gun burst; activate it when ready. Spare the white flags.
Две команды. Свайпом отправляй камень к центру круга и выбивай чужие. Пока камень вашей команды едет, все могут держать свип на телефоне. Очки получают только камни ближе ближайшего чужого.|Two teams take turns sliding stones toward the center. Knock opposing stones away. Hold sweep while your team's stone moves. Only stones closer than the opponent's nearest stone score.
На телефоне выбери позицию и подкрутку. Проведи пальцем вверх: направление и скорость свайпа задают бросок. Играем по очереди; страйки, спэры и бонусные броски считаются автоматически.|Choose your position and spin. Swipe up to set the direction and speed. Take turns bowling; strikes, spares and bonus throws are scored automatically.
На экране выходят двое. Ждите сигнала «СТРЕЛЯЙ», затем один раз нажмите. Кто раньше — получает очко; ранний выстрел отдаёт очко сопернику. Остальные смотрят и готовятся. В компании каждый выходит два раза, вдвоём — до двух побед, максимум три дуэли. Подключившиеся после начала наблюдают до следующего турнира.|Two players face off. Wait for DRAW, then tap once. The faster player scores; firing early gives the point to your opponent. In a group, everyone duels twice. With two players, first to two wins, up to three duels. Late arrivals watch until the next tournament.
Обычные игроки получают одну локацию и свою роль. Шпион знает только категорию. Для 2 игроков: дуэль без голосования — шпион угадывает место до таймера, иначе побеждает мирный. Задавайте вопросы так, чтобы вычислить шпиона и не раскрыть место.|Players share a location and receive individual roles. The spy knows only the category. With two players, the spy must guess the location before time runs out. Ask questions to find the spy without revealing the location.
Если угадаешь — шпионы сразу победят. Ошибка = мгновенный проигрыш.|A correct guess wins for the spies. A wrong guess loses immediately.
ДРОН|DRONE
ПВО|AA
ПУСК ПВО|LAUNCH AA
ДРОН · 1 ЗА МАТЧ|DRONE · 1 PER MATCH
10 ПЕРЕХВАТЧИКОВ ЗА МАТЧ · ЦЕЛЬ ВЫБИРАЕТ СЕРВЕР|10 INTERCEPTORS PER MATCH · AUTOMATIC TARGETING
Заряд дрона|Drone charge
Заряды ПВО|AA charges
Заряд закончится — оружие сбросится само.|The payload drops automatically when charge runs out.
Джойстик дрона — перетаскивай или используй стрелки|Drone stick — drag or use arrow keys
Игровая 3D-сцена|3D game scene
Общее игровое поле|Shared game board
Общий рисунок|Shared drawing
Поле выбранного противника|Selected opponent's board
Модуль управления|Control module
НА БОРТУ|PAYLOAD
Параметры текущего выстрела|Current shot settings
Радар вражеских снарядов|Enemy projectile radar
Угол. Мощность. Попадание.|Angle. Power. Impact.
Учитывай инерцию и ветер.|Allow for momentum and wind.
Три одинаковых шарика запускают комбинацию. Соединяйте края цепи для каскадов.|Match three marbles of the same color. Join chain ends to trigger cascades.
Каждая часть = новый персонаж 😈|Each part creates a new character 😈
Продолжи видимую полоску сверху. Внизу своей части оставь линии для продолжения.|Continue the strip visible above. Leave lines at the bottom for the next player.
Ходов на игрока|Turns per player
Очки за попадания, а не выживание. У всех одинаковое число ходов.|Score points for hits. Everyone gets the same number of turns.
Игроки выбирают оружие перед матчем|Players choose weapons before the match
Все 321 · бесконечно|All 321 · unlimited
Обычный · 8 с пауза + 45 с сжатие|Standard · 8s pause + 45s shrinking
Быстрый · сразу, за 20 с|Fast · starts immediately, shrinks in 20s
Выстрел · Space|Fire · Space
Проведи пальцем вверх, чтобы бросить|Swipe up to throw
Соберите башню вместе|Build the tower together
Твой флот:|Your fleet:
палуб. Выбери цель и клетку.|decks. Choose a target and a cell.
на поле|on the board
в очереди|queued
Слой|Layer
ждём|waiting
ФРЕЙМОВ|FRAMES
По|Each
стрел|arrows
сек|sec
и заходите в игру|and join the game
и заходите с телефонов|and join on your phones
QR ведёт на этот компьютер по Wi‑Fi:|QR links to this computer over Wi-Fi:
ДВИЖЕНИЕ|MOVEMENT
ТОЧНОСТЬ|ACCURACY
Я в игре|Join game
Глеб|Gleb

Осталось|Time left
Камера остановилась. Откройте её ещё раз.|The camera stopped. Open it again.
Нет изображения с камеры. Откройте камеру ещё раз или используйте сенсорный пульт.|No camera image. Open the camera again or use touch controls.
Камера: |Camera: 
Прицеливание|Aim and fire
Выбор арсенала|Choose your arsenal
Дрон в полёте|Drone in flight
Выстрел / осыпание|Projectile in flight
Башня успокаивается|Tower settling
Приготовиться|Get ready
Результат раунда|Round result
Между раундами|Between rounds
Ждём сигнал|Wait for the signal
Восстанавливаем связь|Reconnecting
Осталось ходов|Turns left
Время гонки, с|Race time, s
Стрел на игрока|Arrows per player
Оружий в арсенале|Weapons in loadout
Арсенал готов|Loadout ready
Ещё в рое|Still incoming
Прочность ворот|Gate health
Текущая ставка|Current bet
Фреймов|Frames
Раундов|Rounds
В очереди|Queued
На поле|On field
Устойчивость|Stability
Ходов|Turns
Частей|Parts
Отвечает|Answering
Угадано|Guessed
Пропущено|Skipped
Блоков|Blocks
Этажей|Floors
Раздача|Hand
Кругов|Laps
Подключаем ботов…|Connecting bots…
Для ботов нужен общий экран. Подключи телевизор.|Bots need a shared screen. Connect your TV.
Слишком много игроков для этой игры. Убери лишних ботов.|Too many players for this game. Remove some bots.
Не хватает игроков. Добавь бота или пригласи друзей.|Not enough players. Add a bot or invite friends.
Ждём подключения ботов…|Waiting for bots to connect…
Все готовы к запуску. Боты играют без записи очков.|Ready to start. Scores are not saved when playing with bots.
Изменение не подтвердилось. Проверь экран и попробуй ещё раз.|The change was not confirmed. Check your screen and try again.
Джойстик · 7 оружий|Joystick · 7 weapons
Сражайся на арене: пушка, дробовик, пулемёт, ракета, спаренная пушка, снайперская пушка и огнемёт. Подбирай лечение, щит и ускорение.|Fight with a cannon, shotgun, machine gun, rocket, twin cannon, sniper cannon and flamethrower. Collect healing, shields and speed boosts.
Недостаточно игроков. Подключи игроков или добавь бота в панели ведущего.|Not enough players. Connect players or add a bot in the Host panel.
СПАРЕННАЯ ПУШКА|TWIN CANNON
СНАЙПЕРСКАЯ ПУШКА|SNIPER CANNON
ОГНЕМЁТ|FLAMETHROWER
7 оружий · 90 секунд · бесконечные возрождения|7 weapons · 90 seconds · unlimited respawns
Запуск не подтвердился. Нажми ещё раз.|The game did not start. Please try again.
Комната ещё восстанавливается. Попробуй через секунду.|Reconnecting the room. Please try again in a moment.
Переподключаем общий экран…|Reconnecting the shared screen…
Общий экран не подключён. Подключи ТВ и повтори запуск.|No shared screen is connected. Connect your TV and try again.
Арсенал|Arsenal
Набор на матч|Standard loadout
Все оружия · бесконечно|All weapons · unlimited ammo
Выбор перед матчем|Pre-match selection
Случайная выдача|Random loadout
Игроки собирают арсенал|Players build their arsenal
побед|wins
партий|matches
очков|points
очко|point
очка|points
победа|win
победы|wins
Бросает|Throwing:
Контакт · ждём устойчивости|Contact · waiting for the block to settle
Сужение арены|Arena shrinking
Обычное|Normal
Быстрое|Fast
Выживание|Survival
Захват флага|Capture the flag
Задания|Prompts
Разные персонажи|Different characters
Один персонаж|One character
Шпионы|Spies
Минут на обсуждение|Minutes to discuss
Подсказка категории|Category hint
Перейти к голосованию|Start voting
Завершить голосование|Finish voting
Вопросы|Questions
По командам|Teams
Секунд на ход|Seconds per turn
Ходы|Turns
Следующий ход|Next turn
Завершить бой|End battle
Секунд на рисунок|Seconds per drawing
Показать слово|Reveal word
Уровни|Levels
Стрелы|Arrows
Энды|Ends
Фреймы|Frames
Волны|Waves
Секунд на матч|Seconds per match
Сейчас рисует|Drawing now:
Русский|Russian
Пункт управления iPhone → Повтор экрана → телевизор или Mac → вернись в HeyPals. Когда подключится отдельная сцена HeyPals, телевизор покажет игру, а iPhone — меню или пульт. Если пока видна копия телефона, нажми «Проверить экран». Не блокируй телефон во время игры.|iPhone Control Centre → Screen Mirroring → your TV or Mac → return to HeyPals. Once the separate HeyPals scene connects, the TV shows the game and your iPhone shows the menu or controller. If the TV still mirrors your phone, tap “Check screen”. Keep your phone unlocked while playing.
Включи для телефонов друзей. При первом включении HeyPals получит локальное имя у Lancert и сертификат Let’s Encrypt. Интернет нужен для этой настройки; игровое соединение остаётся в Wi-Fi.|Enable access for your friends’ phones. On first use, HeyPals obtains a local name from Lancert and a Let’s Encrypt certificate. Internet access is needed for this setup; gameplay stays on your Wi-Fi.
Не удалось открыть экран|Couldn't open this screen
В меню|Back to menu
В сборке отсутствует Server/native-catalog.json.|This build is missing Server/native-catalog.json.
Встроенный каталог пуст или содержит повторяющиеся игры.|The bundled catalogue is empty or contains duplicate games.
Не удалось прочитать встроенный каталог:|Couldn't read the bundled catalogue:
Сервер не вернул каталог. Игры из приложения сохранены; запуск временно недоступен.|The server did not return the catalogue. Your bundled games are available to browse; starting a game is temporarily unavailable.
Меню не приняло каталог. Нажми «Повторить» — профили и статистика не удаляются.|The menu did not receive the catalogue. Tap “Try again”; profiles and statistics will be kept.
Открой свой пульт или пригласи друзей.|Open your controller or invite friends.
Отдельная сцена ТВ:|Dedicated TV scene:
Игровых подключений экрана:|Game screen connections:
ждём:|waiting for:
На ТВ —|On TV —
До|Up to
Подготовка интерфейса|Preparing the screen
подготовка экрана|preparing the screen
Соединяем общий экран…|Connecting the shared screen…
Ждём связь с iPhone…|Waiting for your iPhone…
Получаем каталог игр…|Loading the games…
Собираем интерфейс вечера…|Getting your party ready…
localparty — вечер начинается|HeyPals — your night starts here
Язык|Language
Твой ход|Your turn
Применить язык ко всем|Apply language to everyone
Переключить язык у всех игроков? Каждый сможет изменить его снова.|Change everyone's language? Players can change it back individually.
Каждый выбирает свой язык. Эта настройка меняет только твой интерфейс.|Everyone chooses their own language. This changes only your interface.
Применить мой язык ко всей комнате|Apply my language to the whole room
Изменить язык всей комнаты?|Change the whole room's language?
Язык изменится у всех игроков. После этого каждый сможет снова выбрать свой.|Everyone's language will change. Each player can choose their own again afterwards.
Подключаемся…|Connecting…
Подключаем…|Connecting…
Логика|Strategy
Вечеринка|Party
Ожидание|Waiting
В комнате|In the room
Топ|Rankings
Подключить|Invite
Залетай в компанию ↗|Join the party ↗
Один Wi-Fi. И ты в игре.|Same Wi-Fi. You're in.
ТВОЙ ТЕЛЕФОН — ТВОЙ КОНТРОЛЛЕР|YOUR PHONE IS YOUR CONTROLLER
Ну что,|Ready to
поиграем?|play?
ТВОЁ ЛИЦО В ИГРЕ|PUT A FACE TO YOUR NAME
Добавь себя в компанию.|Join the party.
Фото появится у имени и на пьедестале.|Your photo appears beside your name and on the podium.
Снять фото|Take photo
Выбрать фото|Choose photo
Какой рукой удобнее играть?|Which hand do you play with?
Правой|Right
Левой|Left
Сохранить профиль|Save profile
ВЕЧЕР СВОИХ ЛЮДЕЙ|GOOD FRIENDS. GREAT GAMES.
Будет громко.|Let's make some noise.
Один экран. Любимые люди. Телефоны уже готовы к игре.|One screen. Your favourite people. Phones ready to play.
игр|games
игроков|players
Без установок на телефон|No app downloads needed
В следующий раз — без QR ↗|Next time, skip the QR ↗
Оставь эту вкладку или добавь её в закладки браузера. Откроешь снова — пульт попробует восстановить твой профиль без камеры.|Keep this tab or bookmark it. Open it again and your controller will try to restore your profile without scanning a code.
Нужны тот же браузер, включённый хост и та же сеть. Если адрес ведущего изменился, открой новый QR. После очистки данных браузера имя и фото может понадобиться указать заново.|Use the same browser and Wi-Fi with the host running. If the host address changes, scan the new QR. Clearing browser data may require setting up your name and photo again.
СОБИРАЕМ КОМПАНИЮ|GET EVERYONE TOGETHER
Твоё место|Your place
уже здесь ↙|is right here ↙
Наведи камеру — и залетай.|Scan the code and join in.
Скопировать адрес ↗|Copy address ↗
Экшен|Action
Сюрприз|Surprise me
Наверх|Back to top
Слова и секреты|Words & secrets
Во что|What shall
влетаем?|we play?
СМЕНИМ ТЕМП|CHANGE THE PACE
Слова, секреты|Words, secrets
и внезапные таланты.|and unexpected talents.
Играем за столом|Tabletop games
Открой правила — и всё понятно. Никакой подготовки.|Read the rules and jump in. No preparation needed.
Наши люди|Our people
Все игроки ↗|All players ↗
Пока тихо…|Quiet for now…
Покажи друзьям QR — это ненадолго.|Show your friends the QR. They'll be here soon.
Профиль и фото|Profile & photo
СЫГРАЛИ СЕГОДНЯ И РАНЬШЕ|PLAYED TODAY AND BEFORE
На высоте|On top
Смотреть всех ↗|See everyone ↗
КАЖДЫЙ РАУНД — НОВАЯ ИСТОРИЯ|EVERY ROUND TELLS A STORY
компании.|for the party.
+10 за партию · +30 за победу|+10 per game · +30 per win
Первый раунд — первый след в истории вечера.|The first round starts tonight's story.
Здесь появятся победы, рекорды и красивые взлёты.|Wins, records and great comebacks will appear here.
СОБИРАЕМСЯ НА СТАРТ|GETTING READY
Пока смотрю|Spectate for now
МОЖНО ПЕРЕВЕСТИ ДУХ|TAKE A BREATHER
Продолжить может любой игрок.|Any player can resume.
Правила игры|Game rules
Продолжить игру|Resume game
Назад|Back
РАЗБЕРЁМСЯ ЗА МИНУТУ|LEARN IT IN A MINUTE
Понятно, играем →|Got it, let's play →
Назад в игру|Back to game
ЕЩЁ ЕСТЬ МЕСТО|ROOM FOR MORE
Залетай|Join
в компанию.|the party.
Подключись к тому же Wi-Fi и открой камерой телефона.|Connect to the same Wi-Fi and scan with your phone's camera.
Готово|Done
Выбирай настроение|Pick a mood
Вернуться|Go back
НАША КОМПАНИЯ|OUR PARTY
Все на месте.|Everyone's here.
Все в лобби|Everyone to lobby
Вернуться в игру|Back to game
Вернуть всех в лобби?|Return everyone to the lobby?
Текущая партия завершится.|The current game will end.
Вернуть всех|Return everyone
Ждём приглашения ведущего|Waiting for the host's invitation
В одной сети|Connected
Для повторного входа укажите имя и нажмите «Я в игре».|Enter your name and tap “Join game” to return.
Связь перешла в другую вкладку. Нажми «Я в игре», чтобы вернуться здесь.|Your session moved to another tab. Tap “Join game” to return here.
Вы удалены из комнаты|You were removed from the room
Другая вкладка|Open in another tab
Предпросмотр фото|Photo preview
Твоё фото|Your photo
Добавь фото|Add photo
Для игры и пьедестала.|For the game and podium.
Выбери JPEG, PNG или WebP до 12 МБ.|Choose a JPEG, PNG or WebP image under 12 MB.
Фото не удалось достаточно уменьшить.|The photo could not be resized enough.
Ты в игре|You're in
Повторяем вход…|Rejoining…
Подключаем контроллер…|Connecting controller…
Компания в сборе.|The party is here.
Голосуйте за игру. Когда выберут все, запустится лидер голосования.|Vote for a game. Once everyone votes, the most popular game starts.
в игре|in game
это ты|you
в сети|online
Ничья. Подключите ТВ — сервер случайно выберет одну из игр-лидеров.|It's a tie. Connect the TV and the server will pick one of the tied games at random.
Для выбранной игры не подходит число игроков. Выберите другую игру.|This game doesn't support the current player count. Choose another game.
Все проголосовали. Подключите ТВ — игра запустится автоматически.|Everyone has voted. Connect the TV to start automatically.
Запускаем игру…|Starting game…
Чаще играем|Most played
Выбор вечера|Tonight's pick
Как играть|How to play
Управление|Controls
Свежий завоз|Fresh arrivals
ФРЕШ|FRESH
Новые игры. Тот же повод собраться.|New games. Same great reason to get together.
Предыдущие новинки|Previous new games
Следующие новинки|Next new games
Свежие игры|New games
Ваш голос|Your vote
Голосовать|Vote
голосов|votes
голоса|votes
голос|vote
Голосуй первым|Be the first to vote
Найти игру|Find a game
Все|All
Аркады|Arcade
За столом|Tabletop
Как выбираем игру|How voting works
Один голос на человека. Когда проголосуют все, игра запустится сама. При равенстве — случайный выбор среди лидеров.|One vote each. When everyone has voted, the game starts automatically. Ties are decided randomly between the leading games.
ЦЕЛЬ|GOAL
УПРАВЛЕНИЕ|CONTROLS
КАК ПОБЕДИТЬ|HOW TO WIN
Следи за счётом на общем экране. Итоги появятся в конце партии.|Watch the score on the shared screen. Results appear at the end of the game.
ВХОД ВО ВРЕМЯ ИГРЫ|JOINING MID-GAME
Входи в любой момент. Если ход уже начался, игра подскажет, когда ты вступаешь.|Join at any time. If a turn has started, the game will tell you when you can enter.
Уничтожений|Eliminations
Возрождений|Respawns
Выстрелов|Shots
Попаданий|Hits
Верных ответов|Correct answers
Ответов|Answers
Серия|Streak
Рисунков|Drawings
Штрихов|Strokes
Кругов|Laps
Фальстартов|False starts
Флагов|Flags
Уровней|Levels
Действий|Actions
Побед|Wins
Верных голосов|Correct votes
Вопросов|Questions
Лучший круг|Best lap
Реакция, мс|Reaction, ms
Лучшая реакция, мс|Best reaction, ms
Лучшая серия|Best streak
Побед в раундах|Rounds won
Ошибок|Mistakes
Уровень|Level
Раундов шпионом|Rounds as spy
Голосований|Votes
Лучший финиш, с|Best finish, s
Дистанция|Distance
Ускорений|Boosts
Столкновений|Collisions
Урона|Damage
Угадано|Guessed
Пропусков|Skips
Выходов на сцену|Performances
Блоков установлено|Blocks placed
Точных установок|Perfect placements
Промахов|Misses
Рекорд высоты|Height record
Потоплено|Sunk
Сохранено палуб|Decks saved
Блоков вытянуто|Blocks pulled
Блоков|Blocks
Пропущено ходов|Turns skipped
Обрушений|Collapses
Пропусков по времени|Timeouts
очков|points
Топ компании|Party rankings
Партий|Games
Доля побед|Win rate
Лучший удар|Best punch
Ударов|Punches
Полёт, с|Flight, s
Вес в финале|Final weight
Голов команды|Team goals
Раундов|Rounds
После первой партии здесь появятся результаты по играм.|Game results will appear here after your first match.
Итог|Result
Игра|Game
Ждём|Waiting
Собираемся|Getting ready
На старт|Get ready
Игра идёт|Game in progress
Результат хода|Turn result
Матч окончен|Match over
Общий экран|Shared screen
Игрок|Player
ОБЩИЙ ЭКРАН|SHARED SCREEN
Время|Time
Ждём iPhone-сервер|Waiting for the host iPhone
Откройте HeyPals на iPhone-сервере. Игра продолжится автоматически.|Open HeyPals on the host iPhone. The game will resume automatically.
Продолжить может любой игрок или ведущий с телефона.|Any player or the host can resume from their phone.
Готов · отменить|Ready · cancel
Хочу играть|Join game
Твой контроллер ещё не подключён. Не закрывай страницу — повторяем вход автоматически.|Your controller hasn't connected yet. Keep this page open — we're retrying automatically.
Ты наблюдаешь. Можно присоединиться перед стартом.|You're spectating. You can join before the game starts.
Ждём тех, кто вышел из комнаты.|Waiting for disconnected players.
Подключаем контроллеры.|Connecting controllers.
Когда все готовы — начнём автоматически.|The game starts automatically when everyone is ready.
Правила и управление|Rules & controls
Победа|Win
Партий вместе|Games together
Игр попробовали|Games tried
Победы лидера|Leader's wins
Последняя игра|Last game
Первый раунд решит, кто окажется наверху.|The first round decides who's on top.
Топ компании · первая партия впереди|Party rankings · first game ahead
В игре|In game
Подключён|Connected
Компания ещё собирается.|The party is still gathering.
Каждая партия меняет расстановку. Нажми на игрока, чтобы увидеть его результаты.|Every game changes the rankings. Tap a player to see their results.
1 место|1st place
Сыграйте первую партию — здесь появятся победы и рекорды.|Play your first game to see wins and records here.
Адрес скопирован|Address copied
Адрес для друзей|Address for friends
Готовим фото…|Preparing photo…
Фото ещё готовится. Сохрани профиль через секунду.|Your photo is still being prepared. Save your profile in a moment.
Счёт игры|Game score
Полный экран доступен в меню браузера.|Full screen is available in your browser menu.
Старт|Start
На телефонах|On phones
Выбрать|Select
Новые поводы сказать «ещё раз».|New reasons to say “one more”.
Фреш — новые игры|Fresh — new games
Предыдущие новые игры|Previous new games
Следующие новые игры|Next new games
Во что влетаем?|What shall we play?
Свежая партия.|A fresh round.
Слова, секреты и внезапные таланты.|Words, secrets and unexpected talents.
Запускаем…|Starting…
Сейчас играем|Now playing
Ждём ведущего|Waiting for the host
Откройте HeyPals на iPhone ведущего. Игра продолжится автоматически.|Open HeyPals on the host iPhone. The game will resume automatically.
Ведущий или игрок может продолжить игру с телефона.|The host or any player can resume from their phone.
Ждём готовности игроков|Waiting for players to get ready
Играем|Playing
Итоги хода|Turn results
Нужен iPhone ведущего|Host iPhone needed
Готовимся к игре|Preparing the game
Ждём подключение|Waiting for connection
Нажмите «Я готов» на своём телефоне|Tap “I'm ready” on your phone
готовы|ready
За этот выбор|Voted for this
Для гостей включите доступ по Wi-Fi на iPhone.|Enable Wi-Fi access on the iPhone to invite guests.
Подключаем экран…|Connecting screen…
Общий экран подключён|Shared screen connected
Доступ по Wi-Fi закрыт ведущим|The host has disabled Wi-Fi access
Подключаем экран заново…|Reconnecting screen…
Категории игр|Game categories
Кто в комнате|Who's in the room
Развернуть правила игры|Show game rules
Подключить игроков|Invite players
На весь экран|Full screen
Показать QR и адрес подключения|Show QR and connection address
QR-код подключения|Connection QR code
Как тебя зовут?|What's your name?
Например, Саша|For example, Alex
Убрать бота|Remove bot
Добавить бота|Add bot
Адрес подключения|Connection address
Выбор игры|Choose a game
Готовность игроков|Player readiness
Текущая игра|Current game
Лидеры компании|Party leaders
Голосов|Votes
из|of
Ты —|You —
Твой пульт · HeyPals|Your controller · HeyPals
Вернуться в меню ведущего|Return to host menu
Меню|Menu
Сервер недоступен|Server unavailable
Восстанавливаем комнату…|Restoring the room…
Нет связи с локальным сервером|Local server connection lost
Панель|Host
ведущего.|panel.
Все здесь.|Everyone's here.
Каталог загружается|Loading games
Игры вечера|Tonight's games
Каталог игр|Game library
ВОТ ЭТО КОМПАНИЯ|WHAT A PARTY
Аплодисменты своим. Следующий раунд — новая история.|Give your friends a hand. The next round is a new story.
ВЫБОР ВЕДУЩЕГО|HOST'S PICK
ЗАЛЕТАЙ В КОМПАНИЮ|JOIN THE PARTY
Камеру сюда|Point your camera here
Включите доступ по Wi-Fi на iPhone.|Enable Wi-Fi access on the iPhone.
QR-код подключения игроков|Player connection QR code
QR-код для входа в игру|Game connection QR code
Общий экран игры|Shared game screen
Управление — на телефоне.|Controls are on your phone.
До конца раунда|Round ends in
Готовы|Ready
До конца боя|Battle ends in
Общий курсор|Shared cursor
КАЛИБРОВКА|CALIBRATION
Картинг|Kart racing
кругов|laps
Гонка|Race
До обсуждения|Discussion in
Найдите шпиона|Find the spy
Раздача ролей|Assigning roles
Посмотрите роль на телефоне|Check your role on your phone
Показываем|Act it out
До передачи хода|Next turn in
блоков|blocks
Общая башня|Shared tower
этажей|floors
Рисуем|Drawing
До следующей дуэли|Next duel in
До финиша|Finish in
Да фінішу|Finish in
Узровень|Level
Ход|Turn
Стрельба из лука|Archery
Матч|Match
Энд|End
На бросок|Throw in
Волна|Wave
До финала|Final in
Точно выбрать|Choose
Голосовать против|Vote against
Доступ по сети уже включён|Network access is already enabled
Укажите состояние доступа по Wi-Fi|Specify whether Wi-Fi access should be enabled
Подключитесь к Wi-Fi, чтобы пригласить другие устройства|Connect to Wi-Fi to invite other devices
Завершите текущий матч перед сбросом статистики|Finish the current match before resetting statistics
Вернитесь в лобби перед сменой ботов.|Return to the lobby before changing bots.
Можно добавить от 0 до 15 ботов.|You can add between 0 and 15 bots.
В комнате максимум 16 игроков.|The room holds up to 16 players.
Игра не найдена|Game not found
Вернитесь в лобби для смены настроек|Return to the lobby to change settings
Эта игра уже завершена|This game has already ended
Действие сейчас недоступно|This action is unavailable right now
Игра уже началась или завершена|The game has already started or ended
Повторный запуск недоступен|Restart is unavailable
Сначала запустите сервер|Start the server first
Откройте экран /tv на телевизоре|Open /tv on the shared screen
Подождите окончания запуска|Wait for startup to finish
Серверу нужна активная сессия|The server needs an active session
Неизвестная команда|Unknown command
Игрок уже вышел|The player has already left
Ведущий удалил вас из комнаты.|The host removed you from the room.
Не удалось запустить выбранную игру|Couldn't start the selected game
Команда не выполнена|Command failed
Игра остановилась|The game stopped
Игра не ответила. Повторите запуск на iPhone.|The game did not respond. Try starting it again on the iPhone.
Игровой сервер завершился при запуске.|The game server stopped during startup.
Игровой сервер не ответил в отведённое время.|The game server did not respond in time.
Подождите окончания запуска или обновления.|Wait for startup or the update to finish.
неожиданно остановилась. Игроки остаются в комнате; можно запустить новый раунд.|stopped unexpectedly. Players remain in the room; you can start a new round.
Нет доступа к настройкам сервера|Server settings access denied
Сервер остановлен. Запустите сессию в приложении iPhone.|The server is stopped. Start a session in the iPhone app.
Фото не найдено|Photo not found
Эта игра уже закрыта. Вернитесь в лобби.|This game has ended. Return to the lobby.
Откройте общий экран /tv.|Open the shared screen at /tv.
Сервер игры недоступен|Game server unavailable
Не найдено|Not found
Экран ведущего открывается на компьютере, запустившем лаунчер.|Open the host screen on the computer running the launcher.
Не удалось обработать запрос|Couldn't process the request
Тестовый режим включает ведущий.|Only the host can enable test mode.
Вернитесь в лобби перед сменой режима.|Return to the lobby before changing modes.
Сначала подключитесь к игре.|Join the game first.
Матч уже начался.|The match has already started.
Сервер на паузе|Server paused
Экран обновляет подключение|The screen is refreshing its connection
Нет доступа ведущего.|Host access denied.
Сначала войдите в комнату|Join the room first
Введите имя.|Enter a name.
Это имя уже занято. Добавь, например, первую букву фамилии.|That name is taken. Try adding your last initial.
В лобби уже 16 игроков.|There are already 16 players in the lobby.
Этот контроллер уже вошёл в комнату|This controller has already joined the room
Игру выбирает ведущий.|The host chooses the game.
Не удалось запустить локальный сервер|Couldn't start the local server
Подключено только|Only connected
Для старта нужно минимум|Minimum players required
Открыть пульт|Open controller
`;
 for(const line of pairs.split('\n')){const at=line.indexOf('|');if(at>0)dictionary[line.slice(0,at)]=line.slice(at+1);}
 if(typeof module!=='undefined'&&module.exports)module.exports=dictionary;
})(typeof window!=='undefined'?window:globalThis);
