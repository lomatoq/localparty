# Integration round 246

2026-10-09. Baseline `db5e4f4`, installed release 147. The user reported popup stalls, abrupt curtains, cast TV sidebar displacement and repeated browser account entry. The later instruction replaces further optimization/build work with committing the current work, publishing it on `main` and removing obsolete branches. Lanes are frozen; unfinished experiments are not production changes.

## Retained changes and evidence

- Browser profile: storage exceptions no longer abort controller bootstrap or the independent authenticated cookie POST. Five new storage fault tests and existing auth/reconnect/certificate tests pass. Persistent Chromium/WebKit runs cover reload, full browser/server restart, port changes and normal/full/blocked storage; all 12 expected scenarios pass. Baseline normal restoration already worked. The friend's precise browser failure and changed LAN-hostname recovery remain unverified. See [profile-restore246.md](profile-restore246.md).
- Phone host: avoid repeated DOM writes, park hidden visual rendering while processing authoritative state and commands, reconcile before resume, preserve initial catalog prewarming and close obsolete launch details on ACK. Both browser engines pass geometry, translation, lifecycle, bots/rematch/controller and simulated-keyboard rename checks. Identical-state batches improve; the visibly changing-state CPU result does not establish a reliable improvement. The original entrance hold remains unchanged. See [phone-hotpath246.md](phone-hotpath246.md).
- Shared popup observers: skip hidden label measurements and unchanged styling, batch mutation work and observe relevant scroll owners. Chromium/WebKit checks preserve 93% material, blur/dimming, visible underlying controls and cleanup. First-visible latency is essentially unchanged. The static-blur experiment is incompatible with the requested progressive blur; the smooth backdrop experiment is unrun and only a diagnostic script. No blur CSS replacement is retained. See [popup-performance246.md](popup-performance246.md).
- TV layout: remove the inherited browse-only sidebar displacement while preserving selected geometry; hide reparented lamp/glow decoration with the lobby or removed source. Final WebKit checks cover four display ratios, selected/browse, sparse/full rosters, resize/reconnect, gold coins and real Curling launch; 23 captures independently reviewed, zero JS/resource errors. Chromium candidate and physical casting checks remain pending. See [tv-layout246.md](tv-layout246.md).
- Curtain: preserve the presented pose across reversal, generation/completion ownership and finished-animation removal; coordinate actual web/native preparation and destination readiness. Shared hidden-native dialogs close immediately without unnecessary style reads or animations. UIKit simulator checks pass normal and system Reduce Motion, including receiver enlargement during opening. The probe reproduced an old-width endpoint failure; the narrow retarget repair preserves the live pose and opens doors beyond the enlarged receiver. See [curtain246.md](curtain246.md). Original reduced-motion return captures were mislabeled and remain diagnostic, not final visual acceptance.
- Diagnostics: the existing ten-second visible TV lobby report now includes numeric stage/sidebar/People/Top bounds and viewport data. Native logging allows those fields; no player names or per-frame bridge messages are added.

## Experiments retained only as diagnostics

Sports HUD work remains an ignored candidate. All production game sources are unchanged. A pending acceptance wrapper that required that ignored candidate was removed. The committed harness/report describe the experiment and missing gates; they do not enable it. See [game-render246.md](game-render246.md).

Alternate phone entrances and popup backdrop fixtures are diagnostic tools only. They are not imported by the application or the default test suite. Historical before-mode trace reproduction may require the separately preserved ignored baseline snapshot.

## Device and release limits

Release 147 is still installed. The user completed the standalone workload; the Rooms ten-second aggregate reached 42.3 fps, p95 gap 73 ms and maximum gap 154 ms. Those aggregates do not measure the worst instantaneous stall or input-to-visible latency. Instruments failed before recording a usable trace. See [device-performance246.md](device-performance246.md).

No round-246 native install, matched after-install comparison or separate-screen cast acceptance was completed before the task changed. Publishing these source changes is not a claim that the user's physical performance report is resolved. Further device validation and progressive blur work remain open.

The final source freeze, browser image review and its limitations are recorded in [visual-review246.md](visual-review246.md). Screenshot files and device logs stay in ignored local output directories; the reports and reproduction tools are versioned.

## Final integration checks

- `PARTY_TEST_CONCURRENCY=4 npm test`: 738 passed, zero failed/skipped, followed by the Party/Tanks/Spy/Millionaire runtime checks, all passing. Log: `.localparty-build/test-main-integration246.log`.
- All 25 added/changed JavaScript and Python files pass syntax checks; `git diff --check` is clean.
- The production curtain class compiles with the iPhoneSimulator 27.0 SDK and passes actual UIKit normal/reduced-motion probes. This is separate from a full application build and physical-device validation.
