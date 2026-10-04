# Game polish · physical lane · 2026-10-02

Lane: `games/jenga/`, `games/crane/`, `games/kart/`, `games/bow_club/`, `games/tabletop/` (poker, airhockey, mines), `games/naval/`, `games/chaos/`.
Everything is presentation-only. Effects are driven by authoritative snapshots (or, in Chaos, the host's existing `sfx`/`input` calls). Rules, scoring, balance, protocol and simulation are unchanged. Reduced motion is respected everywhere. No images were generated and no image requests were filed: every texture is procedural.

## Changes per game

| Game | File(s) | What changed |
| --- | --- | --- |
| Jenga (three.js) | `games/jenga/public/renderer3d.js` | Procedural lathe-turned walnut tabletop (canvas texture with concentric rings) replaces the flat grey disc. A soft contact shadow grounds the tower. About 34 dim light motes drift through the key light (TV only). **Tension:** when safety drops below 40%, the rim light warms from blue to red and the camera breathes slightly. The pulled block's lime emissive grows with stick force. **Placement:** a lime ring expands from the new top block when the server confirms a move. **Collapse:** the camera eases back and orbits over 1.6 s, a strong dust shake plays, and one `LocalPartyFeel` explosion fires (haptic on phones). |
| Crane | `games/crane/public/client.js` | Score callouts at the landing point: `PERFECT!` with `+N` underneath, `+N`, or `MISS`. They pop, rise and fade in about 1 s and use the Kardia Fat Runner face. The newest floor squashes and stretches about its base on landing. Night-site life: red aviation beacons blink on the mast head and boom tip, and a warm work-light cone hangs from the trolley while a turn is in play. |
| Kart | `games/kart/static/host.js`, `games/kart/static/controller.html` | Race beats from snapshots: `LAP n/N` callouts, `FINAL LAP` (pink), place gains (`P2` with a drawn triangle, no glyph), `FINISH #n` and `WINNER!`. A finish also throws a checkered-confetti burst at the line, and the winner triggers one `round-result` feel. Fast karts leave colour-ribbon trails. A boost is inferred from a speed jump near a pad and draws a gold/pink flame trail for 1.5 s, matching the server's boost duration. Boost pads shimmer as an idle chevron sweep. On the phone, the PLACE/LAP/TIME labels now carry `hp-stat-label`, and their glyphs render (seen at 320, 393 and native 402). |
| Bow Club (three.js TV) | `games/bow_club/public/src/range-scene.mjs`, `games/bow_club/public/tv.js` | Arrows arrive: each one shrinks onto its spot from larger and lower in about 170 ms under the ortho camera. The struck target rocks with a damped spring whose amplitude scales with points (bullseye > middle > outer), and embedded arrows rock with it. The scene renders only while something is moving, and `bow-render-idle` still passes. A bullseye adds gold rays and a `BULLSEYE +100` label. Label font moved to Kardia Fat Runner. The tracking markers are untouched. |
| Poker | `games/tabletop/public/app.js`, `arena.css` | Cards and seats now reuse their DOM nodes. Before, every turn change rebuilt every seat and replayed the deal animation on every card. Now new community cards deal in with a 70 ms stagger, and showdown reveals flip only the revealed cards. Chips fly from a seat to just under the POT label when that seat's bet rises, and from the pot to the winner seats at showdown. |
| Air hockey | `games/tabletop/public/app.js` | A cyan puck trail whose length scales with speed. Hit sparks (ring plus rays) in the hitter's team colour on mallet contact, and smaller white sparks on wall bounces. **Goal:** the goal mouth glows in team colour, three shockwave rings go out, and team confetti falls. This sits on top of the shared `GOAL!` label. |
| Mines | `games/tabletop/public/app.js`, `arena.css` | Reveal cascade: newly opened tiles pop with a brightness flash, staggered outward from the opener's tile (38 ms per cell, capped at 420 ms). A mine gets a hotter flash under the existing explosion sprite. |
| Naval | `games/naval/public/broadcast.js`, `screen.css` | A glowing shell arcs from the shooter's fleet card to the target cell in 300 ms, and the existing impact plays when it lands. The target card jolts on a hit or sink (TV field only). Mini oceans get a slow swell shimmer. A fleet at 0 health desaturates and dims. |
| Chaos (One Cursor) | `games/chaos/static/host.html` (appended block) | The shared cursor leaves a comet of lagged rings that brighten with speed. Ripples mark presses (white), successful clicks (lime), pickups (cyan) and hits (pink). A level clear throws a `HeyPalsSprites` burst plus a `score` feel. A slow light sweep crosses the arena as idle life. This is done by wrapping `sfx`/`input`, so game logic is untouched. |

## Evidence

All captures are under `.localparty-build/game-polish-physical/`:

- `before/`: TV 1280×720 and phone 393×852, real launch.
- `after-tv/` (1280×720) and `after-tv1080/` (1920×1080): real matches played by bots.
- `burst/`: 250 ms frame bursts for crane, kart, poker, airhockey, mines, naval and jenga. Inspected: the crane `+79` callout, poker deal/showdown/chip flights, hockey trail and sparks, naval shell tracers, and the mines cascade.
- `burst-crane2/`: shows the larger callouts after the fix (`PERFECT! +148`, `+87`, `+88`).
- `synthetic/airhockey-eval-*.png`: the goal beat, triggered by feeding the renderer a goal snapshot.
- `burst/kart-synthetic-pops.png`: `LAP 2/5` and `P1` from a synthetic lap/place snapshot.
- `after-phone/`: 393×852, 320×568 and the native route at 402×874 (`controller-bridge.js` + `tabs.js`). Controllers are unchanged in layout, and Pause/Lobby gradients are intact.

The capture script lives in the session scratchpad (`phys/cap.cjs`). It is a variant of `scripts/qa-controller-sweep.cjs` with bots-only, burst and eval modes.

Fixes made after looking at the captures:
- Crane callouts were too small once the world zoom applied, so they were enlarged about 1.6×.
- Poker chips landed over the POT text and now land below it.
- The air hockey goal rings were low-contrast on white ice and now use deeper team tones and stronger confetti.
- The naval hit/sunk overrides were dropped because the shared styles already win.

## Tests

- `node --test` passed 27/27: bow-club, bow-render-idle, crane, crane-structure-round3, crane-suspension-round3, jenga, kart-barrier, kart-lap, naval, tabletop, hockey-last-hitter.
- `tests/tabletop-browser.cjs` passes: poker, airhockey and mines layouts, reload and rejoin.
- `tests/hockey-layout.browser.cjs` fails on "Side timer must be prominent", a shell TV header assertion (`.tv-timer-value`). It is not caused by this lane, which did not touch the header.
- `crane-impact-browser`, `crane-motion-browser`, `naval-shot-effects`, `jenga-browser`, `kart-wall-browser` and `chaos-pause-browser` did not run. They hardcode a Windows Playwright path (`C:/Users/nirrt/...`).

## Not verified

- Not seen live:
  - Jenga collapse camera beat and placement ring: bots never collapsed the tower in the capture window.
  - Kart boost flame and real finish: bots drive at about 8 km/h.
  - Bow Club wobble in motion: still frames only.
  - Chaos ripples and clear burst: bots did not complete a level in the window.
  - Naval sunk-fleet dimming.
- Not run: physical iPhone, Apple TV and the iOS Simulator (owned by the main agent). No 60 fps profiling on real TV hardware.
- Pre-existing issues, not changed:
  - Jenga at 1920×1080: the "CURRENT TURN" eyebrow sits on the top edge of the turn card.
  - The TV header shows two "Blocks" readouts for Jenga (shell mapping).
