# Pocket Siege and UI consolidation — 2026-09-23

Primary checkout: `localparty`, branch `heypals/ux-polish`.

## Recovered work

- Preserved the UX commits through `52e347d`: responsive lobby sidebar, readable roster with overflow count, compact TV hero, in-game HUD, and stable collapsing host deck.
- Incorporated the four Pocket Siege files from `heypals/tanks-projectiles` (`efd1f5c`), including the uncommitted grouped emitter-trail metadata and renderer lookup. The source worktree is retained.
- Preserved uncommitted CSS fixes for the TV notch stacking context and the host deck's trailing fade.

## Completed during consolidation

- Kept emitter-only carriers visible and retained readable weapon/effect colours on the dark sky.
- Kept high projectiles inside the cropped TV viewport; added a WebKit pixel regression covering Single Shot, Quad Missile and Chain Reaction at 1280×720 and 1920×888.
- Rounded visual alpha to three decimals (finer than the source's 8-bit alpha), reducing the weapon JSON to 398,319 UTF-8 bytes without raising the 400,000-byte budget.
- Fixed native header logo overlap on 320px phones.
- Updated outdated UI tests to check the current image logo, adaptive cards, roster overflow chip, controller shortcut, and physical-resolution game iframe.

## Validation

- 96 Pocket Siege unit tests pass, including all 321 weapons and terrain/effect paths.
- WebKit decodes all 1,869 projectile frames and draws all 410 animated source nodes.
- Projectile visibility, bounded effects, weapon picker, shared notch, and information headers for all 36 games pass.
- TV lobby checks pass at nine receiver sizes with 16 players.
- Real bowling, tankarena, kart and warsaw sessions survive all nine receiver sizes without reloading; pause covers the game after its entrance animation.
- Native host panel tests pass, including 320px logo geometry, sticky panels, bot prompt and controller-only action for an active game.
- iOS resource bundle synchronized; product and show-resource verifiers pass.

A compiled/signed device app was not installed by this consolidation. Earlier task history also leaves Bow Club's real-device camera confirmation unresolved; that is separate from this projectile/layout change. Exact visual parity of every weapon with Pocket Tanks has not been established.
