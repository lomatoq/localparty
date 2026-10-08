# Retained menu and interruptible artwork — 2026-10-05

Follow-up to perf132/133. User explicitly requested a performance specialist and an interaction specialist working together; source changes preserve artwork, resolution, soft masks and blur.

## Causal investigation

Plain RAF samples reproduce the return stalls without getComputedStyle stack instrumentation and without screenshots before the stop action. Diagnostic removal of masks, backdrops, individual entrances and early outgoing-frame retirement did not explain the large stall. These diagnostic visual removals were never shipped.

Keeping the existing menu laid out while hidden substantially reduces restoration work. It remains a single DOM menu. Production parks it absolutely at the existing64px logical header offset, makes it transparent, non-interactive and inert, and retains the authoritative hidden flag. Relative game layouts therefore keep their original available space.

Initial diagnostics looked better than the first production run: that discrepancy was preserved in the reports, not discarded. First production direct-launch return still showed visible opening spikes; the cached no-Host-Pick layout differs from the selected layout on return. Final results follow after the covered-reflow investigation.

## Interaction quality

Reopening game details during its exit previously sent its artwork back toward the catalog while the sheet reversed upward. The same live clone now changes direction from its current rectangle and rejoins the sheet, using the existing180ms reversal. An interrupted entrance also closes from its actual visible position. No artificial content delay or extra decorative animation was added.

WebKit and Chrome focused checks verify clone identity, less than3px position discontinuity, correct endpoint and no leftover hidden source image. The actual90ms reopen screenshot was visually reviewed.

## Evidence / scope

- Diagnostic and snapshot-pinned timing reports: output/playwright/perf-games133-return*.
- Interaction report and original screenshots: output/playwright/perf-motion133-flight/.
- Retained-menu geometry/focus/resize checks: output/playwright/perf-motion133-park/.
- Full phone gesture regression passes Chrome/WebKit in normal/reduced motion after artwork retargeting (`output/playwright/perf-phone133/motion-retarget-final`). All 72 catalog launch/return cases pass (`output/playwright/perf134/catalog/report.json`).
- No physical iPhone/AirPlay validation, new build or installation claimed by these browser checks.

## Covered reflow correction and final timed result

Retaining the layout exposed a second cause: a previously no-Host-Pick menu has a190px hero row; launch selects a game server-side, so return collapses that row. Its560ms grid-template-rows transition ran while the curtain opened. Diagnostic suppression of this single layout transition removed the opening stalls. Production disables the grid transition only while the return is covered, then restores normal visible browsing transitions before opening. Entrance transforms, blur and masks remain.

Final snapshot-pinned production tests (plain RAF, screenshots after timing):

| Route | Old opening max | New opening max | Old covered max | New covered max | Old transition | New transition |
|---|---:|---:|---:|---:|---:|---:|
| Direct launch / return |122ms|18ms|460ms|125ms|1568ms|1061ms|
| Preselected Host Pick / return |24ms|17ms|364ms|177ms|1383ms|1050ms|

Neither final sample has an opening or post-return idle frame above40ms. These short desktop-WebKit measurements do not claim every frame on every physical device; covered preparation still has125–177ms work. Evidence: `output/playwright/perf-games133-return-guard-final` with source hashes and raw states. The later metadata-only card edits are captured separately.

## User-directed card metadata

Supporting descriptions keep their italic type and size, with a lighter38% card-accent / pale-white mixture at66% opacity. This includes the previously excluded featured Tank Arsenal card. Player ranges keep the actual catalog numbers and use the existing friends icon instead of the repeated Players label, on the shared TV/native catalog. The seven-weapons tag uses the existing bullet icon. Accessible labels retain meaning; Joystick's standalone translation is added because the former whole-string translation is now structured markup.

## Final review

All 36 metadata labels and icon masks checked at TV 1280/1920 and native 320/393. Root visually reviewed TV 1280 and both native metadata captures; native393 favorite/tag crowding corrected with a narrow compact-gap rule; fresh capture visually reviewed. Weapon has 7px inner clearance and tag has 14px clearance to favorite star. All 36 cards across four viewports pass metadata assertions. Impeccable detector returned three existing warnings (requested Our People count gradients, existing start-button inset accent); no new metadata finding, retained intentionally. Review gallery: `output/playwright/perf134/index.html`.
