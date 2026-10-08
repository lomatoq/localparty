# Phone sheet interruption follow-up · 2026-10-05

Source scope: `public/app-ux-20261005.js` only. Existing CSS, backgrounds, blur, soft scrolling masks, native transport and gameplay remain untouched.

## Confirmed defects and fixes

The existing native Host Hub fixture reproduced three gesture problems in Chrome:

- `lostpointercapture` left the sheet translated 40px and its dragging state active. Treat lost capture as cancellation and spring back, never as dismissal.
- Closing during an active gesture retained the private pointer state. After reopening, the next gesture was ignored. Clear the gesture on the native dialog close event.
- Reversing the drag above its pickup point produced a -10.8px rubber-band offset, then snapped directly to zero. Use the existing spring for offsets in both directions.

Motion purpose: occasional sheet navigation, spatial consistency and preventing a jarring change. Existing WAAPI translate spring, 420ms and the existing `--ux-spring-sheet` token retained. Reduced-motion gesture release remains immediate. No new decorative motion or source CSS.

## Verification

Harness: `scripts/qa-perf-phone133.cjs`. Actual native-shell DOM/CSS/scripts with shipped persistent `tabs.js`; a stub native transport supplies catalog/player state. Synthetic pointer events exercise lifecycle interruptions deterministically. Chrome baseline reproduces all three failures; Chrome and WebKit, each with normal/reduced motion, verify fixed behavior. Rapid close/reopen settles with no flight layers left. Host tab, its scrolled content, and return to catalog are captured as visual regression context.

Artifacts: `output/playwright/perf-phone133/before/report.json` and `after/report.json`, with 20 after screenshots. Reviewed Chrome detail/reopened and WebKit detail/Host scrolling originals: composition retained; final detail rests at the same location. WebKit headless backdrop sampling differs from Chrome as in the existing fixture; this change does not alter backdrop styles.

`node --check public/app-ux-20261005.js` and `git diff --check` pass.

This is interruption correctness evidence, not a benchmark or physical iPhone touch/blur validation. No performance improvement percentage claimed. Native touch arbitration remains a hardware check. No build, installation, commit or push.

Source SHA-256 after changes:

- JS: `74bd8375b8f3efb592942fcc3cd149215637575503cf1c184e7511d1a3539252`
- CSS (unchanged): `510de85efb9106668a08ff34039ccab4c35a54098c8d0f873735c974fedcd7c9`
