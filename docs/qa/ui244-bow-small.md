# Bow Club: Draw above the small native-controller footer

Date: 2026-10-07. Bounded UI change; no renderer/game rules or approved Pause/Lobby changes.

At phone320×568, the actual native controller bridge plus tabs leaves a320×358 game iframe. The old touch pad starts at148px; its126px height plus20px action gap and72px Draw ends8px below the iframe. The shared footer fade begins28px above that edge, so the button's lower copy and rim are darkened/clipped.

`public/game-ui-polish-20261004.css` now moves only the short portrait Bow touch pad to116px and gives its Draw group an8px gap. The existing224×126 mini-field,72px Draw, font/material and approved parent footer are preserved. The media query is bounded to width≤360px, iframe height≤400px and portrait; the body must actually be in touch mode. No JS, phone.js, Mini3D, footer,393px or camera rule changed.

## Fresh evidence

`tests/browser/bow-small-ui244.cjs` starts a real local server and Bow worker, registers a dedicated TV and two players, launches the actual match, and injects both `controller-bridge.js` and `tabs.js`. For a same-match baseline comparison it toggles only the new stylesheet media condition and invokes the existing resize anchor so position-only CSS changes are reflected. The comparison is not a mocked game state.

Chrome and WebKit runs both pass with no page errors:

| Check | Evidence |
| --- | --- |
|320 native available region | Actual iframe320×358 |
| Draw lower edge | Before448px (WK447.97), after404px (WK403.97), fade begins412px:8px clear |
| Mini-field | Before/after224×126 (WK223.97×125.97), unchanged |
| Grouping | Readout bottom97.5→pad top116:18.5px; pad bottom242→Draw top250:8px |
| Action and footer | Draw remains288×72; font/fill identical; Pause/Lobby geometry/style and backdrop gradient identical |
| Real gesture | Chromium trusted touch hold/release; WebKit trusted mouse pointer hold/release. Both accepted:10→9 arrows,25-point hit |
|393 and hand |393×642 iframe; existing geometry unchanged; real left-hand toggle works |
| Lifecycle | Actual pause/resume, resizing and hand keep the same server match instance |

All18 images in `output/playwright/ui244-bow-small/{chromium,webkit}` were opened and reviewed. The320 after/held/released action is clear above the untouched footer.393 preserves the existing field/action layout. Gallery: `output/playwright/ui244-bow-small/index.html`; raw report and exact source hash are in each engine folder and `visual-review.json`.

## Explicit limits and existing defects

- Landscape852×393 is an unchanged-geometry guard, **not visual acceptance**. Its actual852×203 iframe collapses the old touch pad to0×0 (`max-height:H−232`); the existing position anchor then leaves Draw below the iframe. The new portrait rule does not run there. Reported to the root lane; outside this bounded change.
- Camera-stage is an explicitly labelled DOM layout fixture, not a real camera stream. Its geometry stays unchanged when this touch-only rule is toggled. The existing small camera Draw bottom432 crosses the parent fade beginning412 by20px. Reported separately; no camera permission, tracking or hardware claim.
- Browser evidence does not validate physical iPhone safe areas, camera, haptics, AirPlay or GPU performance. No native build/install performed by this lane.

## Reproduction and source freeze

```sh
NODE_PATH=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/browser/bow-small-ui244.cjs
QA_ENGINE=webkit NODE_PATH=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/browser/bow-small-ui244.cjs
```

Shared CSS SHA256 at both captures/source freeze: `a9753754326d3cefe1091a6ef4fb9da274c906877bdf73c86358ab06931d9b17`.
