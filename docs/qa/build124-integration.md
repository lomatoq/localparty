# Build 124 — 2026-10-05

0.11.7 (124), signed iPhone Debug build and matching App Clip. Latest Claude lanes marked done; current runtime matches source freeze from build123, including final 3D turret depth and Pocket tank changes. No missing branch patches discovered; all dirty work retained.

- 711 general tests passed, plus party/spy integration checks. Focused Swarm/weather checks and 15 iOS + 5 show product tests passed.
- Xcode build and deep signature verification passed. 5475 staged/package files match; no source drift.
- Installed over existing com.localparty.launcher on physical iPhone 17 Pro; launch succeeded; device app list confirms 0.11.7 (124). Physical game controls were not exercised.
- Fresh normal-clock WebKit capture: output/playwright/build124-review/index.html, 157 screenshots, 36/36 games with TV and phone waiting/playing states, representative shell/native bridge simulation. Zero page/resource errors, zero source drift. Browser screenshots are not physical phone screenshots.
- Reviewed all 36 gameplay TV/phone contact-sheet entries; full originals for updated Swarm Gate, Pocket Siege and Bowling. No claim to review every game outcome.
- Screens ZIP: output/playwright/HeyPals-build124-screens.zip, CRC checked. No Git push or TestFlight publication.
