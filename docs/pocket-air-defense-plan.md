# Pocket Siege controller and air defense

Status: implemented for build 23. User approved two physical interceptor launches per player per match and the Superdesign hardware-console direction. Current design: `c01c245f-2970-414c-ace9-6ccc47689c53`, version 6 (English, corrected direction instrument). One expandable module at a time: tank / drone / air defense. The real controller preserves localized Russian when selected.

## Gameplay contract

- Two successful launches per match, not per turn. Reconnect does not refill charges.
- Air defense is usable only during enemy projectile flight. Tank aiming, movement, firing and drone deployment remain unavailable during the enemy turn.
- Server chooses the nearest eligible hostile airborne projectile deterministically. Do not trust a client-provided target or coordinates.
- Interceptor starts upward for a short boost, then turns gradually toward the threat. Bounded speed, turn rate, lifetime and terrain collision allow a late launch to miss.
- Prefer the existing Homing Missile visual; do not reuse its damaging explosion payload.
- One interceptor removes one target. Never call the intercepted projectile's impact, explosion, timed or proximity payload. Already spawned fragments and effects remain.
- On target loss, reacquire within 320 world units or expire harmlessly, without refunding a launched charge.

## Integration notes

- Keep interceptors in a separate server-owned collection, not the normal weapon projectile graph.
- `core/tanks.cjs`: reset charges on match start; accept defense input before the aim/active-player guard; include interceptor stepping and bounded lifetime in turn completion.
- `core/pocket-runtime.cjs`: interception must be checked before authored repeat/timed/proximity triggers. The detached `old = projectiles; projectiles = []` loop requires a stable live-projectile registry or intercepted-ID set for the substep.
- Use swept relative-motion collision to avoid tunneling with fast opposing objects.
- `server.js::stateFor`: send only a small radar subset needed to display actual moving threats, charge count, readiness and rejection reason. Do not expose the full weapon graph to phones.
- Add monotonic action sequence protection for launch in both client and server.
- Exclude allies, own objects, terrain-buried objects, zones and invisible helper projectiles. Animated visible nodes with `BULLET_NONE` need explicit classification rather than blanket rejection.
- Render a short rocket trail and small cosmetic interception flash; no crater, tank damage or chain reaction.

## Implemented limits

Radar range is 600 world units with at most eight hostile contacts. The missile boosts vertically for 0.2 seconds, accelerates to at most 520 units/second, turns at at most 4.5 radians/second and expires after 3.5 seconds. Contacts are evaluated at the authoritative 1/120-second simulation boundary; already-created effects are never rewound. Ordinary weapon scheduling is unchanged when no interceptor is active.

Server-side regression and real WebSocket tests cover charge persistence, input sequence replay, target classification, swept contact, ordering before payloads and personalized snapshot bounds. The full weapon audit again completes 321 weapons × 3 shot scenarios with no runtime failures; existing malformed-source warnings remain documented in `docs/gameplay-art/pocket-runtime-qa.md`.

## Required verification

Two accepted launches then refusal; charges survive turns/reconnect; no charge loss on invalid action; duplicate messages do not double-spend; pause/offline/loadout/own-turn/no-target rejection; friendly target exclusion; vertical boost then bounded turn; terrain occlusion; swept collision; one target only; pre-trigger interception blocks child payload; simultaneous interceptors cannot double-destroy; disappeared targets expire; no stuck turn; phone button usable during enemy flight with tank controls locked.
