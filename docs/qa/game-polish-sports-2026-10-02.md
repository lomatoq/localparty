# Game polish · sports lane · 2026-10-02

Lane: `games/sports_siege/` (bowling "Pocket Strike", curling "Ice & Nerves", swarm_gate, peek_shoot).
Rendering and feedback only: no rule, scoring, protocol or simulation change. Server physics stays
authoritative; every new effect is drawn from snapshots/events. Reduced motion disables shake, slow
motion, hit-stop, glide rings, frost glints and the camera drift.

## Leftovers fixed

| Issue | Fix | File |
| --- | --- | --- |
| First aim of a match: ball in the return hood | Snapshot entry gets `first` (no rolls yet by anyone): the ball starts on the launch spot, the empty sweep is skipped, and the aim guide appears after 0.35 s instead of 1.45 s. Later turns keep the ball-return animation. | `public/scene-bowling.js` |
| Sports readout labels without stat glyphs | `#ss-personal` is now `[score + unit]` · `[detail]`. Both are `hp-stat-label` spans (curling team name excluded), so "0 points" gets the trophy glyph. Text and pluralisation unchanged. Inline rule so the generic `.ss-controller-status span{display:block/none}` rules don't stack or hide them. | `public/controls.js`, `public/style.css` |
| Throw-pad ball overlapping "Speed › power · curve › spin" on short phones | `#ss-throw-pad` is a size container: hint top, ball size/offset in `cqh`. ≤150 px pad: hint left-aligned at the top, ball bottom-left. ≤96 px: caption hidden. Pad floor lowered 110 → 76 px so on the native 320×568 route HOLD TO SWEEP is no longer clipped under Pause/Lobby. The managed-iframe padding fix stays. | `public/style.css` |

## Elevation

**Bowling (TV)**
- Lane reflections: lane writes the stencil; mirrored pins and ball (faint alpha, no depth) render only on the playing lane. Renderer now requests a stencil buffer for bowling (`host.js`). Pins in the pit and a ball in the gutter have no reflection.
- Pin-crash micro-shake: TV camera only, ~0.32 s on a wall clock, amplitude scaled by hit strength. No HUD/DOM shake.
- Pocket-hit slow motion: a full-rack hit within 0.55 m of the head pin plays the TV picture at 30% for 0.52 s, then eases back to live (only the interpolation clock; server unaffected). The impact flash and spark count scale with the hit.
- Strike/spare beat: short camera push toward the deck while the banner lands (stronger for a strike).

**Curling (TV)**
- Ice sound (procedural Web Audio on the TV shell window): granite rumble following stone speed with a soft per-rotation beat, brush noise while sweeping, a clack on stone contact. Silent unless shared `HeyPalsAudio` is unlocked and not muted; follows its effects volume. Closed on pagehide.
- Glide rhythm: a faint ring under the moving stone every 1.2 m, so the pace (and slowdown) reads.
- Sweep frost trail: blue star glints left behind the stone where the team sweeps (bounded pool of 110, twinkle and fade); swept trail band slightly wider.
- House close-up: a slow stone that will stop in or near the house gets a steeper, tighter shot of the rings and nearby stones; the end-score view drifts slowly.

**swarm_gate / peek_shoot (TV)**
- Tiered kill juice at projectile impact: light camera kick for kills, stronger for big ones (swarm tank/boss, gallery gold or friendly hit); pulse gets a medium kick.
- Hit-stop: 85 ms visual-clock freeze on big kills (and 50 ms on gallery kills), max once per 350 ms.
- Swarm big kills get an expanding shock ring.
- Score pops: overshoot pop-in, size tier by points, glow in the shooter's colour.
- Shared `LocalPartyFeel` bursts now land on the projected field point (they used to appear outside the arena in the gallery). Its canvas DOM shake is off for these two modes because the scene camera now handles shake in tiers.

## Evidence (Playwright WebKit, real server, real launch, real swipes; bots where noted)

Folder: `.localparty-build/game-polish-sports/`
- `repro/`: first aim, ball on the spot.
- `r1/`, `r2/`: bowling sequence before and after reflection tuning (`sheet-0.png`, `crop-reflect.png`).
- `r3/`: curling 1280 with bot sweepers, house close-up (`curling-tv1280-settle-1.png`).
- `r4/`: swarm_gate and peek_shoot 1280 (`sheet-*.png`), phone 393.
- `final/`: TV 1920×1080 bowling and curling, native route 402×874 and 320×568 (`phones.png`, `curl320-compare.png`).
- `final2/`: native 320×568 after the pad-floor fix (`check.png`, sweep button fully visible).
- `final-sweep/`: frost glints behind a swept stone.

Tests: `node --test` on bowling-physics-regression, curling-physics, sports-siege, swarm-score-events, alpha-physics, alpha-start, alpha-catalog, game-quality-regressions: 78/78. Browser: `tests/browser/swarm-feedback-browser.cjs` and `tests/peek-notice.browser.cjs` pass.

## Not verified

- No strike happened in the captures, so the strike banner push and confetti were not seen in this pass. The pocket-hit slow motion and the shake only show in motion, and stills can't confirm their timing.
- Curling audio was not heard: headless runs have no shared audio unlocked.
- No physical iPhone, Apple TV or iOS Simulator; headless WebKit only. The native route uses the stubbed bridge.
- "Frame", "Streak" and "Gate" have no glyph mapping in the shared stat-glyph table (request below). Swarm "targets" has none either.
- The first throw in one curling run timed out as "Skip" during the TV start transition (the phone swiped about 2 s after its pad enabled). Seen once and not investigated; it may be a pre-existing start-transition input gap.
