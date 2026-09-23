# LocalParty 0.11.1 (23)

## Changes

- Approved Superdesign arcade console integrated into Pocket Siege: manual Tank / Drone / AA modules, English default with selected Russian localization preserved.
- Direction instrument: needle under the tank body, softly fading bounded ticks, separate angle readout and lower pill-thumb slider. Compact layouts tested down to a 320×520 embedded viewport with the shared game skin enabled.
- Air defense: two server-authoritative physical interceptors per player per match, enemy-flight-only activation, vertical boost then bounded homing. Interception removes one projectile without triggering its weapon payload or modifying terrain. Personalized radar carries at most eight threats; sequenced commands prevent replay spending.
- Original object projectile frames for 30 exact source nodes / 96 frames / 11 weapons. Glowing particles and physics retained.
- Native tab transition uses an opaque 0.26-second adjoining slide with cleanup and stale-callback protection, not a cross-fade.
- Running-game Start CTA changes to Open controller; pending launch prevents duplicate actions.

## Verification

- 31 combined AA, drone, small-fragment terrain, settling, projectile-art and native-transition unit tests passed.
- 52 runtime/material/native-shell/localization tests passed, including the 321-weapon audit. Independent audit: 963 shot scenarios, zero runtime failures. Existing malformed-source ambiguities remain in `docs/gameplay-art/pocket-runtime-qa.md`.
- 13 product-validator tests passed, including stale Pocket Siege controller and missing air-defense resource cases.
- Real WebSocket AA test passed: enemy-flight availability, two charges, stale/duplicate/missing sequence rejection, compact private snapshots and reconnect persistence.
- WebKit controller tests passed for manual mode switching, angle layering, radar movement, launch sequence, pause/disconnect/empty-charge guards and standalone/managed narrow layouts. Real drone deploy/control/drop/15-second timeout test passed.
- WebKit interceptor renderer tests passed: original sprite orientation, bounded trail/flash, pause/reduced-motion behavior, no state or terrain mutation.
- Previous native simulator regression: 15 rapid tab taps in three bursts, 12 intermediate animation samples, no alpha ghosting and no retained snapshots.

## Product

Release built with iPhoneOS 27 SDK, bundle `com.localparty.launcher`, version 0.11.1 (23). Product verification passed for all 36 catalog entries. All 197 Pocket Siege core/public files match the signed application byte-for-byte. Installed and launched on the connected physical iPhone 17 Pro; device metadata confirms bundle version 23.

These checks do not constitute a full manual multiplayer/AirPlay playthrough on physical devices, or pixel-identical comparison against the original Pocket Tanks executable.
