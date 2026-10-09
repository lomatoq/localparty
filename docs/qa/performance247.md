# Performance pass 247

2026-10-09. Baseline: main `87dd64f`, installed as iPhone Release build148. Source changes below are a measured iteration; they do not establish that all iPhone or casting stalls have been resolved.

## Retained changes

- Host Pick's higher-specificity CSS shorthand overrode the shared pause request. The rim now pauses while disabled, unavailable or outside the viewport, and resumes its existing phase. Chromium and WebKit lifecycle checks pass; the active rim is pixel-identical in WebKit, with at most1/255 channel difference in Chromium. Its gradient, mask, geometry and glow are retained.
- Curling avoids fitting a fallback camera that the chosen choreographed shot discards.781 real frames and96 controlled scenarios produce exactly the same camera values. Balanced Chromium measurements reduce this calculation from approximately0.151 to0.088ms/frame; total TV and phone task time remains neutral. WebKit throughput improvement is not established.
- The shared3D Stage prepares initial loaded assets, shaders and an actual scene render before publishing readiness, then awaits an asynchronous GPU fence. Preparation does not update objects/effects or advance the game clock. Curling, Bowling, Swarm Gate and Peek Shoot pass waiting/start/return browser checks. First-playing CPU spikes vary with baseline state arrival; no universal speed ratio is claimed. Dynamic gameplay materials can still compile later.
- The Stage also parks normal rendering while the first state is absent. A held-state production check keeps the game clock, effect updates and normal render count at zero until the state arrives.
- Native sheets retain their existing first-entry preparation, but a rapid close/reopen now leaves the resumed shared-motion clock in control. Each entrance owns its pending release callbacks, so an older hold cannot rewind or revive the new transition. Actual production Chromium/WebKit checks cover rapid reopen and native hiding; cold-popup and every-frame device smoothness are not established.

Detailed evidence and remaining gates: [TV/energy](tv-cast-audit247.md), [camera](game-render247.md), [readiness](curtain247.md), [popup lifecycle](phone-entrance247.md), [independent pixels](visual-review247.md).

## Rejected alternatives

Closed-panel idle preparation did not reliably reduce cold popup delay. The finite-only entrance hold lost visible intermediate motion and was rejected. Constant-radius viewport backdrop alternatives leave sharp background pixels in the tested desktop WebKit backend, including independent headed/headless controls without HeyPals CSS; the existing working blur is retained. This result does not establish behavior on physical iPhone WKWebView. [Blur experiments](popup-performance247.md).

## Physical-device boundary

Release build149 containing the retained changes was built, verified and installed over148 without removing app data. Both resource verifiers and strict code-signature verification pass; the product includes the exact tested runtime files. USB is paired and connected. Instruments fails before recording despite compatible developer-image services; no usable CPU/GPU trace exists for this pass. Continuous phone journal samples are not an action-aligned popup benchmark. A matched standalone/separate-receiver workload remains required. [Device evidence](device-performance247.md).

## Final verification

The complete `npm test` run passes748/748 plus its integration checks after regenerating the prototype-library inventory for the new readiness module. Production Host Pick lifecycle checks and production Curling camera regression pass in Chromium and WebKit. The additional WebKit camera run initially hit the runner's localhost `listen EPERM` restriction, then passed outside that restriction. The four Stage start/return tests and native-sheet interruption tests are recorded in the linked lane reports. Neither the focused browser cases nor the build/resource checks substitute for physical casting acceptance.

Source remains full quality: no resolution, AA, shadow, blur strength, gameplay, frame cadence or approved artwork reductions.
