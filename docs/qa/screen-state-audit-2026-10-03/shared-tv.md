# Shared TV state audit — 2026-10-03

Implementation scope: `public/tv.js`, `public/tv.html`, `public/tv.css`, `public/tv-show.js`, `public/tv-show.css`, `public/game-art.js`. Earlier dirty changes in those files were preserved. This batch changes visibility/one caption/photo crop/podium top stripe only; materials, positions, gameplay and cancelled decoration remain unchanged.

Confirmed cause: the shared information bar was rendered whenever an active game existed, including waiting; it had no phase gate. The frame likewise remained painted beneath readiness. The gate now runs before src navigation and on worker-only game-ui phase messages, defaults missing phase to waiting, and hides the frame with visibility while preserving its mounted dimensions/handshake. Initial HTML hides both cap and frame before any state arrives. Waiting owns the full receiver.

Photo drawing now uses circular cover only for an explicit uploaded avatar; approved mascot silhouettes still use contain without a clip. Per-plinth top borders retain their width but are transparent; the top reflection pseudo/inset highlight and ranking name underline are removed. No podium dimensions changed. English invite occupancy is localized independently of player names.

## Real browser evidence

Isolated real embedded launcher on ephemeral localhost ports; real two browser-controller profiles/readiness/server workers/admin pause/overlay state. Reused an existing QA TLS cache. No TEST_FAST or fabricated result state. The upload is the root-approved illustrated square fixture (`spectator-01-coral.png`), not a photograph of a person. Fonts/images decoded and at least650ms+two animation frames elapsed before capture. Frozen gallery17807 untouched.

Initial `tv-before` has20 originals: waiting cap leak confirmed in Push, Naval and Sinyak at both TV sizes, while Bow already omitted its common cap. Audio/QR originals show whole panels. Its later standalone-server playing attempt failed because native session-start was unavailable; preserved as a harness coverage gap, not a product failure. Final run uses embedded launcher and completes the real lifecycle.

Final `tv-confirmation/report.json`:34 originals; ok:true, errors:[], changedFiles:[], visibilityViolations:[]. The latter observes cap/frame mutations during waiting, including src changes and sequential stop→launch. Final result records normal-clock Punch Meter, two human controllers, tied score0, testMode:false. Browser/server closed, Slot4 released.

Every original listed below was personally opened.

