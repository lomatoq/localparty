# Game polish · party lane · 2026-10-02

Lane: `games/party/` (Push Pit, Last Circle/shrink, Color Knives, Bomb Tag, One Shot Western) and `games/western_duel/`.
Nothing outside these folders was edited. Rules, scoring, balance, protocol and the server simulation are unchanged. Every effect renders from authoritative snapshots, fires only on real events, decays to rest, and respects `prefers-reduced-motion`. No images were generated and none were requested; everything is procedural canvas drawing. three.js was not used because a canvas 2D layer inside the existing renderer gave most of the gain at lower risk.

## Changes

### TV (`games/party/public/host.js`, a "Party juice" block before `render()` plus small hooks)

| Game | What changed |
| --- | --- |
| Push / Last Circle / Bomb | **Idle arena life:** about 26 drifting motes, a slow conic light sweep across the floor and two comets running along the rim. Tinted cyan for Push and warm for Bomb. |
| Push / Last Circle / Bomb | **Collision impact:** read from two consecutive authoritative packets (a sharp velocity change while two discs touch). Shows a white flash core, an expanding ring and sparks along the contact tangent in both players' colours, plus a 200 ms squash of both discs along the collision normal. Strength is tiered by Δv. Strong hits send `LocalPartyFeel` `collision` (small TV field shake, no particles). |
| Push / Last Circle / Bomb | **Elimination:** a knocked-out disc shrinks while its ghost fades, so it reads as falling into the pit. This adds to the existing rim burst. |
| Last Circle | **Shrinking edge:** the ground already lost is a faint red band with a dashed ring at the original size. The closing edge glows red, more strongly as the arena shrinks, and 16 chevrons creep inward over the rim. |
| Bomb Tag | **Heat:** the holder's glow and ring warm from red to orange and wobble faster the longer that player keeps the bomb. Only the time held is used, never the hidden fuse. **Hand-off:** a curved spark arc runs from the old holder to the new one, with a catch ring and a bomb-icon pop. **Blast:** a white flash core, 9 smoke puffs and a scorch decal with embers that stays on the floor for about 5 s. |
| Color Knives | The wheel recoils 4–7 px away from each hit (clangs hardest). A hit on your own colour gets a gold 4-point glint and ring, a clang gets white sparks, and a danger hit gets a red bloom. |
| Western | **Anticipation:** dust drifts across the street. **DRAW:** a warm full-field flash (260 ms), a 240 ms shake of the field and cowboys, and the DRAW! word punches in from 1.42× (fakes from 1.16×). **Reveal:** each valid reaction time is a plate under the cowboy. The fastest is gold with a spark ring, slower or dead shooters are dimmed. |
| All | **Round-win beat:** the between-round card enters with a strong ease-out (280 ms) and one gold sheen. Winners are taken from the `roundWins` increase in the packet that ended the round. In arena modes each winner gets a gold ring, sparks and a calm halo, and the card is placed above or below a single winner so it doesn't cover them. |

### Phone (`games/party/public/controller.{js,css}`)

- **Haptic tiers** go through `LocalPartyFeel`, so native haptics now work in the app (iOS has no `navigator.vibrate`). `navigator.vibrate` stays as the fallback.
  - Press: `shot` 0.22.
  - Knives: a wrong colour or miss sends `hit` .4, danger sends `hit` .75, a clang sends `collision` .55. Your-colour hits already get the shared tracker's `score` haptic, so it isn't doubled.
  - Bomb: catching it sends `danger` .85, passing it sends `hit` .35, BOOM sends `elimination` .95.
  - Western: a false start sends `elimination`.
- **Knives feedback:** colour by outcome (lime for your colour, peach for wrong or miss, pink for danger or clang) and a one-shot pop sized by tier.
- **Status tone:** the IN/SAFE, У ТЕБЯ! and OUT values are lime, orange and pink.
- **Bomb:** the knob turns red-orange while you hold it (the old rule lost to a `!important` lime override). A red ring flash plays when you catch the bomb and a lime one when you pass it.
- **Western reaction time:** the result rises in once (280 ms).

### Western Duel (`games/western_duel/public/app.js`)

- **DRAW:** a canvas flash and a 220 ms punch on the `#cue` text.
- **Gunshot kick:** a small zoom-shake on the TV only.
- **Reaction time:** the winner's time (`shot.at − drawAt`) is a gold plate above their hat on the TV and on the phone.
- **Win burst:** a `HeyPalsSprites` burst at the winner.
- **Haptics for the two duellists:** press `shot`, win `score`, loss `elimination`.

## Evidence

- Script (scratchpad, not committed): `party-capture.cjs`. It starts the real server, uses two real phone browsers plus bots, does a real launch, ready and force-start, and drives the joystick, THROW and FIRE with real pointer input. Shots are taken on real events (bomb holder change, DRAW!, between/reveal).
- Before: `.localparty-build/game-polish/party/before/`, with TV 1280×720 and phone 393×852.
- First fix round: `.localparty-build/game-polish/party/after1/`. Inspected:
  - The shrink band and edge glow were too milky, so they were softened.
  - The between card covered the winner, so the card was moved off the winner.
  - On a timeout every survivor got a winner halo, so winners now come from `roundWins`.
  - The floor sweep and card sheen were toned down.
- Final: `.localparty-build/game-polish/party/after/`.
  - TV 1280×720 with phone 393×852, all six games.
  - TV 1920×1080 with phone 320×568, all six games.
  - Native route (`QA_NATIVE=1`) at 402×874 for bomb, knives, western and western_duel.
- Confirm round: `.localparty-build/game-polish/party/after-confirm/`, inspected.
  - Bomb and Push between-round: the card now sits 200 world-px above a lower winner instead of 178, so it no longer clips the winner's name.
  - Western Duel on a 320 phone: the plate touched the WIN cue, so on a short phone stage it now sits beside the winner, toward the centre.

## Tests

- `node games/party/action.test.cjs`: PASS.
- `node --test tests/western-duel.test.js tests/game-feel-state.test.js`: 23/23.
- `node tests/party-visual-clock.cjs`: PASS.
- `node --check` on all edited files.

## Not verified

- No physical iPhone, Apple TV or AirPlay run. Headless WebKit only.
- Haptics were checked by code path only; real native haptics were not felt on a device.
- The push collision flash and the bomb hand-off arc last about 200–400 ms, so the timed captures may or may not show them. They were checked by code and in frames where they happen to appear.
- The browser tests in `tests/western-*.cjs`, `push-rim-capture.cjs` and `party-stage-quality.cjs` load Playwright from hardcoded Windows paths and were not run.
- Reduced-motion was checked in code only, not captured.
