# Host Hub masks and shared motion — 2026-10-05

## Changed
- One continuously measured viewport backing for the sticky Host catalogue. Approach to the genre row is interpolated across 64px instead of exchanging opaque layers at a threshold. Tint and masked 20px backdrop blur are separate siblings. Foreground inputs remain sharp.
- Search input and placeholder use the existing italic copy face in native and browser catalogue controls.
- Shared dialog close/reopen reversal preserves the currently painted pose. A resumed dialog no longer restarts the CSS entrance at opacity zero.
- Shared setVisible animates both directions, retargets interruptions, ignores redundant state updates and has a 260ms finish fallback for deferred WebKit animation events. Native/browser notices now use it.
- Native/dialog/rules details keep their open body during a 220ms fold, reverse from current height, retain native keyboard/focus semantics. Named exclusive details are left to the browser.
- Legacy .overlay, .ss-overlay and non-native role=dialog surfaces use discrete display transitions plus opacity; pointer input stops immediately on close. No gameplay canvas animation was added.
- Native tab catalogue remains mounted but is no longer painted through Host header/footer.

## Evidence
`tests/browser/shell-motion130.cjs`: actual native-shell route with controller-bridge.js and tabs.js, transport fixture; Chrome and WebKit, 393x852 and 320x568. Dialog interruption, toast interruption/completion, details close and triple reversal, legacy overlay intermediate opacity and pointer exclusion, reduced-motion close. Both reports passed, no page errors or source hash drift.

Reports and 16 captures: `output/playwright/motion130/{final,webkit-final}`; gallery `output/playwright/motion130/index.html`.
Four existing motion-system unit checks passed. Changed JS parses and diff whitespace checks pass.

Original scrolled catalogue and Host folding/expanded frames were visually inspected. Chrome shows the real soft blur/fade. Headless WebKit does not reproduce the same backdrop blur; its passing computed-style checks are not proof of physical WKWebView blur. No device install/build performed. This is shared shell/component coverage, not a claim of manually exercising every game-specific transition in all 36 games.
