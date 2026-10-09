# Curtain246 — TV opening and scene interruption

2026-10-09. Current production base db5e4f4 / installed build147. Physical acceptance is owned by the root device lane.

## Concrete defects

- Native TV opening returned before playing `preparedLobby`. These animations stayed paused at t=0 (cards translated18px/header translated64px); finishing/reset cancelled them and removed their offsets in one visible frame after opening.
- `PartyTVRenderer.showCurtain` acknowledged an existing cover immediately even when it was still opening. A quick next scene could render under an opening cover which subsequently removed itself.
- Native door animation used hard-coded outside/closed starts on reversal. Explicit CA animations did not set their timing function; the transaction curve was only guaranteed for implicit animation.
- Browser close/open completion was based on wall-clock timeouts, including a watchdog which could commit while the state still said closing. A separate3200ms fallback could hide the curtain rather than complete its opening.
- Destination readiness accepted any complete `/games/` document, including the previously loaded game while the new src navigated.

## Changes

- Incoming prepared timelines play as native opening begins, matching the existing web choreography.
- Native cover reverses from actual presentation-layer transforms/opacity, retains completion ownership per generation, acknowledges only a completed close and removes only a completed open. Cancelled commands reply false; a repeated command joins the same motion rather than restarting it. Disconnect cancellation releases pending replies.
- Explicit CA animations receive the existing curve; reduced motion fades the cover without translating doors. Bounds/position updates retain live door transforms on receiver resize.
- The actual UIKit probe reproduced an enlarged-receiver opening endpoint defect: old-width door endpoints left visible geometry when the cover was removed. Opening resize now retargets the new endpoint from the presented pose, keeping the same command's callbacks. Closed/closing behavior is unchanged.
- Web close/open lifecycle follows `Animation.finished` and retains the existing timings. Reclose samples the currently presented door transforms. The watchdog no longer renders or hides through unfinished doors; no backdrop/art/shader/resolution reductions were applied.
- Destination loaded path and query must match the requested game before warmup/settle readiness. The existing12s recovery deadline remains, along with loaded-document + explicit warmup +2frames/100ms preparation.
- At the root/phone-lane request, shared `public/motion.js` now treats UIKit `__partyNativeHidden` like browser-hidden state. Hidden dialog ACKs close immediately before style sampling, cancel pending/reopening work and settle existing close promises. Hidden panel updates also skip pose reads/WAAPI creation; visible popup choreography is unchanged. The phone lifecycle lane owns the focused real-detail launch→hide→ACK validation.

## Verification status

- `node --check` motion/harness, `swiftc -frontend -parse ExternalDisplay.swift`, and `git diff --check` pass.
- Existing shared-motion and Fresh tests pass21/21 after native-hidden close parity. The phone lane's actual Chromium/WebKit detail-launch lifecycle oracle also passes normal and already-pending close ACKs while UIKit-hidden: the dialog is synchronously closed before resume, with zero hidden popup `getComputedStyle` calls and zero candidate hidden WAAPI creations. Evidence: `output/playwright/performance246/phone/lifecycle/`.
- `tests/tv-curtain-readiness243.cjs` passed in Chromium and WebKit with deliberately slow 12.5fps requestAnimationFrame. Reveal followed explicit scene warmup by 212ms and 228ms respectively.
- The first `tests/browser/curtain246.cjs` run exited successfully with22 rows and zero page errors across actual server/TV Curling, Bowling and Push launches/returns, cold menu, interrupted stop/relaunch, held destination request, reduced motion and original-speed keyframes. The separately labeled native bridge fixture checks prepared timelines and stale replies; it cannot prove Core Animation or cast smoothness.
- Original captures/report are preserved under `output/playwright/performance246/curtain/`. Independent visual review confirmed opaque covered seams and prepared destination visibility during opening. It also caught an invalid reduced-return final capture: the helper saw the previous idle state before the socket transition arrived. Some "settled" captures preceded later finite waiting-screen entrance completion. `assessment.json` records these limitations; the raw success result is not treated as proof of those final states.
- The harness now requires the exact expected committed scene and finite animation completion before final screenshots. A fresh confirmation output path would preserve the original diagnostic evidence. The user replaced the task with commit/merge cleanup before the additional run; feature work is frozen. Strict final-frame/reduced-return recapture remains unverified unless the root grants it as merge validation.
- `scripts/prepare-curtain246-native.py` generated a minimal UIKit app containing the production `PartyTVCurtain` class verbatim, with source hashes in `.localparty-build/curtain246/native-harness/source-proof.json`. It compiled with iPhoneSimulator27.0 SDK (`swiftc -O -target arm64-apple-ios18.0-simulator -parse-as-library`) and ran on the actual UIKit iPhone17 simulator.
- Native runtime proof: normal motion and system Reduce Motion both pass repeated close/open, actual covered pose before successful close callback, presentation continuity on reversal, interrupted-open false ownership, 20% enlarged opening endpoint/pose continuity, completed-open removal and disconnect cancellation. Normal resize keeps exact presentation translation (`±128.9401px` in retained rerun); enlarged width482.4 completes at `±279.792px`, fully outside. Reduced Motion reports UIKit flag=true, preserves sampled opacity on reversal and records zero door translation. Proofs: `output/playwright/performance246/curtain-native/{normal-passed,reduced-passed,source-proof}.json`. The earlier failed resize proof is retained as `before-resize-failed.json`.
- This native probe validates the exact curtain class, not full-app WKWebView bridge/device/cast performance. The whole app SDK build and physical concurrent TV acceptance remain root responsibilities. Temporary simulator Reduce Motion was restored to false, probe stopped, simulator returned to its initial Shutdown state. No phone install or full app build was run in this lane.
- A discovery lamp remains visible at the left edge of the original Chromium Curling preparing capture. Root/TV layout lane was notified; no layout change is made in this lane.
- No changes to phone startup cover, native tab navigation, mobile shaders, TV layout/Our Top, or gameplay rules in this lane.

## Final merge scope

Production: `ios/LocalParty/ExternalDisplay.swift`, `public/tv-motion-20261005.js`, `public/motion.js`.
Tracked validation/report: `scripts/prepare-curtain246-native.py`, `tests/browser/curtain246.cjs`, this report. Native/runtime outputs are local QA evidence. Source is frozen after the reproduced resize repair; no additional offscreen-animation experiment was added.
