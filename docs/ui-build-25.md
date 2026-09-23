# Build25: Pocket effects, burial, traffic and Bow stability

## Implemented

- Every explicit BULLET/CRUISER BMP/PNG animation imported from the user-provided original archive:410nodes,1869frames. Previously only30nodes/96frames were included. Source dimensions, offsets and PNG alpha retained; no art inferred for invisible helper nodes.
- Added terrain carries original LOW_COLOR/HIGH_COLOR through simulation, snapshots and rendering. Mud Pie is brown (#472f00–#924700), Rainbow Dirt remains multicolored. Terrain particles use the same authored palette.
- Tank support is sought at/below the current tracks when under terrain rather than snapping to the topmost heightmap. Dirt can bury and visually occlude a tank; buried driving is blocked, firing/clearing remains available. Hollow roofs do not pin a tank or teleport it above the roof. Pedistal's authored jump-before-growth still lifts it deliberately.
- Removed unused player-avatar strings from game snapshots and terrain data from controller snapshots. TV caches unchanged terrain geometry, strata and material palettes together. Three-player synthetic80KB-photo/sandbox fixture:8.208MB/s→0.530MB/s at20Hz TV+10Hz perphone. These numbers are not measured physical AirPlay bandwidth.
- Native ten-second diagnostics include snapshot age/receive gaps/simulation gaps, device thermal state and Low Power Mode. No per-frame bridge traffic.
- Bow no longer forces ultra-wide/minimum zoom; reuses capture canvas and recovers a failed worker with bounded retries. Decorative phone screen-outline removed, crosshair and TV fiducials retained. Shot freshness still320ms; no blind inertial lock.

## Verification

- 963shots/321weapons runtime audit:0failures. Known source-parser warnings/undefined original dud-helper references remain documented, not silently invented.
- All321 actual weapon shots replayed through WebKit effect renderer; authored materials resolved, finite events and completed shots.
- All1869projectile frames decoded in WebKit; all410animated nodes drawn.
- 46Pocket drone/AA/fragment/terrain regressions;7burial/material regressions (including firing from underground);10camera lifecycle/snapshot/diagnostics/art unit tests passed. WebKit also checked brown/green terrain pixels and actual terrain occlusion of the buried chassis.
- Bow15tracking/lifecycle/game tests, offlineWebKit OpenCV/flow and managed browser camera→450ms occlusion→reacquisition→server-accepted shot passed.
- Three-phone real WebSocket soak and WebKit drone controls/drop/timeout regressions passed.
- Release0.11.1(25), iphoneos27.0: Xcode build succeeded, signed product verified, current Bow/terrain/FX/diagnostics files byte-matched to bundled resources. Installed and launched on the connected iPhone.

## Evidence limits and follow-up

Pre-update iPhone diagnostic log was retrieved read-only. Retained Pocket samples (59ten-second windows) show60FPS rAF, which does not establish fresh simulation or final receiver presentation. Knives includes lower frame-rate windows down to35.8FPS; Marble Bloom later remains near60. No retained Bow tracking diagnostics. The exact reported5–6second AirPlay periodic stall is therefore **not established or proven fixed**. New diagnostics distinguish fresh rendering from stalled state and thermal pressure on the next real-device session.

Physical camera lens labels, exposure, blur and phone/TV alignment still need real-device playtesting. Native ARKit world tracking with a calibrated TV anchor is a future architecture, not part of this build. See [Bow research](bow-tracking-research.md) and [performance findings](gameplay-art/pocket-performance-qa.md).

Original behavior cross-check: [BlitWise weapon descriptions](https://classic.blitwise.com/ptanksdepot.html) explicitly distinguish dirt covering tanks, Dome Protect surrounding them, and Pedestal lifting them. Local source definitions provide exact imported palettes and command sequences. This is not a pixel/frame-identical comparison with the original executable.
