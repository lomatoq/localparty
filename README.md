# Local Party

> **This branch: 0.7.0-alpha.1 · 30 games.** Four new games and a host-only Stable/Alpha updater. See [Alpha instructions and verification](README_ALPHA.md). The portable release instructions below describe the published stable 0.6.2 packages; an Alpha portable release has not been published by this patch.

**Version 0.6.2** · 26 games · One shared screen, phones as controllers

Local Party turns a computer and a few phones into a local multiplayer arcade. Open the host screen on your computer, join from the same Wi-Fi network, and play together. Most games support 2–16 participants; individual rules explain teams, turns and late joining. The interface and question banks are currently in Russian.

Gameplay runs on your computer. Fonts, artwork and physics libraries are bundled locally, so an internet connection is not needed during ordinary LAN play. Device-specific behavior and game balance continue to be refined.

## Play from a portable release

Download the ZIP matching your computer from [GitHub Releases](https://github.com/lomatoq/localparty/releases), then extract the **entire** archive.

| Computer | Archive | Launcher |
|---|---|---|
| Windows x64 | `LOCAL_PARTY_0.6.2_windows-x64.zip` | `START_WINDOWS.bat` |
| Mac with Apple Silicon | `LOCAL_PARTY_0.6.2_macos-arm64.zip` | `START_MAC.command` |
| Intel Mac | `LOCAL_PARTY_0.6.2_macos-x64.zip` | `START_MAC.command` |

The archives include Node.js and dependencies; no separate installation or package download is required. Keep the launcher window open while playing. These are portable ZIPs, not signed EXE/DMG installers. macOS may ask you to allow an unsigned downloaded launcher in Privacy & Security. Use a current macOS version compatible with the bundled Node runtime (macOS 13.5 or newer).

1. Allow access on **Private networks** if Windows Firewall asks.
2. Connect phones to the same Wi-Fi as the computer.
3. Scan the QR code on the host screen and enter a name.
4. Choose a game on the computer. Players press **Я готов** (“Ready”) on their phones; the game starts when everyone is ready.

Use the computer's LAN address shown beside the QR code. `localhost` on a phone points to the phone itself. The launcher chooses a free port; scan the new QR after restarting. `PARTY_PORT` specifies a preferred port, with a free-port fallback if it is occupied.

## The games

| Game | What you do |
|---|---|
| Push Pit | Bump opponents out of an arena. |
| Last Circle | Keep your footing as the arena shrinks. |
| Color Knives | Time throws into your color on a rotating wheel. |
| Bomb Tag | Pass the bomb by touching another player. |
| One Shot Western | Fire on the real signal; ignore false starts. |
| Local Tanks | Drive and shoot through tank battle arenas. |
| Tank Arsenal | Collect weapons and fight with joystick controls. |
| One Cursor Chaos | Cooperate through 15 shared-cursor challenges. |
| Wi-Fi Kart Party | Race around a shared kart circuit. |
| Monster Around the Circle | Draw parts of a secret shared monster. |
| Spy | Ask questions and discover who does not know the location. |
| Sinyak Millionaire | Take turns climbing a trivia ladder. |
| Sinyak Quiz Company | Answer simultaneously, alone or in teams. |
| Funny Warsaw | Play a Warsaw-themed quiz with 150 sourced questions. |
| Crocodile | Act out a secret word and guess aloud. |
| Quiet, Jenga! | Carefully extract blocks from a physical 3D tower. |
| Night Construction | Move a crane and stack a shared physical tower. |
| Quick Naval Battle | Attack hidden fleets; the host broadcasts shots and results. |
| Draw & Guess | Draw a secret word while others submit guesses. |
| Two at Sunset | Compete in scheduled one-on-one cowboy duels. |
| Tap Race | Tap as fast as you can to run down your lane. |
| Punch Meter | Take three motion-controlled punches and compare scores. |
| Multiplayer Flappy | Fly through pipes alongside the other players. |
| Hungry Arena | Collect food, grow and eat smaller opponents. |
| Snake Lines | Steer in screen coordinates and avoid every trail. |
| Carry Ball | Carry and pass a ball into the opposing team's goal. |

Some games adapt for two players. Spy has a two-player variant; larger groups use roles and voting. Secret words, drawings and ships stay hidden where the rules require it. Late arrivals either enter immediately or wait for the next safe turn/round, depending on the game.

## Controllers, pause and bots

The phone interface supplies the relevant buttons, joystick, drawing canvas or motion permission control. Text selection and image dragging are disabled on controls, while text inputs remain editable. A refresh or short network interruption reconnects the same profile; held controls release when the tab loses focus. Reconnecting does not resurrect an eliminated player or restore a match after the server has stopped.

Any participant can pause and resume. Players can vote to leave; the host can return everyone to the lobby. The **Боты** (“Bots”) plus/minus control in the people panel adds test companions, useful with one phone. Bot/test sessions do not contribute to persistent rankings.

### iPhone motion controls

Punch Meter needs browser access to motion sensors. On Safari, tap the permission button in the controller and approve the system request. Sensor access requires a **secure context**: an ordinary `http://192.168…` LAN address may not expose the API, and permission cannot override that restriction.

The server supports HTTPS with `PARTY_TLS_PFX` pointing to a PFX certificate and optional `PARTY_TLS_PASSWORD`. The certificate must be valid for the address used by the phones and trusted by each device. The portable release does not automatically install certificates. Normal button/joystick games work over local HTTP. Vibration is browser-dependent and should not be relied on in iPhone Safari.

## Saved profiles and scores

Profiles and completed-match statistics are stored in `data/party.json`. Company ranking awards 10 points for participation and another 30 for a win; raw scores from different games are not added together. Player profiles show game-specific records and metrics. Back up this file before moving or replacing a release. An unfinished match lives in its game process and is not restored after the launcher stops.

## Run from source

Install Node.js 20 or newer, then:

```sh
npm ci
npm start
```

Initial dependency installation needs internet access. After installation, ordinary LAN gameplay works offline. Open the host URL printed by the launcher. The gateway exposes one external HTTP/WebSocket port and starts individual game processes on loopback.

Useful environment variables:

| Variable | Purpose |
|---|---|
| `PARTY_PORT` | Preferred public port; falls back when occupied. |
| `PARTY_NO_BROWSER=1` | Do not automatically open a browser. |
| `PARTY_TLS_PFX` | PFX certificate file for HTTPS. |
| `PARTY_TLS_PASSWORD` | Optional PFX password. |
| `PARTY_EPHEMERAL=1` | Isolated, non-persistent test instance. |

## Tests and packaging

```sh
npm test
npm run pack -- --prepare
npm run pack
```

The test command runs the Node test suite plus selected game integration tests. Browser checks live in `tests/*.cjs`; many use Playwright and Microsoft Edge, with a development-machine-specific Playwright path that must be adjusted on another machine. Screenshots and test reports document specific observed scenarios, not universal device certification. Physical iPhone sensor behavior and real Mac launch behavior still require testing on those devices.

Packaging uses the official Node runtime archives and SHA-256 hashes recorded in `runtime-cache/manifest.json`. Put those archives in `runtime-cache/` before building. `--prepare` verifies the cached runtime hashes without creating releases. Use `npm run pack -- --target windows-x64` (or `macos-arm64` / `macos-x64`) for one platform. The builder checks the 26-game catalog, required runtime/assets and executable permissions before replacing each versioned ZIP; SHA-256 sidecars are written alongside it. Python is not required.

## Connection troubleshooting

- Avoid guest Wi-Fi with client isolation: devices must be able to reach each other.
- Allow the launcher through the firewall on your private network.
- If the computer has multiple network adapters, select another LAN address under the QR code.
- Keep the host computer awake and the launcher running.
- If a game process was already open during an update, return to the lobby and relaunch the game.

Third-party license notices are included in `licenses/` and the bundled runtime. Original source archives and rejected/generated working artwork are not included in portable releases.
