# Встроенные компоненты

- **nodejs-mobile 18.20.4 / Node.js**: MIT и лицензии включённых компонентов. Официальный архив: https://github.com/nodejs-mobile/nodejs-mobile/releases/tag/v18.20.4. Лицензия находится в `NODE-LICENSE`; полный состав: https://github.com/nodejs-mobile/nodejs-mobile/blob/v18.20.4/LICENSE.
- **Rapier 2D и 3D 0.20.0**: Apache-2.0. Исходный бинарный модуль и JS-привязки берутся из закреплённых npm-пакетов `@dimforge/rapier2d-compat` и `@dimforge/rapier3d-compat`; их LICENSE входят в пакет приложения.
- **WABT 1.0.41**: Apache-2.0. Файлы `NativePhysics/wasm-rt*` сохраняют уведомления об авторских правах. https://github.com/WebAssembly/wabt/blob/1.0.41/LICENSE.
- Остальные npm-зависимости сохраняют свои LICENSE внутри `LocalParty/Server/node_modules`. Игровые иллюстрации, шрифты и исходники взяты из основного репозитория без изменения их авторства.

`NativePhysics/PhysicsBridge.cc` содержит сгенерированные числовые привязки экспорта и импорта Rapier и адаптер памяти к V8. Он соответствует закреплённым версиям Rapier и wasm2c. При изменении этих версий необходимо обновить привязки и повторить проверку физики, роста памяти и остановки worker.
