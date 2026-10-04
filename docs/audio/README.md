# Shared audio system — 2026-09-27

`public/audio-system.js` exports `window.HeyPalsAudio`. Include once in each top-level controller/TV shell, never every game iframe. `audio-system.css` styles the optional settings panel. `public/audio` ships eight WAV effects and three AAC/M4A music tracks. All assets are CC0: no purchase, account or attribution obligation.

## Integration

- `configure({surface:'tv'})`: TV owns background music. Phone and host surfaces default to no music. Explicit `musicOwner:true` is only for a host acting as the room's sole speaker. Revoke prior owner first. This avoids normal TV + phones music duplication; there is no cross-device election protocol.
- `unlock()` synchronously invokes AudioContext.resume in a trusted pointer/keyboard gesture. Promise returns success. No downloads/playback before unlock. TV requires a visible enable-audio affordance when no prior gesture exists. `status().unlocked` is available.
- `scene('lobby'|'matchmaking'|'game'|'pause'|'results')`: persistent loop only for first three. Pauses/results stop loops; results plays one jingle on music owner. Repeated scene updates do not repeat the jingle.
- `play('click'|'confirm'|'back'|'error'|'ready'|'countdown'|'hit'|'win')`: semantic feedback. Unknown names fail quietly. Six concurrent effects maximum; identical effects debounced. Network/decode errors never reject into gameplay.
- Trusted button clicks are delegated once. `data-sound="none"` opts continuous game controls out; `data-sound="confirm"` overrides. Avoid also invoking the same effect from the button handler.
- `preferences({muted,musicVolume,sfxVolume})` persists safe 0–1 values. `preferences()` reads a copy.
- `mountSettings(container)` adds labelled mute/music/effect controls plus credit link. Returns unmount callback. Mount once per settings-dialog lifetime. No main game HUD space is consumed.
- Document hidden/pagehide stops music; hidden state suppresses feedback. Return to visible restores the selected loop. No game physics/timer is changed.

## Asset source and licensing

Official pages checked with web lookup 2026-09-27:

- https://kenney.nl/assets/interface-sounds — CC0, commercial use verified at https://kenney.nl/support
- https://kenney.nl/assets/music-jingles — CC0
- https://not-jam.itch.io/not-jam-music-pack — author explicitly releases commercial/non-commercial use under CC0, permission/attribution not required.

Music fetched from the author's embedded public player at `https://html-classic.itch.zone/html/5506295-1006683/media/`: `ChillMenu.ogg`, `BreakbeatChips.ogg`, `SwitchWithMeTheme.ogg`. Converted with macOS afconvert to AAC/M4A 128 kbps. SFX are converted to PCM16 WAV and peak-normalized to approximately −5 dBFS for consistent feedback. A master dynamics compressor bounds mixed playback peaks. Original Kenney license files and author/source record included in `public/audio/licenses/`; public credit page `public/audio/credits.html`. Complete hashes and mapping: `public/audio/manifest.json`.

Music choice is a first coherent licensed set, still subject to the user's listening review. These full tracks loop at track boundaries, not a claim of sample-perfect seamless loops. Web Audio avoids HTML media element volume limitations on iOS. OS silent-mode/AirPlay behavior requires physical device validation.

## Validation

`node --test tests/audio-system.test.cjs`: gesture gate, phone ownership, scene/pause/visibility, mute/persistence, bounds/polyphony/debounce, explicit ownership handoff, binary signatures. Run `PARTY_PLAYWRIGHT=/path/to/playwright node tests/audio-browser.cjs` to decode every shipped WAV/AAC through WebKit's real decoder and refresh `docs/audio/decode-report.json`. A separate live WebKit smoke also passed trusted pointer unlock, lobby/game scene selection and settings mute. No claim of physical speaker listening/device test from these automated checks.

## Production integration

The controller/TV HTML loads the audio engine before app/tv scripts. Controller room settings mount the shared controls; host and phones explicitly never own background music. TV has an Enable audio button and sound settings dialog. Existing render hooks feed lobby/matchmaking/game/pause/results into the engine. `/audio/**` uses a MIME allowlist and both resolved-path and realpath containment checks.

`PARTY_PLAYWRIGHT=/path/to/playwright node tests/audio-integration.cjs` passed against the real ephemeral HeyPals server: binary MIME routes, traversal rejection, initial gesture gate, actual TV button/dialog mute controls, phone settings and silent ownership, and a real player WebSocket pause stopping the TV loop. No iframe proxy added; legacy procedural game sounds remain separate to avoid duplicating effects.
