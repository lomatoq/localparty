(function(root){
  'use strict';
  // Exact source copy is the key. Keep game mechanics and names out of code paths.
  const dictionary = Object.create(null);
  const pairs = `
Игры|Games
Все игры|All games
Играть|Play
ИГРАТЬ|PLAY
Играть вместе|Play together
Ведущий|Host
Панель ведущего|Host panel
Пульт ведущего|Host controller
Закрыть панель ведущего|Close host panel
Мой пульт|My controller
Твой пульт|Your controller
ТВОЙ ПУЛЬТ|YOUR CONTROLLER
ТВОЙ ХОД|YOUR TURN
ТВОЙ ХОД · СПОКОЙНО|YOUR TURN · TAKE YOUR TIME
Твой ход!|Your turn!
Не твой ход|Not your turn
Сейчас не твой ход|Not your turn yet
Дождись своего хода|Wait for your turn
Настройки|Settings
Настройка|Setup
Настройки раунда|Round settings
Настройки выбранной игры|Game settings
Настройки применены|Settings applied
Профиль|Profile
Язык|Language
Имя|Name
Имя игрока|Player name
Твоё имя|Your name
Ваше имя|Your name
Как тебя зовут?|What is your name?
Кто ты?|Who are you?
КТО ТЫ?|WHO ARE YOU?
Войти|Join
ВОЙТИ|JOIN
ВОЙТИ В ИГРУ|JOIN GAME
Войти в игру|Join game
Войди в игру|Join the game
Заходи в игру|Join the game
Готов|Ready
ГОТОВ|READY
ГОТОВО!|READY!
Готово!|Done!
Я готов|I'm ready
Я ЗАДАЛ ВОПРОС|I ASKED A QUESTION
Я ЗНАЮ ЛОКАЦИЮ|I KNOW THE LOCATION
Я УВИДЕЛ — ГОТОВ|I HAVE SEEN IT — READY
Пауза|Pause
Продолжить|Resume
Продолжить матч|Resume match
Игра на паузе|Game paused
Игра идёт|Game in progress
Играем.|Let's play.
Старт|Start
Старт ▶|Start ▶
Начать|Start
НАЧАТЬ|START
Начать сейчас ▶|Start now ▶
НАЧАТЬ БЕЗ ОЖИДАНИЯ|START NOW
НАЧАТЬ БОЙ · 90 СЕКУНД|START BATTLE · 90 SECONDS
НАЧАТЬ ИГРУ|START GAME
НАЧАТЬ ШОУ|START SHOW
Запускаем…|Starting…
Подготавливаем…|Preparing…
Подготавливаем комнату…|Preparing the room…
Соединяем меню с приложением…|Connecting the menu to the app…
Соединяем управление с экраном…|Connecting your controller…
Восстанавливаем связь…|Reconnecting…
Восстанавливаем связь|Reconnecting
Связь потеряна — подключаемся снова…|Connection lost — reconnecting…
Комната готова|Room ready
Локальный сервер недоступен|Local server unavailable
Локальный сервер не отвечает|Local server is not responding
Сервер недоступен|Server unavailable
сервер онлайн|server online
На связи|Connected
Подключён|Connected
Подключено|Connected
подключено|connected
онлайн|online
офлайн|offline
не готов|not ready
готовы|ready
готов|ready
В игре|In game
в игре|in game
В лобби|Back to lobby
В ЛОББИ|BACK TO LOBBY
В общее лобби|Back to lobby
В общее ожидание|Back to waiting room
Лобби|Lobby
ЛОББИ|LOBBY
лобби|lobby
Закрыть|Close
Закрыть игру|Close game
Отмена|Cancel
Отменить|Cancel
Подтвердить|Confirm
Да, отправить|Yes, send
Удалить|Remove
Убрать|Remove
Убрать бота|Remove bot
Добавить бота|Add bot
Боты|Bots
Демо с ботами|Bot demo
Повторить|Retry
Повторить запуск|Retry launch
Ещё раз|Play again
ЕЩЁ РАЗ|PLAY AGAIN
Сыграть ещё раз|Play again
Ещё раунд|Another round
Ещё турнир|Another tournament
Ещё одна смена|Another shift
ЕЩЁ БАШНЮ|BUILD AGAIN
ЕЩЁ БОЙ · 90 СЕКУНД|BATTLE AGAIN · 90 SECONDS
Игрок|Player
Игроки|Players
ИГРОКИ|PLAYERS
ИГРОКОВ|PLAYERS
Игроки и счёт|Players and scores
Все капитаны и счёт|Captains and scores
Игроки подключены — можно начинать|Players connected — ready to start
Кто в комнате|Who's in the room
Кто здесь|Who's here
Все здесь.|Everyone is here.
Все на месте?|Is everyone here?
Ждём остальных|Waiting for others
Ждём игроков.|Waiting for players.
Ждём готовности компании|Waiting for everyone to be ready
Ждём старта|Waiting to start
Ждём старта на общем экране|Waiting for the shared screen to start
Ждём, пока ведущий запустит раунд|Waiting for the host to start the round
ЖДЁМ СТАРТ НА КОМПЬЮТЕРЕ|WAITING FOR THE HOST
Ведущий запускает матч|The host starts the match
Ведущий начнёт стройку|The host will start construction
Ведущий запустит матч из хаба. Смотри на общий экран.|The host will start from the lobby. Watch the shared screen.
Ты уже подключён.|You are already connected.
Ты уже подключён. На большом экране выберите игру.|You are connected. Choose a game on the shared screen.
Ты в игре. Ждём старт на компьютере.|You are in. Waiting for the host to start.
Ты в лобби|You are in the lobby
Ты подключился в другой вкладке|You connected in another tab
Игрок подключился в другой вкладке|Player connected in another tab
Другая вкладка|Another tab
Тебя убрали из лобби|You were removed from the lobby
Наблюдение|Spectating
Наблюдает|Spectating
наблюдатель|spectator
Ты наблюдатель|You are spectating
Ты смотришь. Вступишь в следующий матч.|You are spectating. Join in the next match.
Следующий матч — твой|You're in the next match
ЖДИ СЛЕДУЮЩИЙ РАУНД|WAIT FOR THE NEXT ROUND
ЖДИ…|WAIT…
Следующий раунд сейчас начнётся.|The next round is about to start.
Следующий раунд запускается с компьютера.|The host starts the next round.
Следующий матч запускается с компьютера.|The host starts the next match.
Ты выбыл. Следи за общим экраном.|You are out. Watch the shared screen.
ВЫБЫЛ|OUT
На арене|In the arena
На большом экране|On the shared screen
На весь экран|Full screen
Смотри на общий экран|Watch the shared screen
Смотри на большой экран.|Watch the shared screen.
СМОТРИ НА БОЛЬШОЙ ЭКРАН|WATCH THE SHARED SCREEN
СМОТРИ НА ЭКРАН|WATCH THE SCREEN
СМОТРИ НА БОЛЬШОЙ ЭКРАН · НЕ ВЕДИСЬ НА ФЕЙКИ|WATCH THE SCREEN · IGNORE FAKE SIGNALS
Смотри общий рейтинг на большом экране.|See the full standings on the shared screen.
Текущая игра|Current game
Название игры|Game title
Найти игру|Find a game
Выберите игру|Choose a game
Выбери игру стрелками|Use the arrows to choose a game
Выбор ведущего|Host's choice
ВЫБОР ВЕДУЩЕГО|HOST'S CHOICE
Каталог загружается|Loading games
Экран не подключён|No screen connected
Экран в браузере · бета|Browser screen · beta
Проверить экран|Check screen
Общий экран|Shared screen
общий экран|shared screen
Телефоны|Phones
ТЕЛЕФОНЫ|PHONES
КОНТРОЛЛЕРЫ|CONTROLLERS
УПРАВЛЕНИЕ|CONTROLS
Как играть|How to play
Все правила|Full rules
Правила|Rules
КАК ПОБЕДИТЬ|HOW TO WIN
Управление матчем|Match controls
Статус матча|Match status
СТАТУС|STATUS
Твой результат|Your result
Твои результаты|Your results
Итоги матча|Match results
Итоги вечера|Tonight's results
Итоги — на общем экране.|Results are on the shared screen.
Итоговый рейтинг|Final standings
ИТОГИ|RESULTS
ИТОГ|RESULT
ФИНАЛЬНЫЙ РЕЙТИНГ|FINAL STANDINGS
МЕСТО|PLACE
ВСЕГО|TOTAL
Всего|Total
Лучший|Best
ЛУЧШАЯ|BEST
ЛУЧШАЯ СЕРИЯ|BEST STREAK
МИМО|MISS
Мимо|Miss
мимо|miss
Точно в цель!|Right on target!
ГОТОВ БИТЬ|READY TO PUNCH
БЕЙ!|PUNCH!
Твой удар|Your punch
Готовимся к ударам|Getting ready to punch
ГОТОВИМСЯ|GET READY
ЗАМЕР|MEASURING
ТАП!|TAP!
ТАПНИ В НУЖНЫЙ МОМЕНТ|TAP AT THE RIGHT MOMENT
Тапай быстрее!|Tap faster!
ВЗМАХ ↑|FLAP ↑
ПАС|PASS
ОГОНЬ|FIRE
Огонь|Fire
ВЫСТРЕЛ|SHOOT
СТРЕЛЯЙ!|DRAW!
НЕ УСПЕЛ|TOO LATE
ФАЛЬСТАРТ|FALSE START
ФАЛЬСТАРТЫ|FALSE STARTS
ВЫСТРЕЛ / ОСЫПАНИЕ|SHOT / LANDSLIDE
Выстрел / осыпание|Shot / landslide
Снаряд в полёте|Projectile in flight
ВЫТЯНУТЬ|PULL
ВЕРНУТЬ|PUSH BACK
ВЫБРАННЫЙ БЛОК|SELECTED BLOCK
ВЛЕВО|LEFT
ВПРАВО|RIGHT
ЛЕВЫЙ|LEFT
ПРАВЫЙ|RIGHT
СРЕДНИЙ|MIDDLE
ЛЕВША|LEFT-HANDED
Левша|Left-handed
Левая рука|Left hand
Правая рука|Right hand
Удобная рука|Preferred hand
Как держишь управление|Choose your control hand
Сменить ведущую руку|Switch control hand
Сменить шарик|Swap marble
СМЕНИТЬ ↔|SWAP ↔
ДВИЖЕНИЕ / ПРИЦЕЛ|MOVE / AIM
ДВИЖЕНИЕ ЗАМОРОЖЕНО|MOVEMENT FROZEN
ВЕДИ ПАЛЬЦЕМ|DRAG TO MOVE
ВЕДИ ПАЛЬЦЕМ · СМОТРИ НА ЭКРАН|DRAG TO MOVE · WATCH THE SCREEN
ВЕДИ ПАЛЬЦЕМ · ТОЛКАЙ ИХ ЗА КРАЙ|DRAG TO MOVE · PUSH THEM OVER THE EDGE
ЗАЖАТЬ · ЕХАТЬ|HOLD · DRIVE
Удерживай для стрельбы|Hold to fire
Движение влево|Move left
Движение вправо|Move right
Двигаться влево|Move left
Двигаться вправо|Move right
Двигать кран|Move crane
Сбросить один блок|Drop one block
СБРОС|DROP
Сброс|Drop
Тачпад прицеливания|Aiming touchpad
Веди прицел по мини-полю|Aim on the mini field
Води пальцем, как по тачпаду|Move your finger like a touchpad
Джойстик вытягивания блока|Block-pulling joystick
Джойстик: веди пальцем для движения или поворота|Joystick: drag to move or turn
Выбери блок|Choose a block
Выбери блок и осторожно вытягивай.|Choose a block and pull it carefully.
Выберите свободный блок ближе к верху.|Choose a loose block near the top.
Боковое давление|Side pressure
УСИЛИЕ|FORCE
НАКЛОН БЛОКОВ|BLOCK TILT
БЛОКОВ|BLOCKS
Башня успокаивается…|The tower is settling…
Ждём башню…|Waiting for the tower…
Тянем|Pulling
Возвращаем|Pushing back
МОЩНОСТЬ|POWER
Мощность выстрела|Shot power
УГОЛ СТВОЛА|BARREL ANGLE
Угол ствола|Barrel angle
Увеличить силу|Increase power
Уменьшить силу|Decrease power
Увеличить угол|Increase angle
Уменьшить угол|Decrease angle
Выберите оружие|Choose a weapon
Следующее оружие|Next weapon
Предыдущее оружие|Previous weapon
Твой арсенал|Your arsenal
Арсенал готов|Arsenal ready
Все 144 варианта|All 144 variants
ВИДОВ ОРУЖИЯ|WEAPON TYPES
Варианты с пометкой «адаптация» не повторяют оригинальную механику полностью.|Variants marked “adapted” do not reproduce the original mechanics in full.
Угол и сила задают начальную траекторию.|Angle and power set the initial trajectory.
Ветер меняется каждый ход. Попадания дают очки, самоповреждение — штраф.|Wind changes each turn. Hits score points; self-damage costs points.
НАТЯНИ|DRAW
Натяжение|Draw
Наведи. Натяни. Отпусти.|Aim. Draw. Release.
Наведи камеру на экран|Point your camera at the screen
Держи экран в кадре|Keep the screen in view
Экран найден|Screen found
Сначала найдите экран|Find the screen first
Центр|Center
Центр установлен|Center set
Базовый трекинг|Basic tracking
Трекинг готов|Tracking ready
Загружаем трекинг…|Loading tracking…
Без камеры · сенсорный прицел|No camera · touch aiming
Доступ к камере не разрешён. Разрешите его в настройках или используйте сенсорный пульт.|Camera access was denied. Enable it in settings or use touch controls.
Включить датчик движения|Enable motion sensor
Датчик|Sensor
Датчик подключён|Sensor connected
Чувствительность датчика|Motion sensitivity
Держи телефон ровно…|Hold your phone steady…
Запрашиваем доступ к движению…|Requesting motion access…
Доступ получен. Ждём данные датчика…|Access granted. Waiting for sensor data…
Данные движения не поступают. Проверь доступ в браузере или используй кнопку.|No motion data. Check browser permissions or use the button.
Доступ к движению не разрешён. Можно повторить запрос или играть кнопкой.|Motion access was denied. Try again or use the button.
Браузер не дал доступ к движению. Используй кнопку или повтори запрос.|The browser denied motion access. Use the button or try again.
Нажми «Готов бить», затем сделай удар.|Tap “Ready to punch”, then make a short punch.
Зажми кнопку и отпусти на пике.|Hold the button and release at the peak.
Зажми кнопку, наведи телефон и отпусти|Hold the button, aim your phone and release
Три попытки. Когда придёт твоя очередь, нажми «Готов бить», затем сделай короткий удар. Без датчика: зажми кнопку и отпусти на пике шкалы.|Three attempts. On your turn, tap “Ready to punch”, then make a short punch. Without a sensor, hold the button and release at the meter's peak.
ФИНИШ|FINISH
ФИНАЛ|FINAL
МАТЧ|MATCH
МАТЧ ОКОНЧЕН|MATCH OVER
Матч окончен|Match over
Матч завершён|Match complete
Матч закончен|Match over
ИГРА ОКОНЧЕНА|GAME OVER
БОЙ ИДЁТ|BATTLE IN PROGRESS
БОЙ ОКОНЧЕН|BATTLE OVER
Бой окончен|Battle over
Бой завершён|Battle complete
Бой завершён. Итоги выше.|Battle complete. Results are above.
ТУРНИР ОКОНЧЕН|TOURNAMENT OVER
Шоу окончено|Show over
Смена окончена|Shift over
Время|Time
ВРЕМЯ ХОДА|TURN TIME
Время хода|Turn time
Время закончилось.|Time is up.
Время вышло · можно закончить|Time is up · ready to finish
Можно заканчивать|Ready to finish
Завершить ход|End turn
Число раундов|Number of rounds
Раунд|Round
Раунды|Rounds
Раундов|Rounds
Ходов|Turns
Всего ходов|Total turns
Секунд|Seconds
Секунд на ответ|Seconds per answer
На ответ|To answer
На рисунок|To draw
Вопрос|Question
Вопросов|Questions
Категория|Category
Формат|Format
Команды|Teams
КОМАНДЫ|TEAMS
Две команды|Two teams
Выбери команду|Choose a team
Твоя команда|Your team
Каждый за себя|Free-for-all
Друг против друга|Versus
Вместе|Together
Вдвоём|Two players
Можно обсуждать!|You can discuss!
Выберите один ответ.|Choose one answer.
Выберите формат. Все отвечают одновременно.|Choose a format. Everyone answers at the same time.
Ждём следующий вопрос.|Waiting for the next question.
Вы уже в игре. Отвечаете со следующего вопроса.|You are in. Answer from the next question.
Слушай вопрос|Listen to the question
Голос принят|Vote accepted
Голос изменить нельзя.|You cannot change your vote.
ЗАВЕРШИТЬ ГОЛОСОВАНИЕ|END VOTING
Голоса разделились.|The vote is tied.
Голоса разделились. В этот раз шпиону повезло.|The vote is tied. The spy got lucky this time.
Кто шпион?|Who is the spy?
Ты шпион|You are the spy
Шпион|Spy
Шпионов|Spies
Мирные победили|The civilians win
Мирный победил|The civilian wins
Шпион победил|The spy wins
Шпион пойман!|Spy caught!
Шпион ошибся|The spy was wrong
Шпион спасён|The spy is safe
Шпион ускользнул|The spy escaped
Шпион угадал место|The spy guessed the location
Локация была угадана.|The location was guessed.
Мирные вычислили шпиона.|The civilians found the spy.
Город победил. Подозреваемый оказался шпионом.|The town wins. The suspect was the spy.
Группа обвинила не того игрока.|The group accused the wrong player.
Шпион ошибся с локацией.|The spy guessed the wrong location.
Шпион рискнул угадать локацию и промахнулся.|The spy risked a guess and got the location wrong.
Шпион сделал финальную попытку и попал точно.|The spy got the final guess right.
Время дуэли вышло. Шпион не угадал локацию.|Time is up. The spy did not guess the location.
Это финальная попытка.|This is the final attempt.
Финальная попытка|Final attempt
ТОЛЬКО ДЛЯ ТЕБЯ · НЕ ПОКАЗЫВАЙ ЭКРАН|FOR YOUR EYES ONLY · KEEP YOUR SCREEN HIDDEN
УДЕРЖИВАЙ, ЧТОБЫ ПОСМОТРЕТЬ|HOLD TO REVEAL
Слушай внимательно. Несостыковки выдают шпиона.|Listen carefully. Contradictions expose the spy.
Задай один вопрос вслух и передай ход дальше.|Ask one question aloud, then pass the turn.
Слово увидит только актёр на своём телефоне.|Only the actor can see the word on their phone.
Актёр|Actor
Угадали +100|Guessed +100
Угадали?|Guessed it?
Пропуск|Skip
УГАДАТЬ|GUESS
Твоя догадка|Your guess
Что нарисовано?|What is being drawn?
Введи, что видишь на рисунке.|Type what you see in the drawing.
Твой рисунок|Your drawing
Закончить рисунок|Finish drawing
ТОЧНО ЗАКОНЧИЛ?|READY TO SEND?
Ещё дорисую|Keep drawing
Нарисуйте свою часть перед отправкой|Draw your part before sending
ТВОЯ ЧАСТЬ|YOUR PART
МОНСТР|MONSTER
Отправить|Send
Толщина кисти|Brush thickness
Тонкая|Thin
Толстая|Thick
Ластик|Eraser
Очистить|Clear
Угадывайте вслух. Секретный экран — только у актёра.|Guess aloud. Only the actor sees the secret screen.
Верно! Помоги сохранить интригу.|Correct! Keep it secret for the others.
Слово раскрыто. Следующий рисунок через 3 секунды.|Word revealed. Next drawing in 3 seconds.
Ход окончен. Следующий актёр через 3 секунды.|Turn over. Next actor in 3 seconds.
Актёр переподключается. Слово сохранено, таймер идёт.|Actor reconnecting. The word is saved; the timer continues.
Ты в игре! Угадывай вслух, показать сможешь в следующем ходе.|You are in! Guess aloud; you can act on a later turn.
Ты в игре. Угадываешь со следующего рисунка.|You are in. Guess from the next drawing.
Аплодисменты актёрам!|A round of applause for the actors!
На большом экране рисунок скрыт.|The drawing is hidden on the shared screen.
Следующий игрок увидит только узкую полоску стыка.|The next player sees only a narrow connecting strip.
Выбирай цель|Choose a target
Выбери соперника|Choose an opponent
Имя капитана|Captain's name
Капитанский мостик|Captain's bridge
Твой флот потоплен. Наблюдай за оставшимися капитанами.|Your fleet is sunk. Watch the remaining captains.
Ты в игре как наблюдатель. Твой флот выйдет в следующем матче.|You are spectating. Your fleet joins the next match.
Мой флот · только для тебя|My fleet · private
На плаву|Afloat
Залп отправлен|Shot fired
Финальный залп|Final shot
Флот уже готов.|Your fleet is ready.
Флоты выходят в море|The fleets are setting sail
Три корабля. Пять палуб. Один победитель.|Three ships. Five decks. One winner.
Три корабля. Пять палуб. Автоматическая расстановка.|Three ships. Five decks. Automatic placement.
У ТЕБЯ!|YOU HAVE IT!
БОМБА|BOMB
ДОГОНИ КОГО-НИБУДЬ И КОСНИСЬ|CATCH SOMEONE AND TAG THEM
УБЕГАЙ ОТ БОМБЫ · НЕ ДАЙ СЕБЯ КОСНУТЬ|RUN FROM THE BOMB · DON'T GET TAGGED
НОЖИ|KNIVES
НОЖЕЙ|KNIVES
ЧУЖОЙ ЦВЕТ|WRONG COLOR
ДО ФИНАЛА|UNTIL THE FINAL
НА БРОСОК|TO THROW
БРОСОК|THROW
ТВОЙ БРОСОК|YOUR THROW
КАМЕНЬ ИДЁТ|STONE IN MOTION
ШАР В ИГРЕ|BALL IN PLAY
ДЕРЖИ, ЧТОБЫ ТЕРЕТЬ ЛЁД|HOLD TO SWEEP
ТРЁМ ЛЁД!|SWEEPING!
СВИП|SWEEP
Свип|Sweep
Считаем энд|Scoring the end
СЧЁТ ЭНДА|END SCORE
ЭНД · ХОД|END · TURN
Эндов|Ends
Фреймов|Frames
ФРЕЙМ|FRAME
КЕГЛИ|PINS
СТРАЙК!|STRIKE!
СПЭР!|SPARE!
ВОЛНА|WAVE
Волн|Waves
ВОРОТА|GATE
НА ПОЛЕ · В РОЕ|ON FIELD · IN SWARM
ВКЛЮЧИТЬ ПУЛЕМЁТ|ACTIVATE MACHINE GUN
МИРНЫЙ! −15|CIVILIAN! −15
Перегрев|Overheating
перегрев|overheating
Импульс|Pulse
ИМПУЛЬС|PULSE
КОМБО|COMBO
Тестовые игроки, очки не записываются.|Test players; scores are not saved.
Боты играют через общий экран — подключи телевизор.|Bots use the shared screen — connect a TV.
После запуска каждый нажимает «Я готов» на своём пульте.|After launch, everyone taps “I'm ready” on their controller.
Сначала подключи общий экран.|Connect the shared screen first.
Подключи общий экран в панели ведущего.|Connect a shared screen in the host panel.
Подтверждаем выбор игры…|Confirming game selection…
Правила указаны на общем экране.|Rules are shown on the shared screen.
Закончить игру?|End the game?
Текущий матч завершится для всей компании.|The current match will end for everyone.
Пока никого. Открой свой пульт или пригласи друзей.|Nobody here yet. Open your controller or invite friends.
Контроллер отключится. Остальные игроки продолжат.|This controller will disconnect. Other players can continue.
Во время игры держи приложение открытым.|Keep the app open during play.
Устройства должны быть в одной сети без изоляции клиентов.|Devices must share one network with client isolation disabled.
Сначала включи доступ по Wi-Fi.|Enable Wi-Fi access first.
Включаем доступ по Wi-Fi для гостей…|Enabling Wi-Fi access for guests…
Выключить доступ по Wi-Fi?|Disable Wi-Fi access?
Телефоны гостей отключатся. AirPlay и твой встроенный пульт останутся.|Guest phones will disconnect. AirPlay and your built-in controller will stay connected.
Гости открывают игру по HTTPS без установки сертификата. Игровое соединение остаётся в вашей сети Wi-Fi.|Guests join over HTTPS without installing a certificate. Gameplay stays on your Wi-Fi network.
Настраиваем локальный HTTPS и получаем сертификат…|Setting up local HTTPS and obtaining a certificate…
Адрес Wi-Fi изменился. Нажми переключатель, чтобы обновить HTTPS.|The Wi-Fi address changed. Tap the switch to refresh HTTPS.
Сбросить статистику?|Reset statistics?
Сбросить статистику|Reset statistics
Очки и история матчей будут очищены. Профили игроков сохранятся.|Scores and match history will be cleared. Player profiles will be kept.
Статистика компании|Party statistics
Копировать|Copy
Скопировать адрес|Copy address
Ссылка скопирована|Link copied
Включён|On
Включена|On
Включено|On
Включены|On
Выключен|Off
Выключена|Off
Выключено|Off
Выключены|Off
Звук включён|Sound on
Звук выключен|Sound off
Звук: вкл.|Sound: on
Звук: выкл.|Sound: off
Браузер не разрешил звук.|The browser blocked audio.
Не загрузился общий каталог интерфейса. Проверь ресурсы сборки.|The shared game catalog did not load. Check the app's bundled resources.
Подготавливаем игры на этом iPhone…|Preparing games on this iPhone…
Открой LocalParty в приложении iPhone.|Open HeyPals in the iPhone app.
Восстанавливаем связь с приложением…|Reconnecting to the app…
Восстанавливаем каталог сервера. Список игр сохранён.|Restoring the server catalog. Your game list is saved.
не загружено|not loaded
ожидание|waiting
Арена|Arena
Сужающаяся арена|Shrinking arena
На меткость|Precision
Догонялки|Tag
Дуэль|Duel
Танковые бои|Tank battles
Джойстик · 4 оружия|Joystick · 4 weapons
Кооператив|Co-op
Гонки|Racing
Рисование|Drawing
Разговорная|Conversation
Квиз · 150 вопросов|Quiz · 150 questions
Соло или команды|Solo or teams
150 мест и историй|150 places and stories
Покажи без слов|Act it out
Блоки и равновесие|Blocks and balance
Кран и качающаяся башня|Crane and swaying tower
Выбери клетку — огонь|Pick a square — fire
Кисть против догадок|Brush versus guesses
Один против одного|One-on-one
Забег на тапах|Tap racing
Удар по груше|Punching bag
Общий полёт|Flying together
Съедобная арена|Eat-or-be-eaten arena
Неоновый след|Neon trails
Командная аркада|Team arcade
Шарики · co-op / versus|Marbles · co-op / versus
Ретро-артиллерия|Retro artillery
AR / стрельба из лука|AR / archery
Кёрлинг · команды|Curling · teams
Боулинг · 3D|Bowling · 3D
Кооп · оборона дока|Co-op · dock defense
Тир · комбо|Shooting gallery · combos
Последний круг|Last Circle
Монстр по кругу|Pass the Monster
Синяк-миллионер|Sinyak Millionaire
Синяк: квиз-компания|Sinyak: Party Quiz
Синяк: командный квиз|Sinyak: Team Quiz
Прикольная Варшава|Warsaw Discoveries
Крокодил|Charades
Тихо, дженга!|Careful, Jenga!
Башня терпения|Tower of Patience
БАШНЯ ТЕРПЕНИЯ|TOWER OF PATIENCE
Ночная стройка|Night Shift
Быстрый морской бой|Quick Battleships
Морской бой|Battleships
Рисуй — угадай|Draw & Guess
Двое на закате|Two at Sunset
Лёд и нервы|Ice & Nerves
Не грызи ворота!|Don't Bite the Gate!
Кто тут вылез?|Who's Popping Up?
из архива|archive edition
Мята|Mint
Лаванда|Lavender
Лайм|Lime
Манго|Mango
Фреш|Fresh
Бирюзовая|Turquoise
Бирюзовые|Turquoise
Коралловая|Coral
Коралловые|Coral
Тренировка|Practice
Чемпион|Champion
Капитан|Captain
Боец|Fighter
Любитель|Amateur
Лучник|Archer
Ковбой|Cowboy
Танкист|Tank driver
Строитель|Builder
СТРОИТЕЛЬ|BUILDER
Мягко|Gentle
Чутко|Sensitive
игроков|players
игрока|players
игрок|player
очков|points
очка|points
очко|point
побед|wins
победы|wins
победа|win
матчей|matches
матча|matches
матч|match
игр|games
игры|games
игра|game
секунд|seconds
сек|sec
мин|min
мс|ms
готовит бросок|preparing to throw
в очереди|in queue
считаем кегли|counting pins
шар на дорожке|ball on lane
камень|stone
подкрутка|spin
стрел|arrows
раунд окончен|round over
попадание|hit
потопление|sinking
потоплен|sunk
потоплено|sunk
ошибок|errors
пропущено|missed
лучшее|best
лучший|best
сейчас|now
дальше|next
следующий раунд…|next round…
загрузка…|loading…
голосование|voting
смотрим роли|checking roles
секретная раздача|secret roles
вопросов|questions
ответил верно.|answered correctly.
отвечает|answering
спрашивает|asking
смотрит роль…|viewing role…
левая|left
правая|right
левый|left
правый|right
средний|middle
фрейм|frame
ход|turn
ходов|turns
серия|streak
целей|targets
уровней|levels
попаданий|hits
фальстартов|false starts
у ворот|at the gate
осталось|remaining
ты|you
`;
  const gameCopy = `
Твой ход|Your turn
Восстанавливаем комнату…|Restoring the room…
Нет связи с локальным сервером.|Cannot reach the local server.
Применить язык ко всем|Apply language to everyone
Переключить язык у всех игроков? Каждый сможет изменить его снова.|Change the language for all players? Everyone can change it again.
В ГОНКУ|JOIN RACE
ВРЕМЯ|TIME
ГАЗ|THROTTLE
ГОНЩИКИ|RACERS
ЖДЁМ СТАРТА|WAITING TO START
ЗАЕЗД|RACE
ЗАНОВО|AGAIN
Займи свой карт.|Take your kart.
ИМЯ ГОНЩИКА|RACER NAME
Игрок подключён в другой вкладке|Player connected in another tab
КРУГ|LAP
КРУГИ|LAPS
Круги|Laps
ЛЕВАЯ|LEFT
ПРАВАЯ|RIGHT
ЛУЧШИЙ|BEST
НОЧНОЙ КАРТИНГ|NIGHT KARTING
Назови себя и выбери удобную руку. Телефон станет твоим пультом.|Enter your name and choose your control hand. Your phone becomes your controller.
Настройки заезда|Race settings
Отпусти — руль в центр|Release to center the steering
ПОВОРОТ|STEERING
ПОВОРОТЫ|TURNS
ПОДКЛЮЧЕНИЕ|CONNECTING
ПРЯМО|STRAIGHT
ПРЯМЫЕ · ШПИЛЬКА ·|STRAIGHTS · HAIRPIN ·
СКОРОСТЬ|SPEED
СТАРТ|START
Сменить руки|Switch hands
УДОБНАЯ РУКА|CONTROL HAND
место · круг · лучший|place · lap · best
Разгоняйся, толкай соперников и оставайся на арене. Инерция решает.|Build speed, push rivals and stay in the arena. Momentum matters.
Веди виртуальный джойстик. Инерция помогает разогнаться и вытолкнуть соперника.|Move the virtual joystick. Use momentum to build speed and push rivals out.
Вытолкни остальных за край. Здесь арена остаётся одного размера.|Push everyone else over the edge. This arena stays the same size.
Последний живой берёт раунд; больше побед в раундах — победа в матче.|The last survivor wins the round. Win the most rounds to win the match.
Входишь сразу; если уже выбыл, перезагрузка не оживит — дождись следующего раунда.|Join immediately. Reloading cannot revive an eliminated player; wait for the next round.
Арена медленно исчезает под ногами. Толкай соперников и удерживай центр.|The arena shrinks beneath your feet. Push rivals out and hold the center.
Двигай виртуальный джойстик. Ведущий выбирает обычное сужение или быстрое: в быстром режиме арена уменьшается сразу и достигает минимума за 20 секунд.|Move the virtual joystick. The host chooses normal or fast shrinking. Fast mode starts shrinking immediately and reaches its minimum size in 20 seconds.
Удерживайся в круге, который постепенно становится меньше. Используй инерцию, чтобы толкнуть соперника.|Stay inside the shrinking circle. Use momentum to push rivals out.
Последний оставшийся забирает раунд. У края становится всё опаснее.|The last survivor wins the round. The edge gets increasingly dangerous.
Подключайся в любой момент: получишь джойстик текущей игры.|Join at any time to get the current game's joystick.
Попади ножом в свой цвет на вращающейся мишени. Лови момент и не промахнись.|Hit your color on the spinning target. Time your throw and don't miss.
Касайся кнопки броска, когда твой сектор проходит перед ножом.|Tap throw when your color passes in front of the knife.
Бросай ножи в сектор своего цвета на вращающемся барабане.|Throw knives into your color on the spinning drum.
Точные попадания дают очки. После всех раундов побеждает лучший результат.|Accurate hits earn points. The highest score after all rounds wins.
Новому игроку добавляется собственный цвет и контроллер в текущей игре.|New players receive their own color and controller in the current game.
Бомба у тебя? Передай её касанием и успей убежать до взрыва.|Got the bomb? Tag someone and run before it explodes.
Джойстик: догоняй соперников с бомбой и убегай от неё без бомбы.|Use the joystick to chase rivals when you have the bomb, or flee when you don't.
Если бомба у тебя — догони другого и коснись его. Без бомбы держись подальше.|With the bomb, catch and tag another player. Without it, keep your distance.
Переживи взрывы. Побеждает тот, кто чаще остаётся последним в раундах.|Survive the explosions. The player who wins the most rounds wins the match.
Входишь на текущую арену. Уже выбывшие ждут следующий раунд.|Join the current arena. Eliminated players wait for the next round.
Кто выстрелит первым? Жди настоящего сигнала и не попадись на обманку.|Who shoots first? Wait for the real signal and ignore the fakes.
Одна кнопка выстрела. Нажимай только после сигнала DRAW! на общем экране.|One fire button. Press only after DRAW! appears on the shared screen.
Жди настоящего DRAW! На ложные сигналы не стреляй.|Wait for the real DRAW! Don't shoot at fake signals.
Самый быстрый правильный выстрел выигрывает дуэль. Фальстарт или опоздание — поражение в раунде.|The fastest valid shot wins. A false start or late shot loses the round.
Подключайся сразу; если текущая дуэль уже решена, следующая начнётся автоматически.|Join immediately. If the current duel is over, the next starts automatically.
Арена, командные сражения и совместное выживание.|Arena battles, team fights and co-op survival.
Две кнопки: движение вперёд и огонь. Можно выбрать левую руку.|Two buttons: move forward and fire. Left-handed layout available.
Твой танк сам поворачивается, когда не едешь. Удерживай движение, чтобы ехать прямо, и огонь, чтобы стрелять.|Your tank turns while stopped. Hold move to drive straight and hold fire to shoot.
Выбери в приложении ведущего выживание, флаги или совместного босса. У каждого режима своя цель на экране.|The host chooses survival, flags or a co-op boss. Each mode shows its objective on screen.
Подключаешься к текущему режиму; восстановленный игрок сохраняет свой танк и результат.|Join the current mode. Returning players keep their tank and score.
Управляй танком, подбирай случайное оружие и собирай фраги на арене.|Drive your tank, collect random weapons and score arena kills.
Левый джойстик — движение и направление пушки. Справа — удерживать огонь. Цветные ящики меняют оружие.|Left joystick moves and aims your tank. Hold fire on the right. Colored crates change your weapon.
Сражайся на арене и подбирай оружие: обычная пушка, дробовик, скорострельный бластер и тяжёлый снаряд.|Fight in the arena and collect weapons: cannon, shotgun, rapid blaster and heavy shell.
За уничтожение +100. Матч длится 90 секунд; выигрывает максимальный счёт. После гибели возрождаешься.|Each kill earns 100 points. Highest score after 90 seconds wins. You respawn after being destroyed.
Новый игрок появляется сразу. После возрождения краткий щит защищает от мгновенного поражения.|New players spawn immediately. A brief respawn shield prevents an instant defeat.
Один курсор, все руки. Вместе пройдите 15 странных испытаний.|One cursor, everyone's hands. Beat 15 strange challenges together.
Каждый двигает свой джойстик: общий курсор следует среднему направлению. Дополнительная кнопка появляется только для нужного действия на уровне.|Everyone moves their joystick; the shared cursor follows the average direction. An extra button appears only when the level needs it.
Договоритесь и проведите общий курсор через каждое испытание.|Coordinate and guide the shared cursor through each challenge.
Проходите цели уровня до конца времени, сохраняя общие жизни. Победа и командный счёт общие.|Complete each objective before time runs out, preserving shared lives. Victory and score belong to the team.
Новый игрок сразу получает роль; при потере связи важные кнопки перераспределяются.|New players get a role immediately. Essential buttons are reassigned if a player disconnects.
Гоняйте по трассе со шпилькой и S-поворотами. Телефон — твой пульт.|Race through hairpins and S-bends. Your phone is your controller.
Двигай горизонтальный слайдер для поворота и удерживай газ. Отпусти слайдер — он вернётся в центр. Раскладку можно отзеркалить.|Steer with the horizontal slider and hold the throttle. Release to center the steering. You can mirror the layout.
Пройди круги по трассе быстрее остальных. Контрольные ворота нужно проезжать по порядку.|Finish your laps faster than everyone else. Pass checkpoints in order.
Пройди выбранное число кругов быстрее остальных. Таблица показывает место, круги и лучшее время.|Complete the selected number of laps first. The standings show place, laps and best time.
Подключившийся гонщик появляется на трассе; перезагрузка восстанавливает его машину.|New racers join the track. Reloading restores their car.
Рисуйте секретные части одного монстра, а потом смотрите, что получилось.|Draw secret parts of one monster, then reveal your creation.
Рисуй пальцем: палитра, толщина кисти и отмена на телефоне.|Draw with your finger. Your phone has colors, brush sizes and undo.
Каждый рисует одну тайную часть общего персонажа. Продолжай видимый стык сверху и оставляй линии снизу.|Each player draws a secret part. Continue the visible lines at the top and leave connecting lines at the bottom.
Здесь победа общая: завершите все части и раскройте монстра. В статистике сохраняются ваши рисунки.|Everyone wins together: finish all parts and reveal the monster. Your drawings are saved in the statistics.
Подключайся к очереди. При обновлении страницы твой незаконченный рисунок восстанавливается.|Join the queue. Reloading restores your unfinished drawing.
Все знают место, кроме шпиона. Задавайте вопросы и вычисляйте его.|Everyone knows the location except the spy. Ask questions and find them.
Секретная роль, готовность, передача хода и голосование на телефоне.|View your secret role, ready up, pass turns and vote on your phone.
У мирных есть место, у шпиона — только подсказка. Задавайте вопросы вслух, не выдавая место.|Civilians know the location; the spy only gets a hint. Ask questions aloud without revealing the location.
От 3 игроков — найдите шпиона голосованием, а шпион может угадать место. Вдвоём — дуэль: шпион угадывает место до конца таймера.|With 3 or more players, vote to catch the spy; the spy can guess the location. With 2 players, the spy must guess before time runs out.
Во время секретного раунда новый игрок смотрит без роли; полноценно вступает со следующего раунда.|New players spectate without a role during a secret round and fully join the next round.
Обсуждайте, рискуйте и выбирайте ответ. Кто заберётся выше по денежной лестнице?|Discuss, take risks and choose an answer. Who will climb highest on the money ladder?
Четыре варианта ответа и подсказки на телефоне. Общий вопрос — на экране.|Four answers and lifelines on your phone. The question is on the shared screen.
По очереди отвечайте на вопросы про Синяка и поднимайтесь по денежной лестнице.|Take turns answering questions about Sinyak and climb the money ladder.
Первый миллион или наибольшая сумма к окончанию ходов. Подсказки помогают, ошибки отбрасывают вниз.|Reach a million first or hold the most money after all turns. Lifelines help; mistakes send you down.
Новый участник встаёт в очередь вопросов; текущий отвечающий продолжает свой ход.|New players join the question queue. The current player keeps their turn.
150 вопросов про Синяка. Отвечайте каждый за себя или объединяйтесь в команды.|150 questions about Sinyak. Answer solo or join a team.
Выбери команду до старта. В соло отвечает каждый, в команде — капитан после обсуждения.|Choose teams before starting. Solo players answer individually; team captains answer after discussion.
Играйте каждый за себя или командами. Всем показывается один вопрос про Синяка.|Play individually or in teams. Everyone sees the same question about Sinyak.
Верные и быстрые ответы дают очки. У команды один ответ капитана; в соло каждый отвечает сам.|Correct, fast answers earn points. Captains submit one team answer; solo players answer individually.
Входишь на экран квиза сразу, в зачёт — со следующего вопроса. Принятый ответ сохраняется после обновления.|See the quiz immediately and start scoring from the next question. Accepted answers survive a reload.
Тусовочные споты, необычные места и городские открытия. Квиз на знание Варшавы.|Party spots, unusual places and city discoveries. Test your knowledge of Warsaw.
Выбери соло или команду. На телефоне четыре крупных варианта ответа; у команды отвечает капитан.|Play solo or in teams. Choose from four large answers on your phone; captains answer for teams.
Узнай Варшаву через необычные места, набережные, клубы, рынки и городские истории.|Discover Warsaw through unusual places, riverfronts, clubs, markets and city stories.
За верный ответ получай очки. Можно соревноваться по одному или командами с капитаном.|Correct answers earn points. Compete individually or in teams led by a captain.
Присоединяйся даже после старта: игра покажет текущий вопрос, отвечать начнёшь со следующего.|Join after the start to see the current question. Answer from the next question.
Показывай тайное слово жестами, пока компания угадывает вслух. Соло или команды.|Act out a secret word while everyone guesses aloud. Play solo or in teams.
Слово видит только актёр. Показывай без слов; «Угадали» засчитывает ответ, «Пропуск» даёт новое слово.|Only the actor sees the word. Act without speaking. “Guessed” scores the answer; “Skip” gives a new word.
Объясняй слова движениями и мимикой. В командах угадывает команда актёра; вдвоём играйте сообща.|Use gestures and expressions. In team mode, the actor's team guesses; two players work together.
Больше угаданных слов за свои ходы — выше счёт. В команде очки общие; вдвоём устанавливаете общий рекорд.|Guess more words to score more. Teams share points; two players aim for a shared record.
Подключайся сразу. Показывать начнёшь со следующего доступного хода; обновление сохраняет твоё слово и счёт.|Join immediately and act on the next available turn. Reloading keeps your word and score.
Вытягивайте блоки по очереди. Башня держится на опорах — одно неосторожное движение всё меняет.|Take turns pulling blocks. The tower relies on its supports; one careless move changes everything.
Убери блок из нижних слоёв, сохранив равновесие башни. Извлечённый блок отправится наверх.|Remove a block from lower layers without toppling the tower. The removed block goes on top.
Выбери слой и блок. Тяни джойстик вниз для извлечения, вверх для возврата, вбок для бокового усилия. Отклонение задаёт силу тяги; отпусти, чтобы перестать тянуть.|Choose a layer and block. Pull the joystick down to extract, up to return, or sideways to push. Distance controls force; release to stop.
Успешно извлекай блоки и передавай ход. Обрушивший башню проигрывает; итог покажет удачные извлечения каждого.|Remove blocks and pass the turn. Whoever topples the tower loses; results show everyone's successful pulls.
Новый участник входит в очередь. После обновления сохраняются башня и ход, зажатое действие отпускается.|New players join the queue. Reloading preserves the tower and turn, and releases held controls.
Один кран, вся бригада. Кладите блоки по очереди на башню, которая гнётся и качается.|One crane, the whole crew. Take turns stacking blocks on a bending, swaying tower.
По очереди стройте одну общую башню. Совмещайте груз с верхним этажом и учитывайте наклон.|Take turns building one shared tower. Align the load with the top floor and allow for tilt.
Удерживай стрелки, чтобы двигать кран. Нажми сброс, когда груз окажется над вершиной. На ход — 90 секунд.|Hold the arrows to move the crane. Tap drop above the tower. You have 90 seconds per turn.
Точные установки дают личные очки. Стройте выше, пока башня не обрушится или не случатся три промаха.|Accurate placements earn individual points. Build until the tower falls or you miss three times.
Присоединяйся к очереди сразу. Переподключение сохраняет твой счёт и текущую стройку.|Join the queue immediately. Reconnecting preserves your score and the current tower.
Флот уже расставлен. Выбирай соперника и клетку — все капитаны стреляют одновременно.|Fleets are ready. Choose an opponent and a square; all captains fire simultaneously.
Потопи чужие корабли и сохрани свой флот. У каждого поле 6×6 и пять палуб; расстановка автоматическая.|Sink enemy ships and protect your fleet. Each player has a 6×6 grid and five decks, placed automatically.
Выбери противника, затем нажми клетку его поля. Новый выстрел доступен раз в 2,5 секунды. Проверенные клетки видны всем.|Choose an opponent and tap a square on their grid. Fire once every 2.5 seconds. Checked squares are visible to everyone.
Последний уцелевший флот побеждает. Через три минуты сравниваются оставшиеся палубы, затем очки за попадания и потопления.|The last surviving fleet wins. After three minutes, remaining decks decide, then hit and sinking points.
Если бой уже идёт, наблюдай до следующего матча. Возвращение твоего профиля сохраняет флот и выстрелы.|Spectate until the next match if battle has started. Returning with your profile preserves your fleet and shots.
Один рисует, остальные угадывают на телефонах. Чем быстрее — тем больше очков.|One player draws, the others guess on their phones. Faster guesses earn more points.
Художник изображает секретное слово, остальные пытаются его угадать.|The artist draws a secret word while everyone else tries to guess it.
Художник рисует пальцем. Остальные вводят догадку в поле ответа. На рисунок — 30, 60 или 90 секунд; слово видит только художник.|The artist draws with a finger. Others type guesses. Each drawing lasts 30, 60 or 90 seconds; only the artist sees the word.
Очки получают угадавшие и художник. После раскрытия ход переходит дальше автоматически; победит набравший больше очков.|Correct guesses score for the guesser and artist. Turns advance automatically after the reveal. Highest score wins.
Новый участник вступает со следующего рисунка. Обновление возвращает ту же роль и уже засчитанные ответы.|New players join the next drawing. Reloading restores your role and accepted answers.
Два стрелка, один сигнал. Первый точный выстрел решает дуэль.|Two gunslingers, one signal. The first valid shot decides the duel.
Дождись сигнала и выстрели раньше соперника. Ранний выстрел — поражение.|Wait for the signal and shoot before your rival. An early shot loses.
Нажми «Огонь» после сигнала. Заранее удерживать кнопку бесполезно: нужен новый выстрел. Между дуэлями показывается очередь.|Tap “Fire” after the signal. Holding the button early won't work; you need a fresh press. The queue appears between duels.
Вдвоём играйте до двух побед. В компании каждый выйдет на арену дважды; победит набравший больше побед.|With two players, first to two wins. In a group, everyone enters twice; most wins takes the tournament.
Во время турнира можно смотреть дуэли и очередь. Новые стрелки вступают в следующем турнире, а вернувшийся игрок сохраняет своё место.|Watch duels and the queue during a tournament. New players join the next tournament; returning players keep their place.
Каждый тап — толчок вперёд. На экране все бегуны.|Every tap pushes you forward. All runners appear on screen.
Тапай как можно быстрее: каждый тап разгоняет бегуна. Никакой усталости.|Tap as fast as you can to accelerate. No stamina limit.
Первым доберись до финиша. Если время вышло — побеждает самый дальний бегун.|Reach the finish first. If time runs out, the furthest runner wins.
Можно подключиться по ходу игры с нулевым счётом. После потери связи тот же телефон сохраняет результат.|Join mid-game with zero points. The same phone keeps its score after reconnecting.
Три удара, качающаяся груша и твой лучший результат.|Three punches, a swinging bag and your best score.
Включи датчик и сделай короткое движение, крепко держа телефон. Без датчика зажми кнопку и отпусти на пике шкалы.|Enable motion and make a short movement while holding your phone firmly. Without a sensor, hold the button and release at the peak.
Побеждает сумма трёх ударов. Лучший удар показан отдельно.|The highest total from three punches wins. Your best punch is shown separately.
Летите вместе между трубами. Птицы не толкают друг друга.|Fly together between pipes. Birds don't collide with each other.
Тап — взмах вверх. Избегай труб, пола и потолка.|Tap to flap upward. Avoid pipes, the floor and the ceiling.
Самая дальняя дистанция за 30 секунд.|Fly the furthest in 30 seconds.
Собирай еду, расти и съедай маленьких. Возвращайся сразу после поражения.|Collect food, grow and eat smaller rivals. Respawn immediately after defeat.
Джойстик — движение. Чем крупнее, тем медленнее.|Use the joystick to move. Bigger players move more slowly.
Самая большая масса через две минуты.|Have the most mass after two minutes.
Оставляй след и отрезай соперникам путь.|Leave a trail and cut off your rivals.
Джойстик указывает направление на экране. Отпусти — змейка продолжит движение.|Point the joystick in your direction. Release and the snake keeps moving.
Последний выживший получает очко. Игра до пяти раундов или 90 секунд.|The last survivor gets a point. Play up to five rounds or 90 seconds.
Неси мяч, передавай и выбивай его у соперника.|Carry, pass and steal the ball.
Джойстик — бег. Мяч подбирается рядом. Кнопка — пас ближайшему партнёру.|Run with the joystick. Pick up the ball by moving near it. Tap to pass to your nearest teammate.
За две минуты принеси больше мячей в противоположные ворота. Команды делятся поровну.|Score the most goals in two minutes. Teams are split evenly.
Цепочки шаров: общая игра или независимые поля с атаками каскадами.|Marble chains: play together or on separate boards with cascade attacks.
Тачпад перемещает прицел. ОГОНЬ запускает шарик, СМЕНИТЬ меняет текущий и следующий цвета. Есть раскладка для левой руки.|Move your aim with the touchpad. FIRE launches a marble; SWAP exchanges current and next colors. Left-handed layout available.
CO-OP: очистить общую цепь. VERSUS: очистить свою первой или пережить соперников.|CO-OP: clear the shared chain. VERSUS: clear yours first or outlast your rivals.
CO-OP: очистить цепочки на 1, 3 или 6 уровнях. VERSUS: первой очистить свою цепь, остаться последним или набрать больше очков за 180 секунд.|CO-OP: clear 1, 3 or 6 levels. VERSUS: clear your chain first, be the last survivor or have the most points after 180 seconds.
Новый игрок ждёт следующего матча. Переподключение сохраняет его состояние.|New players wait for the next match. Reconnecting preserves their state.
Разрушаемый грунт, опора по склону, 86 вариантов в обычной выдаче и 144 в полном арсенале. Упрощённые адаптации помечены.|Destructible terrain, sloped footing, 86 standard weapon variants and 144 in the full arsenal. Simplified adaptations are marked.
Выберите оружие, угол и силу, затем нажмите ОГОНЬ. Стрелки перемещают танк за топливо. Ветер меняется каждый ход.|Choose a weapon, angle and power, then tap FIRE. Arrows move your tank using fuel. Wind changes every turn.
Попадания дают очки, самоповреждение и удары по своей команде отнимают их. Грунт разрушается и осыпается колонками.|Hits earn points; self-damage and friendly fire lose points. Terrain is destroyed and collapses in columns.
Каждый получает одинаковое число ходов: 5, 10 или 15. Побеждает наибольшая сумма очков игрока или команды.|Everyone gets 5, 10 or 15 turns. The player or team with the highest total wins.
Новый игрок ждёт следующего матча. При отключении активного игрока через 4 секунды стреляет бот.|New players wait for the next match. If the active player disconnects, a bot fires after 4 seconds.
Объёмный лук и мишени. Камера с кодированными маркерами или обычный сенсорный пульт.|A 3D bow and targets. Use camera tracking with coded markers or regular touch controls.
Наведите центр камеры на мишень, удерживайте кнопку натяжения и отпустите. Для камеры на гостевых телефонах нужен доверенный HTTPS.|Aim the camera at the target, hold draw and release. Guest phones need trusted HTTPS for camera access.
Набрать больше очков за 5, 10 или 15 стрел. Центр — 100, среднее кольцо — 60, край — 25.|Score the most from 5, 10 or 15 arrows. Bullseye: 100; middle ring: 60; outer ring: 25.
Каждый за себя, по командам или совместная цель: в среднем минимум 50 очков за стрелу.|Play solo, in teams or cooperatively: average at least 50 points per arrow.
Переподключение сохраняет стрелы и очки. Новый игрок ждёт следующий матч.|Reconnecting preserves arrows and points. New players wait for the next match.
Свайп, подкрутка, свип. Подкатите камни ближе к центру и выбейте чужие.|Swipe, curl and sweep. Slide stones toward the center and knock rivals out.
Настрой позицию и подкрутку, затем проведи пальцем снизу вверх. Скорость и длина свайпа дают силу, направление — прицел. Во время своего командного броска держи СВИП, чтобы камень проехал дальше.|Set position and curl, then swipe upward. Swipe speed and length control power; direction controls aim. Hold SWEEP during your team's throw to extend the stone's travel.
Две команды по очереди бросают одинаковое количество камней. Ближе к центру дома — лучше. Камень должен пройти среднюю линию и остаться на льду.|Two teams alternate equal numbers of stones. Get closest to the house center. A stone must cross the middle line and stay on the ice.
В энде очки получает только команда с ближайшим камнем: за каждый камень ближе лучшего чужого. Побеждает сумма за 1, 3 или 5 эндов.|Only the closest team scores each end: one point for each stone closer than the opponent's best. Highest total after 1, 3 or 5 ends wins.
Новый игрок ждёт следующего матча. Переподключение сохраняет команду; после 8 секунд без связи ход пропускается.|New players wait for the next match. Reconnecting keeps your team; after 8 seconds disconnected, the turn is skipped.
Настоящие объёмные кегли, сочные столкновения и бросок одним движением пальца.|Real 3D pins, satisfying collisions and a throw with one swipe.
Поставь шар левее или правее, выбери подкрутку. Свайп вверх задаёт силу и направление. Быстрый жест — сильный бросок; отклонение в сторону меняет угол. Телефон махать не нужно.|Position the ball and set spin. Swipe upward for power and direction. Faster swipes throw harder; sideways motion changes angle. No need to swing your phone.
Сбей десять кеглей за один или два броска. Жёлоб не даёт шару вернуться на дорожку. На ход — 25 секунд.|Knock down ten pins in one or two throws. Gutter balls stay in the gutter. You have 25 seconds per turn.
Матч на 3, 5 или 10 фреймов. Страйк учитывает два следующих броска, спэр — один. В последнем фрейме есть бонусные броски.|Play 3, 5 or 10 frames. A strike adds your next two throws; a spare adds one. The final frame has bonus throws.
Новый игрок ждёт следующего матча. Переподключение сохраняет очки; отключившемуся игроку засчитывается пропущенный бросок.|New players wait for the next match. Reconnecting keeps scores; disconnected players miss their throw.
Вся компания на турелях. Сотни железных термитов хотят прогрызть ваши ворота.|Everyone mans a turret. Hundreds of metal termites want to chew through your gate.
Тачпад перемещает прицел, отдельная большая кнопка — огонь. Не перегревай ствол. Импульс бьёт по площади и замедляет рой, затем заряжается 12 секунд. Раскладка зеркалится для левшей.|Aim with the touchpad and fire with the large button. Avoid overheating. Pulse damages an area and slows the swarm, then recharges for 12 seconds. Left-handed layout available.
Защищайте общие ворота. Бегуны быстрые, бронированные живучие, каждая третья волна приводит босса. Добравшиеся до ворот грызут их непрерывно.|Defend the shared gate. Runners are fast, armored bugs are tough, and every third wave brings a boss. Bugs at the gate keep chewing.
Отбейте 4, 6 или 8 волн всей командой. Между волнами ворота ремонтируются на 120. Ноль прочности — поражение всех.|Survive 4, 6 or 8 waves together. Between waves, the gate repairs by 120. Zero gate health means everyone loses.
Можно присоединиться прямо к обороне. Размер следующих волн и темп появления подстраиваются под число подключённых игроков.|Join the defense immediately. Future wave sizes and spawn rates adapt to the connected player count.
Смешные челики выезжают из укрытий. Шесть точных попаданий — и у тебя пулемёт.|Funny characters pop out of cover. Six accurate hits unlock a machine gun.
Веди прицел тачпадом и стреляй отдельной кнопкой. Шесть попаданий подряд заряжают пулемёт: активируй его вручную на 8 секунд. Имя и таймер видны всем. Есть режим для левой руки.|Aim with the touchpad and fire with a separate button. Six consecutive hits charge a machine gun; activate it manually for 8 seconds. Everyone sees your name and timer. Left-handed mode available.
Попадай в видимую часть цели, не в укрытие. Обычная цель +10, золотая +30. Мирный с белым флагом −15 и сброс комбо. Промах также сбрасывает серию.|Hit the visible target, not its cover. Normal targets: +10; gold: +30. A white-flag civilian costs 15 and resets your combo. Missing also resets it.
За 60, 90 или 120 секунд набери больше всех очков. Одна цель засчитывается только первому попавшему; пулемёт сам себя не заряжает.|Score the most in 60, 90 or 120 seconds. Only the first hit scores each target; the machine gun cannot recharge itself.
Новый игрок смотрит до следующего матча. Возвращение после обрыва сети сохраняет очки и оставшееся время бонуса.|New players spectate until the next match. Reconnecting keeps your score and remaining bonus time.
`;
  const controlCopy = `
ОЖИДАНИЕ|WAITING
ОПАСНО|DANGER
ОХОТА|HUNT
ОЧЕРЕДЬ|QUEUE
ОЧКИ|POINTS
Очки|Points
ОЧЕРЕДЬ ХОДОВ|TURN ORDER
ПОБЕДЫ|WINS
Победа|Victory
Победа!|Victory!
Победа! Красиво.|Victory! Nicely done.
Победители:|Winners:
Победы в раундах|Round wins
Ничья|Tie
Ничья — шпион спасён|Tie — the spy is safe
ОБОРОНА|DEFENSE
ОБЩАЯ ЦЕПОЧКА|SHARED CHAIN
ОГРАБЬ БОССА|ROB THE BOSS
ОДИН БЛОК. СПОКОЙНАЯ РУКА.|ONE BLOCK. ONE STEADY HAND.
ОДИН ЭКРАН. ВСЯ КОМПАНИЯ.|ONE SCREEN. EVERYONE TOGETHER.
ОДНА ПУЛЯ · СТРЕЛЯЙ ТОЛЬКО НА DRAW!|ONE BULLET · ONLY SHOOT ON DRAW!
НЕ СТРЕЛЯЙ ДО DRAW!|DON'T SHOOT BEFORE DRAW!
НЕ В ЭТОТ РАЗ|NOT THIS TIME
ПЕРЕДАЙ БОМБУ|PASS THE BOMB
ПЕРЕЙТИ К ГОЛОСОВАНИЮ|GO TO VOTING
ПО КРУГУ|TAKE TURNS
ПОДКЛЮЧИТЬСЯ|CONNECT
ПРИСОЕДИНИТЬСЯ|JOIN
ПОЛЁТ ЗАВЕРШЁН|FLIGHT OVER
ПОПАДИ В СВОЙ ЦВЕТ|HIT YOUR COLOR
ПОПЫТКИ|ATTEMPTS
ПОСТРОИТЬ БАШНЮ|BUILD A TOWER
ПРАВША|RIGHT-HANDED
Правша|Right-handed
ПРИГОТОВЬТЕСЬ|GET READY
ПРИГОТОВЬСЯ · СМОТРИ НА БОЛЬШОЙ ЭКРАН|GET READY · WATCH THE SHARED SCREEN
ПРИЦЕЛ|AIM
ПРИЦЕЛИВАНИЕ|AIMING
ПРОГРЕСС|PROGRESS
ПУЛЕМЁТ|MACHINE GUN
ПУЛЕМЁТ ГОТОВ|MACHINE GUN READY
ПУЛЕМЁТ ГОТОВ!|MACHINE GUN READY!
РАЗГОНЯЙСЯ · ДО ФИНИША|SPEED UP · REACH THE FINISH
РАНО — ВЫБЫЛ|TOO EARLY — OUT
РАУНД|ROUND
РАУНДОВ|ROUNDS
РАУНД ОКОНЧЕН|ROUND OVER
Раунд окончен|Round over
Раунд готов|Round ready
РЕЖИМ|MODE
Режим|Mode
РЕЗУЛЬТАТЫ|RESULTS
Результаты|Results
Результат|Result
результат|result
РЕМОНТ|REPAIR
РИКОШЕТ|RICOCHET
СВАЙПНИ ВВЕРХ|SWIPE UP
СВОЙ ЦВЕТ|YOUR COLOR
СЕЙЧАС ИГРАЕМ|NOW PLAYING
СЕЙЧАС ОТВЕЧАЕТ|NOW ANSWERING
СЕЙЧАС РИСУЕТ|NOW DRAWING
СЕЙЧАС ХОДИТ|CURRENT TURN
СЕКУНД|SECONDS
СЖИМАЮЩАЯСЯ АРЕНА|SHRINKING ARENA
СИНЯК · МИЛЛИОНЕР|SINYAK · MILLIONAIRE
СКАНИРУЙ И ИГРАЙ|SCAN AND PLAY
СЛЕДУЮЩИЙ ВОПРОС|NEXT QUESTION
СЛОЙ|LAYER
СОЗДАТЬ ЛОББИ|CREATE LOBBY
ТВОЁ ПОЛЕ|YOUR GRID
ТВОЁ УПРАВЛЕНИЕ|YOUR CONTROLS
ТВОЯ КОМПАНИЯ|YOUR PARTY
ТЕКУЩАЯ ЦЕЛЬ|CURRENT GOAL
ТЕЛЕФОН — ТВОЙ ПУЛЬТ|YOUR PHONE IS YOUR CONTROLLER
ТЕСТ КЛАВИАТУРОЙ|KEYBOARD TEST
ТОПЛИВО|FUEL
ТЫ В ИГРЕ|YOU'RE IN
ТЫ УПРАВЛЯЕШЬ ШОУ|YOU RUN THE SHOW
УТАЩИ ФЛАГ|STEAL THE FLAG
ФИНАЛЬНЫЙ МУТАНТ|FINAL MUTANT
ЦЕЛЬ|GOAL
ШАГ 1 / СОСТАВ|STEP 1 / PLAYERS
ШАГ 2 / ПОДКЛЮЧЕНИЕ|STEP 2 / CONNECT
ВСЕ ДВИГАЮТ КУРСОР ВМЕСТЕ|EVERYONE MOVES ONE CURSOR
ИЗМЕНИТЬ КОЛ-ВО|CHANGE PLAYER COUNT
АДАПТАЦИЯ|ADAPTED
БЬЁТ:|PUNCHING:
Бьёт:|Punching:
Сейчас бьёт:|Punching now:
Ход:|Turn:
Ход|Turn
Это:|This is:
Сила|Power
Позиция|Position
Подкрутка|Spin
Пульт|Controller
Панель|Panel
Пригласить|Invite
Применить|Apply
Открыть|Open
Открыть мой пульт|Open my controller
Вернуться в меню ведущего|Back to host menu
Нет связи с локальным сервером|Cannot reach the local server
Нет соединения|No connection
Не удалось войти|Could not join
Не удалось начать|Could not start
Не стартует|Cannot start
Не удалось скопировать|Could not copy
Не удалось создать QR|Could not create QR
Не удалось сохранить черновик на телефоне|Could not save a draft on this phone
Ошибка|Error
Ошибка входа|Could not join
Открыто в другой вкладке|Open in another tab
Переподключаемся…|Reconnecting…
Переподключается|Reconnecting
Переподключение к серверу…|Reconnecting to the server…
Переподключение…|Reconnecting…
Подключение|Connection
Подключение…|Connecting…
Подключаемся|Connecting
Подключаемся…|Connecting…
Подключаем профиль…|Connecting your profile…
Подключаем игроков…|Connecting players…
Подключаем телефоны к матчу…|Connecting phones to the match…
Подключаем игроков к матчу — запуск продолжится автоматически|Connecting players — launch will continue automatically
Подключаем игроков — матч запустится автоматически|Connecting players — the match will start automatically
Подключились|Connected
Подключиться|Connect
Подключайтесь к игре|Join the game
Подключайтесь через общий хаб LocalParty|Join through the HeyPals lobby
Подключайтесь — начинаем от 2 игроков|Join us — starts with 2 players
Подключайте телефоны|Connect your phones
Подключитесь с телефона|Join from your phone
Подключитесь и дождитесь начала.|Connect and wait for the start.
Подключите телефоны, затем начните матч|Connect phones, then start the match
Подключите телефоны. Камера смотрит на этот экран.|Connect phones. Point cameras at this screen.
Повторить подключение|Reconnect
Повторить подключение датчика|Reconnect motion sensor
Разрешить движение|Allow motion
Калибровка|Calibration
Поиск маркеров|Finding markers
Прицел пальцем|Touch aiming
Прицел потерян — стрела сохранена|Tracking lost — arrow saved
Натяните и отпустите|Draw and release
Натяжение не принято. Проверьте трекинг и фазу матча.|Draw not accepted. Check tracking and match phase.
Подержите натяжение чуть дольше|Hold the draw a little longer
Стрела не выпущена:|Arrow not released:
повторите натяжение|draw again
Проведи вверх чуть дальше|Swipe up a little further
Скорость → сила · изгиб → подкрутка|Speed → power · curve → spin
Держи TV в кадре|Keep the TV in view
Камера:|Camera:
Прицел — тачпад. Огонь — отдельная кнопка. Белый флажок: не стрелять.|Aim with the touchpad. Fire with the button. White flag: don't shoot.
Поправка прицела — кнопка «Центр»|Use “Center” to calibrate your aim
Датчик требует HTTPS. По этому HTTP-адресу используй кнопку «Зажми → отпусти».|Motion requires HTTPS. At this HTTP address, use “Hold → release”.
Этот браузер не поддерживает датчик движения. Используй кнопку «Зажми → отпусти».|This browser does not support motion. Use “Hold → release”.
Камера требует HTTPS с доверенным сертификатом. HTTP по Wi-Fi не подходит. Пока можно открыть обычный сенсорный пульт.|The camera requires HTTPS with a trusted certificate. Wi-Fi HTTP will not work. You can use regular touch controls instead.
Для камеры на гостевом iPhone нужен доверенный HTTPS. Сенсорный режим работает и по обычному локальному HTTP — это не AR.|Guest iPhones need trusted HTTPS for camera access. Touch mode also works over local HTTP; it is not AR.
Не удалось включить 3D. Нужен браузер с WebGL 2 и аппаратным ускорением.|Could not start 3D. A browser with WebGL 2 and hardware acceleration is required.
Графический контекст потерян. Перезагрузи экран ведущего — матч на сервере сохранится.|Graphics context lost. Reload the host screen; the server keeps the match.
Worker недоступен: снижена частота анализа.|Worker unavailable: analysis rate reduced.
3D-лук недоступен:|3D bow unavailable:
— включено резервное 2D-поле.|— fallback 2D field enabled.
ЗАЖМИ → ОТПУСТИ|HOLD → RELEASE
Зажми → отпусти|Hold → release
Двигай плавно · скорость 0%|Move smoothly · speed 0%
Дальше от центра — быстрее и сильнее.|Further from center means faster and stronger.
Держи и веди пальцем · направление усредняется|Hold and drag · directions are averaged
Отпусти палец, чтобы остановиться.|Release your finger to stop.
Джойстик · инерция · вышибай всех за край.|Joystick · momentum · push everyone over the edge.
Двигайся джойстиком: башня смотрит по движению. Подбирай случайное оружие. За уничтожение +100. После гибели вернёшься через 2 секунды.|Move with the joystick; the turret follows your movement. Collect weapons. Kills earn 100 points. Respawn after 2 seconds.
Веди джойстик к еде. Расти и обходи крупных игроков.|Steer toward food. Grow and avoid larger players.
Веди прицел и держи огонь. Импульс бьёт по области. Следи за нагревом.|Aim and hold fire. Pulse hits an area. Watch your heat.
Тап — взмах вверх. Пролетай между трубами.|Tap to flap up. Fly between the pipes.
Тапай как можно быстрее! Каждый тап разгоняет бегуна.|Tap as fast as you can! Every tap accelerates your runner.
Следи за оставшимися птицами на общем экране.|Watch the remaining birds on the shared screen.
Обходи стены и следы. Джойстик — поворот.|Avoid walls and trails. Steer with the joystick.
Подбери мяч. Джойстик — бег, кнопка — пас.|Pick up the ball. Joystick to run, button to pass.
Передавай скрытую бомбу касанием. Взрыв выбивает носителя.|Pass the hidden bomb by tagging someone. Its explosion eliminates the carrier.
Лови тайминг и кидай ножи только в свой цвет.|Time your throws and hit only your color.
Вы на арене. Один выстрел — только после «СТРЕЛЯЙ»!|You're in the arena. One shot — only after “DRAW!”
Вы подключены. Ваш выход — в следующем турнире.|You're connected. Your turn comes in the next tournament.
Один выстрел. Дождитесь зелёного сигнала.|One shot. Wait for the green signal.
Смотри на экран. Не ведись на фальш-сигналы. Стреляй только на DRAW!|Watch the screen. Ignore fake signals. Shoot only on DRAW!
Смотрите дуэль и готовьтесь к своему выходу.|Watch the duel and get ready for your turn.
Жди сигнала своего хода.|Wait for your turn signal.
Красиво катится…|Rolling nicely…
Свайп вверх: сила и направление. Подкрутку можно задать ползунком.|Swipe up for power and direction. Set spin with the slider.
Цель — ближе к центру. Пока камень своей команды едет — держи свип.|Aim for the center. Hold sweep while your team's stone is moving.
Попадай в чудиков. Белый флажок — не цель.|Hit the characters. Don't shoot the white flags.
Соединяй края цепи для каскадов.|Connect chain edges to create cascades.
Три и больше одного цвета — комбинация.|Three or more of one color make a match.
Все цепочки убраны!|All chains cleared!
Цепь дошла до ворот|The chain reached the gate
Смотри через камеру на общий экран. Держи хотя бы два маркера в кадре для первого захвата. Лук натягивается кнопкой, а не движением руки.|Aim your camera at the shared screen. Keep at least two markers visible for initial tracking. Draw the bow with the button, not a hand movement.
Каждый сам за себя. Последний живой получает раунд. После 10 — чемпион по победам.|Free-for-all. The last survivor wins the round. Most wins after 10 rounds becomes champion.
Красные против синих. Укради вражеский флаг и донеси на свою базу. До 3 захватов.|Red versus blue. Steal the enemy flag and bring it home. First to 3 captures wins.
Все вместе против босса и охраны. Разнесите босса, заберите энергетическое ядро и утащите домой.|Team up against the boss and guards. Defeat the boss, take the energy core and bring it home.
Команда для режима с флагом:|Team for capture the flag:
У ТЕБЯ ФЛАГ — ТАЩИ НА СВОЮ БАЗУ!|YOU HAVE THE FLAG — BRING IT HOME!
У ТЕБЯ ЯДРО — ВАЛИ В ЗЕЛЁНУЮ БАЗУ!|YOU HAVE THE CORE — REACH THE GREEN BASE!
ЯДРО ДОСТУПНО|CORE AVAILABLE
Извлечённый блок ложится наверх. Обрушивший башню проигрывает. Если башня устоит 4 минуты, победят игроки с большим числом успешных ходов.|Removed blocks go on top. Whoever topples the tower loses. If it stands for 4 minutes, the most successful turns win.
Управляйте краном по очереди и стройте одну общую башню.|Take turns controlling the crane and building one shared tower.
По очереди двигайте кран и отпускайте блок на вершину. Башня качается отдельными секциями — смотрите, куда ляжет вес.|Take turns moving the crane and dropping blocks on top. Tower sections sway independently; watch where the weight will land.
Удерживай стрелку, чтобы двигать кран. Сброс — одно нажатие. Точное попадание: до +150 очков. После обновления вернёшься в свою очередь.|Hold an arrow to move the crane. Tap to drop. Accurate placements earn up to 150 points. Reloading restores your place in the queue.
Ходы завершены. Ещё одну башню можно запустить на общем экране.|All turns complete. Start another tower on the shared screen.
Один кран. Все строители. Строим до обрушения.|One crane. Everyone builds. Keep going until it falls.
Подними общую башню|Build the shared tower
Наблюдайте бой. Тайные координаты остаются на телефонах.|Watch the battle. Secret coordinates stay on the phones.
Выбери соперника → нажми клетку. Береги свои 5 палуб. Последний флот побеждает.|Choose a rival → tap a square. Protect your 5 decks. Last fleet standing wins.
У каждого поле 6×6. Флот расставлен автоматически: два двухпалубных и один однопалубный корабль. Свои корабли видны только тебе.|Each player has a 6×6 grid. Two double-deck ships and one single-deck ship are placed automatically. Only you can see your ships.
Позднее подключение — наблюдение и участие со следующего матча. Перезагрузка возвращает тот же флот и перезарядку. Отключившиеся корабли остаются на поле.|Late arrivals spectate until the next match. Reloading restores the same fleet and reload timer. Disconnected ships remain on the board.
Поле выбранного капитана|Selected captain's grid
Поле противника|Enemy grid
По кому стреляем?|Who are we firing at?
Первый залп впереди|The first volley awaits
Перезарядка орудия|Reloading cannon
Орудие готово|Cannon ready
Первым до 1 000 000 — победитель. Если ходы закончатся раньше, выигрывает тот, кто выше на лестнице.|First to 1,000,000 wins. If turns run out, the highest player on the ladder wins.
Лестница стала на одну ступень дороже.|The ladder just got one step more valuable.
Сегодня миллион прошёл мимо, но рейтинг всё видел.|No million today, but the standings remember.
Ты в числе победителей. Люкс одобрен.|You're among the winners. Luxury approved.
Ответ оказался неправильным.|That answer was incorrect.
Ответ принят|Answer accepted
Ответ раскрыт|Answer revealed
Ответить|Answer
Отвечает кто-то другой.|Another player is answering.
Правильный ответ раскрыт. Счёт обновлён.|Correct answer revealed. Scores updated.
Показать ответ|Show answer
Обсудите ответ. Его отправляет ★ капитан команды.|Discuss the answer. Your ★ captain submits it.
Вы ★ капитан. Нажмите общий ответ команды.|You are the ★ captain. Submit your team's answer.
Капитан — первый подключённый игрок команды. Только он отправляет общий ответ. При отключении капитан сменится автоматически.|The first player to join a team is its captain. Only the captain submits answers. If disconnected, a new captain is chosen automatically.
Команды можно переключать на телефоне до старта.|Switch teams on your phone before the start.
Побеждает лучший счёт. При равенстве — общая победа.|The highest score wins. Equal scores share victory.
Перед стартом соберите команды примерно поровну. Актёры внутри команды меняются по очереди.|Make roughly equal teams before starting. Actors take turns within each team.
Каждый голосует на своём телефоне. На большом экране видно только прогресс.|Everyone votes on their phone. The shared screen shows only progress.
На общем экране секретов нет. Каждый игрок подтверждает, что увидел свою роль.|No secrets appear on the shared screen. Each player confirms seeing their role.
Раунд уже идёт. Ты подключён и получишь роль в следующем раунде. Секреты пока скрыты.|A round is underway. You're connected and will receive a role next round. Secrets remain hidden for now.
Ты подключён к локальной игре. Введи имя — секретная роль придёт только на этот телефон.|You're connected to the local game. Enter your name; your secret role comes only to this phone.
Ответь естественно, но не называй локацию напрямую.|Answer naturally, but don't name the location directly.
Не спрашивай слишком прямо: «есть ли там вода?» лучше, чем «это пляж?»|Don't ask too directly: “Is there water?” is better than “Is it a beach?”
Спроси про время: «ночью здесь что-то меняется?»|Ask about time: “Does anything change here at night?”
Спроси про еду: «здесь нормально что-нибудь перекусить?»|Ask about food: “Would it be normal to have a snack here?”
Спроси про звук: «тут обычно тихо или громко?»|Ask about sound: “Is it usually quiet or loud here?”
Спроси про одежду: «я бы здесь выглядел странно в костюме?»|Ask about clothes: “Would I look strange wearing a suit here?”
Спроси про поведение: «что здесь было бы очень странно делать?»|Ask about behavior: “What would be very strange to do here?”
Подсказка шпиону|Hint for the spy
Не подсматривай в чужие телефоны|Don't peek at other phones
прикрой экран от соседей|keep your screen hidden
твоя секретная роль|your secret role
ДУЭЛЬ · БЕЗ ГОЛОСОВАНИЯ|DUEL · NO VOTING
ДУЭЛЬ · РЕАКЦИЯ · 2–16|DUEL · REACTION · 2–16
ДУЭЛЬ: УГАДАЙ ЛОКАЦИЮ ДО КОНЦА ТАЙМЕРА|DUEL: GUESS THE LOCATION BEFORE TIME RUNS OUT
Рисуй|Draw
Рисуй без букв и цифр.|Draw without letters or numbers.
Рисуй и угадывай|Draw and guess
Рисунок пока пустой|Your drawing is still empty
Художник рисует без букв. Остальные вводят догадку. Угадал — получаешь очки, художник тоже.|The artist draws without letters. Everyone else types guesses. Correct guesses score for both the guesser and artist.
Один круг по компании. Порядок художников — по входу.|One turn each. Artists go in joining order.
Один персонаж на весь рисунок|One character across the whole drawing
Каждый станет художником|Everyone gets to draw
Покажи. Не рассказывай.|Act it. Don't say it.
Показывай жестами. Не произноси слово.|Use gestures. Don't say the word.
Продолжи линии у верхнего края. Пустые поля уберём сами.|Continue the lines at the top. We'll crop empty margins.
Ты в очереди на следующую часть. Продолжай только узкую полоску предыдущего рисунка — всё остальное секрет.|You're queued for the next part. Continue only the narrow strip of the previous drawing; everything else is secret.
После отправки рисунок уже не вернуть. Следующий увидит только стык.|Once sent, the drawing cannot be changed. The next player sees only the connecting strip.
Отправляем этот кусок?|Send this part?
Отправляем…|Sending…
Очистить свою часть?|Clear your part?
Пропустить эту часть? Несохранённый рисунок останется в черновике игрока.|Skip this part? The player's unsent drawing stays as a draft.
Пропустить|Skip
Пропустить ход|Skip turn
Промпты|Prompts
Догадки|Guesses
Труппа в сборе|The troupe is ready
Художники и знатоки|Artists and guessers
Общий рекорд пары|Shared two-player record
Ваш общий результат. Следующий матч — новый рекорд!|Your shared score. Aim for a new record next match!
Вот ваши таланты|Meet your talent
Вот кто знает больше всех.|Here's who knows the most.
Сцена ваша|The stage is yours
Правила боя|Battle rules
Правила и подсказки|Rules and tips
Правила и подсчёт очков|Rules and scoring
Правила стройки|Building rules
Раскладка:|Layout:
Раскладка: правая рука ⇄|Layout: right-handed ⇄
рука ⇄|hand ⇄
Не закрывай эту страницу. Экран не должен блокироваться во время игры.|Keep this page open. Don't lock the screen during play.
Не гасить экран|Keep screen awake
Подключить AirPlay|Connect AirPlay
Ощущения и экран|Haptics and display
Вибрация этого iPhone|Haptics on this iPhone
Проверить отдачу|Test haptics
Отдача работает во встроенном пульте приложения. У гостей в Safari возможности другие.|Haptics work in the app's built-in controller. Guest devices in Safari have different capabilities.
Диагностика и фон|Diagnostics and background
Поделиться диагностикой|Share diagnostics
Запросить работу в фоне|Request background activity
iOS может приостановить сервер. Фоновое разрешение не гарантирует продолжение AirPlay при блокировке.|iOS may suspend the server. Background permission does not guarantee AirPlay continues when locked.
Доступ по Wi-Fi|Wi-Fi access
Стрелки листают игры на ТВ. Матч сам не запустится.|Arrows browse games on TV. They won't start a match.
Выбирай, что показать компании. На ТВ нет кнопок администратора.|Choose what everyone sees. The TV has no admin buttons.
Чтобы показать QR или пьедестал, сначала нажми «Пауза».|Pause first to show the QR code or podium.
На ТВ — большая карточка приглашения.|The TV shows a large invitation card.
Обнови сборку: сервер ещё не передал управление показом.|Update the app: the server has not provided presentation controls yet.
Дисплей доступен. Ожидаем отдельную сцену LocalParty…|Display available. Waiting for the separate HeyPals screen…
Для отдельного экрана на iOS 27 пересобери приложение с iOS 27 SDK.|For a separate display on iOS 27, rebuild with the iOS 27 SDK.
Отдельная сцена ТВ пока не подключена. Повтор экрана сам по себе не подтверждает её запуск.|The separate TV screen is not connected yet. Screen mirroring alone does not confirm it is running.
Пьедестал после каждого матча|Podium after each match
Фейерверк и живая подсветка|Fireworks and live lighting
Листать каталог, пока никто не выбирает|Browse games while nobody is choosing
Прокрутка лобби|Lobby browsing
Убрать карточку|Hide card
Ничего не нашлось. Попробуй другое название.|Nothing found. Try another name.
Введи номер от 1 до|Enter a number from 1 to
Подвести итоги|Show results
Сообщение комнаты|Room message
Каждый выбирает свой язык. Эта настройка меняет только твой интерфейс.|Everyone chooses their own language. This setting changes only your interface.
Применить мой язык ко всей комнате|Apply my language to the room
Изменить язык всей комнаты?|Change the whole room's language?
Язык изменится у всех игроков. После этого каждый сможет снова выбрать свой.|The language will change for all players. Everyone can then choose their own again.
Открой этот адрес на компьютере или телевизоре в той же сети Wi-Fi:|Open this address on a computer or TV on the same Wi-Fi network:
Откройте игру на телефонах|Open the game on your phones
Откройте обычную камеру → наведите на код → нажмите ссылку. Ничего вводить не надо.|Open your camera → scan the code → tap the link. No typing needed.
Откройте / по этому адресу на телефоне или в другой вкладке.|Open / at this address on your phone or in another tab.
Открой IP компьютера :3000|Open the computer's IP address :3000
Открой на телефоне IP этого компьютера :3000|On your phone, open this computer's IP address :3000
Или откройте на телефоне|Or open on your phone
Сканируйте QR|Scan the QR code
Если QR не открывается|If the QR code does not open
Выбери сетевой адрес Wi‑Fi компьютера и QR обновится автоматически.|Choose the computer's Wi-Fi address; the QR code updates automatically.
Ищу Wi‑Fi адрес компьютера…|Finding the computer's Wi-Fi address…
Не вижу локальный Wi‑Fi/LAN адрес. Проверь подключение компьютера к сети.|No local Wi-Fi/LAN address found. Check the computer's network connection.
Все устройства должны быть в одной Wi‑Fi сети.|All devices must be on the same Wi-Fi network.
Все устройства должны быть в одной Wi‑Fi сети. Если QR не открывается — выберите другой IP ниже.|All devices must be on the same Wi-Fi network. If the QR code does not open, choose another IP below.
Телефон и компьютер должны быть в одной Wi-Fi сети.|Your phone and computer must be on the same Wi-Fi network.
Телефон и компьютер должны быть в одной Wi‑Fi сети.|Your phone and computer must be on the same Wi-Fi network.
Компьютер и телефоны должны быть в одной Wi‑Fi сети.|The computer and phones must be on the same Wi-Fi network.
Один QR для всех игр. 2–16 игроков. Можно войти прямо во время матча. После выбывания ждите следующего раунда.|One QR code for all games. 2–16 players. Join during a match. After elimination, wait for the next round.
QR → имя → телефон автоматически получает свою часть управления.|QR → name → your phone automatically gets its part of the controls.
Подключите 1–3 телефона для co-op или 2–3 для versus.|Connect 1–3 phones for co-op or 2–3 for versus.
Подключите 2–6 телефонов. Каждый выбирает оружие на своём пульте.|Connect 2–6 phones. Everyone chooses weapons on their own controller.
От 2 и выше. Ноут — общий экран, телефоны — куски одного управления.|2 or more players. Laptop as shared screen; phones share the controls.
Можно начинать. Остальные могут присоединиться позже.|Ready to start. Others can join later.
Нужен ещё один игрок.|One more player needed.
Нужно ещё|Still need
Для старта нужно ещё|To start, you still need
Пока можно наблюдать. Ты присоединишься в следующем матче.|You can spectate for now. You'll join the next match.
Пауза: ждём игроков.|Paused: waiting for players.
Пауза: ждём подключения игроков.|Paused: waiting for players to connect.
Ждём капитанов. Все поля будут видны здесь.|Waiting for captains. All grids will appear here.
Ждём ковбоев|Waiting for cowboys
Ждём команду|Waiting for the team
Ждём очередь|Waiting in the queue
Пары появятся после старта|Pairings appear after the start
Порядок дуэлей|Duel order
Последняя пара|Final pairing
Последний выстрел|Last shot
Попытка|Attempt
Попытки|Attempts
Разминка|Warm-up
Попробуйте ещё раз|Try again
Не загрузился арсенал. Обнови страницу.|The arsenal did not load. Refresh the page.
Оружие|Weapon
Оружие появится после начала матча.|Weapons appear after the match starts.
Пока не выбран|Not selected yet
Обычная|Normal
Норма|Normal
Одна команда|One team
Ночная|Night
Ночной квиз|Night Quiz
За столом|Table games
Экшен|Action
Логика|Logic
Вечеринка|Party
В эфире|Live
В бригаду!|Join the crew!
Бригада|Crew
Собираем бригаду|Gathering the crew
Собираем команды|Gathering teams
Собираемся|Gathering
Собираемся.|Gathering.
Собираемся?|Ready to gather?
Все игроки на одном экране|All players on one screen
Вечер начинается здесь.|Your evening starts here.
Будет громко.|It's going to get loud.
Игра на экране. Пульт в телефоне.|Game on the screen. Controller on your phone.
Играем так|Here's how we play
Когда начнётся шоу — телефон станет пультом.|When the show starts, your phone becomes the controller.
Введи имя — твой цвет появится на большом экране.|Enter your name; your color appears on the shared screen.
Введи имя. Игровое поле — на общем экране.|Enter your name. The game is on the shared screen.
Займи свой слот|Take your spot
Гонка за первым местом|Race for first place
Курс на победу|Course set for victory
ОДИН КУРСОР|ONE CURSOR
1 курсор.|1 cursor.
15 уровней пережиты.|15 levels survived.
Внутри уже 15 разных уровней: трассировка, смертельные стены, турели, moving gates, полёт, падение, лазеры и финальный босс.|15 different levels: tracing, deadly walls, turrets, moving gates, flying, falling, lasers and a final boss.
Ваш общий результат|Your shared result
Твой выход|Your turn
Твой контроллер|Your controller
Ты в игре|You're in
Сколько вас?|How many players?
Смотрите сюда — здесь всегда написано, что делать.|Look here — your next action is always shown here.
Точность, серия и очки — ваш вечер в цифрах.|Accuracy, streaks and points — your evening in numbers.
Возвращение через|Respawning in
Итог: этажей|Result: floors
Топ компании|Party leaders
ВПШ|VPSH
ИС|IS
Титан|Titan
Громила|Bruiser
Задира|Brawler
Крепыш|Tough guy
Котёнок|Kitten
Пушинка|Featherweight
Слабак|Lightweight
Богатырь|Strongman
Тяжеловес|Heavyweight
Ударник|Slugger
Нокаутёр|Knockout artist
ЛЕСТНИЦА|LADDER
ДА. ПАХНЕТ ДЕНЬГАМИ|YES. SMELLS LIKE MONEY
КТО ХОЧЕТ СТАТЬ СИНЯКОМ?|WHO WANTS TO BE SINYAK?
Кто хочет стать Синяком?|Who Wants to Be Sinyak?
Миллионер найден|We have a millionaire
МИЛЛИОНЕР НАЙДЕН|MILLIONAIRE FOUND
Начать матч|Start match
Начать раунд|Start round
Начать стройку|Start building
Начать турнир|Start tournament
Начать квиз|Start quiz
Начать рисовать|Start drawing
Начать бой|Start battle
Начать игру|Start game
НАЧАТЬ БОЙ|START BATTLE
НАЧАТЬ 15 УРОВНЕЙ|START 15 LEVELS
Новый матч|New match
Ещё матч|Another match
Ещё один матч|Another match
Сыграть ещё|Play again
Следующий актёр|Next actor
Следующий вопрос|Next question
Выберите число раундов и начинайте. Другую игру можно выбрать в общем меню.|Choose the number of rounds and start. Choose another game in the main menu.
Очки за победы. Повторите турнир, чтобы взять реванш.|Earn points for wins. Play another tournament for a rematch.
Осторожно!|Careful!
Скачать PNG|Download PNG
Цвет|Color
Стрел|Arrows
Сменить|Swap
Открыть камеру|Open camera
ТАНКОВЫЙ БАР|TANK BAR
Танковый бар — пульт|Tank Bar — controller
Башня терпения — пульт|Tower of Patience — controller
Ночная стройка · кран|Night Shift · crane
Кран · управление|Crane · controls
Контроллер — Синяк Миллионер|Controller — Sinyak Millionaire
Морской бой · прямой эфир|Battleships · live
Шпион — игрок|Spy — player
Шпион — экран игры|Spy — game screen
Полноэкранный режим здесь недоступен.|Full screen is unavailable here.
Найди экран|Find the screen
найди экран|find the screen
недоступен|unavailable
локальный адрес не найден|local address not found
ищу адрес…|finding address…
локальная игра по Wi‑Fi|local Wi-Fi game
локальный квиз · 150 вопросов · 2+ игроков|local quiz · 150 questions · 2+ players
общих экрана|shared screens
общих экранов|shared screens
подключение игроков|player connection
игроков подключено|players connected
в лобби|in lobby
ждём ведущего…|waiting for the host…
идёт раунд|round in progress
до голосования|until voting
голосов|votes
выбери игрока|choose a player
завершён|complete
сейчас / дальше|now / next
следующий ход через пару секунд…|next turn in a few seconds…
текущий вопрос|current question
стройка|construction
отпусти — снова крутишься|release to turn again
стреляй в текущий угол|fire at the current angle
корабль|ship
палуб|decks
палубы|decks
промахнулся.|missed.
шпион?|spy?
виртуальная|virtual
из 3|of 3
с телефонов|from phones
сеть|network
телефон-контроллер|phone controller
только свою часть|only your part
ЗАПАВОЛЕННЕ|SLOW DOWN
ЗВАРОТНЫ РУХ|REVERSE
ОТПУСТИТЬ БЛОК|DROP BLOCK
боковое давление|side pressure
Меню|Menu
Большой QR|Large QR
Ждём экран|Waiting for screen
БРОСОК|THROW
ВЫХОД|EXIT
6 ПОПАДАНИЙ → ПУЛЕМЁТ|6 HITS → MACHINE GUN
8 СЕКУНД ОГНЯ!|8 SECONDS OF FIRE!
ТРАСС|TRACKS
ВОПРОСОВ|QUESTIONS
СЛОВ|WORDS
КАПИТАНОВ|CAPTAINS
ПОБЕДИТЕЛЬ|WINNER
СЛОВ · 2–16 ИГРОКОВ|WORDS · 2–16 PLAYERS
цветные комбинации|color combinations
пошаговая артиллерия|turn-based artillery
поздний вход разрешён|late joining allowed
бесконечные возрождения|unlimited respawns
слов · один круг по компании|words · one turn each
До 16 игроков · старт от 2|Up to 16 players · starts with 2
30 секунд на ход. Поздний вход добавляет игрока в очередь.|30 seconds per turn. Late arrivals join the queue.
36 деревянных блоков. Выбирай опору с умом.|36 wooden blocks. Choose your support wisely.
и отпусти|and release
Все смотрят свои телефоны|Everyone checks their phones
пьедестал|podium
слой|layer
слоя|layers
слоёв|layers
шаров|marbles
попытка|attempt
Вопрос|Question
Игра №|Game #
на плаву|afloat
секунд на ход|seconds per turn
свою часть|your part
`;
  const auditCopy = `
Смотри на большой экран|Watch the shared screen
РАКЕТА|ROCKET
Тянет|Pulling
уничтожено|destroyed
ворота|gate
Следующая волна|Next wave
ещё|more
в рое|in the swarm
На башни! Рой приближается.|Man the turrets! The swarm is approaching.
ПУШКА|CANNON
ДРОБОВИК|SHOTGUN
БЛАСТЕР|BLASTER
ТЯЖЁЛЫЙ СНАРЯД|HEAVY SHELL
Готовы|Ready
До конца раунда|Until round end
До конца боя|Until battle end
До обсуждения|Until discussion
Найдите шпиона|Find the spy
Раздача ролей|Dealing roles
Посмотрите роль на телефоне|Check your role on your phone
До передачи хода|Until the next turn
До следующей дуэли|Until the next duel
До финиша|Until the finish
До финала|Until the final
Да фінішу|Until the finish
Узровень|Level
Общий курсор|Shared cursor
Общая башня|Shared tower
Картинг|Karting
Гонка|Race
кругов|laps
круга|laps
круг|lap
Показываем|Acting
Рисуем|Drawing
Рисует|Drawing
РИСУНОК|DRAWING
ХОД|TURN
ВОПРОС|QUESTION
Стрельба из лука|Archery
Матч|Match
Энд|End
энд|end
Волна|Wave
ВОЛН|WAVES
На бросок|Time to throw
Правая|Right
Левая|Left
команда|team
подключились. Можно начинать.|connected. Ready to start.
Ветер|Wind
Камешек|Pebble
Один точный снаряд.|One precise projectile.
Сад орбит|Orbital Garden
Верных:|Correct:
Верно|Correct
Получено ответов:|Answers received:
точность|accuracy
Угадано|Guessed
угадано|guessed
пропусков|skips
выходов|turns
рисунков|drawings
За ход:|This turn:
Твоя роль:|Your role:
Не выдай локацию слишком прямым вопросом|Don't reveal the location with an overly direct question
Сейчас отвечает|Answering now
Не подсказывай, даже если очень хочется.|Don't give hints, even if you really want to.
блоков|blocks
блок.|blocks
Выбери блок ниже двух верхних рядов.|Choose a block below the top two rows.
твой блок!|your block!
башня|tower
этажей|floors
строим до обрушения|build until it falls
у крана|at the crane
точно|accurate
попал|hit
6 попаданий подряд — пулемёт. Мирных с белым флажком не трогать!|6 consecutive hits unlock a machine gun. Don't shoot civilians with white flags!
2–16 игроков. Верный ответ даёт 1000 очков и до 300 за скорость. На каждом вопросе отвечают все одновременно. Побеждает наибольший счёт; при равенстве — общая победа.|2–16 players. Correct answers earn 1,000 points plus up to 300 for speed. Everyone answers each question simultaneously. Highest score wins; equal scores share victory.
В командах обсудите варианты вслух: ★ капитан нажимает один ответ за всех. Выберите команды до старта; для равных условий соберите одинаковое число участников. Счёт команды не умножается на её размер.|Discuss answers aloud in teams. The ★ captain submits one answer for everyone. Form equal teams before starting for fair play. Team size does not multiply the score.
Нажмите один из четырёх крупных ответов. Все ответили — сразу показываем результат; через 3 секунды новый вопрос. Отменить подтверждённый ответ нельзя. После перезагрузки имя, команда и ответ сохраняются. Присоединившиеся посреди вопроса играют со следующего.|Tap one of four large answers. Results appear as soon as everyone answers; the next question follows in 3 seconds. Confirmed answers cannot be undone. Reloading keeps your name, team and answer. Mid-question arrivals join the next question.
показывает слово жестами: без речи, звуков и букв в воздухе. Остальные угадывают вслух. В командах угадывает команда актёра.|acts out the word without speech, sounds or letters in the air. Others guess aloud. In teams, the actor's team guesses.
Актёр или ведущий нажимает «Угадали»: +100 очков и новое слово. Пропуск — без штрафа. За ход можно показать несколько слов. Побеждает лучший счёт актёра или команды.|The actor or host taps “Guessed”: +100 points and a new word. Skipping has no penalty. Act out multiple words each turn. The highest actor or team score wins.
— общий кооперативный счёт: один показывает, второй угадывает. Меняйтесь и побейте свой рекорд.|— one shared co-op score: one acts, the other guesses. Switch roles and beat your record.
Присоединиться можно в любой момент: новый игрок участвует в следующих ходах. Перезагрузка и блокировка телефона не сбрасывают слово и таймер. Таймер продолжает идти; ведущий может завершить ход отключившегося актёра.|Join at any time to play upcoming turns. Reloading or locking your phone does not reset the word or timer. The timer continues; the host can end a disconnected actor's turn.
Выбирайте блок ниже двух верхних рядов. Джойстик вниз вытягивает, вверх возвращает, вбок — давит на соседей. Чем дальше палец от центра, тем сильнее усилие. Нижние нагруженные блоки сопротивляются сильнее.|Choose a block below the top two rows. Pull the joystick down to extract, up to return, or sideways to push neighbors. Further from center means more force. Loaded lower blocks resist more.
Точность даёт очки. Стройте всё выше без лимита этажей. 3 промаха или обрушение завершают смену. Через 90 секунд блок отпускается. Новые игроки входят в очередь сразу.|Accuracy earns points. Build as high as you can with no floor limit. Three misses or a collapse end the shift. Blocks drop after 90 seconds. New players join the queue immediately.
Выбери противника и нажми клетку. Все стреляют одновременно, один выстрел каждые 2,5 секунды. Попадание +100, потопление ещё +150. Обстрелянные клетки противника видны всем.|Choose an opponent and tap a square. Everyone fires simultaneously, once every 2.5 seconds. Hits earn 100; sinking adds 150. Everyone sees previously targeted squares.
Последний уцелевший побеждает. Через 3 минуты сравниваем оставшиеся палубы, затем очки; равенство означает общую победу. Потопленные наблюдают до следующего матча.|Last survivor wins. After 3 minutes, remaining decks decide, then points. Equal scores share victory. Sunk players spectate until the next match.
У каждого один ход художника. Рисуй жестом по экрану, без букв и цифр. Слово видно только художнику. Ответ вводится текстом: регистр, знаки препинания и ё/е не важны; для распространённых слов принимаются синонимы.|Everyone draws once. Draw on the screen without letters or numbers. Only the artist sees the word. Type guesses: case, punctuation and ё/е differences don't matter. Common synonyms are accepted.
Угадавший получает 100 очков и до 50 за скорость, художник — 75 за каждого угадавшего. Когда все ответили или закончилось время, слово раскрывается. Через 3 секунды рисует следующий. Побеждает наибольший счёт.|Correct guesses earn 100 plus up to 50 for speed. The artist earns 75 per correct guesser. The word is revealed when everyone answers or time expires. The next artist starts after 3 seconds. Highest score wins.
Поздний игрок угадывает со следующего рисунка. После перезагрузки сохраняются рисунок, слово, очки и таймер. На восстановление художника даётся 5 секунд; если все отключены, партия ждёт.|Late arrivals guess from the next drawing. Reloading keeps the drawing, word, score and timer. Artists have 5 seconds to reconnect; if everyone disconnects, the game waits.
Каждый игрок — на своей турели. Тачпадом веди прицел, другой рукой держи огонь. Не подпускайте рой к воротам: укусившие продолжают грызть! Импульс бьёт по области, а между волнами ворота частично ремонтируются.|Each player mans a turret. Aim with the touchpad and hold fire with your other hand. Keep the swarm away: bugs at the gate keep chewing! Pulse hits an area; the gate partly repairs between waves.
Во время игры держите приложение открытым|Keep the app open during play
Подготавливаем игру…|Preparing the game…
Подключите общий экран в разделе «Комната»|Connect a shared screen in the Room section
После запуска каждый нажимает «Я готов» на своём пульте|After launch, everyone taps “I'm ready” on their controller
Сервер не ответил|The server did not respond
Локальный сервер недоступен. Закройте LocalParty на iPhone и откройте снова.|Local server unavailable. Close HeyPals on your iPhone and reopen it.
Восстанавливаем локальную комнату…|Restoring the local room…
Действие не выполнено. Комната переподключается — попробуйте ещё раз.|Action failed. The room is reconnecting — please try again.
Фон доступен на iOS 26 и новее|Background activity requires iOS 26 or later
Симулятор: разрешение на длительный фон доступно только на iPhone|Simulator: extended background permission is available only on iPhone
Запуск сервера|Starting server
Откройте приложение для восстановления фоновой работы|Open the app to restore background activity
Подключаем фоновый режим…|Enabling background activity…
iOS завершила фоновую сессию. Сервер работает при открытом приложении. Новый запрос фона — только по кнопке ниже.|iOS ended the background session. The server works while the app is open. Use the button below to request background activity again.
Сервер работает в фоне|Server running in the background
Не удалось включить фон. Сервер работает при открытом приложении.|Could not enable background activity. The server works while the app is open.
LocalParty · сервер|HeyPals · server
Игра по Wi-Fi|Wi-Fi game
iOS пока не разрешила фон. Сервер работает при открытом приложении.|iOS has not allowed background activity. The server works while the app is open.
iOS не включила фон. Сервер работает при открытом приложении.|iOS did not enable background activity. The server works while the app is open.
Сервер перестал отвечать. Откройте приложение для восстановления.|The server stopped responding. Open the app to recover.
В этой игре максимум|This game allows up to
КАЛИБРОВКА|CALIBRATION
ТОЧНОСТЬ|PRECISION
ДЕЙСТВИЕ|ACTION
ДЕРЖАТЬ|HOLD
ВВЕРХ|UP
ВНИЗ|DOWN
ИТОГ ЭКСПЕРИМЕНТА|EXPERIMENT RESULTS
Введи имя|Enter your name
Этот игрок подключился в другой вкладке|This player connected in another tab
ждём старт|waiting to start
свободно|available
уровней пройдены!|levels complete!
очков. Ещё одну игру можно запустить на общем экране.|points. Start another game on the shared screen.
Найдите зелёную кнопку на общем экране и нажмите CLICK.|Find the green button on the shared screen and press CLICK.
Сначала понятно и просто: двигаемся к кнопке и нажимаем CLICK.|Start simple: move to the button and press CLICK.
Нажмите 3 зелёные кнопки по очереди.|Press 3 green buttons in order.
Все джойстики задают среднее направление. ДЕЙСТВИЕ нажимайте на кнопке.|All joysticks set the average direction. Press ACTION while over the button.
кнопки|buttons
НЕ ВЫХОДИ ЗА ЛИНИЮ|STAY ON THE LINE
Все игроки вместе задают направление одного штриха.|Everyone guides one shared stroke.
Проведите курсор от начала до конца по голубой линии.|Guide the cursor along the blue line from start to finish.
Сильное отклонение дольше полсекунды = смерть и линия начинается заново.|Straying too far for half a second costs a life and restarts the line.
Ведите курсор точно по голубой линии.|Guide the cursor precisely along the blue line.
БАТАРЕЯ|BATTERY
Первый предмет: GRAB держит, CLICK фиксирует в слоте.|Your first item: GRAB holds it, CLICK locks it into the slot.
Возьмите батарею GRAB → донесите в SLOT → не отпуская GRAB нажмите CLICK.|GRAB the battery → carry it to SLOT → keep holding GRAB and press CLICK.
Если отпустить GRAB — батарея останется там, где вы её бросили.|Release GRAB and the battery stays where you dropped it.
GRAB должен держать батарею до самого SLOT.|Keep holding GRAB until the battery reaches SLOT.
СБОРЩИК|COLLECTOR
Вот здесь предметы действительно собираются касанием.|Here you collect items by touching them.
Коснитесь всех 6 голубых кристаллов, затем войдите в EXIT.|Touch all 6 blue crystals, then enter EXIT.
Никакого CLICK для кристаллов — просто коснитесь курсором.|No CLICK needed for crystals — just touch them with the cursor.
Соберите все голубые кристаллы касанием.|Collect all blue crystals by touching them.
СМЕРТЕЛЬНЫЙ ЛАБИРИНТ|DEADLY MAZE
У стен наконец есть последствия.|Walls finally have consequences.
Активируйте 4 фиолетовых чекпоинта и доберитесь до EXIT.|Activate 4 purple checkpoints and reach EXIT.
Любое касание стены = потеря жизни + возврат на старт.|Touching any wall costs a life and returns you to the start.
Не касайтесь стен. Чекпоинты активируются касанием.|Don't touch walls. Touch checkpoints to activate them.
Теперь мир тоже двигается.|Now the world moves too.
Проскочите через четыре движущихся заслонки и войдите в EXIT.|Pass through four moving gates and reach EXIT.
Заслонка убивает даже если сама въехала в курсор.|A gate kills even when it moves into your cursor.
Следите за ритмом движущихся ворот.|Watch the rhythm of the moving gates.
ОГРАБЛЕНИЕ БАШНИ|TOWER HEIST
В центре вращается турель и реально стреляет.|A rotating turret fires from the center.
Доберитесь до центра → удерживайте GRAB на ядре → верните ядро на базу слева.|Reach the center → hold GRAB on the core → bring it to the left base.
Пули отнимают жизнь и роняют ядро.|Bullets cost a life and make you drop the core.
GRAB крадёт ядро. После этого тащите его назад на базу.|GRAB steals the core. Then carry it back to base.
КОНВЕЙЕР|CONVEYOR
Зоны на полу физически толкают курсор.|Floor zones physically push the cursor.
Соберите 4 груза, компенсируя движение конвейеров.|Collect 4 loads while countering the conveyors.
Стрелка внутри полосы показывает направление автосноса.|Arrows in each lane show the push direction.
Конвейеры толкают общий курсор — компенсируйте движением.|Conveyors push the shared cursor — move against them.
ВЗЛЁТ|TAKEOFF
Аркадный режим: уровень летит вниз.|Arcade mode: the level scrolls downward.
Выживите до конца таймера, пролетая через отверстия в стенах.|Survive until time runs out by flying through gaps in the walls.
Курсор слегка тянет вверх. Любая стенка = смерть.|The cursor drifts upward. Any wall is deadly.
Это как кооперативный Flappy Bird без прыжка: ведите курсор в щели.|Co-op Flappy Bird without flapping: guide the cursor through gaps.
СВОБОДНОЕ ПАДЕНИЕ|FREE FALL
Теперь всё наоборот — вы падаете вниз.|Now it's reversed — you're falling downward.
Выживите до конца таймера, протискиваясь через поднимающиеся стенки.|Survive until time runs out by passing through rising walls.
Курсор слегка тянет вниз. Корректируйте траекторию вместе.|The cursor drifts downward. Correct its path together.
Падаем вниз. Держите курсор в проёмах.|Falling down. Keep the cursor in the gaps.
ОРБИТАЛЬНАЯ МЯСОРУБКА|ORBITAL GRINDER
В центре вращаются реальные коллизионные балки.|Solid beams rotate around the center.
Соберите 4 кристалла, не коснувшись вращающихся рук.|Collect 4 crystals without touching the rotating arms.
Балка бьёт по всей своей длине, а не только визуально.|The whole beam is solid, not just its tip.
Соберите 4 узла между проходами вращающихся балок.|Collect 4 nodes between passes of the rotating beams.
ЛАЗЕРНАЯ КОМНАТА|LASER ROOM
Три лазера вращаются с разной скоростью.|Three lasers rotate at different speeds.
Нажмите CLICK на переключателях 1 → 2 → 3.|CLICK switches 1 → 2 → 3.
Каждый переключатель навсегда отключает один лазер.|Each switch permanently disables one laser.
CLICK по switch 1, потом 2, потом 3. Лазеры убивают.|CLICK switch 1, then 2, then 3. Lasers are deadly.
МАГНИТНОЕ ПОЛЕ|MAGNETIC FIELD
Курсор больше не полностью ваш.|The cursor is no longer entirely yours.
Соберите 5 кристаллов рядом с движущимися магнитными полями.|Collect 5 crystals near moving magnetic fields.
⊕ притягивает, ⊖ отталкивает. Их центры тоже двигаются.|⊕ attracts, ⊖ repels. Their centers move too.
Компенсируйте магнитную тягу и соберите 5 кристаллов.|Counter the magnetic pull and collect 5 crystals.
Как только привыкли — роли начнут меняться.|Just as you get used to it, roles start changing.
Нажмите 6 целей. Каждые ~5 секунд управление раздаётся заново.|Press 6 targets. Controls are reassigned roughly every 5 seconds.
После вспышки сразу смотрите на телефон: ваша кнопка могла измениться.|After the flash, check your phone: your button may have changed.
После ROLE SHUFFLE сразу проверьте новое управление.|After ROLE SHUFFLE, immediately check your new controls.
ФИНАЛЬНЫЙ БОСС|FINAL BOSS
Турель + вращающиеся балки + смена ролей + кража ядра.|Turret + rotating beams + role swaps + core heist.
Фаза 1: CLICK по щитам 1 → 4. Фаза 2: GRAB ядро и донести в ESCAPE.|Phase 1: CLICK shields 1 → 4. Phase 2: GRAB the core and carry it to ESCAPE.
Четыре жизни. Башня ускоряется после снятия щитов.|Four lives. The tower speeds up after its shields are down.
Сначала 4 щита CLICK. Потом GRAB ядро и бегите в ESCAPE.|CLICK all 4 shields first. Then GRAB the core and head for ESCAPE.
`;
  for (const line of (pairs+gameCopy+controlCopy+auditCopy).split('\n')) { const at=line.indexOf('|'); if(at>0)dictionary[line.slice(0,at)]=line.slice(at+1); }
  dictionary['ТЫ ШПИОН']='YOU ARE THE SPY';
  dictionary['КОМПЬЮТЕР = ЭКРАН']='COMPUTER = SCREEN';
  dictionary['Темп арены']='Arena pace';
  Object.assign(dictionary, {
  "Переподключение сохраняет место и очки. Новые игроки входят перед следующим матчем.": "Reconnecting keeps your seat and score. New players join before the next match.",
  "Карты · стратегия": "Cards · strategy",
  "Техасский холдем на пять раздач. Личные карты на телефоне, общий стол на экране.": "Five hands of Texas Hold’em. Private cards on your phone, shared table on screen.",
  "Пас, чек, уравнять или повысить ставку. Только игровые фишки, без реальных денег.": "Fold, check, call or raise. Play chips only, no real money.",
  "Собери лучшую комбинацию из пяти карт или заставь соперников сбросить.": "Make the best five-card hand or get your opponents to fold.",
  "Больше фишек после пяти раздач — победа. Боковые банки и ничьи учитываются.": "Most chips after five hands wins. Includes side pots and split pots.",
  "Две команды": "Two teams",
  "Быстрая шайба и две равные команды. Играйте вдвоём, вчетвером, вшестером или ввосьмером.": "A fast puck and two equal teams. Play with 2, 4, 6 or 8 players.",
  "Веди пальцем по полю: бита следует за ним в твоей полосе.": "Drag on the rink: your striker follows within your lane.",
  "Защищай свои ворота и забивай соперникам. Каждый отвечает за свою полосу.": "Defend your goal and score against your rivals. Everyone owns a lane.",
  "Первыми забейте семь голов или ведите в счёте через две минуты.": "First to seven goals, or the team ahead after two minutes, wins.",
  "Общее поле · риск": "Shared field · risk",
  "Общее минное поле и личные очки. Открывайте безопасные клетки быстрее друзей.": "One shared minefield, individual scores. Open safe tiles before your friends.",
  "Нажми закрытую клетку. Число показывает мины вокруг. Первый ход безопасен.": "Tap a hidden tile. Numbers show nearby mines. The first opening is safe.",
  "Безопасная клетка даёт одно очко. Мина отнимает пять и блокирует ход на две секунды.": "A safe tile earns one point. A mine costs five and gives a two-second cooldown.",
  "Больше очков после открытия безопасных клеток или трёх минут — победа.": "Most points when all safe tiles are open or three minutes are up wins.",
  "Разрушаемый грунт, плавная езда и полный арсенал из 321 оружия — со случайной выдачей или ручным выбором перед матчем.": "Destructible terrain, smooth driving and a full arsenal of 321 weapons — dealt at random or picked by hand before the match."
});
  if (typeof module !== 'undefined' && module.exports) module.exports=dictionary;
  if(root)root.PARTY_TRANSLATIONS=dictionary;
})(typeof window !== 'undefined' ? window : globalThis);
