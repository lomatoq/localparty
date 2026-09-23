# Provenance

Original game engine, UI, procedural artwork/audio, standalone WebSocket fallback,
and installers in this pack are supplied under the included MIT license.
No commercial Zuma/Pocket Tanks binaries, original assets, levels or weapon data
are included. No code from CircleShootApp or the previously discussed worm-game
repositories was ported into these modules.

The byte transform in tools/ptd-decode.cjs was reimplemented from summivox/ptd,
ptd.c, inspected 2026-09-18. The upstream README declares WTFPL:
https://github.com/summivox/ptd
https://github.com/summivox/ptd/blob/master/ptd.c
Credit: summivox. This decoder does not license input files or prove their semantics.

The managed modules call the existing LocalParty party-runtime and prefer its ws
package. Those repository/dependency files are not redistributed. Preserve their
notices in the installed application. Node, Chromium, Playwright and Python are
external tools, not bundled runtimes. UI uses system fonts; no font files supplied.
