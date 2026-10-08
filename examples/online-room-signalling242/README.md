# Изолированный пример Rooms + WebRTC signalling

Этот пример **не подключён к приложению**, не выставляет HeyPals server наружу и не запускает игру. Он проверяет контракт кодов/ролей и маршрутизацию SDP/ICE до внедрения Cloudflare Durable Objects.

Из корня `localparty`:

```sh
node examples/online-room-signalling242/server.cjs
node --test examples/online-room-signalling242/server.test.cjs
```

По умолчанию — `http://127.0.0.1:8791`. Порт можно изменить через `HEYPALS_SIGNAL_PORT`; bind остаётся loopback. Зависимость `ws` берётся из текущего проекта, дополнительных пакетов/аккаунтов не нужно.

| API | Действие |
|---|---|
| `POST /rooms` с `{}` | Возвращает `code`, `epoch`, приватный `hostToken`, `expiresAt`. |
| WebSocket `/signal` | Первое сообщение `{"type":"auth","token":"…"}`; сервер отвечает `ready` с ролью, ID и epoch. Токен не передаётся в URL. |
| `POST /rooms/{code}/join` с `{}` | После host readiness резервирует guest и возвращает `guestToken`, `peerId`, `epoch`. |
| `POST /rooms/{code}/close` + `Authorization: Bearer hostToken` | Закрывает комнату и invalidates credentials. Guest token не даёт это право. |

После auth:

```js
socket.send(JSON.stringify({
  type: 'signal',
  to: 'host', // Host адресует конкретный guest peerId.
  data: { description: { type: 'offer', sdp: actualLocalDescription.sdp } }
}));
socket.send(JSON.stringify({ type: 'signal', to: 'host', data: { candidate: actualIceCandidate.toJSON() } }));
```

Получатель получает `{type: 'signal', from, epoch, data}`. `from` назначается сервером. Guests не сигналят друг другу и не могут адресовать другую комнату.

Ограничения PoC: память вместо durable storage; срок комнаты один час; немедленное завершение при уходе host; нет host admission UI, отдельной TV-роли, TURN endpoint, WebRTC peer implementation или gameplay adapter. Guest tokens резервируют места, поэтому production должна добавить короткий срок неподтверждённых reservations. HTTP и socket throttling здесь локальные, production требует distributed abuse protection. Нет гарантии доставки при заполненном send buffer: клиенту нужны timeout/retry сигналинга. Максимум 16 guest transports — не лимит roster игры.

Перенос на Cloudflare: Room DO со SQLite lease/token hashes и атомарным занятием кода; входящие sockets через `ctx.acceptWebSocket`, attachments для peer роли/epoch, DO alarm вместо `setInterval`; Worker ограничивает запросы и выдаёт краткоживущие TURN credentials из backend secrets. Этот Node файл сам по себе не является Worker deployment.

Подробный план и ссылки на официальные источники: [архитектура](../../docs/online-architecture-2026-10-07.md).
