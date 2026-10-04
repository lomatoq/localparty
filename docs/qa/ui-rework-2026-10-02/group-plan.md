# HeyPals: 10 игровых групп + арт-директор

Ветка `heypals/ux-polish`. Root интегрирует общий HUD/градиенты и проверяет совместимость; game_ui_commander — отдельный арт-директор. Одновременно работают арт-директор и два агента групп. Остальные группы в очереди, каждая получает отдельного агента.

| Группа | Игры | Статус |
|---|---|---|
| 01 arena-party | push, shrink, knives, bomb, western | queued |
| 02 tanks | tanks, tankarena | implementing |
| 03 arcade-deluxe | marble_bloom, pocket_siege | queued |
| 04 arcade | taprace, punchmeter, flappy, hungry, snakelines, carryball | queued |
| 05 precision-controls | chaos, kart, western_duel | queued |
| 06 social | monster, spy, crocodile, drawguess | implementing |
| 07 quiz | sinyakquiz, warsaw, millionaire | queued |
| 08 construction | jenga, crane | queued |
| 09 tabletop | naval, poker, airhockey, mines | queued |
| 10 sports | bow_club, curling, bowling, swarm_gate, peek_shoot | queued |

Приёмка каждой игры: исходный кадр → явная композиционная/графическая разница → реальные кадры TV и телефона → решение арт-директора → исправление конкретных замечаний → повторная проверка. Старый базовый проход CSS не считается принятой визуальной переделкой.

Нельзя перекрывать управление статистикой, прятать поле за огромной шапкой, уменьшать мир боковыми полосами или заменять рабочую графику непроверенным атласом. Скиллы читаются и применяются, а не просто перечисляются в отчёте. Группы общих движков не меняют одновременно одни файлы. Новая генерация отмечается отдельно от подключённой/проверенной графики.
