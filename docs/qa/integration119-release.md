# HeyPals 0.11.7 (119) — UI and shot-camera follow-up

2026-10-04. User requested balanced timer backing/centering throughout shared TV panels, the existing Pocket Siege notch geometry in Bow Club and sports games, a centered Pocket turn announcement and bounded projectile camera, a new build/push, and a single TV/phone screenshot archive.

## Changes

- Shared numeric timer/score capsules now reserve 48 logical pixels of height and balanced ink insets; existing numeric font sizes stay unchanged. Content headers reserve 88 pixels of width, rails/center headers 96. Mind Together uses the same corrected side-card readout. Text states and transparent Jenga/Night Shift exceptions are retained.
- Bow Club, Pocket Strike, Ice and Nerves, Don't Bite the Gate and Peek Shoot use the shared concave-shoulder curved-lip notch silhouette, themed layered material, one identity/facts layout and centered readout backing. Matchmaking visibility, simulation and camera/playfield geometry remain unchanged.
- Pocket Siege keeps the shared clock/facts header free of shooter identity. A centered field cue shows the new shooter briefly and disappears on firing. Cinematic zoom has a 0.76 floor; departing shells no longer drag the field infinitely away. Up to three edge cues show actual flight direction, including returning shells. Existing authoritative shot lifetime/rules are unchanged.

## Verification and delivery

- Full test suite: **679/679 pass**, plus Party/Tanks/Shrink/Spy/Millionaire integration checks. After the final Local Tanks renderer correction, its focused contour/playfield checks pass **9/9**.
- Fresh gallery: **157 PNGs**, all36games × TV/phone × waiting/playing (144) plus13shared/native extras. Every original was individually reviewed; Millionaire and Local Tanks were narrowly refreshed and re-reviewed after their fixes. Archive CRC and every image byte hash pass; final runtime source drift is empty.
- Final Xcode Debug iPhoneOS build **0.11.7(119)** succeeds. Main app and App Clip metadata both report119; both embedded-product validators and strict deep signature validation pass. Source/product proof:2228frozen files,5454matching embedded runtime files, no source drift or runtime mismatch.
- Bow Club timer backing is dark and shorter, fully inside the notch. Millionaire reserves the actual shared header height before the category/difficulty chips. Local Tanks now maps the same painted656×114curved notch into its field rim; authoritative HUD collision protection is unchanged.
- Prior build118 commit b8da93e50a1f76973e314ab98310de0f99136f4d was pushed by the user through GitHub Desktop and verified on remote heypals/ux-polish. The119commit is prepared for the same authorized Desktop push; remote proof is written after delivery.
- The first119candidate installed successfully. Final reinstall **after** the Local Tanks correction failed twice with CoreDevice connection errors although the iPhone is listed connected. The user was asked to unlock/reconnect; final installation is pending device availability. Do not infer that the installed earlier119contains the last contour correction.

Archive: `output/playwright/HeyPals-119-screens-2026-10-04.zip` (78,493,003bytes; SHA256 `883c3b655e8b6eb5606ebc54e148d48bae31425e14f2f05eefced58db53b443b`). Gallery: `output/playwright/integration119-review/index.html`.

Evidence reports: integration119-timers.md, integration119-native-notches.md, integration119-pocket-review.md, integration119-tanks-contour.md, integration119-gallery.md and the four independent gallery reviews. Product proof and source freeze accompany this report.

Browser captures and deterministic projectile fixtures do not establish physical phone Motion feel or TV hardware performance. The archive includes normal-clock waiting/playing and representative shared panels, not every possible game end state or popup. Native Host extras are explicitly browser bridge simulations.153expected stopped-engine WebSocket diagnostics are preserved in the capture history; unexplained page/resource errors are0. No TestFlight upload or production deployment is included.
