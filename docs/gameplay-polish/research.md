# Rendering and game-feel revision

## Evidence and decisions

The previous QA checked visibility and successful asset calls, but did not establish good art direction or smooth frame-to-frame movement. The user's native screenshots expose stepped wheel rotation, thin/pixelated silhouettes, plain sectors, a flat track, and an ungrounded L-shaped crane.

1. **Raster resolution:** fixed 1280×720 worlds were magnified into substantially larger CSS rectangles. Keep logical world coordinates, allocate a backing surface from the rendered size and device pixel ratio, cap raster area, and enable high-quality sampling. Resize only on layout changes. [MDN: devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio), [MDN: optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas).
2. **Motion:** rendering the latest 20–30 Hz snapshot at every animation frame repeats poses. Interpolate timestamped snapshots with a short buffer; interpolate angles on their shortest arc and reset at phase changes. This improves presentation without inventing collisions or speeding authoritative timers. [Glenn Fiedler: Snapshot Interpolation](https://gafferongames.com/post/snapshot_interpolation/).
3. **Feedback:** distinguish anticipation, the actual impact, and a short recovery. Direction and nonlinear decay should communicate the event, rather than blanket constant glow. Keep feedback bounded, avoid hiding other players, and support reduced motion. [GDC: Animation Principles of VFX](https://www.gdcvault.com/play/1025301/Visual-Effects-Bootcamp-Zip-Thwack), [GDC: Game Feel](https://gdcvault.com/play/1022759/Game-Feel-Why-Your-Death).
4. **Art:** preserve readable collision silhouettes and reduce noisy detail at small display sizes. A renderer calling an atlas is not a quality gate. Wheel materials must preserve sector colors; track ornament belongs outside the drivable road; crane needs a structural junction, counterweight and grounded base.

## Three separate review passes

- Native-size screenshots at desktop and phone resolutions: backing density, readable silhouettes, material/lighting coherence, complete background coverage and no floating props.
- Moving scenes: sample displayed positions/angles over consecutive frames, test launch/hit/miss/finish/replay and pause; judge event timing and readability.
- Sustained populated scenes: measure actual render work and network cadence, bounded effects/cache growth, check controls and errors. RequestAnimationFrame frequency alone is not GPU performance evidence.

Implementation and measured results are recorded separately; this research is not a claim that all defects are closed.
