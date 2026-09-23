# UI follow-up — build 21

- AirPlay/TV card descriptions: 16px. Phone descriptions unchanged at 12px.
- Selected-game strip: compact capsule, gentle lime light by Start, periodic shine; reduced motion respected.
- Shared match notch: smallest top caption removed, primary value lifted, lower progress line inset from tapered edges.
- Controller header, game root and footer share one surface. Measured visual viewport and native dock reserve determine the iframe height; footer does not shrink into game controls.
- Active game actions include an explicit Controller shortcut; launch does not switch tabs automatically. Action buttons wrap instead of clipping.
- Native screen transition reduced from 680ms to 460ms; tab glow travel from 850ms to 560ms.

## Verification

- WebKit actual-game audit: all 36 games at 393×852 and 320×700. Initial browser run had seven transparent-body assertion false positives; corrected effective-background checks and rechecked those games successfully.
- Separate full native-wrapper run: 36 games / 72 layouts, no failures or page errors. Checks iframe bounds against footer, child viewport height, effective background, reachable visible buttons/ranges, clipping ancestors, horizontal overflow, and Naval private fleet.
- Report: `.localparty-build/controller-continuity-native-all/report.json`.
- Catalog WebKit: TV 1280/1920, desktop1280, phone393; exact font sizes, blur masks, button text shadows, capsule geometry/overflow.
- Shared notch: 12 viewport/text fixture combinations; screenshots inspected.
- Native host browser regression: explicit Controller message, no automatic transition, action DOM retention, sticky controls and dialogs passed.
- Native shell/localization tests: 42 passed.
- Signed iOS 0.11.1 (21) built, product verification passed, installed on connected iPhone 17 Pro. These layout checks use WebKit, not exhaustive manual physical AirPlay gameplay.

## Superdesign

Requested skill used for CLI preflight/login and repository context preparation. CLI reports unauthenticated and waits for browser authorization; no remote design has been generated or claimed as implemented. Six init files and design-system context are prepared under `.superdesign/`.
