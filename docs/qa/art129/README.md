# Three-game art pass — 2026-10-05

Tank Arsenal: generated player-tinted tank sprite, softer luminous projectile cores, existing transient FX retained. Full-screen enlarged original ground replaces repeated canvas floor; native canvas clears every frame. Terrain mask ends at roster left minus roster right gutter, with 140px fade. Logical world and server exclusions unchanged.

Kart: generated forest clearing on one screen-covering backdrop; track canvas and stage transparent; existing track geometry, physics and controls unchanged. Obsolete procedural trees are only loading fallback.

Marble Bloom: generated ivory/sage garden, 3-cell machinery atlas for stand/launcher/tunnel, native alpha. Aiming, path, balls, versus layout code unchanged. Exact atlas cells selected at runtime; source PNGs retained intact. Rotating housing and stationary stand rendered separately.

Built-in ImageGen; asset root public/assets/gameplay/refresh129. Generation prompts and source names in generated-assets.json.

Verification: 19 tests passed across marble layout, Tank Arsenal weapons, kart laps/barriers/handling. Syntax and diff checks passed. Actual WebKit launcher captures: art129-final (720p) and art129-1080; both 3/3 games, zero page/resource errors and source drift. Viewed all six gameplay TV originals (including final Marble720 in first pass; unchanged after that). Phone captures also present, no phone UI edits. Not built or installed on iPhone in this art pass.

Initial captures rejected because tank transparent canvas did not clear history and Kart stage backing obscured forest. Both corrected before final captures. Failed temporary 1080 harness import corrected; final manifest passed.
