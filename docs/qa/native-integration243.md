# Native integration 243 — 2026-10-07

## Root changes

- `native-shell/visibility.js` is injected at document start, before other native scripts, into retained phone WKWebViews and their game frames. Hidden surfaces park visual rAF work and CSS/WAAPI motion; sockets and state timers stay live. Destination surfaces wake before the fonts/double-rAF tab handshake.
- `app-ux-20261005.js` resets telemetry on native hide/resume and includes native visibility in priority-energy scheduling.
- Active-game Host Pick medallion restored in `host-pick-art172.css`: game-colour radial fill and light inset ring, with full artwork above the circle in both expanded and compact modes.
- TV curtain readiness uses explicit iframe completion and shader warmup plus two settled frames/100ms, rather than demanding eight successive <50ms frames. It still prepares scenes behind closed doors.
- First external-scene activation no longer redundantly reloads the TV navigation that `willConnectTo` just began. Subsequent activation/reconnect behaviour remains. Small lifecycle entries mark load/loaded and curtain close/open completion.

## Verified evidence

- `tests/native-visibility243.cjs`: Chrome + WebKit pass frame parking, pending cancellation, live state timers, preserved CSS/WAAPI phase, one-time callback resumption and intentionally paused CSS preservation.
- Final compiled Simulator145 WKWebView actual native route: selecting Games wakes the menu and its frame counter advances. After selecting Controller, hidden menu frame counter is **35 at the held sample and 35 at the later sample**, with **zero running animations on elements with renderable rectangles**; returning to Games advances it to **62**. Two legacy intro timelines reported by WebKit in an earlier lifecycle probe have no client rectangles (`display:none` ancestor) and do not paint.
- `tests/tv-curtain-readiness243.cjs`: Chrome + WebKit at deliberately limited 12.5fps hold closed while shader warmup is pending, commit under closed doors, open 212/219ms after readiness, and return to lobby without a stale curtain. This is a readiness regression test, not a physical AirPlay animation measurement.
- Performance and keyboard/TV lanes have separate reports and galleries. Browser CPU reductions do not establish physical-phone FPS or GPU/encoding improvements.

## Device baseline and limits

Physical iPhone17 Pro still had 0.11.7(144) during the before samples. `device144-cast243.log` confirms an external Curling host at 48.9fps/p95 34ms and a retained hidden menu still executing at 59–60fps; that hidden work is the native lifecycle defect addressed here. A later device menu interval is about 36fps/p95 32–33ms with fair→serious thermal state. These are different workloads/thermal states and cannot support a before/after speed multiplier.

Keyboard viewport browser tests emulate overlay/resized geometry. Actual WK focus was checked, but Simulator UI/software-keyboard input is unavailable on this host; physical keyboard acceptance remains separate. Cast connection reliability, physical curtain smoothness and the receiver-specific Our Tops displacement require the new installed build and a dedicated external-screen session.

## Build 145

`xcodebuild` completed successfully for iPhoneOS27 / connected iPhone17 Pro, marketing version0.11.7, build145. Both iOS/show product verifiers and strict deep code-signature verification passed. Frozen source manifest contains446 files; all435 bundled source files match with zero source drift or stale resources. New visibility/input-viewport assets are present. Proof: `.localparty-build/integration145/product-proof.json`.

Initial installation failed with CoreDevice4016 usage-assertion requirements; read-only device details then report `unavailable`, paired and Developer Mode enabled. The final read-only device inventory still reports this physical iPhone as `unavailable` (`integration145/device-state-final.json`). No uninstall/reset/unpair or device-service termination was attempted. Physical build145 installation/launch and after-cast evidence remain pending device reconnection.

The final Simulator145 was rebuilt and installed from these exact current resources. `simulator-routing.json` confirms all three new modules loaded without source injection: visible24 frames → hidden35 frames → later hidden35 frames, zero running renderable animations → resumed62 frames. Actual own-room disclosure focuses `nearbyRoomName`, removes inert state, and close releases focus. Software keyboard remains absent. Fresh native screens are `output/playwright/native145/index.html`.

## Physical installation follow-up — 244

The initial CoreDevice availability limitation cleared on October 7. Build145 was installed successfully and launched (PID47198). `integration145/install-retry.json`, `launch-retry.json` and `perf244/device/installed145.json` confirm 0.11.7(145). This replaces the pending-install status above.

Initial phone log intervals vary from31.8 to60fps while thermal state is nominal; no contemporary external-TV telemetry is present in this initial capture. They are not a cast after-measurement. A15-second Time Profiler attach was attempted but Instruments could not find the launched process; no valid Instruments trace was produced. Source work244 began after installation, so build145 does not contain the new244 changes.
