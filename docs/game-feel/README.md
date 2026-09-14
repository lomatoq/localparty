# Game feel: правила виртуальной приставки

Этот слой даёт короткий общий отклик на подтверждённое игровое событие. Он не определяет попадание, счёт, физику или тайминг и не угадывает события по изменившемуся тексту. Источник истины — серверный event id, authoritative snapshot либо явный переход фазы.

## Базовый ритм

- Действие игрока подтверждается за 90–210 мс: короткая вспышка, локальный burst и, только для физического контакта, shake до 5 px и 190 мс.
- Опасность обозначается подсветкой края до 300 мс. Постоянного пульса и движения нет.
- Результат раунда получает один спокойный акцент. Наращивать ещё один эффект поверх существующей result-анимации нельзя.
- Эффект не меняет размеры, flow, hitbox, transform контроллера или safe area. Overlay имеет `position: fixed`, `pointer-events: none` и `contain: strict`.
- На телефоне частицы без glow, shake ограничен 2 px. Вибрация вызывается только в `party-player`, если браузер уже разрешает `navigator.vibrate`.
- При `prefers-reduced-motion: reduce` API сохраняет event contract, но не создаёт визуальные узлы и не вибрирует.

## Event contract

Общий API загружается во все игровые iframe как `/game-feel.js` и `/game-feel.css`:

```js
LocalPartyFeel.emit('hit', {
  id: `shot:${serverEvent.id}`, // стабильный id, обязательный для сетевых событий
  x: .62,                      // 0..1 либо экранные px
  y: .34,
  color: player.color,
  intensity: .55,              // clamp 0.12..1
  duration: 210,               // clamp 90..420 ms
  target: canvas,              // необязательно: bounded shake
  impactTarget: targetElement, // необязательно: squash/bounce
  shake: true,
  haptic: true
});
```

Допустимые типы: `hit`, `shot`, `collision`, `explosion`, `elimination`, `out-of-bounds`, `danger`, `score`, `round-result`. Повтор одного `type + id` подавляется. Одновременно создаётся не больше 11 частиц на событие; последние 128 id хранятся для дедупликации.

Игровой код отправляет событие после серверного подтверждения. Нельзя вызывать `hit` на `pointerdown`, если сервер ещё не решил, был ли контакт. Предсказуемый UI-нажим остаётся обязанностью `motion.*` и не дублируется здесь.

## Карта надёжных событий

Статус **подключено** означает явную интеграцию с authoritative event stream. **Фаза** означает общий надёжный `round-result` из `party-ui`. **Кандидат** требует отдельного явного event id в runtime; DOM-наблюдение использовать нельзя.

| Игра / runtime | Надёжный источник | События | Статус |
|---|---|---|---|
| Push Pit, Последний круг | `visualEvents.id`, `rim-out` | collision, out-of-bounds, round-result | подключено |
| Color Knives | `visualEvents.id`, `knife-hit`, `knife-clang` | shot, hit, collision, score, round-result | подключено для hit/collision/result |
| Bomb Tag | `visualEvents.id`, `bomb-pass`, `bomb-explode` | collision, explosion, elimination, round-result | подключено |
| One Shot Western | `westernShot`, authoritative result | shot, elimination, round-result | фаза; shot — кандидат |
| Bowling | `events.id`, `roll`, `finish` | collision, score, round-result | подключено для score/result |
| Curling | `events.id`, `stone`, `score`, `finish` | collision, out-of-bounds, score, round-result | подключено для score/result |
| Не грызи ворота | `events.id`, `shot`, `pulse`, `finish` | shot, hit, explosion, elimination, danger, score, round-result | подключено |
| Кто тут вылез? | `events.id`, `shot`, `friendly`, `finish` | shot, hit, elimination, danger, score, round-result | подключено |
| Tap Race | authoritative snapshot, смена лидера, `phase` | score, round-result | подключено |
| Carry Ball | authoritative owner/goal edge, `phase` | collision, score, round-result | подключено |
| Punch Meter | новый элемент в authoritative `hits` | hit, score, round-result | подключено |
| Flappy, Snake Lines | authoritative `alive: true → false` | collision, elimination, round-result | подключено |
| Hungry | authoritative рост `mass`, `dead: 0 → >0` | score, elimination, round-result | подключено |
| Local Tanks | server projectile/hit/death events | shot, hit, explosion, elimination, score | фаза; gameplay — кандидат |
| Tank Arsenal | server weapon/projectile/death events | shot, hit, explosion, elimination, score | фаза; gameplay — кандидат |
| One Cursor Chaos | level success/failure id | collision, danger, score, round-result | фаза; level event — кандидат |
| Wi-Fi Kart Party | checkpoint/lap/collision ids | collision, danger, score, round-result | фаза; gameplay — кандидат |
| Монстр по кругу | `turn:submit`, `round:reveal` | score, round-result | фаза; reveal — кандидат |
| Шпион | vote/guess resolution | score, round-result | фаза; vote result — кандидат |
| Синяк-миллионер | accepted answer/reveal | hit, danger, score, round-result | фаза; answer result — кандидат |
| Синяк: квиз-компания, Прикольная Варшава | authoritative answer reveal | hit, danger, score, round-result | фаза; answer result — кандидат |
| Крокодил | accepted guessed/skip action | score, round-result | фаза; score — кандидат |
| Тихо, дженга! | authoritative block/tower state | collision, danger, elimination, round-result | фаза; physics — кандидат |
| Crane Party | authoritative grab/drop/score | collision, score, round-result | фаза; grab/drop — кандидат |
| Морской бой | `lastShot`, hit/sunk/miss | shot, hit, explosion, elimination, score | существующий локальный FX; общий слой — кандидат |
| Draw & Guess | accepted guess/round reveal | hit, score, round-result | фаза; guess — кандидат |
| Western Duel | authoritative shot/result | shot, hit, elimination, round-result | фаза; shot — кандидат |

## Параметры по типу

| Тип | Intensity | Duration | Shake | Частицы | Haptic |
|---|---:|---:|---:|---:|---|
| shot | 0.25–0.45 | 120–180 мс | нет | нет | 6–10 мс |
| hit / collision | 0.35–0.65 | 150–210 мс | 1–3 px | 4–8 | 8–14 мс |
| explosion / elimination | 0.65–0.9 | 190–300 мс | 3–5 px | 8–11 | 18, 26, 24 мс |
| out-of-bounds / danger | 0.45–0.75 | 220–320 мс | до 2 px | 0–6 | 12, 42, 12 мс |
| score / round-result | 0.3–0.55 | 180–280 мс | нет | 4–8 | 8–12 мс |

## Чек-лист новой альфы

1. Сначала перечислить authoritative события и их уникальные id.
2. Подключить только 2–4 ключевых события, обычно `hit`, `danger`, `score`, `round-result`.
3. Проверить один эффект в контексте уже существующих игровых частиц и убрать дублирование.
4. Проверить 320×568, 390×844 и host 1440×900: overlay не создаёт scroll и не перекрывает управление.
5. Повторить с reduced motion и бюджетным мобильным профилем. Если событие нельзя доказать из state/event stream, оставить его кандидатом.
