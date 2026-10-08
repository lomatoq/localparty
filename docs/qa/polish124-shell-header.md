# Shell header correction — 2026-10-05

The browser player, native controller, native Host catalog stack and pinned Host Panel title now sample their actual live backdrop once with 20px blur. A separate darker translucent gradient stays dense behind the reading/control area and fades at the bottom. There is no copied image or filtered foreground. Header measurement, scrolling, safe-area rules, footer treatment and TV selectors were preserved.

The previous two blur passes each faded across the control band, and the dark tint faded both in its color stops and its alpha mask. That combination let sharp scrolling artwork remain visible beneath the controls. The corrected sampling layer remains full strength through the controls, then fades only in the tail. The independent header tint is not multiplied by a second mask across the reading band. The empty measured Host backing filters directly; its pixel probe explicitly verifies every sampling filter is disabled before comparing. An earlier diagnostic override lost selector specificity and was corrected; its zero delta was not evidence of a product defect. The final 48px mask starts below the sticky controls and fades that decorative backing only in the tail.

## Changed files

- `public/background-scene.css`: narrow final shell header block only, preserving the already dirty 10-04 work.
- `tests/browser/shell-header-fade.cjs`: intended layer ownership, geometry/hash/error checks, same-state blur on/off pixel probes and independent plain engine control. `QA_BASELINE` accepts the saved dirty pre-edit CSS for a truthful comparison.
- This report and the lane log. No build, install or commit in this lane.

## Evidence

Artifacts: `output/playwright/polish124-shell-header/`. The exact pre-edit CSS is `background-scene.before.css` (SHA-256 `165769924588f6b10e65191c6531c5559ed56b5fa9cf4132f4ed9045e1379b45`). Current source identities are in `source-hashes.json`; CSS SHA-256 is `c5f576b257cc536dc37979907f098c9b476227f06bba8f9d2b7be2ae3ef9c2c2`.

`final-chromium/report.json` and `final-webkit/report.json` contain actual server browser player pages, shipped native pages with the native controller bridge and tab scripts, and a native Swift snapshot transport fixture. Each engine covers initial/scrolled browser controller, native controller and Host catalog at 393×852 and 320×568; initial/scrolled Host Panel at both widths; and a disabled-filter fallback. They are viewport emulation, not physical iPhone captures. Browsers were run serially.

Chrome: 29 capture states, zero page errors, unchanged header geometry/foreground styles, stable relevant source hashes. Same-state blur-on/off probes keep the tint unchanged and alter only backdrop filtering, proving that the live content is sampled rather than replaced by copied artwork. The four final probes change 175104 pixels (browser controller), 172012 (native controller), 118906 (Host catalog stack), and 50312 (Host Panel) in the top 360 physical pixels, with a RGB difference threshold of 3. Independent checkerboard blur control also changes pixels.

Bundled WebKit: 29 capture states and declaration/geometry/error checks pass. Blur-on/off screenshots show zero changed pixels; the unrelated plain checkerboard control is also byte-identical. Therefore this run verifies the darker backing and functional/geometry checks but cannot establish WebKit screenshot blur or physical WKWebView blur. The real backdrop filter remains in the product; no tint-only substitute was introduced. Physical iPhone/WKWebView remains unverified.

Opened originals: all 16 current Chrome after states (three surfaces × two widths × initial/scrolled, plus four Host Panel states), the disabled-filter fallback, and the controller blur-on/off pair. Representative WebKit originals were also opened for the 393px browser/native controller and Host Panel scroll states and 320px Host catalog scroll state. The final originals retain crisp controls, stronger separation from scrolling artwork and the bottom fade. No new overlap or header-size regression found. The 320px category pills retain the incumbent narrow-viewport clipping/horizontal browsing behavior; that geometry was unchanged by this paint-only correction.

Impeccable detector scoped to the single modified stylesheet: zero findings, saved as `impeccable-detector.json`. No false positives to adjudicate. Syntax check and `git diff --check` passed.

## Gallery originals

Use the files in `final-chromium/`:

- `controller-{393,320}-after-{initial,scrolled}.png`
- `native-controller-{393,320}-after-{initial,scrolled}.png`
- `native-host-{393,320}-after-{initial,scrolled}.png`
- `native-host-panel-{393,320}-{initial,scrolled}.png`

Keep the WebKit control/probe files as diagnostic evidence, not as physical-device acceptance. Per-run reports contain hashes before and after; do not apply this acceptance to later source changes.
