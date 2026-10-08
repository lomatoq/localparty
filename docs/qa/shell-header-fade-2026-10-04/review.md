# Fixed shell header fade — 2026-10-04

Changed product file: `public/background-scene.css` only. Frozen SHA-256: `165769924588f6b10e65191c6531c5559ed56b5fa9cf4132f4ed9045e1379b45`.

The controller/native masthead and the measured host sticky stack now use two passive backdrop layers: 12 px at the upper edge and a restrained 4 px middle tier, both alpha-masked to zero at the bottom. Dark neutral tint also fades fully. Header text and controls have no filter; there is no animation, geometry change, global content inset or game-HUD change. Safe-area padding and sticky measurements stay with their existing owners. Unsupported backdrop-filter retains a readable translucent gradient rather than exposing an opaque fallback strip. The fixed Host tab inherits its existing panel base colour and hides the catalog's still-mounted sticky backing, avoiding double tint.

Existing TV selector declarations were compared against HEAD and are identical. TV styling belongs to the root lane. Pause/Lobby and native bottom tabs were not edited.

Read: AGENTS.md, docs/qa/ui-regression-rules.md, docs/qa/design-contract-2026.md and `/Users/hlebhlyaba/.codex/skills/mobile-native/SKILL.md`. The skill's hardware-verification requirement remains outstanding; no physical-device claim is made.

## Evidence and checks

Actual isolated server/controller UI, shipped native controller bridge and tabs, native host page with real catalog and an explicitly substituted Swift snapshot transport. Sizes393×852 and320×568, DPR2. No fake final gallery; no build/install/commit.

- `output/playwright/shell-header-fade-2026-10-04/final-chromium/report.json`: 29 captured states, `ok:true`, errors[], source start/end equal. Covers controller and native-controller initial/scrolled; native-host catalog initial/scrolled; Host tab initial/real inner scroll; disabled-filter fallback. Before paint comes from a HEAD CSS route, never a source rollback. Assertions preserve header box/foreground geometry and verify passive filter/mask ownership. All17 new/fallback originals were personally opened.
- `output/playwright/shell-header-fade-2026-10-04/host-final/report.json`: final four Host-tab originals replace the earlier four after the isolated Host-tab base/backing correction. `ok:true`, errors[], source start/end equal. Inner body scroll moves0→600 at both sizes; actual client/scroll heights are recorded. All four originals personally opened. Other25 states remain applicable because the final two selectors apply only to `.native-host-tab`.
- Initial WebKit run:28states/errors[]/stable source. Optical blur did not paint despite correct computed filter; this set qualifies geometry, not the intended blur pixels.
- Headed WebKit reproduces the same discrepancy. A plain unmasked12px backdrop over a striped background also stays sharp: `plain-control/webkit-unmasked.png`. This isolates a bundled WebKit rendering limitation rather than assigning a mask/isolation defect. Chromium paints the intended softening on the unchanged production recipe. The original WebKit limitation has not been treated as proof of physical Safari failure.

Representative reviewed current originals:

- `final-chromium/controller-393-after-scrolled.png`
- `final-chromium/native-controller-320-after-scrolled.png`
- `final-chromium/native-host-320-after-scrolled.png`
- `final-chromium/native-controller-320-no-backdrop-fallback.png`
- `host-final/native-host-panel-393-initial.png`
- `host-final/native-host-panel-320-scrolled.png`

Commands from repository root:

```sh
QA_ENGINE=chromium \
QA_CHROMIUM=/Users/hlebhlyaba/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell \
QA_OUTPUT=output/playwright/shell-header-fade-2026-10-04/final-chromium \
PARTY_PLAYWRIGHT=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright \
node tests/browser/shell-header-fade.cjs
```

The final scoped Host confirmation adds `QA_HOST_PANEL_ONLY=1` and changes QA_OUTPUT to `output/playwright/shell-header-fade-2026-10-04/host-final`.

`node --test tests/native-shell.test.cjs tests/native-tab-transition.test.cjs`:41passed. Helper syntax and scoped diff checks pass. All browser/server processes closed.

## Limits

Physical iPhone safe areas, GPU blur and WKWebView compositing remain unverified. The [WebKit backdrop-filter documentation](https://webkit.org/blog/3632/introducing-backdrop-filters/) explains that backdrop sampling and compositing are engine rendering passes; [Playwright's issue28363](https://github.com/microsoft/playwright/issues/28363) also documents a screenshot/filter discrepancy, but does not prove this run has the same cause. Our plain control is the direct evidence for this toolkit limitation.

This bounded set does not claim fresh screenshots for every active-game controller, results, or every popup. The shared selector covers those mastheads with their existing zero-tail inset, but actual runtime acceptance here is the listed shell/catalog/Host states. No speculative browser-specific DOM workaround was introduced.
