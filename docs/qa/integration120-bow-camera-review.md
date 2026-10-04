# Integration 120 — Bow Club camera and initial target movement

Product source frozen after the focused review. No graphics, notch, camera permission bridge, scoring rings, roster, or sports Motion implementation changed in this lane.

## Cause and correction

The previous camera policy enumerated physical rear lenses only before `getUserMedia`. Before first capture permission, media device labels and IDs may be empty. It therefore retained an environment-facing default instead of resolving the ordinary rear lens after permission. Safari with an existing permission could take a different path. This is a concrete missing path in source; the user's actual iPhone lens has not been inspected, so calling that device's chosen lens “telephoto” remains unverified.

The policy now enumerates again after permission, selects an unambiguous ordinary rear lens, and stops the bootstrap stream before reopening it. Known ultra-wide, telephoto, compound/front and supported localized compound labels are excluded. A physical ordinary rear lens resets zoom to 1× only when its capabilities explicitly support it. Exact selection failures (`OverconstrainedError`, `NotFoundError`, `NotReadableError`) reopen an environment-facing fallback sequentially; permission denial is not retried. Obsolete requests stop their streams, including cancellation during enumeration and replacement capture. A pre-permission exact device already known to fail is not tried again.

`phone.js` passes its existing request generation to acquisition and sends lens label, zoom, aspect, facing and orientation with existing camera diagnostics. The native `recordBowDiagnostic` whitelist accepts these fields. Device IDs and camera pixels are not added to the native log.

Primary references: [W3C Media Capture device-information exposure](https://www.w3.org/TR/mediacapture-streams/) documents empty device information before successful capture. [WebKit 253186](https://bugs.webkit.org/show_bug.cgi?format=multiple&id=253186) records historical environment-facing virtual/ultra-wide preference and localized label constraints. The historical report is supporting context, not proof that the user's current iOS has that particular issue.

## Pixel and native pipeline audit

Bow Club has no separate native AVCapture preview/pixel pipeline: its trusted controller WKWebView grants video capture and uses the same HTML video as the browser route. Native Bow gyro only seeds visual search and cannot authorize a shot.

Preview and tracker both draw the full video raster into a canvas; detection samples raw video, not a CSS-cropped preview or the combined UI/3D overlay. Capture retains dimensions between equal-size frames and caps the long side at 1280. Centred cover presentation retains the same central aiming ray. Decoder handles every quarter-turn. No additional native rotation/crop code was introduced without evidence of a defect.

## Target motion

Before this change first-arrow difficulty was zero until every participating player had shot. The initial target difficulty is now 0.28, increasing gradually by 0.09 per completed shared turn up to 1. Positions ramp smoothly from authored centres during the first second; scoring and snapshots still use the same authoritative `targetsAt(now)`. The managed server already uses the pause-aware runtime clock, so paused snapshots do not advance motion.

## Evidence

- `node --test tests/bow-camera-lifecycle.test.cjs tests/bow-club.test.js tests/bow-camera.test.js tests/bow-camera-preview.test.cjs tests/bow-hybrid.test.js tests/bow-tracking.test.js`: **29/29 pass**. Includes cold permission selection, max-one-session, 1× zoom, cancellation, sequential fallback, localized compound exclusions, tracking expiry, first-second movement, scoring against displayed moving centres, uneven lighting, and all four raw-frame quarter-turns.
- `tests/browser/bow-native-camera.cjs`: **PASS in real WebKit**, actual unmodified phone HTML/module entrypoint with controlled canvas camera stream and native bridge fixture. Native-like cold permission opened tele bootstrap → wide, browser-like existing permission opened wide once. Maximum active stream count 1; zoom 1; each run accepted 40+ frames, four tags, stable 10, fresh aim enabled shooting, OpenCV active, no page errors, and clean Back termination. Native fixture receives gyro start/stop and camera diagnostic messages.
- `output/playwright/integration120-bow-camera/camera-proof.json` contains both route records and cleanup counters. Native/browser portrait and landscape originals were individually opened and visually inspected. Preview, TV markers and reticle render, and both routes show “Экран найден”. Camera input is synthetic, clearly separated from hardware validation.
- `git diff --check`: clean.

Physical iPhone camera selection, optical distortion, actual light/exposure, TV acquisition and repeated release shots remain hardware checks. The new lens/zoom/frame/orientation diagnostics make the next physical result inspectable; desktop WebKit is not a substitute for that result.
