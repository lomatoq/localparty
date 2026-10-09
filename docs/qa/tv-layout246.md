# TV layout246: stable sidebar space across selection and browsing

2026-10-09. This lane covers the TV menu's Join the Party, Our People and On Top column. It does not redesign the approved art or establish iPhone/casting performance acceptance.

## Reproduced baseline

The TV242/243 captures checked card widths and ranking centering, but did not require the same vertical anchors when moving between a selected game and catalogue browsing. A legacy `margin-top:24px` still applied to the unselected sidebar after discovery had moved into `#tvBrowse`. The selected lobby separately lifts by24px and grows by24px, while its sidebar adds26px of top padding.

The new isolated real `/tv` capture, with real lobby WebSockets and saved QA profiles, reproduced this mismatch in desktop WebKit at720p,1080p,4K and16:10:

| 1280×720 logical coordinates | Selected | Browsing |
| --- | --- | --- |
| Sidebar border box top | 60 | 108 |
| Our People top, 1 player | 287.59 | 309.59 |
| On Top top, 1 player | 468.80 | 479.80 |
| Visible roster rows, 16 players including +N | 4 | 3 |

The scales1,1.5 and3 preserve the same logical mismatch. Card x/widths, full-width Host Pick, round Play inset, complete ranking bounds and golden first-place coins pass the earlier contract. A MacBook16:10 browser also reproduces the state difference. This is a proven browser defect; a larger or different native casting defect remains distinct until a physical receiver record is obtained.

Baseline: `output/playwright/tv-layout246/baseline/report-webkit.json`;16 selected/browse matrix images plus one reconnect image, gold detail and reduced-motion image. The initial sandbox run failed with `listen EPERM`, a runner restriction. The subsequent isolated-server run completed.

## Limited source change

`public/tv-menu-polish.css` removes the obsolete sidebar top margin and uses2px top padding while browsing. The selected state retains its existing26px padding. Because its parent is24px higher and24px taller, the two sidebar content regions now share both their top and available height. This is derived from the existing selected layout, rather than applying a new negative offset to the ranking.

The approved selected-screen positions, left column, art size/position, lamp, character masks, shadows, Top auto-centering, trophy, coins and animation gates are untouched. No new JavaScript layout loop was added.

An independent curtain review also found the discovery lamp leaking into Chrome's first Curling waiting screen. The lamp and edge-light layers are reparented directly under `#tvStage`, so they do not inherit `#lobby[hidden]`. Active-game renders skip the discovery update, and the earlier `placeLamp()` returned before hiding existing layers when its source was absent. `public/tv-discovery.js` now synchronizes decoration visibility against lobby visibility, intro visibility and source presence. Bounded lifecycle observers handle hidden attributes and source removal; hidden layers return before geometry reads. Lamp shape, position and light styling are unchanged.

## Verified candidate and remaining scope

The frozen candidate's WebKit run finished successfully on the real isolated server: `output/playwright/tv-layout246/final/report-webkit.json`, `ok:true`, zero JavaScript errors and zero failed resources. It produced20 full menu captures (initial discovery at720p/1080p/4K; selected/browse pairs for1/16 players at720p/1080p/4K/16:10;4K reconnect), one actual Curling launch capture, one coin-glint detail and one reduced-motion capture. All23 originals were visually inspected through five labelled contact sheets; no new clipping, art displacement or card grouping issue was found in this lane. Independent final review is recorded separately in `docs/qa/visual-review246.md`.

All eight selected/browse pairs have identical Join, People and Top y/height anchors. At720p, People starts at287.59 in both states. The sparse Top starts at468.80 in both states; the full roster Top starts at526 and ends at714 in both states. The full roster retains four visible rows including the overflow chip in both states, instead of losing a row during browsing. Eighteen-frame selection crossing samples have no delayed anchor change. Twenty-four-frame resize samples at each of four receiver sizes preserve card x/width alignment, and a real display-socket reconnect preserves layout.

Host Pick still fills the catalogue width and its round Play inset matches its top/bottom inset. Ranking fits and centers within remaining space; the first place shows the stored1890 coins in golden `rgb(255,221,131)`. Gold glints run only when enabled, pause under catalog suspension and stop for reduced motion. These assertions all passed.

The initial-discovery lifecycle check removed and restored the actual lamp source, then launched Curling through the management API. Every reparented stage lamp/light layer hid when its source disappeared, restored with the source, stayed hidden on the active Curling screen, and stayed hidden on the selected menu after stopping. The launch screenshot shows no leaked purple menu lamp.

The root added bounded numeric native layout evidence to the existing10-second `frame-diagnostics.js` reporting path and native allowlist. The browser fixture verified five numeric rectangle fields and absence of the QA player's name using a mocked native message sink. This is not a physical device measurement.

The user changed the task to Git integration after the current WebKit run. Source changes were frozen and the browser/server closed; the planned Chromium candidate run was skipped. Candidate Chromium coverage and actual iPhone→separate MacBook/TV layout/performance acceptance remain unverified in this lane. No browser timing is claimed as native casting acceptance.

Reproduce later with separate fresh-server commands: `QA_BROWSER=webkit node scripts/capture-tv-layout246.cjs` and `QA_BROWSER=chromium node scripts/capture-tv-layout246.cjs`. Syntax checks, `git diff --check`, and the two existing `tests/tv-layout.test.js` checks passed. Frozen production source SHA-256:

- `public/tv-menu-polish.css`: `78cd1ead8b51f0100df0daac7b6b59b7b2879325fc0c588bcaebd9e4071c7e41`
- `public/tv-discovery.js`: `f966c68439cc84cc11a17a5e7cb3995bdc234285d676b5c1de82b209028b147e`
