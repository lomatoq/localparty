# Bow tracking: findings and next implementation

## Fixed in build 38

- Portrait RGBA frames (720 × 1280) were rejected by a landscape-only 1080-pixel height limit. Both orientations now fit a bounded pixel budget.
- Capture is bounded to 1280 pixels on its longer edge.
- Valid detection quality no longer decays below the shot threshold merely between frames. The 320 ms freshness limit remains.
- Two decoded tags may maintain an acquired plane when its projected corners stay within 0.12 normalized image units of the previous plane. Initial acquisition still requires three tags; blank frames never refresh the lock.
- Synthetic portrait video through the real worker and controller successfully produced a server-accepted shot. A full browser run under concurrent build load timed out during the shot; the isolated Bow run passed. This is not physical-device validation.

## Implemented in build 39

- Bundled OpenCV.js 5.0.0 (Apache-2.0), including WASM, runs offline in a dedicated worker.
- ArUco adaptive thresholding, subpixel corner refinement and two-separated-marker acquisition.
- Bidirectional pyramidal Lucas–Kanade optical flow on static marker features; forward/backward error rejection and RANSAC homography fitting.
- Flow can bridge missed decoded markers for at most 1.4 seconds, with continued visual measurements. A blank image never holds a false lock.
- Native CoreMotion gyroscope samples seed the optical-flow search. Approximate focal length is used only for search initialization; correspondence validation still determines the aim. Browser motion samples are also supported when permission is available. This is not native ARKit world tracking.
- A held draw survives a temporary tracking loss. Releasing still requires a fresh valid aim; missing tracking does not spend an arrow.
- Fixed UTF-8 streaming corruption in the game proxy which broke embedded WASM binary data in large JavaScript files.

## Verification

174 project tests passed. Browser test requires the OpenCV engine (not fallback), loses the image for 450 ms while holding, restores tracking and gets a server-accepted shot. WebKit worker test acquired the board and followed translated frames with optical flow (54 ms initial detection, 28/20 ms subsequent flow frames on the development Mac). These timings are not iPhone benchmarks. Tests cover partial occlusion, outlier points, blank frames, bounded tracking expiry and inertial initialization.

Native build compiled successfully. Physical phone/TV lighting, lens distortion and real gyro alignment still require device playtesting.

## Camera lifecycle stability follow-up

- Removed forced ultra-wide selection and forced minimum zoom. The planar homography has no calibrated lens-distortion correction; the ordinary rear lens is preferred only when its device label is unambiguous. When labels are unavailable, the already permitted rear camera remains selected.
- Reuse the capture canvas backing store while its dimensions are unchanged, avoiding two canvas reallocations/resets per captured frame.
- Replace the permanent 1.2-second processing-timeout downgrade with bounded worker recovery: 20 seconds for initialization, 8 seconds for the first frame, 4 seconds for later frames, at most two restarts per camera session. These are watchdog budgets, not accepted tracking ages or measured iPhone timings. Old worker replies cannot revive a replaced camera session.
- Fresh visual measurements remain mandatory: results older than 320 ms are rejected; restarting clears the previous lock and aim filter. No inertial-only shooting or unbounded prediction was added.
- Removed the decorative detected-screen polygon from the phone camera overlay. The reticle and TV fiducials remain.

Verification: 15 camera/lifecycle/hybrid/tracking/game tests pass, including canvas reuse, primary-lens selection, bounded worker recovery, stale reply rejection, occlusion, RANSAC and inertial seed checks. WebKit offline OpenCV worker acquisition/flow passes on synthetic portrait images (50/28/19 ms in this development-Mac run). Physical iPhone lens labels, thermal load, exposure, focus and gyro alignment still require phone/TV playtesting. These fixes do not establish ARKit-equivalent tracking.

Managed Chrome end-to-end regression also passes: explicit camera start, synthetic portrait board, OpenCV engine, held draw across 450 ms occlusion, reacquisition and server-accepted shot, subsequent touch-mode shot, 320/393-pixel layouts and pause/resume. The phone screenshot confirms no detected-screen outline; TV markers and reticle remain. The supplied pre-update iPhone log contained no Bow tracking entries, so it does not identify the user's physical-device failure cause.

## Further architecture

ARKit world tracking would require replacing the current WKWebView camera with a native capture/rendering bridge and registering the physical TV plane/scale. It is not integrated in build 39. It does not serve Safari guests. AprilTag is another detector option, but replacing the board dictionary is not needed to use the new OpenCV pipeline.

September20 follow-up: Apple distinguishes image-only tracking (the reference must remain visually trackable) from world tracking with image detection (a detected image can anchor content in world space after it leaves view). For a stationary TV the latter is the relevant future native approach: acquire a known calibration board, register the TV plane in the AR session, intersect the camera's centre ray with that plane, and map the intersection to game coordinates. Hide calibration only after a valid world anchor; recover explicitly when tracking is limited, the session resets, or the TV moves. Screen scale/calibration and correspondence between the native camera and displayed reticle must be resolved, not guessed. This architecture is a research recommendation, **not implemented** by the camera-lifecycle fixes. Safari guests still need persistent visual references; removing everyone's TV markers would break their current tracking. A purely inertial remembered rectangle is not a reliable substitute for measured world tracking.

No approach guarantees tracking under full occlusion, severe blur or insufficient visual detail. Prediction must remain bounded.

## Primary sources

- https://docs.opencv.org/4.x/d5/dae/tutorial_aruco_detection.html
- https://docs.opencv.org/4.x/d4/dee/tutorial_optical_flow.html
- https://github.com/TechStark/opencv-js
- https://github.com/AprilRobotics/apriltag
- https://developer.apple.com/documentation/arkit/understanding-world-tracking
- https://developer.apple.com/documentation/arkit/arimagetrackingconfiguration
- https://developer.apple.com/documentation/arkit/tracking-and-altering-images
