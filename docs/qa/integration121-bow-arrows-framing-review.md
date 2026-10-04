# Integration121 — Bow Club arrows, target pace and iPhone camera framing

## Final scope

Bow Club now builds embedded arrows as real shaded 3D assemblies: continuous shaft, metal point/collar, three solid swept feather vanes, binding and nock. The point faces into the target at negative local Z; the rear faces the viewer. A readable oblique shaft avoids an end-on pole. Feather roots intersect the shaft; the shaft reaches the binding and nock. Target parenting, embedded offsets, impacts, authoritative scores and existing flight/wobble remain intact. Approved TV camera, field and UI are unchanged.

Initial angular sweep is faster (0.65 + difficulty × 0.85, previously 0.22 + difficulty × 0.6); initial ramp, amplitude caps, shared turn difficulty, authoritative scoring positions and pause-aware clock are preserved.

Camera presentation is corrected independently from TV graphics. Video and the local preview canvas now use `contain`, so the complete regular-camera raster is shown instead of clipping it to the controller's aspect. The centre aiming ray is unchanged. The first capture requests dimensions appropriate to the controller viewport's orientation; a debounced resize applies orientation dimensions to the existing live track, without another capture or changing lens/zoom. Already matching streams stay untouched and unsupported constraints retain the live preview.

## Actual hardware facts and limits

Parent retrieved 14 physical-iPhone Bow diagnostic rows from 2026-10-04 13:18:40–13:19:09Z. The whitelisted extract is `docs/qa/integration121-bow-device-camera.json`; the raw lifecycle log remains local and is not committed. Those rows show Back Camera, zoom1, environment-facing, aspect1.7778, video/capture1280×720, OpenCV, and up to214 accepted frames. Stable10 occurs while tracking is acquired; the last two rows show stable0 after visible anchors were lost. They do not establish a telephoto lens.

The source's `cover` crop is a confirmed presentation defect when controller and raster aspects differ. It can amplify the close framing impression, but the change has not been physically viewed on the iPhone. The old portrait ideal request was inconsistent with landscape controllers, but hardware was already delivering1280×720; it is not claimed as the proven device cause. No ultra-wide/minimum-zoom request or TV camera change was introduced.

## Verification

- **33 focused tests pass** across arrow geometry, camera lifecycle/framing, preview, authoritative match, idle rendering, tracking and hybrid decoding. Tests validate solid three-vane meshes and finite normals, contact between rear pieces and shaft, embedded point direction, target-parent motion, reduced-motion settled geometry, orientation requests with same track/lens, unsupported constraints, visible first-second target sweep, circular scoring and all four raw camera quarter-turns.
- **Actual managed game:** `scripts/qa/bow-arrow121-real.cjs` joins two native-controller fixtures through the real launcher, launches Bow Club, uses real pointer aim/hold/release ten times, captures five settled arrows mid-match, and reaches actual results. No hit injection. Final source hashes were stable during capture. TV720/1080 and controller402/320 originals opened individually. Baseline captures precede the arrow geometry change.
- **Actual module render:** `tests/browser/bow-arrow-render.cjs` renders the shipped RangeScene/arrow model in real WebKit from rear and oblique views. Both original images opened; three feathers, shaft, nock and embedded tip read under the game's lighting. This is labelled geometry inspection, not gameplay.
- **Camera preview:** `tests/browser/bow-native-camera.cjs` uses the actual phone entrypoint and OpenCV with a controlled1280×720 camera stream containing the real managed-game TV screenshot. Native bridge and browser runs both keep Back Camera1×, maximum one session, four markers, stable10,39/41 accepted frames and active0 after Back. Both landscape originals opened: complete field and four corner markers are visible. This is synthetic camera evidence, not a physical-camera screenshot or full native-shell layout acceptance.
- `git diff --check` clean. No build, install or commit from this lane.

## Evidence and frozen source

Originals: `output/playwright/integration121-bow-arrows/confirm/`, `geometry/`, `camera-preview/`. Baseline: `baseline-stuck/`. Reports include managed-game inputs/results and separate camera/geometry proof JSON.

SHA256:

| Source | Hash |
|---|---|
| public/src/range-arrow.mjs | 2d48a94a0d5b853b0406a19e6ee4594397f9f04ae650879e638a2665d73bf1df |
| public/src/range-scene.mjs | b693339d919ff27ceb7f4efb17a24533deb1739aa51324359720ea4705a0ee13 |
| public/src/camera-policy.mjs | e06ee2bce13ec2a0ebe86a78d63ea74eefa9c8b93c3c29b64e867b8855238c5d |
| public/src/camera-preview.mjs | bbf737d2945074a5477aea45410595b54c0550b8f10bf20248b867ea6b691295 |
| public/phone.js | da922c142fdb7bb46c3de16261058d7035197c11e7f4d2d9640ab33bd0cac7c7 |
| core/match.cjs | e0dec41201538a58ed90ae140d45baba5b39d642219719ea04f76cbf6929fa48 |

Definitive managed recapture is **confirm/**, completed after the rear-shaft contact fix. Its report checks all nine relevant source files, including new arrow geometry, target model and both camera modules, before/after; `ownerChanged=[]`, ten actual releases, results reached. The four definitive mid-match TV/controller originals were individually reopened after this recapture. Root independently reviewed TV, controller, geometry and camera evidence before integration. All six product files listed above are frozen.
