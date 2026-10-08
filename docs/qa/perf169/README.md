# Performance / regression pass 169

## Evidence boundaries

Physical build 132 lifecycle recording showed TV idle around 60 FPS, but an event interval reached 1327 ms. Thermal state was serious. This is not a performance pass. The earlier Instruments capture disconnected after 1.67 seconds and is not usable as a full reproduction.

Browser fixtures cover 36 waiting + playing states, popup layout, and fast scrolling. They do not validate physical iPhone compositing or AirPlay. The popup contact sheet shows weak/absent backdrop blur in this WebKit runtime; this remains a physical-device check, not an accepted material result.

## Targeted changes

- Restore active green controls while limiting moving energy to visible priority actions.
- Reset inherited pseudo-element dimensions that displaced the Ready outline.
- Give popup Back actions consistent insets.
- Keep catalogue wordmarks as real images on native host as already done on TV. Previously every native Fresh image was opacity 0 underneath a separate canvas. After: all 10 loaded, opacity 1, no canvas replacement. See logos-before.json / logos-after.json.
- Smaller 192/640 px controller illustrations instead of decoding the full source artwork for compact rows. Full source assets remain unchanged.
- Avoid rebuilding unchanged headline and vote label DOM on state updates.
- Remove repeated scroll-driven card entrance replay; preserve one-time entrance.
- Record phone frame intervals through the existing native diagnostics bridge, aggregated every 10 seconds.

These changes require Release / physical iPhone validation. No measured physical speed-up is claimed yet.

## Specialized skills read and applied

- https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md
- https://github.com/MengTo/Skills/blob/main/agent-skills/codex/performance-profiling/SKILL.md
- https://github.com/MengTo/Skills/blob/main/agent-skills/codex/performance-profiling/references/time-profiler.md
- https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/disciplines/performance-optimization/SKILL.md

Method: reproduce, profile main-thread/GPU/frame costs, change a measured bottleneck, compare equivalent runs, preserve correctness. No unbounded image cache or bulk visual-effect removal.
