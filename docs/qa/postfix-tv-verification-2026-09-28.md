# Scoped final TV verification

Production files: games/arcade/public/app.js and style.css; games/sports_siege/public/style.css; games/quiz/public/screen.css; games/drawguess/public/screen.css; public/game-ui-system.js (only informational selector ss-hud-stats → ss-heading). No engine rules or physics changed.

- Full36 real launch/ready/play/pause/reconnect scenarios completed. Raw report: .localparty-build/individual-current-36/captures/states-report.json. Its only hash difference was Quiz finished-only CSS, explicitly reconciled when publishing216 images. TV waiting transition captures excluded.
- Twelve affected families passed actual320phone/720TV launch and reconnect checks; no browser errors, no reconnected clipped/outside buttons. Output: .localparty-build/postfix-native-sports-arcade/captures. Two hash changes belonged to unrelated Naval/ArcadeDeluxe families and are documented in publication history.
- SinyakQuiz, Warsaw, DrawGuess, SwarmGate, PeekShoot passed measured native card/notch intersection and bottom-bound checks at1920×1080; stable asset hash. Output: .localparty-build/postfix-tv1080/captures.
- Four arcade fields passed720/1080 checks: .localparty-build/arcade-labels-final. Canvas names use14screenpx including object-fit:contain scaling, bounded to bitmap. Nearby players can still cause name-label overlap; no blanket no-overlap claim.
- SnakeLines out-state joystick is visibly dimmed, aria-disabled, input reset on disabled transition, and rejects pointerdown while disabled. Actual320 reconnect screenshot inspected.
- Sports panels use neutral opaque violet surfaces,14px names, enough room for a three-digit score, and an outer rounded HUD effect. The nested statistics group has only an internal separator.
- TV native Quiz/DrawGuess cards begin below the measured notch, with16px spacing; at720p native cards y184..704, notch bottom166. Whole-field canvas centering remains unchanged.

New guards: tv-waiting-guard.cjs waits for the actual transition hidden state; tv-native-layout-guard.cjs measures native cards; capture-state-review.cjs now checks controller clipping and overflow after reload as well as initial playing.

108 revision-bound TV observations are in current-visual-audit-tv.json. No claim that all36 latest notch layouts have been remeasured: the scoped5-game geometry run covers native/sports layouts, while all36 earlier screenshots received visual review. Real Chaos final remains uncaptured as recorded in gallery coverage.

Stable TV waiting follow-up completed:36/36 PASS, .localparty-build/tv-waiting-final36/captures/waiting-report.json; shared asset hashes equal. All36 TV PNG inspected and published with archive tv-waiting-settled-1790549431083. Earlier transition captures superseded, phone waiting images deliberately retained to preserve parent audit revisions.
