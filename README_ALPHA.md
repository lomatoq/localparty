# LocalParty 0.7.0-alpha.1

Experimental branch: `alpha/party-sports-siege`. Original stable base: commit `19fa47db75d1531ac20e4174eb6db95fad949286`, release 0.6.2. This is source code, not a published portable release. The normal entry point remains `npm start` / `server.js`. The existing launcher, QR entry, profiles, pause, readiness and match reporting are reused.

## Four new games

**Лёд & характер / Curling.** 2–16 players, two alternating teams, three ends. Each team has at least four stones per end; larger rosters get enough throws for every participant. Swipe upwards to throw, bend the tail to curl; position and spin have sliders and an accessible button-based alternative. Teammates hold the sweeping button to reduce drag. Sweeping uses stamina. Disc collisions are simulated on the server. Only the closest team scores, one point for every stone closer than the opponent's nearest counting stone. This is an arcade adaptation, not a full competition curling ruleset.

**После страйка / Bowling.** Real Rapier 3D ball/pin dynamics and Three.js rendering. The host chooses five or ten frames. Standard strike/spare bonuses and final-frame fill balls are calculated from the roll history by one shared parser. Throws use swipe speed, distance, direction and curved-tail spin; a late-lane hook is an intentional arcade assist, not an oil-pattern simulator. Position, spin and a precise button-based throw are available. Preparation is limited to 25 seconds. A disconnected player has eight seconds to return before a zero roll.

**Последние ворота / Gate Siege.** Team defence for 2–16. Every player has a tower-mounted turret. Move your crosshair with a relative trackpad and hold fire with the other thumb. Eight waves scale with the connected roster at each wave boundary; active enemies are capped at 300. Enemies bite one shared central gate. Turrets overheat for two seconds. Each player's repair restores eight gate HP, with a twelve-second cooldown; completing a wave restores twelve HP. Losing the gate loses the match for everyone. Visual enemies use instancing.

**Ну, попались! / Pop Shots.** A two-minute competitive gallery. Targets slide out of fifteen obstacles. The server rejects shots into cover and duplicate hits on a dead target. Five consecutive hits store one machine-gun charge; the player activates it manually for five seconds. A miss resets the streak but does not remove the stored charge. A yellow courier costs three points. The shared screen announces the owner of a charge and displays active bonus time; phones show a tenths-of-a-second countdown.

New players arriving after a match starts wait for the next match. Reconnection keeps the same participant, score, team and bonus. Sustained shooting expires after 450 ms without input. All timers are driven by the existing pause-aware runtime. Test companions use the same controller messages and remain excluded from persistent rankings by the original launcher.

## Host updater

The download-arrow button in the header opens a dialog using the existing glass/lime UI. Stable selects the latest non-prerelease GitHub release for Windows x64 or macOS arm64/x64. Alpha resolves this exact experimental branch to an immutable commit and downloads that commit's source archive. Source Alpha updates reuse existing runtime/dependencies only when production dependency versions match exactly.

The repository is private. On the host computer, set `PARTY_GITHUB_TOKEN` to a fine-grained token restricted to `lomatoq/localparty`, with **Contents: Read-only**. Restart the launcher after setting it. The token is read only by the host's Node process, is never placed into browser code, and is not forwarded to redirected asset hosts. ChatGPT's GitHub connection does not automatically authenticate a separately running computer.

An explicit click on **Обновить и перезапустить** starts installation. Updates are rejected while a game is active. Phones cannot start updates: the endpoint requires loopback access, the host session key, and matching Origin. Release archives must match GitHub's SHA-256 digest. Source archives are pinned to the resolved Git commit and transported over HTTPS. ZIP validation rejects traversal, symlinks, duplicate paths, Windows ADS/reserved names, oversized extraction and bad CRCs.

The updater stages a complete next installation beside the current folder. A helper with a separate copied Node executable waits for the old launcher to stop, copies profiles and user configuration, renames the old installation into a timestamped backup, activates the staged installation and checks loopback health. If activation fails, it restores the old folder. Backups are not automatically deleted. The computer needs write access to the installation's parent and enough disk space for the next installation, dependencies and a backup.

A dirty git checkout is protected: the updater refuses to replace it. A clean git checkout can be updated, but its `.git` metadata remains in the complete backup folder; the new installation is an extracted source/portable installation, not a checkout. To continue development in a repository, use normal git checkout/pull instead of the in-app installer.

Stable 0.6.2 predates this updater. Switching back to it intentionally removes the new games and update UI; the Alpha folder remains in the backup for manual rollback. Linux has the source Alpha path, not a portable Stable asset.

## Tests and limits

`npm test` automatically discovers the new `tests/afterparty.test.js` and `tests/updater.test.js` suites. They exercise bowling scoring, invalid throws, turn nonces, curling collision/scoring/sweeping, roster sizes, disconnect timeout, server-side cover/fire-rate/bonus rules and update archive/authentication safeguards. A real Rapier throw test runs when the repository dependencies are installed. It explicitly skips in dependency-free overlay environments.

`node tests/afterparty-browser.cjs` runs optional Chromium game/phone smoke checks when Playwright is installed. It writes screenshots and a JSON report to `test-results/afterparty/`. Automated Chromium checks do not certify real iPhone/Android Wi-Fi latency, device ergonomics, macOS or Windows update/restart behavior. The real-device updater flow must be exercised on a disposable copy before distributing a portable Alpha release.

No new production packages are introduced. All gameplay assets and libraries load locally; internet is only needed for dependency installation and GitHub updates. Update credentials, profiles and test-generated screenshots must not be included in distributable archives.
