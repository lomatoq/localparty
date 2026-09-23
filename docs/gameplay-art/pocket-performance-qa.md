# Pocket Siege transport / display diagnostics

2026-09-20 investigation of reported intermittent freezes with three players and an external display.

## Confirmed waste removed

Deluxe snapshots carried unused raw player profile photos. Host snapshots repeated all photos at 20 Hz; phone snapshots repeated the recipient's photo at 10 Hz. No deluxe renderer or controller consumes this field. Photos are now omitted from wire views without mutating the authoritative game snapshot.

Phone snapshots also carried unused terrain strata. Host snapshots carried strata even when the terrain revision was unchanged. All four terrain fields (`terrain`, `terrainColumns`, `terrainStrata`, `terrainMaterials`) are now omitted from phones and revision-cached by hosts. Initial/reconnected hosts still receive complete terrain.

`node --test tests/pocket-snapshot-payload.test.cjs` uses three synthetic 80 KB photos and sandbox inventories. After material-layer additions, aggregate JSON volume at configured rates fell from 8,207,790 to 530,060 bytes/s. These are fixture measurements, not measured device traffic. CPU timings are emitted by the test but intentionally not asserted because machine load varies.

`node tests/pocket-network-soak.cjs` exercised a real host and three controller WebSockets for 14 seconds, including the 12-second heartbeat: host p95 inter-state gap 60 ms, maximum 114 ms; controller p95 about 118 ms, maximum 171 ms. It reproduced no multi-second pause. This is desktop idle-network evidence, not an AirPlay or intensive-weapon soak.

## Device evidence and limits

The pre-build-25 device log's 59 Pocket frame samples reported 60 fps. Independent rAF cadence alone does not establish fresh authoritative state or actual gameplay-render cost. Knives, by contrast, dropped to 47.1 and then 37.3 fps while the surrounding shell also dropped to 43.5/39 fps, indicating shared rendering pressure rather than proving a receiver-only problem. Subsequent Marble samples returned to roughly 60 fps. These observations do not establish a thermal or AirPlay root cause.

The existing ten-second native frame report now additionally captures bounded snapshot counters: receive count, time since last receive, maximum receive gap, maximum authoritative simulation-time delta, and repeated nonpaused simulation timestamps. Native reports include thermal state and low-power mode. No per-frame bridge traffic or gameplay changes were introduced. Visibility transitions reset measurement intervals.

Interpretation: smooth rAF plus large snapshot age/gap points toward stale simulation/transport; poor rAF in both game and shell points toward rendering/scheduling pressure. Thermal data gives correlation, not causation. Physical-device reproduction remains necessary before claiming the reported freeze is fixed.

Validation: frame/snapshot unit tests pass; the real WebKit drone regression covers module loading, responsive controls, pause/disconnect release, drop, and the 15-second timeout. Terrain/tank physics were not changed by this work.
