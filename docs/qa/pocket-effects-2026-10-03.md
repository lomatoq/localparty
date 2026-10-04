# Pocket Siege actual effects and burst feedback audit

Current source pass:2026-10-03. Output folder retains its initially chosen2026-10-04 name; report timestamps are authoritative. No build/install or live114 room/phone changes.

## Confirmed repair

Super Nova and Hedge can award points during a real cannon collision yet lose their floating score/hit events before a20Hz snapshot. In the controlled flat600 scene with player positions300/700, wind0, aim45/power14, the original65-event window dropped two Super Nova score events and four Hedge score events. The sources are actual game emissions, not injected impact/score events. A second defect in the client particle budget can evict an already delivered glyph before it paints.

Only `games/arcade_deluxe/core/tanks.cjs` and `games/arcade_deluxe/public/siege-fx.js` changed in this effects pass. The previous damage runtime stays frozen. Server retains up to128 score/hit events for2.6 simulation seconds, clears the protected buffer at turn/start/reset boundaries, selects up to48 protected events and fills the rest from recent ordinary events. Every snapshot remains at most65 sorted unique events. Canvas still uses at most360 items, protects at most64 current score glyphs and recycles ordinary particles first. Existing packet delta/terrain, ID deduplication, pause clocks, damage, projectiles and weapon physics remain unchanged. Parent’s unrelated pre-existing team ranking change in tanks.cjs was preserved.

## Final focused checks

`focused-tests.txt`:9 tests PASS. These include the prior321 damage contracts/1393 bullet routes, the two real cannon-burst delivery regressions, reset/expiry/terrain checks, and particle-cap/actual glyph draw checks. The regressions demonstrate that the legacy65-event selection loses scores in the same simulation while the repaired selection delivers them.

`burst-feedback-confirm/report.json`:128 complete-renderer frames through real localhost WebSocket and production Connection. Super Nova delivered11/11 score events once and painted175 score glyph calls across frames; Hedge delivered8/8 once and painted98 calls. Each repeated snapshot was deliberately presented a second time to verify no duplicate effect emission.77 unchanged-terrain packets used the normal delta hydration. All packets painted, errors=[], changedFiles=[]. Browser/server closed. Fresh1280 originals show +5 and +1 and were opened whole.

Those two screenshots are controlled authoritative normal-physics cannon collisions replayed at accelerated cadence through the complete Renderer. They are not normal-clock launcher UI or physical-device proof.

## Fresh actual-gameplay evidence before the narrow repair

`actual-confirm/report.json` contains12 confirmed controller-fired weapons; `actual-complement/report.json` contains the remaining4. Supported sandbox settings, normal clock, actual launcher/TV/two real human controller tabs, picker/aim/Fire DOM inputs, and authoritative launch weapon/aim assertions. No injected simulation states, events, projectiles or timers.16 weapons: Single Shot, Quad Missile, Chain Reaction, Burn Barrel, Smoke Bomb, Rubber Paint, Mud Pie, Magic Forest, Zapper, Tesla Coil, Tracer, Jump Jets, Dirt Mover, Sonic Blast, Sniper Rifle, Earth Mover.

Both normal-clock runs have page/console/HTTP errors=[] and sourceChanged=[].16 pairs of selected720/1080 whole originals were opened; exact manifest is `opened-originals.json`, gallery `review.html`. Fire/smoke/rubber particles, growth/terrain, projectile trails, tracer text, jump particles and persistent waves were visibly present. Representative trajectories captured by the observer stayed in the actual canvas viewport. The screenshots are sequential wall-clock samples; short effects may advance between720 and1080, and the recorded simulation times distinguish them.

Zapper/Tesla shots struck terrain rather than triggering their proximity beam branches, so these actual screenshots prove their wave/terrain path only. Prior isolated beam-handler proof remains separately qualified in the damage audit. Tracer’s +10/+5/-0 text is imported calibration text, not awarded damage; its score stays0 as the source utility intends. No new misspelling was identified in the captured English copy. No GPU shader pipeline exists here: materials and all these effects use Canvas2D indexed feedback.

Raw baseline is retained: two initially requested shots timed out to other weapons and are not counted. The tighter actual-confirm run stopped on an unacknowledged Dirt Mover Fire; a new isolated complementary run confirmed the actual chosen Fire and all remaining4. There is no reproduced production cause for that one input failure, and no input code was changed.

## Whole321 pipeline and limits

`full-pipeline-confirm/report.json` passed321 actual cannon simulations through real WebSocket, production Connection terrain-delta hydration and complete Canvas2D Renderer:37,007 painted frames,29,194 omitted-terrain packets, no per-weapon runtime/non-finite/missing-profile/hydration errors and source drift=[]. This is accelerated full-state integration coverage, not321 live-phone or pixel-equivalence approvals. It predates the narrow feedback retention repair; final integration is the focused two-weapon rerun above. The first raw full-pipeline run’s final error was the fixture’s absent ARCADE_CONFIG.hostKey, corrected only in the test; it is retained rather than relabeled an engine error.

The canonical20Hz event audit (`event-delivery.json`) records69,503 dropped transient events across24 burst weapons. Persistent material zones, explosion waves and coatings have snapshot recovery; ordinary sparks/debris intentionally remain bounded. It reported no lost scores in the default canonical scene. Controlled contact scene (`contact-event-delivery.json`) exposed the two score losses repaired above. This fix does not pretend every authored transient is reproduced or change performance limits.

Existing documented original-engine fidelity approximations remain: emitter trajectories, segmented lightning/flashing, material drag/bounce, some fog shape options, and known absent helper rows. Physical build114 behavior has not been validated by this browser pass.

## Frozen source hashes

- `games/arcade_deluxe/public/render.js`: `084f61b04b7927bcfac367348f14aa71f1133556d1907e52017ad5ad93a6f0e0`
- `games/arcade_deluxe/public/siege-fx.js`: `b49a23fec6ce22c0b97d6928fe69af6818291d35bd7b9cb5e9b7d7916f8c19e2`
- `games/arcade_deluxe/public/pocket-plasma.js`: `50a5c95652b975be1f00cfca989cb9e88de92f6962ce1c719645d8635373bb92`
- `games/arcade_deluxe/public/pocket-projectiles.js`: `fabb8793b392f5d34b0e7f66f4e7af40fdc4179eb784e438f430b7677b6a7a0a`
- `games/arcade_deluxe/public/explosion-waves.js`: `87e284f9905736eb7d98c203894fc10f5409e24246c435055816bc50df5ad3d0`
- `games/arcade_deluxe/public/net.js`: `966ae77fb6bb7c562bf793f222adb3c4355db3fbd2a8c356011b30df2144d786`
- `games/arcade_deluxe/core/tanks.cjs`: `a7a5c2d8d0871b5f32662e681484b90b23551efc74be07c0ca62bdccde5724e2`
- `games/arcade_deluxe/core/pocket-runtime.cjs`: `e107a675f890ae5ef2c0b5b9d856cb28524b6d47f1f8abda60c4327c5ad937a2`
- `games/arcade_deluxe/core/snapshot-view.cjs`: `8bd12aab30c98eb3a6e7d8c8cd834911ea7dd51ad10ea87c04cd7123b644ed4b`

Reports and raw captures are under `output/qa/pocket-effects-2026-10-04/`. All temporary browsers/servers are closed. No more product edits in this lane.
