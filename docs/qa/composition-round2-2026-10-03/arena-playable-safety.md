# Arena playable visibility — current user pass

Implementation frozen; focused actual TV confirmation passed, root final catalog acceptance pending. Baseline is the current qualified-final-tv36-edges TV evidence, directly opened for Local Tanks, Tank Arsenal and Chaos at1280. Previous acceptance does not accept new physics/rendering. Read AGENTS, mandatory UI/design contract and latest audit context; Impeccable layout/craft floor applied.

| Before | After | Why |
| --- | --- | --- |
| Local Tanks movement only checks static walls; center-top HUD can cover tanks | Authenticated actual measured cap rect inverse-projected into fixed1280×720 world; authoritative actor hull envelope cannot enter it | Protects actual human/bot movement and spawns, rather than painting actors above UI. The top region outside the cap remains available. |
| Arsenal uniform fixed720-high world floats inside a taller cropped receiver and old green border/scanlines | Uniform world units expand authoritative height to receiverHeight/(receiverWidth/1200), with unchanged speeds/input; stoneground fills field and clipped corners/old painted markings removed | All available fieldheight becomes playable without stretching tanks or texture. |
| Resize/reconnect can leave actors behind newly measured UI | Host-only finite sequenced geometry recovers actors to nearest legal point, respecting existing walls; handles shields/hull/recoil/shake envelope | Geometry transport cannot be rewritten by player, invalid, stale or replaced-host packets. |
| Chaos notification spans960px while header spans600 | Notification follows measured cap left/width; existing task-height observer recomposes playfield | Makes instruction/progress share the cap's reading axis without changing game logic or logo ownership. |

New pure reusable `lib/tv-playfield-bounds.js` exports normalizeLayout, projectRect, overlaps, fits, recover. It accepts finite bounded world/rectangles, clips to world, and recovers rendered-envelope positions while callers retain their simulation collision radii and motion. Arcade owner reuses the same module for Carry Ball.

Only authoritative display geometry uses `responsiveHudInsets` with a monotonic sequence per authenticated host socket. First registration owns geometry; replay from the same old socket cannot retake ownership/reset sequence. A new reconnect may take ownership and publish current measured bounds. Last geometry survives disconnect. Clients resend on real geometry changes and once/second. Root owns the shared party-runtime pause allowlist: requested geometry be allowed during pause so viewport/cap updates reach actors before resumed movement. No shared runtime edit was made here.

Local Tanks rendered envelope2.35×actorRadius+12 covers the enlarged rotated tank hull, recoil/shake, and bot variants while static-wall collision radius, projectile behavior, scores/modes and180-unit driving remain unchanged. Arsenal visible envelope52 includes rotated hull and36-unit shield plus event movement. Resize recovers tanks and pickups and removes projectiles outside the now smaller world;190/260 movement, weapon definitions, damage, score and controller coordinates are unchanged. Native phone layout/footer sources are untouched.

Source scope: new pure library, Tanks server/host.js, Arsenal server/app.js/style.css, Chaos host.html and one focused test. No shared HUD/logo/theme, native shell, footer, other game's source, or existing user change was reverted.

Validation:16 meaningful tests passed across tank-visible-playfield, round/reconnect safety and Carry visible-HUD suites. Covers2TV inverse projection, sustained authoritative human/bot movement, dynamic respawn/resize/shrink, authoritative expanded-height movement and bullet edges, unchanged movement speed, hostile/nonhost/invalid/stale/old-host/reconnect packets, and recovered snapshots while the clock is paused without executing a game tick. Impeccable layout detector returned no findings; touched JS syntax checks passed.

Fresh actual browser evidence is TV only, per latest root scope. Native controller tabs supply actual input but no phone screenshots or physical-device acceptance are claimed. All6 original full PNGs opened: Tanks1280/1920 in `output/playwright/composition-round2-2026-10-03/tanks-playfield-confirm`; Arsenal and Chaos1280/1920 in `output/playwright/composition-round2-2026-10-03/arena-playfield-confirm`. Each accepted row has2 compositionScreens containing current parent/iframe evidence.

Tanks confirmation finished2026-10-03T13:19:22.695Z, changedFiles[], errors[],103 authoritative actor-envelope samples. Real Forward/Fire input; paused1280/1920 resizing settled before resume; actual nonhost, invalid host and stale-sequence packets left bounds unchanged; actual TV reload preserved authoritative geometry. The driven human encounters an existing wall before reaching the cap: this browser run proves sustained movement/visibility and does not claim direct cap-edge contact. Direct human/bot cap-contact pressure is covered by the authoritative engine test.

Arsenal/Chaos confirmation finished2026-10-03T13:18:09.825Z, errors[]. Global changedFiles contains only rejected micro-pack3 provenance/PNG assets, outside these local dependencies; no arena source drift. Arsenal73 samples include actual joystick down hold6.8s and Fire, paused resizing, actual packet rejection and TV reconnect. At1280 the receiver892×720 projects uniformly with scale0.7433333 to1200×968.609865; at1920 receiver1492×1080 scale1.2433333 projects to1200×868.632708. Whole menu begins beyond worldx1200, so normalization legitimately discards its out-of-field rectangles. No actor hides behind it. Stone ground fills the receiver with square fullfield edges.

Chaos actual role input and paused resizing passed. Notification width/left are600/340 at1280 and900/510 at1920, exactly matching current cap; vertical gap is~16CSSpx. Existing height observation continues to place its field below the instruction.

Raw failures remain preserved. Initial `arena-playfield-final` found that paused clock intervals suppressed fresh snapshots even though geometry was accepted; corrected only local authoritative geometry handlers to publish recovered state immediately. `arena-playfield-confirm` Tanks failed a narrow angle observation window because100ms sampling skipped the.13rad steering tolerance; final Tanks harness uses.22rad tolerance, with no product change. Both raw failed rows remain unchanged.

Final owned source SHA256:

```
lib/tv-playfield-bounds.js 0ed0acc5c9772e802924a759593f86da16cfec3dc5c4537568c1e8e47fb1c68b
games/tanks/server.js dcc0052dcd357d0cc8bb693d719bce9c6f55d640ddec148a6baebea78bfcf16f
games/tanks/public/host.js 21c31dab18e5e8abf880c8ecf2ecb69bf3ee8762f841c7e6b8b78c1f997a624e
games/tankarena/server.js a988d9f7846c121c827504a65b93a1312fce8d47ae72cfc9e2f89a664ff49e8b
games/tankarena/public/app.js cf15eaf227d7cdf266ad8d0ab86e230faee6a25f064410336985e7b63bfce500
games/tankarena/public/style.css bafc8feced416f9fad612d713cf0b421ccb71d5f3578c101a44beb3368e8d4b4
games/chaos/static/host.html 62f2753744410c93b9124504f86500aa9654fae1cc30c5e3a43bc3bbc47b4608
tests/tank-visible-playfield.test.cjs 7abec51c8ff6280a73d02dc647daee10eeabf308fa392746a80124b0b1985787
```

Slot3 released; browser/server processes closed. Final root catalog will separately capture later shared attachment changes.
