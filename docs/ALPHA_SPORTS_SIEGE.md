# LocalParty — Sports & Siege alpha.1

Branch: `alpha/sports-siege-swipe`. Base release: `0.6.2`. The released package version and dependency lock are intentionally retained; the experimental build is identified by `build-info.json` and the alpha badge. This is not a new stable release.

## Run

Use a clean working tree, then:

```sh
git fetch origin
git switch --track origin/alpha/sports-siege-swipe
npm ci
npm start
```

For an already checked-out branch use `git switch alpha/sports-siege-swipe` instead. The normal Windows/Mac launchers also work when dependencies/runtime are already installed. Phones join the existing shared lobby through its QR code. All play, assets, fonts and physics remain local. Only installing dependencies or explicitly checking/downloading an update needs internet.

## Four games

**Лёд и нервы / curling**: two teams, 2–16 players, 1/3/5 ends. Equal stone budgets even for uneven teams. Swipe direction, speed, release curve and spin slider determine a server-validated throw. Teammates can hold sweep, spending an energy meter, to reduce drag and curl. Circle collisions, take-outs, boundaries, hog-line removal and closer-than-opponent end scoring run on the server at 120 Hz substeps. The scene is 3D; the ice/contact physics are intentionally planar, not a claim of professional curling simulation.

**Pocket Strike / bowling**: 1–16 players, 3/5/10 frames. Real server-side Rapier rigid bodies, compound pins, rolling ball, gutters and a controlled arcade hook. Swipe input includes position, angle, strength and spin. Strike/spare bonuses, final-frame bonus rolls, survivors for the second ball, turn timers and disconnect skips are explicit rules. A short match uses the usual tenth-frame bonus rules in its last selected frame.

**Не грызи ворота! / swarm_gate**: 1–16 cooperative players on turrets along a central wall. Runner/termite/tank/boss enemies move toward and continuously damage the gate. Shared gate health, heat/overheat, an aimed area pulse with slow and cooldown, repairs between waves, and 4/6/8 waves. Spawn count/cadence scale with the connected team. Late joiners participate immediately. Instanced bodies, eyes and legs avoid a separate draw call per swarm creature.

**Кто тут вылез? / peek_shoot**: 1–16 players, 60/90/120-second shooting gallery. Fifteen covers, three depths, popping/moving funny procedural characters, server-side cover occlusion and first-hit ownership. Normal/gold targets award 10/30; a white-flag friendly costs 15 and breaks the streak. Six consecutive accurate normal-weapon hits charge a manually activated eight-second machine gun. A miss breaks the streak; machine-gun shots cannot recharge themselves. Named announcements and per-player timers show the bonus.

Controllers use separate touchpad/fire zones and a mirrored left-handed layout. Pointer cancellation, blur, orientation changes, pause, lost connections, input throttling and a server deadman release held actions. No motion permissions or HTTPS are needed for swipe throwing. 3D renders only on the shared computer; ordinary phones receive reduced snapshots.

## Integration

`games/sports_siege` is a shared native-WebSocket engine. It reuses `lib/party-runtime`, the proxy/bridge, profile identities, pause clock, ready votes and result recording. `lib/catalog.js` adds the four entries to the existing catalog without rewriting old games. New local SVG card art is provided. The root gateway has explicit updater routes/static files and same-origin checks on game WebSocket upgrades.

The existing packaging script copies `games`, `lib` and `public`, so the catalog extension and games are included; its root catalog still has the original 26 entries. At runtime `lib/catalog.js` exposes 30. Its older archive audit only validates base-game artwork, so use the new alpha catalog test as well. Do not upload a 0.6.2-named archive over the stable release: this branch has not published replacement portable artifacts.

## Updates

The header's download-arrow button opens the existing glass/lime-styled dialog. **Релиз** reads the latest non-prerelease GitHub release; **alpha** resolves the exact commit at `alpha/sports-siege-swipe`. Checking is explicit, not an automatic internet request during play.

The repository is private. On the host, authenticate with `gh auth login`, or set `PARTY_GITHUB_TOKEN` to a token with **Contents: read** for this repository before launching. Do not paste tokens into a phone/controller, source file or commit. The updater never sends its token to clients or redirected download hosts.

Only a localhost host session with the host key can install. Installation requires confirmation and an idle lobby. A game cannot start during installation. A git installation must have no tracked or untracked local changes; it fetches and checks out the pinned revision **detached**, without force-moving the experimental or stable branch. If dependency locks differ, the safe updater refuses and asks for a separate `npm ci` install instead of mutating a live dependency tree.

Portable stable updates select the matching Windows/macOS architecture asset and verify its SHA-256 digest/sidecar. Portable alpha updates extract the pinned source ZIP and retain the installed runtime/dependencies only when their lock graph matches. Archives reject traversal, links, case-colliding names, Windows device/ADS names, encryption, ZIP64 and oversized expansion, and verify every file CRC.

Before replacing application files, a worker and Node executable are copied outside the installation. It waits for the old server to exit, backs up files, applies the candidate, restarts on the same port and checks health. Failed startup restores the previous application files. `data/party.json`, certificates, `.env` and `.git` are excluded from portable replacement; a separate profile snapshot is also saved. Backup/journal/log files are under `~/.localparty-updates/<installation-hash>`. The UI can request the last available rollback while this alpha updater is installed.

**Important:** an old stable release such as 0.6.2 does not contain this updater or the four new games. Switching to it also removes that UI; to return to alpha, switch the git checkout again or use the saved installation. This is explicit in the dialog rather than silently modifying an old release. The portable transaction is not a guarantee against power loss, antivirus locks, disk failure or arbitrary user modifications; keep important local work backed up. No live user's installation has been updated as part of creating this branch.

## Validation and known limits

```sh
node --test tests/sports-siege.test.js tests/alpha-updater.test.js
node --test tests/alpha-physics.test.js tests/alpha-network.test.js tests/alpha-catalog.test.js
npm test
python tests/browser/alpha_smoke.py
```

The first command has 44 pure-rule/security/transaction tests, including real fixture server restart and automatic rollback after an intentionally broken candidate. The second requires installed project dependencies and exercises actual Rapier, actual HTTP/WebSocket child processes and catalog integration. The browser test uses Playwright, the real shared launcher and two phone-sized contexts, performs throws and fire input, saves screenshots, and blocks external game requests. The branch workflow runs these checks and the existing regression suite.

Desktop browser automation is not physical iPhone/Android, Windows or macOS validation. Throw feel, detailed 3D aesthetics, a real 16-phone Wi-Fi load and platform-specific update/rollback behavior still need hands-on alpha playtesting. The engine is an experimental playable implementation, not a claim of production certification. Automated rule tests use a fake bowling world only for turn/scoring state-machine tests; separate Rapier tests explicitly test the real physics.
