# Arcade engine — six complete game loops

Modes: taprace, punchmeter, flappy, hungry, snakelines, carryball.

Shared contracts: authoritative Node simulation, managed identity and presence via party-runtime, managed pause clock, event reporting, one host canvas, same joystick component and start/rules/standings card structure. Catalog points all six IDs to engine arcade. Root bridge injects identity, rules and auto-start; no shared app files modified here.

Validation:
- arcade-simulation.cjs: all six, 16 participants, join cap, input, finish, replay; punch 3-hit sum, hungry absorption/respawn, carry goal.
- arcade-natural-end.cjs: all six finish by natural simulation timer/elimination, 16 participants.
- arcade-browser.cjs: standalone host and 2 browser controllers, all six start and input, no page errors or horizontal overflow.
- start-visibility.cjs with UX_GAMES six IDs: managed readiness/autostart, lobby disappears, pause/rules/resume/exit; no test statistics recorded.
- arcade-layout.cjs: all six, desktop1920x1080 and3430x1300; phone402x760 and402x874; inline rules open/close and expanded width.
- arcade-finals.cjs: TEST_FAST=1 uses actual server finish/report transition after2s for browser final and replay, all six. Normal simulation durations separately tested.
- arcade-sixteen.cjs: 14 extra authenticated lobby+game WebSockets plus real phone+test companion =16. All six waiting screens at two desktop sizes, scrollable standings; screenshots arcade-16-host-ID.png.
- arcade-snake-performance.cjs: synthetic16 survivors90s, 21588 trail points, spatial bucket collision ~1.8s total on local machine; last-segment snapshot5070B versus392443B full. Production socket sends incremental trail segments to host only. First unoptimized benchmark exposed repeated bucket scans; early collision exit fixed it.

Limits: real iOS/Android DeviceMotion hardware not available in browser automation. Permission is requested only on explicit enable button; unavailable/insecure devices retain timing-charge punch gameplay. Strong impulse maps into bounded score; this is an arcade score, not a physical force measurement. Art assets owned by root integration.
