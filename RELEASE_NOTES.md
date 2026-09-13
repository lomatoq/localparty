# LocalParty 0.6.2

One shared screen, phones as controllers, and 26 local multiplayer games.

## Updated in 0.6.2

- Refreshed colors across all 26 game cards and matching in-game backgrounds.
- Larger artwork, softer glass highlights, and more transparent player and bot panels.
- Updated LocalPARTY wordmark casing.
- Freshly rebuilt portable packages for all three supported platforms.
- Verified with 70 automated tests and catalog checks at desktop and mobile widths.

## In this release

- A unified lobby with player profiles, per-game statistics, bots for quick testing, and a Fresh carousel for new games.
- Six arcade additions: Tap Race, Punch Meter, Multiplayer Flappy, Hungry Arena, Snake Lines, and Carry Ball.
- Updated game artwork, generated backgrounds, player color masks, impact effects, and motion feedback across the collection.
- Mobile controls and readiness flows, a compact player-count button, clearer results, and responsive leaderboard/profile dialogs.
- Portable Windows x64, macOS Apple Silicon, and macOS Intel packages with a bundled Node runtime. No separate Node installation is needed for these packages.

## Getting started

Extract the complete package, run `START_WINDOWS.bat` or `START_MAC.command`, and open the host screen. Connect phones to the same local network and use the displayed join address or QR code. Keep the launcher running throughout the session. See [README.md](README.md) for development setup and troubleshooting.

## Compatibility notes

- The interface is primarily Russian. Browser and device differences can affect performance and input behavior.
- Punch Meter motion input needs a secure HTTPS connection and explicit device-motion permission on supported mobile browsers. An ordinary HTTP LAN address does not provide this permission on iPhone Safari. Use the documented secure setup or the available alternative control.
- Portable packages work offline after extraction. Installing dependencies from source requires an initial download or an existing package cache.
- Player data is stored locally on the host. Existing profiles are not bundled in release archives. Certificates, private keys, and generation source drafts are excluded as well.
- Windows browser checks do not replace testing on physical iPhones or macOS hardware; the packaged runtimes and executable permissions are verified separately.

Release identifier: `0.6.2`.
