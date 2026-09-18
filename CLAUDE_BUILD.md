# Current Claude task — TV Show + admin hub polish

Start with **[CLAUDE_TV_SHOW.md](CLAUDE_TV_SHOW.md)**.

This update sits on top of the already working AirPlay/hotfix and Fresh UI. It adds
TV remote commands, QR/podium/loading/transitions, native hub haptics and controller/
profile layout fixes. Unlike the previous Fresh-only update, small native Codable
and protected command-whitelist changes are required. Keep local working scene fixes.

Do not re-run the old blanket dependency upgrade or uninstall the user's app.
Validation and limitations: [docs/TV_SHOW_VALIDATION.md](docs/TV_SHOW_VALIDATION.md).

Historical context only: `CLAUDE_FRESH_LOBBY.md`, `IOS_HOTFIX.md`,
`docs/CLAUDE_BUILD_PRE_HOTFIX.md`. Their instructions are superseded here.
