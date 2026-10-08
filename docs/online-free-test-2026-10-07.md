# Бесплатный интернет-тест HeyPals

Проверено 7 октября 2026 года по официальным страницам. Это выбор сервисов и схема интеграции; online-матч в установленном приложении пока не включён.

**Выбор для нашего теста: Cloudflare Workers Free + SQLite Durable Objects для шестизначных комнат, WebRTC DataChannel для игры, Open Relay/Metered Free для TURN fallback.** Такой вариант сохраняет ведущий iPhone как сервер игры, подходит браузерам и оставляет прямой путь к платным тарифам позже. Бесплатность ограничена квотами, а не сроком пробного периода.

## Три рабочих варианта

| Вариант | Бесплатные пределы | Почему подходит / ограничение |
| --- | --- | --- |
| **Cloudflare Free + WebRTC + Metered Open Relay** | Workers: 100 000 запросов/день. SQLite DO: 100 000 compute requests/день, 13 000 GB-s/день. Open Relay: 20 GB TURN/месяц. | Наши коды, роли host/player/display и допуск в комнату остаются под нашим контролем. Игровой трафик идёт напрямую; TURN используется при невозможности прямого соединения. Потребуются бесплатные аккаунты, но не собственный VPS или платный домен. |
| **Metered Realtime Free + WebRTC + Open Relay** | 100 одновременных соединений, 100 000 сообщений сигналинга/месяц, 20 GB TURN/месяц. Официально: без карты и без overages. | Самый короткий транспортный прототип. Всё равно нужно наше резервирование шестизначных кодов, проверка ролей и подключение guest TV к тому же матчу. Клиентский SDK не заменяет эти правила. |
| **Supabase Free + WebRTC + Open Relay** | 200 Realtime connections, 2 млн сообщений/месяц, 5 GB egress. Проект может приостанавливаться после недели неактивности. | Удобно, если одновременно нужны аккаунты/профили/БД. Для нашего короткого сигналинга добавляет лишнюю инфраструктуру; TURN отдельно. |

Источники: [Workers Free](https://developers.cloudflare.com/workers/platform/pricing/), [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/), [Cloudflare: без карты](https://www.cloudflare.com/products/durable-objects/), [Open Relay](https://www.metered.ca/tools/openrelay/), [Metered Free signalling](https://www.metered.ca/tools/openrelay/webrtc-signaling-server/), [Supabase pricing](https://supabase.com/pricing).

Cloudflare Free прекращает операции при превышении квоты до её сброса, вместо автоматического платного перерасхода. Для Supabase Free длительное превышение ведёт к ограничениям сервиса: [Cloudflare free limits](https://developers.cloudflare.com/durable-objects/platform/pricing/), [Supabase billing FAQ](https://supabase.com/docs/guides/platform/billing-faq). Для Metered Realtime API явно возвращает `overagesAllowed: false` на Free: [usage API](https://www.metered.ca/docs/realtime-messaging/rest-api/usage/). Обещание отсутствия перерасхода на странице Metered относится к указанному Free stack; в аккаунте не включаем платную TURN подписку, top-up или auto-reload.

## Что выбрать сейчас

Первый вариант лучше соответствует уже подготовленному контракту в `examples/online-room-signalling242`: код комнаты, приватный host credential, отдельный participant credential, lease/epoch, SDP/ICE маршрутизация. Cloudflare хранит только комнаты/сигналинг; данные физики и действий идут по WebRTC, а при необходимости — через TURN. Открытые WSS-соединения DO должны использовать hibernation, чтобы ожидание игроков не расходовало активное время: [WebSocket Hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/).

Покупать домен для теста не требуется: Worker получает адрес в `workers.dev`: [официальный маршрут](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/). Версионированные статические browser/TV ресурсы можно отдавать бесплатными Cloudflare Pages; динамические функции имеют отдельные Workers-лимиты: [Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/). Перед загрузкой всех игровых ресурсов нужно отдельно проверить предел размера файлов и объёма deployment.

**Cloudflare TURN пока не выбираем для требования «без платежей».** У него щедрые 1000 GB бесплатно, далее $0.05/GB, но self-serve описывается как оплата картой. Бесплатный STUN Cloudflare доступен отдельно и безлимитен. STUN сам по себе не гарантирует соединение через сложный NAT; TURN fallback остаётся нужен: [TURN FAQ](https://developers.cloudflare.com/realtime/turn/faq/), [WebRTC peer connections](https://webrtc.org/getting-started/peer-connections).

У Metered Free TURN доступен только `standard.relay.metered.ca`, поэтому не обещаем платную региональную маршрутизацию или SLA: [TURN regions](https://www.metered.ca/docs/turnserver-guides/turnserver-regions/). TURN REST secret хранится только на backend; браузер получает временные `iceServers`. Бесплатные аккаунты и ключи ещё не созданы, подключение между двумя разными домашними сетями не проверено.

## План подключения без оплаты

1. Создать Cloudflare Free и Metered Free аккаунты; не подключать платные add-ons/перерасход.
2. Перенести существующий локальный контракт в Worker/SQLite DO с хешами токенов, lease, допуском и ограничениями попыток ввода кода. Выдавать короткоживущие TURN credentials с backend, не публиковать секрет.
3. Добавить единый WebRTC transport для host и browser. Сигналинг передаёт только создание/join/SDP/ICE/presence, а не 30 Hz snapshots: это существенно экономит бесплатную квоту.
4. Присоединять телефонный пульт и внешний экран одной операцией к одной авторитетной сессии. Сейчас native `joinRoom` переключает лишь controller URL; этого недостаточно для общего TV-матча.
5. Проверить прямой маршрут и **принудительный TURN** на двух разных сетях; browser guest без приложения; reconnect/host leave; отсутствие двойной симуляции и восстановления старого кода.
6. Считать фактический TURN расход и лимиты в dashboard; по достижении тестового бюджета останавливать новые тестовые сессии, не менять тариф автоматически. Клиентский счётчик трафика даёт только оценку; источником квоты остаётся провайдер.

Для экономии передаём состояние игры, а не видео с TV. Каждый дом рисует общий матч локально. Это снижает необходимость дополнительного кодирования видео на ведущем iPhone, но само по себе ещё не является измеренным выигрышем на устройстве. Подробный транспортный план и текущие ограничения: [online architecture](online-architecture-2026-10-07.md).
