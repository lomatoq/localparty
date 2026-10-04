# Screen state audit

Scope: all 36 game routes plus 10 shipped dialogs. Source inventory, automatic checks, captured browser states, independent original inspection and physical-device checks remain separate.

The initial matrix is [matrix.json](matrix.json). Each game has selected, loading, waiting, countdown, playing, reveal, paused, results, return-to-lobby and reload/rejoin cells. Those cells begin pending, so shared waiting coverage cannot become an all-state approval.

Additional explicit cases: Hockey fullscreen cap/rink clearance; native active deck compact/middle/full width; real nonsquare photo upload/decode/roster/Bomb canvas/podium; requested podium upper-stripe removal.

Baseline: root reports 609 automatic tests and targeted live checks passed. An earlier sandbox listen EPERM was followed by a permitted pass and is not recorded as an app defect.

Owners: arcade local games, shared_hud TV/results, social native shell, quiz browser dialogs/photos. Independent audit owns this matrix, QA evidence and review page only. No builds, installs, reset or commits.
