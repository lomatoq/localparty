# Pocket Siege runtime verification — 2026-09-20

## What changed

- Execute the imported trigger programs, including LOOP/IF, ordered register assignments, delayed commands and each projectile's own physics/trigger flags. Root firing no longer substitutes a generic weapon-family effect.
- Execute CRUISER and repeat triggers. Burn Barrel now bounces, rolls, emits its fire trail and detonates.
- Execute child timed, proximity, vertical-velocity, bounce and impact triggers independently. HIT_NOTHING bypasses terrain, not tank hits; BYPASS_TANK controls tank contacts.
- Preserve per-explosion terrain flags. DIRTBALL/MAGICWALL stages create real cumulative terrain. Fixed concurrent settling-delay clocks without teleporting terrain or changing gravity/contact constraints.
- Restore all 175 authored FIRE/FOG/SUPERBALL material profiles (67 weapons, 99 original masks). Live snapshot zones recover materials after dropped events without duplicates.
- Drone: one charge per player per match, authoritative joystick movement and downward weapon delivery; terrain-only payloads fall before executing. Timeout/disconnect auto-drops, ammunition is charged once.
- Soft upper/lower weapon-list mask; 8px Host Panel roster gaps.
- Cleaned 70/321 weapon icons before source-tile normalization, removing 19,738 pixels from small disconnected edge fragments and preserving 94 large/main edge components. Cleanup is deterministic and idempotent.

## Verification

- `node scripts/audit-pocket-runtime.cjs docs/gameplay-art/pocket-runtime-audit.json`: 321 weapons × 3 scenarios = 963 shots, no unresolved runtime commands, non-finite values, capacity limits or shot timeouts. The JSON records the actual executed command types, trigger names, terrain delta, duration and peak live objects for every scenario.
- 50 targeted server/parser/terrain/drone/material/icon tests passed.
- WebKit real-shot replay: all 321 weapons, 183,063 actual server events and 50,194 material events; no missing material profiles or browser errors. This replay ran before the final no-op visual suppression and snapshot-recovery changes; those changes additionally have focused tests.
- WebKit material recovery: 279 actual 20Hz Burn Barrel snapshots with deliberate event loss, 394 sources recovered, no missing IDs or duplicates; fire visible in all 245 snapshots with live material.
- WebKit drone deploy/joystick/drop and weapon-loadout tests passed.
- Existing material renderer test: all 67 material weapons / 99 masks passed.
- General application suite: 216/218 passed in the parallel run; the reconnect timeout and camera-acquisition assertion both passed when those files were rerun serially (4/4). Party and Spy integration scripts also passed. The initial sandboxed network run was invalid because localhost listeners were denied and was repeated with permission.

## Scope and known source ambiguities

These checks establish execution and rendering of the imported mechanics in our simulator. They are **not** a frame-by-frame or pixel-identical comparison with the original Pocket Tanks executable. Ballistics, material rendering, terrain growth and some animated projectile artwork remain LocalParty implementations.

- Original decoded files contain stale garbage after DONE; the importer now stops there. There are 320 distinct source weapons; the existing `carpet_bomb_2` catalog ID is preserved as a compatibility duplicate, keeping 321 selectable entries.
- BubbleGunDudExplosionBullet and RoboticWormDudBullet are referenced but not declared in the source packs. Their register/delay rows are explicitly treated as diagnosed no-ops, consistent with the nearby zero-damage, non-erasing dud definitions. No sibling projectile or destructive effect is invented.
- StarCruiserCruiserTrigger contains ELSE/ENDIF with no IF. The importer preserves this warning and the declared commands; exact original branch behavior cannot be established from that malformed description.
- Unreachable/disabled source references and recovered numeric debris remain visible in importer diagnostics rather than being silently replaced by numbered siblings.
- Icon cleanup deliberately does not cut fragments physically connected to the main artwork.

## Reproduction

Run `node --test tests/pocket-runtime.test.cjs tests/pocket-drone.test.cjs tests/siege-terrain.test.cjs tests/pocket-terrain-settling.test.cjs tests/pocket-reference-parser.test.cjs tests/pocket-reference-import.test.cjs tests/pocket-material-profiles.test.cjs tests/pocket-icon-cleanup.test.cjs`.

Browser scripts require Playwright with WebKit and localhost access: `tests/pocket-runtime-browser.cjs`, `tests/pocket-material-recovery-browser.cjs`, `tests/pocket-materials-browser.cjs`, `tests/pocket-drone-browser.cjs`, `tests/pocket-loadout-browser.cjs`.

Atlas dry-run: `node scripts/clean-pocket-icon-atlases.cjs`; apply: append `--apply`.

## Follow-up: tiny terrain impacts and drone flight

- Integrated each circular crater over the full 2px column footprint: radius-1 blasts no longer disappear between column centres. Refined `COLLIDE_OUTSIDE` contact by bisection instead of backing up a whole pixel. Original weapon erase flags and cave settling are unchanged.
- Verified 118 authored small erasing stages at five x phases, 24 actual Glitter Gun fragment contacts, and 325 non-erasing SHRAPNEL emitters. Repeated the 963-shot runtime suite successfully. Independent integration run: 32 drone/fragment/terrain tests passed.
- Drone now uses a 15-second authoritative charge, acceleration/inertia, deterministic wind gusts, banking, a half-size tank-style body, compact animated rotors and red lamp. The precise aiming line is removed. Seven drone tests and the WebKit renderer regression passed; visual reference: `/private/tmp/pocket-drone-art.png`.
- Catalog: 22px ordinary TV titles, 14px/two-line descriptions, and artwork continued beneath captions with a masked 12px blur and translucent tint. Sharp artwork fades gradually into the blurred layer; both artwork layers use 80% brightness without dimming text/buttons. WebKit checks passed for all 36 cards on 1280/1920 TV, desktop and the native phone shell. Screenshots and metrics: `.localparty-build/catalog-card-qa/`. Existing source did not reproduce the extremely tiny type in the supplied screenshot; fresh bundled resources and an app restart are required.
- Drone controller replaces the cannon sliders during flight. WebKit passed at 390×844 and 320×640, including fully visible joystick/drop, restoring cannon controls, releasing held input on pause/disconnect, low-charge warning and real 15-second timeout/automatic drop.

### Previous device delivery

Final card correction (build 20): the earlier visual assessment missed the internal rounded `.art` clip. Removed its independent corner radius and reflected-light pseudo-layer, moved the fade from the transformed image to the fixed media container, and kept blur opacity stable on touch/hover. Descriptions are now 12px, and card action text explicitly has no inherited shadow. Expanded WebKit tests passed all four surfaces, asserting these exact layer properties and button text shadows; new screenshots were visually inspected. Build 20 product verification passed and changed CSS matched the signed bundle.

Follow-up delivery: iOS 0.11.1 (18) built, signed, installed and launched on the physical iPhone 17 Pro after the final gradient/14px/80%-brightness refinement. Product verification passed; 195 Pocket Siege and changed catalog resources matched the source byte-for-byte. Visual checks were WebKit screenshots, not a physical AirPlay capture.

iOS Release 0.11.1 (17) built and signed successfully, verified with `verify-ios-product.py`, installed and launched on the connected physical iPhone 17 Pro. Device application metadata confirms bundle version17. All191 Pocket Siege core/public files were compared byte-for-byte with the signed product. Gameplay checks above were simulator/WebKit checks, not a complete manual playthrough on the physical phone.
