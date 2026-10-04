# Integration119 — fresh all-game TV and phone capture archive

Status: all36games captured successfully, 157original PNGs. Visual reviews closed for all144 game originals and13extras. The Millionaire TV cap-overlap finding was corrected and its four images refreshed and re-reviewed; no blocking finding remains in the captured scope.

## Scope and evidence

Real managed launcher routes, normal clock, two loaded browser humans plus built-in bots; Bomb and Curling use three loaded browser humans. All36valid catalogue IDs: waiting TV/phone and playing TV/phone at1280×720 and393×852. Extra shared menu, roster, statistics, profile and Pause states. Native Host menu/panel/detail are explicitly labelled bridge simulations with actual launcher snapshots; screenshots are browser evidence, not a physical iPhone or AirPlay validation.

All PNGs live directly in `output/playwright/integration119-review/`, together with a relative-link gallery, manifest, README and server log. ZIP and gallery paths are recorded below.

`manifest.json` records source SHA256 before/after, capture timestamps, actual launcher phase and runtime/load errors. No game states or scores are injected. Capture harness only; product code is not edited by this lane.

## Visual review assignment

- gallery119: TV/phone playing for Push Pit, Last Circle, Color Knives, Bomb Tag, One Shot Western, Local Tanks, Tank Arsenal, Two at Sunset, Tap Race, Flappy, Hungry Arena and Snake Lines, plus shared/native extras.
- timer119: TV/phone playing for Chaos, Kart, Monster, Spy, Millionaire, Party Quiz, Warsaw, Charades, Jenga, Night Shift, Naval and Draw and Guess.
- notches119: TV/phone playing for Bow Club, Mine Together, Curling, Bowling, Swarm Gate, Peek Shoot, Pocket Siege, Air Hockey, Poker, Marble Bloom, Carry Ball and Punch Meter.
- art_director: all72waiting TV/phone originals.

Capture source changes and narrow refreshes are explicitly recorded; every final original has been individually reviewed.

## Capture result

Normal-clock run:36/36 valid catalogue games,144 waiting/playing images +13shared/native extras =157originals. Page exceptions and HTTP400+ resource failures:0. The153raw console errors are exclusively WebSocket/socket.io connection diagnostics: every one matches the actual engine URL ID and falls within3s before or2s after that engine's deliberate stop/cleanup completion. They remain in the manifest; this report does not claim an empty console.

One source file changed during the sequential run: `games/bow_club/public/style.css`, before Bow Club loaded. Its final dark compact timer capsule appears in the Bow original, independently reviewed. All 1726 accepted final source hashes match current files, after the documented narrow refreshes. This is documented source reconciliation, not a claim that the initial run was globally immutable.

Native top/detail entrances were recaptured after finite animation settling; four final native originals replace the initial too-transparent captures. The refresh had zero source drift/page exceptions/load failures; `native-refresh-manifest.json` preserves it.

Independent findings: initial Millionaire TV cap covered the top of Biography/difficulty chips byabout8px. The game-local reserve fix corrected it; four actual waiting/playing images were refreshed, and complete TV+phone originals were re-reviewed. Measured category clearance28.53125px at720p; the independent timer lane also inspected answer-explanation at720p/1080p. P3 unavailable totals0/0 on DrawGuess/Duel phone waiting header remain recorded and do not expose controls or a premature game field.

All screenshots are browser evidence at the stated viewports. Results/end states for every game, actual device motion, every scroll position and physical TV output are outside this gallery's bounded scope.

## Final narrow refresh and archive

Millionaire refresh source SHA256: `7a185b0f27e86ddf42de3071f995f07a49d057f1ad2822fa2e47be9172f900c3` for `games/millionaire/public/tv-layout.css`. No source drift/page exceptions/resource400+ in the fresh four-image run. Final157image names remain unchanged; `manifest.json` preserves all refresh runs, superseded Millionaire metadata and old SHA, final image SHA and1726accepted current source hashes. `currentSourceDrift=[]`.

Folder: `/Users/hlebhlyaba/HeyPals/localparty/output/playwright/integration119-review/`

ZIP: `/Users/hlebhlyaba/HeyPals/localparty/output/playwright/HeyPals-119-screens-2026-10-04.zip`

Gallery: `http://127.0.0.1:17809/integration119-review/index.html`

The final ZIP integrity and157PNG count are checked after refreshing all report copies; packaging proof is stored in `archive-proof.json` beside the images. Generated captures/build outputs are not staged into Git.

Local Tanks final refresh: four actual TV/phone waiting/playing images replaced after the field cutout was changed to the same bowed contour as the header. `games/tanks/public/host.js` SHA256 `9dc7b51a03280c180887599c60a586b61b4cd9e6e20b50665d32af0fb18384e6`. Fresh run has no source drift, console errors, page exceptions or HTTP400+ resource failures. All four complete originals were opened; the field border follows the header and phone controls remain whole. `tanks-field-contour-refresh-manifest.json` and `manifest.json` preserve final and superseded capture provenance.
