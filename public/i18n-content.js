/* Gameplay vocabulary translations. Keys remain the original protocol values. */
(function(root){
  'use strict';
  const pairs = `
Кенгуру|Kangaroo
Пингвин|Penguin
Жираф|Giraffe
Крокодил|Crocodile
Хомяк|Hamster
Ёж|Hedgehog
Осьминог|Octopus
Медуза|Jellyfish
Краб|Crab
Черепаха|Turtle
Страус|Ostrich
Лягушка|Frog
Обезьяна|Monkey
Ленивец|Sloth
Павлин|Peacock
Летучая мышь|Bat
Дятел|Woodpecker
Котёнок|Kitten
Щенок|Puppy
Улитка|Snail
Слон|Elephant
Фламинго|Flamingo
Кузнечик|Grasshopper
Пчела|Bee
Комар|Mosquito
Пылесос|Vacuum cleaner
Стиральная машина|Washing machine
Холодильник|Refrigerator
Чайник|Kettle
Тостер|Toaster
Блендер|Blender
Фен|Hair dryer
Утюг|Iron
Будильник|Alarm clock
Телевизор|Television
Зубная щётка|Toothbrush
Зонт|Umbrella
Рюкзак|Backpack
Бинокль|Binoculars
Фотоаппарат|Camera
Гитара|Guitar
Барабан|Drum
Скрипка|Violin
Труба|Trumpet
Пианино|Piano
Дирижёр|Conductor
Фокусник|Magician
Клоун|Clown
Балерина|Ballerina
Космонавт|Astronaut
Пожарный|Firefighter
Парикмахер|Hairdresser
Повар|Cook
Официант|Waiter
Врач|Doctor
Стоматолог|Dentist
Почтальон|Postal worker
Рыбак|Fisherman
Садовник|Gardener
Художник|Artist
Фотограф|Photographer
Водитель автобуса|Bus driver
Дрессировщик|Animal trainer
Диджей|DJ
Учитель|Teacher
Лыжник|Skier
Сноубордист|Snowboarder
Сёрфер|Surfer
Боксёр|Boxer
Вратарь|Goalkeeper
Баскетболист|Basketball player
Теннисист|Tennis player
Фехтовальщик|Fencer
Тяжелоатлет|Weightlifter
Канатоходец|Tightrope walker
Самокат|Scooter
Велосипед|Bicycle
Вертолёт|Helicopter
Самолёт|Airplane
Парусник|Sailboat
Подводная лодка|Submarine
Паровоз|Steam train
Экскаватор|Excavator
Трактор|Tractor
Мотоцикл|Motorcycle
Лифт|Elevator
Эскалатор|Escalator
Американские горки|Roller coaster
Карусель|Carousel
Качели|Swing
Снеговик|Snowman
Снежный ангел|Snow angel
Песочный замок|Sandcastle
Мыльный пузырь|Soap bubble
Воздушный змей|Kite
Попкорн|Popcorn
Спагетти|Spaghetti
Арбуз|Watermelon
Банан|Banana
Мороженое|Ice cream
Блин|Pancake
Лимон|Lemon
Горячий суп|Hot soup
Острая еда|Spicy food
Сахарная вата|Cotton candy
Человек невидимка|Invisible man
Робот|Robot
Зомби|Zombie
Вампир|Vampire
Русалка|Mermaid
Супергерой|Superhero
Пират|Pirate
Рыцарь|Knight
Дракон|Dragon
Волшебник|Wizard
Потерять ключи|Losing your keys
Ловить такси|Hailing a taxi
Опоздать на поезд|Missing a train
Искать телефон|Looking for your phone
Уронить мороженое|Dropping your ice cream
Нести тяжёлые сумки|Carrying heavy bags
Собирать палатку|Putting up a tent
Надувать матрас|Inflating an air mattress
Ловить комара|Catching a mosquito
Мыть окна|Washing windows
Чистить картошку|Peeling potatoes
Замешивать тесто|Kneading dough
Открывать тугую банку|Opening a stuck jar
Завязывать шнурки|Tying shoelaces
Переходить по льду|Walking across ice
Уклоняться от дождя|Dodging the rain
Кататься на коньках|Ice skating
Заснуть в автобусе|Falling asleep on a bus
Делать селфи|Taking a selfie
Выгуливать собаку|Walking a dog
Будить кота|Waking a cat
Петь в душе|Singing in the shower
Есть палочками|Eating with chopsticks
Прыгать через лужу|Jumping over a puddle
Прятать подарок|Hiding a gift
Играть в боулинг|Playing bowling
Нырять с маской|Snorkeling
Лепить пельмени|Making dumplings
Красить стену|Painting a wall
Рубить дрова|Chopping wood
Проверять карманы|Checking your pockets
Искать очки на голове|Looking for glasses on your head
Тянуть канат|Pulling a rope
Пить через трубочку|Drinking through a straw
Обнимать кактус|Hugging a cactus
Аэропорт|Airport
Транспорт|Transport
Пилот|Pilot
Стюард|Flight attendant
Пассажир|Passenger
Сотрудник безопасности|Security officer
Диспетчер|Dispatcher
Бариста|Barista
Космическая станция|Space station
Наука|Science
Командир|Commander
Инженер|Engineer
Биолог|Biologist
Оператор связи|Radio operator
Турист|Tourist
Съёмочная площадка|Film set
Кино|Cinema
Режиссёр|Director
Актёр|Actor
Оператор|Camera operator
Гримёр|Makeup artist
Продюсер|Producer
Каскадёр|Stunt performer
Военное|Military
Капитан|Captain
Сонарист|Sonar operator
Механик|Mechanic
Кок|Ship's cook
Штурман|Navigator
Матрос|Sailor
Музей|Museum
Культура|Culture
Куратор|Curator
Охранник|Security guard
Экскурсовод|Tour guide
Реставратор|Restorer
Посетитель|Visitor
Ночной клуб|Nightclub
Развлечения|Entertainment
Бармен|Bartender
Танцор|Dancer
Гость|Guest
Промоутер|Promoter
Больница|Hospital
Медицина|Medicine
Хирург|Surgeon
Медсестра|Nurse
Пациент|Patient
Рентгенолог|Radiologist
Санитар|Orderly
Поезд|Train
Машинист|Train driver
Проводник|Train attendant
Контролёр|Ticket inspector
Безбилетник|Fare dodger
Пляж|Beach
Отдых|Leisure
Спасатель|Lifeguard
Продавец мороженого|Ice cream seller
Казино|Casino
Крупье|Croupier
Игрок|Player
Менеджер|Manager
Супермаркет|Supermarket
Город|City
Кассир|Cashier
Покупатель|Customer
Грузчик|Loader
Пожарная часть|Fire station
Службы|Public services
Водитель|Driver
Начальник смены|Shift supervisor
Стажёр|Intern
Ресторан|Restaurant
Еда|Food
Шеф|Chef
Хостес|Host
Критик|Critic
Цирк|Circus
Шоу|Show
Акробат|Acrobat
Зритель|Spectator
Конферансье|Master of ceremonies
Осветитель|Lighting technician
Университет|University
Учёба|Education
Профессор|Professor
Студент|Student
Декан|Dean
Лаборант|Lab assistant
Аспирант|Graduate student
Отель|Hotel
Путешествия|Travel
Администратор|Administrator
Горничная|Housekeeper
Консьерж|Concierge
Беллбой|Bellhop
Пиратский корабль|Pirate ship
Приключения|Adventure
Пленник|Prisoner
Канонир|Gunner
Банк|Bank
Клиент|Client
Инкассатор|Cash courier
Аудитор|Auditor
Зоопарк|Zoo
Смотритель|Zookeeper
Ветеринар|Veterinarian
Продавец|Salesperson
Фестиваль|Festival
Музыкант|Musician
Волонтёр|Volunteer
Звукорежиссёр|Sound engineer
Метро|Metro
Дежурный|Duty officer
Арктическая база|Arctic base
Полярник|Polar explorer
Метеоролог|Meteorologist
Учёный|Scientist
Свадьба|Wedding
События|Events
Жених|Groom
Невеста|Bride
Ведущий|Host
Киностудия дубляжа|Dubbing studio
Актёр озвучки|Voice actor
Переводчик|Translator
Монтажёр|Editor
Средневековый замок|Medieval castle
История|History
Король|King
Шут|Jester
Стражник|Guard
Посол|Ambassador
Аквапарк|Water park
Инструктор|Instructor
Техник|Technician
Редакция новостей|Newsroom
Медиа|Media
Репортёр|Reporter
Редактор|Editor
Гоночный пит-лейн|Racing pit lane
Спорт|Sport
Маршал|Marshal
Спа-салон|Spa
Массажист|Massage therapist
Косметолог|Beautician
Уборщик|Cleaner
Тренер|Coach
Суд|Courtroom
Судья|Judge
Адвокат|Lawyer
Прокурор|Prosecutor
Свидетель|Witness
Журналист|Journalist
Ферма|Farm
Природа|Nature
Фермер|Farmer
Рабочий|Worker
Агроном|Agronomist
Стадион|Stadium
Болельщик|Fan
Комментатор|Commentator
Горнолыжный курорт|Ski resort
Оператор подъёмника|Ski lift operator
Лаборатория|Laboratory
Испытуемый|Test subject
Круизный лайнер|Cruise ship
Аниматор|Entertainer
Театр|Theater
Костюмер|Costume designer
Билетёр|Usher
Стройка небоскрёба|Skyscraper construction site
Прораб|Foreman
Архитектор|Architect
Крановщик|Crane operator
Инспектор|Inspector
Детективное агентство|Detective agency
Детектив|Detective
Секретарь|Secretary
Информатор|Informant
Подозреваемый|Suspect
Тату-салон|Tattoo studio
Тату-мастер|Tattoo artist
Ученик|Apprentice
Друг клиента|Client's friend
Игровая выставка|Gaming expo
Технологии|Technology
Разработчик|Developer
Стример|Streamer
Организатор|Organizer
Косплеер|Cosplayer
Шрек|Shrek
Осёл из Шрека|Donkey from Shrek
Кот в сапогах|Puss in Boots
Лорд Фаркуад|Lord Farquaad
Спанч Боб|SpongeBob
Патрик Стар|Patrick Star
Сквидвард|Squidward
Мистер Крабс|Mr. Krabs
Планктон|Plankton
Пикачу|Pikachu
Мяут|Meowth
Чаризард|Charizard
Дарт Вейдер|Darth Vader
Йода|Yoda
Чубакка|Chewbacca
Штурмовик|Stormtrooper
Джабба Хатт|Jabba the Hutt
Голлум|Gollum
Гэндальф|Gandalf
Саурон|Sauron
Балрог|Balrog
Бэтмен|Batman
Джокер|Joker
Харли Квинн|Harley Quinn
Супермен|Superman
Чудо-женщина|Wonder Woman
Человек-паук|Spider-Man
Веном|Venom
Дэдпул|Deadpool
Халк|Hulk
Танос|Thanos
Грут|Groot
Ракета|Rocket
Железный человек|Iron Man
Капитан Америка|Captain America
Тор|Thor
Локи|Loki
Гомер Симпсон|Homer Simpson
Мардж Симпсон|Marge Simpson
Барт Симпсон|Bart Simpson
Мистер Бёрнс|Mr. Burns
Рик Санчез|Rick Sanchez
Морти Смит|Morty Smith
Мистер Мисикс|Mr. Meeseeks
Огурчик Рик|Pickle Rick
Уэнсдэй Аддамс|Wednesday Addams
Вещь из семейки Аддамс|Thing from the Addams Family
Битлджус|Beetlejuice
Гоустфейс|Ghostface
Фредди Крюгер|Freddy Krueger
Джейсон Вурхиз|Jason Voorhees
Пеннивайз|Pennywise
Ксеноморф|Xenomorph
Хищник|Predator
Терминатор T-800|Terminator T-800
Робокоп|RoboCop
Инопланетянин E.T.|E.T. the Extra-Terrestrial
Гизмо из Гремлинов|Gizmo from Gremlins
Годзилла|Godzilla
Кинг-Конг|King Kong
Мотра|Mothra
Майк Вазовски|Mike Wazowski
Салли|Sulley
Базз Лайтер|Buzz Lightyear
Вуди|Woody
ВАЛЛ-И|WALL-E
Бэймакс|Baymax
Стич|Stitch
Олаф|Olaf
Эльза|Elsa
Моана|Moana
Мауи|Maui
Урсула|Ursula
Джек Скеллингтон|Jack Skellington
Уги Буги|Oogie Boogie
Уоллес|Wallace
Громит|Gromit
Барашек Шон|Shaun the Sheep
Тоторо|Totoro
Безликий|No-Face
Поньо|Ponyo
Грю|Gru
Миньон|Minion
По из Кунг-фу Панды|Po from Kung Fu Panda
Мастер Шифу|Master Shifu
Соник|Sonic
Доктор Эггман|Dr. Eggman
Марио|Mario
Луиджи|Luigi
Боузер|Bowser
Варио|Wario
Линк|Link
Ганондорф|Ganondorf
Кирби|Kirby
Лара Крофт|Lara Croft
Кратос|Kratos
Крипер из Minecraft|Minecraft Creeper
Эндермен|Enderman
Космонавт Among Us|Among Us crewmate
Сиреноголовый|Siren Head
Голова + верх тела|Head + upper body
Низ тела + ноги|Lower body + legs
Голова|Head
Туловище + руки|Torso + arms
Ноги + ступни|Legs + feet
Плечи + грудь|Shoulders + chest
Живот + таз|Belly + pelvis
Макушка / верх головы|Crown / top of head
Лицо / голова|Face / head
Шея + плечи|Neck + shoulders
Грудь + руки|Chest + arms
Живот / торс|Belly / torso
Таз / бёдра|Pelvis / hips
Бёдра / колени|Thighs / knees
Голени|Lower legs
Ступни / низ|Feet / bottom
Биография|Biography
Когда у Игоря Синяка день рождения?|When is Igor Sinyak's birthday?
17 сентября|September 17
1 января|January 1
14 февраля|February 14
31 декабря|December 31
17 сентября. Год в открытых источниках спорный, а вот день и месяц совпадают.|September 17. Public sources disagree on the year, but agree on the day and month.
В какой день календарь официально обязан пахнуть люксом — день рождения Игоря?|On which day must the calendar officially smell of luxury: Igor's birthday?
Финальный ответ без звонка маме: дата рождения Синяка — это…|Final answer, without calling Mom: Sinyak was born on…
Почему вопрос «в каком году родился Игорь?» немного с подвохом?|Why is “What year was Igor born?” a slightly tricky question?
В источниках фигурируют 1992 и 1995|Sources give both 1992 and 1995
Только 1988|Only 1988
Только 2001|Only 2001
Он публично скрывает и день, и год|He publicly conceals both the day and year
В биографических источниках действительно встречаются два года — 1992 и 1995. Поэтому в игре мы не делаем вид, что спор решён.|Biographical sources really do give two years: 1992 and 1995. This game does not pretend the dispute is settled.
Какой ответ честнее всего дать про год рождения Синяка?|What is the most honest answer about Sinyak's birth year?
Редкий случай, когда даже вопрос на миллион принимает два года. Какие?|A rare million-dollar question that accepts two years. Which ones?
В каком городе родился Игорь Синяк?|In which city was Igor Sinyak born?
Краматорск|Kramatorsk
Париж|Paris
Москва|Moscow
Монако|Monaco
Краматорск, Донецкая область. Париж в сюжетной арке появился сильно позже.|Kramatorsk, Donetsk region. Paris appeared much later in the story.
С чего началась география персонажа до Воркуты, Москвы и Парижа?|Where did his geographical journey begin, before Vorkuta, Moscow, and Paris?
Где начинается канон Игоря Синяка — не люксовый, а географический?|Where does Igor Sinyak's story begin geographically, rather than luxuriously?
Примерно в каком возрасте семья Игоря переехала в Воркуту?|About how old was Igor when his family moved to Vorkuta?
Около 5 лет|About 5 years old
Около 15 лет|About 15 years old
Около 25 лет|About 25 years old
После 30|After 30
По биографическим данным, в Воркуту семья переехала, когда Игорю было около пяти.|According to biographical accounts, his family moved to Vorkuta when Igor was about five.
Сколько лет было Игорю, когда география резко сменилась на Воркуту?|How old was Igor when his surroundings suddenly changed to Vorkuta?
Какой возраст ставим между «Краматорск» и «Воркута»?|What age goes between “Kramatorsk” and “Vorkuta”?
Олды YouTube|Old-school YouTube
В каком году Синяк начал карьеру на YouTube?|In which year did Sinyak begin his YouTube career?
2011. То есть это реально глубокий слой русскоязычного YouTube, а не вчера созданный аккаунт.|2011. This is genuinely old-school Russian-language YouTube, not an account created yesterday.
Олды, выходите из чата: когда стартовал его YouTube?|Veterans, step forward: when did his YouTube career begin?
Какой год открывает YouTube-эру Синяка?|Which year opens Sinyak's YouTube era?
Какую дату создания канала указывают архивные данные?|What channel creation date do archived records give?
17 октября 2011|October 17, 2011
17 сентября 2011|September 17, 2011
21 июня 2014|June 21, 2014
19 апреля 2024|April 19, 2024
17 октября 2011 года. Не путать с 17 сентября — это день рождения.|October 17, 2011. Not to be confused with September 17, his birthday.
Хардкор для олдов: когда был создан YouTube-канал Игоря?|A tough one for the veterans: when was Igor's YouTube channel created?
Какой из вариантов — реальная дата старта канала, а не пароль от Wi‑Fi?|Which option is the actual channel launch date, not a Wi-Fi password?
ВПШ|VPSH
Как называлась первая заметная рубрика Синяка?|What was Sinyak's first notable series called?
«Вся правда шоу»|“The Whole Truth Show”
«Вечер парижских шуб»|“An Evening of Parisian Fur Coats”
«Всё про шопинг»|“All About Shopping”
«Великий показ Шанель»|“The Great Chanel Show”
«Вся правда шоу». Из этого названия и выросло ВПШ.|“The Whole Truth Show.” Its Russian initials became VPSH.
Что расшифровывалось в раннем названии ВПШ?|What did the original name VPSH stand for?
Какой тайтл был у той самой ранней рубрики, где блогерам становилось тревожно?|What was that early series that made bloggers nervous called?
Что Игорь в основном делал в ранней «Вся правда шоу»?|What did Igor mainly do in the early “Whole Truth Show”?
Иронично критиковал и разбирал блогеров|Satirically criticized and analyzed bloggers
Учился готовить французские десерты|Learned to make French desserts
Ремонтировал айфоны|Repaired iPhones
Стримил шахматы без комментариев|Streamed chess without commentary
Ранний формат строился на ироничной критике и разборах других блогеров. Мирный контент это не очень напоминало.|The early format revolved around satirical criticism and analysis of other bloggers. Peaceful content it was not.
Как выглядел базовый геймплей раннего ВПШ?|What was the basic gameplay of early VPSH?
Если бы ранний ВПШ был жанром игры, какой механикой он бы занимался?|If early VPSH were a game genre, what would its central mechanic be?
На какой платформе росло сообщество ВПШ рядом с YouTube?|On which platform did the VPSH community grow alongside YouTube?
ВКонтакте|VKontakte
Одноклассники для бизнеса|Odnoklassniki for Business
ВКонтакте. ВПШ начинался как VK-сообщество, связанное с шоу.|VKontakte. VPSH began as a VK community linked to the show.
Где жил паблик ВПШ, пока Telegram ещё не стал центром вселенной?|Where did the VPSH page live before Telegram became the center of the universe?
Какая соцсеть была домашней площадкой раннего сообщества ВПШ?|Which social network was the early VPSH community's home?
Что случилось с первым сообществом ВПШ во «ВКонтакте»?|What happened to the first VPSH community on VKontakte?
Его заблокировала администрация VK|VK administrators blocked it
Его купил Vogue|Vogue bought it
Оно стало официальным пабликом Hermès|It became the official Hermès page
Оно ушло в Steam Early Access|It entered Steam Early Access
Первое сообщество было заблокировано администрацией соцсети за нарушение правил. Потом появилась новая версия.|The first community was blocked by the platform for breaking its rules. A new version appeared later.
Какой сюжетный твист пережил первый паблик ВПШ?|What plot twist did the first VPSH page experience?
Что было с первой версией сообщества: IPO, Grammy или бан?|What happened to the first community: an IPO, a Grammy, or a ban?
Во что со временем превратилось ВПШ?|What did VPSH eventually become?
В медиа о русскоязычном YouTube и звёздах|A media outlet covering Russian-language YouTube and celebrities
В доставку суши|A sushi delivery service
В криптобиржу|A cryptocurrency exchange
В школу визажа для пингвинов|A makeup school for penguins
Сообщество постепенно превратилось в медиа о русскоязычном YouTube, а затем — шире о звёздах.|The community gradually became a media outlet covering Russian-language YouTube, then celebrities more broadly.
Как эволюционировал паблик после эпохи персонального шоу?|How did the page evolve after the personal-show era?
Какой следующий класс прокачало ВПШ после «паблика при шоу»?|What did VPSH level up into after being “the show's page”?
Сколько килограммов, по биографическим источникам, Игорь однажды сбросил?|How many kilograms did Igor once lose, according to biographical sources?
66 кг|66 kg
6 кг|6 kg
16 кг|16 kg
166 кг за неделю|166 kg in a week
В биографиях фигурирует похудение на 66 кг. Довольно мощный ресет характеристик.|Biographies mention a 66 kg weight loss. Quite a character-stat reset.
Какой минус на весах фигурирует в истории Синяка?|What drop on the scales features in Sinyak's story?
Вопрос, который звучит как баг баланса персонажа: сколько кг ушло?|This sounds like a character-balancing bug: how many kilograms were lost?
На кого Игорь поступал учиться после школы?|What did Igor enroll to study after school?
Журналистика|Journalism
Архитектура|Architecture
Ветеринария|Veterinary medicine
Ядерная физика|Nuclear physics
Он поступал на журналистику. Дальше главным университетом, кажется, стал интернет.|He enrolled in journalism. After that, the internet seems to have become his main university.
Какая специальность была в его образовательной ветке?|Which subject appears in his educational path?
Если бы дипломная папка всё-таки открылась, какой факультет там ожидался бы?|If we opened his diploma folder, which faculty would we expect?
Бьюти|Beauty
В какую сторону позже сменился контент YouTube-канала?|What direction did the YouTube channel's content later take?
Бьюти и макияж|Beauty and makeup
Рыбалка|Fishing
Обзоры тракторов|Tractor reviews
Квантовая механика|Quantum mechanics
Канал заметно развернулся в бьюти-направление и макияж — это одна из самых узнаваемых его эпох.|The channel made a noticeable turn toward beauty and makeup, one of its most recognizable eras.
После разборов блогеров Игорь заметно ушёл в какую тему?|After analyzing bloggers, which topic did Igor noticeably move into?
Какой жанр стал следующим большим классом его канала?|Which genre became his channel's next big chapter?
Карьера|Career
В каком году Синяк объявил об окончании карьеры ютубера?|In which year did Sinyak announce the end of his YouTube career?
В 2021 году он завершил карьеру ютубера и сильнее переключился на музыку и личный блог.|In 2021, he ended his YouTube career and shifted more toward music and his personal blog.
Когда YouTube-эра официально ушла на титры?|When did the YouTube era officially roll its credits?
Какой год отделяет «ютубер» от более музыкальной главы?|Which year separates the “YouTuber” era from the more musical chapter?
Куда Игорь переехал в 2022 году?|Where did Igor move in 2022?
Берлин|Berlin
Минск|Minsk
Лас-Вегас|Las Vegas
Париж. Это уже не мемная подсказка — он действительно переехал во Францию.|Paris. Not just a meme hint: he really moved to France.
Какой город стал новой базой после 2022-го?|Which city became his new base after 2022?
Где начинается современная «пахнет люксом» география?|Where does the modern “smells like luxury” geography begin?
С каким районом Парижа связывают его место жительства в биографических источниках?|Which area of Paris do biographical sources associate with his home?
Район Елисейских полей|The Champs-Élysées area
Монмартр у базилики|Montmartre near the basilica
Латинский квартал|The Latin Quarter
Прямо внутри Лувра|Right inside the Louvre
В источниках указывается район Елисейских полей. Лувр как квартира всё ещё не подтверждён.|Sources name the Champs-Élysées area. The Louvre as an apartment remains unconfirmed.
Хард-вопрос по парижской карте: рядом с какой знаменитой зоной он живёт?|A tough Paris-map question: which famous area does he live near?
Какой вариант звучит максимально люксово и при этом совпадает с источниками?|Which option sounds the most luxurious while also matching the sources?
Медиа|Media
В какой телепрограмме Игорь появился в 2013 году?|Which TV program did Igor appear on in 2013?
«Прямой эфир»|“Live Broadcast”
«Поле чудес»|“Field of Wonders”
«Что? Где? Когда?»|“What? Where? When?”
«Голос. Дети»|“The Voice Kids”
В 2013 году он участвовал в программе «Прямой эфир».|In 2013, he appeared on “Live Broadcast.”
Как назывался тот выход Синяка на большое ТВ в 2013-м?|What was Sinyak's big television appearance in 2013 called?
Какой проект был не YouTube, а прям натуральный телевизор?|Which project was actual television, rather than YouTube?
В чьём клипе «Love Is» снялся Игорь в 2019 году?|Whose “Love Is” video did Igor appear in during 2019?
Егор Крид|Egor Kreed
Филипп Киркоров|Philipp Kirkorov
Шаман|Shaman
Леонид Агутин|Leonid Agutin
Егор Крид. Синяк появился в клипе «Love Is» в 2019 году.|Egor Kreed. Sinyak appeared in the “Love Is” video in 2019.
Кому понадобился Синяк в школьной вселенной клипа «Love Is»?|Who brought Sinyak into the school-themed world of the “Love Is” video?
Выберите реальный кроссовер 2019 года: Игорь Синяк + …|Pick the real 2019 crossover: Igor Sinyak + …
ТВ|TV
В каком шоу СТС Игорь участвовал в ноябре 2021 года?|Which STS show did Igor take part in during November 2021?
«Полный блэкаут»|“Total Blackout”
«Форт Боярд»|“Fort Boyard”
«Маска»|“The Masked Singer”
«Кто хочет стать миллионером?»|“Who Wants to Be a Millionaire?”
«Полный блэкаут» на СТС. Да, почти как наша игра, только там было сложнее с мебелью.|“Total Blackout” on STS. Almost like our game, except navigating the furniture was harder.
Какой телевизионный проект 2021 года реально есть в его видеографии?|Which 2021 television project really appears in his credits?
Где было темно буквально по названию, а не по настроению комментариев?|Where was it dark because of the title, rather than the mood in the comments?
Музыка|Music
Как называется полноформатный альбом Игоря 2024 года?|What is Igor's 2024 full-length album called?
«МУЗЫКА ДЛЯ ВЗРОСЛЫХ»|“MUSIC FOR ADULTS”
«Париж для начинающих»|“Paris for Beginners”
«Birkin и покой»|“Birkin and Peace”
«Вся правда: ремастер»|“The Whole Truth: Remastered”
Альбом называется «МУЗЫКА ДЛЯ ВЗРОСЛЫХ». Название сразу предупреждает, что детский утренник отменяется.|The album is called “MUSIC FOR ADULTS.” The title makes it clear that the children's party is canceled.
Какой тайтл реально стоит на его альбоме, а не придуман нами после вечеринки?|Which title is really on his album, rather than something we invented after a party?
Выберите настоящее название альбома IGOR SINYAK.|Choose IGOR SINYAK's real album title.
Когда вышел альбом «МУЗЫКА ДЛЯ ВЗРОСЛЫХ»?|When was “MUSIC FOR ADULTS” released?
17 сентября 2024|September 17, 2024
31 мая 2026|May 31, 2026
1 января 2021|January 1, 2021
19 апреля 2024 года.|April 19, 2024.
Какая дата — релиз альбома 2024 года?|Which date marks the release of the 2024 album?
Хардкор для стриминговых археологов: день релиза «Музыки для взрослых»?|A tough one for streaming archaeologists: the release date of “Music for Adults”?
Какой лейбл указан у альбома 2024 года?|Which label is listed for the 2024 album?
VPSH MUSIC. ВПШ проникло даже в метаданные музыки.|VPSH MUSIC. VPSH even made it into the music metadata.
Под каким лейблом вышла «МУЗЫКА ДЛЯ ВЗРОСЛЫХ»?|Which label released “MUSIC FOR ADULTS”?
ВПШ успело стать ещё и музыкальной вывеской. Как называется лейбл?|VPSH also became a music brand. What is the label called?
Сколько треков в трек-листе альбома «МУЗЫКА ДЛЯ ВЗРОСЛЫХ»?|How many tracks are on “MUSIC FOR ADULTS”?
11 треков. Число 34 — это название одного из треков, не размер альбома.|11 tracks. The number 34 is one track's title, not the album's length.
Сколько позиций надо пережить, чтобы пройти альбом от Intro до «Зае»?|How many tracks must you get through to finish the album from Intro to “Zae”?
Арифметика взрослой музыки: сколько треков в альбоме?|Adult-music arithmetic: how many tracks are on the album?
Какова общая длительность альбома по трек-листу?|What is the album's total running time according to its track listing?
Общая длительность указана как 22 минуты 53 секунды. Компактно, без режиссёрской версии.|The total running time is listed as 22 minutes 53 seconds. Compact, with no director's cut.
Вопрос на миллион для человека, который реально смотрел метаданные: сколько длится альбом?|A million-dollar question for someone who actually read the metadata: how long is the album?
Что ближе всего к полной длительности «Музыки для взрослых»?|Which is closest to the full running time of “Music for Adults”?
Как называется второй трек альбома после Intro?|What is the second track, after Intro, called?
«Бар»|“Bar”
«Дура»|“Fool”
Второй трек — «666».|The second track is “666.”
Что идёт под номером 2 в «Музыке для взрослых»?|What is track number 2 on “Music for Adults”?
Intro закончилось. Что играет дальше?|Intro has finished. What plays next?
Какой трек стоит третьим в альбоме?|Which track is third on the album?
Трек №3 — «La Vida Loca».|Track number 3 is “La Vida Loca.”
После «666» в трек-листе внезапно начинается…|After “666,” the track listing suddenly launches into…
Выберите реальный трек №3, пока демон не забрал 50/50.|Pick the real third track before the demon takes your 50/50.
Как называется четвёртый трек альбома?|What is the fourth track on the album called?
«Жёстко»|“Hard”
«Мягко»|“Soft”
«Богато»|“Rich”
«Тревожно»|“Anxious”
Четвёртый трек — «Жёстко». Ответ как будто сам себя подсказал.|The fourth track is “Hard.” The answer almost gives itself away.
Что в трек-листе идёт сразу после «La Vida Loca»?|What comes immediately after “La Vida Loca” in the track listing?
На четвёртой позиции всё становится… как?|At track four, everything gets… what?
Под каким номером в альбоме стоит титульный трек «Музыка для взрослых»?|What number is the title track “Music for Adults” on the album?
Титульный трек стоит под номером 7.|The title track is number 7.
Титульная песня спрятана не первой. Какая у неё позиция?|The title song is not first. What is its position?
Сколько треков нужно пройти, чтобы добраться до одноимённой песни?|How far through the tracks must you go to reach the title song?
Какой трек занимает 10-е место в альбоме?|Which track occupies tenth place on the album?
«Лувр»|“Louvre”
«Клуб»|“Club”
«Бутик»|“Boutique”
Трек №10 называется «Бар». Совпадение с планами после игры не гарантировано.|Track number 10 is called “Bar.” No promises that it matches your post-game plans.
Предпоследний полноценный заход перед «Зае» — это…|The penultimate stop before “Zae” is…
На позиции №10 внезапно появляется место, куда логично идти после викторины. Что это?|Track 10 names somewhere you might go after a quiz. What is it?
Какое альтернативное название имеет трек «Европа» на российских площадках?|What alternative title does “Europe” have on Russian platforms?
«Панна-котта»|“Panna Cotta”
«Тирамису»|“Tiramisu”
«Крем-брюле»|“Crème Brûlée”
«Шарлотка»|“Charlotte Cake”
На российских площадках у трека «Европа» указано альтернативное название «Панна-котта» и другой текст.|On Russian platforms, “Europe” has the alternative title “Panna Cotta” and different lyrics.
Какой десерт внезапно стал альтернативным названием песни «Европа»?|Which dessert unexpectedly became the alternative title of “Europe”?
Хард-вопрос: что связывает трек «Европа» и меню итальянского ресторана?|A tough question: what connects “Europe” with an Italian restaurant menu?
С кем Игорь выпустил «Гимн Ютуба» в 2015 году?|Who joined Igor on “YouTube Anthem” in 2015?
Ирина Ваймер|Irina Vaymer
Дина Саева|Dina Saeva
Ксения Собчак|Ksenia Sobchak
Катя Клэп|Katya Klep
С Ириной Ваймер. Очень олдовый слой дискографии.|Irina Vaymer. A very old-school layer of the discography.
Какой дуэт стоит за синглом «Гимн Ютуба»?|Which duet is behind the single “YouTube Anthem”?
2015-й, «Гимн Ютуба»: кто рядом с Синяком в кредитах?|2015, “YouTube Anthem”: whose name appears alongside Sinyak in the credits?
Как назывался трек 2021 года, который некоторые издания считают музыкальным дебютом Синяка?|What was the 2021 track that some outlets describe as Sinyak's musical debut called?
«Двигай»|“Move”
«Стой»|“Stop”
«Плати»|“Pay”
«Гугли»|“Google It”
«Двигай». Некоторые издания именно этот трек называли дебютным.|“Move.” Some outlets described this particular track as his debut.
Какой глагол стал названием его заметного сингла 2021 года?|Which verb became the title of his notable 2021 single?
С кем записана «Самая гейская песня» 2021 года?|Who joined him on “The Gayest Song” in 2021?
Андрей Петров|Andrey Petrov
Андрей Малахов|Andrey Malakhov
Андрей Аршавин|Andrey Arshavin
Андрей Губин|Andrey Gubin
С Андреем Петровым. Здесь название песни — официальный метаданный факт, не наш троллинг.|Andrey Petrov. The song title is official metadata, not our trolling.
Кто указан вторым исполнителем у «Самой гейской песни»?|Who is credited as the second performer on “The Gayest Song”?
Как назывался сингл Синяка 2022 года?|What was Sinyak's 2022 single called?
«Малыш»|“Baby”
«Миллионер»|“Millionaire”
«Парижанин»|“Parisian”
«Воркута»|“Vorkuta”
Сингл 2022 года — «Малыш».|The 2022 single was “Baby.”
Какое ласковое слово стало названием релиза 2022-го?|Which affectionate word became the title of a 2022 release?
Какой макси-сингл вышел у IGOR SINYAK в октябре 2024 года?|Which maxi-single did IGOR SINYAK release in October 2024?
«Ошибка»|“Mistake”
«Мимо»|“Missed”
«Проиграла»|“Lost”
«Дура». На Apple Music релиз также фигурирует как «Розовые очки / Дура».|“Fool.” On Apple Music, the release also appears as “Rose-Colored Glasses / Fool.”
Что вышло после альбома в 2024-м и на Apple Music ещё фигурирует вместе с «Розовыми очками»?|What followed the album in 2024 and also appears alongside “Rose-Colored Glasses” on Apple Music?
С кем записан сингл «Падаю» 2025 года?|Who features on the 2025 single “Falling”?
Лил псина|Lil Psina
DJ Воркута|DJ Vorkuta
MC Пудра|MC Powder
«Падаю» записан с Лил псиной (Дарьей Каплан).|“Falling” was recorded with Lil Psina (Darya Kaplan).
Кто присоединился к IGOR SINYAK на треке «Падаю»?|Who joined IGOR SINYAK on “Falling”?
Под каким другим псевдонимом у Игоря появился релиз в 2026 году?|Under what other alias did Igor release music in 2026?
В 2026 году у него появился релиз под псевдонимом Angel.|In 2026, he released music under the alias Angel.
Какой альтер-нейм открыл музыкальную ветку 2026 года?|Which alternate name opened his 2026 musical chapter?
Как называется сингл, выпущенный в 2026 году под псевдонимом Angel?|What is the single released under the name Angel in 2026 called?
Сингл называется «Total Control».|The single is called “Total Control.”
Что выпустил Angel в мае 2026-го?|What did Angel release in May 2026?
Какую награду от Видфеста получило ВПШ в 2016 году?|Which award did VPSH receive from Vidfest in 2016?
«Лайк за паблик»|“A Like for the Community”
«Золотой Birkin»|“Golden Birkin”
«Паблик десятилетия»|“Community of the Decade”
«Лучший французский блог»|“Best French Blog”
В 2016 году ВПШ получило от Видфеста награду «Лайк за паблик».|In 2016, VPSH received Vidfest's “A Like for the Community” award.
Что из этого действительно забрал паблик ВПШ на Видфесте-2016?|Which award did the VPSH page actually take home at Vidfest 2016?
Какую награду журнал Oops! дал ВПШ в 2016 году?|Which award did Oops! magazine give VPSH in 2016?
«Лучший паблик ВКонтакте»|“Best VKontakte Community”
«Лучший Telegram Парижа»|“Best Telegram Channel in Paris”
«Лучший визажист года»|“Makeup Artist of the Year”
«Самый дорогой паблик Европы»|“Europe's Most Expensive Community”
Oops! назвал ВПШ «Лучшим пабликом ВКонтакте».|Oops! named VPSH the “Best VKontakte Community.”
Вторая наградная ветка 2016-го: кем ВПШ назвал Oops!?|Another 2016 award: what did Oops! call VPSH?
Какую награду от VK ВПШ получило по итогам 2020 года?|Which VK award did VPSH receive for 2020?
«Подкаст года»|“Podcast of the Year”
«Фото года»|“Photo of the Year”
«Игра года»|“Game of the Year”
«Мем десятилетия»|“Meme of the Decade”
По итогам 2020 года VK отметило ВПШ как «Подкаст года».|VK recognized VPSH as “Podcast of the Year” for 2020.
Что ВКонтакте отметило у ВПШ в 2020-м?|What did VKontakte recognize VPSH for in 2020?
С каким техноблогером Игорь запечатлён на Видфесте-2018 в Москве?|Which tech blogger is pictured with Igor at Vidfest 2018 in Moscow?
На фото с Видфеста-2018 рядом с ним — Wylsacom. Русский YouTube Cinematic Universe.|Wylsacom is next to him in the Vidfest 2018 photo. The Russian YouTube Cinematic Universe.
Кто оказался рядом с Синяком на известном фото с московского Видфеста-2018?|Who appears beside Sinyak in the well-known photo from Moscow's Vidfest 2018?
В каком городе произошло вооружённое ограбление квартиры Игоря в январе 2026 года?|In which city was Igor's apartment robbed at gunpoint in January 2026?
Дубай|Dubai
Лондон|London
В Париже. Инцидент произошёл в его квартире в январе 2026 года.|Paris. The incident took place in his apartment in January 2026.
Где случился самый неприятный парижский сюжет 2026-го?|Where did the most unpleasant Parisian episode of 2026 happen?
Что, по сообщениям о нападении, было среди похищенного?|According to reports of the attack, what was among the stolen property?
Сумки Hermès и украшения|Hermès bags and jewelry
Коллекция игровых мышек|A collection of gaming mice
Три велосипеда BMX|Three BMX bicycles
Редкие винилы «Сплина»|Rare Splean vinyl records
Сообщалось о коллекции люксовых сумок Hermès и ювелирных украшениях.|Reports mentioned a collection of luxury Hermès bags and jewelry.
Какой набор звучит люксово, но в этой истории — не шутка?|Which collection sounds luxurious but is no joke in this story?
Когда на YouTube-канале «Осторожно: Собчак» вышло большое интервью с Игорем?|When was the long interview with Igor published on the “Caution: Sobchak” YouTube channel?
1 января 2026|January 1, 2026
17 сентября 2025|September 17, 2025
Выпуск опубликован 31 мая 2026 года.|The episode was published on May 31, 2026.
Какую дату ставим под трёхчасовым парижским интервью 2026 года?|What date goes under the three-hour Paris interview of 2026?
Какая модель сумки стала отдельной героиней интервью Собчак с Синяком?|Which handbag model became a character in its own right in Sobchak's interview with Sinyak?
Пакет из супермаркета|A supermarket shopping bag
Birkin — одна из центральных тем выпуска: коллекция, покупки и разговор о стоимости.|Birkin is one of the episode's main subjects: the collection, purchases, and a discussion of prices.
Что чаще всего пахло люксом в парижском выпуске?|What most often “smelled of luxury” in the Paris episode?
Бутик какого модного дома фигурировал в интервью Собчак?|Which fashion house's boutique featured in Sobchak's interview?
В выпуске есть отдельный сегмент в бутике Schiaparelli.|The episode includes a separate segment in a Schiaparelli boutique.
Где в выпуске буквально «пахло люксом» отдельным сегментом?|Which location got its own “smells of luxury” segment in the episode?
Примерно сколько длится большое интервью Собчак с Синяком?|Approximately how long is Sobchak's full interview with Sinyak?
Больше 3 часов|More than 3 hours
12 минут|12 minutes
38 минут|38 minutes
Ровно 1 час|Exactly 1 hour
Выпуск идёт больше трёх часов. Это уже не интервью, а сезон сериала.|The episode runs for over three hours. That is practically a whole TV season.
Это не Shorts. Какого масштаба выпуск «Осторожно: Собчак»?|This is no Short. How long is the “Caution: Sobchak” episode?
Название какого НЕ запущенного шоу обсуждали в интервью 2026 года?|Which show that NEVER launched was discussed in the 2026 interview?
«Синяк за любовь?»|“Sinyak for Love?”
«ВПШ ищет жениха»|“VPSH Seeks a Groom”
«Париж, выбери меня»|“Paris, Pick Me”
В интервью действительно есть глава «Почему не запустил шоу “Синяк за любовь?”».|The interview really has a chapter titled “Why Didn't You Launch ‘Sinyak for Love?’”
Какой проект звучит как реальный dating-show, но так и не был запущен?|Which project sounds like a real dating show but never launched?
Какие три темы вынесены прямо в название большого интервью Собчак?|Which three topics appear in the title of Sobchak's full interview?
Ограбление, хейтеры и коллекция Birkin|The robbery, haters, and the Birkin collection
Шахматы, дача и ремонт|Chess, a country house, and renovations
Футбол, крипта и рыбалка|Football, crypto, and fishing
Космос, тракторы и балет|Space, tractors, and ballet
Название выпуска прямо перечисляет: ограбление, хейтеры и коллекция Birkin.|The episode title explicitly lists the robbery, haters, and the Birkin collection.
Если читать только заголовок выпуска, что там обещают?|If you only read the episode's title, what does it promise?
Кто из этих блогеров действительно фигурировал в ранних разборах Синяка?|Which blogger really appeared in Sinyak's early critiques?
Рома Жёлудь|Roma Zhelud
PewDiePie исключительно на шведском|PewDiePie exclusively in Swedish
Рома Жёлудь был одним из заметных героев ранних выпусков; ролик о нём в 2012-м помог росту популярности.|Roma Zhelud was a notable subject of the early episodes; a 2012 video about him helped the channel grow.
Какое имя относится к той самой олдовой YouTube-эре «Вся правда шоу»?|Which name belongs to that old-school “Whole Truth Show” YouTube era?
Сколько подписчиков было у YouTube-канала примерно к сентябрю 2019 года по архивным данным?|Approximately how many subscribers did the YouTube channel have by September 2019, according to archived records?
Более полумиллиона|More than half a million
Около 5 тысяч|About 5 thousand
Более 20 миллионов|More than 20 million
Ровно 34 человека|Exactly 34 people
Архивные данные указывают более полумиллиона подписчиков к сентябрю 2019 года.|Archived records indicate more than half a million subscribers by September 2019.
Какой порядок аудитории был у канала к 2019-му?|Roughly how large was the channel's audience by 2019?
Соцсети|Social media
Когда, согласно биографической карточке, был создан Instagram Игоря?|When was Igor's Instagram account created, according to his biographical profile?
Апрель 2013|April 2013
Апрель 2023|April 2023
Сентябрь 2011|September 2011
Май 2026|May 2026
В биографической карточке указан апрель 2013 года.|The biographical profile lists April 2013.
Хард для архивариуса соцсетей: с какого месяца/года считается его Instagram?|A tough one for social-media archivists: which month and year mark the start of his Instagram?
С какого года Игорь ведёт Telegram-канал в формате личного блога?|Since which year has Igor run his Telegram channel as a personal blog?
С 2022 года Telegram-канал ведётся как личный блог.|Since 2022, the Telegram channel has operated as a personal blog.
Когда Telegram стал одной из основных площадок личного контента?|When did Telegram become one of his main platforms for personal content?
Как называется последний, 11-й трек альбома «Музыка для взрослых»?|What is the last, eleventh track on “Music for Adults” called?
«Зае»|“Zae”
«Финал»|“Finale”
«Пока»|“Bye”
Трек №11 — «Зае».|Track number 11 is “Zae.”
Чем заканчивается трек-лист после «Бара»?|What closes the track listing after “Bar”?
Какое число само стало названием одного из треков альбома?|Which number is itself a track title on the album?
На альбоме есть трек «34».|The album includes a track called “34.”
В трек-листе есть песня, которая выглядит как возраст, номер автобуса или пароль. Что это?|One song title looks like an age, a bus number, or a password. What is it?
Как звучит полное имя Игоря Синяка?|What is Igor Sinyak's full name?
Витальевич|Vitalyevich
Владимирович|Vladimirovich
Сергеевич|Sergeyevich
Парижевич|Parizhevich
Игорь Витальевич Синяк.|Igor Vitalyevich Sinyak.
Какое отчество у Игоря?|What is Igor's patronymic?
Какой набор профессий лучше всего совпадает с публичной биографией Синяка?|Which set of professions best matches Sinyak's public biography?
Бьюти-блогер, ютубер, автор-исполнитель|Beauty blogger, YouTuber, singer-songwriter
Хирург, пилот, геолог|Surgeon, pilot, geologist
Футболист, судья, тренер|Footballer, referee, coach
Архитектор, химик, астронавт|Architect, chemist, astronaut
Именно так его обычно описывают публичные справки: блогер/ютубер и автор-исполнитель.|Public profiles generally describe him this way: blogger/YouTuber and singer-songwriter.
Что из этого не фанфик резюме, а нормальное описание его карьеры?|Which is a real description of his career rather than a fan-fiction résumé?
Городские секреты|City secrets
Кто поставил пальму на rondo de Gaulle’a?|Who installed the palm tree at rondo de Gaulle’a?
Йоанна Райковска|Joanna Rajkowska
Тамара Лемпицкая|Tamara de Lempicka
Магдалена Абаканович|Magdalena Abakanowicz
Зофья Стрыенская|Zofia Stryjeńska
Пальма — работа Райковской.|The palm tree is Rajkowska's work.
Go To Warsaw · Неочевидная Варшава|Go To Warsaw · Hidden gems of Warsaw
Чем раньше была Gnojna Góra?|What was Gnojna Góra before?
Свалкой|A rubbish dump
Вулканом|A volcano
Крепостью|A fortress
Вокзалом|A railway station
Панорама выросла на бывшей свалке.|The viewpoint grew on a former rubbish dump.
Где спрятались финские деревянные домики?|Where are the Finnish wooden houses hidden?
Ищите их в Jazdów.|Look for them in Jazdów.
Какое желание исполняет колокол на Kanonia по легенде?|According to legend, which wish does the bell in Kanonia grant?
Загаданное после трёх обходов|One made after walking around it three times
Только денежное|Only wishes for money
Только желание короля|Only the king's wish
Написанное на билете|One written on a ticket
Три круга — правило легенды.|Three laps are the rule in the legend.
Что необычного внутри костёла святой Анны в Вилянуве?|What unusual object is inside St. Anne's Church in Wilanów?
Кость мамонта|A mammoth bone
Метеорит|A meteorite
Подводная лодка|Submarine
Робот|Robot
Кость нашли при строительстве.|The bone was discovered during construction.
Кого поселили в Przyjaźń в 1952 году?|Who moved into Przyjaźń in 1952?
Строителей Дворца культуры|Builders of the Palace of Culture
Королевскую свиту|The royal entourage
Пилотов дирижаблей|Airship pilots
Шоколатье|Chocolatiers
Деревянный посёлок строили для рабочих.|The wooden settlement was built for workers.
После завода|Factories reborn
Что производила Elektrownia Powiśle?|What did Elektrownia Powiśle produce?
Электричество|Electricity
Шоколад|Chocolate
Пиво|Beer
Трамваи|Trams
Это бывшая электростанция.|It is a former power station.
Go To Warsaw · Новая жизнь заводов|Go To Warsaw · New life for factories
Что раньше делали на территории Koneser?|What used to be made at Koneser?
Водку|Vodka
Автобусы|Buses
Шёлк|Silk
Фарфор|Porcelain
Сохранилась архитектура водочного завода.|The vodka distillery's architecture survives.
Какое прошлое у Browary Warszawskie?|What is the industrial past of Browary Warszawskie?
Пивоварение|Brewing
Судостроение|Shipbuilding
Добыча угля|Coal mining
Авиация|Aviation
Browary означает пивоварни.|Browary means breweries.
С какой промышленностью связан Norblin?|Which industry is Norblin associated with?
Металлообработка|Metalworking
Книгопечатание с основания|Printing from the beginning
Киноплёнка|Photographic film
Завод выпускал металлические изделия.|The factory produced metal goods.
В каком стиле построили Hala Koszyki?|In which style was Hala Koszyki built?
Модерн|Art Nouveau
Брутализм|Brutalism
Готика|Gothic
Конструктивизм|Constructivism
Историческая торговая зала — модерн.|The historic market hall is Art Nouveau.
Какой кинотеатр находится в Fabryka Norblina?|Which cinema is in Fabryka Norblina?
Кино дополнило бывшую фабрику.|A cinema became part of the former factory.
Танцпол|Dance floor
Какая пара клубов соседствует на 11 Listopada?|Which pair of clubs are neighbors on 11 Listopada?
Hydrozagadka и Chmury|Hydrozagadka and Chmury
Enklawa и Luna|Enklawa and Luna
Palladium и Rascal|Palladium and Rascal
Bar Studio и Brać|Bar Studio and Brać
Оба указаны по адресу 22.|Both are listed at number 22.
Go To Warsaw · Где танцуют|Go To Warsaw · Where to dance
Где находится Bar Studio?|Where is Bar Studio?
Дворец культуры|Palace of Culture
Королевский замок|Royal Castle
Вокзал Centralna|Centralna station
Вилянув|Wilanów
Танцы прямо у PKiN.|Dancing right beside the Palace of Culture.
На какой улице искать Enklawa?|On which street should you look for Enklawa?
Клуб связан с Mazowiecka.|The club is associated with Mazowiecka.
Какой мост служит ориентиром для K-Bar?|Which bridge is a landmark for K-Bar?
Понятовского|Poniatowski Bridge
Гданьский|Gdański Bridge
Северный|Northern Bridge
Секерковский|Siekierkowski Bridge
K-Bar указан у моста Понятовского.|K-Bar is listed near Poniatowski Bridge.
Какое заведение есть на Mazowiecka вместе с Enklawa?|Which venue is on Mazowiecka alongside Enklawa?
Это ещё один танцевальный адрес.|It is another address for dancing.
Какие ностальгические вечеринки отмечает гид танцполов?|Which nostalgic parties does the dance-floor guide mention?
В стиле 90-х и 2000-х|1990s and 2000s parties
Только XIX века|Only 19th-century parties
Только ренессанс|Only Renaissance parties
Только диско XVIII века|Only 18th-century disco
Ретро-вечеринки входят в городскую ночную жизнь.|Retro parties are part of the city's nightlife.
Живой звук|Live music
Какой клуб искать на Armii Ludowej?|Which club should you look for on Armii Ludowej?
Адрес клуба — Armii Ludowej 14.|The club's address is Armii Ludowej 14.
Go To Warsaw · Музыка в городе|Go To Warsaw · Music in the city
Где проходят джемы из городского музыкального гида?|Where do the jam sessions from the city's music guide take place?
Гид отмечает джем-сейшены этого бара.|The guide highlights this bar's jam sessions.
На какой улице расположен BARdzo bardzo?|On which street is BARdzo bardzo?
Музыкальный адрес — Nowogrodzka 11.|The music venue's address is Nowogrodzka 11.
Как называется концертная арена в списке рядом с Narodowy?|What concert arena is listed alongside Narodowy?
Torwar принимает концерты.|Torwar hosts concerts.
Какая пара названа концертными клубами?|Which pair are described as concert clubs?
Proxima и Palladium|Proxima and Palladium
Rusałka и Lussi|Rusałka and Lussi
BUW и POLIN|BUW and POLIN
Ćma и Rascal|Ćma and Rascal
Оба входят в концертную карту.|Both are on the city's concert map.
На какой улице искать W Oparach Absurdu?|On which street should you look for W Oparach Absurdu?
Культовый пражский бар на Ząbkowska.|The iconic Praga bar is on Ząbkowska.
Барная карта|Bar map
Чем выделяются BarKa, Wynurzenie и Wir?|What makes BarKa, Wynurzenie, and Wir distinctive?
Это бары на баржах|They are bars on barges
Все под землёй|They are all underground
Все в аэропорту|They are all at the airport
Это молочные бары|They are milk bars
Встречаются на Висле.|You can find them on the Vistula.
Go To Warsaw · Бары Варшавы|Go To Warsaw · Warsaw bars
Какой бар искать на Hoża?|Which bar should you look for on Hoża?
Pacyfik — адрес на Hoża.|Pacyfik is on Hoża.
На какой улице находится Same Krafty?|On which street is Same Krafty?
Крафтовый адрес в Старом городе.|A craft-beer address in the Old Town.
Где находится Ministerstwo Śledzia i Wódki?|Where is Ministerstwo Śledzia i Wódki?
В гиде указан Foksal 18.|The guide lists Foksal 18.
Какой бар связан с Sierakowskiego?|Which bar is associated with Sierakowskiego?
Brać — правобережный адрес.|Brać is on the right bank.
Какую улицу делят Zamieszanie и Rakieta?|Which street do Zamieszanie and Rakieta share?
Оба отмечены на Nowy Świat.|Both are listed on Nowy Świat.
Ночной перекус|Late-night bites
На какой улице проходит Nocny Market?|On which street does Nocny Market take place?
Городской гид указывает Towarowa 3.|The city guide lists Towarowa 3.
Go To Warsaw · Еда после прогулки|Go To Warsaw · Food after a walk
Где искать ресторан Ćma?|Where should you look for the restaurant Ćma?
Ćma связана с Koszykowa 63.|Ćma is associated with Koszykowa 63.
За чем идут в Pałaszowanie?|What do people go to Pałaszowanie for?
За запеканкой|Zapiekanka
За устрицами|Oysters
За фондю|Fondue
За димсамами|Dim sum
Гид относит его к запеканкам.|The guide lists it as a place for zapiekanka.
Что предлагают Sapko, Ensaf и Tendur?|What do Sapko, Ensaf, and Tendur serve?
Кебаб|Kebab
Только мороженое|Only ice cream
Только пирожные|Only pastries
Фондю|Fondue
Это адреса для кебаба.|These are kebab addresses.
Где искать летний Plac Zabaw nad Wisłą?|Where should you look for the summer venue Plac Zabaw nad Wisłą?
Название не врёт: рядом Висла.|The name tells the truth: the Vistula is nearby.
Какой food hall стоит на Dobra?|Which food hall is on Dobra?
Бывшая электростанция на Dobra 42.|The former power station at Dobra 42.
Что заказать|What to order
Что такое pyzy?|What are pyzy?
Картофельные клёцки|Potato dumplings
Рыбный суп|Fish soup
Торт|Cake
Колбаски|Sausages
Их связывают с пражской кухней.|They are associated with Praga cuisine.
Go To Warsaw · Варшавская кухня|Go To Warsaw · Warsaw cuisine
Какой рынок прославился pyzy?|Which market became famous for pyzy?
Знаменитый пражский рынок.|The famous Praga market.
Какая закваска лежит в основе żurek?|Which fermented starter is the base of żurek?
Ржаная|Rye
Рисовая|Rice
Виноградная|Grape
Кукурузная|Corn
Ржаная закваска даёт кислинку.|Fermented rye starter gives it its sourness.
Какой суп подают холодным?|Which soup is served cold?
Летний суп на кефире или сыворотке.|A summer soup made with kefir or whey.
Откуда название пирожного wuzetka?|Where does the name of the wuzetka cake come from?
От трассы W-Z|The W-Z Route
От имени повара|The chef's name
От района Wawer|The Wawer district
От вокзала Zachodnia|Zachodnia station
Название связано с послевоенной трассой.|The name is linked to the postwar route.
В честь кого назвали zygmuntówka?|Who was the zygmuntówka cake named after?
Сигизмунда III Вазы|Sigismund III Vasa
Коперника|Copernicus
Шопена|Chopin
Яна Собеского|Jan Sobieski
Пирожное носит королевское имя.|The pastry bears a royal name.
За вкусным на рынок|To market for good food
Какой рынок стоит на plac Mirowski?|Which market is on plac Mirowski?
Название площади помогает сориентироваться.|The square's name helps you find it.
Go To Warsaw · Рынки Варшавы|Go To Warsaw · Warsaw markets
Какой рынок искать на Zamieniecka?|Which market should you look for on Zamieniecka?
Указанный адрес — Zamieniecka 80.|The listed address is Zamieniecka 80.
Какой рынок связан с органическими продуктами?|Which market is associated with organic produce?
Вещевой аукцион|A clothing auction
Биржа билетов|A ticket exchange
Авторынок|A car market
Гид рекомендует его за экопродуктами.|The guide recommends it for organic produce.
Какой гастрорынок расположен в Forteca?|Which food market is located in Forteca?
Там встречаются с производителями еды.|It is a place to meet food producers.
Что означает Targ Śniadaniowy?|What does Targ Śniadaniowy mean?
Завтрачный рынок|Breakfast market
Рыбный порт|Fishing port
Ночной поезд|Night train
Блошиный рынок|Flea market
Śniadanie — завтрак.|Śniadanie means breakfast.
Какой базар ищут на Olkuska?|Which market can you find on Olkuska?
Название совпадает с улицей.|Its name matches the street.
Висла и чилл|Vistula and chill
На каком берегу расположены главные бульвары?|On which bank are the main boulevards?
Левом|Left
Правом|Right
На обоих одинаково|Equally on both
На острове|On an island
Левобережье — городской променад.|The left bank is the urban promenade.
Go To Warsaw · Варшавская Висла|Go To Warsaw · Warsaw's Vistula
На каком берегу находится природная экотропа?|On which bank is the natural eco-trail?
Под рекой|Under the river
На крыше|On a rooftop
Правобережная тропа ближе к природе.|The right-bank trail is closer to nature.
Какую сеть охраны природы упоминают для Вислы?|Which nature-conservation network is mentioned for the Vistula?
Речные острова важны для птиц.|The river islands are important for birds.
Что находится у подножия Старого города?|What is at the foot of the Old Town?
Парк фонтанов|Fountain Park
Аэропорт|Airport
Ипподром|Racecourse
Шоколадная фабрика|Chocolate factory
Фонтаны стоят у Вислы.|The fountains are beside the Vistula.
У какого моста гид предлагает пляжный волейбол?|Near which bridge does the guide suggest beach volleyball?
Северного|Northern Bridge
Гданьского|Gdański Bridge
Лазенковского|Łazienkowski Bridge
Пляж у моста Понятовского.|The beach is near Poniatowski Bridge.
Какой символ города стоит рядом с Коперником?|Which city symbol stands beside the Copernicus Science Centre?
Русалка|Mermaid
Дракон|Dragon
Лев|Lion
Медведь|Bear
Это одна из варшавских Сиренок.|It is one of Warsaw's mermaids.
Старая Варшава|Old Warsaw
Кто стоит на колонне Замковой площади?|Who stands on the column in Castle Square?
Сигизмунд III Ваза|Sigismund III Vasa
Шопен|Chopin
Коперник|Copernicus
Понятовский|Poniatowski
Здесь часто назначают встречи.|It is a popular meeting point.
Go To Warsaw · Старый город|Go To Warsaw · Old Town
Что охраняет центр Рыночной площади?|What guards the center of the Market Square?
Грифон|Griffin
Базилиск|Basilisk
Золотая утка|Golden duck
Сиренка — городской символ.|The mermaid is the city's symbol.
Какая организация внесла Старый город в список наследия?|Which organization listed the Old Town as a heritage site?
ЮНЕСКО|UNESCO
ФИФА|FIFA
НАСА|NASA
ОПЕК|OPEC
Старый город признан всемирным наследием.|The Old Town is recognized as a World Heritage Site.
Где принимали Конституцию 3 мая?|Where was the Constitution of May 3 adopted?
Это бывшая королевская резиденция.|It is a former royal residence.
Какой псевдоним носил Бернардо Беллотто?|What name did Bernardo Bellotto work under?
Каналетто|Canaletto
Караваджо|Caravaggio
Бэнкси|Banksy
Матейко|Matejko
Его виды города есть в замке.|His views of the city are in the castle.
Кого из пианистов похоронили в архикафедральном соборе?|Which pianist is buried in the archcathedral?
Падеревского|Paderewski
Рубинштейна|Rubinstein
Листа|Liszt
Рахманинова|Rachmaninoff
Игнацы Ян Падеревский был также политиком.|Ignacy Jan Paderewski was also a politician.
Дворец с характером|A palace with character
В каком году открыли PKiN?|In which year did the Palace of Culture and Science open?
Дворец открылся в 1955 году.|The palace opened in 1955.
Go To Warsaw · Дворец культуры|Go To Warsaw · Palace of Culture
На каком этаже смотровая терраса PKiN?|On which floor is the Palace of Culture's viewing terrace?
Классическая панорама с 30-го этажа.|The classic panorama is from the 30th floor.
Как высоко находится терраса PKiN?|How high is the Palace of Culture's viewing terrace?
114 метров|114 meters
30 метров|30 meters
230 метров|230 meters
310 метров|310 meters
Это высота террасы, не шпиля.|That is the terrace's height, not the spire's.
На какой площади стоит PKiN?|On which square does the Palace of Culture stand?
Адрес — Plac Defilad 1.|The address is Plac Defilad 1.
Каков стиль скульптур на фасаде PKiN?|What is the style of the sculptures on the Palace of Culture's facade?
Соцреализм|Socialist realism
Кубизм|Cubism
Рококо|Rococo
Поп-арт|Pop art
Фигуры представляют труд, науку и культуру.|The figures represent work, science, and culture.
Что расположено внутри PKiN помимо офисов?|What is inside the Palace of Culture besides offices?
Театры и кинотеатр|Theaters and a cinema
Морской порт|A seaport
Терминал аэропорта|An airport terminal
Дворец объединяет разные культурные площадки.|The palace brings together several cultural venues.
Сад над книгами|A garden above books
Что скрывается на крыше BUW?|What is hidden on the roof of BUW?
Сад|A garden
Стадион|Stadium
Аэродром|An airfield
Водочный завод|A vodka distillery
Один из необычных городских садов.|One of the city's unusual gardens.
Go To Warsaw · Библиотека BUW|Go To Warsaw · BUW Library
На какой улице стоит BUW?|On which street is BUW?
Библиотека расположена на Dobra.|The library is on Dobra.
Каким цветом выделяется стекло BUW?|What distinctive color is BUW's glass?
Зелёным|Green
Розовым|Pink
Оранжевым|Orange
Красным|Red
Бетон сочетается с зелёным стеклом.|Concrete is combined with green glass.
Какое искусство показывает галерея при BUW?|What art does the gallery at BUW display?
Польский плакат|Polish posters
Только иконы|Only icons
Только фарфор|Only porcelain
Только античные монеты|Only ancient coins
Представлены послевоенные польские плакаты.|Postwar Polish posters are on display.
Куда можно заглянуть сверху из сада BUW?|What can you look down into from BUW's garden?
В интерьер библиотеки|The library interior
В метро|The metro
В футбольную раздевалку|A football changing room
В шахту|A mine shaft
Сад позволяет увидеть библиотеку сверху.|The garden lets you see the library from above.
Для какого университета построена BUW?|For which university was BUW built?
Варшавского|University of Warsaw
Ягеллонского|Jagiellonian University
Лодзинского|University of Łódź
BUW — библиотека Варшавского университета.|BUW is the University of Warsaw Library.
Королевский пикник|A royal picnic
Где находится Дворец на острове?|Where is the Palace on the Isle?
Лазенки|Łazienki
Это центр королевского парка.|It is the centerpiece of the royal park.
Go To Warsaw · Лазенки|Go To Warsaw · Łazienki
Какой король устраивал четверговые обеды?|Which king held Thursday dinners?
Станислав Август Понятовский|Stanisław August Poniatowski
Ян Собеский|Jan Sobieski
Сигизмунд Старый|Sigismund the Old
Болеслав Храбрый|Bolesław the Brave
Приглашал поэтов и учёных.|He invited poets and scholars.
От какого здания произошло название Łazienki?|Which building gave Łazienki its name?
Купальня|A bathhouse
Казарма|Barracks
Мельница|A mill
Таверна|A tavern
Старая купальня стала дворцом.|An old bathhouse became a palace.
Какие яркие птицы гуляют в Лазенках?|Which colorful birds wander around Łazienki?
Павлины|Peacocks
Фламинго|Flamingo
Пингвины|Penguins
Туканы|Toucans
Они свободно гуляют по парку.|They roam freely in the park.
Чья музыка связана с концертами в Лазенках?|Whose music is associated with concerts in Łazienki?
Элвиса|Elvis
Баха исключительно|Exclusively Bach
Шопеновские концерты — традиция парка.|Chopin concerts are a park tradition.
Какой театр можно встретить в Лазенках?|What kind of theater can you find in Łazienki?
Придворный|A court theater
Только кукольный|Only a puppet theater
Подводный|An underwater theater
Ледовый|An ice theater
В парке сохранился придворный театр.|A court theater has survived in the park.
Чьей резиденцией был Вилянув?|Whose residence was Wilanów?
Яна III Собеского|Jan III Sobieski
Пилсудского|Piłsudski
Дворец связан с Яном III.|The palace is associated with Jan III.
Go To Warsaw · Дворец Вилянув|Go To Warsaw · Wilanów Palace
Какой стиль определяет дворец Вилянув?|Which style defines Wilanów Palace?
Барокко|Baroque
Баухаус|Bauhaus
Это варшавская жемчужина барокко.|It is Warsaw's Baroque gem.
Как звали супругу Собеского?|What was Sobieski's wife's name?
Мария Казимира|Marie Casimire
Бона Сфорца|Bona Sforza
Ядвига|Jadwiga
Барбара Радзивилл|Barbara Radziwiłł
Во дворце есть её покои.|Her chambers are in the palace.
Кто держит щиты солнечных часов Вилянува?|Who holds the faces of Wilanów's sundial?
Сатурн|Saturn
Нептун|Neptune
Марс|Mars
Аполлон|Apollo
Часы отражают интерес короля к астрономии.|The sundial reflects the king's interest in astronomy.
Как называется световая прогулка в Вилянуве?|What is the illuminated walk at Wilanów called?
Королевский сад света|Royal Garden of Light
Ночь Коперника|Copernicus Night
Неоновая Прага|Neon Praga
Лес лазеров|Laser Forest
Зимняя иллюминация преображает сад.|Winter illuminations transform the garden.
Какой музей находится рядом в бывшем манеже?|Which museum is nearby in the former riding school?
Плаката|Poster Museum
Эволюции|Museum of Evolution
Фармации|Museum of Pharmacy
Железной дороги|Railway Museum
Музей плаката соседствует с дворцом.|The Poster Museum is beside the palace.
Прага без открыток|Praga beyond the postcards
От чего произошло название Praga?|Where does the name Praga come from?
От выжженного леса|A burned forest
От чешской столицы|The Czech capital
От слова пирог|The word for pie
От имени русалки|A mermaid's name
Название связано с расчисткой леса.|The name is associated with clearing woodland.
Go To Warsaw · Прогулка по Праге|Go To Warsaw · A walk through Praga
Какой транспортный узел рядом с православным собором?|Which transport hub is near the Orthodox cathedral?
Здесь начинается прогулка по Старой Праге.|A walk through Old Praga begins here.
В чём подают блюда Pyzy Flaki Gorące?|What does Pyzy Flaki Gorące serve food in?
В банках|Jars
В ракушках|Seashells
В вафельных рожках|Waffle cones
В чайниках|Teapots
Так сохраняют пражскую традицию.|This preserves a Praga tradition.
Какой молочный бар находится на Floriańska?|Which milk bar is on Floriańska?
Это пражский bar mleczny.|It is a Praga bar mleczny.
Какое животное украшает Dom pod Sowami?|Which animal decorates Dom pod Sowami?
Сова|Owl
Лиса|Fox
Кот|Cat
Название означает «Дом под совами».|The name means “House under the Owls.”
Как называют длинный дом на Kijowska 11?|What is the long building at Kijowska 11 nicknamed?
Такса|Dachshund
Жираф|Giraffe
Краб|Crab
Бобёр|Beaver
Одно из прозвищ — Jamnik.|One nickname is Jamnik, meaning dachshund.
О чьей истории рассказывает POLIN?|Whose history does POLIN tell?
Польских евреев|Polish Jews
Варшавских пилотов|Warsaw pilots
Римских императоров|Roman emperors
Шведских королей|Swedish kings
Экспозиция охватывает тысячу лет.|The exhibition covers a thousand years.
Go To Warsaw · Музей POLIN|Go To Warsaw · POLIN Museum
Сколько тематических галерей в основной экспозиции?|How many themed galleries are in the permanent exhibition?
Маршрут проходит через восемь галерей.|The route runs through eight galleries.
Откуда реконструированный свод синагоги в POLIN?|Where is the reconstructed synagogue ceiling in POLIN from?
Гвоздец|Gwoździec
Париж|Paris
Лиссабон|Lisbon
Осло|Oslo
Один из ярких экспонатов музея.|One of the museum's most striking exhibits.
Как переводят Polin в легенде названия?|How is Polin translated in the legend behind the name?
Здесь отдохнёшь|Rest here
Город мостов|City of bridges
Новая звезда|New star
Большой рынок|Great market
Слово также обозначает Польшу.|The word also means Poland.
Какой памятник находится перед POLIN?|Which monument stands in front of POLIN?
Героям гетто|Monument to the Ghetto Heroes
Шопену|Chopin Monument
Сигизмунду|Sigismund's Column
Копернику|Copernicus Monument
Это памятник героям гетто.|It is the Monument to the Ghetto Heroes.
Какую улицу искать для POLIN?|Which street should you look for to find POLIN?
Музей расположен на Anielewicza 6.|The museum is at Anielewicza 6.
Шопен крупным планом|Chopin up close
В каком дворце находится музей Шопена?|In which palace is the Chopin Museum?
Острожских|Ostrogski Palace
Красиньских|Krasiński Palace
Бельведер|Belweder
Исторический дворец на Okólnik.|A historic palace on Okólnik.
Go To Warsaw · Музей Шопена|Go To Warsaw · Chopin Museum
Какой марки последний рояль Шопена в коллекции?|What brand is Chopin's last piano in the collection?
На нём он играл последние два года.|He played it during his final two years.
Какая сказочная птица у дворца Острожских?|Which legendary bird is near Ostrogski Palace?
Серебряный орёл|Silver eagle
Красный журавль|Red crane
Синий павлин|Blue peacock
Фонтан связан с городской легендой.|The fountain is linked to a city legend.
Слепок какой части тела хранит музей?|A cast of which body part is kept in the museum?
Кисти руки|Hand
Колена|Knee
Ступни|Foot
Уха|Ear
В коллекции есть слепок руки.|The collection includes a cast of his hand.
Что подарили десятилетнему Шопену за талант?|What was ten-year-old Chopin given in recognition of his talent?
Золотые часы|A gold watch
Мотоцикл|Motorcycle
Скрипку|A violin
Телескоп|A telescope
Часы входят в музейную коллекцию.|The watch is part of the museum's collection.
Кто написал прижизненный портрет Шопена из коллекции?|Who painted the portrait of Chopin from life in the collection?
Теофил Квятковский|Teofil Kwiatkowski
Ян Матейко|Jan Matejko
Энди Уорхол|Andy Warhol
Сальвадор Дали|Salvador Dalí
Портрет создан при жизни композитора.|The portrait was painted during the composer's lifetime.
Научная прогулка|A science walk
Кто проводит опыты в Копернике?|Who performs experiments at the Copernicus Science Centre?
Сами посетители|Visitors themselves
Только профессора|Only professors
Только экскурсоводы|Only tour guides
Только роботы|Only robots
Посетитель становится исследователем.|The visitor becomes a researcher.
Go To Warsaw · Центр Коперник|Go To Warsaw · Copernicus Science Centre
Что играет главную роль в Театре высокого напряжения?|What plays the main role in the High Voltage Theatre?
Электрические разряды|Electrical discharges
Огонь|Fire
Лёд|Ice
Водные струи|Water jets
Представление посвящено электричеству.|The show is devoted to electricity.
Кто выступает в Роботическом театре?|Who performs in the Robotic Theatre?
Гуманоиды|Humanoid robots
Дельфины|Dolphins
Голограммы королей|Holograms of kings
Акробаты|Acrobats
Роботы говорят и жестикулируют.|The robots speak and gesture.
Что можно мастерить в Thinkatorium?|What can you build in the Thinkatorium?
Мосты и летательные модели|Bridges and model aircraft
Только торты|Only cakes
Только плакаты|Only posters
Ювелирные кольца|Jewelry rings
Это пространство для конструирования.|It is a space for making things.
Как называется виртуальный композитор экспозиции?|What is the exhibition's virtual composer called?
AVIVA показана в «Цифровом мозге».|AVIVA is presented in “The Digital Brain.”
Какой необычный протез показывает Human 2.0?|What unusual prosthesis does Human 2.0 display?
Дополнительный большой палец|An extra thumb
Крылья|Wings
Рыбий хвост|A fish tail
Рога|Horns
Экспозиция исследует расширение возможностей тела.|The exhibition explores extending the body's capabilities.
Ретро 3D|Retro 3D
Что показывает фотопластикон?|What does the Fotoplastikon show?
Объёмные фотографии|Stereoscopic photographs
Только немое кино|Only silent films
Картины маслом|Oil paintings
Лазерные скульптуры|Laser sculptures
Изображения создают эффект глубины.|The images create an impression of depth.
Go To Warsaw · Варшавский фотопластикон|Go To Warsaw · Warsaw Fotoplastikon
Где находится фотопластикон?|Where is the Fotoplastikon?
Адрес — Aleje Jerozolimskie 51.|The address is Aleje Jerozolimskie 51.
Кому служил фотопластикон во время оккупации?|Who used the Fotoplastikon during the occupation?
Польскому подполью|The Polish underground resistance
Только туристам|Only tourists
Биржевым брокерам|Stockbrokers
Космонавтам|Astronauts
Здесь тайно встречались подпольщики.|Resistance members met here in secret.
Какая музыка сопровождала послевоенные показы?|What music accompanied the postwar shows?
Джаз|Jazz
Техно|Techno
Трэп|Trap
Драм-н-бейс|Drum and bass
Музыку ставили с привезённых пластинок.|Music was played from imported records.
Какие города помогали увидеть снимки после войны?|Which cities could visitors see in photographs after the war?
Недоступные города Запада|Inaccessible Western cities
Только вымышленные|Only imaginary cities
Только древнеримские|Only ancient Roman cities
Только подводные|Only underwater cities
Фотографии заменяли невозможные поездки.|Photographs replaced journeys that were not possible.
В каком веке открылся варшавский фотопластикон?|In which century did Warsaw's Fotoplastikon open?
Он работает с начала XX века.|It has operated since the early 20th century.
Неоновая память|Neon memories
Что спасает Музей неона?|What does the Neon Museum preserve?
Световые вывески|Illuminated signs
Старые трамваи|Old trams
Плюшевых медведей|Teddy bears
Радиоприёмники|Radio sets
Вывескам возвращают вторую жизнь.|The signs get a second life.
Go To Warsaw · Музей неона|Go To Warsaw · Neon Museum
С какой эпохой связана значительная часть коллекции?|Which era is a large part of the collection associated with?
ПНР|The Polish People's Republic
Средневековьем|The Middle Ages
Античностью|Antiquity
Наполеоновскими войнами|The Napoleonic Wars
Неоны хранят память социалистических городов.|The neon signs preserve memories of socialist cities.
Как называли плановое насыщение улиц неоном?|What was the planned introduction of neon signs to the streets called?
Неонизация|Neonization
Электролиз|Electrolysis
Урбаноспорт|Urbanosport
Светотаксис|Phototaxis
Вывески проектировали как систему.|The signs were designed as a coordinated system.
Что учитывали при проектировании неонов для улицы?|What was considered when designing street neon signs?
Архитектуру и соседние вывески|Architecture and neighboring signs
Только случайный цвет|Only a random color
Фазы Луны|The phases of the Moon
Цвет автомобилей|Car colors
Размеры и цвета согласовывали.|Sizes and colors were coordinated.
Кто создавал польские неоновые вывески?|Who created Polish neon signs?
Художники и архитекторы|Artists and architects
Только водители|Only drivers
Только спортсмены|Only athletes
Только кассиры|Only cashiers
Над ними работали профессиональные дизайнеры.|Professional designers worked on them.
Какую роль неон имел в ПНР кроме информации?|Besides providing information, what role did neon play in the Polish People's Republic?
Престиж|Prestige
Навигацию самолётов|Aircraft navigation
Обогрев улиц|Street heating
Очистку воздуха|Air purification
Вывески были знаком престижа.|The signs were a mark of prestige.
Современное искусство|Modern art
Какого цвета новое здание MSN?|What color is the new MSN building?
Белого|White
Чёрного|Black
Ярко-красного|Bright red
Зелёного|Green
Белый объём выделяется в центре.|The white building stands out in the city center.
Go To Warsaw · Музей современного искусства|Go To Warsaw · Museum of Modern Art
Как называется кинотеатр при MSN?|What is the cinema at MSN called?
Он показывает независимое кино.|It shows independent films.
На какой улице находится MSN?|On which street is MSN?
Адрес — Marszałkowska 103.|The address is Marszałkowska 103.
Какой фестиваль организует MSN?|Which festival does MSN organize?
Название переводится «Варшава в строительстве».|Its name translates as “Warsaw Under Construction.”
Какую форму имеют лестницы музея?|What shape are the museum's staircases?
Зигзаг|Zigzag
Спираль вокруг дерева|A spiral around a tree
Прямая лестница без площадок|A straight staircase without landings
Кольцо|A ring
Они напоминают о павильоне Emilia.|They recall the Emilia pavilion.
Сколько крупных галерей описывает городской гид MSN?|How many large galleries does the city guide describe at MSN?
Четыре галереи на выставочных этажах.|Four galleries on the exhibition floors.
Шоколадный город|Chocolate city
На что похож фасад музея Wedel?|What does the Wedel museum's facade resemble?
Плитку шоколада|A chocolate bar
Волну|A wave
Корабль|A ship
Пирамиду|A pyramid
Каждая «долька» имеет свой узор.|Each “square” has its own pattern.
Go To Warsaw · Фабрика шоколада Wedel|Go To Warsaw · Wedel Chocolate Factory
Из чего сделан макет Камёнка в музее?|What is the museum's model of Kamionek made from?
Из шоколада|Chocolate
Из стекла|Glass
Из соли|Salt
Из бумаги|Paper
Съедобный материал стал городским макетом.|An edible material became a model of the city.
Какой район изображает шоколадный макет?|Which neighborhood does the chocolate model depict?
Это район самой фабрики.|It is the factory's own neighborhood.
Какое сырьё начинает музейный рассказ?|Which raw ingredient begins the museum's story?
Какао-бобы|Cocoa beans
Картофель|Potatoes
Хмель|Hops
Рожь|Rye
Показан путь от боба до шоколада.|It follows the journey from bean to chocolate.
На каком этаже смотровая площадка музея?|On which floor is the museum's viewing terrace?
Отсюда видны озеро и стадион.|You can see the lake and stadium from here.
Что видно рядом с фабрикой с террасы?|What can you see near the factory from the terrace?
Kamionkowskie озеро|Kamionkowskie Lake
Балтийское море|The Baltic Sea
Татры|The Tatra Mountains
Августовский канал|The Augustów Canal
Площадка смотрит на Камёнек.|The terrace looks out over Kamionek.
Музейная дегустация|Museum tasting
Какой завод стал домом музея польской водки?|Which factory became home to the Polish Vodka Museum?
Музей занимает историческое заводское здание.|The museum occupies a historic factory building.
Go To Warsaw · Музей польской водки|Go To Warsaw · Polish Vodka Museum
Кто усовершенствовал дистилляцию в XIX веке?|Who improved distillation in the 19th century?
Ян Писториус|Jan Pistorius
Фредерик Шопен|Frédéric Chopin
Николай Коперник|Nicolaus Copernicus
Юзеф Понятовский|Józef Poniatowski
Его аппарат показан в истории технологии.|His apparatus features in the history of the technology.
Из чего сравнивают водку в академии музея?|Vodkas made from which ingredients are compared at the museum academy?
Рожь, пшеница, картофель|Rye, wheat, and potatoes
Оливки, томаты, огурцы|Olives, tomatoes, and cucumbers
Кофе, какао, чай|Coffee, cocoa, and tea
Молоко, сыр, масло|Milk, cheese, and butter
Сырьё меняет характер напитка.|The raw ingredient changes the drink's character.
Какой старый напиток Baczewski есть в коллекции?|Which historic Baczewski drink is in the collection?
Вишнёвая водка|Cherry vodka
Абсент|Absinthe
Текила|Tequila
Саке|Sake
Сохранилась закрытая бутылка 1940-х.|A sealed bottle from the 1940s has survived.
Над чем размещены столики музейного ресторана?|What are the museum restaurant's tables placed above?
Историческими печами|Historic furnaces
Аквариумом|An aquarium
Рельсами метро|Metro tracks
Бассейном|A swimming pool
Интерьер напоминает о заводе.|The interior recalls the factory.
Что предлагает составить интерактивная экспозиция?|What does the interactive exhibition invite you to create?
Рецепт настойки|A liqueur recipe
График метро|A metro timetable
План дворца|A palace plan
Партию в шахматы|A chess game
Музей рассказывает о традициях напитков.|The museum explores traditional drinks.
Зелёный перерыв|A green break
Где стоит памятник счастливой собаке?|Where is the Monument to the Happy Dog?
Саксонский сад|Saxon Garden
Камёнек|Kamionek
Необычный памятник на прогулочном маршруте.|An unusual monument on a walking route.
Go To Warsaw · Парки Варшавы|Go To Warsaw · Warsaw parks
В каком парке есть скульптура «Танцовщица»?|Which park has the sculpture “The Dancer”?
Парк известен коллекцией скульптур.|The park is known for its sculpture collection.
Где неон изображает стакан оранжада?|Where does a neon sign depict a glass of orangeade?
Старый город|Old Town
Светящийся стакан стоит у воды.|The glowing glass stands beside the water.
Какой парк славится горнолыжным склоном?|Which park is famous for its ski slope?
Неожиданный горнолыжный уголок города.|An unexpected skiing spot in the city.
У какого сада Могила Неизвестного Солдата?|Beside which garden is the Tomb of the Unknown Soldier?
Саксонского|Saxon Garden
Ботанического|Botanical Garden
Вилянувского|Wilanów Garden
Сада BUW|BUW Garden
Мемориал стоит под аркадами.|The memorial stands under the arcades.
Какое животное изображает скульптура в Park Praski?|Which animal is depicted by a sculpture in Park Praski?
Кит|Whale
Зубр|European bison
Верблюд|Camel
Жираф напоминает о соседнем зоопарке.|The giraffe recalls the neighboring zoo.
Выше города|Above the city
Сколько ступеней ведут на колокольню святой Анны?|How many steps lead up St. Anne's bell tower?
За подъём награждают видом Старого города.|The climb is rewarded with a view of the Old Town.
Go To Warsaw · Смотровые площадки|Go To Warsaw · Viewpoints
В какой башне находится Highline Warsaw?|Which tower houses Highline Warsaw?
Смотровая площадка расположена в Varso.|The viewing platform is in Varso.
Из чего насыпали Курган Варшавского восстания?|What was the Warsaw Uprising Mound built from?
Из руин города|The city's ruins
Из вулканической лавы|Volcanic lava
Из морского песка|Sea sand
Курган хранит материальную память разрушения.|The mound physically preserves the memory of the destruction.
На месте какой фабрики стоит комплекс Forest?|The Forest complex stands on the site of which kind of factory?
Кружевной|Lace factory
Шоколадной|Chocolate factory
Водочной|Vodka distillery
Самолётной|Aircraft factory
С крыши видны Повонзки.|Powązki is visible from the roof.
Какой варшавский мост двухъярусный?|Which Warsaw bridge has two levels?
Свентокшиский|Świętokrzyski Bridge
Два уровня — его узнаваемая черта.|Two levels are its distinctive feature.
На какой равнине стоит Варшава?|On which plain does Warsaw stand?
Мазовецкой низменности|Masovian Lowland
Венгерской равнине|Hungarian Plain
Паданской равнине|Po Valley
Туранской низменности|Turan Lowland
Поэтому многие смотровые точки искусственные.|That is why many viewing points are man-made.
`;
  const dictionary = Object.fromEntries(pairs.trim().split('\n').map(line => {const at=line.indexOf('|');return [line.slice(0,at),line.slice(at+1)];}));
  root.PARTY_TRANSLATIONS = Object.assign(root.PARTY_TRANSLATIONS || {}, dictionary);
  if(typeof module !== 'undefined' && module.exports) module.exports = dictionary;
})(typeof window !== 'undefined' ? window : globalThis);
