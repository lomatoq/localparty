# Header ambient audit — build 85

The TV header now uses an opaque dark RGB gradient, so the moving green ambient layer cannot show through. The same cause was present in the native host tab: its injected tabs stylesheet ended the header gradient in transparency. `branding.css` now wins that cascade with an opaque violet gradient. The regular player lobby header also had a transparent computed background; it now uses the existing dark #0d1017 surface.

No header geometry, buttons, footer, game artwork or motion was changed. The player gameplay header already has an opaque #151321 surface and was preserved.

Verified in actual WebKit against a real launcher with three joined players and normal-speed Sinyak Quiz:
- TV 1280×720 and 1920×1080: opaque gradient, backdrop none; header heights 64 and 96 physical pixels. Both full screenshots visually inspected; no green ambient blotch.
- Player lobby 375: computed rgb(13,16,23), backdrop none; full screenshot visually inspected.
- Player gameplay 375: computed opaque rgb(21,19,33); no ambient bleed.

Native host tab 320 and 375 was verified separately using the existing native bridge mock plus the actual injected `tabs.js` stylesheet (not a physical iPhone). Both screenshots visually inspected. Computed gradient stops are rgb(40,34,57), rgb(36,31,49), rgb(32,28,43); backdrop none. This specifically tests the later injected stylesheet override, not only the native host dialog.

Evidence: `.localparty-build/header-ambient-audit/` and `.localparty-build/header-ambient-native/`, each with report JSON. Harnesses: `docs/qa/art-direction-v2/capture-header-audit.cjs`, `capture-native-header-audit.cjs`.