| Original | Observation |
| --- | --- |
| [lobby-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/lobby-1280.png) | Approved menu materials remain; uploaded illustration appears in the existing circular roster identity. |
| [lobby-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/lobby-1920.png) | Approved menu materials remain; uploaded illustration appears in the existing circular roster identity. |
| [audio-open-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/audio-open-1280.png) | Dialog and focus ring wholly inside frame; heading, both ranges, Mute, credits and Done remain visible. |
| [audio-open-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/audio-open-1920.png) | Dialog and focus ring wholly inside frame; heading, both ranges, Mute, credits and Done remain visible. |
| [audio-closed-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/audio-closed-1280.png) | Backdrop disappears and full catalog returns; no stale overlay or cropped content. |
| [audio-closed-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/audio-closed-1920.png) | Backdrop disappears and full catalog returns; no stale overlay or cropped content. |
| [invite-open-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/invite-open-1280.png) | Whole rounded QR panel, instructions and occupancy fit; occupancy is English “already here”. |
| [invite-open-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/invite-open-1920.png) | Whole rounded QR panel, instructions and occupancy fit; occupancy is English “already here”. |
| [invite-closed-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/invite-closed-1280.png) | QR presentation/backdrop fully close; roster/catalog restored. |
| [invite-closed-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/invite-closed-1920.png) | QR presentation/backdrop fully close; roster/catalog restored. |
| [push-waiting-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/push-waiting-1280.png) | Only real introduction/readiness; no round/time/gameplay cap and no visible child scene. |
| [push-waiting-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/push-waiting-1920.png) | Only real introduction/readiness; no round/time/gameplay cap and no visible child scene. |
| [naval-waiting-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/naval-waiting-1280.png) | Only real introduction/readiness; previous In game/Points/Leader cap absent. |
| [naval-waiting-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/naval-waiting-1920.png) | Only real introduction/readiness; previous In game/Points/Leader cap absent. |
| [sinyakquiz-waiting-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/sinyakquiz-waiting-1280.png) | Only real introduction/readiness; previous Question0/5 cap absent. |
| [sinyakquiz-waiting-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/sinyakquiz-waiting-1920.png) | Only real introduction/readiness; previous Question0/5 cap absent. |
| [bow_club-waiting-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/bow_club-waiting-1280.png) | Game-owned waiting remains clean; no game-owned or shared gameplay information exposed. |
| [bow_club-waiting-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/bow_club-waiting-1920.png) | Game-owned waiting remains clean; no game-owned or shared gameplay information exposed. |
| [push-partial-waiting-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/push-partial-waiting-1280.png) | One human ready, one pending; real1/2 indicator visible and gameplay cap/frame remain hidden. |
| [push-partial-waiting-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/push-partial-waiting-1920.png) | One human ready, one pending; real1/2 indicator visible and gameplay cap/frame remain hidden. |
| [push-playing-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/push-playing-1280.png) | Actual arena and rail/cap reappear with whole title/timer/round/players; readiness overlay gone. |
| [push-playing-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/push-playing-1920.png) | Actual arena and rail/cap reappear with whole title/timer/round/players; readiness overlay gone. |
| [push-paused-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/push-paused-1280.png) | Actual pause backdrop/title/instructions whole; game information retains existing pause presentation. |
| [push-paused-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/push-paused-1920.png) | Actual pause backdrop/title/instructions whole; game information retains existing pause presentation. |
| [push-paused-invite-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/push-paused-invite-1280.png) | Whole invitation layered over paused game without clipped panel; English occupancy retained. |
| [push-paused-invite-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/push-paused-invite-1920.png) | Whole invitation layered over paused game without clipped panel; English occupancy retained. |
| [push-resumed-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/push-resumed-1280.png) | Invitation and pause backdrops disappear; actual live arena/rail return. |
| [push-resumed-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/push-resumed-1920.png) | Invitation and pause backdrops disappear; actual live arena/rail return. |
| [returned-lobby-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/returned-lobby-1280.png) | Stop restores catalog/Host’s Pick and roster; no stale game cap or scene. |
| [returned-lobby-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/returned-lobby-1920.png) | Stop restores catalog/Host’s Pick and roster; no stale game cap or scene. |
| [punch-results-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/punch-results-1280.png) | Normal-clock two-human tied results (testMode:false); uploaded illustrated profile is circular, mascot remains intact; no horizontal name underline or separate top reflection stripe. |
| [punch-results-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/punch-results-1920.png) | Normal-clock two-human tied results (testMode:false); uploaded illustrated profile is circular, mascot remains intact; no horizontal name underline or separate top reflection stripe. |
| [results-returned-lobby-1280.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/results-returned-lobby-1280.png) | Results close and catalog/leaderboard returns; no remaining podium overlay. |
| [results-returned-lobby-1920.png](../../../output/playwright/screen-state-audit-2026-10-03/tv-confirmation/results-returned-lobby-1920.png) | Results close and catalog/leaderboard returns; no remaining podium overlay. |

## Regression and limits

`node --test tests/tv-state-visibility.test.cjs tests/game-art-photo.test.cjs`:4 passing regressions. Phase matrix covers all36 catalog ids, missing/prestate waiting, countdown/playing/reveal, results, return to waiting/lobby, and initial gate ordering. Photo unit uses a rectangular200×100 loaded source: circular40px radius/cover160×80; mascot100×200 remains contained40×80 with no clip. `node tests/art-surface-size.cjs` passes, syntax checks pass. Tests supplement the original-image review.

All36 final real waiting screenshots are coordinated in the arcade owner’s final capture, rather than claimed from this four-game representative browser run. All36 individual completed matches, dense16-player podium scroll, rule/photo dialogs, offline/reconnect, and physical iOS/TV hardware are not covered by this focused lane. Other owners cover their assigned surfaces. No additional visual redesign or build performed.

## Source fingerprint

| File | SHA256 |
| --- | --- |
| `public/tv.js` | `64a2de98033a9faf99ee62841424e3c711d2a37cf59a25848f787df532800d77` |
| `public/tv.css` | `48688906101f5901db32c009534ae0e8a75c0062b825adea0c8a861ee8c95b9f` |
| `public/tv.html` | `fe1c89db188b4eb10338b38e751c5c24b3a6e21ad9fb0f6d8469097d4964f2e4` |
| `public/tv-show.js` | `bb382070399e400c57dcf10073976266e1664c97ac2db222cff726e67a6f6d56` |
| `public/tv-show.css` | `5a106e22297045794ae35a1db9a47348d056e1164788cd0d128f7d670645842a` |
| `public/tv-information.css` | `1fd1e0b9165506e5abd60dfde6db4cfa3a7439d7f76fc2402d29a6aadad45ca6` |
| `public/tv-menu-polish.css` | `22caf75ac2736b983ebc8f0dd0101ffc159beeabd3d32c1cf087d0cd2b8a2a4b` |
| `public/game-art.js` | `bb4287e0651d1828cd8eebc692a92c81a2a5dd53be7624fc183d3a171e9dbb16` |
